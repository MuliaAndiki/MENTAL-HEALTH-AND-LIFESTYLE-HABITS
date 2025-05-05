// violin.js - Violin Plot Simetris, Interaktif, dan Informatif + Warna dan Penjelasan Lengkap
const margin = { top: 60, right: 30, bottom: 60, left: 60 },
  width = 800 - margin.left - margin.right,
  height = 500 - margin.top - margin.bottom;

const svg = d3
  .select("#violin")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

// Tooltip untuk violin
const tooltip = d3
  .select("body")
  .append("div")
  .attr("class", "tooltip-card")
  .style("opacity", 0)
  .style("position", "absolute")
  .style("background", "#f9f9f9")
  .style("border", "1px solid #ccc")
  .style("border-radius", "8px")
  .style("box-shadow", "0px 4px 12px rgba(0,0,0,0.15)")
  .style("padding", "10px")
  .style("font-size", "13px")
  .style("max-width", "240px")
  .style("pointer-events", "none");

// Tooltip untuk garis density
const densityTip = d3
  .select("body")
  .append("div")
  .attr("class", "tooltip-d")
  .style("opacity", 0)
  .style("position", "absolute")
  .style("background", "#eef7ee")
  .style("border", "1px solid #7fa87f")
  .style("border-radius", "8px")
  .style("box-shadow", "0px 4px 12px rgba(0,0,0,0.1)")
  .style("padding", "10px")
  .style("font-size", "13px")
  .style("pointer-events", "none");

// Load data
d3.csv("data.csv").then(function (data) {
  data.forEach((d) => {
    d["Happiness Score"] = +d["Happiness Score"];
  });

  const groups = ["Low", "Moderate", "High"];
  const colors = { Low: "#4caf50", Moderate: "#ffb300", High: "#e53935" };

  const x = d3.scaleBand().domain(groups).range([0, width]).padding(0.05);
  svg
    .append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .style("font-size", "12px");

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => d["Happiness Score"])])
    .nice()
    .range([height, 0]);
  svg
    .append("g")
    .call(d3.axisLeft(y))
    .selectAll("text")
    .style("font-size", "12px");

  function kernelDensityEstimator(kernel, X) {
    return function (V) {
      return X.map((x) => [x, d3.mean(V, (v) => kernel(x - v))]);
    };
  }
  function kernelEpanechnikov(k) {
    return (v) => (Math.abs((v /= k)) <= 1 ? (0.75 * (1 - v * v)) / k : 0);
  }

  const kde = kernelDensityEstimator(kernelEpanechnikov(0.4), y.ticks(40));
  const sumstat = d3.group(data, (d) => d["Exercise Level"]);
  const maxDensity = d3.max(
    Array.from(sumstat.values()).flatMap((group) => {
      const density = kde(group.map((d) => d["Happiness Score"]));
      return density.map((d) => d[1]);
    })
  );

  const xNum = d3
    .scaleLinear()
    .range([0, x.bandwidth() / 2])
    .domain([0, maxDensity]);

  sumstat.forEach((group, key) => {
    const density = kde(group.map((d) => d["Happiness Score"]));
    svg
      .append("path")
      .datum(density)
      .attr("transform", `translate(${x(key) + x.bandwidth() / 2},0)`)
      .attr("fill", colors[key])
      .attr("stroke", "black")
      .attr("opacity", 0.6)
      .on("mouseover", function (event) {
        d3.select(this).attr("opacity", 0.85);
        densityTip.transition().duration(200).style("opacity", 1);
        densityTip
          .html(
            `Area berwarna menggambarkan distribusi skor kebahagiaan untuk tingkat aktivitas <strong>${key}</strong>. Lebih lebar berarti lebih banyak individu pada nilai itu.`
          )
          .style("left", `${event.pageX + 15}px`)
          .style("top", `${event.pageY - 30}px`);
      })
      .on("mouseout", function () {
        d3.select(this).attr("opacity", 0.6);
        densityTip.transition().duration(500).style("opacity", 0);
      })
      .attr(
        "d",
        d3
          .area()
          .x0((d) => -xNum(d[1]))
          .x1((d) => xNum(d[1]))
          .y((d) => y(d[0]))
          .curve(d3.curveBasis)
      );
  });

  svg
    .selectAll("indPoints")
    .data(data)
    .enter()
    .append("circle")
    .attr(
      "cx",
      (d) => x(d["Exercise Level"]) + x.bandwidth() / 2 - 5 + Math.random() * 10
    )
    .attr("cy", (d) => y(d["Happiness Score"]))
    .attr("r", 3.5)
    .attr("fill", "#111")
    .attr("opacity", 0.7)
    .on("mouseover", function (event, d) {
      tooltip.transition().duration(200).style("opacity", 1);
      tooltip
        .html(
          `<strong>Tingkat Aktivitas:</strong> ${d["Exercise Level"]}<br/>
           <strong>Skor Kebahagiaan:</strong> ${d["Happiness Score"]}<br/><br/>
           Titik ini menunjukkan satu individu. Lokasinya menunjukkan nilai skor kebahagiaannya.`
        )
        .style("left", `${event.pageX + 15}px`)
        .style("top", `${event.pageY - 30}px`);
    })
    .on("mouseout", function () {
      tooltip.transition().duration(500).style("opacity", 0);
    });
});
