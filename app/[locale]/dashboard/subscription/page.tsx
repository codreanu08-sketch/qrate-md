'use client';

import React, { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { 
  Check, Building, Loader2, CreditCard, 
  AlertCircle, CheckCircle2, Clock,
  FileText, Download, Receipt,
  AlertTriangle, Sparkles, Shield, X
} from 'lucide-react';
import { useParams } from 'next/navigation';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const PRICING_PLANS = [
  { id: 'START',      locations: 1, maxEmployees: 5,   price: 450,  label: 'START' },
  { id: 'GROW',       locations: 2, maxEmployees: 10,  price: 700,  label: 'GROW' },
  { id: 'SCALE',      locations: 3, maxEmployees: 15,  price: 1050, label: 'SCALE' },
  { id: 'PRO',        locations: 4, maxEmployees: 20,  price: 1300, label: 'PRO' },
  { id: 'PRO_PLUS',   locations: 5, maxEmployees: 25,  price: 1500, label: 'PRO+' },
  { id: 'ENTERPRISE', locations: 6, maxEmployees: 999, price: 1700, label: 'ENTERPRISE' },
];

const MOCK_PAYMENTS = [
  { id: '1', date: '2026-05-01', amount: 700,  plan: 'GROW',  status: 'paid', invoice: 'INV-2026-05' },
  { id: '2', date: '2026-04-01', amount: 700,  plan: 'GROW',  status: 'paid', invoice: 'INV-2026-04' },
  { id: '3', date: '2026-03-01', amount: 450,  plan: 'START', status: 'paid', invoice: 'INV-2026-03' },
];

export default function SubscriptionPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'ro';
  const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedPlanIndex, setSelectedPlanIndex] = useState(0);
  const [realDaysRemaining, setRealDaysRemaining] = useState(7);
  const [isTrialExpired, setIsTrialExpired] = useState(false);
  const [currentMonthlyAmount, setCurrentMonthlyAmount] = useState(0);
  const [nextBillingDate, setNextBillingDate] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'plan' | 'billing' | 'history'>('plan');
  const [billingMessage, setBillingMessage] = useState<string | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const [billingData, setBillingData] = useState({
    company_name: '',
    idno: '',
    vat_code: '',
    company_address: '',
    billing_email: '',
    is_legal_entity: false,
  });

  const currentPlan = PRICING_PLANS[selectedPlanIndex];

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) { setLoading(false); return; }

        const { data: profile } = await supabase
          .from('profiles')
          .select('created_at, trial_ends_at, next_billing_date, monthly_amount, maib_recurrent_id, subscription_tier')
          .eq('id', user.id)
          .single();

        if (profile) {
          const now = new Date(); now.setHours(0,0,0,0);
          const endDate = profile.trial_ends_at
            ? new Date(profile.trial_ends_at)
            : new Date(new Date(profile.created_at).getTime() + 7 * 86400000);
          endDate.setHours(0,0,0,0);
          const expired = endDate < now;
          setIsTrialExpired(expired);
          setIsSubscribed(!!profile.maib_recurrent_id || profile.subscription_tier === 'pro');
          setCurrentMonthlyAmount(Number(profile.monthly_amount) || 0);
          if (profile.next_billing_date) setNextBillingDate(profile.next_billing_date);
          if (!expired) {
            const diff = endDate.getTime() - now.getTime();
            setRealDaysRemaining(Math.max(0, Math.round(diff / 86400000)));
          }
          const planIdx = PRICING_PLANS.findIndex(p => p.price === Number(profile.monthly_amount));
          if (planIdx >= 0) setSelectedPlanIndex(planIdx);
        }

        const { data: company } = await supabase
          .from('companies')
          .select('billing_details, name')
          .eq('owner_id', user.id)
          .maybeSingle();

        if (company?.billing_details) {
          setBillingData({
            company_name: company.billing_details.company_name || company.name || '',
            idno: company.billing_details.idno || '',
            vat_code: company.billing_details.vat_code || '',
            company_address: company.billing_details.company_address || '',
            billing_email: company.billing_details.billing_email || user.email || '',
            is_legal_entity: company.billing_details.is_legal_entity || false,
          });
        } else if (company?.name) {
          setBillingData(prev => ({ ...prev, company_name: company.name, billing_email: user.email || '' }));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleSaveBilling = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase.from('companies')
        .update({ billing_details: billingData })
        .eq('owner_id', user.id);
      if (error) throw error;
      setBillingMessage(locale === 'ru' ? 'Сохранено!' : 'Date salvate cu succes!');
      setTimeout(() => setBillingMessage(null), 3000);
    } catch (err: any) {
      setBillingMessage('Eroare: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-blue-600" size={32} />
    </div>
  );

  return (
    <div className="bg-[#F8FAFC] min-h-screen p-4 md:p-8 pb-32 font-sans text-slate-900">
      <div className="max-w-4xl mx-auto">

        {/* HEADER */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase">
              {locale === 'ru' ? 'Абонемент' : 'Abonament'}
            </h1>
            <p className="text-slate-400 font-medium text-sm mt-1">
              {locale === 'ru' ? 'Управление планом и выставлением счетов' : 'Gestionează planul și facturarea'}
            </p>
          </div>

          {/* Status badge */}
          {isTrialExpired && !isSubscribed && (
            <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-2 rounded-2xl text-xs font-black uppercase">
              <AlertCircle size={14} /> {locale === 'ru' ? 'Trial истёк' : 'Trial Expirat'}
            </div>
          )}
          {!isTrialExpired && realDaysRemaining > 0 && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2 rounded-2xl text-xs font-black uppercase">
              <Clock size={14} /> Trial: {realDaysRemaining} {locale === 'ru' ? 'дн.' : 'zile'}
            </div>
          )}
          {isSubscribed && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2 rounded-2xl text-xs font-black uppercase">
              <CheckCircle2 size={14} /> Activ · {currentMonthlyAmount} MDL/lună
            </div>
          )}
        </div>

        {/* TABS */}
        <div className="flex bg-white border border-slate-200 rounded-2xl p-1.5 mb-8 gap-1 shadow-sm">
          {[
            { key: 'plan',    label: locale === 'ru' ? 'План' : 'Plan',                    icon: <CreditCard size={13}/> },
            { key: 'billing', label: locale === 'ru' ? 'Счета' : 'Facturare', icon: <FileText size={13}/> },
            { key: 'history', label: locale === 'ru' ? 'История' : 'Istoric Plăți',       icon: <Receipt size={13}/> },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${activeTab === tab.key ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>
              {tab.icon} <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ===== TAB PLAN ===== */}
        {activeTab === 'plan' && (
          <div className="space-y-6">

            {/* Trial activ */}
            {!isTrialExpired && realDaysRemaining > 0 && (
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-5 text-white flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-2xl shrink-0"><Sparkles size={22} /></div>
                <div className="flex-1">
                  <p className="font-black text-base">
                    {locale === 'ru' ? 'Пробный период активен' : 'Trial gratuit activ'}
                  </p>
                  <p className="text-blue-100 text-sm">
                    {realDaysRemaining} {locale === 'ru' ? 'дн. осталось — все функции доступны' : 'zile rămase — toate funcțiile disponibile'}
                  </p>
                </div>
                <div className="text-right shrink-0 hidden sm:block">
                  <div className="h-2 w-24 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-white rounded-full transition-all" style={{ width: `${(realDaysRemaining/7)*100}%` }} />
                  </div>
                  <p className="text-[10px] text-blue-200 mt-1 font-black uppercase">{realDaysRemaining}/7 {locale === 'ru' ? 'дн.' : 'zile'}</p>
                </div>
              </div>
            )}

            {/* Trial expirat */}
            {isTrialExpired && !isSubscribed && (
              <div className="bg-rose-50 border-2 border-rose-200 rounded-3xl p-5 flex items-start gap-4">
                <AlertTriangle size={22} className="text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-black text-rose-800">
                    {locale === 'ru' ? 'Пробный период истёк' : 'Trial-ul a expirat'}
                  </p>
                  <p className="text-rose-600 text-sm">
                    {locale === 'ru' ? 'Выберите план для продолжения использования QRate.' : 'Alege un plan mai jos pentru a continua să folosești QRate.'}
                  </p>
                </div>
              </div>
            )}

            {/* Abonament activ */}
            {isSubscribed && nextBillingDate && (
              <div className="bg-white border border-slate-200 rounded-3xl p-5 flex items-center gap-4 shadow-sm">
                <div className="p-3 bg-emerald-50 rounded-2xl shrink-0"><CheckCircle2 size={22} className="text-emerald-600" /></div>
                <div className="flex-1">
                  <p className="font-black text-slate-900 text-sm">
                    {locale === 'ru' ? 'Подписка активна' : 'Abonament activ'}
                  </p>
                  <p className="text-slate-500 text-xs">
                    {locale === 'ru' ? 'Следующий платёж:' : 'Următoarea plată:'}{' '}
                    {new Date(nextBillingDate).toLocaleDateString('ro-RO')} — <strong>{currentMonthlyAmount} MDL</strong>
                  </p>
                </div>
                <button onClick={() => setShowCancelModal(true)}
                  className="text-[10px] text-rose-500 hover:text-rose-600 font-black uppercase tracking-wider shrink-0">
                  {locale === 'ru' ? 'Отменить' : 'Anulează'}
                </button>
              </div>
            )}

            {/* GRID PLANURI */}
            <div>
              <h2 className="font-black text-lg uppercase tracking-tight mb-4">
                {locale === 'ru' ? 'Выбери план' : 'Alege planul'}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {PRICING_PLANS.map((plan, i) => {
                  const isSelected = selectedPlanIndex === i;
                  const isCurrent = plan.price === currentMonthlyAmount && isSubscribed;
                  return (
                    <div key={plan.id} onClick={() => setSelectedPlanIndex(i)}
                      className={`bg-white p-5 md:p-6 rounded-3xl border-2 cursor-pointer transition-all relative ${isSelected ? 'border-blue-600 shadow-xl shadow-blue-100 scale-[1.02]' : 'border-slate-100 hover:border-blue-200 opacity-70 hover:opacity-100'}`}>
                      {isCurrent && (
                        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[9px] font-black px-3 py-0.5 rounded-full uppercase whitespace-nowrap">
                          {locale === 'ru' ? 'Текущий план' : 'Plan curent'}
                        </div>
                      )}
                      <div className="flex justify-between items-start mb-3">
                        <div className="p-2.5 bg-slate-100 rounded-xl"><Building size={16} className="text-slate-600" /></div>
                        {isSelected && !isCurrent && (
                          <span className="bg-blue-600 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase">
                            {locale === 'ru' ? 'Выбран' : 'Selectat'}
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-black italic uppercase text-slate-900">{plan.label}</h3>
                      <div className="flex items-baseline gap-1 my-2">
                        <span className="text-2xl font-black text-slate-900">{plan.price}</span>
                        <span className="text-xs font-bold text-slate-400">MDL/{locale === 'ru' ? 'мес' : 'lună'}</span>
                      </div>
                      <ul className="space-y-1.5 text-xs font-semibold text-slate-500 border-t border-slate-100 pt-3">
                        <li className="flex items-center gap-1.5"><Check size={12} className="text-blue-500 shrink-0" />{plan.locations} {locale === 'ru' ? (plan.locations === 1 ? 'локация' : 'локации') : (plan.locations === 1 ? 'locație' : 'locații')}</li>
                        <li className="flex items-center gap-1.5"><Check size={12} className="text-blue-500 shrink-0" />{plan.maxEmployees === 999 ? '∞' : plan.maxEmployees} {locale === 'ru' ? 'сотрудников' : 'angajați'}</li>
                        <li className="flex items-center gap-1.5"><Check size={12} className="text-blue-500 shrink-0" />QR + Telegram + Analytics</li>
                        <li className="flex items-center gap-1.5"><Check size={12} className="text-blue-500 shrink-0" />Google Reviews redirect</li>
                        <li className="flex items-center gap-1.5"><Check size={12} className="text-blue-500 shrink-0" />WhatsApp Follow-up</li>
                        <li className="flex items-center gap-1.5"><Check size={12} className="text-blue-500 shrink-0" />AI Predicții + Badge</li>
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SUMAR + BUTON */}
            <div className="bg-slate-900 rounded-3xl p-5 md:p-6 text-white">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                    {locale === 'ru' ? 'Выбранный план' : 'Plan selectat'}
                  </p>
                  <p className="text-xl md:text-2xl font-black">{currentPlan.label} — {currentPlan.price} MDL/{locale === 'ru' ? 'мес' : 'lună'}</p>
                  <p className="text-slate-400 text-xs mt-1">
                    {realDaysRemaining > 0 && !isTrialExpired
                      ? (locale === 'ru' ? `Счёт выставят через ${realDaysRemaining} дн. после пробного периода` : `Vei fi facturat după ${realDaysRemaining} zile de trial`)
                      : (locale === 'ru' ? 'Активация немедленная' : 'Activare imediată — redirect spre MAIB')}
                  </p>
                </div>
                <button className="bg-blue-600 hover:bg-blue-500 text-white px-6 md:px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all shadow-lg shadow-blue-900/50 flex items-center gap-2 w-full sm:w-auto justify-center">
                  <CreditCard size={16} />
                  {isSubscribed
                    ? (locale === 'ru' ? 'Изменить план' : 'Schimbă planul')
                    : (locale === 'ru' ? 'Активировать' : 'Plătește cu cardul')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===== TAB FACTURARE ===== */}
        {activeTab === 'billing' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-lg p-5 md:p-8">
              <h2 className="font-black text-lg uppercase tracking-tight mb-6 flex items-center gap-2">
                <FileText size={18} className="text-blue-500" />
                {locale === 'ru' ? 'Платёжные данные' : 'Date de facturare'}
              </h2>

              {/* Toggle fizică / juridică */}
              <div className="flex bg-slate-100 p-1 rounded-2xl mb-6 gap-1">
                <button onClick={() => setBillingData(p => ({...p, is_legal_entity: false}))}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase transition-all ${!billingData.is_legal_entity ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>
                  {locale === 'ru' ? 'Физическое лицо' : 'Persoană fizică'}
                </button>
                <button onClick={() => setBillingData(p => ({...p, is_legal_entity: true}))}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase transition-all ${billingData.is_legal_entity ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>
                  {locale === 'ru' ? 'Юридическое лицо' : 'Persoană juridică (SRL/SA)'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                    {billingData.is_legal_entity ? (locale === 'ru' ? 'Название компании' : 'Denumirea companiei') : (locale === 'ru' ? 'Полное имя' : 'Numele complet')}
                  </label>
                  <input type="text" value={billingData.company_name} onChange={e => setBillingData(p => ({...p, company_name: e.target.value}))}
                    placeholder={billingData.is_legal_entity ? 'Ex: SRL EXAMPLE' : 'Ex: Ion Popescu'}
                    className="w-full bg-slate-50 rounded-2xl py-3 px-4 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 border border-transparent text-sm" />
                </div>

                {billingData.is_legal_entity && (
                  <>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">IDNO</label>
                      <input type="text" value={billingData.idno} onChange={e => setBillingData(p => ({...p, idno: e.target.value}))}
                        placeholder="Ex: 1234567890123"
                        className="w-full bg-slate-50 rounded-2xl py-3 px-4 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 border border-transparent text-sm" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                        {locale === 'ru' ? 'Код НДС (необязательно)' : 'Cod TVA (opțional)'}
                      </label>
                      <input type="text" value={billingData.vat_code} onChange={e => setBillingData(p => ({...p, vat_code: e.target.value}))}
                        placeholder="Ex: MD1234567"
                        className="w-full bg-slate-50 rounded-2xl py-3 px-4 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 border border-transparent text-sm" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                        {locale === 'ru' ? 'Юридический адрес' : 'Adresa juridică'}
                      </label>
                      <input type="text" value={billingData.company_address} onChange={e => setBillingData(p => ({...p, company_address: e.target.value}))}
                        placeholder="Ex: str. Ștefan cel Mare 1, Chișinău"
                        className="w-full bg-slate-50 rounded-2xl py-3 px-4 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 border border-transparent text-sm" />
                    </div>
                  </>
                )}

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                    {locale === 'ru' ? 'Email для счетов' : 'Email factură'}
                  </label>
                  <input type="email" value={billingData.billing_email} onChange={e => setBillingData(p => ({...p, billing_email: e.target.value}))}
                    placeholder="email@compania.md"
                    className="w-full bg-slate-50 rounded-2xl py-3 px-4 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 border border-transparent text-sm" />
                  <p className="text-[10px] text-slate-400 mt-1 ml-1">
                    {locale === 'ru' ? 'Ежемесячные счета будут отправлены на этот email.' : 'Facturile lunare vor fi trimise pe acest email.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
                {billingMessage && (
                  <p className={`text-sm font-black flex items-center gap-1.5 ${billingMessage.startsWith('Eroare') ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {billingMessage.startsWith('Eroare') ? <AlertCircle size={14}/> : <CheckCircle2 size={14}/>}
                    {billingMessage}
                  </p>
                )}
                <button onClick={handleSaveBilling} disabled={saving}
                  className="ml-auto flex items-center gap-2 bg-slate-900 hover:bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all">
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  {locale === 'ru' ? 'Сохранить' : 'Salvează datele'}
                </button>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-3xl p-5 flex items-start gap-3">
              <Shield size={18} className="text-blue-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-black text-sm text-blue-800">
                  {locale === 'ru' ? 'Как работает выставление счетов' : 'Cum funcționează facturarea'}
                </p>
                <p className="text-blue-600 text-xs mt-1 leading-relaxed">
                  {locale === 'ru'
                    ? 'Счета генерируются автоматически 1-го числа каждого месяца и отправляются на указанный email. Для юридических лиц счёт будет включать IDNO и код НДС.'
                    : 'Facturile se generează automat pe 1 ale lunii și se trimit pe emailul de mai sus. Dacă ești persoană juridică, factura va include IDNO-ul și codul TVA.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ===== TAB ISTORIC PLĂȚI ===== */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-lg overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-black text-lg uppercase tracking-tight flex items-center gap-2">
                  <Receipt size={18} className="text-blue-500" />
                  {locale === 'ru' ? 'История платежей' : 'Istoric plăți'}
                </h2>
                <span className="bg-slate-100 text-slate-600 text-[10px] font-black px-3 py-1 rounded-full uppercase">
                  {MOCK_PAYMENTS.length} {locale === 'ru' ? 'транз.' : 'tranzacții'}
                </span>
              </div>

              {MOCK_PAYMENTS.length === 0 ? (
                <div className="p-12 text-center">
                  <Receipt size={32} className="text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-400 font-bold text-sm">
                    {locale === 'ru' ? 'Платежей пока нет' : 'Nu există plăți înregistrate'}
                  </p>
                  <p className="text-slate-300 text-xs mt-1">
                    {locale === 'ru' ? 'Платежи появятся здесь после активации плана.' : 'Plățile vor apărea aici după activarea unui plan.'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {MOCK_PAYMENTS.map(payment => (
                    <div key={payment.id} className="flex items-center justify-between p-4 md:p-5 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3 md:gap-4 min-w-0">
                        <div className={`p-2.5 rounded-xl shrink-0 ${payment.status === 'paid' ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                          {payment.status === 'paid'
                            ? <CheckCircle2 size={16} className="text-emerald-600" />
                            : <AlertCircle size={16} className="text-rose-600" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-sm text-slate-900 truncate">{payment.invoice}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">
                            {new Date(payment.date).toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'ro-RO', { day: 'numeric', month: 'long', year: 'numeric' })}
                            {' · '}Plan {payment.plan}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 md:gap-3 shrink-0">
                        <div className="text-right">
                          <p className="font-black text-sm text-slate-900">{payment.amount} MDL</p>
                          <p className={`text-[10px] font-black uppercase ${payment.status === 'paid' ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {payment.status === 'paid'
                              ? (locale === 'ru' ? 'Plătit' : 'Plătit')
                              : (locale === 'ru' ? 'Eșuat' : 'Eșuat')}
                          </p>
                        </div>
                        <button className="p-2 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-colors text-slate-400"
                          title={locale === 'ru' ? 'Descarcă factura' : 'Descarcă factura'}>
                          <Download size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* MODAL ANULARE */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 text-center">
            <div className="w-14 h-14 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={24} className="text-rose-600" />
            </div>
            <h3 className="font-black text-lg text-slate-900 mb-2">
              {locale === 'ru' ? 'Anulezi abonamentul?' : 'Anulezi abonamentul?'}
            </h3>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">
              {locale === 'ru'
                ? 'Vei pierde accesul la toate funcțiile QRate la finalul perioadei plătite.'
                : 'Vei pierde accesul la toate funcțiile QRate la finalul perioadei plătite.'}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowCancelModal(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black py-3 rounded-2xl text-xs uppercase tracking-wider">
                {locale === 'ru' ? 'Înapoi' : 'Înapoi'}
              </button>
              <button onClick={() => { setShowCancelModal(false); alert('Contactează support@qrate.md pentru anulare.'); }}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-black py-3 rounded-2xl text-xs uppercase tracking-wider">
                {locale === 'ru' ? 'Anulează' : 'Da, anulează'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}