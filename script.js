// Initialize the map dimensions
const width = document.querySelector('.map-container').clientWidth;
const height = document.querySelector('.map-container').clientHeight;

// Create the SVG container
const svg = d3.select('#map')
    .append('svg')
    .attr('width', '100%')
    .attr('height', '100%')
    .attr('viewBox', [0, 0, width, height]);

// Create a group for the map
const g = svg.append('g');

// Create tooltip
const tooltip = d3.select('body')
    .append('div')
    .attr('class', 'tooltip')
    .style('opacity', 0);

// Initialize zoom behavior
const zoom = d3.zoom()
    .scaleExtent([1, 8])
    .on('zoom', (event) => {
        g.attr('transform', event.transform);
    });

// Apply zoom to SVG
svg.call(zoom);

// Add zoom controls
d3.select('#zoom-in').on('click', () => {
    svg.transition().duration(300).call(zoom.scaleBy, 1.5);
});

d3.select('#zoom-out').on('click', () => {
    svg.transition().duration(300).call(zoom.scaleBy, 0.75);
});

// Load and render the GeoJSON data
d3.json('data/Vietnam_provinces.geojson')
    .then(data => {
        // Create a projection for Vietnam
        const projection = d3.geoMercator()
            .fitSize([width, height], data);

        // Create a path generator
        const path = d3.geoPath().projection(projection);

        // Draw the provinces
        g.selectAll('path')
            .data(data.features)
            .enter()
            .append('path')
            .attr('class', 'province')
            .attr('d', path)
            .on('mouseover', (event, d) => {
                tooltip.transition()
                    .duration(200)
                    .style('opacity', 0.9);
                tooltip.html(`Welcome to ${d.properties.Name}`)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 28) + 'px');
            })
            .on('mouseout', () => {
                tooltip.transition()
                    .duration(500)
                    .style('opacity', 0);
            });

        // Populate the table
        const tableBody = document.getElementById('provinces-body');
        data.features
            .sort((a, b) => a.properties.Name.localeCompare(b.properties.Name))
            .forEach(feature => {
                const row = document.createElement('tr');
                const cell = document.createElement('td');
                cell.textContent = feature.properties.Name;
                row.appendChild(cell);
                tableBody.appendChild(row);
            });
    })
    .catch(error => {
        console.error('Error loading the GeoJSON file:', error);
    });

// Handle window resize
window.addEventListener('resize', () => {
    const newWidth = document.querySelector('.map-container').clientWidth;
    const newHeight = document.querySelector('.map-container').clientHeight;
    svg.attr('viewBox', [0, 0, newWidth, newHeight]);
});
