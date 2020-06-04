import os, sys, json
import datetime
from flask import abort, Response
from flask_restful import Resource, request
from flask_login import login_required, current_user, login_user, logout_user
from werkzeug.exceptions import Unauthorized
from werkzeug.security import generate_password_hash, check_password_hash
from models import Users, Roles, WildLife, Reports, db, login_manager
from sqlalchemy import or_
from search import *

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
    @login_required
    def delete(self):
        logout_user()
        return 200


class AuthProfile(Resource):
    @login_required
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
    @login_required
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
            logout_user()
            return 200
        else:
            abort(Response('user does not exist'))


class AuthProfileCat(Resource):
    @login_required
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
    @login_required
    def delete(self, userid):
        userole = Roles.query.filter_by(id=current_user.id).first() 
        if not userole:
            abort(Response('curator does not exist'))
        if userole.role != 'curator':
            abort(Response('you are not a curator'))
        if userid == current_user.id:
            abort(Response('curator cannot delete self'))
        userole = Roles.query.filter_by(id=userid).first() 
        user    = Users.query.filter_by(id=userid).first() 
        if user:
            db.session.delete(userole)
            db.session.commit()
            db.session.delete(user)
            db.session.commit()
            return 200
        else:
            abort(Response('id does not exist'))


class AuthWildLife(Resource):
    @login_required
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
    @login_required
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
        wildlife = WildLife.query.filter(
                                    (
                                        (WildLife.lon - info["location"]['lon'])*(WildLife.lon - info["location"]['lon']) + 
                                        (WildLife.lat  - info["location"]['lat'])*(WildLife.lat  - info["location"]['lat'])
                                    ) <= info["area"]
                                )\
                                 .filter(WildLife.date <= info["filters"]['maxd'])\
                                 .filter(WildLife.date >= info["filters"]['mind'])\
                                 .filter(or_(*[WildLife.type.like(name) for name in info['filters']['type']]))
        if info['filters']['by'] == 'me':
            wildlife = wildlife.filter_by(userid = current_user.id)
        wildlife = [{k: v for k,v in vars(a).items() if not k.startswith('_')} for a in wildlife.all()]
        wf  = []
        doc = []
        for wfo in wildlife:
            wfo['date']   = wfo['date'].strftime("%Y-%m-%d %H:%M:%S.%f")
            wfo['photo']  = wfo['photo'].decode("utf8") 
            wf.append(wfo)  
            doc.append(wfo['notes'])  
        if info["text"] != "":
            se = SearchEngine(doc, query=info["text"], theshold=.1)
            wf = [x for (i,x) in enumerate(wf) if i in se]
        userole = Roles.query.filter_by(id=current_user.id).first() 
        if userole.role == 'curator':
            for wfo in wf:
                reports = Reports.query.filter(Reports.wildlifeid == wfo['id'])\
                                       .filter(Reports.resolved   != True)
                reports = [{k: v for k,v in vars(a).items() if not k.startswith('_')} for a in reports.all()]
                wfo['reports'] = reports
        return wf, 200

class GuestWildLifeOne(Resource):
    def get(self, wildlifeid=None):
        if wildlifeid is not None:
            wildlife =  WildLife.query.filter_by(id=wildlifeid).first()
            if wildlife:
                wildlife = {k: v for k,v in vars(wildlife).items() if not k.startswith('_')}
                wildlife['date']   = wildlife['date'].strftime("%Y-%m-%d %H:%M:%S.%f")
                wildlife['photo']  = wildlife['photo'].decode("utf8")
                return wildlife
            else:
                abort(Response('wrong wildlife id'))
        else:
            abort(Response('no wildlife id'))

class GuestWildLifeMany(Resource):
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
        wildlife = WildLife.query.filter(
                                    (
                                        (WildLife.lon - info["location"]['lon'])*(WildLife.lon - info["location"]['lon']) + 
                                        (WildLife.lat  - info["location"]['lat'])*(WildLife.lat  - info["location"]['lat'])
                                    ) <= info["area"]
                                )\
                                 .filter(WildLife.date <= info["filters"]['maxd'])\
                                 .filter(WildLife.date >= info["filters"]['mind'])\
                                 .filter(or_(*[WildLife.type.like(name) for name in info['filters']['type']]))
        wildlife = [{k: v for k,v in vars(a).items() if not k.startswith('_')} for a in wildlife.all()]
        wf  = []
        doc = []
        for wfo in wildlife:
            wfo['date']   = wfo['date'].strftime("%Y-%m-%d %H:%M:%S.%f")
            wfo['photo']  = wfo['photo'].decode("utf8") 
            wf.append(wfo)  
            doc.append(wfo['notes'])  
        if info["text"] != "":
            se = SearchEngine(doc, query=info["text"], theshold=.1)
            wf = [x for (i,x) in enumerate(wf) if i in se]
        return wf, 200



class GuestReport(Resource):
    def post(self):
        info = {}
        try:
            info["code"]       = int(request.json.get('code'))
            info["text"]       = str(request.json.get('text'))
            info["wildlifeid"] = int(request.json.get('wildlifeid'))
        except:
            abort(Response('wrong report keys'))
        if any(x 
               for x in info.values() 
               if x == None):
            abort(Response('empty report values'))
        wildlife = WildLife.query.filter_by(id = info["wildlifeid"]).first()
        if not wildlife:
            abort(Response('wildlife does not exist'))
        new_report = Reports(text=info["text"], 
                             code=info["code"], 
                             wildlifeid=info["wildlifeid"],
                             resolved=False)
        db.session.add(new_report)
        db.session.commit()
        return 200



class AuthReport(Resource):
    @login_required
    def put(self, reportid):
        userole = Roles.query.filter_by(id=current_user.id).first() 
        if userole.role != 'curator':
            abort(Response('not a curator'))
        reportid = int(reportid)
        cascade  = bool(request.args.get('cascade')) if request.args.get('cascade') is not None else False
        report = Reports.query.filter(Reports.id==reportid).filter(Reports.resolved == False).first()
        if not report:
            abort(Response('report does not exist'))
        try:
            success = Reports.query.filter(Reports.id==reportid).filter(Reports.resolved == False).update({'resolved': True, 'userid': current_user.id})
            db.session.commit()
            return 200
        except:
            abort(Response('report does not exist'))
        if cascade:
            try:
                reports = Reports.query.filter_by(wildlifeid = report.wildlifeid).update({'resolved': True, 'userid': current_user.id})
                db.session.commit()
                return 200
            except:
                abort(Response('further reports do not exist'))
    @login_required
    def delete(self, reportid):
        userole = Roles.query.filter_by(id=current_user.id).first() 
        if userole.role != 'curator':
            abort(Response('not a curator'))
        cascade    = bool(request.args.get('cascade')) if request.args.get('cascade') is not None else False
        report = Reports.query.filter_by(id = reportid).first()
        wildlifeid = report.wildlifeid
        try:
            db.session.delete(report)
            db.session.commit()
            return 200
        except:
            abort(Response('report does not exist'))
        if cascade:
            try:
                wildlife = WildLife.query.filter_by(id=wildlifeid)
                db.session.delete(wildlife)
                db.session.commit()
                reports = Reports.query.filter_by(wildlifeid = wildlifeid)
                for report in reports.all():
                    db.session.delete(report)
                    db.session.commit()
                return 200
            except:
                abort(Response('report does not exist'))