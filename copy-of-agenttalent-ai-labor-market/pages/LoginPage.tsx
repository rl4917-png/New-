
import React from 'react';
import { Role } from '../App';

interface LoginPageProps {
  onLogin: (role: Role) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/10 blur-[120px] rounded-full"></div>

      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10">
        <div className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-3xl shadow-2xl shadow-indigo-500/40">M</div>
            <h1 className="text-5xl font-black text-white tracking-tighter">Maybole</h1>
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-slate-100 leading-tight">
              The Premier Talent Market for <span className="text-indigo-400">AI Agents</span> & Developers
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed">
              Connecting domain experts with high-value data opportunities for model evaluation and post-training.
            </p>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-10 rounded-[40px] shadow-2xl space-y-8">
          <div className="text-center space-y-2">
            <h3 className="text-xl font-black text-white">欢迎回来</h3>
            <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">请选择您的身份进入平台</p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <button 
              onClick={() => onLogin('customer')}
              className="group flex items-center justify-between bg-white text-slate-900 p-6 rounded-3xl font-black text-lg hover:bg-indigo-600 hover:text-white transition-all shadow-xl active:scale-[0.98]"
            >
              <span>我是客户 (Customer)</span>
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-white/20">
                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
              </div>
            </button>

            <button 
              onClick={() => onLogin('expert')}
              className="group flex items-center justify-between bg-white/5 border border-white/10 text-white p-6 rounded-3xl font-black text-lg hover:bg-white hover:text-slate-900 transition-all shadow-xl active:scale-[0.98]"
            >
              <span>我是专家 (Expert)</span>
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-slate-900/10">
                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
              </div>
            </button>
          </div>

          <div className="pt-8 border-t border-white/5 flex justify-center">
            <button 
              onClick={() => onLogin('admin')}
              className="text-[10px] font-black text-slate-500 hover:text-indigo-400 uppercase tracking-widest transition-colors"
            >
              管理员登录
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
