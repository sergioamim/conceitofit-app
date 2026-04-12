import type { Page } from "@playwright/test";

export type MessageMatcher = RegExp | string;

export type BrowserErrorGuardOptions = {
  allowConsoleErrors?: MessageMatcher[];
  allowPageErrors?: MessageMatcher[];
};

function matchesAny(message: string, patterns: MessageMatcher[]): boolean {
  return patterns.some((pattern) =>
    typeof pattern === "string" ? message.includes(pattern) : pattern.test(message),
  );
}

export function createBrowserErrorGuard(
  page: Page,
  options: BrowserErrorGuardOptions = {},
) {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });

  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });

  return {
    async assertNoUnexpectedErrors(contextMessage = "A página gerou erros inesperados") {
      const unexpectedConsoleErrors = consoleErrors.filter(
        (message) => !matchesAny(message, options.allowConsoleErrors ?? []),
      );
      const unexpectedPageErrors = pageErrors.filter(
        (message) => !matchesAny(message, options.allowPageErrors ?? []),
      );

      if (unexpectedConsoleErrors.length === 0 && unexpectedPageErrors.length === 0) {
        return;
      }

      throw new Error(
        [
          contextMessage,
          unexpectedConsoleErrors.length > 0
            ? `console.error:\n- ${unexpectedConsoleErrors.join("\n- ")}`
            : null,
          unexpectedPageErrors.length > 0
            ? `pageerror:\n- ${unexpectedPageErrors.join("\n- ")}`
            : null,
        ]
          .filter(Boolean)
          .join("\n\n"),
      );
    },
  };
}
