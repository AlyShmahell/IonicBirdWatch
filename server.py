import os, time, json, re
from io import BytesIO
import zipfile
from flask import Flask, session, redirect, url_for, request, render_template, send_from_directory, make_response, send_file
import requests
import argparse
import functools
import numpy as np 
from math import sin, cos, sqrt, atan2, radians
import datetime 
from dateutil.relativedelta import relativedelta


parser = argparse.ArgumentParser(description='WildWatch Web Server')
parser.add_argument('--this_ip',   type=str)
parser.add_argument('--this_port', type=int)
parser.add_argument('--rest_ip',   type=str)
parser.add_argument('--rest_port', type=int)
args = parser.parse_args()


app = Flask(__name__)
app.secret_key = str(os.urandom(24).hex())


class SessionBorg:
    """
    - keeps session state uniform accross all resources
    - attributes:
        - _shared_state: requests.Session.
    """
    _shared_state = {}
    def __init__(self):
        self.__dict__ = self._shared_state


class SessionSingleton(SessionBorg):
    """manages session state using SessionBorg"""
    def __init__(self, key=None, val=None):
        SessionBorg.__init__(self)
        if key is not None and val is not None:
            self.__setattr__(key, val)
    def pop(self, key):
        if key in self.__dict__:
            delattr(self, key)
    def __repr__(self):
        return f"{vars(self)}"


def calc_distance(p1_lon, p1_lat, p2_lon, p2_lat):
    """
    - calculates distance between two longitude/latitude points on a globe
    - parameters:
        - p1_lon: float, longitude of point no. 1
        - p1_lat: float, latitude  of point no. 1
        - p2_lon: float, longitude of point no. 2
        - p2_lat: float, latitude  of point no. 2
    """
    R    = 6378137
    lat1 = radians(p1_lat)
    lon1 = radians(p1_lon)
    lat2 = radians(p2_lat)
    lon2 = radians(p2_lon)
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a    = sin(dlat / 2)**2 + cos(lat1) * cos(lat2) * sin(dlon / 2)**2
    c    = 2 * atan2(sqrt(a), sqrt(1 - a))
    return np.round(R * c, 1)


def login_user():
    """
    - establishes a login session
    - inputs:
        - username: string
        - password: string
    - calls: `Session.post(<restful-api>/auth)`
    - returns:
        - status: boolean
    """
    SessionSingleton('sess', requests.Session())
    data = {
        'username': request.form['username'],
        'password': request.form['password']
    }
    response = SessionSingleton().sess.post(f'{args.rest_ip}:{args.rest_port}/auth', json = data)
    if response.status_code == 200:
        role = response.json()['role']
        if role == 'curator':
            session['role'] = role
            return True
    session['role'] = None
    SessionSingleton().pop('sess')
    return False


def logged_in(role=None):
    """
    - checks whether or not a user is logged in with a certain role
    - parameters:
        - role: string
    """
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            if 'role' not in session:
                return redirect(url_for('login'))
            if session['role'] is not None:
                value = func(*args, **kwargs)
                return value
            else:
                return redirect(url_for('login'))
        return wrapper
    return decorator


def logout_user():
    """invalidates current session"""
    session.pop('role', None)
    SessionSingleton().pop('sess')


@app.route('/')
def index():
    """
    - allocated logic for `root`
    - returns:
        - redirects to `/curator` url if the session is established
        - redirects to `/welcome` url otherwise
    """
    if 'role' in session:
        return redirect(url_for('curator'))
    else:
        return redirect(url_for('welcome'))


@app.route('/welcome')
def welcome():
    """
    - allocated logic for `/welcome`
    - returns:
        - renders `welcome.html` template
    """
    return render_template('welcome.html')


@app.route('/login', methods=['GET', 'POST'])
def login():
    """
    - allocated logic for `/login`
    - calls: 
        - on `POST`: `login_user()`
    - returns:
        - on success: redirects to `/curator`
        - on failure/`GET`: renders `login.html` template
    """
    if request.method == 'POST':
        status = login_user()
        if status:
            return redirect(url_for('curator'))
    return render_template('login.html')


