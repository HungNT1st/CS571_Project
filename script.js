const map = L.map('map', {
    zoomControl: false  
}).setView([16.0474, 108.2062], 5); 


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
}

function resetHighlight(e) {
    geojsonLayer.resetStyle(e.target);
}

function onEachFeature(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: (e) => {
            map.fitBounds(e.target.getBounds());
        }
    });

    layer.bindPopup(`Welcome to ${feature.properties.Name}`);
}

let geojsonLayer;

fetch('data/Vietnam_provinces.geojson')
    .then(response => response.json())
    .then(data => {
        geojsonLayer = L.geoJSON(data, {
            style: style,
            onEachFeature: onEachFeature
        }).addTo(map);

        map.fitBounds(geojsonLayer.getBounds());

        const tableBody = document.getElementById('provinces-body');
        data.features
            .sort((a, b) => a.properties.Name.localeCompare(b.properties.Name))
            .forEach(feature => {
                const row = document.createElement('tr');
                const cell = document.createElement('td');
                cell.textContent = feature.properties.Name;
                
                row.addEventListener('click', () => {
                    const layer = geojsonLayer.getLayers().find(layer => 
                        layer.feature.properties.Name === feature.properties.Name
                    );
                    if (layer) {
                        map.fitBounds(layer.getBounds());
                        layer.openPopup();
                    }
                });
                
                row.appendChild(cell);
                tableBody.appendChild(row);
            });
    })
    .catch(error => {
        console.error('Error loading the GeoJSON file:', error);
    });

document.querySelectorAll('#provinces-body tr').forEach(row => {
    row.style.cursor = 'pointer';
});

window.addEventListener('resize', () => {
    map.invalidateSize();
});
