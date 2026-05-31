import React, { useEffect, useRef } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';

// Helper to parse price string
const parseNumericPrice = (priceStr: string): number => {
  try {
    if (priceStr.includes('%')) {
      return parseFloat(priceStr.replace(/[^0-9.]/g, '')) || 0;
    }
    
    let clean = priceStr.trim();
    clean = clean.replace(/[^0-9.,]/g, '');
    if (!clean) return 0;
    
    if (clean.includes('.') && clean.includes(',')) {
      if (clean.lastIndexOf('.') > clean.lastIndexOf(',')) {
        clean = clean.replace(/,/g, '');
      } else {
        clean = clean.replace(/\./g, '').replace(/,/g, '.');
      }
      return parseFloat(clean);
    }
    
    if (clean.includes('.')) {
      const parts = clean.split('.');
      if (parts[parts.length - 1].length === 3) {
        return parseFloat(clean.replace(/\./g, ''));
      }
      return parseFloat(clean);
    }
    
    if (clean.includes(',')) {
      const parts = clean.split(',');
      if (parts[parts.length - 1].length === 3) {
        return parseFloat(clean.replace(/,/g, ''));
      }
      return parseFloat(clean.replace(/,/g, '.'));
    }
    
    return parseFloat(clean) || 0;
  } catch (e) {
    return 0;
  }
};

