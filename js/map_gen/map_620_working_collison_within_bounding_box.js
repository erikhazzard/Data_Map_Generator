/* ========================================================================    
 *
 * generate_map.js
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

    var nodes = d3.range(200).map(function() { return {radius: Math.random() * 12 + 4}; }),
        color = d3.scale.category10();

    //Setup force
    var force = d3.layout.force()
        .gravity(0.05)
        .charge(function(d, i) { return i ? 0 : -2000; })
        .nodes(nodes)
        .size([w, h]);

    //Setup root node, which will be the node
    //  that all other nodes try to avoid
    var root = nodes[0];
    root.radius = 0;
    root.fixed = true;

    //Start the force
    force.start();
    
    //Setup the SVG element
    var svg = d3.select("#map").append("svg:svg")
        .attr("width", w)
        .attr("height", h);
    svg.append("svg:rect")
        .attr("width", w)
        .attr("height", h);

    //Add circles
    node = svg.selectAll("circle")
        .data(nodes.slice(1))
      .enter().append("svg:circle")
        .attr("r", function(d) { return d.radius - 2; })
        .style("fill", function(d, i) { return color(i % 3); });

    force.on("tick", function(e) {
      var q = d3.geom.quadtree(nodes),
          i = 0,
          n = nodes.length;

        //Run collision detection
        while (++i < n) {
            q.visit(collide(nodes[i]));
        }
        
        //Make sure everything is inside the bounding box
        node.attr("cx", function(d) { ;return d.x = Math.max(
                d.radius, Math.min(w - d.radius, d.x)); })
            .attr("cy", function(d) { return d.y = Math.max(
                d.radius, Math.min(h - d.radius, d.y)); });

      //Update the position of each circle
      svg.selectAll("circle")
          .attr("cx", function(d) { return d.x; })
          .attr("cy", function(d) { return d.y; });
    });

    //-----------------------------------
    //When mouse is moved, update position of the node that
    //  other nodes avoid
    //-----------------------------------
    svg.on("mousemove", function() {
      var p1 = d3.svg.mouse(this);
      root.px = p1[0];
      root.py = p1[1];
      force.resume();
    });

    //-----------------------------------
    //Collison Function
    //-----------------------------------
    function collide(node) {
      var r = node.radius + 16,
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
            node.x -= x *= l;
            node.y -= y *= l;
            quad.point.x += x;
            quad.point.y += y;
          }
        }
        return x1 > nx2
            || x2 < nx1
            || y1 > ny2
            || y2 < ny1;
      };
    }
        

}
