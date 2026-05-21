'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Plus, Trash2, Download, 
  Star, AlertTriangle, Loader2,
  Building2, Image as ImageIcon, MessageSquare, Upload, CheckCircle2,
  Filter, X, MapPin, Truck, Phone
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';

function ClientFriendlyDate({ dateString, locale }: { dateString: string; locale: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return <span className="text-[10px] text-slate-300">...</span>;
  
  try {
    const formatted = new Date(dateString).toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'ro-RO');
    return <span className="text-[10px] font-black text-slate-300 italic whitespace-nowrap">{formatted}</span>;
  } catch (e) {
    return <span className="text-[10px] font-black text-slate-300 italic whitespace-nowrap">{dateString.split('T')[0]}</span>;
  }
}

export default function LocationsPage() {
  const t = useTranslations('Locations');
  const params = useParams();
  const locale = (params?.locale as string) || 'ro';

  const [locations, setLocations] = useState<any[]>([]);
  const [lastReviews, setLastReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const [newCompanyName, setNewCompanyName] = useState('');
  const [creatingCompany, setCreatingCompany] = useState(false);

  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [type, setType] = useState('Physical');
  const [logoUrl, setLogoUrl] = useState(''); 
  const [welcomeMessage, setWelcomeMessage] = useState('Ajută-ne să fim mai buni!'); 
  const [showDeleteModal, setShowDeleteModal] = useState<{id: string, name: string} | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAdding, setIsAdding] = useState(false);

  const fetchData = useCallback(async (cId: string) => {
    try {
      const [locsRes, revsRes] = await Promise.all([
        supabase.from('locations').select('*').eq('company_id', cId).order('created_at', { ascending: false }),
        supabase.from('reviews').select('*, locations(name)').eq('company_id', cId).order('created_at', { ascending: false })
      ]);
      
      if (locsRes.error) throw locsRes.error;
      if (revsRes.error) throw revsRes.error;

      setLocations(locsRes.data || []);
      setLastReviews(revsRes.data || []);
    } catch (err: any) {
      console.error("Eroare fetch date:", err);
      setErrorMessage(`Nu s-au putut încărca locațiile: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    async function getInitialData() {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          setLoading(false);
          return;
        }
        
        const { data: company, error: compError } = await supabase
          .from('companies')
          .select('id, logo_url')
          .eq('owner_id', user.id)
          .maybeSingle();
          
        if (compError) throw compError;

        if (company) {
          setCompanyId(company.id);
          if (company.logo_url) setLogoUrl(company.logo_url);
          await fetchData(company.id);
        } else {
          setLoading(false);
        }
      } catch (err: any) {
        console.error("Eroare inițializare pagină:", err);
        setErrorMessage(err.message || "Nu s-a putut încărca compania.");
        setLoading(false);
      }
    }
    getInitialData();
  }, [fetchData]);

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName.trim()) return;

    try {
      setCreatingCompany(true);
      setErrorMessage(null);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) throw new Error("Utilizator neautentificat.");

      const generatedSlug = newCompanyName
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") 
        .replace(/[^a-z0-9\s-]/g, "")    
        .replace(/\s+/g, "-")            
        .replace(/-+/g, "-");            

      const finalSlug = `${generatedSlug}-${Math.random().toString(36).substring(2, 6)}`;

      const { data, error } = await supabase
        .from('companies')
        .insert([{ 
          owner_id: user.id, 
          name: newCompanyName.trim(),
          slug: finalSlug
        }])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setCompanyId(data.id);
        setSuccessMessage("Compania a fost înregistrată cu succes!");
        setTimeout(() => setSuccessMessage(null), 4000);
        await fetchData(data.id);
      }
    } catch (err: any) {
      console.error("Eroare la crearea companiei:", err);
      setErrorMessage(err.message || "Nu s-a putut crea compania.");
    } finally {
      setCreatingCompany(false);
    }
  };

  const downloadQR = (id: string, name: string, locLogo: string) => {
    const qrCanvas = document.getElementById(`qr-${id}`) as HTMLCanvasElement;
    if (!qrCanvas) {
      alert("Eroare la generarea codului QR.");
      return;
    }

    const masterCanvas = document.createElement("canvas");
    const ctx = masterCanvas.getContext("2d");
    if (!ctx) return;

    masterCanvas.width = 1200;
    masterCanvas.height = 1800;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, masterCanvas.width, masterCanvas.height);

    const logoImg = new Image();
    logoImg.crossOrigin = "anonymous";
    logoImg.src = locLogo || "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"; 

    const buildCanvas = () => {
      try {
        if (locLogo && locLogo !== "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7") {
          const logoSize = 450; 
          ctx.drawImage(logoImg, (masterCanvas.width - logoSize) / 2, 80, logoSize, logoSize);
        }
        
        ctx.textAlign = "center";
        ctx.fillStyle = "#1e293b"; 
        ctx.font = "bold 70px sans-serif";
        ctx.fillText(name.toUpperCase(), masterCanvas.width / 2, 650);
        
        ctx.fillStyle = "#64748b";
        ctx.font = "italic 40px sans-serif";
        const shortMsg = welcomeMessage.length > 60 ? welcomeMessage.substring(0, 60) + "..." : welcomeMessage;
        ctx.fillText(shortMsg, masterCanvas.width / 2, 730);
        
        ctx.strokeStyle = "#f1f5f9";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(250, 800); ctx.lineTo(950, 800); ctx.stroke();
        
        const qrSize = 750;
        ctx.drawImage(qrCanvas, (masterCanvas.width - qrSize) / 2, 880, qrSize, qrSize);
        
        ctx.fillStyle = "#cbd5e1";
        ctx.font = "bold 35px sans-serif";
        ctx.fillText("QRate.md", masterCanvas.width / 2, 1720);

        const finalImage = masterCanvas.toDataURL("image/png", 1.0);
        const link = document.createElement("a");
        link.href = finalImage;
        link.download = `QR-${name.replace(/\s+/g, '-')}.png`;
        link.click();
      } catch (canvasErr) {
        console.error("Eroare generare canvas:", canvasErr);
        const link = document.createElement("a");
        link.href = qrCanvas.toDataURL("image/png");
        link.download = `QR-Simplu-${name.replace(/\s+/g, '-')}.png`;
        link.click();
      }
    };

    logoImg.onload = buildCanvas;
    logoImg.onerror = () => {
      logoImg.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
      buildCanvas();
    };
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      setErrorMessage(null);
      const file = event.target.files?.[0];
      if (!file || !companyId) return;
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${companyId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage.from('logos').upload(fileName, file);
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(fileName);
      setLogoUrl(publicUrl);
      
      await supabase.from('companies').update({ logo_url: publicUrl }).eq('id', companyId);
    } catch (error: any) { 
      setErrorMessage("Eroare la upload logo: " + error.message); 
    } finally { 
      setUploading(false); 
    }
  };

  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsAdding(true);

    if (!newName.trim()) {
      setErrorMessage("Numele locației este obligatoriu.");
      setIsAdding(false);
      return;
    }

    if (!companyId) {
      setErrorMessage("Eroare: Nu s-a putut identifica compania. Reîmprospătează pagina.");
      setIsAdding(false);
      return;
    }
    
    const { data, error } = await supabase
      .from('locations')
      .insert([{ 
        name: newName.trim(), 
        address: newAddress.trim(), 
        company_id: companyId,
        type: type, 
        logo_url: logoUrl || null, 
        welcome_message: welcomeMessage
      }])
      .select();

    if (!error) {
      setNewName(''); 
      setNewAddress('');
      setSuccessMessage("Locația a fost adăugată cu succes!");
      setTimeout(() => setSuccessMessage(null), 4000);
      await fetchData(companyId);
    } else {
      console.error("Supabase Insert Error:", error);
      setErrorMessage(`Eroare la salvare: ${error.message}`);
    }
    setIsAdding(false);
  };

  const deleteLocation = async (id: string) => {
    if (!companyId) return;
    const { error } = await supabase.from('locations').delete().eq('id', id);
    if (!error) {
      setShowDeleteModal(null);
      if (selectedLocationId === id) setSelectedLocationId(null);
      await fetchData(companyId);
    } else {
      setErrorMessage("Nu s-a putut șterge locația: " + error.message);
    }
  };

  // Filtrarea recenziilor în funcție de locația selectată
  const filteredReviews = selectedLocationId 
    ? lastReviews.filter(r => r.location_id === selectedLocationId)
    : lastReviews;

  const selectedLocationObj = locations.find(l => l.id === selectedLocationId);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
      <Loader2 className="animate-spin text-blue-600" size={40} />
    </div>
  );

  if (!companyId) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
        <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-xl max-w-md w-full text-center border border-slate-100">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 border border-blue-100">
            <Building2 size={30} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Configurează Compania</h2>
          <p className="text-slate-500 mb-6 text-sm leading-relaxed">
            Pentru a accesa panoul de administrare, introdu numele companiei tale.
          </p>

          {errorMessage && (
            <div className="bg-rose-50 text-rose-600 px-4 py-2.5 rounded-xl text-xs font-bold mb-4 border border-rose-100 text-left">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleCreateCompany} className="space-y-4">
            <input 
              type="text"
              placeholder="Ex: Restaurantul Meu SRL"
              value={newCompanyName}
              onChange={(e) => setNewCompanyName(e.target.value)}
              className="w-full bg-slate-50 rounded-2xl py-4 px-6 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 border border-transparent"
              required
              disabled={creatingCompany}
            />
            <button 
              type="submit"
              disabled={creatingCompany || !newCompanyName.trim()}
              className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl uppercase tracking-wider hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {creatingCompany ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Se salvează...
                </>
              ) : (
                "Creează Companie"
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        
        <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-black text-slate-900">{t('title')}</h1>
            <p className="text-slate-500">{t('description')}</p>
          </div>
          
          <div className="flex flex-col gap-2 w-full md:w-auto">
            {successMessage && (
              <div className="bg-emerald-500 text-white px-6 py-2.5 rounded-2xl font-bold shadow-md shadow-emerald-100 text-center text-sm">
                {successMessage}
              </div>
            )}
            {errorMessage && (
              <div className="bg-rose-500 text-white px-6 py-2.5 rounded-2xl font-bold shadow-md shadow-rose-100 text-center text-sm">
                {errorMessage}
              </div>
            )}
          </div>
        </div>

        {/* FORMULAR ADĂUGARE LOCAȚIE */}
        <form onSubmit={handleAddLocation} className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-xl border border-slate-100 mb-12">
          <h3 className="text-xl font-black text-slate-900 mb-6">Adaugă locație nouă</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-500 mb-1.5">NUMELE LOCAȚIEI *</label>
                <input 
                  placeholder="Ex: Filiala Centru" 
                  value={newName} 
                  onChange={(e) => setNewName(e.target.value)} 
                  className="w-full bg-slate-50 rounded-2xl py-3.5 px-5 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 border border-transparent" 
                  required 
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-500 mb-1.5">TIP LOCAȚIE</label>
                <select 
                  value={type} 
                  onChange={(e) => setType(e.target.value)} 
                  className="w-full bg-slate-50 rounded-2xl py-3.5 px-5 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 border border-transparent"
                >
                  <option value="Physical">Fizică (Restaurant, Magazin)</option>
                  <option value="Delivery">Livrare / Online</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-500 mb-1.5">ADRESĂ (opțional)</label>
                <input 
                  placeholder="Str. Ștefan cel Mare 45" 
                  value={newAddress} 
                  onChange={(e) => setNewAddress(e.target.value)} 
                  className="w-full bg-slate-50 rounded-2xl py-3.5 px-5 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 border border-transparent" 
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-500 mb-1.5">LOGO (opțional)</label>
                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-dashed border-slate-200">
                  <div className="w-14 h-14 rounded-xl bg-white overflow-hidden flex items-center justify-center border shadow-sm shrink-0">
                    {logoUrl ? <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" /> : <ImageIcon className="text-slate-300" size={22} />}
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
                  <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()} 
                    className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-800 disabled:opacity-50 transition-colors flex-1"
                    disabled={uploading}
                  >
                    {uploading ? "Se încarcă..." : "Încarcă logo"}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-500 mb-1.5">MESAJ DE BUN VENIT (opțional)</label>
                <textarea 
                  placeholder="Ajută-ne să fim mai buni!" 
                  value={welcomeMessage} 
                  onChange={(e) => setWelcomeMessage(e.target.value)} 
                  className="w-full bg-slate-50 rounded-2xl p-4 font-bold text-slate-800 outline-none resize-none focus:ring-2 focus:ring-blue-500 border border-transparent" 
                  rows={2} 
                />
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isAdding || !newName.trim() || !companyId}
            className="mt-6 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-black py-4 rounded-2xl uppercase tracking-[0.5px] text-sm shadow-lg shadow-blue-200 active:scale-[0.985] transition-all flex items-center justify-center gap-2"
          >
            {isAdding ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Se adaugă...
              </>
            ) : (
              "Adaugă locație"
            )}
          </button>
        </form>

        {/* Grid Locații */}
        {locations.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-[2.5rem] border border-dashed border-slate-200 text-slate-400 font-bold mb-12">
            Nu ai nicio locație adăugată pentru această companie. Folosește formularul de mai sus.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {locations.map((loc) => {
              const locReviews = lastReviews.filter(r => r.location_id === loc.id);
              const isSelected = selectedLocationId === loc.id;
              const qrUrl = typeof window !== 'undefined' ? `${window.location.origin}/${locale}/review/${loc.id}` : '';

              return (
                <div 
                  key={loc.id} 
                  onClick={() => setSelectedLocationId(isSelected ? null : loc.id)}
                  className={`bg-white p-6 rounded-[2.5rem] shadow-sm border-2 transition-all cursor-pointer relative flex flex-col ${isSelected ? 'border-blue-500 ring-4 ring-blue-50 bg-blue-50/10' : 'border-slate-100 hover:border-blue-200'}`}
                >
                  <div className="flex justify-between items-center mb-6">
                    {/* Afișare Categorie / Tip locație */}
                    <div className="flex items-center gap-1 bg-slate-100 text-slate-700 px-3 py-1 rounded-xl text-[11px] font-black uppercase tracking-wider">
                      {loc.type === 'Delivery' ? (
                        <>
                          <Truck size={12} className="text-blue-500" />
                          Livrare / Online
                        </>
                      ) : (
                        <>
                          <MapPin size={12} className="text-emerald-500" />
                          Fizică
                        </>
                      )}
                    </div>

                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-xs ${locReviews.length > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                      <Star size={12} fill="currentColor" /> {locReviews.length > 0 ? t('card.status_active') : t('card.status_new')}
                    </div>
                  </div>

                  <div className="hidden">
                    {qrUrl && (
                      <QRCodeCanvas 
                        id={`qr-${loc.id}`} 
                        value={qrUrl} 
                        size={1024} 
                        level="H" 
                      />
                    )}
                  </div>

                  <div className="bg-slate-50 p-6 rounded-[2.5rem] mb-6 self-center border border-transparent shadow-inner">
                    {qrUrl && (
                      <QRCodeCanvas 
                        value={qrUrl} 
                        size={140}
                        level="H"
                        imageSettings={loc.logo_url ? { src: loc.logo_url, height: 34, width: 34, excavate: true } : undefined}
                      />
                    )}
                  </div>

                  <div className="text-center mb-6">
                    <h3 className="font-black text-slate-800 text-xl uppercase truncate px-2">{loc.name}</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                      {t('card.reviews_count', { count: locReviews.length })}
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 mt-auto" onClick={(e) => e.stopPropagation()}>
                    <button 
                      type="button"
                      onClick={() => downloadQR(loc.id, loc.name, loc.logo_url)} 
                      className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors shadow-md"
                    >
                      <Download size={18} /> {t('card.download_qr')}
                    </button>
                    <button 
                      type="button"
                      onClick={() => setShowDeleteModal({id: loc.id, name: loc.name})} 
                      className="text-slate-300 text-[10px] font-black uppercase hover:text-red-500 transition-colors py-2"
                    >
                      {t('card.delete_loc')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* SECȚIUNE AFISARE RECENZII (Apare mereu jos) */}
        <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-2xl font-black text-slate-900">
                {selectedLocationId ? `Recenzii: ${selectedLocationObj?.name}` : "Toate recenziile companiei"}
              </h3>
              <p className="text-xs text-slate-400 font-bold uppercase mt-1">
                {selectedLocationId ? "Filtru activat pe această locație" : "Apasă pe o locație de mai sus pentru a filtra"}
              </p>
            </div>
            {selectedLocationId && (
              <button
                onClick={() => setSelectedLocationId(null)}
                className="flex items-center gap-1.5 text-xs font-black uppercase bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-xl transition-colors"
              >
                <X size={14} /> Resetează filtru
              </button>
            )}
          </div>

          {filteredReviews.length === 0 ? (
            <div className="text-center py-12 text-slate-400 font-bold bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              {selectedLocationId 
                ? "Această locație nu are încă nicio recenzie înregistrată." 
                : "Compania dumneavoastră nu a primit nicio recenzie deocamdată."}
            </div>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {filteredReviews.map((review) => (
                <div key={review.id} className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-slate-100/50 transition-colors">
                  <div className="space-y-1 w-full sm:w-auto">
                    
                    {/* AICI AM ADĂUGAT NUMELE ȘI TELEFONUL */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex gap-0.5 text-amber-500">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            size={14} 
                            fill={i < review.rating ? "currentColor" : "none"} 
                            className={i < review.rating ? "text-amber-500" : "text-slate-200"} 
                          />
                        ))}
                      </div>
                      <span className="text-xs bg-white text-slate-600 border px-2 py-0.5 rounded-md font-black uppercase text-[10px]">
                        {review.locations?.name || "Locație ștearsă"}
                      </span>

                      {/* Afișare Nume client (dacă este completat în DB) */}
                      {review.name && (
                        <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-bold text-[10px]">
                          {review.name}
                        </span>
                      )}

                      {/* Afișare Telefon client (buton apelabil) */}
                      {review.phone && (
                        <a 
                          href={`tel:${review.phone.replace(/\s+/g, '')}`} 
                          className="flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md font-bold text-[10px] hover:bg-blue-100 transition-colors"
                        >
                          <Phone size={10} /> {review.phone}
                        </a>
                      )}
                    </div>
                    
                    <p className="text-sm font-bold text-slate-700 italic">
                      {review.comment ? `"${review.comment}"` : <span className="text-slate-400 font-normal">Fără comentariu lăsat</span>}
                    </p>
                  </div>
                  
                  <div className="text-right shrink-0">
                    <ClientFriendlyDate dateString={review.created_at} locale={locale} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* MODAL DETALII ȘTERGERE (OBLIGATORIU) */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-2xl max-w-sm w-full border border-slate-100 text-center">
            <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-100">
              <AlertTriangle size={24} />
            </div>
            <h4 className="text-xl font-black text-slate-900 mb-2">Ștergi locația?</h4>
            <p className="text-slate-500 text-xs font-medium mb-6 leading-relaxed">
              Sigur vrei să ștergi <strong className="text-slate-800 font-bold">„{showDeleteModal.name}”</strong>? Toate codurile QR și datele asociate vor deveni inaccesibile.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowDeleteModal(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black py-3 rounded-xl uppercase text-xs tracking-wider transition-colors"
              >
                Anulează
              </button>
              <button 
                onClick={() => deleteLocation(showDeleteModal.id)}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-black py-3 rounded-xl uppercase text-xs tracking-wider transition-colors shadow-lg shadow-rose-100"
              >
                Șterge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}