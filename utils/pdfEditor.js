const { PDFDocument, rgb } = require('pdf-lib');

async function addTextToPdf(pdfBuffer, customText) {
  // Load the fetched PDF document
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  
  // Get the first page of the document
  const pages = pdfDoc.getPages();
  const firstPage = pages[0];

  // Draw new text over the PDF
  firstPage.drawText(customText, {
    x: 50,
    y: firstPage.getHeight() - 100, // Near the top left
    size: 24,
    color: rgb(0.95, 0.1, 0.1), // Red color
  });

  // Save the modified document as bytes
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

module.exports = { addTextToPdf };