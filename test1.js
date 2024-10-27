// Define SVG dimensions and margins
const margin = { top: 50, right: 30, bottom: 120, left: 60 },
      width = 800 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom;

const svg = d3.select("#chart")
              .append("svg")
              .attr("width", width + margin.left + margin.right)
              .attr("height", height + margin.top + margin.bottom)
              .append("g")
              .attr("transform", `translate(${margin.left},${margin.top})`);

// Tooltip setup
const tooltip = d3.select("body")
                  .append("div")
                  .style("position", "absolute")
                  .style("visibility", "hidden")
                  .style("background", "#fff")
                  .style("border", "1px solid #ccc")
                  .style("padding", "8px")
                  .style("border-radius", "4px")
                  .style("font-size", "12px")
                  .style("box-shadow", "0px 0px 10px rgba(0, 0, 0, 0.1)");

// Load the CSV data
d3.csv("income.csv").then(data => {
    data.forEach(d => {
        d.DeathRatePer100K = +d.DeathRatePer100K;
        d.Year = +d.Year;
    });

    const years = Array.from(new Set(data.map(d => d.Year))).sort();
    const incomeLevels = Array.from(new Set(data.map(d => d.IncomeLevel)));
    const regions = ["Asia", "Europe"];

    // Scales
    const x0 = d3.scaleBand()
                 .domain(incomeLevels)
                 .range([0, width])
                 .padding(0.2);

    const x1 = d3.scaleBand()
                 .domain(regions)
                 .range([0, x0.bandwidth()])
                 .padding(0.05);

    const y = d3.scaleLinear()
                .domain([0, d3.max(data, d => d.DeathRatePer100K)]).nice()
                .range([height, 0]);

    const color = d3.scaleOrdinal()
                    .domain(regions)
                    .range(["#1f77b4", "#ff7f0e"]);

    // Add Axes
    svg.append("g")
       .attr("transform", `translate(0,${height})`)
       .call(d3.axisBottom(x0).tickSize(0));

    svg.append("g")
       .call(d3.axisLeft(y));

    // Add X-axis label
    svg.append("text")
        .attr("class", "x-axis-label")
        .attr("text-anchor", "end")
        .attr("x", width + margin.left - 390)
        .attr("y", height + margin.bottom - 90)
        .text("Income Levels");

    // Add Y-axis label
    svg.append("text")
        .attr("class", "y-axis-label")
        .attr("text-anchor", "end")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left + 30)
        .attr("x", -margin.top - 55)
        .text("Suicide Rate");


    // Function to update chart by year
    function updateChart(year) {
        const yearData = data.filter(d => d.Year === year);

        const bars = svg.selectAll("g.layer")
            .data(yearData)
            .join("g")
            .attr("class", "layer")
            .attr("transform", d => `translate(${x0(d.IncomeLevel)},0)`);

        bars.selectAll("rect")
            .data(d => regions.map(region => ({
                region: region,
                value: yearData.find(entry => entry.RegionName === region && entry.IncomeLevel === d.IncomeLevel)?.DeathRatePer100K || 0,
                incomeLevel: d.IncomeLevel
            })))
            .join("rect")
            .attr("x", d => x1(d.region))
            .attr("y", d => y(d.value))
            .attr("width", x1.bandwidth())
            .attr("height", d => height - y(d.value))
            .attr("fill", d => color(d.region))
            .on("mouseover", function(event, d) {
                tooltip.style("visibility", "visible")
                       .html(`<strong>Region:</strong> ${d.region}<br>
                              <strong>Income Level:</strong> ${d.incomeLevel}<br>
                              <strong>Suicide Rate:</strong> ${d.value.toFixed(2)} per 100K`);
                d3.select(this).style("opacity", 0.8);
            })
            .on("mousemove", function(event) {
                tooltip.style("top", (event.pageY - 10) + "px")
                       .style("left", (event.pageX + 10) + "px");
            })
            .on("mouseout", function() {
                tooltip.style("visibility", "hidden");
                d3.select(this).style("opacity", 1);
            });
    }

    // Add slider
    const slider = d3.select("#chart")
                     .append("input")
                     .attr("type", "range")
                     .attr("min", d3.min(years))
                     .attr("max", d3.max(years))
                     .attr("step", 1)
                     .style("width", "100%")
                     .on("input", function() {
                         updateChart(+this.value);
                         d3.select("#year-label").text(`Year: ${this.value}`);
                     });

    // Label for the slider
    d3.select("#chart")
      .append("div")
      .attr("id", "year-label")
      .style("text-align", "center")
      .style("margin-top", "10px")
      .text(`Year: ${d3.min(years)}`);

    // Initial chart render
    updateChart(d3.min(years));

    // Add legend for regions
    const legend = svg.append("g")
                      .attr("transform", `translate(${width - 100},${-margin.top / 2})`);

    legend.selectAll("rect")
          .data(regions)
          .enter()
          .append("rect")
          .attr("x", 0)
          .attr("y", (d, i) => i * 20)
          .attr("width", 15)
          .attr("height", 15)
          .attr("fill", color);

    legend.selectAll("text")
          .data(regions)
          .enter()
          .append("text")
          .attr("x", 20)
          .attr("y", (d, i) => i * 20 + 12)
          .text(d => d)
          .style("font-size", "12px")
          .attr("alignment-baseline", "middle");
});

