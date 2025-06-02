import sys
import json
import heapq
import networkx as nx
import matplotlib.pyplot as plt

from collections import deque
from PyQt5.QtWidgets import (
    QApplication, QWidget, QLabel, QLineEdit, QPushButton, QTextEdit,
    QVBoxLayout, QHBoxLayout, QComboBox, QFileDialog, QMessageBox
)


class Graph:
    def __init__(self):
        self.adj = {}  # {city: [(neighbor, weight)]}

    def add_city(self, name):
        self.adj.setdefault(name, [])

    def add_road(self, from_city, to_city, weight=1):
        self.add_city(from_city)
        self.add_city(to_city)
        self.adj[from_city].append((to_city, weight))
        self.adj[to_city].append((from_city, weight))

    def remove_city(self, name):
        self.adj.pop(name, None)
        for neighbors in self.adj.values():
            neighbors[:] = [n for n in neighbors if n[0] != name]

    def remove_road(self, from_city, to_city):
        self.adj[from_city] = [n for n in self.adj[from_city] if n[0] != to_city]
        self.adj[to_city] = [n for n in self.adj[to_city] if n[0] != from_city]

    def dijkstra(self, start, end):
        dist = {node: float('inf') for node in self.adj}
        dist[start] = 0
        prev = {}
        heap = [(0, start)]

        while heap:
            d, u = heapq.heappop(heap)
            if u == end:
                break
            for v, w in self.adj.get(u, []):
                alt = d + w
                if alt < dist[v]:
                    dist[v] = alt
                    prev[v] = u
                    heapq.heappush(heap, (alt, v))

        path = []
        curr = end
        while curr in prev:
            path.insert(0, curr)
            curr = prev[curr]
        if dist[end] != float('inf'):
            path.insert(0, start)
        return path, dist[end]

    def bfs(self, start, end):
        visited = set()
        queue = deque([(start, [start])])

        while queue:
            current, path = queue.popleft()
            if current == end:
                return path, len(path) - 1
            for neighbor, _ in self.adj.get(current, []):
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append((neighbor, path + [neighbor]))
        return [], float('inf')

    def save_to_file(self, filename):
        with open(filename, 'w') as f:
            json.dump(self.adj, f)

    def load_from_file(self, filename):
        with open(filename, 'r') as f:
            self.adj = json.load(f)


