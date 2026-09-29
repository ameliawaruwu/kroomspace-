import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Plus, FileText, Upload, Calendar, User as UserIcon,
  AlertTriangle, CheckCircle2, Lightbulb, Paperclip, Trash2,
  ChevronDown, ChevronUp, BookOpen, Clock, Image as ImageIcon,
  Save, Eye, Edit3, Download, Loader2
} from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { Documentation, DocumentationAttachment, Task, User } from '../types';
import { cn } from '../lib/utils';

interface DocumentationDrawerProps {
  task: Task;
  user: User;
  darkMode: boolean;
  documentations: Documentation[];
  onSave: (doc: Documentation) => void;
  onDelete?: (docId: string) => void;
  onClose: () => void;
  defaultMode?: 'view' | 'add';
}

export const DocumentationDrawer: React.FC<DocumentationDrawerProps> = ({
  task,
  user,
  darkMode,
  documentations,
  onSave,
  onDelete,
  onClose,
  defaultMode = 'view'
}) => {
  const taskDocs = documentations.filter(d => d.taskId === task.id);
  const [mode, setMode] = useState<'view' | 'add' | 'detail'>(defaultMode === 'add' ? 'add' : taskDocs.length === 0 ? 'add' : 'view');
  const [selectedDoc, setSelectedDoc] = useState<Documentation | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(taskDocs[0]?.id || null);

  // Form state
  const [form, setForm] = useState({
    completionNotes: '',
    obstacles: '',
    solutions: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<string | null>(null);

  const handleGeneratePdf = async (doc: Documentation) => {
    setIsGeneratingPdf(doc.id);
    try {
      const htmlContent = `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 800px; margin: auto; padding: 40px; color: #333; line-height: 1.6;">
          <div style="border-bottom: 3px solid #3FA9F5; padding-bottom: 20px; margin-bottom: 30px;">
            <h1 style="color: #1E3A5F; margin: 0; font-size: 24px; text-transform: uppercase;">Laporan Penyelesaian Tugas</h1>
            <p style="color: #666; margin: 5px 0 0 0;">KroomSpace Management System</p>
          </div>
          
          <div style="background: #F8FBFF; padding: 20px; border-radius: 8px; margin-bottom: 30px; border: 1px solid #EBF5FF;">
            <h3 style="color: #2D7FEA; margin-top: 0;">Informasi Tugas</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; width: 150px; font-weight: bold; color: #555;">ID Tugas</td><td>: ${task.id}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold; color: #555;">Judul</td><td>: ${task.title}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold; color: #555;">Prioritas</td><td>: ${task.priority}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold; color: #555;">Tipe</td><td>: ${task.type}</td></tr>
            </table>
          </div>

          <div style="margin-bottom: 30px;">
            <h3 style="color: #1E3A5F; border-bottom: 1px solid #eee; padding-bottom: 10px;">Detail Penyelesaian</h3>
            <p><strong>Dikerjakan Oleh:</strong> ${doc.authorName}</p>
            <p><strong>Waktu Selesai:</strong> ${new Date(doc.createdAt).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}</p>
            
            <div style="margin-top: 24px;">
              <div style="background: #f8fafc; padding: 16px 20px; border-left: 5px solid #3FA9F5; border-radius: 8px; margin-bottom: 20px;">
                <div style="color: #1E3A5F; font-weight: 700; font-size: 14px; margin-bottom: 8px; text-transform: uppercase;">
                  Catatan Penyelesaian:
                </div>
                <div style="color: #334155; font-size: 13px; line-height: 1.6;">
                  ${doc.completionNotes.replace(/\n/g, '<br>')}
                </div>
              </div>
            </div>

            ${doc.obstacles ? `
              <div style="margin-top: 20px;">
                <div style="background: #fefce8; padding: 16px 20px; border-left: 5px solid #eab308; border-radius: 8px; margin-bottom: 20px;">
                  <div style="color: #854d0e; font-weight: 700; font-size: 14px; margin-bottom: 8px; text-transform: uppercase;">
                    Kendala Ditemukan:
                  </div>
                  <div style="color: #713f12; font-size: 13px; line-height: 1.6;">
                    ${doc.obstacles.replace(/\n/g, '<br>')}
                  </div>
                </div>
              </div>
            ` : ''}

            ${doc.solutions ? `
              <div style="margin-top: 20px;">
                <div style="background: #f0fdf4; padding: 16px 20px; border-left: 5px solid #10b981; border-radius: 8px; margin-bottom: 20px;">
                  <div style="color: #166534; font-weight: 700; font-size: 14px; margin-bottom: 8px; text-transform: uppercase;">
                    Solusi Diterapkan:
                  </div>
                  <div style="color: #14532d; font-size: 13px; line-height: 1.6;">
                    ${doc.solutions.replace(/\n/g, '<br>')}
                  </div>
                </div>
              </div>
            ` : ''}
          </div>

          <div style="margin-top: 50px; text-align: center; color: #888; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px;">
            Dokumen ini dibuat secara otomatis oleh sistem KroomSpace.
          </div>
        </div>
      `;
      
      const element = document.createElement('div');
      element.innerHTML = htmlContent;
      
      html2pdf().from(element).set({
        margin: 10,
        filename: `Laporan_${task.id.slice(0,8)}.pdf`,
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      }).save();

      // Tunggu sebentar agar loading effect terlihat
      await new Promise(r => setTimeout(r, 1000));
    } catch (e) {
      alert("Gagal menghasilkan PDF: " + (e as Error).message);
    } finally {
      setIsGeneratingPdf(null);
    }
  };

  const C = {
    bg: darkMode ? 'bg-[#0D1B35]' : 'bg-white',
    border: darkMode ? 'border-[#1E3A5F]/60' : 'border-slate-200/80',
    cardBg: darkMode ? 'bg-[#152844]' : 'bg-[#F8FBFF]',
    text: darkMode ? 'text-white' : 'text-slate-800',
    sub: darkMode ? 'text-slate-400' : 'text-slate-500',
    input: darkMode
      ? 'bg-[#1E3A5F]/40 border-[#1E3A5F]/60 text-white placeholder:text-slate-500 focus:border-[#3FA9F5]/60 focus:ring-[#3FA9F5]/20'
      : 'bg-[#F0F9FF] border-[#BFDFFF]/70 text-slate-700 placeholder:text-slate-400 focus:border-[#3FA9F5]/50 focus:ring-[#3FA9F5]/10 focus:bg-white',
  };

  const handleSave = async () => {
    if (!form.completionNotes.trim()) return;
    setIsSaving(true);
    const newDoc: Documentation = {
      id: `doc-${Date.now()}`,
      taskId: task.id,
      projectId: task.projectId,
      completionNotes: form.completionNotes,
      obstacles: form.obstacles,
      solutions: form.solutions,
      attachments: [],
      authorId: user.id,
      authorName: user.name,
      authorAvatar: user.avatar,
      createdAt: new Date().toISOString(),
    };
    await new Promise(r => setTimeout(r, 400));
    onSave(newDoc);
    setForm({ completionNotes: '', obstacles: '', solutions: '' });
    setIsSaving(false);
    setMode('view');
    setExpandedId(newDoc.id);
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
      />

      {/* Drawer */}
      <motion.aside
        initial={{ x: '100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className={cn(
          "fixed right-0 top-0 bottom-0 z-[70] w-full max-w-[520px] flex flex-col shadow-2xl border-l overflow-hidden",
          C.bg, C.border
        )}
      >
        {/* ── Header ── */}
        <div className={cn(
          "flex items-center justify-between px-6 py-5 border-b shrink-0",
          C.border
        )}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl" style={{ background: 'linear-gradient(135deg, #3FA9F5, #2D7FEA)' }}>
              <BookOpen size={18} className="text-white" />
            </div>
            <div>
              <h2 className={cn("font-black text-base tracking-tight", C.text)}>Dokumentasi Task</h2>
              <p className={cn("text-[11px] font-medium truncate max-w-[260px]", C.sub)}>{task.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {mode === 'view' && (
              <button
                onClick={() => setMode('add')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-white text-[11px] font-black uppercase tracking-wider shadow-lg transition-all hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #3FA9F5, #2D7FEA)', boxShadow: '0 4px 15px rgba(63,169,245,0.3)' }}
              >
                <Plus size={13} strokeWidth={3} /> Tambah
              </button>
            )}
            <button onClick={onClose} className={cn("p-2 rounded-xl transition-colors", darkMode ? "hover:bg-white/10 text-slate-400" : "hover:bg-slate-100 text-slate-400")}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── Task Info Strip ── */}
        <div className={cn(
          "px-6 py-3 border-b flex items-center gap-3 shrink-0",
          darkMode ? "bg-[#3FA9F5]/8 border-[#1E3A5F]/60" : "bg-[#EBF5FF]/80 border-[#BFDFFF]/40"
        )}>
          <span className={cn(
            "px-2.5 py-1 rounded-full text-[10px] font-black border",
            task.status === 'Done'
              ? darkMode ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' : 'text-emerald-600 bg-emerald-50 border-emerald-200'
              : task.status === 'In Progress'
                ? darkMode ? 'text-[#3FA9F5] bg-[#3FA9F5]/10 border-[#3FA9F5]/30' : 'text-[#2D7FEA] bg-blue-50 border-blue-200'
                : darkMode ? 'text-slate-400 bg-slate-700/50 border-slate-600/30' : 'text-slate-500 bg-slate-100 border-slate-200'
          )}>
            {task.status}
          </span>
          <span className={cn("text-[11px] font-medium", C.sub)}>
            {taskDocs.length} dokumentasi tersimpan
          </span>
          <div className="ml-auto flex items-center gap-1 text-[11px]" style={{ color: '#3FA9F5' }}>
            <FileText size={11} />
            <span className="font-bold">ID: {task.id.slice(0, 8)}</span>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">

            {/* ─── ADD FORM ─── */}
            {mode === 'add' && (
              <motion.div
                key="add"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-6 space-y-5"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className={cn("font-black text-sm", C.text)}>Tambah Dokumentasi Baru</h3>
                  {taskDocs.length > 0 && (
                    <button onClick={() => setMode('view')} className={cn("text-[11px] font-bold flex items-center gap-1", C.sub, "hover:text-[#3FA9F5] transition-colors")}>
                      <Eye size={12} /> Lihat ({taskDocs.length})
                    </button>
                  )}
                </div>

                {/* Catatan Penyelesaian */}
                <div className="space-y-2">
                  <label className={cn("flex items-center gap-2 text-[10px] font-black uppercase tracking-widest", C.sub)}>
                    <CheckCircle2 size={11} style={{ color: '#3FA9F5' }} />
                    Catatan Penyelesaian <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    id="textarea_notes"
                    value={form.completionNotes}
                    onChange={e => setForm(f => ({ ...f, completionNotes: e.target.value }))}
                    placeholder="Jelaskan apa yang telah diselesaikan pada task ini..."
                    rows={4}
                    className={cn(
                      "w-full rounded-2xl px-4 py-3 text-sm border outline-none transition-all resize-none font-medium ring-2 ring-transparent",
                      C.input
                    )}
                  />
                </div>

                {/* Kendala */}
                <div className="space-y-2">
                  <label className={cn("flex items-center gap-2 text-[10px] font-black uppercase tracking-widest", C.sub)}>
                    <AlertTriangle size={11} className="text-amber-400" />
                    Kendala yang Ditemukan
                  </label>
                  <textarea
                    id="textarea_obstacles"
                    value={form.obstacles}
                    onChange={e => setForm(f => ({ ...f, obstacles: e.target.value }))}
                    placeholder="Tuliskan hambatan atau masalah yang ditemukan selama pengerjaan..."
                    rows={3}
                    className={cn(
                      "w-full rounded-2xl px-4 py-3 text-sm border outline-none transition-all resize-none font-medium ring-2 ring-transparent",
                      C.input
                    )}
                  />
                </div>

                {/* Solusi */}
                <div className="space-y-2">
                  <label className={cn("flex items-center gap-2 text-[10px] font-black uppercase tracking-widest", C.sub)}>
                    <Lightbulb size={11} className="text-emerald-400" />
                    Solusi yang Dilakukan
                  </label>
                  <textarea
                    id="textarea_solutions"
                    value={form.solutions}
                    onChange={e => setForm(f => ({ ...f, solutions: e.target.value }))}
                    placeholder="Bagaimana kendala tersebut diatasi? Tuliskan solusi yang diterapkan..."
                    rows={3}
                    className={cn(
                      "w-full rounded-2xl px-4 py-3 text-sm border outline-none transition-all resize-none font-medium ring-2 ring-transparent",
                      C.input
                    )}
                  />
                </div>

                {/* Author info */}
                <div className={cn("flex items-center gap-3 p-3.5 rounded-2xl border", C.cardBg, C.border)}>
                  <img src={user.avatar} alt={user.name} className="w-9 h-9 rounded-full border-2 border-white shadow-sm" />
                  <div>
                    <p className={cn("text-sm font-bold", C.text)}>{user.name}</p>
                    <p className={cn("text-[10px] font-medium flex items-center gap-1", C.sub)}>
                      <Clock size={9} /> {formatDate(new Date().toISOString())}
                    </p>
                  </div>
                  <div className="ml-auto px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest text-white" style={{ background: 'linear-gradient(135deg, #3FA9F5, #2D7FEA)' }}>
                    {user.role}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  {taskDocs.length > 0 && (
                    <button
                      onClick={() => setMode('view')}
                      className={cn("flex-1 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all border", C.sub, C.border, darkMode ? "hover:bg-white/5" : "hover:bg-slate-50")}
                    >
                      Batal
                    </button>
                  )}
                  <button
                    id="btn_simpan_selesai"
                    onClick={handleSave}
                    disabled={!form.completionNotes.trim() || isSaving}
                    className={cn(
                      "flex-[2] py-3.5 rounded-2xl text-white text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg",
                      !form.completionNotes.trim() ? "opacity-40 cursor-not-allowed" : "hover:scale-[1.02] hover:shadow-xl"
                    )}
                    style={{ background: 'linear-gradient(135deg, #3FA9F5, #2D7FEA)', boxShadow: '0 8px 25px rgba(63,169,245,0.3)' }}
                  >
                    {isSaving ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Save size={14} />
                    )}
                    {isSaving ? 'Menyimpan...' : 'Simpan Dokumentasi'}
                  </button>
                </div>
              </motion.div>
            )}

            {/* ─── VIEW LIST ─── */}
            {mode === 'view' && (
              <motion.div
                key="view"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="p-6 space-y-4"
              >
                {taskDocs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="w-20 h-20 rounded-3xl flex items-center justify-center" style={{ background: 'rgba(63,169,245,0.08)' }}>
                      <BookOpen size={32} style={{ color: '#3FA9F5' }} />
                    </div>
                    <p className={cn("font-bold text-sm", C.text)}>Belum ada dokumentasi</p>
                    <p className={cn("text-[12px] text-center max-w-[220px]", C.sub)}>
                      Tambahkan dokumentasi pertama untuk task ini
                    </p>
                    <button
                      onClick={() => setMode('add')}
                      className="px-5 py-2.5 rounded-xl text-white text-[11px] font-black uppercase tracking-wider shadow-lg"
                      style={{ background: 'linear-gradient(135deg, #3FA9F5, #2D7FEA)' }}
                    >
                      + Tambah Dokumentasi
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {taskDocs.map((doc, idx) => (
                      <motion.div
                        key={doc.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={cn("rounded-2xl border overflow-hidden transition-all", C.cardBg, C.border)}
                      >
                        {/* Doc header */}
                        <button
                          onClick={() => setExpandedId(expandedId === doc.id ? null : doc.id)}
                          className="w-full px-5 py-4 flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-3">
                            <img src={doc.authorAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${doc.authorName}`} className="w-8 h-8 rounded-full border-2 border-white shadow-sm shrink-0" alt={doc.authorName} />
                            <div className="text-left">
                              <p className={cn("text-sm font-bold", C.text)}>{doc.authorName}</p>
                              <p className={cn("text-[10px] font-medium flex items-center gap-1", C.sub)}>
                                <Clock size={9} /> {formatDate(doc.createdAt)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {expandedId === doc.id
                              ? <ChevronUp size={16} style={{ color: '#3FA9F5' }} />
                              : <ChevronDown size={16} className={cn(C.sub)} />
                            }
                          </div>
                        </button>

                        {/* Doc expanded content */}
                        <AnimatePresence>
                          {expandedId === doc.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className={cn("border-t overflow-hidden", C.border)}
                            >
                              <div className="px-5 py-4 space-y-4">
                                {/* Catatan Penyelesaian */}
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <CheckCircle2 size={12} style={{ color: '#3FA9F5' }} />
                                    <span className={cn("text-[10px] font-black uppercase tracking-widest", C.sub)}>Catatan Penyelesaian</span>
                                  </div>
                                  <p className={cn("text-[13px] leading-relaxed font-medium pl-5", C.text)}>{doc.completionNotes}</p>
                                </div>

                                {/* Kendala */}
                                {doc.obstacles && (
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <AlertTriangle size={12} className="text-amber-400" />
                                      <span className={cn("text-[10px] font-black uppercase tracking-widest", C.sub)}>Kendala</span>
                                    </div>
                                    <p className={cn("text-[13px] leading-relaxed font-medium pl-5", C.text)}>{doc.obstacles}</p>
                                  </div>
                                )}

                                {/* Solusi */}
                                {doc.solutions && (
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <Lightbulb size={12} className="text-emerald-400" />
                                      <span className={cn("text-[10px] font-black uppercase tracking-widest", C.sub)}>Solusi</span>
                                    </div>
                                    <p className={cn("text-[13px] leading-relaxed font-medium pl-5", C.text)}>{doc.solutions}</p>
                                  </div>
                                )}


                                {/* Footer actions */}
                                <div className={cn("flex items-center justify-between pt-2 border-t", C.border)}>
                                  <span className={cn("text-[10px] font-medium", C.sub)}>
                                    Task ID: <span className="font-black">{doc.taskId.slice(0, 10)}</span>
                                  </span>
                                  <div className="flex items-center gap-3">
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleGeneratePdf(doc); }}
                                      disabled={isGeneratingPdf === doc.id}
                                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-[10px] font-bold shadow-md hover:scale-105 transition-all disabled:opacity-50"
                                      style={{ background: 'linear-gradient(135deg, #3FA9F5, #2D7FEA)' }}
                                    >
                                      {isGeneratingPdf === doc.id ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                                      Laporan PDF (AI)
                                    </button>
                                    {onDelete && (
                                      <button
                                        onClick={() => { onDelete(doc.id); }}
                                        className="flex items-center gap-1 text-[10px] font-bold text-rose-400 hover:text-rose-500 transition-colors"
                                      >
                                        <Trash2 size={10} /> Hapus
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Footer ── */}
        {mode === 'view' && taskDocs.length > 0 && (
          <div className={cn("px-6 py-4 border-t shrink-0", C.border)}>
            <button
              onClick={() => setMode('add')}
              className="w-full py-3.5 rounded-2xl text-white text-[11px] font-black uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 hover:scale-[1.01] transition-all"
              style={{ background: 'linear-gradient(135deg, #3FA9F5, #2D7FEA)', boxShadow: '0 6px 20px rgba(63,169,245,0.3)' }}
            >
              <Plus size={14} strokeWidth={3} /> Tambah Dokumentasi Baru
            </button>
          </div>
        )}
      </motion.aside>
    </>
  );
};
