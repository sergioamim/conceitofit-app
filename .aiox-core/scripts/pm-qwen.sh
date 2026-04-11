#!/bin/bash
# ============================================
# AIOX PM Orchestration Script for Qwen Code (pm-qwen.sh)
#
# Spawns Qwen Code agents with AIOX context to execute tasks
# without context pollution when orchestrating multiple agents.
#
# Usage: pm-qwen.sh <agent> <task> [params] [--context <path>] [--output <path>]
#
# Arguments:
#   agent       - Agent ID (e.g., dev, architect, qa, pm)
#   task        - Task to execute (e.g., develop, review, create-story)
#   params      - Additional parameters for the agent (optional)
#   --context   - Path to context file (JSON with story, files, instructions)
#   --output    - Custom output file path (default: /tmp/aiox-qwen-output-{timestamp}.md)
#
# Environment Variables:
#   AIOX_OUTPUT_DIR   - Directory for output files (default: /tmp)
#   AIOX_DEBUG        - Enable debug logging (default: false)
#   AIOX_TIMEOUT      - Timeout in seconds (default: 300)
#   AIOX_INLINE_MODE  - Run without spawning terminal (default: true for Qwen)
#
# Exit Codes:
#   0 - Success
#   1 - Invalid arguments
#   2 - Context generation failed
#   3 - Agent file not found
#
# Author: Qwen Code adapted from pm.sh (Story 11.2)
# ============================================

set -euo pipefail

# Version
readonly VERSION="1.0.0-qwen"
readonly SCRIPT_NAME="$(basename "$0")"

# Configuration - Qwen doesn't spawn terminals like Claude
OUTPUT_DIR="${AIOX_OUTPUT_DIR:-/tmp}"
DEBUG="${AIOX_DEBUG:-false}"
TIMEOUT="${AIOX_TIMEOUT:-300}"
INLINE_MODE="${AIOX_INLINE_MODE:-true}"  # Qwen operates inline by default

# Arguments
AGENT=""
TASK=""
PARAMS=""
CONTEXT_FILE=""
CUSTOM_OUTPUT=""

# Generated paths
OUTPUT_FILE=""
TASK_CONTEXT_FILE=""
AGENT_FILE=""

# Project root (where this script lives)
PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
AIOX_CORE_DIR="${PROJECT_ROOT}/.aiox-core"

# ============================================
# Logging Functions
# ============================================

log_debug() {
  [[ "$DEBUG" == "true" ]] && echo "[DEBUG] $*" >&2 || true
}

log_info() {
  echo "[INFO] $*" >&2
}

log_warn() {
  echo "[WARN] $*" >&2
}

log_error() {
  echo "[ERROR] $*" >&2
}

# ============================================
# Help and Version
# ============================================

show_help() {
  cat << EOF
AIOX Qwen Code Orchestration Script v${VERSION}

Usage: ${SCRIPT_NAME} <agent> <task> [params] [options]

This script prepares AIOX agent context and task files for Qwen Code execution.
Unlike pm.sh (which spawns Claude terminals), this generates structured files
that Qwen reads and executes inline.

Arguments:
  agent       Agent ID (dev, architect, qa, pm, po, sm, analyst, devops, etc.)
  task        Task to execute (develop, review, create-story, etc.)
  params      Additional parameters (optional, quoted string)

Options:
  --context <path>   Path to JSON context file with additional context
  --output <path>    Custom output file path
  --help, -h         Show this help message
  --version, -v      Show version

Environment Variables:
  AIOX_OUTPUT_DIR    Output directory (default: /tmp)
  AIOX_DEBUG         Enable debug mode (default: false)
  AIOX_TIMEOUT       Timeout in seconds (default: 300)
  AIOX_INLINE_MODE   Always true for Qwen (default: true)

How it Works:
  1. Script validates agent and task files exist
  2. Generates task context file at .aiox/handoffs/qwen-{agent}-{task}.yaml
  3. Generates instruction file for Qwen at .aiox/handoffs/qwen-instructions.md
  4. Qwen reads these files and executes the task
  5. Output is written to the specified output file

Examples:
  ${SCRIPT_NAME} dev develop "story-1.1"
  ${SCRIPT_NAME} architect review --context /tmp/ctx.json
  ${SCRIPT_NAME} qa test --output /tmp/qa-result.md
  ${SCRIPT_NAME} sm create-story --output /tmp/story-context.md

After running this script, activate Qwen with:
  @<agent>  (e.g., @dev, @qa, @architect)
  Then execute: *<task> <params>

Exit Codes:
  0 - Context generated successfully (output file path printed to stdout)
  1 - Invalid arguments
  2 - Context generation failed
  3 - Agent file not found
EOF
}

show_version() {
  echo "${SCRIPT_NAME} version ${VERSION}"
}

# ============================================
# Argument Parsing
# ============================================

parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --help|-h)
        show_help
        exit 0
        ;;
      --version|-v)
        show_version
        exit 0
        ;;
      --context)
        shift
        CONTEXT_FILE="${1:-}"
        if [[ -z "$CONTEXT_FILE" ]]; then
          log_error "Missing value for --context"
          exit 1
        fi
        ;;
      --output)
        shift
        CUSTOM_OUTPUT="${1:-}"
        if [[ -z "$CUSTOM_OUTPUT" ]]; then
          log_error "Missing value for --output"
          exit 1
        fi
        ;;
      -*)
        log_error "Unknown option: $1"
        show_help
        exit 1
        ;;
      *)
        # Positional arguments
        if [[ -z "$AGENT" ]]; then
          AGENT="$1"
        elif [[ -z "$TASK" ]]; then
          TASK="$1"
        else
          # Remaining args are params
          PARAMS="${PARAMS:+$PARAMS }$1"
        fi
        ;;
    esac
    shift
  done

  # Validate required args
  if [[ -z "$AGENT" || -z "$TASK" ]]; then
    log_error "Missing required arguments: agent and task"
    echo ""
    show_help
    exit 1
  fi

  # Validate context file if provided
  if [[ -n "$CONTEXT_FILE" && ! -f "$CONTEXT_FILE" ]]; then
    log_error "Context file not found: $CONTEXT_FILE"
    exit 1
  fi
}

# ============================================
# Global Variables (declaramento early)
# ============================================

agent_name=""  # Will be populated in validate_agent

# ============================================
# Validation (Task 1.1)
# ============================================

validate_agent() {
  AGENT_FILE="${AIOX_CORE_DIR}/development/agents/${AGENT}.md"
  
  if [[ ! -f "$AGENT_FILE" ]]; then
    log_error "Agent '${AGENT}' not found at ${AGENT_FILE}"
    log_info "Available agents:"
    ls -1 "${AIOX_CORE_DIR}/development/agents/" 2>/dev/null | sed 's/\.md$//' | while read -r agent; do
      echo "  - ${agent}"
    done
    return 3
  fi

  # Extract agent name from agent file
  agent_name="$(grep -A2 '^agent:' "$AGENT_FILE" | grep 'name:' | head -1 | sed 's/.*name: *//' | tr -d '"' || echo "$AGENT")"
  
  log_debug "Agent validated: ${AGENT} (${agent_name}) at ${AGENT_FILE}"
}

validate_task() {
  local task_file="${AIOX_CORE_DIR}/development/tasks/${TASK}.md"
  
  if [[ ! -f "$task_file" ]]; then
    log_warn "Task '${TASK}' not found at ${task_file}"
    log_info "Task may be a story-specific task or custom task"
    log_info "Common tasks:"
    ls -1 "${AIOX_CORE_DIR}/development/tasks/" 2>/dev/null | head -20 | sed 's/\.md$//' | while read -r task; do
      echo "  - ${task}"
    done
    echo "  ..."
  else
    log_debug "Task validated: ${TASK} at ${task_file}"
  fi
}

# ============================================
# Context Generation (Task 1.2)
# ============================================

setup_paths() {
  local timestamp
  timestamp="$(date +%s)"

  if [[ -n "$CUSTOM_OUTPUT" ]]; then
    OUTPUT_FILE="$CUSTOM_OUTPUT"
  else
    OUTPUT_FILE="${OUTPUT_DIR}/aiox-qwen-output-${timestamp}.md"
  fi

  # Handoff directory for Qwen context
  HANDOFF_DIR="${PROJECT_ROOT}/.aiox/handoffs"
  mkdir -p "$HANDOFF_DIR"

  TASK_CONTEXT_FILE="${HANDOFF_DIR}/qwen-${AGENT}-${TASK}-${timestamp}.yaml"

  log_debug "Output file: $OUTPUT_FILE"
  log_debug "Task context file: $TASK_CONTEXT_FILE"
}

