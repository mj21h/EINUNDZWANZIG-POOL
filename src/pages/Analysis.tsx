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
    desc: "Durchschnittlicher Einstandspreis der Langzeit-Investoren (>155 Tage). Feb-Tief ($60.062, 06.02.) berührte die Kostenbasis und hielt – BTC notiert nun bei ~$79K. LTH-Supply steigt am aktuellen Rand deutlich; Exchange-Abflüsse 41.000 BTC in 30 Tagen (~$3,5 Mrd.).",
    url: "https://www.bitcoinmagazinepro.com/charts/long-term-holder-realized-price/",
    icon: <Shield size={18} className="text-teal flex-shrink-0" />
  },
  {
    name: "Short-Term Holder MVRV",
    desc: "Vergleicht den aktuellen Bitcoin-Preis mit dem durchschnittlichen Einstandspreis von Kurzzeit-Investoren (<155 Tage). BTC notiert nach der jüngsten Aufwärtsbewegung über dieser durchschnittlichen Kostenbasis, während das rückläufige Handelsvolumen und die Coinbase Premium auf eine ausgeglichene Marktstimmung hinweisen.",
    url: "https://charts.checkonchain.com/btconchain/unrealised/sthmvrv_indicator/sthmvrv_indicator_light.html",
    icon: <Timer size={18} className="text-teal flex-shrink-0" />
  },
  {
    name: "Bitcoin Power Law",
    desc: "Zeigt langfristig, wie der BTC-Preis mit der Zeit wächst. BTC bei ~$79K bewegt sich an der Obergrenze der Power-Law-Akkumulationszone (~$65K–$80K). Historisch attraktiv, aber nicht mehr so tief wie beim Feb-Tief – Hauptkapital zurückhalten.",
    url: "https://www.bitcoinmagazinepro.com/charts/bitcoin-power-law/",
    icon: <LineChart size={18} className="text-teal flex-shrink-0" />
  },
  {
    name: "200-Wochen Moving Average",
    desc: "Durchschnittlicher BTC-Preis der letzten 200 Wochen (~4 Jahre). 200-WMA aktuell bei ~$51.747. BTC notiert bei ~$79K – ~53 % darüber. Das Feb-Tief ($60K) hielt deutlich oberhalb der Kostenbasis, was eine intakte langfristige Bodenbildung anzeigt.",
    url: "https://www.bitcoinmagazinepro.com/charts/200-week-moving-average-heatmap/",
    icon: <Calendar size={18} className="text-teal flex-shrink-0" />
  },
  {
    name: "NUPL (Net Unrealized Profit/Loss)",
    desc: "Misst das Verhältnis der nicht realisierten Marktwerte aller umlaufenden Bitcoins. Der Indikator verbleibt historisch in einer gesunden Zone des Marktaufbaus, was auf eine stabile Konsolidierung ohne übermäßige Hitze hindeutet.",
    url: "https://www.bitcoinmagazinepro.com/charts/relative-unrealized-profit--loss/",
    icon: <TrendingUp size={18} className="text-teal flex-shrink-0" />
  },
  {
    name: "Bitcoin Root-Scale Cycle Chart",
    desc: "Zeigt den BTC-Preis langfristig auf einer Wurzel-Skala mit mathematischem Fokus; der RSI verbleibt in einer historisch aussichtsreichen Zone mit Potenzial nach oben. Allokationen sollten den langfristigen Zyklus berücksichtigen.",
    url: "https://bitcoinwave.net/#RootChart",
    icon: <Activity size={18} className="text-teal flex-shrink-0" />
  }
];

export default function Analysis() {
  return (
    <div className="px-6 space-y-8 pb-10">
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
              <div className="px-5 pt-4.5 pb-1 flex items-center gap-2.5">
                {indicator.icon}
                <span className={`font-headline font-bold text-base text-on-surface leading-snug`}>
                  {indicator.name}
                </span>
              </div>

              {/* Body Description & Link Button */}
              <div className="px-5 pb-4.5 pt-1 flex flex-col gap-3.5">
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
        <div className="px-5 pt-4.5 pb-1 flex items-center gap-2.5">
          <Youtube size={18} className="text-teal flex-shrink-0" />
          <span className="font-headline font-bold text-base text-on-surface leading-snug">
            Weitere Daten &amp; Chart-Analysen
          </span>
        </div>

        {/* Body Description & Link Button */}
        <div className="px-5 pb-4.5 pt-1 flex flex-col gap-3.5">
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
