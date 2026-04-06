import { Sidebar } from "@/components/layout/sidebar";

export default function ModernShowcaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-[radial-gradient(ellipse_at_top_right,var(--primary-foreground),transparent_50%)]">
        {children}
      </main>
    </div>
  );
}
