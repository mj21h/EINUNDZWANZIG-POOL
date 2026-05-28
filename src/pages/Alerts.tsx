import React, { useState, useEffect } from 'react';
import { 
  BellRing, 
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
  Calendar
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

export default function Alerts() {
  const [activeTriggers, setActiveTriggers] = useState<Trigger[]>([]);
  const [dailySummary, setDailySummary] = useState<boolean>(true);
  const [dailyTime, setDailyTime] = useState<string>("08:00");
  const [dailyScope, setDailyScope] = useState<'Kompakt' | 'Standard' | 'Maximal'>("Standard");
  const [dailyFrequency, setDailyFrequency] = useState<'Täglich' | 'Wochentage' | 'Wochenende'>("Täglich");
  const [isDailySettingsOpen, setIsDailySettingsOpen] = useState<boolean>(false);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  
  const [whaleAlerts, setWhaleAlerts] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  
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

  const checkCrossings = (prevPrice: number, currentPrice: number, isUSD: boolean) => {
    if (prevPrice <= 0 || currentPrice <= 0 || prevPrice === currentPrice) return;
    
    setActiveTriggers(prevList => {
      let changed = false;
      const triggersToKeep: Trigger[] = [];
      
      for (const trig of prevList) {
        if (trig.price.includes('%')) {
          triggersToKeep.push(trig);
          continue;
        }
        
        const isTrigUSD = !trig.price.includes('€') && !trig.label.includes('EUR');
        if (isTrigUSD !== isUSD) {
          triggersToKeep.push(trig);
          continue;
        }
        
        const targetPrice = parseNumericPrice(trig.price);
        if (targetPrice <= 0) {
          triggersToKeep.push(trig);
          continue;
        }
        
        const crossedAbove = prevPrice < targetPrice && currentPrice >= targetPrice;
        const crossedBelow = prevPrice > targetPrice && currentPrice <= targetPrice;
        
        if (crossedAbove || crossedBelow) {
          changed = true;
          
          showToast(
            `🎯 Alarm ausgelöst!`,
            `${trig.label || trig.title}: Zielwert von ${trig.price} gekreuzt bei ${isUSD ? "$" : "€"}${currentPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}!`,
            "success"
          );
          
          if ('Notification' in window && Notification.permission === 'granted') {
            try {
              navigator.serviceWorker.ready.then(reg => {
                reg.showNotification('EINUNDZWANZIG POOL: Alarm!', {
                  body: `${trig.title || trig.label} (${trig.price}) wurde soeben erreicht!`,
                  badge: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?q=80&w=128&h=128&fit=crop',
                  icon: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?q=80&w=128&h=128&fit=crop',
                  requireInteraction: true
                });
              });
            } catch (ne) {
              console.warn("SW notify error:", ne);
            }
          }
          
          if (trig.status === "PERSISTENT" || trig.status === "RECURRING") {
            triggersToKeep.push(trig);
          }
        } else {
          triggersToKeep.push(trig);
        }
      }
      
      if (changed) {
        localStorage.setItem('einundzwanzig_triggers', JSON.stringify(triggersToKeep));
        return triggersToKeep;
      }
      return prevList;
    });
  };

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
        
        if (fetchedUsd > 0) {
          setUsdPrice(fetchedUsd);
          if (prevUsdPriceRef.current > 0 && prevUsdPriceRef.current !== fetchedUsd) {
            checkCrossings(prevUsdPriceRef.current, fetchedUsd, true);
          }
          prevUsdPriceRef.current = fetchedUsd;
        }
        
        if (fetchedEur > 0) {
          setEurPrice(fetchedEur);
          if (prevEurPriceRef.current > 0 && prevEurPriceRef.current !== fetchedEur) {
            checkCrossings(prevEurPriceRef.current, fetchedEur, false);
          }
          prevEurPriceRef.current = fetchedEur;
        }
      } catch (e) {
        console.warn("Fail to fetch prices in Alerts:", e);
      }
    };
    
    fetchSpotPrices();
    const interval = setInterval(fetchSpotPrices, 12000);
    return () => clearInterval(interval);
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
        setDailySummary(parsed.dailySummary ?? true);
        setWhaleAlerts(parsed.whaleAlerts ?? false);
        setSoundEnabled(parsed.soundEnabled ?? true);
        setDailyTime(parsed.dailyTime ?? "08:00");
        setDailyScope(parsed.dailyScope ?? "Standard");
        setDailyFrequency(parsed.dailyFrequency ?? "Täglich");
      } catch (e) {}
    }
  }, []);

  const saveTriggers = (list: Trigger[]) => {
    setActiveTriggers(list);
    localStorage.setItem('einundzwanzig_triggers', JSON.stringify(list));
  };

  const saveSettings = (updated: { 
    dailySummary: boolean; 
    whaleAlerts: boolean; 
    soundEnabled: boolean;
    dailyTime?: string;
    dailyScope?: 'Kompakt' | 'Standard' | 'Maximal';
    dailyFrequency?: 'Täglich' | 'Wochentage' | 'Wochenende';
  }) => {
    const fresh = {
      dailySummary: updated.dailySummary,
      whaleAlerts: updated.whaleAlerts,
      soundEnabled: updated.soundEnabled,
      dailyTime: updated.dailyTime !== undefined ? updated.dailyTime : dailyTime,
      dailyScope: updated.dailyScope !== undefined ? updated.dailyScope : dailyScope,
      dailyFrequency: updated.dailyFrequency !== undefined ? updated.dailyFrequency : dailyFrequency,
    };
    localStorage.setItem('einundzwanzig_alert_settings', JSON.stringify(fresh));
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

  const handleSetPushNotification = () => {
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          showToast(
            "Push-Dienst Aktiv",
            "Systembenachrichtigungen für Kurslevels & volatile Bewegungen wurden freigeschaltet.",
            "success",
            BellRing
          );
        } else {
          showToast(
            "Simulierter Push Aktiv",
            "Push-Dienst wurde erfolgreich im App-Sandkasten registriert.",
            "info"
          );
        }
      });
    } else {
      showToast(
        "Benachrichtigungen Aktiv",
        "Push-Dienst wurde erfolgreich im App-Sandkasten registriert.",
        "success"
      );
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

  const handleCreateCustomTrigger = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newPrice.trim()) {
      showToast("Validierungsfehler", "Titel und Preis sind erforderlich.", "warning");
      return;
    }

    // Clean formatting on custom price (either append the user's string directly)
    let formattedPrice = newPrice.trim();
    if (!formattedPrice.startsWith('$') && !formattedPrice.startsWith('€') && !formattedPrice.endsWith('€') && !formattedPrice.endsWith('$')) {
      formattedPrice = `$${formattedPrice}`;
    }

    const newTrig: Trigger = {
      id: 'custom-' + Date.now().toString(),
      iconType: newIconType,
      title: newTitle.trim(),
      price: formattedPrice,
      label: newLabel.trim(),
      status: "MONITORING",
      color: newColor
    };

    const updated = [newTrig, ...activeTriggers];
    saveTriggers(updated);
    setIsModalOpen(false);
    
    // Reset Form
    setNewTitle('');
    setNewPrice('');
    setNewLabel('Benutzerdefiniertes Level');

    showToast("Alarm eingerichtet", `Präzisionsalarm für '${newTrig.title}' auf ${newTrig.price} gesetzt.`, "success");
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
            saveSettings({ dailySummary, whaleAlerts, soundEnabled: nextSound });
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
          <h2 className="font-headline font-extrabold text-4xl text-on-surface tracking-tight mb-2">Alarme</h2>
          <p className="font-body text-on-surface-variant text-sm">Definiere präzise Zielpreise, Unterstützungslevels und Volatilitäts-Alarme.</p>
        </div>
        
        <button 
          onClick={handleSetPushNotification}
          className="w-full py-5 bg-gradient-to-r from-teal to-primary rounded-2xl flex items-center justify-center gap-3 shadow-[0_15px_30px_rgba(247,147,26,0.18)] active:scale-98 transition-all group border border-teal/20 cursor-pointer"
        >
          <div className="bg-background/25 p-1.5 rounded-xl backdrop-blur-sm">
            <BellRing className="text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]" size={22} />
          </div>
          <div className="text-left font-body text-white">
            <span className="block font-headline font-extrabold text-white text-lg leading-none uppercase tracking-wider">Push-Mitteilungen aktivieren</span>
            <span className="block font-body text-[10px] text-white/85 uppercase font-black tracking-widest mt-1">Neue Kursziele & Kritische Levels</span>
          </div>
        </button>
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

      {/* Daily Report */}
      <section>
        <h3 className="font-body text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-bold mb-4">Tägliche Berichte & Entwicklungen</h3>
        <div className="space-y-3">
          {/* Toggle Daily Course container */}
          <div className="w-full bg-[#1a1a1a] rounded-xl border border-outline-variant/10 overflow-hidden transition-all duration-300">
            {/* Header Accordion triggering settings view */}
            <div 
              onClick={() => setIsDailySettingsOpen(!isDailySettingsOpen)}
              className="p-4 flex items-center justify-between cursor-pointer select-none hover:bg-surface-container-low/20 transition-colors"
            >
              <div className="flex gap-4 items-center flex-1">
                <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-teal">
                  <Newspaper size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-body font-bold text-on-surface text-sm">Tägliche Kursübersicht</h4>
                    <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded border border-primary/15 font-mono">
                      {dailySummary ? "Aktiv" : "Pausiert"}
                    </span>
                  </div>
                  <p className="font-body text-[10px] text-on-surface-variant flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <span className="flex items-center gap-0.5"><Clock size={10} className="text-teal animate-pulse" /> {dailyTime} UTC</span>
                    <span className="text-on-surface-variant/30">•</span>
                    <span className="flex items-center gap-0.5"><Calendar size={10} className="text-teal" /> {dailyFrequency}</span>
                    <span className="text-on-surface-variant/30">•</span>
                    <span className="flex items-center gap-0.5"><BookOpen size={10} className="text-teal" /> {dailyScope}</span>
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                {/* Expand Settings button icon */}
                <button 
                  onClick={() => setIsDailySettingsOpen(!isDailySettingsOpen)}
                  className="p-1 rounded-lg text-on-surface-variant/50 hover:text-teal hover:bg-background/40 transition-colors cursor-pointer"
                  title="Einstellungen anpassen"
                >
                  <Sliders size={16} className={isDailySettingsOpen ? "text-teal rotate-90 duration-300" : "duration-350"} />
                </button>

                {/* Main Toggle switch */}
                <button 
                  onClick={() => {
                    const next = !dailySummary;
                    setDailySummary(next);
                    saveSettings({ dailySummary: next, whaleAlerts, soundEnabled });
                    showToast(
                      next ? "Bericht Aktiviert" : "Bericht Deaktiviert",
                      next ? `Tägliche Kursübersicht um ${dailyTime} UTC aktiviert.` : "Die tägliche Kursübersicht wurde pausiert.",
                      next ? "success" : "info",
                      Newspaper
                    );
                  }}
                  className={`w-10 h-5 rounded-full relative transition-colors cursor-pointer ${dailySummary ? 'bg-teal' : 'bg-surface-container-highest'}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${dailySummary ? 'left-5.5' : 'left-0.5'}`}></div>
                </button>

                {/* Chevron marker */}
                <button 
                  onClick={() => setIsDailySettingsOpen(!isDailySettingsOpen)}
                  className="p-1 text-on-surface-variant/40 hover:text-on-surface cursor-pointer"
                >
                  {isDailySettingsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>
            </div>

            {/* Configurable body with expand transition */}
            <AnimatePresence initial={false}>
              {isDailySettingsOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="border-t border-outline-variant/10 bg-background/35"
                >
                  <div className="p-4.5 space-y-4">
                    {/* Time selection */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] uppercase tracking-wider text-teal font-extrabold flex items-center gap-1.5 font-body">
                          <Clock size={12} className="text-teal" /> Sendezeit (UTC)
                        </label>
                        <span className="text-[10px] text-on-surface-variant font-mono bg-surface-container-low/40 px-2 py-0.5 rounded">
                          Ausgelöst um {dailyTime} UTC
                        </span>
                      </div>
                      <div className="flex gap-2 items-center">
                        <input 
                          type="time" 
                          value={dailyTime}
                          onChange={(e) => {
                            const val = e.target.value;
                            setDailyTime(val);
                            saveSettings({ dailySummary, whaleAlerts, soundEnabled, dailyTime: val });
                          }}
                          className="bg-[#151515] border border-outline-variant/20 rounded-lg px-3 py-1.5 text-xs text-on-surface focus:outline-none focus:border-teal/50 font-mono"
                        />
                        <div className="flex gap-1.5 overflow-x-auto py-1 flex-1 hide-scrollbar">
                          {["08:00", "12:00", "18:00", "21:00"].map((preset) => (
                            <button
                              key={preset}
                              onClick={() => {
                                setDailyTime(preset);
                                saveSettings({ dailySummary, whaleAlerts, soundEnabled, dailyTime: preset });
                                showToast("Uhrzeit geändert", `Tägliche Kursübersicht auf ${preset} UTC gesetzt.`, "success", Clock);
                              }}
                              className={`px-2 py-1 text-[10px] font-mono rounded border transition-all cursor-pointer ${
                                dailyTime === preset 
                                  ? "bg-teal/15 text-teal border-teal/40 font-bold" 
                                  : "bg-[#1f1f1f] text-on-surface-variant/75 border-outline-variant/10 hover:border-outline-variant/30"
                              }`}
                            >
                              {preset}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Frequenz */}
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-wider text-teal font-extrabold flex items-center gap-1.5 font-body">
                        <Calendar size={12} className="text-teal" /> Sende-Frequenz
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(["Täglich", "Wochentage", "Wochenende"] as const).map((freq) => (
                          <button
                            key={freq}
                            onClick={() => {
                              setDailyFrequency(freq);
                              saveSettings({ dailySummary, whaleAlerts, soundEnabled, dailyFrequency: freq });
                              showToast("Frequenz geändert", `Wird nun ${freq.toLowerCase()} versendet.`, "success", Calendar);
                            }}
                            className={`py-2 text-[10px] rounded-lg border text-center transition-all cursor-pointer font-bold ${
                              dailyFrequency === freq 
                                ? "bg-primary/10 text-primary border-primary/40" 
                                : "bg-[#151515] text-on-surface-variant/80 border-outline-variant/10 hover:border-outline-variant/30"
                            }`}
                          >
                            {freq}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Berichtsumfang */}
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-wider text-teal font-extrabold flex items-center gap-1.5 font-body">
                        <BookOpen size={12} className="text-teal" /> Berichtsumfang
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(["Kompakt", "Standard", "Maximal"] as const).map((scope) => (
                          <button
                            key={scope}
                            onClick={() => {
                              setDailyScope(scope);
                              saveSettings({ dailySummary, whaleAlerts, soundEnabled, dailyScope: scope });
                              showToast("Berichtsumfang geändert", `Umfang auf '${scope}' gesetzt.`, "success", BookOpen);
                            }}
                            className={`py-2 px-1 text-[10px] rounded-lg border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                              dailyScope === scope 
                                ? "bg-teal/10 text-teal border-teal/40 font-black" 
                                : "bg-[#151515] text-on-surface-variant/80 border-outline-variant/10 hover:border-outline-variant/30"
                            }`}
                          >
                            <span className="font-bold">{scope}</span>
                            <span className="text-[7.5px] uppercase opacity-60 tracking-wider mt-0.5">
                              {scope === "Kompakt" ? "Nur Kurs" : scope === "Standard" ? "Kurs & Pool" : "On-chain"}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Interactive Preview Container */}
                    <div className="pt-2 border-t border-outline-variant/10 space-y-3">
                      <button
                        onClick={() => setShowPreview(!showPreview)}
                        className="w-full py-2.5 bg-[#1b1b1b] hover:bg-[#222] border border-outline-variant/15 text-[10px] tracking-wider uppercase font-black text-on-surface flex items-center justify-center gap-1.5 rounded-lg active:scale-98 transition-all cursor-pointer"
                      >
                        <Newspaper size={12} className="text-teal" />
                        <span>{showPreview ? "Vorschau ausblenden" : "Berichtsvorschau einblenden"}</span>
                      </button>

                      <AnimatePresence>
                        {showPreview && (
                          <motion.div
                            initial={{ opacity: 0, y: -8, height: 0 }}
                            animate={{ opacity: 1, y: 0, height: "auto" }}
                            exit={{ opacity: 0, y: -8, height: 0 }}
                            className="bg-[#0b0b0b] rounded-xl border border-primary/20 overflow-hidden shadow-2xl relative"
                          >
                            {/* Accent badge */}
                            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-teal via-primary to-primary" />
                            
                            <div className="p-4 space-y-3 text-left">
                              {/* Preview Header */}
                              <div className="flex justify-between items-start border-b border-outline-variant/15 pb-2.5">
                                <div>
                                  <h5 className="font-logo font-black tracking-widest text-[#F7931A] text-xs uppercase leading-none">
                                    EINUNDZWANZIG POOL
                                  </h5>
                                  <p className="font-body text-[8px] uppercase tracking-wider text-teal font-extrabold mt-1">
                                    TÄGLICHES BRIEFING • {dailyFrequency.toUpperCase()}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <span className="font-mono text-[9px] uppercase tracking-widest text-on-surface-variant/90 block">
                                    {dailyTime} UTC
                                  </span>
                                  <span className="font-body text-[7px] text-teal block font-semibold">
                                    STATUS: SYSTEMBEREIT
                                  </span>
                                </div>
                              </div>

                              {/* Preview content depending on dailyScope */}
                              <div className="space-y-3 font-body text-xs text-on-surface/95">
                                {/* Section 1: Always there */}
                                <div className="space-y-1 bg-[#1a1a1a]/40 p-2.5 rounded-lg border border-outline-variant/5">
                                  <p className="font-body text-[9px] uppercase tracking-widest text-[#F7931A] font-black">
                                    📊 Marktübersicht
                                  </p>
                                  <div className="flex justify-between items-baseline pt-0.5">
                                    <span className="font-headline font-extrabold text-[15px] text-white">$73.420</span>
                                    <span className="text-emerald-400 font-bold text-[10px] font-headline">+2.45% (24H)</span>
                                  </div>
                                  <p className="text-[9.5px] leading-relaxed text-on-surface-variant mt-1">
                                    Bitcoin behauptet sich über dem gleitenden Durchschnitt. Volumen im 24h-Trend zeigt stabile Akkumulation über Spotbörsen.
                                  </p>
                                </div>

                                {/* Section 2: Standard & Maximal */}
                                {dailyScope !== "Kompakt" && (
                                  <div className="space-y-1 bg-[#1a1a1a]/40 p-2.5 rounded-lg border border-outline-variant/5">
                                    <p className="font-body text-[9px] uppercase tracking-widest text-teal font-black">
                                      ⛏️ Pool- & Netzwerkstatus
                                    </p>
                                    <div className="grid grid-cols-2 gap-2 pt-0.5 text-[9px]">
                                      <div>
                                        <span className="text-on-surface-variant block uppercase text-[7px]">Pool-Hashrate:</span>
                                        <span className="font-headline font-bold text-on-surface text-xs">612.4 EH/s</span>
                                      </div>
                                      <div>
                                        <span className="text-on-surface-variant block uppercase text-[7px]">Schwierigkeit:</span>
                                        <span className="font-headline font-bold text-teal text-xs">+1.25% (in 6t)</span>
                                      </div>
                                    </div>
                                    <p className="text-[9px] leading-relaxed text-on-surface-variant mt-1.5">
                                      Unsere Miner-Beteiligungen laufen mit maximaler Rentabilität. Aktuelle Blockzeit im Durchschnitt bei 9m 48s.
                                    </p>
                                  </div>
                                )}

                                {/* Section 3: Maximal only */}
                                {dailyScope === "Maximal" && (
                                  <div className="space-y-1 bg-[#1a1a1a]/40 p-2.5 rounded-lg border border-teal/10">
                                    <div className="flex justify-between items-center">
                                      <p className="font-body text-[9px] uppercase tracking-widest text-[#F7931A] font-black">
                                        🔗 On-Chain & Mempool
                                      </p>
                                      <span className="text-[7px] text-[#F7931A] font-mono font-bold uppercase tracking-widest animate-pulse">
                                        Whales Aktiv
                                      </span>
                                    </div>
                                    <p className="text-[9.5px] leading-relaxed text-on-surface-variant pt-0.5">
                                      3 Groß-Wal-Aktivitäten (&gt;1.200 BTC) im Block 895.422 bestätigt. Gebührenniveau bleibt bei ca. <span className="text-teal font-bold font-mono">14 sat/vB</span> niedrig für UTXO-Konsolidierungen.
                                    </p>
                                  </div>
                                )}
                              </div>

                              {/* Simulation Button */}
                              <div className="pt-2 border-t border-outline-variant/15 flex gap-2">
                                <button
                                  onClick={() => {
                                    showToast(
                                      "Test-Briefing gesendet",
                                      `Simulierter Bericht (${dailyScope}) erfolgreich per Web-Mitteilung ausgeliefert!`,
                                      "success",
                                      Newspaper
                                    );
                                  }}
                                  className="flex-1 py-1.5 bg-[#F7931A]/10 hover:bg-[#F7931A]/20 border border-[#F7931A]/25 text-[#F7931A] text-[9px] tracking-widest uppercase font-black rounded-md transition-colors active:scale-95 cursor-pointer text-center"
                                >
                                  ⚡ Test-Bericht auslösen
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Toggle Whale Activity */}
          <button 
            onClick={() => {
              const next = !whaleAlerts;
              setWhaleAlerts(next);
              saveSettings({ dailySummary, whaleAlerts: next, soundEnabled });
              showToast(
                next ? "Wal-Melder aktiv" : "Wal-Melder stumm",
                next ? "Echtzeitalarm bei Whale-Transaktionen über 1.000 BTC scharfgeschaltet." : "Überwachung von Großtransaktionen wurde deaktiviert.",
                next ? "success" : "info",
                Waves
              );
            }}
            className="w-full bg-[#1a1a1a] rounded-xl p-4 flex items-center justify-between border border-outline-variant/10 cursor-pointer text-left focus:outline-none"
          >
            <div className="flex gap-4 items-center">
              <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-teal">
                <Waves size={20} />
              </div>
              <div>
                <h4 className="font-body font-bold text-on-surface text-sm">Wal-Aktivitätsalarme</h4>
                <p className="font-body text-[10px] text-on-surface-variant">Institutionelle Zuflüsse &gt; 1.000 BTC</p>
              </div>
            </div>
            <div className={`w-10 h-5 rounded-full relative transition-colors ${whaleAlerts ? 'bg-teal' : 'bg-surface-container-highest'}`}>
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${whaleAlerts ? 'left-5.5' : 'left-0.5'}`}></div>
            </div>
          </button>
        </div>
      </section>

      {/* Active Triggers */}
      <section className="space-y-4 pb-12">
        <div className="flex justify-between items-center">
          <h3 className="font-body text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-bold">
            Aktive Alarme ({activeTriggers.length})
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
                    {/* Delete dynamic trigger */}
                    <button 
                      onClick={() => deleteTrigger(trig.id, trig.title)}
                      className="text-on-surface-variant/40 hover:text-red-400 p-1 rounded-lg transition-colors cursor-pointer"
                      title="Alarm löschen"
                    >
                      <Trash2 size={14} />
                    </button>
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
              onClick={() => setIsModalOpen(false)}
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
                <span className="font-headline font-extrabold text-sm uppercase tracking-wider text-teal">Benutzerdefinierter Alarm</span>
                <button onClick={() => setIsModalOpen(false)} className="text-on-surface-variant/60 hover:text-on-surface">
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

                <button 
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-teal to-primary text-background shadow-[0_4px_16px_rgba(247,147,26,0.18)] font-headline font-black text-xs uppercase tracking-widest rounded-xl hover:opacity-90 transition-all active:scale-97 cursor-pointer mt-4"
                >
                  🚀 Alarm aktivieren
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
