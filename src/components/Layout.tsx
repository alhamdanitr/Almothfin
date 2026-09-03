import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, CalendarPlus, FileSpreadsheet, FileText, Menu, X, Check, Bot, Settings, Building2, ChevronDown, WifiOff } from 'lucide-react';
import { cn } from '../lib/utils';
import { useStore } from '../hooks/useStore';

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [companyDropdownOpen, setCompanyDropdownOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const { isSyncing, lastSyncTime, companies, activeCompanyId, activeCompany, switchCompany } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.classList.remove('dark');
    localStorage.removeItem('theme');
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);


  const navItems = [
    { name: 'لوحة التحكم', path: '/', icon: LayoutDashboard },
    { name: 'إدارة العمال', path: '/workers', icon: Users },
    { name: 'الترحيل اليومي', path: '/daily-entry', icon: CalendarPlus },
    { name: 'الترحيل الجماعي', path: '/bulk-entry', icon: FileSpreadsheet },
    { name: 'كشوفات الحساب', path: '/statements', icon: FileText },
    { name: 'المساعد الذكي', path: '/smart-chat', icon: Bot },
    { name: 'الإعدادات والمؤسسات', path: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen print:min-h-0 flex text-text-main bg-brand-bg print:block print:bg-surface" dir="rtl">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 right-0 z-50 w-64 bg-surface dark:bg-slate-800 shadow-xl transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 print:hidden flex flex-col",
        sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
      )}>
        <div className="flex items-center justify-between h-16 px-6 border-b dark:border-slate-700">
          <span className="text-xl font-bold text-primary dark:text-secondary truncate pr-2">
            {activeCompany?.name || 'النظام الإداري'}
          </span>
          <button className="lg:hidden text-text-muted hover:text-text-main dark:text-text-muted dark:hover:text-gray-200" onClick={() => setSidebarOpen(false)}>
            <X size={24} />
          </button>
        </div>
        
        <div className="p-4 border-b border-border-main relative">
           <button 
             onClick={() => setCompanyDropdownOpen(!companyDropdownOpen)}
             className="w-full flex items-center justify-between bg-brand-bg hover:bg-brand-bg/80 px-3 py-2 rounded-lg border border-border-main transition-colors"
           >
             <div className="flex items-center space-x-2 space-x-reverse overflow-hidden">
               <Building2 className="w-5 h-5 text-text-muted flex-shrink-0" />
               <span className="text-sm font-bold text-text-main truncate">{activeCompany?.name || 'اختر المؤسسة'}</span>
             </div>
             <ChevronDown className="w-4 h-4 text-text-muted flex-shrink-0" />
           </button>
           
           {companyDropdownOpen && (
             <div className="absolute top-full left-4 right-4 mt-1 bg-surface border border-border-main shadow-lg rounded-xl overflow-hidden z-50 py-1">
               <div className="max-h-48 overflow-y-auto">
                 {companies.map(c => (
                   <button
                     key={c.id}
                     onClick={() => { switchCompany(c.id); setCompanyDropdownOpen(false); }}
                     className={cn("w-full text-right px-4 py-2 text-sm hover:bg-primary/10 transition-colors", activeCompanyId === c.id ? "bg-primary/10 text-primary font-bold" : "text-text-main")}
                   >
                     {c.name}
                   </button>
                 ))}
               </div>
               <div className="border-t border-border-main pt-1 mt-1">
                 <button onClick={() => { navigate('/settings'); setCompanyDropdownOpen(false); }} className="w-full text-right px-4 py-2 text-sm text-primary hover:bg-primary/10 font-medium flex items-center">
                   <Settings className="w-4 h-4 ml-2" /> إدارة المؤسسات
                 </button>
               </div>
             </div>
           )}
        </div>

        <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => cn(
                "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                isActive 
                  ? "bg-primary/10 text-primary dark:bg-secondary/10 dark:text-secondary" 
                  : "text-text-muted hover:bg-brand-bg/80 hover:text-text-main dark:text-text-muted dark:hover:bg-slate-700/50 dark:hover:text-gray-100"
              )}
            >
              <item.icon className="w-5 h-5 ml-3" />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen print:min-h-0 overflow-hidden print:overflow-visible print:block w-full">
        {/* Header */}
        <header className="flex items-center justify-between h-16 px-4 bg-surface dark:bg-slate-800 shadow-sm sm:px-6 lg:px-8 print:hidden">
          <button 
            className="p-2 -mr-2 text-text-muted rounded-md lg:hidden hover:text-text-main hover:bg-brand-bg/80 dark:hover:bg-slate-700 dark:text-text-muted"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>
          
          <div className="flex items-center flex-1 lg:justify-end justify-between">
            <h1 className="text-lg font-semibold lg:hidden truncate ml-4">{activeCompany?.name || 'النظام الإداري'}</h1>
            <div className="flex items-center space-x-2 space-x-reverse">
              {!isOnline && (
                <div className="flex items-center text-xs text-danger font-medium mx-2 bg-danger/10 px-2 py-1 rounded-full">
                  <WifiOff className="w-3 h-3 ml-1" />
                  وضع عدم الاتصال
                </div>
              )}
              <div className="hidden sm:flex items-center text-xs text-text-muted dark:text-text-muted mx-2">
                {lastSyncTime ? (
                  <span className="flex items-center text-success dark:text-success">
                    <Check className="w-3 h-3 ml-1" />
                    متزامن ({lastSyncTime})
                  </span>
                ) : (
                  <span>جاري المزامنة...</span>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto print:overflow-visible p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8 print:p-0 print:pb-0 relative z-0">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden print:hidden fixed bottom-0 left-0 right-0 w-full bg-surface dark:bg-slate-800 border-t border-border-main dark:border-slate-700 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] pb-safe">
        <div className="flex items-center justify-between h-16 px-1 overflow-x-auto">
          {navItems.slice(0, 5).map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(
                "flex flex-col items-center justify-center flex-1 h-full min-w-16 transition-colors",
                isActive 
                  ? "text-primary dark:text-secondary" 
                  : "text-text-muted hover:text-text-main dark:text-text-muted dark:hover:text-gray-100"
              )}
            >
              <item.icon className="w-5 h-5 mb-1 flex-shrink-0" />
              <span className="text-[10px] sm:text-xs truncate w-full text-center px-0.5 font-medium">{item.name}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
