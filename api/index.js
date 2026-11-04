// api/index.js
const { PDFDocument, rgb } = require('pdf-lib');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. Fetch the specific business report PDF
    const pdfUrl = 'https://nirnoy.smartxlab.in/internal_reports/print_business_report?from_date=2026-11-04&to_date=2026-11-04&as_on_date=2026-11-04&report_type=all';
    
    // NOTE: If this URL requires authentication, add headers like this:
    // const fetchResponse = await fetch(pdfUrl, {
    //   headers: {
    //     'Authorization': 'Bearer YOUR_TOKEN_HERE',
    //     // 'Cookie': 'session_id=YOUR_SESSION_COOKIE'
    //   }
    // });
    
    const fetchResponse = await fetch(pdfUrl);

    if (!fetchResponse.ok) {
      throw new Error(`Failed to fetch PDF: ${fetchResponse.status} ${fetchResponse.statusText}`);
    }

    const existingPdfBytes = await fetchResponse.arrayBuffer();

    // 2. Load the PDF document into pdf-lib
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    // 3. Edit the PDF: Add text to the first page
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const { height } = firstPage.getSize();

    firstPage.drawText('Reviewed & Processed', {
      x: 50,
      y: height - 50, 
      size: 16,
      color: rgb(0.1, 0.6, 0.1), // Green color
    });

    // 4. Serialize the PDFDocument to bytes
    const pdfBytes = await pdfDoc.save();

    // 5. Serve the modified PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="business-report-edited.pdf"');
    
    res.status(200).send(Buffer.from(pdfBytes));

  } catch (error) {
    console.error('PDF Processing Error:', error);
    res.status(500).json({ error: error.message || 'Failed to process PDF' });
  }
}