// Enhanced Sunburst Chart with Drill-Down and Legend with Total Indicator
const margin = { top: 50, right: 30, bottom: 50, left: 30 };
const width = 400 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;
const radius = Math.min(width, height) / 2;

const colors = d3.scaleOrdinal(d3.schemeCategory10);
const totalColor = "#8a2be2"; // Purple for "Total"

d3.csv("income.csv").then(data => {
    data.forEach(d => {
        d.DeathRatePer100K = +d.DeathRatePer100K;
        d.Year = +d.Year;
    });

    const years = Array.from(new Set(data.map(d => d.Year))).sort();
    const regions = ["Asia", "Europe"];
    const incomeLevels = Array.from(new Set(data.map(d => d.IncomeLevel)));

    const colorScale = d3.scaleOrdinal()
        .domain(incomeLevels)
        .range(d3.schemeCategory10);

    regions.forEach(region => {
        const regionData = data.filter(d => d.RegionName === region);

        const container = d3.select("#chart")
            .append("div")
            .attr("id", `${region}-chart`)
            .style("display", "inline-block")
            .style("width", "50%")
            .style("text-align", "center");

        container.append("svg")
            .attr("id", `${region}-svg`)
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${width / 2 + margin.left}, ${height / 2 + margin.top})`);

        container.append("h3").text(region);

        // Add legend below the chart
        const legend = container
            .append("div")
            .style("display", "flex")
            .style("flex-wrap", "wrap")
            .style("justify-content", "center")
            .style("margin-top", "10px");

        // Add "Total" legend item
        const totalLegendItem = legend.append("div")
            .style("display", "flex")
            .style("align-items", "center")
            .style("margin-right", "10px")
            .style("margin-bottom", "5px");

        totalLegendItem.append("div")
            .style("width", "15px")
            .style("height", "15px")
            .style("background-color", totalColor)
            .style("margin-right", "5px");

        totalLegendItem.append("span")
            .text("Total")
            .style("font-size", "12px");

        // Add income level legend items
        incomeLevels.forEach(level => {
            const legendItem = legend.append("div")
                .style("display", "flex")
                .style("align-items", "center")
                .style("margin-right", "10px")
                .style("margin-bottom", "5px");

            legendItem.append("div")
                .style("width", "15px")
                .style("height", "15px")
                .style("background-color", colorScale(level))
                .style("margin-right", "5px");

            legendItem.append("span")
                .text(level)
                .style("font-size", "12px");
        });
    });

    function drawSunburst(region, year) {
        const svg = d3.select(`#${region}-svg g`);
        svg.selectAll("*").remove();

        const yearData = data.filter(d => d.Year === year && d.RegionName === region);

        const hierarchy = d3.stratify()
            .id(d => d.IncomeLevel)
            .parentId(d => d.IncomeLevel === "Total" ? null : "Total")
            ([
                { IncomeLevel: "Total", DeathRatePer100K: d3.sum(yearData, d => d.DeathRatePer100K) },
                ...incomeLevels.map(level => ({
                    IncomeLevel: level,
                    DeathRatePer100K: d3.sum(yearData.filter(d => d.IncomeLevel === level), d => d.DeathRatePer100K)
                }))
            ]);

        const root = d3.hierarchy(hierarchy)
            .sum(d => d.data.DeathRatePer100K);

        const partition = d3.partition()
            .size([2 * Math.PI, radius]);

        const arcs = partition(root).descendants();

        const arc = d3.arc()
            .startAngle(d => d.x0)
            .endAngle(d => d.x1)
            .innerRadius(d => d.y0)
            .outerRadius(d => d.y1);

        const transitionDuration = 750;
        let currentFocus = root;

        function zoomToFocus(target) {
            const focusTransition = d3.transition().duration(transitionDuration);

            const xScale = d3.scaleLinear()
                .domain([target.x0, target.x1])
                .range([0, 2 * Math.PI]);

            const yScale = d3.scaleLinear()
                .domain([target.y0, 1])
                .range([0, radius]);

            svg.selectAll("path")
                .transition(focusTransition)
                .attrTween("d", d => () => {
                    return arc({
                        x0: xScale(d.x0),
                        x1: xScale(d.x1),
                        y0: yScale(d.y0),
                        y1: yScale(d.y1)
                    });
                });
        }

        svg.selectAll("path")
            .data(arcs)
            .join("path")
            .attr("d", arc)
            .attr("fill", d => d.depth === 0 ? totalColor : colorScale(d.data.data.IncomeLevel))
            .attr("stroke", "#fff")
            .on("click", function (event, d) {
                if (d.depth > 0) {
                    currentFocus = d;
                    zoomToFocus(d);
                }
            })
            .on("mouseover", function (event, d) {
                tooltip.style("visibility", "visible")
                    .html(`<strong>${d.data.data.IncomeLevel}</strong><br>Rate: ${d.value.toFixed(2)} per 100k`);
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
            regions.forEach(region => drawSunburst(region, year));
        });

    d3.select("#chart")
        .append("div")
        .attr("id", "year-label")
        .style("text-align", "center")
        .style("margin-top", "10px")
        .text(`Year: ${d3.min(years)}`);

    regions.forEach(region => drawSunburst(region, d3.min(years)));
});


