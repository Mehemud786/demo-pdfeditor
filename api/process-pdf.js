const { fetchPdf } = require('/utils/fetcher.js');
const { addTextToPdf } = require('/utils/pdfEditor.js');

export default async function handler(req, res) {
  // Restrict to POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // These should ideally be stored in Vercel Environment Variables
    const LOGIN_URL = process.env.LOGIN_URL;
    const PDF_URL = process.env.PDF_URL;
    const USERNAME = process.env.TARGET_USERNAME;
    const PASSWORD = process.env.TARGET_PASSWORD;

    const { customText } = req.body;

    // 1. Fetch the authenticated PDF
    const originalPdfBuffer = await fetchPdf(LOGIN_URL, PDF_URL, USERNAME, PASSWORD);

    // 2. Modify the PDF
    const modifiedPdfBuffer = await addTextToPdf(originalPdfBuffer, customText || "Edited via Vercel");

    // 3. Return the modified PDF to the client
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="edited-document.pdf"');
    res.status(200).send(modifiedPdfBuffer);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to process PDF', details: error.message });
  }
}