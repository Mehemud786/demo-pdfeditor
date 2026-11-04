// api/index.js
const { PDFDocument, rgb } = require('pdf-lib');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const { userId, password } = req.body;
    if (!userId || !password) {
      return res.status(400).send('User ID and Password are required.');
    }

    // ==========================================
    // FIX 1: THE "TIME PROBLEM" (Dynamic Dates)
    // ==========================================
    // Automatically get today's date in YYYY-MM-DD format based on Indian Standard Time (IST)
    const today = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000; 
    const istTime = new Date(today.getTime() + istOffset);
    const dateString = istTime.toISOString().split('T')[0]; // Output: e.g., 2026-11-04
    
    // Inject the dynamic dates into the URL
    const pdfUrl = `https://nirnoy.smartxlab.in/internal_reports/print_business_report?from_date=${dateString}&to_date=${dateString}&as_on_date=${dateString}&report_type=all`;


    // ==========================================
    // FIX 2: THE "HTML INSTEAD OF PDF" PROBLEM
    // ==========================================
    
    // STEP A: LOG INTO THE PORTAL FIRST
    // *Important:* You must replace the URL below with the actual login endpoint of your portal.
    const loginUrl = 'https://nirnoy.smartxlab.in/api/login'; // <--- CHANGE THIS to your real login URL
    
    const loginResponse = await fetch(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            username: userId, 
            password: password 
            // Update the keys above ('username'/'password') to match exactly what your portal's API expects
        })
    });

    if (!loginResponse.ok) {
        throw new Error('Login failed. Check credentials or login endpoint.');
    }

    // Extract the authentication token or cookie from the login response
    // If your portal uses JSON web tokens (JWT):
    const loginData = await loginResponse.json();
    const authToken = loginData.token; // <--- CHANGE THIS to match the key in your portal's response

    // (Alternatively, if your portal uses cookies, extract them like this:)
    // const authCookie = loginResponse.headers.get('set-cookie');

    // STEP B: FETCH THE PDF USING THE TOKEN
    const fetchResponse = await fetch(pdfUrl, {
      method: 'GET',
      headers: {
        // Pass the token here. (If using cookies, change to 'Cookie': authCookie)
        'Authorization': `Bearer ${authToken}`,
        
        // Add a User-Agent so the portal doesn't block Vercel as a "bot"
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
        'Accept': 'application/pdf'
      }
    });

    // ==========================================
    // PDF PROCESSING
    // ==========================================
    if (!fetchResponse.ok) {
      throw new Error(`Failed to fetch PDF: ${fetchResponse.status}`);
    }

    const contentType = fetchResponse.headers.get('content-type');
    if (!contentType || !contentType.includes('application/pdf')) {
      // If you still get this error, the token/cookie wasn't passed correctly in Step B.
      throw new Error(`Server returned ${contentType} instead of PDF. Authentication failed.`);
    }

    const existingPdfBytes = await fetchResponse.arrayBuffer();
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const pages = pdfDoc.getPages();

    if (pages.length === 0) {
      throw new Error('The fetched PDF document has no pages.');
    }

    const firstPage = pages[0];
    const { height } = firstPage.getSize();

    firstPage.drawText(`Processed on ${dateString} for user: ${userId}`, {
      x: 50,
      y: height - 50, 
      size: 14,
      color: rgb(0.1, 0.6, 0.1),
    });

    const pdfBytes = await pdfDoc.save();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="report-${dateString}.pdf"`);
    
    res.status(200).send(Buffer.from(pdfBytes));

  } catch (error) {
    console.error('PDF Processing Error:', error.message);
    res.status(500).send(error.message);
  }
}