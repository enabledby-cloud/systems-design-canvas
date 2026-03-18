import type { Metadata } from 'next';
import { IBM_Plex_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'System - Systems Design Canvas',
  description:
    'A visual systems thinking diagramming tool with infinite canvas and semantic zooming. enabledby.cloud/system',
  keywords: ['systems thinking', 'diagram', 'canvas', 'design', 'architecture', 'enabledby'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${ibmPlexSans.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans antialiased">
        {/* App Loading Screen - hidden by JS once app mounts */}
        <div id="app-loading">
          <div className="logo-container">
            <div className="logo-glow" />
            <div className="logo-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent-blue)' }}>
                <circle cx="12" cy="12" r="3" />
                <circle cx="12" cy="5" r="2" />
                <circle cx="19" cy="12" r="2" />
                <circle cx="12" cy="19" r="2" />
                <circle cx="5" cy="12" r="2" />
                <line x1="12" y1="8" x2="12" y2="9" />
                <line x1="15" y1="12" x2="17" y2="12" />
                <line x1="12" y1="15" x2="12" y2="17" />
                <line x1="7" y1="12" x2="9" y2="12" />
              </svg>
            </div>
          </div>
          <div className="brand-text">System</div>
          <div className="tagline">Systems Design Canvas</div>
          <div className="spinner" />
        </div>
        {children}
      </body>
    </html>
  );
}
