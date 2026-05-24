'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useTranslations } from 'next-intl';

import {
  Star,
  Loader2,
  Trophy,
  MessageSquare,
  Zap,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  location_id: string;
  employee_id?: string | null;
  photo_url?: string | null;
  full_name?: string | null;
  phone?: string | null;

  locations?: {
    name: string;
  } | null;

  employees?: {
    name: string;
    position?: string;
    photo_url?: string;
  } | null;
}

interface BasicInfo {
  id: string;
  name: string;
}

export default function AllReviewsDashboard() {
  const params = useParams();
  const router = useRouter();

  const locale = (params?.locale as 'ro' | 'ru') || 'ro';

  const t = useTranslations('AdminReviews');
  const tStats = useTranslations('EmployeeStats.stats');
  const tCommon = useTranslations('Dashboard');

  const [reviews, setReviews] = useState<Review[]>([]);
  const [locations, setLocations] = useState<BasicInfo[]>([]);
  const [employees, setEmployees] = useState<BasicInfo[]>([]);

  const [companyId, setCompanyId] = useState<string | null>(null);

  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedEmployee, setSelectedEmployee] = useState('all');

  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 10;

  const generateSmartReply = (rev: Review) => {
    const clientName =
      rev.full_name || (locale === 'ru' ? 'Клиент' : 'Client');

    const empName = rev.employees?.name;

    if (rev.rating >= 4) {
      return `Bună ziua ${clientName}! Mulțumim pentru recenzia oferită${
        empName ? ` pentru ${empName}` : ''
      }. Vă mai așteptăm cu drag!`;
    }

    return `Bună ziua ${clientName}. Ne pare rău pentru experiența avută${
      empName ? ` cu ${empName}` : ''
    }. Vom analiza situația.`;
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);

    setCopiedId(id);

    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const checkAccessAndCompany = useCallback(async () => {
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      router.push(`/${locale}/login`);
      return;
    }

    const { data: company } = await supabase
      .from('companies')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    if (company) {
      setCompanyId(company.id);
    }

    setHasAccess(true);
  }, [locale, router]);

  const loadInitialData = useCallback(async (cId: string) => {
    const [locRes, empRes] = await Promise.all([
      supabase
        .from('locations')
        .select('id, name')
        .eq('company_id', cId)
        .order('name'),

      supabase
        .from('employees')
        .select('id, name')
        .eq('company_id', cId)
        .order('name')
    ]);

    setLocations(locRes.data || []);
    setEmployees(empRes.data || []);
  }, []);

  const loadReviews = useCallback(async () => {
    if (!companyId) return;

    setLoading(true);

    let query = supabase
      .from('reviews')
      .select(`
        id,
        rating,
        comment,
        created_at,
        location_id,
        employee_id,
        photo_url,
        full_name,
        phone,

        locations (
          name
        ),

        employees:employee_id (
          name,
          position,
          photo_url
        )
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (selectedLocation !== 'all') {
      query = query.eq('location_id', selectedLocation);
    }

    if (selectedEmployee !== 'all') {
      query = query.eq('employee_id', selectedEmployee);
    }

    const { data, error } = await query;

    if (error) {
      console.error(error);
    }

    setReviews((data as any) || []);

    setLoading(false);
  }, [companyId, selectedLocation, selectedEmployee]);

  useEffect(() => {
    checkAccessAndCompany();
  }, [checkAccessAndCompany]);

  useEffect(() => {
    if (companyId) {
      loadInitialData(companyId);
    }
  }, [companyId, loadInitialData]);

  useEffect(() => {
    if (companyId) {
      loadReviews();
    }
  }, [companyId, loadReviews]);

  const paginatedReviews = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;

    return reviews.slice(start, start + ITEMS_PER_PAGE);
  }, [reviews, currentPage]);

  const totalPages = Math.ceil(reviews.length / ITEMS_PER_PAGE);

  const smartStats = useMemo(() => {
    if (!reviews.length) {
      return {
        avg: '0.0',
        count: 0,
        bestEmp: '-'
      };
    }

    const avg =
      reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;

    let employeeMap: Record<
      string,
      {
        total: number;
        count: number;
      }
    > = {};

    reviews.forEach((r) => {
      const name = r.employees?.name;

      if (!name) return;

      if (!employeeMap[name]) {
        employeeMap[name] = {
          total: 0,
          count: 0
        };
      }

      employeeMap[name].total += r.rating;
      employeeMap[name].count += 1;
    });

    let bestEmp = '-';
    let bestAvg = 0;

    Object.entries(employeeMap).forEach(([name, data]) => {
      const avg = data.total / data.count;

      if (avg > bestAvg) {
        bestAvg = avg;
        bestEmp = name;
      }
    });

    return {
      avg: avg.toFixed(1),
      count: reviews.length,
      bestEmp
    };
  }, [reviews]);

  if (hasAccess === null) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <header className="py-8">
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
            <Zap className="text-blue-600" />
            {t('title')}
          </h1>
        </header>

        {/* FILTERS */}

        <div className="bg-white rounded-3xl border border-gray-100 p-6 mb-8 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

            <FilterGroup
              label="Locație"
              value={selectedLocation}
              onChange={setSelectedLocation}
              options={locations}
              allLabel="Toate locațiile"
            />

            <FilterGroup
              label="Angajat"
              value={selectedEmployee}
              onChange={setSelectedEmployee}
              options={employees}
              allLabel="Toți angajații"
            />

          </div>
        </div>

        {/* STATS */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">

          <StatCard
            label={tCommon('stats.avg_rating')}
            value={`${smartStats.avg}/5`}
            icon={<Star className="text-yellow-400" />}
          />

          <StatCard
            label={tCommon('stats.hero_day')}
            value={smartStats.bestEmp}
            icon={<Trophy className="text-orange-500" />}
          />

          <StatCard
            label={tStats('volume')}
            value={String(smartStats.count)}
            icon={<MessageSquare className="text-blue-600" />}
          />

        </div>

        {/* REVIEWS */}

        <div className="space-y-4">

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-blue-600" />
            </div>
          ) : (
            paginatedReviews.map((rev) => (
              <ReviewCard
                key={rev.id}
                rev={rev}
                generateSmartReply={generateSmartReply}
                copyToClipboard={copyToClipboard}
                copiedId={copiedId}
              />
            ))
          )}

        </div>

        {/* PAGINATION */}

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-10">

            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center disabled:opacity-40"
            >
              <ChevronLeft size={18} />
            </button>

            <span className="font-bold text-sm">
              {currentPage} / {totalPages}
            </span>

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center disabled:opacity-40"
            >
              <ChevronRight size={18} />
            </button>

          </div>
        )}

      </div>
    </div>
  );
}

function FilterGroup({
  label,
  value,
  onChange,
  options,
  allLabel
}: any) {
  return (
    <div className="flex flex-col gap-2 min-w-0">

      <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
        {label}
      </span>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm font-semibold text-gray-700 w-full min-w-0"
      >
        <option value="all">{allLabel}</option>

        {options.map((o: any) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>

    </div>
  );
}

function StatCard({ label, value, icon }: any) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 flex items-center gap-4">

      <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-[10px] uppercase font-black tracking-wider text-gray-400">
          {label}
        </p>

        <h3 className="text-xl font-black break-words">
          {value}
        </h3>
      </div>

    </div>
  );
}

function ReviewCard({
  rev,
  generateSmartReply,
  copyToClipboard,
  copiedId
}: any) {
  const reply = generateSmartReply(rev);

  return (
    <div className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm overflow-hidden">

      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">

        <div className="flex-1 min-w-0">

          <p className="text-slate-700 italic break-words leading-relaxed">
            "{rev.comment || 'Fără comentariu'}"
          </p>

          <div className="flex flex-wrap gap-2 mt-4">

            <span className="bg-gray-100 px-3 py-1 rounded-full text-[11px] font-bold break-words">
              👤 {rev.employees?.name || 'Angajat General'}
            </span>

            <span className="bg-gray-100 px-3 py-1 rounded-full text-[11px] font-bold break-words">
              📍 {rev.locations?.name || '-'}
            </span>

          </div>

        </div>

        <div className="text-xs text-gray-400 font-bold whitespace-nowrap">
          {new Date(rev.created_at).toLocaleDateString()}
        </div>

      </div>

      <div className="mt-5 bg-gray-50 rounded-2xl p-4">

        <p className="text-sm text-gray-700 italic break-words">
          "{reply}"
        </p>

        <button
          onClick={() => copyToClipboard(reply, rev.id)}
          className="mt-4 h-11 px-5 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center gap-2"
        >
          {copiedId === rev.id ? (
            <>
              <Check size={16} />
              Copiat
            </>
          ) : (
            <>
              <Copy size={16} />
              Copiază
            </>
          )}
        </button>

      </div>

    </div>
  );
}