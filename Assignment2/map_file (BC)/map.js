// Set up SVG dimensions
const width = 960, height = 600;

// Projection and path setup for map
const projection = d3.geoMercator().scale(150).translate([width / 2, height / 1.5]);
const path = d3.geoPath().projection(projection);

// Set up SVG and tooltip
const svg = d3.select("svg");
const tooltip = d3.select(".tooltip");

// List of Europe and Asia country codes (ISO Alpha-3 codes)
const europeAsiaCountries = new Set([
  "ALB", "AND", "ARM", "AUT", "AZE", "BEL", "BGR", "BIH", "BLR", "CHE", "CYP", "CZE", "DEU", "DNK", "ESP",
  "EST", "FIN", "FRA", "GEO", "GRC", "HRV", "HUN", "ISL", "IRL", "ITA", "KAZ", "KGZ", "LVA", "LIE", "LTU",
  "LUX", "MLT", "MDA", "MCO", "MNE", "NLD", "NOR", "POL", "PRT", "ROU", "RUS", "SMR", "SRB", "SVK", "SVN",
  "SWE", "TJK", "TUR", "TKM", "UKR", "UZB", "GBR", "CHN", "IND", "IDN", "IRN", "IRQ", "ISR", "JPN", "JOR",
  "KWT", "KGZ", "LAO", "LBN", "MDV", "MNG", "MMR", "NPL", "OMN", "PAK", "PHL", "QAT", "KOR", "SAU", "SGP",
  "SYR", "THA", "TLS", "ARE", "VNM", "YEM"
]);

// Load metadata JSON for titles
d3.json("number-of-deaths-from-suicide-ghe.metadata.json").then(metadata => {
  document.getElementById("chart-title").textContent = metadata.chart.title;
  document.getElementById("chart-subtitle").textContent = metadata.chart.subtitle;
  document.getElementById("chart-citation").textContent = metadata.chart.citation;
});

// Define color scale for suicide rates and a neutral color for other countries
const colorScale = d3.scaleSequential(d3.interpolateReds).domain([0, 100000]);
const neutralColor = "#ccc";

// Load geo data and suicide CSV data
Promise.all([
  d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"),
  d3.csv("number-of-deaths-from-suicide-ghe.csv") // Adjust the path to the CSV file as needed
]).then(([geoData, suicideData]) => {
  // Prepare data in a nested format: {year: {countryCode: deathCount}}
  const yearData = {};
  suicideData.forEach(d => {
    const year = +d.Year; // Ensure Year is a number
    if (!yearData[year]) yearData[year] = {};
    yearData[year][d.Code] = +d["Total deaths from self-harm amongboth sexes"];
  });

  // Draw the map for a specific year
  function updateMap(selectedYear) {
    // Update the year label
    d3.select("#year-label").text(`Year: ${selectedYear}`);

    // Bind data and update map colors based on selected year data
    svg.selectAll("path")
      .data(geoData.features)
      .join("path")
      .attr("d", path)
      .attr("fill", d => {
        const countryCode = d.id;
        const suicideCount = yearData[selectedYear][countryCode] || 0;

        // Color Europe and Asia countries based on data, others in neutral color
        if (europeAsiaCountries.has(countryCode)) {
          return colorScale(suicideCount);
        } else {
          return neutralColor;
        }
      })
      .attr("stroke", "#333")
      .on("mouseover", (event, d) => {
        const countryCode = d.id;
        const suicideCount = yearData[selectedYear][countryCode] || "Data not available";

        // Show tooltip only for Europe and Asia countries
        if (europeAsiaCountries.has(countryCode)) {
          tooltip.style("opacity", 1)
            .html(`<strong>${d.properties.name}</strong><br>Suicide Deaths: ${suicideCount}`)
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY + 10}px`);
        }
      })
      .on("mouseout", () => tooltip.style("opacity", 0));
  }

  // Initialize map with the first year (e.g., 2000)
  updateMap(2000);

  // Add an event listener to the slider to update the map based on selected year
  d3.select("#year-slider").on("input", function() {
    const selectedYear = +this.value;
    updateMap(selectedYear);
  });

  // Color legend (as described previously)
  const legendWidth = 300, legendHeight = 10;
  const legendSvg = svg.append("g")
    .attr("transform", `translate(${width - legendWidth - 50}, ${height - 40})`);

  const defs = svg.append("defs");
  const linearGradient = defs.append("linearGradient")
    .attr("id", "linear-gradient");

  linearGradient.selectAll("stop")
    .data(colorScale.ticks(10).map((t, i, n) => ({
      offset: `${100 * i / n.length}%`,
      color: colorScale(t)
    })))
    .enter().append("stop")
    .attr("offset", d => d.offset)
    .attr("stop-color", d => d.color);

  legendSvg.append("rect")
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .style("fill", "url(#linear-gradient)");

  const legendScale = d3.scaleLinear()
    .domain(colorScale.domain())
    .range([0, legendWidth]);

  legendSvg.append("g")
    .attr("transform", `translate(0, ${legendHeight})`)
    .call(d3.axisBottom(legendScale).ticks(5).tickFormat(d3.format(".0s")));
});
