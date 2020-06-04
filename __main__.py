import os
from flask import Flask
from flask_restful import Api
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, authorize, login_manager
from routes import (Auth, 
                    AuthProfile, 
                    AuthProfileCat, 
                    AuthProfileDel, 
                    AuthWildLife, 
                    GuestWildLifeMany, 
                    GuestWildLifeOne)


if __name__ == '__main__':
    app = Flask('WildWatch')
    app.config['SECRET_KEY']                     = str(os.urandom(24).hex())
    app.config['SQLALCHEMY_DATABASE_URI']        = 'sqlite:///db.sqlite'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['FLASK_DEBUG']                    = True
    authorize.init_app(app)
    db.init_app(app)
    login_manager.init_app(app)
    api = Api(app)
    api.add_resource(Auth,              '/auth')
    api.add_resource(AuthProfile,       '/auth/profile')
    api.add_resource(AuthProfileCat,    '/auth/profile/<string:category>')
    api.add_resource(AuthProfileDel,    '/auth/profile/<string:userid>')
    api.add_resource(AuthWildLife,      '/auth/wildlife')
    api.add_resource(GuestWildLifeMany, '/guest/wildlife')
    api.add_resource(GuestWildLifeOne,  '/guest/wildlife/<int:wildlifeid>')

    
    if not os.path.exists('db.sqlite'):
        with app.app_context():
            db.create_all()
    app.run(debug=True)
