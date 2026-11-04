const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');
const { PDFDocument, rgb } = require('pdf-lib');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const { userId, password } = req.body;
  if (!userId || !password) {
    return res.status(400).send('User ID and Password are required.');
  }

  let browser = null;

  try {
    // 1. Launch Headless Chromium specifically optimized for Vercel
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();

    // 2. Set Basic Authentication headers for the portal
    await page.authenticate({ username: userId, password: password });

    // 3. Navigate to the HTML report URL
    const reportUrl = 'https://nirnoy.smartxlab.in/internal_reports/print_business_report?from_date=2026-11-04&to_date=2026-11-04&as_on_date=2026-11-04&report_type=all';
    
    // Wait until there are no network connections for at least 500ms to ensure HTML/CSS loads
    await page.goto(reportUrl, { waitUntil: 'networkidle0' });

    // 4. Convert the rendered HTML page to a PDF buffer
    const generatedPdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true, // Ensures CSS background colors/images are printed
      margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' }
    });

    await browser.close();

    // 5. Load the newly generated PDF into pdf-lib for editing
    const pdfDoc = await PDFDocument.load(generatedPdfBuffer);
    const pages = pdfDoc.getPages();
    
    if (pages.length > 0) {
      const firstPage = pages[0];
      const { height } = firstPage.getSize();

      // Add custom stamp
      firstPage.drawText(`Processed for user: ${userId}`, {
        x: 50,
        y: height - 30, 
        size: 12,
        color: rgb(0.1, 0.6, 0.1), // Green
      });
    }

    // 6. Save and send the final PDF
    const finalPdfBytes = await pdfDoc.save();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="converted-report.pdf"');
    res.status(200).send(Buffer.from(finalPdfBytes));

  } catch (error) {
    if (browser) await browser.close();
    console.error('HTML to PDF Error:', error);
    res.status(500).send(`Failed to process HTML to PDF: ${error.message}`);
  }
}