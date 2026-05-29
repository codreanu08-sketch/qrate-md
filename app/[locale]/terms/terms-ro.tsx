import React from 'react';
import { FileText, CreditCard, ShieldAlert, Scale, HelpCircle, Building2, AlertTriangle } from 'lucide-react';

export function TermsRo() {
  return (
    <>
      <article className="mb-16 space-y-4">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100">
          <FileText size={14} /> Termeni și Condiții de Utilizare
        </div>
        <h1 className="text-5xl font-[900] tracking-tighter text-slate-950 uppercase leading-none">
          Termeni și <br /><span className="text-blue-600 italic">Condiții</span>
        </h1>
        <p className="text-slate-500 font-medium italic">
          Vă rugăm să citiți cu atenție înainte de utilizarea platformei QRate.md
        </p>
        <p className="text-xs text-slate-400">Ultima actualizare: Ianuarie 2026</p>
      </article>

      <div className="space-y-12 text-slate-600 leading-relaxed text-[15px]">

        {/* 1. Identificare */}
        <section className="space-y-4">
          <h2 className="flex items-center gap-3 text-xl font-black text-slate-950 uppercase tracking-tighter">
            <Building2 className="text-blue-600" size={20} /> 1. Identificarea Prestatorului
          </h2>
          <div className="bg-slate-50 p-6 rounded-2xl space-y-2 text-sm">
            <p><strong>Denumire:</strong> QR RATING S.R.L.</p>
            <p><strong>IDNO:</strong> 1026023041245</p>
            <p><strong>Adresa juridică:</strong> Republica Moldova, mun. Orhei, str. Sălciilor 75</p>
            <p><strong>Email contact:</strong> hello@qrate.md</p>
            <p><strong>Site web:</strong> www.qrate.md</p>
            <p className="text-xs text-slate-400 pt-2">Societate înregistrată conform legislației Republicii Moldova</p>
          </div>
        </section>

        {/* 2. Obiectul */}
        <section className="space-y-4">
          <h2 className="flex items-center gap-3 text-xl font-black text-slate-950 uppercase tracking-tighter">
            <FileText className="text-blue-600" size={20} /> 2. Obiectul Contractului
          </h2>
          <p>
            <strong>QRate.md</strong> este o platformă SaaS (Software as a Service) care oferă servicii de colectare și gestionare a recenziilor clienților prin coduri QR, notificări Telegram, analiză AI și instrumente de management al reputației pentru afaceri din Republica Moldova.
          </p>
          <p>Prin înregistrarea unui cont, Utilizatorul acceptă în mod expres și necondiționat prezentele Termeni și Condiții.</p>
        </section>

        {/* 3. Înregistrare și cont */}
        <section className="space-y-4 border-l-4 border-blue-600 pl-6 py-2">
          <h2 className="text-xl font-black text-slate-950 uppercase tracking-tighter">
            3. Înregistrarea Contului
          </h2>
          <div className="space-y-3 text-sm">
            <p>3.1. Utilizatorul se obligă să furnizeze informații corecte, complete și actuale la înregistrare.</p>
            <p>3.2. Contul este personal și netransferabil. Utilizatorul este responsabil de confidențialitatea parolei.</p>
            <p>3.3. QR RATING S.R.L. își rezervă dreptul de a suspenda sau șterge conturile care încalcă prezentele condiții.</p>
            <p>3.4. Un cont poate gestiona mai multe locații în limita planului de abonament ales.</p>
          </div>
        </section>

        {/* 4. Abonamente și plăți */}
        <section className="space-y-4">
          <h2 className="flex items-center gap-3 text-xl font-black text-slate-950 uppercase tracking-tighter">
            <CreditCard className="text-blue-600" size={20} /> 4. Abonamente, Prețuri și Modalități de Plată
          </h2>
          <div className="space-y-3 text-sm">
            <p>4.1. <strong>Perioadă de probă gratuită:</strong> Fiecare cont nou beneficiază de 7 (șapte) zile de acces complet gratuit, fără obligativitatea introducerii datelor de plată.</p>
            <p>4.2. <strong>Planuri de abonament:</strong> Serviciile se facturează lunar, conform planului ales (START 450 MDL, GROW 700 MDL, SCALE 1.050 MDL, PRO 1.300 MDL, PRO+ 1.500 MDL, ENTERPRISE 1.700 MDL/lună). Prețurile sunt exprimate în MDL și includ TVA.</p>
            <p>4.3. <strong>Modalitate de plată:</strong> Plata se efectuează prin card bancar (Visa/Mastercard) prin intermediul gateway-ului securizat <strong>maib</strong> (Moldova Agroindbank S.A.). QR RATING S.R.L. nu stochează datele cardului bancar al Utilizatorului.</p>
            <p>4.4. <strong>Plăți recurente:</strong> Prin activarea unui abonament plătit, Utilizatorul autorizează debitarea automată lunară a sumei corespunzătoare planului ales.</p>
            <p>4.5. Prețurile pot fi modificate cu notificarea prealabilă a Utilizatorilor cu cel puțin 30 de zile înainte de intrarea în vigoare.</p>
          </div>
        </section>

        {/* 5. Anulare */}
        <section className="space-y-4 border-l-4 border-amber-400 pl-6 py-2">
          <h2 className="text-xl font-black text-slate-950 uppercase tracking-tighter">
            5. Anularea Abonamentului
          </h2>
          <div className="space-y-3 text-sm">
            <p>5.1. Utilizatorul poate anula reînnoirea automată a abonamentului din secțiunea <strong>Dashboard → Abonament</strong> cu cel puțin 24 de ore înainte de data scadentă.</p>
            <p>5.2. La anulare, accesul la funcționalitățile premium se menține până la expirarea perioadei deja achitate.</p>
            <p>5.3. Sumele deja procesate pentru perioada curentă nu sunt rambursabile, cu excepțiile prevăzute în Politica de Rambursare.</p>
          </div>
        </section>

        {/* 6. Obligații utilizator */}
        <section className="space-y-4">
          <h2 className="flex items-center gap-3 text-xl font-black text-slate-950 uppercase tracking-tighter">
            <ShieldAlert className="text-blue-600" size={20} /> 6. Obligațiile Utilizatorului
          </h2>
          <div className="space-y-2 text-sm">
            <p>Utilizatorul se obligă să:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Utilizeze platforma exclusiv în scopuri legale și conforme cu legislația Republicii Moldova;</li>
              <li>Nu colecteze recenzii false sau să manipuleze sistemul de evaluare;</li>
              <li>Respecte drepturile clienților săi conform Legii nr. 133/2011 privind protecția datelor;</li>
              <li>Nu revândă sau redistribuie accesul la platformă fără acordul scris al QR RATING S.R.L.</li>
            </ul>
          </div>
        </section>

        {/* 7. Responsabilitate */}
        <section className="space-y-4">
          <h2 className="flex items-center gap-3 text-xl font-black text-slate-950 uppercase tracking-tighter">
            <AlertTriangle className="text-blue-600" size={20} /> 7. Limitarea Responsabilității
          </h2>
          <div className="space-y-3 text-sm">
            <p>7.1. QR RATING S.R.L. oferă serviciul „ca atare" și nu garantează disponibilitatea neîntreruptă 100% a platformei.</p>
            <p>7.2. QR RATING S.R.L. nu este responsabilă pentru conținutul recenziilor lăsate de clienți finali.</p>
            <p>7.3. Responsabilitatea totală a QR RATING S.R.L. față de un Utilizator nu poate depăși suma plătită de acesta în ultimele 3 luni de abonament.</p>
          </div>
        </section>

        {/* 8. Proprietate intelectuală */}
        <section className="space-y-4">
          <h2 className="text-xl font-black text-slate-950 uppercase tracking-tighter">
            8. Proprietatea Intelectuală
          </h2>
          <p className="text-sm">
            Platforma QRate.md, inclusiv codul sursă, design-ul, algoritmii AI și marca comercială, constituie proprietatea exclusivă a QR RATING S.R.L. Utilizatorul nu dobândește niciun drept de proprietate intelectuală prin utilizarea serviciului.
          </p>
        </section>

        {/* 9. Legea aplicabilă */}
        <section className="bg-slate-950 text-white p-8 rounded-[2.5rem] space-y-4">
          <h2 className="flex items-center gap-3 text-xl font-black uppercase tracking-tighter">
            <Scale className="text-blue-400" size={22} /> 9. Legea Aplicabilă și Litigii
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Prezentul contract este guvernat de legea Republicii Moldova. Orice litigiu se va soluționa pe cale amiabilă în termen de 30 de zile, iar în cazul eșecului, prin instanțele judecătorești competente din Republica Moldova, conform procedurii stabilite de <strong>Codul de Procedură Civilă al Republicii Moldova</strong>.
          </p>
          <p className="text-slate-400 text-sm">
            <strong className="text-white">Contact litigii:</strong> hello@qrate.md · QR RATING S.R.L., mun. Orhei, str. Sălciilor 75
          </p>
        </section>

        {/* 10. Modificări */}
        <section className="space-y-4">
          <h2 className="flex items-center gap-3 text-xl font-black text-slate-950 uppercase tracking-tighter">
            <HelpCircle className="text-blue-600" size={20} /> 10. Modificarea Termenilor
          </h2>
          <p className="text-sm">
            QR RATING S.R.L. își rezervă dreptul de a modifica prezentele Termeni și Condiții cu notificarea Utilizatorilor prin email cu cel puțin 14 zile înainte de intrarea în vigoare a modificărilor. Continuarea utilizării platformei după această dată constituie acceptarea noilor termeni.
          </p>
        </section>

      </div>
    </>
  );
}