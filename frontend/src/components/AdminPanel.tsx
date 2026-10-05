import React, { useState } from 'react';
import { Shield, User as UserIcon, Trash2, UserCog, Search, Mail, Plus, X, Phone, Save, Edit2 } from 'lucide-react';
import { User } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn, cleanIndonesianPhoneDigits, formatToE164Indonesian } from '../lib/utils';
import { useLanguage } from '../context/LanguageContext';

interface AdminPanelProps {
  users: User[];
  setUsers: (users: User[]) => void;
  currentUser: User;
  darkMode: boolean;
  onSuccess: (message: string) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ users, setUsers, currentUser, darkMode, onSuccess }) => {
  const { language, t } = useLanguage();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: '',
    role: 'Member' as 'Admin' | 'Member'
  });

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({ name: '', email: '', whatsapp: '', role: 'Member' });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      whatsapp: cleanIndonesianPhoneDigits(user.whatsapp),
      role: user.role
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanName = formData.name.trim();
    if (!cleanName || cleanName.length < 2 || cleanName.length > 60) {
      setFormError('Nama harus memiliki panjang 2 hingga 60 karakter');
      return;
    }
    if (/[<>{}[\]\\\/;`~]/.test(cleanName) || /javascript:/i.test(cleanName) || /<script/i.test(cleanName)) {
      setFormError('Nama tidak boleh mengandung karakter khusus, tag HTML, atau skrip');
      return;
    }

    const cleanEmail = formData.email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setFormError('Format alamat email tidak valid');
      return;
    }

    setIsSubmitting(true);
    try {
      const formattedWhatsapp = formatToE164Indonesian(formData.whatsapp);

      if (editingUser) {
        const res = await fetch(`/api/users/${editingUser.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Id': currentUser.id,
            'X-User-Role': currentUser.role
          },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            whatsapp: formattedWhatsapp,
            role: formData.role
          })
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Gagal memperbarui pengguna');
        }

        setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...data } : u));
        onSuccess(t('successUpdate'));
        setIsModalOpen(false);
      } else {
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Id': currentUser.id,
            'X-User-Role': currentUser.role
          },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            whatsapp: formattedWhatsapp,
            role: formData.role
          })
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Gagal menambahkan pengguna');
        }

        setUsers([...users, data]);
        onSuccess(t('successAdd'));
        setIsModalOpen(false);
      }
    } catch (err: any) {
      console.error(err);
      setFormError(err.message || 'Terjadi kesalahan saat menyimpan pengguna');
    } finally {
      setIsSubmitting(false);
    }
  };

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  const handleDeleteClick = (id: string) => {
    if (id === currentUser.id) return;
    setUserToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/users/${userToDelete}`, {
        method: 'DELETE',
        headers: {
          'X-User-Id': currentUser.id,
          'X-User-Role': currentUser.role
        }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menghapus pengguna');
      }
      setUsers(users.filter(u => u.id !== userToDelete));
      onSuccess(t('successDelete'));
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Gagal menghapus pengguna');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8 relative">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-4 md:px-6 py-4 md:py-5 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 sticky top-0 z-20 transition-all">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('User Management')}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium text-sm">{t('adminSubHeader')}</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end shrink-0">
          <div className="relative w-full sm:w-56 md:w-64 group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors" size={16} />
            <input
              type="text"
              placeholder={t('searchUsers')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium shadow-2xs"
            />
          </div>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 md:px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-600/25 active:scale-95 text-sm shrink-0 cursor-pointer"
          >
            <Plus size={18} />
            {t('addUser')}
          </button>
        </div>
      </header>

      <div className="mx-4 md:mx-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xl overflow-hidden">
        <div className="overflow-x-auto table-responsive">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-900/30 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-700">
                <th className="px-6 py-4">{t('fullName')}</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">{t('whatsapp')}</th>
                <th className="px-6 py-4 text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
              <AnimatePresence>
                {filteredUsers.map((user) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="group hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-all"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <img src={user.avatar} className="w-12 h-12 rounded-full border-2 border-white dark:border-slate-700 shadow-lg" alt="" />
                        <div>
                          <p className="font-bold text-sm tracking-tight">{user.name}</p>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                            <Mail size={11} className="text-blue-400" />
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={cn(
                        "inline-flex items-center gap-2 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-colors",
                        user.role === 'Admin'
                          ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-500/20"
                          : "bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200/50 dark:border-slate-800"
                      )}>
                        {user.role === 'Admin' ? <Shield size={14} /> : <UserIcon size={14} />}
                        {user.role}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{user.whatsapp || '-'}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(user)}
                          className="p-2 bg-slate-50 dark:bg-slate-700 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-50 dark:hover:bg-slate-600 transition-all"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(user.id)}
                          disabled={user.id === currentUser.id}
                          className={cn(
                            "p-2 bg-slate-50 dark:bg-slate-700 text-rose-500 rounded-xl hover:bg-rose-50 dark:hover:bg-slate-600 transition-all",
                            user.id === currentUser.id && "opacity-20 cursor-not-allowed"
                          )}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden"
            >
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={20} />
              </button>

              <h2 className="text-xl font-bold mb-1">
                {editingUser ? t('editUser') : t('addUser')}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                {editingUser ? t('updateUserSub') : t('addUserSub')}
              </p>

              {formError && (
                <div className="p-3 mb-4 text-xs font-semibold text-rose-700 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-300 rounded-xl border border-rose-200 dark:border-rose-900/50">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('fullName')}</label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</label>
                    <input
                      required
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('whatsapp')}</label>
                    <div className="flex items-center rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 overflow-hidden transition-all">
                      <span className="flex items-center gap-1.5 px-3 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs border-r border-slate-200 dark:border-slate-700 select-none shrink-0">
                        <span className="text-sm">🇮🇩</span>
                        <span>+62</span>
                      </span>
                      <input
                        type="tel"
                        inputMode="numeric"
                        placeholder="81234567890"
                        value={formData.whatsapp}
                        onChange={(e) => setFormData({ ...formData, whatsapp: cleanIndonesianPhoneDigits(e.target.value) })}
                        className="w-full px-3 py-3 bg-transparent text-sm outline-none font-medium placeholder:text-slate-400 text-slate-800 dark:text-slate-100"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block leading-tight">
                      {language === 'id' ? 'Otomatis +62 (cukup ketik 8xxx, awalan 0 dihapus otomatis)' : 'Auto +62 (enter 8xxx, leading 0 removed)'}
                    </span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('role')}</label>
                  <div className="flex gap-2">
                    {['Member', 'Admin'].map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setFormData({ ...formData, role: role as 'Admin' | 'Member' })}
                        className={cn(
                          "flex-1 py-3 rounded-xl font-bold text-xs transition-all border",
                          formData.role === role
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-slate-50 dark:bg-slate-900 text-slate-500 border-slate-100 dark:border-slate-700"
                        )}
                      >
                        {role === 'Member' ? t('member') : t('admin')}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all mt-2 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (language === 'id' ? 'Menyimpan...' : 'Saving...') : t('save')}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isDeleting && setIsDeleteModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-xs bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 text-center"
            >
              <div className="w-16 h-16 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={24} />
              </div>
              <h2 className="text-lg font-bold mb-1">{t('deleteUser')}</h2>
              <p className="text-slate-500 dark:text-slate-400 text-xs mb-6">{t('deleteConfirm')}</p>
              <div className="flex gap-3">
                <button
                  disabled={isDeleting}
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 px-5 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 font-bold text-sm rounded-xl transition-all disabled:opacity-50"
                >
                  {t('cancel')}
                </button>
                <button
                  disabled={isDeleting}
                  onClick={confirmDelete}
                  className="flex-1 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm rounded-xl transition-all disabled:opacity-50"
                >
                  {isDeleting ? (language === 'id' ? 'Menghapus...' : 'Deleting...') : t('delete')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
