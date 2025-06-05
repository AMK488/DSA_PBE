from flask import Flask, render_template, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)
if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, debug=True)

@app.route('/home')
def homepage():
    return render_template('home.html')  