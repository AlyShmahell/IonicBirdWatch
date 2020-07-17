from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from flask_login import LoginManager
from flask_authorize import AllowancesMixin, RestrictionsMixin
from flask_authorize import PermissionsMixin
from flask_authorize import Authorize


authorize = Authorize()
login_manager = LoginManager()
db = SQLAlchemy()


UsersRoles = db.Table(
    'users_roles', db.Model.metadata,
    db.Column('id', db.Integer, primary_key=True),
    db.Column('userid', db.Integer, db.ForeignKey('users.id')),
    db.Column('roleid', db.Integer, db.ForeignKey('roles.id'))
)


class Users(UserMixin, db.Model):
    __tablename__ = 'users'
    id       = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(256), nullable=False)
    fullname = db.Column(db.String(100), nullable=False)
    website  = db.Column(db.String(100))
    bio      = db.Column(db.String(300))
    photo    = db.Column(db.LargeBinary(length=(2**32)-1), unique=True)
    roles    = db.relationship('Roles', secondary=UsersRoles)


class Roles(db.Model, AllowancesMixin):
    id     = db.Column(db.Integer, primary_key=True)
    name   = db.Column(db.String(255), nullable=False)


class WildLife(db.Model):
    __tablename__ = 'wildlife'
    id         = db.Column(db.Integer, primary_key=True)
    userid     = db.Column(db.Integer, db.ForeignKey('users.id'))
    type       = db.Column(db.String(300), nullable=False)
    species    = db.Column(db.String(300), nullable=False)
    notes      = db.Column(db.String(300), nullable=False)
    lat        = db.Column(db.Float, nullable=False)
    lon        = db.Column(db.Float, nullable=False)
    date       = db.Column(db.DateTime(), nullable=False)
    photo      = db.Column(db.LargeBinary(length=(2**32)-1), unique=True, nullable=False)


class Reports(db.Model):
    __tablename__ = 'reports'
    id         = db.Column(db.Integer, primary_key=True)
    userid     = db.Column(db.Integer, db.ForeignKey('roles.id'), nullable=True)
    wildlifeid = db.Column(db.Integer, db.ForeignKey('wildlife.id'), nullable=False)
    code       = db.Column(db.Integer, nullable=False)
    text       = db.Column(db.String(300), nullable=False)
    resolved   = db.Column(db.Boolean)


class ReportCodes(db.Model):
    __tablename__ = 'reportcodes'
    id         = db.Column(db.Integer, primary_key=True)
    name       = db.Column(db.String(300), nullable=False)



"""@db.event.listens_for(Users, "before_insert")
def insert_order_to_printer(mapper, connection, target):
    pass"""


@login_manager.user_loader
def get_id(user_id):
    return Users.query.get(int(user_id))