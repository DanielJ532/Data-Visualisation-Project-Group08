{
const margin = { top: 20, right: 30, bottom: 50, left: 75 };
const width  = 820 - margin.left - margin.right;
const height = 440 - margin.top  - margin.bottom;

const categories = ["Major Cities", "Regional", "Remote"];
const colors = { "Major Cities": "#4575b4", "Regional": "#f46d43", "Remote": "#a50026" };
const years = ["2011","2012","2013","2014","2015","2016","2017","2018","2019","2020","2021"];

const svg = d3.select("#lineChart")
    .append("svg")
    .attr("width",  width  + margin.left + margin.right)
    .attr("height", height + margin.top  + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

const tooltip = d3.select("#tooltip");
let isAboriginal = false;

Promise.all([
    d3.csv("generalPopNormalised.csv"),
    d3.csv("firstNationNormalised.csv")
]).then(function([genData, absData]) {

    const genChartData = categories.map(cat => ({
        cat,
        values: years.map(year => ({
            year: +year,
            value: +genData.find(d => d["remoteness"] === cat)[`${year}+Sum(cases_per_100000)`]
        }))
    }));

    const absChartData = categories.map(cat => ({
        cat,
        values: years.map(year => ({
            year: +year,
            value: +absData.find(d => d["ABS remoteness area"] === cat)[`${year}+Sum(Hospitalisations normalized per 100000)`]
        }))
    }));

    const xScale = d3.scaleLinear()
        .domain([2011, 2021])
        .range([0, width]);

    const yScale = d3.scaleLinear().range([height, 0]);

    // axes
    const xAxisGroup = svg.append("g")
        .attr("transform", `translate(0,${height})`);

    const yAxisGroup = svg.append("g");

    // gridlines
    const gridGroup = svg.append("g").attr("class", "grid");

    // x axis label
    svg.append("text")
        .attr("x", width / 2).attr("y", height + 42)
        .attr("text-anchor", "middle")
        .style("font-size", "12px").attr("fill", "#555")
        .text("Year");

    // y axis label
    const yLabel = svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -65).attr("x", -height / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "12px").attr("fill", "#555")
        .text("Hospitalisations per 100,000 population");

    // title
    const chartTitle = svg.append("text")
        .attr("x", width / 2).attr("y", -5)
        .attr("text-anchor", "middle")
        .style("font-size", "13px").style("font-weight", "bold")
        .attr("fill", "#333")
        .text("General Population — Hospitalisation Rates by Remoteness");

    // legend
    categories.forEach(cat => {
        const item = d3.select("#lineLegend").append("div").attr("class", "legend-item");
        item.append("div").attr("class", "legend-box")
            .style("background", colors[cat])
            .style("border-radius", "50%");
        item.append("span").text(cat);
    });

    // line generator
    const line = d3.line()
        .x(d => xScale(d.year))
        .y(d => yScale(d.value))
        .curve(d3.curveMonotoneX);

    function update(chartData, aboriginal) {
        const maxVal = d3.max(chartData, d => d3.max(d.values, v => v.value));
        yScale.domain([0, maxVal * 1.1]).nice();

        // update grid
        gridGroup.call(d3.axisLeft(yScale).ticks(6).tickSize(-width).tickFormat(""))
            .selectAll("line").attr("stroke", "#e0e0e0").attr("stroke-dasharray", "3,3");
        gridGroup.select(".domain").remove();

        // update axes
        xAxisGroup.call(d3.axisBottom(xScale).tickFormat(d3.format("d")).tickSize(0));
        xAxisGroup.select(".domain").attr("stroke", "#ccc");
        yAxisGroup.call(d3.axisLeft(yScale).ticks(6).tickFormat(d => d.toFixed(1)));
        yAxisGroup.select(".domain").remove();

        // update title
        chartTitle.text(aboriginal
            ? "Aboriginal & Torres Strait Islander — Hospitalisation Rates by Remoteness"
            : "General Population — Hospitalisation Rates by Remoteness");

        // bind lines
        const lines = svg.selectAll(".line-path").data(chartData);

        lines.enter().append("path")
            .attr("class", "line-path")
            .attr("fill", "none")
            .attr("stroke", d => colors[d.cat])
            .attr("stroke-width", 2.5)
            .merge(lines)
            .transition().duration(600).ease(d3.easeCubicInOut)
            .attr("d", d => line(d.values));

        // bind dots
        categories.forEach(cat => {
            const catData = chartData.find(d => d.cat === cat);

            const dots = svg.selectAll(`.dot-${cat.replace(/\s/g, "-")}`)
                .data(catData.values);

            dots.enter().append("circle")
                .attr("class", `dot-${cat.replace(/\s/g, "-")}`)
                .attr("r", 4)
                .attr("fill", colors[cat])
                .attr("stroke", "white")
                .attr("stroke-width", 1.5)
                .merge(dots)
                .transition().duration(600)
                .attr("cx", d => xScale(d.year))
                .attr("cy", d => yScale(d.value));

            // tooltip on dots
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

    update(genChartData, false);

    document.getElementById("lineToggleBtn").addEventListener("click", () => {
        isAboriginal = !isAboriginal;
        update(isAboriginal ? absChartData : genChartData, isAboriginal);
        document.getElementById("lineToggleBtn").textContent = isAboriginal
            ? "Show General Population"
            : "Show Aboriginal Population";
    });
});
}