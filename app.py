from flask import Flask, render_template, jsonify, redirect, url_for, request
from flask_cors import CORS
from graph import Graph
import json

app = Flask(__name__)
CORS(app)

graph = Graph()

@app.route('/')
def index():
    return redirect(url_for('homepage'))

@app.route('/homepage')
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

@app.route('/all_cities')
def all_cities():
    return jsonify(list(graph.adj.keys()))

@app.route('/graph_data')
def graph_data():
    """Return graph data in D3.js compatible format"""
    nodes = []
    links = []

    # Create nodes
    for city in graph.adj.keys():
        nodes.append({"id": city})

    # Create links (avoid duplicates)
    processed_pairs = set()
    for city, neighbors in graph.adj.items():
        for neighbor, weight in neighbors:
            # Create a sorted tuple to avoid duplicate edges
            pair = tuple(sorted([city, neighbor]))
            if pair not in processed_pairs:
                links.append({
                    "source": city,
                    "target": neighbor,
                    "weight": weight
                })
                processed_pairs.add(pair)

    return jsonify({"nodes": nodes, "links": links})

@app.route('/find_path', methods=['POST'])
def find_path():
    data = request.get_json()
    start = data.get('start')
    end = data.get('end')
    algo = data.get('algo', 'Dijkstra')

    if start and end:
        if algo.lower() == 'dijkstra':
            path, distance = graph.dijkstra(start, end)
        else:
            path, distance = graph.bfs(start, end)

        return jsonify({'path': path, 'distance': distance})
    return jsonify({'path': [], 'distance': float('inf')})

@app.route('/remove_city', methods=['POST'])
def remove_city():
    """Remove a city and all its connections"""
    data = request.get_json()
    city_name = data.get('name')
    if city_name and city_name in graph.adj:
        graph.remove_city(city_name)
        return jsonify({'success': True, 'message': f'City {city_name} removed successfully!'})
    return jsonify({'success': False, 'message': 'City not found'})

@app.route('/remove_road', methods=['POST'])
def remove_road():
    """Remove a road between two cities"""
    data = request.get_json()
    from_city = data.get('from')
    to_city = data.get('to')

    if from_city and to_city:
        graph.remove_road(from_city, to_city)
        return jsonify({'success': True, 'message': f'Road removed between {from_city} and {to_city}'})
    return jsonify({'success': False, 'message': 'Invalid city names'})

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, debug=True)