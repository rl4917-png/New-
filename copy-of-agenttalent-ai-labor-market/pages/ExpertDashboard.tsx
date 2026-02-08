
import React, { useState } from 'react';
import { MOCK_EXPERTS, MOCK_MATCHES } from '../services/mockData';
import { ExpertProfile, TrustTier, EnglishLevel, MatchStatus, DailyAvailability, MatchRecord, WorkExperience, Education } from '../types';
import { ICONS, DESIGN } from '../constants';

type ProfileSubTab = 'resume' | 'location' | 'availability' | 'preferences' | 'comms' | 'account';

const DAYS_MAP: Record<string, string> = { 'M': '周一', 'T': '周二', 'W': '周三', 'R': '周四', 'F': '周五', 'S': '周六', 'U': '周日' };
const ALL_DAYS = ['M', 'T', 'W', 'R', 'F', 'S', 'U'];

const ExpertDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'inbox' | 'schedule' | 'profile'>('profile');
  const [profileTab, setProfileTab] = useState<ProfileSubTab>('resume');
  const [isEditing, setIsEditing] = useState(false);
  
  // 数据状态
  const [matches, setMatches] = useState<MatchRecord[]>(MOCK_MATCHES);
  const [selectedMatch, setSelectedMatch] = useState<MatchRecord | null>(null);
  const [showScheduling, setShowScheduling] = useState(false);
  const [timeSlots, setTimeSlots] = useState(['', '', '']);
  const [showDeclineModal, setShowDeclineModal] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState('');
  
  // 退出项目状态
  const [showExitModal, setShowExitModal] = useState<string | null>(null);
  const [exitReason, setExitReason] = useState('');

  // 档案核心状态
  const initialProfile = MOCK_EXPERTS.find(e => e.id === 'exp-4') || MOCK_EXPERTS[0];
  const [profile, setProfile] = useState<ExpertProfile>({
    ...initialProfile,
    summaryExperience: initialProfile.summaryExperience || '10年以上财务分析经验，精通股权研究与估值建模。',
    skills: initialProfile.skills || ['财务会计', '股权研究', '估值', '财务建模', '投资银行'],
    languages: initialProfile.languages || ['中文', '英文'],
    hobbies: initialProfile.hobbies || ['国际象棋', '旅行', '举重'],
    location: initialProfile.location || {
      country: '中国', state: '上海', city: '上海', postalCode: '200030',
      dob: '1995-10-02', isAuthorized: true, locationSameAsPhysical: true
    },
    workExperiences: initialProfile.workExperiences || [],
    educations: initialProfile.educations || [],
    workingHours: initialProfile.workingHours?.length ? initialProfile.workingHours : [
      { day: 'M', isAvailable: true, slots: [{ start: '10:00', end: '18:00' }] },
      { day: 'T', isAvailable: true, slots: [{ start: '10:00', end: '18:00' }] },
      { day: 'W', isAvailable: true, slots: [{ start: '14:00', end: '18:00' }] },
      { day: 'R', isAvailable: true, slots: [{ start: '10:00', end: '18:00' }] },
      { day: 'F', isAvailable: false, slots: [] },
    ],
  });

  // 侧边栏导航项
  const navItems = [
    { id: 'resume', label: '履历详情', icon: ICONS.User },
    { id: 'location', label: '地理位置', icon: ICONS.Dashboard },
    { id: 'availability', label: '可用性 & 时间', icon: ICONS.Clock },
    { id: 'preferences', label: '合作偏好 & 薪资', icon: ICONS.Shield },
    { id: 'comms', label: '通知设置', icon: ICONS.Plus },
    { id: 'account', label: '账户管理', icon: ICONS.User },
  ];

  // 更新方法
  const updateProfile = (updates: Partial<ExpertProfile>) => setProfile(prev => ({ ...prev, ...updates }));
  const updateLocation = (updates: Partial<ExpertProfile['location']>) => setProfile(prev => ({ ...prev, location: { ...prev.location, ...updates } }));
  const updateComms = (key: keyof ExpertProfile['comms']) => isEditing && setProfile(prev => ({ ...prev, comms: { ...prev.comms, [key]: !prev.comms[key] } }));

  // 履历动态列表操作
  const addWorkExp = () => updateProfile({ workExperiences: [...profile.workExperiences, { id: Date.now().toString(), company: '', role: '', startDate: '', isCurrent: false, description: '' }] });
  const updateWorkExp = (id: string, updates: Partial<WorkExperience>) => updateProfile({ workExperiences: profile.workExperiences.map(w => w.id === id ? { ...w, ...updates } : w) });
  const removeWorkExp = (id: string) => updateProfile({ workExperiences: profile.workExperiences.filter(w => w.id !== id) });
  
  const addEdu = () => updateProfile({ educations: [...profile.educations, { id: Date.now().toString(), institution: '', degree: '', field: '', graduationYear: '', gpa: '', awards: '' }] });
  const updateEdu = (id: string, updates: Partial<Education>) => updateProfile({ educations: profile.educations.map(e => e.id === id ? { ...e, ...updates } : e) });
  const removeEdu = (id: string) => updateProfile({ educations: profile.educations.filter(e => e.id !== id) });

  // Working hours helpers
  const toggleDayAvailability = (day: string) => {
    if (!isEditing) return;
    const existing = profile.workingHours.find(w => w.day === day);
    if (existing) {
      updateProfile({
        workingHours: profile.workingHours.map(w => w.day === day ? { ...w, isAvailable: !w.isAvailable } : w)
      });
    } else {
      updateProfile({
        workingHours: [...profile.workingHours, { day, isAvailable: true, slots: [{ start: '09:00', end: '17:00' }] }]
      });
    }
  };

  const updateDaySlot = (day: string, field: 'start' | 'end', value: string) => {
    updateProfile({
      workingHours: profile.workingHours.map(w => 
        w.day === day ? { ...w, slots: [{ ...w.slots[0], [field]: value }] } : w
      )
    });
  };

  // 流程逻辑
  const handleAcceptPreview = () => setShowScheduling(true);
  
  const submitSchedule = () => {
    if (!selectedMatch || timeSlots.some(s => !s.trim())) { alert('请填写三个建议约谈时间。'); return; }
    setMatches(prev => prev.map(m => m.id === selectedMatch.id ? { ...m, status: MatchStatus.SCHEDULING, availableTimeSlots: timeSlots } : m));
    setShowScheduling(false);
    setSelectedMatch(null);
    alert('已提交排期，请等待管理员确认。');
  };

  const handleDeclineConfirm = () => {
    if (!showDeclineModal || !declineReason.trim()) { alert('必须提供拒绝原因。'); return; }
    setMatches(prev => prev.map(m => m.id === showDeclineModal ? { ...m, status: MatchStatus.REJECTED_PREVIEW, rejectReason: declineReason } : m));
    setShowDeclineModal(null);
    setDeclineReason('');
    setSelectedMatch(null);
    alert('已记录拒绝原因，系统将优化后续推送。');
  };

  const handleExitProject = () => {
    if (!showExitModal || !exitReason.trim()) { alert('必须提供退出项目的详细原因。'); return; }
    setMatches(prev => prev.map(m => m.id === showExitModal ? { ...m, status: MatchStatus.WITHDRAWN, withdrawalReason: exitReason } : m));
    setShowExitModal(null);
    setExitReason('');
    alert('已提交退出申请。管理员将与您联系处理移交事宜。');
  };

  const inboxCount = matches.filter(m => m.status === MatchStatus.RECEIVED_SUMMARY).length;

  return (
    <div className={`-mx-4 lg:-mx-10 -my-4 lg:-my-10 h-[calc(100vh-80px)] flex flex-col ${DESIGN.animation.fadeIn}`}>
      {/* 顶部主导航 */}
      <div className="flex gap-6 lg:gap-12 border-b border-slate-100 px-4 lg:px-10 py-6 flex-shrink-0 bg-white">
        {[
          { id: 'inbox', label: '机会收件箱', badge: inboxCount },
          { id: 'schedule', label: '我的进度与项目' },
          { id: 'profile', label: '档案设置' }
        ].map(t => (
          <button 
            key={t.id} 
            onClick={() => setActiveTab(t.id as any)}
            className={`pb-5 text-xs font-black uppercase tracking-[0.2em] relative transition-all flex items-center gap-2 ${
              activeTab === t.id ? 'text-indigo-600' : 'text-slate-300 hover:text-slate-500'
            }`}
          >
            {t.label}
            {(t as any).badge > 0 && (
              <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center">{(t as any).badge}</span>
            )}
            {activeTab === t.id && <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-full"></div>}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-hidden">
        {/* TAB 1: 机会收件箱 - GPT 风格左右分栏 */}
        {activeTab === 'inbox' && (
          <div className="h-full flex">
            {/* 左侧：机会列表 - 固定宽度，类似 GPT 主题列表 */}
            <aside className="w-80 flex-shrink-0 border-r border-slate-200 bg-slate-50/50 flex flex-col">
              {/* 列表头部 */}
              <div className="p-6 border-b border-slate-200 bg-white">
                <h3 className="text-sm font-black text-slate-900 flex items-center justify-between">
                  <span>新机会</span>
                  {inboxCount > 0 && (
                    <span className="bg-indigo-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full">{inboxCount}</span>
                  )}
                </h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Opportunities Inbox</p>
              </div>
              
              {/* 机会列表 */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {matches.filter(m => m.status === MatchStatus.RECEIVED_SUMMARY).length === 0 && (
                  <div className={`p-6 text-center ${DESIGN.emptyState.text} border-2 border-dashed border-slate-200 ${DESIGN.radius.lg} mx-2 mt-4`}>
                    暂无新机会
                  </div>
                )}
                {matches.filter(m => m.status === MatchStatus.RECEIVED_SUMMARY).map(m => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMatch(m)}
                    className={`w-full text-left p-4 rounded-2xl transition-all ${
                      selectedMatch?.id === m.id 
                        ? 'bg-indigo-600 text-white shadow-lg' 
                        : 'bg-white hover:bg-slate-50 border border-slate-100'
                    }`}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                        selectedMatch?.id === m.id ? 'bg-white' : 'bg-indigo-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold leading-tight line-clamp-2 ${
                          selectedMatch?.id === m.id ? 'text-white' : 'text-slate-900'
                        }`}>
                          {m.opportunitySummary}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold ml-5">
                      <span className={selectedMatch?.id === m.id ? 'text-emerald-200' : 'text-emerald-600'}>
                        {m.payRange}
                      </span>
                      <span className={selectedMatch?.id === m.id ? 'text-white/60' : 'text-slate-400'}>•</span>
                      <span className={selectedMatch?.id === m.id ? 'text-white/80' : 'text-slate-500'}>
                        {m.hoursPerWeek}h/周
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              {/* 底部提示 */}
              <div className="p-4 border-t border-slate-200 bg-white">
                <div className="flex items-start gap-2">
                  <span className="text-indigo-500 text-sm mt-0.5">💡</span>
                  <p className="text-[10px] font-medium text-slate-500 leading-relaxed">
                    为保证质量，平台会控制同时推送的需求数量
                  </p>
                </div>
              </div>
            </aside>

            {/* 右侧：预览详情 - 占据剩余空间 */}
            <main className="flex-1 flex flex-col bg-white overflow-hidden">
              {selectedMatch ? (
                <>
                  {/* 详情头部 */}
                  <header className="p-8 lg:p-10 border-b border-slate-100 flex justify-between items-start gap-6 flex-shrink-0">
                     <div>
                       <div className="flex items-center gap-3 mb-2">
                         <div className={`w-10 h-10 bg-indigo-600 ${DESIGN.radius.md} flex items-center justify-center text-white`}>
                            <ICONS.Shield className="w-5 h-5" />
                         </div>
                         <div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight">项目详情</h2>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Opportunity Preview</p>
                         </div>
                       </div>
                     </div>
                     <div className="flex gap-3 flex-shrink-0">
                        <button 
                          onClick={() => setShowDeclineModal(selectedMatch.id)} 
                          className={`px-6 py-3 border border-slate-200 ${DESIGN.radius.md} text-[10px] ${DESIGN.button.base} text-slate-500 hover:text-rose-500 hover:border-rose-200 transition-all`}
                        >
                          不感兴趣
                        </button>
                        <button 
                          onClick={handleAcceptPreview} 
                          className={`px-8 py-3 ${DESIGN.button.primary} ${DESIGN.radius.md} text-[10px] ${DESIGN.button.base}`}
                        >
                          感兴趣并提交意向
                        </button>
                     </div>
                  </header>

                  {/* 详情内容 */}
                  <div className="flex-1 overflow-y-auto p-8 lg:p-10 space-y-8">
                     {/* Privacy notice */}
                     <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
                       <span className="text-amber-500 text-lg flex-shrink-0">⚠️</span>
                       <p className="text-xs font-medium text-amber-700">
                         <span className="font-black">隐私提示：</span>点击"感兴趣"后，您的个人信息（姓名、履历摘要、相关背景）将共享给该客户进行评审。
                       </p>
                     </div>

                     {/* 项目摘要 */}
                     <div className={`p-8 bg-gradient-to-br from-slate-50 to-indigo-50/30 ${DESIGN.radius.xl} border border-slate-100`}>
                       <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">项目摘要</p>
                       <p className="text-base font-medium text-slate-700 leading-relaxed">{selectedMatch.opportunitySummary}</p>
                     </div>

                     {/* 关键信息卡片 */}
                     <div className="grid grid-cols-3 gap-4">
                        <div className={`p-6 bg-white border border-slate-100 ${DESIGN.radius.xl} text-center shadow-sm hover:shadow-md transition-all`}>
                           <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2">预估报酬</p>
                           <p className="text-2xl font-black text-emerald-600">{selectedMatch.payRange}</p>
                        </div>
                        <div className={`p-6 bg-white border border-slate-100 ${DESIGN.radius.xl} text-center shadow-sm hover:shadow-md transition-all`}>
                           <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2">工作强度</p>
                           <p className="text-2xl font-black text-indigo-600">{selectedMatch.hoursPerWeek}h</p>
                           <p className="text-[9px] font-bold text-slate-400 mt-1">每周</p>
                        </div>
                        <div className={`p-6 bg-white border border-slate-100 ${DESIGN.radius.xl} text-center shadow-sm hover:shadow-md transition-all`}>
                           <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2">项目周期</p>
                           <p className="text-2xl font-black text-slate-700">{selectedMatch.timelineEstimate || '待定'}</p>
                        </div>
                     </div>

                     {/* 附加信息 */}
                     <div className={`p-6 bg-slate-50 border border-slate-100 ${DESIGN.radius.xl}`}>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Next Steps</p>
                       <ul className="space-y-2 text-sm font-medium text-slate-600">
                         <li className="flex items-start gap-2">
                           <span className="text-indigo-500 mt-0.5">1.</span>
                           <span>点击"感兴趣"提交意向</span>
                         </li>
                         <li className="flex items-start gap-2">
                           <span className="text-indigo-500 mt-0.5">2.</span>
                           <span>平台管理员将协调双方约谈时间</span>
                         </li>
                         <li className="flex items-start gap-2">
                           <span className="text-indigo-500 mt-0.5">3.</span>
                           <span>约谈确认后正式开始合作</span>
                         </li>
                       </ul>
                     </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                    <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                    </svg>
                  </div>
                  <p className="text-lg font-black text-slate-400 uppercase tracking-widest mb-2">选择左侧机会</p>
                  <p className="text-sm font-medium text-slate-400">点击左侧列表中的任意机会查看详情</p>
                </div>
              )}
            </main>
          </div>
        )}

        {/* TAB 2: 我的进度与项目 */}
        {activeTab === 'schedule' && (
          <div className="p-4 lg:p-10 space-y-8 lg:space-y-12 overflow-y-auto">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-10">
                {matches.filter(m => ![MatchStatus.RECEIVED_SUMMARY, MatchStatus.REJECTED_PREVIEW, MatchStatus.WITHDRAWN].includes(m.status)).map(m => (
                  <div key={m.id} className={`${DESIGN.card.level2} p-8 lg:p-10 flex flex-col`}>
                     <div className="flex justify-between items-start mb-4 lg:mb-6">
                        <span className={`px-3 lg:px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                           m.status === MatchStatus.CLOSED ? 'bg-emerald-50 text-emerald-500' : 'bg-amber-50 text-amber-500'
                        }`}>{m.status}</span>
                     </div>
                     <h4 className="text-base lg:text-lg font-black text-slate-900 leading-snug flex-1">{m.opportunitySummary}</h4>
                     <div className="mt-8 lg:mt-10 pt-8 lg:pt-10 border-t border-slate-50 flex justify-between items-center">
                        {m.status === MatchStatus.CLOSED && (
                           <>
                              <div className="flex items-center gap-2 text-emerald-500">
                                 <ICONS.CheckCircle className="w-5 h-5" />
                                 <span className="text-[10px] font-black uppercase">合作进行中</span>
                              </div>
                              <button onClick={() => setShowExitModal(m.id)} className={`text-[10px] ${DESIGN.button.base} text-rose-400 hover:text-rose-600`}>退出项目</button>
                           </>
                        )}
                     </div>
                  </div>
                ))}
                {matches.filter(m => ![MatchStatus.RECEIVED_SUMMARY, MatchStatus.REJECTED_PREVIEW, MatchStatus.WITHDRAWN].includes(m.status)).length === 0 && (
                  <div className={`col-span-3 p-12 text-center ${DESIGN.emptyState.text} border-2 border-dashed border-slate-100 ${DESIGN.radius.lg}`}>
                    暂无进行中的项目
                  </div>
                )}
             </div>
          </div>
        )}

        {/* TAB 3: 档案设置 */}
        {activeTab === 'profile' && (
          <div className="h-full overflow-y-auto custom-scrollbar">
            <div className="p-4 lg:p-10 space-y-8 pb-24">
              {/* 头部：标题 + 编辑按钮 */}
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                  <h2 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">我的档案</h2>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">完善简历以提高雇主约谈概率</p>
                </div>
                <button onClick={() => setIsEditing(!isEditing)} className={`w-full lg:w-auto px-8 lg:px-10 py-3 lg:py-3.5 bg-slate-900 text-white ${DESIGN.radius.md} text-[10px] ${DESIGN.button.base} ${DESIGN.shadow.card} active:scale-95 transition-all`}>
                  {isEditing ? '保存并退出' : '进入编辑模式'}
                </button>
              </div>

              {/* 栏目导航 - 横向滚动标签 */}
              <nav className="flex gap-3 overflow-x-auto pb-2">
                {navItems.map(item => (
                   <button
                    key={item.id}
                    onClick={() => setProfileTab(item.id as any)}
                    className={`flex items-center gap-2 px-5 py-3 ${DESIGN.radius.md} text-[11px] ${DESIGN.button.base} transition-all whitespace-nowrap ${
                      profileTab === item.id ? `bg-indigo-600 text-white ${DESIGN.shadow.primary}` : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                   >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                   </button>
                ))}
              </nav>

              {/* 内容区域 */}
              <div className="max-w-6xl">
                  {profileTab === 'resume' && (
                    <div className="max-w-4xl space-y-12 lg:space-y-16">
                      {/* 个人摘要 */}
                      <section className="space-y-4 lg:space-y-6">
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest border-l-4 border-indigo-600 pl-4">职业摘要</h3>
                        <textarea 
                          className={`w-full p-6 lg:p-8 ${DESIGN.input.textarea} h-36 lg:h-40 ${isEditing ? 'border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none' : 'border-transparent cursor-default'}`} 
                          value={profile.summaryExperience} 
                          onChange={e => updateProfile({ summaryExperience: e.target.value })} 
                          readOnly={!isEditing} 
                        />
                      </section>

                      {/* 技能标签 */}
                      <section className="space-y-4">
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest border-l-4 border-indigo-600 pl-4">技能标签</h3>
                        <div className="flex flex-wrap gap-2">
                          {profile.skills.map((skill, i) => (
                            <span key={i} className="px-4 py-2 bg-indigo-50 text-indigo-600 text-[11px] font-black uppercase rounded-xl">{skill}</span>
                          ))}
                          {profile.domainTags.map((tag, i) => (
                            <span key={`dt-${i}`} className="px-4 py-2 bg-slate-50 text-slate-500 text-[11px] font-black uppercase rounded-xl">#{tag}</span>
                          ))}
                        </div>
                      </section>

                      {/* 工作经历 */}
                      <section className="space-y-6 lg:space-y-8">
                        <div className="flex justify-between items-center">
                           <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest border-l-4 border-indigo-600 pl-4">工作履历</h3>
                           {isEditing && <button onClick={addWorkExp} className={`text-[10px] ${DESIGN.button.base} text-indigo-600 bg-indigo-50 px-4 py-2 ${DESIGN.radius.sm} hover:bg-indigo-100 transition-all`}>+ 新增经历</button>}
                        </div>
                        <div className="space-y-4 lg:space-y-6">
                           {profile.workExperiences.map(exp => (
                             <div key={exp.id} className={`p-6 lg:p-8 bg-slate-50/50 border border-slate-100 ${DESIGN.radius.xl} relative group hover:bg-white hover:shadow-xl transition-all`}>
                                {isEditing && <button onClick={() => removeWorkExp(exp.id)} className="absolute top-4 lg:top-6 right-6 lg:right-8 text-slate-300 hover:text-rose-500">移除</button>}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-6">
                                   <div className="space-y-2">
                                      <label className="text-[9px] font-black text-slate-400 uppercase">公司</label>
                                      <input className={`w-full ${DESIGN.input.base} ${isEditing ? 'border-slate-100' : 'border-transparent'}`} value={exp.company} onChange={e => updateWorkExp(exp.id, { company: e.target.value })} readOnly={!isEditing} />
                                   </div>
                                   <div className="space-y-2">
                                      <label className="text-[9px] font-black text-slate-400 uppercase">职位</label>
                                      <input className={`w-full ${DESIGN.input.base} ${isEditing ? 'border-slate-100' : 'border-transparent'}`} value={exp.role} onChange={e => updateWorkExp(exp.id, { role: e.target.value })} readOnly={!isEditing} />
                                   </div>
                                </div>
                                <div className="space-y-2">
                                   <label className="text-[9px] font-black text-slate-400 uppercase">职责描述</label>
                                   <textarea className={`w-full ${DESIGN.input.textarea} h-24 ${isEditing ? 'border-slate-100' : 'border-transparent'}`} value={exp.description} onChange={e => updateWorkExp(exp.id, { description: e.target.value })} readOnly={!isEditing} />
                                </div>
                             </div>
                           ))}
                        </div>
                      </section>

                      {/* 教育背景 */}
                      <section className="space-y-6 lg:space-y-8">
                        <div className="flex justify-between items-center">
                           <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest border-l-4 border-indigo-600 pl-4">教育背景</h3>
                           {isEditing && <button onClick={addEdu} className={`text-[10px] ${DESIGN.button.base} text-indigo-600 bg-indigo-50 px-4 py-2 ${DESIGN.radius.sm} hover:bg-indigo-100 transition-all`}>+ 新增教育</button>}
                        </div>
                        <div className="space-y-4 lg:space-y-6">
                           {profile.educations.map(edu => (
                             <div key={edu.id} className={`p-6 lg:p-8 ${DESIGN.card.level1} relative group hover:shadow-2xl transition-all`}>
                                {isEditing && <button onClick={() => removeEdu(edu.id)} className="absolute top-4 lg:top-6 right-6 lg:right-8 text-slate-300 hover:text-rose-500">移除</button>}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-6">
                                   <div className="space-y-2">
                                      <label className="text-[9px] font-black text-slate-400 uppercase">毕业院校</label>
                                      <input className={`w-full ${DESIGN.input.base} ${isEditing ? 'border-slate-100' : 'border-transparent'}`} value={edu.institution} onChange={e => updateEdu(edu.id, { institution: e.target.value })} readOnly={!isEditing} />
                                   </div>
                                   <div className="space-y-2">
                                      <label className="text-[9px] font-black text-slate-400 uppercase">专业</label>
                                      <input className={`w-full ${DESIGN.input.base} ${isEditing ? 'border-slate-100' : 'border-transparent'}`} value={edu.field} onChange={e => updateEdu(edu.id, { field: e.target.value })} readOnly={!isEditing} />
                                   </div>
                                   <div className="space-y-2">
                                      <label className="text-[9px] font-black text-slate-400 uppercase">成绩 (GPA/排名)</label>
                                      <input className={`w-full ${DESIGN.input.base} ${isEditing ? 'border-slate-100' : 'border-transparent'}`} value={edu.gpa} onChange={e => updateEdu(edu.id, { gpa: e.target.value })} readOnly={!isEditing} />
                                   </div>
                                   <div className="space-y-2">
                                      <label className="text-[9px] font-black text-slate-400 uppercase">毕业年份</label>
                                      <input className={`w-full ${DESIGN.input.base} ${isEditing ? 'border-slate-100' : 'border-transparent'}`} value={edu.graduationYear} onChange={e => updateEdu(edu.id, { graduationYear: e.target.value })} readOnly={!isEditing} />
                                   </div>
                                </div>
                                <div className="space-y-2">
                                   <label className="text-[9px] font-black text-slate-400 uppercase">奖项与荣誉</label>
                                   <textarea className={`w-full ${DESIGN.input.textarea} h-20 ${isEditing ? 'border-slate-100' : 'border-transparent'}`} value={edu.awards} onChange={e => updateEdu(edu.id, { awards: e.target.value })} readOnly={!isEditing} />
                                </div>
                             </div>
                           ))}
                        </div>
                      </section>
                    </div>
                  )}

                  {profileTab === 'location' && (
                    <div className={`max-w-4xl space-y-12 ${DESIGN.animation.fadeIn}`}>
                       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">国家/地区</label>
                             <input className={`w-full ${DESIGN.input.base} ${isEditing ? 'border-slate-200' : 'border-transparent'}`} value={profile.location.country} onChange={e => updateLocation({ country: e.target.value })} readOnly={!isEditing} />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">城市</label>
                             <input className={`w-full ${DESIGN.input.base} ${isEditing ? 'border-slate-200' : 'border-transparent'}`} value={profile.location.city} onChange={e => updateLocation({ city: e.target.value })} readOnly={!isEditing} />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">时区</label>
                             <input className={`w-full ${DESIGN.input.base} ${isEditing ? 'border-slate-200' : 'border-transparent'}`} value={profile.timezone} onChange={e => updateProfile({ timezone: e.target.value })} readOnly={!isEditing} />
                          </div>
                       </div>
                    </div>
                  )}

                  {/* Availability & Working Hours */}
                  {profileTab === 'availability' && (
                    <div className={`max-w-4xl space-y-12 ${DESIGN.animation.fadeIn}`}>
                      <section className="space-y-6">
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest border-l-4 border-indigo-600 pl-4">每周可用时间</h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">每周可投入小时数</label>
                            <input 
                              type="number"
                              className={`w-full ${DESIGN.input.base} font-bold ${isEditing ? 'border-slate-200' : 'border-transparent'}`}
                              value={profile.preferredWeeklyHours}
                              onChange={e => updateProfile({ preferredWeeklyHours: parseInt(e.target.value) || 0 })}
                              readOnly={!isEditing}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">最早可开始时间</label>
                            <input 
                              className={`w-full ${DESIGN.input.base} font-bold ${isEditing ? 'border-slate-200' : 'border-transparent'}`}
                              value={profile.availabilityToStart}
                              onChange={e => updateProfile({ availabilityToStart: e.target.value })}
                              readOnly={!isEditing}
                            />
                          </div>
                        </div>
                      </section>

                      <section className="space-y-6">
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest border-l-4 border-indigo-600 pl-4">工作日程表</h3>
                        <p className="text-xs font-medium text-slate-400">设置每天的可用时段，便于平台精准匹配时区兼容的项目。</p>
                        <div className="space-y-3">
                          {ALL_DAYS.map(day => {
                            const dayData = profile.workingHours.find(w => w.day === day);
                            const isAvailable = dayData?.isAvailable || false;
                            const slot = dayData?.slots?.[0] || { start: '09:00', end: '17:00' };
                            return (
                              <div key={day} className={`flex items-center gap-4 p-4 border rounded-2xl transition-all ${isAvailable ? 'bg-white border-indigo-100' : 'bg-slate-50/50 border-slate-100'}`}>
                                <button
                                  onClick={() => toggleDayAvailability(day)}
                                  className={`w-14 h-8 rounded-full relative transition-all shrink-0 ${isAvailable ? 'bg-indigo-600' : 'bg-slate-200'} ${!isEditing ? 'cursor-default' : 'cursor-pointer'}`}
                                  disabled={!isEditing}
                                >
                                  <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-sm ${isAvailable ? 'right-1' : 'left-1'}`} />
                                </button>
                                <span className={`text-sm font-black w-12 ${isAvailable ? 'text-indigo-600' : 'text-slate-400'}`}>{DAYS_MAP[day]}</span>
                                {isAvailable && (
                                  <div className="flex items-center gap-2 ml-auto">
                                    <input 
                                      type="time"
                                      className={`${DESIGN.input.base} text-sm font-bold py-2 px-3 w-32 ${isEditing ? 'border-slate-200' : 'border-transparent'}`}
                                      value={slot.start}
                                      onChange={e => updateDaySlot(day, 'start', e.target.value)}
                                      readOnly={!isEditing}
                                    />
                                    <span className="text-slate-400 font-bold">→</span>
                                    <input 
                                      type="time"
                                      className={`${DESIGN.input.base} text-sm font-bold py-2 px-3 w-32 ${isEditing ? 'border-slate-200' : 'border-transparent'}`}
                                      value={slot.end}
                                      onChange={e => updateDaySlot(day, 'end', e.target.value)}
                                      readOnly={!isEditing}
                                    />
                                  </div>
                                )}
                                {!isAvailable && <span className="text-xs font-bold text-slate-300 ml-auto uppercase">休息</span>}
                              </div>
                            );
                          })}
                        </div>
                      </section>
                    </div>
                  )}

                  {/* Preferences */}
                  {profileTab === 'preferences' && (
                    <div className={`max-w-4xl space-y-12 ${DESIGN.animation.fadeIn}`}>
                      <section className="space-y-6">
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest border-l-4 border-indigo-600 pl-4">薪资期望</h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">期望时薪 (全职)</label>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-black text-slate-400">¥</span>
                              <input 
                                type="number"
                                className={`w-full ${DESIGN.input.base} font-bold ${isEditing ? 'border-slate-200' : 'border-transparent'}`}
                                value={profile.minCompensationFT}
                                onChange={e => updateProfile({ minCompensationFT: parseInt(e.target.value) || 0 })}
                                readOnly={!isEditing}
                                placeholder="0"
                              />
                              <span className="text-xs font-bold text-slate-400 whitespace-nowrap">/小时</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">期望时薪 (兼职)</label>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-black text-slate-400">¥</span>
                              <input 
                                type="number"
                                className={`w-full ${DESIGN.input.base} font-bold ${isEditing ? 'border-slate-200' : 'border-transparent'}`}
                                value={profile.minCompensationPT}
                                onChange={e => updateProfile({ minCompensationPT: parseInt(e.target.value) || 0 })}
                                readOnly={!isEditing}
                                placeholder="0"
                              />
                              <span className="text-xs font-bold text-slate-400 whitespace-nowrap">/小时</span>
                            </div>
                          </div>
                        </div>
                      </section>

                      <section className="space-y-6">
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest border-l-4 border-indigo-600 pl-4">合作形式偏好</h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {[
                            { id: 'fullTimeOpps', label: '接受全职机会', desc: '每周 35+ 小时的长期项目' },
                            { id: 'partTimeOpps', label: '接受兼职机会', desc: '每周 5-30 小时的灵活项目' },
                            { id: 'referralOpps', label: '接受推荐机会', desc: '允许平台推荐给其他客户' },
                          ].map(opt => (
                            <div key={opt.id} className={`flex justify-between items-center p-6 bg-slate-50/50 border border-slate-100 ${DESIGN.radius.lg}`}>
                              <div>
                                <p className="text-xs font-black text-slate-700 uppercase tracking-widest">{opt.label}</p>
                                <p className="text-[10px] text-slate-400 font-medium mt-1">{opt.desc}</p>
                              </div>
                              <button 
                                onClick={() => updateComms(opt.id as any)}
                                className={`w-14 h-7 rounded-full relative transition-all shrink-0 ${profile.comms[opt.id as keyof ExpertProfile['comms']] ? 'bg-indigo-600' : 'bg-slate-200'} ${!isEditing ? 'cursor-default' : 'cursor-pointer'}`}
                                disabled={!isEditing}
                              >
                                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${profile.comms[opt.id as keyof ExpertProfile['comms']] ? 'right-1' : 'left-1'}`} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </section>

                      <section className="space-y-6">
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest border-l-4 border-indigo-600 pl-4">领域偏好</h3>
                        <div className="flex flex-wrap gap-2">
                          {(profile.domainInterests || []).map((interest, i) => (
                            <span key={i} className="px-4 py-2 bg-indigo-50 text-indigo-600 text-[11px] font-black uppercase rounded-xl border border-indigo-100">{interest}</span>
                          ))}
                          {isEditing && (
                            <button className="px-4 py-2 bg-slate-50 text-slate-400 text-[11px] font-black uppercase rounded-xl border border-dashed border-slate-200 hover:border-indigo-300 hover:text-indigo-500 transition-all">
                              + 添加领域
                            </button>
                          )}
                        </div>
                      </section>
                    </div>
                  )}

                  {profileTab === 'comms' && (
                    <div className="max-w-4xl space-y-4 lg:space-y-6">
                       {[
                         { id: 'emailEnabled', label: '邮件通知', sub: '核心机会与状态更新' },
                         { id: 'smsEnabled', label: '短信通知', sub: '仅限紧急约谈提醒' },
                         { id: 'jobNotifications', label: '新机会推送', sub: '当有匹配度高的新需求时通知' },
                         { id: 'workUpdates', label: '工作进度更新', sub: '项目状态变更通知' },
                       ].map(opt => (
                         <div key={opt.id} className={`flex justify-between items-center p-6 lg:p-8 bg-slate-50/50 border border-slate-100 ${DESIGN.radius.lg}`}>
                            <div>
                               <p className="text-xs font-black text-slate-700 uppercase tracking-widest">{opt.label}</p>
                               <p className="text-[10px] text-slate-400 font-medium">{opt.sub}</p>
                            </div>
                            <button 
                              onClick={() => updateComms(opt.id as any)}
                              className={`w-14 h-7 rounded-full relative transition-all ${profile.comms[opt.id as keyof ExpertProfile['comms']] ? 'bg-indigo-600' : 'bg-slate-200'} ${!isEditing ? 'cursor-default' : 'cursor-pointer'}`}
                              disabled={!isEditing}
                            >
                               <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${profile.comms[opt.id as keyof ExpertProfile['comms']] ? 'right-1' : 'left-1'}`} />
                            </button>
                         </div>
                       ))}
                    </div>
                  )}

                  {profileTab === 'account' && (
                    <div className={`max-w-4xl space-y-8 ${DESIGN.animation.fadeIn}`}>
                      <div className={`p-8 bg-slate-50/50 border border-slate-100 ${DESIGN.radius.xl} space-y-4`}>
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">账户信息</h3>
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase">姓名</p>
                            <p className="text-sm font-bold text-slate-700 mt-1">{profile.name}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase">信任等级</p>
                            <p className="text-sm font-bold text-indigo-600 mt-1">{profile.trustTier}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase">英语水平</p>
                            <p className="text-sm font-bold text-slate-700 mt-1">{profile.englishLevel}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase">ID</p>
                            <p className="text-sm font-bold text-slate-700 mt-1">{profile.id}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showDeclineModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 lg:p-6">
           <div className={`${DESIGN.card.level3} p-8 lg:p-16 max-w-xl w-full relative`}>
              <h3 className="text-xl lg:text-2xl font-black text-slate-900">拒绝该机会</h3>
              <p className="text-sm font-bold text-slate-400 mt-2 mb-8 lg:mb-10">拒绝反馈将帮助管理员为您提供更精准的推荐</p>
              <textarea className={`w-full ${DESIGN.input.textarea} h-32 mb-6 lg:mb-8`} placeholder="请描述拒绝的原因..." value={declineReason} onChange={e => setDeclineReason(e.target.value)} />
              <div className="flex flex-col sm:flex-row gap-3 lg:gap-4">
                 <button onClick={() => setShowDeclineModal(null)} className={`flex-1 py-4 lg:py-5 ${DESIGN.button.base} ${DESIGN.button.ghost}`}>取消</button>
                 <button onClick={handleDeclineConfirm} disabled={!declineReason.trim()} className={`flex-[2] py-4 lg:py-5 ${DESIGN.radius.lg} ${DESIGN.button.base} ${!declineReason.trim() ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : DESIGN.button.danger}`}>确认拒绝并提交</button>
              </div>
           </div>
        </div>
      )}

      {showScheduling && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 lg:p-6">
           <div className={`${DESIGN.card.level3} p-8 lg:p-16 max-w-2xl w-full relative`}>
              <h3 className="text-xl lg:text-2xl font-black text-slate-900">提交约谈时间</h3>
              <p className="text-sm font-bold text-slate-400 mt-2 mb-8 lg:mb-10">请提供未来 3 个可选的时段</p>
              <div className="space-y-4 lg:space-y-6 mb-8 lg:mb-10">
                 {timeSlots.map((slot, i) => (
                   <input key={i} className={`w-full ${DESIGN.input.base} font-bold`} placeholder={`时段 ${i+1}`} value={slot} onChange={e => { const s = [...timeSlots]; s[i] = e.target.value; setTimeSlots(s); }} />
                 ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-3 lg:gap-4">
                 <button onClick={() => setShowScheduling(false)} className={`flex-1 py-4 lg:py-5 ${DESIGN.button.base} ${DESIGN.button.ghost}`}>返回</button>
                 <button onClick={submitSchedule} disabled={timeSlots.some(s => !s.trim())} className={`flex-[2] py-4 lg:py-5 ${DESIGN.radius.lg} ${DESIGN.button.base} ${timeSlots.some(s => !s.trim()) ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : DESIGN.button.primary}`}>提交预约</button>
              </div>
           </div>
        </div>
      )}

      {showExitModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 lg:p-6">
           <div className={`${DESIGN.card.level3} p-8 lg:p-16 max-w-2xl w-full relative`}>
              <h3 className="text-xl lg:text-2xl font-black text-slate-900">退出项目申请</h3>
              <p className="text-sm font-bold text-slate-400 mt-2 mb-8 lg:mb-10">管理员将审核您的退出原因并协助处理交接</p>
              <textarea value={exitReason} onChange={e => setExitReason(e.target.value)} className={`w-full ${DESIGN.input.textarea} h-36 lg:h-40 mb-8 lg:mb-10`} placeholder="请详细描述退出原因..." />
              <div className="flex flex-col sm:flex-row gap-3 lg:gap-4">
                 <button onClick={() => setShowExitModal(null)} className={`flex-1 py-4 lg:py-5 ${DESIGN.button.base} ${DESIGN.button.ghost}`}>取消</button>
                 <button onClick={handleExitProject} disabled={!exitReason.trim()} className={`flex-[2] py-4 lg:py-5 ${DESIGN.radius.lg} ${DESIGN.button.base} ${!exitReason.trim() ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : DESIGN.button.danger}`}>提交退出申请</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ExpertDashboard;
