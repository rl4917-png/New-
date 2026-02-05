
import React, { useState } from 'react';
import { Need, NeedStatus, TaskType, ClarificationMessage, ShortlistReview } from '../types';
import { MOCK_EXPERTS } from '../services/mockData';
import { ICONS } from '../constants';
import { GoogleGenAI } from '@google/genai';

interface CustomerDashboardProps {
  needs: Need[];
  isCreating: boolean;
  setIsCreating: (val: boolean) => void;
  onAddNeed: (need: Need) => void;
  onUpdateNeed: (need: Need) => void;
}

const CustomerDashboard: React.FC<CustomerDashboardProps> = ({ needs, isCreating, setIsCreating, onAddNeed, onUpdateNeed }) => {
  const [activeNeed, setActiveNeed] = useState<Need | null>(null);
  const [replyText, setReplyText] = useState('');
  const [showDeclineModal, setShowDeclineModal] = useState<{needId: string, expertId: string} | null>(null);
  const [declineReason, setDeclineReason] = useState('');

  const getStatusColor = (status: NeedStatus) => {
    switch (status) {
      case NeedStatus.SUBMITTED: return 'bg-blue-100 text-blue-700';
      case NeedStatus.DISCOVERY: return 'bg-amber-100 text-amber-700';
      case NeedStatus.SHORTLISTED: return 'bg-indigo-100 text-indigo-700';
      case NeedStatus.INTRO: return 'bg-emerald-100 text-emerald-700';
      case NeedStatus.CLOSED: return 'bg-slate-100 text-slate-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  // Fixed: Expanded status type to include 'pending' to match ShortlistReview status and allow revocation.
  const handleReviewExpert = (expertId: string, status: 'pending' | 'approved' | 'declined', reason?: string) => {
    if (!activeNeed) return;
    
    const updatedStatuses = {
      ...activeNeed.shortlistReviewStatuses,
      [expertId]: { status, reason, timestamp: new Date().toISOString() }
    };

    const updatedNeed: Need = {
      ...activeNeed,
      shortlistReviewStatuses: updatedStatuses
    };

    onUpdateNeed(updatedNeed);
    setActiveNeed(updatedNeed);
    setShowDeclineModal(null);
    setDeclineReason('');
  };

  const handleSubmitReview = () => {
    if (!activeNeed) return;
    
    // Fixed: Cast Object.values to ShortlistReview[] to avoid TS error on 'status'
    const anyDeclined = (Object.values(activeNeed.shortlistReviewStatuses) as ShortlistReview[]).some(s => s.status === 'declined');
    
    const updatedNeed: Need = {
      ...activeNeed,
      pendingActionBy: anyDeclined ? 'admin' : undefined,
      status: anyDeclined ? NeedStatus.SHORTLISTED : NeedStatus.INTRO
    };

    onUpdateNeed(updatedNeed);
    setActiveNeed(updatedNeed);
    alert(anyDeclined ? "您的反馈已提交。管理员正在为您寻找替换人选，请关注看板通知。" : "所有专家已批准！引荐已发起。");
  };

  if (isCreating) {
    return <NeedIntakeForm onCancel={() => setIsCreating(false)} onSubmit={onAddNeed} />;
  }

  return (
    <div className="space-y-8">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
          {needs.some(n => n.pendingActionBy === 'customer') && (
            <div className="absolute top-0 right-0 p-3">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500 shadow-sm"></span>
              </span>
            </div>
          )}
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">待处理事项</p>
          <p className="text-3xl font-black text-slate-900 mt-2">
            {needs.filter(n => n.pendingActionBy === 'customer').length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">短名单评审中</p>
          <p className="text-3xl font-black text-indigo-600 mt-2">
            {needs.filter(n => n.status === NeedStatus.SHORTLISTED).length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">活跃合作</p>
          <p className="text-3xl font-black text-emerald-600 mt-2">
            {needs.filter(n => n.status === NeedStatus.INTRO).length}
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Needs List */}
        <div className="w-full lg:w-1/3 space-y-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 px-1">
            <ICONS.Clock className="w-5 h-5 text-indigo-500" />
            您的需求进度
          </h3>
          <div className="space-y-3">
            {needs.map(need => (
              <div
                key={need.id}
                onClick={() => setActiveNeed(need)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer relative group ${
                  activeNeed?.id === need.id 
                    ? 'bg-white border-indigo-400 shadow-xl ring-1 ring-indigo-400 -translate-y-0.5' 
                    : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-md'
                }`}
              >
                {need.pendingActionBy === 'customer' && (
                  <div className="absolute -top-2 -right-2 bg-rose-500 text-white text-[9px] font-black px-2 py-1 rounded-full uppercase shadow-lg z-10">
                    待回复
                  </div>
                )}
                <div className="flex justify-between items-start mb-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getStatusColor(need.status)}`}>
                    {need.status}
                  </span>
                  <span className="text-[10px] font-bold text-slate-300">#{need.id.split('-')[1]}</span>
                </div>
                <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{need.domainArea}</h4>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{need.taskType}</span>
                  {need.status === NeedStatus.SHORTLISTED && (
                    <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded-lg">
                      {/* Fixed: Cast Object.values to ShortlistReview[] to avoid TS error on 'status' */}
                      {(Object.values(need.shortlistReviewStatuses) as ShortlistReview[]).filter(s => s.status !== 'pending').length} / {need.shortlist.length} 已评审
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detail View */}
        <div className="flex-1 min-h-[600px]">
          {activeNeed ? (
            <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden flex flex-col h-full animate-in fade-in duration-500">
              <div className="bg-slate-50/50 border-b border-slate-100 p-8 flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                    {activeNeed.domainArea}
                    {activeNeed.isApproved && activeNeed.status !== NeedStatus.SHORTLISTED && (
                      <ICONS.CheckCircle className="w-6 h-6 text-emerald-500" />
                    )}
                  </h2>
                  <p className="text-slate-400 font-bold text-sm mt-1 uppercase tracking-wide">
                    {activeNeed.customerOrgName} · 第 {activeNeed.roundIndex} 轮匹配
                  </p>
                </div>
                <button className="text-slate-400 hover:text-rose-500 transition-colors">
                  <ICONS.Plus className="w-6 h-6 rotate-45" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-12">
                {/* Shortlist Review Section */}
                {activeNeed.status === NeedStatus.SHORTLISTED && (
                  <div className="space-y-8">
                    <div className="flex justify-between items-end">
                      <div>
                        <h3 className="text-lg font-black text-slate-900">Maybole 专家短名单</h3>
                        <p className="text-sm text-slate-500 mt-1">请评审为您挑选的领域精英。如有不合人选，请告知原因以便我们为您替换。</p>
                      </div>
                      <button 
                        onClick={handleSubmitReview}
                        /* Fixed: Cast Object.values to ShortlistReview[] to avoid TS error on 'status' */
                        disabled={(Object.values(activeNeed.shortlistReviewStatuses) as ShortlistReview[]).some(s => s.status === 'pending')}
                        className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
                          /* Fixed: Cast Object.values to ShortlistReview[] to avoid TS error on 'status' */
                          (Object.values(activeNeed.shortlistReviewStatuses) as ShortlistReview[]).every(s => s.status !== 'pending')
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 hover:scale-105'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        提交评审结果
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {activeNeed.shortlist.map(expertId => {
                        const expert = MOCK_EXPERTS.find(e => e.id === expertId);
                        const review = activeNeed.shortlistReviewStatuses[expertId];
                        if (!expert) return null;

                        return (
                          <div key={expert.id} className={`p-6 rounded-2xl border transition-all relative ${
                            review.status === 'approved' ? 'bg-emerald-50/30 border-emerald-200' :
                            review.status === 'declined' ? 'bg-rose-50/30 border-rose-200 opacity-60' :
                            'bg-white border-slate-200 shadow-sm'
                          }`}>
                            {review.status === 'approved' && (
                              <div className="absolute top-4 right-4 text-emerald-600">
                                <ICONS.CheckCircle className="w-6 h-6" />
                              </div>
                            )}
                            
                            <div className="flex items-start gap-4 mb-4">
                              <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-lg">
                                {expert.name.charAt(0)}
                              </div>
                              <div>
                                <h4 className="font-bold text-slate-900">{expert.name}</h4>
                                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{expert.trustTier}</p>
                              </div>
                            </div>

                            <p className="text-xs text-slate-600 leading-relaxed mb-4 line-clamp-3">
                              {expert.summaryExperience}
                            </p>

                            <div className="flex flex-wrap gap-1.5 mb-6">
                              {expert.domainTags.map(tag => (
                                <span key={tag} className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-bold uppercase">
                                  #{tag}
                                </span>
                              ))}
                            </div>

                            <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                费率: <span className="text-slate-900 font-black ml-1">{expert.rateRange}</span>
                              </div>
                              
                              <div className="flex gap-2">
                                {review.status === 'pending' ? (
                                  <>
                                    <button 
                                      onClick={() => setShowDeclineModal({needId: activeNeed.id, expertId: expert.id})}
                                      className="p-2 rounded-lg text-rose-500 hover:bg-rose-100 transition-colors"
                                    >
                                      <ICONS.Plus className="w-5 h-5 rotate-45" />
                                    </button>
                                    <button 
                                      onClick={() => handleReviewExpert(expert.id, 'approved')}
                                      className="bg-emerald-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-md shadow-emerald-100 hover:bg-emerald-700"
                                    >
                                      批准
                                    </button>
                                  </>
                                ) : (
                                  <button 
                                    onClick={() => handleReviewExpert(expert.id, 'pending')}
                                    className="text-[10px] font-bold text-slate-400 hover:text-indigo-600 uppercase"
                                  >
                                    撤销评审
                                  </button>
                                )}
                              </div>
                            </div>
                            
                            {review.status === 'declined' && (
                              <div className="mt-3 p-2 bg-rose-100/50 rounded-lg text-[10px] text-rose-700 italic">
                                拒绝理由: {review.reason}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {activeNeed.pendingActionBy === 'admin' && (
                        <div className="md:col-span-2 border-2 border-dashed border-indigo-200 rounded-2xl p-8 text-center bg-indigo-50/20">
                           <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                              <ICONS.Clock className="w-5 h-5 text-indigo-600 animate-pulse" />
                           </div>
                           <h4 className="font-bold text-indigo-900">正在寻找替换专家...</h4>
                           <p className="text-xs text-indigo-600 mt-1 italic">Maybole 管理员已收到您的反馈，新专家上线后将通知您。</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Clarification Section */}
                {(activeNeed.status === NeedStatus.DISCOVERY || activeNeed.clarificationLog.length > 0) && (
                  <div className="space-y-6">
                    <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] border-b border-slate-100 pb-3">
                      需求澄清对话回溯
                    </h3>
                    <div className="space-y-4 max-w-2xl">
                      {activeNeed.clarificationLog.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.author === 'customer' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`p-4 rounded-2xl ${
                            msg.author === 'customer' 
                              ? 'bg-indigo-600 text-white shadow-lg' 
                              : 'bg-slate-100 text-slate-800'
                          }`}>
                            <p className="text-sm leading-relaxed font-medium">{msg.text}</p>
                            <span className="text-[8px] mt-2 block opacity-40 uppercase font-black">
                              {new Date(msg.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl bg-white p-12 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-6">
                <ICONS.User className="w-8 h-8 text-slate-200" />
              </div>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">请在侧边栏选择一个项目</p>
            </div>
          )}
        </div>
      </div>

      {/* Decline Reason Modal */}
      {showDeclineModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-6">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in duration-300">
            <h3 className="text-xl font-black text-slate-900 mb-2">拒绝该专家？</h3>
            <p className="text-sm text-slate-500 mb-6">请告诉我们不合适的原因，这有助于我们在 Maybole 专家库中为您挑选更完美的匹配。</p>
            
            <div className="space-y-3 mb-8">
              {['能力不匹配', '预算超出范围', '响应时间慢', '语言要求不符', '经验年限不足'].map(r => (
                <button
                  key={r}
                  onClick={() => setDeclineReason(r)}
                  className={`w-full text-left px-4 py-3 rounded-xl border font-bold text-sm transition-all ${
                    declineReason === r ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm' : 'bg-slate-50 border-slate-100 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {r}
                </button>
              ))}
              <textarea 
                placeholder="其他原因..."
                value={declineReason.startsWith('其他') ? declineReason.replace('其他:', '') : ''}
                onChange={(e) => setDeclineReason(`其他:${e.target.value}`)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm h-20 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowDeclineModal(null)}
                className="flex-1 py-3 text-sm font-bold text-slate-500 hover:text-slate-900"
              >
                取消
              </button>
              <button 
                onClick={() => handleReviewExpert(showDeclineModal.expertId, 'declined', declineReason)}
                disabled={!declineReason}
                className="flex-[2] bg-rose-500 hover:bg-rose-600 text-white py-3 rounded-2xl font-bold shadow-lg shadow-rose-100 disabled:bg-slate-200 disabled:shadow-none transition-all"
              >
                确认拒绝
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface IntakeFormProps {
  onCancel: () => void;
  onSubmit: (need: Need) => void;
}

const NeedIntakeForm: React.FC<IntakeFormProps> = ({ onCancel, onSubmit }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    domainArea: '',
    taskType: TaskType.REVIEW,
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

  const isFormValid = formData.domainArea && formData.taskDescription && formData.timeline && formData.budgetRange;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setLoading(true);
    try {
      // Fixed: Initialized GoogleGenAI with named parameter as required by guidelines.
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `你是一个专业的劳务市场匹配助手。请根据以下客户提交的AI专家需求数据，生成一段简洁、专业且吸引专家的项目摘要（150字以内）。
      领域：${formData.domainArea}
      任务类型：${formData.taskType}
      描述：${formData.taskDescription}
      时间周期：${formData.timeline}
      语言要求：${formData.languageRequirement}
      
      请用中文输出。`;

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
        // Fixed: Used .text property directly instead of text() method.
        aiSummary: response.text?.trim() || 'AI 摘要生成中...',
        clarificationLog: [],
        pendingActionBy: 'admin',
        ...formData
      };

      onSubmit(newNeed);
    } catch (error) {
      console.error('AI summary generation failed', error);
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
    <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-indigo-600 p-10 text-white">
        <h2 className="text-3xl font-black">提交专家招聘需求</h2>
        <p className="text-indigo-100 mt-2 opacity-80 font-medium">Maybole 专家库将精准匹配您的模型开发与评估需求</p>
      </div>

      <form onSubmit={handleSubmit} className="p-10 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-6">
            <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
              <div className="w-6 h-[2px] bg-indigo-600"></div>
              必填项目
            </h3>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase">领域方向 *</label>
              <input required className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="例如：NLP 法律推理" value={formData.domainArea} onChange={e => setFormData({...formData, domainArea: e.target.value})} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase">任务类型 *</label>
              <select className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" value={formData.taskType} onChange={e => setFormData({...formData, taskType: e.target.value as TaskType})}>
                {Object.values(TaskType).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase">预算区间 *</label>
              <input required className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="例如：¥500-¥800/hr" value={formData.budgetRange} onChange={e => setFormData({...formData, budgetRange: e.target.value})} />
            </div>
          </div>
          <div className="space-y-6">
             <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
              <div className="w-6 h-[2px] bg-slate-300"></div>
              可选补充
            </h3>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase">必须具备 (Must Have)</label>
              <textarea className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all h-24" placeholder="专家必须具备的硬性条件" value={formData.mustHave} onChange={e => setFormData({...formData, mustHave: e.target.value})} />
            </div>
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase">详细描述及数量化要求 *</label>
          <textarea required className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all h-40" placeholder="描述项目目标..." value={formData.taskDescription} onChange={e => setFormData({...formData, taskDescription: e.target.value})} />
        </div>
        <div className="flex justify-end gap-6 pt-6 border-t border-slate-100">
          <button type="button" onClick={onCancel} className="px-6 py-2.5 text-sm font-bold text-slate-400 hover:text-slate-900">取消</button>
          <button type="submit" disabled={!isFormValid || loading} className={`px-12 py-3 rounded-2xl text-white font-black transition-all shadow-xl ${isFormValid && !loading ? 'bg-indigo-600 hover:bg-indigo-700 active:scale-95' : 'bg-slate-300 cursor-not-allowed'}`}>
            {loading ? 'AI 正在分析需求...' : '确认发布需求'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CustomerDashboard;
