'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { 
  Settings, Shield, Smartphone, Save, 
  Loader2, CheckCircle, Sparkles, Building2, Download, Mail, Send
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

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
        telegram_chat_id: telegramId,
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
      alert(locale === 'ru' ? "Скачивание не удалось: Проверьте историю оплат." : "Descărcare eșuată: Verifică istoricul plăților active.");
    } finally {
      setDownloading(false);
    }
  };

  const handleResetPassword = async () => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(userEmail, {
        redirectTo: `${window.location.origin}/${locale}/auth/update-password`,
      });
      if (error) throw error;
      alert(t?.alerts?.reset_sent || "Link-ul de resetare a fost trimis pe email!");
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="animate-spin text-blue-600" size={32} />
    </div>
  );

  return (
    <div className="p-8 max-w-4xl mx-auto text-slate-900 animate-in fade-in duration-500">
      <header className="mb-10">
        <h1 className="text-4xl font-black tracking-tighter uppercase flex items-center gap-3">
          <Settings className="text-blue-600" size={36} />
          {t?.title || "Setări Cont"}
        </h1>
        <p className="text-slate-500 font-medium text-lg mt-1">{t?.subtitle || "Gestionează notificările și datele fiscale"}</p>
      </header>

      <div className="space-y-8">
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-4 bg-blue-50 rounded-2xl text-blue-600 shadow-sm"><Smartphone size={28} /></div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight">{t?.telegram?.title || "Notificări Telegram"}</h2>
              <p className="text-sm text-slate-500 font-medium">{t?.telegram?.desc || "Primește alerte instantanee la fiecare recenzie nouă"}</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-8 bg-slate-50/60 p-6 rounded-[1.8rem] border border-slate-100">
            <div className="space-y-2">
              <span className="inline-block px-3 py-1 bg-blue-600 text-white font-black text-[10px] uppercase rounded-full tracking-wider">
                {locale === 'ru' ? 'Шаг 1' : 'Pasul 1'}
              </span>
              <p className="text-sm font-bold text-slate-700">
                {locale === 'ru' ? 'Активируйте нашего бота...' : 'Activează botul nostru de Telegram...'}
              </p>
              <a href={`https://t.me/${BOT_USERNAME}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 mt-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95">
                <Send size={14} /> {locale === 'ru' ? 'Запустить Бота' : 'Pornește Botul'}
              </a>
            </div>
            <div className="space-y-2 border-t md:border-t-0 md:border-l border-slate-200/80 pt-4 md:pt-0 md:pl-8">
              <span className="inline-block px-3 py-1 bg-slate-800 text-white font-black text-[10px] uppercase rounded-full tracking-wider">
                {locale === 'ru' ? 'Шаг 2' : 'Pasul 2'}
              </span>
              <p className="text-sm font-bold text-slate-700">
                {locale === 'ru' ? 'Узнайте свой уникальный Chat ID...' : 'Află Chat ID-ul tău unic...'}
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.1em] ml-2">
                {locale === 'ru' ? 'Ваш Telegram Chat ID' : 'Telegram Chat ID-ul tău'}
              </label>
              <input 
                type="text" value={telegramId}
                onChange={(e) => setTelegramId(e.target.value)}
                placeholder="Ex: 890236835"
                className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] focus:border-blue-500 focus:ring-4 ring-blue-500/10 outline-none font-bold text-lg transition-all placeholder:text-slate-300 shadow-inner"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-10">
          {/* Restul codului pentru Billing ... */}
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600 shadow-sm"><Building2 size={28} /></div>
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight">{t?.billing?.title || "Date de Facturare"}</h2>
                <p className="text-sm text-slate-500 font-medium mt-1">{t?.billing?.desc || "Setează datele firmei"}</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer scale-110">
              <input type="checkbox" className="sr-only peer" checked={isLegalEntity} onChange={() => setIsLegalEntity(!isLegalEntity)} />
              <div className="w-12 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-emerald-500"></div>
              <span className="ml-3 text-[11px] font-black text-slate-600 uppercase tracking-widest">{t?.billing?.legal_toggle || "Persoană Juridică"}</span>
            </label>
          </div>
          {/* ... */}
        </div>

        {/* ... Restul componentelor raman neschimbate ... */}
        
      </div>
    </div>
  );
}

// BillingInput component remains the same...
function BillingInput({ label, value, onChange, placeholder, icon }: BillingInputProps) {
    return (
        <div className="space-y-2 relative w-full">
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.1em] ml-2">{label}</label>
          <div className="relative flex items-center">
            {icon && <div className="absolute left-5 text-slate-400">{icon}</div>}
            <input 
              type="text" 
              value={value} 
              onChange={(e) => onChange(e.target.value)} 
              placeholder={placeholder}
              className={`w-full p-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] focus:border-emerald-500 font-bold text-lg ${icon ? 'pl-12' : ''}`} 
            />
          </div>
        </div>
      );
}
