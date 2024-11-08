// Set the dimensions and margins of the graph
var margin = {top: 10, right: 100, bottom: 40, left: 50},
    width = 600 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

// Append the svg object to the body of the page
var svg = d3.select("#chart")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Load the data from the CSV file
d3.csv("datavis4.csv").then(function(data) {

  // Convert numerical values to numbers
  data.forEach(function(d) {
    d.Drug = +d.Drug;
    d.Poisoning = +d.Poisoning;
    d.Hanging = +d.Hanging;
    d.Jumping = +d.Jumping;
    d.Other = +d.Other;
  });

  // Separate the data by continent
  var asiaCountries = data.filter(function(d) { return d.Continent === 'Asia'; });
  var europeCountries = data.filter(function(d) { return d.Continent === 'Europe'; });

  // Randomly select 2 Asia and 3 Europe countries or vice versa
  function getRandomSample(arr, n) {
    return arr.sort(() => 0.5 - Math.random()).slice(0, n);
  }

  var selectedAsia = getRandomSample(asiaCountries, 2);
  var selectedEurope = getRandomSample(europeCountries, 3);

  if (Math.random() < 0.5) {
    selectedAsia = getRandomSample(asiaCountries, 3);
    selectedEurope = getRandomSample(europeCountries, 2);
  }

  var selectedCountries = selectedAsia.concat(selectedEurope);

  // List of subgroups (suicide methods)
  var subgroups = ['Drug', 'Poisoning', 'Hanging', 'Jumping', 'Other'];

  // Initialize current countries
  var currentCountries = selectedCountries.slice();

  // Function to update the chart
  function updateChart() {
    svg.selectAll("*").remove(); // Clear the chart before updating

    // List of groups (countries)
    var groups = currentCountries.map(function(d) { return d.Country; });

    // Add X axis
    var x = d3.scaleBand()
        .domain(groups)
        .range([0, width])
        .padding([0.2]);
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x).tickSizeOuter(0));

    // Add X axis label
    svg.append("text")
        .attr("text-anchor", "middle")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 10)
        .text("Country");

    // Add Y axis
    var y = d3.scaleLinear()
        .domain([0, 100])
        .range([height, 0]);
    svg.append("g")
        .call(d3.axisLeft(y));

    // Add Y axis label
    svg.append("text")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 20)
        .text("Percentage (%)");

    // Color palette
    var color = d3.scaleOrdinal()
        .domain(subgroups)
        .range(['#e41a1c', '#377eb8', '#4daf4a', '#984ea3', '#ff7f00']);

    // Stack the data
    var stackedData = d3.stack()
        .keys(subgroups)(currentCountries);

    // Show the bars
    svg.append("g")
      .selectAll("g")
      // Enter in the stack data
      .data(stackedData)
      .enter().append("g")
        .attr("fill", function(d) { return color(d.key); })
      .selectAll("rect")
      .data(function(d) { return d; })
      .enter().append("rect")
        .attr("x", function(d) { return x(d.data.Country); })
        .attr("y", function(d) { return y(d[1]); })
        .attr("height", function(d) { return y(d[0]) - y(d[1]); })
        .attr("width", x.bandwidth());

    // Add legend
    svg.selectAll("mydots")
      .data(subgroups)
      .enter()
      .append("circle")
      .attr("cx", width + 20)
      .attr("cy", function(d, i) { return 20 + i * 25; })
      .attr("r", 7)
      .style("fill", function(d) { return color(d); });

    svg.selectAll("mylabels")
      .data(subgroups)
      .enter()
      .append("text")
      .attr("x", width + 35)
      .attr("y", function(d, i) { return 20 + i * 25; })
      .text(function(d) { return d; })
      .style("fill", function(d) { return color(d); })
      .attr("text-anchor", "left")
      .style("alignment-baseline", "middle");
  }

  // Initial chart setup
  updateChart();

  // Add button event
  d3.select("#addButton").on("click", function() {
    if (currentCountries.length < data.length) {
      var remainingCountries = data.filter(function(d) {
        return !currentCountries.includes(d);
      });
      var newCountry = getRandomSample(remainingCountries, 1)[0];
      currentCountries.push(newCountry);
      updateChart();
    }
  });

  // Remove button event
  d3.select("#removeButton").on("click", function() {
    if (currentCountries.length > 0) {
      currentCountries.pop(); // Remove the last country
      updateChart();
    }
  });

});
