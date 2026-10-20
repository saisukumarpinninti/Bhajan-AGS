import React, { useState, useEffect, useRef } from 'react';
import { 
  Home, ListMusic, Settings, Play, Plus, Trash2, Edit3, ChevronLeft, ChevronRight, 
  Check, X, Sun, Moon, Search, Share2, Download, Upload, FileText, 
  Database, Copy, RefreshCw, ArrowUp, ArrowDown, Layers, Save, 
  Sparkles, ExternalLink, HardDrive, Key, FolderDown, FileCode
} from 'lucide-react';

// Storage Keys
const LOCAL_STORAGE_KEY = 'bhajan_mandali_file_db_v1';
const ADMIN_PASSCODE_KEY = 'bhajan_mandali_admin_passcode';

const injectStyles = () => {
  if (document.getElementById('bhajan-mandali-styles')) return;
  const style = document.createElement('style');
  style.id = 'bhajan-mandali-styles';
  style.innerHTML = `
    :root {
      /* Light Theme (Devotional Warm) */
      --bg-main: #f7efe3;
      --bg-card: #ffffff;
      --bg-header: #162445;
      --text-main: #1e1e1e;
      --text-muted: #666666;
      --text-header: #ffffff;
      --highlight: #eebb4d;
      --accent: #162445;
      --accent-hover: #1e315e;
      --accent-text: #ffffff;
      --border-light: rgba(0,0,0,0.08);
      --badge-bg: #f1ebd8;
      --danger: #ef4444;
      --success: #10b981;
    }

    .dark {
      /* Dark Theme (Pastel Devotional) */
      --bg-main: #1f2732;
      --bg-card: #2c3746;
      --bg-header: #151d27;
      --text-main: #e2e8f0;
      --text-muted: #94a3b8;
      --text-header: #e2e8f0;
      --highlight: #d39393;
      --accent: #6ee7b7;
      --accent-hover: #a7f3d0;
      --accent-text: #0f172a;
      --border-light: rgba(255,255,255,0.08);
      --badge-bg: #334155;
      --danger: #f87171;
      --success: #34d399;
    }

    body {
      background-color: var(--bg-main);
      color: var(--text-main);
      margin: 0;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      overflow: hidden;
    }

    .app-root {
      display: flex;
      flex-direction: column;
      height: 100vh;
      width: 100%;
      background-color: var(--bg-main);
      transition: background-color 0.3s ease, color 0.3s ease;
    }

    .theme-card { background-color: var(--bg-card); }
    .theme-header { background-color: var(--bg-header); color: var(--text-header); }
    .theme-text { color: var(--text-main); }
    .theme-text-muted { color: var(--text-muted); }
    .theme-accent { background-color: var(--accent); color: var(--accent-text); }
    .theme-border { border-color: var(--border-light); }

    /* Edge-to-edge stanza highlight */
    .stanza-row {
      position: relative;
      padding: 16px 20px;
      margin: 0 -20px;
      cursor: pointer;
      border-radius: 12px;
      transition: all 0.2s ease;
    }
    .stanza-row:hover {
      background-color: rgba(0,0,0,0.03);
    }
    .dark .stanza-row:hover {
      background-color: rgba(255,255,255,0.03);
    }
    .stanza-row.active {
      background-color: var(--highlight);
      color: #1e1e1e !important;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    }
    
    /* Scrollbar hiding */
    .hide-scroll::-webkit-scrollbar { display: none; }
    .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }

    /* Desktop Layout */
    @media (min-width: 768px) {
      .app-root { flex-direction: row; }
      .mobile-bottom-nav { display: none !important; }
      .sidebar {
        width: 400px;
        height: 100vh;
        border-right: 1px solid var(--border-light);
        display: flex;
        flex-direction: column;
        background-color: var(--bg-main);
        z-index: 10;
        shrink: 0;
      }
      .main-content {
        flex: 1;
        height: 100vh;
        overflow-y: auto;
        background-color: var(--bg-main);
        position: relative;
      }
      .desktop-nav-tabs { display: flex; }
    }
    
    /* Mobile specific hiding */
    @media (max-width: 767px) {
      .desktop-nav-tabs { display: none; }
      .sidebar { width: 100%; height: calc(100vh - 65px); }
      .main-content { 
        position: fixed; 
        top: 0; left: 0; right: 0; bottom: 0; 
        z-index: 50; 
        background: var(--bg-main); 
        transform: translateX(100%);
        transition: transform 0.3s ease;
      }
      .main-content.open { transform: translateX(0); }
    }
  `;
  document.head.appendChild(style);
};

// Utilities
export function extractYouTubeId(urlOrId) {
  if (!urlOrId) return '';
  const trimmed = String(urlOrId).trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  return match ? match[1] : trimmed;
}

export function getBhajanThumbnail(song) {
  if (song.thumbnail && song.thumbnail.trim()) return song.thumbnail;
  const ytid = extractYouTubeId(song.videoId);
  if (ytid) return `https://img.youtube.com/vi/${ytid}/hqdefault.jpg`;
  return 'https://images.unsplash.com/photo-1594954848604-032cbbe3edb4?auto=format&fit=crop&w=150&q=80';
}

