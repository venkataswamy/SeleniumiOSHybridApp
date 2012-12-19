/*
 * Copyright Amadeus
 */
/**
 * Class to be extended to create a template test case using the Robot applet. The applet allows to execute user actions
 * (click, type, move, drag, ...) as if they were done by the user instead of simulating browser events.<br />
 * This test makes sure that the robot is loaded and initialized before starting the template test case
 */
Aria.classDefinition({
    $classpath : "aria.jsunit.RobotTestCase",
    $extends : "aria.jsunit.TemplateTestCase",
    $dependencies : ["aria.jsunit.SynEvents", "aria.jsunit.Robot"],
    $constructor : function () {
        this.$TemplateTestCase.constructor.call(this);

        /**
         * Events utility to simulate user actions
         * @type aria.jsunit.SynEvents
         */
        this.synEvent = aria.jsunit.SynEvents;
    },
    $destructor : function () {
        this.synEvent = null;
        this.$TemplateTestCase.$destructor.call(this);
    },
    $prototype : {
        run : function () {
            if (this.skipTest) {
                this.$TemplateTestCase.run.call(this);
            } else {
                var robot = aria.jsunit.Robot;
                if (robot.isUsable()) {
                    robot.initRobot({
                        fn : this.$TemplateTestCase.run,
                        scope : this
                    });
                } else {
                    this._startTest();
                    this.raiseFailure('Robot test cases require Java to be enabled');
                    this._endTest();
                }
            }
        }
    }
});