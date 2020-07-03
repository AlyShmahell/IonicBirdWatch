import os
from flask import Flask, session, redirect, url_for, request, render_template, send_from_directory
from markupsafe import escape

app = Flask(__name__)
app.secret_key = str(os.urandom(24).hex())

def login_user():
    session['username'] = request.form['username']

def logout_user():
    session.pop('username', None)


@app.route('/')
def index():
    if 'username' in session:
        return redirect(url_for('curator'))
    else:
        return redirect(url_for('welcome'))

@app.route('/curator')
def curator():
    wildlife = [{
        'photo': '/static/img/icon.png',
        'distance': '5m',
        'species': 'Birdillia',
        'type': 'Bird',
        'notes': 'cute bird',
        'reports': [{
            'title': 'Animal Abuse',
            'code': 100,
            'notes': 'save this animal'
        }]
    } for _ in range(3)]
    return render_template('curator.html', data=wildlife)

@app.route('/guest')
def guest():
    wildlife = [{
        'photo': '/static/img/icon.png',
        'distance': '5m',
        'species': 'Birdillia',
        'type': 'Bird',
        'notes': 'cute bird'
    } for _ in range(3)]
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



if __name__ == '__main__':
    app.run(debug=True)