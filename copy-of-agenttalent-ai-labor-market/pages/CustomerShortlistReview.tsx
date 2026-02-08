
import React, { useState, useMemo } from 'react';
import { Need, NeedStatus, ShortlistReview } from '../types';
import { MOCK_EXPERTS } from '../services/mockData';
import { ICONS, DESIGN } from '../constants';

type SortOption = 'default' | 'rate_desc' | 'rate_asc' | 'trust' | 'experience';

interface CustomerShortlistReviewProps {
  needs: Need[];
  onUpdateNeed: (need: Need) => void;
}

// Helper to parse rate string into numeric value for sorting
const parseRate = (rateRange: string): number => {
  const match = rateRange.match(/[\d,]+/g);
  if (!match) return 0;
  const nums = match.map(s => parseInt(s.replace(/,/g, '')));
  return nums.length > 1 ? (nums[0] + nums[1]) / 2 : nums[0];
};

const TRUST_ORDER: Record<string, number> = { 'Proven Expert': 3, 'Screened': 2, 'New': 1 };

const CustomerShortlistReview: React.FC<CustomerShortlistReviewProps> = ({ needs, onUpdateNeed }) => {
  const shortlistNeeds = needs.filter(n => n.status === NeedStatus.SHORTLISTED);
  const [activeNeed, setActiveNeed] = useState<Need | null>(shortlistNeeds[0] || null);
  const [showDeclineModal, setShowDeclineModal] = useState<{needId: string, expertIds: string[]} | null>(null);
  const [declineCategory, setDeclineCategory] = useState('');
  const [declineDetails, setDeclineDetails] = useState('');
  
  // Batch selection
  const [selectedExperts, setSelectedExperts] = useState<Set<string>>(new Set());
  // Sort
  const [sortBy, setSortBy] = useState<SortOption>('default');

  // Sorted expert list
  const sortedShortlist = useMemo(() => {
    if (!activeNeed) return [];
    const list = [...activeNeed.shortlist];
    const getExpert = (id: string) => MOCK_EXPERTS.find(e => e.id === id);
    
    switch (sortBy) {
      case 'rate_desc':
        return list.sort((a, b) => parseRate(getExpert(b)?.rateRange || '') - parseRate(getExpert(a)?.rateRange || ''));
      case 'rate_asc':
        return list.sort((a, b) => parseRate(getExpert(a)?.rateRange || '') - parseRate(getExpert(b)?.rateRange || ''));
      case 'trust':
        return list.sort((a, b) => (TRUST_ORDER[getExpert(b)?.trustTier || ''] || 0) - (TRUST_ORDER[getExpert(a)?.trustTier || ''] || 0));
      default:
        return list;
    }
  }, [activeNeed, sortBy]);

  const toggleSelect = (expertId: string) => {
    setSelectedExperts(prev => {
      const next = new Set(prev);
      if (next.has(expertId)) next.delete(expertId);
      else next.add(expertId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (!activeNeed) return;
    const pendingExperts = activeNeed.shortlist.filter(id => 
      (activeNeed.shortlistReviewStatuses[id] as ShortlistReview)?.status === 'pending'
    );
    if (selectedExperts.size === pendingExperts.length) {
      setSelectedExperts(new Set());
    } else {
      setSelectedExperts(new Set(pendingExperts));
    }
  };

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

  const handleBatchApprove = () => {
    if (!activeNeed || selectedExperts.size === 0) return;
    const updatedStatuses = { ...activeNeed.shortlistReviewStatuses };
    selectedExperts.forEach(id => {
      updatedStatuses[id] = { status: 'approved', timestamp: new Date().toISOString() };
    });
    const updatedNeed: Need = { ...activeNeed, shortlistReviewStatuses: updatedStatuses };
    onUpdateNeed(updatedNeed);
    setActiveNeed(updatedNeed);
    setSelectedExperts(new Set());
  };

  const handleBatchDeclineInit = () => {
    if (!activeNeed || selectedExperts.size === 0) return;
    setShowDeclineModal({ needId: activeNeed.id, expertIds: Array.from(selectedExperts) });
  };

  const handleSubmitReview = () => {
    if (!activeNeed) return;
    const anyDeclined = (Object.values(activeNeed.shortlistReviewStatuses) as ShortlistReview[]).some(s => s.status === 'declined');
    const declinedCount = (Object.values(activeNeed.shortlistReviewStatuses) as ShortlistReview[]).filter(s => s.status === 'declined').length;
    
    if (anyDeclined) {
      // Re-enter recruitment - reset to new round
      const newRoundSentCount = declinedCount * 2;
      const updatedNeed: Need = {
        ...activeNeed,
        status: NeedStatus.RECRUITING,
        replacementCount: (activeNeed.replacementCount || 0) + declinedCount,
        recruitmentSentCount: newRoundSentCount,
        recruitmentRespondedCount: 0,
        pendingActionBy: 'admin',
      };
      onUpdateNeed(updatedNeed);
      setActiveNeed(null);
      alert(`已拒绝 ${declinedCount} 位专家。系统正在向 ${newRoundSentCount} 位新专家发送需求，重新进入招募流程...`);
    } else {
      const updatedNeed: Need = {
        ...activeNeed,
        status: NeedStatus.INTRO,
        pendingActionBy: undefined,
      };
      onUpdateNeed(updatedNeed);
      setActiveNeed(null);
      alert("所有专家已批准！系统正在发起引荐对话...");
    }
  };

  const handleDeclineConfirm = () => {
    if (!showDeclineModal || !declineCategory || !declineDetails.trim() || !activeNeed) return;
    const fullReason = `[${declineCategory}] ${declineDetails.trim()}`;
    const updatedStatuses = { ...activeNeed.shortlistReviewStatuses };
    showDeclineModal.expertIds.forEach(id => {
      updatedStatuses[id] = { status: 'declined', reason: fullReason, timestamp: new Date().toISOString() };
    });
    const updatedNeed: Need = { ...activeNeed, shortlistReviewStatuses: updatedStatuses };
    onUpdateNeed(updatedNeed);
    setActiveNeed(updatedNeed);
    setShowDeclineModal(null);
    setDeclineCategory('');
    setDeclineDetails('');
    setSelectedExperts(new Set());
  };

  const pendingCount = activeNeed ? (Object.values(activeNeed.shortlistReviewStatuses) as ShortlistReview[]).filter(s => s.status === 'pending').length : 0;
  const allReviewed = activeNeed ? (Object.values(activeNeed.shortlistReviewStatuses) as ShortlistReview[]).every(s => s.status !== 'pending') : false;

  return (
    <div className={`space-y-8 lg:space-y-12 ${DESIGN.animation.fadeIn}`}>
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
        {/* Shortlist Sidebar */}
        <div className="w-full lg:w-80 space-y-6">
          <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-widest px-2">待评审项目</h3>
          <div className="space-y-3">
             {shortlistNeeds.length > 0 ? shortlistNeeds.map(need => (
               <div 
                key={need.id} 
                onClick={() => { setActiveNeed(need); setSelectedExperts(new Set()); setSortBy('default'); }}
                className={`p-5 lg:p-6 ${DESIGN.radius.lg} border transition-all duration-200 cursor-pointer relative group ${
                  activeNeed?.id === need.id ? `bg-indigo-600 border-indigo-600 text-white ${DESIGN.shadow.primary} translate-x-1` : 'bg-white border-slate-100 text-slate-600 hover:border-indigo-200 hover:shadow-lg'
                }`}
               >
                 <h4 className="font-bold text-sm leading-tight">{need.domainArea}</h4>
                 <div className="mt-4 flex items-center justify-between">
                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase ${activeNeed?.id === need.id ? 'bg-white/20 text-white' : 'bg-slate-50 text-slate-400'}`}>
                      {(Object.values(need.shortlistReviewStatuses) as ShortlistReview[]).filter(s => s.status !== 'pending').length} / {need.shortlist.length} 已评审
                    </span>
                    {(Object.values(need.shortlistReviewStatuses) as ShortlistReview[]).some(s => s.status === 'pending') && (
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                      </span>
                    )}
                 </div>
                 {/* Recruitment info */}
                 {need.recruitmentSentCount && (
                   <p className={`text-[9px] font-bold mt-2 ${activeNeed?.id === need.id ? 'text-indigo-200' : 'text-slate-400'}`}>
                     已发送 {need.recruitmentSentCount} 位 · 响应 {need.recruitmentRespondedCount} 位
                   </p>
                 )}
               </div>
             )) : (
               <div className={`p-8 text-center ${DESIGN.emptyState.text} border-2 border-dashed border-slate-100 ${DESIGN.radius.lg}`}>
                  暂无待评审短名单
               </div>
             )}
          </div>
        </div>

        {/* Expert Review Canvas */}
        <div className={`flex-1 ${DESIGN.card.level2} flex flex-col min-h-[500px] lg:min-h-[700px] relative overflow-hidden`}>
          {activeNeed ? (
            <>
              {/* Header with batch controls */}
              <div className="p-8 lg:p-12 border-b border-slate-50 shrink-0">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">短名单：{activeNeed.domainArea}</h2>
                      <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                        ROUND {activeNeed.roundIndex}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">
                      {activeNeed.shortlist.length} 位候选专家 · {pendingCount} 位待评审
                    </p>
                  </div>
                  <button 
                    onClick={handleSubmitReview}
                    disabled={!allReviewed}
                    className={`px-8 lg:px-10 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                      allReviewed
                        ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100 hover:scale-105 active:scale-95'
                        : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                    }`}
                  >
                    确认并提交评审
                  </button>
                </div>

                {/* Batch toolbar */}
                <div className="flex flex-wrap items-center gap-4 mt-6 pt-6 border-t border-slate-100">
                  {/* Select All */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={selectedExperts.size > 0 && selectedExperts.size === activeNeed.shortlist.filter(id => (activeNeed.shortlistReviewStatuses[id] as ShortlistReview)?.status === 'pending').length}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">全选待审</span>
                  </label>

                  {selectedExperts.size > 0 && (
                    <>
                      <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">{selectedExperts.size} 已选</span>
                      <button 
                        onClick={handleBatchApprove}
                        className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl hover:bg-emerald-100 transition-all uppercase tracking-widest"
                      >
                        批量通过
                      </button>
                      <button 
                        onClick={handleBatchDeclineInit}
                        className="text-[10px] font-black text-rose-600 bg-rose-50 px-4 py-2 rounded-xl hover:bg-rose-100 transition-all uppercase tracking-widest"
                      >
                        批量拒绝
                      </button>
                    </>
                  )}

                  <div className="ml-auto flex items-center gap-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">排序</span>
                    <select 
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortOption)}
                      className="text-[11px] font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="default">默认排序</option>
                      <option value="rate_desc">薪资：高到低</option>
                      <option value="rate_asc">薪资：低到高</option>
                      <option value="trust">信任等级</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex-1 p-8 lg:p-12 overflow-y-auto custom-scrollbar bg-slate-50/30">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {sortedShortlist.map(expertId => {
                    const expert = MOCK_EXPERTS.find(e => e.id === expertId);
                    const review = activeNeed.shortlistReviewStatuses[expertId] as ShortlistReview;
                    if (!expert) return null;

                    const isPending = review?.status === 'pending';
                    const isSelected = selectedExperts.has(expertId);

                    return (
                      <div key={expert.id} className={`group p-8 rounded-[40px] border transition-all duration-500 relative flex flex-col ${
                        review?.status === 'approved' ? 'bg-white border-emerald-400 shadow-xl shadow-emerald-50' :
                        review?.status === 'declined' ? 'bg-slate-50 border-slate-200 opacity-50 grayscale' :
                        isSelected ? 'bg-indigo-50/50 border-indigo-300 shadow-xl ring-2 ring-indigo-200' :
                        'bg-white border-white shadow-xl shadow-indigo-100/10'
                      }`}>
                         {/* Selection checkbox */}
                         {isPending && (
                           <div className="absolute top-6 right-8">
                             <input 
                               type="checkbox"
                               checked={isSelected}
                               onChange={() => toggleSelect(expertId)}
                               className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                             />
                           </div>
                         )}

                         {/* Status Badges */}
                         <div className="absolute -top-3 left-8 flex gap-2">
                           {review?.status === 'approved' && (
                             <span className="bg-emerald-500 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg flex items-center gap-1.5 ring-4 ring-white">
                               <ICONS.CheckCircle className="w-3 h-3" />
                               APPROVED
                             </span>
                           )}
                           {review?.status === 'declined' && (
                             <span className="bg-rose-500 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg ring-4 ring-white">
                               DECLINED
                             </span>
                           )}
                         </div>

                         <div className="flex items-start gap-6 mb-6">
                            <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center font-black text-2xl transition-all ${
                              review?.status === 'approved' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
                            }`}>
                               {expert.name.charAt(0)}
                            </div>
                            <div className="space-y-1 flex-1">
                               <h4 className={`text-lg font-black transition-colors ${review?.status === 'approved' ? 'text-emerald-900' : 'text-slate-900'}`}>{expert.name}</h4>
                               <div className="flex items-center gap-3 flex-wrap">
                                  <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-lg tracking-widest ${
                                    review?.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'
                                  }`}>
                                    {expert.trustTier}
                                  </span>
                                  <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg">{expert.rateRange}</span>
                               </div>
                            </div>
                         </div>

                         <p className={`text-sm leading-relaxed font-medium mb-6 flex-1 transition-colors ${
                           review?.status === 'approved' ? 'text-emerald-700/80' : 'text-slate-600'
                         }`}>
                            {expert.summaryExperience}
                         </p>

                         <div className="flex flex-wrap gap-2 mb-6">
                            {expert.domainTags.map(tag => (
                              <span key={tag} className={`px-3 py-1 text-[10px] font-black uppercase rounded-xl transition-all ${
                                review?.status === 'approved' ? 'bg-emerald-50 text-emerald-400' : 'bg-slate-50 text-slate-400'
                              }`}>#{tag}</span>
                            ))}
                         </div>

                         {/* Key info grid */}
                         <div className="grid grid-cols-2 gap-3 mb-6">
                           <div className="bg-slate-50 rounded-xl px-4 py-3">
                             <p className="text-[9px] font-black text-slate-400 uppercase">每周可用</p>
                             <p className="text-sm font-black text-slate-700">{expert.preferredWeeklyHours}h/wk</p>
                           </div>
                           <div className="bg-slate-50 rounded-xl px-4 py-3">
                             <p className="text-[9px] font-black text-slate-400 uppercase">开始时间</p>
                             <p className="text-sm font-black text-slate-700">{expert.availabilityToStart}</p>
                           </div>
                         </div>

                         <div className={`pt-6 border-t flex gap-3 transition-colors ${
                           review?.status === 'approved' ? 'border-emerald-100' : 'border-slate-50'
                         }`}>
                            {isPending ? (
                              <>
                                <button 
                                  onClick={() => setShowDeclineModal({needId: activeNeed.id, expertIds: [expert.id]})}
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
            <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-12 opacity-20 text-center">
              <ICONS.User className={DESIGN.emptyState.icon + ' mb-6 lg:mb-8'} />
              <p className={DESIGN.emptyState.text}>请选择项目评审短名单</p>
            </div>
          )}
        </div>
      </div>

      {/* Decline Modal - Enhanced with warning */}
      {showDeclineModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 lg:p-6 overflow-y-auto">
          <div className={`${DESIGN.card.level3} p-6 lg:p-10 max-w-lg w-full animate-in zoom-in duration-300 my-auto`}>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight">拒绝专家人选</h3>
                <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">
                  {showDeclineModal.expertIds.length > 1 
                    ? `批量拒绝 ${showDeclineModal.expertIds.length} 位专家` 
                    : 'Reason for Rejection'}
                </p>
              </div>
              <button onClick={() => setShowDeclineModal(null)} className={`p-2 hover:bg-slate-100 ${DESIGN.radius.sm} text-slate-300 hover:text-slate-600 transition-all duration-200`}>
                <ICONS.Close className="w-5 h-5" />
              </button>
            </div>

            {/* Warning banner */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl mb-6 flex items-start gap-3">
              <span className="text-amber-500 text-lg mt-0.5">⚠️</span>
              <div>
                <p className="text-sm font-black text-amber-800">拒绝后匹配时间可能延长</p>
                <p className="text-xs font-medium text-amber-600 mt-1">
                  系统将向更多专家推送需求，招募周期可能因此增加 2-5 个工作日。
                </p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">1. 选择核心原因 *</label>
                <div className="grid grid-cols-2 gap-2">
                  {['技能匹配度不足', '预算超出范围', '响应时间较慢', '经验不符', '语言障碍', '其他'].map(r => (
                    <button
                      key={r}
                      onClick={() => setDeclineCategory(r)}
                      className={`text-left px-4 py-3 ${DESIGN.radius.sm} border font-black text-[11px] transition-all duration-200 tracking-tight ${
                        declineCategory === r ? `bg-indigo-600 border-indigo-600 text-white ${DESIGN.shadow.primary}` : 'bg-slate-50 border-slate-100 text-slate-600 hover:border-indigo-200'
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
                  className={`w-full ${DESIGN.input.textarea} h-32`}
                />
                <p className="text-[10px] text-slate-400 font-medium">您的具体反馈将直接帮助 Maybole 管理员在下一轮匹配中更精准地锁定目标人才。</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 lg:gap-4 mt-8 lg:mt-10">
              <button onClick={() => setShowDeclineModal(null)} className={`flex-1 py-3 lg:py-4 text-xs ${DESIGN.button.base} ${DESIGN.button.ghost}`}>取消</button>
              <button 
                onClick={handleDeclineConfirm}
                disabled={!declineCategory || !declineDetails.trim()}
                className={`flex-[2] py-3 lg:py-4 ${DESIGN.radius.md} text-xs ${DESIGN.button.base} ${!declineCategory || !declineDetails.trim() ? 'bg-slate-100 text-slate-300 shadow-none cursor-not-allowed' : DESIGN.button.danger}`}
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
