import { HibernationLogo } from "./HibernationLogo";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/40 mt-32">
      <div className="container mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <HibernationLogo size={20} />
          <span>HibernationOS · Idle, beautifully.</span>
        </div>
        <div className="text-xs text-muted-foreground font-mono">
          © {new Date().getFullYear()} · 💤 sleeping since now
        </div>
      </div>
    </footer>
  );
}
