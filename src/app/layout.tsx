import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SysWeaver - Systems Design Canvas',
  description:
    'A visual systems thinking diagramming tool with infinite canvas and semantic zooming.',
  keywords: ['systems thinking', 'diagram', 'canvas', 'design', 'architecture'],
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
