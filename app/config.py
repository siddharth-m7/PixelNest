# config.py

import os

class Config:
    UPLOAD_FOLDER = os.path.join('app', 'static', 'uploads')  # Define the upload folder
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB upload limit

os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)