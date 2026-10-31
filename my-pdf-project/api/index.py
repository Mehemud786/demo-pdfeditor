from flask import Flask, request, send_file, render_template_string
from pypdf import PdfWriter
import io

app = Flask(__name__)

HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PDF Editor - Merge</title>
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 40px auto; padding: 20px; color: #333; }
        .upload-box { border: 2px dashed #ccc; padding: 30px; text-align: center; border-radius: 8px; background: #fafafa; }
        button { background: #000; color: #fff; border: none; padding: 12px 24px; cursor: pointer; border-radius: 6px; margin-top: 15px; font-size: 16px; font-weight: bold; }
        button:hover { background: #333; }
        input[type="file"] { margin: 15px 0; }
    </style>
</head>
<body>
    <h2>PDF Editor (Merger)</h2>
    <div class="upload-box">
        <form action="/api/merge" method="post" enctype="multipart/form-data">
            <p>Select multiple PDF files to merge them into a single document.</p>
            <input type="file" name="pdfs" multiple accept=".pdf" required>
            <br>
            <button type="submit">Merge PDFs</button>
        </form>
    </div>
</body>
</html>
"""

# Stacked routes prevent Vercel 404 pathing errors
@app.route('/')
@app.route('/api/index.py')
def index():
    return render_template_string(HTML_TEMPLATE)

@app.route('/api/merge', methods=['POST'])
def merge_pdfs():
    if 'pdfs' not in request.files:
        return "No files uploaded", 400
    
    files = request.files.getlist('pdfs')
    merger = PdfWriter()
    
    for pdf in files:
        if pdf.filename.endswith('.pdf'):
            merger.append(pdf)
    
    output_pdf = io.BytesIO()
    merger.write(output_pdf)
    output_pdf.seek(0)
    
    return send_file(
        output_pdf, 
        as_attachment=True, 
        download_name="merged_document.pdf", 
        mimetype="application/pdf"
    )