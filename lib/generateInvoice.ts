import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateInvoicePDF = (userData: any, billingData: any) => {
  const doc = new jsPDF();
  const date = new Date().toLocaleDateString('ro-RO');
  const invoiceNumber = `QR-${Math.floor(1000 + Math.random() * 9000)}`;

  // 1. Header - Numele Platformei
  doc.setFontSize(20);
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.text("QRATE.MD", 14, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text("Factură Fiscală (Digitală)", 14, 28);

  // 2. Date Furnizor (VADSTUDIO) - Stânga
  doc.setFontSize(10);
  doc.setTextColor(0);
  doc.setFont("helvetica", "bold");
  doc.text("FURNIZOR:", 14, 45);
  doc.setFont("helvetica", "normal");
  doc.text("VADSTUDIO DIGITAL SOLUTIONS S.R.L.", 14, 50);
  doc.text("IDNO: 102XXXXXXXXXX", 14, 55);
  doc.text("Email: suport@qrate.md", 14, 60);

  // 3. Date Client - Dreapta
  const rightColumn = 120;
  doc.setFont("helvetica", "bold");
  doc.text("CLIENT:", rightColumn, 45);
  doc.setFont("helvetica", "normal");
  
  if (userData.is_legal_entity) {
    doc.text(userData.company_name || "Nume Companie", rightColumn, 50);
    doc.text(`IDNO: ${userData.idno || "-"}`, rightColumn, 55);
    doc.text(`Adresă: ${userData.company_address || "-"}`, rightColumn, 60);
    doc.text(`IBAN: ${userData.company_bank_account || "-"}`, rightColumn, 65);
  } else {
    doc.text(userData.full_name || "Client Persoană Fizică", rightColumn, 50);
    doc.text(userData.email || "", rightColumn, 55);
  }

  // 4. Detalii Factură (Număr, Dată)
  doc.setDrawColor(240);
  doc.line(14, 75, 196, 75); // Linie separatoare
  doc.text(`Nr. Factură: ${invoiceNumber}`, 14, 85);
  doc.text(`Data: ${date}`, rightColumn, 85);

  // 5. Tabel Servicii
  autoTable(doc, {
    startY: 95,
    head: [['Serviciu', 'Cantitate', 'Preț Unitar', 'Total']],
    body: [
      ['Abonament QRate Pro (1 Lună)', '1', '499.00 MDL', '499.00 MDL'],
    ],
    headStyles: { fillStyle: 'fill', fillColor: [15, 23, 42], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [250, 250, 250] },
  });

  // 6. Total
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(`TOTAL DE PLATĂ: 499.00 MDL`, 140, finalY);

  // 7. Footer / Notă
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(150);
  doc.text("Această factură a fost generată automat și este valabilă fără semnătură și ștampilă conform Legii 1245-XV.", 14, finalY + 30);

  // Salvare PDF
  doc.save(`Factura_QRate_${invoiceNumber}.pdf`);
};