d3.csv("Mental_Health_Lifestyle_Dataset.csv", d3.autoType).then(visualize);

    async function visualize(data){
        const container = d3.select("#container");
        const title = container.select("#title");
        const grafik = container.select("#grafik");
        const legenda = container.select("#legenda");
        
        title.text("Hubungan Tipe Diet dan Tingkat Stres");
        // title.text("Mental Health X Diet type");
        const prosecced = data.map(d=> ({
            diet: d["Diet Type"],
            stress: d['Stress Level'],
            country: d['Country'],
            age: d['Age'],

        }))
        
            // console.log(prosecced);


        const countries = [...new Set(prosecced.map(d => d.country))];
        const diets = [...new Set(prosecced.map(d => d.diet))];
        // const ages = [...new Set(prosecced.map(d => d.age))];
        const stress = ["Low", "Moderate", "High"];
        // console.log(countries);
        // console.log(diets);
        // console.log(stress);
        const margin = {top: 60, right: 50, bottom: 50, left: 60};
        const w = 850 - margin.left - margin.right;
        const h = 700 - margin.top - margin.bottom;
        const svg = d3.select("#grafik")
        .append("svg")
        .attr("width", w + margin.left + margin.right)
        .attr("height", h + margin.top + margin.bottom)
        .append("g")
          .attr("transform", `translate(${margin.left},${margin.top-10})`);

        const x = d3.scaleBand()
        .domain(diets)
        .range([0, w])
        .padding(0.2);
        
        const y = d3.scaleBand()
        .domain(stress)
        .range([h, 0])
        .padding(0.1);
        
        const color = d3.scaleOrdinal()
        .domain(countries)
        .range(d3.schemeCategory10);

        // console.log(color(countries[0]));

        svg.append("g")
       .attr("transform", `translate(0, ${h})`)
       .call(d3.axisBottom(x));

   svg.append("g")
  .call(d3.axisLeft(y))
  .selectAll("text")
  .attr("x", h/42)
  .attr("y", -15)
  .attr("transform", "rotate(-90)");
    

      svg.append("text")
      .attr("x", w / 2)
      .attr("y", h + 40)        
      .attr("text-anchor", "middle")
      .text("Diet type");

        svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -h/2)
        .attr("y", -40)
        .attr("text-anchor", "middle")
        .text("Stress Level");

          const grouped = d3.group(prosecced, d => d.diet, d => d.stress);
      
            const dotRadius = 4, dotSpacing = dotRadius * 2.2;

            console.log(grouped);

            diets.forEach(diet => {
    stress.forEach(stress => {
      const points = grouped.get(diet)?.get(stress) || [];

      const group = svg.append("g")
        .attr("transform", `translate(${x(diet)},${y(stress)})`);

      const numCols = Math.floor(x.bandwidth() / dotSpacing);

      group.selectAll("circle")
        .data(points.map((d, i) => ({
          ...d,
          cx: (i % numCols) * dotSpacing + dotRadius,
          cy: Math.floor(i / numCols) * dotSpacing + dotRadius
        })))
        .enter()
        .append("circle")
        .attr("class", "dot")
        .attr("r", dotRadius)
        .attr("cx", d => d.cx)
        .attr("cy", d => d.cy)
        .attr("fill", d => color(d.country))
        .append("title")
        .text(d => `Country: ${d.country}\nAge: ${d.age}`);

      // jumlah
      group.append("text")
        .attr("class", "count-label")
        .attr("x", x.bandwidth() / 2)
        .style("text-anchor", "middle")
        .style("font-size", "12px")
        .style("font-weight", "bold")
        .attr("y", -10)
        .text(`${points.length}`);
    });
  });

    const legend = d3.select("#legenda")
    .selectAll(".legend-item")
    .data(color.domain())
    .enter()
    .append("div")
    .style("justify-content", " center")
    .attr("class", "legend-item");

  legend.append("div")
    .attr("class", "legend-color")
    .style("background-color", d => color(d));

  legend.append("div")
    .text(d => d);

    }