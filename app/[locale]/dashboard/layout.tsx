import Sidebar from '@/components/Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row relative bg-slate-50">
      {/* Componenta Sidebar adaptabilă (Meniu lateral pe PC / Meniu jos pe Mobil) */}
      <Sidebar />

      {/* Zona conținutului principal (Nu mai permite scroll în dreapta) */}
      <div className="flex-1 w-full min-w-0 flex flex-col pl-0 md:pl-72 pb-20 md:pb-0 overflow-x-hidden">
        <main className="flex-1 p-4 sm:p-6 md:p-8 w-full max-w-full overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}