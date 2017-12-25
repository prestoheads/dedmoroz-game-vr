"use strict"

if (b4w.module_check("interface"))
    throw "Failed to register module: interface";

b4w.register("interface", function(exports, require) {

var m_trans 		= require("transform");
var m_ctl           = require("controls");
var m_time          = require("time");
var m_mos          	= require("mouse");
var m_inpt 			= require("input");
var m_cont 			= require("container");
var m_quat          = require("quat");
var m_vec3          = require("vec3");
var m_scs           = require("scenes");
var m_util          = require("util");



var m_config        = require("game_config");
var m_train         = require("train");
var m_environment   = require("environment");

var _mouse_location	= null;
var _vec2_tmp = [0, 0];
var _vec3_tmp = m_vec3.create();
var _quat_tmp = m_quat.create();

exports.init = function() {
    _mouse_location = {
        //location:       	[0,0],
        location_normal:    [0,0],
        canvas: 			m_cont.get_canvas(),
        canvas_dims: 		null,
        arrow_sensors: 		null
    };
    _mouse_location.canvas_dims = [
    	_mouse_location.canvas.clientWidth,
    	_mouse_location.canvas.clientHeight
    ];
    window.onresize = function() {
	    _mouse_location.canvas_dims = [
	    	_mouse_location.canvas.clientWidth,
	    	_mouse_location.canvas.clientHeight
	    ];
    };
}

function normalize_mouse_location(location, sharpen_factor) {
	//console.log("NORMAL MOUSE " + location);
	_vec2_tmp = [_mouse_location.canvas_dims[0] / 2, _mouse_location.canvas_dims[1] / 2];

	_mouse_location.location_normal[0] = (location[0] - _vec2_tmp[0]) * 2 / 
		Math.min(_mouse_location.canvas_dims[0], _mouse_location.canvas_dims[1]);
	_mouse_location.location_normal[1] = (location[1] - _vec2_tmp[1]) * 2 / 
		Math.min(_mouse_location.canvas_dims[0], _mouse_location.canvas_dims[1]);

	_mouse_location.location_normal[0] *= sharpen_factor;
	_mouse_location.location_normal[1] *= sharpen_factor;

	if(	(Math.abs(_mouse_location.location_normal[0]) > m_config.MOUSE_OFF_LIMIT) ||
		(Math.abs(_mouse_location.location_normal[1]) > m_config.MOUSE_OFF_LIMIT)) {
		// mouse off
		_mouse_location.location_normal[0] = 0;
		_mouse_location.location_normal[1] = 0;
	} else {
		if (_mouse_location.location_normal[0] > 0.5) {
			_mouse_location.location_normal[0] = 0.5;
		} else if (_mouse_location.location_normal[0] < -0.5) {
			_mouse_location.location_normal[0] = -0.5;
		}

		if (_mouse_location.location_normal[1] > 0.5) {
			_mouse_location.location_normal[1] = 0.5;
		} else if (_mouse_location.location_normal[1] < -0.5) {
			_mouse_location.location_normal[1] = -0.5;
		}

		_mouse_location.location_normal[0] *= 2;
		_mouse_location.location_normal[1] *= 2;

		_mouse_location.location_normal[0] += m_config.MOUSE_OFFSET_ZERO[0];
		_mouse_location.location_normal[1] += m_config.MOUSE_OFFSET_ZERO[1];
	}
}


function normalize_controller_location(location) {
	//console.log("TOUCHE " , location);
	//_vec2_tmp = location;
	_vec2_tmp = location;
	_mouse_location.location_normal[0] = - _vec2_tmp[0] * m_config.CONTROLLER_SHARPEN_FACTOR / 90;
	_mouse_location.location_normal[1] = _vec2_tmp[1] * m_config.CONTROLLER_SHARPEN_FACTOR / 90;

	//_vec2_tmp[0] -= _mouse_location.canvas_dims[0] * m_config.TOUCHE_CENTER_OFFSET[0];
	//_vec2_tmp[1] -= _mouse_location.canvas_dims[1] * m_config.TOUCHE_CENTER_OFFSET[1];
	//console.log("NORMAL CONTROLLER ", _mouse_location.location_normal);
	//normalize_mouse_location(_vec2_tmp, m_config.CONTROLLER_SHARPEN_FACTOR);
}


function normalize_touche_location(location) {
	//console.log("TOUCHE " , location);
	_vec2_tmp = location;
	_vec2_tmp[0] -= _mouse_location.canvas_dims[0] * m_config.TOUCHE_CENTER_OFFSET[0];
	_vec2_tmp[1] -= _mouse_location.canvas_dims[1] * m_config.TOUCHE_CENTER_OFFSET[1];
	//console.log("NORMAL TOUCHE " + _vec2_tmp, _mouse_location.canvas_dims);
	normalize_mouse_location(_vec2_tmp, m_config.TOUCHE_SHARPEN_FACTOR);
}

exports.setup_arrow_sensors = function(left_arrow, right_arrow, up_arrow, down_arrow) {
	_mouse_location.arrow_sensors = [left_arrow, right_arrow, up_arrow, down_arrow];
}

exports.get_mouse_location = function() {
	return _mouse_location;
}

exports.setup_mouse_controls = function() {
	var train_wrapper = m_train.get_wrapper();

	var mouse_location_cb = function(location) {
		//_mouse_location.location = location;
		normalize_mouse_location(location, m_config.MOUSE_SHARPEN_FACTOR);

	    //console.log("MOUSE " + _mouse_location.location_normal);
	};
	var device = m_inpt.get_device_by_type_element(m_inpt.DEVICE_MOUSE);
	m_inpt.attach_param_cb(device, m_inpt.MOUSE_LOCATION, mouse_location_cb);
};

exports.setup_controller_controls = function(elapsed_sensor) {
	var location = [0, 0];
	var object_pointer_1 = m_scs.get_object_by_name("ControllerCube1");
	var object_pointer_2 = m_scs.get_object_by_name("ControllerCube2");

    var move_sens_array = [elapsed_sensor];
    var move_sens_logic = function(s) {return (s[0]);}

    function controller_location_cb(obj, id) {
    	m_trans.get_rotation(obj, _quat_tmp);
    	m_quat.rotateX(_quat_tmp, -Math.PI/2, _quat_tmp);
    	//m_quat.rotateZ(_quat_tmp, Math.PI, _quat_tmp);
    	m_util.quat_to_euler(_quat_tmp, _vec3_tmp);

    	location[0] = m_util.rad_to_deg(_vec3_tmp[2]);
    	location[1] = -m_util.rad_to_deg(_vec3_tmp[0]);
    	//console.log(location);
		normalize_controller_location(location);
    	//console.log("LOCATION", location);
    }

    //m_ctl.create_sensor_manifold(object_pointer_1, "CONTROLLER_1_MOVE", m_ctl.CT_CONTINUOUS, 
    //    move_sens_array, move_sens_logic, controller_location_cb);
    m_ctl.create_sensor_manifold(object_pointer_2, "CONTROLLER_2_MOVE", m_ctl.CT_CONTINUOUS, 
        move_sens_array, move_sens_logic, controller_location_cb);
};


exports.setup_touch_controls = function() {
	var train_wrapper = m_train.get_wrapper();
	var location_start = [0, 0];
	var location = [0, 0];

	var touch_start_cb = function(event) {
		event.preventDefault();
		var touches = event.changedTouches;
	    for (var i = 0; i < touches.length; ++i) {
	        //console.log("Touch contact " + touches[i].identifier + " has position" +
	        //         + " x: " + touches[i].clientX + " y: " + touches[i].clientY);
			//_mouse_location.location = location;
			location_start[0] = touches[i].clientX;
			location_start[1] = touches[i].clientY;
			//console.log("TOUCH " + location);
			//normalize_touche_location(location);

		}		
		//train_wrapper.after_rotaion = m_config.BEFORE_FIX_ROTATION;
	};

	var touch_move_cb = function(event) {
		event.preventDefault();
		var touches = event.changedTouches;
	    for (var i = 0; i < touches.length; ++i) {
	        //console.log("Touch contact " + touches[i].identifier + " has position" +
	        //         + " x: " + touches[i].clientX + " y: " + touches[i].clientY);
			//_mouse_location.location = location;
			location[0] = touches[i].clientX - location_start[0] + 
				_mouse_location.canvas_dims[0] * (0.5 + m_config.TOUCHE_CENTER_OFFSET[0]);
			location[1] = touches[i].clientY - location_start[1] + 
				_mouse_location.canvas_dims[1] * (0.5 + m_config.TOUCHE_CENTER_OFFSET[1]);
			//console.log("TOUCH " + location);
			normalize_touche_location(location);

		}		
		m_train.get_wrapper().after_rotaion = m_config.BEFORE_FIX_ROTATION;
	};

	var touch_end_cb = function(event) {
		//console.log("TOUCH END");
		event.preventDefault();
		//m_train.get_wrapper().after_rotaion = m_config.BEFORE_FIX_ROTATION;
	};


	//var device = m_inpt.get_device_by_type_element(m_inpt.DEVICE_TOUCH);
	//m_inpt.switch_prevent_default(device, true);
	//m_inpt.attach_param_cb(device, m_inpt.TOUCH_MOVE, touch_move_cb);
	document.getElementById("controls").addEventListener("touchstart", touch_start_cb, false);
	document.getElementById("controls").addEventListener("touchmove", touch_move_cb, false);
	document.getElementById("controls").addEventListener("touchend", touch_end_cb, false);
	//addEventListener("touchmove", handleMove, false);

}





exports.update_score = function() {

    score = m_train.get_wrapper().score;

    var score_elem = document.getElementById("score");

    score_elem.innerHTML = _score;
}

exports.show_controls_element = function(period) {
    var controls_elem = document.getElementById("controls");
    show_elem(controls_elem, period);
}

exports.hide_controls_element = function(period) {
    var controls_elem = document.getElementById("controls");
    hide_elem(controls_elem, period);
}

exports.show_start_mouse_element = function(period) {
    var start_mouse_elem = document.getElementById("start_mouse");
    var start_mouse_hs_elem = start_mouse_elem.getElementsByTagName("img")[0];
    show_elem(start_mouse_elem, period);
    start_mouse_hs_elem.onmouseover = function(e) {
    	exports.setup_mouse_controls();
    	hide_elem(start_mouse_elem, 1);
  	};
}

exports.hide_start_mouse_element = function(period) {
    var start_mouse_elem = document.getElementById("start_mouse");
    hide_elem(start_mouse_elem, period);
}

function show_elem(elem, period) {

    period = period || 0;

    elem.style.opacity = 0;
    elem.style.visibility = "visible";

    var finish_time = m_time.get_timeline() + period;

    function show_elem_cb(obj, id, pulse) {
        var time_left = finish_time - m_time.get_timeline();
        if (time_left < 0) {
            m_ctl.remove_sensor_manifold(null, "SHOW_"+ elem.id);
            return;
        }
        var opacity = 1 - time_left / period;
        elem.style.opacity = opacity;
    }

    if (!m_ctl.check_sensor_manifold(null, "SHOW_" + elem.id)) {
        var elapsed_sens = m_ctl.create_elapsed_sensor();
        m_ctl.create_sensor_manifold(null, "SHOW_" + elem.id,
            m_ctl.CT_CONTINUOUS, [elapsed_sens], null, show_elem_cb);
    }
}

function hide_elem(elem, period) {

    period = period || 0;

    var start_opacity = elem.style.opacity;
    var finish_time = m_time.get_timeline() + period;

    function show_elem_cb(obj, id, pulse) {
        var time_left = finish_time - m_time.get_timeline();
        if (time_left < 0) {
            elem.style.visibility = "hidden";
            m_ctl.remove_sensor_manifold(null, "HIDE_"+ elem.id);
            return;
        }
        var opacity = time_left / period;
        elem.style.opacity = start_opacity * opacity;
    }

    if (!m_ctl.check_sensor_manifold(null, "HIDE_" + elem.id)) {
        var elapsed_sens = m_ctl.create_elapsed_sensor();
        m_ctl.create_sensor_manifold(null, "HIDE_" + elem.id,
            m_ctl.CT_CONTINUOUS, [elapsed_sens], null, show_elem_cb);
    }
}

})