import React from 'react';
import { LayoutDashboard, BarChart2, Newspaper, Settings } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Layout({ children, activeTab, setActiveTab }: LayoutProps) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'indikatoren', label: 'Indikatoren', icon: BarChart2 },
    { id: 'news', label: 'News', icon: Newspaper },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header 
        className="fixed top-0 w-full z-50 bg-background/90 backdrop-blur-md border-b border-outline-variant/30"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="flex justify-between items-center px-6 h-16 max-w-md mx-auto w-full">
          <div className="flex items-center">
            <h1 className="font-logo font-black text-lg text-white uppercase tracking-wider mt-0.5">
              EINUNDZWANZIG POOL
            </h1>
          </div>
          <button 
            onClick={() => {
              setActiveTab('settings');
              window.scrollTo({ top: 0, behavior: 'auto' });
            }}
            className={cn(
              "p-2 rounded-full transition-colors",
              activeTab === 'settings' ? "bg-primary/20 text-primary" : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
            )}
          >
            <Settings size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main 
        className="flex-1"
        style={{ 
          paddingTop: 'calc(5rem + env(safe-area-inset-top))', 
          paddingBottom: 'calc(8rem + env(safe-area-inset-bottom))' 
        }}
      >
        <div className="max-w-md mx-auto">
          {children}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav 
        className="fixed bottom-0 left-0 w-full bg-background/80 backdrop-blur-xl border-t border-outline-variant/15 shadow-[0_-16px_32px_rgba(0,0,0,0.5)] z-50"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex justify-between items-center px-3 pb-6 pt-4 max-w-md mx-auto w-full font-body">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            // Dynamic premium highlight states
            let tabStyle = "text-on-surface-variant opacity-60 hover:opacity-100";
            let iconStyle = "text-on-surface-variant";
            
            if (isActive) {
              tabStyle = "bg-primary/10 text-primary scale-105 border border-primary/25 shadow-[0_0_20px_rgba(247,147,26,0.18)]";
              iconStyle = "text-primary drop-shadow-[0_0_8px_rgba(247,147,26,0.7)] fill-primary/10";
            }

            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  window.scrollTo({ top: 0, behavior: 'auto' });
                }}
                className={cn(
                   "flex flex-col items-center justify-center transition-all duration-300 px-2 py-2 mx-1 rounded-xl cursor-pointer relative flex-1 w-full",
                  tabStyle
                )}
              >
                {isActive && (
                  <span className="absolute inset-0 bg-primary/5 rounded-xl blur-md -z-10 animate-pulse" />
                )}
                <Icon size={22} className={iconStyle} />
                <span className={cn(
                  "font-body text-[10px] uppercase tracking-widest mt-1.5 transition-all duration-300 font-extrabold",
                  isActive ? "" : "text-on-surface-variant opacity-75"
                )}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
