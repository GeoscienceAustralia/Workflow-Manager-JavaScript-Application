/**
 * Workflow Manager - Logging Service. 
 */
(function() {
    'use strict';


    angular.module('wmApp').service('logSvc', ['$rootScope', 'toastr', 'wmConfig', function ($rootScope, toastr, wmConfig) {

        var svc = {};

  
        /**
         * Flag to determine if debug messages should be logged to the console.
         */
        svc.debug = wmConfig.logging.debug;


        /**
         * Broadcasts a success message. 
         * @param {string} msg Success message
         * @param {string} title Success message title
         * @param {boolean} log Add message to console
         * @fires show-success
         * @returns {boolean} true if the success message should be logged, otherwise false
         */
        svc.success = function (msg, title, log) {
            if (log == undefined) { log == false };
            $rootScope.$broadcast('show-success', { msg: msg, title: title });
            return log;
        };


       /**
        * Broadcasts a info message. 
        * @param {string} msg Success message
        * @param {string} title Success message title
        * @param {boolean} log Add message to console
        * @fires show-info
        * @returns {boolean} true if the info message should be logged, otherwise false
        */
        svc.info = function (msg, title, log) {
            $rootScope.$broadcast('show-info', { msg: msg, title: title });
            return log;
        };


        /**
         * Broadcasts a warning message. 
         * @param {Object} ex Exception object
         * @param {boolean} show Broadcast show-error event (default true)
         * @fires show-warn
         * @returns {boolean} true if the warning should be logged, otherwise false
         */
        svc.warn = function (ex, show) {
            if (show == undefined) { show = true; };
            if (show) {
                $rootScope.$broadcast('show-warn', ex);
            }        
            return wmConfig.logging.warn;
        };



        /**
        * Displays a warning message.
        */
        svc.showWarning = function (msg, title) {
            if (title == undefined) { title = 'Warning'; }
            toastr.warning(msg, title, {
                timeOut: 60000,
                closeButton: true
            });
        };



        /**
         * Broadcasts a warning message. 
         * @param {Object} ex Exception object
         * @param {boolean} show Broadcast show-error event (default true)
         * @fires show-error
         * @returns {boolean} true if the error should be logged, otherwise false
         */
        svc.error = function (ex, show) {
            if (show == undefined) { show = true; };
            if (show) {
                $rootScope.$broadcast('show-error', ex);
            }        
            return wmConfig.logging.error;
        };


        return svc;

    }]);
    
})();