/*
 * Copyright (c) 2011-2013 by Animatron.
 * All rights are reserved.
 *
 * Animatron Player is licensed under the MIT License, see LICENSE.
 *
 * @VERSION
 */

// see ./animatron-project-@VERSION.orderly for a readable scheme of accepted project

var AnimatronPublishImporter = (function() {

var IMPORTER_ID = 'ANM_PUBLISH';

var C = anm.C,
    Scene = anm.Scene,
    Element = anm.Element,
    Path = anm.Path,
    Text = anm.Text,
    Bands = anm.Bands,
    is = anm._typecheck;
    //test = anm._valcheck

var Import = {};

// -> Array[?]
Import._find = function(idx, src) {
    var res = src[idx];
    if (!res) throw new Error('Element with index ' + idx + ' was not found in ' + src);
    return src[idx];
}
// -> Integer
Import._type = function(src) {
    return src[0];
}

/** project **/
/*
 * object {
 *     object *meta*;     // meta info about the project (the same as for full format)
 *     object *anim*;     // animation info
 * } *project*;
 */
// -> Scene
Import.project = function(prj) {
    var scenes_ids = prj.anim.scenes;
    if (!scenes_ids.length) throw new Error('No scenes found in given project');
    var root = new Scene(),
        elems = prj.anim.elements;
    for (var i = 0, il = scenes_ids.length; i < il; i++) {
        var node_src = Import._find(scenes_ids[i], elems);
        if (Import._type(node_src) != TYPE_SCENE) throw new Error('Given Scene ID ' + scenes_ids[i] + ' points to something else');
        root.add(Import.node(node_src, elems));
    }
    if (prj.meta.duration != undefined) root.setDuration(prj.meta.duration);
    if (prj.anim.background) root.bgfill = Import.fill(prj.anim.background);
    return root;
}
/** meta **/
// -> Object
Import.meta = function(prj) {
    var _m = prj.meta;
    return {
        'title': _m.name,
        'author': _m.author,
        'copyright': _m.copyright,
        'version': _m.version,
        'description': _m.description,
        'duration': _m.duration,
        'created': _m.created,
        'modified': _m.modified
    };
}
/** anim **/
/*
 * object {
 *     array { number; number; } dimension;
 *     *fill* background;             // project background
 *     array [ *element* ] elements;  // array of all elements including scenes - top level elements
 *     array [ number; ] scenes;      // array of indices into elements array
 * } *anim*;
 */
// -> Object
Import.anim = function(prj) {
    var _a = prj.anim;
    return {
        'fps': _a.framerate,
        'width': _a.dimension ? Math.floor(_a.dimension[0]) : undefined,
        'height': _a.dimension ? Math.floor(_a.dimension[1]): undefined,
        'bgcolor': _a.background ? Import.fill(_a.background) : null
    }
}

var TYPE_UNKNOWN =  0,
    TYPE_CLIP    =  1,
    TYPE_SCENE   =  2,
    TYPE_PATH    =  3,
    TYPE_TEXT    =  4,
    TYPE_RECT    =  5,
    TYPE_OVAL    =  6,
    TYPE_PENCIL  =  7,
    TYPE_IMAGE   =  8,
    TYPE_GROUP   =  9,
    TYPE_BRUSH   = 10,
    TYPE_STAR    = 11,
    TYPE_POLYGON = 12,
    TYPE_CURVE   = 13,
    TYPE_AUDIO   = 14,
    TYPE_LINE    = 15;

/** node **/
/*
 * union {
 *     *shape_element*;
 *     *text_element*;
 *     *image_element*;
 *     *audio_element*;
 *     *clip_element*;
 * } *element*;
 */
// -> Element
Import.node = function(src, all, parent) {
    var type = Import._type(src);
    if ((type == TYPE_CLIP) ||
        (type == TYPE_SCENE) ||
        (type == TYPE_GROUP)) {
        return Import.branch(type, src, all);
    } else if (type != TYPE_UNKNOWN) {
        var trg = Import.leaf(type, src, parent);
        // FIXME: fire an event instead (event should inform about type of the importer)
        if (trg.importCustomData) trg.importCustomData(src, type, IMPORTER_ID);
        return trg;
    }
}
var L_ROT_TO_PATH = 1,
    L_OPAQUE_TRANSFORM = 2;
    //L_HIDDEN = 256; // IMPL?
/** branch (clip) **/
/*
 * array {
 *     number;                     // 0, type: 1 for clip, 2 for scene, 9 for group
 *     string;                     // 1, name
 *     array [ *layer* ];          // 2, layers
 * } *clip_element*;
 */
// -> Element
Import.branch = function(type, src, all) {
    var trg = new Element();
    trg.name = src[1];
    var _layers = src[2],
        _layers_targets = [];
    // in animatron layers are in reverse order
    for (var li = _layers.length; li--;) {
        /** layer **/
        /*
         * array {
         *     string;                     // 0, name
         *     *band*;                     // 1, band, default is absent, default is [0, infinity]
         *     number;                     // 2, index of element in the elements array
         *     number;                     // 3, if more than zero the number of masked layers under this one
         *     array { number; number; };  // 4, registration point, default is [0,0]
         *     *end-action*;               // 5, end action for this layer
         *     number;                     // 6, flags: 0x01 - rotate to path, 0x02 - opaque transform (TBD)
         *     array [ *tween* ];          // 7, array of tweens
         * } *layer*;
         */
        var lsrc = _layers[li],
            ltype = Import._type(lsrc[2]);

        // if there is a branch under the node, it will be a wrapper
        // if it is a leaf, it will be the element itself
        var ltrg = Import.node(Import._find(lsrc[2], all), all, trg);
        if (!ltrg.name) { ltrg.name = lsrc[0]; }

        // apply bands, pivot and registration point
        var flags = lsrc[6];
        //if (flags & L_HIDDEN) trg.disabled = true;
        var x = ltrg.xdata,
            b = Import.band(lsrc[1]);
        if (type == TYPE_GROUP) {
            x.gband = [ 0, b[1] ];
            x.lband = [ 0, b[1] ];
        } else {
            x.lband = b;
            x.gband = b; //in_band ? Bands.wrap(in_band, b) : b;
        }
        x.pvt = [ 0, 0 ];
        x.reg = lsrc[4] || [ 0, 0 ];
        /* if (lsrc[4]) {
            ltrg.bstate.x = lsrc[4][0];
            ltrg.bstate.y = lsrc[4][1];
        }; */

        // apply tweens
        if (lsrc[7]) {
            var translate;
            for (var tweens = lsrc[7], ti = 0, tl = tweens.length;
                 ti < tl; ti++) {
                var t = Import.tween(tweens[ti]);
                if (t.type == C.T_TRANSLATE) translate = t;
                ltrg.addTween(t);
            }
            if (translate && (flags & L_ROT_TO_PATH)) {
                ltrg.addTween({
                    type: C.T_ROT_TO_PATH,
                    band: t.band
                });
            }
        }

        /** end-action **/
        /*
         * union {
         *    array { number; };          // end action without counter, currently just one: 0 for "once"
         *    array { number; number; };  // end action with counter. first number is type: 1-loop, 2-bounce, second number is counter: 0-infinite
         * } *end-action*;
         */
        // transfer repetition data
        x.mode = Import.mode(lsrc[5][0]);
        if (lsrc[5].length > 1) {
            x.nrep = lsrc[5][1] || Infinity;
        }
        if (x.mode == C.R_LOOP) {
            ltrg.travelChildren(function(child) {
                child.xdata.mode = C.R_LOOP;
            });
        }

        // if do not masks any layers, just add to target
        // if do masks, set it as a mask for them while not adding
        if (!lsrc[3]) { // !masked
            trg.add(ltrg);
            _layers_targets.push(ltrg);
        } else {
            // layer is a mask, apply it to the required number
            // of previously collected layers
            var mask = ltrg,
                togo = lsrc[3], // layers below to apply mask
                targets_n = _layers_targets.length;
            if (togo > targets_n) {
                throw new Error('No layers collected to apply mask, expected ' + togo
                                + ', got ' + targets_n);
            };
            while (togo) {
                var masked = _layers_targets[targets_n-togo];
                masked.setMask(mask);
                togo--;
            }
        }
    }
    return trg;
}
/** leaf **/
// -> Element
Import.leaf = function(type, src, parent) {
    var trg = new Element();
    if (parent && parent.name) trg.name = '>' + parent.name;
    var x = trg.xdata;
         if (type == TYPE_IMAGE) { x.sheet = Import.sheet(src); }
    else if (type == TYPE_TEXT)  { x.text  = Import.text(src);  }
    else if (type != TYPE_AUDIO) { x.path  = Import.path(src); }
    if (trg.importCustomData) trg.importCustomData(src, type, IMPORTER_ID);
    return trg;
}

/** band **/
// -> Array[2, Float]
Import.band = function(src) {
    if (!src) return [ 0, Infinity ];
    if (src.length == 1) return [ src[0], Infinity ];
    if (src.length == 2) return src;
    throw new Error('Unknown format of band: ' + src);
}
/** path (shape) **/
/*
 * array {
 *     number;    // 0, any number which is not clip(1), scene(2), group(9), audio(14), image(8), text(4)
 *     *fill*;    // 1
 *     *stroke*;  // 2
 *     *shadow*;  // 3
 *     string;    // 4, svg encoded path (or new format)
 * } *shape_element*;
 */
// -> Path
Import.path = function(src) {
    return new Path(src[4], // Import.pathval
                    Import.fill(src[1]),
                    Import.stroke(src[2]),
                    Import.shadow(src[3]));
}
/** text **/
/*
 * array {
 *     4;                // 0
 *     *fill*;           // 1
 *     *stroke*;         // 2
 *     *shadow*;         // 3
 *     string;           // 4, css font
 *     string;           // 5, aligment: left/right/center // IMPL
 *     string;           // 6, text
 *     number;           // 7, flags, currently just one: 1 - underline // IMPL
 * } *text_element*;
 */
// -> Text
Import.text = function(src) {
    return new Text(src[6], src[4],
                    Import.fill(src[1]),
                    Import.stroke(src[2]),
                    Import.shadow(src[3]),
                    src[5]);
}
/** sheet (image) **/
/*
 * array {
 *     8;                          // 0
 *     string;                     // 1, url
 *     array { number; number; };  // 2, size [optional]
 * } *image_element*;
 */
// -> Sheet
Import.sheet = function(src) {
    var sheet = new anm.Sheet(src[1]);
    if (src[2]) sheet._dimen = src[2];
    return sheet;
}
/** tween **/
/*
 * union {
 *     *alpha_tween*;
 *     *rotate_tween*;
 *     *translate_tween*;
 *     *shear_tween*;
 *     *scale_tween*;
 * } *tween*;
 *
 * array {
 *     0;                          // 0, type
 *     array { number; number; };  // 1, band
 *     *easing*;                   // 2, optional easing
 *     union {
 *         array { number; };         // static alpha
 *         array { number; number; }; // alpha from, to
 *     };                          // 3
 * } *alpha_tween*;
 *
 * array {
 *     1;                          // 0, type
 *     array { number; number; };  // 1, band
 *     *easing*;                   // 2, optional easing
 *     union {
 *       array { number; };         // static rotate
 *       array { number; number; }; // rotate from, to
 *     };                          // 3
 * } *rotate_tween*;
 *
 * array {
 *     2;                          // 0, type
 *     array { number; number; };  // 1, band
 *     *easing*;                   // 2, optional easing
 *     union {
 *       array { number; };         // static sx=sy
 *       array { number; number; }; // dynamic from, to (sx=sy)
 *       array { number; number; number; number; }; // sx0, sy0, sx1, sy1
 *     };                          // 3
 * } *scale_tween*;
 *
 * array {
 *     3;                          // 0, type
 *     array { number; number; };  // 1, band
 *     *easing*;                   // 2, optional easing
 *     union {
 *       array { number; };         // static shx=shy
 *       array { number; number; }; // dynamic from, to (shx=shy)
 *       array { number; number; number; number; }; // shx0, shy0, shx1, shy1
 *     };                          // 3
 * } *shear_tween*;
 *
 * array {
 *     4;                          // 0, type
 *     array { number; number; };  // 1, band
 *     *easing*;                   // 2, optional easing
 *     string;                     // 3, path
 * } *translate_tween*;
 */
// -> Tween
Import.tween = function(src) {
    var type = Import.tweentype(src[0]);
    return {
        'type': type,
        'band': Import.band(src[1]),
        'easing': Import.easing(src[2]),
        'data': Import.tweendata(type, src[3])
    };
}
/** tweentype **/
// -> Type
Import.tweentype = function(src) {
    if (src === 0) return C.T_ALPHA;
    if (src === 1) return C.T_ROTATE;
    if (src === 2) return C.T_SCALE;
    if (src === 3) return C.T_SHEAR;
    if (src === 4) return C.T_TRANSLATE;
    //if (src === 5) return C.T_ROT_TO_PATH;
}
/** tweendata **/
// -> Any
Import.tweendata = function(type, src) {
    if (!src) return null;
    if (type == C.T_TRANSLATE) return Import.pathval(src);
    if ((type === C.T_ROTATE) ||
        (type === C.T_ALPHA)) {
        if (data.length == 2) return data;
        if (data.length == 1) return [ data[0], data[0] ];
    }
    if ((type === C.T_SCALE) ||
        (type === C.T_SHEAR)) {
        if (data.length == 4) return [ [ data[0], data[1] ],
                                       [ data[2], data[3] ] ];
        if (data.length == 2) return [ [ data[0], data[0] ],
                                       [ data[1], data[1] ] ];
        if (data.length == 1) return [ [ data[0], data[0] ],
                                       [ data[0], data[0] ] ];
    }
}
/** easing **/
/*
 * union {
 *     number;                     // 0, standard type: 0, 1, 2, 3 (tbd)
 *     string;                     // 1, svg encoded curve segment
 * } *easing*;
 */
// -> Object
Import.easing = function(src) {
    if (!src) return null;
    return {
        type: Import.easingtype(src[0]),
        data: src[1] ? Import.pathval('M0 0 ' + src[1] + ' Z') : null
    }
}
/** easingtype **/
Import.easingtype = function(src) {
    // IMPL
    if (src === 0) return C.E_PATH;
    if (src === 1) return C.E_DEF;
    if (src === 2) return C.E_IN;
    if (src === 3) return C.E_OUT;
    if (src === 4) return C.E_INOUT;
}
/** mode **/
Import.mode = function(src) {
    if (!src) return C.R_ONCE;
    if (src === 0) return C.R_ONCE;
    if (src === 1) return C.R_LOOP;
    if (src === 2) return C.R_BOUNCE;
    if (src === 3) return C.R_STAY;
}
/** brush (paint) **/
/*
 * union {
 *     string;          // color in rgba(), rgb, #xxxxxx or word format
 *     *lgrad*;         // linear gradient
 *     *rgrad*;         // radial gradient
 * } *paint*;
 */
Import.brush = function(src) {
    if (!src) return null;
    if (is.str(src)) {
        return { color: src };
    } else if (is.arr(src)) {
        return Import.grad(src);
    } else throw new Error('Unknown type of brush');
}
/** fill **/
Import.fill = Import.brush;
/** stroke **/
/*
 * union {
 *     array {
 *        number;       // 0, width
 *        *paint*;      // 1
 *     };
 *     array {
 *        number;       // 0, width
 *        *paint*;      // 1
 *        string;       // 2, linecap ("round"if empty)
 *        string;       // 3, linejoin ("round" if empty)
 *        number;       // 4, mitterlimit
 *     }
 * } *stroke*;
 */
Import.stroke = function(src) {
    if (!src) return null;
    var stroke = Import.brush(src[1]);
    stroke.width = src[0];
    stroke.cap = src[2] || C.PC_ROUND;
    stroke.join = src[3] || C.PC_ROUND;
    stroke.mitter = src[4];
    return stroke;
}
/** shadow **/
/*
 * array {
 *     number;       // 0, x
 *     number;       // 1, y
 *     number;       // 2, blur
 *     string;       // 3, css color
 * } *shadow*;
 */
Import.shadow = function(src) {
    if (!src) return null;
    var shadow = {};
    shadow.offsetX = src[0];
    shadow.offsetY = src[1];
    shadow.blurRadius = src[2];
    shadow.color = src[3];
    return shadow;
}
/** lgrad **/
/*
 * array {          // linear gradient
 *     array {
 *         number;  // x0
 *         number;  // y0
 *         number;  // x1
 *         number;  // y1
 *     }; // 0
 *     array [ string; ]; // 1, colors
 *     array [ number; ]; // 2, offsets
 * }
 */
/** rgrad **/
/*
 * array {          // radial gradient
 *     array {
 *         number;  // x0
 *         number;  // y0
 *         number;  // r0
 *         number;  // x1
 *         number;  // y1
 *         number;  // r1
 *     }; // 0
 *     array [ string; ]; // 1, colors
 *     array [ number; ]; // 2, offsets
 * }
 */
Import.grad = function(src) {
    var pts = src[0],
        colors = src[1],
        offsets = src[2];
    if (colors.length != offsets.length) {
        throw new Error('Number of colors do not corresponds to number of offsets in gradient');
    }
    var stops = [];
    for (var i = 0; i < offsets.length; i++) {
        stops.push([ offsets[i], colors[i] ]);
    }
    if (pts.length == 4) {
        return { lgrad: {
            dir: [ [ pts[0], pts[1] ], [ pts[2], pts[3] ] ],
            stops: stops
        } };
    } else if (pts.length == 6) {
        return { rgrad: {
            r: [ pts[4], pts[5] ],
            dir: [ [ pts[0], pts[1] ], [ pts[2], pts[3] ] ],
            stops: stops
        } };
    } else {
        throw new Error('Unknown type of graient with ' + pts.length + ' points');
    }
}
/** pathval **/
Import.pathval = function(src) {
    return new Path(src);
}

function __MYSELF() { }

__MYSELF.prototype.configureMeta = Import.meta;

__MYSELF.prototype.configureAnim = Import.anim;

__MYSELF.prototype.load = Import.project;

return __MYSELF;

})();