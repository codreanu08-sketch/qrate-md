'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { 
  Settings, Shield, Smartphone, Save, 
  Loader2, CheckCircle, Sparkles, Building2, Download, Mail, Send
} from 'lucide-react';
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showSavedSuccess, setShowSavedSuccess] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  
  const userIdKey = 'owner_id'; 

  const [isLegalEntity, setIsLegalEntity] = useState(false);
  const [billingData, setBillingData] = useState({
    company_name: '',
    idno: '',
    vat_code: '',
    company_address: '',
    company_bank_account: '',
    company_bank_name: '',
    billing_email: ''
  });

  const BOT_USERNAME = "Qrate_bot"; 

  useEffect(() => {
    async function loadSettings() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserEmail(session.user.email || '');
        
        const { data, error } = await supabase
          .from('companies')
          .select('*')
          .eq('owner_id', session.user.id)
          .maybeSingle();

        if (data) {
          setTelegramId(data.telegram_chat_id || '');
          
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

      const { data: currentCompany } = await supabase
        .from('companies')
        .select('slug, name')
        .eq('owner_id', session.user.id)
        .maybeSingle();

      let slug = currentCompany?.slug;
      if (!slug) {
        const { data: { user } } = await supabase.auth.getUser();
        const companyName = billingData.company_name || user?.email?.split('@')[0] || 'qrate-company';
        
        slug = companyName
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-")
          .substring(0, 40) + 
          "-" + Math.random().toString(36).substring(2, 8);
      }

      const companyName = billingData.company_name || currentCompany?.name || "Compania Mea";

      const billingPayload = {
        is_legal_entity: isLegalEntity,
        company_name: billingData.company_name,
        idno: billingData.idno,
        vat_code: billingData.vat_code,
        company_address: billingData.company_address,
        company_bank_account: billingData.company_bank_account,
        company_bank_name: billingData.company_bank_name,
        billing_email: billingData.billing_email
      };

      const updatePayload = { 
        [userIdKey]: session.user.id,
        name: companyName,
        telegram_chat_id: telegramId.trim(), // Salvăm string-ul curat
        billing_details: billingPayload,
        slug: slug
      };

      const { error } = await supabase
        .from('companies')
        .upsert(updatePayload, { onConflict: userIdKey });

      if (error) throw error;
      
      setShowSavedSuccess(true);
      setTimeout(() => setShowSavedSuccess(false), 3000);
    } catch (err: any) {
      alert((t?.errors?.save || "Eroare la salvare: ") + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadInvoice = async () => {
    setDownloading(true);
    try {
      const response = await fetch('/api/invoices/latest');
      if (!response.ok) throw new Error("No invoices found");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Factura_${billingData.company_name || 'QRate'}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      alert(locale === 'ru' ? "Скачивание не удалось: Проверьте историю оплат." : "Descărcare eșuată: Verifică istoria plăților.");
    } finally {
      setDownloading(false);
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

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="animate-spin text-blue-600" size={32} />
    </div>
  );

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
            {/* ... (pașii 1 și 2 rămân la fel) ... */}
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
              <input 
                type="text" value={telegramId}
                onChange={(e) => setTelegramId(e.target.value)}
                placeholder="Ex: 890236835, 123456789"
                className="w-full p-4 md:p-5 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-blue-500 focus:ring-4 ring-blue-500/10 outline-none font-bold text-lg transition-all placeholder:text-slate-300 shadow-inner"
              />
              <p className="text-[10px] text-slate-400 ml-2 italic">
                {locale === 'ru' ? 'Укажите ID через запятую' : 'Poți introduce mai multe ID-uri, separate prin virgulă.'}
              </p>
            </div>
            <div className="text-xs font-bold text-blue-900 bg-blue-50/50 p-4 md:p-5 rounded-2xl border border-blue-100 flex items-center h-auto md:h-[68px]">
              ✨ {locale === 'ru' ? 'Уведомления будут приходить всем указанным ID.' : 'Toate ID-urile introduse vor primi notificări instantanee.'}
            </div>
          </div>
        </div>

        {/* ... (restul componentei Billing și Security rămâne neschimbat) ... */}
        
        {/* Footer-ul cu butonul de Salvare rămâne la fel */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4">
          <div className="flex items-center gap-3">
            {showSavedSuccess && (
              <div className="flex items-center gap-2 text-emerald-600">
                <CheckCircle size={18} />
                <span className="text-xs font-black uppercase tracking-widest">{t?.alerts?.saved_success || "Modificări Salvate!"}</span>
              </div>
            )}
          </div>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="w-full md:w-auto bg-slate-900 text-white px-10 py-4 md:py-5 rounded-3xl font-black uppercase text-xs tracking-[0.2em] hover:bg-blue-600 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            {saving ? <Loader2 className="animate-spin" size={18} /> : <><Save size={18} /> {t?.save_btn || "Salvează Modificările"}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ... (BillingInput component rămâne la fel) ...
interface BillingInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
}

function BillingInput({ label, value, onChange, placeholder, icon }: BillingInputProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.1em] ml-1">{label}</label>
      <div className="relative flex items-center">
        {icon && <div className="absolute left-4 text-slate-400 pointer-events-none z-10">{icon}</div>}
        <input 
          type="text" 
          value={value} 
          onChange={(e) => onChange(e.target.value)} 
          placeholder={placeholder}
          className={`w-full p-4 md:p-5 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-emerald-500 focus:ring-4 ring-emerald-500/10 outline-none font-bold text-base transition-all placeholder:text-slate-300 shadow-inner ${icon ? 'pl-11' : ''}`} 
        />
      </div>
    </div>
  );
}