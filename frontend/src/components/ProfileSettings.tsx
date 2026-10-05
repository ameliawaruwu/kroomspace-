import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Save, Camera, CheckCircle2, AlertCircle } from 'lucide-react';
import { User as UserType } from '../types';
import { cn, cleanIndonesianPhoneDigits, formatToE164Indonesian } from '../lib/utils';
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
    whatsapp: cleanIndonesianPhoneDigits(currentUser.whatsapp),
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
      whatsapp: cleanIndonesianPhoneDigits(currentUser.whatsapp),
      avatar: currentUser.avatar,
    }));
  }, [currentUser]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('File harus berupa gambar (JPG, PNG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setFormData(prev => ({ ...prev, avatar: compressedDataUrl }));
        } else {
          setFormData(prev => ({ ...prev, avatar: event.target?.result as string }));
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanedWhatsapp = formatToE164Indonesian(formData.whatsapp);

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
      <header className="px-4 md:px-6 py-4 md:py-5 border-b border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl sticky top-0 z-30 transition-all">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {t('profileSettings')}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium text-sm">{t('profileSettingsSub')}</p>
      </header>

      <div className="mx-4 md:mx-6 grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8 max-w-7xl pb-10">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm text-center">
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
                  <div className="flex items-center rounded-2xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus-within:ring-2 focus-within:ring-[#3FA9F5]/20 focus-within:border-[#3FA9F5] overflow-hidden transition-all">
                    <span className="flex items-center gap-1.5 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs border-r border-slate-200 dark:border-slate-700 select-none shrink-0">
                      <span className="text-base">🇮🇩</span>
                      <span>+62</span>
                    </span>
                    <input 
                      type="tel" 
                      inputMode="numeric"
                      id="input_profile_whatsapp"
                      value={formData.whatsapp}
                      onChange={(e) => setFormData({...formData, whatsapp: cleanIndonesianPhoneDigits(e.target.value)})}
                      placeholder="81234567890"
                      className="w-full px-4 py-3 bg-transparent text-sm outline-none font-medium placeholder:text-slate-400 text-slate-800 dark:text-slate-100" 
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">
                    Otomatis +62 (cukup ketik 8xxx, awalan 0 atau +62 otomatis disesuaikan)
                  </p>
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
