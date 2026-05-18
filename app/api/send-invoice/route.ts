import { Resend } from 'resend';
import { NextResponse } from 'next/server';

// Inițializăm Resend cu cheia din .env
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { email, pdfBase64, invoiceNumber } = await request.json();

    if (!email || !pdfBase64) {
      return NextResponse.json({ error: 'Emailul și conținutul PDF sunt obligatorii.' }, { status: 400 });
    }

    // Curățăm stringul Base64 dacă conține prefixul de tip Data URL (ex: data:application/pdf;base64,)
    const cleanBase64 = pdfBase64.includes(',') ? pdfBase64.split(',')[1] : pdfBase64;

    // Convertim string-ul base64 într-un Buffer pentru stabilitatea atașamentului
    const pdfBuffer = Buffer.from(cleanBase64, 'base64');

    const data = await resend.emails.send({
      from: 'QRate <onboarding@resend.dev>', // Până verifici domeniul qrate.md, lasă așa
      to: [email],
      subject: `Factură Fiscală ${invoiceNumber || ''} - QRate.md`,
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
          filename: `Factura_${invoiceNumber || 'Noua'}.pdf`,
          content: pdfBuffer, // Folosirea unui Buffer previne coruperea fișierului PDF la recepție
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