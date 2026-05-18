'use client';

import React, { useState, ChangeEvent, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { createBrowserClient } from '@supabase/ssr';
import { 
  Check, QrCode, Truck, Plus, Trash2, 
  ChevronRight, Loader2, Upload, FileText, Image as ImageIcon,
  Calendar, AlertCircle, Sparkles, Building, ArrowUpRight
} from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

interface RealLocation {
  id: string;
  name?: string;
  title?: string;
  user_id?: string;
}

interface RealEmployee {
  id: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  location_id?: string;
  location_name?: string;
  user_id?: string;
}

export default function QRateCompletePricing() {
  const t = useTranslations('Subscription');
  const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

  // --- STATE-URI REALE DIN BAZA DE DATE ---
  const [dbLocations, setDbLocations] = useState<RealLocation[]>([]);
  const [dbEmployees, setDbEmployees] = useState<RealEmployee[]>([]);
  const [realDaysRemaining, setRealDaysRemaining] = useState<number>(0);
  const [isTrialExpired, setIsTrialExpired] = useState<boolean>(false);
  const [hasSavedCard, setHasSavedCard] = useState<boolean>(false);
  
  // Logica de Upgrade / Proration
  const [currentMonthlyAmount, setCurrentMonthlyAmount] = useState<number>(0); 
  const [daysUntilBilling, setDaysUntilBilling] = useState<number>(0);

  // --- STATE-URI CONFIGURATOR INTERFAȚĂ ---
  const [locs, setLocs] = useState<number>(1);
  const [extraEmps, setExtraEmps] = useState<number>(0); 
  const [stickerCount, setStickerCount] = useState<number>(500);
  const [isStickersAdded, setIsStickersAdded] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFetchingData, setIsFetchingData] = useState<boolean>(true);

  const [selectedActiveLocationIds, setSelectedActiveLocationIds] = useState<string[]>([]);
  const [selectedActiveEmployeeIds, setSelectedActiveEmployeeIds] = useState<string[]>([]);
  
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  const [orderNotes, setOrderNotes] = useState<string>('');

  const hasInitialized = useRef(false);

  // --- FETCH CONFIGURAȚIE DIRECT DIN SUPABASE ---
  useEffect(() => {
    async function fetchUserCompanyData() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        
        if (!user) {
          setIsFetchingData(false);
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('created_at, trial_ends_at, next_billing_date, monthly_amount, maib_recurrent_id')
          .eq('id', user.id)
          .single();

        if (profile) {
          const now = new Date();
          now.setHours(0,0,0,0);

          const endDate = profile.trial_ends_at 
            ? new Date(profile.trial_ends_at) 
            : new Date(new Date(profile.created_at).getTime() + 7 * 24 * 60 * 60 * 1000);
          endDate.setHours(0,0,0,0);
          
          const expired = endDate < now;
          const hasCard = !!profile.maib_recurrent_id;
          
          setIsTrialExpired(expired);
          setHasSavedCard(hasCard);

          if (expired && !hasCard) {
            setCurrentMonthlyAmount(0);
            setDaysUntilBilling(0);
            setRealDaysRemaining(0);
          } else {
            setCurrentMonthlyAmount(profile.monthly_amount ? Number(profile.monthly_amount) : 0);
            
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

        const currentLocs: RealLocation[] = locationsData || [];
        const currentEmps: RealEmployee[] = employeesData || [];

        setDbLocations(currentLocs);
        setDbEmployees(currentEmps);

        if (!hasInitialized.current) {
          setLocs(currentLocs.length > 0 ? currentLocs.length : 1);
          if (currentLocs.length > 0) {
            if (currentLocs.length === 1) {
              setSelectedActiveLocationIds([currentLocs[0].id]);
            } else {
              setSelectedActiveLocationIds(currentLocs.map((l: RealLocation) => l.id));
            }
          }
          setSelectedActiveEmployeeIds(currentEmps.map((e: RealEmployee) => e.id));
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

  // --- NORMALIZARE DATE ---
  const normalizedLocations = dbLocations.map(l => ({
    id: l.id,
    name: l.name || l.title || 'Locație fără nume'
  }));

  const normalizedEmployees = dbEmployees.map(e => {
    const matchedLoc = dbLocations.find(l => l.id === e.location_id);
    const resolvedLocationName = matchedLoc 
      ? (matchedLoc.name || matchedLoc.title || 'Locație fără nume')
      : (e.location_name || t('ConfiguratorUI.employee_no_location'));

    return {
      id: e.id,
      name: e.name || `${e.first_name || ''} ${e.last_name || ''}`.trim() || 'Angajat anonim',
      location_id: e.location_id || '',
      location_name: resolvedLocationName
    };
  });

  const isStartPlan = locs === 1;
  const isProPlan = locs > 1;
  const maxEmployeesAllowedForStartPlan = 4;

  // --- HANDLERS SCHIMBĂRI ---
  const handleLocChange = (val: number) => {
    setLocs(Math.max(2, val));
  };

  const handleSelectPlan = (planType: 'START' | 'PRO') => {
    if (planType === 'START') {
      setLocs(1);
      if (selectedActiveLocationIds.length > 1) {
        setSelectedActiveLocationIds([selectedActiveLocationIds[0]]);
      }
    } else {
      if (locs === 1) setLocs(2);
    }
  };

  // --- LOGICĂ CORECTĂ SWITCH AUTOMAT LOCAȚIE ---
  const toggleLocationSelection = (id: string) => {
    const isAlreadySelected = selectedActiveLocationIds.includes(id);

    if (isAlreadySelected) {
      if (selectedActiveLocationIds.length > 1) {
        setSelectedActiveLocationIds(selectedActiveLocationIds.filter(item => item !== id));
      }
    } else {
      if (isStartPlan) {
        setSelectedActiveLocationIds([id]);
      } else {
        if (selectedActiveLocationIds.length >= locs) {
          alert(`Ai atins limita maximă de ${locs} locații active configurate.`);
          return;
        }
        setSelectedActiveLocationIds([...selectedActiveLocationIds, id]);
      }
    }
  };

  const toggleEmployeeSelection = (id: string) => {
    if (selectedActiveEmployeeIds.includes(id)) {
      setSelectedActiveEmployeeIds(selectedActiveEmployeeIds.filter(item => item !== id));
    } else {
      if (isStartPlan && selectedActiveEmployeeIds.length >= maxEmployeesAllowedForStartPlan) {
        alert(`Planul START include maximum ${maxEmployeesAllowedForStartPlan} angajați activi.`);
        return;
      }
      setSelectedActiveEmployeeIds([...selectedActiveEmployeeIds, id]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setQrFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setQrPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveFile = () => {
    const fileInput = document.getElementById('qr-file-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
    setQrFile(null);
    setQrPreview(null);
  };

  // --- CALCULATOR PREȚURI + PROPORȚIONAL ---
  const startBaseCost = 600; 
  const proBaseCostPerLocation = 600;
  const extraEmpCostRate = 50;

  const futureSoftwareMonthlyTotal = isStartPlan 
    ? startBaseCost 
    : (locs * proBaseCostPerLocation) + (extraEmps * extraEmpCostRate);

  const isUpgrade = futureSoftwareMonthlyTotal > currentMonthlyAmount;
  const isTrialReallyActive = realDaysRemaining > 0 && !isTrialExpired;

  let currentSoftwareTotalPaidNow = 0;
  let prorationLabel = '';

  if (isTrialExpired && !hasSavedCard) {
    currentSoftwareTotalPaidNow = futureSoftwareMonthlyTotal;
    prorationLabel = t('ConfiguratorUI.status_expired_desc');
  } else if (isTrialReallyActive) {
    currentSoftwareTotalPaidNow = 0;
    prorationLabel = `Protejat de cele ${realDaysRemaining} zile rămase de Trial gratuit.`;
  } else if (isUpgrade && daysUntilBilling > 0) {
    const priceDifferenceFullMonth = futureSoftwareMonthlyTotal - currentMonthlyAmount;
    const costPerDayDifference = priceDifferenceFullMonth / 30;
    currentSoftwareTotalPaidNow = Math.round(costPerDayDifference * daysUntilBilling);
    prorationLabel = `Upgrade proporțional pentru cele ${daysUntilBilling} zile rămase din luna curentă.`;
  } else {
    currentSoftwareTotalPaidNow = 0;
    prorationLabel = `Noul tarif de ${futureSoftwareMonthlyTotal} MDL/lună va fi procesat la următoarea dată de facturare.`;
  }
  
  const stickerTotal = isStickersAdded ? parseFloat((stickerCount * 0.33).toFixed(2)) : 0;
  const grandTotalPaidNow = currentSoftwareTotalPaidNow + stickerTotal;

  const totalRealActiveEmployeesCount = normalizedEmployees.filter(e => 
    selectedActiveLocationIds.includes(e.location_id) && selectedActiveEmployeeIds.includes(e.id)
  ).length;

  const handleConfirmOrder = async () => {
    if (selectedActiveLocationIds.length !== locs) {
      alert(`Te rugăm să bifezi exact cele ${locs} locații pe care dorești să le păstrezi active.`);
      return;
    }
    setIsLoading(true);

    const formData = new FormData();
    formData.append('plan', isProPlan ? 'PRO' : 'START');
    formData.append('locationsCount', locs.toString());
    formData.append('totalAmountPaidNow', grandTotalPaidNow.toFixed(0));
    formData.append('futureMonthlyAmount', futureSoftwareMonthlyTotal.toString());
    formData.append('setupRecurrent', 'true');
    formData.append('notes', orderNotes);

    const blockedLocationIds = normalizedLocations.map(l => l.id).filter(id => !selectedActiveLocationIds.includes(id));
    const blockedEmployeeIds = normalizedEmployees.map(e => e.id).filter(id => !selectedActiveEmployeeIds.includes(id));

    formData.append('activeLocationIds', JSON.stringify(selectedActiveLocationIds));
    formData.append('blockedLocationIds', JSON.stringify(blockedLocationIds));
    formData.append('activeEmployeeIds', JSON.stringify(selectedActiveEmployeeIds));
    formData.append('blockedEmployeeIds', JSON.stringify(blockedEmployeeIds));
    
    if (qrFile) formData.append('qrCodeImage', qrFile);

    try {
      const response = await fetch('/api/orders/confirm', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        if (data.payUrl) {
          window.location.href = data.payUrl;
        } else {
          alert('Modificările au fost salvate cu succes!');
          window.location.reload();
        }
      } else {
        alert(data.error || 'A apărut o eroare la salvare.');
      }
    } catch (error) {
      console.error("Eroare la trimiterea comenzii:", error);
      alert('Problemă de conexiune cu serverul.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetchingData) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center gap-3">
        <Loader2 className="animate-spin text-blue-600" size={32} />
        <span className="text-sm font-black uppercase text-slate-500 tracking-wider">Se încarcă datele...</span>
      </div>
    );
  }

  return (
    <div className="bg-[#F8FAFC] py-16 px-4 min-h-screen font-sans text-slate-900">
      <div className="max-w-4xl mx-auto">
        
        {/* HEADER TITLU DINAMIC */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-black mb-4 tracking-tighter uppercase italic">
            {t('ConfiguratorUI.page_main_title')}
          </h1>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.4em]">
            {t('ConfiguratorUI.page_main_subtitle')}
          </p>
        </div>

        {/* PANOU STATUS STARE CONT */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-950 text-white p-6 rounded-[2.5rem] shadow-xl mb-8 border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-blue-500/10 text-blue-400 rounded-2xl border border-blue-500/20">
              <Calendar size={26} />
            </div>
            <div>
              <span className="bg-amber-500 text-slate-950 font-black text-[9px] px-2.5 py-1 rounded-md uppercase tracking-wider">
                {t('ConfiguratorUI.status_banner_title')}
              </span>
              <h3 className="text-lg font-black italic mt-1">
                {isTrialExpired && !hasSavedCard 
                  ? t('ConfiguratorUI.status_expired_no_card') 
                  : `${t('pricing.plans.license_monthly')}: ${currentMonthlyAmount} MDL/${t('pricing.plans.month')}.`}
              </h3>
              <p className="text-xs text-slate-400 font-medium leading-relaxed mt-0.5">
                {isTrialExpired && !hasSavedCard 
                  ? t('ConfiguratorUI.status_expired_desc') 
                  : t('ConfiguratorUI.status_active_desc', { days: daysUntilBilling })}
              </p>
            </div>
          </div>
          <div className="bg-white/5 px-6 py-3 rounded-2xl border border-white/10 text-center shrink-0 w-full sm:w-auto">
            <span className="block text-2xl font-black text-emerald-400">{currentSoftwareTotalPaidNow} MDL</span>
            <span className="text-[8px] font-bold uppercase text-slate-400 tracking-wider">Licență Software Astăzi</span>
          </div>
        </div>

        {/* BANNER MAPARE DATE */}
        <div className="bg-blue-50 border-2 border-blue-100 p-5 rounded-3xl shadow-sm mb-8 flex items-start gap-4">
          <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-md shrink-0">
            <AlertCircle size={18} />
          </div>
          <div>
            <h4 className="text-xs font-black text-blue-950 uppercase tracking-tight">
              {t('ConfiguratorUI.sync_banner_title')}
            </h4>
            <p className="text-xs text-blue-900 mt-0.5 leading-relaxed font-medium">
              {t('ConfiguratorUI.sync_banner_desc', { locsCount: normalizedLocations.length, empsCount: normalizedEmployees.length })}
            </p>
          </div>
        </div>

        {/* CARDS PLANURI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          {/* START PLAN */}
          <div 
            onClick={() => handleSelectPlan('START')}
            className={`p-8 rounded-[2.5rem] bg-white border-4 cursor-pointer transition-all relative ${
              isStartPlan ? 'border-blue-600 shadow-xl scale-[1.01]' : 'border-slate-200/60 opacity-60 hover:opacity-90'
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-slate-100 rounded-2xl text-slate-700">
                <Building size={22} />
              </div>
              {isStartPlan && <span className="bg-blue-600 text-white text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-full">Activat</span>}
            </div>
            <h3 className="text-xl font-black italic text-slate-900 uppercase">{t('plans.standard.name')}</h3>
            <p className="text-xs text-slate-400 font-medium mt-1 mb-4">Perfect pentru o singură locație.</p>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-3xl font-black text-slate-900">{startBaseCost}</span>
              <span className="text-xs font-bold text-slate-500">MDL / {t('pricing.plans.month')}</span>
            </div>
            <ul className="space-y-2 text-xs font-semibold text-slate-600 border-t pt-4">
              <li className="flex items-center gap-2 text-blue-600"><Check size={14} /> {t('plans.standard.features.locations')}</li>
              <li className="flex items-center gap-2"><Check size={14} /> {t('plans.standard.features.employees')}</li>
              <li className="flex items-center gap-2"><Check size={14} /> {t('plans.standard.features.qr_collection')}</li>
              <li className="flex items-center gap-2"><Check size={14} /> {t('plans.standard.features.telegram_alerts')}</li>
              <li className="flex items-center gap-2"><Check size={14} /> {t('plans.standard.features.dashboard')}</li>
              <li className="flex items-center gap-2"><Check size={14} /> {t('plans.standard.features.secure_auth')}</li>
              <li className="flex items-center gap-2"><Check size={14} /> {t('plans.standard.features.email_support')}</li>
            </ul>
          </div>

          {/* PRO PLAN */}
          <div 
            onClick={() => handleSelectPlan('PRO')}
            className={`p-8 rounded-[2.5rem] bg-white border-4 cursor-pointer transition-all relative ${
              isProPlan ? 'border-blue-600 shadow-xl scale-[1.01]' : 'border-slate-200/60 opacity-60 hover:opacity-90'
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                <Sparkles size={22} />
              </div>
              {isProPlan && <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-full">Activat</span>}
            </div>
            <h3 className="text-xl font-black italic text-slate-900 uppercase">{t('plans.enterprise.name')}</h3>
            <p className="text-xs text-slate-400 font-medium mt-1 mb-4">Pentru business-uri scalabile.</p>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-3xl font-black text-slate-900">{proBaseCostPerLocation}</span>
              <span className="text-xs font-bold text-slate-500">MDL / {t('pricing.plans.one_location')} / {t('pricing.plans.month')}</span>
            </div>
            <ul className="space-y-2 text-xs font-semibold text-slate-600 border-t pt-4">
              <li className="flex items-center gap-2 text-blue-600"><Check size={14} /> {t('plans.enterprise.features.all_start')}</li>
              <li className="flex items-center gap-2 text-blue-600"><Check size={14} /> {t('plans.enterprise.features.management')}</li>
              <li className="flex items-center gap-2 text-blue-600"><Check size={14} /> {t('plans.enterprise.features.unlimited_employees')}</li>
              <li className="flex items-center gap-2 text-blue-600"><Check size={14} /> {t('plans.enterprise.features.realtime_stats')}</li>
              <li className="flex items-center gap-2 text-blue-600"><Check size={14} /> {t('plans.enterprise.features.negative_filter')}</li>
              <li className="flex items-center gap-2 text-blue-600"><Check size={14} /> {t('plans.enterprise.features.priority_support')}</li>
            </ul>
          </div>
        </div>

        {/* NUMĂR LOCAȚII PENTRU PRO */}
        {isProPlan && (
          <div className="bg-white p-6 rounded-3xl shadow-md border border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
            <div>
              <h4 className="text-sm font-black uppercase text-slate-900">{t('configurator.enterprise_mode')}</h4>
              <p className="text-xs text-slate-400 font-medium mt-0.5">{t('configurator.locations_label')}</p>
            </div>
            <div className="flex items-center gap-4">
              <button type="button" onClick={() => handleLocChange(locs - 1)} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center font-black border border-slate-200 hover:bg-blue-600 hover:text-white transition-all">-</button>
              <span className="text-3xl font-black w-12 text-center text-blue-600">{locs}</span>
              <button type="button" onClick={() => handleLocChange(locs + 1)} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center font-black border border-slate-200 hover:bg-blue-600 hover:text-white transition-all">+</button>
            </div>
          </div>
        )}

        {/* SELECȚIE MANAGMENT FILTRE INTERFAȚĂ DINAMICĂ */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 mb-8">
          
          {/* SECȚIUNEA 1: LOCAȚII */}
          <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
            <div>
              <h3 className="text-base font-black italic uppercase text-slate-900">
                {t('ConfiguratorUI.locations_block_title')}
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                {t('ConfiguratorUI.locations_block_subtitle', { limit: locs })}
              </p>
            </div>
            <span className="bg-slate-100 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider text-slate-600">
              {t('ConfiguratorUI.locations_selected_badge', { selected: selectedActiveLocationIds.length, total: locs })}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
            {normalizedLocations.map((location) => {
              const isActive = selectedActiveLocationIds.includes(location.id);
              return (
                <div 
                  key={location.id} 
                  onClick={() => toggleLocationSelection(location.id)}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                    isActive ? 'border-blue-500 bg-blue-50/40 text-blue-950 shadow-sm' : 'border-slate-200 bg-slate-50/40 text-slate-400 opacity-70'
                  }`}
                >
                  <span className="text-xs font-black">{location.name}</span>
                  <div className={`p-1.5 rounded-lg ${isActive ? 'bg-blue-600 text-white' : 'bg-slate-300 text-slate-600'}`}>
                    {isActive ? <Check size={14} /> : <Plus size={14} />}
                  </div>
                </div>
              );
            })}
          </div>

          {/* SECȚIUNEA 2: ANGAJAȚI */}
          <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
            <div>
              <h3 className="text-base font-black italic uppercase text-slate-900">
                {t('ConfiguratorUI.employees_block_title')}
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                {t('ConfiguratorUI.employees_block_subtitle')}
              </p>
            </div>
            <span className="bg-slate-100 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider text-slate-600">
              {t('ConfiguratorUI.employees_active_badge', { count: totalRealActiveEmployeesCount })}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {normalizedEmployees.map((employee) => {
              const isParentLocationActive = selectedActiveLocationIds.includes(employee.location_id);
              const isChosenActive = selectedActiveEmployeeIds.includes(employee.id) && isParentLocationActive;

              return (
                <div 
                  key={employee.id} 
                  onClick={() => isParentLocationActive && toggleEmployeeSelection(employee.id)}
                  className={`p-4 rounded-xl border-2 transition-all flex items-center justify-between ${
                    !isParentLocationActive ? 'border-slate-100 bg-slate-100/50 text-slate-400 cursor-not-allowed opacity-50' : isChosenActive ? 'border-emerald-500 bg-emerald-50/30 text-slate-900 cursor-pointer' : 'border-red-200 bg-red-50/20 text-slate-500 cursor-pointer'
                  }`}
                >
                  <div>
                    <span className="font-black block text-xs">{employee.name}</span>
                    <span className="text-[9px] text-slate-400 block font-medium mt-0.5">
                      {isParentLocationActive ? employee.location_name : t('ConfiguratorUI.employee_inactive_parent')}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tight ${isChosenActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                    {isChosenActive ? t('ConfiguratorUI.employee_badge_active') : t('ConfiguratorUI.employee_badge_suspended')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* MATERIALE FIZICE */}
        <div className="bg-white border border-slate-200 p-6 rounded-[2.5rem] shadow-xl mb-8">
          <div className={`transition-all duration-300 p-5 rounded-2xl flex flex-col sm:flex-row items-center gap-4 mb-6 border-b-4 ${isStickersAdded ? 'bg-blue-600 text-white border-blue-800' : 'bg-slate-900 text-white border-slate-700'}`}>
            <div className={`p-3 rounded-xl ${isStickersAdded ? 'bg-white text-blue-600' : 'bg-blue-600 text-white'}`}><QrCode size={22} /></div>
            <div className="text-left flex-1">
              <h4 className="text-base font-black uppercase italic tracking-tight flex items-center gap-2">
                <Truck size={18} /> {t('stickers.title')} <span className="text-xs font-normal not-italic lowercase opacity-80">(0.33 MDL / buc.)</span>
              </h4>
              <p className="text-[9px] font-bold opacity-70 italic uppercase tracking-wider text-blue-100">
                {t('ConfiguratorUI.stickers_block_subtitle')}
              </p>
            </div>
            <div className="flex items-center gap-3 bg-black/20 p-2 rounded-xl border border-white/5">
              <input type="number" value={stickerCount} onChange={(e) => setStickerCount(parseInt(e.target.value) || 0)} className="bg-transparent text-lg font-black w-16 text-center text-white focus:outline-none" />
              <button type="button" onClick={() => setIsStickersAdded(!isStickersAdded)} className={`p-2.5 rounded-lg text-white ${isStickersAdded ? 'bg-red-500' : 'bg-blue-500'}`}>
                {isStickersAdded ? <Trash2 size={16} /> : <Plus size={16} />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-4">
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-2 flex items-center gap-1"><ImageIcon size={12} /> {t('ConfiguratorUI.stickers_logo_label')}</span>
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center bg-slate-50 min-h-[120px] relative">
                {qrPreview ? (
                  <div className="absolute inset-0 bg-white flex flex-col items-center justify-center p-2 z-10">
                    <img src={qrPreview} alt="QR Preview" className="h-16 w-20 object-contain rounded-lg mb-1" />
                    <button type="button" onClick={handleRemoveFile} className="text-[9px] text-red-500 font-bold uppercase hover:underline">{t('ConfiguratorUI.stickers_logo_delete')}</button>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center">
                    <Upload size={20} className="text-slate-400 mb-1" />
                    <span className="text-xs font-bold text-slate-600">{t('ConfiguratorUI.stickers_logo_select')}</span>
                    <input id="qr-file-upload" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  </label>
                )}
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-2 flex items-center gap-1"><FileText size={12} /> {t('ConfiguratorUI.stickers_notes_label')}</span>
              <textarea value={orderNotes} onChange={(e) => setOrderNotes(e.target.value)} placeholder={t('ConfiguratorUI.stickers_notes_placeholder')} rows={3} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:border-blue-500 resize-none" />
            </div>
          </div>
        </div>

        {/* CART DE FACTURARE AUTOMATĂ */}
        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl border-b-[10px] border-blue-600 relative overflow-hidden">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
            <div className="flex-1 w-full">
              <h4 className="text-xs font-black uppercase tracking-[0.4em] text-blue-400 mb-3">{t('ConfiguratorUI.invoice_title')}</h4>
              <div className="space-y-2.5">
                <div className="flex justify-between text-[11px] text-slate-400 border-b border-white/5 pb-2">
                  <span>{t('ConfiguratorUI.invoice_next_cost')}</span>
                  <span className="font-bold text-white text-xs">{futureSoftwareMonthlyTotal} MDL / {t('pricing.plans.month')}</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <div>
                    <p className="text-xs font-black uppercase italic flex items-center gap-1.5">
                      {t('ConfiguratorUI.invoice_software_pack')} ({isProPlan ? 'PRO' : 'START'})
                      {isUpgrade && !isTrialReallyActive && <ArrowUpRight size={14} className="text-amber-400 animate-pulse" />}
                    </p>
                    <p className="text-[10px] text-emerald-400 font-bold mt-0.5">{prorationLabel}</p>
                  </div>
                  <p className="text-lg font-black text-emerald-400">{currentSoftwareTotalPaidNow} MDL</p>
                </div>
                {isStickersAdded && (
                  <div className="flex justify-between items-center text-blue-400 text-xs">
                    <p className="font-black italic uppercase">{t('summary.stickers_item')} ({stickerCount} buc.)</p>
                    <p className="font-black">+{stickerTotal} MDL</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white/5 p-6 rounded-3xl w-full lg:w-auto border border-white/5 text-center lg:text-left shrink-0">
              <p className="text-[8px] font-black uppercase text-slate-400 tracking-[0.2em] mb-0.5">{t('ConfiguratorUI.invoice_total_today')}</p>
              <div className="flex items-baseline justify-center lg:justify-start gap-0.5 mb-4">
                <span className="text-5xl font-black text-emerald-400 italic">{(grandTotalPaidNow).toFixed(0)}</span>
                <span className="text-[10px] font-bold text-emerald-400 uppercase ml-1">MDL</span>
              </div>
              
              <button 
                type="button" 
                disabled={isLoading} 
                onClick={handleConfirmOrder} 
                className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-black uppercase tracking-wider text-[10px] transition-all flex items-center justify-center gap-2 w-full shadow-lg"
              >
                {isLoading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : grandTotalPaidNow > 0 ? (
                  isUpgrade && !isTrialReallyActive ? (
                    <>{t('ConfiguratorUI.btn_pay_difference')} <ChevronRight size={14} /></>
                  ) : (
                    <>{t('ConfiguratorUI.btn_go_to_payment')} <ChevronRight size={14} /></>
                  )
                ) : (
                  <>{t('ConfiguratorUI.btn_save_changes')} <ChevronRight size={14} /></>
                )}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}