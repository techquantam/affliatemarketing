import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Robust CSV & PDF export utility for LIO MART Admin Panel & User Dashboard
 */

// Helper to safely extract cell value from row
const getCellValue = (row, col) => {
  if (!row || !col) return '';
  
  let val;
  if (typeof col.accessor === 'function') {
    val = col.accessor(row);
  } else if (col.dataKey) {
    val = row[col.dataKey];
    // If not found, try common fallback aliases
    if (val === undefined || val === null) {
      if (col.dataKey === 'name') val = row.title || row.storeName || row.userName;
      else if (col.dataKey === 'title') val = row.name;
      else if (col.dataKey === 'platform') val = row.sourcePlatform || row.store;
      else if (col.dataKey === 'cashbackValue') val = row.commissionPercentage || row.cashbackRate || row.cashback;
      else if (col.dataKey === 'status') val = row.isActive !== undefined ? (row.isActive ? 'active' : 'inactive') : row.status;
      else if (col.dataKey === 'price') val = row.dealPrice !== undefined ? row.dealPrice : row.price;
      else if (col.dataKey === 'amount') val = row.amount !== undefined ? row.amount : row.cashbackAmount;
    }
  } else if (col.key) {
    val = row[col.key];
  }
  
  if (val === null || val === undefined) return '';
  if (typeof val === 'object') {
    try {
      return JSON.stringify(val);
    } catch {
      return '';
    }
  }
  return String(val);
};

export const exportToCSV = (data, columns, filename = 'Export') => {
  try {
    if (!data || !Array.isArray(data) || data.length === 0) {
      alert("No data available to export.");
      return;
    }

    if (!columns || !Array.isArray(columns) || columns.length === 0) {
      alert("Invalid column configuration for export.");
      return;
    }

    // Header row
    const headers = columns.map(col => `"${String(col.header || col.label || col.dataKey || '').replace(/"/g, '""')}"`).join(',');

    // Data rows
    const csvRows = data.map(row => {
      return columns.map(col => {
        const cellData = getCellValue(row, col);
        return `"${cellData.replace(/"/g, '""')}"`;
      }).join(',');
    });

    // Add UTF-8 BOM so Excel and spreadsheet apps open UTF-8/Rupee symbols without corrupting
    const csvContent = '\uFEFF' + [headers, ...csvRows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

    const cleanFilename = (filename || 'export').replace(/[/\\?%*:|"<>]/g, '_');
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${cleanFilename}.csv`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 300);
  } catch (err) {
    console.error('Failed to export CSV:', err);
    alert(`CSV export failed: ${err.message || 'Unknown error'}`);
  }
};

export const exportToPDF = (data, columns, filename = 'Export', title = "Export Report") => {
  try {
    if (!data || !Array.isArray(data) || data.length === 0) {
      alert("No data available to export.");
      return;
    }

    if (!columns || !Array.isArray(columns) || columns.length === 0) {
      alert("Invalid column configuration for export.");
      return;
    }

    // Robust instantiation of jsPDF across different bundler environments
    const JsPdfClass = (typeof jsPDF === 'function' ? jsPDF : (jsPDF?.jsPDF || window.jspdf?.jsPDF || window.jsPDF));
    if (!JsPdfClass) {
      throw new Error("jsPDF library is not loaded.");
    }

    const doc = new JsPdfClass({
      orientation: columns.length > 5 ? 'landscape' : 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Clean title & metadata
    doc.setFontSize(14);
    doc.text(title, 14, 15);
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()} | Total Records: ${data.length}`, 14, 21);

    // Prepare table data
    const head = [columns.map(col => String(col.header || col.label || col.dataKey || ''))];
    const body = data.map(row => 
      columns.map(col => getCellValue(row, col))
    );

    // Execute autotable safely across various bundler formats
    const autoTableFn = (typeof autoTable === 'function' ? autoTable : (autoTable?.default || autoTable?.autoTable)) || (typeof doc.autoTable === 'function' ? doc.autoTable.bind(doc) : null);

    if (typeof autoTableFn === 'function') {
      autoTableFn(doc, {
        startY: 26,
        head: head,
        body: body,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2.5, overflow: 'linebreak' },
        headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { top: 26, left: 14, right: 14, bottom: 14 }
      });
    } else if (typeof doc.autoTable === 'function') {
      doc.autoTable({
        startY: 26,
        head: head,
        body: body,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2.5, overflow: 'linebreak' },
        headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { top: 26, left: 14, right: 14, bottom: 14 }
      });
    } else {
      // Fallback text rendering if autoTable is unavailable
      let yPos = 30;
      doc.setFontSize(8);
      body.forEach((row, i) => {
        if (yPos > 280) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(`${i + 1}. ` + row.join(' | '), 14, yPos);
        yPos += 7;
      });
    }

    const cleanFilename = (filename || 'export').replace(/[/\\?%*:|"<>]/g, '_');
    doc.save(`${cleanFilename}.pdf`);
  } catch (err) {
    console.error('Failed to export PDF:', err);
    alert(`PDF export failed: ${err.message || 'Unknown error'}`);
  }
};
