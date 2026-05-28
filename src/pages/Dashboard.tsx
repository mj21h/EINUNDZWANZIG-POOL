import React, { useState, useEffect } from 'react';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, ArrowUpRight, ChevronDown, ChevronUp, Loader } from 'lucide-react';
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

// Fallback deterministic chart points in case API gets blocked
const generateMockChartData = (basePrice: number, intervalLabel: string): ChartPoint[] => {
  const data: ChartPoint[] = [];
  const now = new Date();
  
  if (intervalLabel === '24h') {
    for (let i = 23; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60 * 60 * 1000);
      const hourStr = time.getHours().toString().padStart(2, '0') + ':00';
      const seed = Math.sin(i * 0.5) * 450 + Math.cos(i * 0.8) * 200;
      data.push({
        time: hourStr,
        price: Math.round(basePrice - (i * 80) + seed),
      });
    }
  } else if (intervalLabel === '7T') {
    for (let i = 41; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 4 * 60 * 60 * 1000);
      const label = time.toLocaleDateString('de-DE', { weekday: 'short' }) + ' ' + time.getHours() + 'h';
      const seed = Math.sin(i * 0.3) * 800 + Math.cos(i * 0.5) * 400;
      data.push({
        time: label,
        price: Math.round(basePrice - (i * 120) + seed),
      });
    }
  } else if (intervalLabel === '30T') {
    for (let i = 29; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const label = time.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
      const seed = Math.sin(i * 0.2) * 1500 + Math.cos(i * 0.4) * 800;
      data.push({
        time: label,
        price: Math.round(basePrice - (i * 300) + seed),
      });
    }
  } else if (intervalLabel === '1J') {
    for (let i = 51; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const label = time.toLocaleDateString('de-DE', { month: 'short' });
      const seed = Math.sin(i * 0.1) * 6000 + Math.cos(i * 0.2) * 2500;
      data.push({
        time: label,
        price: Math.round(basePrice - (i * 800) + seed),
      });
    }
  }
  return data;
};

