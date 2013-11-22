// TODO: check all states are conforming to each other and every property keeps its value in different
// situations like handling events, tweens and everything

describe("the elements states", function() {

    describe("base state", function() {

        it("stays unchanged at start", function() {


        });

        describe("with tweens", function() {

            it("stays unchanged during some tween is applied", function() {

            });

            it("stays unchanged before a tween was applied", function() {

            });

            it("stays unchanged after a tween was applied", function() {

            });

        });

        describe("with events", function() {

            it("stays unchanged after some event was fired", function() {

            });

            it("if event modified it, applies changes", function() {

            });

        });

        describe("with user modifiers", function() {

            // TODO: test with trigger-modifiers when they will be implemented

            it("stays unchanged during execution of user modifier", function() {

            });

            it("stays unchanged before execution of user modifier", function() {

            });

            it("stays unchanged after execution of user modifier", function() {

            });

            it("applies a change from user modifier if matches its time of execution", function() {
                // also test if incrementing is supported
            });

            it("does not applies a change from user modifier if it misses its time of execution", function() {

            });

        });

        describe("in combinations", function() {

            it("stays unchanged after both event and modifier were applied", function() {

            });

        });

    });

    describe("dynamic state", function() {

        it("is empty at start", function() {


        });

        describe("with tweens", function() {

            // actually it is also tested in tweens.spec

            it("applies changes if some tween was applied", function() {

            });

            it("does not changes anything before a tween was applied", function() {

            });

            it("does not changes anything  after a tween was applied", function() {

            });

        });

        describe("with events", function() {

            it("stays unchanged after some event was fired", function() {

            });

            it("if event modified it, applies changes", function() {

            });

        });

        describe("with user modifiers", function() {

            // TODO: test with trigger-modifiers when they will be implemented

            it("stays unchanged during execution of user modifier", function() {

            });

            it("stays unchanged before execution of user modifier", function() {

            });

            it("stays unchanged after execution of user modifier", function() {

            });

            it("applies a change from user modifier if matches its time of execution", function() {
                // also test if incrementing is supported
            });

            it("does not applies a change from user modifier if it misses its time of execution", function() {

            });

        });

        describe("in combinations", function() {

            it("stays unchanged after both event and user modifier were applied", function() {

            });

            it("changes state to be a sum of base state and dynamic state if tween was applied", function() {

            });

            it("changes state to be a sum of base state and dynamic state if user modifier changed it", function() {

            });

            it("changes state to be a sum of base state and dynamic state if event changed it", function() {

            });

            it("changes state to be a sum of base state and dynamic state if both tween and event changed it", function() {

            });

            it("changes state to be a sum of base state and dynamic state if both tween and user modifier changed it", function() {

            });

            it("changes state to be a sum of base state and dynamic state if both event and user modifier changed it", function() {

            });

            it("changes state to be a sum of base state and dynamic state if tween and event and user modifier changed it", function() {

            });

        });

    });

    describe("actual state (sum of base state and dynamic state)", function() {

        it("is equal to base state at start", function() {


        });

        describe("with tweens", function() {

            // actually it is also tested in tweens.spec

            it("applies changes if some tween was applied", function() {

            });

            it("does not changes anything before a tween was applied", function() {

            });

            it("does not changes anything  after a tween was applied", function() {

            });

        });

        describe("with events", function() {

            it("stays unchanged after some event was fired", function() {

            });

            it("if event modified it, applies changes", function() {

            });

        });

        describe("with user modifiers", function() {

            // TODO: test with trigger-modifiers when they will be implemented

            it("stays unchanged during execution of user modifier", function() {

            });

            it("stays unchanged before execution of user modifier", function() {

            });

            it("stays unchanged after execution of user modifier", function() {

            });

            it("applies a change from user modifier if matches its time of execution", function() {
                // also test if incrementing is supported
            });

            it("does not applies a change from user modifier if it misses its time of execution", function() {

            });

        });

        describe("in combinations", function() {

            it("stays unchanged after both event and user modifier were applied", function() {

            });

            it("changes state to be a sum of base state and dynamic state if tween was applied", function() {

            });

            it("changes state to be a sum of base state and dynamic state if user modifier changed it", function() {

            });

            it("changes state to be a sum of base state and dynamic state if event changed it", function() {

            });

            it("changes state to be a sum of base state and dynamic state if both tween and event changed it", function() {

            });

            it("changes state to be a sum of base state and dynamic state if both tween and user modifier changed it", function() {

            });

            it("changes state to be a sum of base state and dynamic state if both event and user modifier changed it", function() {

            });

            it("changes state to be a sum of base state and dynamic state if tween and event and user modifier changed it", function() {

            });

        });

    });

    // We can calculate both states internally BEFORE actual handler call and keep the tweens diff in the memory to apply it
    // after the handler call in a case of BS alteration.

});
