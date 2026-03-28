"use client";

import { useState, useCallback } from "react";

interface UseDialogStateReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  /** Use as `onOpenChange` prop for shadcn Dialog */
  onOpenChange: (open: boolean) => void;
}

/**
 * Simple hook for managing dialog/modal open/close state.
 *
 * @param initialOpen  Whether the dialog starts open (default: false)
 */
export function useDialogState(initialOpen = false): UseDialogStateReturn {
  const [isOpen, setIsOpen] = useState(initialOpen);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);
  const onOpenChange = useCallback((value: boolean) => setIsOpen(value), []);

  return { isOpen, open, close, toggle, onOpenChange };
}
