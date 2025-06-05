
from flask import Flask, render_template, jsonify, redirect, url_for, request
from flask_cors import CORS
from graph import Graph
import json

app = Flask(__name__)
CORS(app)

# Initialize the graph
graph = Graph()

@app.route('/')
def index():
    return redirect(url_for('homepage'))

@app.route('/home')
def homepage():
    return render_template('home.html')

@app.route('/add_city', methods=['POST'])
def add_city():
    data = request.get_json() 
    city_name = data.get('name')
    if city_name:
        graph.add_city(city_name)
        return jsonify({'success': True, 'message': f'City {city_name} added successfully!'})
    return jsonify({'success': False, 'message': 'Invalid city name'})

@app.route('/delete_city', methods=['POST'])
def delete_city():
    data = request.get_json()
    city_name = data.get('name')
    if city_name and city_name in graph.adj:
        graph.remove_city(city_name)
        return jsonify({'success': True, 'message': f'City {city_name} deleted successfully!'})
    return jsonify({'success': False, 'message': 'City not found'})

@app.route('/add_road', methods=['POST'])
def add_road():
    data = request.get_json()
    from_city = data.get('from')
    to_city = data.get('to')
    weight = int(data.get('weight', 1))
    
    if from_city and to_city:
        graph.add_road(from_city, to_city, weight)
        return jsonify({'success': True, 'message': f'Road added between {from_city} and {to_city}'})
    return jsonify({'success': False, 'message': 'Invalid city names'})

@app.route('/delete_road', methods=['POST'])
def delete_road():
    data = request.get_json()
    from_city = data.get('from')
    to_city = data.get('to')
    
    if from_city and to_city:
        graph.remove_road(from_city, to_city)
        return jsonify({'success': True, 'message': f'Road deleted between {from_city} and {to_city}'})
    return jsonify({'success': False, 'message': 'Invalid city names'})

@app.route('/all_cities')
def all_cities():
    return jsonify(list(graph.adj.keys()))

@app.route('/get_graph')
def get_graph():
    return jsonify(graph.adj)

@app.route('/find_path', methods=['POST'])
def find_path():
    data = request.get_json()
    start = data.get('start')
    end = data.get('end')
    algo = data.get('algo', 'Dijkstra')
    
    if start and end:
        # Check if both cities exist in the graph
        if start not in graph.adj:
            return jsonify({'success': False, 'message': f'Start city "{start}" not found'})
        if end not in graph.adj:
            return jsonify({'success': False, 'message': f'End city "{end}" not found'})
            
        if algo.lower() == 'dijkstra':
            path, distance = graph.dijkstra(start, end)
        else:
            path, distance = graph.bfs(start, end)
        
        return jsonify({'path': path, 'distance': distance})
    return jsonify({'path': [], 'distance': float('inf')})

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, debug=True)
