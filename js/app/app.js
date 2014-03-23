define([
  'angular', './my_namespace', 'bindonce', 'recompile',
  './controllers/index', './directives/index', './filters/index',
  './services/index'
], function(angular, my_namespace) {
  'use strict';

  return angular.module(my_namespace + '.app', [
    my_namespace + '.directives',
    my_namespace + '.controllers',
    my_namespace + '.filters',
    my_namespace + '.services',
    'pasvaz.bindonce',
    'room77.recompile'
  ]).config(['$interpolateProvider', function($interpolateProvider) {
    $interpolateProvider.startSymbol('[[').endSymbol(']]');
  }]);
});
