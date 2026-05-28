// components/MapView.tsx
// Hartă Moldova cu pinuri per locație — folosește Leaflet + OpenStreetMap (gratuit)

'use client';

import { useEffect, useRef } from 'react';

interface Location {
  id: string;
  name: string;
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
  avgRating?: number;
  reviewCount?: number;
}

interface MapViewProps {
  locations: Location[];
  onSelectLocation?: (id: string) => void;
  selectedLocationId?: string | null;
  locale?: string;
}

// Moldova center
const MOLDOVA_CENTER: [number, number] = [47.0105, 28.8638];
const DEFAULT_ZOOM = 8;

// Culoare pin după rating
function getPinColor(rating?: number): string {
  if (!rating || rating === 0) return '#94a3b8'; // gri — fără recenzii
  if (rating >= 4) return '#10b981';              // verde
  if (rating >= 3) return '#f59e0b';              // galben
  return '#ef4444';                               // roșu
}

function createPinSVG(color: string, rating: number | undefined, isSelected: boolean): string {
  const size = isSelected ? 44 : 36;
  const label = rating ? rating.toFixed(1) : '—';
  return `
    <svg width="${size}" height="${size + 10}" viewBox="0 0 44 54" xmlns="http://www.w3.org/2000/svg">
      <filter id="shadow">
        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.3)"/>
      </filter>
      <circle cx="22" cy="22" r="${isSelected ? 21 : 18}" fill="${color}" filter="url(#shadow)" stroke="white" stroke-width="2.5"/>
      <text x="22" y="27" text-anchor="middle" font-family="system-ui, sans-serif" font-size="11" font-weight="900" fill="white">${label}</text>
      <polygon points="22,${isSelected ? 44 : 40} 15,${isSelected ? 35 : 31} 29,${isSelected ? 35 : 31}" fill="${color}"/>
    </svg>
  `;
}

export default function MapView({ locations, onSelectLocation, selectedLocationId, locale = 'ro' }: MapViewProps) {
  const mapRef = useRef<any>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (mapInstanceRef.current) return; // deja inițializat

    // Import dinamic Leaflet (evită SSR errors)
    import('leaflet').then((L) => {
      // Fix Leaflet default icons
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      if (!mapRef.current) return;

      const map = L.map(mapRef.current, {
        center: MOLDOVA_CENTER,
        zoom: DEFAULT_ZOOM,
        zoomControl: true,
        scrollWheelZoom: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
      updateMarkers(L, map);
    });

    // Import CSS Leaflet
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
  }, []);

  // Update markeri când se schimbă locațiile sau selecția
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    import('leaflet').then((L) => {
      updateMarkers(L, mapInstanceRef.current);
    });
  }, [locations, selectedLocationId]);

  function updateMarkers(L: any, map: any) {
    // Șterge markerii vechi
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const bounds: [number, number][] = [];

    locations.forEach((loc) => {
      const lat = loc.latitude || MOLDOVA_CENTER[0] + (Math.random() - 0.5) * 0.5;
      const lng = loc.longitude || MOLDOVA_CENTER[1] + (Math.random() - 0.5) * 0.8;
      const color = getPinColor(loc.avgRating);
      const isSelected = loc.id === selectedLocationId;

      const svgString = createPinSVG(color, loc.avgRating, isSelected);
      const iconUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));

      const icon = L.icon({
        iconUrl,
        iconSize: isSelected ? [44, 54] : [36, 46],
        iconAnchor: isSelected ? [22, 54] : [18, 46],
        popupAnchor: [0, -50],
      });

      const marker = L.marker([lat, lng], { icon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family: system-ui; min-width: 160px;">
            <p style="font-weight: 900; font-size: 13px; text-transform: uppercase; margin: 0 0 4px 0; color: #1e293b;">${loc.name}</p>
            ${loc.address ? `<p style="font-size: 11px; color: #64748b; margin: 0 0 6px 0;">📍 ${loc.address}</p>` : ''}
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-size: 18px; font-weight: 900; color: ${color};">${loc.avgRating ? loc.avgRating.toFixed(1) : '—'}</span>
              <span style="font-size: 11px; color: #94a3b8; font-weight: 600;">${loc.reviewCount || 0} ${locale === 'ru' ? 'отзывов' : 'recenzii'}</span>
            </div>
          </div>
        `);

      marker.on('click', () => {
        if (onSelectLocation) onSelectLocation(loc.id);
      });

      markersRef.current.push(marker);
      bounds.push([lat, lng]);
    });

    // Zoom automat pe toate locațiile
    if (bounds.length > 0) {
      try {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
      } catch {
        map.setView(MOLDOVA_CENTER, DEFAULT_ZOOM);
      }
    }
  }

  return (
    <div className="relative">
      <div ref={mapRef} className="w-full rounded-3xl overflow-hidden border border-slate-200" style={{ height: '400px', zIndex: 0 }} />
      
      {/* Legendă */}
      <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-lg border border-slate-100 flex items-center gap-4 z-[400]">
        {[
          { color: '#10b981', label: locale === 'ru' ? '≥4★' : '≥4★' },
          { color: '#f59e0b', label: '3★' },
          { color: '#ef4444', label: '≤2★' },
          { color: '#94a3b8', label: locale === 'ru' ? 'Fără date' : 'Fără date' },
        ].map(item => (
          <div key={item.color} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-[10px] font-black text-slate-600 uppercase">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}