/**
 * Workflow Manager - Job Detail Controller. 
 */
(function() {
    'use strict';


angular.module('wmApp').controller('jobDetailCtrl', ['$scope', '$rootScope', '$location', '$routeParams',
    'logSvc', 'wmConfig', 'wmServiceSvc', function
        ($scope, $rootScope, $location, $routeParams, logSvc, wmConfig, wmServiceSvc) {

    // scope properties (from cached data)
    $scope.tabs = wmServiceSvc.tabs;
    $scope.job = wmServiceSvc.data.details.job;

    // scope properties (from url location) 
    $scope.jobId = getUrlPathSegment($location.url(), 2);
    $scope.tabId = routeTabId($scope.tabs);

    // other scope properties  
    $scope.jobDetailView = ($scope.job == null) ? 'loading' : 'content';
    $scope.jobLoadError = '';
    

    /**
    * Display the processing dialog. 
    * @return {boolean} show Show processing dialog
    */
    $scope.showProcessing = function (show) {
        if (show) {
            $('#processing-dialog').modal('show');
        } else {
            $scope.removeModal('#processing-dialog');
        }
    };

    /**
    * Completely removes a modal and its backdrop.
    */
    $scope.removeModal = function (id) {
        $(id).modal('hide');
        $('body').removeClass('modal-open');
        $('.modal-backdrop').remove();
    };


    $scope.removeBackdrop = function () {
        $('.modal-backdrop').remove();
    };


    /**
    * Flags if a job is complete.
    */
    $scope.isComplete = function () {
        return ($scope.job) ? ($scope.job.stage == 5) : false;
    };


    /**
    * Flags if a job is past the due date.
    */
    $scope.isOverdue = function () {
        if ($scope.isComplete) { return false; };
        return ($scope.job) ? ($scope.job.dueDate < Date.now()) : false;
    };


    /**
    * Flags if a job has active holds.
    */
    $scope.isOnHold = function () {
        var c = 0;
        for (var i = 0; i < wmServiceSvc.data.details.holds.rows.length; i++) {
            c += (wmServiceSvc.data.details.holds.rows[i].releasedBy == '') ? 1 : 0;
        }
        return (c > 0);
    }


    /**
    * Responds when the URL location changes
    */
    $scope.$on('$locationChangeSuccess', function (evt, newUrl, oldUrl) {
        wmServiceSvc.data.details.tab = getUrlPathSegment($location.url(), 3);
        loadJobDetails('$locationChangeSuccess');
    });


    /**
    * Returns a segment value within a URL path. 
    * @param {string} path URL path
    * @param {number} i Segment index
    * @return {string] Segment value
    */
    function getUrlPathSegment(path, i) {
        var a = path.split("/");
        return (a.length > i) ? a[i] : null;
    };


    /**
    * Returns the current path. Used to show address in 404 messages.
    */
    $scope.urlLocation = function () {
        return $location.url();
    };


    /**
    * Gets the tab id from the route parameters. Redirects to the default tab if the id does not exist.
    * @return {string} Tab identifier
    */
    function routeTabId(tabs) {
        // get tabid from route
        var tabId = getUrlPathSegment($location.url(), 3);

        // return default if null
        if (tabId == null) {
            if (logSvc.debug) {
                console.log('Tab not specified (return default)',
                    { tabId: wmConfig.general.defaultTabId });
            }
            return wmConfig.general.defaultTabId;
        };
        // verify tab exists
        for (var i = 0; i < tabs.length; i++) {
            if (tabs[i].id == tabId) {
                return tabId;
            }
        }
        // return 404 if this tab does not exist
        if (logSvc.debug) { console.log('Tab not found', { tabId: tabId }) };
        return '404';
    };


    /**
     * Responds to the load-success event.
     */
    $rootScope.$on('load-success', function (evt) {
        // only load details after startup is complete
        loadJobDetails('load-success');
    });


    /**
    * Wrapper for getJob to determine where the call comes from
    * @param {string} caller Call source
    */
    function loadJobDetails(caller) {
        if (logSvc.debug) { console.log('Job Detail View (loadJobDetails)', { caller: caller, jobId: $scope.jobId, tabId: $scope.tabId }); };
        getJob($scope.jobId);
    };


    /**
    * Requests the job details from the server.
    * @param {number} jobId Job identifier
    */
    function getJob(jobId) {
        if (logSvc.debug) { console.log('Job Detail View (getJob)', { currentJob: $scope.job, jobId: jobId }); };
        
        // requery jobs
        $scope.jobDetailView = 'loading';
        //$scope.job = null;
        wmServiceSvc.getJob(jobId).then(function (job) {
            $scope.job = job;
            $scope.jobLoadError = '';
            $scope.jobDetailView = 'content';
        }, function (ex) {
            $scope.job = null;
            if (ex == 404) {
                $scope.jobDetailView = '404';
            } else {
                $scope.jobLoadError = ex.error.message;
                $scope.jobDetailView = 'error';
            }
        });
    };


    /*
    * Returns true if the item is the active tab, otherwise false
    */
    $scope.isActiveTab = function (item) {
        return ($scope.tabId == item.id);
    };


    /*
    * Returns true if the job is loaded and matches the job id in the URL path, otherwise false
    */
    function jobLoaded() {
        if ($scope.job == null) { return false; };
        return ($scope.job.id == $scope.jobId);
    };


    function init() {
        if (wmServiceSvc.started && !jobLoaded()) {
            loadJobDetails('init');            
        }
    }
    
    init();

    if (logSvc.debug) { console.log('jobDetailCtrl (startup)', { jobId: $scope.jobId, tabId: $scope.tabId }) };

    }]);


})();