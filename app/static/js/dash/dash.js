function dashboard(id, fData) {
    var barColor = '#ffbd4a';

    function segColor(c) { return { positive: "#ffffff", negative: "#000000" }[c]; }

    // ROUNDING THE POSITIVE & NEGATIVE TWEETS
    // d3.format(",.1%")

    // compute total for each Politician (age_started).
    fData.forEach(function(d) { d.total = d.tweets.positive + d.tweets.negative; });

    // HISTOGRAM FUNCTION
    function histoGram(fD) {
        var hG = {},
            hGDim = { t: 80, r: 0, b: 30, l: 0 };
        hGDim.w = 600 - hGDim.l - hGDim.r,
            hGDim.h = 300 - hGDim.t - hGDim.b;

        //create svg for histogram.
        var hGsvg = d3.select(id).append("svg")
            .attr("width", hGDim.w + hGDim.l + hGDim.r)
            .attr("height", hGDim.h + hGDim.t + hGDim.b).append("g")
            .attr("transform", "translate(" + hGDim.l + "," + hGDim.t + ")");

        // create function for x-axis mapping.
        var x = d3.scale.ordinal().rangeRoundBands([0, hGDim.w + 10], 0.1)
            .domain(fD.map(function(d) { return d[0]; }));

        // Add x-axis to the histogram svg.
        hGsvg.append("g").attr("class", "x axis")
            .attr("transform", "translate(0," + hGDim.h + ")")
            .call(d3.svg.axis().scale(x).orient("bottom"));

        // Create function for y-axis map.
        var y = d3.scale.linear().range([hGDim.h, 0])
            .domain([0, d3.max(fD, function(d) { return d[1]; })]);

        // Create bars for histogram to contain rectangles and treatment_status labels.
        var bars = hGsvg.selectAll(".bar").data(fD).enter()
            .append("g").attr("class", "bar");

        //create the rectangles.
        bars.append("rect")
            .attr("x", function(d) { return x(d[0]); })
            .attr("y", function(d) { return y(d[1]); })
            .attr("width", x.rangeBand())
            .attr("height", function(d) { return hGDim.h - y(d[1]); })
            .attr('fill', barColor)
            .on("mouseover", mouseover) // mouseover is defined below.
            .on("mouseout", mouseout); // mouseout is defined below.

        //Create the treatment_status labels above the rectangles.
        bars.append("text").text(function(d) { return d3.format("")(d[1]) })
            .attr("x", function(d) { return x(d[0]) + x.rangeBand() / 2; })
            .attr("y", function(d) { return y(d[1]) - 5; })
            .attr("text-anchor", "middle");

        function mouseover(d) { // utility function to be called on mouseover.
            // filter for selected Politician (age_started).
            var st = fData.filter(function(s) { return s.Politician == d[0]; })[0],
                nD = d3.keys(st.tweets).map(function(s) { return { type: s, tweets: st.tweets[s] }; });

            // call update functions of pie-chart and legend.    
            pC.update(nD);
            console.log("mouseover" + nD);
            leg.update(nD);
        }

        function mouseout(d) { // utility function to be called on mouseout.
            // reset the pie-chart and legend.    
            pC.update(tF);
            leg.update(tF);
        }

        // create function to update the bars. This will be used by pie-chart.
        hG.update = function(nD, color) {
            console.log("hg.update function")
                // update the domain of the y-axis map to reflect change in treatment_status.
            y.domain([0, d3.max(nD, function(d) { return d[1]; })]);

            // Attach the new data to the bars.
            var bars = hGsvg.selectAll(".bar").data(nD);

            // transition the height and color of rectangles.
            bars.select("rect").transition().duration(500)
                .attr("y", function(d) { return y(d[1]); })
                .attr("height", function(d) { return hGDim.h - y(d[1]); })
                .attr("fill", color);

            // transition the treatment_status labels location and change value.
            bars.select("text").transition().duration(500)
                .text(function(d) { return d3.format("")(d[1]) })
                .attr("y", function(d) { return y(d[1]) - 5; });
        }
        return hG;
    }

    // PIE CHART FUNCTION
    function pieChart(pD) {
        var pC = {},
            pieDim = { w: 250, h: 250 };
        pieDim.r = Math.min(pieDim.w, pieDim.h) / 2;

        // create svg for pie chart.
        var piesvg = d3.select(id).append("svg")
            .attr("width", pieDim.w).attr("height", pieDim.h).append("g")
            .attr("transform", "translate(" + pieDim.w / 2 + "," + pieDim.h / 2 + ")");

        // create function to draw the arcs of the pie slices.
        var arc = d3.svg.arc().outerRadius(pieDim.r - 10).innerRadius(0);

        // create a function to compute the pie slice angles.
        var pie = d3.layout.pie().sort(null).value(function(d) { return d.tweets; });

        // Draw the pie slices.
        piesvg.selectAll("path").data(pie(pD)).enter().append("path").attr("d", arc)
            .each(function(d) { this._current = d; })
            .style("fill", function(d) { return segColor(d.data.type); })
            .on("mouseover", mouseover).on("mouseout", mouseout);

        // create function to update pie-chart. This will be used by histogram.
        pC.update = function(nD) {
                piesvg.selectAll("path").data(pie(nD)).transition().duration(500)
                    .attrTween("d", arcTween);
            }
            // Utility function to be called on mouseover a pie slice.
        function mouseover(d) {
            // call the update function of histogram with new data.
            hG.update(fData.map(function(v) {
                return [v.Politician, v.tweets[d.data.type]];
            }), segColor(d.data.type));
        }
        //Utility function to be called on mouseout a pie slice.
        function mouseout(d) {
            // call the update function of histogram with all data.
            hG.update(fData.map(function(v) {
                return [v.Politician, v.total];
            }), barColor);
        }
        // Animating the pie-slice requiring a custom function which specifies
        // how the intermediate paths should be drawn.
        function arcTween(a) {
            var i = d3.interpolate(this._current, a);
            this._current = i(0);
            return function(t) { return arc(i(t)); };
        }
        return pC;
    }

    // function to handle legend.
    function legend(lD) {
        var leg = {};

        // create table for legend.
        // THIS IS WHERE I CAN CHANGE THE LEGEND PLACEMENT
        var legend = d3.select(id).append("table").attr('class', 'legend');

        // create one row per segment.
        var tr = legend.append("tbody").selectAll("tr").data(lD).enter().append("tr");

        // create the first column for each segment.
        tr.append("td")
            .append("svg")
            .attr("width", '20')
            .attr("height", '20')
            .append("rect")
            .attr("width", '20')
            .attr("height", '20')
            .attr("fill", function(d) { return segColor(d.type); });

        // create the second column for each segment.
        tr.append("td").text(function(d) { return d.type; });

        // create the third column for each segment.
        tr.append("td").attr("class", 'legendFreq')
            .text(function(d) { return d3.format("")(d.tweets); });

        // create the fourth column for each segment.
        tr.append("td").attr("class", 'legendPerc')
            .text(function(d) { return getLegend(d, lD); });

        // Utility function to be used to update the legend.
        leg.update = function(nD) {
            // update the data attached to the row elements.
            var l = legend.select("tbody").selectAll("tr").data(nD);

            // update the treatment_status.
            l.select(".legendFreq").text(function(d) { return d3.format("")(d.tweets); });

            // update the percentage column.
            l.select(".legendPerc").text(function(d) { return getLegend(d, nD); });
        }

        function getLegend(d, aD) { // Utility function to compute percentage.
            return d3.format(".0%")(d.tweets / d3.sum(aD.map(function(v) { return v.tweets; })));
        }

        return leg;
    }

    // calculate total treatment_status by segment for all Politician (age_started).
    var tF = ['positive', 'negative'].map(function(d) {
        return { type: d, tweets: d3.sum(fData.map(function(t) { return t.tweets[d]; })) };
    });

    // calculate total treatment_status by Politician (age_started) for all segment.
    var sF = fData.map(function(d) { return [d.Politician, d.total]; });

    var pC = pieChart(tF), // create the pie-chart.
        hG = histoGram(sF), // create the histogram.
        leg = legend(tF); // create the legend.
}