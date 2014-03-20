define(['angular', '../module'], function(angular, services) {
  'use strict';

  services.factory('People', ['from_server', _People]);

  return;

  function _People(from_server) {
    var me = {},
        BIO_MAP = {},
        _people = [],
        US_CODE = 'US';

    _Init();

    me.Find = function(key) {
      return BIO_MAP[key];
    };

    me.All = function() {
      return _people;
    };

    me.Path = function(key) {
      return 'people/' + key;
    };

    me.InitPts = function(InitPtFn) {
      angular.forEach(BIO_MAP, InitPtFn);
    };

    return me;

    function _Init() {
      var i;

      var PORTRAIT_URL = [
        'https://s3.amazonaws.com/photos.room77/team/',
        'portraits/portrait_'
      ].join('');

      var COUNTRY_MAP_URL = [
        'https://chart.googleapis.com/chart?cht=map:fixed=-60,-170,85,180&',
        'chs=340x250&chco=333333|006400&chld='
      ].join('');

      // No picture
      var BLOCKED = {
        Dd: true
      };

      BIO_MAP = from_server.Get('bio_map');

      // People we are not using right now
      angular.forEach(BLOCKED, function(val, key) {
        delete BIO_MAP[key];
      });

      // Add portraits and initialize $scope.people
      angular.forEach(BIO_MAP, function(bio, key) {
        bio.key = key;
        bio.img = PORTRAIT_URL + bio.key + '.png';

        bio.countries.push(US_CODE); // Everyone has been to US
        bio.countries_url = COUNTRY_MAP_URL + US_CODE;
        for (i = 0; i < bio.countries.length; i++) {
          bio.countries_url += '|' + bio.countries[i];
        }

        bio.filter_map = {};
        for (i = 0; i < bio.filters.length; i++) {
          bio.filter_map[bio.filters[i]] = true;
        }

        _people.push(bio);
      });

      _people = _ShuffleArray(_people);
    }

    // From stack overflow: http://stackoverflow.com/questions/2450954/
    //   how-to-randomize-a-javascript-array
    function _ShuffleArray(array) {
      var currentIndex = array.length,
          temporaryValue,
          randomIndex;

      // While there remain elements to shuffle...
      while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
      }

      return array;
    }
  }
});
