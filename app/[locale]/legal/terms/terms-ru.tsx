import React from 'react';
import { Zap, FileText, Gavel, ShieldCheck, Scale, AlertCircle, Database, RefreshCw } from 'lucide-react';

export function TermsRu() {
  return (
    <>
      {/* HEADERUL ARTICOLULUI */}
      <article className="mb-16 space-y-4">
        <div className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
          <Gavel size={14} /> Публичная оферта (Договор присоединения)
        </div>
        <h1 className="text-5xl font-[900] tracking-tighter text-slate-950 uppercase leading-none">
          Условия и <br /><span className="text-blue-600 italic">Положения</span>
        </h1>
        <p className="text-slate-500 font-medium italic">
          Последнее обновление: 12 мая 2026 г.
        </p>
      </article>

      {/* SECTIUNILE DE TEXT LEGAL */}
      <div className="space-y-12 text-slate-600 leading-relaxed text-[15px]">
        
        {/* Secțiunea 0 */}
        <section className="space-y-4">
          <h2 className="flex items-center gap-3 text-xl font-black text-slate-950 uppercase tracking-tighter">
            <FileText className="text-blue-600" size={20} /> 0. Определения
          </h2>
          <div className="bg-slate-50 p-6 rounded-2xl text-[13px] grid md:grid-cols-2 gap-4 italic font-medium">
            <p><strong>Платформа:</strong> Программное обеспечение QRate.md, панель управления и облачная инфраструктура.</p>
            <p><strong>Пользователь:</strong> Юридическое лицо (SRL/ÎI), заключившее договор на обслуживание.</p>
            <p><strong>Посетитель:</strong> Конечный клиент, сканирующий QR-код для отправки отзыва.</p>
            <p><strong>Рабочий день:</strong> С понедельника по пятницу, за исключением официальных праздников в РМ.</p>
          </div>
        </section>

        {/* Secțiunea 1 */}
        <section className="space-y-4 border-l-4 border-blue-600 pl-6 py-2">
          <h2 className="text-xl font-black text-slate-950 uppercase tracking-tighter">
            1. Данные Исполнителя
          </h2>
          <div className="bg-slate-50 p-6 rounded-2xl space-y-2 text-sm font-medium">
            <p><strong>Компания:</strong> S.R.L. "QR SOLUTIONS GROUP"</p>
            <p><strong>IDNO:</strong> 102XXXXXXXXXX</p>
            <p><strong>Юридический адрес:</strong> mun. Chișinău, str. [Adresa ta], Republica Moldova</p>
            <p><strong>Поддержка:</strong> hello@qrate.md</p>
          </div>
        </section>

        {/* Secțiunea 2 */}
        <section className="space-y-4">
          <h2 className="flex items-center gap-3 text-xl font-black text-slate-950 uppercase tracking-tighter">
            <Zap className="text-blue-600" size={20} /> 2. Доставка цифрового продукта
          </h2>
          <p>
            Услуги <strong>QRate.MD</strong> предоставляются исключительно в цифровом виде. Доступ к панели управления (Dashboard) активируется автоматически и мгновенно после подтверждения оплаты через платежную систему <strong>maib</strong>. Пользователь получит электронное письмо с подтверждением доступа сразу после совершения транзакции.
          </p>
        </section>

        {/* Secțiunea 3 */}
        <section className="bg-slate-950 text-white p-8 rounded-[2.5rem] space-y-6">
          <h2 className="flex items-center gap-3 text-xl font-black uppercase tracking-tighter">
            <ShieldCheck className="text-blue-400" size={24} /> 3. Безопасность транзакций
          </h2>
          <p className="text-slate-400 text-sm italic">
            Платежи безопасно обрабатываются через <strong>maib</strong>. QRate.md не хранит данные вашей банковской карты.
          </p>
          <div className="grid md:grid-cols-2 gap-6 text-xs leading-relaxed opacity-90">
            <div className="space-y-2 border-l border-white/10 pl-4">
              <h3 className="font-black uppercase text-blue-400 tracking-widest text-[9px]">Защита:</h3>
              <p>Транзакции защищены протоколом <strong>3D-Secure</strong>. Данные передаются напрямую на зашифрованные банковские серверы.</p>
            </div>
            <div className="space-y-2 border-l border-white/10 pl-4">
              <h3 className="font-black uppercase text-blue-400 tracking-widest text-[9px]">Подписки:</h3>
              <p>Рекуррентные платежи могут быть отменены в любое время через Dashboard не менее чем за 24 часа до даты списания.</p>
            </div>
          </div>
        </section>

        {/* Secțiunea 4 */}
        <section className="space-y-4">
          <h2 className="flex items-center gap-3 text-xl font-black text-slate-950 uppercase tracking-tighter">
            <Scale className="text-blue-600" size={20} /> 4. Ограничение ответственности
          </h2>
          <div className="text-sm space-y-3 italic">
            <p>QRate.md стремится к доступности сервиса на уровне 99.9%. Тем не менее, мы не несем ответственности за:</p>
            <ul className="list-disc pl-5 space-y-2 text-slate-500">
              <li>Коммерческие решения, принятые Пользователем на основе полученных отзывов.</li>
              <li>Технические сбои платежного процессора (maib) или хостинг-провайдеров.</li>
              <li>Использование QR-кодов Пользователем способами, нарушающими местное законодательство.</li>
            </ul>
          </div>
        </section>

        {/* Secțiunea 5 */}
        <section className="space-y-4">
          <h2 className="flex items-center gap-3 text-xl font-black text-slate-950 uppercase tracking-tighter">
            <AlertCircle className="text-blue-600" size={20} /> 5. Защита прав потребителей
          </h2>
          <p>Жалобы можно направлять по адресу <strong>hello@qrate.md</strong>. Максимальный срок ответа составляет 14 дней.</p>
          <div className="bg-red-50/50 border border-red-100 p-6 rounded-2xl text-[13px] italic">
            <p>В случае неурегулирования спора мирным путем, в соответствии с Законом 105/2003, вы можете обратиться в <strong>Государственную инспекцию по надзору за непищевыми продуктами и защите прав потребителей</strong>:</p>
            <p className="mt-2 font-bold text-red-900">г. Кишинев, ул. Василе Александри, 78.</p>
          </div>
        </section>

        {/* Secțiunea 6 */}
        <section className="space-y-4">
          <h2 className="flex items-center gap-3 text-xl font-black text-slate-950 uppercase tracking-tighter">
            <Database className="text-blue-600" size={20} /> 6. Хранение данных
          </h2>
          <p className="text-sm">
            Транзакционные данные (инвойсы) хранятся в течение 6 лет в соответствии с законом о бухгалтерском учете РМ. Данные доступа удаляются через 12 месяцев после закрытия учетной записи, за исключением случаев, когда законодательством предусмотрено иное.
          </p>
        </section>

        {/* Secțiunea 7 */}
        <section className="space-y-4">
          <h2 className="flex items-center gap-3 text-xl font-black text-slate-950 uppercase tracking-tighter">
            <RefreshCw className="text-blue-600" size={20} /> 7. Изменения
          </h2>
          <p>
            QRate.md может изменять данные условия. Уведомление пользователей осуществляется по электронной почте не менее чем за 15 дней до вступления в силу новых цен или важных договорных условий.
          </p>
        </section>
      </div>
    </>
  );
}