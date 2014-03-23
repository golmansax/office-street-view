(function() {
  'use strict';

  module.exports = function(grunt) {
    // Configure Grunt
    var grunt_config = {
      pkg: grunt.file.readJSON('package.json')
    };
    _LoadTasksIntoConfig(grunt_config, './tasks/options/');

    grunt.initConfig(grunt_config);

    // Load NPM plugin Grunt tasks
    require('load-grunt-tasks')(grunt);

    // Register custom tasks
    grunt.registerTask('default', ['build:prod']);

    // Dev tasks
    grunt.registerTask('build:dev', [
      'compass:dev', 'requirejs:dev', 'php2html'
    ]);
    grunt.registerTask('lint', ['jshint']);
    grunt.registerTask('test', ['lint', 'build:dev', 'jasmine']);
    grunt.registerTask('dev', ['test', 'server:dev']);

    // Prod tasks
    grunt.registerTask('build:prod', [
      'compass:prod', 'requirejs:prod', 'php2html'
    ]);

    // Do a sanity check by running all dev commands first
    grunt.registerTask('prod', ['test', 'build:prod']);

    // Run dev server
    grunt.registerTask('server:dev', 'shell:server');
  };

  return;

  // Idea to load from multiple files is from this site:
  //   http://www.thomasboyt.com/2013/09/01/maintainable-grunt.html
  function _LoadTasksIntoConfig(config, path) {
    var glob = require('glob');
    var key;

    glob.sync('*', {cwd: path}).forEach(function(option) {
      key = option.replace(/\.js$/,'');
      config[key] = require(path + option);
    });

    return config;
  }
})();
