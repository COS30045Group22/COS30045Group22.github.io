// Dimensions and margins
const width = 600;
const height = 600;
const innerRadius = 100;
const outerRadius = Math.min(width, height) / 2 - 50;

// Append SVG to the chart div
const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", `translate(${width / 2}, ${height / 2})`);

// Tooltip
const tooltip = d3.select("#tooltip")
    .style("position", "absolute")
    .style("pointer-events", "none")
    .style("background", "rgba(255, 255, 255, 0.9)")
    .style("border", "1px solid #ccc")
    .style("padding", "5px")
    .style("border-radius", "3px")
    .style("box-shadow", "0px 2px 5px rgba(0, 0, 0, 0.2)")
    .style("display", "none");

// Append legend container
const legendContainer = d3.select("#chart")
    .append("div")
    .attr("id", "legend-container")
    .style("position", "absolute")
    .style("left", "600px") // Align legend to the right
    .style("top", "50%") // Vertically center the legend
    .style("transform", "translateY(-50%)") // Adjust for perfect centering
    .style("display", "flex")
    .style("flex-direction", "column") // Stack items vertically
    .style("align-items", "flex-start")
    .style("background-color", "rgba(255, 255, 255, 0.8)")
    .style("border", "1px solid #ccc")
    .style("padding", "10px")
    .style("border-radius", "5px")
    .style("box-shadow", "0px 2px 5px rgba(0, 0, 0, 0.2)");

// Color scale for suicide rates
const colorScale = d3.scaleSequential(d3.interpolateYlGnBu).domain([0, 50]);

// Load data
d3.csv("generation.csv").then(data => {
    // Process data
    data.forEach(d => {
        d.year = +d.year;
        d.suicides_per_100k = +d.suicides_per_100k;
    });

    const allYears = Array.from(new Set(data.map(d => d.year))).sort();
    const allGenerations = Array.from(new Set(data.map(d => d.generation)));

    // Scales
    const angleScale = d3.scaleBand()
        .domain(allYears)
        .range([0, 2 * Math.PI])
        .align(0);

    const radiusScale = d3.scaleBand()
        .domain(allGenerations)
        .range([innerRadius, outerRadius])
        .padding(0.1);

    // Draw year labels
    svg.append("g")
        .selectAll("text")
        .data(allYears)
        .join("text")
        .attr("x", d => Math.cos(angleScale(d) - Math.PI / 2) * (outerRadius + 20))
        .attr("y", d => Math.sin(angleScale(d) - Math.PI / 2) * (outerRadius + 20))
        .attr("text-anchor", "middle")
        .attr("font-size", "10px")
        .text(d => d);

    // Update chart function with filters
    function updateChart(region, gender) {
        const filteredData = data.filter(d => 
            (region === "all" || d.region === region) &&
            (gender === "all" || d.sex.toLowerCase() === gender)
        );

        svg.selectAll("path").remove();

svg.selectAll("path")
    .data(filteredData)
    .join("path")
    .attr("d", d => {
        const yearAngle = angleScale(d.year);
        const nextAngle = yearAngle + angleScale.bandwidth();
        const genRadius = radiusScale(d.generation);
        const nextRadius = genRadius + radiusScale.bandwidth();

        const arc = d3.arc()
            .innerRadius(genRadius)
            .outerRadius(nextRadius)
            .startAngle(yearAngle)
            .endAngle(nextAngle);
        return arc();
    })
    .attr("fill", d => colorScale(d.suicides_per_100k))
    .attr("stroke", "#fff")
    .on("mouseover", function(event, d) {
        tooltip.style("display", "block")
            .html(`
                <strong>Year:</strong> ${d.year}<br>
                <strong>Generation:</strong> ${d.generation}<br>
                <strong>Region:</strong> ${d.region}<br>
                <strong>Gender:</strong> ${d.sex}<br>
                <strong>Suicide Rate:</strong> ${d.suicides_per_100k.toFixed(2)} per 100k population
            `);

        // Enlarge the arc
        d3.select(this)
            .transition()
            .duration(200) // Smooth transition
            .attr("d", d => {
                const yearAngle = angleScale(d.year);
                const nextAngle = yearAngle + angleScale.bandwidth();
                const genRadius = radiusScale(d.generation) - 10; // Inner radius adjustment
                const nextRadius = radiusScale(d.generation) + radiusScale.bandwidth() + 10; // Outer radius adjustment

                const enlargedArc = d3.arc()
                    .innerRadius(genRadius)
                    .outerRadius(nextRadius)
                    .startAngle(yearAngle)
                    .endAngle(nextAngle);
                return enlargedArc();
            });
    })
    .on("mousemove", event => {
        const [mouseX, mouseY] = d3.pointer(event, document.body);
        tooltip
            .style("left", `${mouseX + 10}px`)
            .style("top", `${mouseY - 10}px`);
    })
    .on("mouseout", function() {
        tooltip.style("display", "none");

        // Reset the arc to original size
        d3.select(this)
            .transition()
            .duration(200) // Smooth transition
            .attr("d", d => {
                const yearAngle = angleScale(d.year);
                const nextAngle = yearAngle + angleScale.bandwidth();
                const genRadius = radiusScale(d.generation);
                const nextRadius = genRadius + radiusScale.bandwidth();

                const originalArc = d3.arc()
                    .innerRadius(genRadius)
                    .outerRadius(nextRadius)
                    .startAngle(yearAngle)
                    .endAngle(nextAngle);
                return originalArc();
            });
    });
    }

    // Initial rendering
    updateChart("all", "all");

    legendContainer.selectAll("div")
    .data(allGenerations)
    .join("div")
    .style("display", "flex")
    .style("align-items", "center")
    .style("margin", "5px 0")
    .html(d => {
        const generationNames = {
            "Generation Z": "Gen Z (3rd Outer Layer)",
            "Millenials": "Millennials (2nd Outer Layer)",
            "Generation X": "Gen X (4th Outer Layer)",
            "Boomers": "Baby Boomers (Last Layer)",
            "Silent": "Silent Generation (1st Layer)",
            "G.I. Generation": "Greatest Generation (5th Layer)"
        };
        return `
            <span style="
                width: 20px;
                height: 20px;
                background-color: ${colorScale(radiusScale(d))};
                display: inline-block;
                margin-right: 10px;
            "></span>
            ${generationNames[d] || d}
        `;
    })
    .on("mouseover", (event, gen) => {
        svg.selectAll("path")
            .filter(d => d.generation === gen)
            .transition()
            .duration(200)
            .attr("stroke", "black") // Highlight border
            .attr("stroke-width", 2);
    })
    .on("mouseout", (event, gen) => {
        svg.selectAll("path")
            .filter(d => d.generation === gen)
            .transition()
            .duration(200)
            .attr("stroke", "#fff") // Reset border
            .attr("stroke-width", 1);
    });

    // Event listeners for filters
    d3.select("#region-select").on("change", function() {
        const region = d3.select(this).property("value");
        const gender = d3.select("#gender-select").property("value");
        updateChart(region, gender);
    });

    d3.select("#gender-select").on("change", function() {
        const gender = d3.select(this).property("value");
        const region = d3.select("#region-select").property("value");
        updateChart(region, gender);
    });
});

