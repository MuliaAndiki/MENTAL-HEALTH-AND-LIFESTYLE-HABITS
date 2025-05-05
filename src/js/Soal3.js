const svg = d3.select("svg"),
  width = +svg.attr("width"),
  height = +svg.attr("height"),
  margin = { top: 30, right: 20, bottom: 50, left: 50 },
  innerWidth = width - margin.left - margin.right,
  innerHeight = height - margin.top - margin.bottom;

const g = svg
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);
const tooltip = d3
  .select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);

d3.csv("data.csv").then(function (data) {
  // Tambah kolom kategori screen time
  data.forEach((d) => {
    const hours = +d["Screen Time per Day (Hours)"];
    if (hours < 3) d["Screen Time Category"] = "Low";
    else if (hours < 6) d["Screen Time Category"] = "Moderate";
    else d["Screen Time Category"] = "High";
  });

  const grouped = d3.group(data, (d) => d["Screen Time Category"]);
  const dataBox = {};
  grouped.forEach((values, key) => {
    dataBox[key] = values
      .map((d) => +d["Happiness Score"])
      .filter((v) => !isNaN(v));
  });

  const categories = Array.from(grouped.keys());
  const allScores = Object.values(dataBox).flat();

  const x = d3
    .scaleBand()
    .domain(categories)
    .range([0, innerWidth])
    .padding(0.4);
  const y = d3
    .scaleLinear()
    .domain([d3.min(allScores) - 1, d3.max(allScores) + 1])
    .range([innerHeight, 0]);

  g.append("g")
    .attr("transform", `translate(0,${innerHeight})`)
    .call(d3.axisBottom(x));
  g.append("g").call(d3.axisLeft(y));

  categories.forEach((cat) => {
    const scores = dataBox[cat].sort(d3.ascending);
    const q1 = d3.quantile(scores, 0.25);
    const median = d3.quantile(scores, 0.5);
    const q3 = d3.quantile(scores, 0.75);
    const min = d3.min(scores);
    const max = d3.max(scores);
    const color = median > 7 ? "green" : median < 6 ? "red" : "steelblue";
    const boxX = x(cat),
      boxW = x.bandwidth(),
      boxY = y(q3),
      boxH = y(q1) - y(q3);

    g.append("rect")
      .attr("class", "box")
      .attr("x", boxX)
      .attr("y", boxY)
      .attr("width", boxW)
      .attr("height", boxH)
      .attr("fill", color)
      .on("mouseover", (e) => {
        tooltip.transition().duration(200).style("opacity", 1);
        tooltip
          .html(
            `<b>${cat}</b><br>Min: ${min}<br>Q1: ${q1}<br>Median: ${median}<br>Q3: ${q3}<br>Max: ${max}`
          )
          .style("left", e.pageX + 10 + "px")
          .style("top", e.pageY - 28 + "px");
      })
      .on("mouseout", () =>
        tooltip.transition().duration(300).style("opacity", 0)
      );

    g.append("line")
      .attr("x1", boxX + boxW / 2)
      .attr("x2", boxX + boxW / 2)
      .attr("y1", y(min))
      .attr("y2", y(max))
      .attr("stroke", "black");

    g.append("line")
      .attr("class", "median")
      .attr("x1", boxX)
      .attr("x2", boxX + boxW)
      .attr("y1", y(median))
      .attr("y2", y(median));
  });

  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", height - 5)
    .attr("text-anchor", "middle")
    .text("Kategori Screen Time");

  svg
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", 15)
    .attr("text-anchor", "middle")
    .text("Happiness Score");
});
