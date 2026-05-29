import React from 'react';
import { RefreshCw, FileWarning, ShieldAlert, Scale, HelpCircle, Building2 } from 'lucide-react';

export function RefundRu() {
  return (
    <>
      <article className="mb-16 space-y-4">
        <div className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
          <RefreshCw size={14} className="text-blue-600" /> Политика возврата — maib
        </div>
        <h1 className="text-5xl font-[900] tracking-tighter text-slate-950 uppercase leading-none">
          Политика <br /><span className="text-blue-600 italic">Возврата Средств</span>
        </h1>
        <p className="text-slate-500 font-medium italic">
          Правила отказа от услуг и условия возврата платежей через maib.
        </p>
        <p className="text-xs text-slate-400">Последнее обновление: Январь 2026</p>
      </article>

      <div className="space-y-12 text-slate-600 leading-relaxed text-[15px]">

        <section className="space-y-4">
          <h2 className="flex items-center gap-3 text-xl font-black text-slate-950 uppercase tracking-tighter">
            <Building2 className="text-blue-600" size={20} /> Информация о Мерчанте
          </h2>
          <div className="bg-slate-50 p-6 rounded-2xl space-y-2 text-sm">
            <p><strong>QR RATING S.R.L.</strong> · IDNO: 1026023041245</p>
            <p>мун. Орхей, ул. Сэлчиилор 75, Республика Молдова</p>
            <p>Email: hello@qrate.md · Сайт: www.qrate.md</p>
            <p className="text-xs text-slate-400 pt-2 border-t border-slate-200 mt-3">Платежи обрабатываются через <strong>maib</strong> (Moldova Agroindbank S.A.) — финансовое учреждение, авторизованное Национальным банком Молдовы</p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="flex items-center gap-3 text-xl font-black text-slate-950 uppercase tracking-tighter">
            <FileWarning className="text-blue-600" size={20} /> 1. Природа цифрового продукта
          </h2>
          <p>
            Сервис <strong>QRate.md</strong> является SaaS-продуктом (программное обеспечение как услуга). Доступ к Dashboard и генерации QR-кодов предоставляется мгновенно после подтверждения платежа. В соответствии с <strong>Законом № 105/2003 о защите прав потребителей</strong> Республики Молдова, право на отказ в течение 14 дней <strong>не применяется</strong> к цифровому контенту, если исполнение началось с явного согласия потребителя.
          </p>
        </section>

        <section className="space-y-4 border-l-4 border-blue-600 pl-6 py-2">
          <h2 className="text-xl font-black text-slate-950 uppercase tracking-tighter">2. Условия рекуррентных подписок</h2>
          <div className="bg-slate-50 p-6 rounded-2xl space-y-3 font-medium text-sm text-slate-800">
            <p>• <strong>Рекуррентные платежи через maib:</strong> При активации платного плана Пользователь явно авторизует ежемесячное автоматическое списание через платёжный шлюз maib. Уже обработанные суммы за текущий период возврату не подлежат.</p>
            <p>• <strong>Отмена подписки:</strong> Пользователь может отменить автопродление в разделе Dashboard → Подписка минимум за 24 часа до даты следующего списания. Доступ сохраняется до окончания оплаченного периода.</p>
            <p>• <strong>Переход на более низкий тариф:</strong> Применяется со следующего расчётного периода.</p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="flex items-center gap-3 text-xl font-black text-slate-950 uppercase tracking-tighter">
            <ShieldAlert className="text-blue-600" size={20} /> 3. Исключительные случаи возврата
          </h2>
          <p>Возврат средств возможен <strong>исключительно</strong> в следующих ситуациях:</p>
          <ul className="list-disc pl-5 space-y-2 text-sm">
            <li><strong>Критические технические сбои:</strong> Платформа QRate.md была полностью недоступна по вине Исполнителя более <strong>72 часов подряд</strong>, подтверждено службой мониторинга.</li>
            <li><strong>Двойное списание (Double Charge):</strong> Транзакция была обработана дважды из-за технической ошибки шлюза maib.</li>
            <li><strong>Списание после подтверждённой отмены:</strong> Сумма была списана после того, как Пользователь корректно отменил подписку.</li>
          </ul>
        </section>

        <section className="bg-slate-950 text-white p-8 rounded-[2.5rem] space-y-6">
          <h2 className="flex items-center gap-3 text-xl font-black uppercase tracking-tighter">
            <Scale className="text-blue-400" size={24} /> 4. Процедура возврата (стандарт maib)
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Все операции возврата координируются в тесном сотрудничестве с банком-эквайером <strong>maib</strong>. Согласно правилам международных платёжных систем (Visa / Mastercard), <strong>возврат наличными невозможен</strong> — средства возвращаются исключительно на оригинальную банковскую карту плательщика.
          </p>
          <div className="grid md:grid-cols-2 gap-6 text-xs leading-relaxed opacity-90">
            <div className="space-y-2 border-l border-white/10 pl-4">
              <h3 className="font-black uppercase text-blue-400 tracking-widest text-[9px]">Как подать заявку на возврат:</h3>
              <p>Отправьте письмо на <strong>hello@qrate.md</strong> с темой «Запрос возврата», указав:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Название компании и IDNO</li>
                <li>Точную дату транзакции</li>
                <li>ID транзакции (из банковской выписки или письма-подтверждения)</li>
                <li>Подробную причину запроса</li>
              </ul>
            </div>
            <div className="space-y-2 border-l border-white/10 pl-4">
              <h3 className="font-black uppercase text-blue-400 tracking-widest text-[9px]">Сроки обработки:</h3>
              <p>• Подтверждение заявки: <strong>2 рабочих дня</strong></p>
              <p>• Рассмотрение и одобрение: <strong>5 рабочих дней</strong></p>
              <p>• Зачисление на карту (после одобрения): <strong>5-10 рабочих дней</strong> — зависит от банка-эмитента</p>
              <p className="mt-2 text-slate-500">Максимальный общий срок: <strong>15 рабочих дней</strong> с даты подачи заявки</p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="flex items-center gap-3 text-xl font-black text-slate-950 uppercase tracking-tighter">
            <HelpCircle className="text-blue-600" size={20} /> 5. Разрешение споров и Chargeback
          </h2>
          <p className="text-sm">
            Перед инициацией процедуры <strong>Chargeback</strong> в банке рекомендуем обратиться в поддержку QRate по адресу <strong>hello@qrate.md</strong> для урегулирования в досудебном порядке. Срок рассмотрения претензий — не более <strong>14 рабочих дней</strong>.
          </p>
          <p className="text-sm">
            Неурегулированные споры рассматриваются в компетентных судах Республики Молдова в соответствии с действующим законодательством.
          </p>
        </section>

      </div>
    </>
  );
}