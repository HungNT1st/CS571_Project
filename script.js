let fdiData = [];
let geojsonLayer;
let selectedYear = null;
let nationalFdiData = []; 

const vietnamRegionsEnglish = {
  "Red River Delta": [
    "Ha Noi",
    "Vinh Phuc",
    "Bac Ninh",
    "Quang Ninh",
    "Hai Duong",
    "Hai Phong",
    "Hung Yen",
    "Thai Binh",
    "Ha Nam",
    "Nam Dinh",
    "Ninh Binh"
  ],
  "Northern Midlands and Mountainous Region": [
    "Ha Giang",
    "Cao Bang",
    "Bac Kan",
    "Tuyen Quang",
    "Lao Cai",
    "Yen Bai",
    "Thai Nguyen",
    "Lang Son",
    "Bac Giang",
    "Phu Tho",
    "Dien Bien",
    "Lai Chau",
    "Son La",
    "Hoa Binh"
  ],
  "North Central and Central Coastal Region": [
    "Thanh Hoa",
    "Nghe An",
    "Ha Tinh",
    "Quang Binh",
    "Quang Tri",
    "Thua Thien Hue",
    "Da Nang",
    "Quang Nam",
    "Quang Ngai",
    "Binh Dinh",
    "Phu Yen",
    "Khanh Hoa",
    "Ninh Thuan",
    "Binh Thuan"
  ],
  "Central Highlands": [
    "Kon Tum",
    "Gia Lai",
    "Dak Lak",
    "Dak Nong",
    "Lam Dong"
  ],
  "Southeast": [
    "Binh Phuoc",
    "Tay Ninh",
    "Binh Duong",
    "Dong Nai",
    "Ba Ria - Vung Tau",
    "Ho Chi Minh"
  ],
  "Mekong Delta": [
    "Long An",
    "Tien Giang",
    "Ben Tre",
    "Tra Vinh",
    "Vinh Long",
    "Dong Thap",
    "An Giang",
    "Kien Giang",
    "Can Tho",
    "Hau Giang",
    "Soc Trang",
    "Bac Lieu",
    "Ca Mau"
  ]
};

function findRegionForProvince(provinceName) {
  for (const [region, provinces] of Object.entries(vietnamRegionsEnglish)) {
    if (provinces.includes(provinceName)) {
      return region;
    }
  }
  return null;
}

function getFDIDataForRegion(region) {
  if (!region || !selectedYear) return [];
  
  const provinces = vietnamRegionsEnglish[region] || [];
  const regionData = [];
  
  for (const province of provinces) {
    const fdi = getFDIForProvince(province);
    regionData.push({
      province: province,
      fdi: fdi !== null ? fdi : 0
    });
  }
  
  return regionData;
}

function createRegionalBarChart(container, region, highlightedProvince) {
  d3.select(container).html("");
  
  const regionData = getFDIDataForRegion(region);
  if (regionData.length === 0) return;
  
  regionData.sort((a, b) => b.fdi - a.fdi);
  
  const margin = { top: 20, right: 15, bottom: 60, left: 30 };
  const width = 300 - margin.left - margin.right;
  const height = 180 - margin.top - margin.bottom;
  
  const svg = d3.select(container)
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);
  
  svg.append("text")
    .attr("class", "chart-title")
    .attr("x", width / 2)
    .attr("y", -10)
    .attr("text-anchor", "middle")
    .text(region);
  
  const x = d3.scaleBand()
    .domain(regionData.map(d => d.province))
    .range([0, width])
    .padding(0.2);
  
  const y = d3.scaleLinear()
    .domain([0, d3.max(regionData, d => d.fdi) * 1.1])
    .range([height, 0]);
  
  svg.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "translate(-10,0)rotate(-45)")
    .style("text-anchor", "end")
    .style("font-size", "8px");
  
  svg.append("g")
    .attr("class", "y-axis")
    .call(d3.axisLeft(y))
    .selectAll("text")
    .style("font-size", "8px");
  
  svg.selectAll(".bar")
    .data(regionData)
    .enter()
    .append("rect")
    .attr("class", d => d.province === highlightedProvince ? "bar highlighted" : "bar")
    .attr("x", d => x(d.province))
    .attr("width", x.bandwidth())
    .attr("y", d => y(d.fdi))
    .attr("height", d => height - y(d.fdi));
  
  svg.selectAll(".label")
    .data(regionData)
    .enter()
    .append("text")
    .attr("class", "bar-label")
    .attr("x", d => x(d.province) + x.bandwidth() / 2)
    .attr("y", d => y(d.fdi) - 3)
    .attr("text-anchor", "middle")
    .attr("font-size", "6px")
    .text(d => d.fdi.toFixed(0));
}

