// Set initial dimensions of the chart
var margin = { top: 10, right: 100, bottom: 40, left: 50 }, // Define the margins for the SVG container
    baseWidth = 600 - margin.left - margin.right, // Set the base width of the graph minus the margins
    height = 400 - margin.top - margin.bottom, // Set the height of the graph minus the margins
    maxCountries = 10; // Maximum number of countries can be displayed

var width = baseWidth; // Set the initial width to the base width

// Create SVG object
var svg = d3.select("#chart") 
  .append("svg") 
    .attr("width", width + margin.left + margin.right) 
    .attr("height", height + margin.top + margin.bottom) 
  .append("g") 
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")"); 

// Load the data from CSV 
d3.csv("datavis4.csv").then(function (data) { 
  data.forEach(function (d) { // Convert each field (drug, poisoning...) to a number
    d.Drug = +d.Drug; 
    d.Poisoning = +d.Poisoning; 
    d.Hanging = +d.Hanging; 
    d.Jumping = +d.Jumping; 
    d.Other = +d.Other; 
  });

  // Filter the data by continents
  var asiaCountries = data.filter(function (d) { return d.Continent === 'Asia'; }); // For Asian countries
  var europeCountries = data.filter(function (d) { return d.Continent === 'Europe'; }); // For European countries

  // A random sample of countries
  function getRandomSample(arr, n) {
    return arr.sort(() => 0.5 - Math.random()).slice(0, n); // Randomly shuffle and pick 'n' countries
  }

  //Update country selection based on the continent selected
  function getUpdatedSelection(continent) {
    if (continent === 'Asia') {
        return getRandomSample(asiaCountries, Math.min(5, asiaCountries.length)); // Get up to 5 random Asian countries
    } else if (continent === 'Europe') {
        return getRandomSample(europeCountries, Math.min(5, europeCountries.length)); // Get up to 5 random European countries
    } else if (continent === 'Both') {
        const asiaCount = Math.floor(Math.random() * 2) + 2; // Randomly select 2 or 3 Asian countries
        const europeCount = 5 - asiaCount; // Select the remaining countries from Europe to make 5
        const asiaSample = getRandomSample(asiaCountries, Math.min(asiaCount, asiaCountries.length));
        const europeSample = getRandomSample(europeCountries, Math.min(europeCount, europeCountries.length));
        return [...asiaSample, ...europeSample]; // Return a combined list of Asian and European countries
    }
    return [];
}

  // Initialize current countries to display (from both continents)
  var currentCountries = getUpdatedSelection('Both');

  // Update the chart
  function updateChart() {
    // Clear previous elements from the chart to avoid overlapping
    svg.selectAll("*").remove();
  
    // Adjust the width of SVG based on the number of countries to display
    width = baseWidth + (currentCountries.length > 5 ? (currentCountries.length - 5) * 40 : 0); // Increase width if more than 5 countries
    d3.select("svg").attr("width", width + margin.left + margin.right);
  
    // Set up scales for X-axis
    var groups = currentCountries.map(function (d) { return d.Country; }); // Extract country names for X-axis labels
    
    var x = d3.scaleBand() // Create a band scale for X-axis
        .domain(groups) // Set domain to country names
        .range([0, width]) // Set range to available width
        .padding([0.2]); // Add padding between bars
    
    svg.append("g") // Append a group for X-axis
        .attr("transform", "translate(0," + height + ")") // Move X-axis to the bottom of the chart
        .call(d3.axisBottom(x).tickSizeOuter(0)); // Draw X-axis with no outer ticks
  
    // X Axis Label
    svg.append("text")
        .attr("text-anchor", "middle")
        .attr("x", width / 2) // Center the label horizontally
        .attr("y", height + margin.bottom - 10) // Position label below X-axis
        .text("Country");
    
    // Set up scales for Y-axis
    var y = d3.scaleLinear() // Create a linear scale for Y-axis
        .domain([0, 100]) // Set domain from 0 to 100 (percentage)
        .range([height, 0]); // Set range from height to 0 (invert Y-axis)
    
    svg.append("g") // Append a group for Y-axis
        .call(d3.axisLeft(y)); // Draw Y-axis
  
    // Y Axis Label
    svg.append("text")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)") // Rotate label vertically
        .attr("x", -height / 2) // Center the label along Y-axis
        .attr("y", -margin.left + 15) // Position label left of Y-axis
        .text("Percentage (%)");
  
    // Set up color scale for different suicide methods
    var color = d3.scaleOrdinal() // Create an ordinal color scale
        .domain(['Drug', 'Poisoning', 'Hanging', 'Jumping', 'Other']) // Set the domain to different methods
        .range(['#660000', '#006600', '#000066', '#660066', '#B89454']); // Define colors for each method
  
    // Prepare the stacked data for the bar chart
    var stackedData = d3.stack() // Create stacked data using d3.stack
        .keys(['Drug', 'Poisoning', 'Hanging', 'Jumping', 'Other'])(currentCountries); // Stack data for each method
  
    var tooltip = d3.select("#tooltip"); // Select the tooltip element for mouseover events
  
    // Bind data to the stacked bar chart groups
    var bars = svg.append("g")
      .selectAll("g")
      .data(stackedData)
      .enter().append("g")
        .attr("fill", function (d) { return color(d.key); }) // Set fill color based on method
        .attr("class", function (d) { return "myRect " + d.key; }); // Assign a class for each bar group
  
    // Bind data to the individual bar
    var rects = bars.selectAll("rect")
        .data(function (d) {
          return d.map((item) => ({ ...item, method: d.key })); // Add method attribute to each data with bar to store the suicide method (drug, poisoning...) for easy using during interaction such tooltips
        });
  
    // Enter, Update selection with transition
    rects.enter()
      .append("rect")
        .attr("x", (d) => x(d.data.Country)) // Set X position based on country name
        .attr("y", y(0)) // Start Y position at the baseline (initially at zero)
        .attr("height", 0) // Set initial height to zero for animation
        .attr("width", x.bandwidth()) // Set the width of each bar
        .on("mouseover", function (event, d) { // Mouseover event to show tooltip
          var percentage = (d[1] - d[0]).toFixed(2); // Calculate the percentage value for the bar
          tooltip.style("opacity", 1); // Show the tooltip
          tooltip.html("Method: " + d.method + "<br>Percentage: " + percentage + "%"); // Set tooltip content
          d3.selectAll(".myRect").style("opacity", 0.2); // Lower the opacity of all bars
          d3.selectAll("." + d.method).style("opacity", 1); // Highlight bars of the same method
        })
        .on("mousemove", function (event) { // Move tooltip along with the mouse
          tooltip.style("left", (event.pageX + 10) + "px")
                 .style("top", (event.pageY - 20) + "px");
        })
        .on("mouseleave", function () { // Mouseout event to reset opacity
          tooltip.style("opacity", 0); // Hide tooltip
          d3.selectAll(".myRect").style("opacity", 1); // Reset opacity of all bars
        })
      .transition() // Add a transition for smooth height animation
        .duration(800)
        .ease(d3.easeCubicInOut)
        .attr("y", (d) => y(d[1])) // Set final Y position
        .attr("height", (d) => y(d[0]) - y(d[1])); // Set final height based on the stacked values
  
    // Exit selection to remove bars that are no longer needed
    rects.exit().remove();
  
    // Adding legend 
    svg.selectAll("mydots")
      .data(['Drug', 'Poisoning', 'Hanging', 'Jumping', 'Other'])
      .enter()
      .append("circle")
        .attr("cx", width + 20) // Set x-coordinate of legend dots
        .attr("cy", (d, i) => 20 + i * 25) // Set y-coordinate based on index
        .attr("r", 7) // Radius of legend circles
        .style("fill", d => color(d)); // Fill color matches the method
  
    svg.selectAll("mylabels")
      .data(['Drug', 'Poisoning', 'Hanging', 'Jumping', 'Other'])
      .enter()
      .append("text")
        .attr("x", width + 35) // Set x-coordinate of legend labels
        .attr("y", (d, i) => 20 + i * 25) // Set y-coordinate based on index
        .text(d => d) // Set text to method name
        .style("fill", d => color(d)) // Set text color to match method
        .attr("text-anchor", "left") // Align text to the left
        .style("alignment-baseline", "middle"); // Align text vertically in the middle
  }
  
  // Initial chart update
  updateChart();

  // Event listener for continent change
  d3.select("#continentSelect").on("change", function () {
    var selectedContinent = d3.select(this).property("value"); // Get selected continent value
    currentCountries = getUpdatedSelection(selectedContinent); // Update country selection based on continent
    updateChart(); // Update the chart
  });

  // Event listener for adding a country
  d3.select("#addButton").on("click", function () {
    if (currentCountries.length < maxCountries && currentCountries.length < data.length) {
      var remainingCountries = data.filter(function (d) {
        return !currentCountries.includes(d) && d.Continent === currentCountries[0].Continent; // Get countries not already displayed
      });
      var newCountry = getRandomSample(remainingCountries, 1)[0]; // Get one random new country
      if (newCountry) currentCountries.push(newCountry); // Add the new country
      updateChart(); // Update the chart
    } else {
      document.getElementById("maxCountryPopup").style.display = "block"; // Show warning if max limit reached
    }
  });

  // Event listener for removing a country
  d3.select("#removeButton").on("click", function () {
    if (currentCountries.length > 0) {
      currentCountries.pop(); // Remove the last country from the list
      updateChart(); // Update the chart
      document.getElementById("maxCountryPopup").style.display = "none"; // Hide warning if removed country
    }
  });

  // Event listener for updating the countries based on selected continent
  d3.select("#updateButton").on("click", function () {
    var selectedContinent = d3.select("#continentSelect").property("value"); // Get selected continent value
    currentCountries = getUpdatedSelection(selectedContinent); // Update country selection
    updateChart(); // Update the chart
    document.getElementById("maxCountryPopup").style.display = "none"; // Hide warning if updated chart
  });
});
