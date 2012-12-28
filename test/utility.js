var Utility = {
    drawChart : function (opt) {
        if(opt.associated && opt.relational && opt.associated.length == opt.relational.length && (typeof google!=='undefined') && google.visualization){
            var dataTable = [];
            dataTable.push(['Objects', 'Backbone-associations','Backbone-relational']);
            for(var i=0;i<opt.points.length;i++){
                dataTable.push([opt.points[i], opt.associated[i],opt.relational[i]]);
            }
            var data =  google.visualization.arrayToDataTable(dataTable);
            var options = {
                hAxis: {title: opt.hTitle,  titleTextStyle: {color: 'blue'}},
                vAxis: {title: opt.vTitle,  titleTextStyle: {color: 'blue'}},
                legend : {position:'top',alignment:'end'}
            };
            var chart = null;
            switch(opt.chartType){
                case 'AREACHART' :
                    chart = new google.visualization.AreaChart(document.getElementById(opt.divName));
                    break;
                case 'COLUMNCHART' :
                    options.bar = {"groupWidth" : 20};
                    chart = new google.visualization.ColumnChart(document.getElementById(opt.divName));
                    break;
            }
            chart && chart.draw(data, options);
        }
    },
    loadJSLitmusProxy : function (jsLit) {
        if(jsLit){
            this.renderChart = jsLit.renderChart;
            jsLit.renderChart = function(){
                Utility.renderChart.apply(jsLit,arguments);
                var associatedPeriodData = {};
                var relationalPeriodData = {};
                var associatedHzData = {};
                var relationalHzData = {};
                var n = JSLitmus._tests.length;
                // Gather test data
                for (var i=0; i < JSLitmus._tests.length; i++) {
                    var testCase = JSLitmus._tests[i];
                    if (testCase.count) {
                        var hostObject = null;
                        if(/associations/gi.test(testCase.name)){
                            hostPeriodObject = associatedPeriodData;
                            hostHzObject = associatedHzData;
                        }
                        else if(/relational/gi.test(testCase.name)){
                            hostPeriodObject = relationalPeriodData;
                            hostHzObject = relationalHzData;
                        }
                        var period = testCase.period;
                        hostPeriodObject && (hostPeriodObject[i] =  period ? period*1000 : 0);
                        var hz = testCase.getHz();
                        hostHzObject && (hostHzObject[i] =  hz ? hz : 0);
                    }
                }
                Utility.drawChart({
                    chartType:'AREACHART',
                    associated : _.values(associatedPeriodData),
                    relational : _.values(relationalPeriodData),
                    points : ['10','15','20','25','30'],
                    vTitle : 'Time(ms)',
                    hTitle : 'Operation - (set n associations)',
                    divName : 'speed_chart_div1'
                });
                Utility.drawChart({
                    chartType:'AREACHART',
                    associated : _.values(associatedHzData),
                    relational : _.values(relationalHzData),
                    points : ['10','15','20','25','30'],
                    vTitle : 'Ops/sec',
                    hTitle : 'Operation - (set n associations)',
                    divName : 'speed_chart_div2'
                });
            }
        }
    },
    _getDepartments : function () {
        var loc1 = {
            add1 : "P.O Box 3899",
            zip: "94404",
            state : "CA"
        };
        var loc2 = {
            add1 : "P.O Box 4899",
            zip: "95502",
            state : "CA"
        };
        return [
            {
                name : 'R&D',
                number : '23',
                locations : [
                    loc1,
                    loc2
                ]
            },
            {
                name : 'Marketing',
                number : '24',
                locations : [
                    loc1,
                    loc2
                ]
            }
        ];
    },
    getEmployee : function (count) {
        !count && (count=10);
        var result = {
            name : 'comp'+count,
            employees : []
        };
        var departmentData = this._getDepartments();
        for(var i = 0; i < count; i++) {
            var emp = {
                fname : 'fname'+i,
                lname : 'lname'+i,
                age : (function () {
                    var age = parseInt(Math.random()*100);
                    return age < 20 ? age+20 : age > 65 ? 65 : age;
                })(),
                sex : (function () {
                    return (parseInt(Math.random()*100)%2)?'M':'F';
                })(),
                works_for : (function () {
                    return departmentData[(parseInt(Math.random()*100)%2)];
                })()
            };
            result.employees.push(emp);
        }
        return result;
    }
};
