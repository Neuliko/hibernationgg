import { HibernationLogo } from "./HibernationLogo";

export function SiteFooter() {
  return (
    <footer className="border-t border-border mt-32 bg-background">
      <div className="container mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <HibernationLogo size={22} />
          <span>Hibernation Portal · Manage server inactivity, beautifully.</span>
        </div>
        <div className="text-xs text-muted-foreground font-mono">
          © {new Date().getFullYear()} · built for Discord communities
        </div>
      </div>
    </footer>
  );
}
