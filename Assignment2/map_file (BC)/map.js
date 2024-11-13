// Set up SVG dimensions
const width = 1125, height = 500; // Reduced width and height for a smaller layout

// Projection and path setup for 3D globe
const projection = d3.geoOrthographic()
  .scale(250) // Reduced scale for a smaller globe
  .translate([width / 2, height / 2])
  .precision(0.5);

const path = d3.geoPath().projection(projection);

// Set up SVG and tooltip
const svg = d3.select("svg")
  .attr("width", width)
  .attr("height", height);

const tooltip = d3.select(".tooltip");

// Add a black outline circle behind the globe
svg.append("circle")
  .attr("cx", width / 2)
  .attr("cy", height / 2)
  .attr("r", projection.scale())
  .attr("fill", "none")
  .attr("stroke", "black")
  .attr("stroke-width", 2);

// List of Europe and Asia country codes (ISO Alpha-3 codes)
const europeAsiaCountries = new Set([
  "ALB", "AND", "ARM", "AUT", "AZE", "BEL", "BGR", "BIH", "BLR", "CHE", "CYP", "CZE", "DEU", "DNK", "ESP",
  "EST", "FIN", "FRA", "GEO", "GRC", "HRV", "HUN", "ISL", "IRL", "ITA", "KAZ", "KGZ", "LVA", "LIE", "LTU",
  "LUX", "MLT", "MDA", "MCO", "MNE", "NLD", "NOR", "POL", "PRT", "ROU", "RUS", "SMR", "SRB", "SVK", "SVN",
  "SWE", "TJK", "TUR", "TKM", "UKR", "UZB", "GBR", "CHN", "IND", "IDN", "IRN", "IRQ", "ISR", "JPN", "JOR",
  "KWT", "KGZ", "LAO", "LBN", "MDV", "MNG", "MMR", "NPL", "OMN", "PAK", "PHL", "QAT", "KOR", "SAU", "SGP",
  "SYR", "THA", "TLS", "ARE", "VNM", "YEM"
]);

// Define color scale and neutral color
const colorScale = d3.scaleSequential(d3.interpolateReds).domain([0, 100000]);
const neutralColor = "#ccc";

// Load geo data and suicide CSV data
Promise.all([
  d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"),
  d3.csv("number-of-deaths-from-suicide-ghe.csv")
]).then(([geoData, suicideData]) => {
  const yearData = {};
  suicideData.forEach(d => {
    const year = +d.Year;
    if (!yearData[year]) yearData[year] = {};
    yearData[year][d.Code] = +d["Total deaths from self-harm amongboth sexes"];
  });

  function updateMap(selectedYear) {
    d3.select("#year-label").text(`Year: ${selectedYear}`);
    svg.selectAll("path")
      .data(geoData.features)
      .join("path")
      .attr("d", path)
      .attr("fill", d => {
        const suicideCount = yearData[selectedYear][d.id] || 0;
        return europeAsiaCountries.has(d.id) ? colorScale(suicideCount) : neutralColor;
      })
      .attr("stroke", "#333")
      .on("mouseover", function(event, d) {
        const suicideCount = yearData[selectedYear][d.id] || "Data not available";
        if (europeAsiaCountries.has(d.id)) {
          d3.select(this).classed("country-hover", true);
          tooltip.style("opacity", 1)
            .html(`<strong>${d.properties.name}</strong><br>Suicide Deaths: ${suicideCount}`)
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY + 10}px`);
        }
      })
      .on("mouseout", function() {
        d3.select(this).classed("country-hover", false);
        tooltip.style("opacity", 0);
      });
  }

  // Initialize map with the first year (e.g., 2000)
  updateMap(2000);
  d3.select("#year-slider").on("input", function() {
    updateMap(+this.value);
  });

  // Smooth dragging with requestAnimationFrame
  let v0, q0, r0;
  let isDragging = false;

  function render() {
    if (isDragging) {
      requestAnimationFrame(render); // Schedule the next frame for smooth animation
      updateMap(+d3.select("#year-slider").property("value"));
    }
  }

  svg.call(d3.drag()
    .on("start", function(event) {
      v0 = versor.cartesian(projection.invert([event.x, event.y]));
      r0 = projection.rotate();
      q0 = versor(r0);
      isDragging = true;
      requestAnimationFrame(render); // Start rendering loop
    })
    .on("drag", function(event) {
      const v1 = versor.cartesian(projection.invert([event.x, event.y]));
      const q1 = versor.multiply(q0, versor.delta(v0, v1));
      projection.rotate(versor.rotation(q1));
    })
    .on("end", function() {
      isDragging = false; // Stop rendering when drag ends
    }));

  // Adjusted color legend position
  const legendWidth = 300, legendHeight = 10;
  const legendSvg = svg.append("g")
    .attr("transform", `translate(${width - legendWidth - 20}, ${height - 50})`); // Move slightly to the right and down

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
