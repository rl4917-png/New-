
import React, { useState } from 'react';
import { Need, NeedStatus, TaskType, ClarificationMessage, ExpertTier, DataProductType } from '../types';
import { ICONS } from '../constants';
import { GoogleGenAI } from '@google/genai';

interface CustomerProjectManagementProps {
  needs: Need[];
  isCreating: boolean;
  setIsCreating: (val: boolean) => void;
  onAddNeed: (need: Need) => void;
  onUpdateNeed: (need: Need) => void;
}

const CustomerProjectManagement: React.FC<CustomerProjectManagementProps> = ({ needs, isCreating, setIsCreating, onAddNeed, onUpdateNeed }) => {
  const [activeNeed, setActiveNeed] = useState<Need | null>(null);
  const [replyText, setReplyText] = useState('');

  const handleReply = () => {
    if (!activeNeed || !replyText.trim()) return;
    const newMessage: ClarificationMessage = {
      id: Date.now().toString(),
      author: 'customer',
      text: replyText,
      timestamp: new Date().toISOString()
    };
    const updatedNeed: Need = {
      ...activeNeed,
      clarificationLog: [...activeNeed.clarificationLog, newMessage],
      pendingActionBy: 'admin'
    };
    onUpdateNeed(updatedNeed);
    setActiveNeed(updatedNeed);
    setReplyText('');
  };

  if (isCreating) {
    return <NeedIntakeForm onCancel={() => setIsCreating(false)} onSubmit={onAddNeed} />;
  }

  return (
    <div className="flex flex-col lg:flex-row gap-10 animate-in fade-in duration-500 h-full">
      {/* Needs List Sidebar */}
      <div className="w-full lg:w-[380px] space-y-6">
        <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] px-2">项目需求列表</h3>
        <div className="space-y-3 overflow-y-auto max-h-[70vh] pr-2 custom-scrollbar">
          {needs.map(need => (
            <div
              key={need.id}
              onClick={() => setActiveNeed(need)}
              className={`p-6 rounded-[32px] border transition-all cursor-pointer relative group ${
                activeNeed?.id === need.id 
                  ? 'bg-white border-indigo-400 shadow-2xl ring-1 ring-indigo-400' 
                  : 'bg-white border-slate-100 hover:border-indigo-200'
              }`}
            >
              {need.pendingActionBy === 'customer' && (
                <div className="absolute top-4 right-4 bg-rose-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase shadow-lg">澄清中</div>
              )}
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">#{need.id.split('-')[1]}</p>
              <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{need.domainArea}</h4>
              <div className="mt-4 flex items-center justify-between">
                 <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-2.5 py-1 rounded-xl uppercase">{need.status}</span>
                 <span className="text-[9px] font-bold text-slate-400">{new Date(need.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Project Detail & Clarification Chat */}
      <div className="flex-1 bg-white rounded-[40px] border border-slate-100 shadow-sm flex flex-col overflow-hidden relative">
        {activeNeed ? (
          <>
            <div className="p-10 border-b border-slate-50 shrink-0">
               <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900">{activeNeed.domainArea}</h2>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">
                      {activeNeed.taskType} · 强度 {activeNeed.intensityHours}h/周
                    </p>
                  </div>
                  <div className={`px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-widest ${
                    activeNeed.pendingActionBy === 'customer' ? 'bg-rose-50 text-rose-500' : 'bg-slate-50 text-slate-400'
                  }`}>
                    {activeNeed.pendingActionBy === 'customer' ? '待您澄清回复' : '等待管理员同步'}
                  </div>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-12">
               {/* Clarification Flow */}
               <section className="space-y-8">
                  <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] border-b border-slate-50 pb-4">需求澄清对话区</h4>
                  <div className="space-y-6">
                    {activeNeed.clarificationLog.map(msg => (
                      <div key={msg.id} className={`flex ${msg.author === 'customer' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] p-5 rounded-[32px] ${
                          msg.author === 'customer' ? 'bg-indigo-600 text-white shadow-xl' : 'bg-slate-100 text-slate-700'
                        }`}>
                           <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
                           <span className="text-[9px] mt-2 block opacity-40 uppercase font-black">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    ))}
                    {activeNeed.clarificationLog.length === 0 && (
                      <div className="text-center py-10 opacity-30">
                        <ICONS.Dashboard className="w-12 h-12 mx-auto mb-2" />
                        <p className="text-xs font-black uppercase tracking-widest">暂无澄清对话记录</p>
                      </div>
                    )}
                  </div>
               </section>

               {/* Intake Recap */}
               <section className="space-y-6 opacity-60">
                  <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">需求原文摘要</h4>
                  <div className="p-8 bg-slate-50 rounded-3xl text-sm font-medium text-slate-600 leading-relaxed italic">
                    {activeNeed.taskDescription}
                  </div>
               </section>
            </div>

            {/* Input Area */}
            {activeNeed.pendingActionBy === 'customer' && (
              <div className="p-8 bg-white border-t border-slate-50 shrink-0">
                <div className="flex gap-4">
                  <textarea 
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none h-24"
                    placeholder="请输入对管理员的回应..."
                  />
                  <button 
                    onClick={handleReply}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white w-20 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-100 transition-all active:scale-95"
                  >
                    <ICONS.ArrowRight className="w-6 h-6" />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-30">
            <ICONS.Clock className="w-20 h-20 mb-6" />
            <p className="text-xl font-black uppercase tracking-widest">请选择一个项目进行管理</p>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Intake Form Component ---
interface IntakeFormProps {
  onCancel: () => void;
  onSubmit: (need: Need) => void;
}

const NeedIntakeForm: React.FC<IntakeFormProps> = ({ onCancel, onSubmit }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    domainArea: '',
    subDomain: '',
    taskType: TaskType.REVIEW,
    expertTier: ExpertTier.SENIOR,
    dataProductType: DataProductType.SFT,
    taskDescription: '',
    intensityHours: 10,
    timeline: '',
    languageRequirement: '中文, 英文',
    budgetRange: '',
    mustHave: '',
    niceToHave: '',
    forbidden: '',
    customerCompanyStage: 'Seed',
    stakeholderRole: '',
    complianceConstraints: ''
  });

  const isFormValid = formData.domainArea && formData.subDomain && formData.taskDescription && formData.timeline && formData.budgetRange;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `你是一个专业的劳务市场匹配助手。请根据以下客户提交的AI专家需求数据，生成一段简洁、专业且吸引专家的项目摘要（150字以内）。
      领域：${formData.domainArea} (${formData.subDomain})
      专家层级要求：${formData.expertTier}
      交付产物类型：${formData.dataProductType}
      任务类型：${formData.taskType}
      描述：${formData.taskDescription}
      时间周期：${formData.timeline}
      语言要求：${formData.languageRequirement}
      
      请重点突出对“专业领域知识”和“模型训练背景”的要求。请用中文输出。`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      const newNeed: Need = {
        id: `need-${Math.floor(Math.random() * 900) + 200}`,
        customerId: 'cust-1',
        customerOrgName: '神经网络科技有限公司',
        status: NeedStatus.SUBMITTED,
        createdAt: new Date().toISOString(),
        shortlist: [],
        shortlistReviewStatuses: {},
        roundIndex: 1,
        aiSummary: response.text?.trim() || 'AI 摘要生成中...',
        clarificationLog: [],
        pendingActionBy: 'admin',
        ...formData
      };
      onSubmit(newNeed);
    } catch (error) {
      onSubmit({
        id: `need-err-${Date.now()}`,
        customerId: 'cust-1',
        customerOrgName: '神经网络科技有限公司',
        status: NeedStatus.SUBMITTED,
        createdAt: new Date().toISOString(),
        shortlist: [],
        shortlistReviewStatuses: {},
        roundIndex: 1,
        clarificationLog: [],
        pendingActionBy: 'admin',
        ...formData
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto bg-white border border-slate-200 rounded-[48px] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="bg-indigo-600 p-12 text-white">
        <h2 className="text-4xl font-black tracking-tighter">发布专家寻访协议</h2>
        <p className="text-indigo-100 mt-2 font-bold uppercase tracking-widest text-[10px] opacity-80">Maybole AI Post-Training Search Protocol</p>
      </div>

      <form onSubmit={handleSubmit} className="p-12 space-y-16">
        {/* Section 1: Context & Domain */}
        <div className="space-y-8">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-xs italic">01</div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">领域上下文 (Context)</h3>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">核心领域 (Master Domain) *</label>
                <input required className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold" placeholder="例如：医学、法律、数学" value={formData.domainArea} onChange={e => setFormData({...formData, domainArea: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">细分方向 (Sub-Domain) *</label>
                <input required className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold" placeholder="例如：心脏病学、证券法、拓扑学" value={formData.subDomain} onChange={e => setFormData({...formData, subDomain: e.target.value})} />
              </div>
           </div>
        </div>

        {/* Section 2: Expertise & Requirements */}
        <div className="space-y-8">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-xs italic">02</div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">专家能力模型 (Expertise Model)</h3>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">人才层级要求 *</label>
                <select className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold" value={formData.expertTier} onChange={e => setFormData({...formData, expertTier: e.target.value as ExpertTier})}>
                  {Object.values(ExpertTier).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">任务形式 *</label>
                <select className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold" value={formData.taskType} onChange={e => setFormData({...formData, taskType: e.target.value as TaskType})}>
                  {Object.values(TaskType).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">交付物类型 *</label>
                <select className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold" value={formData.dataProductType} onChange={e => setFormData({...formData, dataProductType: e.target.value as DataProductType})}>
                  {Object.values(DataProductType).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
           </div>
        </div>

        {/* Section 3: Task & Quality Control */}
        <div className="space-y-8">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-xs italic">03</div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">任务详情与质量约束 (Execution & Quality)</h3>
           </div>
           
           <div className="space-y-8">
             <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">详细任务描述与交付标准 *</label>
               <textarea required className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all h-44 font-medium leading-relaxed" placeholder="请详细说明：专家需要完成什么？输出格式（如 JSON/Markdown）？是否需要思维链（CoT）轨迹？是否有特殊的 Prompt 注入要求？" value={formData.taskDescription} onChange={e => setFormData({...formData, taskDescription: e.target.value})} />
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">硬性准入条件 (Must Have)</label>
                 <textarea className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all h-32 font-medium resize-none" placeholder="例如：必须通过过中国执业医师考试、必须有 3 年以上红队对抗经验..." value={formData.mustHave} onChange={e => setFormData({...formData, mustHave: e.target.value})} />
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">合规与敏感性约束 (Compliance)</label>
                 <textarea className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all h-32 font-medium resize-none" placeholder="是否涉及私域敏感数据？是否有特定领域的安全红线？" value={formData.complianceConstraints} onChange={e => setFormData({...formData, complianceConstraints: e.target.value})} />
               </div>
             </div>
           </div>
        </div>

        {/* Section 4: Operational */}
        <div className="space-y-8">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-xs italic">04</div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">运营与预算 (Ops & Budget)</h3>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">预算区间 *</label>
                <input required className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold" placeholder="例如：¥800-¥1200/hr" value={formData.budgetRange} onChange={e => setFormData({...formData, budgetRange: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">投入强度 (h/wk) *</label>
                <input type="number" required className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold" value={formData.intensityHours} onChange={e => setFormData({...formData, intensityHours: parseInt(e.target.value)})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">预计周期 *</label>
                <input required className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold" placeholder="例如：2周、3个月" value={formData.timeline} onChange={e => setFormData({...formData, timeline: e.target.value})} />
              </div>
           </div>
        </div>

        <div className="flex justify-end gap-6 pt-12 border-t border-slate-50">
          <button type="button" onClick={onCancel} className="px-10 py-4 text-[10px] font-black text-slate-400 hover:text-slate-900 uppercase tracking-widest transition-colors">取消</button>
          <button type="submit" disabled={!isFormValid || loading} className={`px-16 py-4 rounded-2xl text-white font-black text-[10px] uppercase tracking-widest transition-all shadow-2xl active:scale-95 ${isFormValid && !loading ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100' : 'bg-slate-200 cursor-not-allowed'}`}>
            {loading ? 'AI 正在分析搜索协议...' : '确认并启动全球专家寻访'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CustomerProjectManagement;