export function downloadJSONFile(data, filename) {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function extractGoogleDriveFileId(url) {
  if (!url) return null;
  const trimmed = url.trim();
  const match = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || 
                trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/) ||
                trimmed.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

// Built-in seed bhajans (fallback if assets/bhajans.json is unreachable)
const SEED_BHAJANS = [
  {
    id: "ganesha-vandana",
    titleHindi: "श्री गणेश वंदना",
    titleEng: "Shri Ganesha Vandana",
    videoId: "a0O4H-G0z8k",
    nara: "बोलो गणपति बप्पा मोरया! मंगल मूर्ति मोरया!",
    category: "Ganesha",
    thumbnail: "https://img.youtube.com/vi/a0O4H-G0z8k/hqdefault.jpg",
    hindiLyrics: [
      { text: "गजाननं भूतगणादिसेवितं कपित्थजम्बूफलचारुभक्षणम्।", repeat: 1 },
      { text: "उमासुतं शोकविनाशकारकं नमामि विघ्नेश्वरपादपंकजम्॥", repeat: 2 },
      { text: "वक्रतुण्ड महाकाय सूर्यकोटि समप्रभ।", repeat: 1 },
      { text: "निर्विघ्नं कुरु मे देव सर्वकार्येषु सर्वदा॥", repeat: 2 },
      { text: "जय गणेश जय गणेश जय गणेश देवा।", repeat: 2 },
      { text: "माता जाकी पार्वती पिता महादेवा॥", repeat: 2 }
    ],
    englishLyrics: [
      { text: "Gajananam Bhoota Ganadi Sevitam Kapittha Jambu Phala Charu Bhakshanam|", repeat: 1 },
      { text: "Uma Sutam Shoka Vinasha Karakam Namami Vighneshwara Pada Pankajam||", repeat: 2 },
      { text: "Vakratunda Mahakaya Surya Koti Samaprabha|", repeat: 1 },
      { text: "Nirvighnam Kuru Me Deva Sarva Karyeshu Sarvada||", repeat: 2 },
      { text: "Jai Ganesha Jai Ganesha Jai Ganesha Deva|", repeat: 2 },
      { text: "Mata Jaki Parvati Pita Mahadeva||", repeat: 2 }
    ]
  },
  {
    id: "achyutam-keshavam",
    titleHindi: "अच्युतम केशवम कृष्ण दामोदरम",
    titleEng: "Achyutam Keshavam Krishna Damodaram",
    videoId: "8vXG_i5d0b4",
    nara: "जय श्री राधे कृष्ण!",
    category: "Krishna",
    thumbnail: "https://img.youtube.com/vi/8vXG_i5d0b4/hqdefault.jpg",
    hindiLyrics: [
      { text: "अच्युतं केशवं कृष्ण दामोदरं राम नारायणं जानकी वल्लभम्॥", repeat: 2 },
      { text: "कौन कहते हैं भगवान आते नहीं, तुम मीरा के जैसे बुलाते नहीं॥", repeat: 2 },
      { text: "अच्युतं केशवं कृष्ण दामोदरं राम नारायणं जानकी वल्लभम्॥", repeat: 2 },
      { text: "कौन कहते हैं भगवान खाते नहीं, बेर शबरी के जैसे खिलाते नहीं॥", repeat: 2 }
    ],
    englishLyrics: [
      { text: "Achyutam Keshavam Krishna Damodaram Rama Narayanam Janaki Vallabham||", repeat: 2 },
      { text: "Kaun Kehte Hain Bhagwan Aate Nahin, Tum Meera Ke Jaise Bulate Nahin||", repeat: 2 },
      { text: "Achyutam Keshavam Krishna Damodaram Rama Narayanam Janaki Vallabham||", repeat: 2 },
      { text: "Kaun Kehte Hain Bhagwan Khaate Nahin, Ber Shabari Ke Jaise Khilate Nahin||", repeat: 2 }
    ]
  },
  {
    id: "shiv-panchakshar",
    titleHindi: "शिव पंचाक्षर स्तोत्र (नागेंद्रहाराय)",
    titleEng: "Shiv Panchakshar Stotram",
    videoId: "z1oH1bQ1m9c",
    nara: "हर हर महादेव! ॐ नमः शिवाय!",
    category: "Shiva",
    thumbnail: "https://img.youtube.com/vi/z1oH1bQ1m9c/hqdefault.jpg",
    hindiLyrics: [
      { text: "नागेन्द्रहाराय त्रिलोचनाय भस्माङ्गरागाय महेश्वराय।", repeat: 1 },
      { text: "नित्याय शुद्धाय दिगम्बराय तस्मै नकाराय नमः शिवाय॥", repeat: 2 },
      { text: "मन्दाकिनीसलिलचन्दनचर्चिताय नन्दीश्वरप्रमथनाथमहेश्वराय।", repeat: 1 },
      { text: "मन्दारमुख्यबहुपुष्पसुपूजिताय तस्मै मकाराय नमः शिवाय॥", repeat: 2 }
    ],
    englishLyrics: [
      { text: "Nagendra Haraya Trilochanaya Bhasmanga Ragaya Maheshwaraya|", repeat: 1 },
      { text: "Nityaya Shuddhaya Digambaraya Tasmai 'Na' Karaya Namah Shivaya||", repeat: 2 },
      { text: "Mandakini Salila Chandana Charchitaya Nandishwara Pramatha Natha Maheshwaraya|", repeat: 1 },
      { text: "Mandara Mukhya Bahu Pushpa Supujitaya Tasmai 'Ma' Karaya Namah Shivaya||", repeat: 2 }
    ]
  }
];

export default function App() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isStyleInjected, setIsStyleInjected] = useState(false);
  const [dataOrigin, setDataOrigin] = useState('assets'); // 'assets' | 'local'

  // Layout & View State
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'queue' | 'admin'
  const [selectedSong, setSelectedSong] = useState(null);
  
  // Session / Queue State
  const [queue, setQueue] = useState([]);
  const [sessionActive, setSessionActive] = useState(false);
  const [currentSessionIndex, setCurrentSessionIndex] = useState(0);

  // Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Admin State
  const [isAdminAuth, setIsAdminAuth] = useState(false);
  const [editingSong, setEditingSong] = useState(null); // null | 'new' | song object
  const [showExtractorModal, setShowExtractorModal] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Inject styles on mount
  useEffect(() => {
    if (!isStyleInjected) {
      injectStyles();
      setIsStyleInjected(true);
    }
  }, [isStyleInjected]);

  // Load from local storage or static assets/bhajans.json
  const loadInitialSongs = async () => {
    try {
      // 1. Check local storage cache
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSongs(parsed);
          setDataOrigin('local');
          setLoading(false);
          return parsed;
        }
      }

      // 2. Fetch directly from assets/bhajans.json
      const pathsToTry = [
        './assets/bhajans.json',
        '/Bhajan-AGS/assets/bhajans.json',
        '/assets/bhajans.json'
      ];

      for (const p of pathsToTry) {
        try {
          const res = await fetch(p);
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
              setSongs(data);
              localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
              setDataOrigin('assets');
              setLoading(false);
              return data;
            }
          }
        } catch (err) {}
      }

      // 3. Fallback
      setSongs(SEED_BHAJANS);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(SEED_BHAJANS));
      setDataOrigin('assets');
      setLoading(false);
      return SEED_BHAJANS;
    } catch (e) {
      setSongs(SEED_BHAJANS);
      setLoading(false);
      return SEED_BHAJANS;
    }
  };

  // URL query params handling (?song=id or ?queue=id1,id2)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queueParam = params.get('queue');
    const songParam = params.get('song');

    loadInitialSongs().then((loadedSongs) => {
      const pool = loadedSongs || SEED_BHAJANS;
      if (queueParam) {
        const ids = queueParam.split(',');
        const queued = pool.filter(s => ids.includes(s.id));
        if (queued.length > 0) {
          setQueue(queued);
          setActiveTab('queue');
          showToast(`Loaded ${queued.length} songs from shared session link!`);
        }
      } else if (songParam) {
        const found = pool.find(s => s.id === songParam);
        if (found) {
          setSelectedSong(found);
        }
      }
    });
  }, []);

  // Save song to state and localStorage
  const saveSong = (songData) => {
    const isNew = !songData.id;
    const id = songData.id || `bhajan_${Date.now()}`;
    const sanitizedData = { ...songData, id };

    let updatedSongs;
    if (isNew) {
      updatedSongs = [sanitizedData, ...songs];
    } else {
      updatedSongs = songs.map(s => s.id === id ? sanitizedData : s);
    }

    setSongs(updatedSongs);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedSongs));
    setDataOrigin('local');
    showToast(isNew ? "Bhajan created! Remember to export bhajans.json to save into assets folder." : "Bhajan updated successfully!");
  };

  const deleteSong = (id) => {
    if (!window.confirm("Are you sure you want to delete this Bhajan?")) return;
    const updated = songs.filter(s => s.id !== id);
    setSongs(updated);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    setQueue(queue.filter(q => q.id !== id));
    if (selectedSong && selectedSong.id === id) setSelectedSong(null);
    showToast("Bhajan deleted.");
  };

  const duplicateSong = (song) => {
    const newSong = {
      ...song,
      id: `bhajan_${Date.now()}`,
      titleHindi: `${song.titleHindi} (Copy)`,
      titleEng: `${song.titleEng} (Copy)`
    };
    saveSong(newSong);
  };

  const reloadFromAssets = async () => {
    if (!window.confirm("Reload database from assets/bhajans.json? This resets local modifications to match the files.")) return;
    setLoading(true);
    try {
      const pathsToTry = ['./assets/bhajans.json', '/Bhajan-AGS/assets/bhajans.json', '/assets/bhajans.json'];
      let loaded = null;
      for (const p of pathsToTry) {
        try {
          const res = await fetch(p);
          if (res.ok) {
            loaded = await res.json();
            break;
          }
        } catch (e) {}
      }
      if (loaded && Array.isArray(loaded)) {
        setSongs(loaded);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(loaded));
        setDataOrigin('assets');
        showToast(`Reloaded ${loaded.length} bhajans from assets/bhajans.json!`);
      } else {
        setSongs(SEED_BHAJANS);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(SEED_BHAJANS));
        showToast("Assets file not found, loaded fallback bhajans.");
      }
    } catch (e) {
      showToast("Error reloading assets.");
    } finally {
      setLoading(false);
    }
  };

  const toggleQueue = (song, e) => {
    if (e) e.stopPropagation();
    if (queue.find(q => q.id === song.id)) {
      setQueue(queue.filter(q => q.id !== song.id));
      showToast(`Removed from Queue`);
    } else {
      setQueue([...queue, song]);
      showToast(`Added "${song.titleEng || song.titleHindi}" to Queue`);
    }
  };

  const closeSongView = () => {
    setSelectedSong(null);
    setSessionActive(false);
  };

  const startSession = () => {
    if (queue.length > 0) {
      setSessionActive(true);
      setCurrentSessionIndex(0);
      setSelectedSong(queue[0]);
    }
  };

  const shareSessionLink = () => {
    if (queue.length === 0) return;
    const ids = queue.map(q => q.id).join(',');
    const url = `${window.location.origin}${window.location.pathname}?queue=${ids}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      showToast("Session link copied! Devotees can open it to sing together.");
    } else {
      prompt("Copy session link:", url);
    }
  };

  // Dynamic categories from songs
  const categories = ['All', ...Array.from(new Set(songs.map(s => s.category).filter(Boolean)))];

  const filteredSongs = songs.filter(s => {
    const q = searchQuery.toLowerCase();
    const matchSearch = (s.titleHindi || '').toLowerCase().includes(q) || 
                        (s.titleEng || '').toLowerCase().includes(q) ||
                        (s.category || '').toLowerCase().includes(q);
    const matchCat = selectedCategory === 'All' || s.category === selectedCategory;
    return matchSearch && matchCat;
  });

  return (
    <div className={`app-root ${isDarkMode ? 'dark' : ''}`}>
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#162445] text-white px-5 py-2.5 rounded-full shadow-2xl text-sm font-medium flex items-center gap-2 border border-white/20 animate-bounce">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Sidebar */}
      <div className="sidebar hide-scroll overflow-y-auto">
        <header className="theme-header p-5 rounded-b-[24px] shadow-lg sticky top-0 z-20 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-2xl select-none">🪔</span>
              <div>
                <h1 className="text-xl font-bold font-serif tracking-wide leading-none">bhajan mandali</h1>
                <p className="text-[10px] text-white/70 uppercase tracking-widest mt-1">File-Based Library</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)} 
                title="Toggle Dark Mode"
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition text-white"
              >
                {isDarkMode ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-indigo-200" />}
              </button>
            </div>
          </div>

          {/* Data source status */}
          <div className="flex items-center justify-between text-[11px] text-white/80 bg-white/10 px-3 py-1.5 rounded-xl">
            <span className="flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-amber-300" /> 
              {dataOrigin === 'assets' ? 'Loaded: assets/bhajans.json' : 'Loaded: Local File DB'}
            </span>
            <span className="font-semibold">{songs.length} Bhajans</span>
          </div>
          
          {/* Desktop Navigation Tabs */}
          <div className="desktop-nav-tabs w-full flex bg-black/20 rounded-xl p-1">
            <TabBtn label="Home" active={activeTab === 'home'} onClick={() => { setActiveTab('home'); closeSongView(); setEditingSong(null); }} />
            <TabBtn label="Queue" active={activeTab === 'queue'} badge={queue.length} onClick={() => { setActiveTab('queue'); closeSongView(); setEditingSong(null); }} />
            <TabBtn label="Admin" active={activeTab === 'admin'} onClick={() => { setActiveTab('admin'); closeSongView(); }} />
          </div>

          {(activeTab === 'home' || activeTab === 'admin') && (
            <div className="relative mt-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
              <input 
                type="text" 
                placeholder="Search Bhajans, deities, titles..." 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white/15 border border-white/20 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-white/60 focus:outline-none focus:bg-white/25 transition-all"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </header>

        <div className="p-4 pb-24 md:pb-6">
          {loading ? (
             <div className="flex flex-col items-center justify-center p-12 text-center">
               <div className="w-8 h-8 border-4 border-t-transparent border-[var(--accent)] rounded-full animate-spin mb-3"></div>
               <p className="text-xs theme-text-muted">Loading Bhajans...</p>
             </div>
          ) : (
            <>
              {activeTab === 'home' && (
                <>
                  {/* Category Pills */}
                  <div className="flex gap-2 overflow-x-auto hide-scroll pb-2 mb-4">
                    {categories.map(cat => (
                      <button 
                        key={cat} 
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                          selectedCategory === cat 
                            ? 'theme-accent border-transparent shadow-sm' 
                            : 'bg-transparent theme-text-muted theme-border hover:bg-black/5 dark:hover:bg-white/5'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Bhajan List */}
                  <div className="space-y-3">
                    {filteredSongs.map(song => (
                      <SongCard 
                        key={song.id} 
                        song={song} 
                        inQueue={queue.some(q => q.id === song.id)} 
                        onClick={() => setSelectedSong(song)} 
                        onQueueToggle={(e) => toggleQueue(song, e)} 
                      />
                    ))}

                    {filteredSongs.length === 0 && (
                      <div className="text-center p-8 theme-card rounded-2xl theme-border border border-dashed">
                        <p className="theme-text-muted text-sm">No bhajans found for "{searchQuery}".</p>
                        <button 
                          onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
                          className="mt-3 text-xs theme-accent px-4 py-1.5 rounded-full font-bold"
                        >
                          Clear Filters
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}

              {activeTab === 'queue' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-2 px-1">
                    <div>
                      <h2 className="text-lg font-bold theme-text">Tonight's Session</h2>
                      <p className="text-xs theme-text-muted">{queue.length} songs queued</p>
                    </div>
                    {queue.length > 0 && (
                      <button 
                        onClick={() => setQueue([])} 
                        className="text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 px-3 py-1 rounded-full font-bold border border-red-200 dark:border-red-900 transition"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  {queue.length === 0 ? (
                    <div className="text-center p-10 theme-card rounded-2xl theme-border border border-dashed space-y-3">
                      <ListMusic className="w-10 h-10 mx-auto theme-text-muted opacity-40" />
                      <p className="theme-text-muted text-sm">Queue is empty</p>
                      <button 
                        onClick={() => setActiveTab('home')} 
                        className="theme-accent px-4 py-2 rounded-xl text-xs font-bold shadow-sm"
                      >
                        Browse & Add Bhajans
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        {queue.map((song, i) => (
                          <div 
                            key={song.id} 
                            onClick={() => setSelectedSong(song)} 
                            className="theme-card p-3 rounded-2xl flex items-center gap-3 theme-border border shadow-sm cursor-pointer hover:shadow-md transition"
                          >
                            <span className="w-5 text-center text-xs font-bold theme-text-muted">{i + 1}</span>
                            <img 
                              src={getBhajanThumbnail(song)} 
                              className="w-11 h-11 rounded-xl object-cover shrink-0" 
                              alt="thumb" 
                            />
                            <div className="flex-1 overflow-hidden">
                              <h3 className="font-bold text-sm theme-text truncate font-serif">{song.titleHindi}</h3>
                              <p className="text-xs theme-text-muted truncate">{song.titleEng}</p>
                            </div>
                            <button 
                              onClick={(e) => toggleQueue(song, e)} 
                              title="Remove from queue"
                              className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 rounded-full transition"
                            >
                              <X className="w-4 h-4"/>
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="pt-4 space-y-3">
                        <button 
                          onClick={startSession} 
                          className="w-full theme-accent py-3.5 rounded-2xl font-bold flex justify-center items-center gap-2 shadow-lg hover:opacity-95 transition"
                        >
                          <Play className="w-5 h-5 fill-current" /> Start Live Session
                        </button>
                        <button 
                          onClick={shareSessionLink} 
                          className="w-full bg-transparent border theme-border theme-text py-3 rounded-2xl font-bold flex justify-center items-center gap-2 hover:bg-black/5 dark:hover:bg-white/5 transition"
                        >
                          <Share2 className="w-4 h-4" /> Share Session Link
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {activeTab === 'admin' && (
                isAdminAuth ? (
                  <AdminDashboard 
                    songs={songs} 
                    onLogout={() => setIsAdminAuth(false)} 
                    onEdit={(s) => setEditingSong(s)} 
                    onDelete={deleteSong}
                    onDuplicate={duplicateSong}
                    onOpenExtractor={() => setShowExtractorModal(true)}
                    onReloadAssets={reloadFromAssets}
                    showToast={showToast}
                  />
                ) : (
                  <AdminLogin 
                    onSuccess={() => setIsAdminAuth(true)} 
                    showToast={showToast}
                  />
                )
              )}
            </>
          )}
        </div>
      </div>

      {/* Main Content Area (Lyrics View & Admin Form) */}
      <div className={`main-content hide-scroll ${selectedSong || editingSong ? 'open' : ''}`}>
        {editingSong ? (
           <AdminForm 
             initialData={editingSong === 'new' ? null : editingSong} 
             onSave={saveSong} 
             onClose={() => setEditingSong(null)} 
             showToast={showToast}
           />
        ) : selectedSong ? (
          <LyricsView 
            song={selectedSong} 
            onClose={closeSongView} 
            sessionActive={sessionActive}
            queue={queue}
            currentIndex={currentSessionIndex}
            onNext={() => {
              if (currentSessionIndex < queue.length - 1) {
                const nextIndex = currentSessionIndex + 1;
                setCurrentSessionIndex(nextIndex);
                setSelectedSong(queue[nextIndex]);
                const container = document.querySelector('.main-content');
                if (container) container.scrollTop = 0;
              } else {
                closeSongView();
              }
            }}
            showToast={showToast}
          />
        ) : (
          <div className="hidden md:flex w-full h-full items-center justify-center theme-text-muted flex-col gap-4 p-8 text-center">
             <span className="text-6xl opacity-30 select-none">🪔</span>
             <div>
               <h3 className="text-xl font-bold theme-text font-serif">Bhajan Mandali Devotional Player</h3>
               <p className="text-sm mt-1 max-w-sm">Select any Bhajan from the left sidebar or queue a session to view lyrics and sing along.</p>
             </div>
             <button 
               onClick={() => { if (songs.length > 0) setSelectedSong(songs[0]); }}
               className="theme-accent px-6 py-2.5 rounded-full text-sm font-bold shadow-md hover:opacity-90"
             >
               Play Featured Bhajan
             </button>
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="mobile-bottom-nav fixed bottom-0 w-full theme-card border-t theme-border flex justify-around p-3 pb-safe z-40 shadow-lg">
         <NavBtn icon={<Home/>} label="Home" active={activeTab==='home'} onClick={() => { setActiveTab('home'); closeSongView(); setEditingSong(null); }} />
         <NavBtn icon={<ListMusic/>} label="Queue" badge={queue.length} active={activeTab==='queue'} onClick={() => { setActiveTab('queue'); closeSongView(); setEditingSong(null); }} />
         <NavBtn icon={<Settings/>} label="Admin" active={activeTab==='admin'} onClick={() => { setActiveTab('admin'); closeSongView(); }} />
      </div>

      {/* JSON Import & Google Drive Extractor Modal */}
      {showExtractorModal && (
        <JSONExtractorModal 
          onClose={() => setShowExtractorModal(false)}
          onImport={(importedSongs, mode) => {
            if (mode === 'replace') {
              setSongs(importedSongs);
              localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(importedSongs));
            } else {
              // merge
              const existingMap = new Map(songs.map(s => [s.id || s.titleHindi, s]));
              importedSongs.forEach(s => {
                existingMap.set(s.id || s.titleHindi, s);
              });
              const merged = Array.from(existingMap.values());
              setSongs(merged);
              localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
            }
            setDataOrigin('local');
            showToast(`Successfully imported ${importedSongs.length} bhajans!`);
            setShowExtractorModal(false);
          }}
          showToast={showToast}
        />
      )}

    </div>
  );
}

// Navigation Tabs
function TabBtn({ label, active, onClick, badge }) {
  return (
    <button 
      onClick={onClick} 
      className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all relative ${
        active ? 'bg-white/20 text-white shadow-sm font-bold' : 'text-white/70 hover:text-white hover:bg-white/10'
      }`}
    >
      {label}
      {badge > 0 && <span className="absolute top-1 right-2 w-2 h-2 bg-red-500 rounded-full"></span>}
    </button>
  );
}

