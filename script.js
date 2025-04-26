/* ------------------------------------------------------------------ */
/*                      GLOBAL STATE & CONSTANTS                      */
/* ------------------------------------------------------------------ */
let fdiData = [];
let papiData = [];
let nationalFdiData = [];

let geojsonLayer;
let selectedYear = null;

const years = Array.from({ length: 2024 - 2015 + 1 }, (_, i) => (2015 + i).toString());

/* PAPI dimensions */
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

/* Vietnam region dictionary (English names) */
const vietnamRegionsEnglish = {
  "Red River Delta": [
    "Ha Noi", "Vinh Phuc", "Bac Ninh", "Quang Ninh", "Hai Duong",
    "Hai Phong", "Hung Yen", "Thai Binh", "Ha Nam", "Nam Dinh", "Ninh Binh"
  ],
  "Northern Midlands and Mountainous Region": [
    "Ha Giang", "Cao Bang", "Bac Kan", "Tuyen Quang", "Lao Cai", "Yen Bai",
    "Thai Nguyen", "Lang Son", "Bac Giang", "Phu Tho", "Dien Bien", "Lai Chau",
    "Son La", "Hoa Binh"
  ],
  "North Central and Central Coastal Region": [
    "Thanh Hoa", "Nghe An", "Ha Tinh", "Quang Binh", "Quang Tri",
    "Thua Thien Hue", "Da Nang", "Quang Nam", "Quang Ngai", "Binh Dinh",
    "Phu Yen", "Khanh Hoa", "Ninh Thuan", "Binh Thuan"
  ],
  "Central Highlands": [
    "Kon Tum", "Gia Lai", "Dak Lak", "Dak Nong", "Lam Dong"
  ],
  "Southeast": [
    "Binh Phuoc", "Tay Ninh", "Binh Duong", "Dong Nai",
    "Ba Ria - Vung Tau", "Ho Chi Minh"
  ],
  "Mekong Delta": [
    "Long An", "Tien Giang", "Ben Tre", "Tra Vinh", "Vinh Long",
    "Dong Thap", "An Giang", "Kien Giang", "Can Tho", "Hau Giang",
    "Soc Trang", "Bac Lieu", "Ca Mau"
  ]
};

/* ------------------------------------------------------------------ */
/*                       REGION & FDI HELPERS                         */
/* ------------------------------------------------------------------ */
function findRegionForProvince(provinceName) {
  for (const [region, provinces] of Object.entries(vietnamRegionsEnglish)) {
    if (provinces.includes(provinceName)) return region;
  }
  return null;
}

function getFDIDataForRegion(region) {
  if (!region || !selectedYear) return [];

  const provinces = vietnamRegionsEnglish[region] || [];
  return provinces.map(province => {
    const fdi = getFDIForProvince(province);
    return { province, fdi: fdi !== null ? fdi : 0 };
  });
}

