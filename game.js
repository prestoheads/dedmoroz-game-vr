"use strict"

if (b4w.module_check("game_main"))
    throw "Failed to register module: game_main";

// register the application module
b4w.register("game_main", function(exports, require) {

// import modules used by the app
var m_app           = require("app");
var m_cfg           = require("config");
var m_data          = require("data");
var m_ctl           = require("controls");
//var m_phy         = require("physics");
var m_anim         = require("animation");
var m_cons          = require("constraints");
var m_scs           = require("scenes");
var m_trans       = require("transform");
var m_preloader     = require("preloader");
var m_ver           = require("version");
var m_hmd           = require("hmd");
var m_hmd_conf      = require("hmd_conf");
var m_scrn          = require("screen");
var m_inpt          = require("input");
var m_quat          = require("quat");
var m_vec3          = require("vec3");


var m_config        = require("game_config");
var m_train         = require("train");
var m_environment   = require("environment");
var m_interface     = require("interface");
var m_presents      = require("presents");
var m_bat           = require("bat");

// detect application mode
var DEBUG = (m_ver.type() === "DEBUG");

// automatically detect assets path
var APP_ASSETS_PATH = m_cfg.get_assets_path("ded_moroz_06");

var _is_mobile = false;

var _vec3_tmp = m_vec3.create();
var _vec3_tmp2 = m_vec3.create();
var _quat_tmp = m_quat.create();


var _updated_eye_data = false;
var _init_hmd_pos = m_vec3.create();
var _dest_x_trans = 0;
var _dest_z_trans = 0;

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
        canvas_container_id: "main_canvas_container",
        callback: init_cb,
        physics_enabled: true,
        show_fps: show_fps,
        assets_dds_available: !DEBUG,
        assets_pvr_available: !DEBUG,
        assets_min50_available: !DEBUG,
        console_verbose: DEBUG,
        autoresize: true,
        alpha: false,

        // change scene graph
        stereo: "HMD"
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

    var is_hmd = m_hmd.check_browser_support();
    if (is_hmd) {
        register_hmd();
    } else {
        console.log("No VR support detected.");
    }


    m_train.init_wrapper();
    m_presents.init();
    m_bat.init();
    m_interface.init();

    var elapsed_sensor = m_ctl.create_elapsed_sensor();

    m_train.setup_controls(elapsed_sensor);
    //m_environment.setup_clouds(elapsed_sensor);
    var land_animate_y = m_scs.get_object_by_name("LandAnimateY");
    m_anim.apply(land_animate_y, "LandAnimateYAction");
    m_anim.play(land_animate_y);
    m_anim.set_behavior(land_animate_y, m_anim.AB_CYCLIC);

    m_environment.setup_land(elapsed_sensor);
    m_presents.setup_presents_generation(elapsed_sensor);
    m_bat.setup_bats_generation(elapsed_sensor);

    // TRANSLATION OBJECTS
    window._objects = {};
    //add_object_to_dummy_position("character_collider", elapsed_sensor);
    //add_object_to_dummy_position("train_body", elapsed_sensor);
    var object_camera = m_scs.get_active_camera();
    add_object_to_dummy_position(object_camera, elapsed_sensor);

    var object_train =  m_scs.get_object_by_name("character_collider");
    add_object_to_dummy_position(object_train, elapsed_sensor);

    var object_land =  m_scs.get_object_by_name("LandSurfaceOffsetEmpty");
    add_object_to_dummy_position(object_land, elapsed_sensor);
    var object_land_animate_y =  m_scs.get_object_by_name("LandAnimateY");
    add_object_to_dummy_position(object_land_animate_y, elapsed_sensor);

    var object_sky =  m_scs.get_object_by_name("SkyEmpty");
    add_object_to_dummy_position(object_sky, elapsed_sensor);

    var object_pointer_1 =  m_scs.get_object_by_name("ControllerCube1");
    add_object_to_dummy_position(object_pointer_1, elapsed_sensor);
    var object_pointer_2 =  m_scs.get_object_by_name("ControllerCube2");
    add_object_to_dummy_position(object_pointer_2, elapsed_sensor);

    setup_camera();

    if(_is_mobile) {
        m_interface.setup_mouse_controls();
        m_interface.setup_touch_controls();
        m_interface.show_controls_element(1);
    } else {
        m_interface.show_start_mouse_element(1);
        m_train._need_hide_help = true;
    }

    m_interface.setup_controller_controls(elapsed_sensor);
    
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
    var camera = m_scs.get_active_camera();
    var target = m_scs.get_object_by_name("camera_target");
    //m_cons.append_semi_soft(camera, target, m_config.CAM_OFFSET, m_config.CAM_SOFTNESS);
    /*
    */
    var camera_dummy = m_scs.get_object_by_name("MainCameraCube");
    m_cons.append_semi_soft(camera_dummy, target, m_config.CAM_OFFSET, m_config.CAM_SOFTNESS);
    m_cons.append_copy_loc(camera, camera_dummy);
    //m_cons.append_semi_soft(camera, camera_dummy, [0, 0, 0], 0);
    //m_cons.append_semi_stiff(camera, camera_dummy,  m_config.CAM_OFFSET);
    //

    m_app.disable_camera_controls();
}

function register_hmd() {
    m_hmd_conf.update();
    // camera rotation is enabled with HMD
    m_hmd.enable_hmd(m_hmd.HMD_ALL_AXES_MOUSE_NONE);
    m_inpt.add_click_listener(document.body, function() {
        m_scrn.request_fullscreen_hmd();
        document.getElementById("main_canvas_container").style.zIndex = "1";
        document.getElementById("dummy_canvas_container").style.zIndex = "2";
    });
    //m_scrn.request_split_screen();

    var elapsed = m_ctl.create_elapsed_sensor();
    var psensor = m_ctl.create_hmd_position_sensor();
    var qsensor = m_ctl.create_hmd_quat_sensor();

    var last_hmd_pos = m_vec3.create();
    var diff_hmd_pos = null;
    var hmd_cb = function(obj, id, pulse) {
        if (pulse > 0) {
            var hmd_pos = m_ctl.get_sensor_payload(obj, id, 1);
            //var hmd_rot = m_ctl.get_sensor_payload(obj, id, 2);

            if (!_updated_eye_data) {
                m_vec3.subtract(m_config.HMD_POS_INIT_OFFSET, hmd_pos, _init_hmd_pos);
                m_hmd.set_position(_init_hmd_pos);
                m_hmd.set_rotate_quat(m_config.HMD_ROT_INIT_OFFSET);
                m_vec3.copy(hmd_pos, last_hmd_pos);
                _updated_eye_data = true;
            } else {
                diff_hmd_pos = m_vec3.subtract(hmd_pos, last_hmd_pos, _vec3_tmp2);
                m_vec3.scale(diff_hmd_pos, m_config.HMD_POS_SHARPEN_FACTOR, diff_hmd_pos);
                _dest_x_trans += diff_hmd_pos[0];
                _dest_z_trans += diff_hmd_pos[2];
                m_vec3.copy(hmd_pos, last_hmd_pos);
            }
        }
    }

    var cam_obj = m_scs.get_active_camera();
    m_ctl.create_sensor_manifold(cam_obj, "HMD_TRANSLATE_CAMERA",
            m_ctl.CT_CONTINUOUS, [elapsed, psensor], null, hmd_cb);

    setup_controller();
}

function setup_controller_movement(ray_caster, gamepad_id) {
    var elapsed_s = m_ctl.create_elapsed_sensor();

    var controller_quat = null;
    function pointer_cb(obj, id, pulse) {
        controller_quat = m_trans.get_rotation(obj, _quat_tmp);

        //console.log("CONTROL ROT", controller_quat);
    }

    m_ctl.create_sensor_manifold(ray_caster, "POINTER_CONTROLLER" + gamepad_id,
            m_ctl.CT_CONTINUOUS, [elapsed_s],
            m_ctl.default_OR_logic_fun, pointer_cb);
}

function setup_controller() {
    var gamepad_1 = m_scs.get_object_by_name("ControllerCube1");
    var gamepad_2 = m_scs.get_object_by_name("ControllerCube2");
    m_hmd.enable_controllers(gamepad_1, gamepad_2);
    var gamepad_id_1 = m_inpt.get_vr_controller_id(0);
    var gamepad_id_2 = m_inpt.get_vr_controller_id(1);
    setup_controller_movement(gamepad_1, "pointer_1", gamepad_id_1);
    setup_controller_movement(gamepad_2, "pointer_2", gamepad_id_2);
    

}


function add_object_to_dummy_position(object, elapsed_sensor) {
    //var object = m_scs.get_object_by_name(object_name);
    var object_wrapper = {obj: object};
    window._objects[m_scs.get_object_name(object)] = object_wrapper;
/*
    function object_move_cb(obj, id, pulse) {
        window._obj_translations[object_name] = m_trans.get_translation(obj, _vec3_tmp);
        window._obj_rotations[object_name] = m_trans.get_rotation(obj, _quat_tmp);
        if(object_name == "MainCamera") {
           // window._obj_rotations[object_name] = m_quat.rotateX(window._obj_rotations[object_name], 
           //     Math.PI/2, _quat_tmp);
        }


//        console.log("OBJECT_TO_DUMMY", window._obj_rotations[object_name]);
    }

    m_ctl.create_sensor_manifold(object, "OBJECT_TO_DUMMY_" + object_name,
            m_ctl.CT_CONTINUOUS, [elapsed_sensor],
            m_ctl.default_OR_logic_fun, object_move_cb);
*/

}


});

// import the app module and start the app by calling the init method
b4w.require("game_main", "game_main").init();
