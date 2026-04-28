import { Inter } from 'next/font/google';
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
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>

      <body className="h-screen overflow-hidden antialiased" style={{ backgroundColor: 'var(--bg)' }}>
        <Providers>
          <div className="flex flex-col h-full">
            <Navbar />
            <main
              id="page-scroll"
              className="flex-1 overflow-y-auto pb-16 lg:pb-0"
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
