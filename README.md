Hotswap plugin for Mojito's Resource Store
==========================================

Build Status
------------

[![Build Status](https://travis-ci.org/yahoo/mojito-rs-hotswap.png)](https://travis-ci.org/yahoo/mojito-rs-hotswap)

Usage
-----

In your app's package.json, add the `mojito-rs-addon` package as a dependency.

This package contains a set of [Mojito](https://github.com/yahoo/mojito)
Resource Store addons. Their role is to monitor changes in Mojito resources to
dynamically update the necessary Resource Store meta-data and see the changes
reflected in your application without having to restart the node process.

Currently, only resources containing YUI modules (e.g, controllers) are
supported. In the future, we should add an addon that can handle changes in
configuration files as well.

This addon can be enabled by setting `resourceStore.hotswap` to `true` in your
application static configuration. However, it is strongly recommended to enable
this plugin only on developer boxes!

Mojito allows you to disable the view cache, which you may want to configure on
developer boxes as well:

    viewEngine: {
        cacheTemplates: false
    }
