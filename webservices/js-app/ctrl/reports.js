/**
 * Workflow Manager - Reports controller. 
 */
(function() {
    'use strict';


angular.module('wmApp').controller('reportsCtrl',
    ['$scope', '$rootScope', 'logSvc', 'wmConfig', 'wmServiceSvc',
        function ($scope, $rootScope, logSvc, wmConfig, wmServiceSvc) {

    // scope properties (from cached data)
    $scope.viewData = wmServiceSvc.data.jobList;
    $scope.chartType = wmServiceSvc.data.reports.chartType;
    $scope.reports = wmServiceSvc.data.reports.rows;
    $scope.currentReport = wmServiceSvc.data.reports.currentReport;
    var reportData = wmServiceSvc.data.reports.currentReportData;
    
    // scope properties  
    $scope.tableData = { columns: [], rows: [] };
    $scope.chartData = { labels: [], series: [] };
    $scope.legendData = [];
    $scope.chartTypes = ['Donut', 'Pie'];
    $scope.view = 'Chart';

    
    /**
    * Changes the report view and updates the chart if required.
    * @param {string} view Table or Chart
    */
    $scope.changeReportView = function (view) {      
        if (view == 'Chart') {
            $scope.updateChartType($scope.chartType);
        }
        $scope.view = view;        
    };
            

    /**
    * Updates the type of chart shown.
    * @param {string} item Type of chart
    */
    $scope.updateChartType = function (item) {
        console.log('updateChartType', item);
        $scope.chartType = item;
        wmServiceSvc.data.reports.chartType = item;
        updateChart($scope.chartType);
    };


    /**
     * Responds to the load-success event by requesting the jobs to display.
     */
    $rootScope.$on('load-success', function (evt) {
        $scope.viewData = wmServiceSvc.data.jobList;
        getReports();
    });

            
    /**
    * Updates the chart.
    * @param {string} chartType Type of chart
    */
    function updateChart(chartType) {
        if (reportData) {
            var data = getChartData(reportData, chartType);            
            $scope.chartData = data;
            if (chartType == 'Pie') {
                createPieChart(data);
            } else { // default Donut
                createDonutChart(data);
            }
        }
    };


    /**
    * Creates a new donut chart.
    * @param {Object} data Chart data
    */
    function createDonutChart(data) {

        var options = {
            donut: true,
            donutWidth: 130,
            chartPadding: 60,
            labelOffset: 90,
            labelDirection: 'explode',
            labelInterpolationFnc: function(value) {
                return value;
            },
            height: 600
        };

        new Chartist.Pie('.ct-chart', data, options);
       
    };


    /**
    * Creates a new pie chart.
    * @param {Object} data Chart data
    */
    function createPieChart(data) {

        var options = {
            chartPadding: 60,
            labelOffset: 140,
            labelDirection: 'explode',
            labelInterpolationFnc: function (value) {
                return value;
            },
            height: 600
        };

        new Chartist.Pie('.ct-chart', data, options);

    };


    /**
    * Requests report data from the server.
    */
    $scope.runReport = function (item) {
        $scope.currentReport = item;
        if (item == null) { return; };
        // get report data
        wmServiceSvc.getReport(item.id).then(function (r) {
            reportData = r;
            // prepare data for table and charts
            $scope.tableData = getTableData(reportData);
            $scope.chartData = getChartData(reportData, $scope.chartType);
            updateChart($scope.chartType);
        });
    };


    /**
    * Converts report data into a format suitable for the summary table.
    */
    function getTableData(data) {
        var grpRows = [];
        for (var i = 0 ; i < data.groups.length; i++) {
            // summary row
            var grpRow = {};
            grpRow.group = data.groups[i].value;
            grpRow.label = data.groups[i].aggregateLabel;
            grpRow.value = data.groups[i].aggregateValue;
            grpRow.expanded = false;
            grpRow.dataRows = [];
            // detail rows
            for (var j = 0; j < data.groups[i].rows.length; j++) {
                var row = [];
                row.push(''); // empty group value
                if (data.groups[i].rows[j].length > 0) {
                    for (var k = 0; k < data.groups[i].rows[j].length; k++) {
                        row.push(data.groups[i].rows[j][k]);
                    }
                    grpRow.dataRows.push(row);
                }
            }
            grpRows.push(grpRow);
        }
        return {
            columns: data.columns,
            rows: grpRows
        };
    };


    /**
    * Converts report data into a format suitable for chartist.
    */
    function getChartData(data, chartType) {

        var labels = [];
        var series = [];
        var legend = [];

        // Donut and Pie Chart Data (single series)
        if (chartType == 'Pie' || chartType == 'Donut') {            
            for (var i = 0 ; i < data.groups.length; i++) {
                labels.push(data.groups[i].value);
                series.push(Number(data.groups[i].aggregateValue));
                legend.push({ name: data.groups[i].value, id: getLetter(65 + i) });
            }
        } else {
            alert('Chart type not implemented');
        }

        //console.log('Chart Data: ', { labels: labels, series: series, chartType:chartType });

        // apply data to legend
        $scope.legendData = legend;
        return {
            labels: labels,
            series: series
        };
                 
    };


    /**
    * Returns a letter matching a character code (lowercase).
    */
    function getLetter(code) {
        return String.fromCharCode(code).toLowerCase();
    }
        

    /**
    * Requests the list of reports from the server.
    */
    function getReports(refresh) {
        wmServiceSvc.getReports(refresh).then(function (r) {
            $scope.reports = r.reports;
            // check for default report id
            var found = false;
            for (var i = 0; i < $scope.reports.length; i++) {
                if ($scope.reports[i].id == wmConfig.general.defaultReportId) {
                    $scope.currentReport = $scope.reports[i];
                    found = true;
                }
            }
            if (!found) {
                $scope.currentReport = ($scope.reports.length > 0) ? $scope.reports[0] : null;
            }
            // load the default report
            $scope.runReport($scope.currentReport);
        });
    }


   /**
    * Loads the cached job data if the service data has already been loaded.
    */
    function init() {
        if (wmServiceSvc.started && !wmServiceSvc.data.reports.loaded) {
            getReports();
        }
    }


    init();

}]);


})();