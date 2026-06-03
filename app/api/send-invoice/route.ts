import { Resend } from 'resend';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const apiKey = process.env.RESEND_API_KEY || 're_placeholder_key';
const resend = new Resend(apiKey);

const invoiceRateLimit = new Map<string, number[]>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 60 * 1000;
  const timestamps = (invoiceRateLimit.get(key) || []).filter(t => now - t < windowMs);
  if (timestamps.length >= 5) return true;
  timestamps.push(now);
  invoiceRateLimit.set(key, timestamps);
  return false;
}

export async function POST(request: Request) {
  try {
    const { email, pdfBase64, invoiceNumber } = await request.json();

    if (!email || !pdfBase64) {
      return NextResponse.json({ error: 'Emailul și conținutul PDF sunt obligatorii.' }, { status: 400 });
    }

    if (isRateLimited(email)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const safeInvoiceNumber = (invoiceNumber || '').replace(/[^\w\-\/\. ]/g, '');

    // Verificare la runtime pentru producție
    if (!process.env.RESEND_API_KEY) {
      console.error("❌ RESEND_API_KEY lipsește din variabilele de mediu!");
      return NextResponse.json({ error: 'Configurare server incompletă.' }, { status: 500 });
    }

    // Curățăm stringul Base64 dacă conține prefixul de tip Data URL
    const cleanBase64 = pdfBase64.includes(',') ? pdfBase64.split(',')[1] : pdfBase64;
    const pdfBuffer = Buffer.from(cleanBase64, 'base64');

    const data = await resend.emails.send({
      from: 'QRate <onboarding@resend.dev>', // Modifică după ce verifici domeniul qrate.md
      to: [email],
      subject: `Factură Fiscală ${safeInvoiceNumber || ''} - QRate.md`,
      html: `
        <div style="font-family: sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px; line-height: 1.6;">
          <h2 style="color: #0f172a; font-size: 20px; font-weight: 800; text-transform: uppercase;">Bună ziua,</h2>
          <p>Vă mulțumim pentru utilizarea platformei <strong>QRate.md</strong>.</p>
          <p>Atașat acestui mesaj găsiți factura fiscală generată pentru ultima dumneavoastră tranzacție.</p>
          <br />
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 12px; color: #64748b;">Echipa QRate.md<br/>Suport clienți</p>
        </div>
      `,
      attachments: [
        {
          filename: `Factura_${safeInvoiceNumber || 'Noua'}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("❌ Resend API Error:", error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error?.message || String(error) }, 
      { status: 500 }
    );
  }
}