"use client";

export function AppContentShell({ children }: { children: React.ReactNode }) {
  return (
    <div id="main-content" tabIndex={-1} className="flex-1 overflow-y-auto p-4 pb-20 md:p-10 md:pb-10 outline-none bg-v2-gradient">
      {children}
    </div>
  );
}
