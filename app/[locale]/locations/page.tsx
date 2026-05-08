'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { Plus, Printer, MapPin, Eye, Trash2, Download } from 'lucide-react';
import QRCode from 'qrcode';
import Sidebar from '../../../components/Sidebar';

export default function Locations() {
  const router = useRouter();
  const { locale = 'ro' } = useParams<{ locale: string }>();

  const [locations, setLocations] = useState<any[]>([]);
  const [newLocation, setNewLocation] = useState({ name: '', address: '' });

  const [qrData, setQrData] = useState<Record<string, string>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('qrate_qrcodes_v3');
      return saved ? JSON.parse(saved) : {};
    }
    return {};
  });

  useEffect(() => {
    loadLocations();
  }, []);

  useEffect(() => {
    localStorage.setItem('qrate_qrcodes_v3', JSON.stringify(qrData));
  }, [qrData]);

  async function loadLocations() {
    const { data } = await supabase
      .from('locations')
      .select('*')
      .order('created_at', { ascending: false });
    setLocations(data || []);
  }

  const addLocation = async () => {
    if (!newLocation.name.trim()) return alert("Introdu numele locației!");

    const { data: newLoc, error } = await supabase
      .from('locations')
      .insert(newLocation)
      .select()
      .single();

    if (error) return alert("Eroare la adăugare locație");

    setNewLocation({ name: '', address: '' });
    await generateQR(newLoc);
    loadLocations();
  };

  const generateQR = async (location: any) => {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `http://${window.location.hostname}:3000`;
    const reviewUrl = `${baseUrl}/${locale}/review/location/${location.id}`;

    try {
      const qr = await QRCode.toDataURL(reviewUrl, { width: 512, margin: 2 });
      setQrData(prev => ({ ...prev, [location.id]: qr }));
    } catch (err) {
      console.error(err);
    }
  };

  const deleteLocation = async (id: string, name: string) => {
    if (!confirm(`Sigur ștergi "${name}"?`)) return;

    await supabase.from('locations').delete().eq('id', id);

    setQrData(prev => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });

    loadLocations();
  };

  // Print fără nume locație (doar QR-ul)
  const printQR = (qrUrl: string) => {
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(`
        <html>
          <head><title>QR Code</title></head>
          <body style="text-align:center; padding:40px; font-family:Arial;">
            <img src="${qrUrl}" style="width:420px; margin:20px;" />
            <p style="color:#555; font-size:18px; margin-top:30px;">Scanează pentru a lăsa o recenzie</p>
          </body>
        </html>
      `);
      win.document.close();
      setTimeout(() => win.print(), 500);
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="ml-72 flex-1 p-8">
        <h1 className="text-4xl font-bold mb-8">Locațiile mele</h1>

        {/* Formular adăugare */}
        <div className="bg-white rounded-3xl p-8 shadow-xl mb-10">
          <h2 className="text-2xl font-semibold mb-6">Adaugă locație nouă</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <input
              type="text"
              placeholder="Nume locație"
              value={newLocation.name}
              onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
              className="px-5 py-4 border rounded-2xl"
            />
            <input
              type="text"
              placeholder="Adresă completă"
              value={newLocation.address}
              onChange={(e) => setNewLocation({ ...newLocation, address: e.target.value })}
              className="px-5 py-4 border rounded-2xl"
            />
            <button
              onClick={addLocation}
              className="bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl flex items-center justify-center gap-2 font-medium"
            >
              <Plus /> Adaugă & Generează QR
            </button>
          </div>
        </div>

        {/* Lista locații */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {locations.map((loc) => {
            const qrUrl = qrData[loc.id];

            return (
              <div
                key={loc.id}
                onClick={() => router.push(`/${locale}/locations/${loc.id}`)}
                className="bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all relative cursor-pointer"
              >
                <button
                  onClick={(e) => { e.stopPropagation(); deleteLocation(loc.id, loc.name); }}
                  className="absolute top-6 right-6 text-red-500 hover:text-red-700 z-10"
                >
                  <Trash2 size={24} />
                </button>

                <div className="flex gap-4">
                  <MapPin className="w-8 h-8 text-blue-600 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-xl">{loc.name}</h3>
                    {loc.address && <p className="text-gray-500">{loc.address}</p>}
                  </div>
                </div>

                {/* QR Code - mai sus */}
                {qrUrl && (
                  <div className="mt-6 text-center">
                    <img src={qrUrl} alt="QR" className="mx-auto rounded-2xl shadow-xl" />

                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={(e) => { e.stopPropagation(); printQR(qrUrl); }}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-2xl"
                      >
                        <Printer /> Print
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation();
                          const a = document.createElement('a');
                          a.href = qrUrl;
                          a.download = `QR-${loc.name}.png`;
                          a.click();
                        }}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-2xl"
                      >
                        <Download /> Descarcă
                      </button>
                    </div>
                  </div>
                )}

                <div className="mt-6">
                  <button
                    onClick={(e) => { e.stopPropagation(); router.push(`/${locale}/locations/${loc.id}`); }}
                    className="w-full bg-gray-800 hover:bg-black text-white py-4 rounded-2xl"
                  >
                    <Eye className="inline mr-2" /> Vezi Recenzii
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}