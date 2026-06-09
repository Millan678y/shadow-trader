import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white flex flex-col items-center justify-center p-8">
      <h1 className="text-5xl font-bold mb-4">Shadow Trader</h1>
      <p className="text-xl text-gray-400 mb-8">AI Signal Co-Pilot for Solana Traders</p>
      <Link href="/app" className="px-6 py-3 bg-blue-600 rounded-lg font-semibold hover:bg-blue-500 transition">
        Launch App
      </Link>
    </main>
  );
}