export default function Dashboard() {
  const [currency, setCurrency] = useState<'USD' | 'EUR'>('USD');
  const [currentPrice, setCurrentPrice] = useState<number>(79240);
  const [priceChangePercent, setPriceChangePercent] = useState<number>(2.45);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [isChartLoading, setIsChartLoading] = useState<boolean>(true);
  const [isAdoptionOpen, setIsAdoptionOpen] = useState<boolean>(false);
  const [selectedInterval, setSelectedInterval] = useState<string>('24h');
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({ width: 0, height: 144 });
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

  // Fetch real-time price independently
  useEffect(() => {
    const fetchLivePrice = async () => {
      try {
        const product = currency === 'USD' ? 'BTC-USD' : 'BTC-EUR';
        const response = await fetch(`https://api.coinbase.com/v2/prices/${product}/spot`);
        if (!response.ok) throw new Error('Failed to fetch price');
        const json = await response.json();
        const price = parseFloat(json.data.amount);
        if (!isNaN(price)) {
          setCurrentPrice(price);
        }
      } catch (err) {
        console.warn('Could not fetch live price, using estimate', err);
        // Sensible estimates
        setCurrentPrice(currency === 'USD' ? 79240 : 73510);
      }
    };

    fetchLivePrice();
    const priceInterval = setInterval(fetchLivePrice, 10000);
    return () => clearInterval(priceInterval);
  }, [currency]);

  // Fetch chart data when selectedInterval or currency changes
  useEffect(() => {
    const fetchChartData = async () => {
      try {
        setIsChartLoading(true);
        let binanceInterval = '1h';
        let limit = 24;
        let formatLabel = (d: Date) => d.getHours().toString().padStart(2, '0') + ':00';

        if (selectedInterval === '7T') {
          binanceInterval = '4h';
          limit = 42;
          formatLabel = (d: Date) => d.toLocaleDateString('de-DE', { weekday: 'short' }) + ' ' + d.getHours() + 'h';
        } else if (selectedInterval === '30T') {
          binanceInterval = '1d';
          limit = 30;
          formatLabel = (d: Date) => d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
        } else if (selectedInterval === '1J') {
          binanceInterval = '1w';
          limit = 52;
          formatLabel = (d: Date) => d.toLocaleDateString('de-DE', { month: 'short' });
        }

        const symbol = currency === 'USD' ? 'BTCUSDT' : 'BTCEUR';
        const response = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${binanceInterval}&limit=${limit}`);
        if (!response.ok) throw new Error('Failed to fetch chart data');
        const data = await response.json();
        
        const points: ChartPoint[] = data.map((item: any) => {
          const time = new Date(item[0]);
          return {
            time: formatLabel(time),
            price: Math.round(parseFloat(item[4])) // close price
          };
        });

        if (points && points.length > 0) {
          setChartData(points);
          // Calculate exact change for this interval
          const initialPrice = points[0].price;
          const finalPrice = points[points.length - 1].price;
          const calculatedChange = ((finalPrice - initialPrice) / initialPrice) * 100;
          setPriceChangePercent(calculatedChange);
        } else {
          throw new Error('No points mapped');
        }
      } catch (err) {
        console.warn('CORS or API issue for chart, generating fallback stream.', err);
        // Fallback to organic mock data
        const fallback = generateMockChartData(currentPrice || (currency === 'USD' ? 79240 : 73510), selectedInterval);
        setChartData(fallback);
        
        if (selectedInterval === '24h') setPriceChangePercent(2.45);
        else if (selectedInterval === '7T') setPriceChangePercent(-1.12);
        else if (selectedInterval === '30T') setPriceChangePercent(12.34);
        else if (selectedInterval === '1J') setPriceChangePercent(118.41);
      } finally {
        setIsChartLoading(false);
      }
    };

    fetchChartData();
    const intervalId = setInterval(fetchChartData, 60000);
    return () => clearInterval(intervalId);
  }, [selectedInterval, currency]);

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
    <div className="px-6 space-y-8 pb-10">
      {/* Live Market Price Widget */}
      <section className="space-y-2">
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-secondary"></span>
            </span>
            <span className="font-body text-[10px] text-secondary tracking-widest uppercase font-bold">
              Live Bitcoin Kurs • BTC/{currency}
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
            {currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h1>
          
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
              {priceChangePercent.toFixed(2)}%
            </span>
          </div>
        </div>
      </section>

      {/* Live Chart Container */}
      <div className="w-full h-64 bg-[#1a1a1a] border border-outline-variant/10 rounded-2xl relative overflow-hidden p-5 flex flex-col justify-between">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 z-10 font-body text-xs">
          <span className="bg-surface-container/85 backdrop-blur border border-outline-variant/15 px-3 py-1.5 rounded-xl font-bold text-on-surface tracking-wide shrink-0">
            {selectedInterval === '24h' && `24h Preisverlauf (${currency})`}
            {selectedInterval === '7T' && `7 Tage Preisverlauf (${currency})`}
            {selectedInterval === '30T' && `30 Tage Preisverlauf (${currency})`}
            {selectedInterval === '1J' && `1 Jahr Preisverlauf (${currency})`}
          </span>
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
                    `${currency === 'USD' ? '$' : '€'}${Number(value).toLocaleString()}`, 
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
                    className="w-full text-left p-4 flex items-center justify-between gap-4 bg-surface-container/30 transition-colors hover:bg-surface-container/60 cursor-pointer"
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
                        <div className="p-4 border-t border-outline-variant/5">
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
                  className="block bg-surface-container-low border border-outline-variant/10 hover:border-outline-variant/25 rounded-2xl p-4 flex items-center justify-between gap-4 transition-all duration-250 hover:translate-x-0.5"
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
      <section className="pt-12 pb-14 mt-6 border-t border-outline-variant/10 flex flex-col items-center justify-center text-center px-4 relative overflow-hidden">
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
        <div className="flex gap-1.5 mt-8 justify-center items-center opacity-30 hover:opacity-75 transition-opacity">
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