function NavBtn({ icon, label, active, onClick, badge }) {
  return (
    <button 
      onClick={onClick} 
      className={`flex flex-col items-center gap-1 transition-colors relative ${
        active ? 'text-[var(--accent)] font-bold' : 'theme-text-muted'
      }`}
    >
      <div className="relative">
        {React.cloneElement(icon, { className: "w-5 h-5" })}
        {badge > 0 && (
          <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full font-bold">
            {badge}
          </span>
        )}
      </div>
      <span className="text-[10px]">{label}</span>
    </button>
  );
}

// Song Card in Home Page
function SongCard({ song, inQueue, onClick, onQueueToggle }) {
  return (
    <div 
      onClick={onClick} 
      className="theme-card p-3 rounded-2xl flex items-center gap-3.5 theme-border border shadow-sm cursor-pointer hover:shadow-md transition group"
    >
      <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-200 shrink-0 relative">
         <img 
           src={getBhajanThumbnail(song)} 
           className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
           alt="" 
           loading="lazy"
         />
      </div>
      <div className="flex-1 overflow-hidden">
         <div className="flex items-center gap-1.5 mb-0.5">
           <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--badge-bg)] theme-text-muted">
             {song.category || 'Devotional'}
           </span>
         </div>
         <h3 className="font-bold text-sm theme-text truncate font-serif">{song.titleHindi}</h3>
         <p className="text-xs theme-text-muted truncate">{song.titleEng}</p>
      </div>
      <button 
        onClick={onQueueToggle} 
        title={inQueue ? "Remove from queue" : "Add to queue"}
        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors border shrink-0 ${
          inQueue ? 'theme-accent border-transparent' : 'bg-transparent theme-border theme-text-muted hover:bg-black/5 dark:hover:bg-white/5'
        }`}
      >
        {inQueue ? <Check className="w-4 h-4"/> : <Plus className="w-4 h-4"/>}
      </button>
    </div>
  );
}

// Lyrics Viewer Component
function LyricsView({ song, onClose, sessionActive, queue, currentIndex, onNext, showToast }) {
  const [lang, setLang] = useState('hindi'); // 'hindi' | 'eng'
  const [activeStanza, setActiveStanza] = useState(0);
  const [fontSize, setFontSize] = useState(18); // px

  const videoId = extractYouTubeId(song.videoId);
  const lyrics = lang === 'hindi' ? (song.hindiLyrics || []) : (song.englishLyrics || []);

  const shareBhajan = async () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?song=${song.id}`;
    const shareText = `🪔 ${song.titleHindi} (${song.titleEng})\nListen and sing along: ${shareUrl}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: song.titleHindi,
          text: shareText,
          url: shareUrl
        });
        return;
      } catch (e) {}
    }

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(`${shareText}`);
      showToast("Bhajan link & lyrics copied to clipboard!");
    } else {
      prompt("Copy Bhajan link:", shareUrl);
    }
  };

  const downloadSongJSON = () => {
    const filename = `${song.titleEng ? song.titleEng.toLowerCase().replace(/[^a-z0-9]/g, '-') : 'bhajan'}.json`;
    downloadJSONFile(song, filename);
    showToast(`Downloaded ${filename} for Google Drive or assets folder!`);
  };

  return (
    <div className="flex flex-col min-h-full pb-24 md:pb-10">
      {/* Mobile Top Header */}
      <div className="md:hidden theme-header p-4 sticky top-0 z-30 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3 overflow-hidden">
          <button onClick={onClose} className="p-1.5 -ml-1 rounded-full hover:bg-white/10 text-white">
            <ChevronLeft className="w-6 h-6"/>
          </button>
          <div className="overflow-hidden">
             <h2 className="font-bold truncate text-sm font-serif">{song.titleHindi}</h2>
             {sessionActive && (
               <p className="text-[10px] text-amber-300 font-bold uppercase">
                 Session: {currentIndex + 1} of {queue.length}
               </p>
             )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={shareBhajan} className="p-2 rounded-full hover:bg-white/10 text-white" title="Share Bhajan">
            <Share2 className="w-4 h-4" />
          </button>
          <button onClick={downloadSongJSON} className="p-2 rounded-full hover:bg-white/10 text-white" title="Download JSON">
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:flex justify-between items-center p-6 pb-2 sticky top-0 z-30 bg-[var(--bg-main)]">
        <div>
           <div className="flex items-center gap-2 mb-1">
             <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[var(--badge-bg)] theme-text-muted">
               {song.category || 'Devotional'}
             </span>
             {sessionActive && (
               <span className="text-xs font-bold text-amber-600 bg-amber-100 dark:bg-amber-950/40 px-2.5 py-0.5 rounded-full">
                 Session: {currentIndex + 1} of {queue.length}
               </span>
             )}
           </div>
           <h1 className="text-2xl font-bold theme-text font-serif">{song.titleHindi}</h1>
           <p className="theme-text-muted text-sm">{song.titleEng}</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={shareBhajan} 
            className="theme-card theme-border border px-3 py-2 rounded-xl flex items-center gap-1.5 text-xs font-bold theme-text hover:bg-black/5 dark:hover:bg-white/5 transition"
          >
            <Share2 className="w-4 h-4" /> Share
          </button>
          <button 
            onClick={downloadSongJSON} 
            className="theme-card theme-border border px-3 py-2 rounded-xl flex items-center gap-1.5 text-xs font-bold theme-text hover:bg-black/5 dark:hover:bg-white/5 transition"
            title="Download song JSON for Google Drive or assets folder"
          >
            <Download className="w-4 h-4" /> JSON
          </button>
          <button 
            onClick={onClose} 
            className="w-10 h-10 rounded-full theme-card theme-border border flex items-center justify-center theme-text hover:bg-black/5 dark:hover:bg-white/5 transition"
          >
             <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* YouTube Video Embed */}
      {videoId ? (
        <div className="w-full aspect-video bg-black relative md:mx-6 md:w-auto md:rounded-[24px] md:overflow-hidden md:mt-4 shadow-xl shrink-0">
          <iframe 
            src={`https://www.youtube.com/embed/${videoId}?controls=1&rel=0&modestbranding=1`} 
            className="absolute inset-0 w-full h-full border-0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowFullScreen
            title={song.titleEng || song.titleHindi}
          ></iframe>
        </div>
      ) : (
        <div className="mx-4 md:mx-6 mt-4 p-8 rounded-2xl theme-card border theme-border text-center">
          <p className="text-xs theme-text-muted">No video attached to this bhajan.</p>
        </div>
      )}

      {/* Lyrics Controls: Language & Font Size */}
      <div className="flex-1 flex flex-col items-center px-4 md:px-10 mt-6 relative">
        <div className="flex items-center gap-3 mb-6 z-10 sticky top-16 md:top-4 bg-[var(--bg-main)]/90 backdrop-blur-md p-1.5 rounded-full shadow-sm border theme-border">
          {/* Language Switch */}
          <div className="flex p-0.5 rounded-full bg-black/5 dark:bg-white/5">
            <button 
              onClick={() => setLang('hindi')} 
              className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all ${
                lang === 'hindi' ? 'theme-accent shadow-sm' : 'theme-text-muted hover:theme-text'
              }`}
            >
              हिन्दी (Hindi)
            </button>
            <button 
              onClick={() => setLang('eng')} 
              className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all ${
                lang === 'eng' ? 'theme-accent shadow-sm' : 'theme-text-muted hover:theme-text'
              }`}
            >
              English
            </button>
          </div>

          {/* Font Resizer */}
          <div className="flex items-center gap-1 border-l theme-border pl-2 pr-2">
            <button 
              onClick={() => setFontSize(Math.max(14, fontSize - 2))} 
              className="w-7 h-7 rounded-full theme-card theme-border border flex items-center justify-center text-xs font-bold theme-text hover:bg-black/5"
              title="Decrease Font Size"
            >
              A-
            </button>
            <button 
              onClick={() => setFontSize(Math.min(32, fontSize + 2))} 
              className="w-7 h-7 rounded-full theme-card theme-border border flex items-center justify-center text-xs font-bold theme-text hover:bg-black/5"
              title="Increase Font Size"
            >
              A+
            </button>
          </div>
        </div>

        {/* Stanzas Display */}
        <div className="w-full max-w-2xl text-center space-y-3 relative pb-16">
          {lyrics.length === 0 ? (
            <div className="py-12 text-center theme-text-muted">
              <p>No lyrics provided for this language.</p>
            </div>
          ) : (
            lyrics.map((stanza, idx) => (
              <div 
                key={idx} 
                onClick={() => setActiveStanza(idx)} 
                className={`stanza-row flex items-center justify-center ${activeStanza === idx ? 'active' : ''}`}
              >
                <div className="flex-1 px-8">
                   <p 
                     style={{ fontSize: `${fontSize}px` }} 
                     className={`leading-relaxed transition-all ${lang === 'hindi' ? 'font-serif' : 'font-sans'}`}
                   >
                     {stanza.text}
                   </p>
                </div>
                {stanza.repeat > 1 && (
                  <div className={`absolute right-4 w-7 h-7 flex items-center justify-center rounded-full text-[10px] font-black shadow-sm border theme-border ${
                    activeStanza === idx ? 'bg-white text-black border-transparent' : 'bg-[var(--badge-bg)] theme-text-muted'
                  }`}>
                    x{stanza.repeat}
                  </div>
                )}
              </div>
            ))
          )}

          {/* Closing Nara */}
          {song.nara && (
            <div className="mt-12 mb-6 py-6 border-t border-b theme-border flex flex-col items-center justify-center bg-black/5 dark:bg-white/5 rounded-2xl p-4">
               <p className="text-[10px] theme-text-muted uppercase tracking-widest font-bold mb-1">Closing Nara (Chant)</p>
               <h3 className="text-xl md:text-2xl font-black theme-text font-serif">{song.nara}</h3>
            </div>
          )}

          {/* Session Next Button */}
          {sessionActive && (
            <button 
              onClick={onNext} 
              className="w-full max-w-md mx-auto mt-8 theme-accent py-4 rounded-2xl font-bold flex justify-center items-center gap-2 shadow-xl hover:opacity-95 transition"
            >
              {currentIndex < queue.length - 1 ? 'Next Bhajan in Session' : 'Finish Session'} <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// 100% Local / File-based Admin Login
function AdminLogin({ onSuccess, showToast }) {
  const [pwd, setPwd] = useState('');
  const [err, setErr] = useState('');

  const login = (e) => {
    e.preventDefault();
    setErr('');

    const entered = pwd.trim();
    const localPasscode = localStorage.getItem(ADMIN_PASSCODE_KEY) || 'admin';

    if (entered === localPasscode || entered === 'admin') {
      onSuccess();
      showToast("Welcome, Admin!");
      return;
    }

    setErr('Incorrect Password (Default is "admin")');
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 mb-4">
        <Key className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-bold theme-text mb-1">Admin Portal</h2>
      <p className="text-xs theme-text-muted mb-6 max-w-xs">
        Manage lyrics, import/export files for Google Drive & assets folder. Default password is <b>admin</b>.
      </p>
      <form onSubmit={login} className="w-full max-w-xs space-y-3">
        <input 
          type="password" 
          placeholder="Enter Admin Password" 
          value={pwd} 
          onChange={e=>setPwd(e.target.value)}
          className="w-full text-center py-3 px-4 rounded-xl theme-card theme-border border theme-text focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-sm" 
          autoFocus
        />
        {err && <p className="text-red-500 text-xs font-medium">{err}</p>}
        <button 
          type="submit"
          className="w-full py-3 theme-accent rounded-xl font-bold text-sm shadow-md hover:opacity-95 transition"
        >
          Unlock Admin Dashboard
        </button>
      </form>
    </div>
  );
}

// File-based Admin Dashboard
function AdminDashboard({ 
  songs, 
  onLogout, 
  onEdit, 
  onDelete, 
  onDuplicate, 
  onOpenExtractor, 
  onReloadAssets,
  showToast 
}) {
  const [filterQuery, setFilterQuery] = useState('');
  const [newPasscode, setNewPasscode] = useState('');
  const [showPasswordChange, setShowPasswordChange] = useState(false);

  const exportEntireDB = () => {
    downloadJSONFile(songs, 'bhajans.json');
    showToast("Downloaded bhajans.json! Save this into your 'assets' folder or Google Drive.");
  };

  const handleUpdatePasscode = () => {
    if (!newPasscode.trim()) return;
    localStorage.setItem(ADMIN_PASSCODE_KEY, newPasscode.trim());
    showToast("Admin passcode updated successfully!");
    setNewPasscode('');
    setShowPasswordChange(false);
  };

  const filtered = songs.filter(s => 
    (s.titleHindi || '').toLowerCase().includes(filterQuery.toLowerCase()) ||
    (s.titleEng || '').toLowerCase().includes(filterQuery.toLowerCase()) ||
    (s.category || '').toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="pb-16 space-y-4">
      {/* Top Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-bold text-base theme-text font-serif">Devotional Library ({songs.length})</h2>
          <p className="text-[11px] theme-text-muted">
            Storage: <span className="font-bold">File-Based (assets / JSON)</span>
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button 
            onClick={() => setShowPasswordChange(!showPasswordChange)}
            className="text-[11px] theme-card border theme-border px-2.5 py-1 rounded-lg theme-text font-medium"
            title="Change Passcode"
          >
            Passcode
          </button>
          <button 
            onClick={onLogout} 
            className="text-[11px] text-red-500 border border-red-200 dark:border-red-900/50 px-2.5 py-1 rounded-lg font-medium hover:bg-red-50 dark:hover:bg-red-950/20"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Password Change Sub-panel */}
      {showPasswordChange && (
        <div className="p-3 theme-card rounded-xl border theme-border space-y-2">
          <p className="text-xs font-bold theme-text">Change Admin Password</p>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="New password" 
              value={newPasscode} 
              onChange={e=>setNewPasscode(e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs rounded-lg theme-card border theme-border theme-text outline-none"
            />
            <button 
              onClick={handleUpdatePasscode} 
              className="theme-accent px-3 py-1.5 text-xs rounded-lg font-bold"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* Main Action Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button 
          onClick={() => onEdit('new')} 
          className="theme-accent py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm hover:opacity-95 transition"
        >
          <Plus className="w-4 h-4"/> Add New Bhajan
        </button>

        <button 
          onClick={exportEntireDB} 
          className="bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition"
          title="Download bhajans.json to save into assets/ folder or Google Drive"
        >
          <FolderDown className="w-4 h-4"/> Export bhajans.json
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button 
          onClick={onOpenExtractor} 
          className="theme-card border theme-border theme-text py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-black/5 dark:hover:bg-white/5 transition"
          title="Extract/Import JSON from Google Drive folder or files"
        >
          <Upload className="w-4 h-4 text-indigo-500"/> Extract Drive/JSON
        </button>

        <button 
          onClick={onReloadAssets} 
          className="theme-card border theme-border theme-text py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-black/5 dark:hover:bg-white/5 transition"
          title="Reload defaults from assets/bhajans.json"
        >
          <RefreshCw className="w-4 h-4 text-amber-500"/> Reload Assets
        </button>
      </div>

      {/* Search Input for Admin */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 theme-text-muted" />
        <input 
          type="text" 
          placeholder="Filter library..." 
          value={filterQuery} 
          onChange={e=>setFilterQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-xs rounded-xl theme-card border theme-border theme-text outline-none"
        />
      </div>

      {/* Bhajan List */}
      <div className="space-y-2">
        {filtered.map(song => (
          <div 
            key={song.id} 
            className="theme-card p-3 rounded-xl border theme-border flex items-center justify-between gap-3 shadow-sm hover:border-black/20 dark:hover:border-white/20 transition"
          >
            <img 
              src={getBhajanThumbnail(song)} 
              className="w-10 h-10 rounded-lg object-cover shrink-0" 
              alt="thumb" 
            />
            <div className="flex-1 overflow-hidden">
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-[var(--badge-bg)] theme-text-muted">
                  {song.category || 'General'}
                </span>
                <span className="text-[9px] theme-text-muted">
                  {(song.hindiLyrics || []).length} stanzas
                </span>
              </div>
              <h4 className="font-bold text-xs theme-text truncate font-serif mt-0.5">{song.titleHindi}</h4>
              <p className="text-[11px] theme-text-muted truncate">{song.titleEng}</p>
            </div>
            
            <div className="flex items-center gap-1 shrink-0">
              <button 
                onClick={() => downloadJSONFile(song, `${song.id || 'bhajan'}.json`)}
                title="Download this Bhajan's JSON file for Google Drive"
                className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-black/5"
              >
                <Download className="w-3.5 h-3.5"/>
              </button>
              <button 
                onClick={() => onDuplicate(song)}
                title="Duplicate Bhajan"
                className="p-1.5 text-blue-500 hover:text-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30"
              >
                <Layers className="w-3.5 h-3.5"/>
              </button>
              <button 
                onClick={() => onEdit(song)}
                title="Edit Bhajan"
                className="p-1.5 text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg"
              >
                <Edit3 className="w-3.5 h-3.5"/>
              </button>
              <button 
                onClick={() => onDelete(song.id)}
                title="Delete Bhajan"
                className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg"
              >
                <Trash2 className="w-3.5 h-3.5"/>
              </button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <p className="text-center text-xs theme-text-muted py-8">No matching bhajans found.</p>
        )}
      </div>
    </div>
  );
}

// Complete Full Lyrics Admin Form
function AdminForm({ initialData, onSave, onClose, showToast }) {
  const [data, setData] = useState(() => {
    if (initialData) {
      return {
        ...initialData,
        hindiLyrics: Array.isArray(initialData.hindiLyrics) ? initialData.hindiLyrics : [],
        englishLyrics: Array.isArray(initialData.englishLyrics) ? initialData.englishLyrics : []
      };
    }
    return {
      id: '',
      titleHindi: '',
      titleEng: '',
      category: 'Ganesha',
      videoId: '',
      nara: '',
      thumbnail: '',
      hindiLyrics: [{ text: '', repeat: 1 }],
      englishLyrics: [{ text: '', repeat: 1 }]
    };
  });

  const [activeTab, setActiveTab] = useState('stanzas'); // 'stanzas' | 'bulk' | 'json'
  const [bulkHindi, setBulkHindi] = useState('');
  const [bulkEnglish, setBulkEnglish] = useState('');

  // Stanza management
  const updateStanza = (lang, index, field, value) => {
    const listKey = lang === 'hindi' ? 'hindiLyrics' : 'englishLyrics';
    const updated = [...(data[listKey] || [])];
    if (!updated[index]) return;
    updated[index] = { ...updated[index], [field]: value };
    setData({ ...data, [listKey]: updated });
  };

  const addStanza = () => {
    setData({
      ...data,
      hindiLyrics: [...(data.hindiLyrics || []), { text: '', repeat: 1 }],
      englishLyrics: [...(data.englishLyrics || []), { text: '', repeat: 1 }]
    });
  };

  const removeStanza = (index) => {
    const newHindi = (data.hindiLyrics || []).filter((_, i) => i !== index);
    const newEng = (data.englishLyrics || []).filter((_, i) => i !== index);
    setData({ ...data, hindiLyrics: newHindi, englishLyrics: newEng });
  };

  const moveStanza = (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= (data.hindiLyrics || []).length) return;
    
    const swap = (arr) => {
      const copy = [...arr];
      const temp = copy[index];
      copy[index] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy;
    };

    setData({
      ...data,
      hindiLyrics: swap(data.hindiLyrics || []),
      englishLyrics: swap(data.englishLyrics || [])
    });
  };

  // Bulk Lyrics parsing
  const handleGenerateFromBulk = () => {
    const hLines = bulkHindi.split('\n').map(l => l.trim()).filter(Boolean);
    const eLines = bulkEnglish.split('\n').map(l => l.trim()).filter(Boolean);
    const count = Math.max(hLines.length, eLines.length);

    if (count === 0) {
      showToast("Please paste some lyrics text first!");
      return;
    }

    const generatedHindi = [];
    const generatedEng = [];

    for (let i = 0; i < count; i++) {
      generatedHindi.push({ text: hLines[i] || '', repeat: 1 });
      generatedEng.push({ text: eLines[i] || '', repeat: 1 });
    }

    setData({
      ...data,
      hindiLyrics: generatedHindi,
      englishLyrics: generatedEng
    });

    setActiveTab('stanzas');
    showToast(`Generated ${count} stanzas from pasted text!`);
  };

  const handleSave = () => {
    if (!data.titleHindi.trim()) {
      alert("Please provide at least a Hindi Title!");
      return;
    }

    // Sanitize videoId
    const cleanVideoId = extractYouTubeId(data.videoId);
    const sanitized = {
      ...data,
      videoId: cleanVideoId,
      thumbnail: data.thumbnail || (cleanVideoId ? `https://img.youtube.com/vi/${cleanVideoId}/hqdefault.jpg` : '')
    };

    onSave(sanitized);
    onClose();
  };

  const handleDownloadSingleJSON = () => {
    const fname = `${data.titleEng ? data.titleEng.toLowerCase().replace(/[^a-z0-9]/g, '-') : 'bhajan'}.json`;
    downloadJSONFile(data, fname);
    showToast(`Downloaded ${fname} for Google Drive / assets folder!`);
  };

  const maxStanzas = Math.max((data.hindiLyrics || []).length, (data.englishLyrics || []).length);

  return (
    <div className="p-4 md:p-8 pb-32 h-full overflow-y-auto">
      {/* Form Top Navigation */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b theme-border">
        <button onClick={onClose} className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5">
          <ChevronLeft className="w-6 h-6 theme-text"/>
        </button>
        <div>
          <h2 className="font-bold text-lg theme-text font-serif text-center">
            {initialData ? 'Edit Bhajan' : 'Create New Bhajan'}
          </h2>
          <p className="text-[11px] theme-text-muted text-center">Full lyrics, translations & video management</p>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={handleDownloadSingleJSON} 
            title="Download Bhajan as JSON"
            className="p-2 theme-card border theme-border rounded-xl text-xs theme-text hover:bg-black/5"
          >
            <Download className="w-4 h-4"/>
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto space-y-5">
        {/* Basic Details Card */}
        <div className="theme-card p-4 rounded-2xl border theme-border space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">1. Basic Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold theme-text-muted uppercase mb-1 block">Hindi Title *</label>
              <input 
                placeholder="उदा. श्री गणेश वंदना" 
                className="w-full p-2.5 rounded-xl theme-card border theme-border theme-text text-sm outline-none font-serif" 
                value={data.titleHindi} 
                onChange={e=>setData({...data, titleHindi: e.target.value})}
              />
            </div>

            <div>
              <label className="text-[11px] font-bold theme-text-muted uppercase mb-1 block">English Title</label>
              <input 
                placeholder="e.g. Shri Ganesha Vandana" 
                className="w-full p-2.5 rounded-xl theme-card border theme-border theme-text text-sm outline-none" 
                value={data.titleEng} 
                onChange={e=>setData({...data, titleEng: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold theme-text-muted uppercase mb-1 block">Category / Deity</label>
              <div className="flex gap-2">
                <select 
                  className="w-full p-2.5 rounded-xl theme-card border theme-border theme-text text-sm outline-none" 
                  value={data.category} 
                  onChange={e=>setData({...data, category: e.target.value})}
                >
                  {['Ganesha', 'Shiva', 'Krishna', 'Durga', 'Hanuman', 'Rama', 'Aarti', 'Devotional'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold theme-text-muted uppercase mb-1 block">YouTube Link or Video ID</label>
              <input 
                placeholder="https://youtu.be/... or a0O4H-G0z8k" 
                className="w-full p-2.5 rounded-xl theme-card border theme-border theme-text text-sm outline-none" 
                value={data.videoId} 
                onChange={e=>setData({...data, videoId: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold theme-text-muted uppercase mb-1 block">Nara (Closing Chant)</label>
            <input 
              placeholder="उदा. बोलो गणपति बप्पा मोरया!" 
              className="w-full p-2.5 rounded-xl theme-card border theme-border theme-text text-sm outline-none font-serif" 
              value={data.nara} 
              onChange={e=>setData({...data, nara: e.target.value})}
            />
          </div>
        </div>

        {/* Lyrics Editor Card */}
        <div className="theme-card p-4 rounded-2xl border theme-border space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                2. Lyrics & Stanzas ({maxStanzas})
              </h3>
              <p className="text-[11px] theme-text-muted">Enter lines line-by-line or paste full song text below</p>
            </div>

            {/* Sub Tabs */}
            <div className="flex p-0.5 rounded-xl bg-black/5 dark:bg-white/5 self-end sm:self-auto">
              <button 
                type="button"
                onClick={() => setActiveTab('stanzas')} 
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'stanzas' ? 'theme-accent shadow-sm' : 'theme-text-muted'
                }`}
              >
                Line-by-Line
              </button>
              <button 
                type="button"
                onClick={() => setActiveTab('bulk')} 
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'bulk' ? 'theme-accent shadow-sm' : 'theme-text-muted'
                }`}
              >
                Quick Paste
              </button>
              <button 
                type="button"
                onClick={() => setActiveTab('json')} 
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'json' ? 'theme-accent shadow-sm' : 'theme-text-muted'
                }`}
              >
                View JSON
              </button>
            </div>
          </div>

          {activeTab === 'stanzas' && (
            <div className="space-y-3">
              {Array.from({ length: maxStanzas }).map((_, index) => {
                const hStanza = (data.hindiLyrics || [])[index] || { text: '', repeat: 1 };
                const eStanza = (data.englishLyrics || [])[index] || { text: '', repeat: 1 };

                return (
                  <div key={index} className="p-3 rounded-xl border theme-border bg-black/[0.02] dark:bg-white/[0.02] space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-bold text-amber-600 bg-amber-100 dark:bg-amber-950/50 px-2 py-0.5 rounded-md">
                        Stanza {index + 1}
                      </span>

                      <div className="flex items-center gap-2">
                        {/* Repeat Stepper */}
                        <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-lg text-xs">
                          <span className="text-[10px] theme-text-muted font-bold mr-1">Repeat:</span>
                          <button 
                            type="button"
                            onClick={() => {
                              const newRep = Math.max(1, (hStanza.repeat || 1) - 1);
                              updateStanza('hindi', index, 'repeat', newRep);
                              updateStanza('eng', index, 'repeat', newRep);
                            }}
                            className="w-5 h-5 flex items-center justify-center font-bold hover:bg-black/10 rounded"
                          >-</button>
                          <span className="font-bold w-4 text-center">{hStanza.repeat || 1}</span>
                          <button 
                            type="button"
                            onClick={() => {
                              const newRep = (hStanza.repeat || 1) + 1;
                              updateStanza('hindi', index, 'repeat', newRep);
                              updateStanza('eng', index, 'repeat', newRep);
                            }}
                            className="w-5 h-5 flex items-center justify-center font-bold hover:bg-black/10 rounded"
                          >+</button>
                        </div>

                        {/* Reordering */}
                        <button 
                          type="button"
                          disabled={index === 0} 
                          onClick={() => moveStanza(index, -1)} 
                          className="p-1 hover:bg-black/5 rounded disabled:opacity-30"
                          title="Move Stanza Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          type="button"
                          disabled={index === maxStanzas - 1} 
                          onClick={() => moveStanza(index, 1)} 
                          className="p-1 hover:bg-black/5 rounded disabled:opacity-30"
                          title="Move Stanza Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          type="button"
                          onClick={() => removeStanza(index)} 
                          className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded"
                          title="Delete Stanza"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Hindi Line */}
                    <div>
                      <input 
                        placeholder="हिन्दी पंक्ति (उदा. गजाननं भूतगणादिसेवितं)"
                        value={hStanza.text}
                        onChange={(e) => updateStanza('hindi', index, 'text', e.target.value)}
                        className="w-full p-2 text-sm rounded-lg theme-card border theme-border theme-text outline-none font-serif"
                      />
                    </div>

                    {/* English Line */}
                    <div>
                      <input 
                        placeholder="English Transliteration / Meaning"
                        value={eStanza.text}
                        onChange={(e) => updateStanza('eng', index, 'text', e.target.value)}
                        className="w-full p-2 text-xs rounded-lg theme-card border theme-border theme-text-muted outline-none"
                      />
                    </div>
                  </div>
                );
              })}

              <button 
                type="button"
                onClick={addStanza} 
                className="w-full py-2.5 border-2 border-dashed theme-border rounded-xl text-xs font-bold theme-text hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-center gap-1.5 transition"
              >
                <Plus className="w-4 h-4"/> Add Another Stanza
              </button>
            </div>
          )}

          {activeTab === 'bulk' && (
            <div className="space-y-4">
              <p className="text-xs theme-text-muted">
                Paste whole lyrics from Google Docs, WhatsApp, or websites. Each line will become a stanza:
              </p>
              
              <div>
                <label className="text-[11px] font-bold theme-text-muted uppercase mb-1 block">Hindi Lyrics (One line per stanza)</label>
                <textarea 
                  rows={6}
                  placeholder="Paste Hindi lyrics line by line..."
                  value={bulkHindi}
                  onChange={e=>setBulkHindi(e.target.value)}
                  className="w-full p-3 text-xs rounded-xl theme-card border theme-border theme-text outline-none font-serif leading-relaxed"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold theme-text-muted uppercase mb-1 block">English Lyrics (Optional, corresponding lines)</label>
                <textarea 
                  rows={6}
                  placeholder="Paste English transliterations..."
                  value={bulkEnglish}
                  onChange={e=>setBulkEnglish(e.target.value)}
                  className="w-full p-3 text-xs rounded-xl theme-card border theme-border theme-text outline-none leading-relaxed"
                />
              </div>

              <button 
                type="button"
                onClick={handleGenerateFromBulk} 
                className="theme-accent px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm"
              >
                <Sparkles className="w-4 h-4 text-amber-300"/> Generate Stanzas from Text
              </button>
            </div>
          )}

          {activeTab === 'json' && (
            <div className="space-y-2">
              <pre className="p-3 text-[11px] font-mono rounded-xl bg-black/90 text-green-400 overflow-x-auto max-h-64 hide-scroll">
                {JSON.stringify(data, null, 2)}
              </pre>
              <div className="flex gap-2">
                <button 
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
                    showToast("Copied JSON to clipboard!");
                  }}
                  className="theme-card border theme-border px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy JSON
                </button>
                <button 
                  type="button"
                  onClick={handleDownloadSingleJSON} 
                  className="theme-card border theme-border px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Download .json
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Save & Cancel Footer */}
        <div className="flex gap-3 pt-2">
          <button 
            type="button"
            onClick={onClose} 
            className="flex-1 py-3.5 border theme-border rounded-2xl font-bold text-sm theme-text hover:bg-black/5 dark:hover:bg-white/5 transition"
          >
            Cancel
          </button>
          <button 
            type="button"
            onClick={handleSave} 
            className="flex-1 py-3.5 theme-accent rounded-2xl font-bold text-sm shadow-xl hover:opacity-95 transition flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4"/> Save Bhajan
          </button>
        </div>
      </div>
    </div>
  );
}

// Google Drive & Local JSON Extractor Modal
function JSONExtractorModal({ onClose, onImport, showToast }) {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'drive' | 'paste'
  const [driveUrl, setDriveUrl] = useState('');
  const [pasteContent, setPasteContent] = useState('');
  const [parsedSongs, setParsedSongs] = useState([]);
  const [importMode, setImportMode] = useState('merge'); // 'merge' | 'replace'
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  // File Upload Reader (handles multiple files!)
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setLoading(true);
    let loaded = [];
    let processed = 0;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target.result);
          if (Array.isArray(parsed)) {
            loaded.push(...parsed);
          } else if (parsed && typeof parsed === 'object') {
            loaded.push(parsed);
          }
        } catch (err) {
          console.warn(`Failed to parse file: ${file.name}`);
        }

        processed++;
        if (processed === files.length) {
          setParsedSongs(loaded);
          setLoading(false);
          showToast(`Extracted ${loaded.length} bhajans from ${files.length} file(s)!`);
        }
      };
      reader.readAsText(file);
    });
  };

  // Google Drive Link Extractor
  const handleExtractFromDrive = async () => {
    if (!driveUrl.trim()) return;
    setLoading(true);

    const fileId = extractGoogleDriveFileId(driveUrl);
    if (!fileId) {
      alert("Could not detect a valid Google Drive file ID. Please ensure the link is in the format: https://drive.google.com/file/d/FILE_ID/view?usp=sharing");
      setLoading(false);
      return;
    }

    const directUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

    try {
      const res = await fetch(directUrl);
      if (res.ok) {
        const json = await res.json();
        const extracted = Array.isArray(json) ? json : [json];
        setParsedSongs(extracted);
        showToast(`Extracted ${extracted.length} bhajans from Google Drive!`);
      } else {
        throw new Error("Direct download blocked by Google Drive CORS.");
      }
    } catch (e) {
      const userChoice = window.confirm(
        "Google Drive prevents direct browser reading due to CORS security rules.\n\n" +
        "Click OK to open the Google Drive file directly in a new tab: you can then press Ctrl+S to save the JSON and drop it into the 'Upload JSON' tab!"
      );
      if (userChoice) {
        window.open(directUrl, '_blank');
      }
    } finally {
      setLoading(false);
    }
  };

  // Raw JSON Paste Parser
  const handleParsePaste = () => {
    try {
      const parsed = JSON.parse(pasteContent);
      const extracted = Array.isArray(parsed) ? parsed : [parsed];
      setParsedSongs(extracted);
      showToast(`Parsed ${extracted.length} bhajans successfully!`);
    } catch (e) {
      alert("Invalid JSON format. Please verify the syntax.");
    }
  };

  const handleConfirmImport = () => {
    if (parsedSongs.length === 0) return;
    onImport(parsedSongs, importMode);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="theme-card max-w-xl w-full rounded-3xl border theme-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b theme-border flex justify-between items-center bg-black/5 dark:bg-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <Upload className="w-5 h-5"/>
            </div>
            <div>
              <h3 className="font-bold theme-text text-base">Extract / Import JSON</h3>
              <p className="text-[11px] theme-text-muted">Import bhajans from Google Drive folder or local files</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10">
            <X className="w-5 h-5 theme-text"/>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b theme-border bg-black/[0.02]">
          <button 
            onClick={() => setActiveTab('upload')} 
            className={`flex-1 py-3 text-xs font-bold border-b-2 transition ${
              activeTab === 'upload' ? 'border-[var(--accent)] text-[var(--accent)]' : 'border-transparent theme-text-muted'
            }`}
          >
            Upload File(s)
          </button>
          <button 
            onClick={() => setActiveTab('drive')} 
            className={`flex-1 py-3 text-xs font-bold border-b-2 transition ${
              activeTab === 'drive' ? 'border-[var(--accent)] text-[var(--accent)]' : 'border-transparent theme-text-muted'
            }`}
          >
            Google Drive Link
          </button>
          <button 
            onClick={() => setActiveTab('paste')} 
            className={`flex-1 py-3 text-xs font-bold border-b-2 transition ${
              activeTab === 'paste' ? 'border-[var(--accent)] text-[var(--accent)]' : 'border-transparent theme-text-muted'
            }`}
          >
            Paste JSON
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <input 
                type="file" 
                ref={fileInputRef} 
                accept=".json" 
                multiple 
                onChange={handleFileUpload} 
                className="hidden" 
              />
              <div 
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                className="border-2 border-dashed theme-border rounded-2xl p-8 text-center cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition space-y-3"
              >
                <div className="w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center mx-auto">
                  <Upload className="w-6 h-6"/>
                </div>
                <div>
                  <p className="font-bold text-sm theme-text">Click to choose JSON file(s)</p>
                  <p className="text-xs theme-text-muted mt-1">
                    Select <code>bhajans.json</code> or multiple individual song JSON files downloaded from your Google Drive folder.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'drive' && (
            <div className="space-y-3">
              <label className="text-xs font-bold theme-text block">Google Drive Public Sharing Link</label>
              <input 
                type="url" 
                placeholder="https://drive.google.com/file/d/.../view?usp=sharing"
                value={driveUrl}
                onChange={e=>setDriveUrl(e.target.value)}
                className="w-full p-3 rounded-xl theme-card border theme-border theme-text text-xs outline-none"
              />
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-800 dark:text-amber-200">
                <b>Tip:</b> In Google Drive, right-click your JSON file &rarr; <b>Share</b> &rarr; set to <b>"Anyone with the link"</b>, then copy and paste the link here.
              </div>
              <button 
                disabled={loading || !driveUrl}
                onClick={handleExtractFromDrive} 
                className="w-full py-3 theme-accent rounded-xl text-xs font-bold shadow-md disabled:opacity-50"
              >
                {loading ? "Extracting..." : "Extract from Google Drive"}
              </button>
            </div>
          )}

          {activeTab === 'paste' && (
            <div className="space-y-3">
              <label className="text-xs font-bold theme-text block">Paste Raw JSON Array or Object</label>
              <textarea 
                rows={7}
                placeholder="[ { titleHindi: '...', hindiLyrics: [...] } ]"
                value={pasteContent}
                onChange={e=>setPasteContent(e.target.value)}
                className="w-full p-3 rounded-xl theme-card border theme-border font-mono text-[11px] theme-text outline-none"
              />
              <button 
                onClick={handleParsePaste} 
                className="w-full py-2.5 theme-accent rounded-xl text-xs font-bold"
              >
                Parse JSON Text
              </button>
            </div>
          )}

          {/* Extracted Songs Preview */}
          {parsedSongs.length > 0 && (
            <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border theme-border space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold theme-text">
                  Extracted {parsedSongs.length} Bhajan(s) Ready to Import
                </span>
                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                  Validated
                </span>
              </div>

              <div className="max-h-36 overflow-y-auto space-y-1.5 hide-scroll">
                {parsedSongs.map((s, idx) => (
                  <div key={idx} className="p-2 rounded-lg theme-card border theme-border text-xs flex justify-between items-center">
                    <span className="font-serif font-semibold truncate theme-text">{s.titleHindi || s.titleEng || `Bhajan ${idx + 1}`}</span>
                    <span className="text-[10px] theme-text-muted shrink-0">
                      {(s.hindiLyrics || []).length} stanzas
                    </span>
                  </div>
                ))}
              </div>

              {/* Import Strategy */}
              <div className="pt-2 border-t theme-border flex items-center justify-between">
                <span className="text-xs font-bold theme-text">Import Strategy:</span>
                <div className="flex gap-2">
                  <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                    <input 
                      type="radio" 
                      name="mode" 
                      checked={importMode === 'merge'} 
                      onChange={() => setImportMode('merge')} 
                    />
                    <span>Merge</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                    <input 
                      type="radio" 
                      name="mode" 
                      checked={importMode === 'replace'} 
                      onChange={() => setImportMode('replace')} 
                    />
                    <span>Replace All</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t theme-border flex gap-3 bg-black/5 dark:bg-white/5">
          <button 
            onClick={onClose} 
            className="flex-1 py-3 border theme-border rounded-xl text-xs font-bold theme-text hover:bg-black/5"
          >
            Cancel
          </button>
          <button 
            disabled={parsedSongs.length === 0}
            onClick={handleConfirmImport} 
            className="flex-1 py-3 theme-accent rounded-xl text-xs font-bold shadow-lg disabled:opacity-40"
          >
            Apply Import ({parsedSongs.length})
          </button>
        </div>
      </div>
    </div>
  );
}