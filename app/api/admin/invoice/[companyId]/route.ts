// app/api/admin/invoice/[companyId]/route.ts
// Generează factură HTML printabilă ca PDF

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

interface Props { params: Promise<{ companyId: string }> }

export async function GET(req: NextRequest, { params }: Props) {
  const { companyId } = await params;
  const url = new URL(req.url);
  const paymentId = url.searchParams.get('payment');

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );

  const { data: company } = await supabase.from('companies').select('*').eq('id', companyId).single();
  if (!company) return NextResponse.json({ error: 'Companie negăsită' }, { status: 404 });

  let payment = null;
  if (paymentId) {
    const { data } = await supabase.from('payments').select('*').eq('id', paymentId).single();
    payment = data;
  } else {
    const { data } = await supabase.from('payments').select('*').eq('company_id', companyId).order('paid_at', { ascending: false }).limit(1).single();
    payment = data;
  }

  const billing = company.billing_details || {};
  const invoiceDate = payment ? new Date(payment.paid_at) : new Date();
  const invoiceNo = payment?.invoice_number || `QR-${invoiceDate.getFullYear()}-${String(Date.now()).slice(-4)}`;
  const amount = payment?.amount || 0;
  const planName = payment?.plan_name || company.plan_name || 'QRate';
  const tva = 0; // Moldova — fără TVA la servicii software pentru persoane fizice
  const total = amount;

  const html = `<!DOCTYPE html>
<html lang="ro">
<head>
<meta charset="UTF-8"/>
<title>Factură ${invoiceNo}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: Arial, sans-serif; font-size: 13px; color: #1e293b; background: #fff; padding: 40px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 3px solid #2563eb; padding-bottom: 20px; }
  .logo { font-size: 22px; font-weight: 900; font-style: italic; color: #2563eb; }
  .logo span { color: #1e293b; }
  .invoice-title { text-align: right; }
  .invoice-title h1 { font-size: 28px; font-weight: 900; color: #1e293b; text-transform: uppercase; letter-spacing: 2px; }
  .invoice-title .no { font-size: 14px; color: #64748b; margin-top: 4px; }
  .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
  .party h3 { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; margin-bottom: 8px; }
  .party .name { font-size: 16px; font-weight: 700; color: #1e293b; margin-bottom: 6px; }
  .party p { font-size: 12px; color: #64748b; line-height: 1.6; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
  thead tr { background: #f8fafc; border-bottom: 2px solid #e2e8f0; }
  thead th { padding: 12px 16px; text-align: left; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; }
  tbody tr { border-bottom: 1px solid #f1f5f9; }
  tbody td { padding: 14px 16px; }
  .totals { display: flex; justify-content: flex-end; }
  .totals table { width: 300px; }
  .totals .total-row { font-weight: 900; font-size: 15px; color: #2563eb; border-top: 2px solid #2563eb; }
  .totals .total-row td { padding-top: 12px; }
  .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 11px; color: #94a3b8; }
  .badge { display: inline-block; background: #dbeafe; color: #1d4ed8; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; margin-bottom: 20px; }
  @media print { body { padding: 20px; } @page { margin: 1cm; } }
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">QRate<span>.MD</span></div>
      <p style="font-size:11px;color:#64748b;margin-top:4px;">Platformă SaaS de Recenzii QR</p>
    </div>
    <div class="invoice-title">
      <h1>Factură</h1>
      <div class="no"># ${invoiceNo}</div>
      <div class="no">Data: ${invoiceDate.toLocaleDateString('ro-RO')}</div>
    </div>
  </div>

  <div class="parties">
    <div class="party">
      <h3>Prestator de servicii</h3>
      <div class="name">QR RATING S.R.L.</div>
      <p>IDNO: 1026023041245</p>
      <p>mun. Orhei, str. Sălciilor 75</p>
      <p>Republica Moldova</p>
      <p>Tel: 068 688 484</p>
      <p>Email: suport@qrate.md</p>
    </div>
    <div class="party">
      <h3>Beneficiar</h3>
      <div class="name">${billing.company_name || company.name}</div>
      ${billing.idno ? `<p>IDNO: ${billing.idno}</p>` : ''}
      ${billing.company_address ? `<p>${billing.company_address}</p>` : ''}
      ${billing.iban ? `<p>IBAN: ${billing.iban}</p>` : ''}
      ${billing.billing_email || company.email ? `<p>Email: ${billing.billing_email || company.email}</p>` : ''}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Denumire serviciu</th>
        <th>Perioadă</th>
        <th style="text-align:right">Cantitate</th>
        <th style="text-align:right">Preț unitar</th>
        <th style="text-align:right">Total</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>1</td>
        <td>
          <strong>Licență software QRate.md — Plan ${planName}</strong><br/>
          <span style="font-size:11px;color:#64748b;">Acces platformă SaaS: colectare recenzii QR, analytics, Telegram, AI</span>
        </td>
        <td style="color:#64748b;font-size:12px;">
          ${invoiceDate.toLocaleDateString('ro-RO')} —<br/>
          ${new Date(invoiceDate.getTime() + 30*86400000).toLocaleDateString('ro-RO')}
        </td>
        <td style="text-align:right">1 lună</td>
        <td style="text-align:right">${amount.toLocaleString()} MDL</td>
        <td style="text-align:right"><strong>${amount.toLocaleString()} MDL</strong></td>
      </tr>
    </tbody>
  </table>

  <div class="totals">
    <table>
      <tr><td style="padding:6px 16px;color:#64748b;">Subtotal</td><td style="text-align:right;padding:6px 16px;">${amount.toLocaleString()} MDL</td></tr>
      <tr><td style="padding:6px 16px;color:#64748b;">TVA (0%)</td><td style="text-align:right;padding:6px 16px;">0 MDL</td></tr>
      <tr class="total-row"><td style="padding:12px 16px;font-weight:900;">TOTAL DE PLATĂ</td><td style="text-align:right;padding:12px 16px;font-size:18px;font-weight:900;">${total.toLocaleString()} MDL</td></tr>
    </table>
  </div>

  <div style="margin-top:30px;padding:16px;background:#f8fafc;border-radius:8px;border-left:4px solid #2563eb;">
    <p style="font-size:12px;color:#475569;"><strong>Modalitate de plată:</strong> Transfer bancar / Numerar</p>
    <p style="font-size:12px;color:#475569;margin-top:4px;"><strong>Notă:</strong> Serviciile de software sunt scutite de TVA conform legislației Republicii Moldova.</p>
  </div>

  <div class="footer">
    <div>
      <p><strong>QR RATING S.R.L.</strong> · IDNO 1026023041245</p>
      <p>mun. Orhei, str. Sălciilor 75 · suport@qrate.md · 068 688 484</p>
    </div>
    <div style="text-align:right">
      <p>Factură generată automat de QRate.md</p>
      <p>${new Date().toLocaleString('ro-RO')}</p>
    </div>
  </div>

  <script>window.onload=()=>window.print();</script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}