@app.route('/logout')
def logout():
    """
    - allocated logic for `/logout`
    - calls: `logout_user()`
    - returns: redirects to `/welcome`
    """
    logout_user()
    return redirect(url_for('welcome'))


@app.route('/noscript')
def noscript():
    """
    - allocated logic for `/noscript`
    - returns: renders `noscript.html` template
    - semantics: graceful degredation in case javascript is disabled
    """
    return render_template('noscript.html')


@app.route('/ie')
def ie():
    """
    - allocated logic for `/ie`
    - returns: renders `ie.html` template
    - semantics: graceful degredation in case of running on Internet Explored
    """
    return render_template('ie.html')


@app.route('/curator')
@logged_in()
def curator():
    """
    - allocated logic for `/curator`
    - arguments:
        - text: string
        - mind: iso datetime string
        - maxd: iso datetime string
        - by: string
        - type: array of strings
        - lon: float, longitude
        - lat: float, latitude
        - area: float
    - calls: `Session.get(<restful-api>/auth/wildlife)`
    - returns:
        - on redirect:
             renders `curator.html` template
        - on xhr/ajax:
             renders `curator-list.html` template
    """
    def flatten(d):
        return "&".join([f"{k}={v}" for k, v in d.items()])
    params = request.args.get('data')
    xhr = None
    if params is not None:
        params = json.loads(params)
        xhr = params.get('xhr')
        params.pop('xhr')
        params["text"] = f'"{params["text"]}"'
        params["type"] = params["type"].split(",")
        lon = params['lon']
        lat = params['lat']
        params = flatten(params)
        headers = {"Content-Type": "application/json"}
        response = SessionSingleton().sess.get(f'{args.rest_ip}:{args.rest_port}/auth/wildlife', params = params, headers=headers)
        wildlife = response.json()['data']
        for entry in wildlife:        
            entry['distance'] = calc_distance(entry['lon'], entry['lat'], lon, lat)
            if entry['distance'] > 1000:
                entry['distance'] = f"{round(entry['distance']/1000)}km"
            else:
                entry['distance'] = f"{entry['distance']}m"
            entry['center'] = [entry['lon'], entry['lat']]
            entry['cardid'] = f"{np.round(entry['lon'], 1)}_{np.round(entry['lat'], 1)}".replace('.', '_')
        if xhr:
            return render_template('curator-list.html', data=wildlife)
    else:
        wildlife = []
        return render_template('curator.html', data=wildlife)

@app.route('/guest')
def guest():
    """
    - allocated logic for `/guest`
    - arguments:
        - text: string
        - mind: iso datetime string
        - maxd: iso datetime string
        - by: string
        - type: array of strings
        - lon: float, longitude
        - lat: float, latitude
        - area: float
    - calls: `Session.get(<restful-api>/guest/wildlife)`
    - returns:
        - on redirect:
             renders `guest.html` template
        - on xhr/ajax:
             renders `guest-list.html` template
    """
    def flatten(d):
        return "&".join([f"{k}={v}" for k, v in d.items()])
    params = request.args.get('data')
    xhr = None
    if params is not None:
        params = json.loads(params)
        xhr = params.get('xhr')
        params.pop('xhr')
        params["text"] = f'"{params["text"]}"'
        params["type"] = params["type"].split(",")
        lon = params['lon']
        lat = params['lat']
        params = flatten(params)
        headers = {"Content-Type": "application/json"}
        response = requests.get(f'{args.rest_ip}:{args.rest_port}/guest/wildlife', params = params, headers=headers)
        wildlife = response.json()['data']
        for entry in wildlife:        
            entry['distance'] = calc_distance(entry['lon'], entry['lat'], lon, lat)
            if entry['distance'] > 1000:
                entry['distance'] = f"{round(entry['distance']/1000)}km"
            else:
                entry['distance'] = f"{entry['distance']}m"
            entry['center'] = [entry['lon'], entry['lat']]
            entry['cardid'] = f"{np.round(entry['lon'], 1)}_{np.round(entry['lat'], 1)}".replace('.', '_')
        if xhr:
            return render_template('guest-list.html', data=wildlife)
    else:
        wildlife = []
        return render_template('guest.html', data=wildlife)

