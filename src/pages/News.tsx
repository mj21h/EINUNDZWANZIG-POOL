import React, { useState, useEffect } from 'react';
import { RefreshCw, ExternalLink, Clock, Newspaper, Loader } from 'lucide-react';

interface NewsItem {

  id: string;
  title: string;
  link: string;
  pubDate: string;
  description: string;
  imageUrl: string;
}

export default function News() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchNews = async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      // Direct client-side fetch via rss2json
      const rssUrl = encodeURIComponent("https://www.blocktrainer.de/feed/");
      const cacheBuster = isManualRefresh ? `&_=${Date.now()}` : '';
      const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${rssUrl}${cacheBuster}`);
      
      if (!response.ok) {
        throw new Error(`Fehler beim Laden (${response.status})`);
      }
      const data = await response.json();
      
      if (data && data.status === "ok" && Array.isArray(data.items)) {
        const parsedItems = data.items.slice(0, 5).map((item: any, idx: number) => {
          let parsedDesc = (item.description || item.content || "").replace(/<\/?[^>]+(>|$)/g, "").trim();
          if (parsedDesc.length > 200) parsedDesc = parsedDesc.substring(0, 197) + "...";
          
          let imageUrl = item.thumbnail || "";
          if (!imageUrl && item.enclosure && item.enclosure.link) imageUrl = item.enclosure.link;
          const fallbackImages = [
            "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?q=80&w=800",
            "https://images.unsplash.com/photo-1621761191319-c6fb62004040?q=80&w=800"
          ];
          
          return {
            id: String(idx),
            title: item.title,
            link: item.link,
            pubDate: item.pubDate,
            description: parsedDesc,
            imageUrl: imageUrl || fallbackImages[idx % fallbackImages.length]
          };
        });
        setItems(parsedItems);
      } else {
        throw new Error('Ungültiges Datenformat erhalten');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Die Blocktrainer-News konnten nicht geladen werden.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNews();
    
    // Auto refresh every 10 minutes when tab/page is active
    const pollInterval = setInterval(() => {
      fetchNews();
    }, 10 * 60 * 1000);
    
    return () => clearInterval(pollInterval);
  }, []);

  function formatRelativeDate(dateStr: string) {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      
      // Handle slight clock mismatch skew (future dates)
      if (diffMs < 0) return "Gerade eben";
      
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 60) {
        return diffMins <= 1 ? "Gerade eben" : `Vor ${diffMins} Min.`;
      }
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) {
        return `Vor ${diffHours} Std.`;
      }
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return "Gestern";
      return d.toLocaleDateString("de-DE", { day: "numeric", month: "long" });
    } catch (e) {
      return dateStr;
    }
  }

  // Slice news items: 1st is hero, remaining are list items
  const heroItem = items[0];
  const listItems = items.slice(1);

  return (
    <div className="px-3 space-y-8">
      {/* Tracker Status Line */}
      <div className="flex justify-between items-center bg-[#1a1a1a]/50 px-3 py-2 rounded-full w-full">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-teal"></span>
          </span>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-teal">
            Blocktrainer RSS Feed
          </span>
        </div>
        <button 
          onClick={() => fetchNews(true)}
          disabled={loading || refreshing}
          className="text-teal hover:text-[#ffb353] p-1 rounded-full hover:bg-surface-container transition-all active:rotate-45 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
          title="News aktualisieren"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          <span className="text-[9px] font-bold uppercase tracking-wider">Aktualisieren</span>
        </button>
      </div>

      <div>
        <h2 className="font-headline font-extrabold text-3xl tracking-tight text-on-surface mb-2">
          Bitcoin News
        </h2>
        <p className="font-body text-on-surface-variant text-sm">
          Die aktuellsten Artikel und Analysen direkt vom größten deutschen Bitcoin-Portal.
        </p>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader size={32} className="text-teal animate-spin" />
          <p className="text-xs text-on-surface-variant uppercase tracking-widest font-bold">
            Lade News...
          </p>
        </div>
      )}

      {error && !loading && (
        <div className="bg-error/10 border border-error/20 rounded-2xl p-3 text-center space-y-4">
          <p className="text-sm text-error font-medium">{error}</p>
          <button
            onClick={() => fetchNews()}
            className="px-3 py-2.5 bg-teal text-background text-xs font-bold uppercase tracking-widest rounded-xl hover:opacity-90 active:scale-95 transition-all cursor-pointer"
          >
            Erneut versuchen
          </button>
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="bg-surface-container rounded-2xl p-10 text-center space-y-2">
          <Newspaper className="mx-auto text-on-surface-variant/40" size={40} />
          <h4 className="font-headline font-bold text-lg text-on-surface">Keine News verfügbar</h4>
          <p className="text-xs text-on-surface-variant font-body">
            Der RSS-Feed ist im Moment leer oder konnte nicht verarbeitet werden.
          </p>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="space-y-8 pb-4">
          {/* Herocard for the newest article */}
          {heroItem && (
            <a 
              href={heroItem.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group block bg-[#1a1a1a]/40 rounded-2xl overflow-hidden border border-surface-variant/25 hover:border-teal/45 hover:shadow-[0_12px_24px_rgba(247,147,26,0.15)] transition-all duration-300"
            >
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-surface-container">
                <img 
                  src={heroItem.imageUrl} 
                  className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500" 
                  alt={heroItem.title}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    // fall back quietly to premium stock asset if image fails to load (eg. CORS referrers)
                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?q=80&w=800";
                  }}
                />
                <div className="absolute top-4 left-4 bg-teal/20 backdrop-blur-md border border-teal/45 px-3 py-1 rounded-full shadow-[0_4px_12px_rgba(247,147,26,0.25)] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse" />
                  <span className="text-[9px] font-black text-teal uppercase tracking-widest">Neueste</span>
                </div>
              </div>
              <div className="p-3 space-y-3">
                <div className="flex gap-2.5 items-center text-xs text-on-surface-variant/85 font-body">
                  <span className="text-[10px] font-extrabold text-teal tracking-widest uppercase">
                    Blocktrainer.de
                  </span>
                  <div className="w-1 h-1 rounded-full bg-teal/40"></div>
                  <div className="flex items-center gap-1">
                    <Clock size={12} className="text-teal/70" />
                    <span className="text-[10px] font-semibold text-teal">
                      {formatRelativeDate(heroItem.pubDate)}
                    </span>
                  </div>
                </div>
                <h3 className="font-headline font-black text-xl leading-snug text-on-surface group-hover:text-teal transition-colors duration-300">
                  {heroItem.title}
                </h3>
                <p className="text-on-surface-variant text-sm leading-relaxed line-clamp-3 font-body">
                  {heroItem.description}
                </p>
                <div className="flex items-center gap-1 text-teal text-xs font-bold uppercase tracking-widest pt-1">
                  <span>Vollen Beitrag lesen</span>
                  <ExternalLink size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
                </div>
              </div>
            </a>
          )}

          {/* List items for remaining articles */}
          {listItems.length > 0 && (
            <div className="space-y-4 pt-6 border-t border-surface-variant/30">
              <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-black block mb-4">
                Weitere Beiträge
              </span>
              <div className="space-y-4">
                {listItems.map((item) => (
                  <a 
                    key={item.id}
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex gap-4 bg-[#1a1a1a]/30 hover:bg-[#1a1a1a]/80 p-3 rounded-xl border border-transparent hover:border-teal/20 transition-all duration-300"
                  >
                    <div className="flex-1 space-y-2">
                      <div className="flex gap-2.5 items-center text-xs text-on-surface-variant/80 font-body">
                        <span className="text-[9px] font-bold text-teal tracking-widest uppercase">
                          Blocktrainer.de
                        </span>
                        <div className="w-1 h-1 rounded-full bg-teal/40"></div>
                        <span className="text-[9px] font-semibold text-teal">
                          {formatRelativeDate(item.pubDate)}
                        </span>
                      </div>
                      <h4 className="font-headline font-black text-sm text-on-surface group-hover:text-teal transition-colors duration-200 line-clamp-2 leading-snug">
                        {item.title}
                      </h4>
                      <p className="text-on-surface-variant text-xs line-clamp-2 leading-relaxed font-body">
                        {item.description}
                      </p>
                    </div>
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-surface-container flex-shrink-0 border border-surface-variant/10">
                      <img 
                        src={item.imageUrl} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        alt="News thumbnail" 
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?q=80&w=800";
                        }}
                      />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
