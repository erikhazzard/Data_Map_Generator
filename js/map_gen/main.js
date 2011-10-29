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
        }
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
    });

    $(window).resize(function(){
        //Whenever the window is resized, call the generate_map function
        MAP_GEN.functions.generate_map(
            MAP_GEN._data    
        );
    });
});
