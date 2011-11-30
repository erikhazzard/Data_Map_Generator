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

    //Get width and height of the svg element
    var h = $('#map')[0].offsetHeight;
    var w = $('#map')[0].offsetWidth;

    //-----------------------------------
    //Create nodes for each continent. These are static nodes which
    //  country nodes will go to
    //-----------------------------------
    //Get the number of continents 
    var num_continents = MAP_GEN._data.children.length;
    //And colors for the cirlces
    var color = d3.scale.category10();

    //Show a status update
    MAP_GEN.functions.console_log('Creating treemap');

    //-----------------------------------
    //TREEMAP
    //
    //Get Treemap of data so we know starting positions for continents
    //-----------------------------------
    var treemap = d3.layout.treemap()
        .padding(4)
        .size([w, h])
        .value(function(d) { return d.size; });

    //Select and setup the svg element 
    var svg = d3.select("#treemap_hidden").append("svg:svg")
        .attr("width", w)
        .attr("height", h)
        .append("svg:g")
            .attr("transform", "translate(-.5,-.5)");

    //Store reference to cells 
    MAP_GEN.treemap_cells = []; 

    //Create a cell for each treemap element
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
    //FORCE CHART
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

        //Set a random y factor
        //  Don't place it too far above or below the center
        if(cur_cell.y < (h/2.5)){
            var random_factor_y = (Math.random() * 20) * -1;
        }else{
            var random_factor_y = (Math.random() * 100); 
        }

        //Set random x factor
        var random_factor_x = (Math.random() * 70);

        //====================================================================
        //Initial continent center points
        //====================================================================
        return {
            //type: Math.random() * num_continents | 0,
            radius: 0,
            fixed:true,
            //Type is from 0 to n, where n is the number of
            //  continents
            type:i,
            
            //Randomize: TODO? Improve randomization
            //x: Math.random() * w,
            //y: Math.random() * h
            
            //Set x,y to the tree map position
            //  Base in center of treemap, but randomize a bit
            x: (cur_cell.x + (cur_cell.dx / 2)) + random_factor_x,
            y: (cur_cell.y + (cur_cell.dy / 2)) + random_factor_y
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
    svg = d3.select("#map").append("svg:svg")
        .attr("width", w)
        .attr("height", h);

    //Store a reference to the svg
    MAP_GEN._svg = svg;

    //Add in circles for each continent
    var country_circles_group = MAP_GEN._svg.append('svg:g')
        .attr('id', 'country_circles_group');
    country_circles_group.selectAll("circle")
        .data(nodes)
        .enter().append("svg:circle")
            .attr("r", function(d) { return d.radius; })
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
                        //NOTE: We DONT add the very first node, because the
                        //  first node represents the continent centroid.
                        //  We only want country centroids
                        var temp_node = country_nodes[i];
                        //See if a list for the current country's continent
                        //  exist.  If not, this is the first iteration of a
                        //  country in a continent
                        if(MAP_GEN._polygon_data[temp_node.type] === undefined){
                            MAP_GEN._polygon_data[temp_node.type] = [];
                        }
                        //The array exists by now, so add the country info
                        // Note: DON'T add it if the radius is 0, which means
                        // the node is a continent centroid.  We want only
                        // country centroids
                        if(temp_node.radius > 0){
                            MAP_GEN._polygon_data[temp_node.type].push({
                                x: temp_node.x,
                                y: temp_node.y,
                                radius: temp_node.radius
                            })
                        }
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

    //========================================================================
    //
    //Create point for each country
    //
    //========================================================================
    for(var continent in MAP_GEN._data.children){
        if(MAP_GEN._data.children.hasOwnProperty(continent)){
            for(country in MAP_GEN._data.children[continent].children){
                if(MAP_GEN._data.children[continent].children.hasOwnProperty(
                    country)){
                    //Create points for each country
                    //TODO: Randomize position slightly
                    var x_pos = MAP_GEN.treemap_cells[continent].children[ country].x 
                        + Math.random() * 1; 
                    var y_pos = MAP_GEN.treemap_cells[continent].children[
                        country].y
                        + Math.random() * 1;

                    var node = {
                        //---------------
                        //SET RADIUS
                        //(Important): Set sisze of each country
                        //---------------
                        //TODO: Use some sort of log like scale to size countries
                        //  so they are still porportional, but small ones don't
                        //  get too distorted by large data
                        //Set radius based on country percentage of total data
                        radius: MAP_GEN._data.children[
                            continent].children[country].percentage * (
                                //Multiply the percentage of each country by the
                                //  average viewport size ( w + h / 2), and then
                                //  divide that value so the radius isn't so big
                                //NOTE:
                                //  the last number is a scaling factor. The 
                                //  smaller the factor, the larger the country
                                //  circles will be
                                (w + (h / 2)) / 1.4
                            ),
                        type: continent,
                        x: x_pos,
                        y: y_pos,
                        px: x_pos,
                        py: y_pos
                    };


                    //-------------------
                    //Draw circles for each country
                    //-------------------
                country_circles_group.append("svg:circle")
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
    var continent_vertices = [];
    var country_vectex = [];
    var random_factor = undefined;


    //IN PROGRESS NOTE: Here we're creating paths for
    //  the continent borders and the clipping.  
    //  We have one group for each.  This works OK, but 
    //  we run into issues if continents are close together then
    //  the voronoi paths will show up in continents that they
    //  shouldn't
    //
    //  So, create multiple clipping paths, one for each continent
    
    //Create another group that will draw the continent borders (the 
    //  group we created above will clip the continent polygons)
    var continent_group_border = MAP_GEN._svg.append('svg:g')
        .attr('id', 'continent_borders_group');

    //Create a group for the continent polygons
    var continent_group_clip = MAP_GEN._svg.append('svg:clipPath')
        .attr('id', 'continent_borders_clip');
    
    //Create a group for EACH continent polygon
    var continent_group_clip_array = [];
    //NOTE: Because we'll be applying a clip path to EACH voronoi
    //  diagram path, we gotta make sure that we have a clip path for
    //  EACH _country_, which will be the clipping path for its parent
    //  continent
    var clip_index_count = 0;

    for(i in MAP_GEN._polygon_data){
        if(MAP_GEN._polygon_data.hasOwnProperty(i)){
            for(j in MAP_GEN._polygon_data[i]){
                if(MAP_GEN._polygon_data[i].hasOwnProperty(j)){
                    //Add a clip path for each continent group
                    continent_group_clip_array.push(
                        MAP_GEN._svg.append('svg:clipPath')
                            .attr('id', 'continent_borders_clip_'
                                + clip_index_count)
                    );
                    clip_index_count += 1;
                }
            }
        }
    }
    //Reset the clip_index_count, since we'll be using it again below
    clip_index_count = 0;

    //-----------------------------------
    //Convex hull data
    //-----------------------------------
    //TODO: Jagged Lines
    //For the jagged lines, we need to create random points between each
    //  vertex
    //Setup vertices based on polygon data of each country
    for(i in MAP_GEN._polygon_data){
        if(MAP_GEN._polygon_data.hasOwnProperty(i)){
            //Go through each country and add to vertices
            for(j in MAP_GEN._polygon_data[i]){
                if(MAP_GEN._polygon_data[i].hasOwnProperty(j)){
                    //Store reference to this current country polygon
                    country_vertex = MAP_GEN._polygon_data[i][j]; 
                    //Add the current vertex to the list of hull vertices
                    c_v_x = country_vertex.x;
                    c_v_y = country_vertex.y;
                    random_factor = function(){ 
                        return -7 + Math.random() * 14;
                    }

                    //The radius (c_v_r) determines how far out to place the
                    //  vertices for the convex hull.  The larger the radius,
                    //  the further out the convex hull will extent.  
                    //  A radius of 1 will pretty much completely cover
                    //  the entire continent, but may be 'too much' and cause
                    //  overlaps for nearby continents
                    c_v_r = country_vertex.radius / 1.3;
                    
                    //TODO: Create multiple verties for each country
                    //TODO: Do this better, also create more vertices
                    continent_vertices.push([
                        (c_v_x + random_factor()) 
                            - (c_v_r + random_factor()),
                        (c_v_y + random_factor())
                            - (c_v_r + random_factor())
                    ]);
                    continent_vertices.push([
                        (c_v_x + random_factor()) 
                            + (c_v_r + random_factor()),
                        (c_v_y + random_factor())
                            - (c_v_r + random_factor())
                    ]);
                    continent_vertices.push([
                        (c_v_x + random_factor()) 
                            + (c_v_r + random_factor()),
                        (c_v_y + random_factor())
                            + (c_v_r + random_factor())
                    ]);
                    continent_vertices.push([
                        (c_v_x + random_factor()) 
                            - (c_v_r + random_factor()),
                        (c_v_y + random_factor())
                            + (c_v_r + random_factor())
                    ]);

                }
            }

            //Now we've created the continent vertices, we'll need to
            //  loop each country in the continent again to set up the
            //  clip path
            for(j in MAP_GEN._polygon_data[i]){
                if(MAP_GEN._polygon_data[i].hasOwnProperty(j)){
                    continent_group_clip_array[clip_index_count].selectAll(
                        "path" + clip_index_count)
                      .data([d3.geom.hull(continent_vertices)])
                      .attr("d", function(d) { return "M" + d.join("L") + "Z"; })
                      .enter().append("svg:path")
                        .attr('class', 'continent_clip_path')
                        .attr("d", function(d) { return "M" + d.join("L") + "Z"; });

                    //We're done with the clipping path array item, so increase
                    //  the count for it
                    clip_index_count += 1;
                }
            }


            //-----------------------------------
            //Create Clipping Paths and Polygon
            //-----------------------------------
            //CLIPPING PATH
            //Create a convex hull based on the current continent's countries
            //Set up the clip, which will limit what the coronoi diagram shows
            continent_group_clip.selectAll("path" + i)
              .data([d3.geom.hull(continent_vertices)])
              .attr("d", function(d) { return "M" + d.join("L") + "Z"; })
              .enter().append("svg:path")
                .attr('class', 'continent_clip_path')
                .attr("d", function(d) { return "M" + d.join("L") + "Z"; });

            //POLYGON BORDER
            //Do it again for just the border


            //TODO:Create continent border hull, then get the coords for each point
            //  then randomize borders between points

            
            //Reset the continent vertices for the next iteration
            continent_vertices = [];
        }
    }

    //Hide the county circles
    d3.select('#country_circles_group').selectAll('circle').style(
        'fill', 'none');
    
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
    vertices = [];
    //TODO: Add points right outside the polygons so the voronoi diagram 
    //  doesn't get messed up?
    for(var continent in MAP_GEN._polygon_data){
        if(MAP_GEN._polygon_data.hasOwnProperty(continent)){
            for(country in MAP_GEN._polygon_data[continent]){
                if(MAP_GEN._polygon_data[continent].hasOwnProperty(country)){
                    //Add the polygon center point vertex to the vertices array
                    vertices.push([
                        MAP_GEN._polygon_data[continent][country].x,
                        MAP_GEN._polygon_data[continent][country].y
                    ]);
                }
            }
        }
    }

    var country_group = MAP_GEN._svg.append('svg:g')
        //OLD WAY: Apply a clip path to ONLY the entire voronoi diagram
        //NEW WAY: Apply a clip path to each voronoi path based on its
        //  parent continent.  See the code below
        //NOTE: We'll still need to apply a clipping path to the entire
        //  diagram 
        //.attr('clip-path', 'url(#continent_borders_clip)')
        .attr('id', 'country_borders_group');

    //Add countries to the group
    country_group.selectAll(".country_border")
        .data(d3.geom.voronoi(vertices))
        .enter().append("svg:path")
            .attr("class", function(d, i) { 
                return i ? "q" + (i % 9) + "-9 country_border" : "country_border"; 
            })
            .attr('clip-path', function(d,i){
                return "url(#continent_borders_clip_" + i + ")";
            })
            .attr("d", function(d) { 
                // d contains an array of points
                //  so let's just add some new points in between each set
                var data_points = [];
                var d_length=d.length;

                for(var i=0; i<d_length; i++){
                    //Push the first point
                    data_points.push(d[i]);

                    //Randomize the borders a little bit.
                    //Push a point in between this index and the next
                    /*
                    if(i + 1 !== d_length){
                        data_points.push([
                            //push x
                            ((d[i][0] + d[i+1][0]) / 2) + 2,
                            //push y
                            ((d[i][1] + d[i+1][1]) / 2) + 2
                        ]);
                    }
                    */
                }

                return "M" + data_points.join("L") + "Z"; 
            });

    MAP_GEN.functions.console_log('Completed drawing map!', true); 
}
