import os, sys, json, re
import datetime
from flask import Response
from flask_restful import Resource, request, abort
from flask_login import login_required, current_user, login_user, logout_user
from werkzeug.exceptions import Unauthorized
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.datastructures import Headers
from models import Users, Roles, WildLife, Reports, ReportCodes, db, login_manager, authorize
from sqlalchemy import or_
from search import *
import functools


headers = Headers()
headers.add('Access-Control-Allow-Origin', 'http://127.0.0.1:8100')
headers.add('Access-Control-Allow-Credentials', 'true')


def has_role(role=None):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            if bool(authorize.has_role(role)):
                value = func(*args, **kwargs)
                return value
            else:
                abort(403, error_message=f"({current_user.fullname} != {role}) => permission denied", headers = headers)
        return wrapper
    return decorator


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
                return Response(
                response = json.dumps({
                    "message": "account already exists"
                    }),
                status=409,
                mimetype="application/json",
                headers = headers
            )
            new_user = Users(username=username, 
                             fullname=fullname, 
                             password=generate_password_hash(password, 
                                                            method='sha256'))
            db.session.add(new_user)
            db.session.commit()
            userole = Roles.query.filter_by(name = 'user').first()
            new_user.roles.append(userole)
            db.session.commit()
            return Response(
                response = json.dumps({
                    "message": "success"
                    }),
                status=201,
                mimetype="application/json",
                headers = headers
            )
        except:
            try:
                assert username is not None
                assert password is not None
                user = Users.query.filter_by(username=username).first() 
                if not user or not check_password_hash(user.password, password):
                    return Response(
                        response = json.dumps({
                            "message": "account does not exist"
                            }),
                        status=404,
                        mimetype="application/json",
                        headers = headers
                    )
                login_user(user, remember=True, force=True)
                return Response(
                    response = json.dumps({
                        "message": "success",
                        'role': user.roles[0].name
                        }),
                    status=200,
                    mimetype="application/json",
                    headers = headers
                )
            except:
                return Response(
                response = json.dumps({
                    "message": "incorrect credentials"
                    }),
                status=401,
                mimetype="application/json",
                headers = headers
            )
    @login_required
    def delete(self):
        logout_user()
        return Response(
                response = json.dumps({
                    "message": "success"
                    }),
                status=200,
                mimetype="application/json",
                headers = headers
            )


class AuthProfile(Resource):
    @login_required
    @has_role('user')
    def get(self):
        user = Users.query.filter_by(username=current_user.username).first() 
        if user:
            if user.photo is None:
                user.photo = ""
            else:
                user.photo = user.photo.decode("utf8")
            return Response(
                response = json.dumps({
                    "data": {'username': user.username, 
                    'password': user.password, 
                    'fullname': user.fullname,
                    'bio': user.bio,
                    'website': user.website,
                    'photo': user.photo}
                    }),
                status=200,
                mimetype="application/json",
                headers = headers
            )
        else:
            abort(404, error_message=f"user does not exist", headers = headers)
    @login_required
    @has_role('user')
    def delete(self):
        user = Users.query.filter_by(username=current_user.username).first() 
        if user:
            WildLife.query.filter_by(userid=user.id).update({'userid': -1})
            db.session.delete(user)
            db.session.commit()
            logout_user()
            return Response(
                response = json.dumps({
                    "message": "success"
                    }),
                status=200,
                mimetype="application/json",
                headers = headers
            )
        else:
            abort(404, error_message=f"user does not exist", headers = headers)


class AuthProfileCat(Resource):
    @login_required
    @has_role('user')
    def put(self, category):
        value = request.json.get('value')
        if category == 'photo':
            value = value.encode('utf_8')
        user = Users.query.filter_by(username=current_user.username).first() 
        mapper = {
            'password': Users.password,
            'fullname': Users.fullname,
            'website': Users.website,
            'bio': Users.bio,
            'photo': Users.photo
        }
        try:
            if category == 'password':
                value = generate_password_hash(value, method='sha256')
            success = Users.query.filter_by(username=current_user.username).update({mapper[category]: value})
            db.session.commit()
            return Response(
                response = json.dumps({
                    "message": "success"
                    }),
                status=200,
                mimetype="application/json",
                headers = headers
            )
        except:
            abort(404, error_message=f"user does not exist", headers = headers)

class AuthProfileDel(Resource):
    @login_required
    @has_role('curator')
    def delete(self, userid):
        if userid == current_user.id:
            abort(403, error_message=f"curator cannot delete self", headers = headers)
        user    = Users.query.filter_by(id=userid).first() 
        if user:
            db.session.delete(user)
            db.session.commit()
            return Response(
                response = json.dumps({
                    "message": "success"
                    }),
                status=200,
                mimetype="application/json",
                headers = headers
            )
        else:
            abort(403, error_message=f"user id does not exist", headers = headers)


