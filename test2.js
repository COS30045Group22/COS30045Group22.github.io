// Dimensions and margins
const margin = { top: 50, right: 30, bottom: 50, left: 70 };
const width = 900 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

// Append SVG to the chart div
const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Tooltip
const tooltip = d3.select("#tooltip");

// Color scale for generations
const color = d3.scaleOrdinal(d3.schemeCategory10);

// Scales
const xScale = d3.scaleLinear().range([0, width]);
const yScale = d3.scaleLinear().range([height, 0]);

// Function to update chart based on filters
function updateChart(region, generation, data) {
    // Clear previous lines
    svg.selectAll(".line").remove();

    // Filter data
    let filteredData = data;
    if (region !== "all") {
        filteredData = filteredData.filter(d => d.region === region);
    }
    if (generation !== "all") {
        filteredData = filteredData.filter(d => d.generation === generation);
    }

    // Update scales with filtered data
    xScale.domain(d3.extent(filteredData, d => d.year));
    yScale.domain([0, d3.max(filteredData, d => d.suicides_per_100k)]).nice();

 // Draw axes
svg.selectAll(".x-axis").remove();
svg.selectAll(".y-axis").remove();
svg.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(xScale).tickFormat(d3.format("d")));

// X-axis label
svg.append("text")
    .attr("class", "x-axis-label")
    .attr("text-anchor", "end")
    .attr("x", width + margin.top - 450)
    .attr("y", height + margin.bottom - 10)
    .text("Year");

svg.append("g")
    .attr("class", "y-axis")
    .call(d3.axisLeft(yScale));

// Y-axis label
svg.append("text")
    .attr("class", "y-axis-label")
    .attr("text-anchor", "end")
    .attr("transform", "rotate(-90)")
    .attr("y", -margin.left + 40)
    .attr("x", -margin.top - 100)
    .text("Suicide Rate");

    // Group data by region and generation for drawing lines
    const groupedData = d3.group(filteredData, d => d.region, d => d.generation);

// Draw lines
groupedData.forEach((generationData, region) => {
    generationData.forEach((values, generation) => {
        svg.append("path")
        .datum(values)
        .attr("fill", "none")
        .attr("stroke", color(generation))
        .attr("stroke-width", 2)
        .attr("class", "line")
        .attr("d", d3.line()
            .x(d => xScale(d.year))
            .y(d => yScale(d.suicides_per_100k))
        )
        .on("mouseover", function(event, d) {
            tooltip.style("display", "block");
        })
        .on("mousemove", function(event) {
            const [xPos] = d3.pointer(event);
            const year = Math.round(xScale.invert(xPos));
            const closestDataPoint = values.reduce((prev, curr) => 
                Math.abs(curr.year - year) < Math.abs(prev.year - year) ? curr : prev
            );

            tooltip
                .html(`Region: ${region}<br>Generation: ${generation}<br>Year: ${closestDataPoint.year}<br>Rate: ${closestDataPoint.suicides_per_100k}<br>Gender: ${closestDataPoint.sex}`)
                .style("left", `${event.pageX + 5}px`)
                .style("top", `${event.pageY + 5}px`);
        })
        .on("mouseout", function() {
            tooltip.style("display", "none");
        });
    });
});

}

// Load data and set up initial chart
d3.csv("generation.csv").then(data => {
    data.forEach(d => {
        d.year = +d.year;
        d.suicides_per_100k = +d.suicides_per_100k;
    });

    // Set initial chart view with "All" filters
    updateChart("all", "all", data);

    // Add event listeners for dropdowns
    d3.select("#region-select").on("change", function() {
        const selectedRegion = d3.select(this).property("value");
        const selectedGeneration = d3.select("#generation-select").property("value");
        updateChart(selectedRegion, selectedGeneration, data);
    });

    d3.select("#generation-select").on("change", function() {
        const selectedRegion = d3.select("#region-select").property("value");
        const selectedGeneration = d3.select(this).property("value");
        updateChart(selectedRegion, selectedGeneration, data);
    });
});
