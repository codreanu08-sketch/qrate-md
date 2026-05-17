'use client';

import { useState, useEffect } from 'react';
import { X, Cookie } from 'lucide-react';
import Link from 'next/link';

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const hasAccepted = localStorage.getItem('cookies-accepted');
    if (!hasAccepted) {
      setShowBanner(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('cookies-accepted', 'true');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-6 left-6 right-6 z-[100] md:left-auto md:max-w-md animate-in slide-in-from-bottom-10 duration-500">
      <div className="bg-white border border-slate-100 shadow-2xl shadow-blue-200/50 rounded-[2rem] p-6">
        <div className="flex items-start gap-4">
          <div className="bg-blue-50 p-3 rounded-2xl text-blue-600">
            <Cookie size={24} />
          </div>
          <div className="flex-1 space-y-2">
            <h3 className="font-black text-slate-900 uppercase tracking-tighter text-sm">Experiență optimizată</h3>
            <p className="text-[11px] text-slate-500 leading-relaxed font-medium italic">
              Folosim cookies pentru autentificare și analiză. Continuând navigarea, ești de acord cu 
              <Link href="/ro/legal/privacy" className="text-blue-600 hover:underline mx-1 font-bold">Politica noastră</Link>.
            </p>
          </div>
          <button onClick={() => setShowBanner(false)} className="text-slate-300 hover:text-slate-600 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="mt-6">
          <button 
            onClick={acceptCookies}
            className="w-full bg-slate-950 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-blue-600 transition-all active:scale-95 shadow-lg shadow-slate-200"
          >
            Acceptă tot
          </button>
        </div>
      </div>
    </div>
  );
}