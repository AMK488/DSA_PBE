const backendURL = 'http://127.0.0.1:5000';

// Graph data structure
let graphData = {
    nodes: [],
    links: []
};

// D3 setup
const svg = d3.select("#graph");
const width = 800;
const height = 600;

svg.attr("viewBox", [0, 0, width, height]);

const simulation = d3.forceSimulation()
    .force("link", d3.forceLink().id(d => d.id).distance(150))
    .force("charge", d3.forceManyBody().strength(-800))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collision", d3.forceCollide().radius(35));

let link, node, linkLabel, nodeLabel;

function showNotification(message, isSuccess = true) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: bold;
        z-index: 1000;
        animation: slideIn 0.3s ease;
        background: ${isSuccess ? 'linear-gradient(45deg, #00b894, #55a3ff)' : 'linear-gradient(45deg, #ff7675, #fd79a8)'};
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        if (document.body.contains(notification)) {
            document.body.removeChild(notification);
        }
    }, 3000);
}

function updateGraph() {
    // Links
    link = svg.selectAll(".link")
        .data(graphData.links, d => `${d.source.id || d.source}-${d.target.id || d.target}`);

    link.exit().remove();

    const linkEnter = link.enter()
        .append("line")
        .attr("class", "link")
        .attr("stroke", "#999")
        .attr("stroke-opacity", 0.8)
        .attr("stroke-width", 2);

    link = linkEnter.merge(link);

    // Link labels
    linkLabel = svg.selectAll(".link-label")
        .data(graphData.links, d => `${d.source.id || d.source}-${d.target.id || d.target}`);

    linkLabel.exit().remove();

    const linkLabelEnter = linkLabel.enter()
        .append("text")
        .attr("class", "link-label")
        .attr("font-size", "12px")
        .attr("font-weight", "bold")
        .attr("fill", "#333")
        .attr("text-anchor", "middle")
        .attr("pointer-events", "none");

    linkLabel = linkLabelEnter.merge(linkLabel)
        .text(d => d.weight);

    // Nodes
    node = svg.selectAll(".node")
        .data(graphData.nodes, d => d.id);

    node.exit().remove();

    const nodeEnter = node.enter()
        .append("circle")
        .attr("class", "node")
        .attr("r", 20)
        .attr("fill", d => d3.schemeCategory10[d.id.length % 10])
        .attr("stroke", "#fff")
        .attr("stroke-width", 2)
        .style("cursor", "pointer")
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

    node = nodeEnter.merge(node);

    // Node labels
    nodeLabel = svg.selectAll(".node-label")
        .data(graphData.nodes, d => d.id);

    nodeLabel.exit().remove();

    const nodeLabelEnter = nodeLabel.enter()
        .append("text")
        .attr("class", "node-label")
        .attr("font-size", "14px")
        .attr("font-weight", "bold")
        .attr("fill", "white")
        .attr("text-anchor", "middle")
        .attr("pointer-events", "none");

    nodeLabel = nodeLabelEnter.merge(nodeLabel)
        .text(d => d.id);

    // Update simulation
    simulation.nodes(graphData.nodes);
    simulation.force("link").links(graphData.links);
    simulation.alpha(1).restart();
}

function ticked() {
    link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

    linkLabel
        .attr("x", d => (d.source.x + d.target.x) / 2)
        .attr("y", d => (d.source.y + d.target.y) / 2);

    node
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);

    nodeLabel
        .attr("x", d => d.x)
        .attr("y", d => d.y + 5);
}

function dragstarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
}

function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
}

function dragended(event, d) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
}

simulation.on("tick", ticked);

async function loadGraphData() {
    try {
        const response = await fetch(`${backendURL}/graph_data`);
        const data = await response.json();
        graphData = data;
        updateGraph();
    } catch (error) {
        console.error('Error loading graph data:', error);
    }
}

async function addCity() {
    const city = document.getElementById("cityInput").value.trim();
    if (!city) {
        showNotification("Please enter a city name", false);
        return;
    }

    try {
        const response = await fetch(`${backendURL}/add_city`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: city })
        });

        const data = await response.json();

        if (data.success) {
            showNotification(data.message, true);
            document.getElementById("cityInput").value = "";
            await loadGraphData();
            populateAllDropdowns();
        } else {
            showNotification(data.message, false);
        }
    } catch (error) {
        showNotification("Error adding city", false);
        console.error('Error:', error);
    }
}

