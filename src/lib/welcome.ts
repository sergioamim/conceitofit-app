import type { AuthUser } from "@/lib/api/auth";

export type WelcomeFlags = {
  hasSeenWelcomePage?: boolean | null;
  isFirstLogin?: boolean | null;
  firstAccessCompleted?: boolean | null;
  firstAccessPending?: boolean | null;
};

export function extractWelcomeFlags(user?: AuthUser | null): WelcomeFlags {
  if (!user) {
    return {};
  }
  return {
    hasSeenWelcomePage: user.hasSeenWelcomePage,
    isFirstLogin: user.isFirstLogin,
    firstAccessCompleted: user.firstAccessCompleted,
    firstAccessPending: user.firstAccessPending,
  };
}

export function shouldShowWelcome(
  flags: WelcomeFlags,
  options?: {
    localSeen?: boolean | null;
  }
): boolean {
  if (flags.hasSeenWelcomePage === true) return false;
  if (flags.firstAccessCompleted === true) return false;
  if (options?.localSeen === true) return false;

  if (flags.hasSeenWelcomePage === false) return true;
  if (flags.isFirstLogin === true) return true;
  if (flags.firstAccessPending === true) return true;
  if (flags.firstAccessCompleted === false) return true;

  return false;
}
