'use client';

import React, { useState, ChangeEvent, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { createBrowserClient } from '@supabase/ssr';
import { 
  Check, QrCode, Truck, Plus, Trash2, 
  ChevronRight, Loader2, Upload, FileText, Image as ImageIcon,
  Calendar, AlertCircle, Sparkles, Building, ArrowUpRight, Lock
} from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// === NOUA STRUCTURĂ DE PLANURI ===
const PRICING_PLANS = [
  { id: 'START',     locations: 1, maxEmployees: 5,  price: 450,  label: 'START' },
  { id: 'GROW',      locations: 2, maxEmployees: 10, price: 700,  label: 'GROW' },
  { id: 'SCALE',     locations: 3, maxEmployees: 15, price: 1050, label: 'SCALE' },
  { id: 'PRO',       locations: 4, maxEmployees: 20, price: 1300, label: 'PRO' },
  { id: 'PRO_PLUS',  locations: 5, maxEmployees: 25, price: 1500, label: 'PRO+' },
  { id: 'ENTERPRISE',locations: 6, maxEmployees: 999,price: 1700, label: 'ENTERPRISE' },
];

interface RealLocation { id: string; name?: string; title?: string; user_id?: string; }
interface RealEmployee { id: string; name?: string; first_name?: string; last_name?: string; location_id?: string; location_name?: string; user_id?: string; }

export default function QRateCompletePricing() {
  const t = useTranslations('Subscription');
  const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

  const [dbLocations, setDbLocations] = useState<RealLocation[]>([]);
  const [dbEmployees, setDbEmployees] = useState<RealEmployee[]>([]);
  const [realDaysRemaining, setRealDaysRemaining] = useState<number>(0);
  const [isTrialExpired, setIsTrialExpired] = useState<boolean>(false);
  const [hasSavedCard, setHasSavedCard] = useState<boolean>(false);
  const [currentMonthlyAmount, setCurrentMonthlyAmount] = useState<number>(0);
  const [daysUntilBilling, setDaysUntilBilling] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFetchingData, setIsFetchingData] = useState<boolean>(true);

  const [selectedActiveLocationIds, setSelectedActiveLocationIds] = useState<string[]>([]);
  const [selectedActiveEmployeeIds, setSelectedActiveEmployeeIds] = useState<string[]>([]);
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  const [orderNotes, setOrderNotes] = useState<string>('');
  const hasInitialized = useRef(false);

  // === FETCH DATE ===
  useEffect(() => {
    async function fetchUserCompanyData() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) { setIsFetchingData(false); return; }

        const { data: profile } = await supabase
          .from('profiles')
          .select('created_at, trial_ends_at, next_billing_date, monthly_amount, maib_recurrent_id')
          .eq('id', user.id)
          .single();

        if (profile) {
          const now = new Date(); now.setHours(0,0,0,0);
          const endDate = profile.trial_ends_at 
            ? new Date(profile.trial_ends_at) 
            : new Date(new Date(profile.created_at).getTime() + 7 * 24 * 60 * 60 * 1000);
          endDate.setHours(0,0,0,0);
          
          const expired = endDate < now;
          setIsTrialExpired(expired);
          setHasSavedCard(!!profile.maib_recurrent_id);
          setCurrentMonthlyAmount(profile.monthly_amount ? Number(profile.monthly_amount) : 0);

          if (!expired) {
            const diffInMs = endDate.getTime() - now.getTime();
            setRealDaysRemaining(Math.max(0, Math.round(diffInMs / (1000 * 60 * 60 * 24))));
            if (profile.next_billing_date) {
              const billingDate = new Date(profile.next_billing_date);
              billingDate.setHours(0,0,0,0);
              const billingDiff = billingDate.getTime() - now.getTime();
              setDaysUntilBilling(Math.max(0, Math.round(billingDiff / (1000 * 60 * 60 * 24))));
            }
          }
        }

        const { data: locationsData } = await supabase.from('locations').select('*').eq('user_id', user.id);
        const { data: employeesData } = await supabase.from('employees').select('*').eq('user_id', user.id);

        setDbLocations(locationsData || []);
        setDbEmployees(employeesData || []);

        if (!hasInitialized.current) {
          const currentLocs = locationsData || [];
          const currentEmps = employeesData || [];
          setSelectedActiveLocationIds(currentLocs.length > 0 ? currentLocs.map((l: any) => l.id) : []);
          setSelectedActiveEmployeeIds(currentEmps.map((e: any) => e.id));
          hasInitialized.current = true;
        }
      } catch (err) {
        console.error("Eroare la preluarea datelor:", err);
      } finally {
        setIsFetchingData(false);
      }
    }
    fetchUserCompanyData();
  }, []);

  const normalizedLocations = dbLocations.map(l => ({
    id: l.id,
    name: l.name || l.title || 'Locație fără nume'
  }));

  const normalizedEmployees = dbEmployees.map(e => {
    const matchedLoc = dbLocations.find(l => l.id === e.location_id);
    return {
      id: e.id,
      name: e.name || `${e.first_name || ''} ${e.last_name || ''}`.trim() || 'Angajat anonim',
      location_id: e.location_id || '',
      location_name: matchedLoc ? (matchedLoc.name || matchedLoc.title || 'Locație') : 'Fără locație'
    };
  });

  // === DETERMINĂ PLANUL CURENT ===
  const currentPlan = PRICING_PLANS.find(p => p.locations === selectedActiveLocationIds.length) 
    || PRICING_PLANS[PRICING_PLANS.length - 1];

  const maxEmployeesForCurrentPlan = currentPlan.maxEmployees;
  const currentPlanPrice = currentPlan.price;

  // === LOGICĂ BLOCĂRI ===
  const canAddMoreEmployees = selectedActiveEmployeeIds.length < maxEmployeesForCurrentPlan;
  const canAddMoreLocations = selectedActiveLocationIds.length < currentPlan.locations;

  const toggleLocationSelection = (id: string) => {
    const isSelected = selectedActiveLocationIds.includes(id);
    if (isSelected) {
      if (selectedActiveLocationIds.length > 1) {
        setSelectedActiveLocationIds(selectedActiveLocationIds.filter(i => i !== id));
      }
    } else {
      if (!canAddMoreLocations) {
        alert(`Ai atins limita de ${currentPlan.locations} locații din planul ${currentPlan.label}. Fă upgrade pentru mai multe locații.`);
        return;
      }
      setSelectedActiveLocationIds([...selectedActiveLocationIds, id]);
    }
  };

  const toggleEmployeeSelection = (id: string) => {
    const isSelected = selectedActiveEmployeeIds.includes(id);
    if (isSelected) {
      setSelectedActiveEmployeeIds(selectedActiveEmployeeIds.filter(i => i !== id));
    } else {
      if (!canAddMoreEmployees) {
        alert(`Ai atins limita de ${maxEmployeesForCurrentPlan} angajați din planul ${currentPlan.label}. Fă upgrade pentru mai mulți angajați.`);
        return;
      }
      setSelectedActiveEmployeeIds([...selectedActiveEmployeeIds, id]);
    }
  };

  // === CALCUL PREȚ ===
  const futureMonthlyTotal = currentPlanPrice;
  const isUpgrade = futureMonthlyTotal > currentMonthlyAmount;

  let amountToPayNow = 0;
  let prorationLabel = '';

  if (isTrialExpired && !hasSavedCard) {
    amountToPayNow = futureMonthlyTotal;
    prorationLabel = 'Trial expirat. Plătești acum pentru luna curentă.';
  } else if (realDaysRemaining > 0) {
    amountToPayNow = 0;
    prorationLabel = `Trial activ - ${realDaysRemaining} zile rămase.`;
  } else if (isUpgrade && daysUntilBilling > 0) {
    const diff = futureMonthlyTotal - currentMonthlyAmount;
    amountToPayNow = Math.round((diff / 30) * daysUntilBilling);
    prorationLabel = `Upgrade proporțional pentru ${daysUntilBilling} zile rămase.`;
  } else {
    amountToPayNow = 0;
    prorationLabel = `Noul tarif va fi procesat la următoarea facturare.`;
  }

  const handleConfirmOrder = async () => {
    if (selectedActiveLocationIds.length !== currentPlan.locations) {
      alert(`Trebuie să activezi exact ${currentPlan.locations} locații pentru planul ${currentPlan.label}.`);
      return;
    }
    setIsLoading(true);
    // ... restul logicii de trimitere comandă
    alert('Comanda a fost procesată cu succes!');
    setIsLoading(false);
  };

  if (isFetchingData) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" size={32} /></div>;
  }

  return (
    <div className="bg-[#F8FAFC] py-16 px-4 min-h-screen font-sans text-slate-900">
      <div className="max-w-4xl mx-auto">
        
        <div className="text-center mb-12">
          <h1 className="text-5xl font-black mb-4 tracking-tighter uppercase italic">Alege planul potrivit</h1>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.4em]">Fără surprize. Fără trișare.</p>
        </div>

        {/* PLANURI */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {PRICING_PLANS.map((plan, index) => {
            const isActive = selectedActiveLocationIds.length === plan.locations;
            return (
              <div 
                key={index}
                onClick={() => {
                  // Selectează planul
                  const newLocs = Array.from({length: plan.locations}, (_, i) => normalizedLocations[i]?.id).filter(Boolean);
                  setSelectedActiveLocationIds(newLocs);
                }}
                className={`p-8 rounded-[2.5rem] bg-white border-4 cursor-pointer transition-all ${isActive ? 'border-blue-600 shadow-xl scale-[1.01]' : 'border-slate-200 opacity-60 hover:opacity-100'}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-slate-100 rounded-2xl text-slate-700"><Building size={22} /></div>
                  {isActive && <span className="bg-blue-600 text-white text-[9px] font-black px-3 py-1 rounded-full">ACTIV</span>}
                </div>
                <h3 className="text-xl font-black italic text-slate-900 uppercase">{plan.label}</h3>
                <div className="flex items-baseline gap-1 my-4">
                  <span className="text-3xl font-black text-slate-900">{plan.price}</span>
                  <span className="text-xs font-bold text-slate-500">MDL / lună</span>
                </div>
                <ul className="space-y-2 text-xs font-semibold text-slate-600 border-t pt-4">
                  <li className="flex items-center gap-2"><Check size={14} className="text-blue-600" /> {plan.locations} locație{plan.locations > 1 ? 'i' : ''}</li>
                  <li className="flex items-center gap-2"><Check size={14} className="text-blue-600" /> Max {plan.maxEmployees} angajați</li>
                  <li className="flex items-center gap-2"><Check size={14} /> QR Code + Notificări Telegram</li>
                  <li className="flex items-center gap-2"><Check size={14} /> Dashboard + Statistici</li>
                </ul>
              </div>
            );
          })}
        </div>

        {/* RESTUL CODULUI (LOCAȚII + ANGAJAȚI + FACTURARE) */}
        {/* ... (păstrezi secțiunile de selecție locații și angajați cu logica de blocare) */}

        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 mb-8">
          <h3 className="text-base font-black italic uppercase text-slate-900 mb-4">Locații active ({selectedActiveLocationIds.length} / {currentPlan.locations})</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {normalizedLocations.map((loc) => {
              const isSelected = selectedActiveLocationIds.includes(loc.id);
              return (
                <div 
                  key={loc.id} 
                  onClick={() => toggleLocationSelection(loc.id)}
                  className={`p-4 rounded-xl border-2 flex justify-between items-center cursor-pointer ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-slate-200'}`}
                >
                  <span className="font-black text-xs">{loc.name}</span>
                  {isSelected ? <Check className="text-blue-600" size={16} /> : <Plus size={16} />}
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 mb-8">
          <h3 className="text-base font-black italic uppercase text-slate-900 mb-4">Angajați activi ({selectedActiveEmployeeIds.length} / {maxEmployeesForCurrentPlan})</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {normalizedEmployees.map((emp) => {
              const isSelected = selectedActiveEmployeeIds.includes(emp.id);
              const isDisabled = !canAddMoreEmployees && !isSelected;
              return (
                <div 
                  key={emp.id} 
                  onClick={() => !isDisabled && toggleEmployeeSelection(emp.id)}
                  className={`p-4 rounded-xl border-2 flex justify-between items-center ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${isSelected ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200'}`}
                >
                  <div>
                    <span className="font-black text-xs">{emp.name}</span>
                    <span className="text-[9px] text-slate-400 block">{emp.location_name}</span>
                  </div>
                  {isSelected ? <Check className="text-emerald-600" size={16} /> : <Plus size={16} />}
                </div>
              );
            })}
          </div>
          {!canAddMoreEmployees && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
              <Lock size={14} /> Ai atins limita de angajați. Fă upgrade pentru a adăuga mai mulți.
            </div>
          )}
        </div>

        {/* FACTURARE */}
        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-xs text-blue-400">TOTAL ASTĂZI</p>
              <div className="text-5xl font-black text-emerald-400">{amountToPayNow} MDL</div>
              <p className="text-xs text-slate-400 mt-1">{prorationLabel}</p>
            </div>
            <button 
              onClick={handleConfirmOrder} 
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-500 px-8 py-4 rounded-xl font-black text-sm flex items-center gap-2"
            >
              {isLoading ? 'Se procesează...' : 'Confirmă și Plătește'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}