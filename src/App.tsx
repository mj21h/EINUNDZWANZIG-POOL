import React, { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Analysis from './pages/Analysis';
import News from './pages/News';
import Alerts from './pages/Alerts';
import GlobalPoller from './components/GlobalPoller';
import { AnimatePresence, motion } from 'framer-motion';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'indikatoren': return <Analysis />;
      case 'news': return <News />;
      case 'alerts': return <Alerts />;
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
