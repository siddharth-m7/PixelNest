# config.py

import os

class Config:
    # UPLOAD_FOLDER = '/path/to/deployment/storage'
    UPLOAD_FOLDER = os.path.join('app', 'static', 'uploads')  # Define the upload folder local
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB upload limit
