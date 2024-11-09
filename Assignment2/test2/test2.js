// Dimensions and margins
const margin = { top: 50, right: 150, bottom: 50, left: 70 };
const width = 900 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

// Append SVG to the chart div
const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Enhanced Tooltip
const tooltip = d3.select("#tooltip")
    .style("position", "absolute")
    .style("background-color", "#fff")
    .style("border", "1px solid #ccc")
    .style("border-radius", "8px")
    .style("padding", "10px")
    .style("box-shadow", "0 4px 8px rgba(0, 0, 0, 0.1)")
    .style("pointer-events", "none")
    .style("font-size", "12px")
    .style("color", "#333");

// Color scale for generations
const color = d3.scaleOrdinal(d3.schemeCategory10);

// Scales
const xScale = d3.scaleLinear().range([0, width]);
const yScale = d3.scaleLinear().range([height, 0]);

// Stack generator
const stack = d3.stack()
    .keys(["Generation Z", "Millennials", "Generation X", "Boomers", "Silent", "G.I. Generation"])
    .order(d3.stackOrderNone)
    .offset(d3.stackOffsetNone);

// Area generator
const area = d3.area()
    .x(d => xScale(d.data.year))
    .y0(d => yScale(d[0]))
    .y1(d => yScale(d[1]))
    .curve(d3.curveBasis);

    function updateChart(region, gender, data) {
        // Filter data based on region and gender
        let filteredData = data;
        if (region !== "all") {
            filteredData = filteredData.filter(d => d.region === region);
        }
        if (gender !== "all") {
            filteredData = filteredData.filter(d => d.sex.toLowerCase() === gender);
        }
    
        // Group data by year and sum suicide rates for each generation
        const groupedData = Array.from(d3.group(filteredData, d => d.year), ([year, values]) => {
            const generations = d3.rollup(
                values,
                v => d3.sum(v, d => d.suicides_per_100k),
                d => d.generation
            );
    
            return {
                year: +year,
                "Generation Z": generations.get("Generation Z") || 0,
                Millennials: generations.get("Millennials") || 0,
                "Generation X": generations.get("Generation X") || 0,
                Boomers: generations.get("Boomers") || 0,
                Silent: generations.get("Silent") || 0,
                "G.I. Generation": generations.get("G.I. Generation") || 0,
                gender: values[0]?.sex || "All Genders",
            };
        });
    
        // Update scales
        xScale.domain(d3.extent(groupedData, d => d.year));
        yScale.domain([0, d3.max(groupedData, d => d3.sum(Object.values(d).slice(1)))]).nice();
    
        // Generate stacked data
        const stackedData = stack(groupedData);
    
        // Clear previous chart elements
        svg.selectAll(".area").remove();
        svg.selectAll(".x-axis").remove();
        svg.selectAll(".y-axis").remove();
        svg.selectAll(".legend").remove();
    
        // Draw area chart
        svg.selectAll(".area")
            .data(stackedData)
            .enter()
            .append("path")
            .attr("class", "area")
            .attr("d", area)
            .style("fill", d => color(d.key))
            .style("opacity", 0.7)
            .on("mouseover", function () {
                tooltip.style("display", "block");
            })
            .on("mousemove", function (event, d) {
                const [x, y] = d3.pointer(event);
                const year = Math.round(xScale.invert(x));
                const dataPoint = groupedData.find(dp => dp.year === year);
    
                if (dataPoint) {
                    tooltip.html(`
                        <strong>Generation:</strong> ${d.key}<br>
                        <strong>Year:</strong> ${year}<br>
                        <strong>Suicide Rate:</strong> ${dataPoint[d.key].toFixed(2)} per 100k<br>
                        <strong>Gender:</strong> ${dataPoint.gender}
                    `)
                        .style("left", `${event.pageX + 15}px`)
                        .style("top", `${event.pageY - 15}px`)
                        .style("display", "block");
                }
            })
            .on("mouseout", function () {
                tooltip.style("display", "none");
            });
    
        // Draw axes
        svg.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(xScale).tickFormat(d3.format("d")));
    
        svg.append("g")
            .attr("class", "y-axis")
            .call(d3.axisLeft(yScale));
    
        // Add legend
        const legend = svg.selectAll(".legend")
            .data(stack.keys())
            .enter()
            .append("g")
            .attr("class", "legend")
            .attr("transform", (d, i) => `translate(${width + 10}, ${i * 20})`);
    
        legend.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", 12)
            .attr("height", 12)
            .style("fill", d => color(d));
    
        legend.append("text")
            .attr("x", 20)
            .attr("y", 10)
            .style("font-size", "12px")
            .text(d => d);
    }    

// Load data and initialize chart
d3.csv("generation.csv").then(data => {
    data.forEach(d => {
        d.year = +d.year;
        d.suicides_per_100k = +d.suicides_per_100k;
    });

    // Initial render with "All" filters
    updateChart("all", "all", data);

    // Add event listeners for dropdowns
    d3.select("#region-select").on("change", function() {
        const selectedRegion = d3.select(this).property("value");
        const selectedGender = d3.select("#gender-select").property("value");
        updateChart(selectedRegion, selectedGender, data);
    });

    d3.select("#gender-select").on("change", function() {
        const selectedRegion = d3.select("#region-select").property("value");
        const selectedGender = d3.select(this).property("value");
        updateChart(selectedRegion, selectedGender, data);
    });
});

