'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { Plus, Printer, User, Eye, Trash2, Download } from 'lucide-react';
// @ts-ignore
import QRCode from 'qrcode';
import Sidebar from '../../../components/Sidebar';

export default function Employees() {
  const router = useRouter();
  const { locale = 'ro' } = useParams<{ locale: string }>();

  const [employees, setEmployees] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);

  const [newName, setNewName] = useState('');
  const [newPosition, setNewPosition] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const [qrData, setQrData] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();
    const saved = localStorage.getItem('qrate_employee_qrcodes_final2');
    if (saved) {
      setQrData(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('qrate_employee_qrcodes_final2', JSON.stringify(qrData));
  }, [qrData]);

  async function loadData() {
    const [empRes, locRes] = await Promise.all([
      supabase.from('employees').select('*').order('created_at', { ascending: false }),
      supabase.from('locations').select('*').order('name')
    ]);

    setEmployees(empRes.data || []);
    setLocations(locRes.data || []);
  }

  const addEmployee = async () => {
    if (!newName.trim()) return alert("Introdu numele angajatului!");

    setLoading(true);

    let photoUrl = null;
    if (photo) {
      const fileName = `${Date.now()}-${photo.name}`;
      const { data } = await supabase.storage.from('employee-photos').upload(fileName, photo);
      if (data) photoUrl = data.path;
    }

    const { data: newEmp, error } = await supabase
      .from('employees')
      .insert({
        name: newName,
        position: newPosition || null,
        location_id: selectedLocationId || null,
        photo_url: photoUrl,
      })
      .select()
      .single();

    if (!error && newEmp) {
      setNewName('');
      setNewPosition('');
      setSelectedLocationId('');
      setPhoto(null);
      await generateQR(newEmp);
      loadData();
    } else {
      alert("Eroare la adăugare angajat");
    }
    setLoading(false);
  };

  const generateQR = async (employee: any) => {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `http://${window.location.hostname}:3000`;
    const reviewUrl = `${baseUrl}/${locale}/review/employee/${employee.id}`;

    try {
      const qr = await QRCode.toDataURL(reviewUrl, { width: 512, margin: 2 });
      setQrData(prev => ({ ...prev, [employee.id]: qr }));
    } catch (err) {
      console.error(err);
    }
  };

  const deleteEmployee = async (id: string, name: string) => {
    if (!confirm(`Sigur ștergi "${name}"?`)) return;
    await supabase.from('employees').delete().eq('id', id);
    loadData();
  };

  const printQR = (qrUrl: string, name: string) => {
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(`
        <html><head><title>QR - ${name}</title></head>
        <body style="text-align:center; padding:40px;">
          <img src="${qrUrl}" style="width:420px; margin:20px;" />
          <p style="color:#555; font-size:18px;">Scanează pentru recenzie</p>
        </body></html>
      `);
      win.document.close();
      setTimeout(() => win.print(), 500);
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="ml-72 flex-1 p-8">
        <h1 className="text-4xl font-bold mb-8">Angajații mei</h1>

        {/* Formular adăugare */}
        <div className="bg-white rounded-3xl p-8 shadow-xl mb-12">
          <h2 className="text-2xl font-semibold mb-6">Adaugă angajat nou</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <input type="text" placeholder="Nume complet" value={newName} onChange={(e) => setNewName(e.target.value)} className="px-5 py-4 border rounded-2xl" />
            <input type="text" placeholder="Funcție / Post" value={newPosition} onChange={(e) => setNewPosition(e.target.value)} className="px-5 py-4 border rounded-2xl" />
            
            <select value={selectedLocationId} onChange={(e) => setSelectedLocationId(e.target.value)} className="px-5 py-4 border rounded-2xl">
              <option value="">Alege Locația</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>

            <input type="file" accept="image/*" onChange={(e) => e.target.files && setPhoto(e.target.files[0])} className="px-5 py-4 border rounded-2xl" />
            
            <button onClick={addEmployee} disabled={loading || !newName} className="bg-blue-600 text-white py-4 rounded-2xl font-semibold disabled:opacity-70">
              {loading ? 'Se adaugă...' : 'Adaugă Angajat'}
            </button>
          </div>
        </div>

        {/* Lista angajați */}
        {employees.length === 0 ? (
          <p className="text-center py-20 text-gray-500">Încă nu sunt angajați adăugați.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {employees.map(emp => {
              const qrUrl = qrData[emp.id];

              return (
                <div 
                  key={emp.id} 
                  onClick={() => router.push(`/${locale}/employees/${emp.id}`)}
                  className="bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all relative cursor-pointer"
                >
                  <button onClick={(e) => { e.stopPropagation(); deleteEmployee(emp.id, emp.name); }} className="absolute top-6 right-6 text-red-500 hover:text-red-700 z-10">
                    <Trash2 size={24} />
                  </button>

                  {emp.photo_url ? (
                    <img src={`https://xtsecrskyoswwulkhgll.supabase.co/storage/v1/object/public/employee-photos/${emp.photo_url}`} className="w-28 h-28 rounded-full mx-auto mb-6 object-cover border-4 border-white shadow" />
                  ) : (
                    <div className="w-28 h-28 bg-gray-100 rounded-full mx-auto mb-6 flex items-center justify-center">
                      <User className="w-14 h-14 text-gray-400" />
                    </div>
                  )}

                  <h3 className="text-center font-semibold text-xl">{emp.name}</h3>
                  {emp.position && <p className="text-center text-gray-500">{emp.position}</p>}

                  {qrUrl && (
                    <div className="mt-6 text-center">
                      <img src={qrUrl} alt="QR" className="mx-auto rounded-2xl shadow-xl" />
                      <div className="flex gap-3 mt-4">
                        <button onClick={(e) => { e.stopPropagation(); printQR(qrUrl, emp.name); }} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-2xl">
                          <Printer /> Print
                        </button>
                        <button onClick={(e) => { e.stopPropagation();
                          const a = document.createElement('a');
                          a.href = qrUrl;
                          a.download = `QR-${emp.name}.png`;
                          a.click();
                        }} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-2xl">
                          <Download /> Descarcă
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="mt-6">
                    <button onClick={(e) => { e.stopPropagation(); router.push(`/${locale}/employees/${emp.id}`); }} className="w-full bg-gray-800 hover:bg-black text-white py-4 rounded-2xl">
                      <Eye className="inline mr-2" /> Vezi Recenzii
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}