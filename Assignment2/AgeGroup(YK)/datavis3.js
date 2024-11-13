// Load the data from CSV 
d3.csv("oecd.csv").then(data => {

  // Convert numerical values and filter out suicide rate of 0
  data = data.map(d => ({
      ...d,
      "Suicide Rate": +d["Suicide Rate"]  // Convert Suicide Rate from a string to a number
  })).filter(d => d["Suicide Rate"] > 0); // Remove where the suicide rate is 0

  // Set initial dimensions of the chart
  const width = 1200;  
  const heightAll = 1000;  // Height for viewing all continents 
  const heightSingle = 600;  // Height for viewing a single age group or continent
  const heightEurope = 1000;  // Height for viewing all age groups within Europe
  const heightAsia = 800;  // Height for viewing all age groups within Asia

  // Define unique age groups
  const ageGroups = Array.from(new Set(data.map(d => d["Age Group"]))); // Extracts unique age groups

  // Dropdown with age groups
  const ageGroupSelect = d3.select("#age-group-select");
  ageGroups.forEach(ageGroup => {
      ageGroupSelect.append("option").text(ageGroup).attr("value", ageGroup); // Adds each age group as an option
  });

  // Set up color scale for age groups 
  const color = d3.scaleOrdinal()
      .domain(ageGroups) // Define the domain of the scale as age groups
      .range(["#e6194b", "#3cb44b", "#ffe119", "#4363d8", "#f58231", "#911eb4", 
              "#46f0f0", "#f032e6", "#bcf60c", "#fabebe", "#008080", "#e6beff", 
              "#9a6324", "#800000", "#808000"]);

  // Set up radius scale based on suicide rate
  const radius = d3.scaleSqrt()
      .domain([0, d3.max(data, d => d["Suicide Rate"])]) // Scale domain from 0 to max suicide rate
      .range([3, 30]); // Set radius be 3 - 30 pixel

  // Create the SVG container with initial height
  const svg = d3.select("#bubble-chart")
      .append("svg")
      .attr("width", width) 
      .attr("height", heightAll)  // Initial height for "All" view
      .call(d3.zoom().on("zoom", (event) => { // Enables zooming and panning
          svg.attr("transform", event.transform); // Transforms based on zoom level
      }))
      .append("g");

  // Update bubbles based on the selected age group and continent
  function updateBubbles(selectedAgeGroup, selectedContinent) {
      let filteredData = data;

      // Filter by age group if not "all"
      if (selectedAgeGroup !== "all") {
          filteredData = filteredData.filter(d => d["Age Group"] === selectedAgeGroup);
      }

      // Filter by continent if not "all"
      if (selectedContinent !== "all") {
          filteredData = filteredData.filter(d => d["Continent"] === selectedContinent);
      }

      // Determine the appropriate height based on the selection
      let currentHeight;
      if (selectedAgeGroup === "all" && selectedContinent === "Europe") {
          currentHeight = heightEurope;
      } else if (selectedAgeGroup === "all" && selectedContinent === "Asia") {
          currentHeight = heightAsia;
      } else if (selectedAgeGroup === "all" && selectedContinent === "all") {
          currentHeight = heightAll;
      } else {
          currentHeight = heightSingle;
      }

      // Update SVG height to fit the current view
      svg.attr("height", currentHeight);

      // Update bubble data
      const bubbles = svg.selectAll("circle")
          .data(filteredData, d => d.Country); // Bind filtered data to circles

      // Remove old bubbles
      bubbles.exit().remove();

      // Add new bubbles and merge with existing ones
      bubbles.enter()
          .append("circle")
          .merge(bubbles) // Merge new and existing circles
          .attr("r", d => radius(d["Suicide Rate"])) // Set radius based on suicide rate
          .attr("fill", d => color(d["Age Group"])) // Color based on age group
          .attr("stroke", "black") 
          .attr("stroke-width", 0.5) 
          .attr("cx", width / 2) // Initial x position in the center
          .attr("cy", currentHeight / 3) // Initial y position adjusted based on height
          .on("mouseover", function (event, d) { // Mouseover event to highlight circles
              svg.selectAll("circle")
                  .style("opacity", 0.2); // Lower opacity for all circles
              svg.selectAll("circle")
                  .filter(b => b["Age Group"] === d["Age Group"])
                  .style("opacity", 1); // Highlight circles of the same age group

              d3.select("#tooltip") // Show tooltip
                  .style("opacity", 1)
                  .html(`<strong>Country:</strong> ${d.Country}<br>
                         <strong>Continent:</strong> ${d.Continent}<br>
                         <strong>Age Group:</strong> ${d["Age Group"]}<br>
                         <strong>Suicide Rate:</strong> ${d["Suicide Rate"]}`);
          })
          .on("mouseout", function () { // Mouseout event to reset opacity
              svg.selectAll("circle")
                  .style("opacity", 1);

              d3.select("#tooltip")
                  .style("opacity", 0); // Hide tooltip
          })
          .on("click", function (event, d) { // To show alert with data
              alert(`Country: ${d.Country}\nContinent: ${d.Continent}\nAge Group: ${d["Age Group"]}\nSuicide Rate: ${d["Suicide Rate"]}`);
          })
          .call(d3.drag() // Drag functionality
              .on("start", function (event, d) {
                  d3.select(this).raise().attr("stroke", "orange"); // Highlight on drag start
              })
              .on("drag", function (event, d) { // Update position during drag
                  d3.select(this).attr("cx", d.x = event.x).attr("cy", d.y = event.y);
              })
              .on("end", function (event, d) { // Reset stroke on drag end
                  d3.select(this).attr("stroke", "black");
              }));

      // Adjust simulation's vertical force based on selection
      const targetY = currentHeight / 2; // Center bubbles vertically
      simulation
          .force("y", d3.forceY(targetY).strength(0.05)) // Adjust y-force to center bubbles
          .nodes(filteredData) // Restart simulation with filtered data
          .alpha(1)
          .restart();
  }

  // Create a simulation for positioning the bubbles
  const simulation = d3.forceSimulation(data)
      .force("x", d3.forceX(width / 2).strength(0.05)) // x-force to center horizontally
      .force("y", d3.forceY(heightAll / 2).strength(0.05)) // y-force for "All" view initially
      .force("collide", d3.forceCollide(d => radius(d["Suicide Rate"]) + 4)) // Collision force to prevent overlap
      .on("tick", () => { // Run at each simulation step
          svg.selectAll("circle")
              .attr("cx", d => d.x) // Update x position
              .attr("cy", d => d.y); // Update y position
      });

  // Initialize with all data displayed
  updateBubbles("all", "all");

  // Event listener for age group selection
  ageGroupSelect.on("change", function() {
      const selectedAgeGroup = d3.select(this).property("value");
      const selectedContinent = d3.select("#continent-select").property("value");
      updateBubbles(selectedAgeGroup, selectedContinent); // Update bubbles based on selection
  });

  // Event listener for continent selection
  const continentSelect = d3.select("#continent-select");
  continentSelect.on("change", function() {
      const selectedAgeGroup = d3.select("#age-group-select").property("value");
      const selectedContinent = d3.select(this).property("value");
      updateBubbles(selectedAgeGroup, selectedContinent); // Update bubbles based on selection
  });

  // Tooltip 
  const tooltip = d3.select("body")
      .append("div")
      .attr("id", "tooltip")
      .style("position", "absolute")
      .style("background", "#f4f4f4")
      .style("border", "1px solid #333")
      .style("padding", "8px")
      .style("border-radius", "4px")
      .style("opacity", 0); // Tooltip initially hidden

  d3.select("body").on("mousemove", function (event) { // Tooltip follows mouse movement
      tooltip
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 20) + "px");
  });

  // Position the legend in a horizontal grid format under the dropdown
  const legendContainer = d3.select("body")
      .insert("div", "#bubble-chart")
      .attr("id", "legend-container")
      .style("display", "flex")
      .style("flex-wrap", "wrap")
      .style("width", "1000px")
      .style("margin", "10px auto"); // Center the legend container

  const legend = legendContainer.selectAll(".legend-item")
      .data(ageGroups)
      .enter().append("div")
      .attr("class", "legend-item")
      .style("display", "flex")
      .style("align-items", "center")
      .style("width", "20%")
      .style("margin-bottom", "10px")
      .on("mouseover", function(event, d) { // Highlight bubbles on legend hover
          svg.selectAll("circle")
              .style("opacity", 0.2);
          svg.selectAll("circle")
              .filter(b => b["Age Group"] === d)
              .style("opacity", 1);
      })
      .on("mouseout", function() {
          svg.selectAll("circle")
              .style("opacity", 1);
      });

  legend.append("div") // Color box in the legend
      .style("width", "18px")
      .style("height", "18px")
      .style("background-color", d => color(d))
      .style("margin-right", "5px");

  legend.append("span") // Label for each age group
      .text(d => d);
});
