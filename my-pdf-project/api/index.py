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
        body { font-family: sans-serif; max-width: 600px; margin: 40px auto; padding: 20px; }
        .upload-box { border: 2px dashed #ccc; padding: 20px; text-align: center; border-radius: 8px; }
        button { background: #000; color: #fff; border: none; padding: 10px 20px; cursor: pointer; border-radius: 5px; margin-top: 15px; }
    </style>
</head>
<body>
    <h2>PDF Editor (Merger)</h2>
    <div class="upload-box">
        <form action="/api/merge" method="post" enctype="multipart/form-data">
            <p>Select multiple PDF files to merge them into one.</p>
            <input type="file" name="pdfs" multiple accept=".pdf" required>
            <br>
            <button type="submit">Merge PDFs</button>
        </form>
    </div>
</body>
</html>
"""

@app.route('/')
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