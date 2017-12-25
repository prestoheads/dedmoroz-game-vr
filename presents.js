if (b4w.module_check("presents"))
    throw "Failed to register module: presents";

b4w.register("presents", function(exports, require) {

//var m_conf = require("game_config");
var m_trans = require("transform");
var m_ctl = require("controls");
var m_scs = require("scenes");
//var m_sfx = require("sfx");
var m_obj   = require("objects");

//var m_char = require("character");
var m_config        = require("game_config");
var m_main = require("game_main");
var m_train = require("train");

var _score = 0;
var _collector_presents = null;
    
var _presents_source = [];
var _random_sequense = [];
var _random_index = -1;
var _random_sequense_length = null;
var _presents_generation_marker = null;

var new_present_obj_tmp = null;

var _serie_x = 0, _serie_z = 0;
var _presents_genetated = 0;

var _presents_on_scene = [];

var _vec3_tmp = new Float32Array(3);

exports.init = function(elapsed_sensor) {
    _presents_source[0] = m_scs.get_object_by_name("PresentBlue");
    _presents_source[1] = m_scs.get_object_by_name("PresentGreen");
    _presents_source[2] = m_scs.get_object_by_name("PresentOrange");


    
    _random_sequense = [0.3793458374339087, 0.3248122616842415, 0.19378927296200876, 0.22424078426137717, 0.059703112159235516, 0.6873645935894619, 0.5552481230672832, 0.41937630872128406, 0.3328914017916229, 0.821689231664338];
    _random_sequense_length = _random_sequense.length;

    
}

function generate_present(x, y, z, present_ind, type_ind) {
    new_present_obj_tmp = m_obj.copy(_presents_source[type_ind], "present"+present_ind, false);
    m_scs.append_object(new_present_obj_tmp);
    m_trans.set_translation(new_present_obj_tmp, x, y, z);
    m_train.setup_collector_score(new_present_obj_tmp);

    _presents_on_scene.push(new_present_obj_tmp);

    // console.log("GEN", y);
}

function setup_serie() {
    _serie_x = get_random() * m_config.PRESENTS_CTREATE_WIDTH_H - m_config.PRESENTS_CTREATE_WIDTH_H / 2;
    _serie_z = get_random() * m_config.PRESENTS_CTREATE_WIDTH_V - m_config.PRESENTS_CTREATE_WIDTH_V / 2;

    //console.log("GEN SERIE", _serie_x, _serie_z);

}

exports.setup_presents_generation = function (elapsed_sensor) {
    //console.log("SETUP GEN");
    _presents_generation_marker = m_train.get_wrapper().translation;
    window._presents_generation_marker = _presents_generation_marker;

    var generate_sens_array = [elapsed_sensor];

    // manifold logic function
    var generate_sens_logic = function(s) {return (s[0]);}

    var elapsed;
    var dist_last_generated = 0;
    var dist_current = 0;

    function generate_cb(obj, id) {
        elapsed = m_ctl.get_sensor_value(obj, id, 0);

        dist_current = _presents_generation_marker[1] - m_config.PRESENTS_CTREATE_OFFSET;

        if(dist_current < dist_last_generated - m_config.PRESENTS_BETWEEN) {
            dist_last_generated = dist_current;
            _presents_genetated ++;
            if(_presents_genetated % m_config.PRESENTS_SERIES == 0) {
                setup_serie();
            }
            generate_present(_serie_x, dist_current, _serie_z, 
                _presents_genetated, _presents_genetated % 3);
        }

        // remove unused
        //if(_presents_on_scene.length > 0) {
            m_trans.get_translation(_presents_on_scene[0], _vec3_tmp);

            if((_presents_generation_marker[1] - _vec3_tmp[1]) < m_config.PRESENTS_REMOVE_OFFSET) {
                if(m_scs.check_object_by_name(m_scs.get_object_name(_presents_on_scene[0]))) {
                    m_scs.remove_object(_presents_on_scene[0]);
                } 
                _presents_on_scene[0] = null;
                delete _presents_on_scene[0];
                _presents_on_scene.splice(0, 1);
            }
        //}

        //console.log("REMOVE", _presents_generation_marker[1] - _vec3_tmp[1]);


    }

    m_ctl.create_sensor_manifold(null, "GENERATE_PRESENTS", m_ctl.CT_CONTINUOUS, 
        generate_sens_array, generate_sens_logic, generate_cb);
}


function get_next_random_index() {
    _random_index++;
    if(_random_index >= _random_sequense_length) {
        _random_index = _random_index%_random_sequense_length;
    }
    return _random_index;
}
function get_random() {
    var rnd = _random_sequense[get_next_random_index()];
    // console.log("PRESENTS RND", rnd);
    return rnd;
}
function get_random_int(int_from, int_to) {
    var rnd = Math.trunc(get_random()*(int_to-int_from)+int_from);
    console.log("PRESENTS", rnd);
    return rnd;
}

function setup_collector_score(present) {
    var sensor_impact = m_ctl.create_collision_sensor(present, "COLLECTOR_SCORE");
    var impact_sens_array = [sensor_impact];
    var impact_sens_logic = function(s) {return (s[0])};
    var obj_name = m_scs.get_object_name(present);
    var score_elem = document.getElementById("score");
    
    // callback
    function impact_cb(obj, manifold_id, pulse) {
        console.log("SCORE", _score, obj_name);
        m_scs.remove_object(obj);
        _score++;   // SCORE COUNT
        score_elem.innerHTML = _score;
        
    };


    m_ctl.create_sensor_manifold(present, "COLLECTOR_SCORE", m_ctl.CT_TRIGGER,
        impact_sens_array, impact_sens_logic, impact_cb);

}
    


})
