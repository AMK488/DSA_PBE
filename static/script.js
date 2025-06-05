
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

    fetch(`${backendURL}/add_city`, {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: city })
    }).then(res => res.json()).then(data => {
        if (data.success) {
            showNotification(data.message, true);
            document.getElementById("cityInput").value = "";
            refreshGraph();
            populateDropdowns();
        } else {
            showNotification(data.message, false);
        }
    });
}

function addRoad() {
    const from = document.getElementById("fromInput").value;
    const to = document.getElementById("toInput").value;
    const weight = parseInt(document.getElementById("weightInput").value) || 1;

    if (!from || !to) {
        showNotification("Please select both cities", false);
        return;
    }

    if (from === to) {
        showNotification("Cannot add road from a city to itself", false);
        return;
    }

    fetch(`${backendURL}/add_road`, {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to, weight })
    }).then(res => res.json()).then(data => {
        if (data.success) {
            showNotification(data.message, true);
            document.getElementById("weightInput").value = "";
            refreshGraph();
            populateDropdowns();
        } else {
            showNotification(data.message, false);
        }
    });
}

function deleteCity() {
    const city = document.getElementById("cityInput").value;
    if (!city) {
        showNotification("Please enter a city name", false);
        return;
    }
    fetch(`${backendURL}/delete_city`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: city })
    }).then(res => res.json()).then(data => {
        if (data.success) {
            showNotification(data.message, true);
            document.getElementById("cityInput").value = "";
            refreshGraph();
            populateDropdowns();
        } else {
            showNotification(data.message, false);
        }
    });
}

function deleteRoad() {
    const from = document.getElementById("fromInput").value;
    const to = document.getElementById("toInput").value;
    if (!from || !to) {
        showNotification("Please select both cities", false);
        return;
    }
    fetch(`${backendURL}/delete_road`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from, to })
    }).then(res => res.json()).then(data => {
        if (data.success) {
            showNotification(data.message, true);
            refreshGraph();
            populateDropdowns();
        } else {
            showNotification(data.message, false);
        }
    });
}

function findPath() {
    const start = document.getElementById("start").value;
    const end = document.getElementById("end").value;
    const algo = document.getElementById("algo").value;

    if (!start || !end) {
        showNotification("Please enter both start and end cities", false);
        return;
    }

    fetch(`${backendURL}/find_path`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({start, end, algo})
    }).then(res => res.json()).then(data => {
        if (data.path && data.path.length > 0) {
            const out = `Path: ${data.path.join(" → ")}<br>Distance: ${data.distance}`;
            document.getElementById("output").innerHTML = out;
        } else {
            document.getElementById("output").innerHTML = "No path found! Make sure cities are connected.";
        }
    }).catch(error => {
        showNotification("Error finding path", false);
        console.error('Error:', error);
    });
}

function populateDropdowns() {
    fetch(`${backendURL}/all_cities`)
        .then(res => res.json())
        .then(cities => {
            const from = document.getElementById("fromInput");
            const to = document.getElementById("toInput");
            const start = document.getElementById("start");
            const end = document.getElementById("end");
            
            from.innerHTML = '<option value="">Select From</option>';
            to.innerHTML = '<option value="">Select To</option>';
            
            cities.forEach(city => {
                const opt1 = document.createElement("option");
                const opt2 = document.createElement("option");
                opt1.value = opt2.value = city;
                opt1.text = opt2.text = city;
                from.appendChild(opt1);
                to.appendChild(opt2);
            });
            
            // Update start/end input datalists
            updateDatalist("start-cities", cities);
            updateDatalist("end-cities", cities);
        });
}

function updateDatalist(listId, cities) {
    let datalist = document.getElementById(listId);
    if (!datalist) {
        datalist = document.createElement("datalist");
        datalist.id = listId;
        document.body.appendChild(datalist);
    }
    datalist.innerHTML = "";
    cities.forEach(city => {
        const option = document.createElement("option");
        option.value = city;
        datalist.appendChild(option);
    });
}

function refreshGraph() {
    // This function can be used to refresh any graph visualization
    // For now, it just refreshes the dropdowns and updates the graph display
    populateDropdowns();
    displayGraph();
}

function displayGraph() {
    fetch(`${backendURL}/get_graph`)
        .then(res => res.json())
        .then(data => {
            const graphContainer = document.getElementById("graphDisplay");
            if (graphContainer) {
                graphContainer.innerHTML = formatGraphDisplay(data);
            }
        });
}

function formatGraphDisplay(graphData) {
    let display = "<h3>Current Graph:</h3>";
    if (Object.keys(graphData).length === 0) {
        return display + "<p>No cities added yet.</p>";
    }
    
    display += "<ul>";
    for (const [city, connections] of Object.entries(graphData)) {
        display += `<li><strong>${city}</strong>`;
        if (connections.length > 0) {
            display += " → ";
            const connectionStrings = connections.map(([neighbor, weight]) => `${neighbor} (${weight})`);
            display += connectionStrings.join(", ");
        } else {
            display += " (no connections)";
        }
        display += "</li>";
    }
    display += "</ul>";
    return display;
}

// Make sure all functions are available globally
window.addCity = addCity;
window.addRoad = addRoad;
window.deleteCity = deleteCity;
window.deleteRoad = deleteRoad;
window.findPath = findPath;
window.refreshGraph = refreshGraph;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    populateDropdowns();
    displayGraph();
});
