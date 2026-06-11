const drawGeneralChart = (chartData) => {
    const categories = remotenessCategories;
    const colors = remotenessColors;

    svg = d3.select("#populationCrashes")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    x0 = d3.scaleBand().domain(years).range([0, width]).padding(0.2);
    x1 = d3.scaleBand().domain(categories).range([0, x0.bandwidth()]).padding(0.05);
    yScale = d3.scaleLinear().range([height, 0]);

    tooltip = d3.select("#tooltip");

    const maxVal = d3.max(chartData, d => d3.max(categories, cat => d[cat]));
    yScale.domain([0, maxVal * 1.1]).nice();
    
    svg.append("g").attr("class", "grid")
        .call(d3.axisLeft(yScale).ticks(6).tickSize(-width).tickFormat(""))
        .selectAll("line").attr("stroke", "#e0e0e0").attr("stroke-dasharray", "3,3");
    svg.select(".grid .domain").remove();
    
    svg.append("g")
        .call(d3.axisLeft(yScale).ticks(6).tickFormat(d => d.toLocaleString()))
        .select(".domain").remove();
    
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x0).tickSize(0))
        .select(".domain").attr("stroke", "#ccc");
    
    svg.selectAll(".tick text").style("font-size", "12px").attr("fill", "#555");
    
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -65).attr("x", -height / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "12px").attr("fill", "#555")
        .text("Average Count of Cases");
    
    svg.append("text")
        .attr("x", width / 2).attr("y", height + 42)
        .attr("text-anchor", "middle")
        .style("font-size", "12px").attr("fill", "#555")
        .text("Year");
    
    const yearGroups = svg.selectAll(".year-group")
        .data(chartData).enter()
        .append("g")
        .attr("class", "year-group")
        .attr("transform", d => `translate(${x0(d.year)},0)`);
    
    yearGroups.selectAll("rect")
        .data(d => categories.map(cat => ({ cat, value: d[cat], year: d.year })))
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", d => x1(d.cat))
        .attr("width", x1.bandwidth())
        .attr("fill", d => colors[d.cat])
        .attr("rx", 2)
        .attr("y", height).attr("height", 0)
        .transition().duration(600).ease(d3.easeCubicInOut)
        .attr("y", d => yScale(d.value))
        .attr("height", d => height - yScale(d.value));
    
    svg.selectAll(".bar")
        .on("mouseover", (event, d) => {
            tooltip.style("opacity", 1)
                .html(`<strong>${d.cat}</strong><br>Year: ${d.year}<br>Cases: ${d.value.toLocaleString()}`);
        })
        .on("mousemove", event => {
            tooltip.style("left", (event.pageX + 12) + "px").style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", () => tooltip.style("opacity", 0));
    
    remotenessCategories.forEach(cat => {
        const item = d3.select("#legend").append("div").attr("class", "legend-item");
        item.append("div").attr("class", "legend-box").style("background", colors[cat]);
        item.append("span").text(cat);
    });
}

loadGeneralHospitalizationData().then(data => {
    console.log(data);
    drawGeneralChart(data);
}).catch(error => {
    console.error("Error loading the CSV file:", error);
});