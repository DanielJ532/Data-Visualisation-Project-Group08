{
// Set the spacing around the chart so axes and labels don't get cut off
const margin = { top: 20, right: 30, bottom: 50, left: 75 };
// Work out how wide and tall the actual drawing area is after removing the spacing
const width  = 820 - margin.left - margin.right;
const height = 440 - margin.top  - margin.bottom;

// The three remoteness categories we are comparing
const categories = ["Major Cities", "Regional", "Remote"];
// Each category gets a colour so lines are easy to tell apart
const colors = { "Major Cities": "#4575b4", "Regional": "#f46d43", "Remote": "#a50026" };
// All the years in our dataset
const years = ["2011","2012","2013","2014","2015","2016","2017","2018","2019","2020","2021"];

// Find the div on the page with id "lineChart" and drop an SVG canvas into it
// Add the margins back to get the full outer size of the SVG
// Append a group element and shift it inward by the margin so everything has breathing room
const svg = d3.select("#lineChart")
    .append("svg")
    .attr("width",  width  + margin.left + margin.right)
    .attr("height", height + margin.top  + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Grab the tooltip div that already exists in the HTML so we can show it on hover
const tooltip = d3.select("#tooltip");
// Track whether we are currently showing Aboriginal or General data
let isAboriginal = false;

// Load both CSV files at the same time and wait until both are ready before doing anything
Promise.all([
    d3.csv("generalPopNormalised.csv"),
    d3.csv("firstNationNormalised.csv")
]).then(function([genData, absData]) {

    // For each remoteness category build an array of year/value pairs from the general population CSV
    const genChartData = categories.map(cat => ({
        cat,
        values: years.map(year => ({
            year: +year, // convert year string to a number
            value: +genData.find(d => d["remoteness"] === cat)[`${year}+Sum(cases_per_100000)`] // find the rate for this category and year
        }))
    }));

    // Same thing but for the Aboriginal CSV which has a different column name
    const absChartData = categories.map(cat => ({
        cat,
        values: years.map(year => ({
            year: +year,
            value: +absData.find(d => d["ABS remoteness area"] === cat)[`${year}+Sum(Hospitalisations normalized per 100000)`]
        }))
    }));

    // Map years 2011 to 2021 to pixel positions across the width of the chart
    const xScale = d3.scaleLinear()
        .domain([2011, 2021])
        .range([0, width]);

    // Map data values to pixel heights, range is set later once we know the max value
    const yScale = d3.scaleLinear().range([height, 0]);

    // Create a placeholder group for the x axis at the bottom of the chart
    const xAxisGroup = svg.append("g")
        .attr("transform", `translate(0,${height})`);

    // Create a placeholder group for the y axis on the left
    const yAxisGroup = svg.append("g");

    // Create a placeholder group for the background gridlines
    const gridGroup = svg.append("g").attr("class", "grid");

    // Add the x axis label centred below the chart
    svg.append("text")
        .attr("x", width / 2).attr("y", height + 42)
        .attr("text-anchor", "middle")
        .style("font-size", "12px").attr("fill", "#555")
        .text("Year");

    // Add the y axis label rotated sideways on the left
    const yLabel = svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -65).attr("x", -height / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "12px").attr("fill", "#555")
        .text("Hospitalisations per 100,000 population");

    // Add a bold title above the chart, this will change when the toggle button is clicked
    const chartTitle = svg.append("text")
        .attr("x", width / 2).attr("y", -5)
        .attr("text-anchor", "middle")
        .style("font-size", "13px").style("font-weight", "bold")
        .attr("fill", "#333")
        .text("General Population — Hospitalisation Rates by Remoteness");

    // Build the legend by looping through each category and adding a coloured dot and label
    categories.forEach(cat => {
        const item = d3.select("#lineLegend").append("div").attr("class", "legend-item");
        item.append("div").attr("class", "legend-box")
            .style("background", colors[cat])
            .style("border-radius", "50%");
        item.append("span").text(cat);
    });

    // Tell D3 how to draw a line — convert each data point's year and value into x and y pixels
    // curveMonotoneX makes the line smooth without overshooting the data points
    const line = d3.line()
        .x(d => xScale(d.year))
        .y(d => yScale(d.value))
        .curve(d3.curveMonotoneX);

    // This function draws or redraws the chart whenever called with new data
    function update(chartData, aboriginal) {
        // Find the biggest value in the data and add 10% headroom so bars don't hit the top
        const maxVal = d3.max(chartData, d => d3.max(d.values, v => v.value));
        yScale.domain([0, maxVal * 1.1]).nice();

        // Redraw the background gridlines using the updated y scale
        gridGroup.call(d3.axisLeft(yScale).ticks(6).tickSize(-width).tickFormat(""))
            .selectAll("line").attr("stroke", "#e0e0e0").attr("stroke-dasharray", "3,3");
        gridGroup.select(".domain").remove();

        // Redraw both axes with the updated scale values
        xAxisGroup.call(d3.axisBottom(xScale).tickFormat(d3.format("d")).tickSize(0));
        xAxisGroup.select(".domain").attr("stroke", "#ccc");
        yAxisGroup.call(d3.axisLeft(yScale).ticks(6).tickFormat(d => d.toFixed(1)));
        yAxisGroup.select(".domain").remove();

        // Swap the chart title depending on which dataset is currently showing
        chartTitle.text(aboriginal
            ? "Aboriginal & Torres Strait Islander — Hospitalisation Rates by Remoteness"
            : "General Population — Hospitalisation Rates by Remoteness");

        // Draw or update the three lines, one per remoteness category
        // merge() combines new and existing lines so they all animate together on toggle
        const lines = svg.selectAll(".line-path").data(chartData);
        lines.enter().append("path")
            .attr("class", "line-path")
            .attr("fill", "none")
            .attr("stroke", d => colors[d.cat])
            .attr("stroke-width", 2.5)
            .merge(lines)
            .transition().duration(600).ease(d3.easeCubicInOut)
            .attr("d", d => line(d.values));

        // Draw a dot at each data point for each category so users can hover for exact values
        categories.forEach(cat => {
            const catData = chartData.find(d => d.cat === cat);

            // Select existing dots for this category or create new ones
            const dots = svg.selectAll(`.dot-${cat.replace(/\s/g, "-")}`)
                .data(catData.values);

            // Add new dots and animate all dots to their correct position
            dots.enter().append("circle")
                .attr("class", `dot-${cat.replace(/\s/g, "-")}`)
                .attr("r", 4) // dot size
                .attr("fill", colors[cat])
                .attr("stroke", "white") // white border around dot so it stands out on the line
                .attr("stroke-width", 1.5)
                .merge(dots)
                .transition().duration(600)
                .attr("cx", d => xScale(d.year))
                .attr("cy", d => yScale(d.value));

            // Show tooltip with category, year and rate when hovering over a dot
            // Move the tooltip to follow the mouse cursor
            // Hide the tooltip when the mouse leaves the dot
            svg.selectAll(`.dot-${cat.replace(/\s/g, "-")}`)
                .on("mouseover", (event, d) => {
                    tooltip.style("opacity", 1)
                        .html(`<strong>${cat}</strong><br>Year: ${d.year}<br>Rate: ${d.value.toFixed(1)} per 100,000`);
                })
                .on("mousemove", event => {
                    tooltip.style("left", (event.pageX + 12) + "px")
                           .style("top",  (event.pageY - 28) + "px");
                })
                .on("mouseout", () => tooltip.style("opacity", 0));
        });
    }

    // Draw the chart for the first time with the general population data
    update(genChartData, false);

    // When the toggle button is clicked flip between Aboriginal and General data
    // Update the button text to reflect whichever dataset will show next
    document.getElementById("lineToggleBtn").addEventListener("click", () => {
        isAboriginal = !isAboriginal;
        update(isAboriginal ? absChartData : genChartData, isAboriginal);
        document.getElementById("lineToggleBtn").textContent = isAboriginal
            ? "Show General Population"
            : "Show Aboriginal Population";
    });
});
}