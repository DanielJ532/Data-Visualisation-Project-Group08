let currentData = null;
let currentGroup = "First Nations people";
let indigenousTooltip;
let hospitalisationsTooltip;
let bedDaysTooltip;

const createTooltip = () => {
    indigenousTooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);
    
    hospitalisationsTooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);
    
    bedDaysTooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);
}

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
                "Remote": 0,
                firstNationsHospitalisations: 0,
                nonIndigenousHospitalisations: 0,
                firstNationsBedDays: 0,
                nonIndigenousBedDays: 0
            };
        }
        
        if (yearlyTotals[year][remoteness] !== undefined) {
            yearlyTotals[year][remoteness] += row.hospitalisations;
        }
        
        if (row.indigenousStatus === "First Nations people") {
            yearlyTotals[year].firstNationsHospitalisations += row.hospitalisations;
            yearlyTotals[year].firstNationsBedDays += row.bedDays;
        } else if (row.indigenousStatus === "Non-Indigenous") {
            yearlyTotals[year].nonIndigenousHospitalisations += row.hospitalisations;
            yearlyTotals[year].nonIndigenousBedDays += row.bedDays;
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
    const svgIndigenous = d3.select("#indigenousChart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
    
    const x0Indigenous = d3.scaleBand()
        .domain(chartData.map(d => d.year))
        .range([0, width])
        .padding(0.2);
    
    const x1Indigenous = d3.scaleBand()
        .domain(remotenessCategories)
        .range([0, x0Indigenous.bandwidth()])
        .padding(0.05);
    
    const yScaleIndigenous = d3.scaleLinear().range([height, 0]);
    
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
    
    svgIndigenous.selectAll(".bar")
        .on("mouseover", (event, d) => {
            const groupName = group === "First Nations people" ? "First Nations" : "Non-Indigenous";
            indigenousTooltip.style("opacity", 1)
                .html(`<strong>${d.cat}</strong><br>Year: ${d.year}<br>${groupName}: ${d.value.toLocaleString()} hospitalisations`);
        })
        .on("mousemove", (event) => {
            indigenousTooltip.style("left", (event.pageX + 12) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", () => {
            indigenousTooltip.style("opacity", 0);
        });
    
    remotenessCategories.forEach(cat => {
        const item = d3.select("#indigenousLegend").append("div").attr("class", "legend-item");
        item.append("div").attr("class", "legend-box").style("background", remotenessColors[cat]);
        item.append("span").text(cat);
    });
}

function drawHospitalisationsChart(data) {
    const svg = d3.select("#hospitalisationsChart")
        .append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`);
    
    const innerChart = svg.append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);
    
    const xScale = d3.scaleBand()
        .domain(data.map(d => d.year))
        .range([0, innerWidth])
        .padding(0.2);
    
    const xSubScale = d3.scaleBand()
        .domain(["First Nations", "Non-Indigenous"])
        .range([0, xScale.bandwidth()])
        .padding(0.05);
    
    const maxValue = d3.max(data, d => Math.max(d.firstNationsHospitalisations, d.nonIndigenousHospitalisations));
    const yScale = d3.scaleLinear()
        .domain([0, maxValue * 1.1])
        .range([innerHeight, 0])
        .nice();
    
    const colourScale = d3.scaleOrdinal()
        .domain(["First Nations", "Non-Indigenous"])
        .range(["#E53935", "#2196F3"]);
    
    innerChart.append("g")
        .attr("transform", `translate(0, ${innerHeight})`)
        .call(d3.axisBottom(xScale));
    
    innerChart.append("g")
        .call(d3.axisLeft(yScale).tickFormat(d => d.toLocaleString()));
    
    data.forEach(yearData => {
        const yearGroup = innerChart.append("g")
            .attr("transform", `translate(${xScale(yearData.year)}, 0)`);
        
        yearGroup.append("rect")
            .attr("x", xSubScale("First Nations"))
            .attr("width", xSubScale.bandwidth())
            .attr("y", yScale(yearData.firstNationsHospitalisations))
            .attr("height", innerHeight - yScale(yearData.firstNationsHospitalisations))
            .attr("fill", colourScale("First Nations"))
            .attr("rx", 2);
        
        yearGroup.append("rect")
            .attr("x", xSubScale("Non-Indigenous"))
            .attr("width", xSubScale.bandwidth())
            .attr("y", yScale(yearData.nonIndigenousHospitalisations))
            .attr("height", innerHeight - yScale(yearData.nonIndigenousHospitalisations))
            .attr("fill", colourScale("Non-Indigenous"))
            .attr("rx", 2);
    });
    
    innerChart.append("text")
        .text("Number of Hospitalisations")
        .attr("transform", "rotate(-90)")
        .attr("x", -innerHeight / 2)
        .attr("y", -55)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .attr("fill", "#555");
    
    innerChart.append("text")
        .text("Year")
        .attr("x", innerWidth / 2)
        .attr("y", innerHeight + 40)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .attr("fill", "#555");
    
    const legend = svg.append("g")
        .attr("transform", `translate(${width - 120}, ${margin.top})`);
    
    ["First Nations", "Non-Indigenous"].forEach((item, i) => {
        const legendRow = legend.append("g")
            .attr("transform", `translate(0, ${i * 25})`);
        
        legendRow.append("rect")
            .attr("width", 12)
            .attr("height", 12)
            .attr("fill", colourScale(item))
            .attr("rx", 2);
        
        legendRow.append("text")
            .attr("x", 20)
            .attr("y", 10)
            .attr("text-anchor", "start")
            .style("alignment-baseline", "middle")
            .style("font-size", "12px")
            .text(item);
    });
}

function drawBedDaysChart(data) {
    const svg = d3.select("#bedDaysChart")
        .append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`);
    
    const innerChart = svg.append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);
    
    const xScale = d3.scaleBand()
        .domain(data.map(d => d.year))
        .range([0, innerWidth])
        .padding(0.2);
    
    const xSubScale = d3.scaleBand()
        .domain(["First Nations", "Non-Indigenous"])
        .range([0, xScale.bandwidth()])
        .padding(0.05);
    
    const avgBedDaysData = data.map(d => ({
        year: d.year,
        firstNationsAvgBedDays: d.firstNationsHospitalisations > 0 ? d.firstNationsBedDays / d.firstNationsHospitalisations : 0,
        nonIndigenousAvgBedDays: d.nonIndigenousHospitalisations > 0 ? d.nonIndigenousBedDays / d.nonIndigenousHospitalisations : 0
    }));
    
    const maxValue = d3.max(avgBedDaysData, d => Math.max(d.firstNationsAvgBedDays, d.nonIndigenousAvgBedDays));
    const yScale = d3.scaleLinear()
        .domain([0, maxValue * 1.1])
        .range([innerHeight, 0])
        .nice();
    
    const colourScale = d3.scaleOrdinal()
        .domain(["First Nations", "Non-Indigenous"])
        .range(["#E53935", "#2196F3"]);
    
    innerChart.append("g")
        .attr("transform", `translate(0, ${innerHeight})`)
        .call(d3.axisBottom(xScale));
    
    innerChart.append("g")
        .call(d3.axisLeft(yScale).tickFormat(d => d.toFixed(1)));
    
    avgBedDaysData.forEach(yearData => {
        const yearGroup = innerChart.append("g")
            .attr("transform", `translate(${xScale(yearData.year)}, 0)`);
        
        yearGroup.append("rect")
            .attr("x", xSubScale("First Nations"))
            .attr("width", xSubScale.bandwidth())
            .attr("y", yScale(yearData.firstNationsAvgBedDays))
            .attr("height", innerHeight - yScale(yearData.firstNationsAvgBedDays))
            .attr("fill", colourScale("First Nations"))
            .attr("rx", 2);
        
        yearGroup.append("rect")
            .attr("x", xSubScale("Non-Indigenous"))
            .attr("width", xSubScale.bandwidth())
            .attr("y", yScale(yearData.nonIndigenousAvgBedDays))
            .attr("height", innerHeight - yScale(yearData.nonIndigenousAvgBedDays))
            .attr("fill", colourScale("Non-Indigenous"))
            .attr("rx", 2);
    });
    
    innerChart.append("text")
        .text("Average Bed Days per Hospitalisation")
        .attr("transform", "rotate(-90)")
        .attr("x", -innerHeight / 2)
        .attr("y", -55)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .attr("fill", "#555");
    
    innerChart.append("text")
        .text("Year")
        .attr("x", innerWidth / 2)
        .attr("y", innerHeight + 40)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .attr("fill", "#555");
    
    const legend = svg.append("g")
        .attr("transform", `translate(${width - 120}, ${margin.top})`);
    
    ["First Nations", "Non-Indigenous"].forEach((item, i) => {
        const legendRow = legend.append("g")
            .attr("transform", `translate(0, ${i * 25})`);
        
        legendRow.append("rect")
            .attr("width", 12)
            .attr("height", 12)
            .attr("fill", colourScale(item))
            .attr("rx", 2);
        
        legendRow.append("text")
            .attr("x", 20)
            .attr("y", 10)
            .attr("text-anchor", "start")
            .style("alignment-baseline", "middle")
            .style("font-size", "12px")
            .text(item);
    });
}