const map = L.map('map', {
    zoomControl: false  
}).setView([16.0474, 108.2062], 7);

// L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//     attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
// }).addTo(map);

document.getElementById('zoom-in').addEventListener('click', () => {
    map.zoomIn();
});

document.getElementById('zoom-out').addEventListener('click', () => {
    map.zoomOut();
});

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

function addRegionBorders() {
    const regionBorderColor = '#264653';
    const regionBorderWeight = 0.5;
    const regionBorderOpacity = 0.7;
    
    const regionLayers = [];
    
    Object.entries(vietnamRegionsEnglish).forEach(([regionName, provinces]) => {
        const regionFeatures = [];
        
        geojsonLayer.eachLayer(layer => {
            const provinceName = layer.feature.properties.Name;
            if (provinces.includes(provinceName)) {
                const clonedFeature = JSON.parse(JSON.stringify(layer.feature));
                regionFeatures.push(clonedFeature);
            }
        });
        
        if (regionFeatures.length > 0) {
            const regionGeoJSON = {
                type: 'FeatureCollection',
                features: regionFeatures
            };
            
            const regionLayer = L.geoJSON(regionGeoJSON, {
                style: {
                    color: regionBorderColor,
                    weight: regionBorderWeight,
                    opacity: regionBorderOpacity,
                    fillOpacity: 0,
                    fill: false
                }
            }).addTo(map);
            
            regionLayers.push(regionLayer);
        }
    });
    
    map.regionLayers = regionLayers;
}

function highlightFeature(e) {
    const layer = e.target;
    layer.setStyle({
        fillColor: '#264653',
        fillOpacity: 0.7
    });
    
    const provinceName = layer.feature.properties.Name;
    const region = findRegionForProvince(provinceName);
    
    if (region) {
        const popupContent = document.createElement('div');
        popupContent.className = 'popup-content';
        
        const fdi = getFDIForProvince(provinceName);
        const percentChange = getPercentageChange(provinceName);
        
        let infoHTML = `<strong>${provinceName}</strong><br>FDI: ${fdi !== null ? fdi.toLocaleString() : 'N/A'} million USD`;
        
        if (percentChange !== null) {
            const changeSymbol = percentChange >= 0 ? '↑' : '↓';
            const changeColor = percentChange >= 0 ? 'green' : 'red';
            infoHTML += `<br><span style="color:${changeColor}">Change: ${changeSymbol} ${Math.abs(percentChange).toFixed(2)}%</span>`;
        } else if (selectedYear !== '2015') {
            infoHTML += `<br>Change: N/A`;
        }
        
        const infoDiv = document.createElement('div');
        infoDiv.innerHTML = infoHTML;
        popupContent.appendChild(infoDiv);
        
        const chartContainer = document.createElement('div');
        chartContainer.className = 'chart-container';
        popupContent.appendChild(chartContainer);
        
        if (layer._popup) {
            layer.unbindPopup();
        }
        
        layer.bindPopup(popupContent, {
            className: 'custom-popup',
            maxWidth: 400
        }).openPopup();
        
        setTimeout(() => {
            createRegionalBarChart(chartContainer, region, provinceName);
        }, 10);
    }
}

function resetHighlight(e) {
    geojsonLayer.resetStyle(e.target);
    e.target.closePopup();
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
    
    const region = findRegionForProvince(provinceName);
    
    if (!region) {
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
    }

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
        const region = findRegionForProvince(provinceName);
        
        layer.unbindTooltip();
        
        if (!region) {
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
        }
        
        if (layer.getPopup()) {
            const popupContent = document.createElement('div');
            popupContent.className = 'popup-content';
            
            let infoHTML = `<strong>${provinceName}</strong><br>FDI: ${fdi !== null ? fdi.toLocaleString() : 'N/A'} million USD`;
            
            if (percentChange !== null) {
                const changeSymbol = percentChange >= 0 ? '↑' : '↓';
                const changeColor = percentChange >= 0 ? 'green' : 'red';
                infoHTML += `<br><span style="color:${changeColor}">Change: ${changeSymbol} ${Math.abs(percentChange).toFixed(2)}%</span>`;
            } else if (selectedYear !== '2015') {
                infoHTML += `<br>Change: N/A`;
            }
            
            const infoDiv = document.createElement('div');
            infoDiv.innerHTML = infoHTML;
            popupContent.appendChild(infoDiv);
            
            const chartContainer = document.createElement('div');
            chartContainer.className = 'chart-container';
            popupContent.appendChild(chartContainer);
            
            layer.setPopupContent(popupContent);
            
            if (layer.getPopup().isOpen() && region) {
                setTimeout(() => {
                    createRegionalBarChart(chartContainer, region, provinceName);
                }, 10);
            }
        }
    });
}

