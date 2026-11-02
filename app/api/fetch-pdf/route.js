import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Credentials required' }, { status: 400 });
    }

    // =====================================================================
    // STEP 1: Authenticate with the target external portal
    // =====================================================================
    const loginUrl = 'https://target-portal.com/api/login'; 
    
    const loginResponse = await fetch(loginUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Adjust payload keys based on what the portal expects
      body: JSON.stringify({ username, password }), 
    });

    if (!loginResponse.ok) {
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }

    // Extract the token or cookies. 
    // (If the portal uses cookies, you must parse the 'set-cookie' header instead)
    const authData = await loginResponse.json();
    const token = authData.token; 

    // =====================================================================
    // STEP 2: Fetch the PDF using the obtained credentials
    // =====================================================================
    const pdfUrl = 'https://target-portal.com/api/documents/target-doc.pdf'; 
    
    const pdfResponse = await fetch(pdfUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`, 
        // If cookie based: 'Cookie': loginResponse.headers.get('set-cookie') || ''
      },
    });

    if (!pdfResponse.ok) {
      return NextResponse.json({ error: 'Failed to retrieve PDF' }, { status: pdfResponse.status });
    }

    // Convert the response to an ArrayBuffer for transmission
    const pdfBuffer = await pdfResponse.arrayBuffer();

    // =====================================================================
    // STEP 3: Return the PDF to the Next.js client
    // =====================================================================
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="downloaded-document.pdf"',
      },
    });

  } catch (error) {
    console.error('PDF Fetch Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}