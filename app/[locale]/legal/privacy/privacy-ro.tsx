import React from 'react';
import { Shield, Eye, Lock, Share2, UserCheck, Clock } from 'lucide-react';

export function PrivacyRo() {
  return (
    <>
      {/* SEMANTICA SEO */}
      <article className="mb-16 space-y-4">
        <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
          <Shield size={14} /> Protecția Datelor (Legea 133/2011)
        </div>
        <h1 className="text-5xl font-[900] tracking-tighter text-slate-950 uppercase leading-none">
          Politica de <br /><span className="text-emerald-600 italic">Confidențialitate</span>
        </h1>
        <p className="text-slate-500 font-medium italic">
          Protejăm datele afacerii tale cu rigoare bancară.
        </p>
      </article>

      {/* STRUCTURA IERARHICA H2 SI H3 */}
      <div className="space-y-12 text-slate-600 leading-relaxed text-[15px]">
        
        {/* 1. Categorii de Date Colectate */}
        <section className="space-y-4">
          <h2 className="flex items-center gap-3 text-xl font-black text-slate-950 uppercase tracking-tighter">
            <Eye className="text-emerald-600" size={20} /> 1. Categorii de Date Colectate
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-slate-50 p-5 rounded-2xl">
              <h3 className="font-bold text-slate-950 text-sm uppercase mb-2">Date de Cont</h3>
              <p className="text-xs">
                Nume administrator, email, parola criptată (hash) și denumirea brandului.
              </p>
            </div>
            <div className="bg-slate-50 p-5 rounded-2xl">
              <h3 className="font-bold text-slate-950 text-sm uppercase mb-2">Date Fiscale</h3>
              <p className="text-xs">
                IDNO, Adresa Juridică și IBAN (necesare exclusiv pentru abonamentele plătite).
              </p>
            </div>
          </div>
        </section>

        {/* 2. Baza Legală a Prelucrării */}
        <section className="space-y-4 border-l-4 border-emerald-600 pl-6 py-2">
          <h2 className="text-xl font-black text-slate-950 uppercase tracking-tighter">
            2. Baza Legală a Prelucrării
          </h2>
          <p className="text-sm">
            Prelucrăm datele dumneavoastră în conformitate cu <strong>Legea nr. 133/2011</strong> privind protecția datelor cu caracter personal din Republica Moldova, bazându-ne pe:
          </p>
          <ul className="list-disc pl-5 text-sm space-y-2 italic">
            <li><strong>Executarea Contractului:</strong> Pentru furnizarea accesului la serviciile platformei.</li>
            <li><strong>Obligația Legală:</strong> Pentru raportarea fiscală și prevenirea activităților ilicite.</li>
            <li><strong>Consimțământ:</strong> Pentru comunicări de marketing (unde ați optat explicit).</li>
          </ul>
        </section>

        {/* 3. Securitatea și Criptarea Datelor */}
        <section className="space-y-4">
          <h2 className="flex items-center gap-3 text-xl font-black text-slate-950 uppercase tracking-tighter">
            <Lock className="text-emerald-600" size={20} /> 3. Securitatea și Criptarea Datelor
          </h2>
          <p>
            Toate conexiunile către <strong>QRate.MD</strong> sunt securizate prin protocolul <strong>HTTPS (SSL/TLS)</strong>. Datele sunt stocate în baze de date securizate, izolate prin politici stricte la nivel de rând (Row Level Security). Parolele sunt procesate exclusiv prin algoritmul de hashing asimetric, făcând imposibilă citirea lor în clar.
          </p>
        </section>

        {/* 4. Partajarea Datelor cu Terți */}
        <section className="space-y-4">
          <h2 className="flex items-center gap-3 text-xl font-black text-slate-950 uppercase tracking-tighter">
            <Share2 className="text-emerald-600" size={20} /> 4. Partajarea Datelor cu Terți
          </h2>
          <p>
            QRate.md nu vinde și nu închiriază datele dumneavoastră comerciale. Partajarea datelor se face exclusiv către furnizorii de servicii esențiali:
          </p>
          <ul className="list-disc pl-5 text-sm space-y-1 text-slate-500">
            <li><strong>Procesatorul de plăți (maib):</strong> Transmiterea datelor de facturare pentru finalizarea tranzacțiilor securizate.</li>
            <li><strong>Servicii de infrastructură Cloud:</strong> Pentru găzduirea în siguranță a bazelor de date și a serverelor aplicației.</li>
          </ul>
        </section>

        {/* 5. Drepturile Dumneavoastră Legale */}
        <section className="space-y-4">
          <h2 className="flex items-center gap-3 text-xl font-black text-slate-950 uppercase tracking-tighter">
            <UserCheck className="text-emerald-600" size={20} /> 5. Drepturile Dumneavoastră Legale
          </h2>
          <p>
            Conform legislației Republicii Moldova (Legea 133/2011), beneficiați de următoarele drepturi fundamentale:
          </p>
          <div className="bg-slate-50 p-6 rounded-2xl grid md:grid-cols-3 gap-4 text-xs font-medium">
            <div>
              <span className="text-emerald-600 font-bold block mb-1">Dreptul de Acces:</span>
              Puteți solicita o copie a tuturor datelor pe care le deținem despre afacerea dumneavoastră.
            </div>
            <div>
              <span className="text-emerald-600 font-bold block mb-1">Dreptul de Rectificare:</span>
              Puteți modifica în orice moment informațiile greșite direct din Dashboard.
            </div>
            <div>
              <span className="text-emerald-600 font-bold block mb-1">Dreptul de Ștergere:</span>
              Puteți solicita închiderea contului și ștergerea definitivă a tuturor datelor (dreptul de a fi uitat).
            </div>
          </div>
        </section>

        {/* 6. Perioada de Retenție */}
        <section className="space-y-4">
          <h2 className="flex items-center gap-3 text-xl font-black text-slate-950 uppercase tracking-tighter">
            <Clock className="text-emerald-600" size={20} /> 6. Perioada de Retenție
          </h2>
          <p>
            Datele operaționale colectate prin intermediul codurilor QR sunt păstrate pe serverele noastre atât timp cât contul dumneavoastră este activ. Documentele fiscale justificative generate în urma tranzacțiilor prin <strong>maib</strong> sunt reținute pe o perioadă de 6 ani, conform normelor contabile naționale din RM.
          </p>
        </section>
      </div>
    </>
  );
}