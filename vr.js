"use strict"

if (b4w.module_check("game_config"))
    throw "Failed to register module: game_config";

b4w.register("game_config", function(exports, require) {

var m_phy           = require("physics");

// train
exports.SCORE = 0;
exports.ROT_SPEED_H = 2;
exports.ROT_SPEED_V = 2;
exports.FLY_VELOCITY = 0.3;
exports.CAM_OFFSET = new Float32Array([0, 0.125, 0]);
exports.CAM_SOFTNESS = 0.8;
exports.TRAIN_DEF_POS = new Float32Array([0, 0, 0]);
exports.TRAIN_DEF_ROT = new Float32Array([0, 0, 0, 1]);
exports.TUNNEL_MAX_DIST = 2.0;

exports.TUNNEL_FORCE_CLIP = [2, 1, 1.2];

exports.ROTATION_CLIP_H = 0.5;
exports.ROTATION_CLIP_V = 0.45;
exports.ZERO_ROTATION = 0.001;
exports.FIX_ROTATION = 0.5;
exports.BEFORE_FIX_ROTATION = 0.25;



// character move type
exports.CM_FLY = m_phy.CM_FLY;

// train states NOT USED
exports.TS_NOT_STARTED        	= 0;
exports.TS_JUST_STARTED         = 1;
exports.TS_MOVE_IN	            = 2;
exports.TS_BOUNDS_IN            = 3;
exports.TS_BOUNDS_OUT		    = 4;
exports.TS_BOUNDS_FAR_OUT	    = 5;

// train states
/*
exports.TS_IN_CONTROL               = 1;
exports.TS_AUTO_OUT_STABILISE       = 2;
exports.TS_AUTO_IN                  = 3;
exports.TS_AUTO_IN_STABILISE        = 4;
*/


// presents
exports.PRESENTS_CTREATE_OFFSET		= 10;
exports.PRESENTS_BETWEEN			= 1;
exports.PRESENTS_SERIES				= 10;
exports.PRESENTS_CTREATE_WIDTH_H	= 5;
exports.PRESENTS_CTREATE_WIDTH_V	= 2;
exports.PRESENTS_IMPACT_OFFSET		= 7.75;
exports.PRESENTS_REMOVE_OFFSET		= -10;


// bat
exports.BATS_TO_USE					= 3;
exports.BAT_CTREATE_OFFSET			= 10;
exports.BAT_BETWEEN					= 10;
exports.BAT_INC_FACTOR				= 10;
exports.BAT_CTREATE_WIDTH_H			= 5;
exports.BAT_CTREATE_WIDTH_V			= 2;
exports.BAT_REMOVE_OFFSET			= -10;



// clouds
exports.CLOUDS_DEF_POS = new Float32Array([0, 0, 0]);
exports.CLOUDS_MAX_NUMBER_FACTOR = 1;

// earth
exports.EARTH_OFFSET = new Float32Array([0, 0, -10]);


// interface
exports.MOUSE_SHARPEN_FACTOR		= 1;
exports.MOUSE_OFF_LIMIT				= 1;
exports.TOUCHE_SHARPEN_FACTOR		= 1.5;
exports.TOUCHE_CENTER_OFFSET		= [0.25, 0];
exports.MOUSE_OFFSET_ZERO			= [0, 0];

// HMD
exports.HMD_SHARPEN_POS_FACTOR			= 1; //15
//exports.HMD_SHARPEN_ROT_FACTOR			= 1; //15



})