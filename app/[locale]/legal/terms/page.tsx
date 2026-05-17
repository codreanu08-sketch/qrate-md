import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Zap, FileText, Gavel, RefreshCw, AlertCircle, ShieldCheck, Mail, Scale, Database } from 'lucide-react';

interface Props {
  params: Promise<{ locale: string }>;
}

// 1. OPTIMIZARE SEO: Meta-date dinamice globale și marcaj Hreflang pentru eliminarea conținutului duplicat
export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const isRu = locale === 'ru';
  
  const title = isRu 
    ? 'Условия использования и публичная оферта | QRate.md' 
    : 'Termeni și Condiții | Contract de Adeziune Public | QRate.MD';
    
  const description = isRu
    ? 'Официальные условия использования платформы QRate.md, безопасность транзакций maib и защита данных в Республике Молдова.'
    : 'Termenii legali și condițiile de utilizare a platformei QRate.md. Informații despre livrarea produselor digitale, securitatea maib și GDPR în RM.';

  return {
    title,
    description,
    robots: {
      index: true,
      follow: true,
    },
    alternates: {
      canonical: `https://qrate.md/${locale}/terms`,
      languages: {
        'ro': 'https://qrate.md/ro/terms',
        'ru': 'https://qrate.md/ru/terms',
      },
    },
  };
}

