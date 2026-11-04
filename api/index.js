export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const { userId, password } = req.body;

    if (!userId || !password) {
      return res.status(400).send('User ID and Password are required.');
    }

    const reportUrl = 'https://nirnoy.smartxlab.in/internal_reports/print_business_report?from_date=2026-11-04&to_date=2026-11-04&as_on_date=2026-11-04&report_type=all';
    
    // Encode credentials for Basic Authentication
    const encodedCredentials = Buffer.from(`${userId}:${password}`).toString('base64');

    // Fetch the HTML report
    const fetchResponse = await fetch(reportUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${encodedCredentials}`
      }
    });

    if (!fetchResponse.ok) {
      if (fetchResponse.status === 401 || fetchResponse.status === 403) {
        throw new Error('Authentication failed. Check User ID and Password.');
      }
      throw new Error(`Failed to fetch report: ${fetchResponse.status}`);
    }

    // Get the HTML content
    const htmlContent = await fetchResponse.text();

    // Serve the HTML directly
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(htmlContent);

  } catch (error) {
    console.error('Fetch Error:', error.message);
    res.status(500).send(error.message);
  }
}