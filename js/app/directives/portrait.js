define(['../my_namespace', './module'], function(my_namespace, directives) {
  'use strict';

  directives.directive(my_namespace + 'Portrait', function() {
    return {
      scope: true,
      templateUrl: 'directives/portrait'
    };
  });
});
