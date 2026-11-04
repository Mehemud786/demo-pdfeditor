// api/index.js
const { PDFDocument, rgb } = require('pdf-lib');

export default async function handler(req, res) {
  // Now requires a POST request to securely receive credentials
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    // 1. Extract credentials from the request body
    const { userId, password } = req.body;

    if (!userId || !password) {
      return res.status(400).send('User ID and Password are required.');
    }

    const pdfUrl = 'https://nirnoy.smartxlab.in/internal_reports/print_business_report?from_date=2026-11-04&to_date=2026-11-04&as_on_date=2026-11-04&report_type=all';
    
    // 2. Encode credentials for standard HTTP Basic Authentication
    const encodedCredentials = Buffer.from(`${userId}:${password}`).toString('base64');

    // 3. Fetch the PDF and pass the authentication headers
    const fetchResponse = await fetch(pdfUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${encodedCredentials}`
        // If the portal uses a Bearer token instead, you might need a 2-step login process here.
      }
    });

    if (!fetchResponse.ok) {
      if (fetchResponse.status === 401 || fetchResponse.status === 403) {
        throw new Error('Authentication failed. Check User ID and Password.');
      }
      throw new Error(`Failed to fetch PDF: ${fetchResponse.status}`);
    }

    const contentType = fetchResponse.headers.get('content-type');
    if (!contentType || !contentType.includes('application/pdf')) {
      throw new Error('Authentication might have failed, or the server returned an HTML page instead of a PDF.');
    }

    const existingPdfBytes = await fetchResponse.arrayBuffer();
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const pages = pdfDoc.getPages();

    if (pages.length === 0) {
      throw new Error('The fetched PDF document has no pages.');
    }

    // 4. Edit the PDF
    const firstPage = pages[0];
    const { height } = firstPage.getSize();

    firstPage.drawText(`Processed for user: ${userId}`, {
      x: 50,
      y: height - 50, 
      size: 14,
      color: rgb(0.1, 0.6, 0.1),
    });

    const pdfBytes = await pdfDoc.save();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="edited-business-report.pdf"');
    
    res.status(200).send(Buffer.from(pdfBytes));

  } catch (error) {
    console.error('PDF Processing Error:', error.message);
    res.status(500).send(error.message);
  }
}