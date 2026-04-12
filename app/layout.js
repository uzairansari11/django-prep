import { Inter } from 'next/font/google';
import './globals.css';
import ThemeProvider from '@/components/layout/ThemeProvider';
import Navbar from '@/components/layout/Navbar';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata = {
  title: {
    default: 'Django ORM Master',
    template: '%s | Django ORM Master',
  },
  description:
    'Master Django ORM concepts — models, queries, migrations and more — through interactive lessons and exercises.',
  keywords: ['Django', 'ORM', 'Python', 'learning', 'practice', 'models', 'queries'],
  openGraph: {
    title: 'Django ORM Master',
    description: 'Interactive Django ORM learning platform',
    type: 'website',
  },
};

// Inline script runs BEFORE React hydrates — eliminates flash of wrong theme.
const themeScript = `
(function(){
  try {
    var t = localStorage.getItem('django-practice-theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (t === 'dark' || (!t && prefersDark)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } catch(e) {}
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
        {/* Blocking script — must run before first paint to prevent FOUC */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 antialiased transition-colors duration-200">
        <ThemeProvider>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1">
              {children}
            </main>
            <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
              <p>Django ORM Master &mdash; Built for developers who want to level up.</p>
            </footer>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
