from flask import Flask, Blueprint, render_template, request, jsonify, send_file, current_app, redirect, url_for
from werkzeug.utils import secure_filename
from PIL import Image, ImageEnhance, ImageFilter
import os
import io
import base64
from datetime import datetime
main = Blueprint('main', __name__)

def get_file_size(file_obj):
    """
    Get file size in KB/MB
    """
    file_obj.seek(0, os.SEEK_END)
    size_bytes = file_obj.tell()
    file_obj.seek(0)  # Reset file pointer
    
    if size_bytes < 1024 * 1024:  # Less than 1MB
        return f"{size_bytes / 1024:.2f} KB"
    else:
        return f"{size_bytes / (1024 * 1024):.2f} MB"
    

def compress_image(image, quality=60, max_size=(2000, 2000)):
    """
    Compress image while maintaining aspect ratio
    """
    # Get original dimensions
    original_width, original_height = image.size
    
    # Calculate aspect ratio-preserving dimensions
    img_width, img_height = image.size
    ratio = min(max_size[0]/img_width, max_size[1]/img_height)
    new_size = (int(img_width*ratio), int(img_height*ratio))
    
    # Resize image
    if ratio < 1:
        image = image.resize(new_size, Image.Resampling.LANCZOS)
    
    # Convert to RGB if image is in RGBA mode
    if image.mode == 'RGBA':
        image = image.convert('RGB')
    
    # Get original file size
    original_bytes = io.BytesIO()
    image.save(original_bytes, format='JPEG', quality=100)
    original_size = get_file_size(original_bytes)
    
    # Save compressed image to bytes
    compressed_bytes = io.BytesIO()
    image.save(compressed_bytes, format='JPEG', quality=quality, optimize=True)
    compressed_size = get_file_size(compressed_bytes)
    
    # Get final dimensions
    final_width, final_height = image.size
    
    # Calculate compression percentage
    original_bytes.seek(0, os.SEEK_END)
    original_size_bytes = original_bytes.tell()
    compressed_bytes.seek(0, os.SEEK_END)
    compressed_size_bytes = compressed_bytes.tell()
    compression_percent = round((1 - compressed_size_bytes / original_size_bytes) * 100, 1)
    
    compressed_bytes.seek(0)
    return compressed_bytes, original_size, compressed_size, {
        'original': f"{original_width}x{original_height}",
        'final': f"{final_width}x{final_height}",
        'compression_percent': compression_percent
    }


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in {'png', 'jpg', 'jpeg', 'gif'}

@main.route('/')
def home():
    return render_template('home.html')



@main.route('/edit', methods=['GET', 'POST'])
def edit():
    return render_template('upload.html')


@main.route('/upload1', methods=['POST'])
def upload1():
    if request.method == 'POST':
        if 'file' not in request.files:
            return 'No file part'
        file = request.files['file']
        if file.filename == '':
            return 'No selected file'
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
            file.save(file_path)
            return redirect(url_for('main.edit_image', filename=filename))
    return 'Invalid file type'


@main.route('/edit/<filename>')
def edit_image(filename):
    return render_template('edit.html', filename=filename)

@main.route('/apply_edit', methods=['POST'])
def apply_edit():
    data = request.json
    filename = data['filename']
    
    # Parse incoming parameters
    brightness = float(data['brightness'])
    contrast = float(data['contrast'])
    saturation = float(data['saturation'])
    rotate_angle = float(data['rotate'])
    flip_horizontal = data['flip']
    
    sharpness = float(data['sharpness'])
    blur_radius = float(data['blur'])
    grayscale = data['grayscale']
    
       
    file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
    image = Image.open(file_path)

    # Apply enhancements
    image = adjust_brightness(image, brightness)
    image = adjust_contrast(image, contrast)
    image = adjust_saturation(image, saturation)
    image = rotate_image(image, rotate_angle)

    if flip_horizontal:
        image = image.transpose(Image.FLIP_LEFT_RIGHT)
        
    if sharpness > 0:
        image = adjust_sharpness(image, sharpness)

    if blur_radius > 0:
        image = image.filter(ImageFilter.GaussianBlur(blur_radius))


    if grayscale:
        image = image.convert("L")
    
    # Return the edited image
    img_io = io.BytesIO()
    image.save(img_io, format='JPEG')
    img_io.seek(0)

    return send_file(img_io, mimetype='image/jpeg')

# Helper functions for editing with Pillow
def adjust_brightness(image, brightness):
    enhancer = ImageEnhance.Brightness(image)
    return enhancer.enhance(brightness / 50)  # Scale (0-100) to factor (0-2)

def adjust_contrast(image, contrast):
    enhancer = ImageEnhance.Contrast(image)
    return enhancer.enhance(contrast / 50)  # Scale (0-100) to factor (0-2)

def adjust_saturation(image, saturation):
    enhancer = ImageEnhance.Color(image)
    return enhancer.enhance(saturation / 50)  # Scale (0-100) to factor (0-2)

def adjust_sharpness(image, sharpness):
    enhancer = ImageEnhance.Sharpness(image)
    return enhancer.enhance(sharpness / 50)  # Scale (0-100) to factor (0-2)

def rotate_image(image, angle):
    return image.rotate(angle, expand=True)




@main.route('/crop')
def crop():
    return render_template('cropper.html')

@main.route('/crop', methods=['POST'])
def crop_image():
    try:
        # Get the base64 string from the request
        data = request.json
        image_data = data['image'].split(',')[1]
        crop_data = data['cropData']
        
        # Convert base64 to image
        img_bytes = base64.b64decode(image_data)
        img = Image.open(io.BytesIO(img_bytes))
        
        # Crop image
        cropped = img.crop((
            int(float(crop_data['x'])),
            int(float(crop_data['y'])),
            int(float(crop_data['x'] + crop_data['width'])),
            int(float(crop_data['y'] + crop_data['height']))
        ))
        
        # Save to bytes
        output = io.BytesIO()
        cropped.save(output, format='PNG')
        output.seek(0)
        
        # Convert back to base64
        cropped_base64 = base64.b64encode(output.getvalue()).decode()
        
        return jsonify({
            'status': 'success',
            'cropped_image': f'data:image/png;base64,{cropped_base64}'
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 400


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
    

@main.route('/suppprt')
def support():
    return render_template('support.html')



@main.route('/compress')
def compress_temp():
    return render_template('compress.html')

@main.route('/compress', methods=['POST'])
def compress():
    if 'image' not in request.files:
        return 'No image uploaded', 400
    
    file = request.files['image']
    if file.filename == '':
        return 'No selected file', 400
    
    try:
        # Get quality from form, default to 60 if not specified
        quality = int(request.form.get('quality', 60))
        # Ensure quality is between 1 and 100
        quality = max(1, min(100, quality))
        
        # Open and compress image
        image = Image.open(file)
        compressed_image, original_size, compressed_size, dimensions = compress_image(image, quality=quality)
        
        # If it's an AJAX request, return the sizes
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return jsonify({
                'originalSize': original_size,
                'compressedSize': compressed_size,
                'dimensions': dimensions
            })
        
        # Otherwise return the compressed file
        return send_file(
            compressed_image,
            mimetype='image/jpeg',
            as_attachment=True,
            download_name='compressed_' + file.filename
        )
        
    except Exception as e:
        return str(e), 400
