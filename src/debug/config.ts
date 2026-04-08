const TRUTHY_VALUES = new Set(["1", "true", "yes", "on"]);

const DEV_SESSION_DEBUG_ENV_VAR = "NEXT_PUBLIC_DEBUG_SESSION_DEVTOOLS";

export function isDevSessionDebugEnabled(): boolean {
  if (process.env.NODE_ENV === "production") {
    return false;
  }

  const rawValue = process.env.NEXT_PUBLIC_DEBUG_SESSION_DEVTOOLS ?? "";
  return TRUTHY_VALUES.has(rawValue.trim().toLowerCase());
}