function createRegionalBarChart(container, region, highlightedProvince) {
  d3.select(container).html("");

  const regionData = getFDIDataForRegion(region);
  if (!regionData.length) return;

  regionData.sort((a, b) => b.fdi - a.fdi);

  const margin = { top: 20, right: 15, bottom: 60, left: 30 };
  const width  = 300 - margin.left - margin.right;
  const height = 180 - margin.top - margin.bottom;

  const svg = d3.select(container)
    .append("svg")
    .attr("width",  width  + margin.left + margin.right)
    .attr("height", height + margin.top  + margin.bottom)
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
    .attr("x",      d => x(d.province))
    .attr("width",  x.bandwidth())
    .attr("y",      d => y(d.fdi))
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

/* ------------------------------------------------------------------ */
/*                         LEAFLET MAP SETUP                          */
/* ------------------------------------------------------------------ */
const map = L.map("map", { zoomControl: false }).setView([16.0474, 108.2062], 7);

document.getElementById("zoom-in").addEventListener("click", () => map.zoomIn());
document.getElementById("zoom-out").addEventListener("click", () => map.zoomOut());

/* -------------------  Province colour & style  -------------------- */
function getColor(fdi) {
  if (isNaN(fdi) || fdi === null) return "#ffcccc";      

  if (fdi < 0) {                                         
    if (fdi < -100) return "#990000";
    if (fdi < -50)  return "#cc0000";
    if (fdi < -10)  return "#ff0000";
    return "#ff6666";
  }

  if (fdi === 0 || fdi < 1) return "#ffe6e6";           

  return fdi > 3000 ? "#004d00" :
         fdi > 2000 ? "#006600" :
         fdi > 1000 ? "#008800" :
         fdi >  500 ? "#00aa00" :
         fdi >  200 ? "#00cc00" :
         fdi >  100 ? "#00ee00" :
         fdi >   50 ? "#66ff66" :
         fdi >   10 ? "#b3ffb3" : "#e6ffe6";
}

function style(feature) {
  const provinceName = feature.properties.Name;
  const fdi          = getFDIForProvince(provinceName);
  return {
    fillColor   : getColor(fdi),
    weight      : 1,
    opacity     : 1,
    color       : "#ffffff",
    fillOpacity : 0.7
  };
}

function addRegionBorders() {
  const regionBorderColor   = "#264653";
  const regionBorderWeight  = 0.5;
  const regionBorderOpacity = 0.7;

  const regionLayers = [];

  Object.entries(vietnamRegionsEnglish).forEach(([regionName, provinces]) => {
    const regionFeatures = [];

    geojsonLayer.eachLayer(layer => {
      if (provinces.includes(layer.feature.properties.Name)) {
        const cloned = JSON.parse(JSON.stringify(layer.feature));
        regionFeatures.push(cloned);
      }
    });

    if (!regionFeatures.length) return;

    const regionLayer = L.geoJSON(
      { type: "FeatureCollection", features: regionFeatures },
      {
        style: {
          color       : regionBorderColor,
          weight      : regionBorderWeight,
          opacity     : regionBorderOpacity,
          fillOpacity : 0,
          fill        : false
        }
      }
    ).addTo(map);

    regionLayers.push(regionLayer);
  });

  map.regionLayers = regionLayers;
}

/* -----------------------  Map interactions  ----------------------- */
function highlightFeature(e) {
  const layer = e.target;
  layer.setStyle({ fillColor: "#264653", fillOpacity: 0.7 });

  const provinceName = layer.feature.properties.Name;
  const region       = findRegionForProvince(provinceName);
  const fdi          = getFDIForProvince(provinceName);
  const pctChange    = getPercentageChange(provinceName);

  let tooltip = document.getElementById("map-tooltip");
  if (!tooltip) {
    tooltip       = document.createElement("div");
    tooltip.id    = "map-tooltip";
    document.body.appendChild(tooltip);
  }

  tooltip.innerHTML =
    `<div class="tooltip-content">
       <strong>${provinceName}</strong><br>
       FDI: ${fdi !== null ? fdi.toLocaleString() : "N/A"} million USD
       ${pctChange !== null ? `<br><span style="color:${pctChange >= 0 ? "green" : "red"}">
         Change: ${pctChange >= 0 ? "↑" : "↓"} ${Math.abs(pctChange).toFixed(2)}%
       </span>` : ""}
     </div>`;
  tooltip.style.display = "block";
  tooltip.style.left = `${e.originalEvent.pageX + 15}px`;
  tooltip.style.top  = `${e.originalEvent.pageY - 30}px`;

  if (region) {
    const chartContainer = document.createElement("div");
    chartContainer.className = "chart-container";
    tooltip.appendChild(chartContainer);
    setTimeout(() => createRegionalBarChart(chartContainer, region, provinceName), 10);
  }
}

function resetHighlight(e) {
  geojsonLayer.resetStyle(e.target);
  const tooltip = document.getElementById("map-tooltip");
  if (tooltip) { tooltip.style.display = "none"; tooltip.innerHTML = ""; }
}

function onEachFeature(feature, layer) {
  const provinceName = feature.properties.Name;
  const region       = findRegionForProvince(provinceName);
  const fdi          = getFDIForProvince(provinceName);
  const pctChange    = getPercentageChange(provinceName);

  if (!region) {
    let html = `${provinceName}<br>`;
    if (fdi !== null) {
      html += `FDI: ${fdi.toLocaleString()} million USD`;
      if (pctChange !== null) {
        const sym  = pctChange >= 0 ? "↑" : "↓";
        const col  = pctChange >= 0 ? "green" : "red";
        html += `<br><span style="color:${col}">Change: ${sym} ${Math.abs(pctChange).toFixed(2)}%</span>`;
      } else if (selectedYear !== "2015") {
        html += "<br>Change: N/A";
      }
    } else {
      html += "No FDI data available";
    }

    layer.bindTooltip(html, { permanent:false, direction:"top" });
  }

  layer.on({
    mouseover : highlightFeature,
    mouseout  : resetHighlight,
    click     : e => map.fitBounds(e.target.getBounds())
  });
}

/* ------------------------------------------------------------------ */
/*                    FDI VALUE AND PERCENT CHANGE                    */
/* ------------------------------------------------------------------ */
function getFDIRange() {
  let min = Infinity, max = -Infinity;
  fdiData.forEach(d => {
    if (d.FDI !== undefined && d.FDI !== null) {
      const val = parseFloat(d.FDI);
      if (!isNaN(val)) {
        min = Math.min(min, val);
        max = Math.max(max, val);
      }
    }
  });
  return { min, max };
}

function getFDIForProvince(provinceName, normalized = false) {
  if (!selectedYear) return null;

  const entry = fdiData.find(d =>
    d.Province.trim() === provinceName.trim() &&
    d.Year            === selectedYear.toString()
  );
  if (!entry) return null;

  const rawVal   = parseFloat(entry.FDI);
  const logValue = rawVal > 0 ? Math.log(rawVal) : 0;

  if (!normalized) return logValue;

  let min = Infinity, max = -Infinity;
  fdiData.forEach(e => {
    if (e.FDI !== undefined && e.FDI !== null) {
      const v  = parseFloat(e.FDI);
      const lv = v > 0 ? Math.log(v) : 0;
      min = Math.min(min, lv);
      max = Math.max(max, lv);
    }
  });
  return normalizeValue(logValue, min, max);
}

function getPercentageChange(provinceName) {
  if (!selectedYear || selectedYear === "2015") return 0;

  const current = getFDIForProvince(provinceName);
  if (current === null) return null;

  const prevEntry = fdiData.find(d =>
    d.Province.trim() === provinceName.trim() &&
    d.Year            === (parseInt(selectedYear) - 1).toString()
  );
  if (!prevEntry) return null;

  const prev = parseFloat(prevEntry.FDI);
  if (isNaN(prev) || prev === 0) return null;

  return ((current - prev) / Math.abs(prev)) * 100;
}

/* ------------------------------------------------------------------ */
/*                       MAP & CHART REFRESH                          */
/* ------------------------------------------------------------------ */
function updateMap() {
  if (!geojsonLayer || !selectedYear) return;

  geojsonLayer.eachLayer(layer => {
    layer.setStyle(style(layer.feature));

    const provinceName = layer.feature.properties.Name;
    const fdi          = getFDIForProvince(provinceName);
    const pctChange    = getPercentageChange(provinceName);
    const region       = findRegionForProvince(provinceName);

    layer.unbindTooltip();
    if (!region) {
      let html = `${provinceName}<br>`;
      if (fdi !== null) {
        html += `FDI: ${fdi.toLocaleString()} million USD`;
        if (pctChange !== null) {
          const sym  = pctChange >= 0 ? "↑" : "↓";
          const col  = pctChange >= 0 ? "green" : "red";
          html += `<br><span style="color:${col}">Change: ${sym} ${Math.abs(pctChange).toFixed(2)}%</span>`;
        } else if (selectedYear !== "2015") {
          html += "<br>Change: N/A";
        }
      } else {
        html += "No FDI data available";
      }
      layer.bindTooltip(html, { permanent:false, direction:"top" });
    }
  });
}

/* ------------------------------------------------------------------ */
/*                     NATIONAL FDI LINE-CHART                        */
/* ------------------------------------------------------------------ */
function calculateNationalFDI() {
  const yearsAvailable = [...new Set(fdiData.map(d => d.Year))].sort();
  nationalFdiData = yearsAvailable.map(yr => {
    const totalFDI = fdiData
      .filter(d => d.Year === yr)
      .reduce((sum, e) => sum + (isNaN(parseFloat(e.FDI)) ? 0 : parseFloat(e.FDI)), 0);
    return { year: yr, totalFDI };
  });
}

function createNationalFDIChart() {
  const container = document.getElementById("line-chart-container");
  d3.select(container).html("");

  if (!nationalFdiData.length) return;

  const margin = { top: 40, right: 50, bottom: 60, left: 80 };
  const width  = container.clientWidth  - margin.left - margin.right;
  const height = container.clientHeight - margin.top  - margin.bottom;

  const svg = d3.select(container)
    .append("svg")
    .attr("width",  width  + margin.left + margin.right)
    .attr("height", height + margin.top  + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  svg.append("text")
    .attr("class", "chart-title")
    .attr("x", width / 2)
    .attr("y", -20)
    .attr("text-anchor", "middle")
    .style("font-size", "18px")
    .text("Vietnam National FDI Trend (2015–2024)");

  const x = d3.scalePoint()
    .domain(nationalFdiData.map(d => d.year))
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
    .style("fill", d => d.year === selectedYear ? "#e76f51" : "#264653");

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

function updateLineChartHighlight() {
  const svg = d3.select("#line-chart-container svg g");
  if (svg.empty() || !selectedYear) return;

  svg.selectAll(".data-point")
    .attr("r", 6)
    .style("fill", "#264653");

  svg.selectAll(".data-point")
    .filter(d => d.year === selectedYear)
    .attr("r", 8)
    .style("fill", "#e76f51");
}

/* ------------------------------------------------------------------ */
/*                PAPI–FDI SCATTER PLOTS & HELPERS                    */
/* ------------------------------------------------------------------ */
function normalizeValue(value, min, max) {
  if (min === max) return 50;
  return ((value - min) / (max - min)) * 100;
}

function getPAPIDimensionRange(dimension) {
  let min = Infinity, max = -Infinity;
  papiData.forEach(entry => {
    if (entry[dimension] !== undefined && entry[dimension] !== null) {
      const val = parseFloat(entry[dimension]);
      if (!isNaN(val)) {
        min = Math.min(min, val);
        max = Math.max(max, val);
      }
    }
  });
  return { min, max };
}

function getPAPIForProvince(provinceName, dimension) {
  if (!selectedYear) return null;
  const entry = papiData.find(d =>
    d.Province.trim() === provinceName.trim() &&
    d.Year            === selectedYear.toString()
  );
  if (!entry || !entry[dimension]) return null;
  const val = parseFloat(entry[dimension]);
  const range = getPAPIDimensionRange(dimension);
  return normalizeValue(val, range.min, range.max);
}

function calculateLinearRegression(data) {
  if (data.length < 2) return { slope: 0, intercept: 0 };

  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0, n = 0;
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

  const slope     = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

function calculateRSquared(data, slope, intercept) {
  if (data.length < 2) return 0;

  const meanY = d3.mean(data, d => d.y);
  let ssTot = 0, ssRes = 0;
  data.forEach(d => {
    const predY = slope * d.x + intercept;
    ssRes += Math.pow(d.y - predY, 2);
    ssTot += Math.pow(d.y - meanY, 2);
  });
  return ssTot === 0 ? 1 : 1 - (ssRes / ssTot);
}

function createPAPIFDIScatterPlot(container, dimension) {
  d3.select(container).html("");

  const margin = { top: 40, right: 20, bottom: 60, left: 60 };
  const width  = container.clientWidth  - margin.left - margin.right;
  const height = container.clientHeight - margin.top  - margin.bottom;

  const svg = d3.select(container)
    .append("svg")
    .attr("width",  width  + margin.left + margin.right)
    .attr("height", height + margin.top  + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  svg.append("text")
    .attr("class", "dimension-text")
    .attr("x", width / 2)
    .attr("y", -20)
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .text(dimension);

  const points = [];
  const provinces = [].concat(...Object.values(vietnamRegionsEnglish));
  provinces.forEach(province => {
    const papi = getPAPIForProvince(province, dimension);
    const fdi  = getFDIForProvince(province, true);  
    if (papi !== null && fdi !== null) {
      points.push({
        province,
        x      : papi,
        y      : fdi,
        rawFdi : getFDIForProvince(province)          
      });
    }
  });

  if (!points.length) {
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", height / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .text("No data available for this dimension");
    return;
  }

  const x = d3.scaleLinear().domain([0, 100]).range([0, width]);
  const y = d3.scaleLinear().domain([0, 100]).range([height, 0]);

  svg.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll("text").style("font-size", "10px");

  svg.append("g")
    .attr("class", "y-axis")
    .call(d3.axisLeft(y))
    .selectAll("text").style("font-size", "10px");

  svg.append("text")
    .attr("class", "axis-label")
    .attr("x", width / 2)
    .attr("y", height + 40)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .text("Normalized PAPI Score (0–100)");

  svg.append("text")
    .attr("class", "axis-label")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -40)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .text("Normalized FDI Score (0–100)");

  const { slope, intercept } = calculateLinearRegression(points);
  const r2 = calculateRSquared(points, slope, intercept);

  svg.append("text")
    .attr("class", "r-squared")
    .attr("x", 20)
    .attr("y", 20)
    .style("font-size", "10px")
    .text(`R² = ${r2.toFixed(2)}`);

  const lineData = [
    { x: 0, y: intercept },
    { x: 100, y: slope * 100 + intercept }
  ];
  const line = d3.line()
    .x(d => x(d.x))
    .y(d => y(d.y));
  svg.append("path")
    .datum(lineData)
    .attr("class", "best-fit-line")
    .attr("d", line);

  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip-scatter")
    .style("opacity", 0);

  svg.selectAll(".scatter-point")
    .data(points)
    .enter()
    .append("circle")
    .attr("class", "scatter-point")
    .attr("cx", d => x(d.x))
    .attr("cy", d => y(d.y))
    .attr("r", 4)
    .on("mouseover", function (event, d) {
      d3.select(this).attr("r", 6);
      tooltip.transition().duration(200).style("opacity", 0.9);
      tooltip.html(
        `<strong>${d.province}</strong><br>
         Normalized PAPI: ${d.x.toFixed(2)}<br>
         Normalized FDI : ${d.y.toFixed(2)}<br>
         Raw FDI: ${d.rawFdi.toLocaleString()} million USD`
      )
      .style("left",  (event.pageX + 10) + "px")
      .style("top",   (event.pageY - 28) + "px");
    })
    .on("mouseout", function () {
      d3.select(this).attr("r", 4);
      tooltip.transition().duration(500).style("opacity", 0);
    });

  svg.append("text")
    .attr("class", "regression-equation")
    .attr("x", width - 20)
    .attr("y", 20)
    .attr("text-anchor", "end")
    .style("font-size", "10px")
    .text(`y = ${slope.toFixed(2)}x + ${intercept.toFixed(2)}`);
}

function createPAPIFDIScatterPlots() {
  const grid = document.querySelector(".scatter-plot-grid");
  grid.innerHTML = "";
  papiDimensions.forEach(dim => {
    const div = document.createElement("div");
    div.className = "scatter-plot";
    grid.appendChild(div);
    createPAPIFDIScatterPlot(div, dim);
  });
}

/* ------------------------------------------------------------------ */
/*                   PAPI DATA LOADING / SIMULATION                   */
/* ------------------------------------------------------------------ */
function loadPAPIData() {
  const promises = years.map(year =>
    fetch(`data/papi_${year}.json`)
      .then(r => r.ok ? r.json() : simulatePAPIData(year))
      .catch(() => simulatePAPIData(year))
  );

  return Promise.all(promises).then(yearlyArrays => {
    papiData = yearlyArrays.flat().filter(entry => {
      const allProvinces = [].concat(...Object.values(vietnamRegionsEnglish));
      return allProvinces.includes(entry.Province.trim());
    });
  });
}

function simulatePAPIData(year) {
  const provinces = [].concat(...Object.values(vietnamRegionsEnglish));
  return provinces.map(province => {
    const entry = { Province: province, Year: year };
    papiDimensions.forEach(dim => {
      const base = 5 + Math.random() * 5;
      const provinceEffect = province.charCodeAt(0) % 3 - 1;
      const yearEffect     = (parseInt(year) - 2015) * 0.1;
      let score = base + provinceEffect + yearEffect;
      score = Math.max(1, Math.min(10, score));
      entry[dim] = parseFloat(score.toFixed(2));
    });
    return entry;
  });
}

/* ------------------------------------------------------------------ */
/*                 YEAR-BUTTON PAGINATION COMPONENT                   */
/* ------------------------------------------------------------------ */
function buildYearButtons() {
  const container = document.getElementById("year-pagination");
  container.innerHTML = "";

  years.forEach(year => {
    const btn       = document.createElement("button");
    btn.className   = "year-btn";
    btn.dataset.year = year;
    btn.textContent  = year;
    container.appendChild(btn);
  });

  container.addEventListener("click", e => {
    if (!e.target.matches(".year-btn")) return;
    selectedYear = e.target.dataset.year;
    handleYearChange();
  });
}

function highlightActiveYearButton() {
  document.querySelectorAll(".year-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.year === selectedYear);
  });
}

function handleYearChange() {
  updateMap();

  if (geojsonLayer) {
    map.fitBounds(geojsonLayer.getBounds());
    if (map.regionLayers) map.regionLayers.forEach(l => map.removeLayer(l));
    addRegionBorders();
  }

  updateLineChartHighlight();
  createPAPIFDIScatterPlots();
  highlightActiveYearButton();
}

/* ------------------------------------------------------------------ */
/*                     MAIN DATA-LOADING SEQUENCE                     */
/* ------------------------------------------------------------------ */
Promise.all([
  fetch("data/extracted_data.csv").then(r => r.text()),
  fetch("data/Vietnam_provinces.geojson").then(r => r.json()),
  loadPAPIData()
])
.then(([csvText, geoJSON]) => {
  const [headerLine, ...rows] = csvText.trim().split("\n");
  const headers = headerLine.split(",");
  rows.forEach(row => {
    const obj = {};
    row.split(",").forEach((v, i) => obj[headers[i]] = v);
    fdiData.push(obj);
  });

  calculateNationalFDI();

  geojsonLayer = L.geoJSON(geoJSON, { style, onEachFeature }).addTo(map);
  map.fitBounds(geojsonLayer.getBounds());
  addRegionBorders();
  addLegend();

  selectedYear = "2023";
  buildYearButtons();
  highlightActiveYearButton();

  updateMap();
  createNationalFDIChart();
  createPAPIFDIScatterPlots();
  updateLineChartHighlight();
})
.catch(err => console.error("Error loading data:", err));

/* ------------------------------------------------------------------ */
/*                         WINDOW RESIZE HANDLER                      */
/* ------------------------------------------------------------------ */
window.addEventListener("resize", () => {
  map.invalidateSize();
  if (nationalFdiData.length) {
    createNationalFDIChart();
    updateLineChartHighlight();
  }
  createPAPIFDIScatterPlots();
});

/* ------------------------------------------------------------------ */
/*                               LEGEND                               */
/* ------------------------------------------------------------------ */
function addLegend() {
    const legend = L.control({ position: "bottomright" });
  
    legend.onAdd = function () {
      const div = L.DomUtil.create("div", "info legend");
  
      const negativeGrades = [-100, -50, -10, 0];
      const positiveGrades = [1, 10, 50, 100, 200, 500, 1000, 2000, 3000];
  
      const labels = ["<strong>FDI (million USD)</strong>"];
  
      labels.push('<div class="legend-section"><strong>Negative FDI</strong></div>');
      for (let i = 0; i < negativeGrades.length - 1; i++) {
        labels.push(
          `<i style="background:${getColor(negativeGrades[i])}"></i> ` +
          `${negativeGrades[i]} to ${negativeGrades[i + 1]}`
        );
      }
  
      labels.push('<div class="legend-section"><strong>Positive FDI</strong></div>');
      for (let i = 0; i < positiveGrades.length; i++) {
        labels.push(
          `<i style="background:${getColor(positiveGrades[i])}"></i> ` +
          positiveGrades[i] + (i < positiveGrades.length - 1 ? ` to ${positiveGrades[i + 1]}` : "+")
        );
      }
  
      labels.push('<div class="legend-section"><strong>No Data</strong></div>');
      labels.push('<i style="background:#ffcccc"></i> No data available');
  
      div.innerHTML = labels.join("<br>");
      return div;
    };
  
    legend.addTo(map);
  }
  
