import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, collection, onSnapshot, addDoc, updateDoc, deleteDoc, getDoc, setDoc } from 'firebase/firestore';
import { Home, ListMusic, Settings, Play, Plus, Trash2, Edit3, ChevronLeft, ChevronRight, Check, X, ShieldAlert, Sun, Moon, Search, Menu, Share } from 'lucide-react';
import { appId, firebaseConfig, isFirebaseConfigured } from './firebase.config';

const injectStyles = () => {
  const style = document.createElement('style');
  style.innerHTML = `
    :root {
      /* Light Theme (Devotional) */
      --bg-main: #f7efe3;
      --bg-card: #ffffff;
      --bg-header: #162445;
      --text-main: #1e1e1e;
      --text-muted: #666666;
      --text-header: #ffffff;
      --highlight: #eebb4d;
      --accent: #162445;
      --accent-text: #ffffff;
      --border-light: rgba(0,0,0,0.08);
      --badge-bg: #e5e5e5;
    }

    .dark {
      /* Dark Theme (Pastel) */
      --bg-main: #26313d;
      --bg-card: #313d4b;
      --bg-header: #1d252f;
      --text-main: #e2e8f0;
      --text-muted: #9ca3af;
      --text-header: #e2e8f0;
      --highlight: #d39393;
      --accent: #a1caba;
      --accent-text: #1d252f;
      --border-light: rgba(255,255,255,0.08);
      --badge-bg: #475569;
    }

    body {
      background-color: var(--bg-main);
      color: var(--text-main);
      margin: 0;
      font-family: 'Inter', system-ui, sans-serif;
      overflow: hidden; /* App container handles scroll */
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
      transition: background-color 0.2s;
    }
    .stanza-row.active {
      background-color: var(--highlight);
      color: #1e1e1e !important; /* Force dark text on highlight for readability */
      font-weight: 600;
    }
    
    /* Scrollbar hiding */
    .hide-scroll::-webkit-scrollbar { display: none; }
    .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }

    /* Desktop Layout Overrides */
    @media (min-width: 768px) {
      .app-root { flex-direction: row; }
      .mobile-bottom-nav { display: none !important; }
      .sidebar {
        width: 380px;
        height: 100vh;
        border-right: 1px solid var(--border-light);
        display: flex;
        flex-direction: column;
        background-color: var(--bg-main);
        z-index: 10;
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
      .sidebar { width: 100%; height: calc(100vh - 65px); } /* Leave room for bottom nav */
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

const app = isFirebaseConfigured ? initializeApp(firebaseConfig) : null;
const auth = app ? getAuth(app) : null;
const db = app ? getFirestore(app) : null;

const SEED_BHAJANS = [
  {
    titleHindi: 'श्री गणेश वंदना',
    titleEng: 'Shri Ganesha Vandana',
    videoId: 'a0O4H-G0z8k',
    nara: 'जय गणेश!',
    category: 'Ganesha',
    thumbnail: 'https://images.unsplash.com/photo-1594954848604-032cbbe3edb4?auto=format&fit=crop&w=150&q=80',
    hindiLyrics: [
      { text: 'श्री गणेश वंदना गान पर वंदना', repeat: 1 },
      { text: 'बाही सभी सुनता यम बवान ना॥', repeat: 1 },
      { text: 'जही गणेर दाना बान पर बदना', repeat: 2 },
      { text: 'बस दोन तिलस बल एरी बाना', repeat: 1 }
    ],
    englishLyrics: [
      { text: 'Shri Ganesha vandana gaan par vandana', repeat: 1 },
      { text: 'Baahi sabhi sunata yam bawan na||', repeat: 1 },
      { text: 'Jahi ganer daana baan par badana', repeat: 2 },
      { text: 'Bas don tilas bal eri baana', repeat: 1 }
    ]
  }
];

export default function App() {
  const [user, setUser] = useState(null);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isStyleInjected, setIsStyleInjected] = useState(false);

  // Layout & View State
  const [activeTab, setActiveTab] = useState('home'); // home, queue, admin
  const [selectedSong, setSelectedSong] = useState(null); // Triggers main content view on mobile
  
  // Session State
  const [queue, setQueue] = useState([]);
  const [sessionActive, setSessionActive] = useState(false);
  const [currentSessionIndex, setCurrentSessionIndex] = useState(0);

  // Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Admin State
  const [isAdminAuth, setIsAdminAuth] = useState(false);
  const [editingSong, setEditingSong] = useState(null);

  useEffect(() => {
    if (!isStyleInjected) {
      injectStyles();
      setIsStyleInjected(true);
    }
  }, [isStyleInjected]);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (error) {
        console.error("Auth error:", error);
        setLoading(false);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !db) return;
    const songsCollection = collection(db, 'artifacts', appId, 'public', 'data', 'bhajans');
    
    const unsubscribe = onSnapshot(songsCollection, async (snapshot) => {
      const fetchedSongs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      if (fetchedSongs.length === 0 && !loading) {
        try {
          for (const song of SEED_BHAJANS) await addDoc(songsCollection, song);
        } catch (e) { console.error("Seeding failed", e); }
      } else {
        setSongs(fetchedSongs);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [user]);

  const toggleQueue = (song, e) => {
    e.stopPropagation();
    if (queue.find(q => q.id === song.id)) {
      setQueue(queue.filter(q => q.id !== song.id));
    } else {
      setQueue([...queue, song]);
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

  const categories = ['All', 'Ganesha', 'Shiva', 'Krishna', 'Durga'];
  
  const filteredSongs = songs.filter(s => {
    const matchSearch = (s.titleHindi || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                        (s.titleEng || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = selectedCategory === 'All' || s.category === selectedCategory;
    return matchSearch && matchCat;
  });

  if (!isFirebaseConfigured) {
    return (
      <main className="min-h-screen bg-[#f7efe3] p-6 text-[#1e1e1e]">
        <section className="mx-auto mt-16 max-w-xl rounded-2xl bg-white p-8 shadow-lg">
          <h1 className="text-2xl font-bold">Firebase setup required</h1>
          <p className="mt-3 text-gray-600">
            Add your Firebase web app settings to <code>firebase.config.js</code>, then rebuild the site.
          </p>
        </section>
      </main>
    );
  }

  return (
    <div className={`app-root ${isDarkMode ? 'dark' : ''}`}>
      
      {/* Sidebar (Full width on Mobile, Fixed on Desktop) */}
      <div className="sidebar hide-scroll overflow-y-auto">
        <header className="theme-header p-5 rounded-b-[24px] shadow-lg sticky top-0 z-20 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🪔</span>
              <h1 className="text-xl font-bold font-serif tracking-wide">bhajan mandali</h1>
            </div>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-full bg-black/20 hover:bg-black/30 transition">
              {isDarkMode ? <Sun className="w-5 h-5 text-amber-300" /> : <Moon className="w-5 h-5 text-indigo-200" />}
            </button>
          </div>
          
          {/* Desktop Tabs injected into Header */}
          <div className="desktop-nav-tabs w-full flex bg-black/20 rounded-xl p-1 mb-2">
            <TabBtn label="Home" active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
            <TabBtn label="Queue" active={activeTab === 'queue'} badge={queue.length} onClick={() => setActiveTab('queue')} />
            <TabBtn label="Admin" active={activeTab === 'admin'} onClick={() => setActiveTab('admin')} />
          </div>

          {(activeTab === 'home' || activeTab === 'admin') && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" placeholder="Search Bhajans..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/60 focus:outline-none focus:bg-white/20 transition-all"
              />
            </div>
          )}
        </header>

        <div className="p-4">
          {loading ? (
             <div className="flex justify-center p-10"><div className="w-8 h-8 border-4 border-t-transparent border-gray-400 rounded-full animate-spin"></div></div>
          ) : (
            <>
              {activeTab === 'home' && (
                <>
                  <div className="flex gap-2 overflow-x-auto hide-scroll pb-2 mb-4">
                    {categories.map(cat => (
                      <button key={cat} onClick={() => setSelectedCategory(cat)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors border theme-border ${
                          selectedCategory === cat ? 'theme-accent border-transparent' : 'bg-transparent theme-text-muted hover:bg-black/5 dark:hover:bg-white/5'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                  <div className="space-y-3">
                    {filteredSongs.map(song => (
                      <SongCard key={song.id} song={song} inQueue={queue.some(q => q.id === song.id)} 
                        onClick={() => setSelectedSong(song)} onQueueToggle={(e) => toggleQueue(song, e)} />
                    ))}
                    {filteredSongs.length === 0 && <p className="text-center theme-text-muted mt-10">No bhajans found.</p>}
                  </div>
                </>
              )}

              {activeTab === 'queue' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-2 px-1">
                    <h2 className="text-lg font-bold theme-text">Tonight's Session</h2>
                    <button onClick={() => { setQueue([]); setActiveTab('home'); }} className="text-xs theme-accent px-3 py-1 rounded-full font-bold">Clear</button>
                  </div>
                  {queue.length === 0 ? (
                    <div className="text-center p-10 theme-card rounded-2xl theme-border border border-dashed">
                      <p className="theme-text-muted">Queue is empty</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        {queue.map((song, i) => (
                          <div key={song.id} onClick={() => setSelectedSong(song)} className="theme-card p-3 rounded-2xl flex items-center gap-3 theme-border border shadow-sm cursor-pointer">
                            <img src={song.thumbnail || 'https://via.placeholder.com/50'} className="w-10 h-10 rounded-lg object-cover" alt="thumb" />
                            <div className="flex-1 overflow-hidden">
                              <h3 className="font-bold text-sm theme-text truncate">{song.titleHindi || song.titleEng}</h3>
                              <p className="text-xs theme-text-muted truncate">{song.titleEng || song.titleHindi}</p>
                            </div>
                            <button onClick={(e) => toggleQueue(song, e)} className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 rounded-full"><X className="w-4 h-4"/></button>
                          </div>
                        ))}
                      </div>
                      <div className="pt-4 space-y-3">
                        <button onClick={startSession} className="w-full theme-accent py-3.5 rounded-2xl font-bold flex justify-center items-center gap-2 shadow-md">
                          <Play className="w-5 h-5 fill-current" /> Start Session
                        </button>
                        <button className="w-full bg-transparent border theme-border theme-text py-3.5 rounded-2xl font-bold flex justify-center items-center gap-2 hover:bg-black/5 dark:hover:bg-white/5 transition">
                          <Share className="w-4 h-4" /> Share Session Link
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {activeTab === 'admin' && (
                isAdminAuth ? (
                  <AdminDashboard songs={songs} onLogout={() => setIsAdminAuth(false)} onEdit={setEditingSong} />
                ) : (
                  <AdminLogin onSuccess={() => setIsAdminAuth(true)} db={db} appId={appId} />
                )
              )}
            </>
          )}
        </div>
      </div>

      {/* Main Content Area (Lyrics View & Admin Form) */}
      <div className={`main-content hide-scroll ${selectedSong || editingSong ? 'open' : ''}`}>
        {editingSong ? (
           <AdminForm initialData={editingSong === 'new' ? null : editingSong} db={db} appId={appId} 
             onClose={() => setEditingSong(null)} />
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
                document.querySelector('.main-content').scrollTop = 0;
              } else {
                closeSongView();
              }
            }}
          />
        ) : (
          <div className="hidden md:flex w-full h-full items-center justify-center theme-text-muted flex-col gap-4">
             <span className="text-6xl opacity-20">🪔</span>
             <p>Select a Bhajan to view lyrics</p>
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="mobile-bottom-nav fixed bottom-0 w-full theme-card border-t theme-border flex justify-around p-3 pb-safe z-40">
         <NavBtn icon={<Home/>} label="Home" active={activeTab==='home'} onClick={() => { setActiveTab('home'); closeSongView(); setEditingSong(null); }} />
         <NavBtn icon={<ListMusic/>} label="Queue" badge={queue.length} active={activeTab==='queue'} onClick={() => { setActiveTab('queue'); closeSongView(); setEditingSong(null); }} />
         <NavBtn icon={<Settings/>} label="Admin" active={activeTab==='admin'} onClick={() => { setActiveTab('admin'); closeSongView(); }} />
      </div>

    </div>
  );
}

function TabBtn({ label, active, onClick, badge }) {
  return (
    <button onClick={onClick} className={`flex-1 py-1.5 text-sm font-semibold rounded-lg transition-all relative ${active ? 'bg-white/20 text-white shadow-sm' : 'text-white/60 hover:text-white hover:bg-white/10'}`}>
      {label}
      {badge > 0 && <span className="absolute top-1 right-2 w-2 h-2 bg-red-500 rounded-full"></span>}
    </button>
  );
}

function NavBtn({ icon, label, active, onClick, badge }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-colors relative ${active ? 'text-[var(--accent)]' : 'theme-text-muted'}`}>
      <div className="relative">
        {React.cloneElement(icon, { className: "w-6 h-6" })}
        {badge > 0 && <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold">{badge}</span>}
      </div>
      <span className="text-[10px] font-bold">{label}</span>
    </button>
  );
}

