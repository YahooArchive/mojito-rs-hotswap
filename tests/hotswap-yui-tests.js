/*jslint node: true, nomen: true, stupid: true */
/*global YUI: true, YUITest: true */

YUI.add('addon-rs-hotswap-yui-tests', function (Y, NAME) {
    'use strict';

    var libfs = require('fs'),
        libpath = require('path'),

        A = YUITest.Assert,

        fixtures = libpath.join(__dirname, 'fixtures/store'),

        hotswapMojitControllerResourcePath = libpath.join(fixtures, 'mojits/HotswapMojit/controller.server.js'),

        oldControllerContent =
            "YUI.add('HotswapMojit', function (Y, NAME) {\n" +
            "    'use strict';\n" +
            "    Y.hotswap = 'originalValue';\n" +
            "});",

        newControllerContent =
            "YUI.add('HotswapMojit', function (Y, NAME) {\n" +
            "    'use strict';\n" +
            "    Y.hotswap = 'modifiedValue';\n" +
            "});",

        suite = new YUITest.TestSuite(NAME),

        store;

    Y.applyConfig({
        modules: {
            'addon-rs-hotswap-yui': {
                requires: ['plugin', 'oop'],
                fullpath: libpath.join(__dirname, '../addons/rs/hotswap-yui.js')
            }
        }
    });

    Y.applyConfig({ useSync: true });
    Y.use('addon-rs-hotswap-yui');
    Y.applyConfig({ useSync: false });

    function MockRS(config) {
        MockRS.superclass.constructor.apply(this, arguments);
    }

    MockRS.NAME = 'MockResourceStore';

    MockRS.ATTRS = {};

    Y.extend(MockRS, Y.Base, {

        initializer: function (cfg) {
            this._config = cfg || {};
        },

        blendStaticContext: function (ctx) {
            return Y.mojito.util.blend(this._config.context, ctx);
        },

        getStaticAppConfig: function () {
            return {
                resourceStore: {
                    hotswap: true
                }
            };
        },

        listAllMojits: function () {
            return ['HotswapMojit'];
        },

        addResourceVersion: function (res) {
            return;
        },

        getResourceVersions: function () {
            return [{
                yui: {
                    name: 'HotswapMojit'
                },
                affinity: {
                    affinity: 'server'
                },
                source: {
                    pkg: {
                        name: 'mojito'
                    }
                }
            }];
        }
    });

    suite.add(new YUITest.TestCase({

        name: 'hotswap yui rs addon tests',

        setUp: function () {

            libfs.writeFileSync(hotswapMojitControllerResourcePath, oldControllerContent);

            store = new MockRS({ root: fixtures });

            // Plug in mocked config addon
            store.plug(Y.mojito.addons.rs.config, {
                appRoot: fixtures,
                mojitoRoot: ''
            });

            // Plug in hotswap YUI addon
            store.plug(Y.mojito.addons.rs['hotswap-yui'], {
                appRoot: fixtures,
                mojitoRoot: ''
            });

            // Give the store a reference to the runtime YUI instance
            store.runtimeYUI = Y;

            // Add a fake YUI resource to the runtime YUI instance
            Y.applyConfig({
                modules: {
                    HotswapMojit: {
                        fullpath: hotswapMojitControllerResourcePath,
                        requires: []
                    }
                }
            });

            // Execute the original module
            Y.applyConfig({ useSync: true });
            Y.use('HotswapMojit');
            Y.applyConfig({ useSync: false });

            // Trigger the addon hook on this method so the file is watched
            store.addResourceVersion({
                type: 'controller',
                yui: {
                    name: 'HotswapMojit'
                },
                fs: {
                    ext: '.js',
                    fullPath: hotswapMojitControllerResourcePath
                }
            });
        },

        tearDown: function () {
            store = null;

            // Reset the fixture to the original content
            libfs.writeFile(hotswapMojitControllerResourcePath, oldControllerContent);
        },

        'disk change is propagated to live YUI module': function () {
            var test = this;

            A.areEqual('originalValue', Y.hotswap);

            // Modify the resource on the filesystem
            libfs.writeFile(hotswapMojitControllerResourcePath, newControllerContent,
                function (err) {
                    test.resume();

                    if (err) {
                        throw err;
                    }

                    A.areEqual('modifiedValue', Y.hotswap);
                });

            test.wait();
        }
    }));

    YUITest.TestRunner.add(suite);

}, '1.0.0', {
    requires: [
        'base',
        'oop'
    ]
});
