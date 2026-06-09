import Link from 'next/link';
import './globals.css';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const nav = [
    { href: '/app', label: 'Dashboard' },
    { href: '/app/signals', label: 'Signals' },
    { href: '/app/terminal', label: 'Terminal' },
    { href: '/app/settings', label: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex">
      <nav className="w-56 bg-[#111118] border-r border-gray-800 p-4 flex flex-col gap-2">
        <h2 className="text-lg font-bold mb-4 px-2">Shadow Trader</h2>
        {nav.map(({ href, label }) => (
          <Link key={href} href={href} className="px-3 py-2 rounded hover:bg-gray-800 text-gray-300 hover:text-white transition">
            {label}
          </Link>
        ))}
        <div className="mt-auto pt-4 border-t border-gray-800">
          <Link href="/api/auth/logout" className="block px-3 py-2 text-red-400 hover:bg-gray-800 rounded transition text-sm">
            Disconnect Wallet
          </Link>
        </div>
      </nav>
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}