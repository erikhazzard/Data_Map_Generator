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

//Setup SVG element area
var w = $('#map')[0].offsetWidth,
    h = $('#map')[0].offsetHeight,
    color = d3.scale.category10();

//Setup force
var force = d3.layout.force()
    .gravity(.01)
    .charge(-1)
    .size([w, h]);

//OLD: generate nodes
//d3.range(200).map(function() { return {radius: Math.random() * 12 + 4}; }),

//Setup nodes
var nodes = force.nodes();
var temp_continent_nodes = [{
    type: 0, 
    x: 200,
    y: 100,
    fixed: true },
{
    type: 1,
    x: 650,
    y: 250,
    fixed: true}];

//TODO: do this a beter way
//Add the continent nodes to the nodes list
for(var i=0; i<temp_continent_nodes.length; i++){
    nodes.push(temp_continent_nodes[i]);
}

var svg = d3.select("#map").append("svg:svg")
    .attr("width", w)
    .attr("height", h);

svg.append("svg:rect")
    .attr("width", w)
    .attr("height", h);

//Get the nodes
all_nodes = svg.selectAll("circle")
    .data(nodes)
  .enter().append("svg:circle")
    .attr("r", '40')
    .style("fill", function(d, i) { return color(i % 3); });

//---------------------------------------
//ADD COUNTRY NODES
//---------------------------------------
//Add nodes
for(var i=0; i < 50; i++){
    temp_node = {
        type: Math.round(Math.random() * 1),
        x: Math.round(Math.random() * 500),
        y: Math.round(Math.random() * 500)
    };

    svg.append("svg:circle")
        .data([temp_node])
        .attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; })
        .attr("r", 4.5)
        .style("fill", '#336699')

    nodes.push(temp_node);
}
force.start();

force.on("tick", function(e) {
    //Check for bounding box
    r = 40;

    //-----------------------------------
    //BOUNDING BOX
    //-----------------------------------

    //-----------------------------------
    //MOVE COUNTRIES TO RIGHT CONTINENT
    var k = e.alpha * .01;

    nodes.forEach(function(node) {
        //Check for bounding box
        //node.attr("cx", function(d) { return d.x = Math.max(r, Math.min(w - r, d.x)); })
        //    .attr("cy", function(d) { return d.y = Math.max(r, Math.min(h - r, d.y)); });
        node.x = Math.max(r, Math.min(w - r, node.x));
        node.y = Math.max(r, Math.min(h - r, node.y));

        //Move the country to the right continent
        if (node.type === 0) {

            //node.x += (temp_continent_nodes[0].x 
            //    - node.x) * k;
            //node.y += (temp_continent_nodes[0].y 
            //    - node.y) * k;
            
            node.x = Math.max(
                r,
                Math.min(
                    w-r,
                    (node.x + ((temp_continent_nodes[0].x 
                    - node.x) * k))
                ));
            node.y = Math.max(
                r, 
                Math.min(
                    h-r,
                    (node.y + ((temp_continent_nodes[0].y 
                    - node.y) * k))
                ));
        }
        if (node.type === 1) {
            node.x = Math.max(
                r,
                Math.min(
                    w-r,
                    (node.x + ((temp_continent_nodes[1].x 
                    - node.x) * k))
                ));
            node.y = Math.max(
                r, 
                Math.min(
                    h-r,
                    (node.y + ((temp_continent_nodes[1].y 
                    - node.y) * k))
                ));
        }
    });
    //-----------------------------------
    //Collision
    var q = d3.geom.quadtree(nodes),
        i = 0,
        n = nodes.length;
    while (++i < n) {
        q.visit(collide(nodes[i]));
    }
    //-----------------------------------

    //-----------------------------------
    //Move the circles
    svg.selectAll("circle")
        .attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; });
    //-----------------------------------
});

svg.on("mousemove", function() {
  var p1 = d3.svg.mouse(this);
    root = nodes[2]
  root.px = p1[0];
  root.py = p1[1];
  force.resume();
});


function collide(node) {
    //TODO: put this in a foreach loop? Change radius based on
    //  node radius
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
