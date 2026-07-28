import React, { useState, useEffect } from 'react';
import { Key, Save, ShieldAlert } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { cn } from '../lib/utils';

interface ApiKeySettingsProps {
  darkMode: boolean;
  onSuccess: (message: string) => void;
}

export const ApiKeySettings: React.FC<ApiKeySettingsProps> = ({ darkMode, onSuccess }) => {
  const { t } = useLanguage();
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [settingsStatus, setSettingsStatus] = useState<{
    hasCustomKey: boolean;
    hasEnvKey: boolean;
    maskedKey: string | null;
    activeSource: 'custom' | 'env' | 'none';
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);

  // Helper: baca currentUser dari localStorage dan inject sebagai auth header
  const getAuthHeaders = (): Record<string, string> => {
    try {
      const saved = localStorage.getItem('currentUser');
      const user = saved ? JSON.parse(saved) : null;
      if (user?.id && user?.role) {
        return { 'X-User-Id': user.id, 'X-User-Role': user.role };
      }
    } catch (_) {}
    return {};
  };

  const fetchSettings = async () => {
    setIsLoadingSettings(true);
    try {
      const res = await fetch('/api/admin/settings', {
        headers: { ...getAuthHeaders() }
      });
      if (res.ok) {
        const data = await res.json();
        setSettingsStatus(data);
      }
    } catch (err) {
      console.error("Gagal mengambil status pengaturan API", err);
    } finally {
      setIsLoadingSettings(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ geminiApiKey: apiKeyInput })
      });
      if (res.ok) {
        onSuccess(t('apiSaveSuccess'));
        setApiKeyInput('');
        fetchSettings();
      } else {
        alert(t('apiSaveFailed'));
      }
    } catch (err) {
      console.error(err);
      alert(t('apiSaveFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 relative">
      <header className="px-4 md:px-6 py-4 md:py-5 sticky top-0 z-20 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-transparent transition-all">
        <h1 className="text-xl font-bold tracking-tight flex items-center gap-3">
          <Key className="text-blue-500" size={24} />
          {t('aiSettings')}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">
          Configurasi API Key untuk AI KroomSpace.
        </p>
      </header>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xl p-4 md:p-8 max-w-2xl mx-4 md:mx-6">
        <div className="flex items-start gap-4 mb-6 p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl">
          <ShieldAlert className="text-amber-500 shrink-0 mt-0.5" size={20} />
          <p className="text-xs text-amber-700 dark:text-amber-300 font-medium leading-relaxed">
            API Key ini akan disimpan di database KroomSpace secara aman. Pastikan API Key yang Anda masukkan valid untuk mengakses layanan Google Gemini API.
          </p>
        </div>

        {isLoadingSettings ? (
          <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400 font-medium">
            Loading settings...
          </div>
        ) : (
          <>
            {settingsStatus && (
              <div className="mb-8 p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl">
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">{t('activeKey')}</h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Status</span>
                    <span className={cn(
                      "font-black uppercase tracking-widest text-[10px] px-2.5 py-1 rounded-lg border",
                      settingsStatus.activeSource === 'custom'
                        ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20"
                        : settingsStatus.activeSource === 'env'
                          ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-500/20"
                          : "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-500/20"
                    )}>
                      {settingsStatus.activeSource === 'custom' 
                        ? t('usingCustomKey') 
                        : settingsStatus.activeSource === 'env' 
                          ? t('usingEnvKey') 
                          : t('notConfigured')
                      }
                    </span>
                  </div>
                  
                  {settingsStatus.maskedKey && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Key</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                        {settingsStatus.maskedKey}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  {t('geminiApiKey')}
                </label>
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder={t('geminiApiKeyPlaceholder')}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all font-medium shadow-sm"
                />
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save size={20} />
                  {isSaving ? "Saving..." : t('save')}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
