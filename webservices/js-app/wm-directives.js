/**
 * Workflow Manager - Angular Directives. 
 */
(function() {
    'use strict';

    /*
    * Tab loading directive
    */
    angular.module('wmApp').directive('wmTabLoading', function () {
        return {
            restrict: 'A',
            replace: true,
            template: '<div data-ng-show="(tabView == \'loading\')" class="well well-sm loading">Loading...</div>'
        };
    });


    /*
    * Tab loading error directive
    */
    angular.module('wmApp').directive('wmTabError', function () {
        return {
            restrict: 'A',
            replace: true,
            template: '<div data-ng-show="(tabView == \'error\')" class="well well-sm loading-error">' +
                '<span class="glyphicon glyphicon-warning-sign"></span> {{loadError}}' +
                '<span data-ng-show="(loadErrorRetry)"> - <span class="fakelink" data-ng-click="refresh()">Retry</span></span>' +
                '</div>'
        };
    });
    

    /*
    * Header row directive for each tab page
    */
    angular.module('wmApp').directive('wmTabHeader', function () {
        return {
            restrict: 'A',
            replace: true,
            template: '<div class="row"><div class="col-md-8"><h3>{{job.name}}</h3></div><div class="col-md-4">' + 
                '<span class="job-detail-id pull-right"> <span class="jobid-hash">#</span> {{jobId}}</span>' +
                '<span data-ng-show="isOnHold()" class="job-detail-badge label label-default pull-right">' +
                '<span class="glyphicon glyphicon-pause" aria-hidden="true"></span> On Hold</span>' +
                '<span data-ng-show="isOverdue()" class="job-detail-badge label label-danger pull-right">' +
                '<span class="glyphicon glyphicon-time" aria-hidden="true"></span> Overdue</span>' +
                '<span data-ng-show="isComplete()" class="job-detail-badge label label-success pull-right">' +
                '<span class="glyphicon glyphicon-ok" aria-hidden="true"></span> Completed</span>' +
                '</div></div>'
        };
    });



    //angular.module('wmApp').directive('wmRowHeader', function () {
    //    return {
    //        restrict: 'A',
    //        replace: true,
    //        template: '<h3>{{tabName}} <span class="pull-right"> <span class="jobid-hash">#</span> {{jobId}}</span></h3>'
    //    };
    //});


    //angular.module('wmApp').directive('wmStepHelp', function () {
    //    return {
    //        restrict: 'A',
    //        replace: true,
    //        templateUrl: 'views/tpl/step-help.html'
    //    };
    //});


    //angular.module('wmApp').directive('datepicker', function () {
    //    return {
    //        restrict: 'A',
    //        require: 'ngModel',
    //        link: function (scope, element, attrs, ngModelCtrl) {
    //            console.log('datepicker', element);
    //            $(function () {
    //                element.datepicker({
    //                    dateFormat: 'dd/mm/yy',
    //                    onSelect: function (date) {
    //                        scope.$apply(function () {
    //                            ngModelCtrl.$setViewValue(date);
    //                        });
    //                    }
    //                });
    //            });
    //        }
    //    }
    //});


})();