import { Resend } from 'resend';
import { NextResponse } from 'next/server';

// Inițializăm Resend cu cheia din .env
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { email, pdfBase64, invoiceNumber } = await request.json();

    const data = await resend.emails.send({
      from: 'QRate <onboarding@resend.dev>', // Până verifici domeniul qrate.md, lasă așa
      to: [email],
      subject: `Factură Fiscală ${invoiceNumber} - QRate.md`,
      html: `
        <div style="font-family: sans-serif; color: #333;">
          <h2>Bună ziua,</h2>
          <p>Vă mulțumim pentru utilizarea platformei <strong>QRate.md</strong>.</p>
          <p>Atașat acestui mesaj găsiți factura fiscală generată pentru ultima dumneavoastră tranzacție.</p>
          <br />
          <p>Echipa QRate</p>
        </div>
      `,
      attachments: [
        {
          filename: `Factura_${invoiceNumber}.pdf`,
          content: pdfBase64,
        },
      ],
    });

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Resend Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}