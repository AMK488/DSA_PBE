from flask import Flask, render_template, jsonify, redirect, url_for
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/')
def index():
    return redirect(url_for('homepage'))

@app.route('/home')
def homepage():
    return render_template('home.html')

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, debug=True)  