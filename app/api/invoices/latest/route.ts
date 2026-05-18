// app/api/invoices/latest/route.ts
import { NextResponse } from 'next/server';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export async function GET() {
  try {
    const doc = new jsPDF();

    // Titlu Factură
    doc.setFontSize(18);
    doc.text('FACTURA FISCALA (TEST MODE)', 14, 20);

    doc.setFontSize(10);
    doc.text(`Furnizor: QRate.MD`, 14, 30);
    doc.text(`Data: ${new Date().toLocaleDateString('ro-MD')}`, 14, 35);
    doc.text(`Status: PLATIT`, 14, 40);

    // Tabelul cu servicii - configurat corect fără fillStyle
    autoTable(doc, {
      startY: 50,
      head: [['Serviciu', 'Cantitate', 'Pret Unitar', 'Total']],
      body: [
        ['Abonament QRate Pro (1 Lună)', '1', '499.00 MDL', '499.00 MDL'],
      ],
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] }, // Corect, fără fillStyle
      alternateRowStyles: { fillColor: [250, 250, 250] },
    });

    // Convertim documentul generat într-un ArrayBuffer pentru Next.js Response
    const pdfOutput = doc.output('arraybuffer');
    const fileBuffer = Buffer.from(pdfOutput);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="Factura_Test_QRate.pdf"',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}