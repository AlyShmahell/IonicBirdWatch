import os
from flask import render_template, make_response, redirect, url_for, request, flash, send_from_directory
from flask_restful import Resource
from flask_login import login_required, current_user, login_user, logout_user
from werkzeug.exceptions import Unauthorized
from werkzeug.security import generate_password_hash, check_password_hash
from models import User, db


class Signin(Resource):
    def get(self):
        headers = {'Content-Type': 'text/html'}
        return make_response(render_template('signin.html'), 200, headers)
    def post(self):
        username = request.form.get('username')
        password = request.form.get('password')
        remember = True if request.form.get('remember') else False
        user = User.query.filter_by(username=username).first()
        if not user or not check_password_hash(user.password, password):
            flash('Incorrect username and/or password.')
            return redirect(url_for('signin'))
        login_user(user, remember=remember)
        return redirect(url_for('profile'))

class Signout(Resource):
    @login_required
    def get(self):
        logout_user()
        return redirect(url_for('index'))

class AddUser(Resource):
    @login_required
    def get(self):
        headers = {'Content-Type': 'text/html'}
        return make_response(render_template('adduser.html'), 200, headers)
    @login_required
    def post(self):
        username = request.form.get('username')
        name = request.form.get('name')
        password = request.form.get('password')
        user = User.query.filter_by(username=username).first() 
        if user:
            flash('username already exists.')
            return redirect(url_for('adduser'))
        new_user = User(username=username, name=name, password=generate_password_hash(password, method='sha256'))
        db.session.add(new_user)
        db.session.commit()
        return redirect(url_for('adduser'))

class Index(Resource):
    def get(self):
        headers = {'Content-Type': 'text/html'}
        return make_response(render_template('index.html'), 200, headers)

class Profile(Resource):
    @login_required
    def get(self):
        headers = {'Content-Type': 'text/html'}
        return make_response(render_template('profile.html', name=current_user.name), 200, headers)

class StaticFile(Resource):
    def get(self, subdir, filename):
        return send_from_directory(os.path.join('static', subdir),
                            filename)