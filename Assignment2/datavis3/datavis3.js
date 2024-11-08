// Set the dimensions and margins of the graph
const margin = { top: 40, right: 30, bottom: 90, left: 60 },
      width = 960 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom;

// Append the svg object to the body of the page
const svg = d3.select("#chart")
  .append("svg")
  .attr("width", width + margin.left + margin.right + 150)  // Extra space for the legend
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

// Define scales for X, X1, Y
const x0 = d3.scaleBand().range([0, width]).padding(0.2);  // Country scale
const x1 = d3.scaleBand().padding(0.1);  // Age group scale
const y = d3.scaleLinear().range([height, 0]);  // Suicide rate scale

// Tooltip for displaying data on hover
const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

// Load the data from the CSV file
d3.csv("datavis3.csv").then(data => {
  // Parse suicide rates as numbers
  data.forEach(d => {
    d["Suicide Rate"] = +d["Suicide Rate"];
    d.Year = +d.Year;
  });

  // Separate countries by continent
  const asiaCountries = Array.from(new Set(data.filter(d => d.Continent === "Asia").map(d => d.Country)));
  const europeCountries = Array.from(new Set(data.filter(d => d.Continent === "Europe").map(d => d.Country)));
  const ageGroups = Array.from(new Set(data.map(d => d["Age Group"])));
  const years = Array.from(new Set(data.map(d => d.Year))).sort();

  // Initialize with a random 2-3 Asia and 2-3 Europe countries
  let displayedCountries = new Set();

  function selectBalancedCountries() {
    displayedCountries = new Set();
    const asiaSample = d3.shuffle(asiaCountries).slice(0, 2 + Math.floor(Math.random() * 2)); // 2 or 3 Asia
    const europeSample = d3.shuffle(europeCountries).slice(0, 5 - asiaSample.length); // 2 or 3 Europe
    displayedCountries = new Set([...asiaSample, ...europeSample]);
    
    // Update the x0 domain and x1 range after selecting countries
    x0.domain([...displayedCountries]);
    x1.range([0, x0.bandwidth()]);
  }

  // Define domains for X and Y scales
  x1.domain(ageGroups);

  // Function to update bar based on the selected year
  function updateBar(selectedYear) {
    const yearData = data.filter(d => d.Year === selectedYear && displayedCountries.has(d.Country));

    // Calculate the maximum suicide rate for the current data
    const maxSuicideRate = d3.max(yearData, d => d["Suicide Rate"]);
    let yIncrement = maxSuicideRate > 100 ? 20 : maxSuicideRate > 50 ? 10 : 5;
    const roundedMax = Math.ceil(maxSuicideRate / yIncrement) * yIncrement;
    y.domain([0, roundedMax]);

    // Clear previous bars and axes
    svg.selectAll(".bar-group").remove();
    svg.selectAll(".x-axis").remove();
    svg.selectAll(".y-axis").remove();

    // Recreate the X axis
    svg.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(x0))
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");

    // X-axis label
    svg.append("text")
      .attr("class", "x-axis-label")
      .attr("text-anchor", "middle")
      .attr("x", width / 2)
      .attr("y", height + margin.bottom - 10)
      .text("Country");

    // Recreate the Y axis with updated scale
    svg.append("g")
      .attr("class", "y-axis")
      .call(d3.axisLeft(y).ticks(roundedMax / yIncrement));

    // Y-axis label
    svg.append("text")
      .attr("class", "y-axis-label")
      .attr("text-anchor", "middle")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", -margin.left + 15)
      .text("Suicide Rate");

    // Group data by country and add bars for each age group
    const countryGroups = svg.selectAll(".bar-group")
      .data([...displayedCountries])
      .enter().append("g")
      .attr("class", "bar-group")
      .attr("transform", d => `translate(${x0(d)}, 0)`);

    countryGroups.selectAll("rect")
      .data(country => yearData.filter(d => d.Country === country))
      .enter().append("rect")
      .attr("x", d => x1(d["Age Group"]))
      .attr("y", d => y(d["Suicide Rate"]))
      .attr("width", x1.bandwidth())
      .attr("height", d => height - y(d["Suicide Rate"]))
      .attr("fill", d => d3.schemeCategory10[ageGroups.indexOf(d["Age Group"]) % 10])
      .on("mouseover", function(event, d) {
        tooltip.transition().duration(200).style("opacity", .9);
        tooltip.html(`Country: ${d.Country}<br>Age Group: ${d["Age Group"]}<br>Suicide Rate: ${d["Suicide Rate"]}`)
               .style("left", (event.pageX + 5) + "px")
               .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", function() {
        tooltip.transition().duration(500).style("opacity", 0);
      });
  }

  // Create the legend for age groups
  function createLegend() {
    const color = d3.scaleOrdinal(d3.schemeCategory10); // Color scale for legend
    const legend = svg.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${width + 30}, 10)`); // Position to the right of the chart

    // Add circles for legend
    legend.selectAll("mydots")
       .data(ageGroups)
       .enter()
       .append("circle")
       .attr("cx", 10)
       .attr("cy", (d, i) => 10 + i * 25)
       .attr("r", 7)
       .style("fill", d => color(ageGroups.indexOf(d)));

    // Add labels for legend
    legend.selectAll("mylabels")
       .data(ageGroups)
       .enter()
       .append("text")
       .attr("x", 25)
       .attr("y", (d, i) => 10 + i * 25)
       .style("fill", d => color(ageGroups.indexOf(d)))
       .text(d => d)
       .attr("text-anchor", "left")
       .style("alignment-baseline", "middle");
  }

  // Update button event to refresh with a balanced selection of 5 countries
  d3.select("#updatebutton").on("click", function() {
    selectBalancedCountries(); // Select new balanced countries

    // Get the currently selected year from the timeline
    const currentYear = +d3.select(".year-marker.selected").text();

    // Update the bar with the current year
    updateBar(currentYear);
  });

  // Create the timeline by adding year markers
  const timeline = d3.select("#timeline");

  years.forEach((year, index) => {
    const marker = timeline.append("div")
      .attr("class", `year-marker ${index % 2 === 0 ? 'up' : 'down'}`)
      .text(year)
      .on("click", () => {
        updateBar(year);
        d3.selectAll(".year-marker").classed("selected", false);
        marker.classed("selected", true);
      });

    // Initially select the first year
    if (year === years[0]) marker.classed("selected", true);
  });

  // Initial display for the starting year (first year in dataset)
  selectBalancedCountries();
  updateBar(years[0]);

  // Create the legend for age groups
  createLegend();
});
