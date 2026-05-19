import React from 'react';
import { Shield, Eye, Lock, Share2, UserCheck, Clock } from 'lucide-react';

export function PrivacyRu() {
  return (
    <>
      <article className="mb-16 space-y-4">
        <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
          <Shield size={14} /> Защита данных (Закон 133/2011)
        </div>
        <h1 className="text-5xl font-[900] tracking-tighter text-slate-950 uppercase leading-none">
          Политика <br /><span className="text-emerald-600 italic">Конфиденциальности</span>
        </h1>
        <p className="text-slate-500 font-medium italic">
          Мы защищаем данные вашего бизнеса с банковской строгостью.
        </p>
      </article>

      <div className="space-y-12 text-slate-600 leading-relaxed text-[15px]">
        <section className="space-y-4">
          <h2 className="flex items-center gap-3 text-xl font-black text-slate-950 uppercase tracking-tighter">
            <Eye className="text-emerald-600" size={20} /> 1. Категории собираемых данных
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-slate-50 p-5 rounded-2xl">
              <h3 className="font-bold text-slate-950 text-sm uppercase mb-2">Данные аккаунта</h3>
              <p className="text-xs">
                Имя администратора, email, зашифрованный пароль (hash) и название бренда.
              </p>
            </div>
            <div className="bg-slate-50 p-5 rounded-2xl">
              <h3 className="font-bold text-slate-950 text-sm uppercase mb-2">Фискальные данные</h3>
              <p className="text-xs">
                IDNO, юридический адрес и IBAN (необходимы исключительно для платных подписок).
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4 border-l-4 border-emerald-600 pl-6 py-2">
          <h2 className="text-xl font-black text-slate-950 uppercase tracking-tighter">
            2. Законные основания для обработки
          </h2>
          <p className="text-sm">
            Мы обрабатываем ваши данные в соответствии с <strong>Законом № 133/2011</strong> о защите персональных данных в Республики Молдова.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="flex items-center gap-3 text-xl font-black text-slate-950 uppercase tracking-tighter">
            <Lock className="text-emerald-600" size={20} /> 3. Безопасность и шифрование данных
          </h2>
          <p>
            Все соединения с <strong>QRate.MD</strong> защищены протоколом <strong>HTTPS (SSL/TLS)</strong>. Данные хранятся в безопасных базах данных с Row Level Security (RLS) через Supabase.
          </p>
        </section>
      </div>
    </>
  );
}