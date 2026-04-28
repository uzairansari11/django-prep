import { Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import Providers from '@/components/layout/Providers';
import Navbar from '@/components/layout/Navbar';
import BottomNav from '@/components/layout/BottomNav';
import PageTransition from '@/components/layout/PageTransition';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata = {
  title: {
    default: 'Django by Uzair',
    template: '%s | Django by Uzair',
  },
  description:
    'Master Django ORM concepts — models, queries, middleware, and project flow — through interactive lessons and exercises. Built by Uzair.',
  keywords: ['Django', 'ORM', 'Python', 'learning', 'practice', 'models', 'queries', 'middleware'],
  openGraph: {
    title: 'Django by Uzair',
    description: 'Interactive Django learning platform built by Uzair',
    type: 'website',
  },
};

// Runs synchronously in <head> before React hydrates — prevents the
// light-mode flash when a dark-mode user reloads the page.
const themeBootstrap = `
(function () {
  try {
    var saved = localStorage.getItem('app-dark-mode');
    var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    var dark = saved !== null ? saved === 'true' : prefersDark;
    if (dark) document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`;

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={inter.variable}
    >
      <body
        className="overflow-hidden antialiased"
        style={{
          backgroundColor: 'var(--bg)',
          // dvh = dynamic viewport height — adjusts as mobile browser
          // chrome (Safari URL bar etc.) shows / hides, so the bottom
          // nav never gets shoved below the visible area.
          height: '100dvh',
        }}
      >
        {/* Sync theme class before React hydrates — prevents the light-mode
            flash on reload when the user has dark mode saved. */}
        <Script id="theme-bootstrap" strategy="beforeInteractive">
          {themeBootstrap}
        </Script>
        <Providers>
          <div className="flex flex-col h-full">
            <Navbar />
            <main
              id="page-scroll"
              // Reserve space for the fixed glass bottom nav (~56px) +
              // device safe-area inset on mobile, but drop it entirely on
              // lg+ where the bottom nav is hidden — otherwise the desktop
              // page sits above an empty band of dead space.
              className="flex-1 overflow-y-auto overflow-x-hidden pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0"
              style={{ backgroundColor: 'var(--bg)' }}
            >
              <PageTransition>{children}</PageTransition>
            </main>
            <BottomNav />
          </div>
        </Providers>
      </body>
    </html>
  );
}
