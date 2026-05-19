import React from 'react';
import { RefreshCw, FileWarning, ShieldAlert, Scale, HelpCircle } from 'lucide-react';

export function RefundRu() {
  return (
    <>
      {/* Titlu H1 Unic per pagină */}
      <article className="mb-16 space-y-4">
        <div className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
          <RefreshCw size={14} className="text-blue-600" /> Аннулирование и Возврат средств
        </div>
        <h1 className="text-5xl font-[900] tracking-tighter text-slate-950 uppercase leading-none">
          Политика <br /><span className="text-blue-600 italic">Возврата Средств</span>
        </h1>
        <p className="text-slate-500 font-medium italic">
          Правила отказа от услуг и условия возврата платежей maib.
        </p>
      </article>

      {/* Structură iерархическая H2 */}
      <div className="space-y-12 text-slate-600 leading-relaxed text-[15px]">
        
        {/* Secțiunea 1: Natura Produsului Digital */}
        <section className="space-y-4">
          <h2 className="flex items-center gap-3 text-xl font-black text-slate-950 uppercase tracking-tighter">
            <FileWarning className="text-blue-600" size={20} /> 1. Природа цифрового контента
          </h2>
          <p>
            Сервис <strong>QRate.md</strong> предоставляет программное обеспечение как услугу (SaaS). Доступ к Dashboard и генерации QR-кодов предоставляется мгновенно после верификации платежа банком. В соответствии с <strong>Законом № 105/2003 о защите прав потребителей</strong> в Республике Молдова, право на отзыв (отказ от договора) в течение 14 дней <strong>не применяется</strong> к цифровому контенту, если исполнение началось с явного согласия потребителя.
          </p>
        </section>

        {/* Secțiunea 2: Abonamente Lunare și Anuale */}
        <section className="space-y-4 border-l-4 border-blue-600 pl-6 py-2">
          <h2 className="text-xl font-black text-slate-950 uppercase tracking-tighter">
            2. Условия для подписок (Абонементов)
          </h2>
          <div className="bg-slate-50 p-6 rounded-2xl space-y-3 font-medium text-sm text-slate-800">
            <p>• <strong>Рекуррентные платежи:</strong> Средства, списанные за текущий расчетный период (месяц или год), не подлежат частичному или полному возврату, так как услуга считается оказанной с момента предоставления доступа.</p>
            <p>• <strong>Отмена подписки:</strong> Вы можете бесплатно отменить автопродление в любой момент через Dashboard (Раздел «Подписка») минимум за 24 часа до даты следующего списания. Доступ к функциям сохранится до конца оплаченного периода.</p>
          </div>
        </section>

        {/* Secțiunea 3: Excepții și Cazuri de Rambursare */}
        <section className="space-y-4">
          <h2 className="flex items-center gap-3 text-xl font-black text-slate-950 uppercase tracking-tighter">
            <ShieldAlert className="text-blue-600" size={20} /> 3. Исключения и право на технический возврат
          </h2>
          <p>
            Возврат денежных средств на банковскую карту Пользователя может быть осуществлен исключительно в следующих форс-мажорных ситуациях:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-sm italic">
            <li><strong>Критические сбои:</strong> Платформа QRate.md была полностью недоступна по вине Исполнителя более 72 часов подряд, что подтверждено нашей службой мониторинга.</li>
            <li><strong>Ошибочное двойное списание:</strong> Из-за технической ошибки платежного шлюза сумма была списана дважды за одну и ту же услугу.</li>
          </ul>
        </section>

        {/* Secțiunea 4: Procedura de Retur (Standard solicitat de Maib) */}
        <section className="bg-slate-950 text-white p-8 rounded-[2.5rem] space-y-6">
          <h2 className="flex items-center gap-3 text-xl font-black uppercase tracking-tighter">
            <Scale className="text-blue-400" size={24} /> 4. Процедура возврата платежей maib
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Все запросы обрабатываются совместно с банком-эквайером <strong>maib</strong>. В соответствии с правилами международных платежных систем (Visa / Mastercard), возврат не может быть выдан наличными.
          </p>
          <div className="grid md:grid-cols-2 gap-6 text-xs leading-relaxed opacity-90">
            <div className="space-y-2 border-l border-white/10 pl-4">
              <h3 className="font-black uppercase text-blue-400 tracking-widest text-[9px]">Куда отправлять:</h3>
              <p>Отправьте заявление в свободной форме на hello@qrate.md с указанием IDNO, даты транзакции и ID транзакции из письма от банка.</p>
            </div>
            <div className="space-y-2 border-l border-white/10 pl-4">
              <h3 className="font-black uppercase text-blue-400 tracking-widest text-[9px]">Сроки зачисления:</h3>
              <p>Одобренный возврат выполняется в течение 5-10 рабочих дней. Деньги возвращаются исключительно на ту карту, с которой была совершена оплата.</p>
            </div>
          </div>
        </section>

        {/* Secțiunea 5: Suport și Soluționare Conflicte */}
        <section className="space-y-4">
          <h2 className="flex items-center gap-3 text-xl font-black text-slate-950 uppercase tracking-tighter">
            <HelpCircle className="text-blue-600" size={20} /> 5. Разрешение споров
          </h2>
          <p className="text-sm">
            Перед обращением в регулирующие органы, мы просим связываться напрямую с поддержкой для мирного урегулирования ситуации. Срок рассмотрения официальных претензий — до 14 дней.
          </p>
        </section>
      </div>
    </>
  );
}