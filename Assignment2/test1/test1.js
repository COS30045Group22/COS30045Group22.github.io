const margin = { top: 50, right: 150, bottom: 100, left: 30 };
const width = 800 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

d3.csv("income.csv").then(data => {
    data.forEach(d => {
        d.DeathRatePer100K = +d.DeathRatePer100K;
        d.Year = +d.Year;
    });

    const years = Array.from(new Set(data.map(d => d.Year))).sort();
    const regions = ["Asia", "Europe"];
    const incomeLevels = Array.from(new Set(data.map(d => d.IncomeLevel)));

    const svg = d3.select("#chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);

    const chartGroup = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Custom color palette matching the background
    const colorScale = d3.scaleOrdinal()
        .domain(incomeLevels)
        .range(["#FF7F7F", "#FFB27F", "#FFD27F", "#A8E6A3"]); // Complementary shades

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

    function drawMarimekko(year) {
        const yearData = data.filter(d => d.Year === year);
        const aggregatedData = regions.map(region => {
            const regionData = yearData.filter(d => d.RegionName === region);
            const totalRate = d3.sum(regionData, d => d.DeathRatePer100K);
            const incomeData = incomeLevels.map(level => {
                return {
                    IncomeLevel: level,
                    DeathRate: d3.sum(
                        regionData.filter(d => d.IncomeLevel === level),
                        d => d.DeathRatePer100K
                    )
                };
            });
            return { region, totalRate, incomeData };
        });

        const totalDeaths = d3.sum(aggregatedData, d => d.totalRate);
        aggregatedData.forEach(region => {
            region.width = (region.totalRate / totalDeaths) * width;
            region.incomeData.forEach(d => {
                d.height = (d.DeathRate / region.totalRate) * height;
            });
        });

        let xOffset = 0;
        chartGroup.selectAll("*").remove();

        aggregatedData.forEach(region => {
            let yOffset = 0;
            const regionGroup = chartGroup.append("g").attr("transform", `translate(${xOffset},0)`);

            region.incomeData.forEach(income => {
                regionGroup.append("rect")
                    .attr("x", 0)
                    .attr("y", yOffset)
                    .attr("width", region.width)
                    .attr("height", 0) // Start with height 0 for animation
                    .attr("fill", colorScale(income.IncomeLevel))
                    .style("stroke", "none") // No border initially
                    .style("stroke-width", "2px")
                    .transition()
                    .duration(1000)
                    .attr("height", income.height)
                    .on("end", function () {
                        d3.select(this)
                            .on("mouseover", function (event) {
                                tooltip.style("visibility", "visible")
                                    .html(`
                                        <strong>${region.region} - ${income.IncomeLevel}</strong><br>
                                        Rate: ${income.DeathRate.toFixed(2)} per 100k population<br>
                                        Proportion: ${(income.DeathRate / totalDeaths * 100).toFixed(1)}%
                                    `);

                                d3.select(this)
                                    .style("stroke", "#000") // Add border
                                    .style("stroke-width", "3px")
                                    .style("opacity", 0.9)
                                    .attr("transform", "scale(1.02)"); // Slight enlargement
                            })
                            .on("mousemove", function (event) {
                                tooltip.style("top", `${event.pageY - 10}px`)
                                    .style("left", `${event.pageX + 10}px`);
                            })
                            .on("mouseout", function () {
                                tooltip.style("visibility", "hidden");

                                d3.select(this)
                                    .style("stroke", "none") // Remove border
                                    .style("stroke-width", "2px")
                                    .style("opacity", 1)
                                    .attr("transform", "scale(1)"); // Restore original size
                            });
                    });

                yOffset += income.height;
            });

            chartGroup.append("text")
                .attr("x", xOffset + region.width / 2)
                .attr("y", height + 20)
                .style("text-anchor", "middle")
                .style("font-size", "14px")
                .style("font-weight", "bold")
                .text(`${region.region} (${((region.totalRate / totalDeaths) * 100).toFixed(1)}%)`);

            xOffset += region.width;
        });
    }

    d3.select("#chart")
        .append("input")
        .attr("type", "range")
        .attr("min", d3.min(years))
        .attr("max", d3.max(years))
        .attr("step", 1)
        .style("width", "100%")
        .on("input", function () {
            const year = +this.value;
            d3.select("#year-label").text(`Year: ${year}`);
            drawMarimekko(year);
        });

    d3.select("#chart")
        .append("div")
        .attr("id", "year-label")
        .style("text-align", "center")
        .style("margin-top", "10px")
        .text(`Year: ${d3.min(years)}`);

    const legendGroup = svg.append("g")
        .attr("transform", `translate(${width + margin.left + 20},${margin.top})`);

    const legendItems = legendGroup.selectAll(".legend-item")
        .data(incomeLevels)
        .join("g")
        .attr("class", "legend-item")
        .attr("transform", (d, i) => `translate(0, ${i * 30})`);

    legendItems.append("rect")
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", d => colorScale(d));

    legendItems.append("text")
        .attr("x", 20)
        .attr("y", 12)
        .text(d => d)
        .style("font-size", "12px")
        .style("alignment-baseline", "middle");

    drawMarimekko(d3.min(years));
});