export default function GlobalPoller() {
  const prevUsdPriceRef = useRef(0);
  const prevEurPriceRef = useRef(0);
  const lastNewsLinkRef = useRef<string | null>(null);

  useEffect(() => {
    // Initialize refs from localStorage
    const savedUsd = localStorage.getItem('einundzwanzig_prev_usd');
    if (savedUsd) prevUsdPriceRef.current = parseFloat(savedUsd) || 0;
    
    const savedEur = localStorage.getItem('einundzwanzig_prev_eur');
    if (savedEur) prevEurPriceRef.current = parseFloat(savedEur) || 0;

    const savedNews = localStorage.getItem('einundzwanzig_last_news');
    if (savedNews) lastNewsLinkRef.current = savedNews;
  }, []);

  // Poll for Prices & Triggers
  useEffect(() => {
    const fetchSpotPrices = async () => {
      try {
        const [resUsd, resEur] = await Promise.all([
          fetch('https://api.coinbase.com/v2/prices/BTC-USD/spot'),
          fetch('https://api.coinbase.com/v2/prices/BTC-EUR/spot')
        ]);
        
        let fetchedUsd = 0;
        let fetchedEur = 0;
        
        if (resUsd.ok) {
          const jsonVal = await resUsd.json();
          fetchedUsd = parseFloat(jsonVal.data.amount) || 0;
        }
        if (resEur.ok) {
          const jsonVal = await resEur.json();
          fetchedEur = parseFloat(jsonVal.data.amount) || 0;
        }

        const storedTriggers = localStorage.getItem('einundzwanzig_triggers');
        if (storedTriggers) {
          let triggers = [];
          try { triggers = JSON.parse(storedTriggers); } catch (e) {}
          
          let changed = false;
          let triggersToKeep = [];

          for (const trig of triggers) {
            if (!trig.active && trig.status !== "MONITORING" && trig.status !== "PERSISTENT" && trig.status !== "RECURRING") {
              triggersToKeep.push(trig);
              continue;
            }

            if (trig.price.includes('%')) {
              triggersToKeep.push(trig);
              continue;
            }

            const isUSD = !trig.price.includes('€') && !trig.label.includes('EUR');
            const targetPrice = parseNumericPrice(trig.price);
            
            if (targetPrice <= 0) {
              triggersToKeep.push(trig);
              continue;
            }

            const currentPrice = isUSD ? fetchedUsd : fetchedEur;
            const prevPrice = isUSD ? prevUsdPriceRef.current : prevEurPriceRef.current;

            if (prevPrice > 0 && currentPrice > 0) {
              const crossedAbove = prevPrice < targetPrice && currentPrice >= targetPrice;
              const crossedBelow = prevPrice > targetPrice && currentPrice <= targetPrice;
              
              if (crossedAbove || crossedBelow) {
                changed = true;
                
                // Notify UI to show toast if open
                window.dispatchEvent(new CustomEvent('trigger_fired', {
                  detail: trig
                }));

                // NOTIFY NATIVELY
                if (Capacitor.isNativePlatform()) {
                  LocalNotifications.schedule({
                    notifications: [
                      {
                        id: Math.floor(Math.random() * 1000000),
                        title: 'EINUNDZWANZIG POOL: Alarm!',
                        body: `${trig.title || trig.label} (${trig.price}) wurde soeben erreicht!`,
                      }
                    ]
                  }).catch(console.warn);
                } else if ('Notification' in window && Notification.permission === 'granted') {
                  try {
                    navigator.serviceWorker.ready.then(reg => {
                      reg.showNotification('EINUNDZWANZIG POOL: Alarm!', {
                        body: `${trig.title || trig.label} (${trig.price}) wurde soeben erreicht!`,
                        icon: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?q=80&w=128&h=128&fit=crop',
                      });
                    });
                  } catch (e) {}
                }
                
                if (trig.status === "PERSISTENT" || trig.status === "RECURRING") {
                  triggersToKeep.push(trig);
                }
              } else {
                triggersToKeep.push(trig);
              }
            } else {
              triggersToKeep.push(trig);
            }
          }
          
          if (changed) {
            localStorage.setItem('einundzwanzig_triggers', JSON.stringify(triggersToKeep));
            window.dispatchEvent(new Event('triggers_updated')); // refresh UI in Alerts
          }
        }

        if (fetchedUsd > 0) {
          prevUsdPriceRef.current = fetchedUsd;
          localStorage.setItem('einundzwanzig_prev_usd', fetchedUsd.toString());
        }
        if (fetchedEur > 0) {
          prevEurPriceRef.current = fetchedEur;
          localStorage.setItem('einundzwanzig_prev_eur', fetchedEur.toString());
        }

        // Emit prices
        window.dispatchEvent(new CustomEvent('coinbase_prices_updated', {
          detail: { usd: fetchedUsd, eur: fetchedEur }
        }));

      } catch (e) {
        // silently fail on network errors in background
      }
    };

    fetchSpotPrices();
    
    const handleResume = () => {
      fetchSpotPrices();
    };
    window.addEventListener('app_resumed', handleResume);
    const interval = setInterval(fetchSpotPrices, 15000);
    
    return () => {
      window.removeEventListener('app_resumed', handleResume);
      clearInterval(interval);
    };
  }, []);

  // Poll for News
  useEffect(() => {
    const fetchNewsBackground = async () => {
      const newsEnabled = localStorage.getItem('einundzwanzig_news_notifications') === 'true';
      if (!newsEnabled) return;
      
      try {
        const rssUrl = encodeURIComponent("https://www.blocktrainer.de/feed/");
        const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${rssUrl}`);
        if (!response.ok) return;
        
        const data = await response.json();
        if (data && data.status === "ok" && Array.isArray(data.items) && data.items.length > 0) {
          const newestLink = data.items[0].link;
          
          if (lastNewsLinkRef.current && lastNewsLinkRef.current !== newestLink) {
            // NEW ITEM DETECTED
            if (Capacitor.isNativePlatform()) {
              LocalNotifications.schedule({
                notifications: [
                  {
                    id: Math.floor(Math.random() * 1000000),
                    title: 'Bitcoin News: ' + data.items[0].title,
                    body: (data.items[0].description || "").replace(/<\/?[^>]+(>|$)/g, "").substring(0, 100) + '...',
                  }
                ]
              }).catch(console.warn);
            } else if ('Notification' in window && Notification.permission === 'granted') {
              try {
                navigator.serviceWorker.ready.then(reg => {
                  reg.showNotification('Bitcoin News: ' + data.items[0].title, {
                    body: (data.items[0].description || "").replace(/<\/?[^>]+(>|$)/g, "").substring(0, 100) + '...',
                    icon: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?q=80&w=128&h=128&fit=crop',
                  });
                });
              } catch (e) {}
            }
          }
          
          if (lastNewsLinkRef.current !== newestLink) {
            lastNewsLinkRef.current = newestLink;
            localStorage.setItem('einundzwanzig_last_news', newestLink);
          }
        }
      } catch (e) {}
    };

    fetchNewsBackground();
    
    const handleResumeNews = () => {
      fetchNewsBackground();
    };
    window.addEventListener('app_resumed', handleResumeNews);
    
    const interval = setInterval(fetchNewsBackground, 5 * 60 * 1000); // every 5 mins
    return () => {
      window.removeEventListener('app_resumed', handleResumeNews);
      clearInterval(interval);
    };
  }, []);

  // Hydrate on App Resume (for Android standard suspend scenarios)
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      CapacitorApp.addListener('appStateChange', ({ isActive }) => {
        if (isActive) {
          // Immediately trigger checks when app comes to foreground
          window.dispatchEvent(new Event('app_resumed'));
        }
      });
    }
  }, []);

  return null;
}
