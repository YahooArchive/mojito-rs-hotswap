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

    function RSAddonHotswap() {
        RSAddonHotswap.superclass.constructor.apply(this, arguments);
    }

    RSAddonHotswap.NS = 'hotswap-yui';

    Y.extend(RSAddonHotswap, Y.Plugin.Base, {

        initializer: function (config) {
            var appConfigStatic = config.host.getStaticAppConfig();
            this.host = config.host;

            if (appConfigStatic.resourceStore && appConfigStatic.resourceStore.hotswap) {

                this.config = config;

                // put watchers on the resources once resolved
                this.afterHostMethod('addResourceVersion', this.addResourceVersion);
            }
        },

        addResourceVersion: function (res) {

            var self = this,
                host = self.host,
                fullPath = res.source.fs.fullPath,
                onSave;

            // skip resources that do not correspond to actual resources
            if (res.subtype === 'synthetic' || !res.source.fs.isFile) {
                return;
            }

            // If the modified resource is a script, reload it from the file
            // system into the runtime YUI instance.
            if (res.type === 'controller' ||
                    res.type === 'yui-module' ||
                    res.type === 'yui-lang' ||
                    (res.type === 'addon' && res.subtype === 'ac')) {

                // Upon save, wait 100 ms. (to let the system finish writing the file)
                // and reload;
                libfs.watch(fullPath, {
                    persistent: false
                }, function (event) {
                    setTimeout(function (event) {
                        try {
                            if (libfs.readFileSync(fullPath, 'utf8')) {
                                host.Y.applyConfig({ useSync: true });

                                // load
                                host.Y.Get.js(fullPath, {});

                                // detach
                                host.Y.Env._attached[res.yui.name] = false;

                                // reuse
                                host.Y.use(res.yui.name, function () {
                                    host.Y.log('Reloaded: ' + fullPath, 'info', NAME);
                                });

                                host.Y.applyConfig({ useSync: false });
                            }
                        } catch (e) {
                            if (host.Y) {
                                host.Y.log('Failed to reload module ' +
                                    (res.yui && res.yui.name) + ' at ' +
                                    fullPath + '\n' + e.message + '\n' + e.stack,
                                    'error', NAME);
                            }
                        }
                    }, 100);
                });
            }
        }
    });

    Y.namespace('mojito.addons.rs')[RSAddonHotswap.NS] = RSAddonHotswap;

}, '0.0.1', {
    requires: [
        'plugin',
        'oop'
    ]
});
