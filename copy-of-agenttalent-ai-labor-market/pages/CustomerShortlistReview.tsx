
import React, { useState } from 'react';
import { Need, NeedStatus, ShortlistReview } from '../types';
import { MOCK_EXPERTS } from '../services/mockData';
import { ICONS } from '../constants';

interface CustomerShortlistReviewProps {
  needs: Need[];
  onUpdateNeed: (need: Need) => void;
}

const CustomerShortlistReview: React.FC<CustomerShortlistReviewProps> = ({ needs, onUpdateNeed }) => {
  const shortlistNeeds = needs.filter(n => n.status === NeedStatus.SHORTLISTED);
  const [activeNeed, setActiveNeed] = useState<Need | null>(shortlistNeeds[0] || null);
  const [showDeclineModal, setShowDeclineModal] = useState<{needId: string, expertId: string} | null>(null);
  const [declineCategory, setDeclineCategory] = useState('');
  const [declineDetails, setDeclineDetails] = useState('');

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
    setDeclineCategory('');
    setDeclineDetails('');
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
    alert(anyDeclined ? "反馈已提交。Maybole 正在为您寻找更完美的匹配人选。" : "所有专家已批准！系统正在发起引荐对话...");
  };

  const handleDeclineConfirm = () => {
    if (!showDeclineModal || !declineCategory || !declineDetails.trim()) return;
    const fullReason = `[${declineCategory}] ${declineDetails.trim()}`;
    handleReviewExpert(showDeclineModal.expertId, 'declined', fullReason);
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row gap-10">
        {/* Shortlist Sidebar */}
        <div className="w-full md:w-80 space-y-6">
          <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-widest px-2">待评审项目</h3>
          <div className="space-y-3">
             {shortlistNeeds.length > 0 ? shortlistNeeds.map(need => (
               <div 
                key={need.id} 
                onClick={() => setActiveNeed(need)}
                className={`p-6 rounded-[32px] border transition-all cursor-pointer relative group ${
                  activeNeed?.id === need.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl translate-x-2' : 'bg-white border-slate-100 text-slate-600 hover:border-indigo-200'
                }`}
               >
                 <h4 className="font-bold text-sm leading-tight">{need.domainArea}</h4>
                 <div className="mt-4 flex items-center justify-between">
                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase ${activeNeed?.id === need.id ? 'bg-white/20 text-white' : 'bg-slate-50 text-slate-400'}`}>
                      {/* Fixed: Cast Object.values to ShortlistReview[] to avoid TS error on 'status' */}
                      {(Object.values(need.shortlistReviewStatuses) as ShortlistReview[]).filter(s => s.status !== 'pending').length} / {need.shortlist.length} 已评审
                    </span>
                    {/* Fixed: Cast Object.values to ShortlistReview[] to avoid TS error on 'status' */}
                    {(Object.values(need.shortlistReviewStatuses) as ShortlistReview[]).some(s => s.status === 'pending') && (
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                      </span>
                    )}
                 </div>
               </div>
             )) : (
               <div className="p-8 text-center text-slate-300 font-black uppercase text-xs border-2 border-dashed border-slate-100 rounded-3xl">
                  暂无待评审短名单
               </div>
             )}
          </div>
        </div>

        {/* Expert Review Canvas */}
        <div className="flex-1 bg-white border border-slate-100 rounded-[48px] shadow-sm flex flex-col min-h-[700px] relative overflow-hidden">
          {activeNeed ? (
            <>
              <div className="p-12 border-b border-slate-50 flex justify-between items-end shrink-0">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">短名单：{activeNeed.domainArea}</h2>
                    <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                      ROUND {activeNeed.roundIndex}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Expert Shortlist for Review</p>
                </div>
                <button 
                  onClick={handleSubmitReview}
                  /* Fixed: Cast Object.values to ShortlistReview[] to avoid TS error on 'status' */
                  disabled={(Object.values(activeNeed.shortlistReviewStatuses) as ShortlistReview[]).some(s => s.status === 'pending')}
                  className={`px-10 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                    /* Fixed: Cast Object.values to ShortlistReview[] to avoid TS error on 'status' */
                    (Object.values(activeNeed.shortlistReviewStatuses) as ShortlistReview[]).every(s => s.status !== 'pending')
                      ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100 hover:scale-105 active:scale-95'
                      : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                  }`}
                >
                  确认并提交评审
                </button>
              </div>

              <div className="flex-1 p-12 overflow-y-auto custom-scrollbar bg-slate-50/30">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {activeNeed.shortlist.map(expertId => {
                    const expert = MOCK_EXPERTS.find(e => e.id === expertId);
                    const review = activeNeed.shortlistReviewStatuses[expertId];
                    if (!expert) return null;

                    const isNew = review?.status === 'pending';

                    return (
                      <div key={expert.id} className={`group p-8 rounded-[40px] border transition-all duration-500 relative flex flex-col ${
                        review?.status === 'approved' ? 'bg-white border-emerald-400 shadow-xl shadow-emerald-50' :
                        review?.status === 'declined' ? 'bg-slate-50 border-slate-200 opacity-50 grayscale' :
                        'bg-white border-white shadow-xl shadow-indigo-100/10'
                      }`}>
                         {/* Status Badges */}
                         <div className="absolute -top-3 left-8 flex gap-2">
                           {isNew && (
                             <span className="bg-amber-500 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg animate-pulse ring-4 ring-white">
                               NEW REPLACEMENT
                             </span>
                           )}
                           {review?.status === 'approved' && (
                             <span className="bg-emerald-500 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg flex items-center gap-1.5 ring-4 ring-white">
                               <ICONS.CheckCircle className="w-3 h-3" />
                               APPROVED
                             </span>
                           )}
                         </div>

                         <div className="flex items-start gap-6 mb-6">
                            <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center font-black text-2xl transition-all ${
                              review?.status === 'approved' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
                            }`}>
                               {expert.name.charAt(0)}
                            </div>
                            <div className="space-y-1">
                               <h4 className={`text-lg font-black transition-colors ${review?.status === 'approved' ? 'text-emerald-900' : 'text-slate-900'}`}>{expert.name}</h4>
                               <div className="flex items-center gap-3">
                                  <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-lg tracking-widest ${
                                    review?.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'
                                  }`}>
                                    {expert.trustTier}
                                  </span>
                                  <span className="text-[9px] font-bold text-slate-300 uppercase tracking-tight">{expert.rateRange}</span>
                               </div>
                            </div>
                         </div>

                         <p className={`text-sm leading-relaxed font-medium mb-8 flex-1 transition-colors ${
                           review?.status === 'approved' ? 'text-emerald-700/80' : 'text-slate-600'
                         }`}>
                            {expert.summaryExperience}
                         </p>

                         <div className="flex flex-wrap gap-2 mb-8">
                            {expert.domainTags.map(tag => (
                              <span key={tag} className={`px-3 py-1 text-[10px] font-black uppercase rounded-xl transition-all ${
                                review?.status === 'approved' ? 'bg-emerald-50 text-emerald-400' : 'bg-slate-50 text-slate-400'
                              }`}>#{tag}</span>
                            ))}
                         </div>

                         <div className={`pt-8 border-t flex gap-3 transition-colors ${
                           review?.status === 'approved' ? 'border-emerald-100' : 'border-slate-50'
                         }`}>
                            {isNew ? (
                              <>
                                <button 
                                  onClick={() => setShowDeclineModal({needId: activeNeed.id, expertId: expert.id})}
                                  className="flex-1 py-3 text-[10px] font-black uppercase text-rose-500 hover:bg-rose-50 rounded-2xl transition-all tracking-widest active:scale-95"
                                >
                                  不合适
                                </button>
                                <button 
                                  onClick={() => handleReviewExpert(expert.id, 'approved')}
                                  className="flex-[2] py-4 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-2xl shadow-xl shadow-indigo-100 tracking-widest active:scale-95 hover:bg-indigo-700 transition-all"
                                >
                                  批准人选
                                </button>
                              </>
                            ) : (
                              <button 
                                onClick={() => handleReviewExpert(expert.id, 'pending')}
                                className={`w-full py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
                                  review?.status === 'approved' ? 'text-emerald-400 hover:text-emerald-600' : 'text-slate-300 hover:text-slate-600'
                                }`}
                              >
                                {review?.status === 'declined' ? '重新评审' : '撤销批准'}
                              </button>
                            )}
                         </div>

                         {review?.status === 'declined' && (
                           <div className="mt-4 p-4 bg-rose-100/30 rounded-2xl text-[10px] text-rose-600 font-bold italic border border-rose-100/50">
                              拒绝原因: {review.reason}
                           </div>
                         )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 opacity-20 text-center">
              <ICONS.User className="w-32 h-32 mb-8" />
              <p className="text-2xl font-black uppercase tracking-[0.2em]">请选择项目评审短名单</p>
            </div>
          )}
        </div>
      </div>

      {/* Decline Modal */}
      {showDeclineModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-6 overflow-y-auto">
          <div className="bg-white rounded-[40px] p-10 max-w-lg w-full shadow-2xl animate-in zoom-in duration-300 my-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">拒绝专家人选</h3>
                <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">Reason for Rejection</p>
              </div>
              <button onClick={() => setShowDeclineModal(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-300 hover:text-slate-600 transition-all">
                <ICONS.Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">1. 选择核心原因 *</label>
                <div className="grid grid-cols-2 gap-2">
                  {['技能匹配度不足', '预算超出范围', '响应时间较慢', '经验不符', '语言障碍', '其他'].map(r => (
                    <button
                      key={r}
                      onClick={() => setDeclineCategory(r)}
                      className={`text-left px-4 py-3 rounded-xl border font-black text-[11px] transition-all tracking-tight ${
                        declineCategory === r ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-600 hover:border-indigo-200'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">2. 详细说明您的具体需求 *</label>
                <textarea 
                  required
                  value={declineDetails}
                  onChange={(e) => setDeclineDetails(e.target.value)}
                  placeholder="请详细描述为什么该专家不合适，以及您希望匹配什么样的专家（例如：需要具备具体的工具使用经验或特定行业背景）..."
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all h-32 resize-none"
                />
                <p className="text-[10px] text-slate-400 font-medium">您的具体反馈将直接帮助 Maybole 管理员在下一轮匹配中更精准地锁定目标人才。</p>
              </div>
            </div>

            <div className="flex gap-4 mt-10">
              <button onClick={() => setShowDeclineModal(null)} className="flex-1 py-4 text-xs font-black text-slate-400 uppercase tracking-widest transition-colors hover:text-slate-900">取消</button>
              <button 
                onClick={handleDeclineConfirm}
                disabled={!declineCategory || !declineDetails.trim()}
                className="flex-[2] bg-rose-500 hover:bg-rose-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-rose-100 disabled:bg-slate-100 disabled:text-slate-300 disabled:shadow-none transition-all active:scale-95"
              >
                {!declineCategory || !declineDetails.trim() ? '请完善拒绝理由' : '确认拒绝并提交'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerShortlistReview;
