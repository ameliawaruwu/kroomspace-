import React, { useState, useEffect } from 'react';
import { Key, Save, ShieldAlert, RefreshCw, Loader2, Cpu } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { cn } from '../lib/utils';

interface ApiKeySettingsProps {
  darkMode: boolean;
  onSuccess: (message: string) => void;
}

export const ApiKeySettings: React.FC<ApiKeySettingsProps> = ({ darkMode, onSuccess }) => {
  const { t } = useLanguage();
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [providerInput, setProviderInput] = useState('Gemini');
  const [endpointUrlInput, setEndpointUrlInput] = useState('');
  const [modelNameInput, setModelNameInput] = useState('');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [isCustomModel, setIsCustomModel] = useState(false);

  const [settingsStatus, setSettingsStatus] = useState<{
    hasCustomKey: boolean;
    hasEnvKey: boolean;
    maskedKey: string | null;
    activeSource: 'custom' | 'env' | 'none';
    provider: string;
    endpointUrl: string;
    modelName: string;
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

  const fetchAvailableModels = async (prov?: string, endpoint?: string, key?: string, targetModel?: string) => {
    setIsLoadingModels(true);
    try {
      const res = await fetch('/api/admin/models', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          provider: prov !== undefined ? prov : providerInput,
          endpointUrl: endpoint !== undefined ? endpoint : endpointUrlInput,
          apiKey: key !== undefined ? key : apiKeyInput
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.models)) {
          setAvailableModels(data.models);
          const currentM = targetModel !== undefined ? targetModel : modelNameInput;
          if (currentM) {
            if (data.models.includes(currentM)) {
              setModelNameInput(currentM);
              setIsCustomModel(false);
            } else {
              // Jika model tersimpan belum ada di list terdeteksi, tambahkan ke list
              setAvailableModels(prev => [currentM, ...prev.filter(m => m !== currentM)]);
              setModelNameInput(currentM);
            }
          } else if (data.models.length > 0) {
            setModelNameInput(data.models[0]);
          }
        }
      }
    } catch (err) {
      console.error("Gagal mendeteksi model:", err);
    } finally {
      setIsLoadingModels(false);
    }
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
        if (data.provider) setProviderInput(data.provider);
        if (data.endpointUrl) setEndpointUrlInput(data.endpointUrl);
        if (data.modelName) setModelNameInput(data.modelName);
        fetchAvailableModels(data.provider, data.endpointUrl, '', data.modelName);
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
        body: JSON.stringify({
          geminiApiKey: apiKeyInput,
          provider: providerInput,
          endpointUrl: endpointUrlInput,
          modelName: modelNameInput || null
        })
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
      <header className="px-4 md:px-6 py-4 md:py-5 border-b border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl sticky top-0 z-30 transition-all">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#3FA9F5] to-[#2D7FEA] flex items-center justify-center shadow-lg shadow-[#2D7FEA]/20">
            <Key size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {t('aiSettings')}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-0.5 font-medium text-sm">
              Konfigurasi penyedia layanan AI dan API Key untuk KroomSpace.
            </p>
          </div>
        </div>
      </header>

      <div className="mx-4 md:mx-6 grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8 max-w-7xl pb-10">
        {/* Kolom Kiri: Status Kunci & Info */}
        <div className="xl:col-span-1 space-y-6">
          {settingsStatus && (
            <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                {t('activeKey')}
              </h3>
              
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

                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 dark:text-slate-400">{t('aiProvider')}</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {settingsStatus.provider || "Gemini"}
                  </span>
                </div>

                {settingsStatus.modelName && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Model AI</span>
                    <span className="font-mono text-xs text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-500/10 px-3 py-1 rounded-xl border border-blue-100 dark:border-blue-500/20 max-w-[200px] truncate" title={settingsStatus.modelName}>
                      {settingsStatus.modelName}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 dark:text-slate-400">{t('endpointUrl')}</span>
                  <span className="font-mono text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 px-3 py-1 rounded-xl border border-slate-100 dark:border-slate-800 max-w-[200px] truncate" title={settingsStatus.endpointUrl || "Default Provider Endpoint"}>
                    {settingsStatus.endpointUrl || (
                      settingsStatus.provider === 'OpenAI' ? 'https://api.openai.com/v1' :
                      settingsStatus.provider === 'Claude' ? 'https://api.anthropic.com/v1' :
                      settingsStatus.provider === 'OpenRouter' ? 'https://openrouter.ai/api/v1' :
                      'https://generativelanguage.googleapis.com'
                    )}
                  </span>
                </div>

                {settingsStatus.maskedKey && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Key</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                      {settingsStatus.maskedKey}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex items-start gap-3.5 p-4 md:p-5 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl">
            <ShieldAlert className="text-amber-500 shrink-0 mt-0.5" size={20} />
            <p className="text-xs text-amber-700 dark:text-amber-300 font-medium leading-relaxed">
              API Key ini akan disimpan di database KroomSpace secara aman. Pastikan API Key yang Anda masukkan valid untuk mengakses layanan AI.
            </p>
          </div>
        </div>

        {/* Kolom Kanan: Form Konfigurasi */}
        <div className="xl:col-span-2">
          <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
            {isLoadingSettings ? (
              <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400 font-medium">
                Loading settings...
              </div>
            ) : (
              <form onSubmit={handleSaveSettings} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    {t('aiProvider')}
                  </label>
                  <select
                    value={providerInput}
                    onChange={(e) => {
                      const newProv = e.target.value;
                      setProviderInput(newProv);
                      fetchAvailableModels(newProv, endpointUrlInput, apiKeyInput);
                    }}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all font-medium shadow-sm cursor-pointer"
                  >
                    <option value="Gemini">Google Gemini</option>
                    <option value="OpenAI">OpenAI</option>
                    <option value="Claude">Anthropic Claude</option>
                    <option value="OpenRouter">OpenRouter</option>
                    <option value="Custom">Custom (OpenAI-compatible / Local LLM)</option>
                    <option value="CommandCode">CommandCode</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      {t('endpointUrl')} (API Endpoint)
                    </label>
                    <span className="text-[11px] text-slate-400 font-semibold">
                      Base URL / Proxy
                    </span>
                  </div>
                  <input
                    type="text"
                    value={endpointUrlInput}
                    onChange={(e) => setEndpointUrlInput(e.target.value)}
                    onBlur={() => {
                      fetchAvailableModels(providerInput, endpointUrlInput, apiKeyInput);
                    }}
                    placeholder={
                      providerInput === 'OpenAI' ? 'https://api.openai.com/v1' :
                      providerInput === 'Gemini' ? 'https://generativelanguage.googleapis.com' :
                      providerInput === 'Claude' ? 'https://api.anthropic.com/v1' :
                      providerInput === 'OpenRouter' ? 'https://openrouter.ai/api/v1' :
                      'https://api.your-endpoint.com/v1'
                    }
                    className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all font-medium shadow-sm font-mono text-xs"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    {t('geminiApiKey')}
                  </label>
                  <input
                    type="password"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    onBlur={() => {
                      if (apiKeyInput.trim()) {
                        fetchAvailableModels(providerInput, endpointUrlInput, apiKeyInput);
                      }
                    }}
                    placeholder={settingsStatus?.maskedKey ? `Tersimpan: ${settingsStatus.maskedKey} (Kosongkan jika tidak diubah)` : t('geminiApiKeyPlaceholder')}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all font-medium shadow-sm"
                  />
                </div>

                {/* Model AI Auto-Detection & Dropdown */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <Cpu size={16} className="text-blue-500" />
                      <span>Model AI</span>
                      {isLoadingModels && (
                        <span className="text-[11px] text-blue-500 flex items-center gap-1 font-medium animate-pulse">
                          <Loader2 size={12} className="animate-spin" /> Mendeteksi...
                        </span>
                      )}
                      {!isLoadingModels && availableModels.length > 0 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-500/20">
                          {availableModels.length} Model Terdeteksi
                        </span>
                      )}
                    </label>

                    <button
                      type="button"
                      onClick={() => fetchAvailableModels(providerInput, endpointUrlInput, apiKeyInput)}
                      disabled={isLoadingModels}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center gap-1 font-semibold hover:underline cursor-pointer disabled:opacity-50"
                      title="Deteksi ulang model dari endpoint"
                    >
                      <RefreshCw size={12} className={cn(isLoadingModels && "animate-spin")} />
                      Deteksi Ulang
                    </button>
                  </div>

                  <div className="space-y-2">
                    <select
                      value={isCustomModel ? '__custom__' : modelNameInput}
                      onChange={(e) => {
                        if (e.target.value === '__custom__') {
                          setIsCustomModel(true);
                        } else {
                          setIsCustomModel(false);
                          setModelNameInput(e.target.value);
                        }
                      }}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all font-medium shadow-sm cursor-pointer"
                    >
                      {availableModels.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                      <option value="__custom__">⚙️ Kustom (Input Manual)</option>
                    </select>

                    {isCustomModel && (
                      <input
                        type="text"
                        value={modelNameInput}
                        onChange={(e) => setModelNameInput(e.target.value)}
                        placeholder="Ketik nama model (contoh: cmc/deepseek/deepseek-v4-pro, gpt-4o)"
                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/20 font-mono shadow-inner"
                      />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Model terdeteksi secara otomatis dari endpoint API yang dimasukkan. Anda dapat memilih dari daftar dropdown di atas.
                  </p>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Save size={20} />
                    {isSaving ? "Saving..." : t('save')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
