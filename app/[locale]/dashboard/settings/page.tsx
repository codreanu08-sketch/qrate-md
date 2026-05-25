'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { 
  Settings, Smartphone, Save, Loader2, Building2, Send 
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
        const { data } = await supabase.from('companies').select('*').eq('owner_id', session.user.id).maybeSingle();
        if (data) {
          setTelegramId(data.telegram_chat_id || '');
          const savedBilling = data.billing_details || {};
          setIsLegalEntity(savedBilling.is_legal_entity || false);
          setBillingData(savedBilling);
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

      const { error } = await supabase.from('companies').upsert({
        owner_id: session.user.id,
        telegram_chat_id: telegramId,
        billing_details: { ...billingData, is_legal_entity: isLegalEntity }
      }, { onConflict: 'owner_id' });

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
      <h1 className="text-4xl font-black uppercase mb-10 flex items-center gap-3"><Settings className="text-blue-600" /> {t?.title || "Setări"}</h1>

      <div className="space-y-8">
        {/* Telegram Section */}
        <div className="bg-white rounded-[2.5rem] shadow-xl p-10 border">
          <h2 className="text-xl font-black mb-6">Notificări Telegram</h2>
          <a href={`https://t.me/${BOT_USERNAME}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 mb-6 px-6 py-3 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700">
            <Send size={16} /> Pornește Botul
          </a>
          <div className="grid md:grid-cols-2 gap-4">
            <input type="text" value={telegramId} onChange={(e) => setTelegramId(e.target.value)} placeholder="Chat ID" className="w-full p-5 bg-slate-50 rounded-[1.5rem] font-bold" />
            <button onClick={handleSave} className="px-8 bg-emerald-600 text-white font-black rounded-[1.5rem] flex items-center justify-center gap-2">
              {saving ? <Loader2 className="animate-spin" /> : <Save />} Salvează
            </button>
          </div>
        </div>

        {/* Billing Section */}
        <div className="bg-white rounded-[2.5rem] shadow-sm p-10 border">
          <h2 className="text-xl font-black mb-6">Date de Facturare</h2>
          <BillingInput label="Nume Companie" value={billingData.company_name} onChange={(v) => setBillingData({...billingData, company_name: v})} />
          <button onClick={handleSave} className="mt-6 px-8 py-4 bg-blue-600 text-white font-black rounded-[1.5rem] w-full">Salvează Date Firma</button>
        </div>
      </div>
    </div>
  );
}

function BillingInput({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) {
  return (
    <div className="space-y-2 mt-4">
      <label className="text-[11px] font-black text-slate-400 uppercase ml-2">{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="w-full p-5 bg-slate-50 rounded-[1.5rem] font-bold" />
    </div>
  );
}