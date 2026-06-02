import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Analysis from './pages/Analysis';
import News from './pages/News';
import Settings from './pages/Settings';
import GlobalPoller from './components/GlobalPoller';
import { AnimatePresence, motion } from 'framer-motion';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [activeTab]);

  useEffect(() => {
    const initNotifications = async () => {
      let currentPermission = 'default';
      if (Capacitor.isNativePlatform()) {
        const perm = await LocalNotifications.checkPermissions();
        currentPermission = perm.display;
      } else if ('Notification' in window) {
        currentPermission = Notification.permission;
      }

      const hasPrompted = localStorage.getItem('einundzwanzig_push_prompted');
      if (currentPermission === 'default' && !hasPrompted) {
        try {
          localStorage.setItem('einundzwanzig_push_prompted', 'true');
          let permission = 'denied';
          
          if (Capacitor.isNativePlatform()) {
            const perm = await LocalNotifications.requestPermissions();
            permission = perm.display;
          } else if ('Notification' in window) {
            permission = await Notification.requestPermission();
          }

          if (permission === 'granted') {
            localStorage.setItem('einundzwanzig_news_notifications', 'true');
            localStorage.setItem('einundzwanzig_alert_push_enabled', 'true');
            
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
          console.error('Error auto-requesting notifications:', err);
        }
      }
    };
    initNotifications();
  }, []);

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
    </>
  );
}
