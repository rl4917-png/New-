
import React, { useState } from 'react';
import { ICONS, DESIGN } from '../constants';
import { CustomerView, Role } from '../App';

interface LayoutProps {
  children: React.ReactNode;
  activeRole: Role;
  customerView: CustomerView;
  setCustomerView: (view: CustomerView) => void;
  onLogout: () => void;
  onNewAction?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeRole, customerView, setCustomerView, onLogout, onNewAction }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const customerNavItems = [
    { id: 'overview', label: '项目总览', icon: ICONS.Dashboard },
    { id: 'projects', label: '需求管理', icon: ICONS.Clock },
    { id: 'shortlists', label: '专家评审', icon: ICONS.User },
  ];

  const handleNavClick = (id: string) => {
    setCustomerView(id as CustomerView);
    setIsMobileMenuOpen(false);
  };

  // Sidebar content - reusable for both desktop and mobile
  const SidebarContent = () => (
    <>
      <div className="p-6 lg:p-8">
        <h1 className="text-xl lg:text-2xl font-black text-indigo-600 flex items-center gap-3">
          <div className={`w-9 h-9 lg:w-10 lg:h-10 bg-indigo-600 ${DESIGN.radius.sm} flex items-center justify-center text-white font-black ${DESIGN.shadow.primary}`}>M</div>
          Maybole
        </h1>
      </div>
      
      <nav className="flex-1 px-3 lg:px-4 space-y-2 py-4">
        {activeRole === 'customer' && customerNavItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavClick(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 lg:py-3.5 ${DESIGN.radius.md} text-sm font-bold transition-all duration-200 ${
              customerView === item.id
                ? `bg-indigo-600 text-white ${DESIGN.shadow.primary}`
                : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </button>
        ))}
        
        {activeRole !== 'customer' && (
          <div className="px-4 py-3 text-[10px] font-black text-slate-300 uppercase tracking-widest">
            {activeRole === 'admin' ? '管理控制台' : '专家工作台'}
          </div>
        )}
      </nav>

      <div className="p-4 lg:p-6 border-t border-slate-50 space-y-4">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-slate-100 ring-2 ring-white shadow-sm overflow-hidden flex items-center justify-center font-bold text-slate-400">
            {activeRole.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black text-slate-900 truncate uppercase tracking-tight">
              {activeRole === 'expert' ? '专家成员' : activeRole === 'admin' ? '系统管理员' : '尊贵客户'}
            </p>
            <p className="text-[9px] font-black text-slate-300 uppercase tracking-tighter">{activeRole}</p>
          </div>
        </div>
        <button 
          onClick={onLogout}
          className={`w-full py-2.5 ${DESIGN.radius.sm} text-[10px] ${DESIGN.button.base} text-slate-400 hover:text-rose-500 hover:bg-rose-50 border border-slate-100`}
        >
          安全退出
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-sm lg:text-base">
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-slate-200 flex-col shrink-0">
        <SidebarContent />
      </aside>

      {/* Sidebar - Mobile Drawer */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col transform transition-transform duration-300 ease-out lg:hidden ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="absolute top-4 right-4">
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all"
          >
            <ICONS.Close className="w-5 h-5" />
          </button>
        </div>
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 lg:px-10 py-4 lg:py-5 flex justify-between items-center">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className={`lg:hidden p-2 ${DESIGN.radius.sm} text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all`}
            >
              <ICONS.Menu className="w-6 h-6" />
            </button>
            
            <h2 className="text-lg lg:text-xl font-black text-slate-900 tracking-tight">
              {activeRole === 'customer' 
                ? customerNavItems.find(n => n.id === customerView)?.label 
                : (activeRole === 'admin' ? '管理后台' : '专家控制面板')}
            </h2>
          </div>
          <div className="flex gap-2 lg:gap-4">
            {activeRole === 'customer' && (
              <button 
                onClick={onNewAction}
                className={`flex items-center gap-2 text-[10px] lg:text-xs ${DESIGN.button.base} ${DESIGN.button.primary} px-4 lg:px-6 py-2.5 lg:py-3 ${DESIGN.radius.md}`}
              >
                <ICONS.Plus className="w-4 h-4" />
                <span className="hidden sm:inline">提交新需求</span>
                <span className="sm:hidden">新需求</span>
              </button>
            )}
          </div>
        </header>
        
        <div className="p-4 lg:p-10 max-w-7xl mx-auto min-h-[calc(100vh-80px)]">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
