/**
 * Workflow Manager - Job Details Tab Controller. 
 */
(function () {
    'use strict';

    angular.module('wmApp').controller('detailsTabCtrl', ['$scope', '$window', 'logSvc', 'wmConfig', 'wmServiceSvc', function 
        ($scope, $window, logSvc, wmConfig, wmServiceSvc) {

        const TABID = 'details';

        // scope properties (from cached data)
        $scope.extProps = wmServiceSvc.data.details.extProps;

        // scope properties
        $scope.tabName = wmConfig.i18n.tabs.details;
        $scope.tabView = ($scope.extProps.loaded) ? 'content' : 'loading';
        $scope.loadError = '';
        $scope.loadErrorRetry = false;
        $scope.stepHelpVisible = false;
        $scope.activeTable = null;


        $scope.intValue = function (v) {
            return (v == null) ? 0 : parseInt(v);
        };


        $scope.floatValue = function (v) {
            return (v == null) ? 0 : parseFloat(v);
        };


        $scope.tableDirty = function () {
            return ($scope.activeTable) ? $scope.activeTable.dirty : false;
        };
        

        $scope.scrollTop = function () {
            $window.scrollTo(0, 0);
        };


        $scope.canUserSeeField = function (item) {
            return item.userVisible;
        };

        $scope.rowCount = function (item) {
            if (item.length > 499) { return 5; };
            if (item.length > 249) { return 3; };
            return 2;
        };


        /**
        * Saves the extended properties (only dirty properties are updated). 
        */
        $scope.save = function () {
            var props = getSaveProperties($scope.activeTable);
            var recId = $scope.activeTable.records[0].id;
            console.log('save: ', $scope.activeTable, recId, props);
            showProcessing(true);
            wmServiceSvc.saveExtededProperties($scope.jobId, $scope.activeTable.tableName, recId, props).then(function (r) {
                showProcessing(false);
                clearDirtyProperties($scope.activeTable);
                logSvc.success('Extended properties have been saved for Job #' + $scope.jobId, 'Saved', true);
            }, function () {
                showProcessing(false);
            });
        };


        /**
        * Returns an object containing dirty property values. 
        * @param {Object} table Extended properties table object
        * @return {Object} Object containing the data to be saved
        */
        function getSaveProperties(table) {
            var props = {};
            if (table && table.dirty) {
                for (var j = 0; j < table.records.length; j++) {
                    var r = table.records[j];
                    for (var k = 0; k < r.recordValues.length; k++) {
                        if (r.recordValues[k].dirty) {                       
                            if (r.recordValues[k].dataType == 5) {
                                // check for dates - convert to ticks
                                if (r.recordValues[k].data != null) {
                                    props[r.recordValues[k].name] = r.recordValues[k].data.getTime();
                                } else {
                                    props[r.recordValues[k].name] = r.recordValues[k].data;
                                }
                            } else {
                                props[r.recordValues[k].name] = r.recordValues[k].data;
                            }
                        }
                    }
                }
            }
            return props;
        };


        /**
        * Reset all of the dirty properties for a table. 
        * @param {Object} table Extended properties table object
        */
        function clearDirtyProperties(table) {
            if (table && table.dirty) {
                for (var j = 0; j < table.records.length; j++) {
                    var r = table.records[j];
                    for (var k = 0; k < r.recordValues.length; k++) {
                        r.recordValues[k].dirty = false;
                    }
                }
            }
            table.dirty = false;
        };


        /**
        * Marks a field as dirty if changed (also marks the table dirty). 
        * @param {Object} item Extended properties field
        * @param {Object} table Extended properties table object
        */
        $scope.fieldChanged = function (item, table) {
            item.dirty = true;
            table.dirty = true;
        };


        /**
        * Checks if an extended properties table is active. 
        * @param {Object} table Extended properties table object
        * @return {boolean} true if the table is active, otherwise false
        */
        $scope.isActiveTable = function (table) {
            return (table == $scope.activeTable);
        };


        /**
        * Makes an extended properties table active. 
        * @param {Object} table Extended properties table object
        */
        $scope.setActiveTable = function (table) {
            $scope.activeTable = table;
        }


        /**
        * Responds to the load-success event by loading the tab data.
        */
        $scope.$on('load-success', function (evt) {
            loadTabData($scope.jobId);
        });


        /**
        * Reloads the data from the server.
        */
        $scope.refresh = function () {
            $scope.tabView = 'loading';
            wmServiceSvc.uiTimeout(function () {
                loadTabData($scope.jobId, true);
            }, wmServiceSvc.uiDelay);
        };


        /**
        * Loads the activity log data from the workflow manager service.
        * @param {number} jobId Job identifier
        * @param {boolean} refresh Request new data from the server
        */
        function loadTabData(jobId, refresh) {
            if ($scope.tabId == TABID) {
                if (refresh == undefined) { refresh = false; };
                if (logSvc.debug) { console.log('Load Tab Data: ', { tab: TABID, jobId: jobId, refresh: refresh }); };
                $scope.tabView = 'loading';
                wmServiceSvc.getExtendedProperties(jobId, refresh).then(function (r) {
                    $scope.extProps = wmServiceSvc.data.details.extProps;
                    //$scope.domains = wmServiceSvc.data.domains;
                    if ($scope.extProps.tables11.length) {
                        $scope.activeTable = $scope.extProps.tables11[0];
                    }
                    $scope.loadError = '';
                    $scope.tabView = 'content';
                }, function (ex) {
                    $scope.loadError = ex.error.message;
                    $scope.loadErrorRetry = true;
                    $scope.tabView = 'error';
                });
            }
        };


        // wrapper for parent scope function
        function showProcessing(value) {
            $scope.$parent.showProcessing(value);
        };

        function init(jobId) {
            if (wmServiceSvc.started) {
                loadTabData(jobId);
            }
        };

        init($scope.jobId);

    }]);

})();