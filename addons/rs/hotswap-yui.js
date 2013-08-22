/*
 * Copyright (c) 2013, Yahoo! Inc. All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint node: true, nomen: true, stupid: true */
/*global YUI */

YUI.add('addon-rs-hotswap-yui', function (Y, NAME) {
    'use strict';

    var libfs = require('fs');

    function RSAddonHotswapYUI() {
        RSAddonHotswapYUI.superclass.constructor.apply(this, arguments);
    }

    RSAddonHotswapYUI.NS = 'hotswap-yui';

    Y.extend(RSAddonHotswapYUI, Y.Plugin.Base, {

        initializer: function (config) {
            var appConfigStatic = config.host.getStaticAppConfig();
            if (appConfigStatic.resourceStore &&
                    appConfigStatic.resourceStore.hotswap) {
                this.config = config;
                // put watchers on the resources once resolved
                this.afterHostMethod('parseResourceVersion',
                    this.parseResourceVersion, this);
            }
        },

        parseResourceVersion: function (source, type, subtype, mojitType) {
            var self = this,
                host = self.config.host,
                res = Y.Do.currentRetVal;

            // If the modified resource is a script, reload it from the file
            // system into the runtime YUI instance.

            if ('.js' === source.fs.ext) {
                libfs.watch(source.fs.fullPath, {
                    persistent: false
                }, function (event) {
                    try {
                        if (libfs.readFileSync(source.fs.fullPath, 'utf8')) {
                            host.runtimeYUI.applyConfig({ useSync: true });

                            // load
                            host.runtimeYUI.Get.js(source.fs.fullPath, {});

                            // use
                            host.runtimeYUI.Env._attached[res.yui.name] = false;
                            host.runtimeYUI.use(res.yui.name, function () {
                                host.runtimeYUI.log('Reloaded YUI module at: ' +
                                    source.fs.fullPath, 'info', NAME);
                            });

                            host.runtimeYUI.applyConfig({ useSync: false });
                        }
                    } catch (e) {
                        host.runtimeYUI.log('Failed to reload module ' +
                            (res.yui && res.yui.name) + ' at ' +
                            source.fs.fullPath + '\n' + e.message,
                            'error', NAME);
                    }
                });
            }
        }
    });

    Y.namespace('mojito.addons.rs')[RSAddonHotswapYUI.NS] = RSAddonHotswapYUI;

}, '0.0.1', {
    requires: [
        'plugin',
        'oop'
    ]
});
