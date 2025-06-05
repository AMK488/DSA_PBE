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