async function addRoad() {
    const from = document.getElementById("fromInput").value;
    const to = document.getElementById("toInput").value;
    const weight = parseInt(document.getElementById("weightInput").value) || 1;

    if (!from || !to) {
        showNotification("Please select both cities", false);
        return;
    }

    if (from === to) {
        showNotification("Cannot add road from city to itself", false);
        return;
    }

    try {
        const response = await fetch(`${backendURL}/add_road`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ from, to, weight })
        });

        const data = await response.json();

        if (data.success) {
            showNotification(data.message, true);
            await loadGraphData();
        } else {
            showNotification(data.message, false);
        }
    } catch (error) {
        showNotification("Error adding road", false);
        console.error('Error:', error);
    }
}

async function findPath() {
    const start = document.getElementById("start").value;
    const end = document.getElementById("end").value;
    const algo = document.getElementById("algo").value;

    if (!start || !end) {
        showNotification("Please select both start and end cities", false);
        return;
    }

    // Clear previous highlights
    svg.selectAll(".link").classed("path-highlight", false);
    svg.selectAll(".node").classed("path-node", false);

    try {
        const response = await fetch(`${backendURL}/find_path`, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ start, end, algo })
        });

        const data = await response.json();

        if (data.path && data.path.length > 0) {
            const output = `Algorithm: ${algo}<br>Path: ${data.path.join(" → ")}<br>Distance: ${data.distance}`;
            document.getElementById("output").innerHTML = output;

            // Highlight path
            highlightPath(data.path);
            showNotification("Path found!", true);
        } else {
            document.getElementById("output").innerHTML = "No path found!";
            showNotification("No path found between selected cities", false);
        }
    } catch (error) {
        showNotification("Error finding path", false);
        console.error('Error:', error);
    }
}

function highlightPath(path) {
    // Highlight nodes in path
    svg.selectAll(".node")
        .classed("path-node", d => path.includes(d.id))
        .style("fill", d => path.includes(d.id) ? "#ff6b6b" : null)
        .style("stroke", d => path.includes(d.id) ? "#fff" : null)
        .style("stroke-width", d => path.includes(d.id) ? "3px" : null)
        .style("animation", d => path.includes(d.id) ? "nodePulse 2s infinite" : null);

    // Highlight links in path
    for (let i = 0; i < path.length - 1; i++) {
        const current = path[i];
        const next = path[i + 1];

        svg.selectAll(".link")
            .classed("path-highlight", d => 
                (d.source.id === current && d.target.id === next) ||
                (d.source.id === next && d.target.id === current)
            )
            .style("stroke", d => 
                ((d.source.id === current && d.target.id === next) ||
                 (d.source.id === next && d.target.id === current)) ? "#ff6b6b" : null
            )
            .style("stroke-width", d => 
                ((d.source.id === current && d.target.id === next) ||
                 (d.source.id === next && d.target.id === current)) ? "5px" : null
            )
            .style("animation", d => 
                ((d.source.id === current && d.target.id === next) ||
                 (d.source.id === next && d.target.id === current)) ? "pathPulse 2s infinite" : null
            );
    }
}

async function populateAllDropdowns() {
    try {
        const response = await fetch(`${backendURL}/all_cities`);
        const cities = await response.json();

        const dropdowns = ['fromInput', 'toInput', 'start', 'end'];

        dropdowns.forEach(id => {
            const dropdown = document.getElementById(id);
            const currentValue = dropdown.value;
            dropdown.innerHTML = "";

            // Add default option
            const defaultOption = document.createElement("option");
            defaultOption.value = "";
            if (id === 'fromInput') defaultOption.text = "Select From City";
            else if (id === 'toInput') defaultOption.text = "Select To City";
            else if (id === 'start') defaultOption.text = "Select Start City";
            else if (id === 'end') defaultOption.text = "Select End City";
            dropdown.appendChild(defaultOption);

            // Add city options
            cities.forEach(city => {
                const option = document.createElement("option");
                option.value = city;
                option.text = city;
                dropdown.appendChild(option);
            });

            // Restore previous selection
            if (cities.includes(currentValue)) {
                dropdown.value = currentValue;
            }
        });
    } catch (error) {
        console.error('Error loading cities:', error);
    }
}

// Initialize the app
window.onload = async function() {
    await loadGraphData();
    await populateAllDropdowns();

    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }

        @keyframes pathPulse {
            0%, 100% { stroke-opacity: 0.8; }
            50% { stroke-opacity: 1; }
        }

        @keyframes nodePulse {
            0%, 100% { r: 20; }
            50% { r: 25; }
        }
    `;
    document.head.appendChild(style);
};

// Handle Enter key for city input
document.addEventListener('DOMContentLoaded', function() {
    const cityInput = document.getElementById("cityInput");
    if (cityInput) {
        cityInput.addEventListener("keypress", function(event) {
            if (event.key === "Enter") {
                addCity();
            }
        });
    }
});