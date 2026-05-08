'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { Plus, Printer, User, Eye, Trash2, Download } from 'lucide-react';

// @ts-ignore - Această linie forțează TypeScript să ignore lipsa declarațiilor pentru qrcode pe Vercel
import QRCode from 'qrcode';
import Sidebar from '../../../components/Sidebar';

// Definim tipurile local pentru a nu depinde de module externe
interface Employee {
  id: string;
  name: string;
  position: string | null;
  location_id: string | null;
  photo_url: string | null;
  created_at: string;
}

interface Location {
  id: string;
  name: string;
}

export default function Employees() {
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale as string || 'ro';

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  
  const [newName, setNewName] = useState('');
  const [newPosition, setNewPosition] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const [qrData, setQrData] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (employees.length > 0) {
      employees.forEach(emp => {
        if (!qrData[emp.id]) {
          generateQR(emp);
        }
      });
    }
  }, [employees]);

  async function loadData() {
    const [empRes, locRes] = await Promise.all([
      supabase.from('employees').select('*').order('created_at', { ascending: false }),
      supabase.from('locations').select('*').order('name')
    ]);

    setEmployees(empRes.data || []);
    setLocations(locRes.data || []);
  }

  const generateQR = async (employee: Employee) => {
    // Ne asigurăm că window este definit (evităm erori de SSR)
    if (typeof window === 'undefined') return;

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const reviewUrl = `${baseUrl}/${locale}/review/employee/${employee.id}`;

    try {
      const qr = await QRCode.toDataURL(reviewUrl, { 
        width: 512, 
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' }
      });
      setQrData(prev => ({ ...prev, [employee.id]: qr }));
    } catch (err) {
      console.error('Error generating QR:', err);
    }
  };

  const addEmployee = async () => {
    if (!newName.trim()) return alert("Introdu numele angajatului!");

    setLoading(true);
    let photoPath = null;

    try {
      if (photo) {
        const fileExt = photo.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const { data, error: uploadError } = await supabase.storage
          .from('employee-photos')
          .upload(fileName, photo);
          
        if (uploadError) throw uploadError;
        photoPath = data.path;
      }

      const { data: newEmp, error } = await supabase
        .from('employees')
        .insert({
          name: newName,
          position: newPosition || null,
          location_id: selectedLocationId || null,
          photo_url: photoPath,
        })
        .select()
        .single();

      if (error) throw error;

      setNewName('');
      setNewPosition('');
      setSelectedLocationId('');
      setPhoto(null);
      
      await loadData();
    } catch (error: any) {
      alert(error.message || "Eroare la adăugare");
    } finally {
      setLoading(false);
    }
  };

  const deleteEmployee = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    if (!confirm(`Sigur ștergi "${name}"?`)) return;
    
    const { error } = await supabase.from('employees').delete().eq('id', id);
    if (!error) {
      setEmployees(prev => prev.filter(emp => emp.id !== id));
    }
  };

  const printQR = (e: React.MouseEvent, qrUrl: string, name: string) => {
    e.stopPropagation();
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(`
        <html><head><title>QR - ${name}</title></head>
        <body style="text-align:center; padding:40px; font-family:sans-serif;">
          <h2>${name}</h2>
          <img src="${qrUrl}" style="width:400px;" />
          <p>Scanează pentru a lăsa o recenzie</p>
        </body></html>
      `);
      win.document.close();
      setTimeout(() => {
        win.print();
        win.close();
      }, 500);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <main className="ml-72 flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
           <h1 className="text-4xl font-bold text-gray-800">Gestionare Angajați</h1>
        </div>

        {/* Formular adăugare */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 mb-12">
          <h2 className="text-xl font-semibold mb-6">Adaugă angajat nou</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <input 
              type="text" 
              placeholder="Nume complet" 
              value={newName} 
              onChange={(e) => setNewName(e.target.value)} 
              className="px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" 
            />
            <input 
              type="text" 
              placeholder="Funcție" 
              value={newPosition} 
              onChange={(e) => setNewPosition(e.target.value)} 
              className="px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" 
            />
            <select 
              value={selectedLocationId} 
              onChange={(e) => setSelectedLocationId(e.target.value)} 
              className="px-4 py-3 border rounded-xl outline-none"
            >
              <option value="">Alege Locația</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
            <input 
              type="file" 
              accept="image/*" 
              onChange={(e) => setPhoto(e.target.files?.[0] || null)} 
              className="text-sm self-center file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
            />
            <button 
              onClick={addEmployee} 
              disabled={loading || !newName} 
              className="bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition-colors disabled:bg-gray-400"
            >
              {loading ? 'Se salvează...' : 'Adaugă'}
            </button>
          </div>
        </div>

        {/* Listă */}
        {employees.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed">
            <p className="text-gray-500">Nu există angajați în listă.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {employees.map(emp => (
              <div 
                key={emp.id} 
                onClick={() => router.push(`/${locale}/employees/${emp.id}`)}
                className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer group relative"
              >
                <button 
                  onClick={(e) => deleteEmployee(e, emp.id, emp.name)} 
                  className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors z-10"
                >
                  <Trash2 size={20} />
                </button>

                <div className="flex flex-col items-center">
                  {emp.photo_url ? (
                    <img 
                      src={`https://xtsecrskyoswwulkhgll.supabase.co/storage/v1/object/public/employee-photos/${emp.photo_url}`} 
                      alt={emp.name}
                      className="w-24 h-24 rounded-full mb-4 object-cover border-2 border-blue-50 shadow-sm" 
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gray-100 rounded-full mb-4 flex items-center justify-center">
                      <User className="w-10 h-10 text-gray-400" />
                    </div>
                  )}

                  <h3 className="font-bold text-lg text-gray-900 text-center">{emp.name}</h3>
                  <p className="text-gray-500 text-sm mb-4">{emp.position || 'Angajat'}</p>

                  {qrData[emp.id] && (
                    <div className="w-full space-y-4">
                      <img src={qrData[emp.id]} alt="QR" className="w-32 h-32 mx-auto" />
                      <div className="flex gap-2">
                        <button 
                          onClick={(e) => printQR(e, qrData[emp.id], emp.name)} 
                          className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium"
                        >
                          <Printer size={16} /> Print
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            const a = document.createElement('a');
                            a.href = qrData[emp.id];
                            a.download = `QR-${emp.name}.png`;
                            a.click();
                          }} 
                          className="flex-1 flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-600 py-2 rounded-lg text-sm font-medium"
                        >
                          <Download size={16} /> Salvează
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <button className="w-full mt-6 flex items-center justify-center gap-2 bg-gray-900 text-white py-3 rounded-xl group-hover:bg-blue-600 transition-colors">
                    <Eye size={18} /> Profil & Recenzii
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}