import Sidebar from '@/components/Sidebar';

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  // === FĂRĂ VERIFICARE SUBSCRIPTION (TEMPORAR) ===
  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row relative bg-slate-50">
      <Sidebar />
      <div className="flex-1 w-full min-w-0 flex flex-col pl-0 md:pl-72 pb-20 md:pb-0 overflow-x-hidden">
        <main className="flex-1 p-4 sm:p-6 md:p-8 w-full max-w-full overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}