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
    //Reset the flag that keeps track if a convex hull has been created
    //  for the continent
    MAP_GEN.map_params.continent_convex_hull_func_called = false;

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
            x: (cur_cell.x + (cur_cell.dx / 2)) + (Math.random() * 50),
            y: (cur_cell.y + (cur_cell.dy / 2)) + (Math.random() * 50)
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

    //Store a reference to the svg
    MAP_GEN._svg = svg;

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
            k = e.alpha * 1.5,
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
            //Call the convex hull creation function if it hasn't been
            //  called yet
            if(MAP_GEN.map_params.continent_convex_hull_func_called === false){
                //Get x,y, and radius values for each country
                //Store a copy of the nodes
                var country_nodes = force.nodes();
                for(i in country_nodes){
                    if(country_nodes.hasOwnProperty(i)){
                        var temp_node = country_nodes[i];
                        //See if a list for the current country's continent
                        //  exist.  If not, this is the first iteration of a
                        //  country in a continent
                        if(MAP_GEN._polygon_data[temp_node.type] === undefined){
                            MAP_GEN._polygon_data[temp_node.type] = [];
                        }
                        //The array exists by now, so add the country info
                        MAP_GEN._polygon_data[temp_node.type].push({
                            x: temp_node.x,
                            y: temp_node.y,
                            radius: temp_node.radius
                        })
                    }
                }

                //Show a status update
                MAP_GEN.functions.console_log('Force diagram finished');

                //Setup convex hull functions
                MAP_GEN.functions.generate_continent_convex_hulls();
            }
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
                    var x_pos = MAP_GEN.treemap_cells[continent].children[
                        country].x 
                        + Math.random() * 1; 
                    var y_pos = MAP_GEN.treemap_cells[continent].children[
                        country].y
                        + Math.random() * 1;

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
/* ========================================================================    
 *
 * generate_continent_convex_hulls()
 *
 * ======================================================================== */
MAP_GEN.functions.generate_continent_convex_hulls = function(){
    //Generate convex hulls for each continent.  The convex hull will be
    //  generated from vertices from each country.  These vertices will be
    //  generated by creating a bunch of points around the circle, using
    //  the country's center point, radius, and various angles to generate
    //  vertices
    MAP_GEN.map_params.continent_convex_hull_func_called = true;
    //Loop through each continent
    console.log('generate called'); 

    var h = $('#map')[0].offsetHeight;
    var w = $('#map')[0].offsetWidth;

    /*
    var vertices = d3.range(15).map(function(d) {
        return [
            //x, y
        ];
    });
    */
    var continent_vertices = [];
    var country_vectex = [];

    //Setup vertices based on polygon data of each country
    for(i in MAP_GEN._polygon_data){
        if(MAP_GEN._polygon_data.hasOwnProperty(i)){
            //Go through each country and add to vertices
            for(j in MAP_GEN._polygon_data[i]){
                if(MAP_GEN._polygon_data[i].hasOwnProperty(j)){
                    //Store reference to this current country polygon
                    country_vertex = MAP_GEN._polygon_data[i][j]; 
                    //Add the current vertex to the list of hull vertices

                    //TODO: Create multiple verties for each country
                    //TODO: Do this better, also create more vertices
                    continent_vertices.push([
                        country_vertex.x - country_vertex.radius, 
                        country_vertex.y - country_vertex.radius
                    ]);
                    continent_vertices.push([
                        country_vertex.x + country_vertex.radius, 
                        country_vertex.y - country_vertex.radius
                    ]);
                    continent_vertices.push([
                        country_vertex.x + country_vertex.radius, 
                        country_vertex.y + country_vertex.radius
                    ]);
                    continent_vertices.push([
                        country_vertex.x - country_vertex.radius, 
                        country_vertex.y + country_vertex.radius
                    ]);
                }
            }

            //TODO: Jagged Lines

            //Create a convex hull based on the current continent's countries
            MAP_GEN._svg.selectAll("path" + i)
              .data([d3.geom.hull(continent_vertices)])
              .attr("d", function(d) { return "M" + d.join("L") + "Z"; })
              .enter().append("svg:path")
                .attr("d", function(d) { return "M" + d.join("L") + "Z"; });
            
            //Reset the continent vertices for the next iteration
            continent_vertices = [];
        }
    }
    
    //Draw voronoi diagram
    MAP_GEN.functions.generate_voronoi_countries();
}


/* ========================================================================    
 *
 * generate_voronoi_countries()
 *
 * ======================================================================== */
MAP_GEN.functions.generate_voronoi_countries = function(){
    //Show status update
    MAP_GEN.functions.console_log('Drawing voronoi diagram for countries');

    var h = $('#map')[0].offsetHeight;
    var w = $('#map')[0].offsetWidth;

    //Set vertices for each country of each continent
    //FOR NOW, use one continent
    vertices = [];
    for(var continent in MAP_GEN._polygon_data){
        if(MAP_GEN._polygon_data.hasOwnProperty(continent)){
            for(country in MAP_GEN._polygon_data[continent]){
                if(MAP_GEN._polygon_data[continent].hasOwnProperty(country)){
                    vertices.push([
                        MAP_GEN._polygon_data[continent][country].x,
                        MAP_GEN._polygon_data[continent][country].y
                    ]);
                }
            }
        }
    }

    MAP_GEN._svg.selectAll("path")
        .data(d3.geom.voronoi(vertices))
      .enter().append("svg:path")
        .attr("class", function(d, i) { return i ? "q" + (i % 9) + "-9" : null; })
        .attr("d", function(d) { return "M" + d.join("L") + "Z"; });

    /* Draw circles for diagram.  Dont need to do this.
    MAP_GEN._svg.selectAll("circle")
        .data(vertices)
      .enter().append("svg:circle")
        .attr("transform", function(d) { return "translate(" + d + ")"; })
        .attr("r", 2);
    */
}
