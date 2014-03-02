define(['../my_namespace', './module'], function(my_namespace, directives) {
  'use strict';

  directives.directive('navToPerson', ['People', 'routie',
    function(People, routie) {
      return {
        link: function($scope, elt, attrs) {
          if (!attrs.navToPerson) {
            throw 'navToPerson needs a person object';
          }

          elt.on('click', function() {
            var person = $scope.$eval(attrs.navToPerson);
            routie.To(People.Path(person.key));
          });
        }
      };
    }]);
});
