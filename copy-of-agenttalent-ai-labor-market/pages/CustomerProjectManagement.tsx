
import React, { useState } from 'react';
import { Need, NeedStatus, TaskType, ClarificationMessage, ExpertTier, DataProductType } from '../types';
import { ICONS, DESIGN } from '../constants';
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
  // Feedback state
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackData, setFeedbackData] = useState({ satisfactionRating: 0, speedRating: 0, qualityRating: 0, suggestions: '' });

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

  const handleSubmitFeedback = () => {
    if (!activeNeed) return;
    const updatedNeed: Need = {
      ...activeNeed,
      feedback: {
        ...feedbackData,
        submittedAt: new Date().toISOString()
      }
    };
    onUpdateNeed(updatedNeed);
    setActiveNeed(updatedNeed);
    setShowFeedback(false);
    alert('反馈已提交，感谢您的评价！');
  };

  if (isCreating) {
    return <NeedIntakeForm onCancel={() => setIsCreating(false)} onSubmit={onAddNeed} />;
  }

  // Helper for status badge color
  const getStatusColor = (status: NeedStatus) => {
    switch (status) {
      case NeedStatus.SUBMITTED: return 'bg-blue-50 text-blue-500';
      case NeedStatus.RECRUITING: return 'bg-cyan-50 text-cyan-600';
      case NeedStatus.SHORTLISTED: return 'bg-amber-50 text-amber-500';
      case NeedStatus.MATCHED: return 'bg-emerald-50 text-emerald-500';
      case NeedStatus.INTRO: return 'bg-emerald-50 text-emerald-500';
      default: return 'bg-slate-50 text-slate-400';
    }
  };

  // Stars component
  const StarRating = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className={`text-2xl transition-all ${star <= value ? 'text-amber-400' : 'text-slate-200 hover:text-amber-200'}`}
        >
          ★
        </button>
      ))}
    </div>
  );

  return (
    <div className={`flex flex-col lg:flex-row gap-6 lg:gap-10 ${DESIGN.animation.fadeIn} h-full`}>
      {/* Needs List Sidebar */}
      <div className="w-full lg:w-[380px] space-y-6">
        <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] px-2">项目需求列表</h3>
        <div className="space-y-3 overflow-y-auto max-h-[50vh] lg:max-h-[70vh] pr-2 custom-scrollbar">
          {needs.map(need => (
            <div
              key={need.id}
              onClick={() => { setActiveNeed(need); setShowFeedback(false); }}
              className={`p-5 lg:p-6 ${DESIGN.radius.lg} border transition-all duration-200 cursor-pointer relative group ${
                activeNeed?.id === need.id 
                  ? 'bg-white border-indigo-400 shadow-2xl ring-1 ring-indigo-400' 
                  : 'bg-white border-slate-100 hover:border-indigo-200 hover:shadow-lg'
              }`}
            >
              {need.status === NeedStatus.MATCHED && !need.feedback && (
                <div className={`absolute top-4 right-4 bg-emerald-500 text-white text-[8px] font-black px-2 py-0.5 ${DESIGN.radius.sm} uppercase shadow-lg`}>待反馈</div>
              )}
              {need.pendingActionBy === 'customer' && need.status !== NeedStatus.MATCHED && (
                <div className={`absolute top-4 right-4 bg-rose-500 text-white text-[8px] font-black px-2 py-0.5 ${DESIGN.radius.sm} uppercase shadow-lg`}>待操作</div>
              )}
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">#{need.id.split('-')[1]}</p>
              <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors duration-200">{need.domainArea}</h4>
              <div className="mt-4 flex items-center justify-between">
                 <span className={`text-[10px] font-black px-2.5 py-1 ${DESIGN.radius.sm} uppercase ${getStatusColor(need.status)}`}>{need.status}</span>
                 <span className="text-[9px] font-bold text-slate-400">{new Date(need.createdAt).toLocaleDateString()}</span>
              </div>
              {/* Recruitment progress mini */}
              {need.recruitmentSentCount && (
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, ((need.recruitmentRespondedCount || 0) / (need.recruitmentTargetCount || 1)) * 100)}%` }}
                    />
                  </div>
                  <span className="text-[9px] font-bold text-slate-400">{need.recruitmentRespondedCount}/{need.recruitmentTargetCount}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Project Detail */}
      <div className={`flex-1 ${DESIGN.card.level2} flex flex-col overflow-hidden relative`}>
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
                  <span className={`px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-widest ${getStatusColor(activeNeed.status)}`}>
                    {activeNeed.status}
                  </span>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-12">
               {/* Recruitment Status Card */}
               {activeNeed.recruitmentSentCount && (
                 <section className={`p-8 bg-indigo-50/50 border border-indigo-100 ${DESIGN.radius.xl} space-y-6`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 bg-indigo-600 ${DESIGN.radius.sm} flex items-center justify-center text-white`}>
                        <ICONS.Search className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-indigo-900 uppercase tracking-widest">招募进度</h4>
                        <p className="text-xs font-medium text-indigo-500">Recruitment Progress</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-6">
                      <div className="text-center">
                        <p className="text-3xl font-black text-indigo-600">{activeNeed.recruitmentSentCount}</p>
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-1">已发送专家</p>
                      </div>
                      <div className="text-center">
                        <p className="text-3xl font-black text-emerald-600">{activeNeed.recruitmentRespondedCount}</p>
                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mt-1">已响应</p>
                      </div>
                      <div className="text-center">
                        <p className="text-3xl font-black text-slate-600">{activeNeed.recruitmentTargetCount}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">招募目标</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-black text-indigo-400 uppercase">
                        <span>响应率 {((activeNeed.recruitmentRespondedCount || 0) / (activeNeed.recruitmentSentCount || 1) * 100).toFixed(0)}%</span>
                        <span>{(activeNeed.recruitmentRespondedCount || 0) >= (activeNeed.recruitmentTargetCount || 0) ? '✓ 已达标' : '进行中...'}</span>
                      </div>
                      <div className="w-full h-3 bg-indigo-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-600 rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${Math.min(100, ((activeNeed.recruitmentRespondedCount || 0) / (activeNeed.recruitmentTargetCount || 1)) * 100)}%` }}
                        />
                      </div>
                    </div>
                 </section>
               )}

               {/* Matched Need: Feedback section */}
               {activeNeed.status === NeedStatus.MATCHED && (
                 <section className={`p-8 bg-emerald-50/50 border border-emerald-100 ${DESIGN.radius.xl} space-y-6`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 bg-emerald-600 ${DESIGN.radius.sm} flex items-center justify-center text-white`}>
                          <ICONS.CheckCircle className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-emerald-900 uppercase tracking-widest">匹配成功</h4>
                          <p className="text-xs font-medium text-emerald-500">专家已确认，合作已开始</p>
                        </div>
                      </div>
                      {!activeNeed.feedback ? (
                        <button 
                          onClick={() => setShowFeedback(true)}
                          className={`px-6 py-3 ${DESIGN.radius.md} text-[10px] ${DESIGN.button.base} ${DESIGN.button.primary}`}
                        >
                          填写反馈
                        </button>
                      ) : (
                        <span className="text-[10px] font-black text-emerald-500 bg-emerald-100 px-3 py-1 rounded-full uppercase">已提交反馈</span>
                      )}
                    </div>
                    {activeNeed.feedback && (
                      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-emerald-100">
                        <div className="text-center">
                          <p className="text-lg font-black text-emerald-600">{'★'.repeat(activeNeed.feedback.satisfactionRating)}</p>
                          <p className="text-[9px] font-black text-emerald-400 uppercase mt-1">满意度</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-black text-emerald-600">{'★'.repeat(activeNeed.feedback.speedRating)}</p>
                          <p className="text-[9px] font-black text-emerald-400 uppercase mt-1">匹配速度</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-black text-emerald-600">{'★'.repeat(activeNeed.feedback.qualityRating)}</p>
                          <p className="text-[9px] font-black text-emerald-400 uppercase mt-1">专家质量</p>
                        </div>
                      </div>
                    )}
                 </section>
               )}

               {/* AI Summary */}
               {activeNeed.aiSummary && (
                 <section className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">AI 摘要</h4>
                    <div className={`p-6 bg-slate-50 ${DESIGN.radius.lg} text-sm font-medium text-slate-600 leading-relaxed italic border border-slate-100`}>
                      {activeNeed.aiSummary}
                    </div>
                 </section>
               )}

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
            {activeNeed.pendingActionBy === 'customer' && activeNeed.status !== NeedStatus.MATCHED && (
              <div className="p-4 lg:p-8 bg-white border-t border-slate-50 shrink-0">
                <div className="flex gap-3 lg:gap-4">
                  <textarea 
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className={`flex-1 ${DESIGN.input.textarea} h-20 lg:h-24`}
                    placeholder="请输入对管理员的回应..."
                  />
                  <button 
                    onClick={handleReply}
                    disabled={!replyText.trim()}
                    className={`${DESIGN.button.primary} ${DESIGN.radius.md} w-16 lg:w-20 flex items-center justify-center transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <ICONS.ArrowRight className="w-5 h-5 lg:w-6 lg:h-6" />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-12 text-center opacity-30">
            <ICONS.Clock className={DESIGN.emptyState.icon + ' mb-6'} />
            <p className={DESIGN.emptyState.text}>请选择一个项目进行管理</p>
          </div>
        )}
      </div>

      {/* Feedback Modal */}
      {showFeedback && activeNeed && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 lg:p-6 overflow-y-auto">
          <div className={`${DESIGN.card.level3} p-6 lg:p-10 max-w-lg w-full my-auto`}>
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight">服务反馈</h3>
                <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">Service Feedback</p>
              </div>
              <button onClick={() => setShowFeedback(false)} className={`p-2 hover:bg-slate-100 ${DESIGN.radius.sm} text-slate-300 hover:text-slate-600 transition-all`}>
                <ICONS.Close className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">整体满意度</label>
                <StarRating value={feedbackData.satisfactionRating} onChange={(v) => setFeedbackData(d => ({ ...d, satisfactionRating: v }))} />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">匹配速度</label>
                <StarRating value={feedbackData.speedRating} onChange={(v) => setFeedbackData(d => ({ ...d, speedRating: v }))} />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">专家质量</label>
                <StarRating value={feedbackData.qualityRating} onChange={(v) => setFeedbackData(d => ({ ...d, qualityRating: v }))} />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">改进建议</label>
                <textarea 
                  value={feedbackData.suggestions}
                  onChange={(e) => setFeedbackData(d => ({ ...d, suggestions: e.target.value }))}
                  placeholder="您对 Maybole 匹配服务有什么改进建议？"
                  className={`w-full ${DESIGN.input.textarea} h-32`}
                />
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button onClick={() => setShowFeedback(false)} className={`flex-1 py-4 text-xs ${DESIGN.button.base} ${DESIGN.button.ghost}`}>取消</button>
              <button 
                onClick={handleSubmitFeedback}
                disabled={!feedbackData.satisfactionRating || !feedbackData.speedRating || !feedbackData.qualityRating}
                className={`flex-[2] py-4 ${DESIGN.radius.md} text-xs ${DESIGN.button.base} ${
                  feedbackData.satisfactionRating && feedbackData.speedRating && feedbackData.qualityRating
                    ? DESIGN.button.primary : 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none'
                }`}
              >
                提交反馈
              </button>
            </div>
          </div>
        </div>
      )}
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
    
    // Simulate recruitment: sent to 12 experts, 0 responded so far
    const recruitmentSentCount = Math.floor(Math.random() * 5) + 10;
    const recruitmentTargetCount = Math.floor(Math.random() * 3) + 4;

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
      
      请重点突出对"专业领域知识"和"模型训练背景"的要求。请用中文输出。`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      const newNeed: Need = {
        id: `need-${Math.floor(Math.random() * 900) + 200}`,
        customerId: 'cust-1',
        customerOrgName: '神经网络科技有限公司',
        status: NeedStatus.RECRUITING,
        createdAt: new Date().toISOString(),
        shortlist: [],
        shortlistReviewStatuses: {},
        roundIndex: 1,
        aiSummary: response.text?.trim() || 'AI 摘要生成中...',
        clarificationLog: [],
        pendingActionBy: 'admin',
        replacementCount: 0,
        recruitmentSentCount,
        recruitmentRespondedCount: 0,
        recruitmentTargetCount,
        ...formData
      };
      onSubmit(newNeed);
    } catch (error) {
      onSubmit({
        id: `need-${Date.now()}`,
        customerId: 'cust-1',
        customerOrgName: '神经网络科技有限公司',
        status: NeedStatus.RECRUITING,
        createdAt: new Date().toISOString(),
        shortlist: [],
        shortlistReviewStatuses: {},
        roundIndex: 1,
        clarificationLog: [],
        pendingActionBy: 'admin',
        replacementCount: 0,
        recruitmentSentCount,
        recruitmentRespondedCount: 0,
        recruitmentTargetCount,
        ...formData
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`max-w-5xl mx-auto ${DESIGN.card.level3} border border-slate-200 overflow-hidden ${DESIGN.animation.slideUp}`}>
      <div className="bg-indigo-600 p-8 lg:p-12 text-white">
        <h2 className="text-2xl lg:text-4xl font-black tracking-tighter">发布专家寻访协议</h2>
        <p className="text-indigo-100 mt-2 font-bold uppercase tracking-widest text-[10px] opacity-80">Maybole AI Post-Training Search Protocol</p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 lg:p-12 space-y-12 lg:space-y-16">
        {/* Section 1: Context & Domain */}
        <div className="space-y-6 lg:space-y-8">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-xs italic">01</div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">领域上下文 (Context)</h3>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">核心领域 (Master Domain) *</label>
                <input required className={`w-full ${DESIGN.input.base} font-bold`} placeholder="例如：医学、法律、数学" value={formData.domainArea} onChange={e => setFormData({...formData, domainArea: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">细分方向 (Sub-Domain) *</label>
                <input required className={`w-full ${DESIGN.input.base} font-bold`} placeholder="例如：心脏病学、证券法、拓扑学" value={formData.subDomain} onChange={e => setFormData({...formData, subDomain: e.target.value})} />
              </div>
           </div>
        </div>

        {/* Section 2: Expertise & Requirements */}
        <div className="space-y-6 lg:space-y-8">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-xs italic">02</div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">专家能力模型 (Expertise Model)</h3>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">人才层级要求 *</label>
                <select className={`w-full ${DESIGN.input.base} font-bold`} value={formData.expertTier} onChange={e => setFormData({...formData, expertTier: e.target.value as ExpertTier})}>
                  {Object.values(ExpertTier).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">任务形式 *</label>
                <select className={`w-full ${DESIGN.input.base} font-bold`} value={formData.taskType} onChange={e => setFormData({...formData, taskType: e.target.value as TaskType})}>
                  {Object.values(TaskType).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">交付物类型 *</label>
                <select className={`w-full ${DESIGN.input.base} font-bold`} value={formData.dataProductType} onChange={e => setFormData({...formData, dataProductType: e.target.value as DataProductType})}>
                  {Object.values(DataProductType).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
           </div>
        </div>

        {/* Section 3: Task & Quality Control */}
        <div className="space-y-6 lg:space-y-8">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-xs italic">03</div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">任务详情与质量约束 (Execution & Quality)</h3>
           </div>
           
           <div className="space-y-6 lg:space-y-8">
             <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">详细任务描述与交付标准 *</label>
               <textarea required className={`w-full ${DESIGN.input.textarea} h-36 lg:h-44 leading-relaxed`} placeholder="请详细说明：专家需要完成什么？输出格式（如 JSON/Markdown）？是否需要思维链（CoT）轨迹？是否有特殊的 Prompt 注入要求？" value={formData.taskDescription} onChange={e => setFormData({...formData, taskDescription: e.target.value})} />
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">硬性准入条件 (Must Have)</label>
                 <textarea className={`w-full ${DESIGN.input.textarea} h-32`} placeholder="例如：必须通过过中国执业医师考试、必须有 3 年以上红队对抗经验..." value={formData.mustHave} onChange={e => setFormData({...formData, mustHave: e.target.value})} />
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">合规与敏感性约束 (Compliance)</label>
                 <textarea className={`w-full ${DESIGN.input.textarea} h-32`} placeholder="是否涉及私域敏感数据？是否有特定领域的安全红线？" value={formData.complianceConstraints} onChange={e => setFormData({...formData, complianceConstraints: e.target.value})} />
               </div>
             </div>
           </div>
        </div>

        {/* Section 4: Operational */}
        <div className="space-y-6 lg:space-y-8">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-xs italic">04</div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">运营与预算 (Ops & Budget)</h3>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">预算区间 *</label>
                <input required className={`w-full ${DESIGN.input.base} font-bold`} placeholder="例如：¥800-¥1200/hr" value={formData.budgetRange} onChange={e => setFormData({...formData, budgetRange: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">投入强度 (h/wk) *</label>
                <input type="number" required className={`w-full ${DESIGN.input.base} font-bold`} value={formData.intensityHours} onChange={e => setFormData({...formData, intensityHours: parseInt(e.target.value)})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">预计周期 *</label>
                <input required className={`w-full ${DESIGN.input.base} font-bold`} placeholder="例如：2周、3个月" value={formData.timeline} onChange={e => setFormData({...formData, timeline: e.target.value})} />
              </div>
           </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-4 lg:gap-6 pt-8 lg:pt-12 border-t border-slate-50">
          <button type="button" onClick={onCancel} className={`px-8 lg:px-10 py-3 lg:py-4 text-[10px] ${DESIGN.button.base} ${DESIGN.button.ghost}`}>取消</button>
          <button type="submit" disabled={!isFormValid || loading} className={`px-10 lg:px-16 py-3 lg:py-4 ${DESIGN.radius.md} text-white text-[10px] ${DESIGN.button.base} ${isFormValid && !loading ? DESIGN.button.primary : 'bg-slate-200 cursor-not-allowed shadow-none'}`}>
            {loading ? 'AI 正在分析搜索协议...' : '确认并启动全球专家寻访'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CustomerProjectManagement;
