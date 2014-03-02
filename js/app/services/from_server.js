define(['./module'], function(services) {
  'use strict';

  services.factory('from_server', function() {
    var from_server = {};

    // This is where the from_server variables will be stored
    var _js_vars_from_server;
    _InitJsVarsFromServer();

    // We keep track of used vars, because vars from server should not be used
    // more than once
    var _used_vars = {};

    from_server.Get = function(key) {
      if (_used_vars.hasOwnProperty(key)) {
        throw 'Using from_server key (' + key + ') more than once';
      }

      if (!_js_vars_from_server.hasOwnProperty(key)) {
        throw 'Key (' + key + ') does not exist on from_server vars';
      }

      // Grab the val and delete it from the map
      var val = _js_vars_from_server[key];
      delete _js_vars_from_server[key];
      _used_vars[key] = true;

      return val;
    };

    return from_server;

    function _InitJsVarsFromServer() {
      _js_vars_from_server = window.JS_VARS_FROM_SERVER || {};

      // Let's hide this variable so people don't try to access this improperly
      window.JS_VARS_FROM_JSON = 'Surprise, use the Angular service instead!';
    }
  });
});
