let fdiData = [];
let geojsonLayer;
let selectedYear = null;
let nationalFdiData = []; 
let papiData = [];

// PAPI dimensions
const papiDimensions = [
    "Dimension 1: Participation",
    "Dimension 2: Transparency of Local Decision-making",
    "Dimension 3: Vertical Accountability",
    "Dimension 4: Control of Corruption in the Public Sector",
    "Dimension 5: Public Administrative Procedures",
    "Dimension 6: Public Service Delivery",
    "Dimension 7: Environmental Governance",
    "Dimension 8: E-Governance"
];

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
    const fdi = getFDIForProvince(provinceName);
    const percentChange = getPercentageChange(provinceName);
    
    // Create tooltip element
    const tooltip = document.getElementById('map-tooltip');
    if (!tooltip) {
        const newTooltip = document.createElement('div');
        newTooltip.id = 'map-tooltip';
        document.body.appendChild(newTooltip);
    }
    
    const tt = document.getElementById('map-tooltip');
    tt.innerHTML = `<div class="tooltip-content">
        <strong>${provinceName}</strong><br>
        FDI: ${fdi !== null ? fdi.toLocaleString() : 'N/A'} million USD
        ${percentChange !== null ? `<br><span style="color:${percentChange >= 0 ? 'green' : 'red'}">
            Change: ${percentChange >= 0 ? '↑' : '↓'} ${Math.abs(percentChange).toFixed(2)}%
        </span>` : ''}
    </div>`;
    
    // Position tooltip relative to mouse
    tt.style.display = 'block';
    tt.style.left = `${e.originalEvent.pageX + 15}px`;
    tt.style.top = `${e.originalEvent.pageY - 30}px`;
    
    // Only create chart container if region exists
    if (region) {
        const chartContainer = document.createElement('div');
        chartContainer.className = 'chart-container';
        tt.appendChild(chartContainer);
        setTimeout(() => {
            createRegionalBarChart(chartContainer, region, provinceName);
        }, 10);
    }
}

function resetHighlight(e) {
    geojsonLayer.resetStyle(e.target);
    const tooltip = document.getElementById('map-tooltip');
    if (tooltip) {
        tooltip.style.display = 'none';
        tooltip.innerHTML = '';
    }
}

// Function to find min and max values for FDI across all years
function getFDIRange() {
    let min = Infinity;
    let max = -Infinity;
    
    fdiData.forEach(entry => {
        if (entry.FDI !== undefined && entry.FDI !== null) {
            const value = parseFloat(entry.FDI);
            if (!isNaN(value)) {
                min = Math.min(min, value);
                max = Math.max(max, value);
            }
        }
    });
    
    return { min, max };
}

// function getFDIForProvince(provinceName, normalized = false) {
//     if (!selectedYear) return null;
    
//     const provinceData = fdiData.find(d => 
//         d.Province.trim() === provinceName.trim() && 
//         d.Year === selectedYear.toString()
//     );
    
//     if (!provinceData) return null;
    
//     const value = parseFloat(provinceData.FDI);
    
//     if (!normalized) {
//         return value; 
//     }
    
//     const range = getFDIRange();
//     return normalizeValue(value, range.min, range.max);
// }

