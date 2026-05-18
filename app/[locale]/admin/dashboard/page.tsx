'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/supabase';
import { 
  Building2, 
  MapPin, 
  Star, 
  Receipt, 
  Check, 
  X, 
  AlertTriangle,
  Play,
  Square,
  PlusCircle,
  Eye,
  Trash2,
  DollarSign
} from 'lucide-react';

export default function SuperAdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'companies' | 'locations' | 'reviews' | 'payments'>('companies');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  // State-uri pentru date
  const [companiesData, setCompaniesData] = useState<any[]>([]);
  const [allLocations, setAllLocations] = useState<any[]>([]);
  const [allReviews, setAllReviews] = useState<any[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);

  // State-uri Modale
  const [selectedCompany, setSelectedCompany] = useState<any | null>(null);
  const [paymentModalCompany, setPaymentModalCompany] = useState<any | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>('500');
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Încărcare și sincronizare date
  async function loadDashboardData() {
    try {
      const resCompanies = await supabase.from('companies').select('*').order('name', { ascending: true });
      const resLocations = await supabase.from('locations').select('*');
      const resReviews = await supabase.from('reviews').select('*').order('created_at', { ascending: false });
      const resPayments = await supabase.from('payments').select('*').order('paid_at', { ascending: false });

      if (resCompanies.data) setCompaniesData(resCompanies.data);
      if (resLocations.data) setAllLocations(resLocations.data);
      if (resReviews.data) setAllReviews(resReviews.data);
      if (resPayments.data) setPaymentHistory(resPayments.data);
    } catch (error) {
      console.error("Eroare la încărcarea datelor:", error);
    }
  }

  useEffect(() => {
    loadDashboardData().finally(() => setLoading(false));
  }, []);

  // Funcție stabilă pentru calcularea stării abonamentului
  const getSubscriptionDetails = (company: any) => {
    const now = new Date();

    if (company.is_active === false) {
      return { label: 'Dezactivat / Suspendat', color: 'bg-red-100 text-red-800' };
    }

    if (company.is_subscribed && company.subscription_expires_at) {
      const expiry = new Date(company.subscription_expires_at);
      if (expiry > now) {
        const days = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return { label: `Abonament Activ (${days} zile)`, color: 'bg-green-100 text-green-800' };
      }
      return { label: 'Abonament Expirat', color: 'bg-red-100 text-red-800' };
    }

    if (company.trial_started_at) {
      const trialStart = new Date(company.trial_started_at);
      const trialExpiry = new Date(trialStart.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      if (trialExpiry > now) {
        const days = Math.ceil((trialExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return { label: `Trial Activ (${days} zile)`, color: 'bg-blue-100 text-blue-800' };
      }
      return { label: 'Trial Expirat', color: 'bg-amber-100 text-amber-800' };
    }

    return { label: 'Fără Status', color: 'bg-gray-100 text-gray-800' };
  };

  // 1. FUNCȚIONAL: Activează Compania Complet
  const handleActivateCompany = async (companyId: string) => {
    const { error } = await supabase
      .from('companies')
      .update({ is_active: true } as any)
      .eq('id', companyId);

    if (error) {
      alert("Eroare la activare: " + error.message);
    } else {
      await loadDashboardData();
    }
  };

  // Suspendă Compania Complet
  const handleSuspendCompany = async (companyId: string) => {
    const { error } = await supabase
      .from('companies')
      .update({ is_active: false } as any)
      .eq('id', companyId);

    if (error) {
      alert("Eroare la suspendare: " + error.message);
    } else {
      await loadDashboardData();
    }
  };

  // 2. FUNCȚIONAL: Prelungește Trial (+7 zile din momentul curent)
  const handleExtendTrial = async (companyId: string) => {
    const { error } = await supabase
      .from('companies')
      .update({
        trial_started_at: new Date().toISOString(),
        is_subscribed: false,
        subscription_expires_at: null,
        is_active: true
      } as any)
      .eq('id', companyId);

    if (error) {
      alert("Eroare la prelungirea trialului: " + error.message);
    } else {
      await loadDashboardData();
    }
  };

  // 3. FUNCȚIONAL: Dezactivează Trial Instant (Forțează expirarea în trecut)
  const handleTerminateTrial = async (companyId: string) => {
    const pastDate = new Date(0).toISOString(); // Setează data la 1970 pentru a expira instant
    const { error } = await supabase
      .from('companies')
      .update({
        trial_started_at: pastDate,
        is_subscribed: false,
        subscription_expires_at: null
      } as any)
      .eq('id', companyId);

    if (error) {
      alert("Eroare la dezactivarea trialului: " + error.message);
    } else {
      await loadDashboardData();
    }
  };

  // 4. FUNCȚIONAL: Înregistrare plată manuală (+30 zile abonament)
  const handleSavePayment = async () => {
    if (!paymentModalCompany) return;

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const { error: companyError } = await supabase
      .from('companies')
      .update({
        is_subscribed: true,
        subscription_expires_at: expiresAt,
        is_active: true
      } as any)
      .eq('id', paymentModalCompany.id);

    if (!companyError) {
      await supabase.from('payments').insert({
        company_id: paymentModalCompany.id,
        amount: parseFloat(paymentAmount),
        invoice_number: invoiceNumber || `FACT-${Date.now().toString().slice(-4)}`,
        paid_at: now.toISOString()
      } as any);

      setPaymentModalCompany(null);
      setInvoiceNumber('');
      await loadDashboardData();
    } else {
      alert("Eroare la procesarea plății: " + companyError.message);
    }
  };

  // 5. Ștergere companie
  const handleDeleteCompany = async (id: string, name: string) => {
    if (confirm(`Ești sigur că vrei să ștergi definitiv compania "${name}"?`)) {
      const { error } = await supabase.from('companies').delete().eq('id', id);
      if (!error) {
        await loadDashboardData();
      } else {
        alert("Eroare la ștergere: " + error.message);
      }
    }
  };

  const filteredCompanies = companiesData.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || c.idno?.includes(searchTerm)
  );

  if (loading) {
    return <div className="p-8 text-center text-gray-600 font-medium">Se încarcă datele panoului de control...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto font-sans text-gray-900 bg-gray-50 min-h-screen">
      
      {/* HEADER CLASIC */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-200 pb-5 mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">QRate.MD — Panou SuperAdmin</h1>
          <p className="text-sm text-gray-500 mt-1">Managementul tehnic al firmelor, punctelor de lucru și abonamentelor.</p>
        </div>
        
        {/* FILTRU CĂUTARE */}
        <div className="w-full md:w-80">
          <input 
            type="text"
            placeholder="Caută după nume firmă sau IDNO..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm shadow-sm focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* BLOCURI DE METRICI SIMPLE */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <button onClick={() => { setActiveTab('companies'); setSelectedCompanyId(null); }} className={`p-4 rounded-md border text-left transition ${activeTab === 'companies' ? 'bg-white border-blue-500 ring-1 ring-blue-500' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
          <div className="text-xs font-semibold text-gray-500 uppercase">Companii</div>
          <div className="text-xl font-bold text-gray-900 mt-1">{companiesData.length}</div>
        </button>
        <button onClick={() => { setActiveTab('locations'); setSelectedCompanyId(null); }} className={`p-4 rounded-md border text-left transition ${activeTab === 'locations' ? 'bg-white border-blue-500 ring-1 ring-blue-500' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
          <div className="text-xs font-semibold text-gray-500 uppercase">Puncte de Lucru</div>
          <div className="text-xl font-bold text-gray-900 mt-1">{allLocations.length}</div>
        </button>
        <button onClick={() => { setActiveTab('reviews'); setSelectedCompanyId(null); }} className={`p-4 rounded-md border text-left transition ${activeTab === 'reviews' ? 'bg-white border-blue-500 ring-1 ring-blue-500' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
          <div className="text-xs font-semibold text-gray-500 uppercase">Recenzii Colectate</div>
          <div className="text-xl font-bold text-gray-900 mt-1">{allReviews.length}</div>
        </button>
        <button onClick={() => { setActiveTab('payments'); setSelectedCompanyId(null); }} className={`p-4 rounded-md border text-left transition ${activeTab === 'payments' ? 'bg-white border-blue-500 ring-1 ring-blue-500' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
          <div className="text-xs font-semibold text-gray-500 uppercase">Istoric Încasări</div>
          <div className="text-xl font-bold text-gray-900 mt-1">{paymentHistory.length}</div>
        </button>
      </div>

      {/* NOTIFICARE FILTRU ACTIV */}
      {selectedCompanyId && (
        <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs rounded-md flex justify-between items-center">
          <span>Se afișează exclusiv datele filtrate pentru ID-ul de companie selectat.</span>
          <button onClick={() => setSelectedCompanyId(null)} className="font-bold underline uppercase text-[10px]">Resetează filtrul</button>
        </div>
      )}

      {/* STRUCTURĂ CLASICĂ DE TABEL */}
      <div className="bg-white border border-gray-200 rounded-md shadow-sm overflow-hidden">
        
        {/* TAB 1: TABEL COMPANII */}
        {activeTab === 'companies' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-100 text-gray-600 font-semibold border-b border-gray-200 uppercase tracking-wider text-[10px]">
                  <th className="p-3">Nume Companie / IDNO</th>
                  <th className="p-3">Status Cont</th>
                  <th className="p-3">Relații</th>
                  <th className="p-3">Link QR</th>
                  <th className="p-3 text-right">Acțiuni Manageriale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCompanies.map((company) => {
                  const status = getSubscriptionDetails(company);
                  const countLocs = allLocations.filter(l => l.company_id === company.id).length;
                  const countRevs = allReviews.filter(r => r.company_id === company.id).length;

                  return (
                    <tr key={company.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-3">
                        <div className="font-bold text-gray-900">{company.name}</div>
                        <div className="text-gray-500 font-mono text-[11px] mt-0.5">IDNO: {company.idno || 'Nespecificat'}</div>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full font-medium text-[11px] ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="p-3 space-x-2">
                        <button onClick={() => { setSelectedCompanyId(company.id); setActiveTab('locations'); }} className="text-blue-600 hover:underline font-medium">📍 {countLocs} Locații</button>
                        <span className="text-gray-300">|</span>
                        <button onClick={() => { setSelectedCompanyId(company.id); setActiveTab('reviews'); }} className="text-blue-600 hover:underline font-medium">⭐ {countRevs} Recenzii</button>
                      </td>
                      <td className="p-3">
                        {company.qr_image_url ? (
                          <a href={company.qr_image_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Vezi cod QR</a>
                        ) : (
                          <span className="text-gray-400 italic">Fără cod</span>
                        )}
                      </td>
                      <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                        {/* Butoane Activare / Suspendare */}
                        {company.is_active === false ? (
                          <button onClick={() => handleActivateCompany(company.id)} className="px-2 py-1 bg-green-600 text-white font-semibold rounded-sm hover:bg-green-700" title="Activează Cont">Activează</button>
                        ) : (
                          <button onClick={() => handleSuspendCompany(company.id)} className="px-2 py-1 bg-yellow-600 text-white font-semibold rounded-sm hover:bg-yellow-700" title="Suspendă Cont">Suspendă</button>
                        )}

                        {/* Butoane Trial */}
                        <button onClick={() => handleExtendTrial(company.id)} className="px-2 py-1 bg-blue-500 text-white font-semibold rounded-sm hover:bg-blue-600" title="Prelungește Trial cu 7 Zile de azi">Prelungește Trial</button>
                        <button onClick={() => handleTerminateTrial(company.id)} className="px-2 py-1 bg-amber-500 text-white font-semibold rounded-sm hover:bg-amber-600" title="Expiră Trialul Instant">Oprește Trial</button>
                        
                        {/* Facturare & Detalii */}
                        <button onClick={() => setPaymentModalCompany(company)} className="px-2 py-1 bg-emerald-600 text-white font-semibold rounded-sm hover:bg-emerald-700" title="Înregistrează plată lunară (+30 zile)">Încasează</button>
                        <button onClick={() => setSelectedCompany(company)} className="px-2 py-1 bg-gray-200 text-gray-700 font-semibold rounded-sm hover:bg-gray-300">Fișă</button>
                        <button onClick={() => handleDeleteCompany(company.id, company.name)} className="px-2 py-1 bg-red-100 text-red-700 font-semibold rounded-sm hover:bg-red-200"><Trash2 size={13} className="inline"/></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: TABEL LOCAȚII */}
        {activeTab === 'locations' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-100 text-gray-600 font-semibold border-b border-gray-200 uppercase tracking-wider text-[10px]">
                  <th className="p-3">Denumire Punct de Lucru</th>
                  <th className="p-3">Compania Atribuită</th>
                  <th className="p-3">ID Unic în Sistem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {allLocations.filter(l => !selectedCompanyId || l.company_id === selectedCompanyId).map((loc) => (
                  <tr key={loc.id} className="hover:bg-gray-50">
                    <td className="p-3 font-bold text-gray-900">📍 {loc.name || 'Nespecificat'}</td>
                    <td className="p-3 text-gray-600">🏢 {companiesData.find(c => c.id === loc.company_id)?.name || 'Nespecificată'}</td>
                    <td className="p-3 font-mono text-gray-400">{loc.id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 3: TABEL RECENZII */}
        {activeTab === 'reviews' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-100 text-gray-600 font-semibold border-b border-gray-200 uppercase tracking-wider text-[10px]">
                  <th className="p-3">Rating & Comentariu Text</th>
                  <th className="p-3">Companie</th>
                  <th className="p-3">Dată înregistrare</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {allReviews.filter(r => !selectedCompanyId || r.company_id === selectedCompanyId).map((rev) => (
                  <tr key={rev.id} className={`hover:bg-gray-50 ${rev.rating && rev.rating <= 2 ? 'bg-red-50/50' : ''}`}>
                    <td className="p-3 max-w-lg">
                      <div className="flex text-amber-500 mb-1">
                        {Array.from({ length: rev.rating || 5 }).map((_, i) => <Star key={i} size={12} fill="currentColor"/>)}
                      </div>
                      <p className="text-gray-700 italic">"{rev.comment || 'Fără comentariu text.'}"</p>
                    </td>
                    <td className="p-3 font-medium text-gray-600">🏢 {companiesData.find(c => c.id === rev.company_id)?.name || 'Nespecificată'}</td>
                    <td className="p-3 text-gray-400 font-mono">{rev.created_at ? new Date(rev.created_at).toLocaleDateString('ro-RO') : 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 4: TABEL ISTORIC PLĂȚI */}
        {activeTab === 'payments' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-100 text-gray-600 font-semibold border-b border-gray-200 uppercase tracking-wider text-[10px]">
                  <th className="p-3">Număr Factură / Serie</th>
                  <th className="p-3">Companie Plătitoare</th>
                  <th className="p-3">Sumă Achitată</th>
                  <th className="p-3">Dată Încasare</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paymentHistory.map((p, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="p-3 font-mono font-bold text-blue-600">{p.invoice_number}</td>
                    <td className="p-3 text-gray-700">🏢 {companiesData.find(c => c.id === p.company_id)?.name || 'Client Șters'}</td>
                    <td className="p-3 font-bold text-green-700">{p.amount} MDL</td>
                    <td className="p-3 text-gray-400 font-mono">{p.paid_at ? new Date(p.paid_at).toLocaleString('ro-RO') : 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* MODAL CLASIC 1: INREGISTRARE PLATA (INCASEAZA) */}
      {paymentModalCompany && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-md max-w-md w-full shadow-lg border border-gray-300 overflow-hidden">
            <div className="bg-gray-100 px-4 py-3 border-b border-gray-200 font-bold text-sm text-gray-800 flex justify-between items-center">
              <span>Înregistrare Factură Manuală & Activare 30 Zile</span>
              <button onClick={() => setPaymentModalCompany(null)} className="text-gray-500 hover:text-gray-800"><X size={16}/></button>
            </div>
            <div className="p-4 space-y-3 text-xs">
              <p className="text-gray-600">Se vor adăuga direct <strong>30 de zile</strong> de abonament activ pentru firma: <strong className="text-gray-900">{paymentModalCompany.name}</strong></p>
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Sumă Încasată (MDL)</label>
                <input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} className="w-full p-2 border border-gray-300 rounded-sm font-mono font-bold" />
              </div>
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Număr Document / Factură</label>
                <input type="text" placeholder="Ex: FACT-8902" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} className="w-full p-2 border border-gray-300 rounded-sm" />
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex justify-end gap-2 text-xs font-bold">
              <button onClick={() => setPaymentModalCompany(null)} className="px-3 py-1.5 text-gray-500 hover:underline">Anulează</button>
              <button onClick={handleSavePayment} className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-sm">Confirmă Încasarea & Activează</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CLASIC 2: FIȘĂ DATE COMPANIE */}
      {selectedCompany && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-md max-w-md w-full shadow-lg border border-gray-300 overflow-hidden">
            <div className="bg-gray-100 px-4 py-3 border-b border-gray-200 font-bold text-sm text-gray-800 flex justify-between items-center">
              <span>Date de Identificare Legală</span>
              <button onClick={() => setSelectedCompany(null)} className="text-gray-500 hover:text-gray-800"><X size={16}/></button>
            </div>
            <div className="p-4 space-y-3 text-xs">
              <div>
                <span className="text-gray-400 block uppercase font-semibold text-[10px]">Denumire Oficială:</span>
                <span className="font-bold text-gray-900 text-sm">{selectedCompany.name}</span>
              </div>
              <div>
                <span className="text-gray-400 block uppercase font-semibold text-[10px]">IDNO (Cod Fiscal):</span>
                <span className="font-mono text-gray-950 font-semibold">{selectedCompany.idno || 'Nespecificat'}</span>
              </div>
              <div>
                <span className="text-gray-400 block uppercase font-semibold text-[10px]">Cont de Decontare (IBAN):</span>
                <span className="font-mono text-gray-950 font-semibold">{selectedCompany.iban || 'Nespecificat'}</span>
              </div>
              <div>
                <span className="text-gray-400 block uppercase font-semibold text-[10px]">Administrator Executiv:</span>
                <span className="text-gray-950 font-semibold">{selectedCompany.administrator || 'Nespecificat'}</span>
              </div>
              <div>
                <span className="text-gray-400 block uppercase font-semibold text-[10px]">Adresă Sediu Social:</span>
                <span className="text-gray-700">{selectedCompany.legal_address || 'Nespecificată'}</span>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 text-right">
              <button onClick={() => setSelectedCompany(null)} className="px-4 py-1.5 bg-gray-800 hover:bg-gray-900 text-white font-bold text-xs rounded-sm">Închide Fișa</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}