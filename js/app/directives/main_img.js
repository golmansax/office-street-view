define(['../my_namespace', './module'], function(my_namespace, directives) {
  'use strict';

  var my_name = my_namespace + 'MainImg';

  directives.directive(my_name, function() {
    return {
      link: function($scope, elt, attrs) {
        var Onload = $scope.$eval(attrs[my_name]);
        elt.on('load', Onload);
      }
    };
  });
});
