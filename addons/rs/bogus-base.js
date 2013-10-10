/*
 * Copyright (c) 2013, Yahoo! Inc. All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint indent: 4, stupid: true, nomen: true */

YUI.add('addon-rs-bogus-base', function (Y, NAME) {
    "use strict";

    function RSAddonBogusBase() {
        RSAddonBogusBase.superclass.constructor.apply(this, arguments);
    }

    RSAddonBogusBase.NS = 'bogusBase';

    Y.extend(RSAddonBogusBase, Y.Plugin.Base, {

        initializer: function (config) {
            console.log('[bogusBase.js:21] bogusBase is hooking itself into parseResourceVersion');
            this.beforeHostMethod('parseResourceVersion', this.parseResourceVersion, this);
        },

        parseResourceVersion: function () {
            this.myOwnMethod();
        },

        myOwnMethod: function () {
            console.log('[bogus-base.js:30] own method');
        }
    });

    Y.namespace('mojito.addons.rs').bogusBase = RSAddonBogusBase;

}, '0.0.1', {
    requires: [
        'plugin',
        'oop'
    ]
});
