import type { Metadata } from 'next';
import './globals.css';

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
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
