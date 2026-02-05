
import React, { useState } from 'react';
import { MOCK_EXPERTS, MOCK_MATCHES } from '../services/mockData';
import { ExpertProfile, TrustTier, EnglishLevel, MatchStatus, DailyAvailability, MatchRecord, WorkExperience, Education } from '../types';
import { ICONS } from '../constants';
import { GoogleGenAI } from '@google/genai';

type ProfileSubTab = 'resume' | 'location' | 'availability' | 'preferences' | 'comms' | 'account';

const ExpertDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'inbox' | 'schedule' | 'profile'>('profile');
  const [profileTab, setProfileTab] = useState<ProfileSubTab>('resume');
  const [isEditing, setIsEditing] = useState(false); // 修复：定义 isEditing 状态
  
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
    educations: initialProfile.educations || []
  });

  // 侧边栏导航项
  const navItems = [
    { id: 'resume', label: '履历详情', icon: ICONS.User },
    { id: 'location', label: '地理位置', icon: ICONS.Dashboard },
    { id: 'availability', label: '服务时间', icon: ICONS.Clock },
    { id: 'preferences', label: '合作偏好', icon: ICONS.Shield },
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

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-24 animate-in fade-in duration-700">
      {/* 顶部主导航 */}
      <div className="flex gap-12 border-b border-slate-100 px-6">
        {[
          { id: 'inbox', label: '机会收件箱' },
          { id: 'schedule', label: '我的进度与项目' },
          { id: 'profile', label: '档案设置' }
        ].map(t => (
          <button 
            key={t.id} 
            onClick={() => setActiveTab(t.id as any)}
            className={`pb-5 text-xs font-black uppercase tracking-[0.2em] relative transition-all ${
              activeTab === t.id ? 'text-indigo-600' : 'text-slate-300 hover:text-slate-500'
            }`}
          >
            {t.label}
            {activeTab === t.id && <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-full"></div>}
          </button>
        ))}
      </div>

      <div className="min-h-[800px]">
        {/* TAB 1: 机会收件箱 */}
        {activeTab === 'inbox' && (
          <div className="flex flex-col lg:flex-row gap-10">
            <aside className="w-full lg:w-[400px] space-y-6">
              <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] px-4">新机会摘要</h3>
              <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
                {matches.filter(m => m.status === MatchStatus.RECEIVED_SUMMARY).map(m => (
                  <div 
                    key={m.id}
                    onClick={() => setSelectedMatch(m)}
                    className={`p-8 bg-white border rounded-[40px] cursor-pointer transition-all ${
                      selectedMatch?.id === m.id ? 'border-indigo-600 shadow-2xl ring-1 ring-indigo-600' : 'border-slate-100 hover:border-indigo-200'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                       <span className="bg-indigo-50 text-indigo-600 text-[8px] font-black px-2 py-0.5 rounded-full uppercase">NEW</span>
                       <span className="text-[9px] font-bold text-slate-300">#{m.id.split('-')[1]}</span>
                    </div>
                    <p className="text-sm font-black text-slate-900 leading-snug line-clamp-3">{m.opportunitySummary}</p>
                    <div className="mt-8 flex items-center justify-between border-t border-slate-50 pt-4">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{m.payRange}</span>
                       <ICONS.ArrowRight className={`w-4 h-4 transition-transform ${selectedMatch?.id === m.id ? 'translate-x-1 text-indigo-600' : 'text-slate-200'}`} />
                    </div>
                  </div>
                ))}
              </div>
            </aside>
            <main className="flex-1 bg-white border border-slate-100 rounded-[56px] shadow-sm flex flex-col min-h-[700px] animate-in slide-in-from-right-4 duration-500">
              {selectedMatch ? (
                <>
                  <header className="p-12 border-b border-slate-50 flex justify-between items-center bg-slate-50/20">
                     <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-indigo-600 rounded-[24px] flex items-center justify-center text-white shadow-xl">
                           <ICONS.Shield className="w-8 h-8" />
                        </div>
                        <div>
                           <h2 className="text-2xl font-black text-slate-900 tracking-tight">项目摘要预览</h2>
                           <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-1">基于摘要评估您的兴趣</p>
                        </div>
                     </div>
                     <div className="flex gap-4">
                        <button onClick={() => setShowDeclineModal(selectedMatch.id)} className="px-8 py-3.5 border border-slate-200 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-rose-500 transition-all">不感兴趣</button>
                        <button onClick={handleAcceptPreview} className="px-10 py-3.5 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-indigo-700 active:scale-95 transition-all">接受并排期</button>
                     </div>
                  </header>
                  <div className="flex-1 p-12 space-y-12">
                     <p className="text-lg font-medium text-slate-700 leading-relaxed italic border-l-4 border-indigo-100 pl-8">"{selectedMatch.opportunitySummary}"</p>
                     <div className="grid grid-cols-3 gap-8">
                        <div className="p-8 bg-slate-50 rounded-[40px] border border-slate-100 text-center">
                           <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">预估报酬</p>
                           <p className="text-xl font-black mt-3 text-emerald-600">{selectedMatch.payRange}</p>
                        </div>
                        <div className="p-8 bg-slate-50 rounded-[40px] border border-slate-100 text-center">
                           <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">工作时长</p>
                           <p className="text-xl font-black mt-3 text-indigo-600">{selectedMatch.hoursPerWeek}h/周</p>
                        </div>
                        <div className="p-8 bg-slate-50 rounded-[40px] border border-slate-100 text-center">
                           <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">周期</p>
                           <p className="text-xl font-black mt-3 text-slate-700">{selectedMatch.timelineEstimate || '待定'}</p>
                        </div>
                     </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-20 text-center opacity-30">
                  <ICONS.ArrowRight className="w-16 h-16 mb-8 text-slate-200" />
                  <p className="text-2xl font-black uppercase tracking-[0.3em]">选择左侧机会进行预览</p>
                </div>
              )}
            </main>
          </div>
        )}

        {/* TAB 2: 我的进度与项目 */}
        {activeTab === 'schedule' && (
          <div className="space-y-12 animate-in fade-in duration-500">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {matches.filter(m => ![MatchStatus.RECEIVED_SUMMARY, MatchStatus.REJECTED_PREVIEW, MatchStatus.WITHDRAWN].includes(m.status)).map(m => (
                  <div key={m.id} className="bg-white border border-slate-100 p-10 rounded-[56px] shadow-sm flex flex-col">
                     <div className="flex justify-between items-start mb-6">
                        <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                           m.status === MatchStatus.CLOSED ? 'bg-emerald-50 text-emerald-500' : 'bg-amber-50 text-amber-500'
                        }`}>{m.status}</span>
                     </div>
                     <h4 className="text-lg font-black text-slate-900 leading-snug flex-1">{m.opportunitySummary}</h4>
                     <div className="mt-10 pt-10 border-t border-slate-50 flex justify-between items-center">
                        {m.status === MatchStatus.CLOSED && (
                           <>
                              <div className="flex items-center gap-2 text-emerald-500">
                                 <ICONS.CheckCircle className="w-5 h-5" />
                                 <span className="text-[10px] font-black uppercase">合作进行中</span>
                              </div>
                              <button onClick={() => setShowExitModal(m.id)} className="text-[10px] font-black text-rose-400 uppercase hover:text-rose-600">退出项目</button>
                           </>
                        )}
                     </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {/* TAB 3: 档案设置 - 求职板风格履历 */}
        {activeTab === 'profile' && (
          <div className="flex flex-col lg:flex-row gap-10">
            <aside className="w-full lg:w-72">
              <nav className="bg-white border border-slate-100 rounded-[32px] p-6 space-y-1 shadow-sm">
                {navItems.map(item => (
                   <button
                    key={item.id}
                    onClick={() => setProfileTab(item.id as any)}
                    className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${
                      profileTab === item.id ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'
                    }`}
                   >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                   </button>
                ))}
              </nav>
            </aside>

            <div className="flex-1 bg-white border border-slate-100 rounded-[56px] shadow-sm flex flex-col overflow-hidden">
               <header className="px-12 py-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/20 shrink-0">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">{navItems.find(n => n.id === profileTab)?.label}</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">完善简历以提高雇主约谈概率</p>
                  </div>
                  <button onClick={() => setIsEditing(!isEditing)} className="px-10 py-3.5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">
                    {isEditing ? '退出编辑' : '进入编辑模式'}
                  </button>
               </header>

               <div className="flex-1 p-12 overflow-y-auto space-y-16">
                  {profileTab === 'resume' && (
                    <div className="max-w-4xl space-y-16">
                      {/* 个人摘要 */}
                      <section className="space-y-6">
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest border-l-4 border-indigo-600 pl-4">职业摘要</h3>
                        <textarea 
                          className={`w-full p-8 bg-slate-50 border rounded-3xl h-40 font-medium ${isEditing ? 'border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none' : 'border-transparent cursor-default'}`} 
                          value={profile.summaryExperience} 
                          onChange={e => updateProfile({ summaryExperience: e.target.value })} 
                          readOnly={!isEditing} 
                        />
                      </section>

                      {/* 求职板风格：工作经历 */}
                      <section className="space-y-8">
                        <div className="flex justify-between items-center">
                           <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest border-l-4 border-indigo-600 pl-4">工作履历</h3>
                           {isEditing && <button onClick={addWorkExp} className="text-[10px] font-black text-indigo-600 uppercase bg-indigo-50 px-4 py-2 rounded-xl hover:bg-indigo-100 transition-all">+ 新增经历</button>}
                        </div>
                        <div className="space-y-6">
                           {profile.workExperiences.map(exp => (
                             <div key={exp.id} className="p-8 bg-slate-50/50 border border-slate-100 rounded-[40px] relative group hover:bg-white hover:shadow-xl transition-all">
                                {isEditing && <button onClick={() => removeWorkExp(exp.id)} className="absolute top-6 right-8 text-slate-300 hover:text-rose-500">移除</button>}
                                <div className="grid grid-cols-2 gap-8 mb-6">
                                   <div className="space-y-2">
                                      <label className="text-[9px] font-black text-slate-400 uppercase">公司</label>
                                      <input className={`w-full bg-white border px-4 py-3 rounded-2xl text-sm font-bold ${isEditing ? 'border-slate-100' : 'border-transparent'}`} value={exp.company} onChange={e => updateWorkExp(exp.id, { company: e.target.value })} readOnly={!isEditing} />
                                   </div>
                                   <div className="space-y-2">
                                      <label className="text-[9px] font-black text-slate-400 uppercase">职位</label>
                                      <input className={`w-full bg-white border px-4 py-3 rounded-2xl text-sm font-bold ${isEditing ? 'border-slate-100' : 'border-transparent'}`} value={exp.role} onChange={e => updateWorkExp(exp.id, { role: e.target.value })} readOnly={!isEditing} />
                                   </div>
                                </div>
                                <div className="space-y-2">
                                   <label className="text-[9px] font-black text-slate-400 uppercase">职责描述</label>
                                   <textarea className={`w-full bg-white border px-4 py-3 rounded-2xl text-sm h-24 ${isEditing ? 'border-slate-100' : 'border-transparent'}`} value={exp.description} onChange={e => updateWorkExp(exp.id, { description: e.target.value })} readOnly={!isEditing} />
                                </div>
                             </div>
                           ))}
                        </div>
                      </section>

                      {/* 求职板风格：教育背景 (含专业、成绩、奖项) */}
                      <section className="space-y-8">
                        <div className="flex justify-between items-center">
                           <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest border-l-4 border-indigo-600 pl-4">教育背景</h3>
                           {isEditing && <button onClick={addEdu} className="text-[10px] font-black text-indigo-600 uppercase bg-indigo-50 px-4 py-2 rounded-xl hover:bg-indigo-100 transition-all">+ 新增教育</button>}
                        </div>
                        <div className="space-y-6">
                           {profile.educations.map(edu => (
                             <div key={edu.id} className="p-8 bg-white border border-slate-100 rounded-[40px] shadow-sm relative group hover:shadow-2xl transition-all">
                                {isEditing && <button onClick={() => removeEdu(edu.id)} className="absolute top-6 right-8 text-slate-300 hover:text-rose-500">移除</button>}
                                <div className="grid grid-cols-2 gap-8 mb-6">
                                   <div className="space-y-2">
                                      <label className="text-[9px] font-black text-slate-400 uppercase">毕业院校</label>
                                      <input className={`w-full bg-slate-50 border px-4 py-3 rounded-2xl text-sm font-bold ${isEditing ? 'border-slate-100' : 'border-transparent'}`} value={edu.institution} onChange={e => updateEdu(edu.id, { institution: e.target.value })} readOnly={!isEditing} />
                                   </div>
                                   <div className="space-y-2">
                                      <label className="text-[9px] font-black text-slate-400 uppercase">专业</label>
                                      <input className={`w-full bg-slate-50 border px-4 py-3 rounded-2xl text-sm font-bold ${isEditing ? 'border-slate-100' : 'border-transparent'}`} value={edu.field} onChange={e => updateEdu(edu.id, { field: e.target.value })} readOnly={!isEditing} />
                                   </div>
                                   <div className="space-y-2">
                                      <label className="text-[9px] font-black text-slate-400 uppercase">成绩 (GPA/排名)</label>
                                      <input className={`w-full bg-slate-50 border px-4 py-3 rounded-2xl text-sm font-bold ${isEditing ? 'border-slate-100' : 'border-transparent'}`} value={edu.gpa} onChange={e => updateEdu(edu.id, { gpa: e.target.value })} readOnly={!isEditing} />
                                   </div>
                                   <div className="space-y-2">
                                      <label className="text-[9px] font-black text-slate-400 uppercase">毕业年份</label>
                                      <input className={`w-full bg-slate-50 border px-4 py-3 rounded-2xl text-sm font-bold ${isEditing ? 'border-slate-100' : 'border-transparent'}`} value={edu.graduationYear} onChange={e => updateEdu(edu.id, { graduationYear: e.target.value })} readOnly={!isEditing} />
                                   </div>
                                </div>
                                <div className="space-y-2">
                                   <label className="text-[9px] font-black text-slate-400 uppercase">奖项与荣誉</label>
                                   <textarea className={`w-full bg-slate-50 border px-4 py-3 rounded-2xl text-sm h-20 ${isEditing ? 'border-slate-100' : 'border-transparent'}`} value={edu.awards} onChange={e => updateEdu(edu.id, { awards: e.target.value })} readOnly={!isEditing} />
                                </div>
                             </div>
                           ))}
                        </div>
                      </section>
                    </div>
                  )}

                  {/* 其他子标签的逻辑占位，保持 UI 一致 */}
                  {profileTab === 'location' && (
                    <div className="max-w-4xl space-y-12 animate-in fade-in">
                       <div className="grid grid-cols-2 gap-8">
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">国家/地区</label>
                             <input className={`w-full px-6 py-4 bg-slate-50 border rounded-2xl font-bold text-sm ${isEditing ? 'border-slate-200' : 'border-transparent'}`} value={profile.location.country} onChange={e => updateLocation({ country: e.target.value })} readOnly={!isEditing} />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">城市</label>
                             <input className={`w-full px-6 py-4 bg-slate-50 border rounded-2xl font-bold text-sm ${isEditing ? 'border-slate-200' : 'border-transparent'}`} value={profile.location.city} onChange={e => updateLocation({ city: e.target.value })} readOnly={!isEditing} />
                          </div>
                       </div>
                    </div>
                  )}

                  {profileTab === 'comms' && (
                    <div className="max-w-4xl space-y-6">
                       {[
                         { id: 'emailEnabled', label: '邮件通知', sub: '核心机会与状态更新' },
                         { id: 'smsEnabled', label: '短信通知', sub: '仅限紧急约谈提醒' }
                       ].map(opt => (
                         <div key={opt.id} className="flex justify-between items-center p-8 bg-slate-50/50 border border-slate-100 rounded-[32px]">
                            <div>
                               <p className="text-xs font-black text-slate-700 uppercase tracking-widest">{opt.label}</p>
                               <p className="text-[10px] text-slate-400 font-medium">{opt.sub}</p>
                            </div>
                            <button 
                              onClick={() => updateComms(opt.id as any)}
                              className={`w-14 h-7 rounded-full relative transition-all ${profile.comms[opt.id as keyof ExpertProfile['comms']] ? 'bg-indigo-600' : 'bg-slate-200'}`}
                            >
                               <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${profile.comms[opt.id as keyof ExpertProfile['comms']] ? 'right-1' : 'left-1'}`} />
                            </button>
                         </div>
                       ))}
                    </div>
                  )}
               </div>
            </div>
          </div>
        )}
      </div>

      {/* 流程弹窗组件保持之前逻辑... */}
      {showDeclineModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-6">
           <div className="bg-white rounded-[56px] p-16 max-w-xl w-full shadow-2xl relative">
              <h3 className="text-2xl font-black text-slate-900">拒绝该机会</h3>
              <p className="text-sm font-bold text-slate-400 mt-2 mb-10">拒绝反馈将帮助管理员为您提供更精准的推荐</p>
              <textarea className="w-full p-6 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium h-32 mb-8 outline-none" placeholder="请描述拒绝的原因..." value={declineReason} onChange={e => setDeclineReason(e.target.value)} />
              <div className="flex gap-4">
                 <button onClick={() => setShowDeclineModal(null)} className="flex-1 py-5 font-black text-slate-400 uppercase text-xs">取消</button>
                 <button onClick={handleDeclineConfirm} className="flex-[2] py-5 bg-rose-500 text-white rounded-3xl font-black text-xs uppercase shadow-xl">确认拒绝并提交</button>
              </div>
           </div>
        </div>
      )}

      {showScheduling && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-6">
           <div className="bg-white rounded-[56px] p-16 max-w-2xl w-full shadow-2xl relative">
              <h3 className="text-2xl font-black text-slate-900">提交约谈时间</h3>
              <p className="text-sm font-bold text-slate-400 mt-2 mb-10">请提供未来 3 个可选的时段</p>
              <div className="space-y-6 mb-10">
                 {timeSlots.map((slot, i) => (
                   <input key={i} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm" placeholder={`时段 ${i+1}`} value={slot} onChange={e => { const s = [...timeSlots]; s[i] = e.target.value; setTimeSlots(s); }} />
                 ))}
              </div>
              <div className="flex gap-4">
                 <button onClick={() => setShowScheduling(false)} className="flex-1 py-5 font-black text-slate-400 uppercase text-xs">返回</button>
                 <button onClick={submitSchedule} className="flex-[2] py-5 bg-indigo-600 text-white rounded-3xl font-black text-xs uppercase shadow-xl">提交预约</button>
              </div>
           </div>
        </div>
      )}

      {showExitModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-6">
           <div className="bg-white rounded-[56px] p-16 max-w-2xl w-full shadow-2xl relative">
              <h3 className="text-2xl font-black text-slate-900">退出项目申请</h3>
              <p className="text-sm font-bold text-slate-400 mt-2 mb-10">管理员将审核您的退出原因并协助处理交接</p>
              <textarea value={exitReason} onChange={e => setExitReason(e.target.value)} className="w-full p-8 bg-slate-50 border border-slate-100 rounded-[40px] h-40 mb-10 outline-none" placeholder="请详细描述退出原因..." />
              <div className="flex gap-4">
                 <button onClick={() => setShowExitModal(null)} className="flex-1 py-5 font-black text-slate-400 uppercase text-xs">取消</button>
                 <button onClick={handleExitProject} className="flex-[2] py-5 bg-rose-600 text-white rounded-3xl font-black text-xs uppercase shadow-xl">提交退出申请</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ExpertDashboard;
