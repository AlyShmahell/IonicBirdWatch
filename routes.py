"""provides resource logic allocation"""
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
headers.add('Access-Control-Allow-Origin', 'http://localhost:8100')
headers.add('Access-Control-Allow-Credentials', 'true')


def has_role(role=None):
    """
    - checks whether or not a user has a specific role
    - parameters:
        - role: string
    """
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
    """allocated logic for resource `/auth`"""
    def post(self):
        """
        - url `/auth` verb `POST`
        - input:
            - username: string
            - password: string
            - fullname: string
        - `Semantics: If fullname is not empty then it creates a new user account based on the provided credentials. Otherwise it establishes a Session based on the provided credentials.`
        """
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
        """
        - url `/auth` verb `DELETE`
        - `Semantics: closes the Session.`
        """
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
    """allocated logic for resource `/auth/profile`"""
    @login_required
    @has_role('user')
    def get(self):
        """
        - url `/auth/profile` verb `GET`
        - `output: {'fullname': str, 'website': str, 'bio': str, 'photo': image/jpeg}`
        - `Semantics: returns the user profile information associated with the Session. This resource is only available to users; if the Session belongs to a curator, the return status would be 403 Forbidden.`
        """
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
        """
        - url `/auth/profile` verb `DELETE`
        - `Semantics: deletes the user account then closes the Session. This resource is only available to users; if the Session belongs to a curator, the return status would be 403 Forbidden.`
        """
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
    """allocated logic for resource `/auth/profile/{category}`"""
    @login_required
    @has_role('user')
    def put(self, category):
        """
        - url `/auth/profile/{category}` verb `PUT`
        - `input: { 'value': string | base64 }`
        - `Semantics: updates the user info according to the {category}, which could be: fullname, website, bio, password, or photo. This resource is only available to users; if the Session belongs to a curator, the return status would be 403 Forbidden.`
        """
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
    """allocated logic for resource `/auth/profile/{userid}`"""
    @login_required
    @has_role('curator')
    def delete(self, userid):
        """
        - url `/auth/profile/{userid}` verb `DELETE`
        - `Semantics: deletes the user account associated with {userid}; if and only if the Session belongs to a curator and {userid} belongs to a user. Otherwise the return status would be 403 Forbidden.`
        """
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
    """allocated logic for resource `/auth/wildlife`"""
    @login_required
    @has_role('user')
    def post(self):
        """
        - url `/auth/wildlife` verb `POST`
        - input:
            - type: string
            - species: string
            - notes: string
            - photo: base64 string
            - date: iso datetime string
            - lon: float, longitude
            - lat: float, latitude
        - `Semantics: submits a new wildlife entry to the wildlife table. This resource is only available to users; if the Session belongs to a curator, the return status would be 403 Forbidden.`
        """
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
        """
        - url `/auth/wildlife` verb `GET`
        - arguments:
            - text: string
            - mind: iso datetime string
            - maxd: iso datetime string
            - by: string
            - type: array of strings
            - lon: float, longitude
            - lat: float, latitude
            - area: float
        - output: 
            - if the Session belongs to a user account:
                - `[{'wildlifeid': int, 'type': str, 'species': str, 'photo': image/jpeg, 'notes': str, 'lon': float, 'lat': float, 'date': int},]`
            - if the Session belongs to a curator account:
                - `[{'wildlifeid': int, 'type': str, 'species': str, 'photo': image/jpeg, 'notes': str, 'lon': float, 'lat': float, 'date': int, 'userid': int, 'reports': [ {'reportid': int, 'code': int, 'text': str}, ]},]`
        - `Semantics: fetches all the wildlife entries in the wildlife table based on the user’s or curator’s longitude and latitude and the size of their map area, the results are filtered by first matching the filters (mind=datetime&maxd=datetime&by=str&type=[str]) part of the query to the wildlife table columns using an SQL WHERE clause, and then by matching the text part of the query to the notes column in the wildlife table using an off-the-shelf TFIDF algorithm. If the Session belongs to a curator account, the filtering process is also applied on the reports table, then only wildlife entries with unresolved reports matching their ‘wildlifeid’ will be returned in the response, with a copy of the reports added to the response.`
        """
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

class GuestWildLifeMany(Resource):
    """allocated logic for resource `/guest/wildlife`"""
    def get(self):
        """
        - url `/guest/wildlife` verb `GET`
        - arguments:
            - text: string
            - mind: iso datetime string
            - maxd: iso datetime string
            - by: string
            - type: array of strings
            - lon: float, longitude
            - lat: float, latitude
            - area: float
        - `output: [{'wildlifeid': int, 'type': str, 'species': str, 'photo': image/jpeg, 'notes': str, 'lon': float, 'lat': float,, 'date': int},]`
        - `Semantics: fetches all the wildlife entries in the wildlife table based on the guest’s chosen longitude and latitude and the size of their map area, the results are filtered first by matching the filters (mind=datetime&maxd=datetime&by=str&type=[str]) part of the query to the wildlife table columns using an SQL WHERE clause, and then by matching the text part of the query to the notes column in the wildlife table using an off-the-shelf TFIDF algorithm.`
        """
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


class GuestWildLifeOne(Resource):
    """allocated logic for resource `/guest/wildlife/{wildlifeid}`"""
    def get(self, wildlifeid=None):
        """
        - url `/guest/wildlife/{wildlifeid}` verb `GET`
        - `output: {'wildlifeid': int, 'type': str, 'species': str, 'photo': image/jpeg, 'notes': str, 'lon': float, 'lat': float, 'date': int}`
        - `Semantics: downloads a single wildlife entry from the wildlife table according to its {wildlifeid}. The response ‘Content-Disposition’ is set to ‘attachment’ and the output value will be a json file containing the output json object.`
        """
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


class GuestReport(Resource):
    """allocated logic for resource `/guest/report`"""
    def post(self):
        """
        - url `/guest/report` verb `POST`
        - input:
            - code: integer, report code
            - text: string, report body
            - wildlifeid: integer, wildlife entry being reported
        - `Semantics: submits a new report about a wildlife entry to the reports table, the report could be about animal abuse, improper fire, fake entries ...etc.`
        """
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
    """allocated logic for resource `/auth/report/{reportid}`"""
    @login_required
    @has_role('curator')
    def put(self, reportid):
        """
        - url `/auth/report/{reportid}` verb `PUT`
        - arguments:
            - cascade: boolean
        - `Semantics: submits a report resolution request to the API, which marks the report as solved, this kind of report concerns animal abuse or similar issues, if found genuine the curator would contact the authorities, then resolve the report, it will be updated as solved in the reports table but not deleted. If cascade is true then all other reports about the same wildlife entry will be resolved as well. This resource is only available to curators; if the Session belongs to a user, the return status would be 403 Forbidden.`
        """
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
        """
        - url `/auth/report/{reportid}` verb `DELETE`
        - arguments:
            - cascade: boolean
        - `Semantics: submits a report deletion request to the API, which deletes the report from the reports table. If cascade is true then the wildlife entry will be deleted from the wildlife table as well; in that case all other reports associated with the entry will be deleted as well. This resource is only available to curators; if the Session belongs to a user, the return status would be 403 Forbidden.`
        """
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