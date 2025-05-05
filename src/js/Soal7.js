d3.csv("data.csv").then((data) => {
  data = data.filter(
    (d) => d["Mental Health Condition"] && d["Social Interaction Score"]
  );
  data.forEach((d) => {
    d["Social Interaction Score"] = +d["Social Interaction Score"];
  });

  const conditions = Array.from(
    new Set(data.map((d) => d["Mental Health Condition"]))
  );

  // === Scatter Plot ===
  {
    const svg = d3.select("#scatter"),
      margin = { top: 50, right: 40, bottom: 70, left: 60 },
      width = +svg.attr("width") - margin.left - margin.right,
      height = +svg.attr("height") - margin.top - margin.bottom;

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scalePoint().domain(conditions).range([0, width]).padding(0.5);
    const y = d3.scaleLinear().domain([0, 10]).range([height, 0]);

    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x));
    g.append("g").call(d3.axisLeft(y));

    g.selectAll("circle")
      .data(data)
      .enter()
      .append("circle")
      .attr(
        "cx",
        (d) => x(d["Mental Health Condition"]) + (Math.random() - 0.5) * 20
      )
      .attr("cy", (d) => y(d["Social Interaction Score"]))
      .attr("r", 4)
      .attr("fill", "steelblue");

    svg
      .append("text")
      .attr("x", width / 2 + margin.left)
      .attr("y", margin.top / 2)
      .attr("text-anchor", "middle")
      .attr("font-size", "18px")
      .attr("font-weight", "bold")
      .text(
        "Scatter Plot with Jitter: Social Interaction Score vs Mental Health Condition"
      );
  }

  // === Box Plot ===
  {
    const svg = d3.select("#boxplot"),
      margin = { top: 50, right: 40, bottom: 70, left: 60 },
      width = +svg.attr("width") - margin.left - margin.right,
      height = +svg.attr("height") - margin.top - margin.bottom;

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scalePoint().domain(conditions).range([0, width]).padding(0.5);
    const y = d3.scaleLinear().domain([0, 10]).range([height, 0]);

    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x));
    g.append("g").call(d3.axisLeft(y));

    // Group data
    const grouped = d3.groups(data, (d) => d["Mental Health Condition"]);

    grouped.forEach(([cond, values]) => {
      const scores = values
        .map((d) => d["Social Interaction Score"])
        .sort(d3.ascending);
      const q1 = d3.quantile(scores, 0.25);
      const median = d3.quantile(scores, 0.5);
      const q3 = d3.quantile(scores, 0.75);
      const min = d3.min(scores);
      const max = d3.max(scores);

      const xPos = x(cond);

      // Draw box
      g.append("rect")
        .attr("x", xPos - 15)
        .attr("y", y(q3))
        .attr("height", y(q1) - y(q3))
        .attr("width", 30)
        .attr("class", "box");

      // Median line
      g.append("line")
        .attr("x1", xPos - 15)
        .attr("x2", xPos + 15)
        .attr("y1", y(median))
        .attr("y2", y(median))
        .attr("class", "median");

      // Min/max lines
      g.append("line")
        .attr("x1", xPos)
        .attr("x2", xPos)
        .attr("y1", y(min))
        .attr("y2", y(q1))
        .attr("stroke", "black");
      g.append("line")
        .attr("x1", xPos)
        .attr("x2", xPos)
        .attr("y1", y(q3))
        .attr("y2", y(max))
        .attr("stroke", "black");

      // Whiskers
      g.append("line")
        .attr("x1", xPos - 10)
        .attr("x2", xPos + 10)
        .attr("y1", y(min))
        .attr("y2", y(min))
        .attr("stroke", "black");
      g.append("line")
        .attr("x1", xPos - 10)
        .attr("x2", xPos + 10)
        .attr("y1", y(max))
        .attr("y2", y(max))
        .attr("stroke", "black");
    });

    svg
      .append("text")
      .attr("x", width / 2 + margin.left)
      .attr("y", margin.top / 2)
      .attr("text-anchor", "middle")
      .attr("font-size", "18px")
      .attr("font-weight", "bold")
      .text("Box Plot: Social Interaction Score per Mental Health Condition");
  }
});
