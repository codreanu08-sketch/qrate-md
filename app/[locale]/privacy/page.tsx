import React from 'react';
import { Shield, Eye, Lock, Share2, UserCheck, Clock } from 'lucide-react';

export function PrivacyRo() {
  return (
    <>
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

      <div className="space-y-12 text-slate-600 leading-relaxed text-[15px]">
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

        <section className="space-y-4 border-l-4 border-emerald-600 pl-6 py-2">
          <h2 className="text-xl font-black text-slate-950 uppercase tracking-tighter">
            2. Baza Legală a Prelucrării
          </h2>
          <p className="text-sm">
            Prelucrăm datele dumneavoastră în conformitate cu <strong>Legea nr. 133/2011</strong> privind protecția datelor cu caracter personal din Republica Moldova.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="flex items-center gap-3 text-xl font-black text-slate-950 uppercase tracking-tighter">
            <Lock className="text-emerald-600" size={20} /> 3. Securitatea Datelor
          </h2>
          <p>
            Toate conexiunile către <strong>QRate.MD</strong> sunt securizate prin protocolul <strong>HTTPS (SSL/TLS)</strong> cu politici stricte Row Level Security (RLS) în Supabase.
          </p>
        </section>
      </div>
    </>
  );
}