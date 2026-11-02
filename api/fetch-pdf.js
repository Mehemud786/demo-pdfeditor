import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

export default async function handler(req, res) {
  // Optional: Secure your Vercel endpoint so not anyone can trigger it
  const { authorization } = req.headers;
  if (authorization !== `Bearer ${process.env.API_SECRET_KEY}`) {
    return res.status(401).json({ error: 'Unauthorized request' });
  }

  let browser = null;

  try {
    // Launch Vercel-compatible Chromium
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();

    // 1. Navigate to the login portal
    await page.goto('https://nirnoy.smartxlab.in/public/login', { waitUntil: 'networkidle2' });

    // 2. Input credentials and submit (Update selectors to match your portal's HTML)
    await page.type('input[name="username"]', process.env.PORTAL_USERNAME);
    await page.type('input[name="password"]', process.env.PORTAL_PASSWORD);
    
    await Promise.all([
      page.click('button[type="submit"]'), // Update this selector
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
    ]);

    // 3. Navigate to the specific report URL
    const targetUrl = 'https://example.com/internal_reports/print_business_report?from_date=2026-11-02&to_date=2026-11-02&as_on_date=2026-11-02&report_type=all';
    await page.goto(targetUrl, { waitUntil: 'networkidle2' });

    // 4. Generate the PDF from the loaded page
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' }
    });

    // 5. Return the PDF buffer to the client
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="business_report.pdf"');
    res.status(200).send(pdfBuffer);

  } catch (error) {
    console.error('PDF Generation Error:', error);
    res.status(500).json({ error: 'Failed to generate PDF', details: error.message });
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }
}