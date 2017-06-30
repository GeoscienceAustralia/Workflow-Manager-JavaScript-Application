/**
 * Workflow Manager - Service Dependencies Tab Controller. 
 */
(function () {
    'use strict';


    angular.module('wmApp').controller('dependenciesTabCtrl', ['$scope', 'logSvc', 'wmConfig', 'wmServiceSvc', function
        ($scope, logSvc, wmConfig, wmServiceSvc) {

        const TABID = 'dependencies';

        // scope properties (from cached data)
        $scope.extProps = wmServiceSvc.data.details.extProps;

        // scope properties
        $scope.tabName = wmConfig.i18n.tabs.dependencies;
        $scope.tabView = ($scope.extProps.loaded) ? 'content' : 'loading';
        $scope.loadError = '';
        $scope.loadErrorRetry = false;
        $scope.stepHelpVisible = false;
        $scope.activeTableName = '';
        $scope.activeTableAlias = '';


        $scope.adding = false; // is in the process of adding a record
        $scope.editing = false;
        $scope.editRec = null;
        $scope.editMode = 'Edit';

        $scope.editRecord = function (rec) {
            $scope.editMode = 'Edit';
            $scope.editRec = rec;
            $scope.editing = true;
        };


        $scope.addRecord = function () {
            $scope.adding = true;
            showProcessing(true);
            wmServiceSvc.addExtPropRecord($scope.jobId, $scope.activeTableName).then(function (rec) {
                //console.log('addExtPropRecord result:', rec);
                // refresh from cache
                $scope.extProps = wmServiceSvc.data.details.extProps;
                //console.log('add row item: ', rec);
                if (rec) {
                    $scope.editMode = 'Add';
                    $scope.editRec = rec;
                    $scope.editing = true;
                }
                $scope.adding = false;
                showProcessing(false);  
            }, function () {
                $scope.adding = false;
                showProcessing(false);
            });
        };

        $scope.deleteId = null;

        $scope.setDeleteId = function (recId) {
            console.log('set delete id', recId);
            $scope.deleteId = recId;
        };

        $scope.deleteRecord = function (recId) {
            //console.log('deleteRecord', recId);
            showProcessing(true);
            wmServiceSvc.deleteExtPropRecord($scope.jobId, $scope.activeTableName, recId).then(function (r) {
                // remove from extended properties (cache)
                removeRowFromActiveTable(recId);
                $scope.deleteId = null;
                $scope.editing = false;
                $scope.extProps = wmServiceSvc.data.details.extProps;
                showProcessing(false);
            }, function () {
                showProcessing(false);
            });
        };


        function removeRowFromActiveTable(recId) {
            var i = -1;
            var table = getTable($scope.activeTableName);
            var recs = table.records;
            for (var j = 0; j < recs.length; j++) {
                if (recs[j].id == recId) {
                    i = j;
                    break;
                }
            }
            if (i > -1) {
                recs.splice(i, 1);
            }
        }

        $scope.isUrl = function (item) {
            var s = (item && item.data) ? item.data.toString(): '';
            return (s.indexOf('http://') == 0) || (s.indexOf('https://') == 0);
        };


        $scope.displayValue = function (item) {
            if (item.domain != '' && item.domainValues) {
                // get domain value
                for (var i = 0; i < item.domainValues.length; i++) {
                    if (item.domainValues[i].value == item.data) {
                        return item.domainValues[i].description;
                    }
                }
            }
            return item.data;
        };


        function getRow(tableName, rowId) {
            var table = getTable(tableName);
            if (table) {
                for (var j = 0; j < table.records.length; j++) {
                    if (table.records[j].id = rowId) {
                        return table.records[j];
                    }
                }
            } else {
                return null;
            }
        }

        function getTable(name) {
            for (var i = 0; i < $scope.extProps.tables1N.length; i++) {
                if ($scope.extProps.tables1N[i].tableName == name) {
                    return $scope.extProps.tables1N[i];
                }
            }
            return null;
        };



        $scope.save = function () {
            var table = getTable($scope.activeTableName);
            var props = getSaveProperties(table);
            var recId = $scope.editRec.id; 
            //console.log('save: ', $scope.activeTableName, recId, props);
            showProcessing(true);
            wmServiceSvc.saveExtededProperties($scope.jobId, $scope.activeTableName, recId, props).then(function (r) {
                showProcessing(false);
                clearDirtyProperties(table);
                // reset edit values
                $scope.editRec = null;
                $scope.editing = false;
                logSvc.success('Extended properties have been saved for Job #' + $scope.jobId, 'Saved', true);
            }, function () {
                showProcessing(false);
            });
        };

        $scope.cancelEdit = function () {
            if ($scope.editMode == 'Add') {
                //console.log('DELETE the edit row', $scope.editRec.id);            
                wmServiceSvc.deleteExtPropRecord($scope.jobId, $scope.activeTableName, $scope.editRec.id).then(function (r) {
                    var table = getTable($scope.activeTableName);
                    if (table) {
                        clearDirtyProperties(table);
                        removeRowFromActiveTable($scope.editRec.id);
                    }
                    $scope.editRec = null;
                    $scope.editing = false;
                });

            } else {
                $scope.editing = false;
            }               
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
                            props[r.recordValues[k].name] = r.recordValues[k].data;
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
            //console.log('field changed: ', {table:table.tableName, field: item.name });
        };


        /**
        * Checks if an extended properties table is active. 
        * @param {Object} table Extended properties table object
        * @return {boolean} true if the table is active, otherwise false
        */
        $scope.isActiveTable = function (table) {
            return ($scope.activeTableName == table.tableName);
        };
        

        $scope.setActiveTable = function (table) {
            console.log('setActiveTableName', table.tableName);
            $scope.activeTableName = table.tableName;
            $scope.activeTableAlias = table.tableAlias;
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
                    if ($scope.extProps.tables1N.length) {
                        $scope.activeTableName = $scope.extProps.tables1N[0].tableName;
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