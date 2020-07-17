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

class Borg:
    _shared_state = {}
    def __init__(self):
        self.__dict__ = self._shared_state

class Singleton(Borg):
    def __init__(self, key=None, val=None):
        Borg.__init__(self)
        if key is not None and val is not None:
            self.__setattr__(key, val)
    def pop(self, key):
        if key in self.__dict__:
            delattr(self, key)
    def __repr__(self):
        return f"{vars(self)}"

def calc_distance(p1_lon, p1_lat, p2_lon, p2_lat):
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


parser = argparse.ArgumentParser(description='WildWatch Web Server')
parser.add_argument('--this_ip',   type=str)
parser.add_argument('--this_port', type=int)
parser.add_argument('--rest_ip',   type=str)
parser.add_argument('--rest_port', type=int)
args = parser.parse_args()


app = Flask(__name__)
app.secret_key = str(os.urandom(24).hex())


def logged_in(role=None):
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

def login_user():
    Singleton('sess', requests.Session())
    data = {
        'username': request.form['username'],
        'password': request.form['password']
    }
    response = Singleton().sess.post(f'{args.rest_ip}:{args.rest_port}/auth', json = data)
    if response.status_code == 200:
        role = response.json()['role']
        if role == 'curator':
            session['role'] = role
            return True
    session['role'] = None
    Singleton().pop('sess')
    return False


def logout_user():
    session.pop('role', None)
    Singleton().pop('sess')


@app.route('/')
def index():
    if 'role' in session:
        return redirect(url_for('curator'))
    else:
        return redirect(url_for('welcome'))


@app.route('/curator')
@logged_in()
def curator():
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
        response = Singleton().sess.get(f'{args.rest_ip}:{args.rest_port}/auth/wildlife', params = params, headers=headers)
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

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        status = login_user()
        if status:
            return redirect(url_for('curator'))
    return render_template('login.html')

@app.route('/report-submit', methods=['POST'])
def report_submit():
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
    data = {
        'cascade': request.form['cascade']
    }
    response = Singleton().sess.put(f'{args.rest_ip}:{args.rest_port}/auth/report/{reportid}', json = data)
    return response.json()

@app.route('/report-remove/<int:reportid>', methods=['DELETE'])
@logged_in()
def report_remove(reportid):
    data = {
        'cascade': request.form['cascade']
    }
    response = Singleton().sess.delete(f'{args.rest_ip}:{args.rest_port}/auth/report/{reportid}', json = data)
    return response.json()

@app.route('/logout')
def logout():
    logout_user()
    return redirect(url_for('welcome'))


@app.route('/welcome')
def welcome():
    return render_template('welcome.html')


@app.route('/download/<string:wildlifeid>')
def download(wildlifeid):
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