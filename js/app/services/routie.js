define(['angular', 'routie', './module'], function(angular, routie, services) {
  'use strict';

  // Explicity list all routes
  var ROUTES = [
    'office',
    'people/:key'
  ];
  var DEFAULT_ROUTE = 'office';

  services.factory('routie', ['$rootScope', function($rootScope) {
    var _me = {};
    var _route_fns;

    _Init();

    // This could potentially happen outside a $digest cycle
    _me.When = function(route, fn) {
      if (!_route_fns.hasOwnProperty(route)) {
        throw 'Need to list route in ROUTES in services/routie.js';
      }

      _route_fns[route].push(fn);
    };

    _me.To = function(route) {
      routie(route);
    };

    _me.ToDefault = function() {
      routie(DEFAULT_ROUTE);
    };

    return _me;

    function _Init() {
      _route_fns = {};
      angular.forEach(ROUTES, function(route) {
        _route_fns[route] = [];

        routie(route, function() {
          var route_args = arguments;

          // Ensure that this goes outside $digest
          setTimeout(function() {
            $rootScope.$apply(function() {
              var my_routes = _route_fns[route];

              for (var i = 0; i < my_routes.length; i++) {
                my_routes[i].apply(this, route_args);
              }
            });
          });
        });
      });

      routie('*', function(h) {
        routie(DEFAULT_ROUTE);
      });
    }
  }]);
});
