import { useState, useEffect } from 'react';
import PublicForm from './components/PublicForm';
import AdminPanel from './components/AdminPanel';
import { testConnection } from './firestoreService';
import logoUrl from './assets/famagusta_logo.jpeg';
import { AcLogo } from './components/AcLogo';

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  // Simple routing listener
  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handleLocationChange);
    
    // Periodically sync path to catch history.pushState if needed
    const interval = setInterval(() => {
      if (window.location.pathname !== currentPath) {
        setCurrentPath(window.location.pathname);
      }
    }, 500);

    // Call connection test as mandated by the Firebase Integration Skill
    testConnection();

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      clearInterval(interval);
    };
  }, [currentPath]);

  return (
    <div className="min-h-screen bg-[#FDFCF8] font-sans antialiased text-[#2D3A30]">
      <main className="min-h-[calc(100vh-80px)]">
        {currentPath === '/admin' ? (
          <AdminPanel />
        ) : (
          <PublicForm />
        )}
      </main>
      
      {/* Footer */}
      <footer className="py-6 border-t border-[#2D3A30]/10 bg-[#FAF9F5]">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[#2D3A30]/50 text-[11px]">
            <img
              src={logoUrl}
              alt="Café Famagusta Logo"
              className="w-6 h-6 rounded-full object-cover border border-stone-200/80 shadow-xs"
            />
            <span>© 2026 Café Famagusta — World Cup Edition</span>
          </div>

          <a
            href="https://ashrafchihab.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-[11px] text-[#2D3A30]/40 hover:text-[#C5A059] transition-colors group"
          >
            <span className="text-[10px] font-light">Créé par</span>
            <AcLogo size={20} />
            <span className="font-semibold tracking-wide">Ashraf Chihab</span>
          </a>
        </div>
      </footer>
    </div>
  );
}
