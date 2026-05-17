// components/Logo.tsx
export const Logo = () => (
  <div className="flex items-center gap-2">
    <svg width="150" height="40" viewBox="0 0 450 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="15" y="20" width="60" height="60" rx="16" fill="#2563EB" />
      <rect x="28" y="33" width="7" height="7" rx="1.5" fill="white" fillOpacity="0.9"/>
      <rect x="38" y="33" width="7" height="7" rx="1.5" fill="white" fillOpacity="0.4"/>
      <rect x="28" y="43" width="7" height="7" rx="1.5" fill="white" fillOpacity="0.4"/>
      <path d="M52 52L55 58H61L56 62L58 68L52 64L46 68L48 62L43 58H49L52 52Z" fill="white"/>
      <text x="90" y="64" font-family="Inter, sans-serif" font-weight="900" font-size="52" letter-spacing="-2">
        <tspan fill="#2563EB">QRate</tspan><tspan fill="#10B981">.MD</tspan>
      </text>
    </svg>
  </div>
);