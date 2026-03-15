"use client";

export function AppContentShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 overflow-y-auto p-3 md:p-7">
      {children}
    </div>
  );
}
