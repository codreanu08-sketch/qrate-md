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

  const BOT_USERNAME = "QRateBot"; 

  useEffect(() => {
    async function loadSettings() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserEmail(session.user.email || '');
        
        const { data, error } = await supabase
          .from('companies')
          .select('*')
          .eq(userIdKey, session.user.id)
          .maybeSingle();

        if (data) {
          setTelegramId(data.telegram_chat_id || '');
          const savedBilling = data.billing_details || {};
          setIsLegalEntity(savedBilling.is_legal_entity || false);
          setBillingData({
            company_name: data.name || savedBilling.company_name || '',
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

      // Se trimite 'name' pentru a evita eroarea 'null value in column name'
      const updatePayload = { 
        [userIdKey]: session.user.id,
        telegram_chat_id: telegramId,
        name: billingData.company_name || 'Companie',
        billing_details: billingPayload 
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
      alert(locale === 'ru' ? "Скачивание не удалось" : "Descărcare eșuată");
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
      alert(t?.alerts?.reset_sent || "Link trimis!");
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin text-blue-600" size={32} /></div>;

  return (
    <div className="p-8 max-w-4xl mx-auto text-slate-900 animate-in fade-in duration-500">
      <header className="mb-10">
        <h1 className="text-4xl font-black tracking-tighter uppercase flex items-center gap-3">
          <Settings className="text-blue-600" size={36} />
          {t?.title || "Setări Cont"}
        </h1>
      </header>

      <div className="space-y-8">
        {/* TELEGRAM */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-10">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.1em] ml-2">Telegram Chat ID</label>
              <input type="text" value={telegramId} onChange={(e) => setTelegramId(e.target.value)} className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] focus:border-blue-500 outline-none font-bold text-lg shadow-inner" />
            </div>
          </div>
        </div>

        {/* FACTURARE */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-10">
          <div className="flex justify-between mb-10">
            <h2 className="text-xl font-black uppercase">Date de Facturare</h2>
            <label className="flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only" checked={isLegalEntity} onChange={() => setIsLegalEntity(!isLegalEntity)} />
              <div className={`w-12 h-7 rounded-full ${isLegalEntity ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>
            </label>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {isLegalEntity && (
              <>
                <BillingInput label="Denumirea companiei" value={billingData.company_name} onChange={(v) => setBillingData({...billingData, company_name: v})} />
                <BillingInput label="IDNO" value={billingData.idno} onChange={(v) => setBillingData({...billingData, idno: v})} />
                <BillingInput label="Cod TVA" value={billingData.vat_code} onChange={(v) => setBillingData({...billingData, vat_code: v})} />
                <BillingInput label="Cont bancar" value={billingData.company_bank_account} onChange={(v) => setBillingData({...billingData, company_bank_account: v})} />
              </>
            )}
            <div className={isLegalEntity ? "" : "md:col-span-2"}>
                <BillingInput label="Email facturare" value={billingData.billing_email} onChange={(v) => setBillingData({...billingData, billing_email: v})} />
            </div>
          </div>
        </div>

        {/* SAVE */}
        <button onClick={handleSave} disabled={saving} className="bg-slate-900 text-white px-12 py-6 rounded-[2rem] font-black uppercase hover:bg-blue-600 transition-all">
          {saving ? 'Se salvează...' : 'Salvează Modificările'}
        </button>
      </div>
    </div>
  );
}

function BillingInput({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <label className="text-[11px] font-black text-slate-400 uppercase">{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="w-full p-4 bg-slate-50 rounded-[1rem] font-bold" />
    </div>
  );
}