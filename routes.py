import os, sys, json
import datetime
from flask import render_template, make_response, redirect, url_for, flash, send_from_directory, abort, Response
from flask_restful import Resource, request
from flask_login import login_required, current_user, login_user, logout_user
from werkzeug.exceptions import Unauthorized
from werkzeug.security import generate_password_hash, check_password_hash
from models import Users, Roles, WildLife, Reports, db, login_manager
from sqlalchemy import or_
from se import SearchEngine

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
                user = Users.query.filter_by(username=username).first() 
                if not user or not check_password_hash(user.password, password):
                    return 'user does not exists'
                login_user(user, remember=True)
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
        try:
            info["type"]     = request.json.get('type')
            info["species"]  = request.json.get('species')
            info["notes"]    = request.json.get('notes')
            info["photo"]    = request.json.get('photo').encode('utf_8')
            info["date"]     = request.json.get('date')
            info["location"] = request.json.get('location')
        except:
            abort(Response('wrong wildlife keys'))
        if any(x 
               for x in info.values() 
               if x == None):
            abort(Response('empty wildlife values'))
        info["date"] = datetime.datetime.strptime(info["date"], '%Y-%m-%d %H:%M:%S.%f')
        userole = Roles.query.filter_by(id=current_user.id).first() 
        if not userole:
            abort(Response('curator does not exist'))
        if userole.role == 'curator':
            abort(Response('you are a curator'))
        wildlife = WildLife.query.filter_by(photo=info["photo"]).first() 
        if wildlife:
            abort(Response('wildlife already exists'))
        new_wildlife = WildLife(type=info["type"], 
                                species=info["species"], 
                                notes=info["notes"],
                                photo=info["photo"], 
                                date=info["date"], 
                                lat=info["location"]["lat"], 
                                lon=info["location"]["lon"],
                                userid=current_user.id)
        db.session.add(new_wildlife)
        db.session.commit()
        return 200
    def get(self):
        info = {}
        try:
            info["text"]     = request.args.get('text')
            info["filters"]  = json.loads(request.args.get('filters'))
            info["location"] = json.loads(request.args.get('location'))
            info["area"]     = int(request.args.get('area'))
        except:
            abort(Response('wrong filter keys'))
        info = {k:v for k, v in info.items() if v is not None}
        info["filters"]['maxd'] = datetime.datetime.strptime(info["filters"]['maxd'], '%Y-%m-%d %H:%M:%S.%f')
        info["filters"]['mind'] = datetime.datetime.strptime(info["filters"]['mind'], '%Y-%m-%d %H:%M:%S.%f')
        wildlife = WildLife.query.filter(WildLife.lon  <= (info["location"]['lon'] + info["area"]))\
                                 .filter(WildLife.lon  >= (info["location"]['lon'] - info["area"]))\
                                 .filter(WildLife.lat  <= (info["location"]['lat'] + info["area"]))\
                                 .filter(WildLife.lat  >= (info["location"]['lat'] - info["area"]))\
                                 .filter(WildLife.date <= info["filters"]['maxd'])\
                                 .filter(WildLife.date >= info["filters"]['mind'])\
                                 .filter(or_(*[WildLife.type.like(name) for name in info['filters']['type']]))
        if info['filters']['by'] == 'me':
            wildlife = wildlife.filter_by(userid = current_user.id)
        wildlife = [{k: v for k,v in vars(a).items() if not k.startswith('_')} for a in wildlife.all()]
        wf = {}
        for wfo in wildlife:
            wfo['date']   = wfo['date'].strftime("%Y-%m-%d %H:%M:%S.%f")
            wfo['photo']  = wfo['photo'].decode("utf8") 
            wf[wfo['id']] =  wfo
        print([*wf.keys()])
        if info["text"] != "":
            se = SearchEngine(wf)
            r = se.cosine_similarity_T(.3, info["text"])
            print(r)
            wf = {
                k:v 
                for k, v in wf.items()
                if k in r
            }
        return wf, 200