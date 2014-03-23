// All paths are relative to app dir (js/app)
require.config({
  paths: {
    domReady: '../../bower_components/requirejs-domready/domReady',
    angular: '../../bower_components/angular/angular',
    bindonce: '../../bower_components/angular-bindonce/bindonce',
    recompile: '../../bower_components/angular-recompile/dist/recompile',
    routie: '../../bower_components/routie/dist/routie'
  },

  shim: {
    angular: {
      exports: 'angular'
    },
    bindonce: {
      deps: ['angular']
    },
    routie: {
      exports: 'routie'
    }
  },

  deps: ['ng_bootstrap']
});
