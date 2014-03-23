(function() {
  'use strict';

  module.exports = {
    server: {
      command: 'php -S localhost:8000 -t dist/',
      options: {
        stdout: true,
        failOnError: true
      }
    }
  };
})();
