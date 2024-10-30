// Dimensions and margins
const margin = { top: 50, right: 150, bottom: 50, left: 70 }; // Increased right margin for legend
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

// Legend container with inline styling to position it to the right of the chart
const legendContainer = d3.select("#chart")
    .append("div")
    .attr("id", "legend-container")
    .style("position", "absolute")
    .style("left", `${width + margin.left + 20}px`)  // Positioning to the right of the chart
    .style("top", `${margin.top}px`)                 // Aligns with the top of the chart
    .style("width", "120px")                         // Fixed width for legend
    .style("display", "none");                       // Hidden by default

// Add event listener for the new gender dropdown
d3.select("#gender-select").on("change", function() {
    const selectedRegion = d3.select("#region-select").property("value");
    const selectedGeneration = d3.select("#generation-select").property("value");
    const selectedGender = d3.select(this).property("value");
    updateChart(selectedRegion, selectedGeneration, selectedGender, data);
});

// Update the updateChart function to include gender filtering
function updateChart(region, generation, gender, data) {
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
    if (gender !== "all") {
        filteredData = filteredData.filter(d => d.sex.toLowerCase() === gender);
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

    svg.append("text")
        .attr("class", "x-axis-label")
        .attr("text-anchor", "end")
        .attr("x", width + margin.top - 390)
        .attr("y", height + margin.bottom - 10)
        .text("Year");

    svg.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(yScale));

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
                        .html(`Region: ${region}<br>Generation: ${generation}<br>Year: ${closestDataPoint.year}<br>Rate: ${closestDataPoint.suicides_per_100k.toFixed(2)}<br>Gender: ${closestDataPoint.sex}`)
                        .style("left", `${event.pageX + 5}px`)
                        .style("top", `${event.pageY + 5}px`);
                })
                .on("mouseout", function() {
                    tooltip.style("display", "none");
                });
        });
    });

    // Display legend if both filters are set to "all"
    if (region === "all" && generation === "all" && gender === "all") {
        legendContainer.style("display", "block");
        legendContainer.html(""); // Clear previous legend content

        // Create legend entries
        const generations = Array.from(new Set(data.map(d => d.generation)));
        generations.forEach(gen => {
            const legendItem = legendContainer.append("div").attr("class", "legend-item");
            legendItem.append("span")
                .style("background-color", color(gen))
                .style("display", "inline-block")
                .style("width", "12px")
                .style("height", "12px")
                .style("margin-right", "5px");
            legendItem.append("span").text(gen);
        });
    } else {
        // Hide legend if filters are not set to "all"
        legendContainer.style("display", "none");
    }
}

// Load data and set up initial chart
d3.csv("generation.csv").then(data => {
    data.forEach(d => {
        d.year = +d.year;
        d.suicides_per_100k = +d.suicides_per_100k;
    });

    // Set initial chart view with "All" filters
    updateChart("all", "all", "all", data);

    // Add event listeners for dropdowns
    d3.select("#region-select").on("change", function() {
        const selectedRegion = d3.select(this).property("value");
        const selectedGeneration = d3.select("#generation-select").property("value");
        const selectedGender = d3.select("#gender-select").property("value");
        updateChart(selectedRegion, selectedGeneration, selectedGender, data);
    });

    d3.select("#generation-select").on("change", function() {
        const selectedRegion = d3.select("#region-select").property("value");
        const selectedGeneration = d3.select(this).property("value");
        const selectedGender = d3.select("#gender-select").property("value");
        updateChart(selectedRegion, selectedGeneration, selectedGender, data);
    });

    d3.select("#gender-select").on("change", function() {
        const selectedRegion = d3.select("#region-select").property("value");
        const selectedGeneration = d3.select("#generation-select").property("value");
        const selectedGender = d3.select(this).property("value");
        updateChart(selectedRegion, selectedGeneration, selectedGender, data);
    });
});
