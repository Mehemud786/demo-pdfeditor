import axios from 'axios';

export default async function handler(req, res) {
    // We restrict to GET requests for downloading
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Replace these with your target portal's actual URLs and payload structure
    const LOGIN_URL = 'https://example-portal.com/api/login';
    const PDF_URL = 'https://example-portal.com/api/documents/12345.pdf';

    try {
        // STEP 1: Authenticate with the portal
        const loginResponse = await axios.post(LOGIN_URL, {
            username: process.env.PORTAL_USERNAME,
            password: process.env.PORTAL_PASSWORD
        });

        // STEP 2: Extract the authentication mechanism.
        // Most portals use either a 'Set-Cookie' header or return a JSON token.
        // Option A (Cookies):
        const cookies = loginResponse.headers['set-cookie'];
        const cookieString = cookies ? cookies.join('; ') : '';

        // Option B (JWT/Bearer Token) - uncomment if the portal uses this instead:
        // const token = loginResponse.data.token;

        // STEP 3: Fetch the PDF using the session data
        const pdfResponse = await axios.get(PDF_URL, {
            headers: {
                'Cookie': cookieString,
                // 'Authorization': `Bearer ${token}` // Use this if portal uses JWT
            },
            // Crucial: Tells axios to handle the response as raw binary data
            responseType: 'arraybuffer' 
        });

        // STEP 4: Return the PDF to the client
        res.setHeader('Content-Type', 'application/pdf');
        // Use 'inline' to view in browser, or 'attachment' to force download
        res.setHeader('Content-Disposition', 'inline; filename="fetched-document.pdf"');
        res.status(200).send(pdfResponse.data);

    } catch (error) {
        console.error("Failed to fetch PDF:", error.message);
        // Fallback for API errors
        if (error.response) {
            return res.status(error.response.status).json({ 
                error: 'Upstream portal error', 
                details: error.response.statusText 
            });
        }
        res.status(500).json({ error: 'Internal Server Error' });
    }
}