export default async function TermsPage({ params }: Props) {
  const { locale } = await params;

  // Validare de siguranță pentru structura de limbi
  if (locale !== 'ro' && locale !== 'ru') {
    notFound();
  }

  const isRu = locale === 'ru';

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      
      {/* HEADER LEGAL */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href={`/${locale}/dashboard`} className="flex items-center gap-2 group">
            <div className="bg-blue-600 p-2 rounded-xl">
              <Zap className="text-white fill-white" size={16} />
            </div>
            <span className="text-lg font-black uppercase tracking-tighter italic">
              QRate<span className="text-blue-600">.MD</span>
            </span>
          </Link>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
            {isRu ? 'v2026.2 (Стандарт Maib и GDPR-MD)' : 'v2026.2 (Standard Maib & GDPR-MD)'}
          </span>
        </div>
      </nav>

      {/* CONTINUT ARTICOL INDEXABIL */}
      <main className="max-w-4xl mx-auto px-6 pt-32 pb-24">
        
        {/* SEMANTICA SEO: Titlu H1 Unic per pagină */}
        <article className="mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
            <Gavel size={14} /> {isRu ? 'Публичная оферта (Договор присоединения)' : 'Contract de Adeziune (Public)'}
          </div>
          <h1 className="text-5xl font-[900] tracking-tighter text-slate-950 uppercase leading-none">
            {isRu ? <>Условия и <br /><span className="text-blue-600 italic">Положения</span></> : <>Termeni și <br /><span className="text-blue-600 italic">Condiții</span></>}
          </h1>
          <p className="text-slate-500 font-medium italic">
            {isRu ? 'Последнее обновление: 12 мая 2026 г.' : 'Ultima actualizare: 12 Mai 2026'}
          </p>
        </article>

        {/* SEMANTICA SEO: Structură ierarhică clară folosind H2 */}
        <div className="space-y-12 text-slate-600 leading-relaxed text-[15px]">
          
          {/* Secțiunea 0: Definiții */}
          <section className="space-y-4">
            <h2 className="flex items-center gap-3 text-xl font-black text-slate-950 uppercase tracking-tighter">
              <FileText className="text-blue-600" size={20} /> 0. {isRu ? 'Определения' : 'Definiții'}
            </h2>
            <div className="bg-slate-50 p-6 rounded-2xl text-[13px] grid md:grid-cols-2 gap-4 italic font-medium">
              {isRu ? (
                <>
                  <p><strong>Платформа:</strong> Программное обеспечение QRate.md, панель управления и облачная инфраструктура.</p>
                  <p><strong>Пользователь:</strong> Юридическое лицо (SRL/ÎI), заключившее договор на обслуживание.</p>
                  <p><strong>Посетитель:</strong> Конечный клиент, сканирующий QR-код для отправки отзыва.</p>
                  <p><strong>Рабочий день:</strong> С понедельника по пятницу, за исключением официальных праздников в РМ.</p>
                </>
              ) : (
                <>
                  <p><strong>Platforma:</strong> Software-ul QRate.md, dashboard-ul și infrastructura cloud.</p>
                  <p><strong>Utilizator:</strong> Entitatea juridică (SRL/ÎI) care contractează serviciile.</p>
                  <p><strong>Vizitator:</strong> Clientul final care scanează codul QR pentru feedback.</p>
                  <p><strong>Zi Lucrătoare:</strong> Zilele de Luni până Vineri, excluzând sărbătorile legale în RM.</p>
                </>
              )}
            </div>
          </section>

          {/* Secțiunea 1: Identificare */}
          <section className="space-y-4 border-l-4 border-blue-600 pl-6 py-2">
            <h2 className="text-xl font-black text-slate-950 uppercase tracking-tighter">
              1. {isRu ? 'Данные Исполнителя' : 'Datele Prestatorului'}
            </h2>
            <div className="bg-slate-50 p-6 rounded-2xl space-y-2 text-sm font-medium">
              <p><strong>{isRu ? 'Компания:' : 'Compania:'}</strong> S.R.L. "QR SOLUTIONS GROUP"</p>
              <p><strong>IDNO:</strong> 102XXXXXXXXXX</p>
              <p><strong>{isRu ? 'Юридический адрес:' : 'Adresă Juridică:'}</strong> mun. Chișinău, str. [Adresa ta], Republica Moldova</p>
              <p><strong>{isRu ? 'Поддержка:' : 'Contact Suport:'}</strong> hello@qrate.md</p>
            </div>
          </section>

          {/* Secțiunea 2: Servicii Digitale */}
          <section className="space-y-4">
            <h2 className="flex items-center gap-3 text-xl font-black text-slate-950 uppercase tracking-tighter">
              <Zap className="text-blue-600" size={20} /> 2. {isRu ? 'Доставка цифрового продукта' : 'Livrarea Produsului Digital'}
            </h2>
            <p>
              {isRu ? (
                <>Услуги <strong>QRate.MD</strong> предоставляются исключительно в цифровом виде. Доступ к панели управления (Dashboard) активируется автоматически и мгновенно после подтверждения оплаты через платежную систему <strong>maib</strong>. Пользователь получит электронное письмо с подтверждением доступа сразу после совершения транзакции.</>
              ) : (
                <>Serviciile <strong>QRate.MD</strong> sunt exclusiv digitale. Accesul la Dashboard este activat automat și instantaneu după confirmarea plății prin sistemul <strong>maib</strong>. Utilizatorul va primi un email de confirmare cu detaliile de acces imediat după tranzacție.</>
              )}
            </p>
          </section>

          {/* Secțiunea 3: Plăți & Securitate */}
          <section className="bg-slate-950 text-white p-8 rounded-[2.5rem] space-y-6">
            <h2 className="flex items-center gap-3 text-xl font-black uppercase tracking-tighter">
              <ShieldCheck className="text-blue-400" size={24} /> 3. {isRu ? 'Безопасность транзакций' : 'Securitatea Tranzacțiilor'}
            </h2>
            <p className="text-slate-400 text-sm italic">
              {isRu 
                ? <>Платежи безопасно обрабатываются через <strong>maib</strong>. QRate.md не хранит данные вашей банковской карты.</>
                : <>Plățile sunt procesate securizat prin <strong>maib</strong>. QRate.md nu stochează datele cardului dumneavoastră.</>
              }
            </p>
            <div className="grid md:grid-cols-2 gap-6 text-xs leading-relaxed opacity-90">
              <div className="space-y-2 border-l border-white/10 pl-4">
                <h3 className="font-black uppercase text-blue-400 tracking-widest text-[9px]">{isRu ? 'Защита:' : 'Protecție:'}</h3>
                <p>
                  {isRu 
                    ? <>Транзакции защищены протоколом <strong>3D-Secure</strong>. Данные передаются напрямую на зашифрованные банковские серверы.</>
                    : <>Tranzacțiile sunt securizate prin protocolul <strong>3D-Secure</strong>. Datele sunt transmise direct către serverele bancare criptate.</>
                  }
                </p>
              </div>
              <div className="space-y-2 border-l border-white/10 pl-4">
                <h3 className="font-black uppercase text-blue-400 tracking-widest text-[9px]">{isRu ? 'Подписки:' : 'Abonamente:'}</h3>
                <p>
                  {isRu
                    ? <>Рекуррентные платежи могут быть отменены в любое время через Dashboard не менее чем за 24 часа до даты списания.</>
                    : <>Plățile recurente pot fi anulate oricând din Dashboard cu cel puțin 24h înainte de data scadentă.</>
                  }
                </p>
              </div>
            </div>
          </section>

          {/* Secțiunea 4: Limitarea Răspunderii */}
          <section className="space-y-4">
            <h2 className="flex items-center gap-3 text-xl font-black text-slate-950 uppercase tracking-tighter">
              <Scale className="text-blue-600" size={20} /> 4. {isRu ? 'Ограничение ответственности' : 'Limitarea Răspunderii'}
            </h2>
            <div className="text-sm space-y-3 italic">
              <p>
                {isRu 
                  ? <>QRate.md стремится к доступности сервиса на уровне 99.9%. Тем не менее, мы не несем ответственности за:</>
                  : <>QRate.md depune eforturi pentru o disponibilitate de 99.9%. Totuși, nu suntem responsabili pentru:</>
                }
              </p>
              <ul className="list-disc pl-5 space-y-2 text-slate-500">
                {isRu ? (
                  <>
                    <li>Коммерческие решения, принятые Пользователем на основе полученных отзывов.</li>
                    <li>Технические сбои платежного процессора (maib) или хостинг-провайдеров.</li>
                    <li>Использование QR-кодов Пользователем способами, нарушающими местное законодательство.</li>
                  </>
                ) : (
                  <>
                    <li>Deciziile comerciale luate de Utilizator bazate pe feedback-ul primit.</li>
                    <li>Defecțiuni tehnice ale procesatorului de plăți (maib) sau ale furnizorilor de hosting.</li>
                    <li>Utilizarea codurilor QR în moduri care încalcă legislația locală de către Utilizator.</li>
                  </>
                )}
              </ul>
            </div>
          </section>

          {/* Secțiunea 5: Reclamații & Consumator */}
          <section className="space-y-4">
            <h2 className="flex items-center gap-3 text-xl font-black text-slate-950 uppercase tracking-tighter">
              <AlertCircle className="text-blue-600" size={20} /> 5. {isRu ? 'Защита прав потребителей' : 'Protecția Consumatorului'}
            </h2>
            <p>
              {isRu 
                ? <>Жалобы можно направлять по адресу <strong>hello@qrate.md</strong>. Максимальный срок ответа составляет 14 дней.</>
                : <>Reclamațiile pot fi depuse la <strong>hello@qrate.md</strong>. Termenul de răspuns este de maxim 14 zile.</>
              }
            </p>
            <div className="bg-red-50/50 border border-red-100 p-6 rounded-2xl text-[13px] italic">
              {isRu ? (
                <>
                  <p>В случае неурегулирования спора мирным путем, в соответствии с Законом 105/2003, вы можете обратиться в <strong>Государственную инспекцию по надзору за непищевыми продуктами и защите прав потребителей</strong>:</p>
                  <p className="mt-2 font-bold text-red-900">г. Кишинев, ул. Василе Александри, 78.</p>
                </>
              ) : (
                <>
                  <p>În cazul nesoluționării amiabile, conform Legii 105/2003, vă puteți adresa <strong>Inspectoratului de Stat pentru Supravegherea Produselor Nealimentare și Protecția Consumatorilor</strong>:</p>
                  <p className="mt-2 font-bold text-red-900">mun. Chișinău, str. Vasile Alecsandri, 78.</p>
                </>
              )}
            </div>
          </section>

          {/* Secțiunea 6: Retenția Datelor (GDPR Moldova) */}
          <section className="space-y-4">
            <h2 className="flex items-center gap-3 text-xl font-black text-slate-950 uppercase tracking-tighter">
              <Database className="text-blue-600" size={20} /> 6. {isRu ? 'Хранение данных' : 'Stocarea Datelor'}
            </h2>
            <p className="text-sm">
              {isRu ? (
                <>Транзакционные данные (инвойсы) хранятся в течение 6 лет в соответствии с законом о бухгалтерском учете РМ. Данные доступа удаляются через 12 месяцев после закрытия учетной записи, за исключением случаев, когда законодательством предусмотрено иное.</>
              ) : (
                <>Datele tranzacționale (facturile) sunt păstrate timp de 6 ani conform legii contabilității din RM. Datele de acces sunt șterse la 12 luni după închiderea contului, cu excepția cazului în care există o obligație legală contrară.</>
              )}
            </p>
          </section>

          {/* Sectiunea 7: Modificari */}
          <section className="space-y-4">
            <h2 className="flex items-center gap-3 text-xl font-black text-slate-950 uppercase tracking-tighter">
              <RefreshCw className="text-blue-600" size={20} /> 7. {isRu ? 'Изменения' : 'Modificări'}
            </h2>
            <p>
              {isRu ? (
                <>QRate.md может изменять данные условия. Уведомление пользователей осуществляется по электронной почте не менее чем за 15 дней до вступления в силу новых цен или важных договорных условий.</>
              ) : (
                <>QRate.md poate modifica acești termeni. Notificarea utilizatorilor se va face prin email cu cel puțin 15 zile înainte de intrarea în vigoare a noilor prețuri sau condiții contractuale importante.</>
              )}
            </p>
          </section>
        </div>

        {/* FOOTER DETALII */}
        <div className="mt-20 pt-10 border-t border-slate-100 flex flex-col md:flex-row justify-between gap-8">
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              {isRu ? 'Юридическая информация и поддержка' : 'Juridic & Suport'}
            </p>
            <div className="flex gap-4 text-slate-900 items-center">
              <Mail size={16}/> <span className="text-xs font-bold uppercase tracking-widest">hello@qrate.md</span>
            </div>
          </div>
          <p className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.5em] self-center">
            QRate Moldova • QR SOLUTIONS GROUP
          </p>
        </div>
      </main>
    </div>
  );
}