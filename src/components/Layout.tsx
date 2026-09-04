import React, { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  CalendarPlus,
  FileSpreadsheet,
  FileText,
  Menu,
  X,
  Check,
  Bot,
  Settings,
  Building2,
  ChevronDown,
  WifiOff,
} from "lucide-react";
import { cn } from "../lib/utils";
import { useStore } from "../hooks/useStore";
import { motion, AnimatePresence } from "motion/react";
export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [companyDropdownOpen, setCompanyDropdownOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const {
    isSyncing,
    lastSyncTime,
    companies,
    activeCompanyId,
    activeCompany,
    switchCompany,
  } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    document.documentElement.classList.remove("dark");
    localStorage.removeItem("theme");
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);
  const navItems = [
    { name: "لوحة التحكم", path: "/", icon: LayoutDashboard },
    { name: "إدارة العمال", path: "/workers", icon: Users },
    { name: "الترحيل اليومي", path: "/daily-entry", icon: CalendarPlus },
    { name: "الترحيل الجماعي", path: "/bulk-entry", icon: FileSpreadsheet },
    { name: "كشوفات الحساب", path: "/statements", icon: FileText },
    { name: "المساعد الذكي", path: "/smart-chat", icon: Bot },
    { name: "الإعدادات والمؤسسات", path: "/settings", icon: Settings },
  ];
  return (
    <div
      className=" min-h-screen print:min-h-0 flex text-text-main bg-brand-bg print:block print:bg-surface"
      dir="rtl"
    >
      {" "}
      {/* Mobile Sidebar Overlay */}{" "}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}{" "}
      {/* Sidebar */}{" "}
      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-64 bg-surface shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 print:hidden flex flex-col border-l border-border-main/50",
          sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0",
        )}
      >
        {" "}
        <div className="flex items-center justify-between h-20 px-6 border-b border-border-main/50">
          {" "}
          <div className="flex items-center gap-3">
            {" "}
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              {" "}
              <Building2 className="w-6 h-6" />{" "}
            </div>{" "}
            <span className="text-xl font-black text-text-main tracking-tight">
              {" "}
              نظام العمال{" "}
            </span>{" "}
          </div>{" "}
          <button
            className="lg:hidden text-text-muted hover:text-text-main"
            onClick={() => setSidebarOpen(false)}
          >
            {" "}
            <X size={24} />{" "}
          </button>{" "}
        </div>{" "}
        <nav className="p-5 space-y-1.5 flex-1 overflow-y-auto">
          {" "}
          <div className="text-xs font-bold text-text-muted/60 mb-4 px-2 tracking-wider">
            القائمة الرئيسية
          </div>{" "}
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all duration-200",
                  isActive
                    ? "bg-primary text-white shadow-md shadow-primary/20 scale-[1.02]"
                    : "text-text-muted hover:bg-brand-bg hover:text-text-main",
                )
              }
            >
              {" "}
              <item.icon className="w-5 h-5 ml-3" /> {item.name}{" "}
            </NavLink>
          ))}{" "}
        </nav>{" "}
      </aside>{" "}
      {/* Main Content */}{" "}
      <div className="flex-1 flex flex-col min-h-screen print:min-h-0 overflow-hidden print:overflow-visible print:block w-full">
        {" "}
        {/* Header */}{" "}
        <header className="flex items-center justify-between h-20 px-4 bg-surface shadow-sm sm:px-6 lg:px-8 print:hidden border-b border-border-main/50 relative z-30">
          {" "}
          <div className="flex items-center gap-4">
            {" "}
            <button
              className="p-2 -mr-2 text-text-muted rounded-xl lg:hidden hover:text-text-main hover:bg-brand-bg"
              onClick={() => setSidebarOpen(true)}
            >
              {" "}
              <Menu size={24} />{" "}
            </button>{" "}
            {/* Prominent Company Switcher in Header */}{" "}
            <div className="relative">
              {" "}
              <button
                onClick={() => setCompanyDropdownOpen(!companyDropdownOpen)}
                className="flex items-center gap-3 bg-brand-bg hover:bg-border-main/80 px-4 py-2.5 rounded-2xl border border-border-main/50 transition-all duration-200"
              >
                {" "}
                <div className="w-8 h-8 rounded-lg bg-white shadow-sm border border-border-main/50 flex items-center justify-center text-primary flex-shrink-0">
                  {" "}
                  <Building2 className="w-4 h-4" />{" "}
                </div>{" "}
                <div className="flex flex-col items-start hidden sm:flex">
                  {" "}
                  <span className="text-[10px] font-bold text-text-muted leading-none mb-1">
                    المؤسسة النشطة
                  </span>{" "}
                  <span className="text-sm font-black text-text-main leading-none truncate max-w-[150px]">
                    {activeCompany?.name || "اختر المؤسسة"}
                  </span>{" "}
                </div>{" "}
                <ChevronDown
                  className={cn(
                    "w-4 h-4 text-text-muted transition-transform duration-200 ml-1",
                    companyDropdownOpen ? "rotate-180" : "",
                  )}
                />{" "}
              </button>{" "}
              <AnimatePresence>
                {" "}
                {companyDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full right-0 mt-2 w-64 bg-surface border border-border-main/50 shadow-2xl rounded-2xl overflow-hidden z-50 py-2"
                  >
                    {" "}
                    <div className="px-4 py-2 mb-2 border-b border-border-main/50">
                      {" "}
                      <p className="text-xs font-bold text-text-muted">
                        التبديل السريع
                      </p>{" "}
                    </div>{" "}
                    <div className=" max-h-60 overflow-y-auto px-2">
                      {" "}
                      {companies.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => {
                            switchCompany(c.id);
                            setCompanyDropdownOpen(false);
                          }}
                          className={cn(
                            "w-full text-right px-3 py-2.5 rounded-xl text-sm transition-colors flex items-center gap-3 mb-1",
                            activeCompanyId === c.id
                              ? "bg-primary/10 text-primary font-black"
                              : "text-text-main hover:bg-brand-bg hover:text-text-main font-bold",
                          )}
                        >
                          {" "}
                          <div
                            className={cn(
                              "w-2 h-2 rounded-full",
                              activeCompanyId === c.id
                                ? "bg-primary"
                                : "bg-transparent",
                            )}
                          />{" "}
                          {c.name}{" "}
                        </button>
                      ))}{" "}
                    </div>{" "}
                    <div className="border-t border-border-main/50 px-2 pt-2 mt-1">
                      {" "}
                      <button
                        onClick={() => {
                          navigate("/settings");
                          setCompanyDropdownOpen(false);
                        }}
                        className="w-full text-right px-3 py-2.5 text-sm text-primary hover:bg-primary/10 rounded-xl font-bold flex items-center justify-center transition-colors"
                      >
                        {" "}
                        <Settings className="w-4 h-4 ml-2" /> إدارة جميع
                        المؤسسات{" "}
                      </button>{" "}
                    </div>{" "}
                  </motion.div>
                )}{" "}
              </AnimatePresence>{" "}
            </div>{" "}
          </div>{" "}
          <div className="flex items-center space-x-2 space-x-reverse">
            {" "}
            {!isOnline && (
              <div className="flex items-center text-xs text-danger font-bold mx-2 bg-danger/10 px-3 py-1.5 rounded-full">
                {" "}
                <WifiOff className="w-3.5 h-3.5 ml-1.5" /> وضع عدم الاتصال{" "}
              </div>
            )}{" "}
            <div className="hidden sm:flex items-center text-xs font-bold text-text-muted mx-2 bg-brand-bg px-3 py-1.5 rounded-full border border-border-main/50">
              {" "}
              {lastSyncTime ? (
                <span className="flex items-center text-success">
                  {" "}
                  <Check className="w-3.5 h-3.5 ml-1.5" /> متزامن{" "}
                </span>
              ) : (
                <span>جاري المزامنة...</span>
              )}{" "}
            </div>{" "}
          </div>{" "}
        </header>{" "}
        {/* Page Content with Transitions */}{" "}
        <main className="flex-1 overflow-auto print:overflow-visible p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 print:p-0 print:pb-0 relative z-0 bg-brand-bg">
          {" "}
          <AnimatePresence mode="wait">
            {" "}
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="h-full max-w-7xl mx-auto"
            >
              {" "}
              <Outlet />{" "}
            </motion.div>{" "}
          </AnimatePresence>{" "}
        </main>{" "}
      </div>{" "}
      {/* Mobile Bottom Navigation */}{" "}
      <nav className="lg:hidden print:hidden fixed bottom-0 left-0 right-0 w-full bg-surface border-t border-border-main/50 z-50 shadow-[0_-10px_20px_rgba(0,0,0,0.02)] pb-safe">
        {" "}
        <div className="flex items-center justify-between h-16 px-1 overflow-x-auto">
          {" "}
          {navItems.slice(0, 5).map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center flex-1 h-full min-w-16 transition-all duration-200 relative",
                  isActive
                    ? "text-primary"
                    : "text-text-muted hover:text-text-main",
                )
              }
            >
              {({ isActive }) => {
                return (
                  <>
                    <item.icon
                      className={cn(
                        "w-5 h-5 mb-1 flex-shrink-0 transition-transform duration-200",
                        isActive && "scale-110",
                      )}
                    />
                    <span
                      className={cn(
                        "text-[10px] sm:text-xs truncate w-full text-center px-0.5 transition-all duration-200",
                        isActive ? "font-black" : "font-medium",
                      )}
                    >
                      {item.name}
                    </span>
                    {isActive && (
                      <motion.div
                        layoutId="mobileNavIndicator"
                        className="absolute top-0 w-8 h-1 bg-primary rounded-b-full"
                      />
                    )}
                  </>
                );
              }}
            </NavLink>
          ))}{" "}
        </div>{" "}
      </nav>{" "}
    </div>
  );
}
