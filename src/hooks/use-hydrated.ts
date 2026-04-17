"use client";

import { useSyncExternalStore } from "react";

function subscribeHydration() {
  return () => undefined;
}

export function useHydrated() {
  return useSyncExternalStore(subscribeHydration, () => true, () => false);
}
