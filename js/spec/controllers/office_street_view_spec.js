define([
  '../../app/my_namespace', '../data/js_vars_from_server', 'mocks'
], function(my_namespace, js_vars_from_server) {
  'use strict';

  var ctrl_name = 'OfficeStreetViewCtrl';
  describe(ctrl_name, function() {
    var $scope;

    beforeEach(module(my_namespace + '.controllers'));

    // We need this to get access to from_server
    beforeEach(module(my_namespace + '.services'));

    beforeEach(function() {
      // TODO
      js_vars_from_server.Set({
        bio_map: {}
      });
    });

    beforeEach(inject(function($controller, $rootScope) {
      $scope = $rootScope.$new();

      // Use a mocked version of the cube service
      $controller(ctrl_name, {
        $scope: $scope
      });
    }));

    it('should be loaded', function() {
      expect(true).toBe(true);
    });
  });
});
