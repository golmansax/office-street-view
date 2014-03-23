define([
  'angular', '../../app/my_namespace', 'mocks'
], function(angular, my_namespace) {
  'use strict';

  describe('from_server service', function() {
    var from_server;

    var JS_VARS_FROM_SERVER_MOCK = {
      name: 'Holman',
      foods_enjoyed: ['Chinese', 'almond butter'],
      traits: {
        awesome: true,
        favorite_language: 'OCaml'
      }
    };

    beforeEach(module(my_namespace + '.services'));
    beforeEach(function() {
      // This variable is where the service grabs the data
      window.JS_VARS_FROM_SERVER = angular.copy(JS_VARS_FROM_SERVER_MOCK);

      inject(function(_from_server_) {
        from_server = _from_server_;
      });
    });

    it('should get variables correctly', function() {
      angular.forEach(JS_VARS_FROM_SERVER_MOCK, function(val, key) {
        expect(from_server.Get(key)).toEqual(val);
      });
    });

    it('should throw an error if key invalid', function() {
      var test_case = function () {
        from_server.Get('bogus');
      };

      expect(test_case).toThrow();
    });

    it('should throw an error if fetching the same key twice', function() {
      var test_case = function () {
        var key = 'name';
        from_server.Get(key);
        from_server.Get(key);
      };

      expect(test_case).toThrow();
    });
  });
});
