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

                // console.log('[hotswap-yui.js:29] beforeHost on yui plugin' + '');
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
            if (res.subtype === 'synthetic') {
                return;
            }

            // If the modified resource is a script, reload it from the file
            // system into the runtime YUI instance.
            if (res.type === 'controller' ||
                    res.type === 'yui-module' ||
                    res.type === 'yui-lang' ||
                    (res.type === 'addon' && res.subtype === 'ac')) {

                console.log('[hotswap-yui.js:42] Ready to reload: ' + res.type + ' ' + res.subtype + ' ' + fullPath);
                onSave = function (event) {
                    try {
                        if (libfs.readFileSync(fullPath, 'utf8')) {
                            host.runtimeYUI.applyConfig({ useSync: true });

                            // load
                            host.runtimeYUI.Get.js(fullPath, {});

                            // use
                            host.runtimeYUI.Env._attached[res.yui.name] = false;
                            host.runtimeYUI.use(res.yui.name, function () {
                                host.runtimeYUI.log('Reloaded: ' + fullPath, 'info', NAME);
                            });

                            host.runtimeYUI.applyConfig({ useSync: false });
                        }
                    } catch (e) {
                        host.runtimeYUI.log('Failed to reload module ' +
                            (res.yui && res.yui.name) + ' at ' +
                            fullPath + '\n' + e.message + '\n' + e.stack,
                            'error', NAME);
                    }
                };
            } else if (res.source.fs.isFile) {
                console.log('[hotswap-yui.js:80] Won\'t reload: ' + res.type + ' ' + res.subtype + ' ' + fullPath);
                // Else just warn that this yui module needs restarting the app
                onSave = function (event) {
                    host.runtimeYUI.log(fullPath + ' will not be reloaded with hotswap.', 'warn', NAME);
                };
            }

            libfs.watch(fullPath, {
                persistent: false
            }, onSave);
        }
    });

    Y.namespace('mojito.addons.rs')[RSAddonHotswap.NS] = RSAddonHotswap;

}, '0.0.1', {
    requires: [
        'plugin',
        'oop'
    ]
});
