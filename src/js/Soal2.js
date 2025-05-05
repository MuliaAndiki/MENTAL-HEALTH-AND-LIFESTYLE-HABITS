// Bar chart class
class Barchart {
  constructor(_config, _data, _conditions, _stressLevels, _countries) {
    this.config = _config;
    this.data = _data;
    this.conditions = _conditions;
    this.stressLevels = _stressLevels;
    this.countries = _countries;
    this.margin = { top: 40, right: 100, bottom: 150, left: 80 };
    this.width = 1200 - this.margin.left - this.margin.right; // Increased width
    this.height = 500 - this.margin.top - this.margin.bottom;
    this.tooltip = _config.tooltip;

    console.log("Barchart instantiated with data:", this.data.length, "rows");

    // Clear any existing SVG to prevent duplicates
    d3.select(this.config.parentElement).html("");

    // Create SVG container
    this.svg = d3
      .select(this.config.parentElement)
      .append("svg")
      .attr("width", this.width + this.margin.left + this.margin.right)
      .attr("height", this.height + this.margin.top + this.margin.bottom)
      .append("g")
      .attr("transform", `translate(${this.margin.left},${this.margin.top})`);
  }

  updateVis() {
    const vis = this;
    console.log("Updating barchart visualization");

    // Define spacing between countries and conditions
    const countryPadding = 0.1;
    const conditionPadding = 9;

    // X scale for countries with extra padding
    const xCountryScale = d3
      .scaleBand()
      .domain(vis.countries)
      .range([0, vis.width])
      .padding(0.3);

    vis.conditions.forEach((condition, i) => {
      // Menambahkan angka indeks di kiri label
      vis.svg
        .append("text")
        .attr("class", "condition-index")
        .attr("x", vis.width - 1)
        .attr("y", i * 30 + 50)
        .text(i + 1)
        .style("text-anchor", "end")
        .style("font-size", "14px")
        .style("font-weight", "bold");

      // Tambahkan label kondisi di sisi kanan
      vis.svg
        .append("text")
        .attr("class", "condition-label")
        .attr("x", vis.width + 10)
        .attr("y", i * 30 + 50)
        .text(condition)
        .style("text-anchor", "start")
        .style("font-size", "14px")
        .style("font-weight", "bold");
    });

    // X scale for conditions within each country
    const xConditionScale = d3
      .scaleBand()
      .domain(vis.conditions)
      .range([0, xCountryScale.bandwidth()])
      .padding(0.1);

    // Group data by country and condition
    const nestedData = d3.group(
      vis.data,
      (d) => d.country,
      (d) => d.condition
    );

    // Stack generator for stress levels
    const stack = d3.stack().keys(vis.stressLevels);

    // Find max value for y scale
    let maxValue = 0;
    nestedData.forEach((conditions, country) => {
      conditions.forEach((data, condition) => {
        const total = vis.stressLevels.reduce(
          (sum, level) => sum + data[0][level],
          0
        );
        if (total > maxValue) maxValue = total;
      });
    });

    console.log("Maximum value for Y scale:", maxValue);

    // Y scale
    const yScale = d3
      .scaleLinear()
      .domain([0, maxValue > 0 ? maxValue : 10]) // Ensure a default if maxValue is 0
      .range([vis.height, 0])
      .nice();

    // Color scale for stress levels
    const colorScale = d3
      .scaleOrdinal()
      .domain(vis.stressLevels)
      .range(["#4e79a7", "#f28e2c", "#e15759"]);

    // Add background rectangles to group conditions
    vis.countries.forEach((country) => {
      vis.svg
        .append("rect")
        .attr("class", "condition-group")
        .attr("x", xCountryScale(country) - 20)
        .attr("y", 0)
        .attr("width", xCountryScale.bandwidth() + 40)
        .attr("height", vis.height)
        .attr("fill", "#f9f9f9")
        .attr("stroke", "#ddd")
        .attr("stroke-width", 1)
        .attr("rx", 5)
        .attr("ry", 5);
    });

    // Render bars for each country and condition
    vis.countries.forEach((country) => {
      vis.conditions.forEach((condition) => {
        const countryData = nestedData.get(country)?.get(condition) || [];
        if (countryData.length === 0) {
          console.log(`No data for ${country} - ${condition}`);
          return;
        }

        try {
          const stackedData = stack([countryData[0]]);

          vis.svg
            .selectAll(`.bars-${country}-${condition}`)
            .data(stackedData)
            .enter()
            .append("g")
            .attr("class", `bars-${country}-${condition}`)
            .attr("fill", (d) => colorScale(d.key))
            .selectAll("rect")
            .data((d) => d)
            .enter()
            .append("rect")
            .attr("x", xCountryScale(country) + xConditionScale(condition))
            .attr("y", (d) => yScale(d[1]))
            .attr("width", xConditionScale.bandwidth())
            .attr("height", (d) => yScale(d[0]) - yScale(d[1]))
            .attr("stroke", "white")
            .attr("stroke-width", 1)
            // Add hover effects and tooltip functionality
            .on("mouseover", function (event, d) {
              // Highlight the bar
              d3.select(this)
                .attr("stroke", "#333")
                .attr("stroke-width", 2)
                .attr("opacity", 1);

              // Get data properties from parent
              const parentData = d3.select(this.parentNode).datum();
              const stressLevel = parentData.key;
              const value = d[1] - d[0];

              // Show tooltip with information
              vis.tooltip.transition().duration(200).style("opacity", 0.9);
              vis.tooltip
                .html(
                  `
                  <strong>Country:</strong> ${country}<br>
                  <strong>Condition:</strong> ${condition}<br>
                  <strong>Stress Level:</strong> ${stressLevel}<br>
                  <strong>Count:</strong> ${value}
                `
                )
                .style("left", event.pageX + 10 + "px")
                .style("top", event.pageY - 28 + "px");
            })
            .on("mouseout", function () {
              // Restore normal appearance
              d3.select(this)
                .attr("stroke", "white")
                .attr("stroke-width", 1)
                .attr("opacity", 1);

              // Hide tooltip
              vis.tooltip.transition().duration(500).style("opacity", 0);
            });
        } catch (error) {
          console.error(
            `Error rendering bars for ${country} - ${condition}:`,
            error
          );
        }
      });
    });

    // Y-axis
    vis.svg.append("g").attr("class", "y-axis").call(d3.axisLeft(yScale));

    // Y-axis label
    vis.svg
      .append("text")
      .attr("class", "axis-label")
      .attr("transform", "rotate(-90)")
      .attr("x", -vis.height / 2)
      .attr("y", -50)
      .attr("text-anchor", "middle")
      .text("Range");

    // Add condition labels at the top of each group with increased space
    vis.countries.forEach((country) => {
      vis.conditions.forEach((condition, index) => {
        vis.svg
          .append("text")
          .attr("class", "condition-label")
          .attr(
            "x",
            xCountryScale(country) +
              xConditionScale(condition) +
              xConditionScale.bandwidth() / 2
          )
          .attr("y", vis.height + 30)
          .text(index + 1)
          .style("text-anchor", "middle");
      });
    });

    // Add country labels below condition labels with increased space
    vis.countries.forEach((country) => {
      vis.svg
        .append("text")
        .attr("class", "country-label")
        .attr("x", xCountryScale(country) + xCountryScale.bandwidth() / 2)
        .attr("y", vis.height + 90)
        .text(country)
        .style("text-anchor", "middle")
        .style("font-weight", "bold");
    });

    // Add separators between condition groups within countries
    vis.countries.forEach((country) => {
      vis.conditions.forEach((condition, i) => {
        if (i > 0) {
          vis.svg
            .append("line")
            .attr(
              "x1",
              xCountryScale(country) +
                xConditionScale(condition) -
                (xConditionScale.step() - xConditionScale.bandwidth()) / 2
            )
            .attr("y1", 0)
            .attr(
              "x2",
              xCountryScale(country) +
                xConditionScale(condition) -
                (xConditionScale.step() - xConditionScale.bandwidth()) / 2
            )
            .attr("y2", vis.height)
            .attr("stroke", "#ddd")
            .attr("stroke-width", 1)
            .attr("stroke-dasharray", "4,4");
        }
      });
    });

    // Add horizontal grid lines
    vis.svg
      .selectAll(".grid-line")
      .data(yScale.ticks(5))
      .enter()
      .append("line")
      .attr("class", "grid-line")
      .attr("x1", 0)
      .attr("x2", vis.width)
      .attr("y1", (d) => yScale(d))
      .attr("y2", (d) => yScale(d))
      .attr("stroke", "#e0e0e0")
      .attr("stroke-width", 1);

    // Title for barchart
    vis.svg
      .append("text")
      .attr("x", vis.width / 2)
      .attr("y", -20)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text("Mental Health Conditions by Country and Stress Level");

    // Legend
    const legend = d3
      .select(vis.config.parentElement)
      .append("div")
      .attr("class", "legend")
      .style("display", "flex")
      .style("justify-content", "center")
      .style("margin-top", "10px");

    vis.stressLevels.forEach((level) => {
      const legendItem = legend
        .append("div")
        .attr("class", "legend-item")
        .style("display", "flex")
        .style("align-items", "center")
        .style("margin", "0 10px");

      legendItem
        .append("div")
        .attr("class", "legend-color")
        .style("width", "12px")
        .style("height", "12px")
        .style("background-color", colorScale(level))
        .style("margin-right", "5px");

      legendItem.append("div").text(level);
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
      // Define mental health conditions and stress levels
      const mentalHealthConditions = [
        "None",
        "Depression",
        "Anxiety",
        "PTSD",
        "Bipolar",
      ];
      const stressLevels = ["Low", "Moderate", "High"];
      const countries = Array.from(new Set(data.map((d) => d.Country))).sort();

      // Check if barchart container exists
      if (!document.getElementById("barchart")) {
        console.error("Element with ID 'barchart' not found in the DOM");
        return;
      }

      // Process data for bar chart
      const processedData = [];
      countries.forEach((country) => {
        mentalHealthConditions.forEach((condition) => {
          const countsByStressLevel = {};
          stressLevels.forEach((stressLevel) => {
            countsByStressLevel[stressLevel] = data.filter(
              (d) =>
                d.Country === country &&
                d["Mental Health Condition"] === condition &&
                d["Stress Level"] === stressLevel
            ).length;
          });

          processedData.push({
            country: country,
            condition: condition,
            ...countsByStressLevel,
          });
        });
      });

      console.log("Processed data for barchart:", processedData);

      // Create bar chart
      const barchart = new Barchart(
        {
          parentElement: "#barchart",
          tooltip: tooltip,
        },
        processedData,
        mentalHealthConditions,
        stressLevels,
        countries
      );

      barchart.updateVis();
    })
    .catch((error) => console.error("Error loading the CSV file:", error));
});
