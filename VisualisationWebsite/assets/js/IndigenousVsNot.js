let currentData = null;
let currentGroup = "First Nations people";

const processRoadCrashData = (data) => {
    const yearlyTotals = {};
    
    data.forEach(row => {
        const year = row.year;
        const remoteness = row.remoteness;
        
        if (!yearlyTotals[year]) {
            yearlyTotals[year] = {
                year: year,
                "Major Cities": 0,
                "Regional": 0,
                "Remote": 0
            };
        }
        
        if (yearlyTotals[year][remoteness] !== undefined) {
            yearlyTotals[year][remoteness] += row.hospitalisations;
        }
    });
    
    return Object.values(yearlyTotals);
}

const updateIndigenousChart = () => {
    d3.select("#indigenousChart").selectAll("*").remove();
    d3.select("#indigenousLegend").selectAll("*").remove();
    
    let chartData;
    if (currentGroup === "First Nations people") {
        chartData = currentData.firstNations;
    } else {
        chartData = currentData.nonIndigenous;
    }
    
    drawIndigenousChart(chartData, currentGroup);
}

const drawIndigenousChart = (chartData, group) => {
    svgIndigenous = d3.select("#indigenousChart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
    
    x0Indigenous = d3.scaleBand()
        .domain(chartData.map(d => d.year))
        .range([0, width])
        .padding(0.2);
    
    x1Indigenous = d3.scaleBand()
        .domain(remotenessCategories)
        .range([0, x0Indigenous.bandwidth()])
        .padding(0.05);
    
    yScaleIndigenous = d3.scaleLinear().range([height, 0]);
    
    const maxVal = d3.max(chartData, d => d3.max(remotenessCategories, cat => d[cat]));
    yScaleIndigenous.domain([0, maxVal * 1.1]).nice();
    
    svgIndigenous.append("g").attr("class", "grid")
        .call(d3.axisLeft(yScaleIndigenous).ticks(6).tickSize(-width).tickFormat(""))
        .selectAll("line").attr("stroke", "#e0e0e0").attr("stroke-dasharray", "3,3");
    svgIndigenous.select(".grid .domain").remove();
    
    svgIndigenous.append("g")
        .call(d3.axisLeft(yScaleIndigenous).ticks(6).tickFormat(d => d.toLocaleString()))
        .select(".domain").remove();
    
    svgIndigenous.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x0Indigenous).tickSize(0))
        .select(".domain").attr("stroke", "#ccc");
    
    svgIndigenous.selectAll(".tick text").style("font-size", "12px").attr("fill", "#555");
    
    svgIndigenous.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -65).attr("x", -height / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "12px").attr("fill", "#555")
        .text("Number of Hospitalisations");
    
    svgIndigenous.append("text")
        .attr("x", width / 2).attr("y", height + 42)
        .attr("text-anchor", "middle")
        .style("font-size", "12px").attr("fill", "#555")
        .text("Year");
    
    const groupLabel = group === "First Nations people" ? "First Nations" : "Non-Indigenous";
    svgIndigenous.append("text")
        .attr("x", width / 2)
        .attr("y", -10)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .style("font-weight", "bold")
        .attr("fill", "#333")
        .text(`${groupLabel} Hospitalisations by Remoteness`);
    
    const yearGroups = svgIndigenous.selectAll(".year-group")
        .data(chartData).enter()
        .append("g")
        .attr("class", "year-group")
        .attr("transform", d => `translate(${x0Indigenous(d.year)},0)`);
    
    yearGroups.selectAll("rect")
        .data(d => remotenessCategories.map(cat => ({ cat, value: d[cat], year: d.year })))
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", d => x1Indigenous(d.cat))
        .attr("width", x1Indigenous.bandwidth())
        .attr("fill", d => remotenessColors[d.cat])
        .attr("rx", 2)
        .attr("y", height).attr("height", 0)
        .transition().duration(600).ease(d3.easeCubicInOut)
        .attr("y", d => yScaleIndigenous(d.value))
        .attr("height", d => height - yScaleIndigenous(d.value));
    
    remotenessCategories.forEach(cat => {
        const item = d3.select("#indigenousLegend").append("div").attr("class", "legend-item");
        item.append("div").attr("class", "legend-box").style("background", remotenessColors[cat]);
        item.append("span").text(cat);
    });
}

loadRoadCrashData().then(rawData => {
    console.log(rawData);
    
    const firstNationsData = rawData.filter(d => d.indigenousStatus === "First Nations people");
    const nonIndigenousData = rawData.filter(d => d.indigenousStatus === "Non-Indigenous");
    
    currentData = {
        firstNations: processRoadCrashData(firstNationsData),
        nonIndigenous: processRoadCrashData(nonIndigenousData)
    };
    
    console.log("First Nations data:", currentData.firstNations);
    console.log("Non-Indigenous data:", currentData.nonIndigenous);
    
    updateIndigenousChart();
    
    d3.select("#groupToggle").on("change", function() {
        currentGroup = d3.select(this).property("value");
        updateIndigenousChart();
    });
}).catch(error => {
    console.error("Error loading the CSV file:", error);
});