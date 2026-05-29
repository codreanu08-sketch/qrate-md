import React from 'react';
import { RefreshCw, FileWarning, ShieldAlert, Scale, HelpCircle, Building2 } from 'lucide-react';

export function RefundRo() {
  return (
    <>
      <article className="mb-16 space-y-4">
        <div className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
          <RefreshCw size={14} className="text-blue-600" /> Politica de Rambursare — maib
        </div>
        <h1 className="text-5xl font-[900] tracking-tighter text-slate-950 uppercase leading-none">
          Politica de <br /><span className="text-blue-600 italic">Rambursare</span>
        </h1>
        <p className="text-slate-500 font-medium italic">
          Reguli privind renunțarea la servicii și condițiile de returnare a plăților prin maib.
        </p>
        <p className="text-xs text-slate-400">Ultima actualizare: Ianuarie 2026</p>
      </article>

      <div className="space-y-12 text-slate-600 leading-relaxed text-[15px]">

        <section className="space-y-4">
          <h2 className="flex items-center gap-3 text-xl font-black text-slate-950 uppercase tracking-tighter">
            <Building2 className="text-blue-600" size={20} /> Informații Merchant
          </h2>
          <div className="bg-slate-50 p-6 rounded-2xl space-y-2 text-sm">
            <p><strong>QR RATING S.R.L.</strong> · IDNO: 1026023041245</p>
            <p>mun. Orhei, str. Sălciilor 75, Republica Moldova</p>
            <p>Email: hello@qrate.md · Site: www.qrate.md</p>
            <p className="text-xs text-slate-400 pt-2 border-t border-slate-200 mt-3">Plățile sunt procesate prin <strong>maib</strong> (Moldova Agroindbank S.A.) — instituție financiară autorizată de Banca Națională a Moldovei</p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="flex items-center gap-3 text-xl font-black text-slate-950 uppercase tracking-tighter">
            <FileWarning className="text-blue-600" size={20} /> 1. Natura Produsului Digital
          </h2>
          <p>
            Serviciile <strong>QRate.md</strong> constituie produse software de tip SaaS (Software as a Service). Accesul la Dashboard și la sistemele de generare a codurilor QR se livrează instantaneu după confirmarea plății. În conformitate cu <strong>Legea nr. 105/2003 privind protecția consumatorilor</strong> din Republica Moldova, dreptul de retragere în termen de 14 zile <strong>nu se aplică</strong> contractelor de furnizare de conținut digital neprezentat pe un suport material, dacă executarea a început cu acordul prealabil expres al consumatorului.
          </p>
        </section>

        <section className="space-y-4 border-l-4 border-blue-600 pl-6 py-2">
          <h2 className="text-xl font-black text-slate-950 uppercase tracking-tighter">2. Condiții pentru Abonamente Recurente</h2>
          <div className="bg-slate-50 p-6 rounded-2xl space-y-3 font-medium text-sm text-slate-800">
            <p>• <strong>Plăți recurente prin maib:</strong> La activarea unui plan plătit, Utilizatorul autorizează în mod expres debitarea automată lunară prin gateway-ul maib. Sumele deja procesate pentru perioada de facturare curentă sunt nerambursabile.</p>
            <p>• <strong>Anularea reînnoirii:</strong> Utilizatorul poate sista prelungirea automată din Dashboard (Secțiunea Abonament) cu cel puțin 24 de ore înainte de data scadentă. Contul rămâne activ până la expirarea perioadei achitate.</p>
            <p>• <strong>Downgrade de plan:</strong> Schimbarea la un plan inferior se aplică de la următoarea perioadă de facturare.</p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="flex items-center gap-3 text-xl font-black text-slate-950 uppercase tracking-tighter">
            <ShieldAlert className="text-blue-600" size={20} /> 3. Cazuri de Rambursare Exceptională
          </h2>
          <p>Rambursarea se poate efectua <strong>exclusiv</strong> în următoarele situații:</p>
          <ul className="list-disc pl-5 space-y-2 text-sm">
            <li><strong>Defecțiuni tehnice majore:</strong> Platforma QRate.md a fost complet nefuncțională din vina exclusivă a Prestatorului pentru o perioadă mai mare de <strong>72 de ore consecutive</strong>, confirmat prin loguri tehnice.</li>
            <li><strong>Dublă debitare (Double Charge):</strong> O tranzacție a fost procesată de două ori din eroare tehnică a gateway-ului maib.</li>
            <li><strong>Debitare după anulare confirmată:</strong> O sumă a fost debitată după ce Utilizatorul a anulat abonamentul în mod corect.</li>
          </ul>
        </section>

        <section className="bg-slate-950 text-white p-8 rounded-[2.5rem] space-y-6">
          <h2 className="flex items-center gap-3 text-xl font-black uppercase tracking-tighter">
            <Scale className="text-blue-400" size={24} /> 4. Procedura de Rambursare (Standard maib)
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Toate operațiunile de refund sunt coordonate în strânsă colaborare cu banca acceptatoare <strong>maib</strong>. Conform regulilor sistemelor internaționale de plată (Visa / Mastercard), <strong>nicio sumă nu poate fi restituită în numerar</strong> — returnarea se efectuează exclusiv pe cardul bancar original al plătitorului.
          </p>
          <div className="grid md:grid-cols-2 gap-6 text-xs leading-relaxed opacity-90">
            <div className="space-y-2 border-l border-white/10 pl-4">
              <h3 className="font-black uppercase text-blue-400 tracking-widest text-[9px]">Cum soliciți rambursarea:</h3>
              <p>Trimite un email la <strong>hello@qrate.md</strong> cu subiectul „Cerere Rambursare" menționând:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Denumirea companiei și IDNO</li>
                <li>Data exactă a tranzacției</li>
                <li>ID-ul tranzacției (din extrasul bancar sau email-ul de confirmare)</li>
                <li>Motivul detaliat al cererii</li>
              </ul>
            </div>
            <div className="space-y-2 border-l border-white/10 pl-4">
              <h3 className="font-black uppercase text-blue-400 tracking-widest text-[9px]">Termene de procesare:</h3>
              <p>• Confirmare cerere: <strong>2 zile lucrătoare</strong></p>
              <p>• Analiză și aprobare: <strong>5 zile lucrătoare</strong></p>
              <p>• Creditare pe card (după aprobare): <strong>5-10 zile lucrătoare</strong> — în funcție de procedurile băncii emitente</p>
              <p className="mt-2 text-slate-500">Termenul total maxim: <strong>15 zile lucrătoare</strong> de la data solicitării</p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="flex items-center gap-3 text-xl font-black text-slate-950 uppercase tracking-tighter">
            <HelpCircle className="text-blue-600" size={20} /> 5. Soluționarea Litigiilor și Chargeback
          </h2>
          <p className="text-sm">
            Înainte de a iniția o procedură de <strong>Chargeback</strong> la bancă, vă recomandăm să contactați echipa QRate la <strong>hello@qrate.md</strong> pentru remedierea amiabilă a situației. Termenul legal de analiză a sesizărilor este de maxim <strong>14 zile lucrătoare</strong>.
          </p>
          <p className="text-sm">
            Litigiile nesoluționate amiabil vor fi judecate de instanțele competente din Republica Moldova, conform legislației în vigoare.
          </p>
        </section>

      </div>
    </>
  );
}