import os
from flask import render_template, make_response, redirect, url_for, flash, send_from_directory, abort, Response
from flask_restful import Resource, request
from flask_login import login_required, current_user, login_user, logout_user
from werkzeug.exceptions import Unauthorized
from werkzeug.security import generate_password_hash, check_password_hash
from models import Users, Roles, WildLife, Reports, db, login_manager


class Auth(Resource):
    def post(self):
        username = request.json.get('username')
        password = request.json.get('password')
        fullname = request.json.get('fullname')
        try:
            assert username is not None
            assert password is not None
            assert fullname is not None
            user = Users.query.filter_by(username=username).first() 
            if user:
                print('user already exists')
                return 'user already exists'
            new_user = Users(username=username, 
                             fullname=fullname, 
                             password=generate_password_hash(password, 
                                                            method='sha256'))
            db.session.add(new_user)
            db.session.commit()
            new_role = Roles(id=new_user.id, 
                             role='user')
            db.session.add(new_role)
            db.session.commit()
            return 'signed up'
        except:
            try:
                assert username is not None
                assert password is not None
                print(f"username: {username}, password: {password}")
                user = Users.query.filter_by(username=username).first() 
                if not user or not check_password_hash(user.password, password):
                    print('user does not exists')
                    return 'user does not exists'
                print(f'logging in: {user.password}')
                login_user(user, remember=True)
                print(f'logged in')
                return 'signed in'
            except:
                return 'incorrect credential keys'

    def delete(self):
        logout_user()
        return 200


class AuthProfile(Resource):
    def get(self):
        userole = Roles.query.filter_by(id=current_user.id).first() 
        if not userole:
            abort(Response('curator does not exist'))
        if userole.role == 'curator':
            abort(Response('you are a curator'))
        user = Users.query.filter_by(username=current_user.username).first() 
        if user:
            return {'username': user.username, 
                    'password': user.password, 
                    'fullname': user.fullname,
                    'bio': user.bio,
                    'website': user.website,
                    'photo': user.photo}, 200
        else:
            abort(Response('user does not exist'))
    def delete(self):
        userole = Roles.query.filter_by(id=current_user.id).first() 
        if not userole:
            abort(Response('curator does not exist'))
        if userole.role == 'curator':
            abort(Response('you are a curator'))
        user = Users.query.filter_by(username=current_user.username).first() 
        if user:
            db.session.delete(userole)
            db.session.commit()
            db.session.delete(user)
            db.session.commit()
            return 200
        else:
            abort(Response('user does not exist'))


class AuthProfileCat(Resource):
    def put(self, category):
        userole = Roles.query.filter_by(id=current_user.id).first() 
        if not userole:
            abort(Response('curator does not exist'))
        if userole.role == 'curator':
            abort(Response('you are a curator'))
        value = request.json.get('value')
        user = Users.query.filter_by(username=current_user.username).first() 
        mapper = {
            'password': Users.password,
            'fullname': Users.fullname,
            'website': Users.website,
            'bio': Users.bio,
            'photo': Users.photo
        }
        try:
            success = Users.query.filter_by(username=current_user.username).update({mapper[category]: value})
            db.session.commit()
            return 200
        except:
            abort(Response('user does not exist'))

class AuthProfileDel(Resource):
    def delete(self, userid):
        value   = request.json.get('value')
        userole = Roles.query.filter_by(id=current_user.id).first() 
        if not userole:
            abort(Response('curator does not exist'))
        if userole.role != 'curator':
            abort(Response('you are not a curator'))
        user = Users.query.filter_by(id=userid).first() 
        if user:
            db.session.delete(user)
            db.session.commit()
            return 200
        else:
            abort(Response('id does not exist'))


class AuthWildLife(Resource):
    def post(self):
        info = {}
        print (request.headers, request.form, request.files, request.data, request.json)
        try:
            info["type"]     = request.json.get('type')
            info["species"]  = request.json.get('species')
            info["notes"]    = request.json.get('notes')
            info["photo"]    = request.json.get('photo')
            info["date"]     = request.json.get('date')
            info["location"] = request.json.get('location')
        except:
            abort(Response('wrong wildlife keys'))
        if any(x 
               for x in info.values() 
               if x == None):
            abort(Response('empty wildlife values'))
        
        userole = Roles.query.filter_by(id=current_user.id).first() 
        if not userole:
            abort(Response('curator does not exist'))
        if userole.role == 'curator':
            abort(Response('you are a curator'))
        wildlife = WildLife.query.filter_by(photo=info["photo"]).first() 
        if wildlife:
            abort(Response('user already exists'))
        new_wildlife = WildLife(type=info["type"], 
                                species=info["species"], 
                                notes=info["notes"],
                                photo=info["photo"], 
                                date=info["date"], 
                                location=info["location"])
        db.session.add(new_wildlife)
        db.session.commit()
        return 200
    def get(self):
        info = {}
        try:
            info["text"]     = request.args.get('text')
            info["filters"]  = request.args.get('filters')
            info["location"] = request.args.get('location')
            info["area"]     = request.args.get('area')
        except:
            abort(Response('wrong filter keys'))
        info = {k:v for k, v in info.items() if v is not None}
        wildlife = WildLife.query.filter_by(WildLife.long < info["location"]['long'] + info["area"])\
                                 .filter_by(WildLife.long > info["location"]['long'] - info["area"])\
                                 .filter_by(WildLife.lat  < info["location"]['lat']  + info["area"])\
                                 .filter_by(WildLife.lat  < info["location"]['lat']  - info["area"])\
                                 .filter_by(WildLife.date < info["filters"]['maxd'])\
                                 .filter_by(WildLife.date > info["filters"]['mind'])\
                                 .filter_by(WildLife.type in info['filters']['type'])
        if info['filters']['by'] == 'me':
            wildlife = wildlife.filter_by(id = current_user.id)
        wildlife = wildlife.all() 
        return wildlife, 200