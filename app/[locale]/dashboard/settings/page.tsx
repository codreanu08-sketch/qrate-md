'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { 
  Settings, Shield, Smartphone, Save, 
  Loader2, CheckCircle, Sparkles, Building2, Download, Mail, Send
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Importăm traducerile
import ru from '@/messages/ru.json'; 
import ro from '@/messages/ro.json'; 

export default function SettingsPage() {
  const params = useParams();
  const locale = (params?.locale as 'ro' | 'ru') || 'ro';
  
  // Încarcă dicționarul în mod stabil
  const messages = useMemo(() => (locale === 'ru' ? ru : ro), [locale]);
  
  // Securizăm obiectul 't' ca să nu mai fie undefined sub nicio formă
  const t = useMemo(() => messages?.Settings || {}, [messages]);

  const [telegramId, setTelegramId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showSavedSuccess, setShowSavedSuccess] = useState(false);
  const [userEmail, setUserEmail] = useState('');

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

  // Înlocuiește AICI cu username-ul real al botului tău QRate (fără @)
  const BOT_USERNAME = "QRateBot"; 

  useEffect(() => {
    async function loadSettings() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserEmail(session.user.email || '');
        
        // Căutăm direct în tabela 'companies' pe baza utilizatorului logat
        const { data, error } = await supabase
          .from('companies')
          .select('*')
          .eq('user_id', session.user.id) // Schimbă în 'owner_id' dacă așa se numește coloana la tine
          .maybeSingle();
        
        if (data && !error) {
          setTelegramId(data.telegram_chat_id || '');
          setIsLegalEntity(data.is_legal_entity || false);
          
          // Extragem datele din obiectul JSONB salvat în siguranță
          const details = data.billing_details || {};
          setBillingData({
            company_name: details.company_name || '',
            idno: details.idno || '',
            vat_code: details.vat_code || '',
            company_address: details.company_address || '',
            company_bank_account: details.company_bank_account || '',
            company_bank_name: details.company_bank_name || '',
            billing_email: data.billing_email || details.billing_email || '' // fallback din ambele surse
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

      // Împachetăm toate datele într-un singur payload sigur
      const updatePayload = { 
        telegram_chat_id: telegramId,
        is_legal_entity: isLegalEntity,
        billing_email: billingData.billing_email, // coloana creată la pasul anterior
        billing_details: {
          company_name: billingData.company_name,
          idno: billingData.idno,
          vat_code: billingData.vat_code,
          company_address: billingData.company_address,
          company_bank_account: billingData.company_bank_account,
          company_bank_name: billingData.company_bank_name,
          billing_email: billingData.billing_email
        }
      };

      // Salvăm totul într-un mod flexibil în tabela 'companies'
      const { error } = await supabase
        .from('companies')
        .update(updatePayload)
        .eq('user_id', session.user.id);

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
        
        {/* TELEGRAM */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-4 bg-blue-50 rounded-2xl text-blue-600 shadow-sm"><Smartphone size={28} /></div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight">{t?.telegram?.title || "Notificări Telegram"}</h2>
              <p className="text-sm text-slate-500 font-medium">{t?.telegram?.desc || "Primește alerte instantanee la fiecare recenzie nouă"}</p>
            </div>
          </div>

          {/* Ghid pași Telegram */}
          <div className="grid md:grid-cols-2 gap-8 mb-8 bg-slate-50/60 p-6 rounded-[1.8rem] border border-slate-100">
            <div className="space-y-2">
              <span className="inline-block px-3 py-1 bg-blue-600 text-white font-black text-[10px] uppercase rounded-full tracking-wider">
                {locale === 'ru' ? 'Шаг 1' : 'Pasul 1'}
              </span>
              <p className="text-sm font-bold text-slate-700">
                {locale === 'ru' 
                  ? 'Активируйте нашего бота, чтобы он имел разрешение отправлять вам сообщения.' 
                  : 'Activează botul nostru de Telegram pentru a-i permite să îți trimită mesaje.'}
              </p>
              <a 
                href={`https://t.me/${BOT_USERNAME}`} 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center gap-2 mt-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95"
              >
                <Send size={14} />
                {locale === 'ru' ? 'Запустить Бота (START)' : 'Pornește Botul (START)'}
              </a>
            </div>

            <div className="space-y-2 border-t md:border-t-0 md:border-l border-slate-200/80 pt-4 md:pt-0 md:pl-8">
              <span className="inline-block px-3 py-1 bg-slate-800 text-white font-black text-[10px] uppercase rounded-full tracking-wider">
                {locale === 'ru' ? 'Шаг 2' : 'Pasul 2'}
              </span>
              <p className="text-sm font-bold text-slate-700">
                {locale === 'ru'
                  ? 'Узнайте свой уникальный Chat ID и вставьте его в поле рядом.'
                  : 'Află Chat ID-ul tău unic și introduce-l în câmpul alăturat.'}
              </p>
              <p className="text-xs text-slate-400 font-medium">
                {locale === 'ru' ? 'Отправьте любое сообщение боту' : 'Trimite orice mesaj la botul'}{' '}
                <a href="https://t.me/userinfobot" target="_blank" rel="noreferrer" className="text-blue-600 underline font-bold">@userinfobot</a>
                {locale === 'ru' ? ', чтобы получить цифровой ID.' : ' pentru a primi ID-ul tău numeric.'}
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
            <div className="text-xs font-bold text-blue-900 bg-blue-50/50 p-5 rounded-[1.5rem] border border-blue-100 flex items-center self-end h-[68px]">
              ✨ {locale === 'ru' 
                ? 'После сохранения вы будете получать мгновенные уведомления о качестве сервиса.' 
                : 'După salvare, vei primi notificări instantanee despre calitatea serviciilor tale.'}
            </div>
          </div>
        </div>

        {/* DATE FACTURARE */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-10">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600 shadow-sm"><Building2 size={28} /></div>
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight">{t?.billing?.title || "Date de Facturare"}</h2>
                <p className="text-sm text-slate-500 font-medium mt-1">{t?.billing?.desc || "Setează datele firmei tale pentru facturile fiscale"}</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer scale-110">
              <input type="checkbox" className="sr-only peer" checked={isLegalEntity} onChange={() => setIsLegalEntity(!isLegalEntity)} />
              <div className="w-12 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500"></div>
              <span className="ml-3 text-[11px] font-black text-slate-600 uppercase tracking-widest">{t?.billing?.legal_toggle || "Persoană Juridică"}</span>
            </label>
          </div>

          <div className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8 animate-in zoom-in-95 duration-300">
              {isLegalEntity && (
                <>
                  <BillingInput label={t?.billing?.labels?.company || "Denumire Companie"} value={billingData.company_name} onChange={(v) => setBillingData({...billingData, company_name: v})} placeholder={locale === 'ru' ? "Пример: QRate Solutions S.R.L." : "Ex: QRate Solutions S.R.L."} />
                  <BillingInput label={t?.billing?.labels?.idno || "IDNO"} value={billingData.idno} onChange={(v) => setBillingData({...billingData, idno: v})} placeholder="10XXXXXXXXXXX" />
                  <BillingInput label={t?.billing?.labels?.vat || "Cod TVA"} value={billingData.vat_code} onChange={(v) => setBillingData({...billingData, vat_code: v})} placeholder={locale === 'ru' ? "Пример: 06XXXXX" : "Ex: 06XXXXX"} />
                  <BillingInput label={t?.billing?.labels?.iban || "Cont Bancar (IBAN)"} value={billingData.company_bank_account} onChange={(v) => setBillingData({...billingData, company_bank_account: v})} placeholder="MD24XXXXXXXXXXXXXXXXXXXX" />
                  <BillingInput label={t?.billing?.labels?.bank_name || "Numele Băncii"} value={billingData.company_bank_name} onChange={(v) => setBillingData({...billingData, company_bank_name: v})} placeholder={locale === 'ru' ? "Пример: maib" : "Ex: maib"} />
                </>
              )}
              
              <div className={isLegalEntity ? "" : "md:col-span-2"}>
                <BillingInput label={t?.billing?.labels?.billing_email || "Email Trimitere Automată Facturi"} value={billingData.billing_email} onChange={(v) => setBillingData({...billingData, billing_email: v})} placeholder="contabil@firma.md sau email personal" icon={<Mail size={16} />} />
              </div>

              {isLegalEntity && (
                <div className="md:col-span-2">
                  <BillingInput label={t?.billing?.labels?.address || "Adresă Juridică"} value={billingData.company_address} onChange={(v) => setBillingData({...billingData, company_address: v})} placeholder={locale === 'ru' ? "Пример: Кишинев, ул. Пример 12" : "Mun. Chișinău, str. Exemplu 12"} />
                </div>
              )}
            </div>

            {!isLegalEntity && (
              <div className="p-10 bg-blue-50/30 rounded-[2rem] border-2 border-dashed border-blue-100 flex flex-col items-center text-center gap-4">
                <div className="p-4 bg-white rounded-full shadow-md text-blue-500">
                  <Sparkles size={32} />
                </div>
                <div>
                  <p className="text-sm font-black text-blue-900 uppercase tracking-widest">{t?.billing?.individual || "Abonament activ ca Persoană Fizică"}</p>
                  <p className="text-blue-600 font-bold mt-1 text-lg">{userEmail}</p>
                </div>
              </div>
            )}

            {isLegalEntity && (
              <div className="pt-6 border-t border-slate-100 flex justify-start">
                <button
                  type="button"
                  onClick={handleDownloadInvoice}
                  disabled={downloading}
                  className="flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-600 font-bold rounded-xl text-xs uppercase tracking-wider transition-all disabled:opacity-50"
                >
                  {downloading ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
                  {t?.billing?.download_latest || "Descarcă Ultima Factură (PDF)"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* SECURITATE */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-slate-50 rounded-2xl text-slate-600 shadow-sm"><Shield size={28} /></div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight">{t?.security?.title || "Securitate Cont"}</h2>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{userEmail}</p>
            </div>
          </div>
          <button onClick={handleResetPassword} className="px-8 py-4 border-2 border-slate-100 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:border-blue-500 hover:text-blue-600 transition-all active:scale-95">
            {t?.security?.reset_btn || "Schimbă Parola"}
          </button>
        </div>

        {/* FOOTER SAVE */}
        <div className="flex items-center justify-between pt-8">
          <div className="flex items-center gap-3">
            {showSavedSuccess && (
              <div className="flex items-center gap-2 text-emerald-600 animate-bounce">
                <CheckCircle size={20} />
                <span className="text-xs font-black uppercase tracking-widest">{t?.alerts?.saved_success || "Modificări Salvate!"}</span>
              </div>
            )}
          </div>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="bg-slate-900 text-white px-12 py-6 rounded-[2rem] font-black uppercase text-[12px] tracking-[0.2em] hover:bg-blue-600 transition-all flex items-center gap-3 active:scale-95"
          >
            {saving ? <Loader2 className="animate-spin" size={20} /> : <><Save size={20} /> {t?.save_btn || "Salvează Modificările"}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

interface BillingInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
}

function BillingInput({ label, value, onChange, placeholder, icon }: BillingInputProps) {
  return (
    <div className="space-y-2 relative w-full">
      <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.1em] ml-2">{label}</label>
      <div className="relative flex items-center">
        {icon && (
          <div className="absolute left-5 text-slate-400 pointer-events-none z-10 flex items-center justify-center">
            {icon}
          </div>
        )}
        <input 
          type="text" 
          value={value} 
          onChange={(e) => onChange(e.target.value)} 
          placeholder={placeholder}
          className={`w-full p-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] focus:border-emerald-500 focus:ring-4 ring-emerald-500/10 outline-none font-bold text-lg transition-all placeholder:text-slate-300 shadow-inner ${icon ? 'pl-12' : ''}`} 
        />
      </div>
    </div>
  );
}