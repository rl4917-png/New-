
import React, { useState, useMemo } from 'react';
import { MOCK_EXPERTS, MOCK_MATCHES, MOCK_TEMPLATES } from '../services/mockData';
import { Need, NeedStatus, ExpertProfile, TrustTier, MatchRecord, MatchStatus, ClarificationMessage, ShortlistReview, TaskType, ExpertTier, DataProductType, AdminTemplate } from '../types';
import { ICONS, DESIGN } from '../constants';
import { GoogleGenAI } from '@google/genai';

interface AdminDashboardProps {
  needs: Need[];
  onUpdateNeed: (need: Need) => void;
}

type AdminTab = 'analytics' | 'queue' | 'experts' | 'intelligence' | 'templates';

const AdminDashboard: React.FC<AdminDashboardProps> = ({ needs, onUpdateNeed }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('analytics');
  const [selectedNeedId, setSelectedNeedId] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [adminReply, setAdminReply] = useState('');
  const [matchingMode, setMatchingMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedNeed = useMemo(() => needs.find(n => n.id === selectedNeedId), [needs, selectedNeedId]);

  // Analytics Calculation
  const metrics = useMemo(() => {
    const closed = needs.filter(n => n.status === NeedStatus.CLOSED);
    const avgTTD = closed.length ? closed.reduce((acc, curr) => acc + (curr.ttd_days || 0), 0) / closed.length : 3.5;
    const activeNeedsCount = needs.filter(n => n.status !== NeedStatus.CLOSED && n.status !== NeedStatus.PAUSED).length;
    const pendingAdmins = needs.filter(n => n.pendingActionBy === 'admin').length;
    
    return {
      ttd: `${avgTTD.toFixed(1)} Days`,
      activeNeeds: activeNeedsCount,
      pendingAdmin: pendingAdmins,
      conversion: '72%'
    };
  }, [needs]);

  // Intelligence Aggregation
  const marketIntelligence = useMemo(() => {
    const losses = MOCK_MATCHES.filter(m => [MatchStatus.REJECTED_PREVIEW, MatchStatus.WITHDRAWN, MatchStatus.STOPPED].includes(m.status));
    return losses.map(m => ({
      ...m,
      expertName: MOCK_EXPERTS.find(e => e.id === m.expertId)?.name || 'Unknown',
      needName: needs.find(n => n.id === m.needId)?.domainArea || 'Archive Project'
    }));
  }, [needs]);

  // Handlers
  const handleApproveAndStructure = async () => {
    if (!selectedNeed) return;
    setIsTranslating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Structure this AI talent request for high-end matching:
      Request: "${selectedNeed.taskDescription}"
      Output Format (Chinese):
      - Master Domain & Sub-domain: 
      - Key Constraints: 
      - Output Standards: 
      - Timeline Complexity: `;

      const res = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      const updated = {
        ...selectedNeed,
        aiSummary: res.text?.trim(),
        isApproved: true,
        status: NeedStatus.DISCOVERY,
        pendingActionBy: 'customer' as const
      };
      onUpdateNeed(updated);
    } catch (e) {
      console.error(e);
    } finally {
      setIsTranslating(false);
    }
  };

  const handlePushToShortlist = (expertId: string) => {
    if (!selectedNeed) return;
    const updated = {
      ...selectedNeed,
      shortlist: [...selectedNeed.shortlist, expertId],
      shortlistReviewStatuses: { ...selectedNeed.shortlistReviewStatuses, [expertId]: { status: 'pending' as const } },
      status: NeedStatus.SHORTLISTED,
      pendingActionBy: 'customer' as const
    };
    onUpdateNeed(updated);
  };

  const handleSendAdminMsg = () => {
    if (!selectedNeed || !adminReply.trim()) return;
    const msg: ClarificationMessage = {
      id: Date.now().toString(),
      author: 'admin',
      text: adminReply,
      timestamp: new Date().toISOString()
    };
    onUpdateNeed({
      ...selectedNeed,
      clarificationLog: [...selectedNeed.clarificationLog, msg],
      pendingActionBy: 'customer' as const
    });
    setAdminReply('');
  };

  // Static color mapping for KPI cards
  const kpiColorMap: Record<string, string> = {
    indigo: 'bg-indigo-500',
    emerald: 'bg-emerald-500',
    rose: 'bg-rose-500',
    slate: 'bg-slate-500',
  };

  return (
    <div className={`space-y-8 lg:space-y-10 pb-20 ${DESIGN.animation.fadeIn}`}>
      {/* KPI Stripe */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {[
          { label: 'Time-to-Decision (TTD)', value: metrics.ttd, color: 'indigo', sub: 'North Star Metric' },
          { label: 'Active Pipeline', value: metrics.activeNeeds, color: 'emerald', sub: 'Open Engagements' },
          { label: 'Admin Action Needed', value: metrics.pendingAdmin, color: 'rose', sub: 'Blocking Progress' },
          { label: 'Success Rate', value: metrics.conversion, color: 'slate', sub: 'Placement Conv.' }
        ].map(k => (
          <div key={k.label} className={`${DESIGN.card.level1} p-6 lg:p-8 relative overflow-hidden group hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300`}>
            <div className={`absolute left-0 top-0 w-1.5 h-full ${kpiColorMap[k.color]} opacity-20`}></div>
            <p className="text-[9px] lg:text-[10px] font-black text-slate-300 uppercase tracking-widest">{k.label}</p>
            <p className="text-2xl lg:text-3xl font-black text-slate-900 mt-2 tracking-tighter">{k.value}</p>
            <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-tight">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Admin Nav */}
      <div className="flex gap-4 lg:gap-12 border-b border-slate-100 px-2 lg:px-4 overflow-x-auto">
        {[
          { id: 'analytics', label: '仪表盘' },
          { id: 'queue', label: '项目流' },
          { id: 'experts', label: '人才库' },
          { id: 'intelligence', label: '情报' },
          { id: 'templates', label: '模板' }
        ].map(t => (
          <button 
            key={t.id} 
            onClick={() => { setActiveTab(t.id as AdminTab); setSelectedNeedId(null); setMatchingMode(false); }}
            className={`pb-4 lg:pb-5 text-[10px] lg:text-[11px] ${DESIGN.button.base} relative whitespace-nowrap ${
              activeTab === t.id ? 'text-indigo-600' : 'text-slate-300 hover:text-slate-500'
            }`}
          >
            {t.label}
            {activeTab === t.id && <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-full"></div>}
          </button>
        ))}
      </div>

      <div className="min-h-[500px] lg:min-h-[700px]">
        {/* TAB: Analytics */}
        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
             <div className={`${DESIGN.card.level2} p-8 lg:p-12`}>
                <h3 className="text-lg lg:text-xl font-black text-slate-900 mb-6 lg:mb-8">需求阶段转化 (Funnel)</h3>
                <div className="space-y-4 lg:space-y-6">
                   {[
                     { label: 'Submitted', count: needs.filter(n => n.status === NeedStatus.SUBMITTED).length, color: 'bg-slate-100', text: 'text-slate-500' },
                     { label: 'Discovery', count: needs.filter(n => n.status === NeedStatus.DISCOVERY).length, color: 'bg-amber-100', text: 'text-amber-600' },
                     { label: 'Shortlisted', count: needs.filter(n => n.status === NeedStatus.SHORTLISTED).length, color: 'bg-indigo-100', text: 'text-indigo-600' },
                     { label: 'Intro/Closed', count: needs.filter(n => [NeedStatus.INTRO, NeedStatus.CLOSED].includes(n.status)).length, color: 'bg-emerald-100', text: 'text-emerald-600' }
                   ].map(f => (
                     <div key={f.label} className="flex items-center gap-3 lg:gap-4">
                        <div className={`w-24 lg:w-32 py-2 px-3 lg:px-4 ${DESIGN.radius.sm} text-[9px] lg:text-[10px] font-black uppercase ${f.color} ${f.text}`}>{f.label}</div>
                        <div className="flex-1 h-2 lg:h-3 bg-slate-50 rounded-full overflow-hidden">
                           <div className={`h-full ${f.text.replace('text', 'bg')} transition-all duration-1000`} style={{ width: `${(f.count / needs.length) * 100}%` }}></div>
                        </div>
                        <span className="text-sm font-black text-slate-900">{f.count}</span>
                     </div>
                   ))}
                </div>
             </div>
             <div className={`bg-indigo-600 p-8 lg:p-12 ${DESIGN.radius.xl} text-white space-y-6 lg:space-y-8 ${DESIGN.shadow.primary}`}>
                <h3 className="text-lg lg:text-xl font-black">Admin 运营边界看板</h3>
                <ul className="space-y-4 lg:space-y-6">
                   <li className="flex gap-3 lg:gap-4 items-start">
                      <div className={`w-6 h-6 bg-white/20 ${DESIGN.radius.sm} flex items-center justify-center font-black text-[10px]`}>R1</div>
                      <p className="text-sm font-medium opacity-90">目前有 <strong>{needs.filter(n => !n.isApproved).length}</strong> 个原始需求待“结构化翻译”。</p>
                   </li>
                   <li className="flex gap-3 lg:gap-4 items-start">
                      <div className={`w-6 h-6 bg-white/20 ${DESIGN.radius.sm} flex items-center justify-center font-black text-[10px]`}>R3</div>
                      <p className="text-sm font-medium opacity-90">有 <strong>{needs.filter(n => n.pendingActionBy === 'customer' && n.status === NeedStatus.SHORTLISTED).length}</strong> 个短名单待客户反馈，平均停滞 1.8 天。</p>
                   </li>
                   <li className="flex gap-3 lg:gap-4 items-start">
                      <div className={`w-6 h-6 bg-white/20 ${DESIGN.radius.sm} flex items-center justify-center font-black text-[10px]`}>R4</div>
                      <p className="text-sm font-medium opacity-90">近 7 天记录了 <strong>{marketIntelligence.filter(m => new Date(m.shortlistedAt).getTime() > Date.now() - 604800000).length}</strong> 条失败反馈。</p>
                   </li>
                </ul>
             </div>
          </div>
        )}

        {/* TAB: Queue Management */}
        {activeTab === 'queue' && (
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
            {/* P10: Queue Sidebar */}
            <aside className="w-full lg:w-80 space-y-4">
               <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-widest px-2">决策堆栈 (Needs Queue)</h3>
               <div className="space-y-3 max-h-[400px] lg:max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
                  {needs.map(n => (
                    <div 
                      key={n.id} 
                      onClick={() => { setSelectedNeedId(n.id); setMatchingMode(false); }}
                      className={`p-4 lg:p-6 ${DESIGN.radius.lg} border cursor-pointer transition-all ${
                        selectedNeedId === n.id ? `bg-white border-indigo-600 ${DESIGN.shadow.primary} ring-1 ring-indigo-600` : 'bg-white border-slate-100 hover:border-indigo-200 shadow-sm'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                          n.pendingActionBy === 'admin' ? 'bg-rose-500 text-white animate-pulse' : 'bg-slate-100 text-slate-400'
                        }`}>{n.status}</span>
                        <span className="text-[9px] font-bold text-slate-300">#{n.id.split('-')[1]}</span>
                      </div>
                      <h4 className="text-sm font-black text-slate-900 leading-tight line-clamp-2">{n.domainArea}</h4>
                    </div>
                  ))}
               </div>
            </aside>

            {/* P11: Detail View / P13: Match Manager */}
            <main className={`flex-1 ${DESIGN.card.level2} flex flex-col overflow-hidden`}>
               {selectedNeed ? (
                 <div className={`flex flex-col h-full ${DESIGN.animation.slideUp}`}>
                    <header className="p-6 lg:p-10 border-b border-slate-50 bg-slate-50/20 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                       <div>
                          <h2 className="text-xl lg:text-2xl font-black text-slate-900">{selectedNeed.domainArea}</h2>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">客户: {selectedNeed.customerOrgName} · Round {selectedNeed.roundIndex}</p>
                       </div>
                       <div className="flex gap-3 lg:gap-4 w-full lg:w-auto">
                          {!selectedNeed.isApproved && (
                            <button onClick={handleApproveAndStructure} disabled={isTranslating} className={`flex-1 lg:flex-none bg-emerald-600 text-white px-6 lg:px-8 py-3 ${DESIGN.radius.md} text-[10px] ${DESIGN.button.base} ${DESIGN.shadow.card} disabled:opacity-50`}>
                               {isTranslating ? 'Structuring...' : '翻译结构化并批准'}
                            </button>
                          )}
                          <button 
                            onClick={() => setMatchingMode(!matchingMode)} 
                            className={`flex-1 lg:flex-none px-6 lg:px-8 py-3 ${DESIGN.radius.md} text-[10px] ${DESIGN.button.base} ${DESIGN.shadow.card} transition-all ${matchingMode ? 'bg-slate-900 text-white' : 'bg-indigo-600 text-white'}`}
                          >
                             {matchingMode ? '返回对话' : '启动撮合'}
                          </button>
                       </div>
                    </header>

                    <div className="flex-1 flex flex-col overflow-hidden">
                       {matchingMode ? (
                         <div className="flex-1 p-6 lg:p-10 overflow-y-auto space-y-8 lg:space-y-12">
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">撮合管理 (Match Manager)</h3>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                               {MOCK_EXPERTS.map(exp => (
                                 <div key={exp.id} className={`p-6 lg:p-8 bg-slate-50 border border-slate-100 ${DESIGN.radius.xl} flex flex-col group hover:bg-white hover:shadow-2xl transition-all`}>
                                    <div className="flex justify-between items-start mb-4 lg:mb-6">
                                       <div className={`w-10 h-10 lg:w-12 lg:h-12 bg-white ${DESIGN.radius.md} flex items-center justify-center font-black text-slate-300 border border-slate-100`}>{exp.name.charAt(0)}</div>
                                       <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">{exp.trustTier}</span>
                                    </div>
                                    <h4 className="font-black text-slate-900">{exp.name}</h4>
                                    <p className="text-xs text-slate-500 mt-2 line-clamp-2">{exp.summaryExperience}</p>
                                    <button 
                                      onClick={() => handlePushToShortlist(exp.id)}
                                      disabled={selectedNeed.shortlist.includes(exp.id)}
                                      className={`mt-6 lg:mt-8 py-3 ${DESIGN.radius.sm} text-[9px] ${DESIGN.button.base} ${
                                        selectedNeed.shortlist.includes(exp.id) ? 'bg-emerald-50 text-emerald-500' : 'bg-white border border-slate-200 text-slate-900 hover:bg-indigo-600 hover:text-white'
                                      }`}
                                    >
                                       {selectedNeed.shortlist.includes(exp.id) ? '已加入短名单' : '引荐发起 (PUSH)'}
                                    </button>
                                 </div>
                               ))}
                            </div>
                         </div>
                       ) : (
                         <>
                            <div className="flex-1 overflow-y-auto p-6 lg:p-10 space-y-8 lg:space-y-12">
                               <section className="space-y-4 lg:space-y-6">
                                  <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] border-b border-slate-50 pb-4 italic">R1: 结构化翻译产物</h4>
                                  <div className={`p-6 lg:p-8 bg-indigo-50/30 border border-indigo-100 ${DESIGN.radius.xl} text-sm font-medium text-slate-700 leading-relaxed italic`}>
                                     {selectedNeed.aiSummary || '等待 Admin 翻译原始需求...'}
                                  </div>
                               </section>

                               <section className="space-y-6 lg:space-y-8">
                                  <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">澄清对话与催办日志</h4>
                                  <div className="space-y-4 lg:space-y-6">
                                     {selectedNeed.clarificationLog.map(msg => (
                                       <div key={msg.id} className={`flex ${msg.author === 'admin' ? 'justify-end' : 'justify-start'}`}>
                                          <div className={`max-w-[85%] lg:max-w-[75%] p-4 lg:p-6 ${DESIGN.radius.lg} ${msg.author === 'admin' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}>
                                             <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
                                             <span className="text-[8px] mt-2 block opacity-40 uppercase font-black">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                                          </div>
                                       </div>
                                     ))}
                                  </div>
                               </section>
                            </div>
                            <div className="p-4 lg:p-8 border-t border-slate-50 bg-white flex gap-3 lg:gap-4 shrink-0">
                               <textarea 
                                 value={adminReply}
                                 onChange={(e) => setAdminReply(e.target.value)}
                                 className={`flex-1 ${DESIGN.input.textarea} px-6 lg:px-8 py-4 lg:py-5 h-24 lg:h-28`}
                                 placeholder="发送引荐通知、催回复、或请求澄清..."
                               />
                               <button onClick={handleSendAdminMsg} className={`${DESIGN.button.primary} w-20 lg:w-28 ${DESIGN.radius.lg} flex flex-col items-center justify-center hover:bg-indigo-700 active:scale-95 transition-all`}>
                                  <ICONS.ArrowRight className="w-6 h-6 lg:w-8 lg:h-8" />
                                  <span className="text-[8px] font-black uppercase mt-1">PUSH</span>
                               </button>
                            </div>
                         </>
                       )}
                    </div>
                 </div>
               ) : (
                 <div className={`flex-1 flex flex-col items-center justify-center p-10 lg:p-20 text-center ${DESIGN.emptyState.text}`}>
                    <ICONS.Dashboard className={`${DESIGN.emptyState.icon} mb-6 lg:mb-8`} />
                    <p className="text-lg lg:text-2xl font-black uppercase tracking-widest">请选择一个活跃需求进入指挥部</p>
                 </div>
               )}
            </main>
          </div>
        )}

        {/* TAB: Expert Directory */}
        {activeTab === 'experts' && (
          <div className={`space-y-6 lg:space-y-8 ${DESIGN.animation.fadeIn}`}>
             <div className={`flex justify-between items-center ${DESIGN.card.level1} p-6 lg:p-8`}>
                <div className="flex items-center gap-4 lg:gap-6 flex-1">
                   <ICONS.Search className="w-5 h-5 lg:w-6 lg:h-6 text-slate-300" />
                   <input 
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     className="flex-1 bg-transparent border-none outline-none text-sm font-bold placeholder:text-slate-300" 
                     placeholder="搜索专家、领域、验证状态..." 
                   />
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                {MOCK_EXPERTS.filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()) || e.domainTags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))).map(exp => (
                  <div key={exp.id} className={`${DESIGN.card.level1} p-8 lg:p-10 group hover:border-indigo-600 transition-all`}>
                     <div className="flex justify-between items-start mb-6 lg:mb-8">
                        <div className={`w-12 h-12 lg:w-16 lg:h-16 bg-slate-50 ${DESIGN.radius.lg} flex items-center justify-center font-black text-xl lg:text-2xl text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all`}>{exp.name.charAt(0)}</div>
                        <span className={`px-3 lg:px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${exp.trustTier === TrustTier.PROVEN ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>{exp.trustTier}</span>
                     </div>
                     <h4 className="text-lg lg:text-xl font-black text-slate-900">{exp.name}</h4>
                     <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-tight">{exp.rateRange}</p>
                     
                     <div className="mt-8 lg:mt-10 pt-8 lg:pt-10 border-t border-slate-50 space-y-4">
                        <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase">
                           <span>R2: 质量评估</span>
                           <span className="text-indigo-600">85% VETTING</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                           <div className="h-full bg-indigo-500 w-[85%]"></div>
                        </div>
                        <button className={`w-full py-3 lg:py-4 bg-slate-900 text-white ${DESIGN.radius.md} ${DESIGN.button.base} ${DESIGN.shadow.card} active:scale-95 transition-all`}>查看/编辑质量档案</button>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {/* TAB: Intelligence Hub */}
        {activeTab === 'intelligence' && (
          <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 ${DESIGN.animation.fadeIn}`}>
             <div className={`${DESIGN.card.level2} p-8 lg:p-12 space-y-8 lg:space-y-10`}>
                <header className="flex justify-between items-center">
                   <div>
                      <h3 className="text-lg lg:text-xl font-black text-slate-900 tracking-tight">R4: 负面反馈分析</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">记录“为什么匹配失败”的数据资产</p>
                   </div>
                   <ICONS.Shield className="w-6 h-6 lg:w-8 lg:h-8 text-rose-500 opacity-20" />
                </header>
                <div className="space-y-4 lg:space-y-6">
                   {marketIntelligence.map((loss, i) => (
                     <div key={i} className={`p-6 lg:p-8 bg-slate-50 ${DESIGN.radius.xl} border border-slate-100 group hover:bg-white hover:shadow-xl transition-all`}>
                        <div className="flex justify-between items-start mb-4">
                           <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${loss.status === MatchStatus.WITHDRAWN ? 'bg-rose-500 text-white' : 'bg-slate-200 text-slate-500'}`}>{loss.status}</span>
                           <span className="text-[10px] font-bold text-slate-300">{new Date(loss.shortlistedAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-xs font-black text-slate-900 uppercase mb-2">主体: {loss.expertName} · 项目: {loss.needName}</p>
                        <div className={`p-4 bg-white/50 ${DESIGN.radius.md} text-sm font-medium text-slate-500 italic leading-relaxed border border-slate-50`}>原因: "{loss.withdrawalReason || loss.rejectReason || '未提供详细原因'}"</div>
                     </div>
                   ))}
                </div>
             </div>

             <div className={`${DESIGN.card.level2} p-8 lg:p-12 space-y-8 lg:space-y-10`}>
                <header className="flex justify-between items-center">
                   <div>
                      <h3 className="text-lg lg:text-xl font-black text-slate-900 tracking-tight">供给侧健康指标</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">活跃专家与响应速率统计</p>
                   </div>
                </header>
                <div className="space-y-8 lg:space-y-12">
                   {[
                     { label: '平均响应时间 (Expert)', value: '1.2h', change: '-15%', positive: true },
                     { label: '平均约谈爽约率', value: '4.2%', change: '+1%', positive: false },
                     { label: '供给补给率', value: '92%', change: '+5%', positive: true }
                   ].map(stat => (
                     <div key={stat.label} className="flex justify-between items-end border-b border-slate-50 pb-6">
                        <div>
                           <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{stat.label}</p>
                           <p className="text-2xl lg:text-3xl font-black text-slate-900 mt-2">{stat.value}</p>
                        </div>
                        <div className={`text-[10px] font-black px-2 py-1 ${DESIGN.radius.sm} ${stat.positive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                           {stat.change}
                        </div>
                     </div>
                   ))}
                </div>
             </div>
          </div>
        )}

        {/* TAB: Template Center */}
        {activeTab === 'templates' && (
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 ${DESIGN.animation.fadeIn}`}>
             {MOCK_TEMPLATES.map(tmp => (
               <div key={tmp.id} className={`${DESIGN.card.level1} p-8 lg:p-10 flex flex-col group`}>
                  <div className="flex justify-between items-center mb-6 lg:mb-8">
                     <span className="text-[9px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full">{tmp.type}</span>
                  </div>
                  <h4 className="text-base lg:text-lg font-black text-slate-900 mb-4">{tmp.name}</h4>
                  <p className="text-xs text-slate-400 line-clamp-4 font-medium leading-relaxed italic border-l-2 border-slate-100 pl-4">"{tmp.content}"</p>
                  <button className={`mt-8 lg:mt-10 w-full py-3 lg:py-4 bg-slate-900 text-white ${DESIGN.radius.md} ${DESIGN.button.base} ${DESIGN.shadow.card} active:scale-95 transition-all opacity-0 group-hover:opacity-100`}>编辑模板</button>
               </div>
             ))}
             <div className={`border-4 border-dashed border-slate-100 ${DESIGN.radius.xl} flex flex-col items-center justify-center p-10 lg:p-12 text-center group cursor-pointer hover:border-indigo-100 hover:bg-white transition-all`}>
                <div className={`w-12 h-12 bg-slate-50 ${DESIGN.radius.md} flex items-center justify-center text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all`}>
                   <ICONS.Plus className="w-6 h-6" />
                </div>
                <p className="text-xs font-black text-slate-300 uppercase mt-4 group-hover:text-indigo-600 transition-all">创建新运营模板</p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
