import { useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Mail, Leaf } from "lucide-react";

const TITLES: { match: RegExp; title: string }[] = [
  { match: /^\/$/, title: "Grama Vasathi — Authentic rural homestays in India" },
  {
    match: /^\/homestays\/(\d+)\/host$/,
    title: "Host Readiness · Grama Vasathi",
  },
  {
    match: /^\/homestays\/(\d+)$/,
    title: "Homestay · Grama Vasathi",
  },
];

function titleFor(path: string): string {
  for (const t of TITLES) if (t.match.test(path)) return t.title;
  return "Grama Vasathi";
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const isFirstNav = useRef(true);

  useEffect(() => {
    document.title = titleFor(location);
    // On first mount, let the browser honor any incoming hash anchor.
    // After that, scroll to top on route change.
    if (isFirstNav.current) {
      isFirstNav.current = false;
      if (window.location.hash) return;
    }
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [location]);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="font-serif text-2xl font-bold text-primary tracking-tight flex items-center gap-2"
            data-testid="link-brand"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-6 h-6"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            Grama Vasathi
          </Link>
          <nav className="flex gap-6 items-center">
            <Link
              href="/"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              data-testid="link-discover"
            >
              Discover
            </Link>
            <a
              href="#destinations"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors hidden sm:inline"
            >
              Stays
            </a>
            <a
              href="#"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Host a home
            </a>
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border/40 bg-muted/40 mt-auto">
        <div className="container mx-auto px-4 py-14">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            <div className="md:col-span-2">
              <div className="font-serif text-2xl font-bold text-primary tracking-tight flex items-center gap-2 mb-4">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-6 h-6"
                >
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
                Grama Vasathi
              </div>
              <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
                A village-first homestay network across India. We connect
                travelers directly with rural host families — no commissions, no
                middlemen, just real hospitality.
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-5">
                <Leaf className="w-4 h-4 text-primary" />
                Built for slow, rooted travel.
              </div>
            </div>

            <div>
              <div className="text-sm font-bold text-foreground mb-4">
                Explore
              </div>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <Link
                    href="/"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    All homestays
                  </Link>
                </li>
                <li>
                  <a
                    href="#destinations"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    Destinations
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    Become a host
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <div className="text-sm font-bold text-foreground mb-4">
                Contact
              </div>
              <ul className="space-y-2.5 text-sm">
                <li className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="w-4 h-4 text-primary" />
                  hello@gramavasathi.in
                </li>
                <li className="text-muted-foreground">
                  Bengaluru · Open Mon–Sat
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border/40 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="font-serif italic text-muted-foreground">
              "Experience the heart of rural India."
            </p>
            <p className="text-xs text-muted-foreground/70">
              © {new Date().getFullYear()} Grama Vasathi. Handcrafted with care.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