generate_qwen_context() {
  log_info "Generating Qwen context for agent='${AGENT}', task='${TASK}'..."

  # Get git context
  local git_branch=""
  local git_modified=""
  local git_last_commit=""
  
  if git rev-parse --is-inside-work-tree &>/dev/null; then
    git_branch="$(git branch --show-current 2>/dev/null || echo 'unknown')"
    git_modified="$(git status --porcelain | wc -l | tr -d ' ')"
    git_last_commit="$(git log -1 --oneline 2>/dev/null || echo 'no commits')"
  else
    git_branch="N/A (not a git repo)"
    git_modified="N/A"
    git_last_commit="N/A"
  fi

  # Find active story
  local active_story=""
  local stories_dir="${PROJECT_ROOT}/docs/stories"
  if [[ -d "$stories_dir" ]]; then
    active_story="$(ls -1t "$stories_dir"/*.md 2>/dev/null | head -1 | xargs basename 2>/dev/null || echo "")"
  fi

  # agent_name is already set in validate_agent()

  # Generate YAML context file
  cat > "$TASK_CONTEXT_FILE" << EOF
# AIOX Qwen Code Task Context
# Generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")

session:
  agent: ${AGENT}
  agent_name: ${agent_name}
  task: ${TASK}
  params: ${PARAMS:-""}
  version: ${VERSION}

project:
  root: ${PROJECT_ROOT}
  aiox_core: ${AIOX_CORE_DIR}
  git_branch: ${git_branch}
  git_modified_files: ${git_modified}
  git_last_commit: "${git_last_commit}"
  active_story: ${active_story:-"none"}

instructions: |
  You are now acting as the AIOX **${agent_name}** (@${AGENT}) agent.
  
  Your task is to execute: *${TASK} ${PARAMS}
  
  Steps:
  1. Read the agent definition at: ${AGENT_FILE}
  2. Read the task definition at: ${AIOX_CORE_DIR}/development/tasks/${TASK}.md (if exists)
  3. Adopt the agent persona following activation-instructions
  4. Execute the task following AIOX Constitution
  5. Update story files and checklists as appropriate
  6. Write your observations and output to: ${OUTPUT_FILE}
  
  IMPORTANT:
  - Follow AIOX Constitution (.aiox-core/constitution.md)
  - Respect CLI First, Agent Authority, Story-Driven, No Invention, Quality First
  - Run quality gates before marking complete: npm run lint, npm run typecheck, npm test, npm run build
  - Update story checkboxes [ ] → [x] when tasks complete
  - Maintain File List in story files

context_files:
  agent_definition: ${AGENT_FILE}
  task_definition: ${AIOX_CORE_DIR}/development/tasks/${TASK}.md
  constitution: ${AIOX_CORE_DIR}/constitution.md
  user_guide: ${AIOX_CORE_DIR}/user-guide.md
  qwen_skill: ${PROJECT_ROOT}/.qwen/skills/aiox/skill.md
  commands_reference: ${PROJECT_ROOT}/.qwen/skills/aiox/commands-reference.md

output:
  file: ${OUTPUT_FILE}
  format: markdown
  include:
    - execution_summary
    - files_created
    - files_modified
    - quality_gate_results
    - next_steps
EOF

  # Also generate a human-readable instruction file for Qwen
  cat > "${HANDOFF_DIR}/qwen-instructions.md" << EOF
# Qwen Code - AIOX Agent Instructions

## Agent: ${agent_name} (@${AGENT})
## Task: *${TASK} ${PARAMS}

### Context
- **Project:** ${PROJECT_ROOT}
- **Branch:** ${git_branch}
- **Active Story:** ${active_story:-none}
- **Task Context File:** ${TASK_CONTEXT_FILE}

### What to Do
1. Read this file and the task context file above
2. Activate as the **${agent_name}** agent (@${AGENT})
3. Execute the task \`*${TASK} ${PARAMS}\`
4. Follow AIOX Constitution and quality gates
5. Write results to: ${OUTPUT_FILE}

### Quick Activation
Say: \`@${AGENT}\` to adopt the agent persona, then proceed with the task.

### Quality Gates (MUST pass before marking complete)
\`\`\`bash
npm run lint
npm run typecheck
npm test
npm run build
\`\`\`

### References
- Agent: \`${AGENT_FILE}\`
- Task: \`${AIOX_CORE_DIR}/development/tasks/${TASK}.md\`
- Constitution: \`${AIOX_CORE_DIR}/constitution.md\`
- Commands: \`${PROJECT_ROOT}/.qwen/skills/aiox/commands-reference.md\`
EOF

  log_info "Context generated successfully"
  log_debug "Task context: ${TASK_CONTEXT_FILE}"
  log_debug "Instructions: ${HANDOFF_DIR}/qwen-instructions.md"
}

# ============================================
# Output Summary
# ============================================

print_summary() {
  echo ""
  echo "=== AIOX Qwen Code Orchestration Complete ==="
  echo ""
  echo "🤖 **Agent:** ${AGENT} (${agent_name:-${AGENT}})"
  echo "📋 **Task:** *${TASK} ${PARAMS}"
  echo "📂 **Task Context:** ${TASK_CONTEXT_FILE}"
  echo "📄 **Output File:** ${OUTPUT_FILE}"
  echo ""
  echo "### Next Steps:"
  echo "1. Activate Qwen with: \`@${AGENT}\`"
  echo "2. Read context: \`cat ${HANDOFF_DIR}/qwen-instructions.md\`"
  echo "3. Execute task: \`*${TASK} ${PARAMS}\`"
  echo ""
  echo "=== Ready for Qwen Execution ==="
  echo ""
  echo "${OUTPUT_FILE}"
}

# ============================================
# Main Entry Point
# ============================================

main() {
  parse_args "$@"
  
  log_info "AIOX Qwen Code Orchestration Script v${VERSION}"
  log_info "Agent: $AGENT"
  log_info "Task: $TASK"
  [[ -n "$PARAMS" ]] && log_info "Params: $PARAMS"
  [[ -n "$CONTEXT_FILE" ]] && log_info "Context: $CONTEXT_FILE"

  # Validate
  validate_agent
  validate_task

  # Setup and generate
  setup_paths
  generate_qwen_context

  # Print summary
  print_summary
  
  exit 0
}

main "$@"
