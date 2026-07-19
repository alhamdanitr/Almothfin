import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Users, CalendarPlus, FileSpreadsheet, FileText, Menu, X, Moon, Sun, Cloud, Check, RefreshCw } from 'lucide-react';
import { cn } from '../lib/utils';
import { useStore } from '../hooks/useStore';

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDark, setIsDark] = useState(false); // Can be persisted later
  const [cloudModalOpen, setCloudModalOpen] = useState(false);
  const [cloudUrl, setCloudUrl] = useState(localStorage.getItem('google_sheet_url') || 'https://script.google.com/macros/s/AKfycbwWkIwLCFG0cqNzOWzgmDb7qgpmURcoVyJNUbj1lXRR7LuLBTtf8hstrA0pA70XdlcC/exec');

  const { isSyncing, lastSyncTime, forceSync } = useStore();

  const toggleTheme = () => {
    setIsDark(!isDark);
    if (!isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const saveCloudSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('google_sheet_url', cloudUrl);
    setCloudModalOpen(false);
    forceSync();
    alert('تم حفظ إعدادات الربط السحابي ومزامنة البيانات بنجاح!');
  };

  const navItems = [
    { name: 'لوحة التحكم', path: '/', icon: LayoutDashboard },
    { name: 'إدارة العمال', path: '/workers', icon: Users },
    { name: 'الترحيل اليومي', path: '/daily-entry', icon: CalendarPlus },
    { name: 'الترحيل الجماعي', path: '/bulk-entry', icon: FileSpreadsheet },
    { name: 'كشوفات الحساب', path: '/statements', icon: FileText },
  ];

  return (
    <div className={cn("min-h-screen flex text-gray-900 bg-gray-50", isDark ? "dark:bg-slate-900 dark:text-slate-100" : "")} dir="rtl">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 right-0 z-50 w-64 bg-white dark:bg-slate-800 shadow-xl transition-transform duration-300 ease-in-out lg:static lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
      )}>
        <div className="flex items-center justify-between h-16 px-6 border-b dark:border-slate-700">
          <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">معمل هاشم الأحمدي</span>
          <button className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" onClick={() => setSidebarOpen(false)}>
            <X size={24} />
          </button>
        </div>
        
        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => cn(
                "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                isActive 
                  ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400" 
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-slate-700/50 dark:hover:text-gray-100"
              )}
            >
              <item.icon className="w-5 h-5 ml-3" />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between h-16 px-4 bg-white dark:bg-slate-800 shadow-sm sm:px-6 lg:px-8">
          <button 
            className="p-2 -mr-2 text-gray-500 rounded-md lg:hidden hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-slate-700 dark:text-gray-400"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>
          
          <div className="flex items-center flex-1 lg:justify-end justify-between">
            <h1 className="text-lg font-semibold lg:hidden">نظام إدارة العمال</h1>
            <div className="flex items-center space-x-2 space-x-reverse">
              <div className="hidden sm:flex items-center text-xs text-gray-500 dark:text-gray-400 mx-2">
                {isSyncing ? (
                  <span className="flex items-center text-indigo-600 dark:text-indigo-400">
                    <RefreshCw className="w-3 h-3 ml-1 animate-spin" />
                    جاري المزامنة...
                  </span>
                ) : lastSyncTime ? (
                  <span className="flex items-center text-emerald-600 dark:text-emerald-400">
                    <Check className="w-3 h-3 ml-1" />
                    متزامن ({lastSyncTime})
                  </span>
                ) : (
                  <span>غير متصل بالسحابة</span>
                )}
              </div>
              <button 
                onClick={toggleTheme}
                className="p-2 text-gray-500 rounded-full hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-slate-700 transition-colors"
                title="تغيير المظهر"
              >
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button 
                onClick={() => setCloudModalOpen(true)}
                className="flex items-center px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
              >
                <Cloud size={18} className="ml-2" />
                <span className="hidden sm:inline">الربط السحابي</span>
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 w-full bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] pb-safe">
        <div className="flex items-center justify-between h-16 px-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(
                "flex flex-col items-center justify-center flex-1 h-full min-w-0 transition-colors",
                isActive 
                  ? "text-indigo-600 dark:text-indigo-400" 
                  : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
              )}
            >
              <item.icon className="w-5 h-5 mb-1 flex-shrink-0" />
              <span className="text-[10px] sm:text-xs truncate w-full text-center px-0.5 font-medium">{item.name}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Cloud Settings Modal */}
      {cloudModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b dark:border-slate-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                <Cloud className="w-5 h-5 ml-2 text-indigo-500" />
                إعدادات الربط السحابي
              </h3>
              <button onClick={() => setCloudModalOpen(false)} className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={saveCloudSettings} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">رابط Google Sheets Web App</label>
                <input
                  type="url"
                  value={cloudUrl}
                  onChange={(e) => setCloudUrl(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white text-left"
                  placeholder="https://script.google.com/macros/s/..."
                  dir="ltr"
                />
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  قم بلصق رابط التطبيق الخاص بك لربط النظام بقاعدة بيانات Google Sheets بشكل مباشر.
                </p>
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3 space-x-reverse">
                <button
                  type="button"
                  onClick={() => setCloudModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 focus:outline-none flex items-center"
                >
                  <Check className="w-4 h-4 ml-2" />
                  حفظ الإعدادات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
