/*
 * Copyright (c) 2011-2013 by Animatron.
 * All rights are reserved.
 *
 * Animatron player is licensed under the MIT License, see LICENSE.
 */

function varyAll(conditions, tests) {
    for (var ci = 0, cl = conditions.length; ci < cl; ci++) {
        var condition = conditions[ci];
        describe(condition.description, (function(condition) { return function() {
            beforeEach(condition.prepare); // TODO: rename `prepare` to `before`
            if (condition.after) afterEach(condition.after);

            tests();
        } })(condition));
    }
}

/* function varyAll(conditions, tests) {
    for (var ci = 0, cl = conditions.length; ci < cl; ci++) {
        var condition = conditions[ci];
        it(condition.description, (function(condition) { return function() {
            condition.prepare(); // TODO: rename `prepare` to `before`

            tests();

            if (condition.after) condition.after();
        } })(condition));
    }
} */
