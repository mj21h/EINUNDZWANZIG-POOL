import React, { useState, useEffect } from 'react';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ChevronDown, 
  ChevronUp, 
  Loader,
  Newspaper,
  Clock,
  Activity,
  Cpu,
  Database,
  Waves,
  RefreshCw,
  Zap
} from 'lucide-react';
import { adoptionImageBase64 } from '../assets/adoptionImage';

interface ChartPoint {
  time: string;
  price: number;
}

interface EinsteigerEntry {
  title: string;
  sub: string;
  icon: string;
  type: 'dropdown' | 'link';
  url?: string;
}

const einsteigerEntries: EinsteigerEntry[] = [
  {
    title: "Bitcoin Adoption Zeitplan",
    sub: "@derHelper auf X (Twitter) • Zum Aufklappen",
    icon: "⏱️",
    type: "dropdown"
  },
  {
    title: "Bitcoins Potential",
    sub: "Warum Bitcoin steigen kann • BlueGuy",
    icon: "▶️",
    type: "link",
    url: "https://youtu.be/QIZe-20JBtQ?si=tZA6ogafCgUTIiXi"
  },
  {
    title: "WTF Happened in 1971?",
    sub: "Zum Thema Inflation • Pflichtlektüre",
    icon: "📈",
    type: "link",
    url: "https://www.blocktrainer.de/blog/wtf-happened-in-1971-die-katastrophalen-auswirkungen-von-ungedecktem-papiergeld"
  },
  {
    title: "Principles by Ray Dalio",
    sub: "Großmächte in wiederkehrenden Zyklen",
    icon: "🌍",
    type: "link",
    url: "https://www.youtube.com/watch?v=xguam0TKMw8"
  },
  {
    title: "Blocktrainer",
    sub: "Bitcoin YouTube-Kanal • Empfohlen",
    icon: "📺",
    type: "link",
    url: "https://www.youtube.com/@Blocktrainer"
  },
  {
    title: "Einundzwanzig Podcast",
    sub: "Der Bitcoin Podcast • Einsteiger & Community",
    icon: "🎙️",
    type: "link",
    url: "https://einundzwanzig.space/podcast/"
  },
  {
    title: "Bravos Research Crypto",
    sub: "Bitcoin Makro Charts",
    icon: "🔬",
    type: "link",
    url: "https://www.youtube.com/@bravosresearchcrypto"
  }
];

interface Quote {
  text: string;
  author: string;
}

const btcQuotes: Quote[] = [
  {
    text: "Wenn du es nicht glaubst oder nicht verstehst, habe ich keine Zeit, dich zu überzeugen, tut mir leid.",
    author: "Satoshi Nakamoto"
  },
  {
    text: "Fix the money, fix the world.",
    author: "Zitadelle Maxime"
  },
  {
    text: "Bitcoin ist ein unaufhaltsames Geldnetzwerk, das auf mathematischer Wahrheit und physikalischem Konsens beruht.",
    author: "Roman Reher (Blocktrainer)"
  },
  {
    text: "Die eigentliche Revolution von Bitcoin ist nicht technischer Natur, sondern gesellschaftlicher und moralischer Natur.",
    author: "Der Gigi (21 Lektionen)"
  },
  {
    text: "Es ist gut möglich, dass das Vertrauen in Papiergeld bald schwindet. Dann wird das Konzept von hartem, digitalem Geld umso bedeutender.",
    author: "Hal Finney"
  },
  {
    text: "Wenn die Zentralbanken unbegrenzt Geld drucken können, ist das Ersparte der Menschen nichts anderes als ein Versprechen, das jederzeit gebrochen werden kann.",
    author: "Saifedean Ammous (Der Bitcoin-Standard)"
  },
  {
    text: "Bitcoin ist eine Bank im Cyberspace, geführt von unbestechlicher Software, die jedem offensteht.",
    author: "Michael Saylor"
  },
  {
    text: "Es ist ein Segen für die Menschheit, ein Geld zu haben, das von keiner Regierung der Welt inflationiert werden kann.",
    author: "Einundzwanzig Community"
  },
  {
    text: "Das eigentliche Problem bei konventionellen Währungen ist das Vertrauen, das nötig ist, damit sie funktionieren. Man muss der Zentralbank vertrauen, dass sie die Währung nicht entwertet.",
    author: "Satoshi Nakamoto"
  },
  {
    text: "Es ist eine fundamentale Wahrheit: Niemand kann dich hindern, Bitcoin zu senden, zu empfangen oder zu halten.",
    author: "Andreas Antonopoulos"
  },
  {
    text: "Es ist gut, dass die Menschen das Banken- und Währungssystem des Landes nicht verstehen. Wenn sie es täten, hätten wir morgen früh eine Revolution.",
    author: "Henry Ford"
  },
  {
    text: "Der freie Markt wählt immer das härteste Geld. Bitcoin hat die höchste Härtegeschichte der Menschheit, weil es absolut knapp ist.",
    author: "Saifedean Ammous"
  }
];

