
    const raw = [
      { year: "2011", "Major Cities": 1325.6, "Regional": 689.7, "Remote": 158.3 },
      { year: "2012", "Major Cities": 1388.7, "Regional": 695.8, "Remote": 162.5 },
      { year: "2013", "Major Cities": 1383.4, "Regional": 710.3, "Remote": 165.8 },
      { year: "2014", "Major Cities": 1445.2, "Regional": 719.7, "Remote": 174.3 },
      { year: "2015", "Major Cities": 1467.7, "Regional": 756.2, "Remote": 188.4 },
      { year: "2016", "Major Cities": 1488.6, "Regional": 754.8, "Remote": 194.9 },
      { year: "2017", "Major Cities": 1518.3, "Regional": 769.0, "Remote": 214.2 },
      { year: "2018", "Major Cities": 1538.4, "Regional": 788.3, "Remote": 209.4 },
      { year: "2019", "Major Cities": 1577.3, "Regional": 810.6, "Remote": 225.4 },
      { year: "2020", "Major Cities": 1570.7, "Regional": 772.9, "Remote": 219.6 },
      { year: "2021", "Major Cities": 1625.9, "Regional": 821.6, "Remote": 223.2 },
    ];

    const categories = ["Major Cities", "Regional", "Remote"];
    const colors = { "Major Cities": "#2196F3", "Regional": "#FF9800", "Remote": "#E53935" };

    const margin = { top: 20, right: 30, bottom: 50, left: 70 };
    const width = 820 - margin.left - margin.right;
    const height = 440 - margin.top - margin.bottom;

    const svg = d3.select("#chart")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const years = raw.map(d => d.year);

    const x0 = d3.scaleBand().domain(years).range([0, width]).padding(0.2);
    const x1 = d3.scaleBand().domain(categories).range([0, x0.bandwidth()]).padding(0.05);
    const y  = d3.scaleLinear().domain([0, 1800]).nice().range([height, 0]);

    // Gridlines
    svg.append("g")
      .attr("class", "grid")
      .call(d3.axisLeft(y).ticks(6).tickSize(-width).tickFormat(""))
      .selectAll("line")
      .attr("stroke", "#e0e0e0")
      .attr("stroke-dasharray", "3,3");
    svg.select(".grid .domain").remove();

    // X axis
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x0).tickSize(0))
      .select(".domain").attr("stroke", "#ccc");

    svg.selectAll(".tick text").style("font-size", "12px").attr("fill", "#555");

    // Y axis
    svg.append("g")
      .call(d3.axisLeft(y).ticks(6).tickFormat(d => d.toLocaleString()))
      .select(".domain").remove();

    // Y axis label
    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -60).attr("x", -height / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "12px").attr("fill", "#555")
      .text("Average Count of Cases");

    // X axis label
    svg.append("text")
      .attr("x", width / 2).attr("y", height + 42)
      .attr("text-anchor", "middle")
      .style("font-size", "12px").attr("fill", "#555")
      .text("Year");

    const tooltip = d3.select("#tooltip");

    // Bars
    const yearGroups = svg.selectAll(".year-group")
      .data(raw).enter()
      .append("g")
      .attr("transform", d => `translate(${x0(d.year)},0)`);

    yearGroups.selectAll("rect")
      .data(d => categories.map(cat => ({ cat, value: d[cat], year: d.year })))
      .enter().append("rect")
      .attr("class", "bar")
      .attr("x", d => x1(d.cat))
      .attr("y", d => y(d.value))
      .attr("width", x1.bandwidth())
      .attr("height", d => height - y(d.value))
      .attr("fill", d => colors[d.cat])
      .attr("rx", 2)
      .on("mouseover", (event, d) => {
        tooltip.style("opacity", 1)
          .html(`<strong>${d.cat}</strong><br>Year: ${d.year}<br>Cases: ${d.value.toLocaleString()}`);
      })
      .on("mousemove", (event) => {
        tooltip.style("left", (event.pageX + 12) + "px").style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", () => tooltip.style("opacity", 0));

    // Legend
    const legend = d3.select("#legend");
    categories.forEach(cat => {
      const item = legend.append("div").attr("class", "legend-item");
      item.append("div").attr("class", "legend-box").style("background", colors[cat]);
      item.append("span").text(cat);
    });
