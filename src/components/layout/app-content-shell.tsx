"use client";

export function AppContentShell({ children }: { children: React.ReactNode }) {
  return (
    <div id="main-content" tabIndex={-1} className="flex-1 overflow-y-auto p-3 pb-20 md:p-7 md:pb-7 outline-none">
      {children}
    </div>
  );
}