type Currency = 'USD' | 'EUR';

interface CachedPrice {
  price: number;
  ts: number;
}

interface CachedChart {
  points: ChartPoint[];
  refOpen: number;
  ts: number;
}

interface LiveInfo {
  mempoolFee: number | null;
  hashrate: number | null;
  blockHeight: number | null;
  unconfirmedTx: number | null;
  lastUpdated: number | null;
}

const CACHE_PREFIX = 'einundzwanzig_cache_v2_';
const priceKey = (cur: Currency) => `${CACHE_PREFIX}price_${cur}`;
const chartKey = (cur: Currency, interval: string) => `${CACHE_PREFIX}chart_${cur}_${interval}`;
const LIVE_INFO_KEY = `${CACHE_PREFIX}liveInfo`;

// Remove caches written by older app versions (not separated by currency/interval).
try {
  ['price', 'priceChange', 'chartData', 'liveInfo'].forEach((k) =>
    localStorage.removeItem(`einundzwanzig_cached_${k}`)
  );
} catch (e) {}

const readCache = <T,>(key: string): T | null => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch (e) {
    return null;
  }
};

const writeCache = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {}
};

const isValidNumber = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);

const readCachedPrice = (cur: Currency): CachedPrice | null => {
  const cached = readCache<CachedPrice>(priceKey(cur));
  return cached && isValidNumber(cached.price) && cached.price > 0 ? cached : null;
};

const readCachedChart = (cur: Currency, interval: string): CachedChart | null => {
  const cached = readCache<CachedChart>(chartKey(cur, interval));
  return cached && Array.isArray(cached.points) && cached.points.length > 0 && isValidNumber(cached.refOpen)
    ? cached
    : null;
};

