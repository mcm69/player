/**
 * Created with IntelliJ IDEA.
 * User: Nek
 * Date: 3/7/13
 * Time: 2:17 PM
 * To change this template use File | Settings | File Templates.
 */
(function () {
    "use strict";
    window.animate = function animate(spr, desc) {
        /*
         + 1. desc == []
         + 2. desc == {frames:[]}
         + 2. desc == {name:[]}
         + 2. desc == {name:[], name2: [], name3: []}
         + 2. desc == {fps:24, name:[], name2: [], name3: []}
         3. desc == {name:{frames:[],fps:24}}
         4. desc == {name:{frames:[],fps:24},name2:{frames:[],fps:24, loop: true},name3:{frames:[],fps:24}}
         5. desc == {name:{frames:[],fps:24},name2:{frames:[],fps:24, loop: true},name3:{frames:[],fps:24}}
         */
        var FPS = 24;

        var parseAnim;
        var time = 0;
        var playing = true;

        /*
         return adhoc objects composed from functionality
         */


        var play = function() {
            playing = true;
        };

        var stop = function() {
            playing = false;
        };

        var match = window.superduck.match;

        parseAnim = match(
            [{frames:Array, fps:Number}, function(v) {return (function(anim) {
                console.log("Anim desc is {frames:[]}");
                var FPS = v.fps;
                spr.play = play;
                spr.stop = stop;
                return function(t,d) {
                    if (playing) time = t*d;
                    spr.x.frame = anim.length === 1 ? anim[0] : anim[Math.floor(time*FPS%anim.length)];
                };
            })( v.frames);}],
            [{frames:Array}, function(v) {return (function(anim) {
                console.log("Anim desc is {frames:[]}");
                spr.play = play;
                spr.stop = stop;
                return function(t,d) {
                    if (playing) time = t*d;
                    spr.x.frame = anim.length === 1 ? anim[0] : anim[Math.floor(time*FPS%anim.length)];
                };
            })( v.frames);}],
            [[], function(v) {return (function(anim) {
                console.log("Anim desc is Array");
                spr.play = play;
                spr.stop = stop;
                return function(t,d) {
                    if (playing) time = t*d;
                    spr.x.frame = anim.length === 1 ? anim[0] : anim[Math.floor(time*FPS%anim.length)];
                };
            })(v);}],
            [{fps:Number}, function(v) {return (function(anims) {
                console.log("Anim desc is {fps:Number}");
                var FPS = anims.fps;
                delete anims.fps;
                var keys = Object.keys(anims);
                if (keys.length === 0) throw new Error("The animation config object is empty.");
                var anim = anims[keys[0]];
                spr.switch = function(name) {
                    anim = anims[name];
                };
                spr.play = play;
                spr.stop = stop;
                return function(t,d) {
                    if (playing) time = t*d;
                    spr.x.frame = anim.length === 1 ? anim[0] : anim[Math.floor(time*FPS%anim.length)];
                };
            })(v);}],
            [{}, function(v) {return (function(anims) {
                console.log("Anim desc is Object");
                var keys = Object.keys(anims);
                if (keys.length === 0) throw new Error("The anima config object is empty.");
                var anim = anims[keys[0]];
                spr.switch = function(name) {
                    anim = anims[name];
                };
                spr.play = play;
                spr.stop = stop;
                return function(t,d) {
                    if (playing) time = t*d;
                    spr.x.frame = anim.length === 1 ? anim[0] : anim[Math.floor(time*FPS%anim.length)];
                };
            })(v);}]
        );

        var fn = parseAnim(desc);
        console.log(fn);

        spr.modify([0,10000000000], fn);

        return spr;
    };

})();