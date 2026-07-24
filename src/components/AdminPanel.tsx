import React, { useState } from 'react';
import { Shield, User as UserIcon, Trash2, UserCog, Search, Mail, Plus, X, Phone, Save, Edit2 } from 'lucide-react';
import { User } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
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

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({ name: '', email: '', whatsapp: '', role: 'Member' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      whatsapp: user.whatsapp || '',
      role: user.role
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...formData } : u));
      onSuccess(t('successUpdate'));
    } else {
      const newUser: User = {
        id: Date.now().toString(),
        ...formData,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.name}`
      };
      setUsers([...users, newUser]);
      onSuccess(t('successAdd'));
    }
    setIsModalOpen(false);
  };

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  const handleDeleteClick = (id: string) => {
    if (id === currentUser.id) return;
    setUserToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (userToDelete) {
      setUsers(users.filter(u => u.id !== userToDelete));
      onSuccess(t('successDelete'));
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
    }
  };

  return (
    <div className="space-y-8 relative">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 sticky top-0 z-20 px-8 py-6 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-transparent transition-all">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('User Management')}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">{t('adminSubHeader')}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative w-72 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors" size={20} />
            <input
              type="text"
              placeholder={t('searchUsers')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all shadow-sm font-medium"
            />
          </div>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
          >
            <Plus size={20} />
            {t('addUser')}
          </button>
        </div>
      </header>

      <div className="mx-8 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-900/30 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-700">
                <th className="px-10 py-6">{t('fullName')}</th>
                <th className="px-10 py-6">Role</th>
                <th className="px-10 py-6">{t('whatsapp')}</th>
                <th className="px-10 py-6 text-right">{t('actions')}</th>
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
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-5">
                        <img src={user.avatar} className="w-14 h-14 rounded-full border-2 border-white dark:border-slate-700 shadow-xl" alt="" />
                        <div>
                          <p className="font-bold text-base tracking-tight">{user.name}</p>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                            <Mail size={12} className="text-blue-400" />
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <div className={cn(
                        "inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-colors",
                        user.role === 'Admin'
                          ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-500/20"
                          : "bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200/50 dark:border-slate-800"
                      )}>
                        {user.role === 'Admin' ? <Shield size={16} /> : <UserIcon size={16} />}
                        {user.role}
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{user.whatsapp || '-'}</span>
                    </td>
                    <td className="px-10 py-8 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => handleOpenEdit(user)}
                          className="p-3 bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 rounded-2xl border border-blue-100 dark:border-blue-500/30 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                        >
                          <Edit2 size={20} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(user.id)}
                          disabled={user.id === currentUser.id}
                          className={cn(
                            "p-3 bg-white dark:bg-slate-700 text-rose-500 rounded-2xl border border-rose-100 dark:border-rose-500/30 hover:bg-rose-600 hover:text-white transition-all shadow-sm",
                            user.id === currentUser.id && "opacity-20 cursor-not-allowed"
                          )}
                        >
                          <Trash2 size={20} />
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-10">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-10 overflow-hidden"
            >
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-8 right-8 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X size={24} />
              </button>

              <h2 className="text-3xl font-bold tracking-tight mb-2">
                {editingUser ? t('editUser') : t('addUser')}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium mb-10">
                {editingUser ? t('updateUserSub') : t('addUserSub')}
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('fullName')}</label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</label>
                    <input
                      required
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('whatsapp')}</label>
                    <input
                      type="text"
                      placeholder="+62..."
                      value={formData.whatsapp}
                      onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                      className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('role')}</label>
                  <div className="flex gap-4">
                    {['Member', 'Admin'].map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setFormData({ ...formData, role: role as 'Admin' | 'Member' })}
                        className={cn(
                          "flex-1 py-4 rounded-2xl font-bold text-sm transition-all border",
                          formData.role === role
                            ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20"
                            : "bg-slate-50 dark:bg-slate-900 text-slate-500 border-slate-100 dark:border-slate-700"
                        )}
                      >
                        {role === 'Member' ? t('member') : t('admin')}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-6">
                  <button
                    type="submit"
                    className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 dark:shadow-none"
                  >
                    {t('save')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-10">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDeleteModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-10 overflow-hidden text-center"
            >
              <div className="w-20 h-20 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 size={32} />
              </div>
              <h2 className="text-2xl font-bold tracking-tight mb-2">
                {t('deleteUser')}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium mb-10">
                {t('deleteConfirm')}
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 py-4 bg-slate-50 dark:bg-slate-900 text-slate-500 rounded-2xl font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-slate-100 dark:border-slate-700"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-100 dark:shadow-none"
                >
                  {t('delete')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
