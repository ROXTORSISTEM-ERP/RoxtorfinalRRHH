
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const exportToExcel = (data: any[], filename: string) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte");
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

export const exportToPDF = (headers: string[], data: any[][], filename: string, title: string) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  
  // Add title
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  doc.setFontSize(11);
  doc.setTextColor(100);
  
  // Add date
  const date = new Date().toLocaleDateString();
  doc.text(`Fecha de generación: ${date}`, 14, 30);
  
  (doc as any).autoTable({
    head: [headers],
    body: data,
    startY: 35,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [0, 8, 20], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });
  
  doc.save(`${filename}.pdf`);
};
