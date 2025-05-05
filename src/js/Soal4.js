const svg = d3.select("svg"),
  margin = { top: 30, right: 100, bottom: 70, left: 50 }, // Perbesar margin kanan untuk legenda
  width = +svg.attr("width") - margin.left - margin.right,
  height = +svg.attr("height") - margin.top - margin.bottom,
  g = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

const tooltip = d3.select("body").append("div").attr("class", "tooltip");

d3.csv("data.csv").then(function (data) {
  // Konversi stress level ke angka
  data.forEach((d) => {
    const val = d["Stress Level"].toLowerCase();
    if (val === "low") d["Stress Level Numeric"] = 1;
    else if (val === "moderate") d["Stress Level Numeric"] = 2;
    else if (val === "high") d["Stress Level Numeric"] = 3;
    else d["Stress Level Numeric"] = NaN;
  });

  const grouped = d3.group(data, (d) => d["Diet Type"]);
  const chartData = [];

  for (const [key, values] of grouped) {
    const avg = d3.mean(values, (d) => +d["Stress Level Numeric"]);
    if (!isNaN(avg)) {
      chartData.push({ type: key, avg });
    }
  }

  const x = d3
    .scaleBand()
    .domain(chartData.map((d) => d.type))
    .range([0, width])
    .padding(0.4);
  const y = d3
    .scaleLinear()
    .domain([0, d3.max(chartData, (d) => d.avg)])
    .nice()
    .range([height, 0]);

  // Buat skala warna untuk tipe diet yang berbeda
  const color = d3
    .scaleOrdinal()
    .domain(chartData.map((d) => d.type))
    .range(d3.schemeCategory10);

  // Tambahkan sumbu X
  g.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "rotate(-30)")
    .style("text-anchor", "end");

  // Tambahkan sumbu Y
  g.append("g").call(d3.axisLeft(y));

  // Buat batang chart
  const bars = g
    .selectAll(".bar")
    .data(chartData)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", (d) => x(d.type))
    .attr("y", (d) => y(d.avg))
    .attr("width", x.bandwidth())
    .attr("height", (d) => height - y(d.avg))
    .attr("fill", (d) => color(d.type))
    .style("transition", "fill 0.3s") // Animasi perubahan warna
    .on("mouseover", function (event, d) {
      // Gelapkan warna saat hover
      d3.select(this).attr("fill", d3.color(color(d.type)).darker(0.5));

      tooltip.transition().duration(200).style("opacity", 1);
      tooltip
        .html(`Diet: ${d.type}<br>Avg Stress: ${d.avg.toFixed(2)}`)
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY - 28 + "px");
    })
    .on("mouseout", function () {
      // Kembalikan warna asli
      const d = d3.select(this).datum();
      d3.select(this).attr("fill", color(d.type));
      tooltip.transition().duration(300).style("opacity", 0);
    });

  // // Tambahkan legenda
  // const legend = g
  //   .append("g")
  //   .attr("transform", `translate(${width + 20}, 20)`); // Posisi legenda di kanan chart

  // const legendItems = legend
  //   .selectAll(".legend-item")
  //   .data(chartData)
  //   .enter()
  //   .append("g")
  //   .attr("class", "legend-item")
  //   .attr("transform", (d, i) => `translate(0, ${i * 25})`); // Jarak antar item legenda

  // // Tambahkan kotak warna
  // legendItems
  //   .append("rect")
  //   .attr("width", 18)
  //   .attr("height", 18)
  //   .attr("fill", (d) => color(d.type));

  // // Tambahkan teks
  // legendItems
  //   .append("text")
  //   .attr("x", 24)
  //   .attr("y", 9)
  //   .attr("dy", "0.35em")
  //   .text((d) => d.type);
});
