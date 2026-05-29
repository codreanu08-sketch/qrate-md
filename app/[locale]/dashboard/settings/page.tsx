'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Settings, Shield, Smartphone, Save, Loader2, CheckCircle, Link2, Send, Copy, Check, ExternalLink, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { sendCustomResetEmail } from '@/app/actions/auth-actions';
import ru from '@/messages/ru.json';
import ro from '@/messages/ro.json';

interface Location {
  id: string;
  name: string;
  telegram_chat_ids: string;
}

export default function SettingsPage() {
  const params = useParams();
  const locale = (params?.locale as 'ro' | 'ru') || 'ro';
  const messages = useMemo(() => (locale === 'ru' ? ru : ro), [locale]);
  const t = useMemo(() => (messages as any)?.Settings || {}, [messages]);

  const [telegramId, setTelegramId] = useState('');
  const [googleReviewUrl, setGoogleReviewUrl] = useState('');
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [copiedBadge, setCopiedBadge] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingLocationId, setSavingLocationId] = useState<string | null>(null);
  const [showSavedSuccess, setShowSavedSuccess] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [locations, setLocations] = useState<Location[]>([]);
  const [billingData] = useState({ company_name: '', idno: '', vat_code: '', company_address: '', company_bank_account: '', company_bank_name: '', billing_email: '' });

  const BOT_USERNAME = 'Qrate_bot';

  const embedCode = companyId ? `<!-- QRate Verified Badge -->\n<iframe \n  src="https://www.qrate.md/badge/${companyId}"\n  style="border:none;width:260px;height:70px;overflow:hidden;"\n  scrolling="no"\n  title="QRate Verified Badge"\n></iframe>` : '';

  const updateLocationTelegram = (locationId: string, value: string) =>
    setLocations(prev => prev.map(loc => loc.id === locationId ? { ...loc, telegram_chat_ids: value } : loc));

  const saveLocationTelegram = async (location: Location) => {
    setSavingLocationId(location.id);
    try {
      const { error } = await supabase.from('locations').update({ telegram_chat_ids: location.telegram_chat_ids.trim() }).eq('id', location.id);
      if (error) throw error;
    } catch (err: any) { alert('Eroare: ' + err.message); }
    finally { setSavingLocationId(null); }
  };

  useEffect(() => {
    async function loadSettings() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserEmail(session.user.email || '');
        const { data: company } = await supabase.from('companies').select('*').eq('owner_id', session.user.id).maybeSingle();
        if (company) {
          setCompanyId(company.id);
          setTelegramId(company.telegram_chat_id || '');
          setGoogleReviewUrl(company.google_review_url || '');
          const { data: locs } = await supabase.from('locations').select('id, name, telegram_chat_ids').eq('company_id', company.id).order('name');
          if (locs) setLocations(locs);
        }
      }
      setLoading(false);
    }
    loadSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Session expired');
      const { data: curr } = await supabase.from('companies').select('slug, name').eq('owner_id', session.user.id).maybeSingle();
      let slug = curr?.slug;
      if (!slug) {
        const name = billingData.company_name || session.user.email?.split('@')[0] || 'qrate';
        slug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9\s-]/g,'').replace(/\s+/g,'-').substring(0,40) + '-' + Math.random().toString(36).substring(2,8);
      }
      const { error } = await supabase.from('companies').upsert({ owner_id: session.user.id, name: billingData.company_name || curr?.name || 'Compania Mea', telegram_chat_id: telegramId.trim(), google_review_url: googleReviewUrl.trim() || null, slug }, { onConflict: 'owner_id' });
      if (error) throw error;
      setShowSavedSuccess(true);
      setTimeout(() => setShowSavedSuccess(false), 3000);
    } catch (err: any) { alert((t?.errors?.save || 'Eroare: ') + err.message); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="animate-spin text-blue-600" size={28} />
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto text-slate-900 pb-36 md:pb-16">

      {/* HEADER */}
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase flex items-center gap-3">
          <Settings className="text-blue-600" size={28} />
          {t?.title || 'Setări Cont'}
        </h1>
        <p className="text-slate-400 font-medium text-sm mt-1">{t?.subtitle || 'Gestionează notificările și datele fiscale'}</p>
      </header>

      <div className="space-y-5">

        {/* ── TELEGRAM ── */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-50 rounded-2xl text-blue-600 shrink-0"><Smartphone size={22} /></div>
            <div>
              <h2 className="text-base font-black uppercase tracking-tight">{t?.telegram?.title || 'Notificări Telegram'}</h2>
              <p className="text-xs text-slate-400 font-medium">{t?.telegram?.desc || 'Primește alerte la fiecare recenzie'}</p>
            </div>
          </div>

          {/* Steps */}
          <div className="grid md:grid-cols-2 gap-4 mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="space-y-2">
              <span className="inline-block px-2.5 py-0.5 bg-blue-600 text-white font-black text-[9px] uppercase rounded-full tracking-wider">{locale==='ru'?'Шаг 1':'Pasul 1'}</span>
              <p className="text-xs font-bold text-slate-700">{locale==='ru'?'Запустите бота.':'Pornește botul pentru a primi mesaje.'}</p>
              <a href={`https://t.me/${BOT_USERNAME}`} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase rounded-xl transition-all">
                <Send size={12}/> Start Bot
              </a>
            </div>
            <div className="space-y-2 border-t md:border-t-0 md:border-l border-slate-200 pt-3 md:pt-0 md:pl-4">
              <span className="inline-block px-2.5 py-0.5 bg-slate-800 text-white font-black text-[9px] uppercase rounded-full tracking-wider">{locale==='ru'?'Шаг 2':'Pasul 2'}</span>
              <p className="text-xs font-bold text-slate-700">{locale==='ru'?'Узнайте Chat ID.':'Află Chat ID-ul tău.'}</p>
              <p className="text-[10px] text-slate-400">{locale==='ru'?'Напишите':'Trimite un mesaj la'}{' '}
                <a href="https://t.me/userinfobot" target="_blank" rel="noreferrer" className="text-blue-600 font-bold underline">@userinfobot</a>
              </p>
            </div>
          </div>

          {/* Company ID */}
          <div className="mb-5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1 block mb-1.5">
              {locale==='ru'?'ID компании (все уведомления)':'ID-uri companie (toate notificările)'}
            </label>
            <input type="text" value={telegramId} onChange={e=>setTelegramId(e.target.value)}
              placeholder="Ex: 890236835, 123456789"
              className="w-full p-3.5 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-blue-500 outline-none font-bold text-sm transition-all placeholder:text-slate-300"/>
          </div>

          {/* Per-location */}
          {locations.length > 0 && (
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1 block mb-2">
                {locale==='ru'?'ID per локация':'ID-uri per locație'}
              </label>
              <div className="space-y-2.5">
                {locations.map(loc => (
                  <div key={loc.id} className="bg-slate-50 rounded-2xl border border-slate-100 p-3.5">
                    <div className="flex items-center gap-1.5 mb-2">
                      <MapPin size={12} className="text-indigo-500 shrink-0"/>
                      <span className="text-[10px] font-black uppercase text-slate-600 truncate">{loc.name}</span>
                    </div>
                    <div className="flex gap-2">
                      <input type="text" value={loc.telegram_chat_ids||''} onChange={e=>updateLocationTelegram(loc.id,e.target.value)}
                        placeholder="Ex: 890236835"
                        className="flex-1 px-3.5 py-2.5 bg-white border-2 border-transparent rounded-xl focus:border-indigo-400 outline-none font-bold text-sm transition-all placeholder:text-slate-300"/>
                      <button onClick={()=>saveLocationTelegram(loc)} disabled={savingLocationId===loc.id}
                        className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-[10px] uppercase tracking-wider flex items-center gap-1 shrink-0 disabled:opacity-60">
                        {savingLocationId===loc.id?<Loader2 size={13} className="animate-spin"/>:<><Save size={12}/>{locale==='ru'?'OK':'OK'}</>}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── GOOGLE REVIEWS ── */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 md:p-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-3 bg-blue-50 rounded-2xl shrink-0">
              <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            </div>
            <div>
              <h2 className="text-base font-black uppercase tracking-tight">{locale==='ru'?'Google Reviews — Ссылка':'Google Reviews — Link Companie'}</h2>
              <p className="text-xs text-slate-400 font-medium">{locale==='ru'?'Fallback dacă локация не имеет своей ссылки':'Fallback dacă o locație nu are propriul link'}</p>
            </div>
          </div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1 flex items-center gap-1 mb-1.5"><Link2 size={11}/>URL</label>
          <input type="url" value={googleReviewUrl} onChange={e=>setGoogleReviewUrl(e.target.value)}
            placeholder="https://g.page/r/..."
            className="w-full p-3.5 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-blue-500 outline-none font-bold text-sm transition-all placeholder:text-slate-300"/>
          <p className="text-[10px] text-slate-400 ml-1 mt-1.5 italic">{locale==='ru'?'Клиенты с 4-5 звёздами увидят кнопку Google. Ссылка локации имеет приоритет.':'Clienții cu 4-5 stele vor fi redirecționați spre Google. Link-ul locației are prioritate.'}</p>
        </div>

        {/* ── BADGE ── */}
        {companyId && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 md:p-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-3 bg-blue-50 rounded-2xl shrink-0">
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
                </svg>
              </div>
              <div>
                <h2 className="text-base font-black uppercase tracking-tight">QRate Verified Badge</h2>
                <p className="text-xs text-slate-400 font-medium">{locale==='ru'?'Виджет для сайта — как TrustPilot, для Молдовы':'Widget pentru site-ul tău — ca TrustPilot, pentru Moldova'}</p>
              </div>
            </div>

            {/* Preview */}
            <div className="mb-4 p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center min-h-[90px]">
              <iframe
                src={`/badge/${companyId}`}
                style={{ border: 'none', width: '260px', height: '70px', overflow: 'hidden' }}
                scrolling="no"
                title="QRate Badge Preview"
              />
            </div>

            {/* Embed code */}
            <div className="relative">
              <pre className="bg-slate-900 text-emerald-400 p-4 rounded-2xl text-[11px] font-mono overflow-x-auto leading-relaxed whitespace-pre-wrap">{embedCode}</pre>
              <button onClick={()=>{navigator.clipboard.writeText(embedCode);setCopiedBadge(true);setTimeout(()=>setCopiedBadge(false),2500);}}
                className={`absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all ${copiedBadge?'bg-emerald-500 text-white':'bg-white text-slate-700 hover:bg-slate-100'}`}>
                {copiedBadge?<><Check size={11}/>{locale==='ru'?'Скопировано!':'Copiat!'}</>:<><Copy size={11}/>{locale==='ru'?'Копировать':'Copiază'}</>}
              </button>
            </div>
            <a href={`/badge/${companyId}`} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 text-[10px] font-black uppercase tracking-wider transition-colors">
              <ExternalLink size={12}/>{locale==='ru'?'Preview badge':'Preview badge'}
            </a>
          </div>
        )}

        {/* ── SECURITATE ── */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 md:p-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-3 bg-slate-50 rounded-2xl text-slate-600 shrink-0"><Shield size={20}/></div>
            <h2 className="text-base font-black uppercase tracking-tight">{t?.security?.title||'Securitate'}</h2>
          </div>
          <button onClick={async()=>{ if(!userEmail) return; try { await sendCustomResetEmail(userEmail, locale); alert(t?.alerts?.reset_sent||'Link trimis!'); } catch(e:any){ alert(e.message); }}}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-black px-5 py-3 rounded-2xl text-xs uppercase tracking-wider transition-colors">
            {t?.security?.reset_btn||'Resetează parola'}
          </button>
        </div>

      </div>

      {/* ✅ SAVE BUTTON — fixed pe mobile, normal pe desktop */}
      {/* Pe mobile: fixed bottom cu padding suficient peste bottom nav (height ~70px) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:static md:z-auto md:bottom-auto md:left-auto md:right-auto md:mt-6">
        <div className="bg-white/95 backdrop-blur-lg md:bg-transparent md:backdrop-blur-none border-t border-slate-200 md:border-0 px-4 py-3 md:p-0" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 80px)' }}>
          <div className="md:hidden flex items-center justify-between gap-3 max-w-4xl mx-auto">
            {showSavedSuccess && (
              <div className="flex items-center gap-1.5 text-emerald-600 shrink-0">
                <CheckCircle size={15}/><span className="text-[10px] font-black uppercase">{t?.alerts?.saved_success||'Salvat!'}</span>
              </div>
            )}
            <button onClick={handleSave} disabled={saving}
              className="flex-1 bg-slate-900 hover:bg-blue-600 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60">
              {saving?<Loader2 className="animate-spin" size={16}/>:<><Save size={15}/>{t?.save_btn||'Salvează'}</>}
            </button>
          </div>
          {/* Desktop: normal */}
          <div className="hidden md:flex items-center justify-between gap-4">
            {showSavedSuccess && (
              <div className="flex items-center gap-2 text-emerald-600">
                <CheckCircle size={16}/><span className="text-xs font-black uppercase">{t?.alerts?.saved_success||'Modificări Salvate!'}</span>
              </div>
            )}
            <button onClick={handleSave} disabled={saving}
              className="ml-auto bg-slate-900 hover:bg-blue-600 text-white px-10 py-4 rounded-3xl font-black uppercase text-xs tracking-wider flex items-center gap-2 transition-all active:scale-95 disabled:opacity-60">
              {saving?<Loader2 className="animate-spin" size={16}/>:<><Save size={16}/>{t?.save_btn||'Salvează Modificările'}</>}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}