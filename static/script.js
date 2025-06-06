
const backendURL = 'http://127.0.0.1:5000';

function showNotification(message, isSuccess = true) {
    // Create notification element
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px;
        border-radius: 5px;
        color: white;
        font-weight: bold;
        z-index: 1000;
        background-color: ${isSuccess ? '#4CAF50' : '#f44336'};
    `;
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        document.body.removeChild(notification);
    }, 3000);
}

function addCity() {
    const city = document.getElementById("cityInput").value;
    if (!city) {
        showNotification("Please enter a city name", false);
        return;
    }
    fetch("/add_city", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: city })
    }).then(res => res.json()).then(data => {
        if (data.success) {
            showNotification(data.message, true);
            document.getElementById("cityInput").value = "";
            populateAllDropdowns();
            visualizeGraph();
        } else {
            showNotification(data.message, false);
        }
    });
}


function populateAllDropdowns() {
    fetch("/all_cities")
        .then(res => res.json())
        .then(cities => {
            const from = document.getElementById("fromInput");
            const to = document.getElementById("toInput");
            const startInput = document.getElementById("start");
            const endInput = document.getElementById("end");
            [fromInput, toInput, startInput, endInput].forEach(dropdown => {
                const currentValue = dropdown.value;
                dropdown.innerHTML = "";
                if (dropdown === startInput || dropdown === endInput) {
                    const defaultOption = document.createElement("option");
                    defaultOption.value = "";
                    defaultOption.text = dropdown === startInput ? "Select Start City" : "Select End City";
                    dropdown.appendChild(defaultOption);
                }

                                // Add city options
                cities.forEach(city => {
                    const option = document.createElement("option");
                    option.value = city;
                    option.text = city;
                    dropdown.appendChild(option);
                });

                                // Restore previous selection if it still exists
                if (cities.includes(currentValue)) {
                    dropdown.value = currentValue;
                }
            });
        });
}
window.onload = () => {
    populateAllDropdowns();
    visualizeGraph();
};



function addRoad() {
    const from = document.getElementById("fromInput").value;
    const to = document.getElementById("toInput").value;
    const weight = document.getElementById("weightInput").value || 1;
    if (!from || !to) {
        showNotification("Please select both cities", false);
        return;
    }
    fetch("/add_road", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to, weight })
    }).then(res => res.json()).then(data => {
        if (data.success) {
            showNotification(data.message, true);
            visualizeGraph();
        } else {
            showNotification(data.message, false);
        }
    });
}

function all_cities() {
    fetch('/all_cities')
      .then(response => response.json())
      .then(cities => {
        const fromInput = document.getElementById('fromInput');
        const toInput = document.getElementById('toInput');
        cities.forEach(city => {
          const option = document.createElement('option');
          option.value = city;
          option.text = city;
          fromInput.appendChild(option);
          toInput.appendChild(option);
        });
      });
}

function findPath() {
    const start = document.getElementById("start").value;
    const end = document.getElementById("end").value;
    const algo = document.getElementById("algo").value;

    fetch(`${backendURL}/find_path`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({start, end, algo})
    }).then(res => res.json()).then(data => {
        if (data.path.length > 0) {
            const out = `Path: ${data.path.join(" → ")}<br>Distance: ${data.distance}`;
            document.getElementById("output").innerHTML = out;
        } else {
            document.getElementById("output").innerHTML = "No path found!";
        }
    });
}

function findPath() {
    const start = document.getElementById("start").value;
    const end = document.getElementById("end").value;
    const algo = document.getElementById("algo").value;

    fetch("/find_path", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start, end, algo })
    }).then(res => res.json()).then(data => {
        if (data.path.length > 0) {
            const out = `Path: ${data.path.join(" → ")}<br>Distance: ${data.distance}`;
            document.getElementById("output").innerHTML = out;
        } else {
            document.getElementById("output").innerHTML = "No path found!";
        }
    });
}

function visualizeGraph() {
    fetch("/visualize_graph")
        .then(response => response.json())
        .then(data => {
            const nodes = data.nodes;
            const edges = data.edges;
            drawGraph(nodes, edges);
        });
}
function dragstarted(event, d) {
    d3.select(this).raise().classed("active", true);
}
function dragged(event, d) {
    d3.select(this)
        .attr("cx", d.x = event.x)
        .attr("cy", d.y = event.y);
}
function dragended(event, d) {
    d3.select(this).classed("active", false);
}
function drawGraph(nodes, edges) {
    // Clear previous graph
    d3.select("#graph").selectAll("*").remove();

    // Create a D3 force simulation
    const svg = d3.select("#graph").append("svg")
        .attr("width", 600)
        .attr("height", 400);

    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink().id(d => d.id).distance(50))
        .force("charge", d3.forceManyBody().strength(-100))
        .force("center", d3.forceCenter(300, 200));

    const link = svg.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(edges)
        .enter().append("line")
        .attr("stroke-width", d => d[2]) // Use weight as stroke width
        .attr("stroke", "gray");

    const node = svg.append("g")
        .attr("class", "nodes")
        .selectAll("circle")
        .data(nodes)
        .enter().append("circle")
        .attr("r", 5)
        .attr("fill", "blue")
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

    node.append("title")
        .text(d => d.id);

    simulation
        .nodes(nodes)
        .on("tick", () => {
            link.attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);

            node.attr("cx", d => d.x)
                .attr("cy", d => d.y);
        });

    simulation.force("link").links(edges);
}