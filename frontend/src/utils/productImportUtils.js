import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as pdfjsLib from 'pdfjs-dist';

// Configure pdfjs worker
try {
  if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '3.11.174'}/pdf.worker.min.js`;
  }
} catch (e) {
  console.warn("Could not set PDF worker src:", e);
}

/**
 * Robust CSV string tokenizer supporting quotes and escaped commas.
 */
export function parseCSVToRows(csvText) {
  const clean = csvText.replace(/^\uFEFF/, '').trim();
  if (!clean) return [];

  const rows = [];
  let currentRow = [];
  let currentVal = '';
  let inQuotes = false;

  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    const nextChar = clean[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentVal += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentVal.trim());
      currentVal = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') i++; // handle CRLF
      currentRow.push(currentVal.trim());
      if (currentRow.some(cell => cell.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentVal = '';
    } else {
      currentVal += char;
    }
  }

  if (currentVal.length > 0 || currentRow.length > 0) {
    currentRow.push(currentVal.trim());
    if (currentRow.some(cell => cell.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Converts parsed CSV rows into normalized product objects.
 */
export function parseProductsFromCSV(csvText, defaultPlatform = 'Amazon', defaultCategory = 'Electronics') {
  const rows = parseCSVToRows(csvText);
  if (rows.length < 2) {
    throw new Error("CSV file must contain a header row and at least one product row.");
  }

  const cleanHeader = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const headers = rows[0].map(cleanHeader);

  // Column Index Resolvers
  const nameIdx = headers.findIndex(h => ['name', 'title', 'productname', 'itemname', 'product'].includes(h));
  const priceIdx = headers.findIndex(h => ['price', 'dealprice', 'mrp', 'amount', 'cost'].includes(h));
  
  if (nameIdx === -1 || priceIdx === -1) {
    throw new Error(`CSV must have at least "Name" (or "Title") and "Price" columns. Found headers: ${rows[0].join(', ')}`);
  }

  const platformIdx = headers.findIndex(h => ['platform', 'store', 'merchant', 'source'].includes(h));
  const cashbackIdx = headers.findIndex(h => ['cashbackvalue', 'cashback', 'cashbackrate', 'commission', 'commissionpercentage'].includes(h));
  const urlIdx = headers.findIndex(h => ['affiliateurl', 'producturl', 'url', 'link', 'targeturl'].includes(h));
  const imageIdx = headers.findIndex(h => ['image', 'imageurl', 'img', 'photo', 'picture'].includes(h));
  const categoryIdx = headers.findIndex(h => ['category', 'cat', 'categoryname'].includes(h));

  const products = [];
  const errors = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const name = row[nameIdx] ? row[nameIdx].trim() : '';
    const rawPrice = row[priceIdx] ? row[priceIdx].replace(/[^0-9.]/g, '') : '';
    const price = parseFloat(rawPrice);

    if (!name || isNaN(price) || price <= 0) {
      errors.push(`Row ${i + 1}: Invalid product name or price (${row.join(', ')})`);
      continue;
    }

    const platform = (platformIdx !== -1 && row[platformIdx]) ? row[platformIdx].trim() : defaultPlatform;
    const rawCashback = (cashbackIdx !== -1 && row[cashbackIdx]) ? parseFloat(row[cashbackIdx].replace(/[^0-9.]/g, '')) : 10;
    const cashbackValue = isNaN(rawCashback) ? 10 : rawCashback;
    const affiliateUrl = (urlIdx !== -1 && row[urlIdx]) ? row[urlIdx].trim() : '';
    const image = (imageIdx !== -1 && row[imageIdx]) ? row[imageIdx].trim() : 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400';
    const category = (categoryIdx !== -1 && row[categoryIdx]) ? row[categoryIdx].trim() : defaultCategory;

    products.push({
      id: `csv-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
      name,
      price,
      platform,
      cashbackValue,
      affiliateUrl,
      image,
      category,
      status: 'active'
    });
  }

  return { products, errors, totalRows: rows.length - 1 };
}

/**
 * Extracts product details from an uploaded PDF file.
 */
