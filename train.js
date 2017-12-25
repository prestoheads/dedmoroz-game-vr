"use strict"

if (b4w.module_check("train"))
    throw "Failed to register module: train";

b4w.register("train", function(exports, require) {

var m_ctl           = require("controls");
var m_phy           = require("physics");
var m_cons          = require("constraints");
var m_scs           = require("scenes");
var m_trans         = require("transform");
var m_cam           = require("camera");
var m_vec3          = require("vec3");
var m_vec4          = require("vec4");
var m_quat          = require("quat");
var m_util          = require("util");
var m_mat           = require("material");

//var m_sfx = require("sfx");
//var m_obj   = require("objects");

var m_config        = require("game_config");
//var m_dummy_game        = require("dummy_game_main");
var m_environment   = require("environment");
var m_interface     = require("interface");

var _train_wrapper      = null;
var _wagon_01_wrapper   = null;
var _wagon_02_wrapper   = null;

var _vec2_tmp = new Float32Array(2);
var _vec3_tmp = new Float32Array(3);
var _vec3_tmp_2 = new Float32Array(3);
var _vec3_tmp_3 = new Float32Array(3);
var _quat4_tmp = new Float32Array(4);

var _score = 0;
var _lifes = 3;

exports._need_hide_help = false;

exports.init_wrapper = function() {
    _train_wrapper = {
        p_body:         m_scs.get_first_character(),
        body:           m_scs.get_object_by_name("train_body"),
        //hook:           m_scs.get_object_by_dupli_name("train", "train_hook"),
        //picker:         m_scs.get_object_by_dupli_name("train", "train_picker"),
        move_type:      m_config.CM_FLY,
        fly_velocity:   m_config.FLY_VELOCITY,
        translation:    m_vec3.create(), 
        rotation:       m_config.TRAIN_DEF_ROT, 
        score:          m_config.SCORE,
        state:          m_config.TS_JUST_STARTED,
        //position_to_stabilise_h:   null,
        //position_to_stabilise_v:   null,
        //rotation_to_stabilise_h:   null,
        //rotation_to_stabilise_v:   null,
        force_to_stabilise_h:       null,
        force_to_stabilise_v:       null,
        distance_to_stabilise:      null,
        after_rotaion:              0,
        obj_last_collide_name:      ""
    };
    

    _wagon_01_wrapper = {
        body:           m_scs.get_object_by_name("wagon_01"),
        //hook:           m_scs.get_object_by_name("wagon_hook"),
        offset:         new Float32Array([0, 0]),
        rotation:       new Float32Array([0, 0, 0, 1]) 
    };

}

exports.setup_controls = function (elapsed_sensor) {
    // set char fly velocity
    m_phy.set_character_fly_velocity(_train_wrapper.p_body, _train_wrapper.fly_velocity);

    var left_arrow  = m_ctl.create_custom_sensor(0);
    var right_arrow = m_ctl.create_custom_sensor(0);
    var up_arrow    = m_ctl.create_custom_sensor(0);
    var down_arrow  = m_ctl.create_custom_sensor(0);

    //m_interface.setup_arrow_sensors(left_arrow, right_arrow, up_arrow, down_arrow);

    setup_rotation(left_arrow, right_arrow, up_arrow, down_arrow, elapsed_sensor);
    setup_constant_movement(elapsed_sensor);

    // setup pink train
    //window.pink = true;
    if(window.pink) {
        m_mat.set_nodemat_value(
            _train_wrapper.body, 
            ["SteamengineMaterial", "SteamEnginePink"], 1);
        m_mat.set_nodemat_value(
            _wagon_01_wrapper.body, 
            ["WagonMaterial", "WagonPinkValue"], 1);
    }

}


exports.setup_collector_score = function (present) {
    var sensor_impact = m_ctl.create_collision_sensor(present, "SCORE");
    var impact_sens_array = [sensor_impact];
    var impact_sens_logic = function(s) {return (s[0])};
    var score_elem = document.getElementById("points");
    var lifes_elem = document.getElementById("trains");

    var obj_translation = m_vec3.create();
    m_trans.get_translation(present, obj_translation);
    var obj_name = m_scs.get_object_name(present);
    
    // callback
    function impact_cb(obj, manifold_id, pulse) {
        //console.log("SCORE", _score, obj_name);
        if(obj_name == _train_wrapper.obj_last_collide_name) {
            return;
        } else {
            _train_wrapper.obj_last_collide_name = obj_name;
        }

        //console.log(obj_translation);
        obj_translation[1] += m_config.PRESENTS_IMPACT_OFFSET;
        m_trans.set_translation_v(obj, obj_translation);

        // Move Dummy
        if(window.move_dummy) {
            window.move_dummy(obj_name, obj_translation);
        }

        if(obj_name.substring(0, 1) == 'b') {
            //m_scs.remove_object(obj);

            _lifes--;
            if(_lifes >= 0) {
                lifes_elem.className = "t-"+_lifes;
                if(_lifes == 0) {
                    if(window.game_over) {
                        window.game_over(_score);
                    }
                }
            }
        } else {
            //m_scs.remove_object(obj);
            //m_trans.get_translation(obj, obj_translation);

            _score++;   // SCORE COUNT
            score_elem.innerHTML = _score;
            window.game_score = _score;
        }
    };


    m_ctl.create_sensor_manifold(present, "PRESENT", m_ctl.CT_TRIGGER,
        impact_sens_array, impact_sens_logic, impact_cb);

}

function setup_constant_movement(elapsed_sensor) {
    // make char fly
    m_phy.set_character_move_type(_train_wrapper.p_body, _train_wrapper.move_type);

    var move_sens_array = [elapsed_sensor];

    // manifold logic function
    var move_sens_logic = function(s) {return (s[0]);}

    //var camera = m_scs.get_active_camera();
    //var angles;
    var stabilise_factor = 1;
    var dist = 0;

    var force_to_apply = new Float32Array([0, 0, 0]);

    var mouse_location = m_interface.get_mouse_location();
    var target_rotation = new Float32Array([0, 0, 0]);

    var elapsed;

    window.game_go = true;

    function move_cb(obj, id) {
        elapsed = m_ctl.get_sensor_value(obj, id, 0);

        
        if(window.game_go) {
            // make the character go go go!!!
            m_phy.set_character_move_dir(obj, 1, 0);
        }

        
        // store train translation & rotation for other use
        m_trans.get_translation(obj, _train_wrapper.translation);
        m_trans.get_rotation(obj, _train_wrapper.rotation);
        
        m_phy.set_character_vert_move_dir_angle(obj, _train_wrapper.rotation[0]);
        //console.log("TRAIN DIST, T", dist, _train_wrapper.rotation);


        // make land and sky follow the train
        m_environment.set_world_position(_train_wrapper.translation[1]);

        /*
        m_environment.set_land_rotation(
            _train_wrapper.translation[1],
            _train_wrapper.translation[0]
        );
        */


            // clip return force
            /*
            if(force_to_apply[0] < -m_config.TUNNEL_FORCE_CLIP[0]) {
                force_to_apply[0] = -m_config.TUNNEL_FORCE_CLIP[0];
            } else if(force_to_apply[0] > m_config.TUNNEL_FORCE_CLIP[0]) {
                force_to_apply[0] = m_config.TUNNEL_FORCE_CLIP[0];
            }
            if(force_to_apply[1] < -m_config.TUNNEL_FORCE_CLIP[1]) {
                force_to_apply[1] = -m_config.TUNNEL_FORCE_CLIP[1];
            }
            if(force_to_apply[2] < -m_config.TUNNEL_FORCE_CLIP[2]) {
                force_to_apply[2] = -m_config.TUNNEL_FORCE_CLIP[2];
            } else if(force_to_apply[2] > m_config.TUNNEL_FORCE_CLIP[2]) {
                force_to_apply[2] = m_config.TUNNEL_FORCE_CLIP[2];
            }
            */

        // make the train return to clouds (Y-axis) with apply_force
        /*
        */
        dist = get_distance_to_center();
        if((dist > m_config.TUNNEL_MAX_DIST)) {
            //set_state(m_config.TS_BOUNDS_OUT);
            
            stabilise_factor = (dist - m_config.TUNNEL_MAX_DIST)/m_config.TUNNEL_MAX_DIST;

            force_to_apply[0] = -_train_wrapper.translation[0]*10* Math.pow(stabilise_factor,5);
            //force_to_apply[1] = 0;
            force_to_apply[1] = -m_config.FLY_VELOCITY*5 * Math.pow(stabilise_factor,5);
            force_to_apply[2] = -_train_wrapper.translation[2]*10* Math.pow(stabilise_factor,5);

            //console.log(force_to_apply);

             m_phy.apply_force_world(obj, force_to_apply[0], force_to_apply[1], force_to_apply[2]);

            //console.log("BOUNDS_OUT", dist, stabilise_factor, _train_wrapper.translation, force_to_apply);
            //console.log("BOUNDS_OUT", dist, stabilise_factor, force_to_apply);
        } else {
             //m_phy.apply_force_world(obj, 0, 0, 0);

        }
        if(_train_wrapper.after_rotaion > 0) {
            _train_wrapper.after_rotaion -= elapsed;
            if(_train_wrapper.after_rotaion < 0) {
                _train_wrapper.after_rotaion = 0;

                mouse_location.location_normal = [0, 0];

                //console.log("FIX ROTATION", _train_wrapper.rotation);
            }
        }
            
        // constant rotation (like with mouse)
        //console.log("ROT", _train_wrapper.rotation);
        if(_train_wrapper.after_rotaion >= 0) {

            target_rotation[2] = -m_config.ROTATION_CLIP_H * 
                (mouse_location.location_normal[0]);
            target_rotation[0] = m_config.ROTATION_CLIP_V * 
                (mouse_location.location_normal[1]);

            //console.log("NORMAL", mouse_location.location_normal);
            //console.log("ROT", _train_wrapper.rotation);
            //console.log("ROT TARGET", target_rotation);

            if(target_rotation[2] < 0) {

            }

            if(Math.abs(target_rotation[2] - _train_wrapper.rotation[2]) > m_config.ZERO_ROTATION) {
                if(target_rotation[2] < _train_wrapper.rotation[2]) {
                    // LEFT
                    m_phy.character_rotation_inc(obj, elapsed * 3 *
                        m_config.ROT_SPEED_H * (target_rotation[2] - _train_wrapper.rotation[2]), 
                    0);
                } else {
                    // RIGHT
                    m_phy.character_rotation_inc(obj, elapsed * 3 *
                        m_config.ROT_SPEED_H * (target_rotation[2] - _train_wrapper.rotation[2]), 
                    0);
                }
            }
            if(Math.abs(target_rotation[0] - _train_wrapper.rotation[0]) > m_config.ZERO_ROTATION) {
                if(target_rotation[0] > _train_wrapper.rotation[0]) {
                    // UP
                    m_phy.character_rotation_inc(obj, 0, elapsed * 3 *
                        m_config.ROT_SPEED_V * (target_rotation[0] - _train_wrapper.rotation[0])
                    );
                } else {
                    // DOWN
                    m_phy.character_rotation_inc(obj, 0, elapsed * 3 *
                        m_config.ROT_SPEED_V * (target_rotation[0] - _train_wrapper.rotation[0])
                    );
                }
            }

        }
    }

    m_ctl.create_sensor_manifold(_train_wrapper.p_body, "MOVE", m_ctl.CT_CONTINUOUS, 
        move_sens_array, move_sens_logic, move_cb);
}

function setup_rotation(left_arrow, right_arrow, up_arrow, down_arrow, elapsed_sensor) {
    var key_a     = m_ctl.create_keyboard_sensor(m_ctl.KEY_A);
    var key_left  = m_ctl.create_keyboard_sensor(m_ctl.KEY_LEFT);
    var key_d     = m_ctl.create_keyboard_sensor(m_ctl.KEY_D);
    var key_right = m_ctl.create_keyboard_sensor(m_ctl.KEY_RIGHT);
    var key_w     = m_ctl.create_keyboard_sensor(m_ctl.KEY_W);
    var key_up    = m_ctl.create_keyboard_sensor(m_ctl.KEY_UP);
    var key_s     = m_ctl.create_keyboard_sensor(m_ctl.KEY_S);
    var key_down  = m_ctl.create_keyboard_sensor(m_ctl.KEY_DOWN);

    var rotate_array = [
        key_a, key_left, left_arrow,
        key_d, key_right, right_arrow,
        key_w, key_up, up_arrow,
        key_s, key_down, down_arrow,
        elapsed_sensor
    ];

    var elapsed = null;

    var left_logic  = function(s){return (s[0] || s[1]  || s[2])};
    var right_logic = function(s){return (s[3] || s[4]  || s[5])};
    var up_logic    = function(s){return (s[6] || s[7]  || s[8])};
    var down_logic  = function(s){return (s[9] || s[10] || s[11])};

    var start_mouse_elem = document.getElementById("start_mouse");

    function rotate_cb(obj, id, pulse) {
        if(exports._need_hide_help) {
            exports._need_hide_help = false;
            m_interface.hide_start_mouse_element(1);
        }

        elapsed = m_ctl.get_sensor_value(obj, id, 12);
        
        if (pulse == 1) {
            //console.log("ROTATION", _train_wrapper.rotation);

            switch(id) {
            case "LEFT":
                if(_train_wrapper.rotation[2] < m_config.ROTATION_CLIP_H) {
                    m_phy.character_rotation_inc(obj, elapsed * m_config.ROT_SPEED_H, 0);
                }
                break;
            case "RIGHT":
                if(_train_wrapper.rotation[2] > -m_config.ROTATION_CLIP_H) {
                    m_phy.character_rotation_inc(obj, -elapsed * m_config.ROT_SPEED_H, 0);
                }
                break;
            case "UP":
                if(_train_wrapper.rotation[0] > -m_config.ROTATION_CLIP_V) {
                    m_phy.character_rotation_inc(obj, 0, -elapsed * m_config.ROT_SPEED_V);
                }
                break;
            case "DOWN":
                if(_train_wrapper.rotation[0] < m_config.ROTATION_CLIP_V) {
                    m_phy.character_rotation_inc(obj, 0, elapsed * m_config.ROT_SPEED_V);
                }
                break;
            }
            _train_wrapper.after_rotaion = m_config.BEFORE_FIX_ROTATION;
        }
    }

    m_ctl.create_sensor_manifold(_train_wrapper.p_body, "LEFT", m_ctl.CT_CONTINUOUS,
        rotate_array, left_logic, rotate_cb);
    m_ctl.create_sensor_manifold(_train_wrapper.p_body, "RIGHT", m_ctl.CT_CONTINUOUS,
        rotate_array, right_logic, rotate_cb);
    m_ctl.create_sensor_manifold(_train_wrapper.p_body, "UP", m_ctl.CT_CONTINUOUS,
        rotate_array, up_logic, rotate_cb);
    m_ctl.create_sensor_manifold(_train_wrapper.p_body, "DOWN", m_ctl.CT_CONTINUOUS,
        rotate_array, down_logic, rotate_cb);
}


exports.reset = function() {
/*
    _train_wrapper.score = m_conf.SCORE;
    m_trans.get_rotation(_char_wrapper.phys_body, _quat4_tmp);
    m_phy.set_transform(_char_wrapper.phys_body, m_conf.CHAR_DEF_POS, _quat4_tmp);
    m_phy.set_character_move_dir(_char_wrapper.phys_body, 0, 0);
*/
}

exports.get_wrapper = function() {
    //console.log("GET WRAPPER", _train_wrapper);
    
    return _train_wrapper;
}

function get_state() {
    return _train_wrapper.state;
}
function set_state(state) {
    _train_wrapper.state = state;
    console.log("SET STATE", _train_wrapper.state);
}

function get_distance_to_center() {
    var dist;
    m_vec3.copy(_train_wrapper.translation, _vec3_tmp);
    _vec3_tmp[0] = 0;
    _vec3_tmp[2] = 0;
    dist = m_vec3.distance(_train_wrapper.translation, _vec3_tmp);
    //console.log("DISTANCE", dist);
    return dist;
}

})
