const map = L.map('map', {
    zoomControl: false  
}).setView([16.0474, 108.2062], 7); // Further increased zoom level from 6 to 7

// L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//     attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
// }).addTo(map);

document.getElementById('zoom-in').addEventListener('click', () => {
    map.zoomIn();
});

document.getElementById('zoom-out').addEventListener('click', () => {
    map.zoomOut();
});

function style(feature) {
    return {
        fillColor: '#2a9d8f',
        weight: 1,
        opacity: 1,
        color: '#ffffff',
        fillOpacity: 0.7
    };
}

function highlightFeature(e) {
    const layer = e.target;
    layer.setStyle({
        fillColor: '#264653',
        fillOpacity: 0.7
    });
    
    // Show tooltip
    layer.openTooltip();
}

function resetHighlight(e) {
    geojsonLayer.resetStyle(e.target);
    // Hide tooltip
    e.target.closeTooltip();
}

function onEachFeature(feature, layer) {
    // Bind tooltip with welcome message
    layer.bindTooltip(`Welcome to ${feature.properties.Name}`, {
        permanent: false,
        direction: 'top'
    });

    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: (e) => {
            map.fitBounds(e.target.getBounds());
        }
    });
}

let geojsonLayer;

// Load the GeoJSON data for the map
fetch('data/Vietnam_provinces.geojson')
    .then(response => response.json())
    .then(data => {
        geojsonLayer = L.geoJSON(data, {
            style: style,
            onEachFeature: onEachFeature
        }).addTo(map);

        map.fitBounds(geojsonLayer.getBounds());
    })
    .catch(error => {
        console.error('Error loading the GeoJSON file:', error);
    });

// Populate the dropdown with years from 2015 to 2024
const yearDropdown = document.getElementById('year-dropdown');
for (let year = 2015; year <= 2024; year++) {
    const option = document.createElement('option');
    option.value = year;
    option.textContent = year;
    yearDropdown.appendChild(option);
}

// Add event listener to the dropdown
yearDropdown.addEventListener('change', (event) => {
    const selectedYear = event.target.value;
    console.log(`Year ${selectedYear} selected`);
    
    // Reset the map view to show all of Vietnam
    if (geojsonLayer) {
        map.fitBounds(geojsonLayer.getBounds());
    }
});

window.addEventListener('resize', () => {
    map.invalidateSize();
});
