from flask import Flask, abort, jasonify
from flask_restful import Resource, Api, request
from itertools import starmap

app = Flask(__name__)
api = Api(app)

class InputChecker:
    def __init__(self, params):
        self.params = set(params)
    def __call__(self, other):
        other = set(other)
        if any(x 
               for x in other - self.params 
               if x not in self.params):
            return False 
        return True

class SignIn:
    def __init__(self, inputs):
        assert len(inputs) == 2
        self.username = inputs['username']
        self.password = inputs['password']
    def __call__(self):
        return 'signin success'

class SignUp:
    def __init__(self, inputs):
        assert len(inputs) == 4
        self.firstname = inputs['firstname']
        self.lastname  = inputs['lastname']
        self.username  = inputs['username']
        self.password  = inputs['password']
    def __call__(self):
        return 'signup success'

class Auth(Resource):
    checker = InputChecker(['firstname', 
                            'lastname', 
                            'username', 
                            'password'])
    def post(self):
        if self.checker([*request.json.keys()]):
            try:
                signin = SignIn(request.json)
                return {'status': signin()}
            except:
                try:
                    signup = SignUp(request.json)
                    return {'status': signup()}
                except:
                    abort(400)
        abort(400)
        

api.add_resource(Auth, '/auth')

if __name__ == '__main__':
    app.run(debug=True)