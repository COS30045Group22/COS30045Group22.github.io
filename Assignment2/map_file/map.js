function init() {
    const width = 800, height = 500;
    const geoJsonUrl = "custom.geojson"; // Path to your GeoJSON file
    const csvUrl = "Map.csv"; // Path to your CSV file

    // Set up projection and path
    const projection = d3.geoMercator()
        .scale(130)
        .translate([width / 2, height / 1.5]);
    const path = d3.geoPath().projection(projection);

    // Create SVG element
    const svg = d3.select("svg")
        .attr("width", width)
        .attr("height", height);

    // Color scales for Males, Females, and Total
    const colorScaleMales = d3.scaleSequential(d3.interpolateBlues).domain([0, 70]); // Adjust max based on data range
    const colorScaleFemales = d3.scaleSequential(d3.interpolateReds).domain([0, 25]);
    const colorScaleTotal = d3.scaleSequential(d3.interpolatePurples).domain([0, 100]);

    // Load both the GeoJSON and CSV data
    Promise.all([
        d3.json(geoJsonUrl),
        d3.csv(csvUrl)
    ]).then(([geoData, csvData]) => {
        // Map the CSV data to countries in the GeoJSON data
        const dataMap = {};
        csvData.forEach(d => {
            dataMap[d.Country] = {
                Males: +d.Males,
                Females: +d.Females,
                Total: +d.Total
            };
        });

        // Append paths for each country in the GeoJSON
        svg.selectAll("path")
            .data(geoData.features)
            .enter().append("path")
            .attr("d", path)
            .attr("fill", d => {
                const countryData = dataMap[d.properties.name];
                if (countryData) {
                    return colorScaleTotal(countryData.Total); // Default color scale
                } else {
                    return "#ccc"; // Default color for countries without data
                }
            })
            .attr("stroke", "#333")
            .attr("stroke-width", 0.5)
            .on("mouseover", function (event, d) {
                // Highlight on hover
                d3.select(this)
                    .attr("stroke-width", 1)
                    .attr("fill", "#ffcc00");

                // Display tooltip with country data
                const countryData = dataMap[d.properties.name];
                const tooltipText = countryData
                    ? `Country: ${d.properties.name}<br>Males: ${countryData.Males}<br>Females: ${countryData.Females}<br>Total: ${countryData.Total}`
                    : `Country: ${d.properties.name}<br>No data available`;
                d3.select("#tooltip").html(tooltipText)
                    .style("opacity", 1)
                    .style("left", `${event.pageX + 5}px`)
                    .style("top", `${event.pageY - 5}px`);
            })
            .on("mouseout", function () {
                // Reset on hover out
                d3.select(this)
                    .attr("stroke-width", 0.5)
                    .attr("fill", d => {
                        const countryData = dataMap[d.properties.name];
                        return countryData ? colorScaleTotal(countryData.Total) : "#ccc";
                    });

                // Hide tooltip
                d3.select("#tooltip").style("opacity", 0);
            });

        // Function to update map color based on selected data type
        function updateColorScale(metric) {
            let colorScale;
            if (metric === "Males") colorScale = colorScaleMales;
            else if (metric === "Females") colorScale = colorScaleFemales;
            else colorScale = colorScaleTotal;

            svg.selectAll("path")
                .transition()
                .duration(500)
                .attr("fill", d => {
                    const countryData = dataMap[d.properties.name];
                    return countryData ? colorScale(countryData[metric]) : "#ccc";
                });
        }

        // Add buttons to switch between color scales
        const buttons = ["Males", "Females", "Total"];
        d3.select("body").selectAll("button")
            .data(buttons)
            .enter().append("button")
            .text(d => d)
            .on("click", d => updateColorScale(d));
    }).catch(error => {
        console.error("Error loading files:", error);
    });
}

// Initialize the map on window load
window.onload = init;
