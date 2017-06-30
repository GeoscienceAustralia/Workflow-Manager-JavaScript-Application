/**
 * Workflow Manager - Job Properties Tab Controller. 
 */
(function () {
    'use strict';


    angular.module('wmApp').controller('propertiesTabCtrl', ['$scope', '$q', 'logSvc', 'wmConfig', 'wmServiceSvc', function
        ($scope, $q, logSvc, wmConfig, wmServiceSvc) {

        const TABID = 'properties';

        // scope properties (from cached data)
        $scope.jobList = wmServiceSvc.data.jobList;
        $scope.job = wmServiceSvc.data.details.job;
        $scope.notes = (wmServiceSvc.data.details.notes.loaded) ? wmServiceSvc.data.details.notes.text : '';

        // scope properties
        $scope.tabName = wmConfig.i18n.tabs.properties;
        $scope.tabView = ($scope.job) ? 'content' : 'loading';
        $scope.loadError = '';
        $scope.loadErrorRetry = false;

        // assign job dialog
        $scope.users = wmServiceSvc.data.users;
        $scope.groups = wmServiceSvc.data.groups;
        $scope.newAssignType = ($scope.job) ? $scope.job.assignedType : 0;
        $scope.newAssignTo = ($scope.job) ? $scope.job.assignedTo : '';

        // update notes dialog
        $scope.newNotes = '';
           
        $scope.changeParentId = function (id) {
            $scope.newParentJobId = id;
        };

        /**
        * Assigns a job to the current user (if required).
        */
        $scope.setNewJobAssignTo = function () {
            if ($scope.newAssignType == -99) {
                $scope.newAssignTo = $scope.$parent.currentUser.userName;
            } else {
                $scope.newAssignTo = '';
            }
        };


        /**
        * Sends a request to the server to assign the job.
        */
        $scope.assignJob = function () {
            removeModal('#assignJobDialog');        
            if ($scope.newAssignType == -99) { $scope.newAssignType = 1; }
            showProcessing(true);
            wmServiceSvc.assignJob($scope.jobId, $scope.newAssignType, $scope.newAssignTo).then(function (job) {
                showProcessing(false);
                $scope.job = job;
                if (job.assignedToDV != '') {
                    logSvc.success('Job #' + $scope.jobId + ' has been assigned to ' + job.assignedToDV, 'Job Assigned', true);
                } else {
                    logSvc.success('Job #' + $scope.jobId + ' assignment has been cleared', 'Job Assigned', true);
                }
            }, function (ex) {
                showProcessing(false);
            });
        };


        function removeModal(id) {
            $(id).modal('hide');
            $('body').removeClass('modal-open');
            $('.modal-backdrop').remove();
        };


        /**
        * Sends a request to the server to update the job notes.
        */
        $scope.saveNotes = function () {
            $('#editNotesDialog').modal('hide');
            showProcessing(true);
            wmServiceSvc.saveNotes($scope.jobId, $scope.newNotes).then(function (r) {
                showProcessing(false);
                $scope.newNotes = r;
                $scope.notes = r;
                logSvc.success('Notes have been updated for job #' + $scope.jobId, 'Notes Updated', true);
            }, function (ex) {
                showProcessing(false);
            });
        };


        // update details dialog
		$scope.newJobName = '';
        $scope.newDesc = '';
        $scope.newDueDate = 0;
        $scope.newPriority = 0;
        $scope.newParentJobId = null;


        /**
        * Sends a request to the server to update the job details.
        */
        $scope.saveDetails = function () {
            $('#editDetailsDialog').modal('hide');
            showProcessing(true);

            // check if parent job has changed
            //console.log('Parent JobID:', $scope.newParentJobId);
            checkParentId($scope.job, $scope.newParentJobId).then(function (result) {
                //console.log('checkParentId result:', result);
                if (result == 'not found') {
                    var ex = {
                        error: new Error('Parent job not found on the server. Job details have not been saved.'),
                        args: null
                    };
                    logSvc.warn(ex, true);
                    showProcessing(false);
                    return;
                } else {
                    // assume no change
                    var parentId = $scope.job.parentJobId;
                    // set to zero for null
                    if (result == 'set null') { parentId = 0; }
                    // set to new id for changes
                    if (result == 'found') { parentId = $scope.newParentJobId; }
                    // apply updates
                    wmServiceSvc.updateJob($scope.jobId, $scope.newPriority, $scope.newDueDate, parentId, $scope.newDesc, $scope.newJobName).then(function (job) {
                        showProcessing(false);
                        console.log('Job Updated: ', job);
                        $scope.job = job;
                        logSvc.success('Job #' + $scope.jobId + 'details have been updated', 'Job Updated', true);
                    }, function (ex) {
                        showProcessing(false);
                    });
                }
            });

        };


        /**
        * Checks if a parent job id has been changed and tests if the new id exists 
        * @param {Object} job Current job object
        * @param number} newId New parent job id
        * @return {promise} Promise containing the reports data
        */
        function checkParentId(job, newId) {
            var d = $q.defer();

            // check if parent job has changed
            var original = (job.parentJobId == 0) ? null : job.parentJobId;
            if (newId != original) {
                if (newId != null) {
                    // get selected job
                    wmServiceSvc.getParentJob($scope.newParentJobId).then(function (data) {
                        // job exists
                        //console.log('PARENT JOB: ', data); 
                        d.resolve('found');
                    }, function (ex) {
                        console.log('PARENT JOB EX: ', ex);
                        d.resolve('not found');
                    });
                } else {
                    d.resolve('set null');
                }
            } else {
                d.resolve('no change');
            }    
            return d.promise;
        };


        function getDate(value) {
            var parts = value.split('/');
            var d = parseInt(parts[0]);
            var m = parseInt(parts[1]) - 1;
            var y = parseInt(parts[2]);
            //console.log('getDate', value, d,m,y);
            return new Date(y, m, d);
        };


        /**
        * Sets the job detail edit dialog values.
        */
        $scope.setEditValues = function (job) {
            console.log('setEditValues', job);
            if (job) {
				$scope.newJobName = job.name;
                $scope.newDesc = job.description;
                $scope.newDueDate = (job.dueDate) ? new Date(job.dueDate): null;
                $scope.newPriority = job.priority;
                $scope.newParentJobId = (job.parentJobId == 0) ? null : job.parentJobId;
            } else {
				$scope.newJobName = '';
                $scope.newDesc = '';
                $scope.newDueDate = null;
                $scope.newPriority = 0;
            }
            console.log('scope new due date: ', $scope.newDueDate);

        };


        /**
        * Responds to the load-success event by loading the tab data.
        */
        $scope.$on('job-loaded', function (evt, args) {
            $scope.job = args.job;
            $scope.users = wmServiceSvc.data.users;
            $scope.groups = wmServiceSvc.data.groups;
            $scope.newAssignType = ($scope.job) ? $scope.job.assignedType : 0;
			$scope.newAssignTo = ($scope.job) ? $scope.job.assignedTo : '';
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
        * Loads the notes data from the workflow manager service.
        * @param {number} jobId Job identifier
        * @param {boolean} refresh Request new data from the server
        */
        function loadTabData(jobId, refresh) {
            if ($scope.tabId == TABID) {
                if (refresh == undefined) { refresh = false; };
                if (logSvc.debug) { console.log('Load Tab Data: ', { tab: TABID, jobId: jobId, refresh: refresh }); };
                $scope.tabView = 'loading';
                $scope.job = wmServiceSvc.data.details.job;
                wmServiceSvc.getNotes(jobId, refresh).then(function () {
                    $scope.notes = wmServiceSvc.data.details.notes.text;
                    $scope.newNotes = $scope.notes;
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
            if (wmServiceSvc.started && $scope.notes.loaded == false) {
                loadTabData(jobId);
            }
        };

        init($scope.jobId);

        //if (logSvc.debug) { console.log('propertiesTabCtrl (startup)', { jobId: $scope.jobId, started: wmServiceSvc.started, holds: $scope.holds }) };

    }]);

})();