createTooltip();

loadRoadCrashData().then(rawData => {
    console.log("Raw data sample:", rawData[0]);
    
    const firstNationsData = rawData.filter(d => d.indigenousStatus === "First Nations people");
    const nonIndigenousData = rawData.filter(d => d.indigenousStatus === "Non-Indigenous");
    
    currentData = {
        firstNations: processRoadCrashData(firstNationsData),
        nonIndigenous: processRoadCrashData(nonIndigenousData)
    };
    
    console.log("First Nations data:", currentData.firstNations);
    console.log("Non-Indigenous data:", currentData.nonIndigenous);
    
    const comparisonData = years.map(year => {
        const firstNationsYear = currentData.firstNations.find(d => d.year === year);
        const nonIndigenousYear = currentData.nonIndigenous.find(d => d.year === year);
        
        return {
            year: year,
            firstNationsHospitalisations: firstNationsYear ? firstNationsYear.firstNationsHospitalisations : 0,
            nonIndigenousHospitalisations: nonIndigenousYear ? nonIndigenousYear.nonIndigenousHospitalisations : 0,
            firstNationsBedDays: firstNationsYear ? firstNationsYear.firstNationsBedDays : 0,
            nonIndigenousBedDays: nonIndigenousYear ? nonIndigenousYear.nonIndigenousBedDays : 0
        };
    });
    
    console.log("Comparison data for charts:", comparisonData);
    
    drawHospitalisationsChart(comparisonData);
    drawBedDaysChart(comparisonData);
    updateIndigenousChart();
    
    d3.select("#groupToggle").on("change", function() {
        currentGroup = d3.select(this).property("value");
        updateIndigenousChart();
    });
}).catch(error => {
    console.error("Error loading the CSV file:", error);
});