export async function parseProductsFromPDF(file, defaultPlatform = 'Amazon', defaultCategory = 'Electronics') {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdfDoc = await loadingTask.promise;

  let fullText = '';
  const pageLines = [];

  for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();
    
    // Sort items by vertical position (y), then horizontal (x)
    const items = textContent.items.map(item => ({
      str: item.str,
      x: item.transform[4],
      y: item.transform[5]
    }));

    // Group text items by approximate line height
    const linesMap = {};
    items.forEach(item => {
      const lineKey = Math.round(item.y / 4) * 4;
      if (!linesMap[lineKey]) linesMap[lineKey] = [];
      linesMap[lineKey].push(item);
    });

    const sortedY = Object.keys(linesMap).sort((a, b) => Number(b) - Number(a));
    sortedY.forEach(yKey => {
      const lineItems = linesMap[yKey].sort((a, b) => a.x - b.x);
      const lineStr = lineItems.map(i => i.str).join(' ').trim();
      if (lineStr) pageLines.push(lineStr);
    });
  }

  const products = [];
  const errors = [];

  // Parse lines: Match patterns like "Product Name ... Price ... Cashback% ... URL"
  pageLines.forEach((line, idx) => {
    // Skip headers or short non-product lines
    if (line.toLowerCase().includes('product name') || line.toLowerCase().includes('page') || line.length < 5) {
      return;
    }

    // Regex to detect price like: ₹1499, 1499, Rs. 1499, INR 1499, 1499.00
    const priceMatch = line.match(/(?:₹|rs\.?|inr)?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/i);
    
    if (priceMatch) {
      const rawPriceStr = priceMatch[1].replace(/,/g, '');
      const price = parseFloat(rawPriceStr);

      if (!isNaN(price) && price > 5) {
        // Extract name as text before or around price
        let name = line.substring(0, priceMatch.index).trim();
        if (!name || name.length < 3) {
          name = line.replace(priceMatch[0], '').trim();
        }

        // Clean name
        name = name.replace(/^[\d\.\-\*\#\s]+/, '').replace(/[,|\t]+$/, '').trim();

        // Check for platform in line
        let platform = defaultPlatform;
        const lowerLine = line.toLowerCase();
        if (lowerLine.includes('flipkart')) platform = 'Flipkart';
        else if (lowerLine.includes('amazon')) platform = 'Amazon';
        else if (lowerLine.includes('meesho')) platform = 'Meesho';
        else if (lowerLine.includes('myntra')) platform = 'Myntra';
        else if (lowerLine.includes('ajio')) platform = 'Ajio';
        else if (lowerLine.includes('nykaa')) platform = 'Nykaa';
        else if (lowerLine.includes('boat')) platform = 'boAt';

        // Check for cashback percentage in line (e.g., 10%, 8.5%)
        const cbMatch = line.match(/(\d+(?:\.\d+)?)\s*%/);
        const cashbackValue = cbMatch ? parseFloat(cbMatch[1]) : 10;

        // Check for URL in line
        const urlMatch = line.match(/(https?:\/\/[^\s]+)/i);
        const affiliateUrl = urlMatch ? urlMatch[1] : '';

        if (name && name.length >= 3) {
          products.push({
            id: `pdf-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
            name: name,
            price: price,
            platform: platform,
            cashbackValue: cashbackValue,
            affiliateUrl: affiliateUrl,
            image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
            category: defaultCategory,
            status: 'active'
          });
        }
      }
    }
  });

  if (products.length === 0) {
    throw new Error("Could not detect any structured product rows from the PDF. Please make sure the PDF contains product names and prices.");
  }

  return { products, errors, totalLinesParsed: pageLines.length };
}

/**
 * Downloads a pre-formatted Sample CSV Template.
 */
export function downloadSampleProductCSV() {
  const sampleCSV = `name,platform,category,price,cashbackValue,affiliateUrl,image
"Apple iPhone 15 (128 GB)","Amazon","Mobiles",69999,8.5,"https://amazon.in/dp/example1","https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400"
"Samsung Galaxy S24 5G","Flipkart","Mobiles",74999,10.0,"https://flipkart.com/item/example2","https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400"
"boAt Airdopes 141 ANC","boAt","Electronics",1499,12.0,"https://boat-lifestyle.com/products/example3","https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400"
"Men Slim Fit Cotton Shirt","Myntra","Fashion",899,14.0,"https://myntra.com/shirts/example4","https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400"
"Noise ColorFit Smartwatch","Meesho","Electronics",1299,15.0,"https://meesho.com/products/example5","https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400"
`;

  const blob = new Blob(['\uFEFF' + sampleCSV], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'LIO_MART_Product_Import_Sample.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Downloads a pre-formatted Sample PDF Template.
 */
export function downloadSampleProductPDF() {
  const doc = new jsPDF('landscape');

  // Title
  doc.setFontSize(16);
  doc.setTextColor(37, 99, 235);
  doc.text('LIO MART - Sample Product Import Catalog (PDF)', 14, 15);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text('Upload this PDF into the Admin Products Bulk Importer to test PDF-to-Products extraction.', 14, 22);

  const tableHeaders = [['Product Name', 'Platform', 'Category', 'Price (INR)', 'Cashback (%)', 'Target Link']];
  const tableData = [
    ['Apple iPhone 15 (128 GB)', 'Amazon', 'Mobiles', '69999', '8.5%', 'https://amazon.in/dp/sample'],
    ['Samsung Galaxy S24 Ultra', 'Flipkart', 'Mobiles', '129999', '10.0%', 'https://flipkart.com/sample'],
    ['boAt Airdopes 141 ANC Wireless', 'boAt', 'Electronics', '1499', '12.0%', 'https://boat-lifestyle.com/sample'],
    ['Men Casual Slim Fit Shirt', 'Myntra', 'Fashion', '899', '14.0%', 'https://myntra.com/sample'],
    ['Noise ColorFit Pro 4 Smartwatch', 'Meesho', 'Electronics', '1799', '15.0%', 'https://meesho.com/sample'],
    ['Maybelline Matte Liquid Lipstick', 'Nykaa Beauty', 'Beauty', '499', '7.0%', 'https://nykaa.com/sample']
  ];

  autoTable(doc, {
    head: tableHeaders,
    body: tableData,
    startY: 28,
    theme: 'grid',
    headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 4 }
  });

  doc.save('LIO_MART_Product_Import_Sample.pdf');
}
