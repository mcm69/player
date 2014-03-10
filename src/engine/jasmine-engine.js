// DOM Engine
// -----------------------------------------------------------------------------

// FIXME: move into `anm` namespace
// TODO: should engine contain somewhat like `registerEngine` in this case?

(function(_GLOBAL_) { // preparation function which is executed immediately
                      // all engines should provide __anm_getGlobal and
                      // __anm_registerGlobally

var $glob;

var isAmd = (typeof define === 'function' && define.amd),
    isCommonJSModule = (typeof module != 'undefined'),
    isCommonJSExports = (typeof exports === 'object');

var $glob = (typeof window !== 'undefined') ? window : _GLOBAL_;

if (!$glob) throw new Error('Failed to find global object');

$glob.__anm_getGlobal = function(name) {
    return ($glob || $wnd)[name];
}

$glob.__anm_registerGlobally = function(name, obj) {
    ($glob || $wnd)[name] = obj;
}

// the engine is the only object which tricks the 'define' function and executed and
// included inline, because it is required to pass its own define version to all other files
// and they cannot use any other define version
var $engine = JasmineEngine();

__define('anm/engines/jasmine-engine', [], $engine);
// TODO: also move our define and require to global space somehow and make them not to overlap with require.js?

$glob.__anm_engine = $engine;

function JasmineEngine() { return (function() { // wrapper here is just to isolate it, executed immediately

    var $JE = {};

    // PX_RATIO

    // require(what, func)
    // define(id?, what, func)

    // getRequestFrameFunc() -> function(callback)
    // getCancelFrameFunc() -> function(id)

    // ajax(url, callback) -> none

    // createTextMeasurer() -> function(text) -> [ width, height ]

    // createTransform() -> Transform

    // findElementPosition(elm) -> [ x, y ]
    // findScrollAwarePos(elm) -> [ x, y ]
    // // getElementBounds(elm) -> [ x, y, width, height, ratio ]
    // moveElementTo(elm, pos) -> none
    // disposeElement(elm) -> none
    // detachElement(parent | null, child) -> none

    // createCanvas(width, height, bg?, ratio?) -> canvas
    // assignPlayerToCanvas(id, player) -> canvas
    // getContext(canvas, type) -> context
    // playerAttachedTo(canvas, player) -> true | false
    // detachPlayer(canvas, player) -> none
    // extractUserOptions(canvas) -> options: object | {}
    // checkPlayerCanvas(canvas) -> true | false
    // hasUrlToLoad(canvas) -> string | null
    // setTabIndex(canvas) -> none
    // getCanvasSize(canvas) -> [ width, height ]
    // getCanvasPos(canvas) -> [ x, y ]
    // getCanvasParams(canvas) -> [ width, height, ratio ]
    // getCanvasBounds(canvas) -> [ x, y, width, height, ratio ]
    // setCanvasSize(canvas, width, height, ratio?) -> none
    // setCanvasPos(canvas, x, y) -> none
    // setCanvasBackground(canvas, value) -> none
    // lockCanvasResize(canvas) -> none
    // unlockCanvasResize(canvas) -> none
    // lockCanvasStyle(canvas) -> none
    // unlockCanvasStyle(canvas) -> none
    // addChildCanvas(id, parent, pos: [x, y], style: object, inside: boolean)

    // getEventPos(event, elm?) -> [ x, y ]
    // subscribeWindowEvents(handlers: object) -> none
    // subscribeCanvasEvents(canvas, handlers: object) -> none
    // unsubscribeCanvasEvents(canvas, handlers: object) -> none
    // subscribeSceneToEvents(canvas, scene, map) -> none
    // unsubscribeSceneFromEvents(canvas, scene) -> none

    // keyEvent(evt) -> Event
    // mouseEvent(evt, canvas) -> Event

    // define / require

    $JE.require = __require;

    $JE.define = __define;

    // Framing

    $JE.__frameFunc = null;
    $JE.__cancelFunc = null;
    $JE.getRequestFrameFunc = function() {
        if ($JE.__frameFunc) return $JE.__frameFunc;
        return ($JE.__frameFunc =
                    ($wnd.requestAnimationFrame ||
                     $wnd.webkitRequestAnimationFrame ||
                     $wnd.mozRequestAnimationFrame ||
                     $wnd.oRequestAnimationFrame ||
                     $wnd.msRequestAnimationFrame ||
                     $wnd.__anm__frameGen ||
                     function(callback){
                       return $wnd.setTimeout(callback, 1000 / 60);
                     })) };
    $JE.getCancelFrameFunc = function() {
        if ($JE.__cancelFunc) return $JE.__cancelFunc;
        return ($JE.__cancelFunc =
                    ($wnd.cancelAnimationFrame ||
                     $wnd.webkitCancelAnimationFrame ||
                     $wnd.mozCancelAnimationFrame ||
                     $wnd.oCancelAnimationFrame ||
                     $wnd.msCancelAnimationFrame ||
                     $wnd.__anm__frameRem ||
                     function(id){
                       return $wnd.clearTimeout(id);
                     })) };
    /*$JE.stopAnim = function(reqId) {
        $JE.getCancelFrameFunc()(reqId);
    }*/

    // Global things

    $JE.PX_RATIO = 1;

    $JE.ajax = function(url, callback, errback) {
        var result = $JE.nextAjaxResult || {};
        setTimeout(function() { callback(result); }, 1000);
    }

    $JE.__textBuf = null;
    $JE.createTextMeasurer = function() {
        var buff = $JE.__textBuf;
        if (!buff) {
            /* FIXME: dispose buffer when text is removed from scene */
            var _div = $doc.createElement('div');
            _div.style.visibility = 'hidden';
            _div.style.position = 'absolute';
            _div.style.top = -10000 + 'px';
            _div.style.left = -10000 + 'px';
            var _span = $doc.createElement('span');
            _div.appendChild(_span);
            $doc.body.appendChild(_div);
            $JE.__textBuf = _span;
            buff = $JE.__textBuf;
        }
        return function(text, lines_arg) {
            var has_arg = (typeof lines_arg !== 'undefined');
            var lines = has_arg ? lines_arg : text.lines;
            buff.style.font = text.font;
            buff.style.textAlign = text.align;
            buff.style.verticalAlign = text.baseline || 'bottom';
            if (Array.isArray(text.lines)) { // FIXME: replace with anm.is.arr()
                buff.textContent = text.lines.join('<br/>');
            } else {
                buff.textContent = text.lines.toString();
            }
            // TODO: test if lines were changed, and if not,
            //       use cached value
            return [ buff.offsetWidth,
                     buff.offsetHeight ];
        }
    }

    $JE.createTransform = function() {
        return new Transform();
    }

    // Elements

    /* FIXME: replace with elm.getBoundingClientRect();
       see http://stackoverflow.com/questions/8070639/find-elements-position-in-browser-scroll */
    // returns position on a screen, _including_ scroll
    $JE.findElementPosition = function(elm) {
        var curleft = 0,
            curtop = 0;
        do {
            curleft += elm.offsetLeft;
            curtop += elm.offsetTop;
        } while (elm = elm.offsetParent);
        return [ curleft, curtop ];
    }
    $JE.findScrollAwarePosition = function(elm) {
        //var bound = elm.getBoundingClientRect();
        //return [ bound.left, bound.top ];
        var curleft = 0,
            curtop = 0;
        do {
            curleft += elm.offsetLeft - ((elm !== document.body)
                                                    ? elm.scrollLeft
                                                    : document.documentElement.scrollLeft);
            curtop += elm.offsetTop - ((elm !== document.body)
                                                    ? elm.scrollTop
                                                    : document.documentElement.scrollTop);
        } while (elm = elm.offsetParent);
        return [ curleft, curtop ];
    }
    /*$JE.getElementBounds = function(elm) {
        var rect = elm.getBoundingClientRect();
        return [ rect.left, rect.top, rect.width, rect.height, $JE.PX_RATIO ];
    }*/
    $JE.moveElementTo = function(elm, pos) {
        elm.style.left = pos[0] + 'px';
        elm.style.top  = pos[1] + 'px';
    }

    $JE.__trashBin;
    $JE.disposeElement = function(elm) {
        var trashBin = $JE.__trashBin;
        if (!trashBin) {
            trashBin = $doc.createElement('div');
            trashBin.id = 'trash-bin';
            trashBin.style.display = 'none';
            $doc.body.appendChild(trashBin);
            $JE.__trashBin = trashBin;
        }
        trashBin.appendChild(elm);
        trashBin.innerHTML = '';
    }
    $JE.detachElement = function(parent, child) {
        (parent || child.parentNode).removeChild(child);
    }

    // Creating & Modifying Canvas

    $JE.createCanvas = function(width, height, bg, ratio) {
        var cvs = $doc.createElement('canvas');
        $JE.setCanvasSize(cvs, width, height, ratio);
        if (bg) $JE.setCanvasBackground(cvs, bg);
        return cvs;
    }
    $JE.assignPlayerToCanvas = function(id, player) {
        var cvs = $doc.getElementById(id);
        //if (!cvs) throw new PlayerErr(_strf(Errors.P.NO_CANVAS_WITH_ID, [id]));
        //if (cvs.getAttribute(MARKER_ATTR)) throw new PlayerErr(Errors.P.ALREADY_ATTACHED);
        if (!cvs) throw new Errror('No canvas with id \'' + id + '\' was found.');
        if (cvs.getAttribute(MARKER_ATTR)) throw new Error('Player is already attached to canvas \'' + id + '\'.');
        cvs.setAttribute(MARKER_ATTR, true);
        return cvs;
    }
    $JE.playerAttachedTo = function(cvs, player) {
        return cvs.hasAttribute(MARKER_ATTR);
    }
    $JE.detachPlayer = function(cvs, player) {
        cvs.removeAttribute(MARKER_ATTR);
    }
    $JE.getContext = function(cvs, type) {
        return cvs.getContext(type);
    }
    $JE.extractUserOptions = function(cvs) {
      var width, height,
          ratio = $JE.PX_RATIO;
      return { 'debug': __attrOr(cvs, 'data-debug', undefined),
               'inParent': undefined,
               'muteErrors': __attrOr(cvs, 'data-mute-errors', false),
               'repeat': __attrOr(cvs, 'data-repeat', undefined),
               'mode': __attrOr(cvs, 'data-mode', undefined),
               'zoom': __attrOr(cvs, 'data-zoom', undefined),
               'meta': { 'title': __attrOr(cvs, 'data-title', undefined),
                         'author': __attrOr(cvs, 'data-author', undefined),
                         'copyright': undefined,
                         'version': undefined,
                         'description': undefined },
               'anim': { 'fps': undefined,
                         'width': (__attrOr(cvs, 'data-width',
                                  (width = __attrOr(cvs, 'width', undefined),
                                   width ? (width / ratio) : undefined))),
                         'height': (__attrOr(cvs, 'data-height',
                                   (height = __attrOr(cvs, 'height', undefined),
                                    height ? (height / ratio) : undefined))),
                         'bgcolor': cvs.hasAttribute('data-bgcolor')
                                   ? cvs.getAttribute('data-bgcolor')
                                   : undefined,
                         'duration': undefined } };
    }
    $JE.checkPlayerCanvas = function(cvs) {
        return true;
    }
    $JE.hasUrlToLoad = function(cvs) {
        return cvs.getAttribute(URL_ATTR);
    }
    $JE.setTabIndex = function(cvs, idx) {
        cvs.setAttribute('tabindex', idx);
    }
    $JE.getCanvasParams = function(cvs) {
        // if canvas size was not initialized by player, will return null
        if (!cvs.__anm_width || !cvs.__anm_height) return null;
        return [ cvs.__anm_width, cvs.__anm_height, $JE.PX_RATIO ];
    }
    $JE.getCanvasSize = function(cvs) {
        return [ cvs.getAttribute('clientWidth') || cvs.clientWidth,
                 cvs.getAttribute('clientHeight') || cvs.clientHeight ];
    }
    $JE.getCanvasPos = function(cvs) {
        return $JE.findScrollAwarePosition(cvs);
    }
    $JE.getCanvasBounds = function(cvs/*, parent*/) {
        //var parent = parent || cvs.parentNode;
        var params = $JE.getCanvasParams(cvs);
        if (!params) return null;
        var pos = $JE.getCanvasPos(cvs);
        // bounds are: left, top, width, height, ratio.
        // I am not sure if I am correct in providing width/height instead of
        // left+width/top+height, but I think it's better to return values
        // not required to sum up/subtract in this case.
        return [ pos[0], pos[1], params[0], params[1], params[2] ];
    }
    $JE.setCanvasSize = function(cvs, width, height, ratio) {
        //$log.debug('request to resize canvas ' + (cvs.id || cvs) + ' to ' + width + ' ' + height);
        if (cvs.__anm_lockResize) return;
        var ratio = ratio || $JE.PX_RATIO;
        var _w = width | 0,
            _h = height | 0;
        //$log.debug('resizing ' + (cvs.id || cvs) + ' to ' + _w + ' ' + _h);
        cvs.__anm_ratio = ratio;
        cvs.__anm_width = _w;
        cvs.__anm_height = _h;
        cvs.style.width = _w + 'px';
        cvs.style.height = _h + 'px';
        cvs.setAttribute('width', _w * (ratio || 1));
        cvs.setAttribute('height', _h * (ratio || 1));
        $JE._saveCanvasPos(cvs);
        return [ _w, _h ];
    }
    $JE.setCanvasPos = function(cvs, x, y) {
        cvs.__anm_usr_x = x;
        cvs.__anm_usr_y = y;
        // TODO: actually move canvas
        $engine._saveCanvasPos(cvs);
    }
    $JE.setCanvasBackground = function(cvs, bg) {
        if (cvs.__anm_lockStyle) return;
        cvs.style.backgroundColor = bg;
    }
    $JE.updateCanvasMetrics = function(cvs) {
        var pos = $JE.getCanvasPos(cvs),
            size = $JE.getCanvasSize(cvs);
        cvs.__anm_ratio = $JE.PX_RATIO;
        cvs.__anm_x = pos[0];
        cvs.__anm_y = pos[1];
        cvs.__anm_width = size[0];
        cvs.__anm_height = size[1];
        $JE._saveCanvasPos(cvs);
    }
    $JE._saveCanvasPos = function(cvs) {
        // FIXME: use getBoundingClientRect?
        var gcs = ($doc.defaultView &&
                   $doc.defaultView.getComputedStyle); // last is assigned

        // computed padding-left
        var cpl = gcs ?
              (parseInt(gcs(cvs, null).paddingLeft, 10) || 0) : 0,
        // computed padding-top
            cpt = gcs ?
              (parseInt(gcs(cvs, null).paddingTop, 10) || 0) : 0,
        // computed border-left
            cbl = gcs ?
              (parseInt(gcs(cvs, null).borderLeftWidth,  10) || 0) : 0,
        // computed border-top
            cbt = gcs ?
              (parseInt(gcs(cvs, null).borderTopWidth,  10) || 0) : 0;

        var html = $doc.body.parentNode,
            htol = html.offsetLeft,
            htot = html.offsetTop;

        var elm = cvs,
            ol = cpl + cbl + htol,
            ot = cpt + cbt + htot;

        if (elm.offsetParent !== undefined) {
            do {
                ol += elm.offsetLeft;
                ot += elm.offsetTop;
            } while (elm = elm.offsetParent)
        }

        ol += cpl + cbl + htol;
        ot += cpt + cbt + htot;

        /* FIXME: find a method with no injection of custom properties
                  (data-xxx attributes are stored as strings and may work
                   a bit slower for events) */
        cvs.__rOffsetLeft = ol || cvs.__anm_usr_x;
        cvs.__rOffsetTop = ot || cvs.__anm_usr_y;
    }
    $JE.lockCanvasResize = function(cvs) {
        cvs.__anm_lockResize = true;
    }
    $JE.unlockCanvasResize = function(cvs) {
        cvs.__anm_lockResize = false;
    }
    $JE.lockCanvasStyle = function(cvs) {
        cvs.__anm_lockStyle = true;
    }
    $JE.unlockCanvasStyle = function(cvs) {
        cvs.__anm_lockStyle = false;
    }
    $JE.addChildCanvas = function(id, parent, pos, style, inside) {
        // pos should be: [ x, y, w, h ]
        // style may contain _class attr
        var _ratio = $JE.PX_RATIO,
            _x = pos[0], _y = pos[1],
            _w = pos[2], _h = pos[3], // width & height
            // FIXME: the variables below are not used
            _pp = $JE.findElementPosition(parent), // parent position
            _bp = [ _pp[0] + parent.clientLeft + _x, _pp[1] + parent.clientTop + _y ], // bounds position
            _cp = inside ? [ parent.parentNode.offsetLeft + parent.clientLeft + _x,
                             parent.parentNode.offsetTop  + parent.clientTop + _y ]
                           : _bp; // position to set in styles
        var cvs = $JE.createCanvas(_w, _h, null, _ratio);
        cvs.id = parent.id ? ('__' + parent.id + '_' + id) : ('__anm_' + id) ;
        if (style._class) cvs.className = style._class;
        for (var prop in style) {
            cvs.style[prop] = style[prop];
        }
        cvs.style.left = _cp[0] + 'px';
        cvs.style.top = _cp[1] + 'px';
        var appendTo = inside ? parent.parentNode
                              : $doc.body;
        // FIXME: a dirty hack?
        if (inside) { appendTo.style.position = 'relative'; }
        appendTo.appendChild(cvs);
        return cvs;
    }

    // Events

    $JE.getEventPos = function(evt, elm) {
        /*if (elm && (elm.__rOffsetLeft || elm.__rOffsetTop)) return [ evt.pageX - elm.__rOffsetLeft,
                                                                     evt.pageY - elm.__rOffsetTop ];
        else */ if (elm) {
            var shift = $JE.findElementPosition(elm);
            return [ evt.pageX - shift[0], evt.pageY - shift[1] ];
        } else return [ evt.pageX, evt.pageY ];
    }
    $JE.subscribeWindowEvents = function(handlers) {
        for (var type in handlers) {
            $wnd.addEventListener(type, handlers[type], false);
        }
    }
    $JE.subscribeCanvasEvents = function(cvs, handlers) {
        for (var type in handlers) {
            cvs.addEventListener(type, handlers[type], false);
        }
    }
    $JE.unsubscribeCanvasEvents = function(cvs, handlers) {
        for (var type in handlers) {
            cvs.removeEventListener(type, handlers[type]);
        }
    }
    $JE.keyEvent = function(e) {
        return { key: ((e.keyCode != null) ? e.keyCode : e.which),
                 ch: e.charCode };
    }
    $JE.mouseEvent = function(e, cvs) {
        return { pos: $JE.getEventPos(e, cvs) };
    }
    var _kevt = $JE.keyEvent,
        _mevt = $JE.mouseEvent;
    $JE.subscribeSceneToEvents = function(cvs, scene, map) {
        if (cvs.__anm_subscribed &&
            cvs.__anm_subscribed[scene.id]) {
            return;
        }
        //cvs.__anm_subscription_id = guid();
        if (!cvs.__anm_handlers)   cvs.__anm_handlers = {};
        if (!cvs.__anm_subscribed) cvs.__anm_subscribed = {};
        var handlers = cvs.__anm_subscribed[scene.id] || {
          mouseup:   function(evt) { scene.fire(map.mouseup,   _mevt(evt, cvs)); },
          mousedown: function(evt) { scene.fire(map.mousedown, _mevt(evt, cvs)); },
          mousemove: function(evt) { scene.fire(map.mousemove, _mevt(evt, cvs)); },
          mouseover: function(evt) { scene.fire(map.mouseover, _mevt(evt, cvs)); },
          mouseout:  function(evt) { scene.fire(map.mouseout,  _mevt(evt, cvs)); },
          click:     function(evt) { scene.fire(map.click,     _mevt(evt, cvs)); },
          dblclick:  function(evt) { scene.fire(map.dblclick,  _mevt(evt, cvs)); },
          keyup:     function(evt) { scene.fire(map.keyup,     _kevt(evt)); },
          keydown:   function(evt) { scene.fire(map.keydown,   _kevt(evt)); },
          keypress:  function(evt) { scene.fire(map.keypress,  _kevt(evt)); }
        };
        cvs.__anm_handlers[scene.id] = handlers;
        cvs.__anm_subscribed[scene.id] = true;
        $JE.subscribeCanvasEvents(cvs, handlers);
    }
    $JE.unsubscribeSceneFromEvents = function(cvs, scene) {
        if (!cvs.__anm_handlers   ||
            !cvs.__anm_subscribed ||
            !cvs.__anm_subscribed[scene.id]) return;
        var handlers = cvs.__anm_handlers[scene.id];
        if (!handlers) return;
        $JE.unsubscribeCanvasEvents(cvs, handlers);
    }

    return $JE;

})(this); };

function __getAllFromGlob(what) {
    var what = Array.isArray(what) ? what : [ what ], // FIXME: replace with anm.is.arr()
        collected = [];
    for (var i = 0, il = what.length; i < il; i++) {
        collected.push(__getGlob(what[i]));
    }
    return collected;
}

function __getGlob(path) {
    // TODO: convert dashes to camel-case
    var split = path.split('/');
    var trg = $glob;
    for (var i = 0, il = split.length; i < il; i++) {
        trg = trg[split[i]];
    }
    return trg;
}

function __setGlob(path, val) {
    // TODO: convert dashes to camel-case
    var split = path.split('/');
    var trg = $glob;
    for (var i = 0, il = split.length; i < il; i++) {
        if (!trg[split[i]]) {
            trg[split[i]] = (i === (il - 1)) ? val : {};
        } else if (i === (il - 1)) {
            for (var prop in val) {
                trg[split[i]][prop] = val[prop];
            }
        }
        trg = trg[split[i]];
    }
}

function __prepareForNativeRequire(what) {
    // TODO: convert dashes to camel-case
    var what = Array.isArray(what) ? what : [ what ], // FIXME: replace with anm.is.arr()
        collected = [],
        split;
    for (var i = 0, il = what.length; i < il; i++) {
        collected.push(__adaptForNativeRequire(what[i]));
    }
    return collected;
}

function __adaptForNativeRequire(what) {
    // TODO: convert dashes to camel-case
    var split = what[i].split('/');
    if (split.length == 1) return split[0];
    var trg = '';
    for (var i = 1, il = split.length; i < il; i++) {
        trg += split[i] + ((i !== il - 1) ? '/' : '');
    }
    return trg;
}

function __require(what, func) {
    if (isAmd || isCommonJSModule || isCommonJSExports) {
        require(__prepareForNativeRequire(what), func);
    } else {
        func.apply(null, __getGlob(what));
    }
}

function __define(arg1, arg2, arg3) {
    var id = arg3 ? arg1 : null,
        req = arg3 ? arg2 : arg1,
        value = arg3 ? arg3 : arg2;

    if (isAmd) {
        define.apply(null, arguments);
    } else {
        // id will be a file-path
        var isFunc = (typeof value == 'function');
        var call_with = req ? ((isCommonJSModule || isCommonJSExports) ? __prepareForNativeRequire(req)
                                                                       : __getAllFromGlob(req))
                            : [];
        if (!isFunc) {
            for (var i = 0, il = call_with.length; i < il; i++) { require(call_with[i]); }
        }
        var result = (typeof value == 'function') ? value.apply(null, call_with) : value;
        if (isCommonJSModule) {
            module.exports = result;
        } else if (isCommonJSExports) {
            exports = result;
        } else {
            __setGlob(id, result);
        }
    }
}

})(this);
