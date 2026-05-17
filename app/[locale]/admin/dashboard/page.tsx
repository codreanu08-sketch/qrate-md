'use client'; 

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/supabase';
import { 
  Building2, 
  Star, 
  AlertCircle,
  MapPin,
  FileText,
  X,
  Clock,
  ShieldAlert,
  UserCheck,
  UserMinus,
  CalendarPlus,
  Wallet,
  CheckCircle2,
  BadgeCheck,
  Receipt,
  Coins
} from 'lucide-react';

export default function SuperAdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [debugErrors, setDebugErrors] = useState<string[]>([]);

  // Tab-uri executive
  const [activeTab, setActiveTab] = useState<'companies' | 'locations' | 'reviews'>('companies');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  
  // State-uri pentru Modale (Pop-up-uri)
  const [selectedCompanyForDetails, setSelectedCompanyForDetails] = useState<any | null>(null);
  const [paymentCompany, setPaymentCompany] = useState<any | null>(null);
  
  // Câmpuri introducere plată manuală persoană juridică
  const [paymentAmount, setPaymentAmount] = useState<string>('500'); 
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');

  // Date din Supabase
  const [companiesData, setCompaniesData] = useState<any[]>([]);
  const [allReviews, setAllReviews] = useState<any[]>([]);
  const [allLocations, setAllLocations] = useState<any[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]); 

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Funcție de reîncărcare live a datelor după acțiuni administrative
  async function refreshData() {
    const resCompanies = await supabase.from('companies').select('*').order('created_at', { ascending: false });
    const resLocations = await supabase.from('locations').select('*');
    const resReviews = await supabase.from('reviews').select('*').order('created_at', { ascending: false });
    const resPayments = await supabase.from('payments').select('*').order('paid_at', { ascending: false });

    // CORECȚIE SYNTAXĂ: Adăugat arrow function corect pentru filtrare
    const targetCompanies = (resCompanies.data || []).filter((c: any) => 
      ['fff', 'Sultan Doner', 'gg', 'g'].includes(c.name)
    );
    
    setCompaniesData(targetCompanies);
    if (resLocations.data) setAllLocations(resLocations.data);
    if (resReviews.data) setAllReviews(resReviews.data);
    if (resPayments.data) setPaymentHistory(resPayments.data);
  }

  // Calculează starea financiară exactă (Trial sau Abonament cumpărat)
  const calculateSubscriptionStatus = (company: any) => {
    const now = new Date();
    
    if (company.is_active === false) {
      return { text: 'SUSPENDAT MANUAl', color: 'text-red-700 bg-red-100 border-red-300 font-black', urgent: false };
    }
    
    // 1. Cazul în care are ABONAMENT cumpărat (Paid)
    if (company.is_subscribed && company.subscription_expires_at) {
      const expiry = new Date(company.subscription_expires_at);
      const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) {
        return { text: `Abonament expirat (${Math.abs(diffDays)} zile)`, color: 'text-red-700 bg-red-50 border-red-200', urgent: true };
      }
      return { text: `${diffDays} zile până la plată`, color: 'text-emerald-700 bg-emerald-50 border-emerald-200 font-bold', urgent: diffDays <= 2 };
    }
    
    // 2. Cazul în care este în perioada de TRIAL (7 zile)
    if (company.trial_started_at) {
      const trialStart = new Date(company.trial_started_at);
      const trialExpiry = new Date(trialStart.getTime() + 7 * 24 * 60 * 60 * 1000);
      const diffDays = Math.ceil((trialExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) {
        return { text: 'Trial Expirat', color: 'text-amber-700 bg-amber-50 border-amber-200', urgent: true };
      }
      return { text: `${diffDays} zile în Trial`, color: 'text-blue-700 bg-blue-50 border-blue-200 font-semibold', urgent: diffDays <= 2 };
    }

    return { text: 'Fără date financiare', color: 'text-slate-400 bg-slate-100 border-slate-200', urgent: false };
  };

  // 1. Suspendare / Activare Instantă
  const toggleCompanyStatus = async (company: any) => {
    const nextStatus = company.is_active === false;
    const { error } = await supabase
      .from('companies')
      .update({ is_active: nextStatus } as any)
      .eq('id', company.id);

    if (!error) refreshData();
  };

  // 2. Adaugă +7 Zile de Trial
  const addExtensionTrial = async (company: any) => {
    let baseDate = new Date();
    if (company.trial_started_at) {
      baseDate = new Date(company.trial_started_at);
    }
    const extendedDate = new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    
    const { error } = await supabase
      .from('companies')
      .update({ 
        trial_started_at: extendedDate,
        is_active: true 
      } as any)
      .eq('id', company.id);

    if (!error) refreshData();
  };

  // 3. Înregistrare plată manuală persoană juridică (Abonament 30 zile) + Scriere în Istoric Plăți
  const handleRegisterPayment = async () => {
    if (!paymentCompany) return;
    
    const now = new Date();
    const newExpiryDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const { error: companyUpdateError } = await supabase
      .from('companies')
      .update({
        is_subscribed: true,
        subscription_expires_at: newExpiryDate,
        is_active: true
      } as any)
      .eq('id', paymentCompany.id);

    if (!companyUpdateError) {
      await supabase.from('payments').insert({
        company_id: paymentCompany.id,
        amount: parseFloat(paymentAmount),
        invoice_number: invoiceNumber || `FACT-${Date.now().toString().slice(-4)}`,
        paid_at: now.toISOString()
      } as any);

      setPaymentCompany(null);
      setInvoiceNumber('');
      refreshData();
    }
  };

  useEffect(() => {
    async function loadAdminData() {
      try {
        const resCompanies = await supabase.from('companies').select('*').order('created_at', { ascending: false });
        const resLocations = await supabase.from('locations').select('*');
        const resReviews = await supabase.from('reviews').select('*').order('created_at', { ascending: false });
        const resPayments = await supabase.from('payments').select('*').order('paid_at', { ascending: false });

        // CORECȚIE SYNTAXĂ: Adăugat arrow function corect pentru filtrare locală
        const targetCompanies = (resCompanies.data || []).filter((c: any) => 
          ['fff', 'Sultan Doner', 'gg', 'g'].includes(c.name)
        );

        setCompaniesData(targetCompanies);
        if (resLocations.data) setAllLocations(resLocations.data);
        if (resReviews.data) setAllReviews(resReviews.data);
        if (resPayments.data) setPaymentHistory(resPayments.data);
      } catch (err: any) {
        setDebugErrors([`Eroare inițială: ${err.message}`]);
      } verify {
        setLoading(false);
      }
    }
    loadAdminData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 text-slate-200">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const urgentCompanies = companiesData.filter(c => calculateSubscriptionStatus(c).urgent);

  return (
    <div className="p-8 bg-[#f8fafc] min-h-screen font-sans text-slate-900 antialiased">
      
      {/* 🚨 URGENȚE WATCHDOG */}
      {urgentCompanies.length > 0 && (
        <div className="mb-8 p-5 bg-red-50 border-2 border-red-200 rounded-3xl text-red-900 shadow-xs">
          <div className="font-black uppercase text-xs tracking-wider flex items-center gap-2 text-red-700 mb-3">
            <ShieldAlert size={18} /> Companii În Pericol de Expirare (Contactează Urgent):
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {urgentCompanies.map(c => (
              <div key={c.id} className="bg-white p-4 rounded-2xl border border-red-100 flex justify-between items-center shadow-xs">
                <div>
                  <p className="font-black text-sm text-slate-900">{c.name}</p>
                  <p className="text-[11px] font-bold text-red-600 mt-0.5">{calculateSubscriptionStatus(c).text}</p>
                </div>
                <button 
                  onClick={() => setPaymentCompany(c)}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-[10px] font-black uppercase rounded-xl transition"
                >
                  Încasează Plată
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Header Panou principal */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">QRate.MD <span className="text-indigo-600">SuperAdmin</span></h1>
          <p className="text-slate-500 text-xs mt-1 uppercase font-black tracking-widest">Panou Administrativ Centralizat v3</p>
        </div>
        {selectedCompanyId && (
          <button onClick={() => setSelectedCompanyId(null)} className="px-4 py-2 bg-slate-950 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition">
            Resetează Filtrele Curente
          </button>
        )}
      </div>

      {/* Carduri Modul Control Tab-uri */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <button onClick={() => setActiveTab('companies')} className={`p-6 rounded-3xl border transition-all flex items-center gap-5 text-left bg-white ${activeTab === 'companies' ? 'border-indigo-600 ring-4 ring-indigo-50 shadow-xs' : 'border-slate-100'}`}>
          <div className="bg-indigo-600 w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md shadow-indigo-100"><Building2 size={20}/></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono mb-1">Companii Înregistrate</p>
            <p className="text-2xl font-black text-slate-900">{companiesData.length}</p>
          </div>
        </button>

        <button onClick={() => setActiveTab('locations')} className={`p-6 rounded-3xl border transition-all flex items-center gap-5 text-left bg-white ${activeTab === 'locations' ? 'border-indigo-600 ring-4 ring-indigo-50 shadow-xs' : 'border-slate-100'}`}>
          <div className="bg-indigo-600 w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md shadow-indigo-100"><MapPin size={20}/></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono mb-1">Puncte de Lucru Active</p>
            <p className="text-2xl font-black text-slate-900">{allLocations.length}</p>
          </div>
        </button>

        <button onClick={() => setActiveTab('reviews')} className={`p-6 rounded-3xl border transition-all flex items-center gap-5 text-left bg-white ${activeTab === 'reviews' ? 'border-amber-500 ring-4 ring-amber-50 shadow-xs' : 'border-slate-100'}`}>
          <div className="bg-amber-500 w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md shadow-amber-100"><Star size={20}/></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono mb-1">Recenzii (Feed de Alertă)</p>
            <p className="text-2xl font-black text-slate-900">{allReviews.length}</p>
          </div>
        </button>
      </div>

      {/* STRUCTURĂ DATE */}
      <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden">
        
        {/* TAB 1: COMPANII */}
        {activeTab === 'companies' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 text-slate-400 text-[10px] uppercase font-black tracking-widest border-b border-slate-100">
                  <th className="px-6 py-4">Denumire Firmă & Senzor Conversie</th>
                  <th className="px-6 py-4">Locații</th>
                  <th className="px-6 py-4">Recenzii Total</th>
                  <th className="px-6 py-4">Valabilitate Abonament</th>
                  <th className="px-6 py-4 text-center">Acțiuni Rapide SuperAdmin</th>
                  <th className="px-6 py-4 text-center">Date Fiscale & Plăți</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {companiesData.map((company) => {
                  const finance = calculateSubscriptionStatus(company);
                  const compLocs = allLocations.filter(l => l.company_id === company.id);
                  const compRevs = allReviews.filter(r => r.company_id === company.id);
                  const avgRating = compRevs.length > 0 
                    ? (compRevs.reduce((acc, curr) => acc + (curr.rating || 0), 0) / compRevs.length).toFixed(1)
                    : '0.0';

                  return (
                    <tr key={company.id} className={`hover:bg-slate-50/40 transition-colors ${company.is_active === false ? 'bg-red-50/30' : ''}`}>
                      <td className="px-6 py-5">
                        <div className="font-black text-slate-900 text-sm flex items-center gap-2">
                          {company.name}
                          {company.is_subscribed ? (
                            <span className="bg-emerald-100 text-emerald-800 text-[9px] px-2 py-0.5 rounded-full font-black flex items-center gap-0.5"><BadgeCheck size={10}/> Client Verificat (Paid)</span>
                          ) : (
                            <span className="bg-blue-100 text-blue-800 text-[9px] px-2 py-0.5 rounded-full font-black">În Perioadă de Trial</span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {company.id.substring(0, 8)}...</div>
                      </td>

                      <td className="px-6 py-5">
                        <button onClick={() => { setSelectedCompanyId(company.id); setActiveTab('locations'); }} className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-xl hover:bg-indigo-100 transition inline-flex items-center gap-1">
                          <MapPin size={12}/> {compLocs.length} Locații
                        </button>
                      </td>

                      <td className="px-6 py-5">
                        <button onClick={() => { setSelectedCompanyId(company.id); setActiveTab('reviews'); }} className="text-left group block">
                          <div className="flex items-center gap-0.5 text-amber-500 font-black text-xs group-hover:underline">
                            <Star size={12} fill="currentColor"/> {avgRating} Global
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">Total: {compRevs.length} feedback-uri</div>
                        </button>
                      </td>

                      <td className="px-6 py-5">
                        <div className={`text-xs px-2.5 py-1.5 rounded-xl inline-flex items-center gap-1 border ${finance.color}`}>
                          <Clock size={12}/> {finance.text}
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => toggleCompanyStatus(company)}
                            className={`p-2 rounded-xl border transition shadow-xs flex items-center justify-center ${company.is_active === false ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'}`}
                            title={company.is_active === false ? "Activează Contul" : "Suspendă Contul Instant"}
                          >
                            {company.is_active === false ? <UserCheck size={14}/> : <UserMinus size={14}/>}
                          </button>

                          <button 
                            onClick={() => addExtensionTrial(company)}
                            className="p-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl hover:bg-blue-100 transition shadow-xs flex items-center justify-center"
                            title="Oferă +7 Zile de Trial Gratuit"
                          >
                            <CalendarPlus size={14}/>
                          </button>

                          <button 
                            onClick={() => setPaymentCompany(company)}
                            className="p-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl hover:bg-amber-100 transition shadow-xs flex items-center justify-center"
                            title="Înregistrează Plată Manuală (Prelungire 30 zile)"
                          >
                            <Wallet size={14}/>
                          </button>
                        </div>
                      </td>

                      <td className="px-6 py-5 text-center">
                        <button onClick={() => setSelectedCompanyForDetails(company)} className="p-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-950 hover:text-white transition">
                          <FileText size={14}/>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: DETALII LOCAȚII */}
        {activeTab === 'locations' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 text-slate-400 text-[10px] uppercase font-black tracking-widest"><th className="px-6 py-4">Denumire Locație</th><th className="px-6 py-4">Compania Mamă</th><th className="px-6 py-4">ID Unic</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allLocations.filter(l => !selectedCompanyId || l.company_id === selectedCompanyId).map((loc) => (
                  <tr key={loc.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="px-6 py-5 font-bold text-slate-900 text-sm flex items-center gap-2"><MapPin size={14} className="text-indigo-500"/> {loc.name || 'Nespecificat'}</td>
                    <td className="px-6 py-5 text-xs text-slate-600 font-bold">🏢 {companiesData.find(c => c.id === loc.company_id)?.name || 'Extern'}</td>
                    <td className="px-6 py-5 text-xs font-mono text-slate-400">{loc.id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 3: RECENZII */}
        {activeTab === 'reviews' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 text-slate-400 text-[10px] uppercase font-black tracking-widest"><th className="px-6 py-4">Scor & Comentariu</th><th className="px-6 py-4">Companie</th><th className="px-6 py-4">Data înregistrării</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allReviews.filter(r => !selectedCompanyId || r.company_id === selectedCompanyId).map((rev) => {
                  const isCritical = rev.rating && rev.rating <= 2;
                  return (
                    <tr key={rev.id} className={`hover:bg-slate-50/40 transition-colors ${isCritical ? 'bg-red-50/40 font-semibold' : ''}`}>
                      <td className="px-6 py-5 max-w-md">
                        <div className="flex items-center gap-0.5 text-amber-500 mb-1">
                          {Array.from({ length: rev.rating || 5 }).map((_, i) => <Star key={i} size={11} fill="currentColor"/>)}
                          {isCritical && <span className="ml-2 bg-red-600 text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded tracking-wide flex items-center gap-0.5"><AlertCircle size={9}/> Recenzie Proastă</span>}
                        </div>
                        <p className="text-xs text-slate-700 italic">"{rev.comment || 'Fără text introdus.'}"</p>
                      </td>
                      <td className="px-6 py-5 text-xs font-bold text-slate-900">🏢 {companiesData.find(c => c.id === rev.company_id)?.name || 'Extern'}</td>
                      <td className="px-6 py-5 text-xs text-slate-400 font-mono">{rev.created_at ? new Date(rev.created_at).toLocaleDateString('ro-RO') : 'N/A'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* --- POP-UP MODAL 1: ÎNREGISTREAZĂ PLATĂ MANUAlĂ --- */}
      {paymentCompany && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-100">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Wallet className="text-amber-400" size={20}/>
                <div>
                  <h3 className="text-sm font-black">Înregistrare Plată Persoană Juridică</h3>
                  <p className="text-[11px] text-slate-400">IDNO: {paymentCompany.idno || 'Nespecificat'}</p>
                </div>
              </div>
              <button onClick={() => setPaymentCompany(null)} className="p-1.5 bg-slate-800 rounded-lg text-slate-300"><X size={14}/></button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600">
                Compania: <span className="font-bold text-slate-900">{paymentCompany.name}</span><br/>
                IBAN: <span className="font-mono font-bold text-indigo-600">{paymentCompany.iban || 'Fără cont salvat'}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Sumă Transfer (MDL)</label>
                  <input type="text" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold font-mono text-slate-900" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Număr Factură Fiscală</label>
                  <input type="text" placeholder="Ex: #102" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold font-mono text-slate-900" />
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
              <button onClick={() => setPaymentCompany(null)} className="px-3 py-2 text-xs font-bold text-slate-500">Anulează</button>
              <button onClick={handleRegisterPayment} className="px-4 py-2 bg-emerald-600 text-white text-xs font-black uppercase rounded-xl tracking-wider flex items-center gap-1">
                <CheckCircle2 size={13}/> Activează 30 Zile & Salvează Factura
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- POP-UP MODAL 2: DATE COMPANIE --- */}
      {selectedCompanyForDetails && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-100">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h3 className="text-base font-black">{selectedCompanyForDetails.name}</h3>
                <p className="text-[11px] text-slate-400 font-medium">Setări complete, IDNO și Istoric Încasări</p>
              </div>
              <button onClick={() => setSelectedCompanyForDetails(null)} className="p-1.5 bg-slate-800 rounded-lg text-slate-300"><X size={14}/></button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">IDNO / Cod Fiscal</p>
                  <p className="text-xs font-mono font-bold text-slate-900 mt-1">{selectedCompanyForDetails.idno || selectedCompanyForDetails.fiscal_code || 'Nespecificat'}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Administrator</p>
                  <p className="text-xs font-bold text-slate-900 mt-1">{selectedCompanyForDetails.administrator || selectedCompanyForDetails.owner_name || 'Nespecificat'}</p>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Adresă Juridică</p>
                <p className="text-xs font-semibold text-slate-800 mt-1">{selectedCompanyForDetails.legal_address || selectedCompanyForDetails.address || 'Nespecificat'}</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-2">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cont Bancar (IBAN)</p>
                  <p className="text-xs font-mono font-bold text-indigo-600 tracking-wide">{selectedCompanyForDetails.iban || 'Nespecificat'}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 border-t border-slate-200/60 pt-2">
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Bancă</p>
                    <p className="text-xs font-bold text-slate-800">{selectedCompanyForDetails.bank_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Telefon Contact</p>
                    <p className="text-xs font-bold text-slate-800">{selectedCompanyForDetails.phone || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1 mb-3"><Receipt size={14} className="text-slate-500" /> Istoric Plăți și Facturi Fiscale înregistrate</h4>
                
                <div className="space-y-2">
                  {paymentHistory.filter(p => p.company_id === selectedCompanyForDetails.id).length === 0 ? (
                    <p className="text-xs font-medium text-slate-400 italic bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">Nicio plată prin transfer înregistrată până acum pentru acest client juridic.</p>
                  ) : (
                    paymentHistory.filter(p => p.company_id === selectedCompanyForDetails.id).map((payment, idx) => (
                      <div key={idx} className="p-3 bg-emerald-50/40 border border-emerald-100 rounded-xl flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold text-slate-900 flex items-center gap-1"><Coins size={11} className="text-emerald-600"/> {payment.amount} MDL</p>
                          <p className="text-[10px] font-mono text-slate-400 mt-0.5">Factura: <span className="text-slate-700 font-bold">{payment.invoice_number}</span></p>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100/60 px-2 py-0.5 rounded-md">
                          {payment.paid_at ? new Date(payment.paid_at).toLocaleDateString('ro-RO') : 'N/A'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 text-right">
              <button onClick={() => setSelectedCompanyForDetails(null)} className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl">Închide Fereastra</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}