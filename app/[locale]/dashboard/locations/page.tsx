'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Trash2, Download, Star, AlertTriangle, Loader2,
  Building2, Image as ImageIcon, X, MapPin, Truck, Phone, Link2
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
  const router = useRouter();
  const locale = (params?.locale as string) || 'ro';

  const [locations, setLocations] = useState<any[]>([]);
  const [lastReviews, setLastReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [type, setType] = useState('Physical');
  const [logoUrl, setLogoUrl] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [googleReviewUrl, setGoogleReviewUrl] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState<{id: string, name: string} | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [isCreatingCompany, setIsCreatingCompany] = useState(false);

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
      setErrorMessage(`Nu s-au putut încărca locațiile: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [locale]);

  const getInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) { router.push(`/${locale}/login`); return; }
      const { data: company, error: compError } = await supabase
        .from('companies').select('id, logo_url').eq('owner_id', user.id).maybeSingle();
      if (compError) throw compError;
      if (company) {
        setCompanyId(company.id);
        if (company.logo_url) setLogoUrl(company.logo_url);
        await fetchData(company.id);
      } else {
        setCompanyId(null);
        setLoading(false);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Nu s-a putut încărca compania.");
      setLoading(false);
    }
  }, [fetchData, locale, router]);

  useEffect(() => { getInitialData(); }, [getInitialData]);

  const handleCreateCompanyInline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName.trim() || isCreatingCompany) return;
    setIsCreatingCompany(true); setErrorMessage(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sesiune expirată.");
      const { error } = await supabase.from('companies').insert([{ name: newCompanyName.trim(), owner_id: user.id }]).select().single();
      if (error) throw error;
      setNewCompanyName('');
      await getInitialData();
    } catch (err: any) {
      setErrorMessage("Eroare la crearea companiei: " + err.message);
    } finally { setIsCreatingCompany(false); }
  };

  const downloadQR = (id: string, name: string, locLogo: string) => {
    const qrCanvas = document.getElementById(`qr-${id}`) as HTMLCanvasElement;
    if (!qrCanvas) { alert("Eroare la generarea codului QR."); return; }
    const masterCanvas = document.createElement("canvas");
    const ctx = masterCanvas.getContext("2d");
    if (!ctx) return;
    masterCanvas.width = 1200; masterCanvas.height = 1800;
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, masterCanvas.width, masterCanvas.height);
    const logoImg = new Image();
    logoImg.crossOrigin = "anonymous";
    logoImg.src = locLogo || "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
    const buildCanvas = () => {
      try {
        if (locLogo && locLogo !== "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7") {
          ctx.drawImage(logoImg, (masterCanvas.width - 450) / 2, 80, 450, 450);
        }
        ctx.textAlign = "center"; ctx.fillStyle = "#1e293b"; ctx.font = "bold 70px sans-serif";
        ctx.fillText(name.toUpperCase(), masterCanvas.width / 2, 650);
        ctx.drawImage(qrCanvas, (masterCanvas.width - 750) / 2, 880, 750, 750);
        ctx.fillStyle = "#cbd5e1"; ctx.font = "bold 35px sans-serif";
        ctx.fillText("QRate.md", masterCanvas.width / 2, 1720);
        const link = document.createElement("a");
        link.href = masterCanvas.toDataURL("image/png", 1.0);
        link.download = `QR-${name.replace(/\s+/g, '-')}.png`;
        link.click();
      } catch {
        const link = document.createElement("a");
        link.href = qrCanvas.toDataURL("image/png");
        link.download = `QR-Simplu-${name.replace(/\s+/g, '-')}.png`;
        link.click();
      }
    };
    logoImg.onload = buildCanvas;
    logoImg.onerror = () => { logoImg.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"; buildCanvas(); };
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true); setErrorMessage(null);
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
    } finally { setUploading(false); }
  };

  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null); setSuccessMessage(null); setIsAdding(true);
    if (!newName.trim()) { setErrorMessage("Numele locației este obligatoriu."); setIsAdding(false); return; }
    if (!companyId) { setErrorMessage("Eroare: Nu s-a putut identifica compania."); setIsAdding(false); return; }
    const { error } = await supabase.from('locations').insert([{
      name: newName.trim(), address: newAddress.trim(), company_id: companyId,
      type, logo_url: logoUrl || null, welcome_message: welcomeMessage,
      google_review_url: googleReviewUrl.trim() || null,
    }]).select();
    if (!error) {
      setNewName(''); setNewAddress(''); setLogoUrl(''); setGoogleReviewUrl('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      setSuccessMessage(t('success_added'));
      setTimeout(() => setSuccessMessage(null), 4000);
      await fetchData(companyId);
    } else {
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

  const filteredReviews = selectedLocationId ? lastReviews.filter(r => r.location_id === selectedLocationId) : lastReviews;
  const selectedLocationObj = locations.find(l => l.id === selectedLocationId);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;

  if (!companyId) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] p-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-slate-100 text-center">
          <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-5 mx-auto"><Building2 size={28} /></div>
          <h2 className="text-2xl font-black uppercase text-slate-900 mb-2">{locale === 'ru' ? 'Настройте Компанию' : 'Configurează Compania'}</h2>
          <p className="text-slate-400 text-sm mb-6">{locale === 'ru' ? 'Укажите название компании.' : 'Introdu numele companiei tale.'}</p>
          {errorMessage && <div className="bg-rose-500 text-white px-4 py-2 rounded-xl text-sm font-bold mb-4">{errorMessage}</div>}
          <form onSubmit={handleCreateCompanyInline} className="space-y-3">
            <input type="text" required value={newCompanyName} onChange={e => setNewCompanyName(e.target.value)}
              placeholder="Ex: McDonald's Chișinău"
              className="w-full bg-slate-50 border-2 border-transparent focus:border-slate-900 rounded-2xl p-4 text-base font-bold outline-none text-center" />
            <button disabled={isCreatingCompany} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-wider hover:bg-blue-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
              {isCreatingCompany ? <Loader2 className="animate-spin" size={18} /> : (locale === 'ru' ? 'Сохранить' : 'Salvează și Continuă')}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 pb-32 md:pb-12">
      <div className="max-w-6xl mx-auto">

        {/* HEADER */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-2xl md:text-4xl font-black text-slate-900">{t('title')}</h1>
            <p className="text-slate-400 text-sm mt-0.5">{t('description')}</p>
          </div>
          <div className="flex flex-col gap-2 w-full sm:w-auto">
            {successMessage && <div className="bg-emerald-500 text-white px-4 py-2 rounded-2xl font-bold text-center text-sm">{successMessage}</div>}
            {errorMessage && <div className="bg-rose-500 text-white px-4 py-2 rounded-2xl font-bold text-center text-sm">{errorMessage}</div>}
          </div>
        </div>

        {/* FORMULAR */}
        <form onSubmit={handleAddLocation} className="bg-white p-5 md:p-8 rounded-3xl shadow-lg border border-slate-100 mb-8">
          <h3 className="text-base md:text-xl font-black text-slate-900 mb-5">{t('form.title')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Coloana stanga */}
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">{t('form.name_label')}</label>
                <input type="text" placeholder={t('form.placeholder_name')} value={newName} onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-50 rounded-2xl py-3 px-4 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 border border-transparent text-sm" required />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">{t('form.type_label')}</label>
                <select value={type} onChange={(e) => setType(e.target.value)}
                  className="w-full bg-slate-50 rounded-2xl py-3 px-4 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 border border-transparent text-sm">
                  {/* ✅ Texte scurte pentru mobile */}
                  <option value="Physical">{locale === 'ru' ? 'Fizică' : 'Fizică'}</option>
                  <option value="Delivery">{locale === 'ru' ? 'Livrare' : 'Livrare'}</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">{t('form.address_label')}</label>
                <input type="text" placeholder={t('form.placeholder_address')} value={newAddress} onChange={(e) => setNewAddress(e.target.value)}
                  className="w-full bg-slate-50 rounded-2xl py-3 px-4 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 border border-transparent text-sm" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Link2 size={10} className="text-blue-500" /> Google Reviews
                </label>
                <input type="url" placeholder="https://g.page/r/..." value={googleReviewUrl} onChange={(e) => setGoogleReviewUrl(e.target.value)}
                  className="w-full bg-slate-50 rounded-2xl py-3 px-4 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 border border-transparent text-sm" />
              </div>
            </div>
            {/* Coloana dreapta */}
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">{t('form.logo_label')}</label>
                <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-dashed border-slate-200">
                  <div className="w-12 h-12 rounded-xl bg-white overflow-hidden flex items-center justify-center border shadow-sm shrink-0">
                    {logoUrl ? <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" /> : <ImageIcon className="text-slate-300" size={18} />}
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-slate-800 disabled:opacity-50 transition-colors flex-1" disabled={uploading}>
                    {uploading ? "Se încarcă..." : t('form.upload_logo')}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">{t('form.welcome_label')}</label>
                <textarea placeholder={t('form.welcome_placeholder')} value={welcomeMessage} onChange={(e) => setWelcomeMessage(e.target.value)}
                  className="w-full bg-slate-50 rounded-2xl p-3 font-bold text-slate-800 outline-none resize-none focus:ring-2 focus:ring-blue-500 border border-transparent text-sm" rows={3} />
              </div>
            </div>
          </div>
          <button type="submit" disabled={isAdding || !newName.trim() || !companyId}
            className="mt-5 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-black py-3.5 rounded-2xl uppercase tracking-wider text-sm shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2">
            {isAdding ? <><Loader2 size={16} className="animate-spin" /> Se adaugă...</> : t('form.submit_btn')}
          </button>
        </form>

        {/* GRID LOCAȚII */}
        {locations.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400 font-bold mb-8">
            {locale === 'ru' ? "Нет добавленных локаций." : "Nu ai nicio locație. Folosește formularul de mai sus."}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {locations.map((loc) => {
              const locReviews = lastReviews.filter(r => r.location_id === loc.id);
              const isSelected = selectedLocationId === loc.id;
              const qrUrl = typeof window !== 'undefined' ? `${window.location.origin}/${locale}/rate/${companyId}?location=${loc.id}` : '';
              
              // ✅ Badge tip scurt pentru mobile
              const typeLabel = loc.type === 'Delivery'
                ? (locale === 'ru' ? 'Livrare' : 'Livrare')
                : (locale === 'ru' ? 'Fizică' : 'Fizică');

              return (
                <div key={loc.id} onClick={() => setSelectedLocationId(isSelected ? null : loc.id)}
                  className={`bg-white rounded-3xl shadow-sm border-2 transition-all cursor-pointer flex flex-col overflow-hidden ${isSelected ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-100 hover:border-blue-200'}`}>
                  
                  {/* ✅ Header card compact */}
                  <div className="flex items-center justify-between px-4 pt-4 pb-2 gap-2">
                    {/* Tip locație — text scurt */}
                    <div className="flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-xl shrink-0">
                      {loc.type === 'Delivery'
                        ? <Truck size={11} className="text-blue-500 shrink-0" />
                        : <MapPin size={11} className="text-emerald-500 shrink-0" />}
                      <span className="text-[10px] font-black text-slate-600 uppercase">{typeLabel}</span>
                    </div>

                    {/* Badges dreapta */}
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {loc.google_review_url && (
                        <div className="flex items-center gap-0.5 bg-blue-50 text-blue-600 px-2 py-1 rounded-lg">
                          <svg viewBox="0 0 24 24" className="w-3 h-3 shrink-0">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                          </svg>
                          <span className="text-[9px] font-black uppercase">G</span>
                        </div>
                      )}
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-xl text-[9px] font-black ${locReviews.length > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                        <Star size={9} fill="currentColor" />
                        <span>{locReviews.length > 0 ? t('card.status_active') : t('card.status_new')}</span>
                      </div>
                    </div>
                  </div>

                  {/* QR Code */}
                  <div className="hidden">{qrUrl && <QRCodeCanvas id={`qr-${loc.id}`} value={qrUrl} size={1024} level="H" />}</div>
                  <div className="flex items-center justify-center py-4 px-6">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-inner inline-block">
                      {qrUrl && <QRCodeCanvas value={qrUrl} size={120} level="H"
                        imageSettings={loc.logo_url ? { src: loc.logo_url, height: 30, width: 30, excavate: true } : undefined} />}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="text-center px-4 pb-4">
                    <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight truncate">{loc.name}</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{t('card.reviews_count', { count: locReviews.length })}</p>
                  </div>

                  {/* Butoane */}
                  <div className="px-4 pb-4 flex flex-col gap-2 mt-auto" onClick={(e) => e.stopPropagation()}>
                    <button type="button" onClick={() => downloadQR(loc.id, loc.name, loc.logo_url)}
                      className="w-full bg-slate-900 text-white py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors">
                      <Download size={15} /> {t('card.download_qr')}
                    </button>
                    <button type="button" onClick={() => setShowDeleteModal({id: loc.id, name: loc.name})}
                      className="text-slate-300 text-[10px] font-black uppercase hover:text-red-500 transition-colors py-1 text-center">
                      {t('card.delete_loc')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* RECENZII */}
        <div className="bg-white p-5 md:p-8 rounded-3xl shadow-lg border border-slate-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg md:text-2xl font-black text-slate-900">
                {selectedLocationId ? t('reviews_section.title_filtered', { name: selectedLocationObj?.name }) : (locale === 'ru' ? t('reviews_section.title_all') : "Toate recenziile")}
              </h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                {selectedLocationId ? "Filtru activ" : "Apasă pe o locație pentru a filtra"}
              </p>
            </div>
            {selectedLocationId && (
              <button onClick={() => setSelectedLocationId(null)} className="flex items-center gap-1.5 text-xs font-black uppercase bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-2 rounded-xl transition-colors shrink-0">
                <X size={12} /> Resetează
              </button>
            )}
          </div>
          {filteredReviews.length === 0 ? (
            <div className="text-center py-10 text-slate-400 font-bold bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-sm">
              {selectedLocationId ? t('reviews_section.empty') : "Nu există recenzii deocamdată."}
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {filteredReviews.map((review) => (
                <div key={review.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 hover:bg-slate-100/50 transition-colors">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => <Star key={i} size={12} fill={i < review.rating ? "currentColor" : "none"} className={i < review.rating ? "text-amber-500" : "text-slate-200"} />)}
                      </div>
                      <span className="text-[9px] bg-white text-slate-600 border px-2 py-0.5 rounded-lg font-black uppercase">
                        {review.locations?.name || "Locație"}
                      </span>
                      {review.redirected_to_google && (
                        <span className="text-[9px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-lg font-black">Google</span>
                      )}
                    </div>
                    <ClientFriendlyDate dateString={review.created_at} locale={locale} />
                  </div>
                  <p className="text-sm font-medium text-slate-700 italic leading-relaxed">
                    {review.comment ? `"${review.comment}"` : <span className="text-slate-300 not-italic text-xs">{t('reviews_section.no_comment')}</span>}
                  </p>
                  {review.phone && (
                    <a href={`tel:${review.phone}`} className="inline-flex items-center gap-1 mt-2 bg-blue-50 text-blue-600 px-2 py-0.5 rounded-lg font-bold text-[10px] hover:bg-blue-100 transition-colors">
                      <Phone size={9} /> {review.phone}
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MODAL ȘTERGERE */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-3xl shadow-2xl max-w-sm w-full border border-slate-100 text-center">
            <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle size={22} /></div>
            <h4 className="text-lg font-black text-slate-900 mb-2">{t('delete_modal.title', { name: showDeleteModal.name })}</h4>
            <p className="text-slate-500 text-xs font-medium mb-5">Această acțiune este ireversibilă.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(null)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black py-3 rounded-xl uppercase text-xs transition-colors">{t('delete_modal.cancel')}</button>
              <button onClick={() => deleteLocation(showDeleteModal.id)} className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-black py-3 rounded-xl uppercase text-xs transition-colors">{t('delete_modal.confirm')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}