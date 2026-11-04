const { PDFDocument, rgb } = require('pdf-lib');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const pdfUrl = 'https://nirnoy.smartxlab.in/internal_reports/print_business_report?from_date=2026-11-04&to_date=2026-11-04&as_on_date=2026-11-04&report_type=all';
    
    // NOTE: Uncomment and update if the URL requires authentication
    // const fetchResponse = await fetch(pdfUrl, {
    //   headers: {
    //     'Authorization': 'Bearer YOUR_TOKEN',
    //     'Cookie': 'session_id=YOUR_COOKIE'
    //   }
    // });
    const fetchResponse = await fetch(pdfUrl);

    if (!fetchResponse.ok) {
      throw new Error(`Failed to fetch PDF: ${fetchResponse.status} ${fetchResponse.statusText}`);
    }

    const contentType = fetchResponse.headers.get('content-type');
    if (!contentType || !contentType.includes('application/pdf')) {
      throw new Error(`Expected a PDF, but received: ${contentType}. The URL might require authentication.`);
    }

    const existingPdfBytes = await fetchResponse.arrayBuffer();
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const pages = pdfDoc.getPages();

    if (pages.length === 0) {
      throw new Error('The fetched PDF document has no pages.');
    }

    const firstPage = pages[0];
    const { height } = firstPage.getSize();

    firstPage.drawText('Reviewed & Processed via Vercel', {
      x: 50,
      y: height - 50, 
      size: 16,
      color: rgb(0.1, 0.6, 0.1),
    });

    const pdfBytes = await pdfDoc.save();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="edited-business-report.pdf"');
    
    res.status(200).send(Buffer.from(pdfBytes));

  } catch (error) {
    console.error('PDF Processing Error:', error.message);
    res.status(500).send(`Server Error: ${error.message}`);
  }
}