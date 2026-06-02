import React from 'react';
import { Youtube, ArrowUpRight, Shield, Timer, LineChart, Calendar, TrendingUp, Activity } from 'lucide-react';

interface Indicator {
  name: string;
  desc: string;
  url: string;
  icon: React.ReactNode;
}

const indicators: Indicator[] = [
  {
    name: "Long-Term Holder Realized Price",
    desc: "Dieser Indikator zeigt den durchschnittlichen Einstandspreis von Anlegern, die ihre Bitcoins ununterbrochen für einen längeren Zeitraum halten.",
    url: "https://www.bitcoinmagazinepro.com/charts/long-term-holder-realized-price/",
    icon: <Shield size={18} className="text-teal flex-shrink-0" />
  },
  {
    name: "Short-Term Holder MVRV",
    desc: "Dieser Indikator bewertet die Profitabilität von kurzfristigen Marktteilnehmern, indem er den aktuellen Bitcoin-Preis mit deren durchschnittlichen Anschaffungskosten vergleicht.",
    url: "https://charts.checkonchain.com/btconchain/unrealised/sthmvrv_indicator/sthmvrv_indicator_light.html",
    icon: <Timer size={18} className="text-teal flex-shrink-0" />
  },
  {
    name: "Bitcoin Power Law",
    desc: "Dieses mathematische Modell veranschaulicht den langfristigen, nichtlinearen Wachstumstrend des Bitcoin-Preises im zeitlichen Verlauf.",
    url: "https://www.bitcoinmagazinepro.com/charts/bitcoin-power-law/",
    icon: <LineChart size={18} className="text-teal flex-shrink-0" />
  },
  {
    name: "200-Wochen Moving Average",
    desc: "Dieser Indikator berechnet den gleitenden Durchschnitt des Bitcoin-Preises über die letzten 200 Wochen und dient als bewährtes Maß für den langfristigen Markttrend.",
    url: "https://www.bitcoinmagazinepro.com/charts/200-week-moving-average-heatmap/",
    icon: <Calendar size={18} className="text-teal flex-shrink-0" />
  },
  {
    name: "NUPL (Net Unrealized Profit/Loss)",
    desc: "Dieser Indikator misst die Summe der nicht realisierten Gewinne und Verluste aller umlaufenden Einheiten, um die psychologische Marktphase des gesamten Bitcoin-Netzwerks zu bestimmen.",
    url: "https://www.bitcoinmagazinepro.com/charts/relative-unrealized-profit--loss/",
    icon: <TrendingUp size={18} className="text-teal flex-shrink-0" />
  },
  {
    name: "Bitcoin Root-Scale Cycle Chart",
    desc: "Dieses Chart-Modell stellt die historische Preisentwicklung auf einer mathematischen Wurzelskala dar, um das zyklische Kauf- und Verkaufsinteresse über mehrere Halving-Epochen hinweg zu veranschaulichen.",
    url: "https://bitcoinwave.net/#RootChart",
    icon: <Activity size={18} className="text-teal flex-shrink-0" />
  }
];

export default function Analysis() {
  return (
    <div className="px-3 space-y-8 pb-10">
      {/* Title Section */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-teal"></span>
          </span>
          <span className="font-body text-[10px] text-teal tracking-widest uppercase font-bold">
            Live-Analyse • Bitcoin-Netzwerkdaten
          </span>
        </div>
        
        <div>
          <h2 className="font-headline font-extrabold text-4xl text-on-surface tracking-tight leading-tight">
            Bitcoin Indikatoren
          </h2>
        </div>
      </section>

      {/* Main Indicators List */}
      <section className="space-y-6">
        {indicators.map((indicator, index) => {
          const borderClass = 'hover:border-teal/30';
          const arrowColorClass = 'text-teal';

          return (
            <div 
              key={index} 
              className={`bg-[#1a1a1a] border border-outline-variant/10 rounded-2xl overflow-hidden transition-all duration-300 ${borderClass} hover:shadow-lg`}
            >
              {/* Header with Name & Icon */}
              <div className="px-3 pt-4.5 pb-1 flex items-center gap-2.5">
                {indicator.icon}
                <span className={`font-headline font-bold text-base text-on-surface leading-snug`}>
                  {indicator.name}
                </span>
              </div>

              {/* Body Description & Link Button */}
              <div className="px-3 pb-4.5 pt-1 flex flex-col gap-3.5">
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  {indicator.desc}
                </p>

                <a 
                  href={indicator.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="self-start inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-[11px] font-bold rounded-xl transition-all hover:translate-x-0.5 active:scale-95 border border-outline-variant/15"
                >
                  <span>📊 Chart aufrufen</span>
                  <ArrowUpRight size={12} className={arrowColorClass} />
                </a>
              </div>
            </div>
          );
        })}
      </section>

      {/* External Additional Resources Section */}
      <section className="bg-[#1a1a1a] border border-outline-variant/10 rounded-2xl overflow-hidden transition-all duration-300 hover:border-teal/30 hover:shadow-lg">
        {/* Header with Name & Icon */}
        <div className="px-3 pt-4.5 pb-1 flex items-center gap-2.5">
          <Youtube size={18} className="text-teal flex-shrink-0" />
          <span className="font-headline font-bold text-base text-on-surface leading-snug">
            Weitere Daten &amp; Chart-Analysen
          </span>
        </div>

        {/* Body Description & Link Button */}
        <div className="px-3 pb-4.5 pt-1 flex flex-col gap-3.5">
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Langfristige Prognosen im zeitlichen Kontext. Umfangreiche Modellrechnungen, logarithmische Kurvenvergleiche und spannende Analysen, die tiefgehender an die regulären mathematischen Indikatoren heranreichen.
          </p>

          <a 
            href="https://www.youtube.com/@WalletGreat"
            target="_blank"
            rel="noopener noreferrer"
            className="self-start inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-[11px] font-bold rounded-xl transition-all hover:translate-x-0.5 active:scale-95 border border-outline-variant/15"
          >
            <span>▶ WalletGreat auf YouTube ansehen</span>
            <ArrowUpRight size={12} className="text-teal" />
          </a>
        </div>
      </section>
    </div>
  );
}
