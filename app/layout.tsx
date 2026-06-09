import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Shadow Trader — AI Signal Co-Pilot',
  description: 'Institutional-grade AI signals for Solana & crypto traders',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}