const axios = require('axios');

module.exports = async (req, res) => {
  // Only allow GET or POST requests
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  try {
    // 1. Authenticate with the login portal
    // (Replace the URL and payload with your portal's actual login endpoint and field names)
    const loginResponse = await axios.post('https://nirnoy.smartxlab.in/public/login', {
      username: process.env.PORTAL_USERNAME,
      password: process.env.PORTAL_PASSWORD
    });

    // Extract the session cookie or authorization token
    // Note: Some portals return a token in the body (loginResponse.data.token)
    const cookies = loginResponse.headers['set-cookie'];
    if (!cookies) {
      throw new Error('Authentication failed: No session cookie received.');
    }

    // 2. Fetch the PDF using the authenticated session
    // (Replace with the actual URL where the PDF is located)
    const pdfUrl = 'https://nirnoy.smartxlab.in/internal_reports/print_business_report?from_date=2026-11-02&to_date=2026-11-02&as_on_date=2026-11-02&report_type=all';
    
    const pdfResponse = await axios.get(pdfUrl, {
      headers: {
        'Cookie': cookies.join('; '), // Pass the session cookie
        // 'Authorization': `Bearer ${loginResponse.data.token}` // Use this if it's a token-based API
      },
      responseType: 'arraybuffer' // CRUCIAL: Tells axios to handle the response as binary data
    });

    // 3. Serve the PDF directly to the user's browser
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="downloaded-document.pdf"'); // Use 'inline' to display in browser instead of downloading
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate'); // Optional caching
    
    res.status(200).send(pdfResponse.data);

  } catch (error) {
    console.error('Error fetching PDF:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch the document.',
      details: error.response ? error.response.data : error.message 
    });
  }
};