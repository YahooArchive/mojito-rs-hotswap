/*
 * Copyright (c) 2013, Yahoo! Inc. All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint indent: 4, stupid: true, nomen: true */

YUI.add('addon-rs-bogus', function (Y, NAME) {
    "use strict";

    function RSBogusBaseBogusPlugin() {
        RSBogusBaseBogusPlugin.superclass.constructor.apply(this, arguments);
    }

    RSBogusBaseBogusPlugin.NS = 'bogus';

    Y.extend(RSBogusBaseBogusPlugin, Y.Plugin.Base, {

        initializer: function (config) {
            console.log('[bogus.js:21] bogus plugin is hooking itself into parseResourceVersion: ');
            this.beforeHostMethod('parseResourceVersion', this.parseResourceVersion, this);
        },

        parseResourceVersion: function () {
            console.log('[bogus.js:33] BOGUS EXECUTED!!');
        }
    });


    function RSBogusBasePlugin() {
        RSBogusBasePlugin.superclass.constructor.apply(this, arguments);
    }

    RSBogusBasePlugin.NS = 'bogusPlugger';

    Y.extend(RSBogusBasePlugin, Y.Plugin.Base, {

        initializer: function (config) {
            this.store = config.host;

            console.log('[bogus.js:42] bogusPlugger is hooking itself in preloadResourceVersions');
            this.beforeHostMethod('preloadResourceVersions', this.hookConfigPlugin, this);
        },

        hookConfigPlugin: function () {
            this.store.bogusBase.plug(RSBogusBaseBogusPlugin, {});
        }
    });

    Y.namespace('mojito.addons.rs').bogusPlugger = RSBogusBasePlugin;

}, '0.0.1', {
    requires: [
        'plugin',
        'oop',
        'addon-rs-bogus-base'
    ]
});
