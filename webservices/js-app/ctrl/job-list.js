/**
 * Workflow Manager - Job List Controller. 
 */
(function() {
    'use strict';


    angular.module('wmApp').controller('jobListCtrl',
        ['$scope', '$rootScope', '$location', '$filter', 'moment', 'toastr', 'logSvc', 'wmConfig', 'wmServiceSvc', function
                ($scope, $rootScope, $location, $filter, moment, toastr, logSvc, wmConfig, wmServiceSvc) {

        // scope properties (from cached data)
        $scope.viewData = wmServiceSvc.data.jobList;
        $scope.users = wmServiceSvc.data.users;
        $scope.groups = wmServiceSvc.data.groups;
        $scope.jobTypes = wmServiceSvc.data.jobTypes;

        // scope properties    
        $scope.jobListView = ($scope.viewData.loaded) ? 'content': 'loading';
        $scope.jobLoadError = '';
        $scope.newJobTypeTip = '';
        $scope.newJob = newEmptyJob();
		

        /**
        * Responds to changes in the job type in the new job dialog
        */
        $scope.newJobTypeChange = function () {        
            var id = $scope.newJob.jobTypeId;
            var jt;
            for (var i = 0; i < $scope.jobTypes.length; i++) {
                jt = $scope.jobTypes[i];
                if (jt.id == id) {
                    // set job type defaults
                    $scope.newJob.dueDate = getDueDate(jt.defaultJobDuration);
                    $scope.newJob.priority = jt.defaultPriority;
                    if (jt.defaultAssignedTo == '[SYS:CUR_LOGIN]') {
                        $scope.newJob.assignType = -99; // Job owner
                    } else {
                        $scope.newJob.assignType = jt.defaultAssignedType;
                    }
                    $scope.newJobTypeTip = (jt.description != '') ? jt.description : '(no job type description available)';
                    return;
                }
            }
        };
            

        /**
        * Responds to changes in the assign to drop down in the new job dialog
        */
        $scope.setNewJobAssignTo = function(){
            if ($scope.newJob.assignType == -99) {
                 $scope.newJob.assignTo = $scope.$parent.currentUser.userName;
            } else {
                $scope.newJob.assignTo = '';
            }
        };



        /**
        * Returns a due date (from today) given a duration in days.
        * @param {number} dur Duration in days
        */
        function getDueDate(dur) {
            if (dur > 0) {
                var dDate = moment().add(dur, 'days');
                return new Date(dDate.valueOf());
            } else {
                return null;
            }
        };

        /**
        * Returns a job type with the matching id.
        * @param {number} id Job type id
        */
        function getJobType(id) {
            for (var i = 0; i < $scope.jobTypes.length; i++) {
                if ($scope.jobTypes[i].id == id) {
                    return $scope.jobTypes[i];
                }
            }
            return null;
        }
            

       /**
        * Resets the new job object to default values.
        */
        $scope.cancelNewJob = function () {
            $scope.newJob = newEmptyJob();
        };


        /**
        * Creates a new job on the the server.
        * @param {Object} job Job object
        */
        $scope.createJob = function (job) {
            showProcessing(true);
            wmServiceSvc.createJob(job).then(function (r) {
                $scope.selectJob(r);
                showProcessing(false);
                // redirect to job details (after slight pause)
                wmServiceSvc.uiTimeout(function () {
                    $scope.openJobDetail(r);
                }, 500);
            }, function (ex) {
                // wmServiceSvc shows warning message
                showProcessing(false);
            });
        };


        /**
        * Returns a new empty job object.
        */
        function newEmptyJob() {
            return {
                jobTypeId: null,
                parentJobId: null,
                assignType: 0,
                assignTo: '',
                name:'',
                cloneOf: -1,
                startDate: new Date(Date.now()),
                dueDate: null,            
                priority: 0,
                description: ''
            };
        };


        /**
         * Applies a filter to the job list and requests new data from the server.
         * @param {filter} filter object
         */
        $scope.runFilter = function (item) {
            $scope.viewData.filter = item;
            getJobs(item.id);
        };


        /**
        * Navigates to a job detail URL.
        * @param {number} jobid Job identifier
        */
        $scope.openJobDetail = function (jobId) {
            if (logSvc.debug) { console.log('Open Job Detail', jobId) };
             $location.url('job/' + jobId);
        }
        

        /**
        * Creates a copy the selected job properties and displays the clone dialog
        */
        $scope.cloneJob = function () {

            if ($scope.viewData.selJobId == -1) { return; };
            $scope.jobTypes = wmServiceSvc.data.jobTypes;

            // get selected job
            wmServiceSvc.getJob($scope.viewData.selJobId, false, true).then(function (data) {
                $scope.newJob = newEmptyJob();
                $scope.newJob.cloneOf = $scope.viewData.selJobId;
                $scope.newJob.jobTypeId = data.jobTypeId;
                $scope.newJob.assignType = data.assignedType;
                $scope.newJob.assignTo = data.assignedTo;
                $scope.newJob.priority = data.priority;
                $scope.newJob.description = data.description;
                var jt = getJobType(data.jobTypeId);
                if (jt) {
                    $scope.newJob.dueDate = getDueDate(jt.defaultJobDuration);
                }
                $('#createJobDialog').modal('show');
            });
        };


        /**
        * Deletes a single job.
        * @param {number} jobId Job identifier
        */
        $scope.deleteJob = function (jobId) {
            wmServiceSvc.deleteJobs([jobId]).then(function (ids) {
                logSvc.success('Job #' + jobId + ' has been deleted', 'Job Deleted', true);
            });
        };


        /**
         * Responds to the load-success event by requesting the jobs to display.
         */
        $rootScope.$on('load-success', function (evt) {
            $scope.users = wmServiceSvc.data.users;
            $scope.groups = wmServiceSvc.data.groups;
            $scope.jobTypes = wmServiceSvc.data.jobTypes;
            getJobs($scope.viewData.filter.id);
        });


        /**
         * Watches for changes in the search term and clears the selected job row.
         */
        $scope.$watch('searchTerm', function () {
            $scope.selectedJobId = -1;
        });
            

        /**
         * Selects a job row in the job list table
         * @param {number} jobid Job identifier
         */
        $scope.selectJob = function (jobid) {
            $scope.viewData.selJobId = jobid;
        };


        /**
        * Reloads the job data from the server
        * Notes: short delay so user knows something is happening
        */
        $scope.reloadJobQuery = function () {
            toastr.clear();
            $scope.jobListView = 'loading';
            $scope.jobLoadError = '';
            // simulate display so user knows something is happening
            wmServiceSvc.uiTimeout(function () {
                getJobs($scope.filter.id);
            }, wmServiceSvc.uiDelay);
        };


        /**
         * Returns true if a job row is selected, otherwise false
         */
        $scope.jobRowSelected = function () {
            return ($scope.viewData.selJobId > -1);
        };


        /**
         * Returns the list of other values to display in the job list table 
         * (excludes the Job Id and Name fields defined in config)
         * @param {array} job Array of field values
        */
        $scope.otherValues = function (job) {
            var values = [];
            var fld;
            for (var i = 0; i < job.length; i++) {
                fld = $scope.viewData.fields[i];
                if (fld.name != wmConfig.server.jobIdField &&
                    fld.name != wmConfig.server.jobNameField) {
                    // filter on field type
                    //console.log('othervalues: ', fld, job);
                    if (fld.type == 5) {
                        // filter date value 
                        values.push(stripTime(job[i]));        
                    } else if (fld.name == 'JTX_JOBS.ASSIGNED_TO' || 
                        fld.name == 'JTX_JOBS.OWNED_BY') {
                        // look up user
                        var user = wmServiceSvc.getUser(job[i]);
                        if (user) {
                            values.push(user.fullName);
                        } else {
                            values.push(wmConfig.groups[job[2]]);
                        }                             
                    } else {
                        values.push(job[i]);
                    }          
                }
            }
            return values;
        };


        /**
        * Removes the time component of a datetime string
        * @param {string} value DateTime string (e.g. 21/06/2016 14:54:21 PM)
        */
        function stripTime(value){
            var index = value.indexOf(' ');
            return value.substring(0, index);
        }


        /**
        * Requests the jobs data from the server.
        * @param {number} qryId Query identifier (selected filter)
        */
        function getJobs(qryId, refresh) {
            // requery jobs
            if (refresh == undefined) { refresh = false };
            $scope.jobListView = 'loading';
            wmServiceSvc.getJobs(qryId, refresh).then(function (r) {
                console.log('job result', r);
                $scope.jobLoadError = '';
                $scope.jobListView = 'content';
                loadJobs(r);
            }, function (ex) {
                console.log(ex);
                $scope.jobLoadError = ex.error.message;
                $scope.jobListView = 'error';
            });
        };


        /**
        * Loads the jobs data.
        * @param {Object} data Object containing fields array and jobs array
        */
        function loadJobs(data) {
            if (logSvc.debug) { console.log('Load Jobs', data) };
            $scope.viewData.otherFields = [];
            $scope.jobDataLoading = false;
            // locate id, name and other fields
            if (data.fields) {
                for (var i = 0; i < data.fields.length; i++) {
                    var fld = data.fields[i];
                    if (fld.name == wmConfig.server.jobIdField) {
                        if (logSvc.debug) { console.log('jobListCtrl: Job Id Field: ', fld) };
                        $scope.viewData.jobIdField = fld;
                        $scope.viewData.jobIdIndex = i;
                    }
                    else if (fld.name == wmConfig.server.jobNameField) {
                        if (logSvc.debug) { console.log('Job Name Field: ', fld) };
                        $scope.viewData.jobNameField = fld;
                        $scope.viewData.jobNameIndex = i;
                    }
                    else {
                        if (logSvc.debug) { console.log('jobListCtrl: Other Field: ', fld) };
                        $scope.viewData.otherFields.push(fld);
                    }
                }
            }
        }


        /**
        * Returns the selected query id or the default id, otherwise the first item id is returned.
        */
        function getFilterId() {
            if (wmServiceSvc.data.jobList.filter != null) {
                return wmServiceSvc.data.jobList.filter.id;
            } else {
                return wmServiceSvc.data.jobList.filters[0];
            }
        }


        /**
        * Display the processing dialog. 
        * @return {boolean} show Show processing dialog
        */
         function showProcessing (show) {
            var v = (show) ? 'show' : 'hide';
            $('#processing-dialog').modal(v);
        };



         $scope.refresh = function () {
             if (wmServiceSvc.started) {
                 $scope.jobTypes = wmServiceSvc.data.jobTypes;
                 getJobs(getFilterId());
             }
         };


        /**
        * Loads the cached job data if the service data has already been loaded.
        */
        function init() {
            if (wmServiceSvc.started && !wmServiceSvc.data.jobList) {
                console.log('jobListCtrl - init (get jobs)');
                $scope.jobTypes = wmServiceSvc.data.jobTypes;
                getJobs(getFilterId());
            }
        }


        init();


        if (logSvc.debug) { console.log('jobListCtrl - Started:', { viewData: $scope.viewData }) };
        
    }]);


})();