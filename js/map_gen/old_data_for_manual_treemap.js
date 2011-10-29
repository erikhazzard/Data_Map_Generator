/* ========================================================================    
 *
 * data.js
 * ----------------------
 *
 *  Functions related to data
 *
 * ======================================================================== */
//============================================================================
//generate_data
//============================================================================
MAP_GEN.functions.generate_data_and_map = function(params){
    //Take in file name direction, and generate an object containing the data
    //  and extra info about it (percentages, vaules)
    //Get parameters
    if(typeof(params) === 'string'){
        var directory = '';
        var file_name = params;
    }else if(typeof(params) === 'object'){
        var directory = params.directory;
        if(directory === undefined){
            directory = 'data/';
        }
        var file_name = params.file_name;
        if(file_name === undefined){
            file_name = 'dataset.json'; 
        }
        //TODO: Allow for passing if on keys for continents / countries / value 
        //  etc. 
    }

    //Keep track of the sum of all the values for all the continents
    var total_continents_value = 0;

    //Clear out any existing data object
    MAP_GEN._data = {};

    //Send a request to get the data.  When it finishes, perform operations
    //  on the data
    $.ajax({
        url: '/' + directory + file_name,
        type: 'GET',
        dataType: 'json',
        success: function(json_res){
            //We're assuming our data is set up a certain way here, so later we
            //  we can make this exensible
            var continents = json_res.fields[1].keys;
            var countries = json_res.fields[0].data;
            var values = json_res.fields[2].data;
            
            //---------------------------
            //Setup the _data object.  We'll determine percentages below
            //---------------------------
            for(item in continents){
                if(continents.hasOwnProperty(item)){
                    if(continents[item] !== '' 
                        && continents[item] !== null){
                        //Get the continent
                        if( MAP_GEN._data[continents[item]] === undefined){
                            //If the continent hasn't already been create, it,
                            //  create it
                            MAP_GEN._data[continents[item]] = {
                                value: 0,
                                percentage: 0
                            };
                        }

                        //And the country
                        //  Note: Countries are unique for each continent,
                        //  so we don't need to worry about defining them
                        //  multiple times
                        MAP_GEN._data[continents[item]][
                            countries[item]] = {
                                value: values[item],
                                percentage: 0
                            }

                        //Add the country's value to continent's value
                        MAP_GEN._data[continents[item]].value += values[item];
                        //Add to the total contients values so we can determine
                        //  percentages easier
                        total_continents_value += values[item];
                    }
                }
            }
            console.log(total_continents_value);
            //---------------------------
            //Determine percentages for continents and countries 
            //---------------------------
            for(item in MAP_GEN._data){
                //TODO: Normalize or weight the percentages so high numbers
                //  don't completely skew data

                if(MAP_GEN._data.hasOwnProperty(item)){
                    //Get percentage size for each continent
                    MAP_GEN._data[item].percentage = (
                        (MAP_GEN._data[item].value * 1.0) 
                        / total_continents_value);

                    //Get percentage size for each country
                    for(country in MAP_GEN._data[item]){
                        //Make sure we're looking at a country, not a
                        //  percentage or value property (meaning the
                        //  current country var must be an object)
                        if(MAP_GEN._data[item].hasOwnProperty(
                            country)){
                            //Do the type check after we make sure it has a 
                            //  property
                            if(typeof(MAP_GEN._data[item][country]) === 'object'){
                                //Set percentage for each country
                                MAP_GEN._data[item][country].percentage = (
                                    (MAP_GEN._data[item][country].value * 1.0)
                                    / MAP_GEN._data[item].value
                                );
                            } 
                        }
                    }
                }
            }

            //---------------------------
            //GENERATE MAP
            //---------------------------
            return MAP_GEN.functions.generate_map(
                MAP_GEN._data
            )

        },
        failure: function(){
            console.log('could not load data');
        }
    });
}
