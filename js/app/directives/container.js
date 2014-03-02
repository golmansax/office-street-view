define(['../my_namespace', './module'], function(my_namespace, directives) {
  'use strict';

  directives.directive(my_namespace + 'Container', function() {
    return {
      controller: 'OfficeStreetViewCtrl',
      replace: true,
      require: my_namespace + 'Container',
      templateUrl: 'directives/container'
    };
  });
});
