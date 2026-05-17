// app/api/invoices/latest/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Conținutul simulat al facturii (un text simplu structurat ca o factură)
    const mockInvoiceContent = `
==================================================
              FACTURA FISCALA SIMULATA
==================================================
Furnizor: QRate.MD (Test Mode)
Data: ${new Date().toLocaleDateString('ro-MD')}
Status: PLATIT
--------------------------------------------------
Serviciu: Abonament Premium QRate SaaS (1 Luna)
Pret: 0.00 MDL (MOCK TEST)
--------------------------------------------------
Va multumim ca utilizati platforma noastra!
==================================================
    `;

    // Convertim textul într-un buffer de octeți (Blob/Binary)
    const encoder = new TextEncoder();
    const fileBuffer = encoder.encode(mockInvoiceContent);

    // Returnăm răspunsul setat ca fișier atașat (Mime-type PDF sau octet-stream)
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf', //browserul îl va trata ca PDF
        'Content-Disposition': 'attachment; filename="Factura_Test_QRate.pdf"',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}