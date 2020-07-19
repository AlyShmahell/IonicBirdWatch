import os
from flask import Flask
from flask_restful import Api
from flask_cors import CORS
from flask_sqlalchemy import event
from werkzeug.security import generate_password_hash, check_password_hash
from models import Roles, Users, ReportCodes, db, authorize, login_manager
from routes import (Auth, 
                    AuthProfile, 
                    AuthProfileCat, 
                    AuthProfileDel, 
                    AuthWildLife, 
                    AuthReport,
                    GuestWildLifeMany, 
                    GuestWildLifeOne,
                    GuestReport)


def sqlitext(app):
    """loads sqlite extenstions into flask_sqlalchemy"""
    with app.app_context():
        @event.listens_for(db.engine, "first_connect")
        def connect(sqlite, connection_rec):
            sqlite.enable_load_extension(True)
            sqlite.execute("SELECT load_extension('./ext/libsqlitefunctions.so')")
            sqlite.enable_load_extension(False)
        @event.listens_for(db.engine, "connect")
        def connect(sqlite, connection_rec):
            sqlite.enable_load_extension(True)
            sqlite.execute("SELECT load_extension('./ext/libsqlitefunctions.so')")
            sqlite.enable_load_extension(False)


if __name__ == '__main__':
    app = Flask('WildWatch')
    CORS(app, supports_credentials=True)
    app.config['SECRET_KEY']                     = str(os.urandom(24).hex())
    app.config['SQLALCHEMY_DATABASE_URI']        = 'sqlite:///db.sqlite'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['FLASK_DEBUG']                    = True
    authorize.init_app(app)
    db.init_app(app)
    # sqlitext(app)
    login_manager.init_app(app)
    api = Api(app)
    api.add_resource(Auth,              '/auth')
    api.add_resource(AuthProfile,       '/auth/profile')
    api.add_resource(AuthProfileCat,    '/auth/profile/<string:category>')
    api.add_resource(AuthProfileDel,    '/auth/profile/<int:userid>')
    api.add_resource(AuthWildLife,      '/auth/wildlife')
    api.add_resource(AuthReport,        '/auth/report/<int:reportid>')
    api.add_resource(GuestWildLifeMany, '/guest/wildlife')
    api.add_resource(GuestWildLifeOne,  '/guest/wildlife/<int:wildlifeid>')
    api.add_resource(GuestReport,       '/guest/report')
    if not os.path.exists('db.sqlite'):
        with app.app_context():
            db.create_all()
            new_role = Roles(id=1, 
                             name='curator')
            db.session.add(new_role)
            db.session.commit()
            new_role = Roles(id=2, 
                             name='user')
            db.session.add(new_role)
            db.session.commit()
            new_user = Users(id = -1,
                             username='master', 
                             fullname='master', 
                             password=generate_password_hash(str(os.urandom(24).hex()), 
                                                                method='sha256'))
            db.session.add(new_user)
            db.session.commit()
            new_user = Users(username='curator', 
                             fullname='curator', 
                             password=generate_password_hash('curator', 
                                                                method='sha256'))
            db.session.add(new_user)
            db.session.commit()
            userole = Roles.query.filter_by(name = 'curator').first()
            new_user.roles.append(userole)
            db.session.commit()
            reportcode = ReportCodes(id=0, 
                                     name='Wild Fire')
            db.session.add(reportcode)
            db.session.commit()
            reportcode = ReportCodes(id=1, 
                                     name='Animal Abuse')
            db.session.add(reportcode)
            db.session.commit()
    app.run(debug=True, host = '127.0.0.1', port=5001)
