import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, UserPlus, User as UserIcon, Mail, Lock, ArrowRight, ArrowLeft, Eye, EyeOff, KeyRound, Settings, Wrench, Kanban, LayoutDashboard, CheckCircle2 } from 'lucide-react';
import { User } from '../types';
import { cn } from '../lib/utils';
import { useLanguage } from '../context/LanguageContext';

interface AuthProps {
  onLogin: (user: User) => void;
  users: User[];
  setUsers: (users: User[]) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin, users, setUsers }) => {
  const { t } = useLanguage();
  const [isLogin, setIsLogin] = useState(true);

  // Forgot Password States
  const [forgotMode, setForgotMode] = useState<'none' | 'email' | 'otp' | 'reset'>('none');
  const [resetEmail, setResetEmail] = useState('');
  const [otpInput, setOtpInput] = useState('');

  // Registration States
  const [registerMode, setRegisterMode] = useState<'form' | 'otp'>('form');
  const [registerOtpInput, setRegisterOtpInput] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [loading, setLoading] = useState(false);

  const getAlertStyle = (msg: string) => {
    if (!msg) return '';
    const lower = msg.toLowerCase();
    
    // Sukses / Terverifikasi -> Hijau (Emerald)
    if (
      msg.includes('✓') ||
      lower.includes('terverifikasi') ||
      lower.includes('berhasil') ||
      lower.includes('sukses') ||
      msg === t('regSuccess') ||
      msg === t('resetSuccess')
    ) {
      return "text-emerald-700 bg-emerald-50 border border-emerald-200/80";
    }

    // Informasi / Dikirim -> Biru
    if (lower.includes('dikirim') || lower.includes('sent')) {
      return "text-blue-700 bg-blue-50 border border-blue-200/80";
    }

    // Error / Gagal -> Merah
    return "text-red-600 bg-red-50 border border-red-200/80";
  };

  // Timer Effect untuk cooldown
  React.useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // Bersihkan form saat berpindah antara Login dan Buat Akun agar tidak otomatis terisi
  React.useEffect(() => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setName('');
    setRegisterOtpInput('');
    setError('');
  }, [isLogin]);

  const handleResendOtp = async () => {
    if (cooldown > 0 || loading) return;
    setError('');
    setLoading(true);
    
    const targetEmail = forgotMode !== 'none' ? resetEmail.trim().toLowerCase() : email.trim().toLowerCase();
    const endpoint = forgotMode !== 'none' ? '/api/auth/forgot-password' : '/api/auth/send-register-otp';
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail })
      });
      const data = await response.json();
      if (response.ok) {
        setError('✓ OTP baru telah dikirim ke email Anda');
        setCooldown(30); // reset cooldown ke 30 detik
      } else {
        setError(data.error || 'Gagal mengirim ulang OTP');
      }
    } catch (err) {
      setError("Gagal terhubung ke server");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordFlow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError('');

    if (forgotMode === 'email') {
      if (!resetEmail.includes('@')) {
        setError('Format email tidak valid');
        return;
      }
      setLoading(true);
      try {
        const response = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: resetEmail.trim().toLowerCase() })
        });
        const data = await response.json();
        if (response.ok) {
          setError('✓ OTP telah dikirim ke email Anda');
          setForgotMode('otp');
          setCooldown(30); // Mulai hitung mundur 30 detik
        } else {
          setError(data.error || t('invalidCredentials'));
        }
      } catch (err) {
        console.error('Forgot password error:', err);
        setError("Gagal terhubung ke server. Pastikan server sudah berjalan.");
      } finally {
        setLoading(false);
      }
    } else if (forgotMode === 'otp') {
      const cleanOtp = otpInput.trim().replace(/\s+/g, '');
      if (cleanOtp.length !== 6) {
        setError('OTP harus 6 digit');
        return;
      }
      setLoading(true);
      try {
        const response = await fetch('/api/auth/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: resetEmail.trim().toLowerCase(), otp: cleanOtp })
        });
        const data = await response.json();
        if (response.ok) {
          setForgotMode('reset');
          setError('✓ OTP terverifikasi');
        } else {
          setError(data.error || 'Gagal verifikasi OTP');
        }
      } catch (err) {
        console.error('OTP verification error:', err);
        setError("Gagal terhubung ke server");
      } finally {
        setLoading(false);
      }
    } else if (forgotMode === 'reset') {
      if (password.length < 6) {
        setError('Password minimal 6 karakter');
        return;
      }
      if (password !== confirmPassword) {
        setError(t('passwordMismatch'));
        return;
      }
      setLoading(true);
      try {
        const cleanOtp = otpInput.trim().replace(/\s+/g, '');
        const response = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: resetEmail.trim().toLowerCase(), password: password, otp: cleanOtp })
        });
        const data = await response.json();
        if (response.ok) {
          setError('✓ Password berhasil diubah. Silakan login.');
          setForgotMode('none');
          setIsLogin(true);
          setPassword('');
          setConfirmPassword('');
          setResetEmail('');
          setOtpInput('');
        } else {
          setError(data.error || "Gagal reset password");
        }
      } catch (err) {
        console.error('Reset password error:', err);
        setError("Gagal terhubung ke server");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError('');

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    if (isLogin) {
      if (!trimmedEmail || !trimmedPassword) {
        setError(t('invalidCredentials'));
        return;
      }
      setLoading(true);
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: trimmedEmail, password: trimmedPassword })
        });

        const data = await response.json();
        if (response.ok) {
          onLogin(data);
        } else {
          setError(data.error || t('invalidCredentials'));
        }
      } catch (err) {
        setError("Gagal terhubung ke server");
      } finally {
        setLoading(false);
      }
    } else {
      if (!name || !email || !password || !confirmPassword) {
        setError(t('allFieldsRequired'));
        return;
      }
      if (password !== confirmPassword) {
        setError(t('passwordMismatch'));
        return;
      }

      if (registerMode === 'form') {
        setLoading(true);
        try {
          const response = await fetch('/api/auth/send-register-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: trimmedEmail })
          });
          const data = await response.json();
          if (response.ok) {
            setError('✓ OTP telah dikirim ke email Anda');
            setRegisterMode('otp');
            setCooldown(30); // Mulai hitung mundur 30 detik
          } else {
            setError(data.error || t('emailExists'));
          }
        } catch (err) {
          setError("Gagal terhubung ke server");
        } finally {
          setLoading(false);
        }
      } else if (registerMode === 'otp') {
        const cleanOtp = registerOtpInput.trim().replace(/\s+/g, '');
        if (cleanOtp.length !== 6) {
          setError('OTP harus 6 digit');
          return;
        }
        setLoading(true);
        try {
          const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: name.trim(),
              email: trimmedEmail,
              password: trimmedPassword,
              avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name.trim()}`,
              otp: cleanOtp
            })
          });

          const data = await response.json();
          if (response.ok) {
            setUsers([...users, data]);
            setIsLogin(true);
            setRegisterMode('form');
            setEmail('');
            setPassword('');
            setConfirmPassword('');
            setName('');
            setRegisterOtpInput('');
            setError(t('regSuccess'));
          } else {
            setError(data.error || t('emailExists'));
          }
        } catch (err) {
          setError("Gagal terhubung ke server");
        } finally {
          setLoading(false);
        }
      }
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-white overflow-hidden font-sans">
      {/* Tombol Kembali ke Landing Page */}
      <button
        onClick={() => window.location.reload()}
        className="absolute top-4 left-4 md:top-6 md:left-6 z-50 flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 bg-white/80 backdrop-blur border border-slate-200 text-slate-600 rounded-full text-xs md:text-sm font-semibold hover:bg-slate-50 hover:text-[#1E3A8A] transition-all shadow-sm"
      >
        <ArrowLeft size={14} className="md:size-4" />
        Kembali ke Beranda
      </button>

      {/* Kolom Kiri: Formulir Auth */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 md:p-8 relative">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          <div className="flex flex-col items-center text-center mb-8 md:mb-10">
            <div className="mb-3 md:mb-4 group relative">
              <img
                src="https://i.ibb.co.com/Fk4YB1cM/logo-ks.png"
                alt="KroomSpace Logo"
                style={{ height: '120px', width: 'auto' }}
                className="object-contain transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              {forgotMode !== 'none' ? t('resetPassword') : (isLogin ? t('welcomeBack') : t('createAccount'))}
            </h1>
            <p className="text-slate-500 mt-2 font-medium text-xs md:text-sm">{t('authSub')}</p>
          </div>

          {forgotMode !== 'none' ? (
            <form onSubmit={handleForgotPasswordFlow} className="space-y-4">
              {forgotMode === 'email' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">{t('emailAddress')}</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 focus:border-blue-500/20 focus:bg-white rounded-2xl outline-none transition-all font-medium text-slate-900"
                      placeholder="name@company.com"
                      required
                    />
                  </div>
                </div>
              )}
              {forgotMode === 'otp' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">{t('enterOtp')}</label>
                  <div className="relative">
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="text"
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 focus:border-blue-500/20 focus:bg-white rounded-2xl outline-none transition-all font-medium text-slate-900 tracking-[0.4em] text-center"
                      placeholder="123456"
                      maxLength={6}
                      required
                    />
                  </div>
                  <div className="flex justify-end px-1 mt-1">
                    <button
                      type="button"
                      disabled={cooldown > 0}
                      onClick={handleResendOtp}
                      className={cn(
                        "text-xs font-bold transition-colors",
                        cooldown > 0 
                          ? "text-slate-400 cursor-not-allowed" 
                          : "text-blue-500 hover:text-blue-600 cursor-pointer"
                      )}
                    >
                      {cooldown > 0 ? `Kirim ulang dalam ${cooldown}s` : "Kirim Ulang OTP"}
                    </button>
                  </div>
                </div>
              )}
              {forgotMode === 'reset' && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">{t('newPass')}</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-100 focus:border-blue-500/20 focus:bg-white rounded-2xl outline-none transition-all font-medium text-slate-900"
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors"
                        title={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">{t('confirmPass')}</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-100 focus:border-blue-500/20 focus:bg-white rounded-2xl outline-none transition-all font-medium text-slate-900"
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors"
                        title={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "text-xs font-bold text-center py-2.5 px-3 rounded-xl transition-all",
                    getAlertStyle(error)
                  )}
                >
                  {error}
                </motion.p>
              )}

              <button
                type="submit"
                disabled={loading}
                className={cn(
                  "w-full group flex items-center justify-center gap-3 p-4 bg-[#1E3A8A] hover:bg-[#152a65] text-white rounded-2xl transition-all duration-300 shadow-lg shadow-[#1E3A8A]/20 font-bold mt-6",
                  loading && "opacity-60 cursor-not-allowed"
                )}
              >
                {loading ? "Memproses..." : (forgotMode === 'email' ? t('sendOtp') : (forgotMode === 'otp' ? t('verifyOtp') : t('resetPassword')))}
                {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
              </button>

              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => { setForgotMode('none'); setError(''); }}
                  className="text-sm font-bold text-slate-400 hover:text-[#3498DB] transition-colors"
                >
                  {t('backToLogin')}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
              <AnimatePresence mode="wait">
                {!isLogin && registerMode === 'form' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-1.5"
                  >
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">{t('fullName')}</label>
                    <div className="relative">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        type="text"
                        id="reg_name"
                        name="reg_name"
                        autoComplete="off"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 focus:border-blue-500/20 focus:bg-white rounded-2xl outline-none transition-all font-medium text-slate-900 placeholder:text-slate-300"
                        placeholder="John Doe"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {(!isLogin && registerMode === 'otp') ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">{t('enterOtp')}</label>
                  <div className="relative">
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="text"
                      value={registerOtpInput}
                      onChange={(e) => setRegisterOtpInput(e.target.value.replace(/\D/g, ''))}
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 focus:border-blue-500/20 focus:bg-white rounded-2xl outline-none transition-all font-medium text-slate-900 tracking-[0.4em] text-center"
                      placeholder="123456"
                      maxLength={6}
                      required
                    />
                  </div>
                  <div className="flex justify-end px-1 mt-1">
                    <button
                      type="button"
                      disabled={cooldown > 0}
                      onClick={handleResendOtp}
                      className={cn(
                        "text-xs font-bold transition-colors",
                        cooldown > 0 
                          ? "text-slate-400 cursor-not-allowed" 
                          : "text-blue-500 hover:text-blue-600 cursor-pointer"
                      )}
                    >
                      {cooldown > 0 ? `Kirim ulang dalam ${cooldown}s` : "Kirim Ulang OTP"}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">{t('emailAddress')}</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        type="email"
                        id={isLogin ? "username" : "reg_email"}
                        name={isLogin ? "username" : "reg_email"}
                        autoComplete={isLogin ? "username" : "off"}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 focus:border-blue-500/20 focus:bg-white rounded-2xl outline-none transition-all font-medium text-slate-900 placeholder:text-slate-300"
                        placeholder="name@company.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">{t('password')}</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        type={showPassword ? "text" : "password"}
                        id={isLogin ? "password" : "reg_password"}
                        name={isLogin ? "password" : "reg_password"}
                        autoComplete={isLogin ? "current-password" : "new-password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-100 focus:border-blue-500/20 focus:bg-white rounded-2xl outline-none transition-all font-medium text-slate-900 placeholder:text-slate-300"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <AnimatePresence mode="wait">
                    {!isLogin && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-1.5 overflow-hidden"
                      >
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">{t('confirmPass')}</label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <input
                            type={showPassword ? "text" : "password"}
                            id="reg_confirm_password"
                            name="reg_confirm_password"
                            autoComplete="new-password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-100 focus:border-blue-500/20 focus:bg-white rounded-2xl outline-none transition-all font-medium text-slate-900 placeholder:text-slate-300"
                            placeholder="••••••••"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors"
                            title={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                          >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}

              {isLogin && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => { setForgotMode('email'); setError(''); }}
                    className="text-sm font-semibold text-[#3498DB] hover:text-[#2980B9] transition-colors"
                  >
                    {t('forgotPassword')}
                  </button>
                </div>
              )}

              {error && (
                <motion.p
                  id="login-error"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "text-xs font-bold text-center py-2.5 px-3 rounded-xl transition-all",
                    getAlertStyle(error)
                  )}
                >
                  {error}
                </motion.p>
              )}

              <button
                type="submit"
                id="login-form-submit"
                disabled={loading}
                className={cn(
                  "w-full group flex items-center justify-center gap-3 p-4 bg-[#1E3A8A] hover:bg-[#152a65] text-white rounded-2xl transition-all duration-300 shadow-lg shadow-[#1E3A8A]/20 font-bold mt-6",
                  loading && "opacity-60 cursor-not-allowed"
                )}
              >
                {loading ? "Memproses..." : (isLogin ? t('login') : (!isLogin && registerMode === 'otp' ? t('verifyOtp') : t('register')))}
                {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
              </button>

              {!isLogin && registerMode === 'otp' && (
                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={() => { setRegisterMode('form'); setError(''); }}
                    className="text-sm font-bold text-slate-400 hover:text-[#3498DB] transition-colors"
                  >
                    Kembali
                  </button>
                </div>
              )}
            </form>
          )}

          {forgotMode === 'none' && (
            <div className="mt-8 text-center">
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setRegisterMode('form');
                  setError('');
                }}
                className="text-sm font-bold text-slate-400 hover:text-[#3498DB] transition-colors"
              >
                {isLogin ? t('noAccount') : t('hasAccount')} <span className="text-[#3498DB]">{isLogin ? t('register') : t('login')}</span>
              </button>
            </div>
          )}

          <div className="mt-10 pt-8 text-center">
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-[0.2em]">Powered by KroomSpace AI</p>
          </div>
        </motion.div>
      </div>

      {/* Kolom Kanan: Animasi Manajemen Proyek (Tersembunyi di Mobile) */}
      <div className="hidden lg:flex w-1/2 relative bg-gradient-to-br from-[#F0F6FF] via-[#F8FAFC] to-[#E0F2FE] overflow-hidden items-center justify-center border-l border-slate-100">
        {/* Latar Belakang Geometris */}
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20px 20px, #3498DB 1px, transparent 0)', backgroundSize: '40px 40px' }} />

        {/* Orb Cahaya */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#3498DB]/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#1E3A8A]/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative w-full max-w-md h-[400px] flex items-center justify-center">

          {/* Kotak Pusat (Merepresentasikan Papan Kanban/Sistem Utama) */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="absolute z-20 bg-white/70 backdrop-blur-xl border border-white/80 p-6 rounded-[1.8rem] shadow-[0_20px_50px_rgba(30,58,138,0.1)] flex flex-col items-center justify-center w-56 h-56"
          >
            <div className="relative">
              <Kanban size={52} className="text-[#1E3A8A] mb-4 drop-shadow-sm" />
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className="absolute -top-1 -right-1 text-amber-500 drop-shadow-md"
              >
                <Settings size={16} />
              </motion.div>
            </div>
            <div className="w-32 h-2 bg-[#1E3A8A]/10 rounded-full mb-3" />
            <div className="w-20 h-2 bg-[#1E3A8A]/10 rounded-full mb-6" />
            <div className="flex gap-2.5">
              <motion.div animate={{ y: [0, -3, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0 }} className="w-8 h-8 rounded-full bg-[#3498DB] shadow-md border border-white" />
              <motion.div animate={{ y: [0, -3, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }} className="w-8 h-8 rounded-full bg-[#2ECC71] shadow-md border border-white" />
              <motion.div animate={{ y: [0, -3, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.6 }} className="w-8 h-8 rounded-full bg-[#9B59B6] shadow-md border border-white" />
            </div>
          </motion.div>

          {/* Elemen Mengambang 1 - Pengaturan/Sistem */}
          <motion.div
            animate={{ y: [0, -15, 0], rotate: [0, 10, -5, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-8 right-20 z-10 bg-white/90 p-3.5 rounded-xl shadow-lg shadow-blue-900/5 flex items-center justify-center text-[#9B59B6] border border-white/60 backdrop-blur-md"
          >
            <Settings size={22} />
          </motion.div>

          {/* Elemen Mengambang 2 - Checklist Selesai */}
          <motion.div
            animate={{ y: [0, 20, 0], x: [0, 5, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-16 left-12 z-30 bg-white/90 p-3.5 rounded-xl shadow-lg shadow-blue-900/5 flex items-center justify-center text-[#2ECC71] border border-white/60 backdrop-blur-md"
          >
            <CheckCircle2 size={22} />
          </motion.div>

          {/* Elemen Mengambang 3 - Maintenance / Wrench */}
          <motion.div
            animate={{ y: [0, -20, 0], x: [0, -10, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2.5 }}
            className="absolute bottom-24 right-12 z-10 bg-white/90 p-3.5 rounded-xl shadow-lg shadow-blue-900/5 flex items-center justify-center text-[#E67E22] border border-white/60 backdrop-blur-md"
          >
            <Wrench size={22} />
          </motion.div>

          {/* Elemen Mengambang 4 - Dashboard Pemantauan */}
          <motion.div
            animate={{ y: [0, 15, 0] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
            className="absolute top-16 left-16 z-10 bg-white/90 p-3.5 rounded-xl shadow-lg shadow-blue-900/5 flex items-center justify-center text-[#3498DB] border border-white/60 backdrop-blur-md"
          >
            <LayoutDashboard size={22} />
          </motion.div>
        </div>

        {/* Teks Pendukung Bawah */}
        <div className="absolute bottom-12 text-center px-16 max-w-xl">
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="text-2xl font-black text-[#1E3A8A] mb-3 tracking-wide"
          >
            Pusat Manajemen Proyek & Maintenance
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 1 }}
            className="text-slate-600 text-sm font-semibold leading-relaxed"
          >
            Solusi terpadu untuk efisiensi kolaborasi tim Anda. Pantau progress tugas harian, atur jadwal maintenance aset, dan selesaikan pekerjaan lebih cepat tanpa hambatan.
          </motion.p>
        </div>
      </div>
    </div>
  );
};
