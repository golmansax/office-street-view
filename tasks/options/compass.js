(function() {
  'use strict';

  module.exports = {
    // Shared options
    options: {
      config: 'css/compass.rb'
    },

    dev: {
    },
    prod: {
      options: {
        environment: 'production',
        force: true
      }
    }
  };
})();
