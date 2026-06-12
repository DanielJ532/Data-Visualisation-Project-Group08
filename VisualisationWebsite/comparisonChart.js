{
const margin = { top: 20, right: 30, bottom: 50, left: 75 };
const width  = 820 - margin.left - margin.right;
const height = 440 - margin.top  - margin.bottom;

//establish the const variables for the chart dimensions
// define the margin padding then subtract from the width and height
// so it can appear in the middle of the svg

const categories = [
    "Major Cities (General)", "Major Cities (Aboriginal)",
    "Regional (General)", "Regional (Aboriginal)",
    "Remote (General)", "Remote (Aboriginal)"
];



const colors = {
    "Major Cities (General)":   "#90CAF9",
    "Major Cities (Aboriginal)":"#E57373",
    "Regional (General)":       "#1976D2",
    "Regional (Aboriginal)":    "#E53935",
    "Remote (General)":         "#0D47A1",
    "Remote (Aboriginal)":      "#B71C1C"
};

const years = ["2011","2012","2013","2014","2015","2016","2017","2018","2019","2020","2021"];

//define the six bar categories in order then map each colour 
//using the category string as the key map each colour

const svg = d3.select("#comparisonChart")
    .append("svg")
    .attr("width",  width  + margin.left + margin.right)
    .attr("height", height + margin.top  + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

//select the div with id comparison chart that div will now bw mounted with the svg
// Add back the margins to get the full outer SVG dimensions
const tooltip = d3.select("#tooltip");


//load both files wiht a promise which is just a async coding solution when data takes a
//while to load its used to run the next line when something is returned either success or 
//failure also used for network requests 
Promise.all([
    d3.csv("generalPopNormalised.csv"),
    d3.csv("firstNationNormalised.csv")
]).then(function([genData, aboriginalData]) {

    //loop through each year and build one data object per year
    //each object will contain rates for all six category combinations
    const chartData = years.map(year => {
        const obj = { year };
        //create a blank object to hold onto the years data
        // find() finds the first matching row
        const genRemoteness = {
            "Major Cities": genData.find(d => d["remoteness"] === "Major Cities"),
            "Regional":     genData.find(d => d["remoteness"] === "Regional"),
            "Remote":       genData.find(d => d["remoteness"] === "Remote")
        };
        // same search but for the aboriginal csv with a different column name
        const absRemoteness = {
            "Major Cities": aboriginalData.find(d => d["ABS remoteness area"] === "Major Cities"),
            "Regional":     aboriginalData.find(d => d["ABS remoteness area"] === "Regional"),
            "Remote":       aboriginalData.find(d => d["ABS remoteness area"] === "Remote")
        };
            // for each category get the rate valye for this year for the mahing row
            // the + converts the csv string into a number
        obj["Major Cities (General)"]    = genRemoteness["Major Cities"]  ? +genRemoteness["Major Cities"][`${year}+Sum(cases_per_100000)`] : 0;
        obj["Major Cities (Aboriginal)"] = absRemoteness["Major Cities"]  ? +absRemoteness["Major Cities"][`${year}+Sum(Hospitalisations normalized per 100000)`] : 0;
        obj["Regional (General)"]        = genRemoteness["Regional"]      ? +genRemoteness["Regional"][`${year}+Sum(cases_per_100000)`] : 0;
        obj["Regional (Aboriginal)"]     = absRemoteness["Regional"]      ? +absRemoteness["Regional"][`${year}+Sum(Hospitalisations normalized per 100000)`] : 0;
        obj["Remote (General)"]          = genRemoteness["Remote"]        ? +genRemoteness["Remote"][`${year}+Sum(cases_per_100000)`] : 0;
        obj["Remote (Aboriginal)"]       = absRemoteness["Remote"]        ? +absRemoteness["Remote"][`${year}+Sum(Hospitalisations normalized per 100000)`] : 0;

        return obj;
    });
// x0 maps each year to an equal width band across the chart
//padding(0.2) adds a 20% spacing 
// x1 maps each of the 6 categories within a single year band
// range uses x0.bandwidth() so bars fit inside their year group
// yScale maps data values to pixel heights on the vertical axis
// domain finds the maximum value across all years and categories, adds 10% headroom
    const x0 = d3.scaleBand().domain(years).range([0, width]).padding(0.2);
    const x1 = d3.scaleBand().domain(categories).range([0, x0.bandwidth()]).padding(0.05);
    const yScale = d3.scaleLinear()
        .domain([0, d3.max(chartData, d => d3.max(categories, cat => d[cat])) * 1.1])
        .range([height, 0])
        .nice();

    // gridlines adds the lines across the chart 
    svg.append("g").attr("class", "grid")
        .call(d3.axisLeft(yScale).ticks(6).tickSize(-width).tickFormat(""))
        .selectAll("line").attr("stroke", "#e0e0e0").attr("stroke-dasharray", "3,3");
    svg.select(".grid .domain").remove();

    // append y axis using the yscale format 
    svg.append("g")
        .call(d3.axisLeft(yScale).ticks(6).tickFormat(d => d.toFixed(1)))
        .select(".domain").remove();

    // append the x axis at the bottom of the chart area
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x0).tickSize(0))
        .select(".domain").attr("stroke", "#ccc");

    // append rotated y axis label on the left side of axis
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -65).attr("x", -height / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "12px").attr("fill", "#555")
        .text("Hospitalisations/cases per 100,000 population");

    // append the label
    svg.append("text")
        .attr("x", width / 2).attr("y", height + 42)
        .attr("text-anchor", "middle")
        .style("font-size", "12px").attr("fill", "#555")
        .text("Year");

    // bars
    const yearGroups = svg.selectAll(".year-group")
        .data(chartData).enter()
        .append("g")
        .attr("class", "year-group")
        .attr("transform", d => `translate(${x0(d.year)},0)`);

    yearGroups.selectAll("rect")
        .data(d => categories.map(cat => ({ cat, value: d[cat], year: d.year })))
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x",      d => x1(d.cat))
        .attr("width",  x1.bandwidth())
        .attr("fill",   d => colors[d.cat])
        .attr("rx", 2)
        .attr("y", height).attr("height", 0)
        .transition().duration(600).ease(d3.easeCubicInOut)
        .attr("y",      d => yScale(d.value))
        .attr("height", d => height - yScale(d.value));

    // tooltips
    svg.selectAll(".bar")
        .on("mouseover", (event, d) => {
            tooltip.style("opacity", 1)
                .html(`<strong>${d.cat}</strong><br>Year: ${d.year}<br>Rate: ${d.value.toFixed(1)} per 100,000`);
        })
        .on("mousemove", event => {
            tooltip.style("left", (event.pageX + 12) + "px")
                   .style("top",  (event.pageY - 28) + "px");
        })
        .on("mouseout", () => tooltip.style("opacity", 0));

    // legend
    categories.forEach(cat => {
        const item = d3.select("#comparisonLegend").append("div").attr("class", "legend-item");
        item.append("div").attr("class", "legend-box").style("background", colors[cat]);
        item.append("span").text(cat);
    });
});
}