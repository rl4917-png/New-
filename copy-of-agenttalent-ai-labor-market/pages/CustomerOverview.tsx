
import React from 'react';
import { Need, NeedStatus } from '../types';
import { CustomerView } from '../App';
import { ICONS, DESIGN } from '../constants';

interface CustomerOverviewProps {
  needs: Need[];
  setView: (view: CustomerView) => void;
}

// Color type for stats
type StatColor = 'indigo' | 'rose' | 'amber' | 'emerald';

const CustomerOverview: React.FC<CustomerOverviewProps> = ({ needs, setView }) => {
  const stats: { label: string; value: number; color: StatColor }[] = [
    { label: '总需求', value: needs.length, color: 'indigo' },
    { label: '招募中', value: needs.filter(n => n.status === NeedStatus.RECRUITING || n.status === NeedStatus.SUBMITTED).length, color: 'rose' },
    { label: '短名单评审', value: needs.filter(n => n.status === NeedStatus.SHORTLISTED).length, color: 'amber' },
    { label: '匹配成功', value: needs.filter(n => n.status === NeedStatus.MATCHED || n.status === NeedStatus.INTRO).length, color: 'emerald' },
  ];

  const recentNeeds = [...needs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 3);

  return (
    <div className={`space-y-12 ${DESIGN.animation.fadeIn}`}>
      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map(s => (
          <div key={s.label} className={`${DESIGN.card.level1} p-8 group hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300`}>
             <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">{s.label}</p>
             <p className={`text-4xl font-black mt-3 ${DESIGN.colors.text[s.color]}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Project Pipeline */}
        <div className={`${DESIGN.card.level2} p-10 space-y-8`}>
           <div className="flex justify-between items-end">
              <div>
                <h3 className="text-xl font-black text-slate-900">活跃项目流</h3>
                <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">Pipeline Status</p>
              </div>
              <button onClick={() => setView('projects')} className={`text-xs ${DESIGN.button.base} text-indigo-600 hover:underline`}>查看全部</button>
           </div>
           
           <div className="space-y-6">
             {recentNeeds.map(need => (
               <div key={need.id} className="group cursor-pointer" onClick={() => setView('projects')}>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{need.domainArea}</h4>
                    <span className="text-[9px] font-black bg-slate-50 text-slate-400 px-2 py-1 rounded-lg uppercase">{need.status}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(79,70,229,0.3)]"
                      style={{ width: `${(Object.keys(NeedStatus).indexOf(need.status.toUpperCase()) / Object.keys(NeedStatus).length) * 100}%` }}
                    ></div>
                  </div>
               </div>
             ))}
           </div>
        </div>

        {/* Quick Actions / Shortcuts */}
        <div className="space-y-6">
          <div className={`bg-indigo-600 p-10 ${DESIGN.radius.xl} ${DESIGN.shadow.primary} text-white space-y-6 relative overflow-hidden group`}>
            <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/10 blur-[60px] rounded-full group-hover:scale-125 transition-all duration-700"></div>
            <h3 className="text-2xl font-black tracking-tight relative z-10">需要新专家？</h3>
            <p className="text-indigo-100 font-medium relative z-10 leading-relaxed">Maybole 专家库覆盖 100+ 细分领域，平均 48 小时内为您提供高质量候选短名单。</p>
            <button 
              onClick={() => setView('projects')}
              className={`bg-white text-indigo-600 px-8 py-4 ${DESIGN.radius.md} ${DESIGN.button.base} shadow-xl relative z-10`}
            >
              发起新人才搜索
            </button>
          </div>

          <div 
            onClick={() => setView('shortlists')}
            className={`${DESIGN.card.level2} p-8 flex items-center justify-between cursor-pointer hover:border-amber-400 transition-all duration-300 group`}
          >
            <div className="flex items-center gap-6">
              <div className={`w-14 h-14 bg-amber-50 ${DESIGN.radius.md} flex items-center justify-center text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-all duration-300`}>
                <ICONS.User className="w-7 h-7" />
              </div>
              <div>
                <h4 className="font-black text-slate-900 uppercase tracking-tight">待审核短名单</h4>
                <p className="text-xs font-bold text-slate-400">目前有 {needs.filter(n => n.status === NeedStatus.SHORTLISTED).length} 个项目可评审专家</p>
              </div>
            </div>
            <ICONS.ArrowRight className="w-6 h-6 text-slate-300 group-hover:translate-x-2 transition-all duration-300" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerOverview;
