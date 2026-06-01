import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { 
  BellRing,
  BellOff,
  Crosshair, 
  TriangleAlert, 
  Zap, 
  Newspaper, 
  Waves, 
  CheckCircle2, 
  Trash2, 
  X, 
  Volume2, 
  VolumeX, 
  PlusCircle,
  Sliders,
  ChevronDown,
  ChevronUp,
  Clock,
  BookOpen,
  Calendar,
  Pencil
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Trigger {
  id: string;
  iconType: 'crosshair' | 'alert' | 'zap';
  title: string;
  price: string;
  label: string;
  status: 'MONITORING' | 'PERSISTENT' | 'RECURRING';
  color: 'primary' | 'tertiary' | 'error';
}

interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning';
  icon?: any;
}

export default function Settings() {
  const [activeTriggers, setActiveTriggers] = useState<Trigger[]>([]);
  
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingTriggerId, setEditingTriggerId] = useState<string | null>(null);
  const [pushEnabled, setPushEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('einundzwanzig_alert_push_enabled') === 'true';
    }
    return false;
  });

  const [notificationPermission, setNotificationPermission] = useState<string>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'unsupported';
  });

  const [newsPushEnabled, setNewsPushEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('einundzwanzig_news_notifications') === 'true';
    }
    return false;
  });

  const [testNotificationSent, setTestNotificationSent] = useState<boolean>(false);
  
  // Custom trigger form states (Defaulting to German names/labels)
  const [newTitle, setNewTitle] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newLabel, setNewLabel] = useState('Benutzerdefiniertes Level');
  const [newIconType, setNewIconType] = useState<'crosshair' | 'alert' | 'zap'>('crosshair');
  const [newColor, setNewColor] = useState<'primary' | 'tertiary' | 'error'>('primary');

  const [usdPrice, setUsdPrice] = useState<number>(0);
  const [eurPrice, setEurPrice] = useState<number>(0);
  const prevUsdPriceRef = React.useRef<number>(0);
  const prevEurPriceRef = React.useRef<number>(0);

  const parseNumericPrice = (priceStr: string): number => {
    try {
      if (priceStr.includes('%')) {
        return parseFloat(priceStr.replace(/[^0-9.]/g, '')) || 0;
      }
      
      let clean = priceStr.trim();
      clean = clean.replace(/[^0-9.,]/g, '');
      if (!clean) return 0;
      
      if (clean.includes('.') && clean.includes(',')) {
        const firstIndexDot = clean.indexOf('.');
        const firstIndexComma = clean.indexOf(',');
        if (firstIndexDot < firstIndexComma) {
          return parseFloat(clean.replace(/\./g, '').replace(/,/g, '.'));
        } else {
          return parseFloat(clean.replace(/,/g, ''));
        }
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

  // checkCrossings handling is now centrally managed by GlobalPoller to ensure consistent execution 
  
  useEffect(() => {
    const handlePriceUpdate = (e: any) => {
      const { usd, eur } = e.detail;
      if (usd > 0) setUsdPrice(usd);
      if (eur > 0) setEurPrice(eur);
    };

    const handleTriggersUpdated = () => {
      const saved = localStorage.getItem('einundzwanzig_triggers');
      if (saved) {
        try {
          setActiveTriggers(JSON.parse(saved));
        } catch (e) {}
      }
    };

    const handleTriggerFired = (e: any) => {
      const trig = e.detail;
      showToast(
        `🎯 Alarm ausgelöst!`,
        `${trig.label || trig.title}: Zielwert von ${trig.price} erreicht!`,
        "success"
      );
    };

    window.addEventListener('coinbase_prices_updated', handlePriceUpdate);
    window.addEventListener('triggers_updated', handleTriggersUpdated);
    window.addEventListener('trigger_fired', handleTriggerFired);
    
    return () => {
      window.removeEventListener('coinbase_prices_updated', handlePriceUpdate);
      window.removeEventListener('triggers_updated', handleTriggersUpdated);
      window.removeEventListener('trigger_fired', handleTriggerFired);
    };
  }, []);

  // Load custom saved triggers on load
  useEffect(() => {
    const saved = localStorage.getItem('einundzwanzig_triggers');
    if (saved) {
      try {
        setActiveTriggers(JSON.parse(saved));
      } catch (e) {
        initDefaultTriggers();
      }
    } else {
      initDefaultTriggers();
    }

    const savedSettings = localStorage.getItem('einundzwanzig_alert_settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSoundEnabled(parsed.soundEnabled ?? true);
      } catch (e) {}
    }

    if (Capacitor.isNativePlatform()) {
      LocalNotifications.cancel({ notifications: [{ id: 9999 }] }).catch(() => {});
    }
  }, []);

  const saveTriggers = (list: Trigger[]) => {
    setActiveTriggers(list);
    localStorage.setItem('einundzwanzig_triggers', JSON.stringify(list));
  };

  const saveSettings = async (updated: { 
    soundEnabled: boolean;
  }) => {
    const fresh = {
      soundEnabled: updated.soundEnabled,
    };
    localStorage.setItem('einundzwanzig_alert_settings', JSON.stringify(fresh));

    if (Capacitor.isNativePlatform()) {
      try {
        await LocalNotifications.cancel({ notifications: [{ id: 9999 }] });
      } catch (e) {
        console.warn("Failed to cancel daily notification:", e);
      }
    }
  };

  const initDefaultTriggers = () => {
    const defaults: Trigger[] = [
      {
        id: 'tr-1',
        iconType: 'crosshair',
        title: "Ziel erreicht: Kursüberschreitung",
        price: "$78.500",
        label: "BTC/USD Kursziel",
        status: "MONITORING",
        color: "primary"
      },
      {
        id: 'tr-2',
        iconType: 'alert',
        title: "Kritisches Level: Durchbruch nach unten",
        price: "$69.000",
        label: "Kritischer Support-Boden",
        status: "PERSISTENT",
        color: "error"
      },
      {
        id: 'tr-3',
        iconType: 'zap',
        title: "Volatilitäts-Schwellenwert",
        price: "4.5% Ausschlag",
        label: "Intraday-Momentum",
        status: "RECURRING",
        color: "tertiary"
      }
    ];
    saveTriggers(defaults);
  };

  // Synthesize a high-tech "Biocore" notification sound with Web Audio API
  const playChirp = () => {
    if (!soundEnabled) return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      // Warm synthesizer double chime
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, ctx.currentTime); // A5
      osc1.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12); // E6
      
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(440, ctx.currentTime); // A4
      osc2.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.08); // E5
      
      gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.25);
      
      osc2.start(ctx.currentTime);
      osc2.stop(ctx.currentTime + 0.25);
    } catch (e) {
      console.warn("Chime von Browser-Sicherheitsrichtlinien blockiert", e);
    }
  };

  const showToast = (title: string, message: string, type: 'success' | 'info' | 'warning' = 'success', icon?: any) => {
    const id = Date.now().toString();
    const newToast = { id, title, message, type, icon };
    setToasts(prev => [newToast, ...prev].slice(0, 3)); // Max 3 Toast-Benachrichtigungen
    playChirp();

    // Auto dismiss
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  const handleSetPushNotification = async () => {
    if (pushEnabled) {
      setPushEnabled(false);
      if (typeof window !== 'undefined') {
        localStorage.setItem('einundzwanzig_alert_push_enabled', 'false');
      }
      showToast("Push-Dienst pausiert", "Systembenachrichtigungen für Kurslevels wurden pausiert.", "info", BellRing);
      return;
    }

    if (Capacitor.isNativePlatform()) {
      const perm = await LocalNotifications.requestPermissions();
      if (perm.display === 'granted') {
        setPushEnabled(true);
        if (typeof window !== 'undefined') {
          localStorage.setItem('einundzwanzig_alert_push_enabled', 'true');
        }
        showToast("Push-Dienst Aktiv", "Systembenachrichtigungen für Kurslevels wurden freigeschaltet.", "success", BellRing);
      } else {
        showToast("Info", "Benachrichtigungen nicht erlaubt oder nicht verfügbar.", "info");
      }
    } else if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          setPushEnabled(true);
          if (typeof window !== 'undefined') {
            localStorage.setItem('einundzwanzig_alert_push_enabled', 'true');
          }
          showToast(
            "Push-Dienst Aktiv",
            "Systembenachrichtigungen für Kurslevels & volatile Bewegungen wurden freigeschaltet.",
            "success",
            BellRing
          );
        } else {
          showToast(
            "Push abgelehnt",
            "Bitte erlaube Mitteilungen in den Browser-Einstellungen.",
            "info"
          );
        }
      });
    } else {
      setPushEnabled(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem('einundzwanzig_alert_push_enabled', 'true');
      }
      showToast(
        "Simulation",
        "Push-Dienst ist simuliert aktiv.",
        "success"
      );
    }
  };

  useEffect(() => {
    if (newsPushEnabled && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        console.log('SW register success from mount:', reg.scope);
      }).catch((err) => {
        console.warn('SW registration failed on mount:', err);
      });
    }
  }, [newsPushEnabled]);

  const toggleNewsNotifications = async () => {
    if (typeof window === 'undefined') return;

    if (newsPushEnabled) {
      setNewsPushEnabled(false);
      localStorage.setItem('einundzwanzig_news_notifications', 'false');
    } else {
      try {
        let permission = 'denied';
        if (Capacitor.isNativePlatform()) {
          const perm = await LocalNotifications.requestPermissions();
          permission = perm.display;
        } else if ('Notification' in window) {
          permission = await Notification.requestPermission();
        }

        setNotificationPermission(permission);
        if (permission === 'granted') {
          setNewsPushEnabled(true);
          localStorage.setItem('einundzwanzig_news_notifications', 'true');
          
          if (!Capacitor.isNativePlatform() && 'serviceWorker' in navigator) {
            const reg = await navigator.serviceWorker.register('/sw.js');
            if ('periodicSync' in reg) {
              try {
                const status = await navigator.permissions.query({
                  name: 'periodic-background-sync' as any,
                });
                if (status.state === 'granted') {
                  await (reg as any).periodicSync.register('check-news-periodic', {
                    minInterval: 30 * 60 * 1000,
                  });
                }
              } catch (pe) {}
            }
          }
        }
      } catch (err) {
        console.error('Error enabling notifications:', err);
      }
    }
  };

  const sendTestNotification = async () => {
    if (newsPushEnabled) {
      if (Capacitor.isNativePlatform()) {
        await LocalNotifications.schedule({
          notifications: [
            {
              id: Math.floor(Math.random() * 1000000),
              title: 'EINUNDZWANZIG POOL',
              body: 'Benachrichtigungsdienst erfolgreich gestartet! Du wirst nun über neue Artikel informiert.',
            }
          ]
        });
        setTestNotificationSent(true);
        setTimeout(() => setTestNotificationSent(false), 5000);
      } else if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((reg) => {
          reg.showNotification('EINUNDZWANZIG POOL', {
            body: 'Benachrichtigungsdienst erfolgreich gestartet! Du wirst nun über neue Artikel informiert.',
            icon: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?q=80&w=128&h=128&fit=crop',
            requireInteraction: false
          });
          setTestNotificationSent(true);
          setTimeout(() => setTestNotificationSent(false), 5000);
        });
      }
    }
  };

  const addSuggestedAlert = (title: string, price: string, cardColor: 'primary' | 'tertiary' | 'error') => {
    // Check if duplicate price is already there
    if (activeTriggers.some(t => t.price === price)) {
      showToast("Alarm existiert bereits", `${price} wird bereits überwacht.`, "warning");
      return;
    }

    const newTrigger: Trigger = {
      id: 'suggested-' + Date.now().toString(),
      iconType: cardColor === 'error' ? 'alert' : 'crosshair',
      title: `${title}`,
      price,
      label: "Voreingestelltes Level",
      status: "MONITORING",
      color: cardColor
    };

    const newTriggers = [newTrigger, ...activeTriggers];
    saveTriggers(newTriggers);
    showToast(
      "Alarm hinzugefügt",
      `Bitcoin Zielwert bei ${price} registriert. Du wirst sofort benachrichtigt!`,
      "success"
    );
  };

  const deleteTrigger = (id: string, name: string) => {
    const filtered = activeTriggers.filter(t => t.id !== id);
    saveTriggers(filtered);
    showToast("Alarm entfernt", `Trigger '${name}' wurde gelöscht.`, "warning");
  };

  const handleEditClick = (trig: Trigger) => {
    setEditingTriggerId(trig.id);
    setNewTitle(trig.title);
    
    // Strip trailing $ or € for easier editing, or just keep it
    let cleanPrice = trig.price.replace(/[$€]/g, '').trim();
    if (trig.price.endsWith('€') || trig.price.includes('€') || trig.label.includes('EUR')) {
      // Just keep as is but stripped symbols are nicer for inputs, actually it's a text input.
      // We can just keep the original string and let the user edit it.
      setNewPrice(cleanPrice);
    } else {
      setNewPrice(cleanPrice);
    }
    
    setNewLabel(trig.label);
    setNewIconType(trig.iconType);
    setNewColor(trig.color);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTriggerId(null);
    setNewTitle('');
    setNewPrice('');
    setNewLabel('Benutzerdefiniertes Level');
  };

  const handleCreateCustomTrigger = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newPrice.trim()) {
      showToast("Validierungsfehler", "Titel und Preis sind erforderlich.", "warning", TriangleAlert);
      return;
    }

    const priceHasDigits = /[0-9]/.test(newPrice);
    if (!priceHasDigits) {
      showToast("Validierungsfehler", "Bitte geben Sie einen gültigen numerischen Preis ein.", "warning", TriangleAlert);
      return;
    }

    // Clean formatting on custom price (either append the user's string directly)
    let formattedPrice = newPrice.trim();
    if (!formattedPrice.startsWith('$') && !formattedPrice.startsWith('€') && !formattedPrice.endsWith('€') && !formattedPrice.endsWith('$')) {
      formattedPrice = `$${formattedPrice}`;
    }

    const newTrig: Trigger = {
      id: editingTriggerId || ('custom-' + Date.now().toString()),
      iconType: newIconType,
      title: newTitle.trim(),
      price: formattedPrice,
      label: newLabel.trim(),
      status: "MONITORING",
      color: newColor
    };

    let updated;
    if (editingTriggerId) {
      updated = activeTriggers.map(t => t.id === editingTriggerId ? newTrig : t);
      showToast("Alarm aktualisiert", `Alarm '${newTrig.title}' wurde aktualisiert.`, "success");
    } else {
      updated = [newTrig, ...activeTriggers];
      showToast("Alarm eingerichtet", `Präzisionsalarm auf ${newTrig.price} gesetzt.`, "success");
    }

    saveTriggers(updated);
    setIsModalOpen(false);
    setEditingTriggerId(null);
    
    // Reset Form
    setNewTitle('');
    setNewPrice('');
    setNewLabel('Benutzerdefiniertes Level');
  };

  const translateStatus = (status: string) => {
    switch (status) {
      case 'MONITORING':
        return 'AKTIV';
      case 'PERSISTENT':
        return 'DAUERHAFT';
      case 'RECURRING':
        return 'WIEDERKEHREND';
      default:
        return status;
    }
  };

  return (
    <div className="px-6 space-y-8 relative">
      
      {/* Dynamic Animated Toasts Overlay (iOS and Biocore Tech Style) */}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4 space-y-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => {
            const ToastIcon = toast.icon || CheckCircle2;
            const isError = toast.type === 'error';
            const accentColor = isError ? 'text-primary' : 'text-teal';
            const borderGlow = isError ? 'border-primary/20 shadow-[0_16px_36px_rgba(247,147,26,0.15)]' : 'border-teal/20 shadow-[0_16px_36px_rgba(247,147,26,0.22)]';
            const iconBg = isError ? 'bg-primary/10 border-primary/30' : 'bg-teal/10 border-teal/30';

            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: -40, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85, y: -20, transition: { duration: 0.15 } }}
                className={`w-full pointer-events-auto bg-[#1a1a1a]/95 backdrop-blur-xl border ${borderGlow} rounded-2xl p-4 flex gap-3.5 items-center overflow-hidden`}
              >
                {/* Audio pulse line wrapper */}
                <div className={`absolute top-0 left-0 h-[3px] bg-gradient-to-r from-teal to-primary w-full animate-[shrink-bar_4.5s_linear_forwards]`} />
                
                <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0 border`}>
                  <ToastIcon size={20} className={`${accentColor} animate-pulse`} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className={`font-headline font-black text-xs ${accentColor} uppercase tracking-wider leading-none mb-1`}>
                    {toast.title}
                  </h4>
                  <p className="font-body text-xs text-on-surface/90 leading-tight">
                    {toast.message}
                  </p>
                </div>
                
                <button 
                  onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                  className="text-on-surface-variant/40 hover:text-on-surface p-1 rounded-lg"
                >
                  <X size={14} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Live Pulse Header */}
      <div className="flex justify-between items-center bg-[#1a1a1a]/45 px-4 py-2 rounded-full border border-outline-variant/10">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-teal"></span>
          </span>
          <span className="font-body text-[10px] uppercase tracking-[0.16em] text-teal font-bold">System-Status: Aktiv</span>
        </div>
        
        {/* Playback Sound Config Mode */}
        <button 
          onClick={() => {
            const nextSound = !soundEnabled;
            setSoundEnabled(nextSound);
            saveSettings({ soundEnabled: nextSound });
            showToast(
              nextSound ? "Signaltöne AN" : "Lautlos Modus",
              nextSound ? "Signaltöne für Alarme sind aktiviert." : "App meldet Alarme jetzt lautlos.",
              "info",
              nextSound ? Volume2 : VolumeX
            );
          }}
          className="text-on-surface-variant/75 hover:text-teal transition-all p-1 flex items-center gap-1.5 cursor-pointer"
          title="Toneffekte umschalten"
        >
          {soundEnabled ? <Volume2 size={13} className="text-teal animate-pulse" /> : <VolumeX size={13} />}
          <span className="text-[9px] uppercase tracking-wider font-extrabold">
            {soundEnabled ? 'Töne AN' : 'Stumm'}
          </span>
        </button>
      </div>

      {/* Hero */}
      <div className="space-y-4">
        <div>
          <h2 className="font-headline font-extrabold text-4xl text-on-surface tracking-tight mb-2">Einstellungen</h2>
          <p className="font-body text-on-surface-variant text-sm">Übersicht deiner Konfigurationen, Benachrichtigungen und Alarmen.</p>
        </div>
        
        <div className="pt-2">
          <h3 className="font-body text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-bold mb-3">Push-Mitteilungen</h3>
          <div className="space-y-4">
            
            {/* Unified Push Toggles */}
            <button 
              onClick={async () => {
                const isCurrentlyEnabled = newsPushEnabled || pushEnabled;
                if (isCurrentlyEnabled) {
                  setNewsPushEnabled(false);
                  setPushEnabled(false);
                  localStorage.setItem('einundzwanzig_news_notifications', 'false');
                  localStorage.setItem('einundzwanzig_alert_push_enabled', 'false');
                } else {
                  await toggleNewsNotifications();
                  // Also set pushEnabled for price alerts since they are bound now
                  setPushEnabled(true);
                  localStorage.setItem('einundzwanzig_alert_push_enabled', 'true');
                }
              }}
              className={`w-full p-4 rounded-2xl flex items-center justify-between border transition-all cursor-pointer ${
                (newsPushEnabled || pushEnabled) ? 'bg-surface-container border-teal/20' : 'bg-surface-container border-outline-variant/15'
              }`}
            >
              <div className="flex gap-4 items-center">
                <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-teal">
                  {(newsPushEnabled || pushEnabled) ? <BellRing size={20} className="animate-bounce" /> : <BellOff size={20} />}
                </div>
                <div className="text-left">
                  <h4 className="font-body font-bold text-on-surface text-sm">Zulassen</h4>
                  <p className="font-body text-[10px] text-on-surface-variant">News-Artikel, Kursziele & Kritische Levels</p>
                </div>
              </div>
              <div className={`w-10 h-5 rounded-full relative transition-colors ${newsPushEnabled || pushEnabled ? 'bg-teal' : 'bg-surface-container-highest'}`}>
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${newsPushEnabled || pushEnabled ? 'left-5.5' : 'left-0.5'}`}></div>
              </div>
            </button>

            {notificationPermission === 'denied' && (
              <div className="bg-error/5 border border-error/15 rounded-xl p-3 text-[11px] text-error flex items-start gap-2 leading-relaxed">
                <span className="font-bold flex-shrink-0">⚠️ Hinweis:</span>
                <span>
                  Benachrichtigungserlaubnis wurde im Browser verweigert. Falls du dich im Vorschau-Fenster befindest, öffne die App über den Button oben rechts in einem separaten Tab, um die Erlaubnis freizugeben.
                </span>
              </div>
            )}
            
            {/* Warning/Tips or Test Button */}
            {(newsPushEnabled || pushEnabled) && (
              <div className="bg-[#1a1a1a]/40 border border-[#F7931A]/10 rounded-2xl p-4 flex flex-wrap gap-3 items-center justify-between text-xs text-on-surface-variant font-body select-none mt-2">
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
          </div>
        </div>
      </div>

      {/* Suggested Targets */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-body text-[10px] uppercase tracking-[0.2em] text-teal font-bold">Vorgeschlagene Kursziele</h3>
          <span className="font-body text-[9px] text-on-surface-variant/60 font-medium">Systemanalyse: Hohe Relevanz</span>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-6 px-6 hide-scrollbar">
          <button 
            onClick={() => addSuggestedAlert("Widerstand 1", "$82.400", "primary")}
            className="flex-shrink-0 w-[8.5rem] bg-[#1a1a1a] border border-primary/10 hover:border-primary/40 rounded-xl p-3.5 active:scale-95 transition-all text-left cursor-pointer group"
          >
            <p className="font-body text-[9px] text-primary font-black uppercase mb-1">Widerstand 1</p>
            <div className="flex items-baseline gap-1 mb-1.5">
              <span className="font-headline font-extrabold text-lg text-on-surface group-hover:text-primary transition-colors">$82.400</span>
            </div>
            <div className="text-on-surface-variant/75 text-[10px] font-bold group-hover:text-primary flex items-center gap-0.5">
              <span>+ Alarm setzen</span>
            </div>
          </button>

          <button 
            onClick={() => addSuggestedAlert("Wichtiger Support", "$74.800", "tertiary")}
            className="flex-shrink-0 w-[8.5rem] bg-[#1a1a1a] border border-teal/10 hover:border-teal/40 rounded-xl p-3.5 active:scale-95 transition-all text-left cursor-pointer group"
          >
            <p className="font-body text-[9px] text-teal font-black uppercase mb-1">Support 1</p>
            <div className="flex items-baseline gap-1 mb-1.5">
              <span className="font-headline font-extrabold text-lg text-on-surface group-hover:text-teal transition-colors">$74.800</span>
            </div>
            <div className="text-on-surface-variant/75 text-[10px] font-bold group-hover:text-teal flex items-center gap-0.5">
              <span>+ Alarm setzen</span>
            </div>
          </button>

          <button 
            onClick={() => addSuggestedAlert("Gap-Fill Unterstützung", "$68.200", "error")}
            className="flex-shrink-0 w-[8.5rem] bg-[#1a1a1a] border border-teal/10 hover:border-teal/40 rounded-xl p-3.5 active:scale-95 transition-all text-left cursor-pointer group"
          >
            <p className="font-body text-[9px] text-teal font-black uppercase mb-1">Gap-Fill</p>
            <div className="flex items-baseline gap-1 mb-1.5">
              <span className="font-headline font-extrabold text-lg text-on-surface group-hover:text-teal transition-colors">$68.200</span>
            </div>
            <div className="text-on-surface-variant/75 text-[10px] font-bold group-hover:text-teal flex items-center gap-0.5">
              <span>+ Alarm setzen</span>
            </div>
          </button>
        </div>
      </section>

      {/* Active Triggers */}
      <section className="space-y-4 pb-12">
        <div className="flex justify-between items-center">
          <h3 className="font-body text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-bold">
            Alarme ({activeTriggers.length})
          </h3>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="text-[10px] font-black text-teal uppercase tracking-widest flex items-center gap-1 hover:text-teal/80 transition-colors cursor-pointer"
          >
            <PlusCircle size={14} />
            <span>Neuer Alarm</span>
          </button>
        </div>

        {activeTriggers.length === 0 ? (
          <div className="border border-dashed border-outline-variant/20 rounded-2xl p-8 text-center text-on-surface-variant/70 text-xs">
            <BellRing className="mx-auto block text-on-surface-variant/30 mb-2" size={24} />
            <span>Keine aktiven Alarme registriert.</span>
          </div>
        ) : (
          <div className="space-y-3.5">
            {activeTriggers.map((trig) => {
              const IconComp = trig.iconType === 'alert' ? TriangleAlert : trig.iconType === 'zap' ? Zap : Crosshair;
              const colorClass = trig.color === 'error' ? 'text-teal' : trig.color === 'tertiary' ? 'text-teal' : 'text-primary';
              const borderClass = trig.color === 'error' ? 'border-teal/15 hover:border-teal/35' : trig.color === 'tertiary' ? 'border-teal/15 hover:border-teal/35' : 'border-primary/15 hover:border-primary/45';
              const badgeBgClass = trig.color === 'error' ? 'bg-teal/10 text-teal border border-teal/10' : trig.color === 'tertiary' ? 'bg-teal/10 text-teal border border-teal/10' : 'bg-primary/10 text-primary border border-primary/10';

              return (
                <div 
                  key={trig.id}
                  className={`bg-[#1a1a1a] rounded-2xl p-4.5 relative overflow-hidden border transition-all duration-200 ${borderClass}`}
                >
                  <div className="flex justify-between items-start mb-2.5">
                    <div className="flex items-center gap-2">
                      <IconComp size={15} className={colorClass} />
                      <span className={`font-body text-[10px] font-black tracking-widest uppercase ${colorClass}`}>
                        {trig.title}
                      </span>
                    </div>
                    {/* Actions */}
                    <div className="flex gap-1">
                      <button 
                        onClick={() => handleEditClick(trig)}
                        className="text-on-surface-variant/40 hover:text-teal p-1 rounded-lg transition-colors cursor-pointer"
                        title="Alarm bearbeiten"
                      >
                        <Pencil size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2 mb-1.5">
                    <span className="font-headline font-extrabold text-2xl text-on-surface leading-none">{trig.price}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-body text-[10px] text-on-surface-variant font-medium">{trig.label}</span>
                    <span className={`px-2 py-0.5 rounded-md font-body text-[8px] font-bold uppercase tracking-wider ${badgeBgClass}`}>
                      {translateStatus(trig.status)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Styled Micro-Modal to insert custom Trigger (Biocore Glass-design overlay) */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="absolute inset-0 bg-background"
            />
            {/* Box modal */}
            <motion.div 
              initial={{ scale: 0.94, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 15 }}
              transition={{ type: "spring", stiffness: 350, damping: 28 }}
              className="bg-surface-container border border-outline-variant/35 rounded-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto shadow-[0_20px_50px_rgba(0,0,0,0.6)] z-10 hide-scrollbar"
            >
              <div className="px-5 py-4 bg-surface-container-high/60 border-b border-outline-variant/15 flex justify-between items-center">
                <span className="font-headline font-extrabold text-sm uppercase tracking-wider text-teal">
                  {editingTriggerId ? 'Alarm bearbeiten' : 'Benutzerdefinierter Alarm'}
                </span>
                <button onClick={handleCloseModal} className="text-on-surface-variant/60 hover:text-on-surface">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateCustomTrigger} className="p-5 space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-on-surface-variant/90 font-bold block">Titel des Preis-Levels</label>
                  <input 
                    type="text" 
                    placeholder="z.B. Widerstand oder Support Level"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-2.5 text-xs text-on-surface focus:outline-none focus:border-teal/50 transition-colors font-body"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider text-on-surface-variant/90 font-bold block">Zielkurs (z.B. 81200)</label>
                    <input 
                      type="text" 
                      placeholder="z.B. 81200"
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-2.5 text-xs text-on-surface focus:outline-none focus:border-teal/50 transition-colors font-body"
                      required
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider text-on-surface-variant/90 font-bold block">Beschreibung / Label</label>
                    <input 
                      type="text" 
                      value={newLabel}
                      onChange={(e) => setNewLabel(e.target.value)}
                      className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-2.5 text-xs text-on-surface focus:outline-none focus:border-teal/50 transition-colors font-body"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  {/* Select Icon */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider text-on-surface-variant/90 font-bold block">Icon</label>
                    <select 
                      value={newIconType}
                      onChange={(e: any) => setNewIconType(e.target.value)}
                      className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-3 py-2.5 text-xs text-on-surface focus:outline-none focus:border-secondary/40 transition-colors cursor-pointer font-body"
                    >
                      <option value="crosshair">🎯 Fadenkreuz (Ziele)</option>
                      <option value="alert">⚠️ Warnung (Support)</option>
                      <option value="zap">⚡ Momentum (Volatilität)</option>
                    </select>
                  </div>

                  {/* Select Color Theme Accent */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider text-on-surface-variant/90 font-bold block">Farbe</label>
                    <select 
                      value={newColor}
                      onChange={(e: any) => setNewColor(e.target.value)}
                      className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-3 py-2.5 text-xs text-on-surface focus:outline-none focus:border-secondary/40 transition-colors cursor-pointer font-body"
                    >
                      <option value="primary">🟠 Bitcoin-Orange (Standard)</option>
                      <option value="tertiary">🟠 Sekundär-Orange</option>
                      <option value="error">🟠 Tertiär-Orange</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  {editingTriggerId && (
                    <button
                      type="button"
                      onClick={() => {
                        deleteTrigger(editingTriggerId, newTitle);
                        handleCloseModal();
                      }}
                      className="py-3 px-4 bg-red-500/10 text-red-400 border border-red-500/20 font-headline font-black text-xs uppercase tracking-widest rounded-xl hover:bg-red-500/20 transition-all active:scale-97 cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                  <button 
                    type="submit"
                    className="flex-1 py-3 bg-gradient-to-r from-teal to-primary text-background shadow-[0_4px_16px_rgba(247,147,26,0.18)] font-headline font-black text-xs uppercase tracking-widest rounded-xl hover:opacity-90 transition-all active:scale-97 cursor-pointer"
                  >
                    {editingTriggerId ? '✓ Speichern' : '🚀 Alarm aktivieren'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
