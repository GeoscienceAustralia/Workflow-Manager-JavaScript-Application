# README #

This README would normally document whatever steps are necessary to get your application up and running.

### What is this repository for? ###

**Quick summary**
This application is for use with Esri's Workflow Manager application using the workflow manager extension on ArcGIS server through the workflow manager service. 

**Version:** 1.0

### How do I get set up? ###

## Web Application Settings ##

The web application relies on an ESRI workflow manager service. This can be set in the configuration file. 
Open (right-click Edit) the wm-config.js file in the js-app directory using a text editor. 
Locate the server.serviceUrl property and update it to point to the workflow manager service (the application will not work without this URL). 
If needed update the helpUrl jobIdField and jobNameField.
The jobIdField needs to be in this format 'schemaname.tablename.fieldname'

```
#!Angular JS

server: {
				serviceUrl: 'http://servername/arcgis/rest/services/WorkflowManager/WMServer',
                helpUrl: '',
                jobIdField: 'schemaname.JTX_JOBS.JOB_ID',
                jobNameField: 'JTX_JOBS.JOB_NAME'
            },
```

			
The following settings can be modified to suit the environment 

* server.helpURL - Location of the help content.
* logging.debug - Turn on/off detailed debugging information (see the console.log).
* general.defaultTabId - Default tab to show when loading a job.
* general.defaultQueryId - Default query to execute when loading the job list.
* general.supportEmail - Support email address.

Tab names can also be changed in the configuration file:

* tab.workflow: 'Workflow',
* tab.details: 'Job Details',
* tab.dependencies: 'Service Dependencies',
* tab.properties: 'Job Properties',
* tab.activity: 'Activity Log',
* tab.attachments: 'Attachments',
* tab.holds: 'Holds'

*IMPORTANT: Do not change the tab object property names as they are used in the application code.*

## Deployment instructions ##

The web application routing relies on the base tag in the head section of the default.aspx file. Open (right-click Edit) the default.aspx file and check that the base tag matches the IIS web application:
   
```
#!Angular JS

 <base href="/workflow-manager/">
```


Copy the workflow manager application directory into the inetpub/wwwroot directory on the server

Make sure that the IIS_IUSRS account has access to the directory
*IMPORTANT: Do not use a virtual directory as there may be issues with single sign-on.*


**Workflow Manager Routing on IIS**

*IMPORTANT: The web application will not work unless this step has been completed.*

The Geoscience Australia workflow manager web application uses AngularJS html5Mode client side routing to navigate between views.
To support html5Mode routing IIS needs to be configured to return the default page when any workflow manager URL is requested. 
For example:
* http://[server]/workflow-manager/   --> default.aspx
* http://[server]/workflow-manager/job/1    --> default.aspx
* http://[server]/workflow-manager/job/1/activity    --> default.aspx


When the default.aspx document is loaded in the browser the client side routing will handle loading the appropriate content.

**The URL Rewrite Module** 

Open IIS and check if the URL Rewrite module is present.

If it is not present, install: 
On the server hosting the web application download the IIS URL Rewrite module: http://www.iis.net/downloads/microsoft/url-rewrite
If the server is connected to the internet you can use the Install this Extension option, otherwise download the appropriate file on another computer and copy it to the server. The download is located at the bottom of the page.
 
After copying the installer to the server run rewrite_amd64.msi
 
After restarting IIS Manager the module should now be available

**User Authentication Settings**

*IMPORTANT: The web application will not work unless this step has been completed.*

To configure Single Sign-On (SSO) select workflow manager in IIS and then open the Authentication module. Disable the Anonymous Authentication and enable Windows Authentication.
 
**Additional MIME types**
Bootstrap 3 uses a Woff2 font file. 
To enable the delivery of these files in IIS your need to add the MIME type in IIS Manager. Open the MIME Types module and click on the Add action
Enter the woff2 MIME type details: 
file extension: .woff2
MIME type: application/font-woff2

