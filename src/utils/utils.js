angular.module('adaptv.adaptStrap.utils', [])
  .factory('adStrapUtils', ['$filter', function ($filter) {
    return {
      evalObjectProperty: function (obj, property) {
        var arr = property.split('.');
        if (obj) {
          while (arr.length) {
            if (obj) {
              obj = obj[arr.shift()];
            }
          }
        }
        return obj;
      },
      applyFilter: function (value, filter) {
        var parts,
          filterOptions;
        if (filter) {
          parts = filter.split(':');
          filterOptions = parts[1];
          if (filterOptions) {
            value = $filter(parts[0])(value, filterOptions);
          } else {
            value = $filter(parts[0])(value);
          }
        }
        return value;
      },
      itemExistsInList: function (compareItem, list) {
        var found = false;
        list.forEach(function (item) {
          if (angular.equals(compareItem, item)) {
            found = true;
          }
        });
        return found;
      },
      addRemoveFromList: function (item, list) {
        var i,
            found = true;
        if (i = list.length - 1, i > -1, i--) {
          if (angular.equals(item, list[i])) {
            list.splice(i, 1);
            found = true;
          }
        }
        if (found === false) {
          list.push(item);
        }
      }
    };
  }])
  .factory('adDebounce', ['$timeout', '$q', function ($timeout, $q) {
    'use strict';
    var deb = function (func, delay, immediate, ctx) {
      var timer = null,
        deferred = $q.defer(),
        wait = delay || 300;
      return function () {
        var context = ctx || this,
          args = arguments,
          callNow = immediate && !timer,
          later = function () {
            if (!immediate) {
              deferred.resolve(func.apply(context, args));
              deferred = $q.defer();
            }
          };
        if (timer) {
          $timeout.cancel(timer);
        }
        timer = $timeout(later, wait);
        if (callNow) {
          deferred.resolve(func.apply(context, args));
          deferred = $q.defer();
        }
        return deferred.promise;
      };
    };

    return deb;
  }])
  .factory('adLoadPage', ['$adConfig', '$http', 'adStrapUtils', function ($adConfig, $http, adStrapUtils) {
    return function (options) {
      var start = (options.pageNumber - 1) * options.pageSize,
        pagingConfig = angular.copy($adConfig.paging),
        ajaxConfig = angular.copy(options.ajaxConfig);

      if (ajaxConfig.paginationConfig && ajaxConfig.paginationConfig.request) {
        angular.extend(pagingConfig.request, ajaxConfig.paginationConfig.request);
      }
      if (ajaxConfig.paginationConfig && ajaxConfig.paginationConfig.response) {
        angular.extend(pagingConfig.response, ajaxConfig.paginationConfig.response);
      }

      ajaxConfig.params[pagingConfig.request.start] = start;
      ajaxConfig.params[pagingConfig.request.pageSize] = options.pageSize;
      ajaxConfig.params[pagingConfig.request.page] = options.pageNumber;

      if (options.sortKey) {
        ajaxConfig.params[pagingConfig.request.sortField] = options.sortKey;
      }

      if (options.sortDirection === false) {
        ajaxConfig.params[pagingConfig.request.sortDirection] = pagingConfig.request.sortAscValue;
      } else if (options.sortDirection === true) {
        ajaxConfig.params[pagingConfig.request.sortDirection] = pagingConfig.request.sortDescValue;
      }

      var promise;
      if (ajaxConfig.method === 'JSONP') {
        promise = $http.jsonp(ajaxConfig.url + '?callback=JSON_CALLBACK', ajaxConfig);
      } else {
        promise = $http(ajaxConfig);
      }

      return promise.then(function(result) {
        var response = {
          items: adStrapUtils.evalObjectProperty(result.data, pagingConfig.response.itemsLocation),
          currentPage: options.pageNumber,
          totalPages: Math.ceil(
              adStrapUtils.evalObjectProperty(result.data, pagingConfig.response.totalItems) /
              options.pageSize
          ),
          pagingArray: [],
          token: options.token
        };

        var TOTAL_PAGINATION_ITEMS = 5;
        var minimumBound = options.pageNumber - Math.floor(TOTAL_PAGINATION_ITEMS / 2);
        for (var i = minimumBound; i <= options.pageNumber; i++) {
          if (i > 0) {
            response.pagingArray.push(i);
          }
        }
        while (response.pagingArray.length < TOTAL_PAGINATION_ITEMS) {
          if (i > response.totalPages) {
            break;
          }
          response.pagingArray.push(i);
          i++;
        }

        return response;
      });
    };
  }]);