function calculateNationalFDI() {
    const years = [...new Set(fdiData.map(d => d.Year))].sort();
    
    nationalFdiData = years.map(year => {
        const yearData = fdiData.filter(d => d.Year === year);
        const totalFDI = yearData.reduce((sum, entry) => {
            const fdi = parseFloat(entry.FDI);
            return sum + (isNaN(fdi) ? 0 : fdi);
        }, 0);
        
        return {
            year: year,
            totalFDI: totalFDI
        };
    });
    
    console.log('National FDI data calculated:', nationalFdiData);
    createNationalFDIChart();
}

function createNationalFDIChart() {
    const container = document.getElementById('line-chart-container');
    d3.select(container).html("");
    
    if (nationalFdiData.length === 0) return;
    
    const margin = { top: 40, right: 50, bottom: 60, left: 80 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = container.clientHeight - margin.top - margin.bottom;
    
    const svg = d3.select(container)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
    
    svg.append("text")
        .attr("class", "chart-title")
        .attr("x", width / 2)
        .attr("y", -20)
        .attr("text-anchor", "middle")
        .style("font-size", "18px")
        .text("Vietnam National FDI Trend (2015-2024)");
    
    const years = nationalFdiData.map(d => d.year);
    
    const x = d3.scalePoint()
        .domain(years)
        .range([0, width])
        .padding(0.5); 
    
    const y = d3.scaleLinear()
        .domain([0, d3.max(nationalFdiData, d => d.totalFDI) * 1.1])
        .range([height, 0]);
    
    svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .style("font-size", "12px");
    
    svg.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(y).tickFormat(d => d.toLocaleString()))
        .selectAll("text")
        .style("font-size", "12px");
    
    svg.append("text")
        .attr("class", "axis-label")
        .attr("x", width / 2)
        .attr("y", height + 40)
        .attr("text-anchor", "middle")
        .text("Year");
    
    svg.append("text")
        .attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -60)
        .attr("text-anchor", "middle")
        .text("Total FDI (million USD)");
    
    const line = d3.line()
        .x(d => x(d.year))
        .y(d => y(d.totalFDI))
        .curve(d3.curveMonotoneX);
    
    svg.append("path")
        .datum(nationalFdiData)
        .attr("class", "line-path")
        .attr("d", line);
    
    svg.selectAll(".data-point")
        .data(nationalFdiData)
        .enter()
        .append("circle")
        .attr("class", "data-point")
        .attr("cx", d => x(d.year))
        .attr("cy", d => y(d.totalFDI))
        .attr("r", d => d.year === selectedYear ? 8 : 6)
        .style("fill", d => d.year === selectedYear ? '#e76f51' : '#264653');
    
    svg.selectAll(".data-label")
        .data(nationalFdiData)
        .enter()
        .append("text")
        .attr("class", "data-label")
        .attr("x", d => x(d.year))
        .attr("y", d => y(d.totalFDI) - 15)
        .text(d => d.totalFDI.toLocaleString())
        .style("font-size", "12px")
        .attr("text-anchor", "middle");
    
    svg.selectAll("line.horizontal-grid")
        .data(y.ticks())
        .enter()
        .append("line")
        .attr("class", "axis-line")
        .attr("x1", 0)
        .attr("x2", width)
        .attr("y1", d => y(d))
        .attr("y2", d => y(d))
        .style("stroke-dasharray", "3,3");
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
        
        calculateNationalFDI();
        
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
        
        addRegionBorders();
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
        
        if (map.regionLayers) {
            map.regionLayers.forEach(layer => {
                map.removeLayer(layer);
            });
        }
        addRegionBorders();
    }
    
    updateLineChartHighlight();
});

function updateLineChartHighlight() {
    const container = document.getElementById('line-chart-container');
    const svg = d3.select(container).select('svg g');
    
    if (!svg.empty() && selectedYear) {
        svg.selectAll('.data-point').attr('r', 6).style('fill', '#264653');
        
        svg.selectAll('.data-point')
            .filter(d => d.year === selectedYear)
            .attr('r', 8)
            .style('fill', '#e76f51');
    }
}

window.addEventListener('resize', () => {
    map.invalidateSize();
    
    if (nationalFdiData.length > 0) {
        createNationalFDIChart();
        updateLineChartHighlight();
    }
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
