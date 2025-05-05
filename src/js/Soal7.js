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
  
  // Create tooltip div that will be shared between visualizations
  const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0)
    .style("position", "absolute")
    .style("background-color", "white")
    .style("border", "1px solid #ddd")
    .style("border-radius", "5px")
    .style("padding", "10px")
    .style("box-shadow", "2px 2px 6px rgba(0,0,0,0.3)")
    .style("pointer-events", "none")
    .style("font-size", "14px")
    .style("z-index", "10");

  // Define a color scale for mental health conditions
  const colorScale = d3.scaleOrdinal()
    .domain(conditions)
    .range(d3.schemeCategory10);

  // === Enhanced Scatter Plot ===
  {
    const svg = d3.select("#scatter"),
      margin = { top: 60, right: 100, bottom: 80, left: 70 },
      width = +svg.attr("width") - margin.left - margin.right,
      height = +svg.attr("height") - margin.top - margin.bottom;

    // Add a background rectangle
    svg.append("rect")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .attr("fill", "#f9f9f9")
      .attr("rx", 10)
      .attr("ry", 10);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scalePoint().domain(conditions).range([0, width]).padding(0.5);
    const y = d3.scaleLinear().domain([0, 10]).range([height, 0]);

    // Add grid lines
    g.selectAll("y-grid")
      .data(y.ticks(5))
      .enter()
      .append("line")
      .attr("x1", 0)
      .attr("x2", width)
      .attr("y1", d => y(d))
      .attr("y2", d => y(d))
      .attr("stroke", "#e0e0e0")
      .attr("stroke-width", 1);

    // Add X and Y axis with styling
    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "rotate(-15)")
      .style("text-anchor", "end")
      .style("font-size", "12px")
      .style("font-family", "Arial");
      
    g.append("g")
      .call(d3.axisLeft(y))
      .selectAll("text")
      .style("font-size", "12px")
      .style("font-family", "Arial");

    // Add axis labels
    g.append("text")
      .attr("x", width / 2)
      .attr("y", height + 60)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .style("font-weight", "bold")
      .text("Mental Health Condition");

    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", -50)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .style("font-weight", "bold")
      .text("Social Interaction Score");

    // Create dots with hover effects
    g.selectAll("circle")
      .data(data)
      .enter()
      .append("circle")
      .attr(
        "cx",
        (d) => x(d["Mental Health Condition"]) + (Math.random() - 0.5) * 20
      )
      .attr("cy", (d) => y(d["Social Interaction Score"]))
      .attr("r", 6)
      .attr("fill", d => colorScale(d["Mental Health Condition"]))
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .attr("opacity", 0.7)
      .on("mouseover", function(event, d) {
        // Enlarge the dot on hover
        d3.select(this)
          .transition()
          .duration(200)
          .attr("r", 9)
          .attr("opacity", 1)
          .attr("stroke", "#333");
          
        // Show tooltip with information
        tooltip.transition()
          .duration(200)
          .style("opacity", 0.9);
          
        tooltip.html(`
          <strong>Condition:</strong> ${d["Mental Health Condition"]}<br>
          <strong>Social Score:</strong> ${d["Social Interaction Score"]}<br>
          <strong>Age:</strong> ${d["Age"] || "Unknown"}<br>
          <strong>Gender:</strong> ${d["Gender"] || "Unknown"}<br>
          <strong>Country:</strong> ${d["Country"] || "Unknown"}
        `)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", function() {
        // Return to normal size
        d3.select(this)
          .transition()
          .duration(500)
          .attr("r", 6)
          .attr("opacity", 0.7)
          .attr("stroke", "#fff");
          
        // Hide tooltip
        tooltip.transition()
          .duration(500)
          .style("opacity", 0);
      });

    // Add title with better styling
    svg.append("text")
      .attr("x", width / 2 + margin.left)
      .attr("y", margin.top / 2)
      .attr("text-anchor", "middle")
      .attr("font-size", "18px")
      .attr("font-weight", "bold")
      .attr("font-family", "Arial")
      .text("Social Interaction Score by Mental Health Condition");
      
    // Add legend
    const legend = svg.append("g")
      .attr("transform", `translate(${width + margin.left - 20}, ${margin.top + 20})`);
      
    conditions.forEach((condition, i) => {
      const legendRow = legend.append("g")
        .attr("transform", `translate(0, ${i * 25})`);
        
      legendRow.append("rect")
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", colorScale(condition));
        
      legendRow.append("text")
        .attr("x", 25)
        .attr("y", 12)
        .text(condition)
        .style("font-size", "12px")
        .style("font-family", "Arial");
    });
  }

  // === Enhanced Box Plot ===
  {
    const svg = d3.select("#boxplot"),
      margin = { top: 60, right: 100, bottom: 80, left: 70 },
      width = +svg.attr("width") - margin.left - margin.right,
      height = +svg.attr("height") - margin.top - margin.bottom;

    // Add a background rectangle
    svg.append("rect")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .attr("fill", "#f9f9f9")
      .attr("rx", 10)
      .attr("ry", 10);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scalePoint().domain(conditions).range([0, width]).padding(0.5);
    const y = d3.scaleLinear().domain([0, 10]).range([height, 0]);

    // Add grid lines
    g.selectAll("y-grid")
      .data(y.ticks(5))
      .enter()
      .append("line")
      .attr("x1", 0)
      .attr("x2", width)
      .attr("y1", d => y(d))
      .attr("y2", d => y(d))
      .attr("stroke", "#e0e0e0")
      .attr("stroke-width", 1);

    // Add X and Y axis with styling
    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "rotate(-15)")
      .style("text-anchor", "end")
      .style("font-size", "12px")
      .style("font-family", "Arial");
      
    g.append("g")
      .call(d3.axisLeft(y))
      .selectAll("text")
      .style("font-size", "12px")
      .style("font-family", "Arial");

    // Add axis labels
    g.append("text")
      .attr("x", width / 2)
      .attr("y", height + 60)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .style("font-weight", "bold")
      .text("Mental Health Condition");

    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", -50)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .style("font-weight", "bold")
      .text("Social Interaction Score");

    // Group data
    const grouped = d3.groups(data, (d) => d["Mental Health Condition"]);

    // Create box plots with hover effects
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
      
      // Calculate summary stats for tooltip
      const mean = d3.mean(scores).toFixed(2);
      const stdDev = d3.deviation(scores).toFixed(2);
      const count = scores.length;

      // Draw box with hover effects
      g.append("rect")
        .attr("x", xPos - 25)
        .attr("y", y(q3))
        .attr("height", y(q1) - y(q3))
        .attr("width", 50)
        .attr("fill", colorScale(cond))
        .attr("fill-opacity", 0.7)
        .attr("stroke", "black")
        .attr("stroke-width", 1)
        .on("mouseover", function(event) {
          // Highlight the box
          d3.select(this)
            .transition()
            .duration(200)
            .attr("fill-opacity", 0.9)
            .attr("stroke-width", 2);
            
          // Show tooltip with detailed statistics
          tooltip.transition()
            .duration(200)
            .style("opacity", 0.9);
            
          tooltip.html(`
            <strong>${cond}</strong><br>
            <strong>Min:</strong> ${min}<br>
            <strong>Q1:</strong> ${q1}<br>
            <strong>Median:</strong> ${median}<br>
            <strong>Q3:</strong> ${q3}<br>
            <strong>Max:</strong> ${max}<br>
            <strong>Mean:</strong> ${mean}<br>
            <strong>Std Dev:</strong> ${stdDev}<br>
            <strong>Sample size:</strong> ${count}
          `)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
          // Return to normal appearance
          d3.select(this)
            .transition()
            .duration(500)
            .attr("fill-opacity", 0.7)
            .attr("stroke-width", 1);
            
          // Hide tooltip
          tooltip.transition()
            .duration(500)
            .style("opacity", 0);
        });

      // Median line with hover effect
      g.append("line")
        .attr("x1", xPos - 25)
        .attr("x2", xPos + 25)
        .attr("y1", y(median))
        .attr("y2", y(median))
        .attr("stroke", "black")
        .attr("stroke-width", 2)
        .on("mouseover", function(event) {
          // Highlight the median line
          d3.select(this)
            .transition()
            .duration(200)
            .attr("stroke-width", 3);
            
          // Show tooltip
          tooltip.transition()
            .duration(200)
            .style("opacity", 0.9);
            
          tooltip.html(`
            <strong>${cond}</strong><br>
            <strong>Median:</strong> ${median}
          `)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
          // Return to normal appearance
          d3.select(this)
            .transition()
            .duration(500)
            .attr("stroke-width", 2);
            
          // Hide tooltip
          tooltip.transition()
            .duration(500)
            .style("opacity", 0);
        });

      // Min/max lines (whiskers)
      g.append("line")
        .attr("x1", xPos)
        .attr("x2", xPos)
        .attr("y1", y(min))
        .attr("y2", y(q1))
        .attr("stroke", "black")
        .attr("stroke-width", 1.5)
        .attr("stroke-dasharray", "5,3");
        
      g.append("line")
        .attr("x1", xPos)
        .attr("x2", xPos)
        .attr("y1", y(q3))
        .attr("y2", y(max))
        .attr("stroke", "black")
        .attr("stroke-width", 1.5)
        .attr("stroke-dasharray", "5,3");

      // Min/max horizontal caps with hover effects
      g.append("line")
        .attr("x1", xPos - 15)
        .attr("x2", xPos + 15)
        .attr("y1", y(min))
        .attr("y2", y(min))
        .attr("stroke", "black")
        .attr("stroke-width", 1.5)
        .on("mouseover", function(event) {
          // Highlight the min line
          d3.select(this)
            .transition()
            .duration(200)
            .attr("stroke-width", 3);
            
          // Show tooltip
          tooltip.transition()
            .duration(200)
            .style("opacity", 0.9);
            
          tooltip.html(`
            <strong>${cond}</strong><br>
            <strong>Minimum:</strong> ${min}
          `)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
          // Return to normal appearance
          d3.select(this)
            .transition()
            .duration(500)
            .attr("stroke-width", 1.5);
            
          // Hide tooltip
          tooltip.transition()
            .duration(500)
            .style("opacity", 0);
        });
        
      g.append("line")
        .attr("x1", xPos - 15)
        .attr("x2", xPos + 15)
        .attr("y1", y(max))
        .attr("y2", y(max))
        .attr("stroke", "black")
        .attr("stroke-width", 1.5)
        .on("mouseover", function(event) {
          // Highlight the max line
          d3.select(this)
            .transition()
            .duration(200)
            .attr("stroke-width", 3);
            
          // Show tooltip
          tooltip.transition()
            .duration(200)
            .style("opacity", 0.9);
            
          tooltip.html(`
            <strong>${cond}</strong><br>
            <strong>Maximum:</strong> ${max}
          `)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
          // Return to normal appearance
          d3.select(this)
            .transition()
            .duration(500)
            .attr("stroke-width", 1.5);
            
          // Hide tooltip
          tooltip.transition()
            .duration(500)
            .style("opacity", 0);
        });
    });

    // Add title with better styling
    svg.append("text")
      .attr("x", width / 2 + margin.left)
      .attr("y", margin.top / 2)
      .attr("text-anchor", "middle")
      .attr("font-size", "18px")
      .attr("font-weight", "bold")
      .attr("font-family", "Arial")
      .text("Social Interaction Score Distribution by Mental Health Condition");
      
    // Add legend
    const legend = svg.append("g")
      .attr("transform", `translate(${width + margin.left - 20}, ${margin.top + 20})`);
      
    conditions.forEach((condition, i) => {
      const legendRow = legend.append("g")
        .attr("transform", `translate(0, ${i * 25})`);
        
      legendRow.append("rect")
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", colorScale(condition));
        
      legendRow.append("text")
        .attr("x", 25)
        .attr("y", 12)
        .text(condition)
        .style("font-size", "12px")
        .style("font-family", "Arial");
    });
    
    // Add explanation text for box plot elements
    const explanation = svg.append("g")
      .attr("transform", `translate(${margin.left}, ${height + margin.top + 40})`);
      
    explanation.append("text")
      .attr("x", 0)
      .attr("y", 0)
      .text("Box plot elements:")
      .style("font-weight", "bold")
      .style("font-size", "12px");
      
    explanation.append("text")
      .attr("x", 0)
      .attr("y", 20)
      .text("• Box: Interquartile range (25th to 75th percentile)")
      .style("font-size", "12px");
      
    explanation.append("text") 
      .attr("x", 0)
      .attr("y", 40)
      .text("• Horizontal line: Median (50th percentile)")
      .style("font-size", "12px");
      
    explanation.append("text")
      .attr("x", 0) 
      .attr("y", 60)
      .text("• Whiskers: Min to 25th percentile and 75th percentile to max")
      .style("font-size", "12px");
  }
});