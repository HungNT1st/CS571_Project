const width = document.querySelector('.map-container').clientWidth;
const height = document.querySelector('.map-container').clientHeight;

const svg = d3.select('#map')
    .append('svg')
    .attr('width', '100%')
    .attr('height', '100%')
    .attr('viewBox', [0, 0, width, height]);

const g = svg.append('g');

const tooltip = d3.select('body')
    .append('div')
    .attr('class', 'tooltip')
    .style('opacity', 0);

const zoom = d3.zoom()
    .scaleExtent([1, 8])
    .on('zoom', (event) => {
        g.attr('transform', event.transform);
    });

svg.call(zoom);

d3.select('#zoom-in').on('click', () => {
    svg.transition().duration(300).call(zoom.scaleBy, 1.5);
});

d3.select('#zoom-out').on('click', () => {
    svg.transition().duration(300).call(zoom.scaleBy, 0.75);
});

d3.json('data/Vietnam_provinces.geojson')
    .then(data => {
        const projection = d3.geoMercator()
            .fitSize([width, height], data);

        const path = d3.geoPath().projection(projection);

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

window.addEventListener('resize', () => {
    const newWidth = document.querySelector('.map-container').clientWidth;
    const newHeight = document.querySelector('.map-container').clientHeight;
    svg.attr('viewBox', [0, 0, newWidth, newHeight]);
});
