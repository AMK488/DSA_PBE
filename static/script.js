const backendURL = 'http://127.0.0.1:5000';


function findPath() {
    const start = document.getElementById("start").value;
    const end = document.getElementById("end").value;
    const algo = document.getElementById("algo").value;

    fetch(`${backendURL}/find_path`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({start, end, algo})
    }).then(res => res.json()).then(data => {
        const out = `Path: ${data.path.join(" → ")}<br>Distance: ${data.distance}`;
        document.getElementById("output").innerHTML = out;
    });
}
function populateDropdowns() {
  fetch("/all_cities")
    .then(res => res.json())
    .then(cities => {
      const from = document.getElementById("fromInput");
      const to = document.getElementById("toInput");
      from.innerHTML = "";
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
window.onload = () => {
  refreshGraph();
  populateDropdowns();
};

function deleteCity() {
  const city = document.getElementById("cityInput").value;
  if (!city) return;
  fetch("/delete_city", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: city })
  }).then(() => {
    document.getElementById("cityInput").value = "";
    refreshGraph();
    populateDropdowns();
  });
}

function deleteRoad() {
  const from = document.getElementById("fromInput").value;
  const to = document.getElementById("toInput").value;
  fetch("/delete_road", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ from, to })
  }).then(() => {
    refreshGraph();
  });
}

// Call this inside existing actions too
function addCity() {
  const city = document.getElementById("cityInput").value;
  if (!city) return;

  fetch("/add_city", {
    method: "POST",
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: city })
  }).then(() => {
    document.getElementById("cityInput").value = "";
    refreshGraph();
    populateDropdowns();
  });
}

function addRoad() {
  const from = document.getElementById("fromInput").value;
  const to = document.getElementById("toInput").value;
  const weight = document.getElementById("weightInput").value || 1;

  if (!from || !to) return;

  fetch("/add_road", {
    method: "POST",
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to, weight })
  }).then(() => {
    refreshGraph();
  });
}

