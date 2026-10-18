import type { Metadata } from 'next';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import { SITE_NAME, SITE_TAGLINE } from '@/lib/constants';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: `${SITE_NAME} — Free local activities for seniors`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_TAGLINE,
};

// Applied before first paint so text-size / high-contrast settings never flash.
const PREPAINT_SCRIPT = `try{var t=localStorage.getItem('al-text-size');if(t){document.documentElement.setAttribute('data-text-size',t)}var c=localStorage.getItem('al-contrast');if(c){document.documentElement.setAttribute('data-contrast',c)}}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-text-size="normal" data-contrast="normal">
      <head>
        <script dangerouslySetInnerHTML={{ __html: PREPAINT_SCRIPT }} />
      </head>
      <body>
        <a href="#main" className="skip-link">Skip to main content</a>
        <Header />
        <main id="main" className="mx-auto max-w-5xl px-4 py-8">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
