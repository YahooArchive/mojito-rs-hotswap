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

    function RSYUIAddonHotswap() {
        RSYUIAddonHotswap.superclass.constructor.apply(this, arguments);
    }

    RSYUIAddonHotswap.NS = 'hotswap-yui';

    Y.extend(RSYUIAddonHotswap, Y.Plugin.Base, {

        initializer: function (config) {
            var appConfigStatic = config.host.host.getStaticAppConfig();
            this.host = config.host;

            if (appConfigStatic.resourceStore && appConfigStatic.resourceStore.hotswap) {

                this.config = config;

                // console.log('[hotswap-yui.js:29] beforeHost on yui plugin' + '');
                // put watchers on the resources once resolved
                this.beforeHostMethod('parseResourceVersion', this.parseResourceVersion);
            }
        },

        parseResourceVersion: function (source, type, subtype, mojitType) {
            console.log('[hotswap-yui.js:42] : ' + type + ' ' + subtype + ' ' + source.fs.basename);

            var self = this,
                host = self.config.host,
                res = Y.Do.currentRetVal,
                onSave;

            if (source.fs.ext === '.js') {

                // If the modified resource is a script, reload it from the file
                // system into the runtime YUI instance.
                if (type === 'controller' || (type === 'addon' && subtype === 'ac')) {
                    onSave = function (event) {
                        try {
                            if (libfs.readFileSync(source.fs.fullPath, 'utf8')) {
                                host.runtimeYUI.applyConfig({ useSync: true });

                                // load
                                host.runtimeYUI.Get.js(source.fs.fullPath, {});

                                // use
                                host.runtimeYUI.Env._attached[res.yui.name] = false;
                                host.runtimeYUI.use(res.yui.name, function () {
                                    host.runtimeYUI.log('Reloaded' + source.fs.basename, 'info', NAME);
                                });

                                host.runtimeYUI.applyConfig({ useSync: false });
                            }
                        } catch (e) {
                            host.runtimeYUI.log('Failed to reload module ' +
                                (res.yui && res.yui.name) + ' at ' +
                                source.fs.fullPath + '\n' + e.message + '\n' + e.stack,
                                'error', NAME);
                        }
                    };
                } else {
                    // Else just warn that this yui module needs restarting the app
                    onSave = function (event) {
                        host.runtimeYUI.log(source.fs.basename + ' will not be reloaded with hotswap.', 'warn', NAME);
                    };
                }

                libfs.watch(source.fs.fullPath, {
                    persistent: false
                }, onSave);
            }
        }
    });

    function RSAddonHotswap() {
        RSAddonHotswap.superclass.constructor.apply(this, arguments);
    }
    RSAddonHotswap.NS = 'hotswap-yui';

    Y.extend(RSAddonHotswap, Y.Plugin.Base, {

        initializer: function (config) {
            this.store = config.host;
            this.beforeHostMethod('preloadResourceVersions', this.preloadResourceVersions, this);
        },

        preloadResourceVersions: function () {
            this.store.yui.plug(RSYUIAddonHotswap, {});
        }
    });

    Y.namespace('mojito.addons.rs')[RSAddonHotswap.NS] = RSAddonHotswap;

}, '0.0.1', {
    requires: [
        'plugin',
        'oop'
    ]
});
