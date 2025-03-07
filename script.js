let fdiData = [];
let geojsonLayer;
let selectedYear = null;

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

// Change the color scheme based on the FDI value
function getColor(fdi) {
    if (isNaN(fdi) || fdi === null) {
        return '#ffcccc'; 
    }
    
    if (fdi < 0) {
        if (fdi < -100) return '#990000'; 
        if (fdi < -50) return '#cc0000';  
        if (fdi < -10) return '#ff0000';  
        return '#ff6666';                 
    }
    
    if (fdi === 0 || fdi < 1) {
        return '#ffe6e6'; 
    }
    
    return fdi > 3000 ? '#004d00' :  
           fdi > 2000 ? '#006600' :  
           fdi > 1000 ? '#008800' :  
           fdi > 500  ? '#00aa00' :  
           fdi > 200  ? '#00cc00' :  
           fdi > 100  ? '#00ee00' :  
           fdi > 50   ? '#66ff66' :  
           fdi > 10   ? '#b3ffb3' :  
                        '#e6ffe6';   
}

function style(feature) {
    const provinceName = feature.properties.Name;
    const fdi = getFDIForProvince(provinceName);
    
    return {
        fillColor: getColor(fdi),
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
    
    layer.openTooltip();
}

function resetHighlight(e) {
    geojsonLayer.resetStyle(e.target);
    e.target.closeTooltip();
}

function getFDIForProvince(provinceName) {
    if (!selectedYear) return null;
    
    const provinceData = fdiData.find(d => 
        d.Province.trim() === provinceName.trim() && 
        d.Year === selectedYear.toString()
    );
    
    return provinceData ? parseFloat(provinceData.FDI) : null;
}

function getPercentageChange(provinceName) {
    if (!selectedYear || selectedYear === '2015') {
        return 0; 
    }
    
    const currentFDI = getFDIForProvince(provinceName);
    if (currentFDI === null) return null;
    
    const prevYear = (parseInt(selectedYear) - 1).toString();
    
    const prevProvinceData = fdiData.find(d => 
        d.Province.trim() === provinceName.trim() && 
        d.Year === prevYear
    );
    
    if (!prevProvinceData) return null;
    
    const prevFDI = parseFloat(prevProvinceData.FDI);
    if (isNaN(prevFDI) || prevFDI === null || prevFDI === 0) return null;
    
    return ((currentFDI - prevFDI) / Math.abs(prevFDI)) * 100;
}

function onEachFeature(feature, layer) {
    const provinceName = feature.properties.Name;
    const fdi = getFDIForProvince(provinceName);
    const percentChange = getPercentageChange(provinceName);
    
    let tooltipContent = '';
    
    if (fdi !== null) {
        tooltipContent = `${provinceName}<br>FDI: ${fdi.toLocaleString()} million USD`;
        
        if (percentChange !== null) {
            const changeSymbol = percentChange >= 0 ? '↑' : '↓';
            const changeColor = percentChange >= 0 ? 'green' : 'red';
            tooltipContent += `<br><span style="color:${changeColor}">Change: ${changeSymbol} ${Math.abs(percentChange).toFixed(2)}%</span>`;
        } else {
            tooltipContent += `<br>Change: N/A`;
        }
    } else {
        tooltipContent = `${provinceName}<br>No FDI data available`;
    }
    
    layer.bindTooltip(tooltipContent, {
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

function updateMap() {
    if (!geojsonLayer || !selectedYear) return;
    
    geojsonLayer.eachLayer(layer => {
        layer.setStyle(style(layer.feature));
        
        const provinceName = layer.feature.properties.Name;
        const fdi = getFDIForProvince(provinceName);
        const percentChange = getPercentageChange(provinceName);
        
        let tooltipContent = '';
        
        if (fdi !== null) {
            tooltipContent = `${provinceName}<br>FDI: ${fdi.toLocaleString()} million USD`;
            
            if (percentChange !== null) {
                const changeSymbol = percentChange >= 0 ? '↑' : '↓';
                const changeColor = percentChange >= 0 ? 'green' : 'red';
                tooltipContent += `<br><span style="color:${changeColor}">Change: ${changeSymbol} ${Math.abs(percentChange).toFixed(2)}%</span>`;
            } else {
                tooltipContent += `<br>Change: N/A`;
            }
        } else {
            tooltipContent = `${provinceName}<br>No FDI data available`;
        }
        
        layer.unbindTooltip();
        layer.bindTooltip(tooltipContent, {
            permanent: false,
            direction: 'top'
        });
    });
}

fetch('data/extracted_data.csv')
    .then(response => response.text())
    .then(csvText => {
        const lines = csvText.split('\n');
        const headers = lines[0].split(',');
        
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            if (values.length === headers.length) {
                const entry = {};
                headers.forEach((header, index) => {
                    entry[header] = values[index];
                });
                fdiData.push(entry);
            }
        }
        
        console.log('FDI data loaded:', fdiData.length, 'entries');
        
        return fetch('data/Vietnam_provinces.geojson');
    })
    .then(response => response.json())
    .then(data => {
        geojsonLayer = L.geoJSON(data, {
            style: style,
            onEachFeature: onEachFeature
        }).addTo(map);

        map.fitBounds(geojsonLayer.getBounds());
        
        selectedYear = '2023';
        console.log(`Default year set to ${selectedYear}`);
        
        document.getElementById('year-dropdown').value = selectedYear;
        
        const yearData = fdiData.filter(d => d.Year === selectedYear.toString());
        console.log(`Found ${yearData.length} entries for year ${selectedYear}`);
        
        updateMap();
    })
    .catch(error => {
        console.error('Error loading data:', error);
    });

const yearDropdown = document.getElementById('year-dropdown');
for (let year = 2015; year <= 2024; year++) {
    const option = document.createElement('option');
    option.value = year;
    option.textContent = year;
    yearDropdown.appendChild(option);
}

yearDropdown.addEventListener('change', (event) => {
    selectedYear = event.target.value;
    console.log(`Year ${selectedYear} selected`);
    
    const yearData = fdiData.filter(d => d.Year === selectedYear.toString());
    console.log(`Found ${yearData.length} entries for year ${selectedYear}`);
    
    updateMap();
    
    if (geojsonLayer) {
        map.fitBounds(geojsonLayer.getBounds());
    }
});

window.addEventListener('resize', () => {
    map.invalidateSize();
});

function addLegend() {
    const legend = L.control({ position: 'bottomright' });

    legend.onAdd = function() {
        const div = L.DomUtil.create('div', 'info legend');
        
        const negativeGrades = [-100, -50, -10, 0];
        const positiveGrades = [1, 10, 50, 100, 200, 500, 1000, 2000, 3000];
        
        let labels = ['<strong>FDI (million USD)</strong>'];
        
        labels.push('<div class="legend-section"><strong>Negative FDI</strong></div>');
        for (let i = 0; i < negativeGrades.length - 1; i++) {
            labels.push(
                '<i style="background:' + getColor(negativeGrades[i]) + '"></i> ' +
                negativeGrades[i] + (negativeGrades[i+1] > negativeGrades[i] ? 
                    ' to ' + negativeGrades[i+1] : '+')
            );
        }
        
        labels.push('<div class="legend-section"><strong>Positive FDI</strong></div>');
        for (let i = 0; i < positiveGrades.length; i++) {
            labels.push(
                '<i style="background:' + getColor(positiveGrades[i]) + '"></i> ' +
                positiveGrades[i] + (i < positiveGrades.length - 1 ? 
                    ' to ' + positiveGrades[i+1] : '+')
            );
        }
        
        labels.push('<div class="legend-section"><strong>No Data</strong></div>');
        labels.push('<i style="background:#ffcccc"></i> No data available');
        
        div.innerHTML = labels.join('<br>');
        return div;
    };

    legend.addTo(map);
}

addLegend();
