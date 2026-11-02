// api/fetch-pdf.js
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

export default async function handler(req, res) {
    // Only accept POST requests for credentials
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { username, password, targetPdfUrl } = req.body;

    if (!username || !password || !targetPdfUrl) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    let browser = null;

    try {
        // 1. Launch the Vercel-optimized headless browser
        browser = await puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
        });

        const page = await browser.newPage();

        // 2. Navigate to the portal's login page
        // UPDATE THIS URL to the actual login page
        await page.goto('https://example.com/login', { waitUntil: 'networkidle2' });

        // 3. Automate the login process
        // UPDATE THESE SELECTORS to match the website's HTML elements
        await page.type('input[name="username"]', username);
        await page.type('input[name="password"]', password);
        
        await Promise.all([
            page.click('button[type="submit"]'),
            page.waitForNavigation({ waitUntil: 'networkidle2' }),
        ]);

        // 4. Extract the session cookies
        const cookies = await page.cookies();
        await browser.close();

        // 5. Format cookies for the fetch request
        const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');

        // 6. Fetch the actual PDF using the authenticated cookies
        const pdfResponse = await fetch(targetPdfUrl, {
            method: 'GET',
            headers: {
                'Cookie': cookieString,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        if (!pdfResponse.ok) {
            throw new Error(`Failed to download PDF. Status: ${pdfResponse.status}`);
        }

        const pdfArrayBuffer = await pdfResponse.arrayBuffer();
        const pdfBuffer = Buffer.from(pdfArrayBuffer);

        // 7. Serve the PDF back to the client
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="document.pdf"');
        return res.send(pdfBuffer);

    } catch (error) {
        console.error('Error fetching PDF:', error);
        if (browser) await browser.close();
        return res.status(500).json({ error: error.message });
    }
}