const fetchJson = async (url: string, signal: AbortSignal) => {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status} für ${url}`);
  return res.json();
};

const formatTime = (ts: number | null) =>
  ts ? new Date(ts).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : '–';

const feeLevel = (fee: number | null) => {
  if (fee === null) return { label: 'Keine Daten', className: 'text-on-surface-variant' };
  if (fee <= 5) return { label: 'Niedrig', className: 'text-emerald-400' };
  if (fee <= 20) return { label: 'Normal', className: 'text-teal' };
  if (fee <= 50) return { label: 'Erhöht', className: 'text-amber-400' };
  return { label: 'Hoch', className: 'text-rose-400' };
};

// Runs `task` immediately and then every `ms` milliseconds while the page is visible.
// The AbortSignal passed to `task` is aborted when deps change or the component unmounts,
// so late responses from a previous currency/interval can't overwrite newer state.
function usePolling(task: (signal: AbortSignal) => void, ms: number, deps: React.DependencyList) {
  useEffect(() => {
    const controller = new AbortController();
    let timer: number | undefined;

    const stop = () => {
      if (timer !== undefined) {
        window.clearInterval(timer);
        timer = undefined;
      }
    };
    const start = () => {
      stop();
      task(controller.signal);
      timer = window.setInterval(() => task(controller.signal), ms);
    };
    const onVisibilityChange = () => (document.visibilityState === 'hidden' ? stop() : start());

    if (document.visibilityState !== 'hidden') start();
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      controller.abort();
      stop();
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

const INTERVAL_CONFIG: Record<string, { binanceInterval: string; limit: number; formatLabel: (d: Date) => string }> = {
  '24h': {
    binanceInterval: '1h',
    limit: 24,
    formatLabel: (d) => d.getHours().toString().padStart(2, '0') + ':00',
  },
  '7T': {
    binanceInterval: '4h',
    limit: 42,
    formatLabel: (d) => d.toLocaleDateString('de-DE', { weekday: 'short' }) + ' ' + d.getHours() + 'h',
  },
  '30T': {
    binanceInterval: '1d',
    limit: 30,
    formatLabel: (d) => d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }),
  },
  '1J': {
    binanceInterval: '1w',
    limit: 52,
    formatLabel: (d) => d.toLocaleDateString('de-DE', { month: 'short' }),
  },
};

export default function Dashboard() {
  const [currency, setCurrency] = useState<Currency>('USD');
  const [selectedInterval, setSelectedInterval] = useState<string>('24h');

  const [priceState, setPriceState] = useState<{ price: number | null; ts: number | null; offline: boolean }>(() => {
    const cached = readCachedPrice('USD');
    return { price: cached?.price ?? null, ts: cached?.ts ?? null, offline: false };
  });
  const currentPrice = priceState.price;

  const [chartState, setChartState] = useState<{ points: ChartPoint[]; refOpen: number | null }>(() => {
    const cached = readCachedChart('USD', '24h');
    return { points: cached?.points ?? [], refOpen: cached?.refOpen ?? null };
  });
  const chartData = chartState.points;
  const [isChartLoading, setIsChartLoading] = useState<boolean>(() => !readCachedChart('USD', '24h'));
  const [chartError, setChartError] = useState<boolean>(false);

  // Change since the open of the first candle of the selected interval, based on the live price.
  const priceChangePercent =
    currentPrice !== null && chartState.refOpen
      ? ((currentPrice - chartState.refOpen) / chartState.refOpen) * 100
      : null;

  const [isAdoptionOpen, setIsAdoptionOpen] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({ width: 0, height: 144 });

  // Live Briefing States
  const [liveInfo, setLiveInfo] = useState<LiveInfo>(() => {
    const cached = readCache<Partial<LiveInfo>>(LIVE_INFO_KEY) ?? {};
    const num = (v: unknown) => (isValidNumber(v) ? v : null);
    return {
      mempoolFee: num(cached.mempoolFee),
      hashrate: num(cached.hashrate),
      blockHeight: num(cached.blockHeight),
      unconfirmedTx: num(cached.unconfirmedTx),
      lastUpdated: num(cached.lastUpdated),
    };
  });

  const [isRefreshingLive, setIsRefreshingLive] = useState<boolean>(false);

  const updateLiveInfo = (patch: Partial<LiveInfo>) => {
    setLiveInfo((prev) => {
      const nextState = { ...prev, ...patch, lastUpdated: Date.now() };
      writeCache(LIVE_INFO_KEY, nextState);
      return nextState;
    });
  };

  const fetchMempoolData = async (signal: AbortSignal) => {
    const [feeRes, blockRes, mempoolRes] = await Promise.allSettled([
      fetchJson('https://mempool.space/api/v1/fees/recommended', signal),
      fetchJson('https://mempool.space/api/blocks/tip/height', signal),
      fetchJson('https://mempool.space/api/mempool', signal),
    ]);
    if (signal.aborted) return;

    const patch: Partial<LiveInfo> = {};
    if (feeRes.status === 'fulfilled' && isValidNumber(feeRes.value?.fastestFee)) {
      patch.mempoolFee = feeRes.value.fastestFee;
    }
    if (blockRes.status === 'fulfilled' && isValidNumber(blockRes.value)) {
      patch.blockHeight = blockRes.value;
    }
    if (mempoolRes.status === 'fulfilled' && isValidNumber(mempoolRes.value?.count)) {
      patch.unconfirmedTx = mempoolRes.value.count;
    }

    const failed = [feeRes, blockRes, mempoolRes].filter((r) => r.status === 'rejected');
    if (failed.length > 0) {
      console.error('Fehler beim Abrufen der Mempool-Daten', failed);
    }
    if (Object.keys(patch).length > 0) updateLiveInfo(patch);
  };

  const fetchHashrate = async (signal: AbortSignal) => {
    try {
      const hashData = await fetchJson('https://mempool.space/api/v1/mining/hashrate/3d', signal);
      if (signal.aborted) return;
      if (isValidNumber(hashData?.currentHashrate)) {
        updateLiveInfo({ hashrate: parseFloat((hashData.currentHashrate / 1e18).toFixed(1)) });
      }
    } catch (e) {
      if (!signal.aborted) console.error('Fehler beim Abrufen der Hashrate', e);
    }
  };

  // Fees, block height and mempool change with every block; hashrate only a few times per day.
  usePolling(fetchMempoolData, 30_000, []);
  usePolling(fetchHashrate, 10 * 60_000, []);

  const handleManualRefreshLive = async () => {
    setIsRefreshingLive(true);
    const signal = new AbortController().signal;
    try {
      await Promise.all([fetchMempoolData(signal), fetchHashrate(signal)]);
    } finally {
      setIsRefreshingLive(false);
    }
  };
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);

    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0) {
          setContainerSize({ width, height: height || 144 });
        }
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Show the cached values of the newly selected currency/interval right away,
  // instead of keeping the numbers of the previous selection until the fetch returns.
  useEffect(() => {
    const cachedPrice = readCachedPrice(currency);
    setPriceState({ price: cachedPrice?.price ?? null, ts: cachedPrice?.ts ?? null, offline: false });
  }, [currency]);

  useEffect(() => {
    const cachedChart = readCachedChart(currency, selectedInterval);
    setChartState({ points: cachedChart?.points ?? [], refOpen: cachedChart?.refOpen ?? null });
    setIsChartLoading(!cachedChart);
    setChartError(false);
  }, [currency, selectedInterval]);

  // Fetch real-time price independently
  usePolling(
    async (signal) => {
      try {
        const product = currency === 'USD' ? 'BTC-USD' : 'BTC-EUR';
        const json = await fetchJson(`https://api.coinbase.com/v2/prices/${product}/spot`, signal);
        const price = parseFloat(json?.data?.amount);
        if (signal.aborted) return;
        if (!isValidNumber(price) || price <= 0) throw new Error('Ungültiger Preis');
        const ts = Date.now();
        setPriceState({ price, ts, offline: false });
        writeCache(priceKey(currency), { price, ts });
      } catch (err) {
        if (signal.aborted) return;
        console.warn('Live-Preis nicht verfügbar, zeige letzten bekannten Wert', err);
        // Keep the last known price; only flag it as stale.
        setPriceState((prev) => ({ ...prev, offline: true }));
      }
    },
    10_000,
    [currency]
  );

  // Fetch chart data when selectedInterval or currency changes
  usePolling(
    async (signal) => {
      const { binanceInterval, limit, formatLabel } = INTERVAL_CONFIG[selectedInterval];
      const symbol = currency === 'USD' ? 'BTCUSDT' : 'BTCEUR';
      try {
        const data = await fetchJson(
          `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${binanceInterval}&limit=${limit}`,
          signal
        );
        if (signal.aborted) return;
        if (!Array.isArray(data) || data.length === 0) throw new Error('Keine Chartdaten');

        const points: ChartPoint[] = data.map((item: any) => ({
          time: formatLabel(new Date(item[0])),
          price: Math.round(parseFloat(item[4])), // close price
        }));
        const refOpen = parseFloat(data[0][1]); // open price of the first candle
        if (!isValidNumber(refOpen) || points.some((p) => !isValidNumber(p.price))) {
          throw new Error('Ungültige Chartdaten');
        }

        setChartState({ points, refOpen });
        setChartError(false);
        writeCache(chartKey(currency, selectedInterval), { points, refOpen, ts: Date.now() });
      } catch (err) {
        if (signal.aborted) return;
        console.warn('Chartdaten nicht verfügbar, zeige letzten bekannten Stand', err);
        setChartError(true);
      } finally {
        if (!signal.aborted) setIsChartLoading(false);
      }
    },
    60_000,
    [selectedInterval, currency]
  );

  // Bitcoin only quote scrolling logic
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState<number>(0);

  useEffect(() => {
    let armed = true; // armed to pick a new quote on bottom scroll
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      
      const distanceToBottom = scrollHeight - clientHeight - scrollTop;

      // When the user is within 75px of the absolute bottom
      if (distanceToBottom < 75) {
        if (armed) {
          setCurrentQuoteIndex((prev) => {
            const nextIndex = Math.floor(Math.random() * btcQuotes.length);
            // avoid showing the same quote twice in a row
            if (nextIndex === prev && btcQuotes.length > 1) {
              return (nextIndex + 1) % btcQuotes.length;
            }
            return nextIndex;
          });
          armed = false; // disarm until user scrolls up significantly
        }
      } else if (distanceToBottom > 220) {
        // When they scroll up significantly
        armed = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="px-3 space-y-8 pb-10">
      {/* Live Market Price Widget */}
      <section className="space-y-2">
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              {!priceState.offline && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
              )}
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${priceState.offline ? 'bg-on-surface-variant' : 'bg-secondary'}`}></span>
            </span>
            <span className="font-body text-[10px] text-secondary tracking-widest uppercase font-bold">
              {priceState.offline
                ? `Offline • Stand ${formatTime(priceState.ts)} • BTC/${currency}`
                : `Live Bitcoin Kurs • BTC/${currency}`}
            </span>
          </div>

          {/* High polished USD / EUR Switcher */}
          <div className="flex items-center gap-0.5 bg-[#1a1a1a] border border-outline-variant/15 p-0.5 rounded-full shadow-inner/40">
            {(['USD', 'EUR'] as const).map((cur) => (
              <button
                key={cur}
                onClick={() => setCurrency(cur)}
                className={`px-3 py-1 text-[10px] uppercase tracking-wider font-extrabold rounded-full transition-all duration-200 cursor-pointer ${
                  currency === cur
                    ? 'bg-teal text-[#151515] shadow-sm font-black'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container/40'
                }`}
              >
                {cur}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex items-baseline gap-3">
          <h1 className="font-headline font-extrabold text-[3.2rem] leading-none tracking-tighter text-on-surface">
            {currency === 'USD' ? '$' : '€'}
            {currentPrice !== null
              ? currentPrice.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
              : '–'}
          </h1>
          
          {priceChangePercent !== null && (
          <div className="flex items-center">
            <span className={`font-body font-bold text-xs px-2.5 py-1 rounded-full flex items-center shrink-0 ${
              priceChangePercent >= 0 
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
            }`}>
              {priceChangePercent >= 0 ? (
                <TrendingUp size={13} className="mr-1 shrink-0" />
              ) : (
                <TrendingDown size={13} className="mr-1 shrink-0" />
              )}
              {priceChangePercent >= 0 ? '+' : ''}
              {priceChangePercent.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
            </span>
          </div>
          )}
        </div>
      </section>

      {/* Live Chart Container */}
      <div className="w-full h-64 bg-[#1a1a1a] border border-outline-variant/10 rounded-2xl relative overflow-hidden p-3 flex flex-col justify-between">
        <div className="flex justify-end z-10 font-body text-xs">
          <div className="flex items-center gap-1 bg-surface-container-high/60 backdrop-blur border border-outline-variant/15 p-1 rounded-xl">
            {[
              { id: '24h', label: '24h' },
              { id: '7T', label: '7T' },
              { id: '30T', label: '30T' },
              { id: '1J', label: '1J' },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => setSelectedInterval(opt.id)}
                className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all duration-200 cursor-pointer ${
                  selectedInterval === opt.id
                    ? 'bg-teal text-[#151515] shadow-md scale-105'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container/60'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {isChartLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-[#151515]/60 backdrop-blur-sm z-20">
            <div className="flex flex-col items-center gap-2 text-on-surface-variant text-xs">
              <Loader className="animate-spin text-secondary" size={20} />
              <span>Analysiere Marktdaten...</span>
            </div>
          </div>
        ) : chartData.length === 0 && chartError ? (
          <div className="absolute inset-0 flex items-center justify-center z-10 text-on-surface-variant text-xs">
            Keine Chartdaten verfügbar
          </div>
        ) : null}

        <div className="h-36 w-full mt-4 -mx-5 -mb-5 relative" ref={containerRef}>
          {isMounted && containerSize.width > 0 ? (
            <ResponsiveContainer width={containerSize.width} height={144}>
              <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-secondary)" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="var(--color-tertiary)" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" hide={true} />
                <YAxis domain={['auto', 'auto']} hide={true} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--color-surface-container)', 
                    borderColor: 'rgba(247,147,26,0.15)',
                    borderRadius: '12px',
                    color: 'var(--color-on-surface)',
                    fontFamily: 'var(--font-body)',
                    fontSize: '11px',
                  }}
                  formatter={(value: any) => [
                    `${currency === 'USD' ? '$' : '€'}${Number(value).toLocaleString('de-DE')}`, 
                    `BTC/${currency}`
                  ]}
                />
                <Area 
                  type="monotone" 
                  dataKey="price" 
                  stroke="var(--color-secondary)" 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#chartGradient)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full w-full bg-transparent" />
          )}
        </div>
      </div>

      {/* Live-Briefing & Netzwerkstatus Section */}
      <section className="bg-surface-container-low border border-outline-variant/10 rounded-2xl p-3 space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal"></span>
            </span>
            <div className="flex items-center gap-1.5 text-on-surface">
              <Newspaper size={18} className="text-teal" />
              <h3 className="font-headline font-black text-[13px] tracking-wider uppercase">
                Mempool
              </h3>
            </div>
          </div>
          
          <button 
            onClick={handleManualRefreshLive}
            disabled={isRefreshingLive}
            className="flex items-center gap-1 text-[9px] uppercase tracking-wider font-extrabold text-on-surface-variant hover:text-teal active:scale-95 transition-all cursor-pointer select-none"
            title="Daten aktualisieren"
          >
            <RefreshCw size={11} className={isRefreshingLive ? "animate-spin text-teal" : ""} />
            <span>Aktualisieren</span>
          </button>
        </div>

        {/* Live brief widgets grid */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Fee Widget */}
          <div className="bg-[#151515] p-3 rounded-xl border border-outline-variant/5">
            <span className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold flex items-center gap-1">
              <Zap size={11} className="text-[#F7931A]" /> Mempool-Gebühr
            </span>
            <div className="flex items-baseline gap-1 mt-1.5">
              <span className="font-headline font-extrabold text-xl text-on-surface">{liveInfo.mempoolFee ?? '–'}</span>
              <span className="text-[11px] text-[#F7931A] font-semibold">sat/vB</span>
            </div>
            <span className={`text-[9px] uppercase font-bold block mt-1 ${feeLevel(liveInfo.mempoolFee).className}`}>
              • {feeLevel(liveInfo.mempoolFee).label}
            </span>
          </div>

          {/* Hashrate Widget */}
          <div className="bg-[#151515] p-3 rounded-xl border border-outline-variant/5">
            <span className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold flex items-center gap-1">
              <Cpu size={11} className="text-teal" /> Netzwerk-Hashrate
            </span>
            <div className="flex items-baseline gap-1 mt-1.5">
              <span className="font-headline font-extrabold text-xl text-on-surface">{liveInfo.hashrate !== null ? liveInfo.hashrate.toLocaleString('de-DE') : '–'}</span>
              <span className="text-[11px] text-teal font-semibold">EH/s</span>
            </div>
            <span className="text-[9px] uppercase text-teal font-extrabold block mt-1">
              • Globale Rechenleistung
            </span>
          </div>

          {/* Block Widget */}
          <div className="bg-[#151515] p-3 rounded-xl border border-outline-variant/5">
            <span className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold flex items-center gap-1">
              <Database size={11} className="text-teal" /> Letzter Block
            </span>
            <div className="flex items-baseline gap-1 mt-1.5">
              <span className="font-headline font-bold text-lg text-on-surface">{liveInfo.blockHeight !== null ? `#${liveInfo.blockHeight}` : '–'}</span>
            </div>
            <span className="text-[9px] uppercase text-on-surface-variant block mt-1 pb-0.5">
              Stand: {formatTime(liveInfo.lastUpdated)}
            </span>
          </div>

          {/* Miner Node status */}
          <div className="bg-[#151515] p-3 rounded-xl border border-outline-variant/5">
            <span className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold flex items-center gap-1">
              <Activity size={11} className="text-[#F7931A]" /> Unbestätigt
            </span>
            <div className="flex items-baseline gap-1 mt-1.5">
              <span className="font-headline font-extrabold text-xl text-white">{liveInfo.unconfirmedTx !== null ? liveInfo.unconfirmedTx.toLocaleString('de-DE') : '–'}</span>
              <span className="text-[11px] text-[#F7931A] font-semibold">TX</span>
            </div>
            <span className="text-[9px] uppercase text-on-surface-variant font-bold block mt-1">
              • TX im Mempool
            </span>
          </div>
        </div>


      </section>

      {/* Für Einsteiger Section */}
      <section className="space-y-5">
        <div className="flex items-center gap-2 px-1">
          <span className="text-base">📚</span>
          <h2 className="font-headline font-extrabold text-2xl text-on-surface tracking-tight">
            Für Einsteiger
          </h2>
        </div>

        <div className="space-y-3">
          {einsteigerEntries.map((entry, index) => {
            if (entry.type === 'dropdown') {
              return (
                <div 
                  key={index} 
                  className="bg-surface-container-low border border-outline-variant/10 hover:border-outline-variant/20 rounded-2xl overflow-hidden transition-all duration-300 shadow-sm"
                >
                  <button 
                    id={`entry-btn-${index}`}
                    onClick={() => setIsAdoptionOpen(!isAdoptionOpen)}
                    className="w-full text-left p-3 flex items-center justify-between gap-4 bg-surface-container/30 transition-colors hover:bg-surface-container/60 cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-surface-container-high border border-outline-variant/10 flex items-center justify-center text-lg shadow-inner">
                        {entry.icon}
                      </div>
                      <div className="space-y-0.5">
                        <h3 className="font-headline font-bold text-sm text-on-surface leading-snug">
                          {entry.title}
                        </h3>
                        <p className="text-[11px] text-on-surface-variant font-medium">
                          {entry.sub}
                        </p>
                      </div>
                    </div>
                    <div>
                      {isAdoptionOpen ? (
                        <ChevronUp size={18} className="text-teal transition-transform duration-300" />
                      ) : (
                        <ChevronDown size={18} className="text-on-surface-variant transition-transform duration-300" />
                      )}
                    </div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isAdoptionOpen && (
                      <motion.div
                        id="adoption-dropdown-container"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden bg-surface-container/10"
                      >
                        <div className="p-3 border-t border-outline-variant/5">
                          <img 
                            src={adoptionImageBase64} 
                            alt="5 Phasen der Bitcoin-Adoption" 
                            className="w-full rounded-xl border border-outline-variant/10 bg-surface-container-high/45 select-none shadow"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            } else {
              return (
                <a 
                  key={index}
                  href={entry.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-surface-container-low border border-outline-variant/10 hover:border-outline-variant/25 rounded-2xl p-3 flex items-center justify-between gap-4 transition-all duration-250 hover:translate-x-0.5"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-surface-container-high border border-outline-variant/10 flex items-center justify-center text-lg shadow-inner">
                      {entry.icon}
                    </div>
                    <div className="space-y-0.5">
                      <h3 className="font-headline font-bold text-sm text-on-surface leading-snug">
                        {entry.title}
                      </h3>
                      <p className="text-[11px] text-on-surface-variant font-medium">
                        {entry.sub}
                      </p>
                    </div>
                  </div>
                  <div>
                    <ArrowUpRight size={16} className="text-teal opacity-65 hover:opacity-100 transition-opacity animate-pulse" />
                  </div>
                </a>
              );
            }
          })}
        </div>
      </section>

      {/* Dynamic Bitcoin-Only Quote Section at bottom */}
      <section className="pt-6 pb-2 mt-2 border-t border-outline-variant/10 flex flex-col items-center justify-center text-center px-2 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        
        {/* Quote symbol */}
        <span className="text-3xl font-logo text-primary/10 select-none leading-none mb-1">“</span>
        
        <div className="min-h-[90px] flex flex-col justify-center max-w-sm">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuoteIndex}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="space-y-3"
            >
              <p className="font-headline text-on-surface/90 text-sm leading-relaxed tracking-wider italic select-none">
                {btcQuotes[currentQuoteIndex].text}
              </p>
              <div className="flex items-center justify-center gap-2">
                <span className="w-1.5 h-[1px] bg-primary/30" />
                <span className="font-mono text-[9px] uppercase tracking-widest text-primary font-bold">
                  {btcQuotes[currentQuoteIndex].author}
                </span>
                <span className="w-1.5 h-[1px] bg-primary/30" />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dynamic Indicator Dots to reflect page scrolled state / active trigger */}
        <div className="flex gap-1.5 mt-4 justify-center items-center opacity-30 hover:opacity-75 transition-opacity">
          {btcQuotes.map((_, dotIdx) => (
            <button
              key={dotIdx}
              onClick={() => setCurrentQuoteIndex(dotIdx)}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                dotIdx === currentQuoteIndex ? 'w-4.5 bg-primary' : 'w-1.5 bg-[#444]'
              }`}
              title={`Quote ${dotIdx + 1}`}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
