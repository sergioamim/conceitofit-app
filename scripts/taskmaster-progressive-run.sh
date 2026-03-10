#!/usr/bin/env bash

set -euo pipefail

PROJECT_ROOT="$(pwd)"
TAG="master"
MAX_TASKS=999999
MODEL=""
CONTINUE_ON_BLOCKED=1
USE_DANGEROUS_MODE=0
GIT_BRANCH=""
GIT_REMOTE="origin"
AUTO_PUSH=1

usage() {
  cat <<'EOF'
Usage: scripts/taskmaster-progressive-run.sh [options]

Progressively executes Task Master tasks using Codex in non-interactive mode.

Options:
  --project <path>           Project root. Default: current directory
  --tag <name>               Task Master tag. Default: master
  --branch <name>            Git branch used by the automation
                             Default: current main/main-* branch or main/taskmaster-auto
  --remote <name>            Git remote used for push. Default: origin
  --max-tasks <n>            Maximum number of top-level tasks/subtasks to execute
  --model <name>             Codex model override
  --stop-on-blocked          Stop the run when a task is blocked
  --dangerous                Run Codex without sandbox/approval prompts
  --no-push                  Commit locally without pushing, or skip push if no remote exists
  -h, --help                 Show this help

Behavior:
  - picks the next ready Task Master task in the current tag
  - marks it as in-progress
  - runs Codex against the task details
  - marks task and subtasks as done when Codex reports completion
  - marks task as blocked when Codex reports a real blocker
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --project)
      PROJECT_ROOT="$2"
      shift 2
      ;;
    --tag)
      TAG="$2"
      shift 2
      ;;
    --branch)
      GIT_BRANCH="$2"
      shift 2
      ;;
    --remote)
      GIT_REMOTE="$2"
      shift 2
      ;;
    --max-tasks)
      MAX_TASKS="$2"
      shift 2
      ;;
    --model)
      MODEL="$2"
      shift 2
      ;;
    --stop-on-blocked)
      CONTINUE_ON_BLOCKED=0
      shift
      ;;
    --dangerous)
      USE_DANGEROUS_MODE=1
      shift
      ;;
    --no-push)
      AUTO_PUSH=0
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage
      exit 1
      ;;
  esac
done

PROJECT_ROOT="$(cd "$PROJECT_ROOT" && pwd)"

if ! command -v task-master >/dev/null 2>&1; then
  echo "task-master not found in PATH" >&2
  exit 1
fi

if ! command -v codex >/dev/null 2>&1; then
  echo "codex not found in PATH" >&2
  exit 1
fi

if ! command -v git >/dev/null 2>&1; then
  echo "git not found in PATH" >&2
  exit 1
fi

json_get() {
  local file="$1"
  local expr="$2"
  node - "$file" "$expr" <<'EOF'
const fs = require('fs');
const file = process.argv[2];
const expr = process.argv[3];
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
const value = expr.split('.').reduce((acc, key) => {
  if (acc == null) return undefined;
  return acc[key];
}, data);
if (value === undefined || value === null) {
  process.exit(1);
}
if (typeof value === 'object') {
  process.stdout.write(JSON.stringify(value));
} else {
  process.stdout.write(String(value));
}
EOF
}

write_schema() {
  local schema_file="$1"
  cat >"$schema_file" <<'EOF'
{
  "type": "object",
  "properties": {
    "completed": { "type": "boolean" },
    "blocked": { "type": "boolean" },
    "summary": { "type": "string" },
    "verification": {
      "type": "array",
      "items": { "type": "string" }
    },
    "notes": { "type": "string" }
  },
  "required": ["completed", "blocked", "summary", "verification", "notes"],
  "additionalProperties": false
}
EOF
}

write_prompt() {
  local prompt_file="$1"
  local task_id="$2"
  local task_json_file="$3"
  cat >"$prompt_file" <<EOF
Execute the current Task Master task in this repository.

Task ID: ${task_id}
Task details JSON: ${task_json_file}

Rules:
- Work only on this top-level task and its subtasks.
- Read the task JSON file first and use it as the source of truth.
- Make real repository changes, run relevant verification, and keep scope tight.
- Do not edit Task Master status files manually. The outer runner handles status transitions.
- If you can fully complete the task, set "completed" to true and "blocked" to false.
- If you are blocked by a real dependency, missing credential, missing external access, or ambiguous product decision that cannot be inferred safely, set "completed" to false and "blocked" to true.
- If you made progress but did not fully finish, set "completed" to false and "blocked" to false.
- "summary" must be concise.
- "verification" must list the checks you actually ran.
- "notes" should contain blockers, residual risks, or "none".
EOF
}

