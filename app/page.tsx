'use client';

import { Star, QrCode, Users, Award, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Navbar */}
      <nav className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
              Qrate
            </div>
            <span className="text-emerald-600 font-semibold text-xl">.md</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="#features" className="hover:text-blue-600 transition">Funcționalități</a>
            <a href="#pricing" className="hover:text-blue-600 transition">Prețuri</a>
            <a href="/ro/auth/login" className="text-blue-600 font-semibold">Autentificare</a>
          </div>

          <a href="/ro/auth/register" 
             className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-2xl font-semibold transition flex items-center gap-2">
            Încearcă gratuit 7 zile
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-24 text-center px-6">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-6xl md:text-7xl font-bold tracking-tighter text-gray-900 mb-6">
            Recenzii care <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-600">te ajută să crești</span>
          </h1>
          <p className="text-2xl text-gray-600 max-w-3xl mx-auto mb-10">
            Clienții scanează un cod QR și lasă recenzii instant. Tu vezi totul în timp real.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/ro/auth/register" 
               className="bg-gradient-to-r from-blue-600 to-emerald-600 text-white text-xl px-10 py-5 rounded-3xl font-semibold hover:scale-105 transition">
              Începe gratuit
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-16">Tot ce ai nevoie</h2>
          <div className="grid md:grid-cols-3 gap-10">
            <div className="text-center">
              <QrCode className="w-16 h-16 mx-auto text-blue-600 mb-6" />
              <h3 className="text-2xl font-semibold mb-3">QR Code Instant</h3>
              <p className="text-gray-600">Pentru companie sau per angajat</p>
            </div>
            <div className="text-center">
              <Users className="w-16 h-16 mx-auto text-emerald-600 mb-6" />
              <h3 className="text-2xl font-semibold mb-3">Locații & Angajați</h3>
              <p className="text-gray-600">Gestionează multiple locații și echipe</p>
            </div>
            <div className="text-center">
              <Award className="w-16 h-16 mx-auto text-amber-600 mb-6" />
              <h3 className="text-2xl font-semibold mb-3">Analize & Alerte</h3>
              <p className="text-gray-600">Recenzii negative pe Telegram instant</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}