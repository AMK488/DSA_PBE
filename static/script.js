
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
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        animation: slideIn 0.3s ease-out;
    `;
    
    // Add CSS animation
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            document.body.removeChild(notification);
        }
    }, 3000);
}

function addCity() {
    const city = document.getElementById("cityInput").value.trim();
    if (!city) {
        showNotification("Please enter a city name", false);
        return;
    }

    fetch(`${backendURL}/add_city`, {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: city })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showNotification(`✅ City "${city}" added successfully!`, true);
            document.getElementById("cityInput").value = "";
            refreshGraph();
            populateDropdowns();
        } else {
            showNotification(data.message, false);
        }
    })
    .catch(error => {
        showNotification("Error adding city. Please try again.", false);
        console.error('Error:', error);
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
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showNotification(`🛣️ Road added between "${from}" and "${to}"!`, true);
            document.getElementById("weightInput").value = "";
            refreshGraph();
            populateDropdowns();
        } else {
            showNotification(data.message, false);
        }
    })
    .catch(error => {
        showNotification("Error adding road. Please try again.", false);
        console.error('Error:', error);
    });
}

function deleteCity() {
    const city = document.getElementById("cityInput").value.trim();
    if (!city) {
        showNotification("Please enter a city name", false);
        return;
    }
    
    fetch(`${backendURL}/delete_city`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: city })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showNotification(`🗑️ City "${city}" deleted successfully!`, true);
            document.getElementById("cityInput").value = "";
            refreshGraph();
            populateDropdowns();
        } else {
            showNotification(data.message, false);
        }
    })
    .catch(error => {
        showNotification("Error deleting city. Please try again.", false);
        console.error('Error:', error);
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
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showNotification(`🚫 Road deleted between "${from}" and "${to}"!`, true);
            refreshGraph();
            populateDropdowns();
        } else {
            showNotification(data.message, false);
        }
    })
    .catch(error => {
        showNotification("Error deleting road. Please try again.", false);
        console.error('Error:', error);
    });
}

function findPath() {
    const start = document.getElementById("start").value.trim();
    const end = document.getElementById("end").value.trim();
    const algo = document.getElementById("algo").value;

    if (!start || !end) {
        showNotification("Please enter both start and end cities", false);
        return;
    }

    fetch(`${backendURL}/find_path`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({start, end, algo})
    })
    .then(res => res.json())
    .then(data => {
        if (data.path && data.path.length > 0) {
            const out = `🎯 Path: ${data.path.join(" → ")}<br>📏 Distance: ${data.distance}`;
            document.getElementById("output").innerHTML = out;
            showNotification("Path found successfully!", true);
        } else {
            document.getElementById("output").innerHTML = "❌ No path found! Make sure cities are connected.";
            showNotification("No path found between the cities", false);
        }
    })
    .catch(error => {
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
            
            // Clear and repopulate dropdowns
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
        })
        .catch(error => {
            console.error('Error fetching cities:', error);
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
        })
        .catch(error => {
            console.error('Error fetching graph:', error);
        });
}

function formatGraphDisplay(graphData) {
    let display = "<h3>🗺️ Current Graph:</h3>";
    if (Object.keys(graphData).length === 0) {
        return display + "<p>No cities added yet. Add some cities to get started! 🏙️</p>";
    }
    
    display += "<ul style='list-style-type: none; padding-left: 0;'>";
    for (const [city, connections] of Object.entries(graphData)) {
        display += `<li style='margin: 8px 0; padding: 5px; background: #f0f0f0; border-radius: 3px;'><strong>🏙️ ${city}</strong>`;
        if (connections.length > 0) {
            display += " → ";
            const connectionStrings = connections.map(([neighbor, weight]) => `${neighbor} (${weight})`);
            display += connectionStrings.join(", ");
        } else {
            display += " <em>(no connections)</em>";
        }
        display += "</li>";
    }
    display += "</ul>";
    return display;
}

// Ensure functions are available globally immediately
window.addCity = addCity;
window.addRoad = addRoad;
window.deleteCity = deleteCity;
window.deleteRoad = deleteRoad;
window.findPath = findPath;
window.refreshGraph = refreshGraph;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Double-check that functions are available
    window.addCity = addCity;
    window.addRoad = addRoad;
    window.deleteCity = deleteCity;
    window.deleteRoad = deleteRoad;
    window.findPath = findPath;
    window.refreshGraph = refreshGraph;
    
    populateDropdowns();
    displayGraph();
});
