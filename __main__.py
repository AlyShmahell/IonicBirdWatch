import os
from flask import Flask
from flask_restful import Api
from werkzeug.security import generate_password_hash, check_password_hash
from models import User, db, authorize, login_manager
from routes import Index, Profile, Signin, AddUser, Signout, StaticFile


if __name__ == '__main__':
    app = Flask(__name__)
    app.config['SECRET_KEY']                     = str(os.urandom(24).hex())
    app.config['SQLALCHEMY_DATABASE_URI']        = 'sqlite:///db.sqlite'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['FLASK_APP']                      = 'project'
    app.config['FLASK_DEBUG']                    = 1
    authorize.init_app(app)
    db.init_app(app)
    login_manager.init_app(app)
    login_manager.login_view                     = 'signin'
    api = Api(app)
    api.add_resource(Index,      '/')
    api.add_resource(Profile,    '/profile')
    api.add_resource(Signin,     '/signin')
    api.add_resource(AddUser,    '/adduser')
    api.add_resource(Signout,    '/signout')
    api.add_resource(StaticFile, '/static/<string:subdir>/<string:filename>')
    if not os.path.exists('db.sqlite'):
        with app.app_context():
            db.create_all()
    app.run(debug=True)
