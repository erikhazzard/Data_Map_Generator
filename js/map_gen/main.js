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
        //Data related
        //Skeleton definition for get_data function.
        //  Takes in a file name and calculates total percentages
        //      for continents and countries.  Sets the _data object
        //      and returns it;
        generate_data_and_map: function(params){
            data = undefined;
            return data;
        },
        data_convert_from_json: function(json_res){},
        data_convert_from_csv: function(json_res){},

        //Map Related
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


    //jagged_border_paths contains a has of continent_country IDs
    //  which have values of the path string used to create clipping / polygon
    //  paths
    jagged_border_paths: {

    },

    config: {
        //Force Diagram config
        //  How big to scale the country circles.  
        //  Smaller scale = larger circles
        //  (Note: This also sort of depends on the data.  
        //  The bigger the data set, the bigger the scale should
        //  be)
        force_diagram_country_scale: 1.8,

        //Convex hull generation config
        convex_hull_randomize_points: function(){
            return -15 + Math.random() * 30;
        },
        //  A distance factor of 1 will pretty much completely cover
        //  the entire continent, but may be 'too much' and cause
        //  overlaps for nearby continents
        convex_hull_distance_factor: 1.3,

        //-------------------------------
        //Jagged boreder config
        //-------------------------------
        jagged_step_amount: 7,
        jaggedness_factor: 2,

        //'Extra' randomness added to jaggedness
        //This extra randomness helps creates inlets and other border
        //  features
        //
        //  This percent specifies how often this extra randomness
        //  will occurr.  Specify a whole number from 0 to 100 (0 is
        //  never, 100 is every time)
        jagged_extra_random_percent_x: 20,
        jagged_extra_random_percent_y: 20,
        //Amount to multiple extra randomness
        //  This is the scale that the extra jaggedness will be set to
        //  2 would be twice the amount of the jagged_step_facor
        jagged_extra_random_scale_x: 3.5,
        jagged_extra_random_scale_y: 3.5
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
        file_name: 'dataset.json'

        //file_name: 'site_traffic.csv'
        //,data_conversion_func: MAP_GEN.functions.data_convert_from_csv
    });

    $(window).resize(function(){
        //Whenever the window is resized, call the generate_map function
        MAP_GEN.functions.generate_map(
            MAP_GEN._data    
        );
    });
});
