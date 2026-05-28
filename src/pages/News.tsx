import React, { useState, useEffect } from 'react';
import { RefreshCw, ExternalLink, Clock, Newspaper, Loader, Bell, BellRing, BellOff } from 'lucide-react';

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

  const [notificationPermission, setNotificationPermission] = useState<string>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'unsupported';
  });

  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('einundzwanzig_news_notifications') === 'true';
    }
    return false;
  });

  const [testNotificationSent, setTestNotificationSent] = useState<boolean>(false);

  // Auto register when page loads if enabled
  useEffect(() => {
    if (notificationsEnabled && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        console.log('SW register success from mount:', reg.scope);
      }).catch((err) => {
        console.warn('SW registration failed on mount:', err);
      });
    }
  }, [notificationsEnabled]);

  const toggleNotifications = async () => {
    if (typeof window === 'undefined') return;

    if (!('Notification' in window)) {
      setNotificationPermission('unsupported');
      return;
    }

    if (notificationsEnabled) {
      setNotificationsEnabled(false);
      localStorage.setItem('einundzwanzig_news_notifications', 'false');
    } else {
      try {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
        if (permission === 'granted') {
          setNotificationsEnabled(true);
          localStorage.setItem('einundzwanzig_news_notifications', 'true');
          
          if ('serviceWorker' in navigator) {
            const reg = await navigator.serviceWorker.register('/sw.js');
            console.log('Service Worker registered:', reg.scope);
            
            // Try of periodicsync trigger registration if supported
            if ('periodicSync' in reg) {
              try {
                const status = await navigator.permissions.query({
                  name: 'periodic-background-sync' as any,
                });
                if (status.state === 'granted') {
                  await (reg as any).periodicSync.register('check-news-periodic', {
                    minInterval: 30 * 60 * 1000, // 30 minutes
                  });
                }
              } catch (pe) {
                console.warn('PeriodicSync registration failed:', pe);
              }
            }
            
            // Post message to make sure we cache the current latest item
            setTimeout(() => {
              reg.active?.postMessage({ type: 'CHECK_LATEST_NEWS' });
            }, 1000);
          }
        }
      } catch (err) {
        console.error('Error enabling notifications:', err);
      }
    }
  };

  const sendTestNotification = () => {
    if ('serviceWorker' in navigator && notificationsEnabled) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.showNotification('EINUNDZWANZIG POOL', {
          body: 'Benachrichtigungsdienst erfolgreich gestartet! Du wirst nun über neue Artikel informiert.',
          badge: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?q=80&w=128&h=128&fit=crop',
          icon: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?q=80&w=128&h=128&fit=crop',
          requireInteraction: false
        });
        setTestNotificationSent(true);
        setTimeout(() => setTestNotificationSent(false), 5000);
      });
    }
  };

  const fetchNews = async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const response = await fetch('/api/news');
      if (!response.ok) {
        throw new Error(`Fehler beim Laden (${response.status})`);
      }
      const data = await response.json();
      if (data.success && Array.isArray(data.items)) {
        setItems(data.items);
      } else {
        throw new Error(data.error || 'Ungültiges Datenformat erhalten');
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
    <div className="px-6 space-y-8">
      {/* Tracker Status Line */}
      <div className="flex justify-between items-center bg-[#1a1a1a]/50 px-4 py-2 rounded-full w-full">
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

      {/* Dynamic News Notification Settings Card */}
      <div className="space-y-4">
        <button 
          onClick={toggleNotifications}
          className="w-full py-5 bg-gradient-to-r from-teal to-primary rounded-2xl flex items-center justify-center gap-3 shadow-[0_15px_30px_rgba(247,147,26,0.18)] active:scale-98 transition-all group border border-teal/20 cursor-pointer"
        >
          <div className="bg-background/25 p-1.5 rounded-xl backdrop-blur-sm">
            {notificationsEnabled ? (
              <BellRing className="text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.6)] animate-bounce" size={22} />
            ) : (
              <BellOff className="text-white/70" size={22} />
            )}
          </div>
          <div className="text-left font-body text-white">
            <span className="block font-headline font-extrabold text-white text-lg leading-none uppercase tracking-wider">
              {notificationsEnabled ? 'News-Push aktiv' : 'News-Push-Mitteilungen aktivieren'}
            </span>
            <span className="block font-body text-[10px] text-white/85 uppercase font-black tracking-widest mt-1">
              • {notificationsEnabled ? 'Hintergrund-Abfrage alle 30 Minuten' : 'Sofortige Info bei neuen Artikeln • Alle 30 Minuten'}
            </span>
          </div>
        </button>

        {/* Warning/Tips or Test Button */}
        {notificationsEnabled && (
          <div className="bg-[#1a1a1a]/40 border border-[#F7931A]/10 rounded-2xl p-4 flex flex-wrap gap-3 items-center justify-between text-xs text-on-surface-variant font-body select-none">
            <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Dienst aktiv • Hintergrundsync eingestellt</span>
            </div>
            <button
              onClick={sendTestNotification}
              disabled={testNotificationSent}
              className="text-xs font-bold text-[#F7931A] hover:text-[#ffb353] bg-[#F7931A]/5 hover:bg-[#F7931A]/10 border border-[#F7931A]/20 px-3 py-1.5 rounded-lg active:scale-95 transition-all cursor-pointer font-headline"
            >
              {testNotificationSent ? '✓ Test gesendet' : 'Test-Meldung senden'}
            </button>
          </div>
        )}

        {notificationPermission === 'denied' && (
          <div className="bg-error/5 border border-error/15 rounded-xl p-3 text-[11px] text-error flex items-start gap-2 leading-relaxed">
            <span className="font-bold flex-shrink-0">⚠️ Hinweis:</span>
            <span>
              Benachrichtigungserlaubnis wurde im Browser verweigert. Falls du dich im Vorschau-Fenster befindest, öffne die App über den Button oben rechts in einem separaten Tab, um die Erlaubnis freizugeben.
            </span>
          </div>
        )}

        {notificationPermission === 'unsupported' && (
          <div className="bg-surface-container-low border border-outline-variant/10 rounded-xl p-3 text-[11px] text-on-surface-variant flex items-start gap-2 leading-relaxed">
            <span>ℹ️ System-Kompatibilität:</span>
            <span>
              Push-Meldungen werden von deinem aktuellen Browser oder Modus nicht vollständig unterstützt. Versuche, die App in einem modernen Desktop-Browser zu öffnen.
            </span>
          </div>
        )}
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
        <div className="bg-error/10 border border-error/20 rounded-2xl p-6 text-center space-y-4">
          <p className="text-sm text-error font-medium">{error}</p>
          <button
            onClick={() => fetchNews()}
            className="px-5 py-2.5 bg-teal text-background text-xs font-bold uppercase tracking-widest rounded-xl hover:opacity-90 active:scale-95 transition-all cursor-pointer"
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
              <div className="p-5 space-y-3">
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
                    className="group flex gap-4 bg-[#1a1a1a]/30 hover:bg-[#1a1a1a]/80 p-3.5 rounded-xl border border-transparent hover:border-teal/20 transition-all duration-300"
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
