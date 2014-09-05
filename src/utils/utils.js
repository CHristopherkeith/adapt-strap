angular.module('adaptv.adaptStrap.utils', [])
  .factory('adStrapUtils', ['$filter', function ($filter) {

    var evalObjectProperty = function (obj, property) {
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
      applyFilter = function (value, filter) {
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
      itemExistsInList = function (compareItem, list) {
        var exist = false;
        list.forEach(function (item) {
          if (angular.equals(compareItem, item)) {
            exist = true;
          }
        });
        return exist;
      },
      itemsExistInList = function (items, list) {
        var exist = true,
          i;
        for (i = 0; i < items.length; i++) {
          if (itemExistsInList(items[i], list) === false) {
            exist = false;
            break;
          }
        }
        return exist;
      },
      addItemToList = function (item, list) {
        list.push(item);
      },
      removeItemFromList = function (item, list) {
        var i;
        for (i = list.length - 1; i > -1; i--) {
          if (angular.equals(item, list[i])) {
            list.splice(i, 1);
          }
        }
      },
      addRemoveItemFromList = function (item, list) {
        var i,
          found = false;
        for (i = list.length - 1; i > -1; i--) {
          if (angular.equals(item, list[i])) {
            list.splice(i, 1);
            found = true;
          }
        }
        if (found === false) {
          list.push(item);
        }
      },
      addItemsToList = function (items, list) {
        items.forEach(function (item) {
          if (!itemExistsInList(item, list)) {
            addRemoveItemFromList(item, list);
          }
        });
      },
      addRemoveItemsFromList = function (items, list) {
        if (itemsExistInList(items, list)) {
          list.length = 0;
        } else {
          addItemsToList(items, list);
        }
      };

    return {
      evalObjectProperty: evalObjectProperty,
      applyFilter: applyFilter,
      itemExistsInList: itemExistsInList,
      itemsExistInList: itemsExistInList,
      addItemToList: addItemToList,
      removeItemFromList: removeItemFromList,
      addRemoveItemFromList: addRemoveItemFromList,
      addItemsToList: addItemsToList,
      addRemoveItemsFromList: addRemoveItemsFromList
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

      return promise.then(function (result) {
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
  }])
  .factory('adDragDrop', ['$document', function($document) {
    var base = null;
    var draggables = null;
    var options = null;
    var ATTRIBUTE = 'draggable';
    var dragObject = null; // current drag object
    var drag = false;

    /* allows dragging using any element within the draggable*/
    function findParentTagByAttribute(elem, attr, attrVal) {
    while((!!attr && (!elem.getAttribute(attr) || (elem.getAttribute(attr) !== attrVal)))) {
        if (!elem.parentNode) {
          return null;
        }
        elem = elem.parentNode;
      }
      return elem;
    }

    function findEventElementByAttribute(e, attr, attrVal) {
      var elem = e.target || e.srcElement;
      return findParentTagByAttribute(elem, attr, attrVal);
    }
      
    // --- class manipulation --
    function hasClass(el, className) {
      return !!el.className.match(new RegExp(className.replace(' ', '')));
    }

    function addClass(el, className) {
      if (!hasClass(el, className)) {
        el.className += ' ' + className;
      }
    }

      function removeClass(el, className) {
        if (hasClass(el, className)) {
          el.className = el.className.replace(className, '');
        }
      }
      
      function addEvent(el, evt, hndlr) {
        if (el.attachEvent) {
          el.attachEvent('on' + evt, hndlr);
        } else if(el.addEventListener) {
          el.addEventListener(evt, hndlr, false);
        } else {
          el['on' + evt] = hndlr;
        }
      }
      
      function rmEvent(el, evt, hndlr) {
        if (el.detachEvent) {
          el.detachEvent('on' + evt, hndlr);
        } else if (el.removeEventListener) {
          el.removeEventListener(evt, hndlr, false);
        } else {
          el['on' + evt] = hndlr;
        }
      }

      function getDraggables() {
        if (base.querySelectorAll) {
          draggables = base.querySelectorAll('[' + ATTRIBUTE + '=true]');
        }
      }

      function initDraggables() {
        for (var i = 0; i < draggables.length; i++) {
          addClass(draggables[i], 'ad-draggable');
          addEvent(draggables[i], 'mousedown', onMousedown);
        }
      }
     
    function onMousedown(e) {
      var src = findEventElementByAttribute(e, ATTRIBUTE, 'true');  
    }

      function onMouseover(e) {
      
      }

      function onMouseout(e) {
      
      }

      return function(baseEl, opts) {
        base = baseEl;
        options = opts;
        getDraggables();
        initDraggables();
      };
    }
  ]);
