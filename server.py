import os, time, json, re
from io import BytesIO
import zipfile
import tempfile
from flask import Flask, session, redirect, url_for, request, render_template, send_from_directory, make_response, send_file
from markupsafe import escape
import requests
import argparse
import functools


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
            if session['role'] is not None:
                value = func(*args, **kwargs)
                return value
            else:
                return redirect(url_for('login'))
        return wrapper
    return decorator

def login_user():
    data = {
        'username': request.form['username'],
        'password': request.form['password']
    }
    response = requests.post(f'{args.rest_ip}:{args.rest_port}/auth', json = data)
    if response.status_code == 200:
        role = response.json()['role']
        print(role)
        if role == 'user':
            session['role'] = role
            return True
    session['role'] = None
    return False


def logout_user():
    session.pop('role', None)


@app.route('/')
def index():
    if 'role' in session:
        return redirect(url_for('curator'))
    else:
        return redirect(url_for('welcome'))

def params_enc(parameters):
    def flatten(d):
        for k, v in d.items():
            if isinstance(v, dict):
                for s, i in flatten(v):
                    yield '[%s]%s' % (k, s), i
            else:
                yield '[%s]' % k, v
    return {k: v for k, v in flatten(parameters)}

@app.route('/curator')
@logged_in()
def curator():
    params = {
        'text':'awesome',
        'location':{'lon': 13, 'lat': 42},
        'area':15,
        'filters':{'maxd': '2018-06-29 08:15:27.243860', 'mind': '2018-06-29 08:15:27.243860', 'type': ['bird'], 'by': 'anyone'}
    }
    headers = {"Content-Type": "application/json"}
    print(params_enc(params))
    response = requests.get(f'{args.rest_ip}:{args.rest_port}/auth/wildlife', params = params_enc(params), headers=headers)
    print(response.json())
    wildlife = response.json()['data']
    return render_template('curator.html', data=wildlife)

@app.route('/guest')
def guest():
    print(request.args)
    if request.args.get('data') is not None:
        params = json.loads(request.args['data'])
        params['maxd'] = re.sub('T', ' ', params['maxd'])
        params['maxd'] = re.sub('Z', ' ', params['maxd'])
        params['mind'] = re.sub('T', ' ', params['mind'])
        params['mind'] = re.sub('Z', ' ', params['mind'])
        params = f"text=\"{params['text']}\"&filters={{\"maxd\":\"{params['maxd']}\",\"mind\":\"{params['mind']}\",\"type\":{[x.encode('ascii') for x in params['type'].split(',')]},\"by\":\"anyone\"}}&location={{\"lon\":{params['lon']},\"lat\":{params['lat']}}},area={int(params['area'])}".encode('ascii')
        print(params)
    else:
        params = 'text="awesome"&filters={"maxd": "2018-06-29 08:15:27.243860", "mind": "2018-06-29 08:15:27.243860", "type": ["bird"], "by": "anyone"}&location={"lon": 13, "lat": 42}&area=15'.encode('ascii')
    headers = {"Content-Type": "application/json"}
    response = requests.get(f'{args.rest_ip}:{args.rest_port}/guest/wildlife', params = params, headers=headers)
    print(response.json())
    wildlife = response.json()['data']
    return render_template('guest.html', data=wildlife)

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        login_user()
        return redirect(url_for('curator'))
    return render_template('login.html')

@app.route('/logout')
def logout():
    logout_user()
    return redirect(url_for('welcome'))


@app.route('/welcome')
def welcome():
    return render_template('welcome.html')


@app.route('/download/<string:wildlifeid>')
def download(wildlifeid):
    wildlife = {'data':[{
        'photo': '/static/img/icon.png',
        'distance': '5m',
        'species': 'Birdillia',
        'type': 'Bird',
        'notes': 'cute bird'
    } for _ in range(1)]}
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
    wildlife = {'data':[{
        'photo': '/static/img/icon.png',
        'distance': '5m',
        'species': 'Birdillia',
        'type': 'Bird',
        'notes': 'cute bird'
    } for _ in range(3)]}
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