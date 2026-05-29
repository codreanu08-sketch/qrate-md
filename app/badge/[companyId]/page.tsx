// app/badge/[companyId]/page.tsx

interface Props {
  params: Promise<{ companyId: string }>;
}

export default async function BadgePage({ params }: Props) {
  // ✅ Fix Next.js 16: params e async
  const { companyId } = await params;

  let data = null;
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.qrate.md';
    const res = await fetch(`${baseUrl}/api/badge/${companyId}`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) data = await res.json();
  } catch (e) {}

  if (!data || data.error) return <div style={{ display: 'none' }} />;

  const stars = Math.round(parseFloat(data.avg_rating || '0'));

  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            background: transparent;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 70px;
          }
          .badge {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            background: white;
            border: 1.5px solid #e2e8f0;
            border-radius: 14px;
            padding: 10px 16px;
            box-shadow: 0 2px 12px rgba(0,0,0,0.08);
            text-decoration: none;
            color: inherit;
            transition: box-shadow 0.2s;
            cursor: pointer;
            width: 260px;
            height: 70px;
          }
          .badge:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.12); }
          .logo { font-weight: 900; font-size: 13px; color: #1e293b; font-style: italic; white-space: nowrap; }
          .logo span { color: #3b82f6; }
          .divider { width: 1px; height: 28px; background: #e2e8f0; flex-shrink: 0; }
          .info { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
          .stars-row { display: flex; align-items: center; gap: 5px; }
          .stars { color: #fbbf24; font-size: 13px; letter-spacing: 1px; }
          .rating { font-weight: 900; font-size: 15px; color: #1e293b; }
          .count { font-size: 9px; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
          .verified { font-size: 9px; color: #10b981; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
        `}</style>
      </head>
      <body>
        <a href="https://www.qrate.md" target="_blank" rel="noreferrer" className="badge">
          <div className="logo">QRate<span>.md</span></div>
          <div className="divider"></div>
          <div className="info">
            <div className="stars-row">
              <span className="stars">{'★'.repeat(Math.max(0, Math.min(5, stars)))}{'☆'.repeat(Math.max(0, 5 - stars))}</span>
              <span className="rating">{data.avg_rating}</span>
            </div>
            <span className="count">{data.total_reviews} recenzii verificate</span>
            <span className="verified">✓ Verificat QRate</span>
          </div>
        </a>
      </body>
    </html>
  );
}