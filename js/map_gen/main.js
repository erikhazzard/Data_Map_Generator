/* ========================================================================    
 *
 * main.js
 * ----------------------
 *
 *  Main 'bootstrapping' script for OLArchitect
 *
 * ======================================================================== */
//============================================================================
//Main App Object
//============================================================================
MAP_GEN = {
    //MAP_GEN is the name space for this app.  
    //
    //define the _data object, which is contains all the continents, countries,
    //  and info about htem
    //  NOTE: this is just a skeleton definition, the actual object will be 
    //      recreated in the get_data() function
    _data: {
        continent_name: {
            value: 1000,
            percentage: .4,
            countries: {
                country_name: {
                    value: 300,
                    percentage: .2
                }
            }
        }
    },

    _polygon_data: {},

    //Reference to SVG element
    _svg: undefined,

    //Functions
    functions: {
        //Skeleton definition for get_data function.
        //  Takes in a file name and calculates total percentages
        //      for continents and countries.  Sets the _data object
        //      and returns it;
        generate_data_and_map: function(params){
            data = undefined;
            return data;
        },
        generate_map: function(map_data){
            //This function does all the heavy duty of generating the map
            //  defined in generate_map.js
        },
        generate_continent_convex_hulls: function(){
           //Function to generate convex hulls for continents.  Defined in
           //   map.js
        },
        generate_voronoi_countries: function(){
            //Function that creates a voronoi diagram for country borders
        },
        console_log: function(message, hide_loading_bar){
            if(hide_loading_bar === undefined){
                var hide_loading_bar = false;
            }
            //Logs a message to the console div
            $('#footer #console #console_text').html(message);

            if(hide_loading_bar === true){
                $('#console_loading_bar').css('display','none');
            }
        }
    },

    map_params: {
        continent_convex_hull_func_called: false
    },

    config: {
        //Force Diagram config
        //  How big to scale the country circles.  
        //  Smaller scale = larger circles
        //  (Note: This also sort of depends on the data.  
        //  The bigger the data set, the smaller the scale should
        //  be)
        force_diagram_country_scale: 2.7,

        //Convex hull generation config
        convex_hull_randomize_points: function(){
            return -16 + Math.random() * 32;
        },
        //  A distance factor of 1 will pretty much completely cover
        //  the entire continent, but may be 'too much' and cause
        //  overlaps for nearby continents
        convex_hull_distance_factor: 1.2,

        //Jagged boreder config
        jagged_step_amount: 14,
        jaggedness_factor: 8
    }
};

//============================================================================
//
//UTILITY Functions
//
//============================================================================

//============================================================================
//
//Page setup
//
//============================================================================
//============================================================================
//Page Resize (call generate_map)
//============================================================================
//============================================================================
//Page Load
//============================================================================
$(document).ready(function(){
    //When page loads, call generate data func to setup data and generate
    //  the map
    MAP_GEN.functions.generate_data_and_map({
        directory: 'data/',
        file_name: 'dataset_simple.json'
    });

    $(window).resize(function(){
        //Whenever the window is resized, call the generate_map function
        MAP_GEN.functions.generate_map(
            MAP_GEN._data    
        );
    });
});
