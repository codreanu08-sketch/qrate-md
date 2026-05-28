'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Settings, Shield, Smartphone, Save, Loader2, CheckCircle, Link2, Send } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { sendCustomResetEmail } from '@/app/actions/auth-actions';
import ru from '@/messages/ru.json';
import ro from '@/messages/ro.json';

export default function SettingsPage() {
  const params = useParams();
  const locale = (params?.locale as 'ro' | 'ru') || 'ro';
  const messages = useMemo(() => (locale === 'ru' ? ru : ro), [locale]);
  const t = useMemo(() => messages?.Settings || {}, [messages]);

  const [telegramId, setTelegramId] = useState('');
  const [googleReviewUrl, setGoogleReviewUrl] = useState(''); // ✅ NOU - fallback companie
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSavedSuccess, setShowSavedSuccess] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const userIdKey = 'owner_id';

  const [isLegalEntity, setIsLegalEntity] = useState(false);
  const [billingData, setBillingData] = useState({
    company_name: '', idno: '', vat_code: '', company_address: '',
    company_bank_account: '', company_bank_name: '', billing_email: ''
  });

  const BOT_USERNAME = "Qrate_bot";

  useEffect(() => {
    async function loadSettings() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserEmail(session.user.email || '');
        const { data } = await supabase.from('companies').select('*').eq('owner_id', session.user.id).maybeSingle();
        if (data) {
          setTelegramId(data.telegram_chat_id || '');
          setGoogleReviewUrl(data.google_review_url || ''); // ✅ NOU
          const savedBilling = data.billing_details || {};
          setIsLegalEntity(savedBilling.is_legal_entity || false);
          setBillingData({
            company_name: savedBilling.company_name || '',
            idno: savedBilling.idno || '',
            vat_code: savedBilling.vat_code || '',
            company_address: savedBilling.company_address || '',
            company_bank_account: savedBilling.company_bank_account || '',
            company_bank_name: savedBilling.company_bank_name || '',
            billing_email: savedBilling.billing_email || ''
          });
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
      if (!session) throw new Error("Session expired");

      const { data: currentCompany } = await supabase.from('companies').select('slug, name').eq('owner_id', session.user.id).maybeSingle();

      let slug = currentCompany?.slug;
      if (!slug) {
        const { data: { user } } = await supabase.auth.getUser();
        const companyName = billingData.company_name || user?.email?.split('@')[0] || 'qrate-company';
        slug = companyName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").substring(0, 40) + "-" + Math.random().toString(36).substring(2, 8);
      }

      const companyName = billingData.company_name || currentCompany?.name || "Compania Mea";

      const { error } = await supabase.from('companies').upsert({
        [userIdKey]: session.user.id,
        name: companyName,
        telegram_chat_id: telegramId.trim(),
        google_review_url: googleReviewUrl.trim() || null, // ✅ NOU
        billing_details: {
          is_legal_entity: isLegalEntity,
          ...billingData
        },
        slug: slug
      }, { onConflict: userIdKey });

      if (error) throw error;
      setShowSavedSuccess(true);
      setTimeout(() => setShowSavedSuccess(false), 3000);
    } catch (err: any) {
      alert((t?.errors?.save || "Eroare la salvare: ") + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!userEmail) return;
    try {
      await sendCustomResetEmail(userEmail, locale as string);
      alert(t?.alerts?.reset_sent || "Link-ul de resetare a fost trimis pe email!");
    } catch (err: any) {
      alert("Eroare la trimiterea email-ului: " + err.message);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin text-blue-600" size={32} /></div>;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto text-slate-900">
      <header className="mb-8 md:mb-10">
        <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase flex items-center gap-3">
          <Settings className="text-blue-600" size={32} />
          {t?.title || "Setări Cont"}
        </h1>
        <p className="text-slate-500 font-medium text-base md:text-lg mt-1">{t?.subtitle || "Gestionează notificările și datele fiscale"}</p>
      </header>

      <div className="space-y-6 md:space-y-8">

        {/* TELEGRAM */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl p-6 md:p-10">
          <div className="flex items-center gap-4 mb-6 md:mb-8">
            <div className="p-3 md:p-4 bg-blue-50 rounded-2xl text-blue-600"><Smartphone size={24} /></div>
            <div>
              <h2 className="text-lg md:text-xl font-black uppercase tracking-tight">{t?.telegram?.title || "Notificări Telegram"}</h2>
              <p className="text-sm text-slate-500 font-medium">{t?.telegram?.desc || "Primește alerte instantanee la fiecare recenzie nouă"}</p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-6 md:gap-8 mb-6 md:mb-8 bg-slate-50/60 p-4 md:p-6 rounded-3xl border border-slate-100">
            <div className="space-y-2">
              <span className="inline-block px-3 py-1 bg-blue-600 text-white font-black text-[10px] uppercase rounded-full tracking-wider">Pasul 1</span>
              <p className="text-sm font-bold text-slate-700">Pornește botul pentru a primi mesaje.</p>
              <a href={`https://t.me/${BOT_USERNAME}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 mt-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md w-full md:w-auto justify-center">
                <Send size={14} /> Start Bot
              </a>
            </div>
            <div className="space-y-2 border-t md:border-t-0 md:border-l border-slate-200/80 pt-4 md:pt-0 md:pl-8">
              <span className="inline-block px-3 py-1 bg-slate-800 text-white font-black text-[10px] uppercase rounded-full tracking-wider">Pasul 2</span>
              <p className="text-sm font-bold text-slate-700">Află Chat ID-ul tău.</p>
              <p className="text-xs text-slate-400 font-medium">
                Trimite un mesaj la <a href="https://t.me/userinfobot" target="_blank" rel="noreferrer" className="text-blue-600 underline font-bold">@userinfobot</a>
              </p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-6 md:gap-8 items-center">
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.1em] ml-2">
                {locale === 'ru' ? 'Telegram ID-ы (через запятую)' : 'Telegram Chat ID-uri (separate prin virgulă)'}
              </label>
              <input type="text" value={telegramId} onChange={(e) => setTelegramId(e.target.value)}
                placeholder="Ex: 890236835, 123456789"
                className="w-full p-4 md:p-5 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-blue-500 outline-none font-bold text-lg transition-all placeholder:text-slate-300 shadow-inner" />
            </div>
            <div className="text-xs font-bold text-blue-900 bg-blue-50/50 p-4 md:p-5 rounded-2xl border border-blue-100">
              ✨ {locale === 'ru' ? 'Уведомления будут приходить всем указанным ID.' : 'Toate ID-urile introduse vor primi notificări instantanee.'}
            </div>
          </div>
        </div>

        {/* ✅ NOU — GOOGLE REVIEWS FALLBACK */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl p-6 md:p-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 md:p-4 bg-blue-50 rounded-2xl">
              <svg viewBox="0 0 24 24" className="w-6 h-6" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-black uppercase tracking-tight">
                {locale === 'ru' ? 'Google Reviews — Ссылка компании' : 'Google Reviews — Link Companie'}
              </h2>
              <p className="text-sm text-slate-500 font-medium">
                {locale === 'ru' ? 'Используется если у локации нет своей ссылки Google.' : 'Folosit dacă o locație nu are propriul link Google.'}
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.1em] ml-2 flex items-center gap-1.5">
              <Link2 size={12} /> {locale === 'ru' ? 'Ссылка Google Reviews (для всей компании)' : 'Link Google Reviews (pentru toată compania)'}
            </label>
            <input type="url" value={googleReviewUrl} onChange={(e) => setGoogleReviewUrl(e.target.value)}
              placeholder="https://g.page/r/..."
              className="w-full p-4 md:p-5 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-blue-500 outline-none font-bold text-base transition-all placeholder:text-slate-300 shadow-inner" />
            <p className="text-[10px] text-slate-400 ml-2 italic">
              {locale === 'ru'
                ? 'Клиенты с 4-5 звёздами увидят кнопку для отзыва на Google. Ссылка локации имеет приоритет.'
                : 'Clienții cu 4-5 stele vor vedea butonul de recenzie Google. Link-ul locației are prioritate față de cel al companiei.'}
            </p>
          </div>
        </div>

        {/* SECURITATE */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl p-6 md:p-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 md:p-4 bg-slate-50 rounded-2xl text-slate-600"><Shield size={24} /></div>
            <div>
              <h2 className="text-lg md:text-xl font-black uppercase tracking-tight">{t?.security?.title || "Securitate"}</h2>
            </div>
          </div>
          <button onClick={handleResetPassword} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-black px-6 py-3 rounded-2xl text-xs uppercase tracking-wider transition-colors">
            {t?.security?.reset_btn || "Resetează parola"}
          </button>
        </div>

        {/* SAVE */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4">
          <div className="flex items-center gap-3">
            {showSavedSuccess && (
              <div className="flex items-center gap-2 text-emerald-600">
                <CheckCircle size={18} />
                <span className="text-xs font-black uppercase tracking-widest">{t?.alerts?.saved_success || "Modificări Salvate!"}</span>
              </div>
            )}
          </div>
          <button onClick={handleSave} disabled={saving}
            className="w-full md:w-auto bg-slate-900 text-white px-10 py-4 md:py-5 rounded-3xl font-black uppercase text-xs tracking-[0.2em] hover:bg-blue-600 transition-all flex items-center justify-center gap-2 active:scale-95">
            {saving ? <Loader2 className="animate-spin" size={18} /> : <><Save size={18} /> {t?.save_btn || "Salvează Modificările"}</>}
          </button>
        </div>
      </div>
    </div>
  );
}