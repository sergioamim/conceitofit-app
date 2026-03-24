"use client";

export function AppContentShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 overflow-y-auto p-3 pb-20 md:p-7 md:pb-7">
      {children}
    </div>
  );
}