ensure_git_repo() {
  if ! git -C "$PROJECT_ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    echo "Project root is not a git repository: $PROJECT_ROOT" >&2
    exit 1
  fi
}

git_has_changes() {
  [[ -n "$(git -C "$PROJECT_ROOT" status --short --untracked-files=all)" ]]
}

has_git_remote() {
  git -C "$PROJECT_ROOT" remote get-url "$GIT_REMOTE" >/dev/null 2>&1
}

detect_default_branch() {
  local current_branch
  current_branch="$(git -C "$PROJECT_ROOT" branch --show-current 2>/dev/null || true)"
  if [[ -n "$current_branch" && ( "$current_branch" == "main" || "$current_branch" == main/* ) ]]; then
    printf '%s\n' "$current_branch"
    return
  fi
  printf '%s\n' "main/taskmaster-auto"
}

ensure_clean_git_worktree() {
  if git_has_changes; then
    echo "Git working tree must be clean before starting the automation." >&2
    echo "Commit or stash pending changes in $PROJECT_ROOT and run again." >&2
    exit 1
  fi
}

ensure_git_branch() {
  if [[ -z "$GIT_BRANCH" ]]; then
    GIT_BRANCH="$(detect_default_branch)"
  fi

  if git -C "$PROJECT_ROOT" show-ref --verify --quiet "refs/heads/$GIT_BRANCH"; then
    git -C "$PROJECT_ROOT" switch "$GIT_BRANCH" >/dev/null
    return
  fi

  if has_git_remote && git -C "$PROJECT_ROOT" show-ref --verify --quiet "refs/remotes/$GIT_REMOTE/$GIT_BRANCH"; then
    git -C "$PROJECT_ROOT" switch --track -c "$GIT_BRANCH" "$GIT_REMOTE/$GIT_BRANCH" >/dev/null
    return
  fi

  git -C "$PROJECT_ROOT" switch -c "$GIT_BRANCH" >/dev/null
}

push_git_branch() {
  if [[ "$AUTO_PUSH" != "1" ]]; then
    echo "Skipping push because --no-push was used."
    return
  fi

  if ! has_git_remote; then
    echo "Skipping push because remote '$GIT_REMOTE' is not configured in $PROJECT_ROOT."
    return
  fi

  if git -C "$PROJECT_ROOT" rev-parse --abbrev-ref --symbolic-full-name '@{u}' >/dev/null 2>&1; then
    git -C "$PROJECT_ROOT" push "$GIT_REMOTE" "$GIT_BRANCH" >/dev/null
  else
    git -C "$PROJECT_ROOT" push --set-upstream "$GIT_REMOTE" "$GIT_BRANCH" >/dev/null
  fi
}

write_commit_message() {
  local commit_file="$1"
  local action_label="$2"
  local task_id="$3"
  local summary="$4"
  local result_file="$5"
  local notes="$6"

  node - "$commit_file" "$action_label" "$task_id" "$summary" "$result_file" "$notes" "$TAG" "$GIT_BRANCH" <<'EOF'
const fs = require('fs');

const [
  commitFile,
  actionLabel,
  taskId,
  rawSummary,
  resultFile,
  rawNotes,
  tag,
  branch,
] = process.argv.slice(2);

const clean = (value, fallback) => {
  const normalized = String(value || '').replace(/\s+/g, ' ').trim();
  return normalized || fallback;
};

const result = JSON.parse(fs.readFileSync(resultFile, 'utf8'));
const verification = Array.isArray(result.verification) ? result.verification : [];
const summary = clean(rawSummary, 'sem resumo informado');
const notes = clean(rawNotes, 'nenhuma observacao adicional');

const lines = [
  `Automacao Task Master: ${actionLabel} task ${taskId}`,
  '',
  'Resumo das tarefas realizadas:',
  `- ${summary}`,
  `- Tag Task Master: ${tag}`,
  `- Branch Git: ${branch}`,
  '',
  'Validacoes executadas:',
  ...(verification.length
    ? verification.map((item) => `- ${clean(item, 'validacao nao informada')}`)
    : ['- nenhuma validacao informada']),
  '',
  'Observacoes:',
  `- ${notes}`,
];

fs.writeFileSync(commitFile, lines.join('\n'));
EOF
}

write_state_change_commit_message() {
  local commit_file="$1"
  local action_label="$2"
  local task_id="$3"
  local summary="$4"
  local notes="$5"

  cat >"$commit_file" <<EOF
Automacao Task Master: ${action_label} task ${task_id}

Resumo das tarefas realizadas:
- ${summary}
- Tag Task Master: ${TAG}
- Branch Git: ${GIT_BRANCH}

Validacoes executadas:
- nenhuma validacao informada

Observacoes:
- ${notes}
EOF
}

commit_and_push_staged_changes() {
  local task_id="$1"
  local commit_file="$2"
  local commit_hash

  if ! git_has_changes; then
    echo "Task #$task_id reported completion, but no repository changes were detected." >&2
    return 1
  fi

  git -C "$PROJECT_ROOT" add -A

  if git -C "$PROJECT_ROOT" diff --cached --quiet --ignore-submodules --; then
    echo "Task #$task_id has no staged changes to commit." >&2
    return 1
  fi

  git -C "$PROJECT_ROOT" commit -F "$commit_file" >/dev/null
  commit_hash="$(git -C "$PROJECT_ROOT" rev-parse --short HEAD)"
  push_git_branch
  echo "Committed task #$task_id on $GIT_BRANCH ($commit_hash)."
}

commit_and_push_task() {
  local action_label="$1"
  local task_id="$2"
  local summary="$3"
  local result_file="$4"
  local notes="$5"
  local tmp_dir="$6"

  local commit_file="$tmp_dir/commit-message.txt"

  write_commit_message "$commit_file" "$action_label" "$task_id" "$summary" "$result_file" "$notes"
  commit_and_push_staged_changes "$task_id" "$commit_file"
}

commit_and_push_state_change() {
  local action_label="$1"
  local task_id="$2"
  local summary="$3"
  local notes="$4"
  local tmp_dir="$5"

  local commit_file="$tmp_dir/commit-message.txt"

  write_state_change_commit_message "$commit_file" "$action_label" "$task_id" "$summary" "$notes"
  commit_and_push_staged_changes "$task_id" "$commit_file"
}

set_task_status() {
  local ids="$1"
  local status="$2"
  task-master set-status "$ids" "$status" --project "$PROJECT_ROOT" --silent >/dev/null
}

build_codex_args() {
  local args
  args=(exec --cd "$PROJECT_ROOT")
  if [[ -n "$MODEL" ]]; then
    args+=(--model "$MODEL")
  fi
  if [[ "$USE_DANGEROUS_MODE" == "1" ]]; then
    args+=(--dangerously-bypass-approvals-and-sandbox)
  else
    args+=(--full-auto)
  fi
  printf '%s\0' "${args[@]}"
}

ensure_git_repo
ensure_clean_git_worktree
ensure_git_branch

echo "Using Git branch '$GIT_BRANCH' and Task Master tag '$TAG'."

run_count=0

while (( run_count < MAX_TASKS )); do
  tmp_dir="$(mktemp -d)"
  next_json_file="$tmp_dir/next.json"
  task_json_file="$tmp_dir/task.json"
  schema_file="$tmp_dir/schema.json"
  prompt_file="$tmp_dir/prompt.txt"
  result_file="$tmp_dir/result.json"

  if ! task-master next --format json --project "$PROJECT_ROOT" --tag "$TAG" >"$next_json_file"; then
    rm -rf "$tmp_dir"
    echo "Failed to query next task" >&2
    exit 1
  fi

  if ! task_id="$(json_get "$next_json_file" "task.id" 2>/dev/null)"; then
    rm -rf "$tmp_dir"
    echo "No more ready tasks in tag '$TAG'."
    exit 0
  fi

  task-master show "$task_id" --format json --project "$PROJECT_ROOT" >"$task_json_file"

  if [[ "$task_id" != *.* ]]; then
    if subtask_count="$(node - "$task_json_file" <<'EOF'
const fs = require('fs');
const file = process.argv[2];
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
const subtasks = (data.task && data.task.subtasks) || [];
process.stdout.write(String(subtasks.length));
EOF
)"; then
      if [[ "$subtask_count" != "0" ]]; then
        echo "==> Activating epic #$task_id to unlock subtasks"
        set_task_status "$task_id" "in-progress"
        if ! commit_and_push_state_change "ativou" "$task_id" "Task movida para in-progress para liberar subtarefas." "nenhuma observacao adicional" "$tmp_dir"; then
          echo "Task #$task_id was activated, but commit/push could not be completed." >&2
          rm -rf "$tmp_dir"
          exit 4
        fi
        rm -rf "$tmp_dir"
        continue
      fi
    fi
  fi

  echo "==> Starting task #$task_id"
  set_task_status "$task_id" "in-progress"

  write_schema "$schema_file"
  write_prompt "$prompt_file" "$task_id" "$task_json_file"

  codex_args=()
  while IFS= read -r -d '' codex_arg; do
    codex_args+=("$codex_arg")
  done < <(build_codex_args)

  if ! codex "${codex_args[@]}" --output-schema "$schema_file" -o "$result_file" - <"$prompt_file"; then
    echo "Codex failed while executing task #$task_id"
    set_task_status "$task_id" "blocked"
    if ! commit_and_push_state_change "bloqueou" "$task_id" "Codex falhou durante a execucao automatica da task." "verificar logs do runner e do codex" "$tmp_dir"; then
      echo "Task #$task_id was marked as blocked, but commit/push could not be completed." >&2
    fi
    rm -rf "$tmp_dir"
    exit 1
  fi

  completed="$(json_get "$result_file" "completed" || echo "false")"
  blocked="$(json_get "$result_file" "blocked" || echo "false")"
  summary="$(json_get "$result_file" "summary" || echo "")"
  notes="$(json_get "$result_file" "notes" || echo "")"

  echo "Summary: $summary"
  [[ -n "$notes" ]] && echo "Notes: $notes"

  if [[ "$completed" == "true" ]]; then
    if [[ "$task_id" == *.* ]]; then
      set_task_status "$task_id" "done"
      parent_id="${task_id%%.*}"
      parent_json_file="$tmp_dir/parent.json"
      task-master show "$parent_id" --format json --project "$PROJECT_ROOT" >"$parent_json_file"
      if node - "$parent_json_file" <<'EOF'
const fs = require('fs');
const file = process.argv[2];
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
const subtasks = (data.task && data.task.subtasks) || [];
const allDone = subtasks.length > 0 && subtasks.every((subtask) => subtask.status === 'done');
process.exit(allDone ? 0 : 1);
EOF
      then
        set_task_status "$parent_id" "done"
        echo "Subtask #$task_id marked as done and parent task #$parent_id completed."
      else
        echo "Subtask #$task_id marked as done."
      fi
    else
      if subtask_ids="$(node - "$task_json_file" <<'EOF'
const fs = require('fs');
const file = process.argv[2];
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
const task = data.task || {};
const taskId = task.id;
const ids = (task.subtasks || []).map((subtask) => `${taskId}.${subtask.id}`);
process.stdout.write(ids.join(','));
EOF
)"; then
        if [[ -n "$subtask_ids" ]]; then
          set_task_status "$subtask_ids" "done"
        fi
      fi
      set_task_status "$task_id" "done"
      echo "Task #$task_id marked as done."
    fi

    if ! commit_and_push_task "concluiu" "$task_id" "$summary" "$result_file" "$notes" "$tmp_dir"; then
      echo "Task #$task_id reached done state, but commit/push could not be completed." >&2
      rm -rf "$tmp_dir"
      exit 4
    fi
  elif [[ "$blocked" == "true" ]]; then
    set_task_status "$task_id" "blocked"
    echo "Task #$task_id marked as blocked."
    if ! commit_and_push_task "bloqueou" "$task_id" "$summary" "$result_file" "$notes" "$tmp_dir"; then
      echo "Task #$task_id was marked as blocked, but commit/push could not be completed." >&2
      rm -rf "$tmp_dir"
      exit 4
    fi
    if [[ "$CONTINUE_ON_BLOCKED" != "1" ]]; then
      rm -rf "$tmp_dir"
      exit 2
    fi
  else
    set_task_status "$task_id" "review"
    echo "Task #$task_id marked as review because it was not fully completed."
    if ! commit_and_push_task "deixou em review" "$task_id" "$summary" "$result_file" "$notes" "$tmp_dir"; then
      echo "Task #$task_id was marked as review, but commit/push could not be completed." >&2
      rm -rf "$tmp_dir"
      exit 4
    fi
    rm -rf "$tmp_dir"
    exit 3
  fi

  rm -rf "$tmp_dir"
  run_count=$((run_count + 1))
done

echo "Reached max task limit: $MAX_TASKS"
