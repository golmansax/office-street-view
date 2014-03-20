define(['angular', './module'], function(angular, controllers) {
  'use strict';

  controllers.controller('OfficeStreetViewCtrl', [
    '$document', '$q', '$scope', '$timeout', 'People',
    'from_server', 'routie', _OfficeStreetViewCtrl
  ]);

  return;

  /*** Controller defined below ***/

  function _OfficeStreetViewCtrl($document, $q, $scope, $timeout, People,
      from_server, routie) {

    var KEY_CODE_MAP = {
      /* jshint ignore:start */
      37: 'W', 38: 'N', 39: 'E', 40: 'S',         // arrow keys

      72: 'W', 74: 'S', 75: 'N', 76: 'E',         // vim nav

      98: 'S', 100: 'W', 102: 'E', 104: 'N',      // numpad
      97: 'SW', 99: 'SE', 103: 'NW', 105: 'NE',

      65: 'W', 68: 'E', 83: 'S', 87: 'N'          // gamer keypad
      /* jshint ignore:end */
    };

    // Constants
    var IMG_PATH = 'https://s3.amazonaws.com/photos.room77/team/';

    var DIR_NAME_ARR = [ 'N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW' ];
    var DIR_INDEX_MAP = {}; // this will map dir to index ('N' => -1)

    var DIR_DIFF = [
      [ 0, 1 ],   // this is N
      [ 1, 1 ],   // NE
      [ 1, 0 ],   // E
      [ 1, -1 ],
      [ 0, -1 ],  // S
      [ -1, -1 ],
      [ -1, 0 ],  // W
      [ -1, 1 ]
    ];

    // Only one of these filters can be active at once
    var TEAM_ROLES_MAP = {
      product: true,
      business: true,
      eng: true,
      mktg: true
    };

    // Set by from_server
    var FILTER_MAP = null,
        LOC_TYPES = null,
        MIN_PT = null,
        MAX_PT = null;

    var _cur = { pt: null, dir: null },
        _cached = { people: [], meet_map: {}, filter_map: {}, query: '' },
        _main_image_deferred = null;

    _ResetScope();
    _BindKeydown();

    $scope.Init = function() {
      _InitFromServer();

      // let's create the DIR_INDEX_MAP
      for (var i = 0; i < 8; i++) DIR_INDEX_MAP[DIR_NAME_ARR[i]] = i;

      People.InitPts(function(bio) {
        if (bio.pts.length > 0) {
          var pt = bio.pts[0];    // Only need one point for direct lookup
          for (i = 0; i < 8; i++) {
            var tmp_pt = _Move(pt, DIR_DIFF[i]);
            if (_GetLocType(tmp_pt) === 'loc') {
              // this info is in case we want to directly go to this person
              bio.pt = pt;
              bio.dir = DIR_NAME_ARR[(i + 4) % 8];
              bio.prev_dir = (i % 2 === 0 ? DIR_NAME_ARR[(i + 4) % 8]
                : DIR_NAME_ARR[(i + 4 + (i % 4) - 2) % 8]);

              break;
            }
          }
        }
      });

      _cached.people = People.All();

      // Initializing filters
      $scope.filters = [];
      angular.forEach(FILTER_MAP, function(filter, filter_key) {
        $scope.filters.push({
          key: filter_key,
          name: filter,
          applied: false
        });
      });

      _cur.pt = [6, 9];
      _cur.dir = 'W';

      // We don't display surroundings until after the splash screen
      //  has been closed
      _DisplayMainImg();

      routie.When('people/:key', function(new_key) {
        if (new_key) $scope.Meet(People.Find(new_key));
      });

      routie.When('office', function() {
        if (!$scope.bio) return;

        var dir_idx = (DIR_INDEX_MAP[_cur.dir] + 4) % 8;
        _cur.pt = _Move(_cur.pt, DIR_DIFF[dir_idx]);
        _cur.dir = $scope.bio.prev_dir;

        _UpdateDisplay().then(function() {
          $scope.bio = null;
        });
      });
    };

    $scope.OnMainImgLoad = function() {
      if (_main_image_deferred) _main_image_deferred.resolve();
    };

    $scope.Back = function() {
      routie.ToDefault();
    };

    $scope.Meet = function(person) {
      if (person.pts.length <= 0) {
        alert('Not in view yet!');
        routie.ToDefault();
        return;
      }

      if ($scope.splash_open) $scope.CloseSplash();
      if ($scope.bio && $scope.bio.key === person.key) return;

      $scope.filters_open = false;

      _cur.pt = person.pt;
      _cur.dir = person.dir;


      _UpdateDisplay().then(function() {
        $scope.bio = person;
        $scope.meet = [person];
      });
    };

    $scope.FilterPeopleAndPrioritizeMeet = function() {
      // Indexing used a lot
      var i;

      // Check cache
      var meet_map = {},
          redo = false;

      angular.forEach($scope.meet, function(person) {
        meet_map[person.key] = true;
      });
      if (!angular.equals(meet_map, _cached.meet_map)) {
        redo = true;
        _cached.meet_map = meet_map;
      }

      var filter_map = {};
      for (i = 0; i < $scope.applied_filters.length; i++) {
        filter_map[$scope.applied_filters[i].key] = true;
      }
      if (!angular.equals(filter_map, _cached.filter_map)) {
        redo = true;
        _cached.filter_map = filter_map;
      }

      if ($scope.qu.ery !== _cached.query) {
        redo = true;
        _cached.query = $scope.qu.ery;
      }

      if (!redo) return _cached.people;

      var meet_people = [],
          non_meet_people = [],
          people = People.All();

      for (i = 0; i < people.length; i++) {
        var person = people[i];

        if (!$scope.FitsFilter(person)) continue;

        if (meet_map.hasOwnProperty(person.key)) {
          meet_people.push(person);
          person.in_view = true;
        }
        else {
          non_meet_people.push(person);
          person.in_view = false;
        }
      }

      _cached.people = meet_people.concat(non_meet_people);
      return _cached.people;
    };

    $scope.ToggleFiltersOpen = function() {
      $scope.filters_open = !$scope.filters_open;
    };

    $scope.CloseFilters = function() {
      $scope.filters_open = false;
    };

    $scope.ToggleFilter = function(filter) {
      var check_roles = false;

      // Only one team role can be active at once
      if (TEAM_ROLES_MAP.hasOwnProperty(filter.key)) check_roles = true;

      for (var i = 0; i < $scope.applied_filters.length; i++) {
        var this_filter = $scope.applied_filters[i];

        // We are clicking again, so unapply filter
        if (this_filter.key === filter.key) {
          filter.applied = false;
          $scope.applied_filters.splice(i, 1);
          return;
        }

        if (check_roles &&
            TEAM_ROLES_MAP.hasOwnProperty(this_filter.key)) {
          $scope.applied_filters[i].applied = false;
          $scope.applied_filters.splice(i, 1);
          i--;
        }
      }

      filter.applied = true;
      $scope.applied_filters.push(filter);
    };

    $scope.HaltFilter = function(idx) {
      $scope.applied_filters[idx].applied = false;
      $scope.applied_filters.splice(idx, 1);
    };

    $scope.FitsFilter = function(person) {
      for (var i = 0; i < $scope.applied_filters.length; i++) {
        var filter = $scope.applied_filters[i];

        if (!person.filter_map.hasOwnProperty(filter.key)) {
          return false;
        }
      }

      if ($scope.qu.ery && $scope.qu.ery !== '') {
        var query = $scope.qu.ery.toLowerCase();

        if (person.short_name.toLowerCase().indexOf(query) < 0) return false;
      }

      return true;
    };

    $scope.CloseSplash = function() {
      $scope.splash_open = false;
      _UpdateDisplay();
    };

    $scope.PortraitsFwd = function() {
      $scope.portraits_margin -= $scope.portrait_width;
    };

    $scope.PortraitsBack = function() {
      $scope.portraits_margin += $scope.portrait_width;
    };

    $scope.ShowPortraitsBack = function() {
      if ($scope.portraits_margin >= 0) return false;
      else return true;
    };

    $scope.QueryFocus = function() {
      $scope.focused_on_query = true;
    };

    $scope.QueryBlur = function() {
      $scope.focused_on_query = false;
    };

    return;

    function _ResetScope() {
      $scope.splash_open = true;
      $scope.focused_on_query = false;

      $scope.main_img = '';
      $scope.backup_img = undefined;
      $scope.meet = {};
      $scope.bio = undefined;
      $scope.qu = { ery: '' }; // Why angular do you torture me?
      $scope.portraits_margin = 0;
      $scope.portrait_width = 101;

      $scope.filters = undefined;
      $scope.applied_filters = [];
    }

    function _IsValidPt(pt) {
      if (pt[0] < MIN_PT[0] || pt[0] > MAX_PT[0] ||
          pt[1] < MIN_PT[1] || pt[1] > MAX_PT[1]) return false;
      else return true;
    }

    function _GetLocType(pt) {
      if (!_IsValidPt(pt)) return '';
      else return LOC_TYPES[pt[0]][pt[1]];
    }

    function _UpdateDisplay() {
      var promise = _DisplayMainImg();
      return promise.then(_DisplaySurroundings);
    }

    function _DisplayMainImg() {
      // display img
      var type = _GetLocType(_cur.pt);

      var img_src = IMG_PATH;
      if (type === 'loc' || type === 'start') {
        img_src += 'loc_' + _cur.pt[0] + '_' + _cur.pt[1] + '_' + _cur.dir +
          '.jpg';
      }

      // This is when the pt is a person
      else img_src += type + '.jpg';

      // Wait for image to load
      var deferred = $q.defer();
      _main_image_deferred = deferred;

      // If it's the same image, just immediately resolve this promise
      if ($scope.main_img === img_src) {
        $timeout(function() { _main_image_deferred.resolve(); });
      }

      $scope.main_img = img_src;
      if (!$scope.backup_img) $scope.backup_img = img_src;

      return deferred.promise;
    }

    function _Move(pt, offset) {
      return [pt[0] + offset[0], pt[1] + offset[1]];
    }

    function _DisplaySurroundings() {
      // Reset some things
      $scope.meet = {};
      $scope.portraits_margin = 0;

      var cur_idx = DIR_INDEX_MAP[_cur.dir],
          cur_type = _GetLocType(_cur.pt);

      if (cur_type !== 'loc' && cur_type !== 'start') return;

      for (var i = 0; i < 8; i += 1) {
        var tmp = {
          dir: DIR_NAME_ARR[i],
          idx: (cur_idx + i) % 8,
          type: ''
        };
        tmp.pt = _Move(_cur.pt, DIR_DIFF[tmp.idx]);

        if (_IsValidPt(tmp.pt)) tmp.type= _GetLocType(tmp.pt);

        // object to visit
        if (cur_type !== 'start' && tmp.type && tmp.type !== 'loc' &&
            tmp.type !== 'start' && tmp.dir !== 'S') {
          var bio = People.Find(tmp.type);

          $scope.meet[tmp.dir] = bio;
        }
/*
        // differentiate between hor/vert movement vs diagonal
        // we are not allowing diagonal movement
        if (i % 2 == 0) {
          var $move_img = $('#' + my_dir + '_move');

          // object to visit
          if (my_key !== 'start' && key && key !== 'loc' && key !== 'start'
              && my_dir !== 'S') {
            _UpdateMeetImg($meet_div, $meet_text,
                           key, tmp_pt, DIR_NAME_ARR[new_index],
                           DIR_NAME_ARR[new_index]);
            //_Hide($move_img);
          }
          else _Hide($meet_div);

          // also check for location we can move to
          if (my_dir === 'N') {
            var button_set = false;
            while (_IsValidPt(tmp_pt)) {
              if (key === 'loc') {
                // we move to the next point if N
                _UpdateMoveImg($move_img, tmp_pt, DIR_NAME_ARR[new_index]);
                button_set = true;
                break;
              }

              tmp_pt = _Move(tmp_pt, DIR_DIFF[new_index]);
              key = _GetLocType(tmp_pt);
            }
            if (!button_set) _Hide($move_img);
          }
          else if (my_key === 'start') _Hide($move_img);
          else if (my_key === 'loc') {
            // we just turn if S, W, or E
            _UpdateMoveImg($move_img, _pt, DIR_NAME_ARR[new_index]);
          }
        }
        // if diagonal, only check if object to visit
        else if (key && key !== 'loc') {
          _UpdateMeetImg($meet_div, $meet_text,
                         key, tmp_pt, DIR_NAME_ARR[new_index],
                         DIR_NAME_ARR[(new_index + (i % 4) - 2) % 8]);
        }
        else _Hide($meet_div);
      */
      }
    }

    function _InitFromServer() {
      var vars = from_server.Get('vars');

      FILTER_MAP = vars.filter_map;
      LOC_TYPES = vars.loc_types;
      MAX_PT = vars.max_pt;
      MIN_PT = vars.min_pt;
    }

    function _BindKeydown() {
      // Bind keystrokes
      $document.on('keydown', function(e) {
        if ($scope.focused_on_query || $scope.splash_open) return;
        if (e.ctrlKey) return;

        if (e.keyCode in KEY_CODE_MAP) {
          e.preventDefault();
          _MoveInDir(KEY_CODE_MAP[e.keyCode]);
        }
      });
    }

    function _MoveInDir(new_dir) {
      var new_index = (DIR_INDEX_MAP[_cur.dir] + DIR_INDEX_MAP[new_dir]) % 8;

      $scope.$apply(function() {
        if (new_dir === 'N') {
          // Try until you cant
          var new_pt = _Move(_cur.pt, DIR_DIFF[new_index]);
          var type = null;
          while (_IsValidPt(new_pt)) {
            type = _GetLocType(new_pt);

            if (type === 'loc') {
              _cur.pt = new_pt;
              _UpdateDisplay();
              break;
            }
            new_pt = _Move(new_pt, DIR_DIFF[new_index]);
          }
        }
        else {
          _cur.dir = DIR_NAME_ARR[new_index];
          _UpdateDisplay();
        }
      });
    }
  }
});
