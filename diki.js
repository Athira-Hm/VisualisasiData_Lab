 // Load data from CSV
    d3.csv('Mental_Health_Lifestyle_Dataset.csv')
      .then(data => {
        // Define mental health conditions and stress levels
        const mentalHealthConditions = ['None', 'Depression', 'Anxiety', 'PTSD', 'Bipolar'];
        const stressLevels = ['Low', 'Moderate', 'High'];
        const countries = Array.from(new Set(data.map(d => d.Country))).sort();
        

        const processedData = [];
        
        countries.forEach(country => {
          mentalHealthConditions.forEach(condition => {
            const countsByStressLevel = {};
            stressLevels.forEach(stressLevel => {
              countsByStressLevel[stressLevel] = data.filter(d => 
                d.Country === country && 
                d['Mental Health Condition'] === condition && 
                d['Stress Level'] === stressLevel
              ).length;
            });
            
            processedData.push({
              country: country,
              condition: condition,
              ...countsByStressLevel
            });
          });
        });

        // Create bar chart
        const barchart = new Barchart({
          parentElement: '#barchart'
        }, processedData, mentalHealthConditions, stressLevels, countries);
        
        barchart.updateVis();
      })
      .catch(error => console.error('Error loading the CSV file:', error));

      

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

        // Create SVG container
        this.svg = d3.select(this.config.parentElement)
          .append('svg')
          .attr('width', this.width + this.margin.left + this.margin.right)
          .attr('height', this.height + this.margin.top + this.margin.bottom)
          .append('g')
          .attr('transform', `translate(${this.margin.left},${this.margin.top})`);
      }

      updateVis() {
        const vis = this;
        
        // Define spacing between countries and conditions
        const countryPadding = 0.1; 
        const conditionPadding = 9; 
        
        // X scale for countries with extra padding
        const xCountryScale = d3.scaleBand()
          .domain(vis.countries)
          .range([0, vis.width])
          .padding(0.3);

          vis.conditions.forEach((condition, i) => {
            // Menambahkan angka indeks di kiri label
            vis.svg.append('text')
              .attr('class', 'condition-index')
              .attr('x', vis.width - 1) 
              .attr('y', i * 30 + 50)    
              .text(i + 1)              
              .style('text-anchor', 'end') 
              .style('font-size', '14px')
              .style('font-weight', 'bold');
          
            // Tambahkan label kondisi di sisi kanan
            vis.svg.append('text')
              .attr('class', 'condition-label')
              .attr('x', vis.width + 10) 
              .attr('y', i * 30 + 50)    
              .text(condition)
              .style('text-anchor', 'start')
              .style('font-size', '14px')
              .style('font-weight', 'bold');
          });
        
        // X scale for conditions within each country
        const xConditionScale = d3.scaleBand()
  .domain(vis.conditions)
  .range([0, xCountryScale.bandwidth()])
  .padding(0.1);
        
        // Group data by country and condition
        const nestedData = d3.group(vis.data, d => d.country, d => d.condition);
        
        // Stack generator for stress levels
        const stack = d3.stack()
          .keys(vis.stressLevels);
        
        // Find max value for y scale
        let maxValue = 0;
        nestedData.forEach((conditions, country) => {
          conditions.forEach((data, condition) => {
            const total = vis.stressLevels.reduce((sum, level) => sum + data[0][level], 0);
            if (total > maxValue) maxValue = total;
          });
        });
        
        // Y scale
        const yScale = d3.scaleLinear()
          .domain([0, maxValue])
          .range([vis.height, 0])
          .nice();
        
        // Color scale for stress levels
        const colorScale = d3.scaleOrdinal()
          .domain(vis.stressLevels)
          .range(['#4e79a7', '#f28e2c', '#e15759']); 
        
        // Add background rectangles to group conditions
        vis.countries.forEach(country => {
          vis.svg.append('rect')
            .attr('class', 'condition-group')
            .attr('x', xCountryScale(country) - 20)
            .attr('y', 0)
            .attr('width', xCountryScale.bandwidth() + 40)
            .attr('height', vis.height)
            .attr('fill', '#f9f9f9')
            .attr('stroke', '#ddd')
            .attr('stroke-width', 1)
            .attr('rx', 5)
            .attr('ry', 5);
        });
        
        // Render bars for each country and condition
        vis.countries.forEach(country => {
          vis.conditions.forEach(condition => {
            const countryData = nestedData.get(country)?.get(condition) || [];
            if (countryData.length === 0) return;
            
            const stackedData = stack([countryData[0]]);
            
            vis.svg.selectAll(`.bars-${country}-${condition}`)
              .data(stackedData)
              .enter()
              .append('g')
              .attr('class', `bars-${country}-${condition}`)
              .attr('fill', d => colorScale(d.key))
              .selectAll('rect')
              .data(d => d)
              .enter()
              .append('rect')
              .attr('x', xCountryScale(country) + xConditionScale(condition))
              .attr('y', d => yScale(d[1]))
              .attr('width', xConditionScale.bandwidth())
              .attr('height', d => yScale(d[0]) - yScale(d[1]))
              .attr('stroke', 'white')
              .attr('stroke-width', 1);
          });
        });
        
        // Y-axis
        vis.svg.append('g')
          .attr('class', 'y-axis')
          .call(d3.axisLeft(yScale));
        
        // Y-axis label
        vis.svg.append('text')
          .attr('class', 'axis-label')
          .attr('transform', 'rotate(-90)')
          .attr('x', -vis.height / 2)
          .attr('y', -50)
          .attr('text-anchor', 'middle')
          .text('Range');
        
        // Add condition labels at the top of each group with increased space
        vis.countries.forEach(country => {
          vis.conditions.forEach((condition, index) => { 
            vis.svg.append('text')
              .attr('class', 'condition-label')
              .attr('x', xCountryScale(country) + xConditionScale(condition) + xConditionScale.bandwidth() / 2)
              .attr('y', vis.height + 30) 
              .text(index + 1); 
          });
        });
        
        
        // Add country labels below condition labels with increased space
        vis.countries.forEach(country => {
          vis.svg.append('text')
            .attr('class', 'country-label')
            .attr('x', xCountryScale(country) + xCountryScale.bandwidth() / 2)
            .attr('y', vis.height + 90) 
            .text(country);
        });
        
        // Add separators between condition groups within countries
        vis.countries.forEach(country => {
          vis.conditions.forEach((condition, i) => {
            if (i > 0) {
              vis.svg.append('line')
                .attr('x1', xCountryScale(country) + xConditionScale(condition) - (xConditionScale.step() - xConditionScale.bandwidth()) / 2)
                .attr('y1', 0)
                .attr('x2', xCountryScale(country) + xConditionScale(condition) - (xConditionScale.step() - xConditionScale.bandwidth()) / 2)
                .attr('y2', vis.height)
                .attr('stroke', '#ddd')
                .attr('stroke-width', 1)
                .attr('stroke-dasharray', '4,4');
            }
          });
        });
        
        // Add horizontal grid lines
        vis.svg.selectAll('.grid-line')
          .data(yScale.ticks(5))
          .enter()
          .append('line')
          .attr('class', 'grid-line')
          .attr('x1', 0)
          .attr('x2', vis.width)
          .attr('y1', d => yScale(d))
          .attr('y2', d => yScale(d))
          .attr('stroke', '#e0e0e0')
          .attr('stroke-width', 1);
        
        // Legend
        const legend = d3.select(vis.config.parentElement)
          .append('div')
          .attr('class', 'legend');
        
        vis.stressLevels.forEach(level => {
          const legendItem = legend.append('div')
            .attr('class', 'legend-item');
          
          legendItem.append('div')
            .attr('class', 'legend-color')
            .style('background-color', colorScale(level));
          
          legendItem.append('div')
            .text(`${level} `);
        });
      }
    }
