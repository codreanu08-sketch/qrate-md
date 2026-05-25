'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Settings, Loader2, Send, Building2 } from 'lucide-react';
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
  const [userEmail, setUserEmail] = useState('');
  
  const userIdKey = 'owner_id'; 
  const BOT_USERNAME = "Qrate_bot"; 

  const [billingData, setBillingData] = useState({
    company_name: '',
    idno: '',
    vat_code: '',
    company_address: '',
    company_bank_account: '',
    company_bank_name: '',
    billing_email: ''
  });

  useEffect(() => {
    async function loadSettings() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserEmail(session.user.email || '');
        const { data } = await supabase
          .from('companies')
          .select('*')
          .eq('owner_id', session.user.id)
          .maybeSingle();

        if (data) {
          setTelegramId(data.telegram_chat_id || '');
          const savedBilling = data.billing_details || {};
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

      const updatePayload = { 
        [userIdKey]: session.user.id,
        telegram_chat_id: telegramId,
        billing_details: billingData
      };

      const { error } = await supabase
        .from('companies')
        .upsert(updatePayload, { onConflict: userIdKey });

      if (error) throw error;
      alert("Salvată cu succes!");
    } catch (err: any) {
      alert("Eroare la salvare: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin text-blue-600" size={32} /></div>;

  return (
    <div className="p-8 max-w-4xl mx-auto text-slate-900">
      <header className="mb-10">
        <h1 className="text-4xl font-black uppercase flex items-center gap-3">
          <Settings className="text-blue-600" size={36} /> {t?.title || "Setări Cont"}
        </h1>
      </header>

      <div className="space-y-8">
        {/* Telegram Section */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-10">
          <h2 className="text-xl font-black uppercase mb-6">{t?.telegram?.title || "Notificări Telegram"}</h2>
          
          <a 
            href={`https://t.me/${BOT_USERNAME}`} 
            target="_blank" 
            rel="noreferrer" 
            className="inline-flex items-center gap-2 mb-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm uppercase rounded-xl transition-all shadow-md"
          >
            <Send size={16} /> {locale === 'ru' ? 'Запустить Бота' : 'Pornește Botul'}
          </a>

          <div className="space-y-4">
             <input 
                type="text" value={telegramId}
                onChange={(e) => setTelegramId(e.target.value)}
                placeholder="Ex: 890236835"
                className="w-full p-5 bg-slate-50 border-2 rounded-[1.5rem] outline-none font-bold text-lg"
              />
              <button onClick={handleSave} className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-black uppercase">
                {saving ? "Salvare..." : "Salvează ID-ul"}
              </button>
          </div>
        </div>

        {/* Billing Section */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-10">
           <h2 className="text-xl font-black uppercase mb-6">{t?.billing?.title || "Date de Facturare"}</h2>
           <BillingInput 
              label="Nume Companie" 
              value={billingData.company_name} 
              onChange={(val) => setBillingData({...billingData, company_name: val})} 
           />
        </div>
      </div>
    </div>
  );
}

interface BillingInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

function BillingInput({ label, value, onChange }: BillingInputProps) {
    return (
        <div className="space-y-2 w-full">
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.1em] ml-2">{label}</label>
          <input 
            type="text" 
            value={value} 
            onChange={(e) => onChange(e.target.value)} 
            className="w-full p-5 bg-slate-50 border-2 rounded-[1.5rem] focus:border-emerald-500 font-bold text-lg" 
          />
        </div>
      );
}