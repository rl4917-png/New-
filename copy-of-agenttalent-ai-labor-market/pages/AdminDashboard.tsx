
import React, { useState, useMemo } from 'react';
import { MOCK_EXPERTS, MOCK_MATCHES, MOCK_TEMPLATES } from '../services/mockData';
import { Need, NeedStatus, ExpertProfile, TrustTier, MatchRecord, MatchStatus, ClarificationMessage, ShortlistReview, TaskType, ExpertTier, DataProductType, AdminTemplate } from '../types';
import { ICONS } from '../constants';
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

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      {/* KPI Stripe */}
      <div className="grid grid-cols-4 gap-6">
        {[
          { label: 'Time-to-Decision (TTD)', value: metrics.ttd, color: 'indigo', sub: 'North Star Metric' },
          { label: 'Active Pipeline', value: metrics.activeNeeds, color: 'emerald', sub: 'Open Engagements' },
          { label: 'Admin Action Needed', value: metrics.pendingAdmin, color: 'rose', sub: 'Blocking Progress' },
          { label: 'Success Rate', value: metrics.conversion, color: 'slate', sub: 'Placement Conv.' }
        ].map(k => (
          <div key={k.label} className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className={`absolute left-0 top-0 w-1.5 h-full bg-${k.color}-500 opacity-20`}></div>
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{k.label}</p>
            <p className="text-3xl font-black text-slate-900 mt-2 tracking-tighter">{k.value}</p>
            <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-tight">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Admin Nav */}
      <div className="flex gap-12 border-b border-slate-100 px-4">
        {[
          { id: 'analytics', label: '仪表盘 (Analytics)' },
          { id: 'queue', label: '项目流 (Queue)' },
          { id: 'experts', label: '人才库 (Directory)' },
          { id: 'intelligence', label: '情报中心 (Intelligence)' },
          { id: 'templates', label: '模板管理 (Templates)' }
        ].map(t => (
          <button 
            key={t.id} 
            onClick={() => { setActiveTab(t.id as AdminTab); setSelectedNeedId(null); setMatchingMode(false); }}
            className={`pb-5 text-[11px] font-black uppercase tracking-[0.2em] relative transition-all ${
              activeTab === t.id ? 'text-indigo-600' : 'text-slate-300 hover:text-slate-500'
            }`}
          >
            {t.label}
            {activeTab === t.id && <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-full"></div>}
          </button>
        ))}
      </div>

      <div className="min-h-[700px]">
        {/* TAB: Analytics */}
        {activeTab === 'analytics' && (
          <div className="grid grid-cols-2 gap-10">
             <div className="bg-white p-12 rounded-[56px] border border-slate-100 shadow-sm">
                <h3 className="text-xl font-black text-slate-900 mb-8">需求阶段转化 (Funnel)</h3>
                <div className="space-y-6">
                   {[
                     { label: 'Submitted', count: needs.filter(n => n.status === NeedStatus.SUBMITTED).length, color: 'bg-slate-100', text: 'text-slate-500' },
                     { label: 'Discovery', count: needs.filter(n => n.status === NeedStatus.DISCOVERY).length, color: 'bg-amber-100', text: 'text-amber-600' },
                     { label: 'Shortlisted', count: needs.filter(n => n.status === NeedStatus.SHORTLISTED).length, color: 'bg-indigo-100', text: 'text-indigo-600' },
                     { label: 'Intro/Closed', count: needs.filter(n => [NeedStatus.INTRO, NeedStatus.CLOSED].includes(n.status)).length, color: 'bg-emerald-100', text: 'text-emerald-600' }
                   ].map(f => (
                     <div key={f.label} className="flex items-center gap-4">
                        <div className={`w-32 py-2 px-4 rounded-xl text-[10px] font-black uppercase ${f.color} ${f.text}`}>{f.label}</div>
                        <div className="flex-1 h-3 bg-slate-50 rounded-full overflow-hidden">
                           <div className={`h-full ${f.text.replace('text', 'bg')} transition-all duration-1000`} style={{ width: `${(f.count / needs.length) * 100}%` }}></div>
                        </div>
                        <span className="text-sm font-black text-slate-900">{f.count}</span>
                     </div>
                   ))}
                </div>
             </div>
             <div className="bg-indigo-600 p-12 rounded-[56px] text-white space-y-8 shadow-2xl shadow-indigo-200">
                <h3 className="text-xl font-black">Admin 运营边界看板</h3>
                <ul className="space-y-6">
                   <li className="flex gap-4 items-start">
                      <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center font-black text-[10px]">R1</div>
                      <p className="text-sm font-medium opacity-90">目前有 <strong>{needs.filter(n => !n.isApproved).length}</strong> 个原始需求待“结构化翻译”。</p>
                   </li>
                   <li className="flex gap-4 items-start">
                      <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center font-black text-[10px]">R3</div>
                      <p className="text-sm font-medium opacity-90">有 <strong>{needs.filter(n => n.pendingActionBy === 'customer' && n.status === NeedStatus.SHORTLISTED).length}</strong> 个短名单待客户反馈，平均停滞 1.8 天。</p>
                   </li>
                   <li className="flex gap-4 items-start">
                      <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center font-black text-[10px]">R4</div>
                      <p className="text-sm font-medium opacity-90">近 7 天记录了 <strong>{marketIntelligence.filter(m => new Date(m.shortlistedAt).getTime() > Date.now() - 604800000).length}</strong> 条失败反馈。</p>
                   </li>
                </ul>
             </div>
          </div>
        )}

        {/* TAB: Queue Management */}
        {activeTab === 'queue' && (
          <div className="flex gap-10">
            {/* P10: Queue Sidebar */}
            <aside className="w-80 space-y-4">
               <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-widest px-2">决策堆栈 (Needs Queue)</h3>
               <div className="space-y-3 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
                  {needs.map(n => (
                    <div 
                      key={n.id} 
                      onClick={() => { setSelectedNeedId(n.id); setMatchingMode(false); }}
                      className={`p-6 rounded-[32px] border cursor-pointer transition-all ${
                        selectedNeedId === n.id ? 'bg-white border-indigo-600 shadow-xl ring-1 ring-indigo-600' : 'bg-white border-slate-100 hover:border-indigo-200 shadow-sm'
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
            <main className="flex-1 bg-white border border-slate-100 rounded-[56px] shadow-sm flex flex-col overflow-hidden">
               {selectedNeed ? (
                 <div className="flex flex-col h-full animate-in slide-in-from-right-4 duration-500">
                    <header className="p-10 border-b border-slate-50 bg-slate-50/20 flex justify-between items-center">
                       <div>
                          <h2 className="text-2xl font-black text-slate-900">{selectedNeed.domainArea}</h2>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">客户: {selectedNeed.customerOrgName} · Round {selectedNeed.roundIndex}</p>
                       </div>
                       <div className="flex gap-4">
                          {!selectedNeed.isApproved && (
                            <button onClick={handleApproveAndStructure} disabled={isTranslating} className="bg-emerald-600 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase shadow-xl disabled:opacity-50">
                               {isTranslating ? 'Structuring...' : '翻译结构化并批准'}
                            </button>
                          )}
                          <button 
                            onClick={() => setMatchingMode(!matchingMode)} 
                            className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase shadow-xl transition-all ${matchingMode ? 'bg-slate-900 text-white' : 'bg-indigo-600 text-white'}`}
                          >
                             {matchingMode ? '返回对话控制' : '启动撮合匹配'}
                          </button>
                       </div>
                    </header>

                    <div className="flex-1 flex flex-col overflow-hidden">
                       {matchingMode ? (
                         <div className="flex-1 p-10 overflow-y-auto space-y-12">
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">P13: 撮合管理 (Match Manager)</h3>
                            <div className="grid grid-cols-2 gap-6">
                               {MOCK_EXPERTS.map(exp => (
                                 <div key={exp.id} className="p-8 bg-slate-50 border border-slate-100 rounded-[40px] flex flex-col group hover:bg-white hover:shadow-2xl transition-all">
                                    <div className="flex justify-between items-start mb-6">
                                       <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center font-black text-slate-300 border border-slate-100">{exp.name.charAt(0)}</div>
                                       <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">{exp.trustTier}</span>
                                    </div>
                                    <h4 className="font-black text-slate-900">{exp.name}</h4>
                                    <p className="text-xs text-slate-500 mt-2 line-clamp-2">{exp.summaryExperience}</p>
                                    <button 
                                      onClick={() => handlePushToShortlist(exp.id)}
                                      disabled={selectedNeed.shortlist.includes(exp.id)}
                                      className={`mt-8 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest ${
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
                            <div className="flex-1 overflow-y-auto p-10 space-y-12">
                               <section className="space-y-6">
                                  <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] border-b border-slate-50 pb-4 italic">R1: 结构化翻译产物</h4>
                                  <div className="p-8 bg-indigo-50/30 border border-indigo-100 rounded-[40px] text-sm font-medium text-slate-700 leading-relaxed italic">
                                     {selectedNeed.aiSummary || '等待 Admin 翻译原始需求...'}
                                  </div>
                               </section>

                               <section className="space-y-8">
                                  <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">澄清对话与催办日志</h4>
                                  <div className="space-y-6">
                                     {selectedNeed.clarificationLog.map(msg => (
                                       <div key={msg.id} className={`flex ${msg.author === 'admin' ? 'justify-end' : 'justify-start'}`}>
                                          <div className={`max-w-[75%] p-6 rounded-[32px] ${msg.author === 'admin' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}>
                                             <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
                                             <span className="text-[8px] mt-2 block opacity-40 uppercase font-black">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                                          </div>
                                       </div>
                                     ))}
                                  </div>
                               </section>
                            </div>
                            <div className="p-8 border-t border-slate-50 bg-white flex gap-4 shrink-0">
                               <textarea 
                                 value={adminReply}
                                 onChange={(e) => setAdminReply(e.target.value)}
                                 className="flex-1 bg-slate-50 border border-slate-100 rounded-3xl px-8 py-5 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none h-28"
                                 placeholder="发送引荐通知、催回复、或请求澄清..."
                               />
                               <button onClick={handleSendAdminMsg} className="bg-indigo-600 w-28 rounded-3xl flex flex-col items-center justify-center text-white shadow-xl hover:bg-indigo-700 active:scale-95 transition-all">
                                  <ICONS.ArrowRight className="w-8 h-8" />
                                  <span className="text-[8px] font-black uppercase mt-1">PUSH</span>
                               </button>
                            </div>
                         </>
                       )}
                    </div>
                 </div>
               ) : (
                 <div className="flex-1 flex flex-col items-center justify-center opacity-20 p-20 text-center">
                    <ICONS.Dashboard className="w-24 h-24 mb-8" />
                    <p className="text-2xl font-black uppercase tracking-widest">请选择一个活跃需求进入指挥部</p>
                 </div>
               )}
            </main>
          </div>
        )}

        {/* TAB: Expert Directory */}
        {activeTab === 'experts' && (
          <div className="space-y-8 animate-in fade-in duration-700">
             <div className="flex justify-between items-center bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                <div className="flex items-center gap-6 flex-1">
                   <ICONS.Search className="w-6 h-6 text-slate-300" />
                   <input 
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     className="flex-1 bg-transparent border-none outline-none text-sm font-bold placeholder:text-slate-300" 
                     placeholder="搜索专家、领域、验证状态..." 
                   />
                </div>
             </div>

             <div className="grid grid-cols-3 gap-8">
                {MOCK_EXPERTS.filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()) || e.domainTags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))).map(exp => (
                  <div key={exp.id} className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm group hover:border-indigo-600 transition-all">
                     <div className="flex justify-between items-start mb-8">
                        <div className="w-16 h-16 bg-slate-50 rounded-[24px] flex items-center justify-center font-black text-2xl text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all">{exp.name.charAt(0)}</div>
                        <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${exp.trustTier === TrustTier.PROVEN ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>{exp.trustTier}</span>
                     </div>
                     <h4 className="text-xl font-black text-slate-900">{exp.name}</h4>
                     <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-tight">{exp.rateRange}</p>
                     
                     <div className="mt-10 pt-10 border-t border-slate-50 space-y-4">
                        <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase">
                           <span>R2: 质量评估</span>
                           <span className="text-indigo-600">85% VETTING</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                           <div className="h-full bg-indigo-500 w-[85%]"></div>
                        </div>
                        <button className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all">查看/编辑质量档案</button>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {/* TAB: Intelligence Hub */}
        {activeTab === 'intelligence' && (
          <div className="grid grid-cols-2 gap-10 animate-in fade-in duration-700">
             <div className="bg-white p-12 rounded-[56px] border border-slate-100 shadow-sm space-y-10">
                <header className="flex justify-between items-center">
                   <div>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight">R4: 负面反馈分析 (Loss Forensics)</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">记录“为什么匹配失败”的数据资产</p>
                   </div>
                   <ICONS.Shield className="w-8 h-8 text-rose-500 opacity-20" />
                </header>
                <div className="space-y-6">
                   {marketIntelligence.map((loss, i) => (
                     <div key={i} className="p-8 bg-slate-50 rounded-[40px] border border-slate-100 group hover:bg-white hover:shadow-xl transition-all">
                        <div className="flex justify-between items-start mb-4">
                           <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${loss.status === MatchStatus.WITHDRAWN ? 'bg-rose-500 text-white' : 'bg-slate-200 text-slate-500'}`}>{loss.status}</span>
                           <span className="text-[10px] font-bold text-slate-300">{new Date(loss.shortlistedAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-xs font-black text-slate-900 uppercase mb-2">主体: {loss.expertName} · 项目: {loss.needName}</p>
                        <div className="p-4 bg-white/50 rounded-2xl text-sm font-medium text-slate-500 italic leading-relaxed border border-slate-50">原因: "{loss.withdrawalReason || loss.rejectReason || '未提供详细原因'}"</div>
                     </div>
                   ))}
                </div>
             </div>

             <div className="bg-white p-12 rounded-[56px] border border-slate-100 shadow-sm space-y-10">
                <header className="flex justify-between items-center">
                   <div>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight">供给侧健康指标</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">活跃专家与响应速率统计</p>
                   </div>
                </header>
                <div className="space-y-12">
                   {[
                     { label: '平均响应时间 (Expert)', value: '1.2h', change: '-15%', positive: true },
                     { label: '平均约谈爽约率', value: '4.2%', change: '+1%', positive: false },
                     { label: '供给补给率', value: '92%', change: '+5%', positive: true }
                   ].map(stat => (
                     <div key={stat.label} className="flex justify-between items-end border-b border-slate-50 pb-6">
                        <div>
                           <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{stat.label}</p>
                           <p className="text-3xl font-black text-slate-900 mt-2">{stat.value}</p>
                        </div>
                        <div className={`text-[10px] font-black px-2 py-1 rounded-lg ${stat.positive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
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
          <div className="grid grid-cols-3 gap-8 animate-in fade-in duration-700">
             {MOCK_TEMPLATES.map(tmp => (
               <div key={tmp.id} className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm flex flex-col group">
                  <div className="flex justify-between items-center mb-8">
                     <span className="text-[9px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full">{tmp.type}</span>
                  </div>
                  <h4 className="text-lg font-black text-slate-900 mb-4">{tmp.name}</h4>
                  <p className="text-xs text-slate-400 line-clamp-4 font-medium leading-relaxed italic border-l-2 border-slate-100 pl-4">"{tmp.content}"</p>
                  <button className="mt-10 w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all opacity-0 group-hover:opacity-100">编辑模板</button>
               </div>
             ))}
             <div className="border-4 border-dashed border-slate-100 rounded-[48px] flex flex-col items-center justify-center p-12 text-center group cursor-pointer hover:border-indigo-100 hover:bg-white transition-all">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all">
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
