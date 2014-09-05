angular.module('adaptv.adaptStrap.tablelite', ['adaptv.adaptStrap.utils'])
/**
 * Use this directive if you need to render a simple table with local data source.
 */
  .directive('adTableLite', [
    '$parse', '$http', '$compile', '$filter', '$templateCache', '$adConfig', 'adStrapUtils', 'adDebounce',
    function ($parse, $http, $compile, $filter, $templateCache, $adConfig, adStrapUtils, adDebounce) {
      'use strict';
      function _link(scope, element, attrs) {
        // We do the name spacing so the if there are multiple ad-table-lite on the scope,
        // they don't fight with each other.
        scope[attrs.tableName] = {
          items: {
            list: undefined,
            allItems: undefined,
            paging: {
              currentPage: 1,
              totalPages: undefined,
              pageSize: undefined,
              pageSizes: $parse(attrs.pageSizes)() || [10, 25, 50]
            }
          },
          localConfig: {
            pagingArray: [],
            selectable: attrs.selectedItems ? true : false,
            draggable: attrs.draggable ? true : false
          },
          selectedItems: scope.$eval(attrs.selectedItems),
          applyFilter: adStrapUtils.applyFilter,
          isSelected: adStrapUtils.itemExistsInList,
          addRemoveItem: adStrapUtils.addRemoveItemFromList,
          addRemoveAll: adStrapUtils.addRemoveItemsFromList,
          allSelected: adStrapUtils.itemsExistInList
        };

        // ---------- Local data ---------- //
        var tableModels = scope[attrs.tableName],
          mainTemplate = $templateCache.get('tablelite/tablelite.tpl.html');
        tableModels.items.paging.pageSize = tableModels.items.paging.pageSizes[0];

        // ---------- ui handlers ---------- //
        tableModels.loadPage = adDebounce(function (page) {
          var start = (page - 1) * tableModels.items.paging.pageSize,
            end = start + tableModels.items.paging.pageSize,
            i,
            localItems = $filter('orderBy')(
              scope.$eval(attrs.localDataSource),
              tableModels.localConfig.predicate,
              tableModels.localConfig.reverse
            );

          tableModels.items.list = localItems.slice(start, end);
          tableModels.items.allItems = scope.$eval(attrs.localDataSource);
          tableModels.items.paging.currentPage = page;
          tableModels.items.paging.totalPages = Math.ceil(
              scope.$eval(attrs.localDataSource).length /
              tableModels.items.paging.pageSize
          );
          tableModels.localConfig.pagingArray = [];
          var TOTAL_PAGINATION_ITEMS = 5;
          var minimumBound = page - Math.floor(TOTAL_PAGINATION_ITEMS / 2);
          for (i = minimumBound; i <= page; i++) {
            if (i > 0) {
              tableModels.localConfig.pagingArray.push(i);
            }
          }
          while (tableModels.localConfig.pagingArray.length < TOTAL_PAGINATION_ITEMS) {
            if (i > tableModels.items.paging.totalPages) {
              break;
            }
            tableModels.localConfig.pagingArray.push(i);
            i++;
          }
        });

        tableModels.loadNextPage = function () {
          if (tableModels.items.paging.currentPage + 1 <= tableModels.items.paging.totalPages) {
            tableModels.loadPage(tableModels.items.paging.currentPage + 1);
          }
        };

        tableModels.loadPreviousPage = function () {
          if (tableModels.items.paging.currentPage - 1 > 0) {
            tableModels.loadPage(tableModels.items.paging.currentPage - 1);
          }
        };

        tableModels.loadLastPage = function () {
          if (!tableModels.localConfig.disablePaging) {
            tableModels.loadPage(tableModels.items.paging.totalPages);
          }
        };

        tableModels.pageSizeChanged = function (size) {
          tableModels.items.paging.pageSize = size;
          tableModels.loadPage(1);
        };

        tableModels.sortByColumn = function (column) {
          if (column.sortKey) {
            if (column.sortKey !== tableModels.localConfig.predicate) {
              tableModels.localConfig.predicate = column.sortKey;
              tableModels.localConfig.reverse = true;
            } else {
              if (tableModels.localConfig.reverse === true) {
                tableModels.localConfig.reverse = false;
              } else {
                tableModels.localConfig.reverse = undefined;
                tableModels.localConfig.predicate = undefined;
              }
            }
            tableModels.loadPage(tableModels.items.paging.currentPage);
          }
        };

        // ---------- initialization and event listeners ---------- //
        //We do the compile after injecting the name spacing into the template.
        tableModels.loadPage(1);
        attrs.tableClasses = attrs.tableClasses || 'table';
        attrs.paginationBtnGroupClasses = attrs.paginationBtnGroupClasses || 'btn-group btn-group-sm';
        mainTemplate = mainTemplate.
          replace(/%=tableName%/g, attrs.tableName).
          replace(/%=columnDefinition%/g, attrs.columnDefinition).
          replace(/%=paginationBtnGroupClasses%/g, attrs.paginationBtnGroupClasses).
          replace(/%=tableClasses%/g, attrs.tableClasses).
          replace(/%=icon-firstPage%/g, $adConfig.iconClasses.firstPage).
          replace(/%=icon-previousPage%/g, $adConfig.iconClasses.previousPage).
          replace(/%=icon-nextPage%/g, $adConfig.iconClasses.nextPage).
          replace(/%=icon-lastPage%/g, $adConfig.iconClasses.lastPage).
          replace(/%=icon-sortAscending%/g, $adConfig.iconClasses.sortAscending).
          replace(/%=icon-sortDescending%/g, $adConfig.iconClasses.sortDescending).
          replace(/%=icon-sortable%/g, $adConfig.iconClasses.sortable)
        ;
        element.empty();
        element.append($compile(mainTemplate)(scope));

        scope.$watch(attrs.localDataSource, function () {
          tableModels.loadPage(1);
        }, true);
      }

      return {
        restrict: 'E',
        link: _link,
        controller: 'TableLiteCtrl'
      };
    }])
    .controller('TableLiteCtrl', ['$scope', function($scope) {
        var placeHolder = null;
        var nextPageElement = null;
        var validDrop = false;

        $scope.dragStart = function(data, dragElement, evt) {
          var parent = dragElement.parent()
          placeHolder = $("<tr><td colspan=" + dragElement.find("td").length + ">&nbsp;</td></tr>");

          if (dragElement[0] !== parent.children().last()[0]) {
            dragElement.next().before(placeHolder);
          } else {
            parent.append(placeHolder);
          }
          $('body').append(dragElement);
        };

        $scope.dragEnd = function(data, dragElement, evt) {
          if (!validDrop) {
            // If the dragElement is dropped on an invalid drop target
            // restore the dragElement back to its original position
            $scope.dropEnd(data, dragElement, null, evt);
          }
        };
        
        $scope.dropOver = function(data, dragElement, dropElement, evt) {
          if (dropElement.next()[0] == placeHolder[0]) {
            dropElement.before(placeHolder);
          } else if (dropElement.prev()[0] == placeHolder[0]){
            dropElement.after(placeHolder);
          }
        };

        $scope.dropEnd = function(data, dragElement, dropElement, evt) {
          if (placeHolder.next()[0]) {
            placeHolder.next().before(dragElement);
          } else if (placeHolder.prev()[0]) {
            placeHolder.prev().after(dragElement);
          }
          placeHolder.remove();
          if (nextPageElement) {
            nextPageElement.removeClass('over');
            nextPageElement= null;
          }
        };

        $scope.onNextPageButtonOver = function(data, dragElement, dropElement, evt) {
          nextPageElement = dropElement;
          nextPageElement.addClass('over');
        };

        $scope.onNextPageButtonDrop = function(data, dragElement, dropElement, evt) {
          nextPageElement.removeClass('over');
          nextPageElement = null;
          // Code to transfer the drag element to the next page
        };
    }]);
