import React, { useEffect, useRef } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';

// Helper to parse price string
const parseNumericPrice = (p: string) => {
  return parseFloat(p.replace(/[^0-9.]/g, '')) || 0;
};

export default function GlobalPoller() {
  const prevUsdPriceRef = useRef(0);
  const prevEurPriceRef = useRef(0);
  const lastNewsLinkRef = useRef<string | null>(null);

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
            if (!trig.active) {
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

        if (fetchedUsd > 0) prevUsdPriceRef.current = fetchedUsd;
        if (fetchedEur > 0) prevEurPriceRef.current = fetchedEur;

        // Emit prices
        window.dispatchEvent(new CustomEvent('coinbase_prices_updated', {
          detail: { usd: fetchedUsd, eur: fetchedEur }
        }));

      } catch (e) {
        // silently fail on network errors in background
      }
    };

    fetchSpotPrices();
    const interval = setInterval(fetchSpotPrices, 15000);
    return () => clearInterval(interval);
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
          
          lastNewsLinkRef.current = newestLink;
        }
      } catch (e) {}
    };

    fetchNewsBackground();
    const interval = setInterval(fetchNewsBackground, 5 * 60 * 1000); // every 5 mins
    return () => clearInterval(interval);
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
