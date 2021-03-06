<!DOCTYPE html>

<!--
  ~ Copyright (c) 2011-2014 by Animatron.
  ~ All rights are reserved.
  -->

<html>
<head>
    <meta http-equiv="content-type" content="text/html; charset=UTF-8">
    <link rel="shortcut icon" type="image/x-icon" href="/favicon.ico" />
    <title>Animatron Movie</title>
    <style type="text/css">
        html, body {
            margin: 0;
            padding: 0;
        }

        body.no-iframe {
            /* width: 100%;
            height: 100%; */
            background-color: rgb(51, 51, 51);
        }

        canvas.no-iframe {
            border: 1px solid #ccc;
            top: 50%;
            left: 50%;
            display: block;
            position: absolute;
            box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.5);
        }

        canvas.no-rect {
            top: 10%;
            left: 10%;
        }
    </style>


    <script type="text/javascript">

        var inIFrame = false;

        var _u = (function() { /* utils */

            return {

            extractVal : function(params, name) {
                if (!params) return null;
                var res; if (res = params.match(
                    new RegExp('[\\?&]' + name + '=([\\w\\.\\-]+)')
                )) return (res.length && res[1]) ? res[1] : null;
            },

            injectVal : function(params, name, value) {
                if (!params) return name + '=' + value;
                var res = params.match(
                    new RegExp('[\\?&]' + name + '=[\\w-]+' ));
                if (!res || !res.length) return params + '&' + name + '=' + value;
                return params.replace(
                    new RegExp('([\\?&])' + name + '=[\\w-]+'),
                    '$1' + name + '=' + value
                );
            },

            getRequiredRect : function(params, w, h) {
                // w and h are precalculated scene sizes
                // so if there is iframe wrapper, return iframe size,
                // if there are width/height in params, return them,
                // else return these precalculated sizes
                if (inIFrame) return _u.getIframeSize();
                if (params) {
                    var wParam = parseInt(_u.extractVal(params, 'w')),
                        hParam = parseInt(_u.extractVal(params, 'h'));
                    if (wParam && hParam) return [ wParam, hParam ];
                }
                if (w && h) return [ w, h ];
            },

            getIframeSize : function() {
                var size = [0,0];
                if (typeof window.innerWidth == 'number') {
                  size = [window.innerWidth, window.innerHeight];
                } else {
                  size = [document.documentElement.clientWidth, document.documentElement.clientHeight];
                }

                return size;
            },

            reportError : function(_e) {
                if (console) console.error(_e.message || _e);
                else alert(_e.message || _e);
            },

            forcedJS : function(_path, _then) {
                var scriptElm = document.createElement('script');
                scriptElm.type = 'text/javascript';
                scriptElm.async = 'async';
                scriptElm.src = _path + '?' + (new Date()).getTime();
                scriptElm.onload = scriptElm.onreadystatechange = (function () {
                    var _success = false;
                    return function () {
                        if (!_success && (!this.readyState || (this.readyState == 'complete'))) {
                            _success = true;
                            _then();
                        } else if (!_success) {
                            _u.reportError(new Error('Request failed: ' + this.readyState));
                        }
                    }
                })();
                scriptElm.onerror = _u.reportError;
                var headElm = document.head || document.getElementsByTagName('head')[0];
                headElm.appendChild(scriptElm);
            },

            updateTitle: function(player) {
                if (player._metaInfo) {
                    var meta = player._metaInfo;
                    if (meta.author && meta.title) {
                        document.title = meta.title + ' (' + meta.author + ')';
                    } else if (meta.author) {
                       document.title = 'Untitled (' + meta.author + ')';
                    } else if (meta.title) {
                        document.title = meta.title;
                    } else {
                        document.title = 'Animatron Movie';
                    }
                }
            }

            };

        })();

        var start = (function () {

            var VERSION_MASK = '^(v[0-9]+(\\.[0-9]+){0,2})$|^latest$';

            var _search = location.search,
                _first_amp_pos = _search.indexOf('&'),
                _dash_pos = _search.indexOf('-'),
                _before_amp = (_first_amp_pos > 0) ? _search.substring(1, _first_amp_pos)
                                                   : _search.substring(1),
                _version_specified = (_first_amp_pos > 0) ? ((_dash_pos > 0) && (_dash_pos < _first_amp_pos))
                                                          : (_dash_pos > 0),
                _snapshot_id_len = (_version_specified ? _dash_pos
                                                       : (_first_amp_pos || _search.length)) - 1; // 1 is first '?' in _search

            var CANVAS_ID = 'target',
                PROTOCOL = ('https:' === document.location.protocol) ? 'https://' : 'http://',
                IS_DEV = document.location.toString().indexOf('player-dev')>=0,
                DOMAIN = IS_DEV ? 'animatron-snapshots-dev.s3.amazonaws.com'
                                : 'animatron-snapshots.s3.amazonaws.com',
                PLAYER_DOMAIN = IS_DEV ? 'player-dev.animatron.com'
                                       : 'player.animatron.com',
                URL_PREFIX = PROTOCOL + DOMAIN,
                SNAPSHOT_ID = _version_specified ? _before_amp.substring(0, _snapshot_id_len)
                                                 : _before_amp,
                SNAPSHOT_VERSION_ID = _version_specified ? _before_amp.substring(_snapshot_id_len + 1)
                                                         : 'latest',
                PLAYER_VERSION_ID = SNAPSHOT_VERSION_ID;

            if (!SNAPSHOT_VERSION_ID ||
                !SNAPSHOT_VERSION_ID.match(VERSION_MASK)) {
                _u.reportError(new Error('Snapshot Version ID \'' + SNAPSHOT_VERSION_ID + '\' is incorrect'));
                return;
            }

            inIFrame = (window.self !== window.top);

            var _params_ = (_first_amp_pos > 0) ? '?' + _search.substring(_first_amp_pos + 1) : null;
            var rect = _u.getRequiredRect(_params_);
            if (rect) {
                if (_params_) {
                    _params_ = _u.injectVal(_params_, 'w', rect[0]);
                    _params_ = _u.injectVal(_params_, 'h', rect[1]);
                }
                else {
                    _params_ = '?w=' + rect[0] + '&' + 'h=' + rect[1];
                }
            }
            var _snapshotUrl_ = URL_PREFIX + '/' + SNAPSHOT_ID +
                                (_version_specified ? ('-' + SNAPSHOT_VERSION_ID)
                                                    : '') + (_params_ || '');

            var temp_v = null;
            if (temp_v = _u.extractVal(_params_, 'v')) {
                if (!temp_v.match(VERSION_MASK)) {
                    _u.reportError(new Error('Player Version ID \'' + temp_v + '\' is incorrect'));
                    return;
                }

                PLAYER_VERSION_ID = temp_v;
            }

            return function () {
                try {
                    var cvs = document.getElementById(CANVAS_ID);
                    if (!inIFrame) {
                        document.body.className = 'no-iframe';
                        cvs.className = 'no-iframe';
                    }
                    if (rect) {
                        cvs.style.width = rect[0] + 'px';
                        cvs.style.height = rect[1] + 'px';
                        if (!inIFrame) {
                            cvs.style.marginLeft = - Math.floor(rect[0] / 2) + 'px';
                            cvs.style.marginTop  = - Math.floor(rect[1] / 2) + 'px';
                        }
                    } else if (!inIFrame) {
                        cvs.className += ' no-rect';
                    }
                    // all other versions, incl. 'latest' are ok with animatron.js bundle
                    var useStandartImporter = (PLAYER_VERSION_ID != 'v0.9.1404');

                    _u.forcedJS(PROTOCOL + PLAYER_DOMAIN + '/' + PLAYER_VERSION_ID +
                        (useStandartImporter ? '/bundle/animatron.js' : '/bundle/animatron-publish.js'),
                        function () {
                            var animatronImporter = (typeof AnimatronImporter !== 'undefined') ? new AnimatronImporter()
                                                                                               : anm.createImporter('animatron');
                            var player = anm.Player.forSnapshot(CANVAS_ID, _snapshotUrl_, useStandartImporter
                                                                                          ? animatronImporter
                                                                                          : new AnimatronPublishImporter()/*,
                                                                           _u.updateTitle */);
                            player.on(anm.C.S_LOAD,
                                (function(the_player) {
                                    return function(/*result*/) {
                                        _u.updateTitle(the_player);
                                    }
                                })(player)
                            );
                        }
                    );
                } catch (e) {
                    _u.reportError(e);
                }
            }

        })();

    </script>
</head>

<body onload="start();">
<canvas id="target"></canvas>
</body>
</html>
