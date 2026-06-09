import { NextResponse } from 'next/server'

// In-memory cache (3 second TTL)
let cache: { data: any; ts: number } | null = null
const CACHE_TTL = 3000
let orderbookErrorLogged = false

async function fetchBinancePrice(symbol = 'BTCUSDT'): Promise<any> {
  try {
    const r = await fetch(
      `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`,
      { next: { revalidate: 0 } }
    )
    if (!r.ok) throw new Error(`Binance HTTP ${r.status}`)
    return await r.json()
  } catch (e) {
    console.error('Binance fetch error:', e)
    return null
  }
}

async function fetchBinanceKlines(symbol = 'BTCUSDT', interval = '1m', limit = 100) {
  try {
    const r = await fetch(
      `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`,
      { next: { revalidate: 0 } }
    )
    if (!r.ok) throw new Error(`Binance HTTP ${r.status}`)
    return await r.json()
  } catch (e) {
    console.error('Binance klines error:', e)
    return []
  }
}

async function fetchOrderBook(symbol = 'BTCUSDT', limit = 20) {
  try {
    const r = await fetch(
      `https://api.binance.com/api/v3/orderbook?symbol=${symbol}&limit=${limit}`,
      { next: { revalidate: 0 } }
    )
    if (!r.ok) throw new Error(`Binance HTTP ${r.status}`)
    return await r.json()
  } catch (e: any) {
    // Orderbook 404 is non-fatal — Binance changed this endpoint
    if (!orderbookErrorLogged) { console.warn('Orderbook error:', e?.message); orderbookErrorLogged = true }
    return null
  }
}

async function fetchYahooData(ticker: string) {
  try {
    const r = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=2d`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Accept': 'application/json',
        },
        next: { revalidate: 0 },
      }
    )
    if (!r.ok) throw new Error(`Yahoo HTTP ${r.status}`)
    const data = await r.json()
    const quotes = data?.chart?.result?.[0]?.indicators?.quote?.[0]?.close || []
    return quotes.length >= 2 ? { current: quotes[quotes.length - 1], prev: quotes[quotes.length - 2] } : null
  } catch (e) {
    console.error('Yahoo fetch error:', e)
    return null
  }
}

export async function GET() {
  try {
    // Check cache
    if (cache && Date.now() - cache.ts < CACHE_TTL) {
      return NextResponse.json(cache.data, {
        headers: { 'Cache-Control': 'public, s-maxage=3, stale-while-revalidate=5' },
      })
    }

    // Fetch all data in parallel
    const [btcTicker, ethTicker, solTicker, btcKlines, orderBook, dxyData, spxData, vixData] = await Promise.all([
      fetchBinancePrice('BTCUSDT'),
      fetchBinancePrice('ETHUSDT'),
      fetchBinancePrice('SOLUSDT'),
      fetchBinanceKlines('BTCUSDT', '1m', 100),
      fetchOrderBook('BTCUSDT'),
      fetchYahooData('%5EDXY'),
      fetchYahooData('%5EGSPC'),
      fetchYahooData('%5EVIX'),
    ])

    // Parse candles
    const candles = (btcKlines || []).map((k: any[]) => ({
      t: Math.floor(k[0] / 1000),
      o: parseFloat(k[1]),
      h: parseFloat(k[2]),
      l: parseFloat(k[3]),
      c: parseFloat(k[4]),
      v: parseFloat(k[5]),
    }))

    // Parse order flow
    const bids = orderBook?.bids || []
    const asks = orderBook?.asks || []
    const bestBid = parseFloat(bids[0]?.[0] || 0)
    const bestAsk = parseFloat(asks[0]?.[0] || 0)
    const spread = bestAsk - bestBid
    const bidVol = bids.slice(0, 10).reduce((s: number, b: any[]) => s + parseFloat(b[1]), 0)
    const askVol = asks.slice(0, 10).reduce((s: number, b: any[]) => s + parseFloat(b[1]), 0)

    const spread_bps = bestBid > 0 ? (spread / bestBid) * 10000 : 0

    // Build response
    const data = {
      timestamp: new Date().toISOString(),
      btc: btcTicker ? {
        price: parseFloat(btcTicker.lastPrice),
        change_24h: parseFloat(btcTicker.priceChangePercent || '0'),
        high_24h: parseFloat(btcTicker.highPrice || '0'),
        low_24h: parseFloat(btcTicker.lowPrice || '0'),
        volume: parseFloat(btcTicker.volume || '0'),
        quote_volume: parseFloat(btcTicker.quoteVolume || '0'),
      } : null,
      eth: ethTicker ? {
        price: parseFloat(ethTicker.lastPrice),
        change_24h: parseFloat(ethTicker.priceChangePercent || '0'),
      } : null,
      sol: solTicker ? {
        price: parseFloat(solTicker.lastPrice),
        change_24h: parseFloat(solTicker.priceChangePercent || '0'),
      } : null,
      orderflow: {
        bid: bestBid,
        ask: bestAsk,
        spread,
        spread_bps: spread_bps.toFixed(1),
        bid_vol: bidVol,
        ask_vol: askVol,
        delta_1m: parseFloat((bidVol - askVol).toFixed(2)),
        delta_5m: parseFloat((bidVol * 5 - askVol * 5).toFixed(2)),
        sweep: spread > 50 ? 'BEARISH' : spread_bps < 2 ? 'BULLISH' : 'None',
        absorption: askVol > bidVol * 3,
      },
      candles,
      macro: {
        dxy: dxyData?.current || 0,
        dxy_change: dxyData?.current && dxyData?.prev ? ((dxyData.current - dxyData.prev) / dxyData.prev * 100) : 0,
        spx: spxData?.current || 0,
        spx_change: spxData?.current && spxData?.prev ? ((spxData.current - spxData.prev) / spxData.prev * 100) : 0,
        vix: vixData?.current || 0,
      },
    }

    // Update cache
    cache = { data, ts: Date.now() }

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3, stale-while-revalidate=5',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (e) {
    console.error('Market API error:', e)
    return NextResponse.json({ error: 'Failed to fetch market data' }, { status: 500 })
  }
}