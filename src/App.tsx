import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Analysis from './pages/Analysis';
import News from './pages/News';
import Settings from './pages/Settings';
import GlobalPoller from './components/GlobalPoller';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, X } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showPushPrompt, setShowPushPrompt] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [activeTab]);

  useEffect(() => {
    const checkNotificationPermission = async () => {
      let currentPermission = 'default';
      if (Capacitor.isNativePlatform()) {
        const perm = await LocalNotifications.checkPermissions();
        currentPermission = perm.display;
      } else if ('Notification' in window) {
        currentPermission = Notification.permission;
      }

      const hasPrompted = localStorage.getItem('einundzwanzig_push_prompted');
      if (currentPermission === 'default' && !hasPrompted) {
        setShowPushPrompt(true);
      }
    };
    checkNotificationPermission();
  }, []);

  const handleRequestPush = async () => {
    setShowPushPrompt(false);
    localStorage.setItem('einundzwanzig_push_prompted', 'true');

    try {
      let permission = 'denied';
      if (Capacitor.isNativePlatform()) {
        const perm = await LocalNotifications.requestPermissions();
        permission = perm.display;
      } else if ('Notification' in window) {
        permission = await Notification.requestPermission();
      }

      if (permission === 'granted') {
        localStorage.setItem('einundzwanzig_news_notifications', 'true');
        localStorage.setItem('einundzwanzig_push_enabled', 'true');
        
        if (!Capacitor.isNativePlatform() && 'serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.register('/sw.js');
          if ('periodicSync' in reg) {
            try {
              const status = await navigator.permissions.query({ name: 'periodic-background-sync' as any });
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
  };

  const declinePush = () => {
    setShowPushPrompt(false);
    localStorage.setItem('einundzwanzig_push_prompted', 'true');
  };

  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'indikatoren': return <Analysis />;
      case 'news': return <News />;
      case 'settings': return <Settings />;
      default: return <Dashboard />;
    }
  };

  return (
    <>
      <GlobalPoller />
      <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
        <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {renderPage()}
        </motion.div>
      </AnimatePresence>
    </Layout>
    
    <AnimatePresence>
      {showPushPrompt && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-surface-container border border-outline-variant/20 rounded-3xl p-6 max-w-sm w-full relative shadow-2xl"
          >
            <button 
              onClick={declinePush}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-teal/10 flex items-center justify-center text-teal mb-4 mx-auto">
              <Bell size={24} className="animate-bounce" />
            </div>

            <h3 className="font-headline font-bold text-xl text-on-surface text-center mb-2">Push-Mitteilungen erlauben?</h3>
            <p className="font-body text-sm text-on-surface-variant text-center mb-6">
              Bleibe immer informiert über neue <strong className="text-on-surface">News-Artikel</strong> und kritische <strong className="text-on-surface">Kurs-Alarme</strong>.
            </p>

            <div className="space-y-3">
              <button 
                onClick={handleRequestPush}
                className="w-full py-3.5 bg-teal hover:bg-teal/90 text-background font-bold rounded-xl transition-colors cursor-pointer"
              >
                Aktivieren
              </button>
              <button 
                onClick={declinePush}
                className="w-full py-3.5 bg-surface-container-high hover:bg-surface-container-highest text-on-surface rounded-xl transition-colors font-medium border border-outline-variant/15 cursor-pointer"
              >
                Später vielleicht
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}
