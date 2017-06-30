/**
 * Workflow Manager - Attachments Tab Controller. 
 */
(function () {
    'use strict';


    angular.module('wmApp').controller('attachmentsTabCtrl', ['$scope', 'logSvc', 'wmConfig', 'wmServiceSvc', function
        ($scope, logSvc, wmConfig, wmServiceSvc) {

        const TABID = 'attachments';

        // scope properties (from cached data)
        $scope.attachments = wmServiceSvc.data.details.attachments;

        // scope properties
        $scope.tabName = wmConfig.i18n.tabs.attachments;
        $scope.tabView = ($scope.attachments.loaded) ? 'content' : 'loading';
        $scope.loadError = '';
        $scope.loadErrorRetry = false;

        // add attachment panel
        $scope.showAttachmentPanel = false;
        $scope.addAttachmentType = 3;
        $scope.addUrlPath = '';
        $scope.addLinkedPath = '';
        $scope.addFilePath = '';
        $scope.copyFilePath = '';


        $scope.addLinkedFile = function (path) {
            var n = path.lastIndexOf("\\") + 1;
            var a = { id: -1, filename: path.substring(n), folder: path.substring(0, n), storageType: 1 };
            addLinkAttachment(a);
        };


        $scope.addURL = function (url) {
            var a = { id: -1, filename: '', folder: url, storageType: 3 };
            addLinkAttachment(a);
        };


        $scope.uploadEmbeddedFile = function () {
            alert("This option has not been implemented to avoid documents being stored in SDE.");
        };
            

        $scope.copyToClipboard = function (path) {
            $scope.copyFilePath = path.replace('file:\\', '');
            $('#copyFilePathDialog').modal('show');
        };


        function addLinkAttachment(a) {
            showProcessing(true);
            wmServiceSvc.addAttachment($scope.jobId, a).then(function (r) {
                showProcessing(false);
                $scope.showAttachmentPanel = false;
                clearUrlPaths();
                logSvc.success('Attachment added to job #' + $scope.jobId, 'Attachment Added', true);
            }, function (ex) {
                $scope.showAttachmentPanel = false;
                showProcessing(false);
            });
        }


        $scope.cancelAttachment = function () {
            $scope.showAttachmentPanel = false;
            clearUrlPaths();
        };

        function clearUrlPaths() {
            $scope.addLinkedPath = '';
            $scope.addFilePath = '';
            $scope.addUrlPath = '';
        };

        
        /**
        * Responds to the load-success event by loading the tab data.
        */
        $scope.$on('load-success', function (evt) {
            $scope.attachments = wmServiceSvc.data.details.attachments;
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
                wmServiceSvc.getJobAttachments(jobId, refresh).then(function () {
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
            if (wmServiceSvc.started && $scope.attachments.loaded == false) {
                loadTabData(jobId);
            }
        };

        init($scope.jobId);

        //if (logSvc.debug) { console.log('attachmentsTabCtrl (startup)', { jobId: $scope.jobId, started: wmServiceSvc.started }) };

    }]);

})();