class AuthWildLife(Resource):
    @login_required
    @has_role('user')
    def post(self):
        info = {}
        try:
            info["type"]     = request.json.get('type')
            info["species"]  = request.json.get('species')
            info["notes"]    = request.json.get('notes')
            info["photo"]    = request.json.get('photo').encode('utf_8')
            info["date"]     = request.json.get('date')
            info["lon"]      = float(request.json.get('lon'))
            info["lat"]      = float(request.json.get('lat'))
        except:
            abort(422, error_message=f"wrong wilflife dictionary keys", headers = headers)
        if any(x 
               for x in info.values() 
               if x == None):
            abort(422, error_message=f"empty wilflife dictionary values", headers = headers)
        info["date"] = datetime.datetime.strptime(info["date"], '%Y-%m-%dT%H:%M:%S.%fZ')
        wildlife = WildLife.query.filter_by(photo=info["photo"]).first() 
        if wildlife:
            abort(409, error_message=f"wildlife entry already exists", headers = headers)
        new_wildlife = WildLife(type=info["type"], 
                                species=info["species"], 
                                notes=info["notes"],
                                photo=info["photo"], 
                                date=info["date"], 
                                lat=info["lat"], 
                                lon=info["lon"],
                                userid=current_user.id)
        db.session.add(new_wildlife)
        db.session.commit()
        return Response(
                response = json.dumps({
                    "message": "success"
                    }),
                status=200,
                mimetype="application/json",
                headers = headers
            )
    @login_required
    def get(self):
        info = {}
        try:
            info["text"]     = str(request.args.get('text'))
            info["text"]     = re.sub(r'[\'\"]', '', info["text"])
            info["maxd"]     = datetime.datetime.strptime(request.args.get('maxd'), '%Y-%m-%dT%H:%M:%S.%fZ')
            info["mind"]     = datetime.datetime.strptime(request.args.get('mind'), '%Y-%m-%dT%H:%M:%S.%fZ')
            info["by"]       = request.args.get('by')
            info["type"]     = [x.strip() for x in json.loads(request.args.get('type').replace('\'', '\"'))]
            info["lon"]      = float(request.args.get('lon'))
            info["lat"]      = float(request.args.get('lat'))
            info["area"]     = float(request.args.get('area'))
        except:
            abort(422, error_message=f"wrong query keys", headers = headers)
        info = {k:v for k, v in info.items() if v is not None}
        wildlife = WildLife.query.filter(
                                    (
                                        (WildLife.lon - info['lon'])*(WildLife.lon - info['lon']) + 
                                        (WildLife.lat  - info['lat'])*(WildLife.lat  - info['lat'])
                                    ) <= info["area"]**2
                                )\
                                 .filter(WildLife.date <= info['maxd'])\
                                 .filter(WildLife.date >= info['mind'])
        if not (len(info['type']) == 1 and info['type'][0] == ''):
            wildlife = wildlife.filter(or_(*[WildLife.type.like(name) for name in info['type']]))
        if info.get('by') == 'me':
            wildlife = wildlife.filter_by(userid = current_user.id)
        wildlife = [{k: v for k,v in vars(a).items() if not k.startswith('_')} for a in wildlife.all()]
        wf  = []
        doc = []
        for wfo in wildlife:
            wfo['date']   = wfo['date'].strftime("%Y-%m-%dT%H:%M:%S.%fZ")
            wfo['photo']  = wfo['photo'].decode("utf8") 
            wf.append(wfo)  
            doc.append(wfo['notes'])  
        if info["text"] != "":
            se = SearchEngine(doc, query=info["text"], theshold=.1)
            wf = [x for (i,x) in enumerate(wf) if i in se]
        if bool(authorize.has_role('curator')):
            for wfo in wf:
                reports = Reports.query.join(ReportCodes, ReportCodes.id==Reports.code)\
                                       .add_columns(ReportCodes.name, Reports.code, Reports.text, Reports.id)\
                                       .filter(Reports.wildlifeid == wfo['id'])\
                                       .filter(Reports.resolved   != True)
                reports = [{'code': a.code, 'title': a.name, 'text': a.text, 'id': a.id} for a in reports]
                wfo['reports'] = reports
        return Response(
                response = json.dumps({
                    "data": wf
                    }),
                status=200,
                mimetype="application/json",
                headers = headers
            )

class GuestWildLifeOne(Resource):
    def get(self, wildlifeid=None):
        if wildlifeid is not None:
            wildlife =  WildLife.query.filter_by(id=wildlifeid).first()
            if wildlife:
                wildlife = {k: v for k,v in vars(wildlife).items() if not k.startswith('_')}
                wildlife['date']   = wildlife['date'].strftime("%Y-%m-%dT%H:%M:%S.%fZ")
                wildlife['photo']  = wildlife['photo'].decode("utf8")
                return Response(
                response = json.dumps({
                    "data": wildlife
                    }),
                status=200,
                mimetype="application/json",
                headers = headers
            )
            else:
                abort(403, error_message=f"wildlife id does not exist", headers = headers)
        else:
            abort(422, error_message=f"no wildlife id provided", headers = headers)

