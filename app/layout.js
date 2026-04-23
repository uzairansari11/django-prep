import { Inter } from 'next/font/google';
import './globals.css';
import Providers from '@/components/layout/Providers';
import Navbar from '@/components/layout/Navbar';
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

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={inter.variable}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>

      {/*
        h-screen + overflow-hidden: browser scrollbar only shows inside #page-scroll,
        starting below the navbar rather than at the very top of the viewport.
      */}
      <body className="h-screen overflow-hidden antialiased">
        <Providers>
          <div className="flex flex-col h-full">
            <Navbar />
            <div id="page-scroll" className="flex-1 overflow-y-auto">
              <PageTransition>
                {children}
              </PageTransition>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
