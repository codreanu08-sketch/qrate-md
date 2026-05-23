'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Star, User, MapPin } from 'lucide-react';

export default function PublicProfilePage({ params }: { params: { companyId: string } }) {
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
      rating: rating,
      comment: comment || null,
      full_name: 'Client anonim'
    });

    if (!error) {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setComment('');
        setRating(5);
        setSelectedEmployee(null);
      }, 2000);
    }
    setSubmitting(false);
  };

  if (loading) return <div className="p-8 text-center">Se încarcă...</div>;
  if (!company) return <div className="p-8 text-center text-red-600">Compania nu a fost găsită.</div>;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-black">{company.name}</h1>
        <p className="text-slate-500 mt-2">Lasă o recenzie sinceră</p>
      </div>

      {/* Selectează angajatul */}
      <div className="mb-6">
        <label className="block text-sm font-bold mb-2">Cui vrei să lași recenzie?</label>
        <select 
          value={selectedEmployee?.id || ''} 
          onChange={(e) => {
            const emp = employees.find(em => em.id === e.target.value);
            setSelectedEmployee(emp);
          }}
          className="w-full border rounded-xl p-3"
        >
          <option value="">-- Selectează un angajat --</option>
          {employees.map(emp => (
            <option key={emp.id} value={emp.id}>
              {emp.name} {emp.position ? `(${emp.position})` : ''}
            </option>
          ))}
        </select>
      </div>

      {selectedEmployee && (
        <div className="bg-white border rounded-3xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-100 p-3 rounded-2xl">
              <User className="text-blue-600" />
            </div>
            <div>
              <p className="font-bold">{selectedEmployee.name}</p>
              <p className="text-sm text-slate-500">{selectedEmployee.position}</p>
            </div>
          </div>

          {/* Rating */}
          <div className="mb-4">
            <label className="block text-sm font-bold mb-2">Câte stele dai?</label>
            <div className="flex gap-2">
              {[1,2,3,4,5].map(star => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className={`text-3xl transition-all ${star <= rating ? 'text-yellow-400' : 'text-slate-300'}`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          {/* Comentariu */}
          <div className="mb-6">
            <label className="block text-sm font-bold mb-2">Comentariu (opțional)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Cum a fost experiența ta?"
              className="w-full border rounded-2xl p-4 h-28 resize-y"
            />
          </div>

          <button
            onClick={handleSubmitReview}
            disabled={submitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-black disabled:opacity-50"
          >
            {submitting ? 'Se trimite...' : 'Trimite recenzia'}
          </button>

          {success && (
            <div className="mt-4 text-center text-emerald-600 font-bold">
              ✅ Mulțumim! Recenzia a fost trimisă.
            </div>
          )}
        </div>
      )}

      {!selectedEmployee && employees.length > 0 && (
        <div className="text-center text-slate-400 text-sm">
          Selectează un angajat pentru a lăsa o recenzie
        </div>
      )}
    </div>
  );
}