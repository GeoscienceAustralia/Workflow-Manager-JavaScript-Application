/**
 * Workflow Manager - Angular Filters. 
 */
(function() {
    'use strict';


    angular.module('wmApp').filter('currentUserDisplayName', function () {
        return function (user) {
            return (user == null) ? 'Unknown' : user.firstName + ' ' + user.lastName;
        }
    });


    angular.module('wmApp').filter('displayName', function () {
        return function (username, users) {
            if (users == null) { return username; };
            var name = username + ' (Unknown)';
            for (var i = 0; i < users.length; i++) {
                if (users[i].userName == username) {
                    name = users[i].firstName + ' ' + users[i].lastName;
                    break;
                }
            }
            return name;
        }
    });


    angular.module('wmApp').filter('checkNull', function () {
        return function (value, nullDV) {
            if (nullDV == undefined) { nullDV = '(none)' };
            return (value == null || value == '') ? nullDV : value;
        }
    });


    angular.module('wmApp').filter('activityType', function () {
        return function (id, activityTypes) {
            var name = 'Unknown (' + id + ')';
            for (var i = 0; i < activityTypes.length; i++) {
                if (activityTypes[i].id == id) {
                    name = activityTypes[i].description;
                    break;
                }
            }
            return name;
        }
    });

})();