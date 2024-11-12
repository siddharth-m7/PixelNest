// static/js/script.js
document.addEventListener('DOMContentLoaded', function() {
    const imageInput = document.getElementById('imageInput');
    const image = document.getElementById('image');
    const cropBtn = document.getElementById('cropBtn');
    const resetBtn = document.getElementById('resetBtn');
    const backBtn = document.getElementById('backBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const editorContainer = document.querySelector('.editor-container');
    const resultContainer = document.querySelector('.result-container');
    const uploadSection = document.getElementById('uploadSection');
    const imageInfo = document.getElementById('imageInfo');
    
    let cropper = null;

    // Handle image upload
    imageInput.addEventListener('change', function(e) {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            
            reader.onload = function(e) {
                // Create temporary image to get dimensions
                const tempImage = new Image();
                tempImage.onload = function() {
                    // Update image info
                    imageInfo.textContent = `Original size: ${tempImage.width}×${tempImage.height}px`;
                    
                    // Display the image and initialize cropper
                    image.src = e.target.result;
                    uploadSection.style.display = 'none';
                    editorContainer.style.display = 'block';
                    resultContainer.style.display = 'none';
                    
                    // Destroy existing cropper if it exists
                    if (cropper) {
                        cropper.destroy();
                    }
                    
                    // Initialize Cropper.js with responsive settings
                    cropper = new Cropper(image, {
                        viewMode: 2,
                        dragMode: 'move',
                        aspectRatio: NaN,
                        autoCropArea: 0.9,
                        restore: false,
                        guides: true,
                        center: true,
                        highlight: false,
                        cropBoxMovable: true,
                        cropBoxResizable: true,
                        toggleDragModeOnDblclick: true,
                        responsive: true,
                        ready: function() {
                            // Adjust crop box based on image aspect ratio
                            const containerData = cropper.getContainerData();
                            const cropBoxData = cropper.getCropBoxData();
                            const aspect = tempImage.width / tempImage.height;
                            
                            if (aspect > 1) {
                                // Landscape
                                cropBoxData.width = containerData.width * 0.8;
                                cropBoxData.height = cropBoxData.width / aspect;
                            } else {
                                // Portrait
                                cropBoxData.height = containerData.height * 0.8;
                                cropBoxData.width = cropBoxData.height * aspect;
                            }
                            
                            cropper.setCropBoxData(cropBoxData);
                        }
                    });
                };
                tempImage.src = e.target.result;
            };
            
            reader.readAsDataURL(file);
        }
    });

    // Handle crop button click
    cropBtn.addEventListener('click', function() {
        if (!cropper) return;
        
        cropBtn.classList.add('loading');
        
        // Get crop data
        const cropData = cropper.getData();
        const imageData = cropper.getCroppedCanvas().toDataURL();

        // Send to server
        fetch('/crop', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                image: imageData,
                cropData: cropData
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                document.getElementById('croppedImage').src = data.cropped_image;
                editorContainer.style.display = 'none';
                resultContainer.style.display = 'block';
            } else {
                alert('Error cropping image: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error processing image');
        })
        .finally(() => {
            cropBtn.classList.remove('loading');
        });
    });

    // Reset cropper
    resetBtn.addEventListener('click', function() {
        if (cropper) {
            cropper.reset();
        }
    });

    // Go back to cropping
    backBtn.addEventListener('click', function() {
        uploadSection.style.display = 'none';
        editorContainer.style.display = 'block';
        resultContainer.style.display = 'none';
    });

    // Download cropped image
    downloadBtn.addEventListener('click', function() {
        const image = document.getElementById('croppedImage');
        const link = document.createElement('a');
        link.download = 'cropped-image.png';
        link.href = image.src;
        link.click();
    });
});