class GuestWildLifeMany(Resource):
    def get(self):
        info = {}
        try:
            info["text"]     = str(request.args.get('text')).strip("\"")
            info["maxd"]     = datetime.datetime.strptime(request.args.get('maxd'), '%Y-%m-%dT%H:%M:%S.%fZ')
            info["mind"]     = datetime.datetime.strptime(request.args.get('mind'), '%Y-%m-%dT%H:%M:%S.%fZ')
            info["by"]       = request.args.get('by')
            info["type"]     = [x.strip() for x in json.loads(request.args.get('type').replace('\'', '\"'))]
            info["lon"]      = float(request.args.get('lon'))
            info["lat"]      = float(request.args.get('lat'))
            info["area"]     = float(request.args.get('area'))
        except:
            abort(422, error_message=f"wrong query keys", headers = headers)
        info = {k:v for k, v in info.items() if v is not None}
        wildlife = WildLife.query.filter(
                                    (
                                        (WildLife.lon - info['lon'])*(WildLife.lon - info['lon']) + 
                                        (WildLife.lat  - info['lat'])*(WildLife.lat  - info['lat'])
                                    ) <= info["area"]**2
                                )\
                                 .filter(WildLife.date <= info['maxd'])\
                                 .filter(WildLife.date >= info['mind'])
        if not (len(info['type']) == 1 and info['type'][0] == ''):
            wildlife = wildlife.filter(or_(*[WildLife.type.like(name) for name in info['type']]))
        wildlife = [{k: v for k,v in vars(a).items() if not k.startswith('_')} for a in wildlife.all()]
        wf  = []
        doc = []
        for wfo in wildlife:
            wfo['date']   = wfo['date'].strftime("%Y-%m-%dT%H:%M:%S.%fZ")
            wfo['photo']  = wfo['photo'].decode("utf8") 
            wf.append(wfo)  
            doc.append(wfo['notes'])  
        if info["text"] != "":
            se = SearchEngine(doc, query=info["text"], theshold=.1)
            wf = [x for (i,x) in enumerate(wf) if i in se]
        return Response(
                response = json.dumps({
                    "data": wf
                    }),
                status=200,
                mimetype="application/json",
                headers=headers
            )



class GuestReport(Resource):
    def post(self):
        info = {}
        try:
            info["code"]       = int(request.json.get('code'))
            info["text"]       = str(request.json.get('text')).strip("\"")
            info["wildlifeid"] = int(request.json.get('wildlifeid'))
        except:
            abort(422, error_message=f"wrong report dictionary keys", headers = headers)
        if any(x 
               for x in info.values() 
               if x == None):
            abort(422, error_message=f"empty report dictionary values", headers = headers)
        wildlife = WildLife.query.filter_by(id = info["wildlifeid"]).first()
        if not wildlife:
            abort(404, error_message=f"wildlife entry does not exist", headers = headers)
        new_report = Reports(text=info["text"], 
                             code=info["code"], 
                             wildlifeid=info["wildlifeid"],
                             resolved=False)
        db.session.add(new_report)
        db.session.commit()
        return Response(
                response = json.dumps({
                    "message": "success"
                    }),
                status=200,
                mimetype="application/json",
                headers = headers
            )



class AuthReport(Resource):
    @login_required
    @has_role('curator')
    def put(self, reportid):
        reportid = int(reportid)
        for idx, container in enumerate([request.form, request.json, request.args]):
            if len(container) > 0 and 'cascade' in container:
                cascade = json.loads(container.get('cascade').lower())
                break
        if cascade is None:
            cascade = False
        report = Reports.query.filter(Reports.id==reportid).filter(Reports.resolved == False).first()
        if not report:
            abort(404, error_message=f"report entry does not exist", headers = headers)
        try:
            success = Reports.query.filter(Reports.id==reportid).filter(Reports.resolved == False).update({'resolved': True, 'userid': current_user.id})
            db.session.commit()
        except:
            abort(404, error_message=f"report entry does not exist", headers = headers)
        if cascade:
            try:
                reports = Reports.query.filter(Reports.wildlifeid == report.wildlifeid)\
                                       .filter(Reports.resolved != True)\
                                       .update({'resolved': True, 'userid': current_user.id})
                db.session.commit()
            except:
                pass
        return Response(
                response = json.dumps({
                    "message": "success"
                    }),
                status=200,
                mimetype="application/json",
                headers = headers
        )
    @login_required
    @has_role('curator')
    def delete(self, reportid):
        for idx, container in enumerate([request.form, request.json, request.args]):
            if len(container) > 0 and 'cascade' in container:
                cascade = json.loads(container.get('cascade').lower())
                break
        if cascade is None:
            cascade = False
        report = Reports.query.filter_by(id = reportid).first()
        try:
            wildlifeid = report.wildlifeid
            db.session.delete(report)
            db.session.commit()
        except:
            abort(404, error_message=f"report entry does not exist", headers = headers)
        if cascade:
            try:
                try:
                    wildlife = WildLife.query.filter_by(id=wildlifeid).first()
                    db.session.delete(wildlife)
                    db.session.commit()
                except:
                    print('could not delete')
                    pass
                reports = Reports.query.filter(Reports.wildlifeid == wildlifeid).delete()
                db.session.commit()
            except:
                pass
        return Response(
                    response = json.dumps({
                        "message": "success"
                        }),
                    status=200,
                    mimetype="application/json",
                headers = headers
                )