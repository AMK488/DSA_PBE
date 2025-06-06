
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
            
            to.innerHTML = "";
            cities.forEach(city => {
                const opt1 = document.createElement("option");
                const opt2 = document.createElement("option");
                opt1.value = opt2.value = city;
                opt1.text = opt2.text = city;
                from.appendChild(opt1);
                to.appendChild(opt2);
            });
        });
}
function populateAllDropdowns() {
    fetch("/all_cities")
        .then(res => res.json())
        .then(cities => {
            // Populate from/to dropdowns for adding roads
            const fromInput = document.getElementById("fromInput");
            const toInput = document.getElementById("toInput");

            // Populate start/end dropdowns for finding paths
            

            // Clear all dropdowns
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
        } else {
            showNotification(data.message, false);
        }
    });
}

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
            refreshGraph(); 
        } else {
            showNotification(data.message, false);
        }
    });
}

function all_cities(){
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
};
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

window.onload = () => {
    populateAllDropdowns();
};