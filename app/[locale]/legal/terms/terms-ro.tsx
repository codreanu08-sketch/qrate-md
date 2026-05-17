import React from 'react';
import { Zap, FileText, Gavel, ShieldCheck, Scale, AlertCircle, Database, RefreshCw } from 'lucide-react';

export function TermsRo() {
  return (
    <>
      {/* HEADERUL ARTICOLULUI */}
      <article className="mb-16 space-y-4">
        <div className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
          <Gavel size={14} /> Contract de Adeziune (Public)
        </div>
        <h1 className="text-5xl font-[900] tracking-tighter text-slate-950 uppercase leading-none">
          Termeni și <br /><span className="text-blue-600 italic">Condiții</span>
        </h1>
        <p className="text-slate-500 font-medium italic">
          Ultima actualizare: 12 Mai 2026
        </p>
      </article>

      {/* SECTIUNILE DE TEXT LEGAL */}
      <div className="space-y-12 text-slate-600 leading-relaxed text-[15px]">
        
        {/* Secțiunea 0 */}
        <section className="space-y-4">
          <h2 className="flex items-center gap-3 text-xl font-black text-slate-950 uppercase tracking-tighter">
            <FileText className="text-blue-600" size={20} /> 0. Definiții
          </h2>
          <div className="bg-slate-50 p-6 rounded-2xl text-[13px] grid md:grid-cols-2 gap-4 italic font-medium">
            <p><strong>Platforma:</strong> Software-ul QRate.md, dashboard-ul și infrastructura cloud.</p>
            <p><strong>Utilizator:</strong> Entitatea juridică (SRL/ÎI) care contractează serviciile.</p>
            <p><strong>Vizitator:</strong> Clientul final care scanează codul QR pentru feedback.</p>
            <p><strong>Zi Lucrătoare:</strong> Zilele de Luni până Vineri, excluzând sărbătorile legale în RM.</p>
          </div>
        </section>

        {/* Secțiunea 1 */}
        <section className="space-y-4 border-l-4 border-blue-600 pl-6 py-2">
          <h2 className="text-xl font-black text-slate-950 uppercase tracking-tighter">
            1. Datele Prestatorului
          </h2>
          <div className="bg-slate-50 p-6 rounded-2xl space-y-2 text-sm font-medium">
            <p><strong>Compania:</strong> S.R.L. "QR SOLUTIONS GROUP"</p>
            <p><strong>IDNO:</strong> 102XXXXXXXXXX</p>
            <p><strong>Adresă Juridică:</strong> mun. Chișinău, str. [Adresa ta], Republica Moldova</p>
            <p><strong>Contact Suport:</strong> hello@qrate.md</p>
          </div>
        </section>

        {/* Secțiunea 2 */}
        <section className="space-y-4">
          <h2 className="flex items-center gap-3 text-xl font-black text-slate-950 uppercase tracking-tighter">
            <Zap className="text-blue-600" size={20} /> 2. Livrarea Produsului Digital
          </h2>
          <p>
            Serviciile <strong>QRate.MD</strong> sunt exclusiv digitale. Accesul la Dashboard este activat automat și instantaneu după confirmarea plății prin sistemul <strong>maib</strong>. Utilizatorul va primi un email de confirmare cu detaliile de acces imediat după tranzacție.
          </p>
        </section>

        {/* Secțiunea 3 */}
        <section className="bg-slate-950 text-white p-8 rounded-[2.5rem] space-y-6">
          <h2 className="flex items-center gap-3 text-xl font-black uppercase tracking-tighter">
            <ShieldCheck className="text-blue-400" size={24} /> 3. Securitatea Tranzacțiilor
          </h2>
          <p className="text-slate-400 text-sm italic">
            Plățile sunt procesate securizat prin <strong>maib</strong>. QRate.md nu stochează datele cardului dumneavoastră.
          </p>
          <div className="grid md:grid-cols-2 gap-6 text-xs leading-relaxed opacity-90">
            <div className="space-y-2 border-l border-white/10 pl-4">
              <h3 className="font-black uppercase text-blue-400 tracking-widest text-[9px]">Protecție:</h3>
              <p>Tranzacțiile sunt securizate prin protocolul <strong>3D-Secure</strong>. Datele sunt transmise direct către serverele bancare criptate.</p>
            </div>
            <div className="space-y-2 border-l border-white/10 pl-4">
              <h3 className="font-black uppercase text-blue-400 tracking-widest text-[9px]">Abonamente:</h3>
              <p>Plățile recurente pot fi anulate oricând din Dashboard cu cel puțin 24h înainte de data scadentă.</p>
            </div>
          </div>
        </section>

        {/* Secțiunea 4 */}
        <section className="space-y-4">
          <h2 className="flex items-center gap-3 text-xl font-black text-slate-950 uppercase tracking-tighter">
            <Scale className="text-blue-600" size={20} /> 4. Limitarea Răspunderii
          </h2>
          <div className="text-sm space-y-3 italic">
            <p>QRate.md depune eforturi pentru o disponibilitate de 99.9%. Totuși, nu suntem responsabili pentru:</p>
            <ul className="list-disc pl-5 space-y-2 text-slate-500">
              <li>Deciziile comerciale luate de Utilizator bazate pe feedback-ul primit.</li>
              <li>Defecțiuni tehnice ale procesatorului de plăți (maib) sau ale furnizorilor de hosting.</li>
              <li>Utilizarea codurilor QR în moduri care încalcă legislația locală de către Utilizator.</li>
            </ul>
          </div>
        </section>

        {/* Secțiunea 5 */}
        <section className="space-y-4">
          <h2 className="flex items-center gap-3 text-xl font-black text-slate-950 uppercase tracking-tighter">
            <AlertCircle className="text-blue-600" size={20} /> 5. Protecția Consumatorului
          </h2>
          <p>Reclamațiile pot fi depuse la <strong>hello@qrate.md</strong>. Termenul de răspuns este de maxim 14 zile.</p>
          <div className="bg-red-50/50 border border-red-100 p-6 rounded-2xl text-[13px] italic">
            <p>În cazul nesoluționării amiabile, conform Legii 105/2003, vă puteți adresa <strong>Inspectoratului de Stat pentru Supravegherea Produselor Nealimentare și Protecția Consumatorilor</strong>:</p>
            <p className="mt-2 font-bold text-red-900">mun. Chișinău, str. Vasile Alecsandri, 78.</p>
          </div>
        </section>

        {/* Secțiunea 6 */}
        <section className="space-y-4">
          <h2 className="flex items-center gap-3 text-xl font-black text-slate-950 uppercase tracking-tighter">
            <Database className="text-blue-600" size={20} /> 6. Stocarea Datelor
          </h2>
          <p className="text-sm">
            Datele tranzacționale (facturile) sunt păstrate timp de 6 ani conform legii contabilității din RM. Datele de acces sunt șterse la 12 luni după închiderea contului, cu excepția cazului în care există o obligație legală contrară.
          </p>
        </section>

        {/* Secțiunea 7 */}
        <section className="space-y-4">
          <h2 className="flex items-center gap-3 text-xl font-black text-slate-950 uppercase tracking-tighter">
            <RefreshCw className="text-blue-600" size={20} /> 7. Modificări
          </h2>
          <p>
            QRate.md poate modifica acești termeni. Notificarea utilizatorilor se va face prin email cu cel puțin 15 zile înainte de intrarea în vigoare a noilor prețuri sau condiții contractuale importante.
          </p>
        </section>
      </div>
    </>
  );
}