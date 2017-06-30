/**
 * Workflow Manager - Configuration. 
 */
(function() {
    'use strict';

    angular.module('wmApp').value('wmConfig',
        {

            /** 
             * Logging options 
             * server: workflow manager service endpoint
             * helpUrl: url of the help content
             * jobIdField: name of the Job Id field
             * jobNameField: name of the Job Name field
             */
      
            server: {
                serviceUrl: '', 
                helpUrl: '',
                jobIdField: 'JTX_JOBS.JOB_ID',
                jobNameField: 'JTX_JOBS.JOB_NAME'
            },

            /**
             * Logging options 
             * debug: log debug information to the console
             * warn: log warnings to the console
             * error: log errors to the console
             */

            logging: {
                debug: true,
                warn: true,
                error: true
            },

            /**
             * General settings 
             * defaultTabId: default tab id for the job detail page
             * defaultChartType: default chart type (Donut, Pie)
             * defaultReportId: default report id
             * defaultQueryId: default query id for job list
             * supportEmail: email address for support
             */

            general: {
                defaultTabId: 'workflow',
                defaultChartType: 'Donut',
                defaultReportId: ,
                defaultQueryId: ,
                supportEmail: ''        
            },
        
            /**  
             * i18n options 
             * Update strings to change language, etc
             */

            i18n: {

                /* Loading screen */

                loading: {                
                    title: 'Workflow Manager - Web Edition',                
                    logo: 'content/splash-logo-white-sm.png',
                    logoAlt: 'Splash Screen Logo',
                    text: '- Loading -'
                },
            
                /* Navigation bar */

                navbar: {
                    title: 'Workflow Manager',
                    toggle: 'Toggle navigation',
                    jobListNav: 'Job List',
                    reportingNav: 'Reports',
                    jobNav: 'Job Detail',
                    helpTitle: 'Open Help'
                },

                /* Tab Names in Job Details */

                tabs: {
                    workflow: 'Workflow',
                    details: 'Product Details',
                    dependencies: 'Dependencies and Links',
                    properties: 'Job Properties',
                    activity: 'Activity Log',
                    attachments: 'Attachments',
                    holds: 'Holds'
                }
				
				           
            },
        
            /* Enum values */    

            enums: {
                assignedTo: ['Unassigned', 'User', 'Group'],
                priority: ['Low', 'Medium', 'High'],
                stage: [null, 'Created', 'Ready to work', 'Working', 'Done working', 'Closed'],
                storageType: [null, 'Linked file','Embedded file','URL']
            },
			
			/* Group Names */
			/* Should the name of the group given in the active directory not be user friendly this can be used to rename them in the application. */
				
			groups: {
				AD_group_name: 'user friendly name',
				
			} 

        }
    );

})();