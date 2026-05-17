'use client';

import React, { useState, ChangeEvent } from 'react';
import { useTranslations } from 'next-intl';
import { 
  Check, Users, Zap, ShieldCheck, QrCode, Truck, 
  Plus, Trash2, ChevronRight, LayoutDashboard, 
  Database, Smartphone, ShoppingCart, Loader2, Upload, FileText, Image as ImageIcon
} from 'lucide-react';

export default function QRateCompletePricing() {
  const t = useTranslations('Subscription');

  // --- STATE-URI CONFIGURATOR ---
  const [isSubscriptionActive, setIsSubscriptionActive] = useState(true);
  const [locs, setLocs] = useState(1);
  const [extraEmps, setExtraEmps] = useState(0); 
  const [stickerCount, setStickerCount] = useState(500);
  const [isStickersAdded, setIsStickersAdded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // --- STATE-URI PENTRU QR LIVRĂRI ȘI TEXT ---
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  const [orderNotes, setOrderNotes] = useState('');

  // --- LOGICA DE BUSINESS (START vs PRO) ---
  const handleLocChange = (val: number) => {
    setLocs(val);
  };

  const validateStickers = () => {
    if (stickerCount < 500) setStickerCount(500);
  };

  const isStartPlan = locs === 1;
  const isProPlan = locs > 1;

  const startBaseCost = 650;
  const proBaseCostPerLocation = 600;
  const extraEmpCostRate = 50;

  const currentSoftwareTotal = isSubscriptionActive
    ? (isStartPlan 
        ? startBaseCost 
        : (locs * proBaseCostPerLocation) + (extraEmps * extraEmpCostRate))
    : 0;

  const stickerTotal = isStickersAdded ? parseFloat((stickerCount * 0.33).toFixed(2)) : 0;
  const grandTotal = currentSoftwareTotal + stickerTotal;

  // --- MANAGEMENT INCARCARE FIȘIER ---
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setQrFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setQrPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveFile = () => {
    const fileInput = document.getElementById('qr-file-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
    setQrFile(null);
    setQrPreview(null);
  };

  // --- HANDLER TRANSMITERE MULTIPART ---
  const handleConfirmOrder = async () => {
    if (grandTotal === 0 || isLoading) return;

    setIsLoading(true);

    const formData = new FormData();
    formData.append('plan', isProPlan ? 'PRO' : 'START');
    formData.append('locations', locs.toString());
    formData.append('extraEmployees', extraEmps.toString());
    formData.append('stickersOrdered', isStickersAdded.toString());
    formData.append('stickersCount', isStickersAdded ? stickerCount.toString() : '0');
    formData.append('totalAmount', grandTotal.toFixed(0));
    formData.append('notes', orderNotes);
    
    if (qrFile) {
      formData.append('qrCodeImage', qrFile);
    }

    try {
      const response = await fetch('/api/orders/confirm', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        alert('Comanda a fost trimisă cu succes împreună cu detaliile de livrare!');
        setOrderNotes('');
        handleRemoveFile();
      } else {
        alert('A apărut o problemă la procesarea comenzii. Încearcă din nou.');
      }
    } catch (error) {
      console.error('Eroare la trimiterea hercomenzii:', error);
      alert('Eroare de rețea. Verifică conexiunea la internet.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#F8FAFC] py-16 px-4 min-h-screen font-sans text-slate-900">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-black mb-4 tracking-tighter uppercase italic">
            {t('title')} <span className="text-blue-600">QRate</span>
          </h1>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.4em]">{t('subtitle')}</p>
        </div>

        {/* SECTION 1: CONFIGURATOR DYNAMIC LICENȚĂ */}
        <div className={`transition-all duration-500 ${!isSubscriptionActive ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
          <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 flex flex-col sm:flex-row items-center justify-around gap-8 mb-12 max-w-2xl mx-auto">
            
            {/* Control Locații */}
            <div className="flex flex-col items-center">
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-3">{t('configurator.locations_label')}</span>
              <div className="flex items-center gap-4">
                <button type="button" onClick={() => handleLocChange(Math.max(1, locs - 1))} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center font-black border border-slate-200 hover:bg-blue-600 hover:text-white transition-all">-</button>
                <span className="text-4xl font-black w-12 text-center">{locs}</span>
                <button type="button" onClick={() => handleLocChange(locs + 1)} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center font-black border border-slate-200 hover:bg-blue-600 hover:text-white transition-all">+</button>
              </div>
            </div>

            {/* Badge Status Plan Pro */}
            <div className={`flex flex-col items-center transition-all duration-300 ${isProPlan ? 'opacity-100 scale-110 text-blue-600' : 'opacity-20 grayscale'}`}>
               <ShieldCheck size={40} />
               <span className="text-[9px] font-black uppercase mt-2 tracking-tighter">{t('configurator.enterprise_mode')}</span>
            </div>
          </div>
        </div>

        {/* SECTION 2: PACHETE SIMETRICE ABONAMENTE */}
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 transition-all ${!isSubscriptionActive ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
          
          {/* Card 1: Planul Start */}
          <div className={`p-10 rounded-[3.5rem] border-4 transition-all relative flex flex-col justify-between ${isStartPlan ? 'bg-white border-blue-600 shadow-2xl scale-105 z-10 opacity-100' : 'bg-slate-50 border-transparent opacity-50'}`}>
            <div>
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-blue-50 rounded-xl text-blue-600"><Zap size={32} /></div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('plans.standard.price_label')}</p>
                  <p className="text-3xl font-black text-slate-900">650 MDL</p>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">
                    {/* REZOLVARE ERROARE 1: I-am dat un count explicit de 1 pentru a opri eroarea de pluralizare */}
                    {t('plans.standard.desc', { count: 1 })}
                  </span>
                </div>
              </div>
              <h3 className="text-3xl font-black mb-1 italic text-blue-600">{t('plans.standard.name')}</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8">Pachet de bază start</p>
              
              <ul className="space-y-4 mb-10">
                <li className="flex items-center gap-3 text-sm font-bold text-slate-800 bg-blue-50/50 p-2.5 rounded-xl">
                  <Users size={18} className="text-blue-600" /> {t('plans.standard.features.employees')}
                </li>
                <li className="flex items-center gap-3 text-sm font-bold text-slate-600"><Check size={18} className="text-blue-500" strokeWidth={2} /> {t('plans.standard.features.notifications')}</li>
                <li className="flex items-center gap-3 text-sm font-bold text-slate-600"><Smartphone size={18} className="text-indigo-500" /> {t('plans.standard.features.qr_profile')}</li>
                <li className="flex items-center gap-3 text-sm font-bold text-slate-600"><LayoutDashboard size={18} className="text-orange-500" /> {t('plans.standard.features.dashboard')}</li>
                <li className="flex items-center gap-3 text-sm font-bold text-slate-600"><Database size={18} className="text-slate-400" /> {t('plans.standard.features.reports')}</li>
              </ul>
            </div>
          </div>

          {/* Card 2: Planul Pro */}
          <div className={`p-10 rounded-[3.5rem] border-4 transition-all relative flex flex-col justify-between ${isProPlan ? 'bg-slate-950 text-white border-blue-500 shadow-2xl scale-105 z-10 opacity-100' : 'bg-slate-50 border-transparent opacity-50'}`}>
            <div>
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-blue-600/20 rounded-xl text-blue-400"><ShieldCheck size={32} /></div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{t('plans.enterprise.price_label')}</p>
                  <p className="text-3xl font-black text-blue-400">
                    {isProPlan ? `${locs * proBaseCostPerLocation} MDL` : `600 MDL`}
                  </p>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">
                    {/* Schimbat într-o cheie care are garantat pluralizarea în ru.json */}
                    {t('summary.locations_active', { count: locs })}
                  </span>
                </div>
              </div>
              <h3 className="text-3xl font-black mb-1 italic text-blue-400">{t('plans.enterprise.name')}</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-8">Management Multi-Locație &amp; Scalare</p>
              
              <ul className="space-y-4 mb-10">
                <li className="flex items-center gap-3 text-sm font-bold text-emerald-400 bg-white/5 p-2.5 rounded-xl">
                  <Users size={18} className="text-emerald-400" /> {t('plans.enterprise.features.centralization')}
                </li>
                <li className="flex items-center gap-3 text-sm font-bold text-blue-400 italic">
                  {/* REZOLVARE ERROARE 2: Schimbat din plans.enterprise.desc (care lipsea în RU) în configurator.enterprise_mode */}
                  <Check size={18} className="text-blue-400" strokeWidth={3} /> {t('configurator.enterprise_mode')}
                </li>
                <li className="flex items-center gap-3 text-sm font-bold text-slate-300"><Check size={18} className="text-blue-400" /> {t('plans.enterprise.features.notifications')}</li>
                <li className="flex items-center gap-3 text-sm font-bold text-slate-300"><ShieldCheck size={18} className="text-blue-400" /> {t('plans.enterprise.features.management')}</li>
                <li className="flex items-center gap-3 text-sm font-bold text-slate-300"><Check size={18} className="text-blue-400" /> {t('plans.enterprise.features.support')}</li>
              </ul>
            </div>
          </div>
        </div>

        {/* SECTION 3: CONFIGURATOR UNIFICAT MATERIALE FIZICE */}
        <div className="bg-white border border-slate-200 p-8 rounded-[3rem] shadow-xl mb-12 max-w-4xl mx-auto">
          <div className={`transition-all duration-500 p-6 rounded-3xl flex flex-col sm:flex-row items-center gap-6 mb-8 border-b-4 ${
            isStickersAdded ? 'bg-blue-600 text-white border-blue-800' : 'bg-slate-900 text-white border-slate-700'
          }`}>
            <div className={`p-4 rounded-2xl ${isStickersAdded ? 'bg-white text-blue-600' : 'bg-blue-600'}`}>
              <QrCode size={26} />
            </div>
            <div className="text-left flex-1">
              <h4 className="text-lg font-black uppercase italic tracking-tight flex items-center gap-2">
                <Truck size={20} /> {t('stickers.title')}
              </h4>
              <p className="text-[10px] font-bold opacity-70 italic uppercase tracking-wider text-blue-100">{t('stickers.subtitle')}</p>
            </div>
            
            <div className="flex items-center gap-4 bg-black/20 p-2 rounded-xl border border-white/5">
              <div className="flex flex-col items-center px-2">
                <span className="text-[8px] uppercase opacity-50 font-bold mb-1">{t('stickers.quantity')}</span>
                <input 
                  type="number" value={stickerCount}
                  onChange={(e) => setStickerCount(parseInt(e.target.value) || 0)}
                  onBlur={validateStickers}
                  className="bg-transparent text-xl font-black w-20 text-center focus:outline-none border-b-2 border-white/20 text-white"
                />
              </div>
              <div className="text-right pr-4 border-l border-white/10 pl-4">
                <div className="text-md font-black">{(stickerCount * 0.33).toFixed(2)} MDL</div>
                <div className="text-[8px] uppercase opacity-50">{t('stickers.total_pay')}</div>
              </div>
              <button 
                type="button"
                onClick={() => setIsStickersAdded(!isStickersAdded)}
                className={`p-3 rounded-lg transition-all ${isStickersAdded ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-400'}`}
              >
                {isStickersAdded ? <Trash2 size={18} /> : <Plus size={18} />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-slate-100 pt-6">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2 flex items-center gap-1">
                <ImageIcon size={12} /> Încarcă QR Cod Livrări (Imagine)
              </span>
              
              <div className="border-2 border-dashed border-slate-200 hover:border-blue-500 rounded-2xl p-6 transition-all flex flex-col items-center justify-center text-center bg-slate-50 min-h-[160px] relative overflow-hidden group">
                {qrPreview ? (
                  <div className="absolute inset-0 bg-white flex flex-col items-center justify-center p-2 z-10">
                    <img src={qrPreview} alt="QR Preview" className="h-24 w-24 object-contain mb-2 rounded-lg" />
                    <p className="text-[10px] text-slate-500 truncate max-w-[200px] font-medium">{qrFile?.name}</p>
                    <button 
                      type="button" 
                      onClick={handleRemoveFile}
                      className="mt-1 text-[10px] text-red-500 font-bold uppercase tracking-tight hover:underline"
                    >
                      Șterge imaginea
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center">
                    <Upload size={28} className="text-slate-400 mb-2 group-hover:text-blue-600 transition-colors" />
                    <span className="text-xs font-bold text-slate-600 group-hover:text-blue-600 transition-colors">Alege fișierul imagine</span>
                    <span className="text-[9px] text-slate-400 mt-1">PNG, JPG sau JPEG</span>
                    <input 
                      id="qr-file-upload"
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileChange} 
                      className="hidden" 
                    />
                  </label>
                )}
              </div>
            </div>

            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2 flex items-center gap-1">
                <FileText size={12} /> Specificații sau Text adițional suporturi
              </span>
              <textarea
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="Ex: Te rugăm să adaugi textul 'Livrează rapid prin scanare' sub codul QR sau specificații pentru adresa de livrare a suporturilor fizice..."
                rows={6}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors resize-none"
              />
            </div>
          </div>
        </div>

        {/* SECTION 4: REZUMAT DETALIAT COMPLET */}
        <div className="max-w-4xl mx-auto bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl border-b-[12px] border-blue-600 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] -mr-32 -mt-32"></div>
          
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10">
            <div className="flex-1 w-full">
              <div className="flex items-center gap-2 mb-6 relative z-10">
                <ShoppingCart className="text-blue-400" size={20} />
                <h4 className="text-xs font-black uppercase tracking-[0.4em] text-blue-400">{t('summary.title')}</h4>
              </div>
              
              <div className="space-y-4 relative z-10">
                <div className={`flex justify-between items-center border-b border-white/5 pb-4 transition-all ${isSubscriptionActive ? 'opacity-100' : 'opacity-40'}`}>
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox" checked={isSubscriptionActive} 
                      onChange={() => setIsSubscriptionActive(!isSubscriptionActive)}
                      className="w-5 h-5 accent-blue-600 cursor-pointer"
                    />
                    <div>
                      <p className="text-sm font-black uppercase tracking-tight italic">
                        {t('summary.subscription_item', { plan: isProPlan ? t('plans.enterprise.name') : t('plans.standard.name') })}
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold">{t('summary.locations_active', { count: locs })}</p>
                    </div>
                  </div>
                  <p className="text-xl font-black tracking-tight">
                    {isSubscriptionActive 
                      ? (isStartPlan ? startBaseCost : (locs * proBaseCostPerLocation)) 
                      : 0} MDL
                  </p>
                </div>

                {isStickersAdded && (
                  <div className="flex justify-between items-center border-b border-white/5 pb-4 text-blue-400 animate-in slide-in-from-left-4">
                    <div className="pl-8">
                      <p className="text-sm font-black italic uppercase tracking-tight">{t('summary.stickers_item')}</p>
                      <p className="text-[10px] text-slate-500 font-bold">{t('summary.stickers_desc', { count: stickerCount })}</p>
                    </div>
                    <p className="text-xl font-black">+{stickerTotal} MDL</p>
                  </div>
                )}

                {(qrFile || orderNotes.trim().length > 0) && (
                  <div className="text-[10px] font-bold text-slate-400 flex flex-wrap gap-x-4 gap-y-1 bg-white/5 p-3 rounded-xl border border-white/5 mt-2">
                    {qrFile && <span className="text-emerald-400 flex items-center gap-1">✓ QR Cod atașat ({qrFile.name.substring(0, 15)}...)</span>}
                    {orderNotes.trim().length > 0 && <span className="text-blue-400 flex items-center gap-1">✓ Note adăugate ({orderNotes.length} caractere)</span>}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white/5 p-8 rounded-[2.5rem] w-full lg:w-auto text-center lg:text-left border border-white/5 relative z-10">
              <p className="text-[9px] font-black uppercase text-slate-500 tracking-[0.2em] mb-2">{t('summary.total_today')}</p>
              <div className="flex items-baseline justify-center lg:justify-start gap-2 mb-8">
                <span className="text-6xl font-black tracking-tighter italic">{grandTotal.toFixed(0)}</span>
                <span className="text-sm font-bold text-blue-400 uppercase">MDL</span>
              </div>
              <button 
                type="button"
                disabled={grandTotal === 0 || isLoading}
                onClick={handleConfirmOrder}
                className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white px-12 py-6 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] transition-all flex items-center justify-center gap-3 shadow-2xl active:scale-95 group min-w-[240px]"
              >
                {isLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    {t('summary.confirm_btn')} <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <p className="text-center mt-12 text-[9px] font-black text-slate-400 uppercase tracking-[0.5em]">
          {t('summary.footer_brand')}
        </p>
      </div>
    </div>
  );
}