class LogisticsApp(QWidget):
    def __init__(self):
        super().__init__()
        self.graph = Graph()
        self.setWindowTitle("Logistics Routing (PyQt5)")
        self.setGeometry(100, 100, 800, 500)
        self.setup_ui()

    def setup_ui(self):
        layout = QVBoxLayout()

        # --- Input for Cities ---
        city_layout = QHBoxLayout()
        self.city_input = QLineEdit()
        self.city_input.setPlaceholderText("City name")
        city_add_btn = QPushButton("Add City")
        city_add_btn.clicked.connect(self.add_city)
        city_layout.addWidget(self.city_input)
        city_layout.addWidget(city_add_btn)

        # --- Input for Roads ---
        edge_layout = QHBoxLayout()
        self.edge_from = QLineEdit()
        self.edge_to = QLineEdit()
        self.edge_weight = QLineEdit()
        self.edge_from.setPlaceholderText("From")
        self.edge_to.setPlaceholderText("To")
        self.edge_weight.setPlaceholderText("Weight")
        edge_add_btn = QPushButton("Add Road")
        edge_add_btn.clicked.connect(self.add_road)
        edge_layout.addWidget(self.edge_from)
        edge_layout.addWidget(self.edge_to)
        edge_layout.addWidget(self.edge_weight)
        edge_layout.addWidget(edge_add_btn)

        # --- Path Query ---
        query_layout = QHBoxLayout()
        self.start_input = QLineEdit()
        self.end_input = QLineEdit()
        self.start_input.setPlaceholderText("Start City")
        self.end_input.setPlaceholderText("End City")
        self.algo_choice = QComboBox()
        self.algo_choice.addItems(["Dijkstra", "BFS"])
        query_btn = QPushButton("Find Path")
        query_btn.clicked.connect(self.find_path)
        query_layout.addWidget(self.start_input)
        query_layout.addWidget(self.end_input)
        query_layout.addWidget(self.algo_choice)
        query_layout.addWidget(query_btn)

        # --- Save / Load / Visualize ---
        utility_layout = QHBoxLayout()
        save_btn = QPushButton("Save Graph")
        load_btn = QPushButton("Load Graph")
        viz_btn = QPushButton("Visualize")
        save_btn.clicked.connect(self.save_graph)
        load_btn.clicked.connect(self.load_graph)
        viz_btn.clicked.connect(self.visualize_graph)
        utility_layout.addWidget(save_btn)
        utility_layout.addWidget(load_btn)
        utility_layout.addWidget(viz_btn)

        # --- Output Text ---
        self.output_area = QTextEdit()
        self.output_area.setReadOnly(True)

        # --- Final Layout ---
        layout.addLayout(city_layout)
        layout.addLayout(edge_layout)
        layout.addLayout(query_layout)
        layout.addLayout(utility_layout)
        layout.addWidget(QLabel("Output:"))
        layout.addWidget(self.output_area)

        self.setLayout(layout)

    def add_city(self):
        name = self.city_input.text().strip()
        if name:
            self.graph.add_city(name)
            self.output_area.append(f"✅ City added: {name}")
            self.city_input.clear()

    def add_road(self):
        from_city = self.edge_from.text().strip()
        to_city = self.edge_to.text().strip()
        try:
            weight = int(self.edge_weight.text().strip())
        except ValueError:
            weight = 1  # default for BFS

        if from_city and to_city:
            self.graph.add_road(from_city, to_city, weight)
            self.output_area.append(f"🚗 Road added: {from_city} ↔ {to_city} (Weight: {weight})")
            self.edge_from.clear()
            self.edge_to.clear()
            self.edge_weight.clear()

    def find_path(self):
        start = self.start_input.text().strip()
        end = self.end_input.text().strip()
        if not start or not end:
            QMessageBox.warning(self, "Input Error", "Please enter both start and end cities.")
            return

        if self.algo_choice.currentText() == "Dijkstra":
            path, dist = self.graph.dijkstra(start, end)
        else:
            path, dist = self.graph.bfs(start, end)

        if path:
            path_str = " → ".join(path)
            self.output_area.append(f"\n🔍 Path found: {path_str}\n📏 Total Distance: {dist}\n")
        else:
            self.output_area.append(f"\n❌ No path found from {start} to {end}\n")

    def visualize_graph(self):
        G = nx.Graph()
        for city in self.graph.adj:
            for neighbor, weight in self.graph.adj[city]:
                G.add_edge(city, neighbor, weight=weight)
        pos = nx.spring_layout(G)
        edge_labels = nx.get_edge_attributes(G, 'weight')
        nx.draw(G, pos, with_labels=True, node_color='lightblue', node_size=1500, font_size=10)
        nx.draw_networkx_edge_labels(G, pos, edge_labels=edge_labels)
        plt.title("City Graph Visualization")
        plt.show()

    def save_graph(self):
        filename, _ = QFileDialog.getSaveFileName(self, "Save Graph", "", "JSON Files (*.json)")
        if filename:
            self.graph.save_to_file(filename)
            self.output_area.append(f"📁 Graph saved to {filename}")

    def load_graph(self):
        filename, _ = QFileDialog.getOpenFileName(self, "Load Graph", "", "JSON Files (*.json)")
        if filename:
            self.graph.load_from_file(filename)
            self.output_area.append(f"📂 Graph loaded from {filename}")


if __name__ == "__main__":
    app = QApplication(sys.argv)
    window = LogisticsApp()
    window.show()
    sys.exit(app.exec_())
