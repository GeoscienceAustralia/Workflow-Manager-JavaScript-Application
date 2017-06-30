<%@ Page Language="C#" %>

<!DOCTYPE html>
<html lang="en" data-ng-app="wmApp">
<head runat="server">
    <title>Workflow Manager</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />

    <link href="css/jquery-ui.min.css" rel="stylesheet" />
    <link href="css/bootstrap.min.css" rel="stylesheet" />
    <link href="css/angular-toastr.css" rel="stylesheet" />
    <link href="css/chartist.css" rel="stylesheet" />
    <link href="css/wm.css" rel="stylesheet" />

    <!-- IMPORTANT -->
    <base href="/workflowmanager/webservices/">

</head>
<body data-ng-controller="mainCtrl" class="ng-cloak">

    <!-- Loading Splash Screen -->
    <div id="loading-outer" data-ng-show="(mainView == 'loading')">
        <div id="loading-inner">
            <img data-ng-src="{{i18n.loading.logo}}" alt="{{i18n.loading.logoAlt}}" />
                <h1 id="loading-title">{{i18n.loading.title}}</h1>  			    
                <ul id="loading-dots">
                    <li></li>
                    <li></li>
                    <li></li>
                    <li></li>
                    <li></li>
                    <li></li>
                </ul>
                <span id="loading-text">{{i18n.loading.text}}</span>
        </div>
    </div>


    <!-- Loading Splash Screen -->
    <div id="fail-outer" data-ng-show="(mainView == 'error')">
        <div id="fail-inner">
            <h1>Load Failed</h1>
            <div id="fail-content">
                <p>Workflow Manager Failed to Load</p>
                <div class="well well-sm">
                    <ul>
                        <li>The application path is case sensitive.</li>
                    </ul>
                </div>
                <p>Please try reloading the web application.</p>
                <p data-ng-show="(config.general.supportEmail != '')">          
                    <span>Support: <a href="email">email</a></span>
                </p>
            </div>
        </div>
    </div>


    <!-- Main Content -->
    <div class="container-fluid" data-ng-show="(mainView == 'content')" >
        
        <!-- Navigation Bar -->
        <nav class="navbar navbar-inverse navbar-fixed-top">

            <!-- Brand and toggle get grouped for better mobile display -->
            <div class="navbar-header">
                <button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#wm-navbar-collapse" aria-expanded="false">
                    <span class="sr-only">{{i18n.navbar.toggle}}</span>
                    <span class="icon-bar"></span>
                    <span class="icon-bar"></span>
                    <span class="icon-bar"></span>
                </button>
                <a class="navbar-brand" href="#">{{i18n.navbar.title}}</a>
            </div>

            <!-- Collect the nav links, forms, and other content for toggling -->
            <div class="collapse navbar-collapse" id="wm-navbar-collapse">
                <ul class="nav navbar-nav">
                    <li data-ng-class="{'active': view == 'reports'}">
                        <a href="reports">{{i18n.navbar.reportingNav}}</a>
                    </li>
                    <li data-ng-class="{'active': view == 'index'}">
                        <a href="index">{{i18n.navbar.jobListNav}} <span class="sr-only">(current)</span></a>
                    </li>                    
                    <li data-ng-show="view == 'detail'" class="active">
                        <a href="#">{{i18n.navbar.jobNav}}</a>
                    </li>
                </ul>

      
                <p class="navbar-text navbar-right">
                    <span id="help-icon" title="{{i18n.navbar.helpTitle}}" data-ng-click="openHelp()">
                        <span class="glyphicon glyphicon-question-sign" aria-hidden="true"></span>
                    </span>
                </p>
                <p class="navbar-text navbar-right">
                    <span class="glyphicon glyphicon-user" aria-hidden="true"></span> 
                    <span class="username">{{currentUser | currentUserDisplayName}}</span>
                </p>          
            </div>

        </nav>

        <!-- Content View --> 
        <div ng-view class="fill"></div>

    </div>
    



    <!-- Angular and Bootstrap Dependencies -->
    <script src="scripts/jquery-1.9.1.min.js"></script>
    <script src="scripts/jquery-ui.min.js"></script>
    <script src="scripts/bootstrap.min.js"></script>   
    <script src="scripts/angular.min.js"></script>    
    <script src="scripts/angular-animate.min.js"></script>
    <script src="scripts/angular-messages.min.js"></script>
    <script src="scripts/angular-sanitize.min.js"></script>
    <script src="scripts/angular-route.min.js"></script>
    <script src="scripts/angular-toastr.tpls.min.js"></script>

    <!-- Other 3rd Party Dependencies -->
    <script src="scripts/moment.min.js"></script>
    <script src="scripts/chartist.min.js"></script>
    <script src="scripts/ng-drag-scroll.js"></script>
        
    <!-- Workflow Manager Scripts -->  
    <script src="js-app/wm-app.js"></script>
    <script src="js-app/wm-config.js"></script>
    <script src="js-app/wm-filters.js"></script>
    <script src="js-app/wm-directives.js"></script>

    <!-- Workflow Manager services -->  
    <script src="js-app/svc/log.js"></script>
    <script src="js-app/svc/wm-service.js"></script>

    <!-- Workflow Manager controllers --> 
    <script src="js-app/ctrl/main.js"></script>
    <script src="js-app/ctrl/job-list.js"></script>
    <script src="js-app/ctrl/job-detail.js"></script>
    <script src="js-app/ctrl/reports.js"></script>

    <!-- Workflow Manager Tab controllers --> 
    <script src="js-app/ctrl/tabs/tab-activity-ctrl.js"></script>
    <script src="js-app/ctrl/tabs/tab-attachments-ctrl.js"></script>
    <script src="js-app/ctrl/tabs/tab-dependencies-ctrl.js"></script>
    <script src="js-app/ctrl/tabs/tab-details-ctrl.js"></script>
    <script src="js-app/ctrl/tabs/tab-holds-ctrl.js"></script>
    <script src="js-app/ctrl/tabs/tab-properties-ctrl.js"></script>
    <script src="js-app/ctrl/tabs/tab-workflow-ctrl.js"></script>



    <!-- Startup Parameters --> 
    <script>
        // make sure that base path is lowercase
        var segs = window.location.pathname.split('/');
        if (segs.length > 0 && hasUpperCase(segs[1])) {
            window.location = window.location.href.toLowerCase();           
        };
        function hasUpperCase(str) { return (/[A-Z]/.test(str)); }
        
        // SSO authentication (user with domain)
        var user = '<%= User.Identity.Name.Replace("\\","*") %>';    
        console.log('Identity User: ', user);
        user = String(user).replace('PROD*a', 'PROD*u'); // work-around for login issue - Remove after testing
        angular.module('wmApp').value('startupParams', { userid: user });
    </script>

</body>
</html>
