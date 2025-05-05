// Ukuran dan margin chart
const margin = { top: 50, right: 150, bottom: 70, left: 60 },
  width = 960 - margin.left - margin.right,
  height = 500 - margin.top - margin.bottom;

const svg = d3
  .select("#chart")
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

// Tooltip
const tooltip = d3
  .select("body")
  .append("div")
  .style("position", "absolute")
  .style("background", "#f9f9f9")
  .style("border", "1px solid #d3d3d3")
  .style("padding", "8px")
  .style("border-radius", "4px")
  .style("font-size", "12px")
  .style("pointer-events", "none")
  .style("opacity", 0);

// Load dan proses data
d3.csv("data.csv").then(function (rawData) {
  // 🔥 Ambil hanya kolom yang diperlukan
  const filteredData = rawData.map((d) => ({
    Country: d.Country,
    StressLevel: d["Stress Level"],
  }));

  // 🔥 Hitung jumlah tiap level stres per negara
  const nested = d3.rollup(
    filteredData,
    (v) => ({
      Low: v.filter((d) => d.StressLevel === "Low").length,
      Moderate: v.filter((d) => d.StressLevel === "Moderate").length,
      High: v.filter((d) => d.StressLevel === "High").length,
    }),
    (d) => d.Country
  );

  const data = Array.from(nested, ([Country, levels]) => ({
    Country,
    ...levels,
  }));

  const subgroups = ["Low", "Moderate", "High"];
  const groups = data.map((d) => d.Country);

  // Skala X utama
  const x = d3.scaleBand().domain(groups).range([0, width]).padding([0.05]); // 📌 padding dikurangi supaya lebih rapat

  svg
    .append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "translate(-10,0)rotate(-45)")
    .style("text-anchor", "end");

  // Skala subgroup (untuk tiap bar kecil di dalam satu negara)
  const xSubgroup = d3
    .scaleBand()
    .domain(subgroups)
    .range([0, x.bandwidth()])
    .padding([0.05]);

  // Skala Y
  const y = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => Math.max(d.Low, d.Moderate, d.High)) * 1.1])
    .range([height, 0]);

  svg.append("g").call(d3.axisLeft(y));

  // Warna
  const color = d3
    .scaleOrdinal()
    .domain(subgroups)
    .range(["#4CAF50", "#FFEB3B", "#F44336"]);

  // Bikin bars
  svg
    .append("g")
    .selectAll("g")
    .data(data)
    .join("g")
    .attr("transform", (d) => `translate(${x(d.Country)},0)`)
    .selectAll("rect")
    .data((d) => subgroups.map((key) => ({ key: key, value: d[key] })))
    .join("rect")
    .attr("x", (d) => xSubgroup(d.key))
    .attr("y", (d) => y(d.value))
    .attr("width", xSubgroup.bandwidth())
    .attr("height", (d) => height - y(d.value))
    .attr("fill", (d) => color(d.key))
    .on("mouseover", function (event, d) {
      tooltip.transition().duration(200).style("opacity", 0.9);
      tooltip
        .html(`<strong>${d.key}</strong>: ${d.value}`)
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY - 28 + "px");
      d3.select(this).attr("opacity", 0.7);
    })
    .on("mousemove", function (event) {
      tooltip
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY - 28 + "px");
    })
    .on("mouseout", function () {
      tooltip.transition().duration(500).style("opacity", 0);
      d3.select(this).attr("opacity", 1);
    });

  // Legend
  const legend = svg
    .append("g")
    .attr("transform", `translate(${width + 20}, 0)`);

  subgroups.forEach((key, i) => {
    const legendRow = legend
      .append("g")
      .attr("transform", `translate(0, ${i * 25})`);

    legendRow
      .append("rect")
      .attr("width", 20)
      .attr("height", 20)
      .attr("fill", color(key));

    legendRow
      .append("text")
      .attr("x", 30)
      .attr("y", 15)
      .text(key)
      .attr("text-anchor", "start")
      .style("alignment-baseline", "middle");
  });
});
