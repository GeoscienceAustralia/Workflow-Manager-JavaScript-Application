/**
 * Workflow Manager - Holds Tab Controller. 
 */
(function () {
    'use strict';


    angular.module('wmApp').controller('holdsTabCtrl', ['$scope', 'logSvc', 'wmConfig', 'wmServiceSvc', function
        ($scope, logSvc, wmConfig, wmServiceSvc) {

        const TABID = 'holds';

        // scope properties (from cached data)
        $scope.holds = wmServiceSvc.data.details.holds;
        $scope.holdTypes = (wmServiceSvc.data.serviceInfo) ? wmServiceSvc.data.serviceInfo.holdTypes : [];

        // scope properties
        $scope.tabName = wmConfig.i18n.tabs.holds;
        $scope.tabView = ($scope.holds.loaded) ? 'content' : 'loading';
        $scope.loadError = '';
        $scope.loadErrorRetry = false;

        // add hold dialog
        $scope.selectedHoldType = null;
        $scope.addHoldCmt = '';

        // release hold dialog
        $scope.selectedHold = null;
        $scope.releaseHoldCmt = '';

        // table sorting and filtering
        $scope.sortType = 'holdDate';
        $scope.sortReverse = true;
        $scope.tabSearchTerm = '';


        /**
        * Selects a hold (used by the Remove Hold dialog).
        * @param {Object} item Hold object
        */
        $scope.selectReleaseHold = function (hold) {
            $scope.selectedHold = hold;
        };


        /**
        * Selects a hold type (used by the Add Hold dialog).
        * @param {Object} item Hold type object
        */
        $scope.selectHoldType = function (item) {
            $scope.selectedHoldType = item;
        };


        /**
        * Sends a request to the workflow manager service to create a new hold.
        * @param {string} cmt Comment
        */
        $scope.addHold = function (cmt) {
            if ($scope.selectedHoldType == null) { return; };
            $('#addHoldDialog').modal('hide');
            showProcessing(true);
            wmServiceSvc.addHold($scope.jobId, $scope.selectedHoldType.id, cmt).then(function (h) {
                showProcessing(false);
                $scope.addHoldCmt = '';
                $scope.selectedHoldType = null;
                logSvc.success('Hold #' + h.id + ' added to job #' + $scope.jobId, 'Hold Added', true);
            }, function (ex) {
                showProcessing(false);
            });
        };


        /**
        * Sends a request to the workflow manager service to release a hold.
        * @param {Object} hold Hold object
        * @param {string} cmt Comment
        */
        $scope.releaseHold = function (hold, cmt) {
            $('#releaseHoldDialog').modal('hide');
            showProcessing(true);
            wmServiceSvc.releaseHold($scope.jobId, hold, cmt).then(function (h) {
                showProcessing(false);
                $scope.selectedHold = null;
                $scope.releaseHoldCmt = '';
                logSvc.success('Hold #' + h.id + ' released from job #' + $scope.jobId, 'Hold Released', true);
            }, function (ex) {
                showProcessing(false);
            });
        }


        /**
        * Responds to the load-success event by loading the tab data.
        */
        $scope.$on('load-success', function (evt) {
            $scope.holds = wmServiceSvc.data.details.holds;
            $scope.holdTypes = wmServiceSvc.data.serviceInfo.holdTypes;
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
                wmServiceSvc.getJobHolds(jobId, refresh).then(function () {
                    $scope.loadError = '';
                    $scope.tabView = 'content';
                }, function (ex) {
                    $scope.loadError = ex.error.message;
                    $scope.loadErrorRetry = true;
                    $scope.tabView = 'error';
                });
            }
        }


        // wrapper for parent scope function
        function showProcessing(value) {
            $scope.$parent.showProcessing(value);
        }

        function init(jobId) {
            if (wmServiceSvc.started && $scope.holds.loaded == false) {
                loadTabData(jobId);
            }
        };

        init($scope.jobId);
        //if (logSvc.debug) { console.log('holdsTabCtrl (startup)', { jobId: $scope.jobId, started: wmServiceSvc.started, holds: $scope.holds }) };

    }]);

})();