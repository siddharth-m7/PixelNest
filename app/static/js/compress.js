// DOM Elements
let dropZone, fileInput, qualityControl, infoPanel, previewContainer, 
    qualitySlider, qualityValue, form;

// State management
let currentFile = null;

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Initialize
function init() {
    // Safely get DOM elements with error handling
    try {
        dropZone = document.getElementById('dropZone');
        fileInput = document.getElementById('image');
        qualityControl = document.getElementById('qualityControl');
        infoPanel = document.getElementById('infoPanel');
        previewContainer = document.getElementById('previewContainer');
        qualitySlider = document.getElementById('quality');
        qualityValue = document.getElementById('qualityValue');
        form = document.getElementById('compressionForm');

        // Verify all required elements exist
        const requiredElements = [
            { name: 'dropZone', element: dropZone },
            { name: 'fileInput', element: fileInput },
            { name: 'qualityControl', element: qualityControl },
            { name: 'infoPanel', element: infoPanel },
            { name: 'previewContainer', element: previewContainer },
            { name: 'qualitySlider', element: qualitySlider },
            { name: 'qualityValue', element: qualityValue },
            { name: 'form', element: form }
        ];

        const missingElements = requiredElements.filter(item => !item.element);
        if (missingElements.length > 0) {
            throw new Error(`Missing required DOM elements: ${missingElements.map(item => item.name).join(', ')}`);
        }

        setupEventListeners();
    } catch (error) {
        console.error('Initialization error:', error);
        // Display user-friendly error message
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        errorMessage.textContent = 'There was an error initializing the image compressor. Please refresh the page or contact support.';
        document.body.insertBefore(errorMessage, document.body.firstChild);
    }
}

// Safe element update function
function safeUpdateElement(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
    } else {
        console.warn(`Element with id '${elementId}' not found`);
    }
}

// Updated updateInfoPanel function with safe updates
function updateInfoPanel(data) {
    if (!data) return;
    
    safeUpdateElement('originalSize', data.originalSize || '-');
    safeUpdateElement('compressedSize', data.compressedSize || '-');
    safeUpdateElement('originalDimensions', data.dimensions?.original || '-');
    safeUpdateElement('finalDimensions', data.dimensions?.final || '-');
    
    if (data.dimensions?.compression_percent) {
        safeUpdateElement('compressionPercent', `-${data.dimensions.compression_percent}%`);
    }
}

// Event Handlers
function preventDefaults(e) {
    e?.preventDefault();
    e?.stopPropagation();
}

function highlight(e) {
    dropZone?.classList.add('drag-over');
}

function unhighlight(e) {
    dropZone?.classList.remove('drag-over');
}

function triggerFileInput() {
    fileInput?.click();
}

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    
    if (files.length > 0) {
        handleFiles(files);
    }
}

function handleFileSelect(e) {
    if (e.target.files.length > 0) {
        handleFiles(e.target.files);
    }
}

function handleFiles(files) {
    if (files[0].type.startsWith('image/')) {
        currentFile = files[0];
        showPreview(currentFile);
        showControls();
        processImage(); // Initial processing without debounce
    } else {
        alert('Please upload an image file');
    }
}

// UI Updates
function showPreview(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const preview = document.getElementById('preview');
        if (preview) {
            preview.src = e.target.result;
            previewContainer.style.display = 'block';
        }
    }
    reader.readAsDataURL(file);
}

function showControls() {
    if (qualityControl) qualityControl.style.display = 'block';
    if (infoPanel) infoPanel.style.display = 'block';
}

// Image Processing
function processImage() {
    if (!currentFile) return;

    const formData = new FormData();
    formData.append('image', currentFile);
    formData.append('quality', qualitySlider?.value || '60');

    // Add loading state
    const downloadBtn = form?.querySelector('.download-btn');
    if (downloadBtn) {
        downloadBtn.disabled = true;
        downloadBtn.textContent = 'Processing...';
    }

    fetch('/compress', {
        method: 'POST',
        body: formData,
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            throw new Error(data.error);
        }
        updateInfoPanel(data);
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error processing image: ' + error.message);
    })
    .finally(() => {
        // Reset loading state
        if (downloadBtn) {
            downloadBtn.disabled = false;
            downloadBtn.textContent = 'Download Compressed Image';
        }
    });
}

// Create debounced version of processImage
const debouncedProcessImage = debounce(() => processImage(), 500);

// Updated handleQualityChangeImmediate with safe updates
function handleQualityChangeImmediate(e) {
    if (qualityValue) {
        qualityValue.textContent = `${qualitySlider?.value || 60}%`;
    }
    safeUpdateElement('compressedSize', 'Processing');
    safeUpdateElement('finalDimensions', 'Processing');
    safeUpdateElement('compressionPercent', '...');
}

// Updated setupEventListeners with null checks
function setupEventListeners() {
    if (!dropZone || !fileInput || !qualitySlider || !form) {
        console.error('Required DOM elements not found');
        return;
    }

    // Drag and drop events
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });

    dropZone.addEventListener('drop', handleDrop, false);
    dropZone.addEventListener('click', triggerFileInput);
    fileInput.addEventListener('change', handleFileSelect);
    qualitySlider.addEventListener('input', handleQualityChangeImmediate);
    qualitySlider.addEventListener('input', debouncedProcessImage);
    form.addEventListener('submit', handleSubmit);
}

// Form Submission
function handleSubmit(e) {
    if (!currentFile) {
        e.preventDefault();
        alert('Please select an image first');
    }
    // Let the form submit normally for file download
}

// Error Handling
function handleError(error) {
    console.error('Error:', error);
    alert('An error occurred: ' + error.message);
}

// Utility Functions
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Image Validation
function isValidImageFile(file) {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    return validTypes.includes(file.type);
}

// Progressive Enhancement
if (window.FileReader && window.Fetch) {
    dropZone?.classList.add('modern-browser');
} else {
    dropZone?.classList.add('legacy-browser');
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', init);