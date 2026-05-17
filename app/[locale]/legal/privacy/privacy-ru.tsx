import React from 'react';
import { Shield, Eye, Lock, Share2, UserCheck, Clock } from 'lucide-react';

export function PrivacyRu() {
  return (
    <>
      {/* СЕМАНТИКА SEO */}
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

      {/* ИЕРАРХИЧЕСКАЯ СТРУКТУРА H2 И H3 */}
      <div className="space-y-12 text-slate-600 leading-relaxed text-[15px]">
        
        {/* 1. Категории собираемых данных */}
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

        {/* 2. Законные основания для обработки */}
        <section className="space-y-4 border-l-4 border-emerald-600 pl-6 py-2">
          <h2 className="text-xl font-black text-slate-950 uppercase tracking-tighter">
            2. Законные основания для обработки
          </h2>
          <p className="text-sm">
            Мы обрабатываем ваши данные в соответствии с <strong>Законом № 133/2011</strong> о защите персональных данных в Республике Молдова, основываясь на:
          </p>
          <ul className="list-disc pl-5 text-sm space-y-2 italic">
            <li><strong>Исполнение договора:</strong> Для предоставления доступа к услугам платформы.</li>
            <li><strong>Юридическое обязательство:</strong> Для налоговой отчетности и предотвращения незаконных действий.</li>
            <li><strong>Согласие:</strong> Для маркетинговых коммуникаций (где вы дали явное согласие).</li>
          </ul>
        </section>

        {/* 3. Безопасность и шифрование данных */}
        <section className="space-y-4">
          <h2 className="flex items-center gap-3 text-xl font-black text-slate-950 uppercase tracking-tighter">
            <Lock className="text-emerald-600" size={20} /> 3. Безопасность и шифрование данных
          </h2>
          <p>
            Все соединения с <strong>QRate.MD</strong> защищены протоколом <strong>HTTPS (SSL/TLS)</strong>. Данные хранятся в безопасных базах данных, изолированных с помощью строгих политик безопасности на уровне строк (Row Level Security). Пароли обрабатываются исключительно с использованием алгоритма асимметричного хеширования, что делает невозможным их чтение в открытом виде.
          </p>
        </section>

        {/* 4. Передача данных третьим лицам */}
        <section className="space-y-4">
          <h2 className="flex items-center gap-3 text-xl font-black text-slate-950 uppercase tracking-tighter">
            <Share2 className="text-emerald-600" size={20} /> 4. Передача данных третьим лицам
          </h2>
          <p>
            QRate.md не продает и не сдает в аренду ваши коммерческие данные. Передача данных осуществляется исключительно ключевым поставщикам услуг:
          </p>
          <ul className="list-disc pl-5 text-sm space-y-1 text-slate-500">
            <li><strong>Платежный процессор (maib):</strong> Передача платежных данных для завершения безопасных транзакций.</li>
            <li><strong>Сервисы облачной инфраструктуры:</strong> Для безопасного хостинга баз данных и серверов приложений.</li>
          </ul>
        </section>

        {/* 5. Ваши законные права */}
        <section className="space-y-4">
          <h2 className="flex items-center gap-3 text-xl font-black text-slate-950 uppercase tracking-tighter">
            <UserCheck className="text-emerald-600" size={20} /> 5. Ваши законные права
          </h2>
          <p>
            В соответствии с законодательством Республики Молдова (Закон 133/2011), вы обладаете следующими фундаментальными правами:
          </p>
          <div className="bg-slate-50 p-6 rounded-2xl grid md:grid-cols-3 gap-4 text-xs font-medium">
            <div>
              <span className="text-emerald-600 font-bold block mb-1">Право на доступ:</span>
              Вы можете запросить копию всех данных, которые мы храним о вашем бизнесе.
            </div>
            <div>
              <span className="text-emerald-600 font-bold block mb-1">Право на исправление:</span>
              Вы можете изменить неверную информацию в любое время прямо из Панели управления.
            </div>
            <div>
              <span className="text-emerald-600 font-bold block mb-1">Право на удаление:</span>
              Вы можете запросить закрытие аккаунта и окончательное удаление всех данных (право быть забытым).
            </div>
          </div>
        </section>

        {/* 6. Период хранения данных */}
        <section className="space-y-4">
          <h2 className="flex items-center gap-3 text-xl font-black text-slate-950 uppercase tracking-tighter">
            <Clock className="text-emerald-600" size={20} /> 6. Период хранения данных
          </h2>
          <p>
            Операционные данные, собранные с помощью QR-кодов, хранятся на наших серверах до тех пор, пока ваш аккаунт активен. Подтверждающие фискальные документы, сгенерированные в результате транзакций через <strong>maib</strong>, хранятся в течение 6 лет в соответствии с национальными стандартами бухгалтерского учета РМ.
          </p>
        </section>
      </div>
    </>
  );
}