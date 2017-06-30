/**
 * Workflow Manager - Application configuration and startup. 
 */
(function() {
    'use strict';

    /* IE doesn't have .startsWith  */
    if (!String.prototype.startsWith) {
        String.prototype.startsWith = function (str) {
            return this.lastIndexOf(str, 0) === 0;
        };
    }

    // Define an angular module for our wmApp
    var wmApp = angular.module('wmApp',
        ['ngRoute', 'ngAnimate', 'ngMessages', 'ngSanitize', 'toastr', 'ng-drag-scroll']);

    // Add moment.js and chart.js libraries
    angular.module('wmApp').constant("moment", moment);

    // Define client side routing
    angular.module('wmApp').config(function ($routeProvider, $locationProvider) {
        $routeProvider.

            when('/', {
                templateUrl: 'views/index.html',
                controller: 'jobListCtrl'
            }).

            when('/index', {
                templateUrl: 'views/index.html',
                controller: 'jobListCtrl'
            }).

            when('/reports', {
                templateUrl: 'views/reports.html',
                controller: 'reportsCtrl'
            }).

            when('/job/:jobid', {
                templateUrl: 'views/detail.html',
                controller: 'jobDetailCtrl'
            }).

            when('/job/:jobid/:tab', {
                templateUrl: 'views/detail.html',
                controller: 'jobDetailCtrl'
            }).

            otherwise({ redirectTo: '/' });
    
        // use the HTML5 History API
        $locationProvider.html5Mode(true);
    });

    // Toastr config
    angular.module('wmApp').config(function (toastrConfig) {
        angular.extend(toastrConfig, {
            positionClass: 'toast-bottom-right'
        });  
    });
    
    // Application startup
    angular.module('wmApp').run(['$rootScope', 'startupParams', 'logSvc', 'wmServiceSvc', 
        function ($rootScope, startupParams, logSvc, wmServiceSvc) {
    
        if (logSvc.debug) { console.log('App.run', startupParams) };

        // get required data to start web application
        wmServiceSvc.startup(startupParams.userid).then(function () {
            if (logSvc.debug) {
                console.log('Startup Complete', {
                    username: startupParams.userid,
                    serviceInfo: wmServiceSvc.data.serviceInfo,
                    users: wmServiceSvc.data.users,
                    groups: wmServiceSvc.data.groups,
                    currentUser: wmServiceSvc.data.currentUser
                })
            };
            wmServiceSvc.started = true;
            $rootScope.$broadcast('load-success');
        }, function (ex) {
            console.error('Startup Failed', ex);
            wmServiceSvc.started = false;
            $rootScope.$broadcast('load-failed', ex );
        });
    }]);
    
})();