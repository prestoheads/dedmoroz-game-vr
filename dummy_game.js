"use strict"

if (b4w.module_check("dummy_game_main"))
    throw "Failed to register module: dummy_game_main";

// register the application module
b4w.register("dummy_game_main", function(exports, require) {

// import modules used by the app
var m_app           = require("app");
var m_cfg           = require("config");
var m_data          = require("data");
var m_ctl           = require("controls");
//var m_phy         = require("physics");
var m_cons          = require("constraints");
var m_scs           = require("scenes");
var m_trans       = require("transform");
var m_preloader     = require("preloader");
var m_ver           = require("version");
var m_hmd           = require("hmd");
var m_hmd_conf      = require("hmd_conf");
var m_scrn          = require("screen");
var m_inpt          = require("input");
var m_vec3          = require("vec3");
var m_quat          = require("quat");


var m_config        = require("game_config");
var m_train         = require("train");
var m_environment   = require("environment");
var m_interface     = require("interface");
var m_dummy_presents      = require("dummy_presents");
var m_dummy_bat           = require("dummy_bat");

// detect application mode
var DEBUG = (m_ver.type() === "DEBUG");

// automatically detect assets path
var APP_ASSETS_PATH = m_cfg.get_assets_path("ded_moroz_06");

var _is_mobile = false;

var _updated_eye_data = false;
var _init_hmd_pos = m_vec3.create();
var _vec3_tmp = m_vec3.create();
var _vec3_tmp2 = m_vec3.create();
    var _quat_tmp = m_quat.create();

var _dest_x_trans = 0;
var _dest_z_trans = 0;

var VEC3_IDENT = m_vec3.fromValues(0, 0, 0);

var _test_dummy = null;

/**
 * export the method to initialize the app (called at the bottom of this file)
 */
exports.init = function() {
    var show_fps = DEBUG;

    var url_params = m_app.get_url_params();

    if (url_params && "show_fps" in url_params) {
        show_fps = true;
    }

    _is_mobile = detect_mobile();


    m_app.init({
        canvas_container_id: "dummy_canvas_container",
        callback: init_cb,
        physics_enabled: false,
        show_fps: show_fps,
        assets_dds_available: !DEBUG,
        assets_pvr_available: !DEBUG,
        assets_min50_available: !DEBUG,
        console_verbose: DEBUG,
        autoresize: true,
        alpha: false
    });


}



/**
 * callback executed when the app is initialized 
 */
function init_cb(canvas_elem, success) {

    if (!success) {
        console.log("b4w init failure");
        return;
    }

    m_preloader.create_preloader();

    // ignore right-click on the canvas element
    canvas_elem.oncontextmenu = function(e) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    };

    load();
}

/**
 * load the scene data
 */
function load() {
    m_data.load(APP_ASSETS_PATH + "ded_moroz_06.json", load_cb, preloader_cb);
}

/**
 * update the app's preloader
 */
function preloader_cb(percentage) {
    m_preloader.update_preloader(percentage);
}

/**
 * callback executed when the scene data is loaded
 */
function load_cb(data_id, success) {

    if (!success) {
        console.log("b4w load failure");
        return;
    }
    m_dummy_presents.init();
    m_dummy_bat.init();
    window.move_dummy = function(obj_name, obj_translation) {
        if(m_scs.check_object_by_name(obj_name)) {
            var obj = m_scs.get_object_by_name(obj_name);
            m_trans.set_translation_v(obj, obj_translation);
        }
    }


    var elapsed_sensor = m_ctl.create_elapsed_sensor();
    
    m_dummy_presents.setup_presents_generation(elapsed_sensor);
    m_dummy_bat.setup_bats_generation(elapsed_sensor);


    var object_camera = m_scs.get_active_camera();
    add_dummy_from_object_position(object_camera, "MainCamera", elapsed_sensor);

    var object_train =  m_scs.get_object_by_name("character_collider");
    add_dummy_from_object_position(object_train,"character_collider", elapsed_sensor);

    var object_land =  m_scs.get_object_by_name("LandSurfaceOffsetEmpty");
    add_dummy_from_object_position(object_land, "LandSurfaceOffsetEmpty", elapsed_sensor);
    var object_land_animate_y =  m_scs.get_object_by_name("LandAnimateY");
    add_dummy_from_object_position(object_land_animate_y, "LandAnimateY", elapsed_sensor);

    var object_sky =  m_scs.get_object_by_name("SkyEmpty");
    add_dummy_from_object_position(object_sky, "SkyEmpty", elapsed_sensor);

    var object_pointer_1 =  m_scs.get_object_by_name("ControllerCube1");
    add_dummy_from_object_position(object_pointer_1, "ControllerCube1", elapsed_sensor);
    var object_pointer_2 =  m_scs.get_object_by_name("ControllerCube2");
    add_dummy_from_object_position(object_pointer_2, "ControllerCube2", elapsed_sensor);
/*
     */   
    


    

    //add_dummy_from_object_position("train_body", elapsed_sensor);
    //add_dummy_from_object_position("MainCameraCube", elapsed_sensor);
    //add_dummy_from_object_position("MainCamera", elapsed_sensor);


}

function detect_mobile() {
    if( navigator.userAgent.match(/Android/i)
     || navigator.userAgent.match(/webOS/i)
     || navigator.userAgent.match(/iPhone/i)
     || navigator.userAgent.match(/iPad/i)
     || navigator.userAgent.match(/iPod/i)
     || navigator.userAgent.match(/BlackBerry/i)
     || navigator.userAgent.match(/Windows Phone/i)) {
        return true;
    } else {
        return false;
    }
}

function setup_camera() {
    //var camera = m_scs.get_active_camera();
    //var camera_dummy = m_scs.get_object_by_name("MainCameraCube");
    //var target = m_scs.get_object_by_name("camera_target");
    //m_cons.append_semi_soft(camera_dummy, target, m_config.CAM_OFFSET, m_config.CAM_SOFTNESS);
    //m_cons.append_semi_soft(camera, camera_dummy, [0, 0, 0], 0);
    //m_cons.append_semi_stiff(camera, camera_dummy,  m_config.CAM_OFFSET);
    //m_cons.append_semi_soft(camera_dummy, target, m_config.CAM_OFFSET, m_config.CAM_SOFTNESS);
    //m_cons.append_copy_loc(camera, camera_dummy);

    m_app.disable_camera_controls();
}




function add_dummy_from_object_position(object, object_name, elapsed_sensor) {
    //var object_name = m_scs.get_object_name(object);
    //console.log("ADD DUMMY_FROM_OBJECT 1", m_scs.get_object_name(object));
    //console.log("ADD DUMMY_FROM_OBJECT 2", window._objects);
    var object_source = null;

//    window.obj_positions = {};

    function dummy_move_cb(obj, id, pulse) {
        if(object_source === null) {
            if(window._objects && window._objects[object_name]) {
                object_source = window._objects[object_name].obj;
            }
        } else {
            if(m_scs.check_object_by_name(object_name)) {
                m_trans.set_translation_v( obj, m_trans.get_translation(object_source));
                m_trans.set_rotation_v( obj, m_trans.get_rotation(object_source));
            }
        }

    //console.log("ADD DUMMY_FROM_OBJECT 3", object_source);

        //console.log("ADD DUMMY_FROM_OBJECT 4", m_trans.get_translation(object_source));
        //console.log("ADD DUMMY_FROM_OBJECT 5", m_trans.get_rotation(object_source));
        /*
        if((window._obj_translations) &&(window._obj_translations[object_name])) {
            m_trans.set_translation_v(obj, window._obj_translations[object_name]);
            m_trans.set_rotation_v(obj, window._obj_rotations[object_name]);
        }
        console.log("DUMMY_FROM_OBJECT", window._obj_rotations[object_name]);
        */
    }

    m_ctl.create_sensor_manifold(object, "DUMMY_FROM_OBJECT_" + object_name,
            m_ctl.CT_CONTINUOUS, [elapsed_sensor],
            m_ctl.default_OR_logic_fun, dummy_move_cb);


}
/*
function setup_copy_movement(obj_to, elapsed_sensor) {

    var move_sens_array = [elapsed_sensor];

    // manifold logic function
    var move_sens_logic = function(s) {return (s[0]);}

    var elapsed;
    var copy_to = obj_to;
    var copy_from;


    function move_cb(obj, id) {
        elapsed = m_ctl.get_sensor_value(obj, id, 0);

        //console.log(window._test.p_body);
        copy_from = window._test.p_body;

        m_trans.get_translation(copy_from, _vec3_tmp);
        m_trans.set_translation_v(copy_to, _vec3_tmp);

        m_trans.get_rotation(copy_from, _quat_tmp);
        m_trans.set_rotation_v(copy_to, _quat_tmp);
    }

    m_ctl.create_sensor_manifold(obj_to, "MOVE", m_ctl.CT_CONTINUOUS, 
        move_sens_array, move_sens_logic, move_cb);
}
*/

/*
exports.hide_dummy_by_name = function(dummy_name) {
    var dummy = m_scs.get_object_by_name(dummy_name);
    m_scs.hide_object(dummy);
}
*/


});

// import the app module and start the app by calling the init method
b4w.require("dummy_game_main", "dummy_game_main").init();
