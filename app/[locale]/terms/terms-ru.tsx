import React from 'react';
import { Shield, Eye, Lock, Share2, UserCheck, Clock, Building2 } from 'lucide-react';

export function PrivacyRu() {
  return (
    <>
      <article className="mb-16 space-y-4">
        <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
          <Shield size={14} /> Защита данных — Закон № 133/2011
        </div>
        <h1 className="text-5xl font-[900] tracking-tighter text-slate-950 uppercase leading-none">
          Политика <br /><span className="text-emerald-600 italic">Конфиденциальности</span>
        </h1>
        <p className="text-slate-500 font-medium italic">Мы защищаем данные вашего бизнеса ответственно и прозрачно.</p>
        <p className="text-xs text-slate-400">Последнее обновление: Январь 2026</p>
      </article>

      <div className="space-y-12 text-slate-600 leading-relaxed text-[15px]">

        <section className="space-y-4">
          <h2 className="flex items-center gap-3 text-xl font-black text-slate-950 uppercase tracking-tighter">
            <Building2 className="text-emerald-600" size={20} /> 1. Оператор данных
          </h2>
          <div className="bg-slate-50 p-6 rounded-2xl space-y-2 text-sm">
            <p><strong>QR RATING S.R.L.</strong>, IDNO 1026023041245</p>
            <p>mun. Orhei, str. Sălciilor 75, Republica Moldova</p>
            <p>Email по вопросам защиты данных: suport@qrate.md</p>
          </div>
          <p className="text-sm">Настоящая политика применяется в соответствии с <strong>Законом № 133/2011 о защите персональных данных</strong> Республики Молдова.</p>
        </section>

        <section className="space-y-4">
          <h2 className="flex items-center gap-3 text-xl font-black text-slate-950 uppercase tracking-tighter">
            <Eye className="text-emerald-600" size={20} /> 2. Категории собираемых данных
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-slate-50 p-5 rounded-2xl space-y-2">
              <h3 className="font-bold text-slate-950 text-sm uppercase">Данные аккаунта</h3>
              <ul className="text-xs space-y-1 list-disc pl-4">
                <li>Адрес электронной почты (уникальный идентификатор)</li>
                <li>Зашифрованный пароль (hash bcrypt — не хранится в открытом виде)</li>
                <li>Название компании / бренда</li>
              </ul>
            </div>
            <div className="bg-slate-50 p-5 rounded-2xl space-y-2">
              <h3 className="font-bold text-slate-950 text-sm uppercase">Платёжные данные</h3>
              <ul className="text-xs space-y-1 list-disc pl-4">
                <li>IDNO / фискальный код (юридические лица)</li>
                <li>Юридический адрес</li>
                <li>Email для счетов</li>
                <li>Данные банковской карты не хранятся</li>
              </ul>
            </div>
            <div className="bg-slate-50 p-5 rounded-2xl space-y-2">
              <h3 className="font-bold text-slate-950 text-sm uppercase">Операционные данные</h3>
              <ul className="text-xs space-y-1 list-disc pl-4">
                <li>Отзывы, собранные от конечных клиентов</li>
                <li>Номера телефонов (если конечный клиент предоставляет добровольно)</li>
                <li>Фотографии, прикреплённые к отзывам</li>
                <li>GPS-координаты локаций</li>
              </ul>
            </div>
            <div className="bg-slate-50 p-5 rounded-2xl space-y-2">
              <h3 className="font-bold text-slate-950 text-sm uppercase">Технические данные</h3>
              <ul className="text-xs space-y-1 list-disc pl-4">
                <li>IP-адрес (для безопасности)</li>
                <li>Обязательные сессионные cookie</li>
                <li>Анонимизированные журналы доступа</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="space-y-4 border-l-4 border-emerald-600 pl-6 py-2">
          <h2 className="text-xl font-black text-slate-950 uppercase tracking-tighter">3. Правовая основа и цели обработки</h2>
          <div className="space-y-3 text-sm">
            <p><strong>Исполнение договора</strong> (ст. 5 лит. b Закона 133/2011): обрабатываем данные аккаунта и платёжные данные для предоставления сервиса.</p>
            <p><strong>Согласие</strong>: данные конечных клиентов (отзывы, телефон) собираются с явного согласия через форму отзыва.</p>
            <p><strong>Законный интерес</strong>: журналы безопасности и предотвращение мошенничества.</p>
            <p><strong>Юридическое обязательство</strong>: хранение фискальных данных согласно бухгалтерскому законодательству Молдовы.</p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="flex items-center gap-3 text-xl font-black text-slate-950 uppercase tracking-tighter">
            <Share2 className="text-emerald-600" size={20} /> 4. Третьи стороны и передача данных
          </h2>
          <div className="space-y-3 text-sm">
            <p>Данные обрабатываются следующими суб-операторами:</p>
            <ul className="space-y-2">
              <li className="bg-slate-50 p-3 rounded-xl"><strong>Supabase Inc.</strong> — облачная инфраструктура и база данных (США, стандартные договорные условия)</li>
              <li className="bg-slate-50 p-3 rounded-xl"><strong>maib (Moldova Agroindbank S.A.)</strong> — обработка платежей (Республика Молдова)</li>
              <li className="bg-slate-50 p-3 rounded-xl"><strong>Telegram Messenger</strong> — отправка уведомлений (персональные данные не передаются, только тексты оповещений)</li>
              <li className="bg-slate-50 p-3 rounded-xl"><strong>Vercel Inc.</strong> — хостинг и CDN (США)</li>
            </ul>
            <p>Мы не продаём и не передаём ваши данные третьим лицам в маркетинговых целях.</p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="flex items-center gap-3 text-xl font-black text-slate-950 uppercase tracking-tighter">
            <Lock className="text-emerald-600" size={20} /> 5. Безопасность данных
          </h2>
          <div className="space-y-3 text-sm">
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Зашифрованные соединения <strong>HTTPS/TLS</strong> для всех коммуникаций</li>
              <li>Политики <strong>Row Level Security (RLS)</strong> в Supabase</li>
              <li>Пароли хранятся исключительно как криптографические хэши</li>
              <li>Аутентификация через Supabase Auth (JWT)</li>
              <li>Данные банковской карты обрабатываются исключительно maib — QRate не хранит</li>
            </ul>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="flex items-center gap-3 text-xl font-black text-slate-950 uppercase tracking-tighter">
            <Clock className="text-emerald-600" size={20} /> 6. Срок хранения данных
          </h2>
          <div className="space-y-2 text-sm">
            <p>• <strong>Данные активного аккаунта:</strong> на время подписки + 30 дней после отмены</p>
            <p>• <strong>Фискальные данные:</strong> 5 лет (согласно бухгалтерскому законодательству Молдовы)</p>
            <p>• <strong>Отзывы и операционные данные:</strong> на время контракта</p>
            <p>• <strong>Технические журналы:</strong> 90 дней</p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="flex items-center gap-3 text-xl font-black text-slate-950 uppercase tracking-tighter">
            <UserCheck className="text-emerald-600" size={20} /> 7. Ваши права
          </h2>
          <p className="text-sm">Согласно Закону № 133/2011 вы имеете право на:</p>
          <div className="grid md:grid-cols-2 gap-3 text-sm">
            {[
              ['Доступ', 'Запросить копию обрабатываемых данных'],
              ['Исправление', 'Скорректировать неверные данные'],
              ['Удаление', 'Потребовать удаления данных (право на забвение)'],
              ['Возражение', 'Возразить против обработки в определённых обстоятельствах'],
              ['Переносимость', 'Получить данные в структурированном формате'],
              ['Отзыв согласия', 'В любое время без негативных последствий'],
            ].map(([title, desc]) => (
              <div key={title} className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                <p className="font-black text-emerald-800 text-xs uppercase">{title}</p>
                <p className="text-xs text-emerald-700 mt-1">{desc}</p>
              </div>
            ))}
          </div>
          <p className="text-sm mt-4">
            Реализуйте свои права по email: <strong>suport@qrate.md</strong>. Ответим в течение 30 дней. Вы также вправе подать жалобу в <strong>Национальный центр защиты персональных данных Республики Молдова</strong>.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-black text-slate-950 uppercase tracking-tighter">8. Cookie-файлы</h2>
          <div className="space-y-3 text-sm">
            <p>Мы используем исключительно обязательные технические cookie для:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Поддержания аутентифицированной сессии (JWT-токен)</li>
              <li>Предпочтения языка (ro/ru)</li>
            </ul>
            <p>Мы не используем трекинговые или рекламные cookie третьих сторон.</p>
          </div>
        </section>

      </div>
    </>
  );
}