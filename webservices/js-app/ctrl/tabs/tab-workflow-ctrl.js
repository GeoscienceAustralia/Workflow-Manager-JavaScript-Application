/**
 * Workflow Manager - Workflow Tab Controller. 
 */
(function () {
    'use strict';

    angular.module('wmApp').controller('workflowTabCtrl', ['$scope', '$sce', '$q', 'logSvc', 'wmConfig', 'wmServiceSvc', function 
        ($scope, $sce, $q, logSvc, wmConfig, wmServiceSvc) {

        const TABID = 'workflow';

        // scope properties (from cached data)
        $scope.workflow = wmServiceSvc.data.details.workflow;
        $scope.steps = wmServiceSvc.data.details.workflow.steps;
        $scope.currentSteps = wmServiceSvc.data.details.workflow.currentSteps;
        $scope.currentStepId = wmServiceSvc.data.details.workflow.currentStepId;
        $scope.currentStep = wmServiceSvc.data.details.workflow.currentStep;


        // scope properties
        $scope.workflowImageSrc = wmServiceSvc.jobUrl($scope.jobId) + '/workflow?f=image';
        $scope.tabName = wmConfig.i18n.tabs.workflow;
        $scope.tabView = ($scope.workflow.loaded) ? 'content' : 'loading';
        $scope.loadError = '';
        $scope.loadErrorRetry = false;
        $scope.stepHelpVisible = false;
        $scope.markStepCompleteEnabled = false
        $scope.executeStepEnabled = false;
        $scope.contentView = 'workflow';
   

        // step question template
        $scope.stepQuestion = {
            stepId: 0,
            result: '',
            resultDesc: '',
            title: '',
            message: '',
            description: '',
            args: []
        }

        
        function setStepQuestion(step) {
            // get dialog question parameters and arguments
            var params = step.stepType.program.split("|");
            var args = step.stepType.arguments.split("|");
            $scope.stepQuestion.stepId = step.id;
            $scope.stepQuestion.message = params[0];
            $scope.stepQuestion.title = params[1];
            $scope.stepQuestion.description = step.stepType.description;
            $scope.stepQuestion.result = '';
            $scope.stepQuestion.args = [];
            for (var i = 0; i < args.length; i++) {
                var arg = args[i].split(':');
                $scope.stepQuestion.args.push({ description: arg[0], value: arg[1] });
            }
        };


        function showExecuteQuestion(step) {
            setStepQuestion(step);
            $('#stepQuestionDialog').modal('show');
        };


        $scope.setStepQuestionResult = function (arg) {
            $scope.stepQuestion.result = arg.value;
            $scope.stepQuestion.resultDesc = arg.description;
        };


        $scope.executeQuestionResult = function (stepQuestion) {
            // Log Action and Move Next
            showProcessing(true);
            var cmt = $scope.currentStep.name + ' Question Response: ' + stepQuestion.resultDesc +
                ' (value: ' + stepQuestion.result + ')';
            var promises = [];
            // add comment
            promises.push(wmServiceSvc.addActivityLogComment($scope.jobId, cmt));
            // mark complete
            promises.push(wmServiceSvc.moveNextStep($scope.jobId, stepQuestion.stepId, stepQuestion.result));        
            $q.all(promises).then(function (data) {
                //console.log('<<< Tab Data (response)', data);
                // refresh current steps
                wmServiceSvc.getCurrentSteps($scope.jobId, true).then(function (data) {
                    //console.log('refreshCurrentSteps()', data);
                    $scope.currentSteps.rows = data;
                });
                // reload workflow image
                updateWorkflowImage();
                showProcessing(false);
            }, function (ex) {
                showProcessing(false);
            });
        };




        function updateWorkflowImage() {
            // set the size of the container
            resizeWorkflowImagePanel();
            // update the image
            $scope.workflowImageSrc = wmServiceSvc.jobUrl($scope.jobId) + '/workflow?f=image&_ts=' + new Date().getTime();
        }

        function resizeWorkflowImagePanel() {
            // set the size of the image container
            var panel = document.getElementById('workflow-container');
            panel.style.height = window.innerHeight - 50 - 112 + 'px';
            panel.style.maxHeight = window.innerHeight - 50 - 112 + 'px';
            // set the size of the step-help container
            var panel2 = document.getElementById('workflow-steps-container');
            panel2.style.height = window.innerHeight - 50 - 112 + 'px';
            panel2.style.maxHeight = window.innerHeight - 50 - 112 + 'px';

        }





        $scope.executeStep = function () {
           
            if ($scope.currentSteps.rows.length > 0) {
                //var step = $scope.currentSteps.rows[0];
                var step = $scope.currentStep;
                console.log("Executing Step: ", step);
                console.log("Executing Step Type: ", step.stepType.executionType);

                // stepType 1: Executable step
                if (step.stepType.executionType == 1) {
                    alert('Open File (StepExecutionType = 1) is not implemented');
                }

                // stepType 2: Functional step
                if (step.stepType.executionType == 2) {
               
                    // tell the server the step is executed
                    wmServiceSvc.executeStep($scope.jobId, step.id).then(function (data) {
                        //wmServiceSvc.getCurrentSteps($scope.jobId, true);                                    
                        updateWorkflowSteps(true, function (data) {
                            console.log(data);
                            applyPermissions();
                        });
                    });
                }

                // stepType 3: Procedural step (no execution)
            
                // stepType 4 and 6: Open URL or File
                if (step.stepType.executionType == 4 || step.stepType.executionType == 6) {
                    var url = step.stepType.program;
                    var token = url.substring(url.indexOf('['), url.indexOf(']') + 1);
                    wmServiceSvc.parseToken($scope.jobId, token).then(function (data) {
                        if (logSvc.debug) { console.log('Open URL or File', { step: step, token: token, data: data, url: url.replace(token, data) }) };

                        // Open the URL or File
                        window.open(url.replace(token, data));

                        // tell the server the step is executed
                        wmServiceSvc.executeStep($scope.jobId, step.id).then(function (data) {
                            console.log('executeStep result: ', data);
                        
                            // refresh current steps to allow mark complete
                            wmServiceSvc.getCurrentSteps($scope.jobId, true);                        
                        });
                    });
                }

                // stepType 5: Question
                if (step.stepType.executionType == 5) {
					showExecuteQuestion(step);
					
                }

            } else {
                // No Current Steps
            }
        };


        $scope.markStepComplete = function () {
            if ($scope.currentStep) {
                console.log('Marking Step Complete:', $scope.currentStep);
                _markStepComplete($scope.jobId, $scope.currentStep.id);
            }
        };


        function _executeStep(jobId, stepId) {            
            // test if step can be executed
            console.log('Executing Step: ', stepId);
            wmServiceSvc.canExecuteStep(jobId, stepId).then(function (result) {
                console.log('canRun result: ', result);
                if (result.canRun == 1) {
                    // execute step
                    wmServiceSvc.executeStep(jobId, stepId).then(function (data) {
                        console.log('executeStep result: ', data);
                        // Report status for each step
                        for (var i = 0; i < data.length; i++) {
                            if (data[i].executionResult == 1) {
                                showStepSuccessMsg(data[i].resultDescription, data[i].stepId);
                            } else {
                                showStepFailedMsg(data[i].resultDescription, data[i].stepId);
                            }
                        }
                    });
                } else {
                    showStepFailedMsg(result.description, stepId);
                }
            });
        };


        function showStepSuccessMsg(desc, stepId) {
            logSvc.success(desc + ' (step #' + stepId + ')', 'Step Completed', true);
        };


        function showStepFailedMsg(desc, stepId) {
            logSvc.showWarning(desc + ' (step #' + stepId + ')', 'Execute Step Warning');
        };


        function _markStepComplete(jobId, stepId) {
            showProcessing(true);
            wmServiceSvc.markStepDone(jobId, stepId).then(function (data) {           
                // refresh current steps
                wmServiceSvc.getCurrentSteps($scope.jobId, true).then(function (steps) {
                    //console.log('refreshCurrentSteps()', steps);
                    $scope.currentSteps.rows = steps;
                    applyPermissions();
                });
                showProcessing(false);
                // reload workflow image
                updateWorkflowImage();
                // Report status for first step (server might return multiple results for the same step)            
                if (data[0].executionResult == 1 || data[0].executionResult == 7) {
                    logSvc.success(data[0].resultDescription + ' (step #' + stepId + ')', 'Step Completed', true);
                    updateWorkflowImage();
                } else {
                    showStepFailedMsg(data[0].resultDescription, data[0].stepId);
                }
            }, function (ex) {
                showProcessing(false);
                logSvc.showWarning(ex.details[0], 'Warning');
            });
        };


        /**
        * Displays the help content for a step (requests data from the server if requried).
        */
        $scope.showStepHelp = function (step, refresh) {
            if (refresh == undefined) { refresh = false; };
            console.log('showStepHelp', step, refresh);
            step.help.show = true;
            if (refresh == true) { step.help.loaded = false; }
            //step.help.loaded = !refresh;
            if (!step.help.loaded) {
                wmServiceSvc.getStepHelp($scope.jobId, step.id).then(function (r) {
                    step.help.html = targetNew(r);
                    step.help.loadError = false;
                    step.help.loaded = true;
                }, function (ex) {
                    step.help.html = '' // ex.error.message;
                    step.help.loadError = true;
                    step.help.loaded = true;
                });
            }
        };


        /**
        * Ensures that links target a new window.
        */
        function targetNew(el) {
            if (el.indexOf('target=') == -1) {
                el = el.replace('<a href=', '<a target="blank" href=');
            }
            return el;
        }

        
        /**
        * Responds to the load-success event by loading the tab data.
        */
        $scope.$on('load-success', function (evt) {
            $scope.workflow = wmServiceSvc.data.details.workflow;
            loadTabData($scope.jobId);
        });


        //$scope.$on('job-loaded', function (evt) {
        //    //updateWorkflowImage();
        //    //$scope.workflowImageSrc = wmServiceSvc.jobUrl($scope.jobId) + '/workflow?f=image';
        //    //$scope.workflowImageSrc = wmServiceSvc.jobUrl($scope.jobId) + '/workflow?f=image&_ts=' + new Date().getTime();
        //});


        $scope.$on('current-steps-loaded', function (evt, args) {
            //console.log('current-steps-loaded', args);
            $scope.currentStep = wmServiceSvc.data.details.workflow.currentStep;
            setCurrentSteps(args.steps);
        });


        /**
        * Updates the workflow steps data and image.
        * @param {boolean} refresh Refresh the workflow image
        * @param {Function} onSuccess Function to execute on success
        * @param {Function} onError Function to execute on error
        */
        function updateWorkflowSteps(refresh, onSuccess, onError) {
            if (refresh == undefined) { refresh = true; }
            if (onSuccess == undefined) { onSuccess = null; }
            if (onError == undefined) { onError = null; }        
            // refresh current steps and image
            wmServiceSvc.getCurrentSteps($scope.jobId, true).then(onSuccess, onError);
            if (refresh) { updateWorkflowImage(); };
        };


        $scope.selectCurrentStep = function (step) {
            // cache current step id
            wmServiceSvc.data.details.workflow.currentStep = step;
            $scope.currentStep = step;
            console.log('Current Step Selected:', step, $scope.currentSteps);
            applyPermissions();
        };


        function setCurrentSteps(steps) {
            $scope.currentSteps.rows = steps;
            applyPermissions();

            // stepType 1: Executable step
            // stepType 2: Functional step  
            // stepType 3: Procedural step (no execution)
            // stepType 4: Open URL
            // stepType 5: Question 
            // stepType 6: Open File

        }




        function applyPermissions() {
            //console.log('APPLY PERMISSIONS: ', TABID, $scope.currentStep, $scope.job);

            // disable both buttons by default
            $scope.executeStepEnabled = false;
            $scope.markStepCompleteEnabled = false;

            // make sure job is not complete
            if ($scope.job) {
                if ($scope.job.stage == 5) {
                    return;
                }
            }
                
            // check if current step supports the operation
            var step = $scope.currentStep;
            if (step) {
                            
                if (step.stepType.executionType == 1) {
                    /* stepType 1: Executable step */
                    $scope.executeStepEnabled = true;
                    console.log(' - Executable step (execute only)');
                } else if (step.stepType.executionType == 2) {
                    /* stepType 2: Functional step */
                    $scope.executeStepEnabled = true;
                    console.log(' - Functional step (execute only)');
                } else if (step.stepType.executionType == 3) {
                    /* stepType 3: Procedural step (no execution) */
                    $scope.markStepCompleteEnabled = true;
                    console.log(' - Procedural step (mark complete only)');
                } else if (step.stepType.executionType == 4) {
                    /* stepType 4 and 6: Open URL or File */
                    $scope.executeStepEnabled = true;
                    $scope.markStepCompleteEnabled = true;
                    console.log(' - Open URL or File (both enabled)');
                } else if (step.stepType.executionType == 5) {
                    // stepType 5: Prompt question
                    $scope.executeStepEnabled = true;
                    console.log(' - Prompt question (execute only)');
                }

                // override based on other properties
                
            }
            //console.log('Result:');
            //console.log(' - executeStepEnabled:', $scope.executeStepEnabled);
            //console.log(' - markStepCompleteEnabled:', $scope.markStepCompleteEnabled);
        };



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
                // request workflow details from server
                var promises = [];
                promises.push(wmServiceSvc.getWorkflowSteps(jobId, refresh));
                promises.push(wmServiceSvc.getCurrentSteps(jobId, refresh));
                $q.all(promises).then(function (data) {
                    if (logSvc.debug) { console.log('<<< Tab Data (response)', data); };
                    updateWorkflowImage();
                    $scope.steps.rows = data[0];          
                    setCurrentSteps(data[1]);
                    $scope.loadError = '';
                    $scope.tabView = 'content';
                }, function (ex) {
                    console.warn('Error loading tab data: ', TABID, ex);
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
            if (wmServiceSvc.started) { // && $scope.steps.loaded == false) {
                loadTabData(jobId);
            }

        };


        window.addEventListener("resize", function (evt) {
            resizeWorkflowImagePanel();
        });
    

        init($scope.jobId);
        //if (logSvc.debug) { console.log('workflowTabCtrl (startup)', { jobId: $scope.jobId, started: wmServiceSvc.started }) };
    }]);


})();