/**
 * Workflow Manager - Service to communicate with ESRI service and cache responses. 
 */

(function() {
    'use strict';


    angular.module('wmApp').service('wmServiceSvc', ['$rootScope', '$http', '$q', '$timeout', 'logSvc', 'wmConfig', function
        ($rootScope, $http, $q, $timeout, logSvc, wmConfig) {
        
        // tab names from config
        var tabNames = wmConfig.i18n.tabs;
    
        /* === Service Properties (cached data) ===*/

        var svc = {
            baseUrl: wmConfig.server.serviceUrl,
            data: {

                // General Data            
                serviceInfo: null,
                currentUser: null,
                userId: '',  // this is the modified version sent with requests (for example ?user=PROD*u123456)
                currentUserPrivileges: null,
                assignableUsers: [],
                users: [],
                groups: [],
                jobTypes:[],

                domains: {
                    loaded: false,
                    lists: []
                },       

                // Job List Page Data
                jobList: {
                    loaded: false,
                    fields: [],
                    rows: [],
                    queryId: null,
                    filters: [],
                    filter: null,  
                    searchTerm: '',          
                    selJobId: -1,
                    jobIdField: null,
                    jobIdIndex: null,
                    jobNameField: null,
                    jobNameIndex: null,
                    otherFields: []
                },

                // Reports Page Data
                reports: {
                    chartType: wmConfig.general.defaultChartType, 
                    currentReport: null,
                    currentReportData: null,
                    loaded: false,
                    rows: []
                },

                // Job Detail Page Data
                details: {
                    job: null,
                    tab: null,
                    workflow: {
                        steps: {
                            loaded: false,
                            rows: []
                        },
                        image: {
                            loaded: false,
                            data: null
                        },
                        currentStep: null,
                        currentSteps: {
                            loaded: false,
                            rows: []
                        }
                    },
                    jobDetails: {
                        loaded: false
                    },
                    extProps: {
                        loaded: false,                    
                        tables11: [],
                        tables1N: [],
                        domainsLoaded: false,
                        domains:[]
                    },
                    activity: {
                        loaded: false,
                        rows: []                    
                    },
                    dependencies: {
                        loaded: false
                    },
                    attachments: {
                        loaded: false,
                        rows: []
                    },
                    notes: {
                        loaded: false,
                        text: null
                    },
                    holds: {
                        loaded: false,
                        rows: []
                    }
                }                   
            },
            // job detail tabs (change tab names in wm_config.js)
            tabs:[
                { id: 'workflow', name: tabNames.workflow },
                { id: 'details', name: tabNames.details },
                { id: 'dependencies', name: tabNames.dependencies },
                { id: 'properties', name: tabNames.properties },
                { id: 'activity', name: tabNames.activity },
                { id: 'attachments', name: tabNames.attachments },
                { id: 'holds', name: tabNames.holds }
            ],
            // flag if service info, users and groups are loaded
            started: false,
            // default delay for timeouts
            uiDelay: 5000,
            // wrapper for $timeout
            uiTimeout: $timeout
        };
    

        /**
        * Resets the data for the selected job in the service cache. 
        */
        function clearJobDetails() {
            var t = svc.data.details.tab;
            svc.data.details = {
                job: null,
                tab: t,
                workflow: {
                    steps: { loaded: false, rows: [] },
                    image: { loaded: false, data: null },
                    currentStep: null,
                    currentSteps: { loaded: false, rows: [] }
                },
                jobDetails: {
                    loaded: false
                },
                extProps: {
                    loaded: false,                    
                    tables11: [],
                    tables1N: [],
                    domainsLoaded: false,
                    domains:[]
                },
                activity: {
                    loaded: false,
                    rows: []                    
                },
                dependencies: {
                    loaded: false
                },
                attachments: {
                    loaded: false,
                    rows: []
                },
                notes: {
                    loaded: false,
                    text: null
                },
                holds: {
                    loaded: false,
                    rows: []
                }
            };
        };

        

        /* === Reports ============================*/


        /**
        * Gets the reports from the WM service. 
        * @param {boolean} refresh Refresh data from the server
        * @return {promise} Promise containing the reports list
        */
        svc.getReports = function (refresh) {
            var d = $q.defer();
            if (refresh == undefined) { refresh = false };
            if (!svc.data.reports.loaded || refresh) {
                var url = svc.baseUrl + '/reports?f=json';
                if (logSvc.debug) { console.log('GET Reports (request)', url) };
                $http.get(url).then(function (r) {
                    if (logSvc.debug) { console.log('<<< Reports (response)', r.data) };
                    svc.data.reports.rows = r.data;
                    svc.data.reports.loaded = true;
                    svc.data.reports.currentReport = (r.data.length > 0) ? r.data[0] : null;          
                    console.log(svc.data.reports);
                    d.resolve(r.data);
                }, function (r) {
                    var ex = {
                        error: new Error('Unable to retrieve service info data from the server'),
                        args: r
                    };
                    if (logSvc.error(ex)) { console.error(ex.error.message, r) };
                    d.reject(ex);
                });
            } else {
                if (logSvc.debug) { console.log('<<< ServiceInfo (cache)', svc.data.serviceInfo) };
                d.resolve(svc.data.serviceInfo);
            }
            return d.promise;
        };


        /**
        * Gets the data for a single report from the WM service. 
        * @param {boolean} refresh Refresh data from the server
        * @return {promise} Promise containing the reports data
        */
        svc.getReport = function (id) {
            var d = $q.defer();  
            var url = svc.baseUrl + '/reports/' + id + '/data?user=' + svc.data.userId + '&f=json&ts=' + timestamp();
            if (logSvc.debug) { console.log('GET Report (request)', url) };
            $http.get(url).then(function (r) {
                if (logSvc.debug) { console.log('<<< Report (response)', r.data) };
                if (r.data.error) {
                    var ex = {
                        error: new Error('Unable to report data from the server.' + r.data.error.message),
                        args: r
                    };
                    if (logSvc.error(ex)) { console.error(ex.error.message, r) };
                    d.reject(ex);
                } else {
                    d.resolve(r.data.reportData);
                }           
            }, function (r) {
                var ex = {
                    error: new Error('Unable to report data from the server'),
                    args: r
                };
                if (logSvc.error(ex)) { console.error(ex.error.message, r) };
                d.reject(ex);
            });

            return d.promise;
        };


        /* === Service Information ================*/


        /**
        * Gets the service info from the WM service. 
        * @param {boolean} refresh Refresh data from the server
        * @return {promise} Promise containing the service info
        */
        svc.getServiceInfo = function (refresh) {
            var d = $q.defer();
            if (refresh == undefined) { refresh = false };
            if (svc.data.serviceInfo == null || refresh) {
                var url = svc.baseUrl + '?f=json';
                if (logSvc.debug) { console.log('GET ServiceInfo (request)', url) };
                $http.get(url).then(function (r) {                
                    svc.data.serviceInfo = r.data;
                    // cache public queries from service info
                    loadQueries(svc.data.serviceInfo.publicQueries);
                    if (logSvc.debug) { console.log('<<< ServiceInfo (response)', r.data) };
                    $rootScope.$broadcast('service-info-loaded', { serviceInfo: r.data });
                    d.resolve(r.data);
                }, function (r) {
                    var ex = {
                        error: new Error('Unable to retrieve service info data from the server'),
                        args: r
                    };
                    if (logSvc.error(ex)) { console.error(ex.error.message, r) };
                    d.reject(ex);
                });
            } else {
                if (logSvc.debug) { console.log('<<< ServiceInfo (cache)', svc.data.serviceInfo) };
                d.resolve(svc.data.serviceInfo);
            }
            return d.promise;
        };

        
        /**
         * Gets the details for all active job types from the WM service. 
         * @return {promise} Promise containing the job type details
         */
        svc.getJobTypes = function () {
            var d = $q.defer();    
            var siJobTypes = svc.data.serviceInfo.jobTypes;
            var promises = [];  
            for (var i = 0; i < siJobTypes.length; i++) {
                // only show active jobs (1)
                if (siJobTypes[i].state == 1) { 
                    promises.push(svc.getJobTypesDetail(siJobTypes[i].id));
                }            
            }
            if (promises.length == 0) { d.resolve([]); };
            // request all job type details from server
            $q.all(promises).then(function (value) {
                svc.data.jobTypes = value;
                if (logSvc.debug) { console.log('<<< Job Type Details (response)', value) };
                d.resolve(value);
            }, function (ex) {
                d.reject(ex);
            });
            return d.promise;
        }


        /**
         * Gets the details for a single job type from the WM service. 
         * @param {number} id Job type id
         * @return {promise} Promise containing the job type details
         */
        svc.getJobTypesDetail = function (id) {
            var d = $q.defer();       
            var url = svc.baseUrl + '/jobTypes/' + id + '?f=json';
            if (logSvc.debug) { console.log('GET Job Type Detail (request)', url) };
            $http.get(url).then(function (r) {            
                d.resolve(r.data);
            }, function (ex) {
                d.reject(ex);
            });
            return d.promise;
        }

        

        /* === Users and Groups ===================*/


        /**
         * Sets the current user. 
         * @param {user} user object
         * @fires current-user-updated
         */
        svc.setCurrentUser = function (user) {
            svc.data.currentUser = user;
            svc.data.userId = user.userName.replace('\\', '*');
            if (logSvc.debug) { console.log('Current User Set', user, svc.data.userId) };
            $rootScope.$broadcast('current-user-updated', { user: user });
        };


        /**
        * Gets a user from the user array. 
        * @param {string} username
        * @return {user}  user object or null if not found
        */
        svc.getUser = function (username) {
            // include alternate username 
            var altname = username.replace('*', '\\');
            var u = null;
            for (var i = 0; i < svc.data.users.length; i++) {
                if (svc.data.users[i].userName == username ||
                    svc.data.users[i].userName == altname) {
                    u = svc.data.users[i];
                    break;
                }
            }
            return u;
        };


        /**
         * Gets the list of users from the WM service. 
         * @param {boolean} refresh Refresh data from the server
         * @return {promise} Promise containing the array of user objects
         */
        svc.getUsers = function (refresh) {
            var d = $q.defer();
            if (refresh == undefined) { refresh = false };
            if (svc.data.groups.length == 0 || refresh) {
                // request from server
                var url = svc.baseUrl + '/community/users?f=json';
                if (logSvc.debug) { console.log('GET Users (request)', url) };
                $http.get(url).then(function (r) {
                    svc.data.users = r.data.users;
                    if (logSvc.debug) { console.log('<<< Users (response)', r.data) };
                    $rootScope.$broadcast('users-updated', { users: svc.data.users });
                    d.resolve(svc.data.users);
                }, function (ex) {
                    ex = {
                        error: new Error('Unable to retrieve users data from the server'),
                        args: r
                    };
                    logSvc.error(ex);
                    d.reject(ex);
                });
            } else {
                // return cached data
                if (logSvc.debug) { console.log('<<< Users (cache)', svc.data.users) };
                d.resolve(svc.data.users);
            }
            return d.promise;
        };


        /**
         * Gets the list of users from the WM service. 
         * @param {boolean} refresh Refresh data from the server
         * @return {promise} Promise containing the array of group objects
         */
        svc.getGroups = function (refresh) {
            var d = $q.defer();
            if (refresh == undefined) { refresh = false };
            if (svc.data.groups.length == 0 || refresh) {
                // request from server
                var url = svc.baseUrl + '/community/groups?f=json';
                if (logSvc.debug) { console.log('GET Groups (request)', url) };
                $http.get(url).then(function (r) {
                    svc.data.groups = r.data.groups;
                    if (logSvc.debug) { console.log('<<< Groups (response)', r.data) };
                    $rootScope.$broadcast('groups-updated', { groups: svc.data.groups });
                    d.resolve(svc.data.groups);
                }, function (ex) {
                    ex = {
                        error: new Error('Unable to retrieve groups data from the server'),
                        args: r
                    };
                    logSvc.error(ex);
                    d.reject(ex);
                });
            } else {
                // return cached data
                if (logSvc.debug) { console.log('<<< Groups (cache)', svc.data.groups) };
                d.resolve(svc.data.groups);
            }
            return d.promise;
        };


    
        /* === Job List and Details ===============*/


        /**
        * Queries the WM service for jobs. 
        * @param {number} queryid Query identifier
        * @param {boolean} refresh Refresh data from the server
        * @return {promise} Promise containing the jobs data
        */
        svc.getJobs = function (queryid, refresh) {
            var d = $q.defer();
            if (refresh == undefined) { refresh = false };
            if (svc.data.jobList.rows.length == 0 || svc.data.jobList.queryId != queryid || refresh) {
                var url = svc.baseUrl + '/jobs/query?id=' + queryid + '&user=' + svc.data.userId + '&f=json&ts=' + timestamp();
                if (logSvc.debug) { console.log('GET Jobs (request)', url) };
                $http.get(url).then(function (r) {
                    // append queryId to data
                    svc.data.jobList.queryId = queryid;
                    svc.data.jobList.fields = r.data.fields;
                    svc.data.jobList.rows = r.data.rows;
                    svc.data.jobList.loaded = true;
                    if (logSvc.debug) { console.log('<<< Jobs (response)', r.data) };
                    d.resolve(svc.data.jobList);
                }, function (r) {
                    var ex = {
                        error: new Error('Unable to retrieve jobs data from the server'),
                        args: r
                    };
                    if (logSvc.error(ex)) { console.error(ex.error, ex.args) };
                    d.reject(ex);
                });
            } else {
                if (logSvc.debug) { console.log('<<< Jobs (cache)', svc.data.jobList) };
                d.resolve(svc.data.jobList);
            }        
            return d.promise;
        };

    
        /**
        * Queries the WM service for job data. 
        * @param {number} jobId Job identifier
        * @param {boolean} refresh Refresh data from the server
        * @return {promise} Promise containing the job data
        */
        svc.getJob = function (jobId, setActive, refresh) {
            var d = $q.defer();
            if (refresh == undefined) { refresh = false };
            if (setActive == undefined) { setActive = true };
            // notify if job id is changing
            if (setActive) {
                if (svc.data.details.job != null && svc.data.details.job.id != jobId) {
                    if (logSvc.debug) { console.log('job-changing', { oldJobId: svc.data.details.job.id, newJobId: jobId }) };
                    $rootScope.$broadcast('job-changing', { oldJobId: svc.data.details.job.id, newJobId: jobId });
                    clearJobDetails();
                }
            }
            if (svc.data.details.job == null || refresh) {            
                // request from server
                var url = svc.jobUrl(jobId) + '?f=json';
                if (logSvc.debug) { console.log('GET Job (request)', url) };
                $http.get(url).then(function (r) {
                    if (logSvc.debug) { console.log('<<< Job (response)', { jobId: jobId, job: r.data }) };
                    if (r.data.id != undefined) {                    
                        // additional data properties
                        r.data.jobType = jobTypeById(r.data.jobTypeId);
                        r.data.jobStatus = jobStatusById(r.data.status);
                        r.data.assignedToDV = '';
                        if (r.data.assignedType == 1) {
                            r.data.assignedToDV = userDisplayNameById(r.data.assignedTo);
                        } else if (r.data.assignedType == 2) {
                            r.data.assignedToDV = wmConfig.groups[r.data.assignedTo] + ' (Group)';
                        }
                        r.data.priorityDV = wmConfig.enums.priority[r.data.priority];
                        r.data.dataWorkspace = dataWorkspaceById(r.data.dataWorkspaceId);
                        r.data.createdByDV = userDisplayNameById(r.data.createdBy);
                        r.data.ownedByDV = userDisplayNameById(r.data.ownedBy);
                        // cache and return job
                        if (setActive) {
                            svc.data.details.job = r.data;
                            $rootScope.$broadcast('job-loaded', { job: r.data });
                        }
                        d.resolve(r.data);
                    } else {
                        if (logSvc.warn(null, false)) { console.warn('<<< Job (404 response)', { jobId: jobId }) };
                        svc.data.details.job = null;
                        d.reject(404);
                    }            
                }, function (r) {
                    var ex = {
                        error: new Error('Unable to retrieve job data from the server'),
                        args: r
                    };        
                    if (logSvc.warn(ex)) { console.warn(ex.error.message, ex.args) };
                    d.reject(ex);
                });
            } else {
                // return cached version
                if (logSvc.debug) { console.log('<<< Job (cache)', { jobId: jobId, job: svc.data.details.job }) };
                d.resolve(svc.data.details.job);
            }      
            return d.promise;
        }
    


        svc.getParentJob = function (jobId) {
            var d = $q.defer();
            var url = svc.jobUrl(jobId) + '?f=json';
            if (logSvc.debug) { console.log('GET Parent Job (request)', url) };
            $http.get(url).then(function (r) {
                if (logSvc.debug) { console.log('<<< Parent Job (response)', { jobId: jobId, job: r.data }) };
                if (r.data.id != undefined) {
                    d.resolve(r.data);
                } else {
                    if (logSvc.warn(null, false)) { console.warn('<<< Job (404 response)', { jobId: jobId }) };
                    svc.data.details.job = null;
                    d.reject(404);
                }
            }, function (r) {
                var ex = {
                    error: new Error('Unable to retrieve parent job data from the server'),
                    args: r
                };
                d.reject(ex);
            });
            return d.promise;
        };


        /**
        * Updates the details for a job. 
        * @param {number} jobId Job identifier
        * @param {number} priority Priority
        * @param {date} dueDate Due Date
        * @param {string} desc Description
        * @return {promise} Promise containing the server response
        */
        svc.updateJob = function (jobId, priority, dueDate, parentId, desc, jobName) {
            var d = $q.defer();
            var url = svc.jobUrl(jobId) + '/update?f=json&user=' + svc.data.userId +
                '&priority=' + priority +
                '&description=' + encodeURIComponent(desc) +
				'&name=' + encodeURIComponent(jobName);

            if (dueDate) {
                url += '&dueDate=' + dueDate.getTime();
            } else {
                url += '&dueDate=null';
            }

            if (parentId > 0) {
                url += '&parentJobId=' + parentId;
            } else {
                url += '&parentJobId=0';
            }
			


            if (logSvc.debug) { console.log('GET Update Job (request)', url) };
            $http.get(url).then(function (r) {
                if (logSvc.debug) { console.log('Update Job (response)', r) };
                if (r.data.success) {
                    // update job details in cache
                    var job = svc.data.details.job;
                    job.priority = priority;
                    job.priorityDV = wmConfig.enums.priority[priority];
                    job.description = desc;
                    job.dueDate = dueDate;
                    job.parentJobId = parentId;
					job.name = jobName;
                    d.resolve(job);					
                } else {
                    var ex = {
                        error: new Error('Unable to update job the server'),
                        args: r
                    };
                    if (logSvc.warn(ex)) { console.warn(ex.error.message, r) };
                    d.reject(ex);
                }
            }, function (r) {
                var ex = {
                    error: new Error('Unable to update job on the server'),
                    args: r
                };
                if (logSvc.warn(ex)) { console.warn(ex.error.message, r) };
                d.reject(ex);
            });
            return d.promise;
        };


        /**
        * Creates a new job. 
        * @param {Object} params New job parameters
        * @return {promise} Promise containing the server response
        */
        svc.createJob = function (params) {
            console.log('create new job: ', params);

            var d = $q.defer();
            // remap job owner to current user
            if (params.assignType == -99) {
                params.assignType = 1;
                params.assignTo = encodeUserName(svc.data.userId);
            };
            console.log('create new job 2: ', params);

            // build url
            var url = svc.baseUrl + '/jobs/create?f=json&user=' + svc.data.userId + '&jobTypeId=' + params.jobTypeId;
            url += '&ownedBy=' + encodeUserName(svc.data.userId);
            url += '&assignedType=' + params.assignType;
            url += '&assignedTo=' + encodeUserName(params.assignTo);
            url += '&priority=' + params.priority;
            url += '&name=' + encodeURIComponent(params.name);

            if (params.startDate) { url += '&startDate=' + params.startDate.getTime(); };
            if (params.dueDate) { url += '&dueDate=' + params.dueDate.getTime(); };
            if (params.description != '') { url += '&description=' + encodeURIComponent(params.description); };
            if (logSvc.debug) { console.log('GET Create Job (request)', url) };
            $http.get(url).then(function (r) {
                if (logSvc.debug) { console.log('<<< Create Job (response)', r) };
                if (r.data.error) {
                    var ex = {
                        error: new Error(r.data.error.details[0]),
                        args: r.data
                    };
                    if (logSvc.error(ex)) { console.error(ex.error, ex.args) };
                    d.reject(ex);
                } else {
                    console.log('created job:', r.data.jobIds[0]);
                    d.resolve(r.data.jobIds[0]);
                }
            }, function(ex) {
                var ex = {
                    error: new Error('Unable to create new job'),
                    args: r
                };
                if (logSvc.error(ex)) { console.error(ex.error, ex.args) };
                d.reject(ex);
            });
            return d.promise;
        };

    
        /**
        * Deletes the jobs. 
        * @param {Array} jobIds Job identifiers
        * @return {promise} Promise containing the server response
        */
        svc.deleteJobs = function (jobIds) {
            var d = $q.defer();
            // make sure there is a job to delete
            if(jobIds.length < 1) {
                var ex = {
                    error: new Error('Unable to delete jobs (no job identifiers provided).'),
                    args: null
                };
                if (logSvc.error(ex)) { console.error(ex.error, ex.args) };
                d.reject(ex);
            } else {
                //var username = 'cjones'; // test access denied
                var url = svc.baseUrl + '/jobs/delete?f=json&user=' + svc.data.userId + '&jobs=' + jobIds.join(',');
                if (logSvc.debug) { console.log('GET Delete Jobs (request)', url) };
                $http.get(url).then(function (r) {
                    if (logSvc.debug) { console.log('<<< Delete Jobs (response)', r) };
                    if (r.data.success) {
                        // remove jobs from cache data
                        for (var i = 0; i < jobIds.length; i++) {
                            removeJobFromCache(jobIds[i]);
                        }
                        d.resolve(jobIds);
                    } else {
                        var ex = {
                            error: new Error('Unable to delete jobs (' + r.data.error.message + ').'),
                            args: r
                        };
                        if (logSvc.warn(ex)) { console.warn(ex.error, ex.args) };
                        d.reject(ex);
                    }
                }, function (r) {
                    var ex = {
                        error: new Error('Unable to delete jobs (' + r.statusText + ').'),
                        args: r
                    };
                    if (logSvc.error(ex)) { console.error(ex.error, ex.args) };
                    d.reject(ex);
                });
                return d.promise;
            } 
        };
    

        /**
        *  Updates the notes for a job. 
        * @param {number} jobId Job identifier
        * @param {string} cmt Comment
        * @return {promise} Promise containing the server response
        */
        svc.assignJob = function (jobId, assignedType, assignedTo) {
            var d = $q.defer();
            var url;
            if (assignedType == 0) {
                url = svc.baseUrl + '/jobs/unassign?f=json&user=' + svc.data.userId + '&jobs=' + jobId;
            } else {
                url = svc.jobUrl(jobId) + '/assign?f=json&user=' + svc.data.userId + '&assignedType=' + assignedType +
                    '&assignedTo=' + encodeUserName(assignedTo);
            }
            if (logSvc.debug) { console.log('GET Assign Job (request)', url) };
            $http.get(url).then(function (r) {  
                if (logSvc.debug) { console.log('Assign Job (response)', r) };
                if (r.data.success) {                   
                    // update existing cached job
                    var job = svc.data.details.job;
                    job.assignedType = assignedType;
                    job.assignedTo = assignedTo;
                    job.assignedToDV = '';
                    if (job.assignedType == 1) {
                        job.assignedToDV = userDisplayNameById(job.assignedTo);
                    } else if (job.assignedType == 2) {
                        job.assignedToDV = wmConfig.groups[job.assignedTo] + ' (Group)';
                    }
                    d.resolve(job);
                } else {
                    var ex = {
                        error: new Error('Unable to assign job on the server'),
                        args: r
                    };
                    if (logSvc.warn(ex)) { console.warn(ex.error.message, r) };
                    d.reject(ex);
                }
            }, function (r) {
                var ex = {
                    error: new Error('Unable to assign job on the server'),
                    args: r
                };
                if (logSvc.warn(ex)) { console.warn(ex.error.message, r) };
                d.reject(ex);
            });
            return d.promise;
        };


        /* === Step Execution =====================*/


        /**
        * Gets a list of the current steps. 
        * @param {number} jobId Job identifier
        * @param {boolean} refresh Refresh from server
        * @return {promise} Promise containing the server response
        */
        svc.getCurrentSteps = function (jobId, refresh) {
            var d = $q.defer();
            if (refresh == undefined) { refresh = false };                
            var steps = svc.data.details.workflow.currentSteps;
            // return cached version (if required)
            if (!refresh && steps.loaded) {
                if (logSvc.debug) { console.log('<<< Current Steps (cache)', steps.rows) };
                return steps.rows;
            }
            var url = svc.jobUrl(jobId) + '/workflow/steps/current?f=json';
            if (logSvc.debug) { console.log('GET Current Steps (request)', url) };
            $http.get(url).then(function (r) {
                if (logSvc.debug) { console.log('<<< Current Steps (response)', r) };
                if (r.data.error) {
                    var ex = {
                        error: new Error('Unable to get current workflow steps on the server'),
                        args: r
                    };
                    if (logSvc.warn(ex)) { console.warn(ex.error.message, r) };
                    d.reject(ex);
                } else {
                    steps.rows = r.data.steps;
                    applyStepHelp(steps);
                    // set the first step as selected
                    svc.data.details.workflow.currentStep = (steps.rows.length > 0) ? steps.rows[0] : null;
                    steps.loaded = true;
                    $rootScope.$broadcast('current-steps-loaded', { steps: steps.rows });
                    d.resolve(steps.rows);
                }
            }, function (ex) {
                var ex = {
                    error: new Error('Unable to get current workflow steps on the server'),
                    args: r
                };
                if (logSvc.warn(ex)) { console.warn(ex.error.message, r) };
                d.reject(ex);
            });
            return d.promise;
        };


        /**
        * Executes a step on the server. 
        * @param {number} jobId Job identifier
        * @param {number} stepId Step identifier
        * @return {promise} Promise containing the server response
        */
        svc.executeStep = function (jobId, stepId) {
            var d = $q.defer();
            var url = svc.jobUrl(jobId) + '/workflow/steps/' + stepId + '/execute?auto=true&f=json&user=' + svc.data.userId;
            if (logSvc.debug) { console.log('GET Execute Step (request)', url) };
            $http.get(url).then(function (r) {
                if (logSvc.debug) { console.log('<<< Execute Step (response)', r) };
                if (r.data.error) {
                    var detail = (r.data.error.details[0]) ? r.data.error.details[0] : '';
                    var ex = {
                        error: new Error('Unable to execute step on the server. ' + detail),
                        args: r
                    };
                    if (logSvc.warn(ex)) { console.warn(ex.error.message, r) };
                    d.reject(ex);
                } else {
                    var infos = r.data.executeInfo;
                    for (var i = 0; i < infos.length; i++) {
                        infos[i].resultDescription = stepExecutionResult(infos[i].executionResult);
                    }
                    d.resolve(infos);
                }
            }, function (ex) {
                var ex = {
                    error: new Error('Unable to execute step on the server'),
                    args: r
                };
                if (logSvc.warn(ex)) { console.warn(ex.error.message, r) };
                d.reject(ex);
            });
            return d.promise;
        };
    

        /**
        * Tests if a step can be executed on the server. 
        * @param {number} jobId Job identifier
        * @param {number} stepId Step identifier
        * @return {promise} Promise containing the server response
        */
        svc.canExecuteStep = function (jobId, stepId) {
            var d = $q.defer();
            var url = svc.jobUrl(jobId) + '/workflow/steps/' + stepId + '/canRun?f=json&user=' + svc.data.userId;
            if (logSvc.debug) { console.log('GET Can Run Step (request)', url) };
            $http.get(url).then(function (r) {
                if (logSvc.debug) { console.log('<<< Can Run Step (response)', r) };
                var result = {
                    canRun: r.data.canRun,
                    description: stepExecutionResult(r.data.canRun)
                };
                d.resolve(result);
            }, function (ex) {
                var ex = {
                    error: new Error('Unable to assign job on the server'),
                    args: r
                };
                if (logSvc.warn(ex)) { console.warn(ex.error.message, r) };
                d.reject(ex);
            });
            return d.promise;
        };


        /**
        * Marks a step as done. 
        * @param {number} jobId Job identifier
        * @param {number} stepId Step identifier
        * @return {promise} Promise containing the server response
        */
        svc.markStepDone = function (jobId, stepId) {
            var d = $q.defer();
            var url = svc.jobUrl(jobId) + '/workflow/steps/' + stepId + '/markAsDone?f=json&user=' + svc.data.userId;
            if (logSvc.debug) { console.log('GET Mark Step Done (request)', url) };
            $http.get(url).then(function (r) {
                if (logSvc.debug) { console.log('<<< Mark Step Done (response)', r) };
                if (r.data.error) {
                    d.reject(r.data.error);
                } else {
                    var infos = r.data.executeInfo;
                    for (var i = 0; i < infos.length; i++) {
                        infos[i].resultDescription = stepExecutionResult(infos[i].executionResult);
                    }
                    d.resolve(infos);
                }
            }, function (ex) {
                var ex = {
                    error: new Error('Unable to assign job on the server'),
                    args: r
                };
                if (logSvc.warn(ex)) { console.warn(ex.error.message, r) };
                d.reject(ex);
            });
            return d.promise;
        };



        svc.moveNextStep = function (jobId, stepId, returnCode) {
            var d = $q.defer();
            var url = svc.jobUrl(jobId) + '/workflow/steps/' + stepId + '/moveNext?returnCode=' + returnCode +
                qsUser() + qsFormat() + qsTimestamp();
                //+ 'f=json&user=' + svc.data.userId +
                //'&returnCode=' + returnCode + qsTimestamp();
            if (logSvc.debug) { console.log('GET Mark Step Done (request)', url) };
            $http.get(url).then(function (r) {
                if (logSvc.debug) { console.log('<<< Mark Step Done (response)', r) };
                if (r.data.success) {
                    d.resolve(true);
                } else {
                    var ex = {
                        error: new Error('Unable to move to next step on the server'),
                        args: r
                    };
                    if (logSvc.warn(ex)) { console.warn(ex.error.message, r) };
                    d.reject(ex);
                }
            }, function (ex) {
                var ex = {
                    error: new Error('Unable to move to next step on the server'),
                    args: r
                };
                if (logSvc.warn(ex)) { console.warn(ex.error.message, r) };
                d.reject(ex);
            });
            return d.promise;
        };



        svc.parseToken = function (jobId, token) {
            var d = $q.defer();
            var url = svc.baseUrl + '/tokens/parseTokens?job=' + jobId + '&stringtoparse=' + token + qsUser() + qsFormat() + qsTimestamp();
            if (logSvc.debug) { console.log('GET Parse Token (request)', url) };
            $http.get(url).then(function (r) {
                if (logSvc.debug) { console.log('<<< Parse Token Done (response)', r) };            
                d.resolve(r.data.output);
            }, function (ex) {
                var ex = {
                    error: new Error('Unable to parse a token on the server'),
                    args: r
                };
                if (logSvc.warn(ex)) { console.warn(ex.error.message, r) };
                d.reject(ex);
            });
            return d.promise;

        }



        function stepExecutionResult(i) {
            if (i == 1) { return 'The step executed successfully'; }
            if (i == 2) { return 'Dependent on a step in another job'; }
            if (i == 3) { return 'Dependent on a stage in another job'; }
            if (i == 4) { return 'Dependent on a status in another job'; }
            if (i == 5) { return 'Blocked by an active job hold'; }
            if (i == 6) { return 'Dependent on a previous step in this job\'s workflow'; }
            if (i == 7) { return 'The step was marked as complete'; }
            if (i == 8) { return 'The step is assigned to another user'; }
            if (i == 9) { return 'The step is assigned to another group'; }
            if (i == 10) { return 'The job is assigned to another user/group'; }
            if (i == 11) { return 'The job is closed'; }
            if (i == 12) { return 'The step is configured for a different platform (desktop vs. server)'; }
            if (i == 13) { return 'Invalid step'; }
            if (i == 14) { return 'Dependent on another job'; }
            if (i == 15) { return 'The step is not the current workflow step'; }
            return 'Unknown return code: ' + i;
        }

    
        /* === Job Activity Log ===================*/


        /**
        * Queries the WM service for activity log records. 
        * @param {number} jobId Job identifier
        * @param {boolean} refresh Refresh data from the server
        * @return {promise} Promise containing the job activity log data
        */
        svc.getJobActivity = function (jobId, refresh) {
            var d = $q.defer();
            if (refresh == undefined) { refresh = false };
            var activity = svc.data.details.activity;
            if (!svc.data.details.activity.loaded || refresh) {
                var url = svc.jobUrl(jobId) +  '/activity?f=json';
                if (logSvc.debug) { console.log('GET Job Activity (request)', url) };
                $http.get(url).then(function (r) {
                    activity.rows = r.data.activity;
                    // additional data properties (for searching)
                    for (var i = 0; i < activity.rows.length; i++) {
                        activity.rows[i].typeName = activityDescriptionById(activity.rows[i].type);
                        activity.rows[i].userDN = userDisplayNameById(activity.rows[i].user);
                    }
                    activity.loaded = true;
                    if (logSvc.debug) {
                        console.log('Job Activity (response)',
                            { jobId: jobId, rows: r.data })
                    };
                    d.resolve(activity.rows);
                }, function (r) {
                    var ex = {
                        error: new Error('Unable to retrieve job activity data from the server'),
                        args: r
                    };
                    if (logSvc.warn(ex)) { console.warn(ex.error.message, r) };
                    d.reject(ex);
                });
            } else {
                // return cached version
                if (logSvc.debug) {
                    console.log('Job Activity (cache)',
                        { jobId: jobId, rows: activity.rows })
                };
                d.resolve(activity.rows);
            }
            return d.promise;
        };

    
        /**
        * Adds a new comment to the job activity log. 
        * @param {number} jobId Job identifier
        * @param {string} cmt Comment
        * @return {promise} Promise containing the server response
        */
        svc.addActivityLogComment = function (jobId, cmt) {
            var d = $q.defer();
            var cmtTypeId = 15;
            var url = svc.jobUrl(jobId) +  '/activity/logAction?type=' + cmtTypeId +
                '&user=' + svc.data.userId + '&comments=' + encodeURIComponent(cmt);
            if (logSvc.debug) { console.log('GET Add Job Activity Comment (request)', url) };
            $http.get(url).then(function (r) {
                // append new comment to activity rows
                var a = {
                    date: Date.now(),
                    type: cmtTypeId,
                    typeName: activityDescriptionById(cmtTypeId),
                    message: cmt,
                    user: svc.data.currentUser.userName,
                    userDN:  userDisplayName(svc.data.currentUser) 
                };
                svc.data.details.activity.rows.push(a);
                if (logSvc.debug) { console.log('Job Activity (response)', r) };
                d.resolve(a);
            }, function (r) {
                var ex = {
                    error: new Error('Unable to add comment to job activity on the server'),
                    args: r
                };
                if (logSvc.warn(ex)) { console.warn(ex.error.message, r) };
                d.reject(ex);
            });        
            return d.promise;
        };



        /* === Job Notes ==========================*/


        /**
        * Queries the WM service for job notes. 
        * @param {number} jobId Job identifier
        * @param {boolean} refresh Refresh data from the server
        * @return {promise} Promise containing the job notes
        */
        svc.getNotes = function (jobId, refresh) {
            var d = $q.defer();
            if (refresh == undefined) { refresh = false };
            if (svc.data.details.notes.text == null || svc.data.details.job.id != jobId || refresh) {
                // request from server
                var url = svc.jobUrl(jobId) + '/notes?f=json';
                if (logSvc.debug) { console.log('GET Notes (request)', url) };
                $http.get(url).then(function (r) {
                    if (logSvc.debug) {
                        console.log('Notes (response)',
                            { jobId: jobId, notes: r.data })
                    };
                    svc.data.details.notes.text = r.data.notes;
                    $rootScope.$broadcast('job-loaded', { notes: r.data.notes });
                    d.resolve(r.data.notes);
                }, function (r) {
                    var ex = {
                        error: new Error('Unable to retrieve job notes from the server'),
                        args: r
                    };
                    if (logSvc.warn(ex)) { console.warn(ex.error.message, ex.args) };
                    d.reject(ex);
                });
            } else {
                // return cached version
                if (logSvc.debug) {
                    console.log('Job Notes (cache)',
                        { jobId: jobId, notes: svc.data.details.notes.text })
                };
                d.resolve(svc.data.details.notes.text);
            }
            return d.promise;
        };


        /**
        * Updates the notes for a job. 
        * @param {number} jobId Job identifier
        * @param {string} cmt Comment
        * @return {promise} Promise containing the server response
        */
        svc.saveNotes = function (jobId, cmt) {
            var d = $q.defer();
            var url = svc.jobUrl(jobId) + '/notes/update?f=json&user=' + svc.data.userId + '&notes=' + encodeURIComponent(cmt);
            if (logSvc.debug) { console.log('GET Update Notes (request)', url) };
            $http.get(url).then(function (r) {
                if (logSvc.debug) { console.log('Update Notes (response)', r) };
                if (r.data.success) {
                    svc.data.details.notes.text = cmt;
                    d.resolve(cmt);
                } else {
                    var ex = {
                        error: new Error('Unable to update notes on the server'),
                        args: r
                    };
                    if (logSvc.warn(ex)) { console.warn(ex.error.message, r) };
                    d.reject(ex);
                }
            }, function (r) {
                var ex = {
                    error: new Error('Unable to update notes on the server'),
                    args: r
                };
                if (logSvc.warn(ex)) { console.warn(ex.error.message, r) };
                d.reject(ex);
            });        
            return d.promise;
        };
    


        /* === Job Holds ==========================*/


        /**
        * Queries the WM service for job hold records. 
        * @param {number} jobId Job identifier
        * @param {boolean} refresh Refresh data from the server
        * @return {promise} Promise containing the job holds data
        */
        svc.getJobHolds = function (jobId, refresh) {
            var d = $q.defer();
            if (refresh == undefined) { refresh = false };
            var holds = svc.data.details.holds;
            if (!svc.data.details.holds.loaded || refresh) {
                var url = svc.jobUrl(jobId) +  '/holds?f=json';
                if (logSvc.debug) { console.log('GET Job Holds (request)', url) };
                $http.get(url).then(function (r) {
                    holds.rows = r.data.holds;
                    // additional data properties (display values for filtering)
                    for (var i = 0; i < holds.rows.length; i++) {
                        holds.rows[i].typeDV = holdNameByType(holds.rows[i].type);
                        holds.rows[i].heldByDV = userDisplayNameById(holds.rows[i].heldBy);
                        holds.rows[i].releasedByDV = userDisplayNameById(holds.rows[i].releasedBy);
                    }
                    holds.loaded = true;
                    if (logSvc.debug) {
                        console.log('<<< Job Holds (response)',
                            { jobId: jobId, rows: r.data })
                    };
                    d.resolve(holds.rows);
                }, function (r) {
                    var ex = {
                        error: new Error('Unable to retrieve job holds from the server'),
                        args: r
                    };
                    if (logSvc.warn(ex)) { console.warn(ex.error.message, r) };
                    d.reject(ex);
                });
            } else {
                // return cached version
                if (logSvc.debug) {
                    console.log('<<< Job Holds (cache)',
                        { jobId: jobId, rows: holds.rows })
                };
                d.resolve(holds.rows);
            }
            return d.promise;
        };
    

        /**
        * Releases a hold that was placed on the job.
        * @param {number} jobId Job identifier
        * @param {Object} hold Hold object
        * @param {string} cmt Comment
        * @return {promise} Promise containing the server response
        */
        svc.addHold = function (jobId, holdType, cmt) {
            var d = $q.defer(); 
            var url = svc.jobUrl(jobId) +  '/holds/create?f=json&user=' + svc.data.userId + '&type=' + holdType;
            if (cmt != '') { url += '&comments=' + encodeURIComponent(cmt) };
            if (logSvc.debug) { console.log('GET Create Hold (request)', url) };
            $http.get(url).then(function (r) {
                console.log("<<< Create Hold (response)", r);
                if (r.data.holdId) {
                    // append new hold
                    var a = {
                        id: r.data.holdId,
                        heldBy: svc.data.currentUser.userName,            
                        heldByDV: userDisplayName(svc.data.currentUser),
                        holdComments: cmt,
                        holdDate: Date.now(),
                        releaseComments:'',
                        releaseDate: null,
                        releasedBy:'',
                        releasedByDV: '',
                        type: holdType,
                        typeDV: holdNameByType(holdType)
                    };
                    svc.data.details.holds.rows.push(a);
                    d.resolve(a);
                } else {
                    var ex = {
                        error: new Error('Unable to create hold on the server'),
                        args: r
                    };
                    if (logSvc.warn(ex)) { console.warn(ex.error.message, r) };
                    d.reject(ex);
                }
            }, function (r) {
                var ex = {
                    error: new Error('Unable to release hold #' + hold.id + ' on the server'),
                    args: r
                };
                if (logSvc.warn(ex)) { console.warn(ex.error.message, r) };
                d.reject(ex);
            });        
            return d.promise;
        };
    

        /**
        * Releases a hold that was placed on the job.
        * @param {number} jobId Job identifier
        * @param {Object} hold Hold object
        * @param {string} cmt Comment
        * @return {promise} Promise containing the server response
        */
        svc.releaseHold = function (jobId, hold, cmt) {
            var d = $q.defer();
            var url = svc.jobUrl(jobId) +  '/holds/' + hold.id + '/release?f=json&user=' + svc.data.userId;
            if (cmt != '') { url += '&comments=' + encodeURIComponent(cmt) };
            if (logSvc.debug) { console.log('GET Release Job (request)', url) };
            $http.get(url).then(function (r) {
                if (r.data.success) {
                    // update hold                
                    hold.releaseDate = Date.now();
                    hold.releaseComments = cmt;
                    hold.releasedBy = svc.data.currentUser.userName;
                    hold.releasedByDV = userDisplayName(svc.data.currentUser);
                    d.resolve(hold);
                } else {
                    var ex = {
                        error: new Error('Unable to release hold #' + hold.id + ' on the server'),
                        args: r
                    };
                    if (logSvc.warn(ex)) { console.warn(ex.error.message, r) };
                    d.reject(ex);
                }
            }, function (r) {
                var ex = {
                    error: new Error('Unable to release hold #' + hold.id + ' on the server'),
                    args: r
                };
                if (logSvc.warn(ex)) { console.warn(ex.error.message, r) };
                d.reject(ex);
            });
            return d.promise;
        };



        /* === Job Attachments ====================*/


        /**
        * Queries the WM service for job attachments. 
        * @param {number} jobId Job identifier
        * @param {boolean} refresh Refresh data from the server
        * @return {promise} Promise containing the job attachments
        */
        svc.getJobAttachments = function (jobId, refresh) {
            var d = $q.defer();
            if (refresh == undefined) { refresh = false };
            var attachments = svc.data.details.attachments;
            if (!svc.data.details.attachments.loaded || refresh) {
                var url = svc.jobUrl(jobId) + '/attachments?f=json';
                if (logSvc.debug) { console.log('GET Job Attachments (request)', url) };
                $http.get(url).then(function (r) {
                    attachments.rows = r.data.attachments;
                    // additional data properties (display values for filtering)
                    for (var i = 0; i < attachments.rows.length; i++) {
                        attachments.rows[i].typeDV = wmConfig.enums.storageType[attachments.rows[i].storageType];
                        attachments.rows[i].link = attachmentLink(jobId, attachments.rows[i]);
                        attachments.rows[i].linkDV = attachmentLinkDV(attachments.rows[i]);
                    }
                    attachments.loaded = true;
                    if (logSvc.debug) {
                        console.log('<<< Job Attachments (response)',
                            { jobId: jobId, rows: r.data })
                    };
                    d.resolve(attachments.rows);
                }, function (r) {
                    var ex = {
                        error: new Error('Unable to retrieve job attachments from the server'),
                        args: r
                    };
                    if (logSvc.warn(ex)) { console.warn(ex.error.message, r) };
                    d.reject(ex);
                });
            } else {
                // return cached version
                if (logSvc.debug) {
                    console.log('<<< Job Attachments (cache)',
                        { jobId: jobId, rows: attachments.rows })
                };
                d.resolve(attachments.rows);
            }
            return d.promise;
        };



        /**
        * Adds a linked file or URL attachment to a job.
        * @param {number} jobId Job identifier
        * @param {Object} a Attachment object
        * @return {promise} Promise containing the new attachment
        */
        svc.addAttachment = function (jobId, a) {
            var d = $q.defer();
            var url = svc.jobUrl(jobId) + '/attachments/add?f=json&user=' + svc.data.userId + '&storageType=' + a.storageType;
            if (a.storageType == 1) {
                url += '&filePath=' + encodeURIComponent(a.folder + a.filename);
            }
            if (a.storageType == 3) {
                url += '&filePath=' + encodeURIComponent(a.folder);
            }
            if (logSvc.debug) { console.log('GET Add Attachment (request)', url) };
            $http.get(url).then(function (r) {
                console.log("Add Attachment (response)", r);
                if (r.data.attachmentId) {
                    // additional data properties    
                    a.id = r.data.attachmentId;
                    a.link = attachmentLink(jobId, a);
                    a.linkDV = attachmentLinkDV(a);
                    a.typeDV = wmConfig.enums.storageType[a.storageType];
                    console.log("Attachment Created", a);
                    svc.data.details.attachments.rows.push(a);
                    d.resolve(a);
                } else {
                    var ex = {
                        error: new Error('Unable to create attachment on the server'),
                        args: r
                    };
                    if (logSvc.warn(ex)) { console.warn(ex.error.message, r) };
                    d.reject(ex);
                }
            }, function (r) {
                var ex = {
                    error: new Error('Unable to create attachment on the server'),
                    args: r
                };
                if (logSvc.warn(ex)) { console.warn(ex.error.message, r) };
                d.reject(ex);
            });        
            return d.promise;
        };

    
        /* === Workflow Steps =====================*/
    

        /**
        * Queries the WM service for job workflow steps. 
        * @param {number} jobId Job identifier
        * @param {boolean} refresh Refresh data from the server
        * @return {promise} Promise containing the job attachments
        */
        svc.getWorkflowSteps = function (jobId, refresh) {
            var d = $q.defer();
            if (refresh == undefined) { refresh = false };
            var steps = svc.data.details.workflow.steps;
            if (!steps.loaded || refresh) {
                var url = svc.jobUrl(jobId) + '/workflow/steps?f=json';
                if (logSvc.debug) { console.log('GET Workflow Steps (request)', url) };
                $http.get(url).then(function (r) {
                    steps.rows = r.data.steps;                
                    applyStepHelp(steps);
                    // apply additional data properties
                    //for (var i = 0; i < steps.rows.length; i++) {
                    //    steps.rows[i].help = {};                    
                    //    steps.rows[i].help.show = false;
                    //    steps.rows[i].help.type = steps.rows[i].stepType.stepDescriptionType,
                    //    steps.rows[i].help.loaded = (steps.rows[i].help.type == 3);
                    //    steps.rows[i].help.link = (steps.rows[i].help.type == 3) ?
                    //        steps.rows[i].stepType.stepDescriptionLink : '';
                    //    steps.rows[i].help.html = '';
                    //}
                    steps.loaded = true;
                    if (logSvc.debug) {
                        console.log('<<< Workflow Steps (response)',
                            { jobId: jobId, rows: steps.rows })
                    };
                    d.resolve(steps.rows);
                }, function (r) {
                    var ex = {
                        error: new Error('Unable to retrieve workflow steps from the server'),
                        args: r
                    };
                    if (logSvc.warn(ex)) { console.warn(ex.error.message, r) };
                    d.reject(ex);
                });
            } else {
                // return cached version
                if (logSvc.debug) { console.log('<<< Workflow Steps (cache)', { jobId: jobId, rows: steps.rows }) };
                d.resolve(steps.rows);
            }
            return d.promise;
        };


        /**
        * Applies an additional help object property to each workflow step. 
        * @param {Array} steps Array of workflow steps
        */
        function applyStepHelp(steps) {
            //console.log('applyStepHelp', steps);
            for (var i = 0; i < steps.rows.length; i++) {
                steps.rows[i].help = {};                    
                steps.rows[i].help.show = false;
                steps.rows[i].help.loadError = false;
                steps.rows[i].help.type = steps.rows[i].stepType.stepDescriptionType,
                steps.rows[i].help.loaded = (steps.rows[i].help.type == 3);
                steps.rows[i].help.link = (steps.rows[i].help.type == 3) ?
                    steps.rows[i].stepType.stepDescriptionLink : '';
                steps.rows[i].help.html = '';
            }
        }


        /**
        * Queries the WM service for job workflow steps. 
        * @param {number} jobId Job identifier
        * @param {number} stepId Step identifier
        * @return {promise} Promise containing the step description
        */
        svc.getStepHelp = function (jobId, stepId) {
            var d = $q.defer();
            var url = svc.jobUrl(jobId) + '/workflow/steps/step/' + stepId + '/description?f=json';
            if (logSvc.debug) { console.log('GET Step Description (request)', url) };
            $http.get(url).then(function (r) {
                if (logSvc.debug) {
                    console.log('Step Description (response)',
                        { jobId: jobId, stepId: stepId, description: r.data.stepDescription })
                };
                d.resolve(r.data.stepDescription);
            }, function (r) {
                var ex = {
                    error: new Error('Unable to retrieve step help from the server'),
                    args: r
                };
                if (logSvc.warn(ex)) { console.warn(ex.error.message, r) };
                d.reject(ex);
            });   
            return d.promise;
        };


        /* === Extended Properties ================*/


        /**
        * Queries the WM service for extended properties. 
        * @param {number} jobId Job identifier
        * @param {boolean} refresh Refresh data from the server
        * @return {promise} Promise containing the extended properties
        */
        svc.getExtendedProperties = function (jobId, refresh) {
            var d = $q.defer();
            if (refresh == undefined) { refresh = false };
            var props = svc.data.details.extProps;
            if (!props.loaded || refresh) {
                var url = svc.jobUrl(jobId) + '/extendedProperties?f=json';
                if (logSvc.debug) { console.log('GET Extended Properties (request)', url) };
                $http.get(url).then(function (r) {
                    console.log('extended properties', r);

                    // additional data properties
                    applyFormProperties(r.data.containers);
                    props.tables11 = filterContainers(r.data.containers, 1);
                    props.tables1N = filterContainers(r.data.containers, 2);
                
                    // get all domains values
                    if (!svc.data.domains.loaded) {
                        var promises = [];
                        var domains = getUniqueDomains(r.data.containers);                   
                        for (var i = 0; i < domains.length; i++) {  
                            promises.push(svc.getListValues(jobId, domains[i]));
                        }
                        // request all domain list values from server
                        $q.all(promises).then(function (value) {
                            // Success callback where value is an array containing the success values
                            console.log('Domains returned:', value);

                            // apply domains to extended properties
                            props.domains = value;
                            props.domainsLoaded = true;

                            // apply lists to all domain fields
                            applyDomainsToFields(props.tables11, props.domains);
                            applyDomainsToFields(props.tables1N, props.domains);
                            props.loaded = true;

                            if (logSvc.debug) {
                                console.log('<<< Extended Properties (response)',
                                    { jobId: jobId, extProps: props })
                            };

                            d.resolve(props);
                        }, function (r) {
                            var ex = {
                                error: new Error('Unable to retrieve all domain lists from the server'),
                                args: r
                            };
                            if (logSvc.warn(ex)) { console.warn(ex.error.message, r) };
                            svc.data.domains.loaded = false;
                            d.resolve(props);
                        });     
                    } else {
                        d.resolve(props);
                    }
                }, function (r) {
                    var ex = {
                        error: new Error('Unable to retrieve workflow steps from the server'),
                        args: r
                    };
                    if (logSvc.warn(ex)) { console.warn(ex.error.message, r) };
                    d.reject(ex);
                });
            } else {
                // return cached version
                if (logSvc.debug) { console.log('<<< Extended Properties (cache)', { jobId: jobId, extProps: props }) };
                d.resolve(props);
            }
            return d.promise;
        };


        /**
        * Applies domain lists to extended property items. 
        * @param {Array} tables Array of extended property containers
        * @param {Array} domains Array of domains
        */
        function applyDomainsToFields(tables, domains) {
            var rec, rv, domain;
            for (var i = 0; i < tables.length; i++) {
                tables[i].formName = 'form_' + tables[i].tableName;
                for (var j = 0; j < tables[i].records.length; j++) {
                    rec = tables[i].records[j];
                    for (var k = 0; k < rec.recordValues.length; k++) {
                        rv = rec.recordValues[k];
                        if (rv.domain != '') {       
                            domain = getDomainFromList(domains, rv.domain)
                            if (domain) {
                                rv.domainValues = domain.values;
                            } else {
                                console.warn('Domain not found', rv.domain);
                            }                        
                        }
                        // check for null date
                        //if (rv.dataType == 5) {
                        //    if (rv.data != null && rv.data.getTime() == -2209161600000) {
                        //        console.log(rv.data.getTime());
                        //        rv.data = null;
                        //    }   
                        //}
                    }
                }
            }
        }

        /**
        * Gets a domain by name. 
        * @param {Array} domains Array of domains
        * @param {string} name Name of the domain to return
        * @return {Object} Domain
        */
        function getDomainFromList(domains, name) {
            for (var i = 0; i < domains.length; i++) {
                if (domains[i].domain == name){
                    return domains[i];
                }
            }
            return null;
        }


        /**
        * Loops through all of the extended properties and gets a unique list of domain names. 
        * @param {Array} tables Array of extended property containers
        */
        function getUniqueDomains(tables) {
            var domains = [];
            var rec, rv, domain, found;
            for (var i = 0; i < tables.length; i++) {
                for (var j = 0; j < tables[i].records.length; j++) {
                    rec = tables[i].records[j];
                    for (var k = 0; k < rec.recordValues.length; k++) {
                        rv = rec.recordValues[k];
                        if (rv.domain != '') {
                            domain = { table: tables[i].tableName, domain: rv.domain, field: rv.name};
                            // check if record exists
                            found = false;
                            for (var d = 0; d < domains.length; d++) {                           
                                if (domains[d].tableName == domain.tableName
                                    && domains[d].domain == domain.domain) {
                                    found = true;
                                }
                            }
                            if (!found) {
                                domains.push(domain);
                            }                    
                        }
                    }
                }
            }
            return domains;
        };


        /**
        * Saves the extended properties. 
        * @param {number} jobId Job identifier
        * @param {string} tableName Table name
        * @param {number} recordId Table record identifier
        * @param {Object} recordId Table record identifier
        * @return {promise} Promise containing the result
        */
        svc.saveExtededProperties = function (jobId, tableName, recordId, props) {
            var d = $q.defer();
            // encode text (if required)
            for (var property in props) {
                if (props.hasOwnProperty(property)) {
                    console.log('encode', property, props[property], encodeURIComponent(props[property]));
                    props[property] = encodeURIComponent(props[property]);
                }
            }        
            console.log('save props', props);
			var strProps = JSON.stringify(props);
			strProps = strProps.split("%5C").join("\\\\");
            var url = svc.jobUrl(jobId) + '/extendedProperties/' + tableName + '/' + recordId + '/update?f=json&user=' + svc.data.userId + '&properties=' + strProps;
            if (logSvc.debug) { console.log('GET Update Extended Properties (request)', url) };
            $http.get(url).then(function (r) {
                if (logSvc.debug) { console.log('<<< Update Extended Properties (response)', r) };
                if (r.data.success) {
                    d.resolve(true);
                } else {
                    var ex = {
                        error: new Error('Unable to update job the server'),
                        args: r
                    };
                    if (logSvc.warn(ex)) { console.warn(ex.error.message, r) };
                    d.reject(ex);
                }
            }, function (r) {
                var ex = {
                    error: new Error('Unable to create attachment on the server'),
                    args: r
                };
                if (logSvc.warn(ex)) { console.warn(ex.error.message, r) };
                d.reject(ex);
            });        
            return d.promise;
        };


        /**
        * Adds a new extended properties record. 
        * @param {number} jobId Job identifier
        * @param {string} tableName Table name
        * @return {promise} Promise containing the new extended properties record id.
        */
        svc.addExtPropRecord = function (jobId, tableName) {
            var d = $q.defer();
            var url = svc.jobUrl(jobId) + '/extendedProperties/' + tableName + '/add?f=json&user=' + svc.data.userId;        
            if (logSvc.debug) { console.log('GET Add Extended Properties Record (request)', url) };
            $http.get(url).then(function (r) {
                if (logSvc.debug) { console.log('<<< Add Extended Properties Record  (response)', r) };  
                if (r.data.recordId) {
                    // this adds a record on the server - the only way to get at the record is to 
                    // reload the entire extended properties again
                    svc.getExtendedProperties(jobId, true).then(function (r2) {
                        console.log('addExtPropRecord getExtendedProperties:', r2);

                        // return the new extended property record
                        var table = getTable(tableName, r2.tables11, r2.tables1N);
                        var rec = null;
                        console.log('table found', table);
                        if (table) {
                            for (var j = 0; j < table.records.length; j++) {
                                if (table.records[j].id == r.data.recordId) {
                                    console.log('row found', table.records[j]);
                                    d.resolve(table.records[j]);
                                }
                            }
                        }          
                        d.resolve(null);
                    }, function (r2) {
                        var ex = {
                            error: new Error('Unable to reload extended properties'),
                            args: r2
                        };
                        if (logSvc.warn(ex)) { console.warn(ex.error.message, r2) };
                        d.reject(ex);
                    });                
                } else {
                    var ex = {
                        error: new Error('Unable to update job the server'),
                        args: r
                    };
                    if (logSvc.warn(ex)) { console.warn(ex.error.message, r) };
                    d.reject(ex);
                }
            }, function (r) {
                var ex = {
                    error: new Error('Unable to create extended properties record on the server'),
                    args: r
                };
                if (logSvc.warn(ex)) { console.warn(ex.error.message, r) };
                d.reject(ex);
            });        
            return d.promise;
        };


        /**
        * Gets a single table from the extended properties containers. 
        * @param {string} name Table name
        * @param {Array} tables11 One-to-one table containers
        * @param {Array} tables1N One-to-many table containers
        * @return {promise} Promise containing the deleted extended properties record id.
        */
        function getTable(name, tables11, tables1N) {
            for (var i = 0; i < tables11.length; i++) {
                if (tables11[i].tableName == name) {
                    return tables11[i];
                }
            }
            for (var i = 0; i < tables1N.length; i++) {
                if (tables1N[i].tableName == name) {
                    return tables1N[i];
                }
            }
            return null;
        };



        /**
        * Deletes an extended properties record. 
        * @param {number} jobId Job identifier
        * @param {string} tableName Table name
        * @param {number} recId Record identifier
        * @return {promise} Promise containing the deleted extended properties record id.
        */
        svc.deleteExtPropRecord = function (jobId, tableName, recId) {
            var d = $q.defer();
            var url = svc.jobUrl(jobId) + '/extendedProperties/' + tableName + '/' + recId + '/delete?f=json&user=' + svc.data.userId;        
            if (logSvc.debug) { console.log('GET Delete Extended Properties Record (request)', url) };
            $http.get(url).then(function (r) {
                if (logSvc.debug) { console.log('<<< Delete Extended Properties Record  (response)', r) };
                if (r.data.success) {
                    d.resolve(recId);
                } else {
                    var ex = {
                        error: new Error('Unable to delete extended properties record on the server'),
                        args: r
                    };
                    if (logSvc.warn(ex)) { console.warn(ex.error.message, r) };
                    d.reject(ex);
                }
            }, function (r) {
                var ex = {
                    error: new Error('Unable to delete extended properties record on the server'),
                    args: r
                };
                if (logSvc.warn(ex)) { console.warn(ex.error.message, r) };
                d.reject(ex);
            });
            return d.promise;
        };


        /**
        * Queries the WM service for list (domain) values. 
        * @param {number} jobId Job identifier
        * @param {Object} domain Domain object (table, domain & field name)
        * @return {promise} Promise containing the domain name and list values
        */
        svc.getListValues = function (jobId, domain) {
            //console.log('getListValues: ', jobId, domain);
            var d = $q.defer();
            // TODO: check cache first
            var url = svc.jobUrl(jobId) + '/extendedProperties/' + domain.table + '/listValues?f=json&user=' +
                        svc.data.userId + '&field=' + domain.field;
            if (logSvc.debug) { console.log('GET List Values (request)', url) };
            $http.get(url).then(function (r) {
                if (logSvc.debug) { console.log('<<< List Values (response)', r) };
                var list = { domain: domain.domain, values: r.data.values }              
                d.resolve(list);
            }, function (r) {
                var ex = {
                    error: new Error('Unable to create attachment on the server'),
                    args: r
                };
                if (logSvc.warn(ex)) { console.warn(ex.error.message, r) };
                d.reject(ex);
            });        
            return d.promise;
        };





        /**
        * Gets all required startup data from the WM service. 
        * @return {promise} Promise object
        */
        svc.startup = function (username) {
            if (logSvc.debug) { console.log('Startup Parameters', username, wmConfig) };
            var d = $q.defer();

            // TODO - change to $q.all()

            // 1. Load service info
            svc.getServiceInfo()
                // 2. Load users
                .then(svc.getUsers)
                // 3. Load groups
                .then(svc.getGroups)
                // 4. Load job types detail
                .then(svc.getJobTypes)
                // 5. Set current user and resolve
                .then(function () {
                    svc.setCurrentUser(svc.getUser(username));
                    d.resolve();
                }, function (ex) {
                    d.reject(ex);
                });
            return d.promise;
        };


        /**
        * Returns the username after replacing all occurences of backslash with '*'
        * @param {Object} user User object
        * @return {string} Escaped username
        */
        svc.safeUserName = function (user) {
            return user.userName.replace('\\', '*');
        };
    

        /**
        * Returns the base URL for a job. 
        * @return {number} jobId Job identifier
        */
        svc.jobUrl = function (jobId) {
            return svc.baseUrl + '/jobs/' + jobId;
        }


        /* === Private Functions ==================*/
    
    
        /**
        * Adds custom properties to each extended properties record to be used in form 
        * templating (form name and UI control type). 
        * @param {Array} containers Array of containers
        */
        function applyFormProperties(containers) {
            var c, r, rv;

            for (var i = 0; i < containers.length; i++) {
                c = containers[i];
                c.formName = 'formEpTable' + i;
                c.formId = 'form' + i;
                for (var j = 0; j < c.records.length; j++) {
                    r = c.records[j];
                    r.formId = c.formId + '_rec' + j;
                    for (var k = 0; k < r.recordValues.length; k++) {
                        rv = r.recordValues[k];
                        rv.dirty = false;
                        rv.formId = r.formId + '_rv' + k;
                        if (rv.dataType == 0 || rv.dataType == 1 || rv.dataType == 6) { // short int, long int, oid
                            rv.controlType = 'int';
                        } else if (rv.dataType == 2 || rv.dataType == 3) { // single, double
                            rv.controlType = 'float';
                        } else if (rv.dataType == 4) { // string
                            rv.controlType = 'text';
                            // control type modifiers                        
                            if (rv.domain == '') {
                                // size modifiers
                                if (rv.length < 51) { rv.controlType += '-sm'; }
                                if (rv.length > 99) { rv.controlType += 'area'; }
                            } else if (rv.domain != '') {
                                rv.controlType += '-list';                            
                            }
                        } else if (rv.dataType == 5) { // date                 
                            rv.controlType = 'date';
                            if (rv.data != null) {
                                rv.data = new Date(rv.data);
                                if (rv.data.getTime() == -2209161600000) {
                                    rv.data = null;
                                }
                            }
                        } else if (rv.dataType == 10 || rv.dataType == 11) { // GUID, ESRI Global Id              
                            rv.controlType = 'guid';
                        } else { // Geometry, BLOB, Raster, XML
                            rv.controlType = '';
                        }

                        //if (rv.dataType != 4) {
                        //    console.log(c.tableName + '.' + rv.name + ': ' + rv.controlType, rv);
                        //}
                    
                    }
                }  
            }
        };





        function attachmentLink(jobId, attachment) {
            var st = attachment.storageType;                
            if (st == 1) {
                return 'file:\\' + attachment.folder + attachment.filename;
            } else if (st == 2) {
                return svc.jobUrl(jobId) + '/attachments/' + attachment.id + '/content?f=file&_ts=' + timestamp();
            } else {
                return attachment.folder;
            }
        };


        function attachmentLinkDV(attachment) {
            return (attachment.storageType < 3) ? attachment.filename : attachment.folder;
        };




        /**
        * Filters extended properties containers based on the relationshipType value. 
        * @param {Array} containers Array of containers
        * @param {number} relType Table relationship type
        * @return {Array} Array of matching containers
        */
        function filterContainers(containers, relType) {
            var a = [];
            for (var i = 0; i < containers.length; i++) {
                if (containers[i].relationshipType == relType) {
                    a.push(containers[i]);
                }
            }
            return a;
        };


        /**
         * Removes a job from the cache data.
         * @param {number} jobId Job identifier
         */
        function removeJobFromCache(jobId) {
            // locate job in cached data
            var index = -1;
            for (var i = 0; i < svc.data.jobList.rows.length; i++) {
                if (svc.data.jobList.rows[i][svc.data.jobList.jobIdIndex] == jobId) {
                    index = i;
                    break;
                }
            }
            // remove from job list (if requred)
            if (index > -1) {
                svc.data.jobList.rows.splice(index, 1);
                if (logSvc.debug) { console.log('Job cleared from job list cache', jobId) };
                // remove from job detail (if requred)
                if (svc.data.details.job != null && svc.data.details.job.id == jobId) {
                    svc.data.details.job = null;
                    if (logSvc.debug) { console.log('Job detail cleared from cache', jobId) };
                }
            }
            // clear the selected job id (if requred)
            if (svc.data.jobList.selJobId == jobId) {
                svc.data.jobList.selJobId = -1;
            }
        };


        /**
        * Loads all queries from the service info public queries array.
        * @param {Object} queries object
        */
        function loadQueries(queries) {
            if (queries != null) {
                var filters = [];
                for (var i = 0; i < queries.containers.length; i++) {
                    for (var q = 0; q < queries.containers[i].queries.length; q++) {
                        filters.push(queries.containers[i].queries[q]);
                    }
                }
                svc.data.jobList.filters = filters;
                // set default query
                for (var i = 0; i < filters.length; i++) {
                    if (filters[i].id == wmConfig.general.defaultQueryId) {
                        svc.data.jobList.filter = filters[i];
                        return;
                    }
                }
                if (filters.length > 0) {
                    svc.data.jobList.filter = filters[0];
                }
            }
        };


        /**
        * Returns an activity description from an id value. 
        * @param {number} id Activity identifier
        * @return {string} Activity description
        */
        function activityDescriptionById(id) {
            if (svc.data.serviceInfo) {
                var types = svc.data.serviceInfo.activityTypes;
                for (var i = 0; i < types.length; i++) {
                    if (types[i].id == id) {
                        return types[i].description;                   
                    }
                }            
            }
            return '' + id;
        }



        function assignmentTypeById(id) {
            if (id == 1) {
                return 'User';
            } else if (id == 2) {
                return 'Group';
            } else {
                return 'Unassigned';
            }
        };


        function holdNameByType(id) {
            if (svc.data.serviceInfo) {
                var types = svc.data.serviceInfo.holdTypes;
                for (var i = 0; i < types.length; i++) {
                    if (types[i].id == id) {
                        return types[i].name;
                    }
                }
            }
            return '' + id;
        };


        function priorityById(id) {
            if (svc.data.serviceInfo) {
                var types = svc.data.serviceInfo.holdTypes;
                for (var i = 0; i < types.length; i++) {
                    if (types[i].id == id) {
                        return types[i].name;
                    }
                }
            }
            return '' + id;
        };


        /**
        * Returns a job type from an id value. 
        * @param {number} id Job type identifier
        * @return {Object} Job type
        */
        function jobTypeById(id) {
            if (svc.data.serviceInfo) {
                var types = svc.data.serviceInfo.jobTypes;
                for (var i = 0; i < types.length; i++) {
                    if (types[i].id == id) {
                        return types[i];
                    }
                }
            }
            return '' + id;
        };





        function jobStatusById(id) {
            return (svc.data.serviceInfo) ? getObjectById(id, svc.data.serviceInfo.jobStatuses) : null;
        }



        function dataWorkspaceById(id) {
            return (svc.data.serviceInfo) ? getObjectById(id, svc.data.serviceInfo.dataWorkspaces) : null;
        }





        function getObjectById(id, list) {
            for (var i = 0; i < list.length; i++) {
                if (list[i].id == id) {
                    return list[i];
                }
            }
            return null;
        }



        /**
        * Returns a user's name (first last) from an id value. 
        * @param {number} id User identifier
        * @return {string} User display name
        */
        function userDisplayNameById(id) {
            var name = id;      
            for (var i = 0; i < svc.data.users.length; i++) {
                if (svc.data.users[i].userName == id) {
                    return userDisplayName(svc.data.users[i]);
                }
            }        
            return name;
        }


        /**
        * Returns a user's name (first last) from a user object. 
        * @param {Object} user User identifier
        * @return {string} User display name
        */
        function userDisplayName(user) {
            return (user) ? user.firstName + ' ' + user.lastName : '';
        };


        /**
        * Returns the encoded username after replacing all occurences of backslash and '*'
        * @param {Object} user User object
        * @return {string} Escaped username
        */
        function encodeUserName(name) {
            return name.replace('\\', '%5C').replace('*', '%5C');
        };


        /**
        * Returns a timestamp that can be used to prevent cached responses. 
        * @return {number} Timestamp
        */
        function timestamp() {
            return new Date().getTime();
        }

        function qsTimestamp(separator) {
            if (separator == undefined) { separator = '&' };
            return separator + '_ts=' + new Date().getTime();
        }

        function qsUser(separator) {
            if (separator == undefined) { separator = '&' };
            return separator + 'user=' + svc.data.userId;
        }

        function qsFormat(separator, format) {
            if (separator == undefined) { separator = '&' };
            if (format == undefined) { format = 'json' };
            return separator + 'f=' + format;
        }


        function format(str, obj) {
            return str.replace(/\{\s*([^}\s]+)\s*\}/g, function (m, p1, offset, string) {
                return obj[p1]
            })
        }


        return svc;

    }]);


})();