if (b4w.module_check("bat"))
    throw "Failed to register module: presents";

b4w.register("bat", function(exports, require) {

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

var _lifes = 10;
var _collector_bats = null;
    
var _bat_source = [];
var _random_sequense = [];
var _random_index = -1;
var _random_sequense_length = null;
var _bats_generation_marker = null;

var new_bat_obj_tmp = null;

var _bat_x = 0, _bat_z = 0;
var _bats_genetated = 0;

var _bats_on_scene = [];

var _vec3_tmp = new Float32Array(3);

exports.init = function(elapsed_sensor) {
    _bat_source = m_scs.get_object_by_name("bat");


    
    _random_sequense = [0.3793458374339087, 0.3248122616842415, 0.19378927296200876, 0.22424078426137717, 0.059703112159235516, 0.6873645935894619, 0.5552481230672832, 0.41937630872128406, 0.3328914017916229, 0.821689231664338];
    _random_sequense_length = _random_sequense.length;

    
    //for(var i=0; i<10;i++) {
    //    _random_sequense.push(Math.random());
    //}
    //console.log("PRESENTS", _random_sequense);
    
    //init_present_cb(elapsed_sensor);
    /*
    var new_obj;
    var head_pos = null;
    var present_create_next_y = -(10), present_create_step = 5;
    function present_create_cb(obj, id) {
        var elapsed = m_ctl.get_sensor_value(obj, id, 0);
        head_pos = m_main.get_head_pos();
        if(head_pos[1]<present_create_next_y) {
            new_obj= m_obj.copy(_present_sources[get_random_int(0, 3)], "Present"+present_create_next_y, false);
            m_scs.append_object(new_obj);
            m_trans.set_translation(new_obj, 0, present_create_next_y-30, 0);

            //setup_collector_presents(new_obj);
            setup_collector_score(new_obj);
            
            console.log("PRESENTS", present_create_next_y);
            present_create_next_y -= present_create_step;
                
        }
           
    }
    m_ctl.create_sensor_manifold(null, "PRESENTS_CREATE", m_ctl.CT_CONTINUOUS,
                                 [elapsed_sensor], null, present_create_cb);
    */
    /*
    var new_obj;
    var rnd_dir, rnd_dist, rnd_cnt, rnd_fst;
    for(var i=1;i<=20;i++) {
        new_obj= m_obj.copy(_present_sources[get_random_int(0, 3)], "New_name"+i, false);
        m_scs.append_object(new_obj);
        m_trans.set_translation(new_obj, get_random()*3-1.5, -30-10*i, get_random()*3-1.5);

        setup_collector_presents(new_obj);
        setup_collector_score(new_obj);
    }
*/    
}

function generate_bat(x, y, z, bat_ind) {
    new_bat_obj_tmp = m_obj.copy(_bat_source, "bat"+bat_ind, false);
    m_scs.append_object(new_bat_obj_tmp);
    m_trans.set_translation(new_bat_obj_tmp, x, y, z);
    m_train.setup_collector_score(new_bat_obj_tmp);

    _bats_on_scene.push(new_bat_obj_tmp);

    // console.log("GEN", y);
}

function setup_bat() {
    _bat_x = get_random() * m_config.BAT_CTREATE_WIDTH_H - m_config.BAT_CTREATE_WIDTH_H / 2;
    _bat_z = get_random() * m_config.BAT_CTREATE_WIDTH_V - m_config.BAT_CTREATE_WIDTH_V / 2;

    //console.log("SETUP BAT", _bat_x, _bat_z);

}

exports.setup_bats_generation = function (elapsed_sensor) {
    _bats_generation_marker = m_train.get_wrapper().translation;

    var generate_sens_array = [elapsed_sensor];

    // manifold logic function
    var generate_sens_logic = function(s) {return (s[0]);}

    var elapsed;
    var dist_last_generated = 0;
    var dist_current = 0;

    function generate_cb(obj, id) {
        elapsed = m_ctl.get_sensor_value(obj, id, 0);

        dist_current = _bats_generation_marker[1] - m_config.BAT_CTREATE_OFFSET;

        if(dist_current < dist_last_generated - m_config.BAT_BETWEEN) {
            dist_last_generated = dist_current;
            _bats_genetated ++;
            setup_bat();
            generate_bat(_bat_x, dist_current, _bat_z, 
                _bats_genetated);
        }

        // remove unused
        if(_bats_on_scene.length > 0) {
            m_trans.get_translation(_bats_on_scene[0], _vec3_tmp);

            if((_bats_generation_marker[1] - _vec3_tmp[1]) < m_config.PRESENTS_REMOVE_OFFSET) {
                if(m_scs.check_object_by_name(m_scs.get_object_name(_bats_on_scene[0]))) {
                    m_scs.remove_object(_bats_on_scene[0]);
                } 
                _bats_on_scene[0] = null;
                delete _bats_on_scene[0];
                _bats_on_scene.splice(0, 1);
            }

        }

        //console.log("REMOVE", _bats_generation_marker[1] - _vec3_tmp[1]);


    }

    m_ctl.create_sensor_manifold(null, "GENERATE_BATS", m_ctl.CT_CONTINUOUS, 
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
    // console.log("BATS RND", rnd);
    return rnd;
}
function get_random_int(int_from, int_to) {
    var rnd = Math.trunc(get_random()*(int_to-int_from)+int_from);
    console.log("BATS RND INT", rnd);
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
