(function() {
  'use strict';

  module.exports = {
    options: {
      processLinks: true,
      htmlhint: {
        'tagname-lowercase': true,
        'attr-lowercase': true,
        'attr-value-double-quotes': true,
        'doctype-first': true,
        'tag-pair': true,
        'spec-char-escape': true,
        'id-unique': true,
        'src-not-empty': true
      }
    },

    files: {
      expand: true,
      src: ['*.php'],
      dest: 'dist/',
      ext: '.html'
    }
  };
})();
