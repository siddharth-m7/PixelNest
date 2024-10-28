from flask import Blueprint, render_template, request, jsonify, send_file, current_app
from werkzeug.utils import secure_filename
from PIL import Image
import os
import io
from datetime import datetime
main = Blueprint('main', __name__)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in {'png', 'jpg', 'jpeg', 'gif'}


@main.route('/')
def home():
    return render_template('home.html')

@main.route('/ImgtoPdf')
def ImgtoPdf():
    return render_template('ImagetoPdf.html')

@main.route('/upload', methods=['POST'])
def upload_files():
    if 'files[]' not in request.files:
        return jsonify({'error': 'No files provided'}), 400
    
    files = request.files.getlist('files[]')
    uploaded_files = []
    
    for file in files:
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            unique_filename = f"{timestamp}_{filename}"
            filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], unique_filename)
            file.save(filepath)
            uploaded_files.append({
                'name': filename,
                'path': filepath,
                'preview_url': f"/static/uploads/{unique_filename}"
            })
    
    return jsonify({'files': uploaded_files})



@main.route('/convert', methods=['POST'])
def convert_to_pdf():
    data = request.json
    image_paths = data.get('images', [])
    pdf_name = data.get('pdfName', 'converted.pdf')
    
    if not image_paths:
        return jsonify({'error': 'No images provided'}), 400
    
    try:
        # Open first image
        first_image = Image.open(image_paths[0])
        # Convert mode if necessary
        if first_image.mode != 'RGB':
            first_image = first_image.convert('RGB')
            
        # Prepare other images
        other_images = []
        for path in image_paths[1:]:
            img = Image.open(path)
            if img.mode != 'RGB':
                img = img.convert('RGB')
            other_images.append(img)
            
        # Save to PDF
        pdf_buffer = io.BytesIO()
        first_image.save(pdf_buffer, format='PDF', save_all=True, append_images=other_images)
        pdf_buffer.seek(0)
        
        # Clean up uploaded files
        for path in image_paths:
            try:
                os.remove(path)
            except Exception as e:
                print(f"Error removing file {path}: {e}")
        
        return send_file(
            pdf_buffer,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=pdf_name if pdf_name.endswith('.pdf') else f"{pdf_name}.pdf"
        )
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
