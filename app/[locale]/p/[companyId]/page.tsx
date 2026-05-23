'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from 'lucide-react';

export default function PublicProfilePage({ params }: { params: { companyId: string; locale: string } }) {
  const [company, setCompany] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadData() {
      const { data: companyData } = await supabase
        .from('companies')
        .select('*')
        .eq('id', params.companyId)
        .single();

      const { data: employeesData } = await supabase
        .from('employees')
        .select('*')
        .eq('company_id', params.companyId);

      setCompany(companyData);
      setEmployees(employeesData || []);
      setLoading(false);
    }
    loadData();
  }, [params.companyId]);

  const handleSubmitReview = async () => {
    if (!selectedEmployee || !rating) return;

    setSubmitting(true);

    const { error } = await supabase.from('reviews').insert({
      company_id: params.companyId,
      employee_id: selectedEmployee.id,
      location_id: selectedEmployee.location_id || null,
      rating,
      comment: comment || null,
      full_name: 'Client'
    });

    if (!error) {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setComment('');
        setRating(5);
        setSelectedEmployee(null);
      }, 2500);
    }
    setSubmitting(false);
  };

  if (loading) return <div className="p-12 text-center text-lg">Se încarcă...</div>;
  if (!company) return <div className="p-12 text-center text-red-600">Compania nu a fost găsită.</div>;

  return (
    <div className="max-w-xl mx-auto p-6">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-black tracking-tight">{company.name}</h1>
        <p className="text-slate-500 mt-3 text-lg">Lasă o recenzie sinceră</p>
      </div>

      <div className="bg-white rounded-3xl border p-8 shadow-sm">
        <div className="mb-6">
          <label className="block text-sm font-bold mb-2 text-slate-700">Selectează angajatul</label>
          <select
            value={selectedEmployee?.id || ''}
            onChange={(e) => setSelectedEmployee(employees.find(em => em.id === e.target.value))}
            className="w-full border border-slate-300 rounded-2xl px-4 py-3 text-lg focus:outline-none focus:border-blue-500"
          >
            <option value="">-- Alege un angajat --</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name} {emp.position && `• ${emp.position}`}
              </option>
            ))}
          </select>
        </div>

        {selectedEmployee && (
          <>
            <div className="mb-6">
              <label className="block text-sm font-bold mb-3 text-slate-700">Câte stele dai?</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className={`text-5xl transition-all active:scale-90 ${star <= rating ? 'text-yellow-400' : 'text-slate-200'}`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-8">
              <label className="block text-sm font-bold mb-2 text-slate-700">Comentariu (opțional)</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Cum a fost experiența ta?"
                className="w-full border border-slate-300 rounded-2xl p-4 h-32 resize-y focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              onClick={handleSubmitReview}
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white py-4 rounded-2xl font-black text-lg disabled:opacity-60 transition-all"
            >
              {submitting ? "Se trimite..." : "Trimite recenzia"}
            </button>

            {success && (
              <div className="mt-6 text-center text-emerald-600 font-bold text-lg">
                ✅ Mulțumim! Recenzia a fost salvată.
              </div>
            )}
          </>
        )}

        {!selectedEmployee && employees.length === 0 && (
          <div className="text-center py-8 text-slate-400">
            Nu sunt angajați înregistrați încă.
          </div>
        )}
      </div>

      <div className="text-center mt-8 text-xs text-slate-400">
        QRate.md • Recenzii reale • Moldova
      </div>
    </div>
  );
}