
import React from 'react';
import { ICONS } from '../constants';
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
  const customerNavItems = [
    { id: 'overview', label: '项目总览', icon: ICONS.Dashboard },
    { id: 'projects', label: '需求管理', icon: ICONS.Clock },
    { id: 'shortlists', label: '专家评审', icon: ICONS.User },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-sm lg:text-base">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-8">
          <h1 className="text-2xl font-black text-indigo-600 flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black shadow-xl shadow-indigo-100">M</div>
            Maybole
          </h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 py-4">
          {activeRole === 'customer' && customerNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCustomerView(item.id as CustomerView)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${
                customerView === item.id
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
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

        <div className="p-6 border-t border-slate-50 space-y-4">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-10 h-10 rounded-full bg-slate-100 ring-2 ring-white shadow-sm overflow-hidden flex items-center justify-center font-bold text-slate-400">
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
            className="w-full py-2.5 rounded-xl text-[10px] font-black text-slate-400 hover:text-rose-500 hover:bg-rose-50 border border-slate-100 transition-all uppercase tracking-widest"
          >
            安全退出
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-10 py-5 flex justify-between items-center">
          <div>
             <h2 className="text-xl font-black text-slate-900 tracking-tight">
              {activeRole === 'customer' 
                ? customerNavItems.find(n => n.id === customerView)?.label 
                : (activeRole === 'admin' ? '管理后台' : '专家控制面板')}
            </h2>
          </div>
          <div className="flex gap-4">
            {activeRole === 'customer' && (
              <button 
                onClick={onNewAction}
                className="flex items-center gap-2 text-xs font-black bg-indigo-600 text-white px-6 py-3 rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95 uppercase tracking-widest"
              >
                <ICONS.Plus className="w-4 h-4" />
                提交新需求
              </button>
            )}
          </div>
        </header>
        
        <div className="p-10 max-w-7xl mx-auto min-h-[calc(100vh-80px)]">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
