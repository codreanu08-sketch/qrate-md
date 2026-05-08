'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MapPin, Users, MessageSquare, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Sidebar() {
  const pathname = usePathname();

  const menuItems = [
    { name: 'Dashboard', href: '/ro/dashboard', icon: Home },
    { name: 'Locații', href: '/ro/locations', icon: MapPin },
    { name: 'Angajați', href: '/ro/employees', icon: Users },
    { name: 'Recenzii', href: '/ro/reviews', icon: MessageSquare },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/ro/auth/login';
  };

  return (
    <div className="w-72 bg-white h-screen border-r shadow-sm fixed overflow-y-auto z-50">
      <div className="p-8">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-12">
          <div className="text-4xl font-bold text-blue-600">Qrate</div>
          <div className="text-4xl font-bold text-emerald-600">.md</div>
        </div>

        {/* Meniu principal */}
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-6 py-4 rounded-2xl text-[17px] font-medium transition-all ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Buton Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-6 py-4 rounded-2xl text-[17px] font-medium text-red-600 hover:bg-red-50 w-full mt-8"
        >
          <LogOut className="w-5 h-5" />
          Ieșire din cont
        </button>
      </div>
    </div>
  );
}