import type { Metadata, Viewport } from 'next';
import { Inter, Outfit } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#070709',
};

export const metadata: Metadata = {
  title: 'Xplore Menu • Cardápio Digital Social & Telemetria Comportamental',
  description:
    'Cardápio interativo mobile-first acionado via NFC e QR Code com vídeos verticais e engenharia de cardápio em tempo real.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${outfit.variable} dark`}>
      <body className="font-sans antialiased bg-obsidian-950 text-white min-h-screen">
        {children}
      </body>
    </html>
  );
}
