const categories = ["Major Cities", "Regional", "Remote"];
        const colors = { "Major Cities": "#2196F3", "Regional": "#FF9800", "Remote": "#E53935" };
        const years = ["2011","2012","2013","2014","2015","2016","2017","2018","2019","2020","2021"];

        const margin = { top: 20, right: 30, bottom: 50, left: 75 };
        const width  = 820 - margin.left - margin.right;
        const height = 440 - margin.top  - margin.bottom;

        const svg = d3.select("#populationCrashes")
            .append("svg")
            .attr("width",  width  + margin.left + margin.right)
            .attr("height", height + margin.top  + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const x0 = d3.scaleBand().domain(years).range([0, width]).padding(0.2);
        const x1 = d3.scaleBand().domain(categories).range([0, x0.bandwidth()]).padding(0.05);
        const yScale = d3.scaleLinear().range([height, 0]);

        const tooltip = d3.select("#tooltip");

        d3.csv("generalHospitalization.csv").then(function(data) {

            data = data.filter(d => d["ABS remoteness area"] !== "Missing");

            const chartData = years.map(year => {
                const obj = { year };
                categories.forEach(cat => {
                    const row = data.find(d => d["ABS remoteness area"] === cat);
                    obj[cat] = row ? +row[`${year}+Mean(Count of cases)`] : 0;
                });
                return obj;
            });

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
                .attr("x",      d => x1(d.cat))
                .attr("width",  x1.bandwidth())
                .attr("fill",   d => colors[d.cat])
                .attr("rx", 2)
                .attr("y", height).attr("height", 0)
                .transition().duration(600).ease(d3.easeCubicInOut)
                .attr("y",      d => yScale(d.value))
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

            
            categories.forEach(cat => {
                const item = d3.select("#legend").append("div").attr("class", "legend-item");
                item.append("div").attr("class", "legend-box").style("background", colors[cat]);
                item.append("span").text(cat);
            });
        });