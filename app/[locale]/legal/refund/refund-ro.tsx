import React from 'react';
import { RefreshCw, FileWarning, ShieldAlert, Scale, HelpCircle } from 'lucide-react';

export function RefundRo() {
  return (
    <>
      {/* Titlu H1 Unic per pagină */}
      <article className="mb-16 space-y-4">
        <div className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
          <RefreshCw size={14} className="text-blue-600" /> Politica de Rambursare și Retur
        </div>
        <h1 className="text-5xl font-[900] tracking-tighter text-slate-950 uppercase leading-none">
          Politica de <br /><span className="text-blue-600 italic">Rambursare</span>
        </h1>
        <p className="text-slate-500 font-medium italic">
          Reguli privind renunțarea la servicii și condițiile de returnare a plăților maib.
        </p>
      </article>

      {/* Structură ierarhică H2 */}
      <div className="space-y-12 text-slate-600 leading-relaxed text-[15px]">
        
        {/* Secțiunea 1: Natura Produsului Digital */}
        <section className="space-y-4">
          <h2 className="flex items-center gap-3 text-xl font-black text-slate-950 uppercase tracking-tighter">
            <FileWarning className="text-blue-600" size={20} /> 1. Natura Produsului Digital
          </h2>
          <p>
            Serviciile <strong>QRate.md</strong> constituie produse software de tip SaaS (Software as a Service). Accesul la Dashboard și la sistemele de generare a codurilor QR se livrează instantaneu după confirmarea plății de către bancă. În conformitate cu <strong>Legea nr. 105/2003 privind protecția consumatorilor</strong> din Republica Moldova, dreptul de retragere în termen de 14 zile <strong>nu se aplică</strong> contractelor de furnizare de conținut digital neprezentat pe un suport material, dacă executarea a început cu acordul prealabil expres al consumatorului.
          </p>
        </section>

        {/* Secțiunea 2: Abonamente Lunare și Anuale */}
        <section className="space-y-4 border-l-4 border-blue-600 pl-6 py-2">
          <h2 className="text-xl font-black text-slate-950 uppercase tracking-tighter">
            2. Condiții pentru Abonamente
          </h2>
          <div className="bg-slate-50 p-6 rounded-2xl space-y-3 font-medium text-sm text-slate-800">
            <p>• <strong>Plăți recurente:</strong> Sumele deja procesate pentru perioada de facturare în curs (lunară sau anuală) sunt nerambursabile, serviciul fiind considerat prestat din momentul alocării resurselor în cloud.</p>
            <p>• <strong>Anularea reînnoirii:</strong> Utilizatorul poate sista prelungirea automată a abonamentului oricând direct din Dashboard (secțiunea Setări Cont / Abonament) cu cel puțin 24 de ore înainte de data scadentă. Contul va rămâne pe planul premium până la expirarea zilelor deja achitate.</p>
          </div>
        </section>

        {/* Secțiunea 3: Excepții și Cazuri de Rambursare */}
        <section className="space-y-4">
          <h2 className="flex items-center gap-3 text-xl font-black text-slate-950 uppercase tracking-tighter">
            <ShieldAlert className="text-blue-600" size={20} /> 3. Excepții și Dreptul de Rambursare Tehnică
          </h2>
          <p>
            Rambursarea sumelor achitate înapoi pe cardul bancar al Utilizatorului se poate efectua în mod excepțional doar în următoarele cazuri:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-sm italic">
            <li><strong>Defecțiuni tehnice majore:</strong> Platforma QRate.md a fost complet nefuncțională din vina exclusivă a Prestatorului pentru o perioadă mai mare de 72 de ore consecutive, fapt confirmat de logurile tehnice.</li>
            <li><strong>Erori de procesare (Double Charge):</strong> În cazul în care din erori tehnice de comunicare cu gateway-ul băncii, o tranzacție a fost debitată de două ori pentru același serviciu.</li>
          </ul>
        </section>

        {/* Secțiunea 4: Procedura de Retur (Standard solicitat de Maib) */}
        <section className="bg-slate-950 text-white p-8 rounded-[2.5rem] space-y-6">
          <h2 className="flex items-center gap-3 text-xl font-black uppercase tracking-tighter">
            <Scale className="text-blue-400" size={24} /> 4. Procedura de Remitere a Banilor (maib)
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Toate operațiunile de refund sunt coordonate în strânsă legătură cu banca acceptatoare <strong>maib</strong>. Din motive de securitate și antifraudă impuse de sistemele internaționale (Visa / Mastercard), nicio sumă nu se poate restitui în numerar.
          </p>
          <div className="grid md:grid-cols-2 gap-6 text-xs leading-relaxed opacity-90">
            <div className="space-y-2 border-l border-white/10 pl-4">
              <h3 className="font-black uppercase text-blue-400 tracking-widest text-[9px]">Cum soliciți:</h3>
              <p>Trimite o cerere pe adresa hello@qrate.md menționând IDNO-ul companiei contractante, data tranzacției și ID-ul de plată extras din extrasul bancar.</p>
            </div>
            <div className="space-y-2 border-l border-white/10 pl-4">
              <h3 className="font-black uppercase text-blue-400 tracking-widest text-[9px]">Termen de procesare:</h3>
              <p>După aprobare, banii vor apărea în contul Merchant-ului / atașat cardului inițial în termen de 5-10 Zile Lucrătoare, în funcție de procedurile băncii emitente.</p>
            </div>
          </div>
        </section>

        {/* Secțiunea 5: Suport și Soluționare Conflicte */}
        <section className="space-y-4">
          <h2 className="flex items-center gap-3 text-xl font-black text-slate-950 uppercase tracking-tighter">
            <HelpCircle className="text-blue-600" size={20} /> 5. Soluționarea Litigiilor
          </h2>
          <p className="text-sm">
            Înainte de a iniția o procedură de Chargeback la bancă, vă recomandăm să contactați echipa QRate pentru remedierea amiabilă a situației. Termenul legal stabilit de analiză a sesizărilor este de maxim 14 zile.
          </p>
        </section>
      </div>
    </>
  );
}