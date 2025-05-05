// ScatterPlot Class
class ScatterPlot {
  constructor(_config, _data) {
    this.config = _config;
    this.data = _data;
    this.margin = { top: 50, right: 50, bottom: 60, left: 60 };
    this.width = 800 - this.margin.left - this.margin.right;
    this.height = 500 - this.margin.top - this.margin.bottom;
    this.tooltip = _config.tooltip;

    // Clear any existing SVG
    d3.select(this.config.parentElement).html("");

    this.svg = d3
      .select(this.config.parentElement)
      .append("svg")
      .attr("width", this.width + this.margin.left + this.margin.right)
      .attr("height", this.height + this.margin.top + this.margin.bottom)
      .append("g")
      .attr("transform", `translate(${this.margin.left},${this.margin.top})`);

    // Use a single color for the scatter plot
    this.colorScale = d3
      .scaleOrdinal()
      .domain(["Low", "Moderate", "High"])
      .range(["#4e79a7", "#f28e2c", "#e15759"]);
  }

  updateVis() {
    const vis = this;

    // X and Y scale
    const xScale = d3
      .scaleLinear()
      .domain(d3.extent(vis.data, (d) => d.SleepHours))
      .range([0, vis.width])
      .nice();

    const yScale = d3
      .scaleLinear()
      .domain(d3.extent(vis.data, (d) => d.HappinessScore))
      .range([vis.height, 0])
      .nice();

    // Axis
    vis.svg
      .append("g")
      .attr("transform", `translate(0,${vis.height})`)
      .call(d3.axisBottom(xScale));

    vis.svg.append("g").call(d3.axisLeft(yScale));

    // Labels
    vis.svg
      .append("text")
      .attr("x", vis.width / 2)
      .attr("y", vis.height + 40)
      .attr("text-anchor", "middle")
      .text("Sleep Hours");

    vis.svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -vis.height / 2)
      .attr("y", -40)
      .attr("text-anchor", "middle")
      .text("Happiness Score");

    vis.svg
      .append("text")
      .attr("x", vis.width / 2)
      .attr("y", -20)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text("Hubungan antara Jumlah Tidur dan Tingkat Kebahagiaan");

    // Scatter dots with hover functionality
    vis.svg
      .selectAll(".dot")
      .data(vis.data)
      .enter()
      .append("circle")
      .attr("class", "dot")
      .attr("cx", (d) => xScale(d.SleepHours))
      .attr("cy", (d) => yScale(d.HappinessScore))
      .attr("r", 5)
      .attr("fill", (d) => vis.colorScale(d["Stress Level"] || "Moderate"))
      .attr("opacity", 0.7)
      .attr("stroke", "#fff")
      .attr("stroke-width", 1)
      // Add hover effects
      .on("mouseover", function (event, d) {
        // Enlarge dot and make it more opaque
        d3.select(this)
          .transition()
          .duration(200)
          .attr("r", 8)
          .attr("opacity", 1)
          .attr("stroke", "#333")
          .attr("stroke-width", 2);

        // Show tooltip with data information
        vis.tooltip.transition().duration(200).style("opacity", 0.9);
        vis.tooltip
          .html(
            `
            <strong>Sleep Hours:</strong> ${d.SleepHours}<br>
            <strong>Happiness Score:</strong> ${d.HappinessScore}<br>
            <strong>Exercise:</strong> ${d.Exercise}<br>
            <strong>Stress Level:</strong> ${d["Stress Level"] || "Unknown"}<br>
            <strong>Country:</strong> ${d.Country}
          `
          )
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseout", function () {
        // Return to normal size and opacity
        d3.select(this)
          .transition()
          .duration(500)
          .attr("r", 5)
          .attr("opacity", 0.7)
          .attr("stroke", "#fff")
          .attr("stroke-width", 1);

        // Hide tooltip
        vis.tooltip.transition().duration(500).style("opacity", 0);
      });

    // Trend line (linear regression)
    const xMean = d3.mean(vis.data, (d) => d.SleepHours);
    const yMean = d3.mean(vis.data, (d) => d.HappinessScore);
    const numerator = d3.sum(
      vis.data,
      (d) => (d.SleepHours - xMean) * (d.HappinessScore - yMean)
    );
    const denominator = d3.sum(vis.data, (d) =>
      Math.pow(d.SleepHours - xMean, 2)
    );
    const slope = numerator / denominator;
    const intercept = yMean - slope * xMean;

    const xRange = d3.extent(vis.data, (d) => d.SleepHours);
    const linePoints = xRange.map((x) => ({
      x: x,
      y: slope * x + intercept,
    }));

    vis.svg
      .append("line")
      .attr("x1", xScale(linePoints[0].x))
      .attr("y1", yScale(linePoints[0].y))
      .attr("x2", xScale(linePoints[1].x))
      .attr("y2", yScale(linePoints[1].y))
      .attr("stroke", "red")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "5,3");

    // Legend for scatter plot

    const legendGroup = vis.svg
      .append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${vis.width - 150}, 20)`);

    stressLevels.forEach((level, i) => {
      const legendRow = legendGroup
        .append("g")
        .attr("transform", `translate(0, ${i * 20})`);

      legendRow
        .append("circle")
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", 6)
        .attr("fill", vis.colorScale(level))
        .attr("opacity", 0.7);

      legendRow
        .append("text")
        .attr("x", 15)
        .attr("y", 5)
        .text(`${level} Stress`)
        .style("font-size", "12px");
    });
  }
}

// Initialize when the document is loaded
document.addEventListener("DOMContentLoaded", function () {
  // Create tooltip div if it doesn't exist
  const tooltip = d3
    .select("body")
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

  // Load the data
  d3.csv("data.csv")
    .then((data) => {
      // Data preprocessing
      data.forEach((d) => {
        d.SleepHours = +d["Sleep Hours"];
        d.HappinessScore = +d["Happiness Score"];
        d.Exercise = d["Exercise"] || "Unknown";
      });

      // Check if scatterplot container exists
      if (!document.getElementById("scatterplot")) {
        console.error("Element with ID 'scatterplot' not found in the DOM");
        return;
      }

      // Initialize scatterplot
      const scatterplot = new ScatterPlot(
        {
          parentElement: "#scatterplot",
          tooltip: tooltip,
        },
        data
      );
      scatterplot.updateVis();
    })
    .catch((error) => console.error("Error loading the CSV file:", error));
});