function SongCard({ song, inQueue, onClick, onQueueToggle }) {
  return (
    <div onClick={onClick} className="theme-card p-3 rounded-[20px] flex items-center gap-4 theme-border border shadow-sm cursor-pointer hover:shadow-md transition-shadow group">
      <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gray-200 shrink-0">
         <img src={song.thumbnail || 'https://images.unsplash.com/photo-1594954848604-032cbbe3edb4?auto=format&fit=crop&w=150&q=80'} className="w-full h-full object-cover" alt="" />
      </div>
      <div className="flex-1 overflow-hidden">
         <h3 className="font-bold text-sm theme-text truncate font-serif">{song.titleHindi}</h3>
         <p className="text-xs theme-text-muted mt-0.5 truncate">{song.titleEng}</p>
      </div>
      <button onClick={onQueueToggle} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors border shrink-0 ${inQueue ? 'theme-accent border-transparent' : 'bg-transparent theme-border theme-text-muted hover:bg-black/5 dark:hover:bg-white/5'}`}>
        {inQueue ? <Check className="w-5 h-5"/> : <Plus className="w-5 h-5"/>}
      </button>
    </div>
  )
}

function LyricsView({ song, onClose, sessionActive, queue, currentIndex, onNext }) {
  const [lang, setLang] = useState('hindi'); // 'hindi' | 'eng'
  const [activeStanza, setActiveStanza] = useState(0);

  const lyrics = lang === 'hindi' ? song.hindiLyrics : song.englishLyrics;

  return (
    <div className="flex flex-col min-h-full pb-20 md:pb-0">
      {/* Header Mobile Only (Desktop uses sidebar) */}
      <div className="md:hidden theme-header p-4 sticky top-0 z-30 flex items-center gap-3 shadow-md">
        <button onClick={onClose} className="p-2 -ml-2 rounded-full hover:bg-white/10"><ChevronLeft className="w-6 h-6"/></button>
        <div className="flex-1 overflow-hidden">
           <h2 className="font-bold truncate">{song.titleHindi}</h2>
           {sessionActive && <p className="text-[10px] text-amber-300 font-bold uppercase">Session: {currentIndex + 1} of {queue.length}</p>}
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:flex justify-between items-center p-6 pb-2 sticky top-0 z-30 bg-[var(--bg-main)]">
        <div>
           <h1 className="text-2xl font-bold theme-text font-serif">{song.titleHindi}</h1>
           <p className="theme-text-muted text-sm">{song.titleEng}</p>
        </div>
        <button onClick={onClose} className="w-10 h-10 rounded-full theme-card theme-border border flex items-center justify-center theme-text shadow-sm hover:bg-black/5">
           <X className="w-5 h-5" />
        </button>
      </div>

      {/* Video */}
      <div className="w-full aspect-video bg-black relative md:mx-6 md:w-auto md:rounded-[24px] md:overflow-hidden md:mt-4 shadow-lg shrink-0">
        <iframe src={`https://www.youtube.com/embed/${song.videoId}?controls=1&rel=0`} className="absolute inset-0 w-full h-full border-0" allowFullScreen></iframe>
      </div>

      {/* Controls & Lyrics */}
      <div className="flex-1 flex flex-col items-center px-4 md:px-10 mt-6 relative">
        
        {/* Language Toggle */}
        <div className="theme-card p-1 rounded-full flex gap-1 theme-border border shadow-sm mb-8 z-10 sticky top-20 md:top-4">
          <button onClick={()=>setLang('hindi')} className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${lang === 'hindi' ? 'theme-accent shadow' : 'theme-text-muted hover:theme-text'}`}>Hindi</button>
          <button onClick={()=>setLang('eng')} className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${lang === 'eng' ? 'theme-accent shadow' : 'theme-text-muted hover:theme-text'}`}>English</button>
        </div>

        <div className="w-full max-w-2xl text-center space-y-2 relative pb-20">
          {(lyrics || []).map((stanza, idx) => (
            <div key={idx} onClick={() => setActiveStanza(idx)} className={`stanza-row flex items-center ${activeStanza === idx ? 'active' : ''}`}>
              <div className="flex-1">
                 <p className={`text-lg md:text-xl leading-relaxed ${lang === 'hindi' ? 'font-serif' : ''}`}>{stanza.text}</p>
              </div>
              {stanza.repeat > 1 && (
                <div className={`absolute right-4 w-7 h-7 flex items-center justify-center rounded-full text-[10px] font-black shadow-sm border theme-border ${activeStanza === idx ? 'bg-white text-black border-transparent' : 'bg-[var(--badge-bg)] theme-text-muted'}`}>
                  x{stanza.repeat}
                </div>
              )}
            </div>
          ))}

          {song.nara && (
            <div className="mt-16 mb-8 py-8 border-t border-b theme-border flex flex-col items-center justify-center">
               <p className="text-[10px] theme-text-muted uppercase tracking-widest font-bold mb-2">Nara</p>
               <h3 className="text-3xl font-black theme-text font-serif">{song.nara}</h3>
            </div>
          )}

          {sessionActive && (
            <button onClick={onNext} className="w-full max-w-md mx-auto mt-10 theme-accent py-4 rounded-[20px] font-bold flex justify-center items-center gap-2 shadow-xl hover:opacity-90">
              {currentIndex < queue.length - 1 ? 'Next Bhajan' : 'Finish Session'} <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function AdminLogin({ onSuccess, db, appId }) {
  const [pwd, setPwd] = useState('');
  const [err, setErr] = useState('');

  const login = async (e) => {
    e.preventDefault();
    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'config', 'admin');
      const snap = await getDoc(docRef);
      let valid = 'admin';
      if (snap.exists()) valid = snap.data().password;
      else await setDoc(docRef, { password: 'admin' });

      if (pwd === valid) onSuccess();
      else setErr('Incorrect Password');
    } catch (e) { setErr('Error verifying'); }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-6 text-center">
      <ShieldAlert className="w-16 h-16 theme-text-muted mb-4 opacity-50" />
      <h2 className="text-xl font-bold theme-text mb-1">Admin Access</h2>
      <p className="text-sm theme-text-muted mb-6">Manage the devotional library</p>
      <form onSubmit={login} className="w-full max-w-xs space-y-4">
        <input type="password" placeholder="Password" value={pwd} onChange={e=>setPwd(e.target.value)}
          className="w-full text-center py-3 px-4 rounded-xl theme-card theme-border border theme-text focus:outline-none focus:ring-2 focus:ring-[var(--accent)]" />
        {err && <p className="text-red-500 text-xs">{err}</p>}
        <button className="w-full py-3 theme-accent rounded-xl font-bold shadow-md">Login</button>
      </form>
    </div>
  );
}

function AdminDashboard({ songs, onLogout, onEdit }) {
  return (
    <div className="pb-10">
      <div className="flex justify-between items-center mb-4">
         <h2 className="font-bold theme-text">Library ({songs.length})</h2>
         <button onClick={onLogout} className="text-xs theme-text-muted border theme-border px-3 py-1 rounded-full">Logout</button>
      </div>
      <button onClick={() => onEdit('new')} className="w-full theme-accent py-3 rounded-2xl font-bold flex justify-center items-center gap-2 mb-4 shadow-sm">
         <Plus className="w-4 h-4"/> Add New Song
      </button>
      <div className="space-y-2">
        {songs.map(song => (
          <div key={song.id} className="theme-card p-3 rounded-xl border theme-border flex justify-between items-center shadow-sm">
            <span className="font-semibold text-sm theme-text truncate">{song.titleEng || song.titleHindi}</span>
            <button onClick={() => onEdit(song)} className="p-2 text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg"><Edit3 className="w-4 h-4"/></button>
          </div>
        ))}
      </div>
    </div>
  )
}

function AdminForm({ initialData, onClose, db, appId }) {
  const [data, setData] = useState(initialData || { titleHindi:'', titleEng:'', category:'All', videoId:'', nara:'', hindiLyrics:[], englishLyrics:[] });

  const save = async () => {
    if(!data.titleHindi) return;
    const ref = collection(db, 'artifacts', appId, 'public', 'data', 'bhajans');
    if(data.id) await updateDoc(doc(ref, data.id), data);
    else await addDoc(ref, data);
    onClose();
  };

  return (
    <div className="p-5 pb-24 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onClose} className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5"><ChevronLeft className="w-6 h-6 theme-text"/></button>
        <h2 className="font-bold theme-text">{initialData ? 'Edit' : 'New'} Bhajan</h2>
        <div className="w-8"></div>
      </div>

      <div className="space-y-4">
        <div><label className="text-xs font-bold theme-text-muted uppercase mb-1 block">Hindi Title</label>
        <input className="w-full p-3 rounded-xl theme-card border theme-border theme-text outline-none" value={data.titleHindi} onChange={e=>setData({...data, titleHindi:e.target.value})}/></div>
        
        <div><label className="text-xs font-bold theme-text-muted uppercase mb-1 block">English Title</label>
        <input className="w-full p-3 rounded-xl theme-card border theme-border theme-text outline-none" value={data.titleEng} onChange={e=>setData({...data, titleEng:e.target.value})}/></div>

        <div><label className="text-xs font-bold theme-text-muted uppercase mb-1 block">Category & Video ID</label>
        <div className="flex gap-2">
           <select className="flex-1 p-3 rounded-xl theme-card border theme-border theme-text outline-none" value={data.category} onChange={e=>setData({...data, category:e.target.value})}>
             {['All','Ganesha','Shiva','Krishna','Durga'].map(c => <option key={c}>{c}</option>)}
           </select>
           <input placeholder="YouTube ID" className="flex-1 p-3 rounded-xl theme-card border theme-border theme-text outline-none" value={data.videoId} onChange={e=>setData({...data, videoId:e.target.value})}/>
        </div></div>

        <div><label className="text-xs font-bold theme-text-muted uppercase mb-1 block">Nara (Closing Chant)</label>
        <input className="w-full p-3 rounded-xl theme-card border theme-border theme-text outline-none" value={data.nara} onChange={e=>setData({...data, nara:e.target.value})}/></div>

        <button onClick={save} className="w-full py-4 mt-6 theme-accent rounded-2xl font-bold shadow-lg">Save Bhajan</button>
      </div>
    </div>
  )
}