"use strict"

if (b4w.module_check("environment"))
    throw "Failed to register module: environment";

b4w.register("environment", function(exports, require) {

var m_ctl           = require("controls");
var m_scs           = require("scenes");
var m_trans         = require("transform");
var m_mat           = require("material");

var m_config        = require("game_config");
var m_train         = require("train");
var m_interface     = require("interface");

var _clouds_wrapper = null;
var _earth_wrapper = null;

exports.setup_land = function(elapsed_sensor) {
    _earth_wrapper = {
        _world_land:   m_scs.get_object_by_name("LandSurfaceOffsetEmpty"),
        _world_sky:    m_scs.get_object_by_name("SkyEmpty"),
        _animate_x:    m_scs.get_object_by_name("LandAnimateX"),
        _animate_y:    m_scs.get_object_by_name("LandAnimateY"),
        rotation_x:    0,
        rotation_y:    0,
        position_y:    0
    };

    var _quat4_animate_x = new Float32Array(4);
    var _quat4_animate_y = new Float32Array(4);

    var _vec3_transtation = new Float32Array(3);

    //var target_pos_x = _earth_wrapper.position[0];
    //var target_pos_y = _earth_wrapper.position[1];
    //var target_pos_z = _earth_wrapper.position[2];
    var train_wrapper = m_train.get_wrapper();
    var elapsed = 0;

    function earth_move_cb(obj, id) {
        elapsed = m_ctl.get_sensor_value(obj, id, 0);

        _quat4_animate_x = [_earth_wrapper.rotation_x, 0, 0, 1];
        _quat4_animate_y = [0, -_earth_wrapper.rotation_y, 0, 1];

        //m_trans.set_rotation_v(_earth_wrapper._animate_x, _quat4_animate_x);
        //m_trans.set_rotation_v(_earth_wrapper._animate_y, _quat4_animate_y);

        _vec3_transtation = [0, _earth_wrapper.position_y, 0];

        m_trans.set_translation_v(_earth_wrapper._world_land, _vec3_transtation);
        m_trans.set_translation_v(_earth_wrapper._world_sky, _vec3_transtation);
/*
        target_pos_x = train_wrapper.translation[0];
        target_pos_y = train_wrapper.translation[1];
        target_pos_z = train_wrapper.translation[2];

        _earth_wrapper.position[0] = target_pos_x;
        _earth_wrapper.position[1] = target_pos_y;
        _earth_wrapper.position[2] = target_pos_z;

        //m_mat.set_nodemat_value(_earth_wrapper._surface, ["EarthMaterialFlat", "PositionX"], target_pos_x);
        //m_mat.set_nodemat_value(_earth_wrapper._surface, ["EarthMaterialFlat", "PositionY"], target_pos_y);

        m_trans.set_translation_v(_earth_wrapper._surface, _earth_wrapper.position);
*/
        //console.log("LAND", _vec3_transtation);
    }

    m_ctl.create_sensor_manifold(null, "LAND_ROTATE", m_ctl.CT_CONTINUOUS,
                                 [elapsed_sensor], null, earth_move_cb);
}



exports.setup_clouds = function(elapsed_sensor) {
    _clouds_wrapper = {
        empty:          m_scs.get_object_by_name("CloudEmittersEmpty"),
        emitters:       [],
        position:       m_config.CLOUDS_DEF_POS, 
        number_factor:  m_config.CLOUDS_MAX_NUMBER_FACTOR
    };

    var target_pos_y = _clouds_wrapper.position[1];
    var train_wrapper = m_train.get_wrapper();

    function clouds_move_cb(obj, manifold_id) {
        target_pos_y = train_wrapper.translation[1];

        _clouds_wrapper.position[1] = target_pos_y;

        //console.log("CLOUDS POS", _clouds_wrapper.position);
        m_trans.set_translation_v(_clouds_wrapper.empty, _clouds_wrapper.position);
    }

    m_ctl.create_sensor_manifold(null, "CLOUDS_MOVE", m_ctl.CT_CONTINUOUS,
                                 [elapsed_sensor], null, clouds_move_cb);
}


exports.set_land_rotation = function(x, y) {
    //_earth_wrapper.rotation_x = x / 100;
    //_earth_wrapper.rotation_y = y / 100;
}

exports.set_world_position = function(y) {
    _earth_wrapper.position_y = y;
}


})
