import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  Download, 
  Loader2, 
  ChevronRight, 
  PenTool, 
  User, 
  Layers, 
  Type as TypeIcon,
  CheckCircle2,
  FileText,
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import Markdown from 'react-markdown';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { generateOutline, generateChapterContent, EbookOutline } from './services/geminiService';
import { cn } from './lib/utils';
import { initializeAdMob, showBanner, showInterstitial } from './services/admobService';

interface EbookState {
  title: string;
  author: string;
  chapters: { title: string; content: string }[];
}

export default function App() {
  const [step, setStep] = useState<'input' | 'generating' | 'preview'>('input');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  
  const [formData, setFormData] = useState({
    topic: '',
    author: '',
    pageCount: 35,
    tone: 'Professional & Informative'
  });

  const [ebook, setEbook] = useState<EbookState | null>(null);
  const ebookRef = useRef<HTMLDivElement>(null);

  // Initialize AdMob
  React.useEffect(() => {
    const initAds = async () => {
      try {
        await initializeAdMob();
        await showBanner();
      } catch (e) {
        console.warn('AdMob not available in web browser mode. It will work in APK.');
      }
    };
    initAds();
  }, []);

  const handleGenerate = async () => {
    if (!formData.topic || !formData.author) return;
    
    setLoading(true);
    setStep('generating');
    setProgress(5);
    setStatus('Merancang outline eBook...');

    try {
      const outline = await generateOutline(formData);
      setProgress(15);
      setStatus(`Outline selesai: ${outline.title}`);

      const generatedChapters: { title: string; content: string }[] = [];
      let context = `Ebook Title: ${outline.title}. Topic: ${formData.topic}.`;

      for (let i = 0; i < outline.chapters.length; i++) {
        const chapter = outline.chapters[i];
        setStatus(`Menulis Bab ${i + 1}: ${chapter.title}...`);
        
        const content = await generateChapterContent({
          topic: formData.topic,
          tone: formData.tone,
          chapterTitle: chapter.title,
          subheadings: chapter.subheadings,
          context: context
        });

        generatedChapters.push({ title: chapter.title, content });
        context += ` Summary of Chapter ${i + 1}: ${chapter.title}.`;
        
        const currentProgress = 15 + ((i + 1) / outline.chapters.length) * 85;
        setProgress(Math.round(currentProgress));
      }

      setEbook({
        title: outline.title,
        author: formData.author,
        chapters: generatedChapters
      });
      setStep('preview');
      
      // Show interstitial ad after generation is complete
      try {
        await showInterstitial();
      } catch (e) {
        console.warn('Interstitial ad failed or not available');
      }
    } catch (error) {
      console.error(error);
      alert('Terjadi kesalahan saat pembuatan eBook. Silakan coba lagi.');
      setStep('input');
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = async () => {
    if (!ebookRef.current) return;
    
    setStatus('Menyiapkan PDF...');
    const pdf = new jsPDF('p', 'pt', 'a4');
    const content = ebookRef.current;
    
    // Simple export logic - for a real app we'd want to loop through pages
    // but for this demo we'll capture the preview
    const canvas = await html2canvas(content, {
      scale: 2,
      useCORS: true,
      logging: false
    });
    
    const imgData = canvas.toDataURL('image/png');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${ebook?.title || 'ebook'}.pdf`);
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center py-12 px-4">
      {/* Header */}
      <header className="max-w-4xl w-full mb-12 text-center">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-200 text-stone-600 text-xs font-medium mb-4 uppercase tracking-widest"
        >
          <Sparkles className="w-3 h-3" />
          AI-Powered Publishing
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-5xl font-serif font-bold text-stone-900 mb-4"
        >
          Aden Generator Ebook AI
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-stone-500 max-w-2xl mx-auto text-lg"
        >
          Ciptakan eBook profesional dan siap jual hanya dalam hitungan menit. 
          Cukup masukkan topik Anda, dan biarkan AI kami menulis sisanya.
        </motion.p>
      </header>

      <main className="max-w-4xl w-full">
        <AnimatePresence mode="wait">
          {step === 'input' && (
            <motion.div
              key="input"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-xl shadow-stone-200/50 border border-stone-100 p-8 md:p-12"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-stone-700 mb-2">
                      <BookOpen className="w-4 h-4 text-stone-400" />
                      Topik atau Niche
                    </label>
                    <input 
                      type="text"
                      placeholder="Contoh: Strategi Digital Marketing 2024"
                      className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-200 transition-all"
                      value={formData.topic}
                      onChange={(e) => setFormData({...formData, topic: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-stone-700 mb-2">
                      <User className="w-4 h-4 text-stone-400" />
                      Nama Penulis
                    </label>
                    <input 
                      type="text"
                      placeholder="Nama Anda"
                      className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-200 transition-all"
                      value={formData.author}
                      onChange={(e) => setFormData({...formData, author: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-stone-700 mb-2">
                      <Layers className="w-4 h-4 text-stone-400" />
                      Target Jumlah Halaman ({formData.pageCount})
                    </label>
                    <input 
                      type="range"
                      min="30"
                      max="40"
                      className="w-full h-2 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-stone-800"
                      value={formData.pageCount}
                      onChange={(e) => setFormData({...formData, pageCount: parseInt(e.target.value)})}
                    />
                    <div className="flex justify-between text-xs text-stone-400 mt-2">
                      <span>30 Halaman</span>
                      <span>40 Halaman</span>
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-stone-700 mb-2">
                      <TypeIcon className="w-4 h-4 text-stone-400" />
                      Nada & Gaya Bahasa
                    </label>
                    <select 
                      className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-200 transition-all appearance-none"
                      value={formData.tone}
                      onChange={(e) => setFormData({...formData, tone: e.target.value})}
                    >
                      <option>Professional & Informative</option>
                      <option>Casual & Friendly</option>
                      <option>Inspirational & Motivational</option>
                      <option>Technical & Deep-dive</option>
                      <option>Storytelling & Narrative</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="mt-12 pt-8 border-t border-stone-100 flex justify-center">
                <button
                  onClick={handleGenerate}
                  disabled={!formData.topic || !formData.author || loading}
                  className={cn(
                    "group relative px-8 py-4 bg-stone-900 text-white rounded-2xl font-semibold text-lg flex items-center gap-3 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100",
                    loading && "cursor-wait"
                  )}
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <PenTool className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  )}
                  Mulai Generate eBook
                </button>
              </div>
            </motion.div>
          )}

          {step === 'generating' && (
            <motion.div
              key="generating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white rounded-3xl shadow-xl p-12 text-center"
            >
              <div className="relative w-32 h-32 mx-auto mb-8">
                <div className="absolute inset-0 border-4 border-stone-100 rounded-full"></div>
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="60"
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeDasharray={377}
                    strokeDashoffset={377 - (377 * progress) / 100}
                    className="text-stone-900 transition-all duration-500 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-stone-900">
                  {progress}%
                </div>
              </div>
              <h3 className="text-xl font-semibold text-stone-800 mb-2">Sedang Menulis Karya Anda...</h3>
              <p className="text-stone-500 animate-pulse">{status}</p>
              
              <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                {[
                  { label: 'Outline & Struktur', p: 15 },
                  { label: 'Konten Bab', p: 85 },
                  { label: 'Finalisasi & Format', p: 100 }
                ].map((item, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-stone-50 border border-stone-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">{item.label}</span>
                      {progress >= item.p && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                    </div>
                    <div className="h-1 bg-stone-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-stone-900 transition-all duration-500" 
                        style={{ width: `${Math.min(100, (progress / item.p) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {step === 'preview' && ebook && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-stone-100">
                <button 
                  onClick={() => setStep('input')}
                  className="flex items-center gap-2 text-stone-500 hover:text-stone-900 transition-colors px-4 py-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Buat Baru
                </button>
                <div className="flex gap-3">
                  <button 
                    onClick={exportPDF}
                    className="flex items-center gap-2 bg-stone-900 text-white px-6 py-2 rounded-xl font-semibold hover:bg-stone-800 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Export PDF
                  </button>
                </div>
              </div>

              <div 
                ref={ebookRef}
                className="bg-white shadow-2xl rounded-sm p-12 md:p-24 min-h-[1000px] border border-stone-200"
              >
                {/* Cover Page */}
                <div className="text-center py-32 border-b-8 border-stone-900 mb-24">
                  <h1 className="text-6xl font-serif font-bold text-stone-900 mb-8 leading-tight">
                    {ebook.title}
                  </h1>
                  <div className="w-24 h-1 bg-stone-300 mx-auto mb-8"></div>
                  <p className="text-xl text-stone-500 uppercase tracking-[0.2em] font-medium">
                    Ditulis Oleh
                  </p>
                  <p className="text-3xl font-serif italic text-stone-800 mt-2">
                    {ebook.author}
                  </p>
                </div>

                {/* Table of Contents */}
                <div className="mb-24">
                  <h2 className="text-3xl font-serif font-bold mb-12 border-b pb-4">Daftar Isi</h2>
                  <div className="space-y-4">
                    {ebook.chapters.map((chapter, i) => (
                      <div key={i} className="flex justify-between items-end gap-4">
                        <span className="text-lg text-stone-700">Bab {i + 1}: {chapter.title}</span>
                        <div className="flex-1 border-b border-dotted border-stone-300 mb-1"></div>
                        <span className="text-stone-400 font-mono">{(i + 1) * 4}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Chapters */}
                <div className="ebook-content">
                  {ebook.chapters.map((chapter, i) => (
                    <div key={i} className="mb-24">
                      <div className="text-stone-400 text-sm font-mono mb-4 uppercase tracking-widest">Bab {i + 1}</div>
                      <h2 className="!mt-0">{chapter.title}</h2>
                      <Markdown>{chapter.content}</Markdown>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="mt-24 pt-8 border-t border-stone-100 text-center text-stone-400 text-sm italic">
                  &copy; {new Date().getFullYear()} {ebook.author}. Hak Cipta Dilindungi Undang-Undang.
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="mt-24 text-stone-400 text-sm flex flex-col items-center gap-4">
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> PDF Ready</span>
          <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Original Content</span>
          <span className="flex items-center gap-1"><Sparkles className="w-3 h-3" /> AI Enhanced</span>
        </div>
        <p>Aden Generator Ebook AI &bull; Solusi Penerbitan Masa Depan</p>
      </footer>
    </div>
  );
}
