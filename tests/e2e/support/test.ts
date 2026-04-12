import { expect, test as base } from "@playwright/test";
import {
  createBrowserErrorGuard,
  type BrowserErrorGuardOptions,
  type MessageMatcher,
} from "./browser-errors";

export type BrowserErrorsFixture = {
  allowConsoleErrors: (...patterns: MessageMatcher[]) => void;
  allowPageErrors: (...patterns: MessageMatcher[]) => void;
  assertNoUnexpectedErrors: (contextMessage?: string) => Promise<void>;
};

export const test = base.extend<{ browserErrors: BrowserErrorsFixture }>({
  browserErrors: [
    async ({ page }, use, testInfo) => {
      const options: BrowserErrorGuardOptions = {
        allowConsoleErrors: [],
        allowPageErrors: [],
      };

      const guard = createBrowserErrorGuard(page, options);
      const browserErrors: BrowserErrorsFixture = {
        allowConsoleErrors: (...patterns) => {
          options.allowConsoleErrors?.push(...patterns);
        },
        allowPageErrors: (...patterns) => {
          options.allowPageErrors?.push(...patterns);
        },
        assertNoUnexpectedErrors: async (contextMessage) => {
          await guard.assertNoUnexpectedErrors(
            contextMessage ??
              `O teste "${testInfo.title}" emitiu erros inesperados no browser`,
          );
        },
      };

      await use(browserErrors);

      if (testInfo.status === testInfo.expectedStatus) {
        await browserErrors.assertNoUnexpectedErrors();
      }
    },
    { auto: true },
  ],
});

export { expect };
export * from "@playwright/test";
