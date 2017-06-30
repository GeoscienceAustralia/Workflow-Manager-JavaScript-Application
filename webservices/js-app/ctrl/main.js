/**
 * Workflow Manager - Main Controller: handles the navigation banner and popup messages. 
 */
(function() {
    'use strict';


    angular.module('wmApp').controller('mainCtrl', ['$scope', '$rootScope', '$location', '$routeParams', 'toastr', 'logSvc', 'wmConfig', function
        ($scope, $rootScope, $location, $routeParams, toastr, logSvc, wmConfig) {

        // controller properties (set view from url location)
        $scope.config = wmConfig;
        $scope.i18n = wmConfig.i18n;
        $scope.mainView = 'loading';
        $scope.currentUser = null;
        $scope.loadFailReason = '';
        $scope.view = getViewName($location.url());
    

        /**
        * Opens the help content
        */
        $scope.openHelp = function () {
            window.open(wmConfig.server.helpUrl, '_blank');
        }


        $scope.$on('$locationChangeSuccess', function (evt, newUrl, oldUrl) {
            $scope.view = getViewName($location.url());
        });


        /**
        * Responds to the load-success event by displaying an error page.
        */
        $rootScope.$on('load-failed', function (evt, args) {
            $scope.loadFailReason = args.error.message;
            $scope.mainView = 'error';
        });


        /**
        * Responds to the current-user-updated event by setting the current user.
        */
        $rootScope.$on('current-user-updated', function (evt, args) {
            $scope.currentUser = args.user;
        });


        /**
        * Responds to the load-success event by displaying the main page content.
        */
        $rootScope.$on('load-success', function (evt) {
            $scope.mainView = 'content';
        });


        /**
        * Displays a success message.
        */
        $rootScope.$on('show-success', function (evt, args) {
            toastr.success(args.msg, args.title, {
                closeButton: true
            });
        });
       
            
        /**
        * Displays a warning message.
        */
        $rootScope.$on('show-warn', function (evt, args) {
            toastr.warning(args.error.message, 'Warning', {
                timeOut: 60000,
                closeButton: true
            });
        });


        /**
        * Displays an error message.
        */
        $rootScope.$on('show-error', function (evt, args) {
            toastr.error(args.error.message, 'Error', {
                timeOut: 60000,
                closeButton: true
            });
        });


        /**
        * Gets the name of the view to display from the url path.
        * @param {string} path URL path
        * @return {string} Name of the view
        */
        function getViewName(path) {
            path = path.toLowerCase();
            var view = 'index'; // default
            if (path.startsWith('/reports')) {
                view = 'reports';
            } else if (path.startsWith('/job/')) {
                view = 'detail';
            }
            return view;
        };


        /**
        * Gets the tab id from the route parameters. Redirects to the default tab if the id does not exist.
        * @return {string} Tab identifier
        */
        function getRouteTabId() {
            // get tabid from route
            var tabId = ($routeParams.tab) ? $routeParams.tab.toLowerCase() : null;
            // return default if null
            if (tabId == null) {
                if (logSvc.debug) {
                    console.log('Tab not specified (return default)',
                        { tabId: wmConfig.general.defaultTabId });
                }
                return wmConfig.general.defaultTabId;
            };
            // verify tab exists
            for (var i = 0; i < $scope.tabs.length; i++) {
                if ($scope.tabs[i].id == tabId) {
                    if (logSvc.debug) { console.log('Tab found', { tabId: tabId }) };
                    return tabId;
                }
            }
            // return 404 if this tab does not exist
            if (logSvc.debug) { console.log('Tab not found', { tabId: tabId }) };
            return '404';
        };

        if (logSvc.debug) { console.log('mainCtrl - Started:', { url: $location.url(), view: $scope.view }) };

    }]);


})();