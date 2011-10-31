/* ========================================================================    
 *
 * map.js
 * ----------------------
 *
 * Function definition to generate the actual map
 *
 * ======================================================================== */
MAP_GEN.functions.generate_map = function( map_data ){
    //If no data object was passed in, use the MAP_GEN._data object
    if(map_data === undefined){
        //Store local reference to map data
        var map_data = MAP_GEN._data;
    }

    //Empty the map div each time this function gets called
    $('#map').empty();

    var h = $('#map')[0].offsetHeight;
    var w = $('#map')[0].offsetWidth;

    //-----------------------------------
    //Create nodes for each continent. These are static nodes which
    //  country nodes will go to
    //-----------------------------------
    var num_continents = MAP_GEN._data.children.length;
    var color = d3.scale.category10();

    //Show a status update
    MAP_GEN.functions.console_log('Creating treemap');

    //-----------------------------------
    //Get Treemap of data so we know starting positions for continents
    //-----------------------------------
    //TODO: BUG? Multiple treemaps generated?
    var treemap = d3.layout.treemap()
        .padding(4)
        .size([w, h])
        .value(function(d) { return d.size; });

    var svg = d3.select("#treemap_hidden").append("svg:svg")
        .attr("width", w)
        .attr("height", h)
        .append("svg:g")
            .attr("transform", "translate(-.5,-.5)");

    //Store reference to cells 
    MAP_GEN.treemap_cells = []; 

    var cell = svg.data([MAP_GEN._data]).selectAll("g")
        .data(treemap)
        .enter().append("svg:g")
            .attr("class", "cell")
            .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

    cell.append("svg:rect")
        .attr("width", function(d) { return d.dx; })
        .attr("height", function(d) { return d.dy; })
        .style("fill", function(d) { return d.children ? color(d.data.name) : null; })
        .attr('', function(d){
            //TODO: Do this the right way....
            if(d.children && d.parent !== undefined){
                MAP_GEN.treemap_cells.push(d);
            }
        });

    //-----------------------------------
    //
    //Create force chart to lay out continents
    //
    //-----------------------------------
    //Show a status update
    MAP_GEN.functions.console_log('Creating force chart');
    //Create nodes for continents
    var nodes = d3.range(num_continents).map(function(i) {
        //Store reference to current cell
        var cur_cell = MAP_GEN.treemap_cells[i];

        return {
            //type: Math.random() * num_continents | 0,
            radius: 5,
            fixed:true,
            //Type is from 0 to n, where n is the number of
            //  continents
            type:i,
            //Set x,y to the tree map position
            //x: (cur_cell.x + (cur_cell.dx / 2)),
            //y: (cur_cell.y + (cur_cell.dy / 2))
            
            //Randomize: TODO? Improve randomization
            //x: Math.random() * w,
            //y: Math.random() * h
            
            //Base in center of treemap, but randomize a bit
            x: (cur_cell.x + (cur_cell.dx / 2)) + (Math.random() * 200),
            y: (cur_cell.y + (cur_cell.dy / 2)) + (Math.random() * 100)
        };
    });

    //Setup force
    var force = d3.layout.force()
        .gravity(0)
        .charge(0)
        .nodes(nodes)
        .size([w, h]);

    force.start();

    //Create SVG element
    var svg = d3.select("#map").append("svg:svg")
        .attr("width", w)
        .attr("height", h);
    svg.append("svg:rect")
        .attr("width", w)
        .attr("height", h);

    //Add in some circles
    all_selected_nodes = svg.selectAll("circle")
        .data(nodes)
        .enter().append("svg:circle")
            .attr("r", function(d) { return d.radius - 2; })
            .style("fill", function(d, i) { return color(d.type); });

    //-----------------------------------
    //Tick function
    //-----------------------------------
    force.on("tick", function(e) {
        //Setup some config variables
        var q = d3.geom.quadtree(nodes),
            //k determines how fast to run the force diagram
            k = e.alpha * .2,
            i = 0,
            n = nodes.length,
            o;

        //Run collison detection
        while (++i < n) {
            o = nodes[i];
            if (o.fixed) continue;
            c = nodes[o.type];
            //Set position
            //o.x += (c.x - o.x) * k;
            //o.y += (c.y - o.y) * k;

            //CHECK FOR BOUNDING BOX
            o.x = Math.max(
                o.radius, Math.min(w-o.radius,
                    o.x + ((c.x - o.x) * k))
            );

            o.y = Math.max(
                o.radius, Math.min(h-o.radius,
                    o.y + ((c.y - o.y) * k))
            );

            q.visit(collide(o));
        }

        //When the force is over, trigger function to 
        //  draw convex hull
        if(e.alpha < 0.0050037){
            console.log(e.alpha);
            console.log('stop');
        }

        //Move all the circles
        svg.selectAll("circle")
            .attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; });
    });

    //-----------------------------------
    //Create point for each country
    //-----------------------------------
    for(var continent in MAP_GEN._data.children){
        if(MAP_GEN._data.children.hasOwnProperty(continent)){
            for(country in MAP_GEN._data.children[continent].children){
                if(MAP_GEN._data.children[continent].children.hasOwnProperty(
                    country)){
                    //Create points for each country
                    //TODO: Randomize position slightly
                    var x_pos = MAP_GEN.treemap_cells[continent].x 
                        + Math.random() * 10; 
                    var y_pos = MAP_GEN.treemap_cells[continent].y
                        + Math.random() * 10;

                    var node = {
                        //radius:Math.random() * 12 + 4, 
                        //Set radius based on country percentage of total data
                        radius: MAP_GEN._data.children[
                            continent].children[country].percentage * (
                                //Multiply the percentage of each country by the
                                //  average viewport size ( w + h / 2), and then
                                //  divide that value so the radius isn't so big
                                (w + (h / 2)) / 2
                            ),
                        type: continent,
                        x: x_pos,
                        y: y_pos,
                        px: x_pos,
                        py: y_pos
                    };

                  svg.append("svg:circle")
                      .data([node])
                      .attr("cx", function(d) { return d.x; })
                      .attr("cy", function(d) { return d.y; })
                      .attr("r", function(d) { return d.radius - 2; })
                      .style("fill", function(d) {return color(d.type);})

                  nodes.push(node);
                }
            }
        }
    }
    //Resume the force
    force.resume();

    //Show a status update
    MAP_GEN.functions.console_log('Map generation finished');

    //========================================================================
    //Collision function
    //========================================================================
    function collide(node) {
        var r = node.radius + 5,
          nx1 = node.x - r,
          nx2 = node.x + r,
          ny1 = node.y - r,
          ny2 = node.y + r;
      return function(quad, x1, y1, x2, y2) {
        if (quad.point && (quad.point !== node)) {
          var x = node.x - quad.point.x,
              y = node.y - quad.point.y,
              l = Math.sqrt(x * x + y * y),
              r = node.radius + quad.point.radius;
          if (l < r) {
            l = (l - r) / l * .5;
            node.px += x * l;
            node.py += y * l;
          }
        }
        return x1 > nx2
            || x2 < nx1
            || y1 > ny2
            || y2 < ny1;
      };
    }

}
