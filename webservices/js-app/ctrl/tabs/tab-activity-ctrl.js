/**
 * Workflow Manager - Activity Log Tab Controller. 
 */
(function() {
    'use strict';

    angular.module('wmApp').controller('activityTabCtrl', ['$scope', 'logSvc', 'wmConfig', 'wmServiceSvc', function
        ($scope, logSvc, wmConfig, wmServiceSvc) {

        const TABID = 'activity';

        // scope properties (from cached data)
        $scope.activity = wmServiceSvc.data.details.activity;

        // scope properties
        $scope.tabName = wmConfig.i18n.tabs.activity; //'Activity Log';
        $scope.tabView = ($scope.activity.loaded) ? 'content' : 'loading';
        $scope.loadError = '';
        $scope.loadErrorRetry = false;
        $scope.newComment = '';

        // table sorting and filtering
        $scope.sortType = 'date';
        $scope.sortReverse = true;
        $scope.tabSearchTerm = '';

        /**
        * Adds a comment to the job activity log.
        * @param {string} cmt Comment
        */
        $scope.addComment = function (cmt) {
            $('#addCommentDialog').modal('hide');
            showProcessing(true);
            wmServiceSvc.addActivityLogComment($scope.jobId, cmt).then(function (r) {
                showProcessing(false);
                $scope.newComment = '';
                logSvc.success('Comment added to job #' + $scope.jobId, 'Comment Added', true);
            }, function (ex) {
                showProcessing(false);
            });
        };


        /**
        * Responds to the load-success event by loading the tab data.
        */
        $scope.$on('load-success', function (evt) {
            // only load details after startup is complete
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
                $scope.tabView = 'loading';
                console.log('>>> Load tab data ' + TABID, jobId, refresh);

                // make sure users and activityTypes are loaded
                $scope.users = wmServiceSvc.data.users;
                $scope.activityTypes = wmServiceSvc.data.serviceInfo.activityTypes;

                // load job activity
                wmServiceSvc.getJobActivity(jobId, refresh).then(function () {
                    $scope.loadError = '';
                    $scope.tabView = 'content';
                }, function (ex) {
                    $scope.loadError = ex.error.message;
                    $scope.loadErrorRetry = true;
                    $scope.tabView = 'error';
                });
                //} else {
                //    console.log('activityTabCtrl says - not my circus, not my monkeys');
            }
        }


        // wrapper for parent scope function
        function showProcessing(value) {
            $scope.$parent.showProcessing(value);
        }


        function init(jobId) {
            //console.log('activityTabCtrl init', $scope.tabId, TABID, jobId);
            if (wmServiceSvc.started && $scope.activity.loaded == false) {
                loadTabData(jobId);
            }
        };

        init($scope.jobId);
        //if (logSvc.debug) { console.log('activityTabCtrl (startup)', { jobId: $scope.jobId, started: wmServiceSvc.started, activity: $scope.activity }) };

    }]);

})();