import { Link } from "@tanstack/react-router";
import { HibernationLogo } from "./HibernationLogo";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border">
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2.5 group">
          <HibernationLogo size={30} />
          <span className="font-display text-lg font-semibold tracking-tight text-ink">
            Hibernation <span className="text-brand">Portal</span>
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <Link to="/features" className="hover:text-foreground transition">Features</Link>
          <Link to="/docs" className="hover:text-foreground transition">Docs</Link>
          <Link to="/dashboard" className="hover:text-foreground transition">Dashboard</Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link
            to="/sign-in"
            className="text-sm text-muted-foreground hover:text-foreground transition"
          >
            Sign in
          </Link>
          <Link
            to="/sign-up"
            className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-brand hover:opacity-90 transition"
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}
