const axios = require('axios');

async function fetchPdf(loginUrl, pdfUrl, username, password) {
  try {
    // 1. Authenticate to get session cookie or JWT token
    const loginResponse = await axios.post(loginUrl, {
      username: username,
      password: password
    });

    // Extract token (Adjust this based on whether the site uses cookies or Bearer tokens)
    const token = loginResponse.data.token; 
    // OR const cookies = loginResponse.headers['set-cookie'];

    // 2. Fetch the PDF using the credentials
    const pdfResponse = await axios.get(pdfUrl, {
      headers: {
        Authorization: `Bearer ${token}` // Use Cookie: cookies if using session cookies
      },
      responseType: 'arraybuffer' // CRITICAL: Must be arraybuffer for binary PDF data
    });

    return pdfResponse.data;
  } catch (error) {
    throw new Error(`Failed to fetch PDF: ${error.message}`);
  }
}

module.exports = { fetchPdf };