import React from 'react';
import { Shield, Eye, Lock, Share2, UserCheck, Clock, Building2 } from 'lucide-react';

export function PrivacyRo() {
  return (
    <>
      <article className="mb-16 space-y-4">
        <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
          <Shield size={14} /> Protecția Datelor — Legea nr. 133/2011
        </div>
        <h1 className="text-5xl font-[900] tracking-tighter text-slate-950 uppercase leading-none">
          Politica de <br /><span className="text-emerald-600 italic">Confidențialitate</span>
        </h1>
        <p className="text-slate-500 font-medium italic">Protejăm datele afacerii tale cu responsabilitate și transparență.</p>
        <p className="text-xs text-slate-400">Ultima actualizare: Ianuarie 2026</p>
      </article>

      <div className="space-y-12 text-slate-600 leading-relaxed text-[15px]">

        <section className="space-y-4">
          <h2 className="flex items-center gap-3 text-xl font-black text-slate-950 uppercase tracking-tighter">
            <Building2 className="text-emerald-600" size={20} /> 1. Operatorul de Date
          </h2>
          <div className="bg-slate-50 p-6 rounded-2xl space-y-2 text-sm">
            <p><strong>QR RATING S.R.L.</strong>, IDNO 1026023041245</p>
            <p>mun. Orhei, str. Sălciilor 75, Republica Moldova</p>
            <p>Email protecția datelor: suport@qrate.md</p>
          </div>
          <p className="text-sm">Prezenta politică se aplică în conformitate cu <strong>Legea nr. 133/2011 privind protecția datelor cu caracter personal</strong> din Republica Moldova.</p>
        </section>

        <section className="space-y-4">
          <h2 className="flex items-center gap-3 text-xl font-black text-slate-950 uppercase tracking-tighter">
            <Eye className="text-emerald-600" size={20} /> 2. Categorii de Date Colectate
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-slate-50 p-5 rounded-2xl space-y-2">
              <h3 className="font-bold text-slate-950 text-sm uppercase">Date de Cont</h3>
              <ul className="text-xs space-y-1 list-disc pl-4">
                <li>Adresă de email (identificator unic)</li>
                <li>Parolă criptată (hash bcrypt — nu se stochează în clar)</li>
                <li>Denumirea companiei / brandului</li>
              </ul>
            </div>
            <div className="bg-slate-50 p-5 rounded-2xl space-y-2">
              <h3 className="font-bold text-slate-950 text-sm uppercase">Date de Facturare</h3>
              <ul className="text-xs space-y-1 list-disc pl-4">
                <li>IDNO / Cod fiscal (persoane juridice)</li>
                <li>Adresa juridică</li>
                <li>Email pentru facturi</li>
                <li>Nu stocăm date de card bancar</li>
              </ul>
            </div>
            <div className="bg-slate-50 p-5 rounded-2xl space-y-2">
              <h3 className="font-bold text-slate-950 text-sm uppercase">Date Operaționale</h3>
              <ul className="text-xs space-y-1 list-disc pl-4">
                <li>Recenzii colectate de la clienți finali</li>
                <li>Numere de telefon (dacă clientul final le furnizează voluntar)</li>
                <li>Fotografii atașate recenziilor</li>
                <li>Coordonate GPS ale locațiilor</li>
              </ul>
            </div>
            <div className="bg-slate-50 p-5 rounded-2xl space-y-2">
              <h3 className="font-bold text-slate-950 text-sm uppercase">Date Tehnice</h3>
              <ul className="text-xs space-y-1 list-disc pl-4">
                <li>Adresa IP (pentru securitate)</li>
                <li>Cookie-uri de sesiune (obligatorii)</li>
                <li>Loguri de acces anonimizate</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="space-y-4 border-l-4 border-emerald-600 pl-6 py-2">
          <h2 className="text-xl font-black text-slate-950 uppercase tracking-tighter">3. Baza Legală și Scopul Prelucrării</h2>
          <div className="space-y-3 text-sm">
            <p><strong>Executarea contractului</strong> (art. 5 lit. b din Legea 133/2011): prelucrăm datele de cont și de facturare pentru furnizarea serviciului.</p>
            <p><strong>Consimțământ</strong>: datele clienților finali (recenzii, telefon) sunt colectate cu consimțământul expres al persoanelor în cauză prin formularul de recenzie.</p>
            <p><strong>Interes legitim</strong>: loguri de securitate și prevenirea fraudelor.</p>
            <p><strong>Obligație legală</strong>: păstrarea datelor fiscale conform legislației contabile moldovenești.</p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="flex items-center gap-3 text-xl font-black text-slate-950 uppercase tracking-tighter">
            <Share2 className="text-emerald-600" size={20} /> 4. Terți și Transferuri de Date
          </h2>
          <div className="space-y-3 text-sm">
            <p>Datele sunt procesate de următorii sub-operatori:</p>
            <ul className="space-y-2">
              <li className="bg-slate-50 p-3 rounded-xl"><strong>Supabase Inc.</strong> — infrastructură cloud și bază de date (SUA, cu clauze contractuale standard)</li>
              <li className="bg-slate-50 p-3 rounded-xl"><strong>maib (Moldova Agroindbank S.A.)</strong> — procesare plăți (Republica Moldova)</li>
              <li className="bg-slate-50 p-3 rounded-xl"><strong>Telegram Messenger</strong> — trimitere notificări (nu transmitem date personale, doar texte de alertă)</li>
              <li className="bg-slate-50 p-3 rounded-xl"><strong>Vercel Inc.</strong> — hosting și CDN (SUA)</li>
            </ul>
            <p>Nu vindem și nu transmitem datele dvs. terților în scopuri de marketing.</p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="flex items-center gap-3 text-xl font-black text-slate-950 uppercase tracking-tighter">
            <Lock className="text-emerald-600" size={20} /> 5. Securitatea Datelor
          </h2>
          <div className="space-y-3 text-sm">
            <p>Implementăm măsuri tehnice și organizatorice adecvate:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Conexiuni criptate <strong>HTTPS/TLS</strong> pentru toate comunicațiile</li>
              <li>Politici <strong>Row Level Security (RLS)</strong> în Supabase — fiecare utilizator accesează exclusiv propriile date</li>
              <li>Parole stocate exclusiv ca hash-uri criptografice</li>
              <li>Autentificare securizată prin Supabase Auth (JWT)</li>
              <li>Date de card bancar procesate exclusiv de maib — nu stocate de QRate</li>
            </ul>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="flex items-center gap-3 text-xl font-black text-slate-950 uppercase tracking-tighter">
            <Clock className="text-emerald-600" size={20} /> 6. Retenția Datelor
          </h2>
          <div className="space-y-2 text-sm">
            <p>• <strong>Date de cont activ:</strong> pe durata abonamentului + 30 de zile după anulare</p>
            <p>• <strong>Date de facturare:</strong> 5 ani (conform legislației contabile moldovenești)</p>
            <p>• <strong>Recenzii și date operaționale:</strong> pe durata contractului</p>
            <p>• <strong>Loguri tehnice:</strong> 90 de zile</p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="flex items-center gap-3 text-xl font-black text-slate-950 uppercase tracking-tighter">
            <UserCheck className="text-emerald-600" size={20} /> 7. Drepturile Dumneavoastră
          </h2>
          <p className="text-sm">Conform Legii nr. 133/2011, aveți dreptul la:</p>
          <div className="grid md:grid-cols-2 gap-3 text-sm">
            {[
              ['Acces', 'Să solicitați o copie a datelor prelucrate'],
              ['Rectificare', 'Să corectați datele incorecte'],
              ['Ștergere', 'Să cereți ștergerea datelor (dreptul de a fi uitat)'],
              ['Opoziție', 'Să vă opuneți prelucrării în anumite circumstanțe'],
              ['Portabilitate', 'Să primiți datele într-un format structurat'],
              ['Retragere consimțământ', 'Oricând, fără consecințe negative'],
            ].map(([title, desc]) => (
              <div key={title} className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                <p className="font-black text-emerald-800 text-xs uppercase">{title}</p>
                <p className="text-xs text-emerald-700 mt-1">{desc}</p>
              </div>
            ))}
          </div>
          <p className="text-sm mt-4">
            Exercitați-vă drepturile prin email la <strong>suport@qrate.md</strong>. Vom răspunde în termen de 30 de zile. Aveți și dreptul de a depune plângere la <strong>Centrul Național pentru Protecția Datelor cu Caracter Personal al Republicii Moldova</strong>.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-black text-slate-950 uppercase tracking-tighter">8. Cookie-uri</h2>
          <div className="space-y-3 text-sm">
            <p>Utilizăm exclusiv cookie-uri tehnice obligatorii pentru:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Menținerea sesiunii autentificate (JWT token)</li>
              <li>Preferințe de limbă (ro/ru)</li>
            </ul>
            <p>Nu utilizăm cookie-uri de tracking sau publicitate third-party.</p>
          </div>
        </section>

      </div>
    </>
  );
}