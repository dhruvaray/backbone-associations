(function () {
    var employeeCollection10 = Utility.getEmployee(10);
    var employeeCollection15 = Utility.getEmployee(15);
    var employeeCollection20 = Utility.getEmployee(20);
    var employeeCollection25 = Utility.getEmployee(25);
    var employeeCollection30 = Utility.getEmployee(30);

    // Associated Model
    var associatedModel = {};
    associatedModel.Location = Backbone.AssociatedModel.extend({
        defaults:{
            add1:"",
            add2:null,
            zip:"",
            state:""
        }
    });

    associatedModel.Department = Backbone.AssociatedModel.extend({
        relations:[
            {
                type:Backbone.Many,
                key:'locations',
                relatedModel:associatedModel.Location
            }
        ],
        defaults:{
            name:'',
            locations:[],
            number:-1
        }
    });

    associatedModel.Employee = Backbone.AssociatedModel.extend({
        relations:[
            {
                type:Backbone.One,
                key:'works_for',
                relatedModel:associatedModel.Department
            }
        ],
        validate:function (attr) {
            return (attr.sex && attr.sex != "M" && attr.sex != "F") ? "invalid sex value" : undefined;
        },
        defaults:{
            sex:'M', //{F,M}
            age:0,
            fname:"",
            lname:"",
            works_for:{}
        }
    });

    associatedModel.Company = Backbone.AssociatedModel.extend({
        relations:[
            {
                type:Backbone.Many,
                key:'employees',
                relatedModel:associatedModel.Employee
            }
        ],
        defaults:{
            name:'',
            employees:[]
        }
    });

    //JSLitmus Backbone-associations Test Cases
    JSLitmus.test('Set : 10 inserts', function () {
        var company = new associatedModel.Company();
        company.set(employeeCollection10);
    });
    JSLitmus.test('Set : 15 inserts', function () {
        var company = new associatedModel.Company();
        company.set(employeeCollection15);
    });
    JSLitmus.test('Set : 20 inserts', function () {
        var company = new associatedModel.Company();
        company.set(employeeCollection20);
    });
    JSLitmus.test('Set : 25 inserts', function () {
        var company = new associatedModel.Company();
        company.set(employeeCollection25);
    });
    JSLitmus.test('Set : 30 inserts', function () {
        var company = new associatedModel.Company();
        company.set(employeeCollection30);
    });
})();