import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Save, Camera, CheckCircle2, AlertCircle } from 'lucide-react';
import { User as UserType } from '../types';
import { cn } from '../lib/utils';
import { useLanguage } from '../context/LanguageContext';

interface ProfileSettingsProps {
  currentUser: UserType;
  onUpdateProfile: (updatedUser: UserType) => Promise<{ success: boolean; error?: string }>;
  darkMode: boolean;
}

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({ 
  currentUser, 
  onUpdateProfile, 
  darkMode 
}) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: currentUser.name,
    email: currentUser.email,
    whatsapp: currentUser.whatsapp || '',
    avatar: currentUser.avatar,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Sync state if currentUser changes (e.g. initial fetch loads)
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      name: currentUser.name,
      email: currentUser.email,
      whatsapp: currentUser.whatsapp || '',
      avatar: currentUser.avatar,
    }));
  }, [currentUser]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanedWhatsapp = formData.whatsapp.trim();

    setIsSaving(true);
    try {
      const result = await onUpdateProfile({
        ...currentUser,
        name: formData.name,
        email: formData.email,
        whatsapp: cleanedWhatsapp,
        avatar: formData.avatar,
      });

      if (result && !result.success) {
        setErrorMsg(result.error || 'Gagal menyimpan perubahan.');
      } else {
        setSuccessMsg('Profil berhasil diperbarui!');
        setTimeout(() => setSuccessMsg(''), 5000);
      }
    } catch (err) {
      setErrorMsg('Terjadi kesalahan jaringan.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 relative">
      <header className="px-8 py-6 sticky top-0 z-20 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-transparent transition-all">
        <h1 className="text-3xl font-bold tracking-tight">{t('profileSettings')}</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">{t('profileSettingsSub')}</p>
      </header>

      <div className="mx-8 grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm text-center">
            <div className="relative inline-block group cursor-pointer">
              <input 
                type="file" 
                id="avatar-upload" 
                className="hidden" 
                accept="image/*"
                onChange={handleAvatarChange}
              />
              <label htmlFor="avatar-upload" className="cursor-pointer">
                <img 
                  src={formData.avatar} 
                  className="w-32 h-32 rounded-full border-4 border-white dark:border-slate-700 shadow-xl object-cover hover:brightness-90 transition-all" 
                  alt="Avatar" 
                />
                <div className="absolute bottom-0 right-0 p-2 bg-[#2D7FEA] text-white rounded-full shadow-lg hover:bg-[#1C6ED9] transition-all">
                  <Camera size={16} />
                </div>
              </label>
            </div>
            <h3 className="mt-4 text-xl font-bold">{formData.name}</h3>
            <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-1">{currentUser.role}</p>
          </div>
        </div>

        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-10 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-8">
            {errorMsg && (
              <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 text-sm font-medium animate-in fade-in slide-in-from-top-2">
                <AlertCircle size={20} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
            
            {successMsg && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 rounded-2xl flex items-center gap-3 text-emerald-600 dark:text-emerald-400 text-sm font-medium animate-in fade-in slide-in-from-top-2">
                <CheckCircle2 size={20} className="shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <section className="space-y-6">
              <h3 className="text-lg font-bold flex items-center gap-2 border-b border-slate-50 dark:border-slate-700 pb-4">
                <User size={20} className="text-[#2D7FEA]" />
                {t('personalInfo')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('fullName')}</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input 
                      type="text" 
                      id="input_profile_name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-[#3FA9F5]/20" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('email')}</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input 
                      type="email" 
                      id="input_profile_email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-[#3FA9F5]/20" 
                    />
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('whatsapp')}</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input 
                      type="text" 
                      id="input_profile_whatsapp"
                      value={formData.whatsapp}
                      onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
                      placeholder="+62..."
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-[#3FA9F5]/20" 
                    />
                  </div>
                </div>
              </div>
            </section>

            <button 
              type="submit"
              id="btn_save_profile"
              disabled={isSaving}
              className={cn(
                "w-full py-4 bg-[#2D7FEA] text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#1C6ED9] transition-all shadow-lg shadow-[#2D7FEA]/20",
                isSaving && "opacity-75 cursor-not-allowed"
              )}
            >
              <Save size={18} />
              {isSaving ? 'Menyimpan...' : t('saveChanges')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
