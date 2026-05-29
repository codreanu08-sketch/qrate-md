import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Zap, FileText, Gavel, RefreshCw, AlertCircle, ShieldCheck, Mail, Scale, Database, Building2, CreditCard } from 'lucide-react';

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const isRu = locale === 'ru';
  return {
    title: isRu
      ? 'Условия использования | QRate.md'
      : 'Termeni și Condiții | QRate.md',
    description: isRu
      ? 'Официальные условия использования платформы QRate.md. QR RATING S.R.L., IDNO 1026023041245, Республика Молдова.'
      : 'Termenii și condițiile de utilizare a platformei QRate.md. QR RATING S.R.L., IDNO 1026023041245, Republica Moldova.',
    robots: { index: true, follow: true },
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
  if (locale !== 'ro' && locale !== 'ru') notFound();
  const isRu = locale === 'ru';

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href={`/${locale}`} className="flex items-center gap-2 group">
            <div className="bg-blue-600 p-2 rounded-xl">
              <Zap className="text-white fill-white" size={16} />
            </div>
            <span className="text-lg font-black uppercase tracking-tighter italic">
              QRate<span className="text-blue-600">.MD</span>
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href={`/${locale}/privacy`} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors hidden sm:block">
              {isRu ? 'Конфиденциальность' : 'Confidențialitate'}
            </Link>
            <Link href={`/${locale}/refund`} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors hidden sm:block">
              {isRu ? 'Возврат' : 'Rambursare'}
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 pt-32 pb-24">

        {/* HEADER */}
        <article className="mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
            <Gavel size={14} /> {isRu ? 'Публичная оферта (Договор присоединения)' : 'Contract de Adeziune Public'}
          </div>
          <h1 className="text-5xl font-[900] tracking-tighter text-slate-950 uppercase leading-none">
            {isRu
              ? <><span>Условия и </span><br /><span className="text-blue-600 italic">Положения</span></>
              : <><span>Termeni și </span><br /><span className="text-blue-600 italic">Condiții</span></>}
          </h1>
          <p className="text-slate-500 font-medium italic">
            {isRu ? 'Последнее обновление: Январь 2026' : 'Ultima actualizare: Ianuarie 2026'}
          </p>
        </article>

        <div className="space-y-12 text-slate-600 leading-relaxed text-[15px]">

          {/* 0. Definiții */}
          <section className="space-y-4">
            <h2 className="flex items-center gap-3 text-xl font-black text-slate-950 uppercase tracking-tighter">
              <FileText className="text-blue-600" size={20} /> 0. {isRu ? 'Определения' : 'Definiții'}
            </h2>
            <div className="bg-slate-50 p-6 rounded-2xl text-[13px] grid md:grid-cols-2 gap-4 italic font-medium">
              {isRu ? (
                <>
                  <p><strong>Платформа:</strong> Программное обеспечение QRate.md, панель управления и облачная инфраструктура.</p>
                  <p><strong>Пользователь:</strong> Юридическое или физическое лицо, заключившее договор на обслуживание.</p>
                  <p><strong>Посетитель:</strong> Конечный клиент, сканирующий QR-код для отправки отзыва.</p>
                  <p><strong>Рабочий день:</strong> Пн-Пт, за исключением официальных праздников в Республике Молдова.</p>
                </>
              ) : (
                <>
                  <p><strong>Platforma:</strong> Software-ul QRate.md, dashboard-ul și infrastructura cloud.</p>
                  <p><strong>Utilizator:</strong> Persoana juridică sau fizică care contractează serviciile.</p>
                  <p><strong>Vizitator:</strong> Clientul final care scanează codul QR pentru feedback.</p>
                  <p><strong>Zi Lucrătoare:</strong> Luni–Vineri, excluzând sărbătorile legale din Republica Moldova.</p>
                </>
              )}
            </div>
          </section>

          {/* 1. Identificare */}
          <section className="space-y-4 border-l-4 border-blue-600 pl-6 py-2">
            <h2 className="flex items-center gap-3 text-xl font-black text-slate-950 uppercase tracking-tighter">
              <Building2 className="text-blue-600" size={20} /> 1. {isRu ? 'Данные Исполнителя' : 'Datele Prestatorului'}
            </h2>
            <div className="bg-slate-50 p-6 rounded-2xl space-y-2 text-sm font-medium">
              <p><strong>{isRu ? 'Компания:' : 'Compania:'}</strong> QR RATING S.R.L.</p>
              <p><strong>IDNO:</strong> 1026023041245</p>
              <p><strong>{isRu ? 'Юридический адрес:' : 'Adresă Juridică:'}</strong> {isRu ? 'мун. Орхей, ул. Сэлчиилор 75, Республика Молдова' : 'mun. Orhei, str. Sălciilor 75, Republica Moldova'}</p>
              <p><strong>{isRu ? 'Поддержка:' : 'Contact Suport:'}</strong> hello@qrate.md</p>
              <p><strong>{isRu ? 'Сайт:' : 'Site web:'}</strong> www.qrate.md</p>
            </div>
          </section>

          {/* 2. Servicii Digitale */}
          <section className="space-y-4">
            <h2 className="flex items-center gap-3 text-xl font-black text-slate-950 uppercase tracking-tighter">
              <Zap className="text-blue-600" size={20} /> 2. {isRu ? 'Доставка цифрового продукта' : 'Livrarea Produsului Digital'}
            </h2>
            <p>
              {isRu
                ? <><strong>QRate.md</strong> — SaaS-платформа (программное обеспечение как услуга). Доступ к панели управления активируется мгновенно после подтверждения оплаты через <strong>maib</strong>. Пользователь получит email-подтверждение сразу после транзакции.</>
                : <><strong>QRate.md</strong> este o platformă SaaS (Software as a Service). Accesul la Dashboard este activat instantaneu după confirmarea plății prin <strong>maib</strong>. Utilizatorul va primi un email de confirmare imediat după tranzacție.</>}
            </p>
          </section>

          {/* 3. Abonamente */}
          <section className="space-y-4">
            <h2 className="flex items-center gap-3 text-xl font-black text-slate-950 uppercase tracking-tighter">
              <CreditCard className="text-blue-600" size={20} /> 3. {isRu ? 'Тарифы и оплата' : 'Abonamente și Plăți'}
            </h2>
            <div className="space-y-3 text-sm">
              <p>{isRu
                ? <><strong>Пробный период:</strong> 7 дней полного доступа бесплатно, без необходимости ввода платёжных данных.</>
                : <><strong>Perioadă de probă:</strong> 7 zile acces complet gratuit, fără card bancar.</>}</p>
              <p>{isRu
                ? <><strong>Тарифы:</strong> START 450 MDL, GROW 700 MDL, SCALE 1 050 MDL, PRO 1 300 MDL, PRO+ 1 500 MDL, ENTERPRISE 1 700 MDL/мес. Все цены включают НДС.</>
                : <><strong>Planuri:</strong> START 450 MDL, GROW 700 MDL, SCALE 1.050 MDL, PRO 1.300 MDL, PRO+ 1.500 MDL, ENTERPRISE 1.700 MDL/lună. Prețurile includ TVA.</>}</p>
              <p>{isRu
                ? <><strong>Оплата:</strong> Через защищённый шлюз <strong>maib</strong> (Visa/Mastercard). QR RATING S.R.L. не хранит данные банковской карты.</>
                : <><strong>Plata:</strong> Prin gateway-ul securizat <strong>maib</strong> (Visa/Mastercard). QR RATING S.R.L. nu stochează datele cardului.</>}</p>
              <p>{isRu
                ? <><strong>Отмена:</strong> Через Dashboard → Подписка, минимум за 24 часа до даты списания. Доступ сохраняется до конца оплаченного периода.</>
                : <><strong>Anulare:</strong> Din Dashboard → Abonament, cu cel puțin 24h înainte de scadență. Accesul se menține până la expirarea perioadei plătite.</>}</p>
            </div>
          </section>

          {/* 4. Securitate */}
          <section className="bg-slate-950 text-white p-8 rounded-[2.5rem] space-y-6">
            <h2 className="flex items-center gap-3 text-xl font-black uppercase tracking-tighter">
              <ShieldCheck className="text-blue-400" size={24} /> 4. {isRu ? 'Безопасность транзакций' : 'Securitatea Tranzacțiilor'}
            </h2>
            <p className="text-slate-400 text-sm italic">
              {isRu
                ? <>Платежи обрабатываются через <strong>maib</strong> (Moldova Agroindbank S.A.). QRate.md не хранит данные банковских карт.</>
                : <>Plățile sunt procesate prin <strong>maib</strong> (Moldova Agroindbank S.A.). QRate.md nu stochează datele cardului bancar.</>}
            </p>
            <div className="grid md:grid-cols-2 gap-6 text-xs leading-relaxed opacity-90">
              <div className="space-y-2 border-l border-white/10 pl-4">
                <h3 className="font-black uppercase text-blue-400 tracking-widest text-[9px]">{isRu ? 'Защита:' : 'Protecție:'}</h3>
                <p>{isRu
                  ? <>Транзакции защищены протоколом <strong>3D-Secure</strong>. Данные передаются напрямую на зашифрованные серверы maib.</>
                  : <>Tranzacțiile sunt securizate prin <strong>3D-Secure</strong>. Datele sunt transmise direct la serverele criptate maib.</>}</p>
              </div>
              <div className="space-y-2 border-l border-white/10 pl-4">
                <h3 className="font-black uppercase text-blue-400 tracking-widest text-[9px]">{isRu ? 'Рекуррентные платежи:' : 'Plăți recurente:'}</h3>
                <p>{isRu
                  ? <>Автоматическое списание ежемесячно. Отмена — в любое время через Dashboard минимум за 24 часа.</>
                  : <>Debitare automată lunară. Anulare oricând din Dashboard cu cel puțin 24h înainte.</>}</p>
              </div>
            </div>
          </section>

          {/* 5. Limitarea Răspunderii */}
          <section className="space-y-4">
            <h2 className="flex items-center gap-3 text-xl font-black text-slate-950 uppercase tracking-tighter">
              <Scale className="text-blue-600" size={20} /> 5. {isRu ? 'Ограничение ответственности' : 'Limitarea Răspunderii'}
            </h2>
            <div className="text-sm space-y-3">
              <p>{isRu
                ? 'QRate.md обеспечивает доступность сервиса на уровне 99.9%. Мы не несём ответственности за:'
                : 'QRate.md depune eforturi pentru disponibilitate 99.9%. Nu suntem responsabili pentru:'}</p>
              <ul className="list-disc pl-5 space-y-2 text-slate-500 italic">
                {isRu ? (
                  <>
                    <li>Коммерческие решения, принятые Пользователем на основе отзывов.</li>
                    <li>Технические сбои maib или поставщиков хостинга.</li>
                    <li>Использование QR-кодов способами, нарушающими законодательство РМ.</li>
                    <li>Совокупная ответственность не превышает суммы, уплаченной за последние 3 месяца.</li>
                  </>
                ) : (
                  <>
                    <li>Deciziile comerciale luate de Utilizator bazate pe recenzii.</li>
                    <li>Defecțiuni tehnice ale maib sau furnizorilor de hosting.</li>
                    <li>Utilizarea codurilor QR contrar legislației RM de către Utilizator.</li>
                    <li>Responsabilitatea totală nu depășește suma plătită în ultimele 3 luni.</li>
                  </>
                )}
              </ul>
            </div>
          </section>

          {/* 6. Protecția Consumatorului */}
          <section className="space-y-4">
            <h2 className="flex items-center gap-3 text-xl font-black text-slate-950 uppercase tracking-tighter">
              <AlertCircle className="text-blue-600" size={20} /> 6. {isRu ? 'Защита прав потребителей' : 'Protecția Consumatorului'}
            </h2>
            <p className="text-sm">
              {isRu
                ? <>Жалобы направляйте на <strong>hello@qrate.md</strong>. Срок ответа — не более 14 рабочих дней.</>
                : <>Reclamațiile se depun la <strong>hello@qrate.md</strong>. Termen de răspuns: maxim 14 zile lucrătoare.</>}
            </p>
            <div className="bg-red-50/50 border border-red-100 p-6 rounded-2xl text-[13px] italic">
              {isRu ? (
                <>
                  <p>La nerezolvare amiabilă, conform Legii 105/2003, Pользователь poate sesiza <strong>Inspectoratul de Stat pentru Supravegherea Produselor Nealimentare și Protecția Consumatorilor</strong>:</p>
                  <p className="mt-2 font-bold text-red-900">mun. Chișinău, str. Vasile Alecsandri, 78.</p>
                </>
              ) : (
                <>
                  <p>În caz de nesoluționare amiabilă, conform Legii 105/2003, Utilizatorul poate sesiza <strong>Inspectoratul de Stat pentru Supravegherea Produselor Nealimentare și Protecția Consumatorilor</strong>:</p>
                  <p className="mt-2 font-bold text-red-900">mun. Chișinău, str. Vasile Alecsandri, 78.</p>
                </>
              )}
            </div>
          </section>

          {/* 7. Stocarea Datelor */}
          <section className="space-y-4">
            <h2 className="flex items-center gap-3 text-xl font-black text-slate-950 uppercase tracking-tighter">
              <Database className="text-blue-600" size={20} /> 7. {isRu ? 'Хранение данных' : 'Stocarea Datelor'}
            </h2>
            <p className="text-sm">
              {isRu
                ? 'Транзакционные данные (счета) хранятся 5 лет согласно законодательству о бухучёте РМ. Данные аккаунта удаляются через 30 дней после закрытия, если иное не предусмотрено законом.'
                : 'Datele tranzacționale (facturile) se păstrează 5 ani conform legislației contabile RM. Datele contului se șterg la 30 zile după închidere, dacă nu există obligație legală contrară.'}
            </p>
          </section>

          {/* 8. Modificări */}
          <section className="space-y-4">
            <h2 className="flex items-center gap-3 text-xl font-black text-slate-950 uppercase tracking-tighter">
              <RefreshCw className="text-blue-600" size={20} /> 8. {isRu ? 'Изменения условий' : 'Modificarea Termenilor'}
            </h2>
            <p className="text-sm">
              {isRu
                ? 'QR RATING S.R.L. poate modifica aceste condiții cu notificarea Utilizatorilor prin email cu cel puțin 14 zile înainte. Continuarea utilizării reprezintă acceptarea noilor condiții.'
                : 'QR RATING S.R.L. poate modifica acești termeni cu notificarea Utilizatorilor prin email cu cel puțin 14 zile înainte. Continuarea utilizării reprezintă acceptarea noilor termeni.'}
            </p>
          </section>

          {/* 9. Legea aplicabilă */}
          <section className="bg-slate-100 p-6 rounded-2xl space-y-3">
            <h2 className="flex items-center gap-3 text-lg font-black text-slate-950 uppercase tracking-tighter">
              <Scale className="text-blue-600" size={18} /> 9. {isRu ? 'Применимое право' : 'Legea Aplicabilă'}
            </h2>
            <p className="text-sm text-slate-600">
              {isRu
                ? 'Настоящий договор регулируется законодательством Республики Молдова. Споры рассматриваются в компетентных судах Республики Молдова.'
                : 'Prezentul contract este guvernat de legea Republicii Moldova. Litigiile se soluționează de instanțele competente din Republica Moldova.'}
            </p>
          </section>

        </div>

        {/* FOOTER */}
        <div className="mt-20 pt-10 border-t border-slate-100 flex flex-col md:flex-row justify-between gap-8">
          <div className="space-y-3">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              {isRu ? 'Юридическая информация' : 'Juridic & Suport'}
            </p>
            <div className="flex items-center gap-3 text-slate-700">
              <Mail size={14} />
              <span className="text-xs font-bold uppercase tracking-widest">hello@qrate.md</span>
            </div>
            <p className="text-xs text-slate-400">
              QR RATING S.R.L. · IDNO 1026023041245<br />
              {isRu ? 'мун. Орхей, ул. Сэлчиилор 75' : 'mun. Orhei, str. Sălciilor 75'}
            </p>
          </div>
          <div className="flex flex-col gap-2 self-center">
            <Link href={`/${locale}/privacy`} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors">
              {isRu ? '→ Политика конфиденциальности' : '→ Politica de Confidențialitate'}
            </Link>
            <Link href={`/${locale}/refund`} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors">
              {isRu ? '→ Политика возврата' : '→ Politica de Rambursare'}
            </Link>
          </div>
        </div>

      </main>
    </div>
  );
}