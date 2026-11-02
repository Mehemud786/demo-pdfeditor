import { NextResponse } from 'next/server';

export async function GET() {
  // Load credentials and endpoints securely from Environment Variables
  const portalLoginUrl = process.env.PORTAL_LOGIN_URL!;
  const portalPdfUrl = process.env.PORTAL_PDF_URL!;
  const username = process.env.PORTAL_USERNAME!;
  const password = process.env.PORTAL_PASSWORD!;

  try {
    // 1. Authenticate with the external portal
    const authResponse = await fetch(portalLoginUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Note: Change to URLSearchParams if the portal expects x-www-form-urlencoded
      body: JSON.stringify({ username, password }),
    });

    if (!authResponse.ok) {
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }

    // Extract the session cookie or JWT token from the response
    const cookies = authResponse.headers.get('set-cookie');
    const token = authResponse.headers.get('authorization');
    
    // 2. Fetch the PDF using the retrieved credentials
    const pdfResponse = await fetch(portalPdfUrl, {
      method: 'GET',
      headers: {
        // Pass whichever auth method the portal requires
        ...(cookies ? { 'Cookie': cookies } : {}),
        ...(token ? { 'Authorization': token } : {})
      }
    });

    if (!pdfResponse.ok) {
        return NextResponse.json({ error: 'Failed to fetch PDF' }, { status: 500 });
    }

    // 3. Read the PDF into an ArrayBuffer
    const pdfBuffer = await pdfResponse.arrayBuffer();

    // 4. Return the PDF to the browser with correct headers
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        // Use 'inline' to display in the browser, or 'attachment' to force a download
        'Content-Disposition': 'inline; filename="document.pdf"', 
      },
    });

  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}