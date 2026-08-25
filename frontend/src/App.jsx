import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Search, Scissors, Download, Loader2, AlertCircle, CheckCircle,
  Tv, Camera, Hash, Music, Globe, Image as ImageIcon,
  Sun, Moon, Clock, Volume2, RefreshCw, Play, Sparkles,
  Clipboard, X, Zap, ChevronRight, Share2, Film, ShieldCheck
} from 'lucide-react';

const getBackendUrl = () => {
  const envUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) || '';
  if (envUrl && typeof envUrl === 'string' && !envUrl.includes('vercel.app') && !envUrl.includes('localhost')) {
    return envUrl.replace(/\/+$/, '');
  }
  return 'https://convertallsosmed-production.up.railway.app';
};

const API = getBackendUrl();

/* ---- 7 Platform Sosial Media ---------------------------------------------- */
const PLATFORMS = [
  { key: 'youtube',   name: 'YouTube',   jpName: 'ユーチューブ', logo: '/logos/logo_youtube.png',   color: '#EF4444', badgeClass: 'bg-red-500/10 text-red-500 border-red-500/30', match: (u) => /youtube\.com|youtu\.be/.test(u) },
  { key: 'tiktok',    name: 'TikTok',    jpName: 'ティックトック', logo: '/logos/logo_tiktok.png',    color: '#06B6D4', badgeClass: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/30', match: (u) => /tiktok\.com/.test(u) },
  { key: 'douyin',    name: 'Douyin',    jpName: '抖音',         logo: '/logos/logo_douyin.png',    color: '#EC4899', badgeClass: 'bg-pink-500/10 text-pink-500 border-pink-500/30', match: (u) => /douyin\.com/.test(u) },
  { key: 'instagram', name: 'Instagram', jpName: 'インスタグラム', logo: '/logos/logo_instagram.png', color: '#D946EF', badgeClass: 'bg-fuchsia-500/10 text-fuchsia-500 border-fuchsia-500/30', match: (u) => /instagram\.com/.test(u) },
  { key: 'facebook',  name: 'Facebook',  jpName: 'フェイスブック', logo: '/logos/logo_facebook.png',  color: '#3B82F6', badgeClass: 'bg-blue-500/10 text-blue-500 border-blue-500/30', match: (u) => /facebook\.com|fb\.watch/.test(u) },
  { key: 'x',         name: 'X / Twitter',jpName: 'ツイッター',    logo: '/logos/logo_x.png',         color: '#8B5CF6', badgeClass: 'bg-purple-500/10 text-purple-500 border-purple-500/30', match: (u) => /twitter\.com|x\.com/.test(u) },
  { key: 'rednote',   name: 'Rednote',   jpName: '小紅書',       logo: '/logos/logo_rednote.png',   color: '#F43F5E', badgeClass: 'bg-rose-500/10 text-rose-500 border-rose-500/30', match: (u) => /xiaohongshu\.com|xhslink|rednote/.test(u) },
];

const platformOf = (url) => PLATFORMS.find((p) => p.match(url || '')) || null;

const fmt = (s) => {
  if (!Number.isFinite(s)) return '00:00';
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = Math.floor(s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
};

const fmtPrecise = (s) => {
  if (!Number.isFinite(s)) return '00:00.0';
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = Math.floor(s % 60).toString().padStart(2, '0');
  const tenths = Math.floor((s % 1) * 10);
  return `${m}:${sec}.${tenths}`;
};

const humanBytes = (n) => {
  if (!Number.isFinite(n)) return '';
  const u = ['B', 'KB', 'MB', 'GB'];
  let v = n, i = 0;
  while (v >= 1024 && i < u.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(i === 0 ? 0 : 1)} ${u[i]}`;
};

const initialTheme = () => {
  try {
    const saved = localStorage.getItem('cuplik-theme');
    if (saved === 'dark' || saved === 'light') return saved;
  } catch (_) {}
  return 'dark'; // Aesthetic Anime Modern Default Dark
};

const fmtEstRemaining = (ms, clipLen = 10) => {
  const totalEstSec = Math.max(3, Math.min(18, Math.ceil(clipLen * 0.2)));
  const elapsedSec = Math.floor(ms / 1000);
  const remSec = totalEstSec - elapsedSec;
  if (remSec <= 0) {
    return 'Hampir Selesai…';
  }
  if (remSec >= 60) {
    const mins = Math.ceil(remSec / 60);
    return `~${mins} Menit`;
  }
  return `~${remSec} Detik`;
};

const fmtElapsed = (ms) => {
  if (!ms || ms <= 0) return '00:00.0s';
  const totalSec = Math.floor(ms / 1000);
  const mins = Math.floor(totalSec / 60).toString().padStart(2, '0');
  const secs = (totalSec % 60).toString().padStart(2, '0');
  const tenths = Math.floor((ms % 1000) / 100);
  return `${mins}:${secs}.${tenths}s`;
};

export default function App() {
  const [theme, setTheme] = useState(initialTheme);
  const [url, setUrl] = useState('');
  const [state, setState] = useState('idle'); // idle | parsing | preview | processing | downloading | error
  const [error, setError] = useState('');
  const [videoError, setVideoError] = useState(false);
  const [isVertical, setIsVertical] = useState(false);
  const [toast, setToast] = useState('');
  const [prog, setProg] = useState(null);

  const [video, setVideo] = useState({ title: '', thumbnail: '', streamUrl: '', duration: 0, qualities: [] });
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);
  const [now, setNow] = useState(0);
  const [format, setFormat] = useState('mp4'); // mp4 | mp3
  const [resolution, setResolution] = useState('best');
  const [elapsedMs, setElapsedMs] = useState(0);

  const videoRef = useRef(null);
  const trackRef = useRef(null);
  const dragRef = useRef(null);
  const dark = theme === 'dark';

  // Timer live pemrosesan unduhan
  useEffect(() => {
    if (state !== 'processing' && state !== 'downloading') {
      return;
    }
    const startT = Date.now();
    setElapsedMs(0);
    const interval = setInterval(() => {
      setElapsedMs(Date.now() - startT);
    }, 100);
    return () => clearInterval(interval);
  }, [state]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    document.body.className = dark ? 'dark' : 'light';
    try { localStorage.setItem('cuplik-theme', theme); } catch (_) {}
  }, [dark, theme]);

  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute('translate', 'no');
    html.classList.add('notranslate');
    if (!document.querySelector('meta[name="google"]')) {
      const meta = document.createElement('meta');
      meta.name = 'google';
      meta.content = 'notranslate';
      document.head.appendChild(meta);
    }
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(''), 3500);
    return () => clearTimeout(id);
  }, [toast]);

  // Preview video memutar tepat di dalam rentang potong
  useEffect(() => {
    const v = videoRef.current;
    if (!v || state !== 'preview') return;
    const onTime = () => {
      setNow(v.currentTime);
      if (v.currentTime >= end) v.currentTime = start;
      if (v.currentTime < start - 0.3) v.currentTime = start;
    };
    v.addEventListener('timeupdate', onTime);
    return () => v.removeEventListener('timeupdate', onTime);
  }, [start, end, state]);

  const active = platformOf(url);
  const busy = state === 'processing' || state === 'downloading';

  const resOptions = useMemo(() => {
    const opts = [{ label: '✨ Kualitas Asli Tertinggi (Source Best)', value: 'best' }];
    (video.qualities || []).forEach((q) => opts.push({ label: `🎬 ${q.label}`, value: String(q.height) }));
    return opts;
  }, [video.qualities]);

  const streamSrc = useMemo(
    () => (video.streamUrl ? `${API}/api/stream?url=${encodeURIComponent(video.streamUrl)}` : undefined),
    [video.streamUrl],
  );

  const seek = (t) => { if (videoRef.current) videoRef.current.currentTime = t; };

  /* ---- Timeline potong pointer (Mouse & Touch HP) ------------------------ */
  const posToTime = (clientX) => {
    const el = trackRef.current;
    if (!el || !video.duration) return 0;
    const r = el.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    return ratio * video.duration;
  };

  const applyDrag = (t) => {
    if (dragRef.current === 'start') {
      const v = Math.max(0, Math.min(Number(t.toFixed(2)), end - 0.2));
      setStart(v); seek(v);
    } else if (dragRef.current === 'end') {
      const v = Math.min(video.duration, Math.max(Number(t.toFixed(2)), start + 0.2));
      setEnd(v); seek(v);
    }
  };

  const beginDrag = (e) => {
    if (busy || !video.duration) return;
    const t = posToTime(e.clientX);
    dragRef.current = Math.abs(t - start) <= Math.abs(t - end) ? 'start' : 'end';
    try { trackRef.current.setPointerCapture(e.pointerId); } catch (_) {}
    applyDrag(t);
  };

  const moveDrag = (e) => { if (dragRef.current) applyDrag(posToTime(e.clientX)); };
  const endDrag = (e) => {
    dragRef.current = null;
    try { trackRef.current.releasePointerCapture(e.pointerId); } catch (_) {}
  };

  const nudge = (which, d) => {
    if (which === 'start') {
      const v = Math.max(0, Math.min(Number((start + d).toFixed(2)), end - 0.2));
      setStart(v); seek(v);
    } else {
      const v = Math.min(video.duration, Math.max(Number((end + d).toFixed(2)), start + 0.2));
      setEnd(v); seek(v);
    }
  };

  const markStart = () => setStart(Math.max(0, Math.min(Number(now.toFixed(2)), end - 0.2)));
  const markEnd = () => setEnd(Math.min(video.duration, Math.max(Number(now.toFixed(2)), start + 0.2)));

  const setPreset = (sec) => {
    if (!video.duration) return;
    const targetEnd = Math.min(video.duration, start + sec);
    setEnd(Number(targetEnd.toFixed(2)));
  };

  const resetTrim = () => {
    setStart(0);
    setEnd(video.duration);
    seek(0);
  };

  const handlePaste = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setUrl(text.trim());
          setToast('Tautan berhasil ditempel dari clipboard!');
        }
      }
    } catch (_) {}
  };

  const fetchInfo = async () => {
    if (!url.trim()) return;
    setState('parsing'); setError(''); setVideoError(false);
    try {
      const r = await fetch(`${API}/api/info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      const rawText = await r.text();
      let j = {};
      try {
        j = JSON.parse(rawText);
      } catch (_) {
        if (!r.ok) {
          throw new Error(`Server Backend Error (${r.status}): ${rawText.slice(0, 100)}`);
        }
        throw new Error('Respon dari server tidak valid.');
      }
      if (!r.ok) throw new Error(j.detail || j.message || 'Tautan gagal dibaca oleh server.');
      const d = j.data;
      if (!d) throw new Error('Data media tidak ditemukan.');
      const dur = d.duration || 60;
      setVideo({
        title: d.title || 'Video Media',
        thumbnail: d.thumbnail,
        streamUrl: d.direct_url,
        duration: dur,
        qualities: d.qualities || []
      });
      setStart(0); setEnd(dur); setNow(0); setResolution('best');
      setState('preview');
    } catch (e) {
      setError(mapNetErr(e)); setState('error');
    }
  };

  const download = async () => {
    setState('processing'); setError(''); setProg(null);
    try {
      const r = await fetch(`${API}/api/process`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: url.trim(),
          start_time: Number(start.toFixed(2)),
          end_time: Number(end.toFixed(2)),
          format,
          resolution: format === 'mp4' ? resolution : 'best',
        }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.detail || 'Server gagal memproses klip media.');
      }

      let blob;
      if (r.body && r.body.getReader) {
        const total = Number(r.headers.get('Content-Length')) || 0;
        const reader = r.body.getReader();
        const chunks = [];
        let loaded = 0;
        setState('downloading'); setProg({ loaded: 0, total });
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value); loaded += value.length;
          setProg({ loaded, total });
        }
        blob = new Blob(chunks);
      } else {
        blob = await r.blob();
      }

      const href = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = href;
      a.download = `Cuplik_${fmt(start).replace(':', '-')}_${fmt(end).replace(':', '-')}.${format}`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(href);
      setState('preview'); setProg(null);
      setToast(`✨ Berhasil diunduh dalam ${fmtElapsed(elapsedMs)}!`);
    } catch (e) {
      setError(mapNetErr(e)); setState('error'); setProg(null);
    }
  };

  const clipLen = Math.max(0, Math.floor(end - start));
  const pct = (t) => (video.duration ? (t / video.duration) * 100 : 0);
  const progPct = prog && prog.total ? Math.round((prog.loaded / prog.total) * 100) : null;

  const displayPct = useMemo(() => {
    if (state === 'processing') {
      return Math.min(88, Math.floor((elapsedMs / 2200) * 88));
    }
    if (state === 'downloading') {
      if (progPct !== null) {
        return Math.max(88, Math.min(100, Math.floor(88 + (progPct * 0.12))));
      }
      return 96;
    }
    return 0;
  }, [state, elapsedMs, progPct]);

  // Est size calc
  const estSizeMb = useMemo(() => {
    if (format === 'mp3') {
      return ((clipLen * 320) / (8 * 1024)).toFixed(1);
    }
    return ((clipLen * 2.2) / 8).toFixed(1);
  }, [clipLen, format]);

  return (
    <div translate="no" className="notranslate relative min-h-screen anime-modern-bg selection:bg-rose-500 selection:text-white pb-28">
      {/* Anime Glowing Mesh Orb */}
      <div className="anime-hero-orb" aria-hidden="true" />

      {/* Header Aesthetic Anime Modern */}
      <header className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-5 sm:pt-8 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
          <div className="relative flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-rose-500 via-purple-600 to-cyan-500 text-white shadow-xl shadow-rose-500/20 border border-white/20 hover:scale-105 transition-transform cursor-pointer shrink-0">
            <Scissors size={20} className="rotate-[-10deg]" />
            <Sparkles size={13} className="absolute -top-1 -right-1 text-amber-300 animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-display text-xl sm:text-2xl font-black tracking-tight bg-gradient-to-r from-rose-500 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Cuplik
              </span>
              <span className="hidden xs:inline-flex px-2 sm:px-2.5 py-0.5 text-[9px] sm:text-[10px] font-mono font-bold uppercase rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 tracking-wider">
                PRO 3.0
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] font-mono text-slate-500 dark:text-slate-400 tracking-wider truncate">
              Multi-Platform Video Trimmer
            </p>
          </div>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={() => setTheme(dark ? 'light' : 'dark')}
          aria-label="Ganti tema tampilan"
          className="p-2 sm:p-2.5 px-2.5 sm:px-3.5 rounded-xl sm:rounded-2xl glass-anime-card text-slate-700 dark:text-slate-200 hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-semibold shadow-sm shrink-0"
        >
          {dark ? (
            <>
              <Sun size={15} className="text-amber-400 animate-spin-slow" />
              <span className="hidden sm:inline font-mono">Light Mode</span>
            </>
          ) : (
            <>
              <Moon size={15} className="text-purple-600" />
              <span className="hidden sm:inline font-mono">Dark Mode</span>
            </>
          )}
        </button>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 max-w-5xl mx-auto px-3.5 sm:px-6 pt-6 sm:pt-8">
        <section className="text-center max-w-3xl mx-auto pb-4 sm:pb-6">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-400 text-[11px] sm:text-xs font-mono mb-3 sm:mb-4 shadow-sm backdrop-blur-md">
            <Zap size={13} className="text-amber-400 shrink-0" /> 7 Platform Studio Edition · Frame-Accurate
          </div>

          <h1 className="font-display text-2xl sm:text-4xl md:text-5xl font-black tracking-tight leading-[1.2] px-1">
            Potong & Unduh Video Sosmed{' '}
            <span className="bg-gradient-to-r from-rose-500 via-purple-500 to-cyan-400 bg-clip-text text-transparent">
              Ultra Presisi
            </span>
          </h1>
          <p className="mt-2.5 sm:mt-3 text-slate-600 dark:text-slate-300 text-xs sm:text-sm md:text-base max-w-xl mx-auto leading-relaxed px-2">
            Dukungan penuh untuk YouTube, TikTok, Douyin, Instagram, Rednote, Facebook, & X. Ekstraksi instan tanpa watermark.
          </p>

          {/* Interactive Hero Input Bar */}
          <div className="mt-6 sm:mt-8 relative max-w-2xl mx-auto">
            <div className="relative flex items-center glass-anime-card rounded-xl sm:rounded-2xl p-1 sm:p-1.5 border border-rose-500/25 focus-within:border-rose-500 focus-within:ring-4 focus-within:ring-rose-500/15 transition-all shadow-xl">
              <span className="pl-2.5 sm:pl-3.5 pr-1 sm:pr-2 shrink-0">
                {active ? (
                  <img src={active.logo} className="w-5 h-5 sm:w-6 sm:h-6 rounded-md object-cover shadow-sm animate-pulse" alt={active.name} />
                ) : (
                  <Search size={18} className="text-slate-400 dark:text-slate-500" />
                )}
              </span>

              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchInfo()}
                placeholder="Tempel tautan video (YouTube, TikTok, IG, Douyin, FB, X...)"
                className="w-full py-2.5 sm:py-3.5 px-1 sm:px-2 text-xs sm:text-sm font-medium bg-transparent text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none min-w-0"
              />

              {/* Quick Clear or Paste Buttons */}
              <div className="flex items-center gap-1 sm:gap-1.5 pr-1 shrink-0">
                {url ? (
                  <button
                    onClick={() => { setUrl(''); setState('idle'); }}
                    className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors"
                    title="Hapus tautan"
                  >
                    <X size={15} />
                  </button>
                ) : (
                  <button
                    onClick={handlePaste}
                    className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-lg sm:rounded-xl text-xs font-mono font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition"
                    title="Tempel dari Clipboard"
                  >
                    <Clipboard size={13} /> Tempel
                  </button>
                )}

                <button
                  onClick={fetchInfo}
                  disabled={state === 'parsing' || !url.trim()}
                  className="btn-anime-gradient px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm text-white shadow-md shadow-rose-500/25 transition-all disabled:opacity-40 flex items-center gap-1 sm:gap-1.5 active:scale-95 shrink-0"
                >
                  {state === 'parsing' ? (
                    <>
                      <Loader2 className="animate-spin text-white" size={15} />
                      <span className="font-mono text-[11px] sm:text-xs">Memproses</span>
                    </>
                  ) : (
                    <>
                      <span>Ambil</span>
                      <Play size={13} className="fill-current" />
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 7 Platform Badges with Japanese Subtitles */}
            <div className="mt-3.5 sm:mt-4 flex flex-wrap justify-center gap-1.5 sm:gap-2 px-1">
              {PLATFORMS.map((p) => {
                const on = active?.key === p.key;
                return (
                  <div
                    key={p.key}
                    className={`inline-flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs font-semibold px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl border backdrop-blur-md transition-all duration-200 ${
                      on
                        ? `${p.badgeClass} ring-2 ring-rose-500/60 scale-105 shadow-md`
                        : 'bg-white/60 dark:bg-slate-900/60 border-slate-200/70 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-rose-400/40'
                    }`}
                  >
                    <img src={p.logo} className="w-3.5 h-3.5 rounded-sm object-cover" alt={p.name} />
                    <span>{p.name}</span>
                    <span className="hidden xs:inline text-[9px] opacity-60 font-mono">({p.jpName})</span>
                  </div>
                );
              })}
            </div>

            {/* Top Responsive Ad Placement */}
            <div className="mt-6">
              <div className="hidden md:block">
                <AdBanner728 />
              </div>
              <div className="block md:hidden">
                <AdBanner300 />
              </div>
            </div>
          </div>
        </section>

        {/* Error Alert Box */}
        {state === 'error' && (
          <div className="anim-fade-up max-w-2xl mx-auto mb-6 sm:mb-8 flex items-start gap-3 rounded-xl sm:rounded-2xl border border-rose-500/40 bg-rose-500/10 p-3.5 sm:p-4.5 text-xs sm:text-sm text-rose-700 dark:text-rose-300 backdrop-blur-xl shadow-lg">
            <AlertCircle size={18} className="shrink-0 mt-0.5 text-rose-500" />
            <div className="min-w-0">
              <p className="font-bold text-rose-600 dark:text-rose-400">Gagal Mengambil Video</p>
              <p className="mt-0.5 break-words leading-relaxed opacity-90">{error}</p>
            </div>
          </div>
        )}

        {/* Workspace Preview & Trimming Controls */}
        {(state === 'preview' || busy) && (
          <section className="anim-fade-up grid lg:grid-cols-5 gap-4 sm:gap-6 max-w-5xl mx-auto">
            {/* Player Column */}
            <div className="lg:col-span-3 space-y-3.5 sm:space-y-4">
              <div className={`glass-anime-card rounded-xl sm:rounded-2xl overflow-hidden relative bg-black shadow-2xl transition-all duration-300 ${isVertical ? 'max-w-[270px] sm:max-w-xs md:max-w-sm mx-auto' : 'w-full'}`}>
                {/* Header status bar */}
                <div className="px-3.5 sm:px-4 py-2 bg-slate-900/90 border-b border-white/10 flex items-center justify-between text-[11px] sm:text-xs font-mono text-slate-300">
                  <span className="flex items-center gap-1.5 sm:gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    LIVE PREVIEW
                  </span>
                  {active && <span className="font-semibold text-cyan-400">{active.name}</span>}
                </div>

                {videoError ? (
                  <div className="p-6 sm:p-8 text-center space-y-2.5 sm:space-y-3 bg-slate-900/95 flex flex-col items-center justify-center min-h-[220px] sm:min-h-[260px]">
                    <AlertCircle size={32} className="text-rose-400 animate-bounce" />
                    <p className="text-xs sm:text-sm font-semibold text-slate-100">
                      Stream preview langsung dibatasi oleh protokol keamanan CDN.
                    </p>
                    <p className="text-[11px] sm:text-xs text-slate-400 max-w-xs leading-relaxed">
                      Anda tetap dapat memotong dan mengunduh video ini secara frame-accurate via server!
                    </p>
                    <button
                      onClick={fetchInfo}
                      className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg sm:rounded-xl bg-rose-500/20 text-rose-200 border border-rose-400/30 text-xs font-bold hover:bg-rose-500/30 transition"
                    >
                      <RefreshCw size={13} /> Coba Muat Ulang
                    </button>
                  </div>
                ) : (
                  <video
                    ref={videoRef}
                    src={streamSrc}
                    poster={video.thumbnail}
                    controls
                    playsInline
                    preload="metadata"
                    onLoadedMetadata={(e) => {
                      const v = e.target;
                      if (v.videoWidth && v.videoHeight) {
                        setIsVertical(v.videoHeight > v.videoWidth);
                      }
                      if (v.duration && Number.isFinite(v.duration) && v.duration > 0) {
                        const trueDur = Number(v.duration.toFixed(2));
                        setVideo((prev) => ({ ...prev, duration: trueDur }));
                        setEnd((prevEnd) => {
                          if (prevEnd <= 0 || prevEnd === video.duration || prevEnd > trueDur || Math.abs(prevEnd - 30) < 0.1 || Math.abs(prevEnd - 60) < 0.1) {
                            return trueDur;
                          }
                          return prevEnd;
                        });
                      }
                    }}
                    onDurationChange={(e) => {
                      const v = e.target;
                      if (v.duration && Number.isFinite(v.duration) && v.duration > 0) {
                        const trueDur = Number(v.duration.toFixed(2));
                        setVideo((prev) => ({ ...prev, duration: trueDur }));
                        setEnd((prevEnd) => {
                          if (prevEnd <= 0 || prevEnd === video.duration || prevEnd > trueDur || Math.abs(prevEnd - 30) < 0.1 || Math.abs(prevEnd - 60) < 0.1) {
                            return trueDur;
                          }
                          return prevEnd;
                        });
                      }
                    }}
                    onTimeUpdate={(e) => {
                      setNow(e.target.currentTime);
                    }}
                    onError={() => setVideoError(true)}
                    className={`w-full bg-black object-contain transition-all duration-300 ${isVertical ? 'max-h-[46vh] sm:max-h-[56vh] mx-auto' : 'max-h-[38vh] sm:max-h-[48vh] lg:max-h-[56vh]'}`}
                  />
                )}
              </div>

              {/* Title & Metadata Card */}
              <div className="glass-anime-card p-3.5 sm:p-4 rounded-xl sm:rounded-2xl flex items-start gap-3 sm:gap-3.5">
                {active && (
                  <span className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-rose-500/10 border border-rose-500/20 shrink-0">
                    <img src={active.logo} className="w-4 h-4 sm:w-5 sm:h-5 rounded-md object-cover shadow-sm" alt={active.name} />
                  </span>
                )}
                <div className="min-w-0">
                  <h2 className="font-bold text-slate-800 dark:text-slate-100 text-xs sm:text-sm md:text-base leading-snug break-words line-clamp-2">
                    {video.title}
                  </h2>
                  <div className="mt-2 flex flex-wrap items-center gap-2.5 sm:gap-3.5 text-[11px] sm:text-xs font-mono text-slate-500 dark:text-slate-400">
                    <span className="inline-flex items-center gap-1">
                      <Clock size={13} className="text-rose-500" /> Total: {fmt(video.duration)}
                    </span>
                    <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-bold">
                      <Scissors size={13} /> Potongan: {fmt(clipLen)}
                    </span>
                    <span className="inline-flex items-center gap-1 text-cyan-600 dark:text-cyan-400 font-semibold">
                      <Film size={13} /> ~{estSizeMb} MB
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Trimmer Controls Column */}
            <div className="lg:col-span-2 space-y-3.5 sm:space-y-4">
              {/* Card Trimmer */}
              <div className="glass-anime-card p-4 sm:p-5 rounded-xl sm:rounded-2xl space-y-3.5 sm:space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] sm:text-xs font-mono font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                    <Scissors size={13} /> RENTANG POTONG
                  </span>
                  <span className="text-[11px] sm:text-xs font-mono font-bold px-2 sm:px-2.5 py-0.5 rounded-md sm:rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                    {fmt(clipLen)}
                  </span>
                </div>

                {/* Filmstrip Trimmer Track */}
                <div
                  ref={trackRef}
                  onPointerDown={beginDrag}
                  onPointerMove={moveDrag}
                  onPointerUp={endDrag}
                  onPointerCancel={endDrag}
                  className="filmstrip-track relative h-16 sm:h-20 rounded-lg sm:rounded-xl border border-slate-300 dark:border-white/15 overflow-hidden cursor-pointer bg-slate-100 dark:bg-[#0A0E1A] shadow-inner"
                  style={{ touchAction: 'none' }}
                >
                  {/* Selected Region */}
                  <div
                    className="absolute top-0 bottom-0 bg-gradient-to-r from-rose-500/25 via-purple-500/25 to-cyan-500/25 border-x-2 border-rose-400 pointer-events-none"
                    style={{ left: `${pct(start)}%`, right: `${100 - pct(end)}%` }}
                  />
                  {/* Playhead Indicator */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-amber-400 pointer-events-none z-10 shadow-[0_0_10px_#f59e0b]"
                    style={{ left: `${pct(now)}%` }}
                  />
                  {/* Start Handle */}
                  <div
                    role="slider"
                    tabIndex={0}
                    aria-label="Waktu mulai"
                    aria-valuemin={0}
                    aria-valuemax={Math.floor(video.duration)}
                    aria-valuenow={Math.floor(start)}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowLeft') nudge('start', -1);
                      if (e.key === 'ArrowRight') nudge('start', 1);
                    }}
                    className="absolute top-0 bottom-0 w-9 sm:w-8 -translate-x-1/2 flex items-center justify-center outline-none group z-20 cursor-ew-resize"
                    style={{ left: `${pct(start)}%` }}
                  >
                    <span className="w-3 sm:w-3.5 h-10 sm:h-12 rounded-full bg-gradient-to-b from-rose-400 to-rose-600 border-2 border-white shadow-lg group-hover:scale-110 active:scale-115 transition-transform" />
                  </div>
                  {/* End Handle */}
                  <div
                    role="slider"
                    tabIndex={0}
                    aria-label="Waktu selesai"
                    aria-valuemin={0}
                    aria-valuemax={Math.floor(video.duration)}
                    aria-valuenow={Math.floor(end)}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowLeft') nudge('end', -1);
                      if (e.key === 'ArrowRight') nudge('end', 1);
                    }}
                    className="absolute top-0 bottom-0 w-9 sm:w-8 -translate-x-1/2 flex items-center justify-center outline-none group z-20 cursor-ew-resize"
                    style={{ left: `${pct(end)}%` }}
                  >
                    <span className="w-3 sm:w-3.5 h-10 sm:h-12 rounded-full bg-gradient-to-b from-cyan-400 to-purple-600 border-2 border-white shadow-lg group-hover:scale-110 active:scale-115 transition-transform" />
                  </div>
                </div>

                {/* Display Mulai - Selesai Cards */}
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <div className="bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-lg sm:rounded-xl p-2.5 sm:p-3 min-w-0">
                    <div className="text-[9px] sm:text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 truncate">Mulai (Start)</div>
                    <div className="font-mono text-base sm:text-xl font-bold text-rose-600 dark:text-rose-400 mt-0.5">{fmtPrecise(start)}</div>
                    {/* Micro nudge buttons */}
                    <div className="grid grid-cols-4 gap-0.5 sm:gap-1 mt-1.5 sm:mt-2">
                      <button onClick={() => nudge('start', -1)} className="py-1 text-[9px] sm:text-[10px] font-mono font-bold bg-slate-200 dark:bg-slate-800 rounded hover:bg-rose-500 hover:text-white transition text-center">-1s</button>
                      <button onClick={() => nudge('start', -0.1)} className="py-1 text-[9px] sm:text-[10px] font-mono font-bold bg-slate-200 dark:bg-slate-800 rounded hover:bg-rose-500 hover:text-white transition text-center">-.1</button>
                      <button onClick={() => nudge('start', 0.1)} className="py-1 text-[9px] sm:text-[10px] font-mono font-bold bg-slate-200 dark:bg-slate-800 rounded hover:bg-rose-500 hover:text-white transition text-center">+.1</button>
                      <button onClick={() => nudge('start', 1)} className="py-1 text-[9px] sm:text-[10px] font-mono font-bold bg-slate-200 dark:bg-slate-800 rounded hover:bg-rose-500 hover:text-white transition text-center">+1s</button>
                    </div>
                  </div>

                  <div className="bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-lg sm:rounded-xl p-2.5 sm:p-3 min-w-0">
                    <div className="text-[9px] sm:text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 truncate">Selesai (End)</div>
                    <div className="font-mono text-base sm:text-xl font-bold text-cyan-600 dark:text-cyan-400 mt-0.5">{fmtPrecise(end)}</div>
                    {/* Micro nudge buttons */}
                    <div className="grid grid-cols-4 gap-0.5 sm:gap-1 mt-1.5 sm:mt-2">
                      <button onClick={() => nudge('end', -1)} className="py-1 text-[9px] sm:text-[10px] font-mono font-bold bg-slate-200 dark:bg-slate-800 rounded hover:bg-cyan-500 hover:text-white transition text-center">-1s</button>
                      <button onClick={() => nudge('end', -0.1)} className="py-1 text-[9px] sm:text-[10px] font-mono font-bold bg-slate-200 dark:bg-slate-800 rounded hover:bg-cyan-500 hover:text-white transition text-center">-.1</button>
                      <button onClick={() => nudge('end', 0.1)} className="py-1 text-[9px] sm:text-[10px] font-mono font-bold bg-slate-200 dark:bg-slate-800 rounded hover:bg-cyan-500 hover:text-white transition text-center">+.1</button>
                      <button onClick={() => nudge('end', 1)} className="py-1 text-[9px] sm:text-[10px] font-mono font-bold bg-slate-200 dark:bg-slate-800 rounded hover:bg-cyan-500 hover:text-white transition text-center">+1s</button>
                    </div>
                  </div>
                </div>

                {/* Mark Now Buttons */}
                <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                  <button
                    onClick={markStart}
                    className="text-[11px] sm:text-xs font-semibold rounded-lg sm:rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300 py-2 px-1 text-center truncate hover:bg-rose-500/20 transition"
                  >
                    Tandai Mulai [{fmt(now)}]
                  </button>
                  <button
                    onClick={markEnd}
                    className="text-[11px] sm:text-xs font-semibold rounded-lg sm:rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 py-2 px-1 text-center truncate hover:bg-cyan-500/20 transition"
                  >
                    Tandai Selesai [{fmt(now)}]
                  </button>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap pt-0.5 sm:pt-1">
                  <span className="text-[9px] sm:text-[10px] font-mono text-slate-400 uppercase">Preset:</span>
                  {[
                    { label: '15s', sec: 15 },
                    { label: '30s', sec: 30 },
                    { label: '60s', sec: 60 },
                  ].map((p) => (
                    <button
                      key={p.label}
                      onClick={() => setPreset(p.sec)}
                      className="px-2 sm:px-2.5 py-1 text-[10px] sm:text-xs font-mono font-medium rounded-md sm:rounded-lg bg-slate-200/60 dark:bg-slate-800/60 hover:bg-rose-500 hover:text-white dark:hover:bg-rose-500 transition"
                    >
                      {p.label}
                    </button>
                  ))}
                  <button
                    onClick={resetTrim}
                    className="ml-auto px-2 py-1 text-[10px] sm:text-xs font-mono text-slate-400 hover:text-rose-500 transition"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Format & Resolusi Selector */}
              <div className="glass-anime-card p-4 sm:p-5 rounded-xl sm:rounded-2xl space-y-3.5 sm:space-y-4">
                <span className="block text-[11px] sm:text-xs font-mono font-bold uppercase text-rose-600 dark:text-rose-400">
                  FORMAT KELUARAN
                </span>
                <div className="grid grid-cols-2 gap-1.5 sm:gap-2 bg-slate-100 dark:bg-slate-900/90 p-1 sm:p-1.5 rounded-lg sm:rounded-xl border border-slate-200 dark:border-white/10">
                  {[
                    { v: 'mp4', label: 'MP4 Video', Icon: Tv },
                    { v: 'mp3', label: 'MP3 Audio (320k)', Icon: Volume2 },
                  ].map((f) => (
                    <button
                      key={f.v}
                      onClick={() => setFormat(f.v)}
                      className={`flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 rounded-md sm:rounded-lg text-[11px] sm:text-xs font-bold transition-all ${
                        format === f.v
                          ? 'btn-anime-gradient text-white shadow-md'
                          : 'text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400'
                      }`}
                    >
                      <f.Icon size={15} /> {f.label}
                    </button>
                  ))}
                </div>

                <div>
                  <span className="block text-[10px] sm:text-xs font-mono font-bold uppercase text-slate-500 dark:text-slate-400 mb-1.5">
                    Resolusi Video (7 Platform)
                  </span>
                  <select
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    disabled={format !== 'mp4'}
                    className="w-full rounded-lg sm:rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/15 px-3 py-2 sm:py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-rose-500/40 disabled:opacity-40 shadow-sm cursor-pointer"
                  >
                    {resOptions.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Progress Bar Kontinu (0% -> 100%) */}
              {busy && (
                <div className="glass-anime-card p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-rose-500/30 bg-rose-500/5 space-y-2.5 sm:space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-rose-600 dark:text-rose-400">
                    <span className="inline-flex items-center gap-1.5 bg-rose-500/10 px-2 sm:px-2.5 py-1 rounded-md sm:rounded-lg border border-rose-500/20 text-[11px] sm:text-xs">
                      <Clock size={13} className="text-amber-400 animate-spin-slow" /> Sisa: {fmtEstRemaining(elapsedMs, clipLen)}
                    </span>
                    <span className="font-mono text-cyan-500 dark:text-cyan-400 font-extrabold text-xs sm:text-sm">{displayPct}%</span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200">
                    <span className="inline-flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs">
                      {state === 'processing' ? (
                        <>
                          <Loader2 className="animate-spin text-rose-500 shrink-0" size={14} /> Memotong klip di server FFmpeg… ({displayPct}%)
                        </>
                      ) : (
                        <>
                          <Download size={14} className="text-cyan-400 animate-bounce shrink-0" /> Mengunduh file… {humanBytes(prog?.loaded || 0)}
                        </>
                      )}
                    </span>
                  </div>

                  {/* Visual Progress Bar Smooth */}
                  <div className="h-2.5 sm:h-3 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-900 border border-rose-500/20 p-0.5 shadow-inner">
                    <div
                      className="h-full bg-gradient-to-r from-rose-500 via-purple-500 to-cyan-400 transition-all duration-300 rounded-full shadow-md"
                      style={{ width: `${displayPct}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Download Action Button */}
              <button
                onClick={download}
                disabled={busy}
                className="w-full py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-extrabold text-xs sm:text-sm tracking-wide btn-anime-gradient text-white shadow-xl shadow-rose-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {busy ? (
                  <>
                    <Loader2 className="animate-spin text-white" size={17} />
                    <span>{state === 'downloading' ? 'Mentransfer File ke Perangkat…' : 'Sedang Memotong Media…'}</span>
                  </>
                ) : (
                  <>
                    <Download size={17} />
                    <span>UNDUH {format.toUpperCase()} ({fmt(clipLen)})</span>
                  </>
                )}
              </button>

              {/* Sidebar 300x250 Ad */}
              <div className="pt-2">
                <AdBanner300 />
              </div>
            </div>
          </section>
        )}

        {/* Native Ad Placement at the Bottom */}
        <div className="mt-8">
          <AdNativeBanner />
        </div>
      </main>

      {/* Toast Notification */}
      {toast && (
        <div className="anim-fade-up fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-rose-500 via-purple-600 to-cyan-500 text-white font-bold text-xs px-5 py-3 shadow-2xl shadow-rose-500/40 border border-white/20">
          <CheckCircle size={18} /> {toast}
        </div>
      )}
    </div>
  );
}

function mapNetErr(e) {
  const m = (e && e.message) || String(e);
  if (/Failed to fetch|NetworkError|Load failed/i.test(m)) {
    return `Tidak bisa terhubung ke backend server (${API}). Pastikan URL backend benar dan aktif.`;
  }
  if (/Video unavailable/i.test(m)) {
    return 'Video tidak ditemukan, telah dihapus, atau bersifat privat di YouTube.';
  }
  if (/Sign in to confirm you're not a bot/i.test(m)) {
    return 'YouTube meminta verifikasi bot pada server cloud. Coba tautan video lain atau platform lain (TikTok/IG).';
  }
  return m;
}

/* ---- Adsterra Monetization Components -------------------------------------- */

function AdBanner728() {
  const srcDoc = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { display: flex; justify-content: center; align-items: center; background: transparent; overflow: hidden; }
        </style>
      </head>
      <body>
        <script type="text/javascript">
          atOptions = {
            'key' : '37bfff0b33828fb26595d61a7e75f2c4',
            'format' : 'iframe',
            'height' : 90,
            'width' : 728,
            'params' : {}
          };
        </script>
        <script type="text/javascript" src="https://www.highrevenueformat.com/37bfff0b33828fb26595d61a7e75f2c4/invoke.js"></script>
      </body>
    </html>
  `;

  return (
    <div className="flex flex-col items-center justify-center my-3 overflow-hidden">
      <span className="text-[9px] font-mono tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-1">
        Sponsored Advertisement
      </span>
      <div className="w-[728px] h-[90px] max-w-full overflow-hidden flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5">
        <iframe
          title="ad-728x90"
          srcDoc={srcDoc}
          width="728"
          height="90"
          style={{ border: 'none', overflow: 'hidden' }}
          scrolling="no"
        />
      </div>
    </div>
  );
}

function AdBanner300() {
  const srcDoc = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { display: flex; justify-content: center; align-items: center; background: transparent; overflow: hidden; }
        </style>
      </head>
      <body>
        <script type="text/javascript">
          atOptions = {
            'key' : 'd9361be5c0aab62c2c81652f4e02b601',
            'format' : 'iframe',
            'height' : 250,
            'width' : 300,
            'params' : {}
          };
        </script>
        <script type="text/javascript" src="https://www.highrevenueformat.com/d9361be5c0aab62c2c81652f4e02b601/invoke.js"></script>
      </body>
    </html>
  `;

  return (
    <div className="flex flex-col items-center justify-center my-2.5 overflow-hidden">
      <span className="text-[9px] font-mono tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-1">
        Sponsored Advertisement
      </span>
      <div className="w-[300px] h-[250px] overflow-hidden flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 shadow-sm">
        <iframe
          title="ad-300x250"
          srcDoc={srcDoc}
          width="300"
          height="250"
          style={{ border: 'none', overflow: 'hidden' }}
          scrolling="no"
        />
      </div>
    </div>
  );
}

function AdNativeBanner() {
  const adRef = useRef(null);

  useEffect(() => {
    const el = adRef.current;
    if (!el || el.querySelector('script')) return;

    try {
      const invokeScript = document.createElement('script');
      invokeScript.async = true;
      invokeScript.setAttribute('data-cfasync', 'false');
      invokeScript.src = 'https://pl31025851.profitableratecpmnetwork.com/b52019ce5352c5da703df76d0a336b9a/invoke.js';

      el.appendChild(invokeScript);
    } catch (_) {}
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto my-4 px-2" ref={adRef}>
      <div className="flex items-center justify-center mb-1">
        <span className="text-[9px] font-mono tracking-widest text-slate-400 dark:text-slate-500 uppercase">
          Sponsored Content
        </span>
      </div>
      <div
        id="container-b52019ce5352c5da703df76d0a336b9a"
        className="min-h-[60px] rounded-xl overflow-hidden flex items-center justify-center bg-slate-100 dark:bg-slate-900/30 border border-slate-200 dark:border-white/5"
      />
    </div>
  );
}