@app.route('/report-submit', methods=['POST'])
def report_submit():
    """
    - allocated logic for `/report-submit`
    - inputs: 
        - code: integer
        - wildlifeid: integer
        - text: string
    - calls: `Session.post(<restful-api>/guest/report)`
    - returns: response.json / status
    """
    data = {
        'code': request.form['code'],
        'text': request.form['text'],
        'wildlifeid': request.form['wildlifeid']
    }
    response = requests.post(f'{args.rest_ip}:{args.rest_port}/guest/report', json = data)
    return response.json()


@app.route('/report-resolve/<int:reportid>', methods=['PUT'])
@logged_in()
def report_resolve(reportid):
    """
    - allocated logic for `/report-resolve/{reportid}`
    - inputs: 
        - cascade: boolean
    - calls: `Session.put(<restful-api>/auth/report/{reportid})`
    - returns: response.json / status
    """
    data = {
        'cascade': request.form['cascade']
    }
    response = SessionSingleton().sess.put(f'{args.rest_ip}:{args.rest_port}/auth/report/{reportid}', json = data)
    return response.json()


@app.route('/report-remove/<int:reportid>', methods=['DELETE'])
@logged_in()
def report_remove(reportid):
    """
    - allocated logic for `/report-remove/{reportid}`
    - arguments: 
        - cascade: boolean
    - calls: `Session.delete(<restful-api>/auth/report/{reportid})`
    - returns: response.json / status
    """
    data = {
        'cascade': request.form['cascade']
    }
    response = SessionSingleton().sess.delete(f'{args.rest_ip}:{args.rest_port}/auth/report/{reportid}', json = data)
    return response.json()


@app.route('/download/<string:wildlifeid>')
def download(wildlifeid):
    """
    - allocated logic for `/download/{wildlifeid}`
    - arguments: 
        - cascade: boolean
    - calls: `Session.get(<restful-api>/guest/wildlife/{wildlifeid})`
    - returns: {wildlifeid}.zip
    """
    headers = {"Content-Type": "application/json"}
    response = requests.get(f'{args.rest_ip}:{args.rest_port}/guest/wildlife/{wildlifeid}', headers=headers)
    wildlife = response.json()['data']
    temp = BytesIO()
    with zipfile.ZipFile(temp, 'w') as zf:
        data               = zipfile.ZipInfo('data.json')
        data.date_time     = time.localtime(time.time())[:6]
        data.compress_type = zipfile.ZIP_DEFLATED
        zf.writestr(data, json.dumps(wildlife).encode('utf8'))
    temp.seek(0)
    return send_file(temp, attachment_filename=f'{wildlifeid}.zip', as_attachment=True)


@app.route('/download')
def downloadall():
    """
    - allocated logic for `/download`
    - arguments: 
        - cascade: boolean
    - calls: `Session.get(<restful-api>/guest/wildlife)`
    - returns: data.zip
    """
    def flatten(d):
        return "&".join([f"{k}={v}" for k, v in d.items()])
    params = request.args.get('data')
    xhr = None
    if params is not None:
        params = json.loads(params)
        xhr = params.get('xhr')
        params.pop('xhr')
        params["text"] = f'"{params["text"]}"'
        params["type"] = params["type"].split(",")
        lon = params['lon']
        lat = params['lat']
        params = flatten(params)
        headers = {"Content-Type": "application/json"}
        response = requests.get(f'{args.rest_ip}:{args.rest_port}/guest/wildlife', params = params, headers=headers)
        wildlife = response.json()['data']
    temp = BytesIO()
    with zipfile.ZipFile(temp, 'w') as zf:
        data               = zipfile.ZipInfo('data.json')
        data.date_time     = time.localtime(time.time())[:6]
        data.compress_type = zipfile.ZIP_DEFLATED
        zf.writestr(data, json.dumps(wildlife).encode('utf8'))
    temp.seek(0)
    return send_file(temp, attachment_filename=f'data.zip', as_attachment=True)



if __name__ == '__main__':
    app.run(debug=True, host = args.this_ip, port=args.this_port)