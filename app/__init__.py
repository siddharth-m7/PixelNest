# app/__init__.py

from flask import Flask
from .routes import main as main_blueprint
from .config import Config
import os

def create_app():
    # Set custom paths for static and templates folders
    template_dir = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'templates')
    static_dir = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'static')

    app = Flask(__name__, template_folder=template_dir, static_folder=static_dir)
    # Load the config file
    app.config.from_object(Config)
    # Register blueprints
    app.register_blueprint(main_blueprint)

    with app.app_context():
        upload_folder = app.config['UPLOAD_FOLDER']
        if not os.path.exists(upload_folder):
            os.makedirs(upload_folder)
    return app