function getFDIForProvince(provinceName, normalized = false) {
    if (!selectedYear) return null;
    
    const provinceData = fdiData.find(d => 
      d.Province.trim() === provinceName.trim() && 
      d.Year === selectedYear.toString()
    );
    
    if (!provinceData) return null;
    
    const value = parseFloat(provinceData.FDI);
    const logValue = value > 0 ? Math.log(value) : 0;
    
    if (!normalized) {
      return logValue;
    }
    
    let min = Infinity, max = -Infinity;
    fdiData.forEach(entry => {
      if (entry.FDI !== undefined && entry.FDI !== null) {
        const v = parseFloat(entry.FDI);
        const lv = v > 0 ? Math.log(v) : 0;
        min = Math.min(min, lv);
        max = Math.max(max, lv);
      }
    });
    
    return normalizeValue(logValue, min, max);
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

function loadPAPIData() {
    const years = ['2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023'];
    
    const promises = years.map(year => {
        return fetch(`data/papi_${year}.json`)
            .then(response => {
                if (!response.ok) {
                    console.warn(`No PAPI data file found for ${year}, using simulated data`);
                    return simulatePAPIData(year);
                }
                return response.json();
            })
            .catch(error => {
                console.warn(`Error loading PAPI data for ${year}:`, error);
                return simulatePAPIData(year);
            });
    });
    
    return Promise.all(promises)
        .then(yearlyData => {
            let combinedData = [];
            yearlyData.forEach(data => {
                const validData = data.filter(entry => {
                    const allProvinces = [];
                    Object.values(vietnamRegionsEnglish).forEach(provinces => {
                        allProvinces.push(...provinces);
                    });
                    
                    return allProvinces.some(province => 
                        entry.Province && 
                        (entry.Province.trim() === province.trim() || 
                         entry.Province.trim() === province.trim().replace('-', ' '))
                    );
                });
                
                combinedData = combinedData.concat(validData);
            });
            
            papiData = combinedData;
            console.log('PAPI data loaded:', papiData.length, 'entries');
            
            if (selectedYear) {
                createPAPIFDIScatterPlots();
            }
            
            return papiData;
        });
}

function simulatePAPIData(year) {
    const provinces = [];
    
    Object.values(vietnamRegionsEnglish).forEach(regionProvinces => {
        provinces.push(...regionProvinces);
    });
    
    return provinces.map(province => {
        const data = {
            Province: province,
            Year: year
        };
        
        papiDimensions.forEach(dimension => {
            const baseScore = 5 + Math.random() * 5;
            
            const provinceEffect = province.charCodeAt(0) % 3 - 1;
            const yearEffect = (parseInt(year) - 2015) * 0.1;
            
            let score = baseScore + provinceEffect + yearEffect;
            
            score = Math.max(1, Math.min(10, score));
            
            data[dimension] = parseFloat(score.toFixed(2));
        });
        
        return data;
    });
}

function getPAPIDimensionRange(dimension) {
    let min = Infinity;
    let max = -Infinity;
    
    papiData.forEach(entry => {
        if (entry[dimension] !== undefined && entry[dimension] !== null) {
            const value = parseFloat(entry[dimension]);
            if (!isNaN(value)) {
                min = Math.min(min, value);
                max = Math.max(max, value);
            }
        }
    });
    
    return { min, max };
}

function normalizeValue(value, min, max) {
    if (min === max) return 50; 
    return ((value - min) / (max - min)) * 100;
}

function getPAPIForProvince(provinceName, dimension) {
    if (!selectedYear) return null;
    
    const provinceData = papiData.find(d => 
        d.Province.trim() === provinceName.trim() && 
        d.Year === selectedYear.toString()
    );
    
    if (!provinceData || !provinceData[dimension]) return null;
    
    const value = parseFloat(provinceData[dimension]);
    
    const range = getPAPIDimensionRange(dimension);
    return normalizeValue(value, range.min, range.max);
}

function calculateLinearRegression(data) {
    if (data.length < 2) return { slope: 0, intercept: 0 };
    
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;
    let n = 0;
    
    data.forEach(d => {
        if (d.x !== null && d.y !== null && !isNaN(d.x) && !isNaN(d.y)) {
            sumX += d.x;
            sumY += d.y;
            sumXY += d.x * d.y;
            sumXX += d.x * d.x;
            n++;
        }
    });
    
    if (n < 2) return { slope: 0, intercept: 0 };
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    return { slope, intercept };
}

function calculateRSquared(data, slope, intercept) {
    if (data.length < 2) return 0;
    let sumY = 0;
    data.forEach(d => {
      sumY += d.y;
    });
    const meanY = sumY / data.length;
    
    let ssTot = 0;
    let ssRes = 0;
    data.forEach(d => {
      const predictedY = slope * d.x + intercept;
      ssRes += Math.pow(d.y - predictedY, 2);
      ssTot += Math.pow(d.y - meanY, 2);
    });
    
    return ssTot === 0 ? 1 : 1 - (ssRes / ssTot);
  }
  

function createPAPIFDIScatterPlot(container, dimension) {
    d3.select(container).html("");
    
    const margin = { top: 40, right: 20, bottom: 60, left: 60 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = container.clientHeight - margin.top - margin.bottom;
    
    const svg = d3.select(container)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
    
    // Add title with marquee effect
    svg.append("text")
        .attr("class", "dimension-text")
        .attr("x", width / 2)
        .attr("y", -20)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .style("pointer-events", "none")
        .text(dimension);
    const data = [];
    
    const provinces = [];
    Object.values(vietnamRegionsEnglish).forEach(regionProvinces => {
        provinces.push(...regionProvinces);
    });
    
    provinces.forEach(province => {
        const papi = getPAPIForProvince(province, dimension);
        const fdi = getFDIForProvince(province, true); 
        
        if (papi !== null && fdi !== null) {
            data.push({
                province: province,
                x: papi,
                y: fdi,
                rawFdi: getFDIForProvince(province) 
            });
        }
    });
    
    if (data.length === 0) {
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", height / 2)
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .text("No data available for this dimension");
        return;
    }
    
    const x = d3.scaleLinear()
        .domain([0, 100])
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([0, 100])
        .range([height, 0]);
    
    // Add axes
    svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .style("font-size", "10px");
    
    svg.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(y))
        .selectAll("text")
        .style("font-size", "10px");
    
    // Add axis labels
    svg.append("text")
        .attr("class", "axis-label")
        .attr("x", width / 2)
        .attr("y", height + 40)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text("Normalized PAPI Score (0-100)");
    
    svg.append("text")
        .attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -40)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text("Normalized FDI Score (0-100)");
    
    const regression = calculateLinearRegression(data);
    const rSquared = calculateRSquared(data, regression.slope, regression.intercept);

    svg.append("text")
        .attr("class", "r-squared")
        .attr("x", 20)
        .attr("y", 20)
        .style("font-size", "10px")
        .text(`R² = ${rSquared.toFixed(2)}`);
    
    // Add line of best fit
    const lineData = [
        { x: 0, y: regression.intercept },
        { x: d3.max(data, d => d.x) * 1.1, y: regression.slope * d3.max(data, d => d.x) * 1.1 + regression.intercept }
    ];
    
    const line = d3.line()
        .x(d => x(d.x))
        .y(d => y(d.y));
    
    svg.append("path")
        .datum(lineData)
        .attr("class", "best-fit-line")
        .attr("d", line);
    
    // Add data points
    const points = svg.selectAll(".scatter-point")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "scatter-point")
        .attr("cx", d => x(d.x))
        .attr("cy", d => y(d.y))
        .attr("r", 4);
    
    // Add tooltip
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip-scatter")
        .style("opacity", 0);
    
    points.on("mouseover", function(event, d) {
        d3.select(this).attr("r", 6);
        
        tooltip.transition()
            .duration(200)
            .style("opacity", .9);
        
        tooltip.html(`<strong>${d.province}</strong><br>Normalized PAPI: ${d.x.toFixed(2)}<br>Normalized FDI: ${d.y.toFixed(2)}<br>Raw FDI: ${d.rawFdi.toLocaleString()} million USD`)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function() {
        d3.select(this).attr("r", 4);
        
        tooltip.transition()
            .duration(500)
            .style("opacity", 0);
    });
    
    svg.append("text")
        .attr("class", "regression-equation")
        .attr("x", width - 20)
        .attr("y", 20)
        .attr("text-anchor", "end")
        .style("font-size", "10px")
        .text(`y = ${regression.slope.toFixed(2)}x + ${regression.intercept.toFixed(2)}`);
}

function createPAPIFDIScatterPlots() {
    const container = document.querySelector('.scatter-plot-grid');
    container.innerHTML = '';
    
    papiDimensions.forEach(dimension => {
        const plotContainer = document.createElement('div');
        plotContainer.className = 'scatter-plot';
        plotContainer.id = `scatter-${dimension.split(':')[0].trim().toLowerCase()}`;
        container.appendChild(plotContainer);
        
        createPAPIFDIScatterPlot(plotContainer, dimension);
    });
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
    
    createPAPIFDIScatterPlots();
});

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
        
        return loadPAPIData();
    })
    .then(() => {
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
        
        createPAPIFDIScatterPlots();
    })
    .catch(error => {
        console.error('Error loading data:', error);
    });

window.addEventListener('resize', () => {
    map.invalidateSize();
    
    if (nationalFdiData.length > 0) {
        createNationalFDIChart();
        updateLineChartHighlight();
    }
    createPAPIFDIScatterPlots();
});
