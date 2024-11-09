// Updated script for Doughnut Charts
const margin = { top: 50, right: 30, bottom: 50, left: 30 };
const width = 400 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;
const radius = Math.min(width, height) / 2;

const colors = d3.scaleOrdinal(d3.schemeCategory10);

d3.csv("income.csv").then(data => {
    data.forEach(d => {
        d.DeathRatePer100K = +d.DeathRatePer100K;
        d.Year = +d.Year;
    });

    const years = Array.from(new Set(data.map(d => d.Year))).sort();
    const regions = ["Asia", "Europe"];
    const incomeLevels = Array.from(new Set(data.map(d => d.IncomeLevel)));

    const colors = d3.scaleOrdinal()
        .domain(incomeLevels)
        .range(d3.schemeCategory10);

    // Create SVGs for each region
    regions.forEach(region => {
        d3.select("#chart")
            .append("div")
            .attr("id", `${region}-chart`)
            .style("display", "inline-block")
            .style("width", "50%")
            .style("text-align", "center");

        d3.select(`#${region}-chart`)
            .append("svg")
            .attr("id", `${region}-svg`)
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${width / 2 + margin.left}, ${height / 2 + margin.top})`);

        d3.select(`#${region}-chart`)
            .append("h3")
            .text(region);

        // Add legend below the chart
        const legend = d3.select(`#${region}-chart`)
            .append("div")
            .style("display", "flex")
            .style("justify-content", "center")
            .style("margin-top", "10px");

        incomeLevels.forEach(level => {
            const legendItem = legend.append("div")
                .style("display", "flex")
                .style("align-items", "center")
                .style("margin-right", "10px");

            legendItem.append("div")
                .style("width", "15px")
                .style("height", "15px")
                .style("background-color", colors(level))
                .style("margin-right", "5px");

            legendItem.append("span")
                .text(level)
                .style("font-size", "12px");
        });
    });

    // Function to draw Doughnut Chart
    function drawDoughnut(region, year) {
        const svg = d3.select(`#${region}-svg g`);
        const yearData = data.filter(d => d.Year === year && d.RegionName === region);

        const aggregatedData = incomeLevels.map(level => ({
            IncomeLevel: level,
            DeathRatePer100K: d3.sum(
                yearData.filter(d => d.IncomeLevel === level),
                d => d.DeathRatePer100K
            ),
        }));

        const pie = d3.pie()
            .value(d => d.DeathRatePer100K)
            .sort(null);

        const arc = d3.arc()
            .innerRadius(radius * 0.5)
            .outerRadius(radius);

        svg.selectAll("path")
            .data(pie(aggregatedData))
            .join("path")
            .attr("d", arc)
            .attr("fill", d => colors(d.data.IncomeLevel))
            .on("mouseover", function (event, d) {
                tooltip.style("visibility", "visible")
                    .html(`<strong>${d.data.IncomeLevel}</strong><br>Rate: ${d.data.DeathRatePer100K.toFixed(2)} per 100k population`);
                d3.select(this).style("opacity", 0.8);
            })
            .on("mousemove", function (event) {
                tooltip.style("top", `${event.pageY - 10}px`)
                    .style("left", `${event.pageX + 10}px`);
            })
            .on("mouseout", function () {
                tooltip.style("visibility", "hidden");
                d3.select(this).style("opacity", 1);
            });
    }

    // Tooltip for interactivity
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

    // Slider for selecting year
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
            regions.forEach(region => drawDoughnut(region, year));
        });

    d3.select("#chart")
        .append("div")
        .attr("id", "year-label")
        .style("text-align", "center")
        .style("margin-top", "10px")
        .text(`Year: ${d3.min(years)}`);

    // Initial render for the first year
    regions.forEach(region => drawDoughnut(region, d3.min(years)));
});

