// app/badge/[companyId]/page.tsx
// Pagina publică care afișează badge-ul embed

export default async function BadgePage({ params }: { params: { companyId: string } }) {
  let data = null;
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://www.qrate.md'}/api/badge/${params.companyId}`, {
      next: { revalidate: 3600 }
    });
    data = await res.json();
  } catch (e) {}

  if (!data || data.error) return <div style={{ display: 'none' }} />;

  const stars = Math.round(parseFloat(data.avg_rating));

  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { background: transparent; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
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
          }
          .badge:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.12); }
          .logo { font-weight: 900; font-size: 13px; color: #1e293b; font-style: italic; }
          .logo span { color: #3b82f6; }
          .divider { width: 1px; height: 28px; background: #e2e8f0; }
          .stars { color: #fbbf24; font-size: 14px; letter-spacing: 1px; }
          .rating { font-weight: 900; font-size: 16px; color: #1e293b; }
          .info { display: flex; flex-direction: column; }
          .count { font-size: 10px; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
          .verified { display: flex; align-items: center; gap: 3px; font-size: 9px; color: #10b981; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
        `}</style>
      </head>
      <body>
        <a href="https://www.qrate.md" target="_blank" rel="noreferrer" className="badge">
          <div className="logo">QRate<span>.md</span></div>
          <div className="divider" />
          <div className="info">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="stars">{'★'.repeat(stars)}{'☆'.repeat(5 - stars)}</span>
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