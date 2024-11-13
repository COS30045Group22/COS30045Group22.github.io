// Set the initial dimensions and margins of the graph
var margin = { top: 10, right: 100, bottom: 40, left: 50 },
    baseWidth = 600 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom,
    maxCountries = 10;

var width = baseWidth;

// Append the svg object to the body of the page
var svg = d3.select("#chart")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Load the data from the CSV file
d3.csv("datavis4.csv").then(function (data) {
  data.forEach(function (d) {
    d.Drug = +d.Drug;
    d.Poisoning = +d.Poisoning;
    d.Hanging = +d.Hanging;
    d.Jumping = +d.Jumping;
    d.Other = +d.Other;
  });

  var asiaCountries = data.filter(function (d) { return d.Continent === 'Asia'; });
  var europeCountries = data.filter(function (d) { return d.Continent === 'Europe'; });

  function getRandomSample(arr, n) {
    return arr.sort(() => 0.5 - Math.random()).slice(0, n);
  }

  function getUpdatedSelection(continent) {
    if (continent === 'Asia') {
        return getRandomSample(asiaCountries, Math.min(5, asiaCountries.length));
    } else if (continent === 'Europe') {
        return getRandomSample(europeCountries, Math.min(5, europeCountries.length));
    } else if (continent === 'Both') {
        const asiaCount = Math.floor(Math.random() * 2) + 2; // Randomly 2 or 3
        const europeCount = 5 - asiaCount;
        const asiaSample = getRandomSample(asiaCountries, Math.min(asiaCount, asiaCountries.length));
        const europeSample = getRandomSample(europeCountries, Math.min(europeCount, europeCountries.length));
        return [...asiaSample, ...europeSample];
    }
    return [];
}

  var currentCountries = getUpdatedSelection('Both');

  function updateChart() {
    // Clear previous elements
    svg.selectAll("*").remove();
  
    // Adjust the width of the SVG based on the number of countries
    width = baseWidth + (currentCountries.length > 5 ? (currentCountries.length - 5) * 40 : 0);
    d3.select("svg").attr("width", width + margin.left + margin.right);
  
    // Set up scales
    var groups = currentCountries.map(function (d) { return d.Country; });
    
    var x = d3.scaleBand()
        .domain(groups)
        .range([0, width])
        .padding([0.2]);
    
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x).tickSizeOuter(0));
  
    // X Axis Label
    svg.append("text")
        .attr("text-anchor", "middle")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 10)
        .text("Country");
    
    var y = d3.scaleLinear()
        .domain([0, 100])
        .range([height, 0]);
    
    svg.append("g")
        .call(d3.axisLeft(y));
  
    // Y Axis Label
    svg.append("text")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 15)
        .text("Percentage (%)");
  
    var color = d3.scaleOrdinal()
        .domain(['Drug', 'Poisoning', 'Hanging', 'Jumping', 'Other'])
        .range(['#660000', '#006600', '#000066', '#660066', '#B89454']);
  
    // Prepare the stacked data
    var stackedData = d3.stack()
        .keys(['Drug', 'Poisoning', 'Hanging', 'Jumping', 'Other'])(currentCountries);
  
    var tooltip = d3.select("#tooltip");
  
    // Bind data to the stacked bar chart groups
    var bars = svg.append("g")
      .selectAll("g")
      .data(stackedData)
      .enter().append("g")
        .attr("fill", function (d) { return color(d.key); })
        .attr("class", function (d) { return "myRect " + d.key; });
  
    // Bind data to the rectangles (bars)
    var rects = bars.selectAll("rect")
        .data(function (d) {
          return d.map((item) => ({ ...item, method: d.key }));
        });
  
    // Enter + update selection with transition
    rects.enter()
      .append("rect")
        .attr("x", (d) => x(d.data.Country))
        .attr("y", y(0)) // Start y position at the baseline
        .attr("height", 0) // Start height at 0
        .attr("width", x.bandwidth())
        .on("mouseover", function (event, d) {
          var percentage = (d[1] - d[0]).toFixed(2);
          tooltip.style("opacity", 1);
          tooltip.html("Method: " + d.method + "<br>Percentage: " + percentage + "%");
          d3.selectAll(".myRect").style("opacity", 0.2);
          d3.selectAll("." + d.method).style("opacity", 1);
        })
        .on("mousemove", function (event) {
          tooltip.style("left", (event.pageX + 10) + "px")
                 .style("top", (event.pageY - 20) + "px");
        })
        .on("mouseleave", function () {
          tooltip.style("opacity", 0);
          d3.selectAll(".myRect").style("opacity", 1);
        })
      .transition()
        .duration(800)
        .ease(d3.easeCubicInOut)
        .attr("y", (d) => y(d[1])) // Final y position
        .attr("height", (d) => y(d[0]) - y(d[1])); // Final height
  
    // Exit selection without transitions
    rects.exit().remove();
  
  
  
    // Adding legend without transition
    svg.selectAll("mydots")
      .data(['Drug', 'Poisoning', 'Hanging', 'Jumping', 'Other'])
      .enter()
      .append("circle")
        .attr("cx", width + 20)
        .attr("cy", (d, i) => 20 + i * 25)
        .attr("r", 7)
        .style("fill", d => color(d));
  
    svg.selectAll("mylabels")
      .data(['Drug', 'Poisoning', 'Hanging', 'Jumping', 'Other'])
      .enter()
      .append("text")
        .attr("x", width + 35)
        .attr("y", (d, i) => 20 + i * 25)
        .text(d => d)
        .style("fill", d => color(d))
        .attr("text-anchor", "left")
        .style("alignment-baseline", "middle");
  }
  
  

  // Initial chart update
  updateChart();

  // Event listener for continent change
  d3.select("#continentSelect").on("change", function () {
    var selectedContinent = d3.select(this).property("value");
    currentCountries = getUpdatedSelection(selectedContinent);
    updateChart();
  });

  // Event listener for adding a country
d3.select("#addButton").on("click", function () {
  if (currentCountries.length < maxCountries && currentCountries.length < data.length) {
    var remainingCountries = data.filter(function (d) {
      return !currentCountries.includes(d) && d.Continent === currentCountries[0].Continent;
    });
    var newCountry = getRandomSample(remainingCountries, 1)[0];
    if (newCountry) currentCountries.push(newCountry);
    updateChart(); // Call to update the chart with transitions
  } else {
    document.getElementById("maxCountryPopup").style.display = "block";
  }
});

// Event listener for removing a country
d3.select("#removeButton").on("click", function () {
  if (currentCountries.length > 0) {
    currentCountries.pop();
    updateChart(); // Call to update the chart with transitions
    document.getElementById("maxCountryPopup").style.display = "none";
  }
});


  // Event listener for updating the countries based on selected continent
  d3.select("#updateButton").on("click", function () {
    var selectedContinent = d3.select("#continentSelect").property("value");
    currentCountries = getUpdatedSelection(selectedContinent);
    updateChart();
    document.getElementById("maxCountryPopup").style.display = "none";
  });
});
