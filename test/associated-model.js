$(document).ready(function () {

    if (!window.console) {
        window.console = {};
        var names = [ 'log', 'debug', 'info', 'warn', 'error', 'assert', 'dir', 'dirxml',
            'group', 'groupEnd', 'time', 'timeEnd', 'count', 'trace', 'profile', 'profileEnd' ];
        for (var i = 0; i < names.length; ++i) {
            window.console[ names[i] ] = function () {
            };
        }
    }

    var attr
        , child1, child2, child3, child4
        , dept1
        , emp
        , loc1, loc2
        , node1, node2, node3
        , parent1
        , project1, project2
        ;

    var Location = Backbone.AssociatedModel.extend({
        defaults:{
            add1:"",
            add2:null,
            zip:"",
            state:""
        }
    });

    var Project = Backbone.AssociatedModel.extend({
        relations:[
            {
                type:Backbone.Many,
                key:'locations',
                relatedModel:Location
            }
        ],
        defaults:{
            name:"",
            number:0,
            locations:[]
        }
    });


    var Department = Backbone.AssociatedModel.extend({
        relations:[
            {
                type:Backbone.Many,
                key:'controls',
                relatedModel:Project
            },
            {
                type:Backbone.Many,
                key:'locations',
                relatedModel:Location
            }
        ],
        defaults:{
            name:'',
            locations:[],
            number:-1,
            controls:[]
        }
    });

    var Dependent = Backbone.AssociatedModel.extend({
        validate:function (attr) {
            return (attr.sex && attr.sex != "M" && attr.sex != "F") ? "invalid sex value" : undefined;
        },
        defaults:{
            fname:'',
            lname:'',
            sex:'F', //{F,M}
            age:0,
            relationship:'S' //Values {C=Child, P=Parents}
        }
    });

    Employee = Backbone.AssociatedModel.extend({
        relations:[
            {
                type:Backbone.One,
                key:'works_for',
                relatedModel:Department
            },
            {
                type:Backbone.Many,
                key:'dependents',
                relatedModel:Dependent
            },
            {
                type:Backbone.One,
                key:'manager',
                relatedModel:'Employee'
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
            works_for:{},
            dependents:[],
            manager:null
        }
    });

    Node = Backbone.AssociatedModel.extend({
        relations:[
            {
                type:Backbone.One,
                key:'parent',
                relatedModel:'Node'
            },
            {
                type:Backbone.Many,
                key:'children',
                relatedModel:'Node'
            }
        ],
        defaults:{
            name:''
        }
    });

    module("Backbone.AssociatedModel", {
        setup:function () {
            emp = new Employee({
                fname:"John",
                lname:"Smith",
                age:21,
                sex:"M"
            });

            child1 = new Dependent({
                fname:"Jane",
                lname:"Smith",
                sex:"F",
                relationship:"C"

            });

            child2 = new Dependent({
                fname:"Barbara",
                lname:"Ruth",
                sex:"F",
                relationship:"C"

            });

            child3 = new Dependent({
                fname:"Gregory",
                lname:"Smith",
                sex:"M",
                relationship:"C"

            });

            child4 = new Dependent({
                fname:"Jane",
                lname:"Doe",
                sex:"F",
                relationship:"C"

            });
            parent1 = new Dependent({
                fname:"Edgar",
                lname:"Smith",
                sex:"M",
                relationship:"P"

            });

            loc1 = new Location({
                add1:"P.O Box 3899",
                zip:"94404",
                state:"CA"

            });

            loc2 = new Location({
                add1:"P.O Box 4899",
                zip:"95502",
                state:"CA"
            });

            project1 = new Project({
                name:"Project X",
                number:"2"
            });

            project2 = new Project({
                name:"Project Y",
                number:"2"
            });

            project2.get("locations").add(loc2);
            project1.get("locations").add(loc1);

            dept1 = new Department({
                name:"R&D",
                number:"23"
            });

            dept1.set({locations:[loc1, loc2]});
            dept1.set({controls:[project1, project2]});

            emp.set({"works_for":dept1});
            emp.set({"dependents":[child1, parent1]});
        }
    });

    test("initialize", 1, function () {
        equal(emp.get('fname'), 'John', 'name should be John');
    });

    test("primitive attribute set operation", 2, function () {
        emp.set({'age':22});
        equal(emp.get("age"), 22, "emp's should be 22 years");

        loc1.set({'zip':'95502'});
        ok(dept1.get('locations').at(0) == loc1, "dept1's first location should be same as loc1");
    });

    test("nested get", 11, function () {
        equal(emp.get('works_for.name'), emp.get('works_for').get('name'), 'result should be same as `get` chain');
        equal(emp.get('dependents[0].fname'), emp.get('dependents').at(0).get('fname'), 'index can be defined to get model from collection, like `get("dependent[0].fname")`');
        equal(emp.get('dependents[1].fname'), emp.get('dependents').at(1).get('fname'));
        equal(emp.get('works_for.controls[0].locations[0].zip'), 94404);
        equal(emp.get('works_for.controls[0].locations[0].zip'), emp.get('works_for').get('controls').at(0).get('locations').at(0).get('zip'));
        deepEqual(emp.get('works_for.locations[1]').toJSON(), emp.get('works_for').get('locations').at(1).toJSON());

        equal(emp.get('dependents[1000].fname'), undefined, "result should be `undefined` if indexed model in not present in collection");

        equal(emp.get('works_for.unknown'), undefined, "result should be `undefined` if attribute is not available");
        equal(emp.get("1"), undefined);
        equal(emp.get('dependents[1]."1"'), undefined);
        equal(emp.get('works_for.""'), undefined);
    });


    test("nested set", 6, function () {
        equal(emp.get('works_for.name'), 'R&D');
        emp.set('works_for.name', 'Marketing');
        equal(emp.get('works_for.name'), 'Marketing');


        emp.set('works_for.locations[0].zip', 94403);
        equal(emp.get('works_for.locations[0].zip'), 94403, "nested `set` for model in collection should be same as normal `set`");

        emp.set('dependents[0].sex', 'X', {validate:true});//validate test
        notEqual(emp.get('dependents[0].sex'), 'X', "validate test should be passed in nested `set` while `validate:true` is passed");

        emp.set({
            'designation':'Senior Manager',
            'works_for.controls[0].locations[0].zip':90909,
            'dependents[1000].fname':'outofindex',
            'dependents[1].fname':'John'
        });
        equal(emp.get('dependents[1].fname'), 'John');

        emp.on('change:works_for.name', function () {
            ok(false);
        });
        emp.set({
            'works_for.name':'Marketing'
        }, {silent:true});
        emp.set({
            'wrongpath.path2.works_for.name':'mip'
        });
        ok(true);
    });

    test("function can also be passed as value of attribute on set", 2, function () {
        var dept2 = function () {
            return {
                name:"Marketing",
                number:"24"
            };
        };
        equal(emp.get("works_for").get("name"), "R&D", "department name should be R&D");
        emp.set({"works_for":dept2});
        equal(emp.get("works_for").get("name"), "Marketing", "department name should be set to Marketing");
    });

    test("unset", 3, function () {
        emp.get('works_for').unset('locations');
        equal(emp.get('works_for').get('locations'), void 0, "locations should be void");

        emp.unset('works_for.locations');
        equal(emp.get('works_for.locations'), void 0, "locations should be void");
        emp.unset('dependents');
        equal(emp.get('dependents'), void 0, "`dependents` should be unset");
    });

    test("setDefaults", 2, function () {
        emp.get("works_for").set({'number':5});
        equal(emp.get("works_for").get('number'), 5, "number has new value");
        emp.set({"works_for":dept1.defaults});
        equal(emp.get("works_for").get('number'), -1, "number has default value");
    });

    test("escape", 1, function () {
        emp.get('works_for').get("locations").at(0).set({'add1':'<a>New Address</a>'});
        equal(_.escape(emp.get('works_for').get("locations").at(0).get("add1")), '&lt;a&gt;New Address&lt;&#x2F;a&gt;', "City should be in HTML-escaped version");
    });

    test("has", 5, function () {
        ok(emp.get("works_for").get("locations").at(0).has('add2') == false, "Add2 is undefined in department address");
        strictEqual(emp.has("works_for.locations[0].add2"), false);
        emp.get("works_for").get("locations").at(0).set({'add2':'Add2 value'});
        strictEqual(emp.has("works_for.locations[0].add2"), true);
        strictEqual(emp.get("works_for.locations").at(0).has('add2'), true, "Add2 is defined in department address");
        strictEqual(emp.has('add2'), false, "Add2 is undefined in patient");
    });

    test("validate", 2, function () {
        emp.get('dependents').at(0).set({sex:"X"}, {validate:true});
        equal(emp.get('dependents').at(0).get('sex'), 'F', "sex validation prevents values other than M & F");
        emp.get('dependents').at(0).set({sex:"M"}, {validate:true});
        equal(emp.get('dependents').at(0).get('sex'), 'M', "sex validation allows legal values - M & F");
    });

    test("clear", 2, function () {
        emp.clear();
        equal(emp.get('works_for'), void 0, "Deparment should be set to undefined");
        equal(emp.get('dependents'), void 0, "Dependents should be undefined");
    });

    test("clone", 7, function () {
        var emp2 = emp.clone();
        equal(emp.get('fname'), 'John');
        equal(emp.get('works_for').get('name'), 'R&D');
        equal(emp2.get('fname'), emp.get('fname'), "fname should be the same on the clone.");
        equal(emp2.get('works_for').get('name'), emp.get('works_for').get('name'), "name of department should be the same on the clone.");
        deepEqual(emp.toJSON(), emp2.toJSON(), "emp should be the same on the clone");
        emp.set({
            works_for:{
                name:'Marketing',
                number:'24'
            }
        });
        equal(emp.get('works_for').get('name'), 'Marketing');
        equal(emp2.get('works_for').get('name'), 'R&D', "Changing a parent attribute does not change the clone.");
    });

    test("change, hasChanged, changedAttributes, previous, previousAttributes", 8, function () {

        emp.on('change', function () {
            ok(emp.hasChanged('works_for'), "emp->change, employee has changed");
        });
        emp.on('change:works_for', function () {
            equal(true, emp.hasChanged());
            equal(true, emp.hasChanged('works_for'));
            equal(emp.get('works_for').hasChanged(), false, '`hasChanged` for `works_for` returns false as it is new object');
            equal(emp.hasChanged('works_for'), true);
            equal(emp.get('works_for').changedAttributes(), false, 'changedAttributes for `works_for` returns false as it is new object');
            equal(emp.previous('works_for').get('name'), 'R&D');
            equal(emp.previousAttributes().works_for.get('name'), 'R&D', 'previousAttributes is correct');
        });
        emp.set('works_for', {name:'Marketing', number:'24'});
    });

    test("change : second model of nested collection", 1, function () {

        dept1.on('change:locations[0]', function() {
            ok(false, 'First model in nested collection should not change');
        });
        dept1.on('change:locations[1]', function() {
            ok(true, 'Second model in nested collection should change');
        });
        loc2.set('zip', '97008');
    });

    test("change : all attributes get updated in an atomic operation", 8, function () {
        emp.on('change', function () {
            equal(emp.get('works_for').get('name'), 'Marketing');
            equal(emp.get('works_for').get('number'), '24');
            equal(emp.previous('works_for').get('name'), 'R&D');
            equal(emp.previous('works_for').get('number'), '23');

        });
        emp.on('change:works_for', function () {
            equal(emp.get('works_for').get('name'), 'Marketing');
            equal(emp.get('works_for').get('number'), '24');
            equal(emp.previous('works_for').get('name'), 'R&D');
            equal(emp.previous('works_for').get('number'), '23');
        });
        emp.set('works_for', {name:'Marketing', number:'24'});
    });

    test("change : all attributes get updated in an atomic operation for AssociatedModel properties ", 14, function () {
        emp.on('change', function () {
            equal(emp.get('lname'), 'Bond');
            equal(emp.get('fname'), 'James');
            equal(emp.previous('fname'), 'John');
            equal(emp.previous('lname'), 'Smith');
            equal(emp.get('works_for').get('number'), '24');
            equal(emp.previous('works_for').get('name'), 'R&D');
            equal(emp.previous('works_for').get('number'), 23);

        });
        emp.on('change:works_for', function () {
            equal(emp.get('lname'), 'Bond');
            equal(emp.get('fname'), 'James');
            equal(emp.previous('fname'), 'John');
            equal(emp.previous('lname'), 'Smith');
            equal(emp.get('works_for').get('number'), '24');
            equal(emp.previous('works_for').get('name'), 'R&D');
            equal(emp.previous('works_for').get('number'), 23);

        });
        emp.set({works_for:{name:'Marketing', number:'24'}, fname:"James", lname:"Bond"});

    });

    test("child `change`", 17, function () {

        emp.on('change', function () {
            ok(true, "Fired emp change...");
        });
        emp.on('change:works_for', function () {
            ok(true, "Fired emp change:works_for...");
        });
        emp.on('change:works_for.name', function () {
            equal(true, emp.get("works_for").hasChanged());
            equal(true, emp.hasChanged());
            equal(true, emp.hasChanged("works_for"));
            var changed = emp.changedAttributes();
            deepEqual(changed['works_for'].toJSON(), emp.get("works_for").toJSON());
            equal(emp.get("works_for").previousAttributes()["name"], "R&D");
            equal(emp.get("works_for").previous("name"), "R&D");

            var diff = emp.get('works_for').toJSON();
            diff.locations[0].zip = 94405;
            changed = emp.get('works_for').changedAttributes(diff);
            equal(changed.locations[0].zip, 94405);

            ok(true, "Fired emp change:works_for.name...");
        });

        emp.get('works_for').on('change', function () {
            ok(true, "Fired works_for change...");
        });
        emp.get('works_for').on('change:name', function () {
            ok(true, "Fired works_for dept:name change...");
        });

        emp.get('works_for').get('locations').at(0).on('change:zip', function () {
            ok(true, "Fired works_for locations0:zip change...");
        });

        emp.get('works_for').get('locations').at(0).on('change', function () {
            ok(true, "Fired works_for locations0 change...");
        });

        emp.set({'works_for.name':'Marketing'});//4+7
        emp.set('works_for', {name:"Marketing", number:29});//2
        emp.set('works_for', undefined);//2
        emp.set('works_for', dept1);//2
        emp.set('works_for', dept1);//0
    });

    test("child `change in collection`", 14, function () {
        emp.get('works_for').get('locations').at(0).on('change:zip', function () {
            ok(true, "Fired works_for locations0:zip change...");
        });
        emp.get('works_for').get('locations').at(0).on('change', function () {
            equal(true, emp.get('works_for').hasChanged());
            equal(true, emp.hasChanged());
            var changed = emp.get('works_for').changedAttributes();
            equal(changed['locations'].at(0).changed['zip'], 94403);
            equal(changed['controls'].at(0).changed['locations'].at(0).changed['zip'], 94403);
            ok(true, "Fired works_for locations0 change...");
        });

        emp.get('works_for').on('change:locations[0].zip', function () {
            ok(true, "Fired emp.works_for change:locations[0].zip...");
        });

        emp.get('works_for').on('change:locations[0]', function () {
            ok(true, "Fired emp.works_for change:locations[0]...");
        });

        emp.on('change:works_for.locations[0].zip', function () {
            ok(true, "Fired emp change:works_for.locations[0].zip...");
        });

        emp.on('change:works_for.locations[0]', function () {
            ok(true, "Fired emp change:works_for.locations[0]...");
        });


        emp.on('change:works_for.controls[0].locations[0].zip', function () {
            ok(true, "Fired emp change:works_for.controls[0].locations[0].zip...");
        });

        emp.on('change:works_for.controls[0].locations[0]', function () {
            ok(true, "Fired emp change:works_for.controls[0].locations[0]...");
        });

        emp.get('works_for').on('change:controls[0].locations[0].zip', function () {
            ok(true, "Fired emp.works_for change:controls[0].locations[0].zip...");
        });

        emp.get('works_for').on('change:controls[0].locations[0]', function () {
            ok(true, "Fired emp.works_for change:controls[0].locations[0]...");
        });

        emp.get('works_for').get("locations").at(0).set('zip', 94403);//10 + 4
    });


    test("add multiple refs to the same collection", 6, function () {

        project2.get("locations").add(loc1);
        project2.get("locations").add(loc1); //add it twice deliberately

        emp.on('change:works_for.controls[0].locations[0].zip', function (event) {
            ok(true, "Fired emp > change:works_for.controls[0].locations[0].zip");
        });

        emp.on('change:works_for.controls[0].locations[0]', function (event) {
            ok(true, "Fired emp > change:works_for.controls[0].locations[0]");
        });

        emp.on('change:works_for.controls[1].locations[1].zip', function (event) {
            ok(true, "Fired emp > change:works_for.controls[1].locations[1].zip");
        });

        emp.on('change:works_for.controls[1].locations[1]', function (event) {
            ok(true, "Fired emp > change:works_for.controls[1].locations[1]");
        });


        emp.on('change:works_for.locations[0].zip', function (event) {
            ok(true, "Fired emp > change:works_for.locations[0].zip");
        });

        emp.on('change:works_for.locations[0]', function (event) {
            ok(true, "Fired emp > change:works_for.locations[0]");
        });

        emp.get('works_for').get("locations").at(0).set('zip', 94403);

    });

    test("child `raise nested events: Issue #15`", 6, function () {

        emp.on('change', function () {
            ok(true, "Fired emp change...");
        });
        emp.on('change:works_for', function () {
            ok(true, "Fired emp change:works_for...");
        });
        emp.on('change:works_for.name', function () {
            ok(true, "Fired emp change:works_for.name...");
        });
        emp.on('change:works_for.number', function () {
            ok(true, "Fired emp change:works_for.number...");
        });
        emp.on('nestedevent:works_for', function () {
            ok(true, "Fired emp nestedevent:works_for...");
        });


        emp.get('works_for').on('change', function () {
            emp.get('works_for').trigger("nestedevent", arguments);
            ok(true, "Fired works_for change...");
        });
        emp.get('works_for').on('change:name', function () {
            ok(true, "Fired works_for dept:name change...");
        });
        emp.get('works_for').on('nestedevent', function () {
            ok(true, "Fired works_for nestedevent...");
        });

        emp.get('works_for').set({name:"Marketing"});//6

    });

    test("child `add`", 19, function () {

        /*emp.on('all',function(event){
         ok(true,"Fired emp " + event);
         });

         emp.get('dependents').on('all',function(event){
         ok(true,"Fired emp.dependents " + event);
         });
         emp.get('dependents').at(0).on('all',function(event){
         ok(true,"Fired emp.dependents.at(0) " + event);
         });*/

        emp.on('add', function () {
            ok(true, "Fired emp change...");
        });
        emp.on('add:dependents', function () {
            ok(true, "Fired emp add:dependents...");
        });
        emp.on('remove:dependents', function () {
            ok(true, "Fired emp remove:dependents...");
        });
        emp.on('reset:dependents', function () {
            ok(true, "Fired emp reset:dependents...");
        });
        emp.on('change:dependents[0].age', function () {
            ok(true, "Fired emp change:dependents[0].age...");
        });
        emp.on('change:dependents[0]', function () {
            ok(true, "Fired emp change:dependents[0]...");
        });


        emp.get('dependents').on('change', function () {
            ok(true, "Fired dependents change...");
        });
        emp.get('dependents').on('change:age', function () {
            ok(true, "Fired dependents change:age...");
        });
        emp.get('dependents').at(0).on('change', function () {
            ok(true, "Fired at0 dependents change...");
        });
        emp.get('dependents').at(0).on('change:age', function () {
            ok(true, "Fired at0 dependents change:age...");
        });
        emp.get('dependents').at(0).on('remove', function () {
            ok(true, "Fired at0 dependents remove...");
        });
        emp.get('dependents').on('add', function () {
            ok(true, "Fired dependents add...");
        });
        emp.get('dependents').on('remove', function () {
            ok(true, "Fired dependents remove...");
        });
        emp.get('dependents').on('reset', function () {
            ok(true, "Fired dependents reset...");
        });

        emp.get("dependents").at(0).set({age:15});//6

        emp.get("dependents").add(child2);//2
        emp.get("dependents").add([child3, child4]);//4
        emp.get("dependents").remove([child1, child4]);//5
        emp.get("dependents").reset();//2

    });

    test("Check clone while assigning prev attributes in event bubble-up",1,function(){
        emp.set({"works_for":dept1});
        emp.get('works_for').set({name:"Marketing"});

        emp.on('change:works_for', function () {
            equal(emp.previous("works_for").get("name"), "Marketing");
        });

        emp.set('works_for', undefined);

    });

    test("toJSON", 2, function () {
        var json1 = emp.get('dependents').toJSON();
        var rawJson1 = [
            {"fname":"Jane", "lname":"Smith", "sex":"F", "age":0, "relationship":"C"},
            {"fname":"Edgar", "lname":"Smith", "sex":"M", "age":0, "relationship":"P"}
        ];
        deepEqual(json1, rawJson1, "collection.toJSON() and json object are identical");

        var json2 = emp.toJSON();
        var rawJson2 = {"works_for":{"controls":[
            {"locations":[
                {"add1":"P.O Box 3899", "add2":null, "zip":"94404", "state":"CA"}
            ], "name":"Project X", "number":"2"},
            {"locations":[
                {"add1":"P.O Box 4899", "add2":null, "zip":"95502", "state":"CA"}
            ], "name":"Project Y", "number":"2"}
        ], "locations":[
            {"add1":"P.O Box 3899", "add2":null, "zip":"94404", "state":"CA"},
            {"add1":"P.O Box 4899", "add2":null, "zip":"95502", "state":"CA"}
        ], "name":"R&D", "number":"23"}, "dependents":[
            {"fname":"Jane", "lname":"Smith", "sex":"F", "age":0, "relationship":"C"},
            {"fname":"Edgar", "lname":"Smith", "sex":"M", "age":0, "relationship":"P"}
        ], "sex":"M", "age":21, "fname":"John", "lname":"Smith", "manager":null};
        deepEqual(json2, rawJson2, "model.toJSON() and json object are identical");
    });

    test("Collection `length`", 2, function () {
        child2 = new Dependent({
            fname:"Greg",
            lname:"Smith",
            sex:"M",
            relationship:"C"
        });
        equal(emp.get("dependents").length, 2, "dependents.length should be 2");
        emp.get("dependents").add(child2);
        equal(emp.get("dependents").length, 3, "dependents.length should be 3");
    });

    test("Collection `reset`", 3, function () {
        child2 = new Dependent({
            fname:"Greg",
            lname:"Smith",
            sex:"M",
            relationship:"C"
        });
        emp.get("dependents").on("reset", function () {
            ok(true, "Fired `reset` event for dependents...");
        });
        emp.get("dependents").add(child2);
        equal(emp.get("dependents").length, 3, "dependents.length should be 3");
        emp.get("dependents").reset();
        equal(emp.get("dependents").length, 0, "dependents.length should be set to 0");
    });

    test("Self-Reference", function () {
        var emp2 = new Employee({'fname':'emp2'});

        emp2.on('change:manager', function () {
            ok(true, "`change:manager` fired...");
        });

        emp2.set({'manager':emp2});
        emp2.get("manager").on('change', function () {
            ok(true, "`change` on manager fired...");
        });

        emp2.get('manager').set({'fname':'newEmp2'});
        equal(emp2.get('fname'), 'newEmp2', "emp's fname should be canged");
        equal(emp2.get('manager').get('fname'), 'newEmp2', "manager's fname should be canged");
    });

    test("Self-Reference `toJSON`", function () {
        var emp2 = new Employee({'fname':'emp2'});
        emp2.set({'manager':emp2});
        var rawJson = {
            "works_for":{
                "controls":[],
                "locations":[],
                "name":"",
                "number":-1
            },
            "dependents":[],
            "sex":"M",
            "age":0,
            "fname":"emp2",
            "lname":"",
            "manager":undefined
        };
        deepEqual(emp2.toJSON(), rawJson, "emp2.toJSON() is identical as rawJson");
    });

    test("Defaults clear", function () {
        emp.set(
            {
                works_for:{
                    name:'Marketing',
                    number:'5'
                }
            }
        );
        equal(emp.get('works_for').get('number'), '5');
        emp.set(
            {
                works_for:{
                    name:'R&D'
                }
            }
        );
        equal(emp.get('works_for').get('number'), -1);
        equal(emp.get('works_for').get('type'), void 0);

    });

    test("save", 1, function () {
        emp = new Backbone.Model();
        emp.sync = function (method, model, options) {
            options.success(this, null, options);
        };
        emp.save(null, {
            success:function () {
                ok(true, "success in model save");
            },
            error:function () {
                ok(true, "error in model save");
            }
        });
    });

    test("validate after save", 1, function () {
        var lastError = null;
        emp.sync = function (method, model, options) {
            options.success(this, {sex:'O'}, options);
        };
        //Backbone 0.9.9
        emp.on('invalid', function (model, error) {
            lastError = error;
        });
        emp.save(null, {
            //Backbone 0.9.2
            error:function (model, error) {
                lastError = error;
            }
        });
        equal(lastError, "invalid sex value");
    });

    test("`change:attr` and `change` event with options", 3, function () {
        emp.on("change", function (employeeModel, options) {
            equal(employeeModel.get("fname"), emp.get("fname"));
        });
        emp.on("change:works_for", function (employeeModel, changedWorksFor, options) {
            equal(employeeModel.get("fname"), emp.get("fname"));
            equal(changedWorksFor, void 0);
        });
        emp.set({
            lname:'Hanks',
            works_for:undefined
        });
    });


    test("relation's options : parse", 3, function () {
        //relation options with `set`
        var NewEmployee = Employee.extend({
            parse:function (obj) {
                if (obj.sex === "M") {
                    obj.prefix = "Mr.";
                }
                return obj;
            }
        });
        var emp2 = new NewEmployee({
            fname:"Tom",
            lname:"Hanks",
            age:45,
            sex:"M"
        }, {parse:true});
        equal(emp2.get("prefix"), "Mr.", "Prefix of emp2 should be 'Mr.'");

        //relation options with `fetch`
        var Company = Backbone.AssociatedModel.extend({
            url:"/company",
            relations:[
                {
                    type:Backbone.Many,
                    relatedModel:NewEmployee,
                    key:'employees',
                    options:{
                        parse:true,
                        add:true
                    }
                }
            ],
            defaults:{
                name:'',
                employees:null
            },
            //proxy for server
            sync:function (method, model, options) {
                return options.success(this, {
                    name:'c-name',
                    employees:[
                        {
                            fname:"John",
                            lname:"Smith",
                            age:21,
                            sex:"M"
                        }
                    ]
                }, options);
            }
        });
        var company = new Company();
        company.fetch({
            success:function (model, response) {
                equal(model.get("name"), "c-name", "Company name should be c-name");
                equal(model.get("employees").at(0).get('prefix'), "Mr.", "Prefix of male employees of company should be Mr.");
            }
        });
    });

    test("`visited` flag results in wrong toJSON output in event callback : issue #3", 3, function () {
        var dependents = emp.get("dependents");
        dependents.reset();
        var json = {"fname":"Jane", "lname":"Smith", "sex":"F", "age":0, "relationship":"C"};
        emp.on("change:fname", function (model) {
            equal("Tom", model.toJSON().fname, "fname of `model.toJSON()` should be Tom");
        });
        dependents.on("add", function (model) {
            deepEqual(json, model.toJSON());
            deepEqual(json, model.clone().toJSON());
        });
        emp.set({"fname":"Tom"});
        dependents.add(child1);
    });

    test("Saving child of Model in Collection result in improper overwrite on return : issue#17", 2, function () {
        var Child = Backbone.AssociatedModel.extend({
            defaults:{
                favoriteToy:"",
                color:""
            },
            //proxy for save success
            sync:function (method, model, options) {
                options.success(this, null, options);
            }
        });

        var Parent = Backbone.AssociatedModel.extend({
            relations:[
                {
                    type:Backbone.One,
                    key:"child",
                    relatedModel:Child
                }
            ],
            defaults:{
                career:"",
                address:"",
                child:null
            }
        });

        var Collection = Backbone.Collection.extend({
            model:Parent
        });

        var collection = new Collection(
            [
                {
                    id:1,
                    career:"Writer",
                    address:"Baker Street",
                    child:{
                        id:1,
                        favoriteToy:"Plane",
                        color:"white"
                    }
                }
            ]);
        var parent = collection.get(1);
        parent.get("child").save({"color":"blue"}, {
            success:function () {
                ok("collection : ", JSON.stringify(collection, null, 4));
                ok("collection.get(1) : ", JSON.stringify(collection.get(1), null, 4));
            }
        });
    });

    module("Cyclic Graph", {
        setup:function () {
            node1 = new Node({name:'n1'});
            node2 = new Node({name:'n2'});
            node3 = new Node({name:'n3'});
        }
    });

    test("set,trigger", 13, function () {
        node1.on("change:parent", function () {
            node1.trigger("nestedevent", arguments);
            ok(true, "node1 change:parent fired...");
        });
        node2.on("change:parent", function () {
            ok(true, "node2 change:parent fired...");
        });
        node3.on("change:parent", function () {
            ok(true, "node3 change:parent fired...");
        });

        node1.on("change:children", function () {
            ok(true, "node1 change:children fired...");
        });
        node2.on("change:children", function () {
            ok(true, "node2 change:children fired...");
        });
        node3.on("change:children", function () {
            ok(true, "node3 change:children fired...");
        });

        node1.on("nestedevent", function () {
            ok(true, "node1 nestedevent fired...");
        });
        node1.on("nestedevent:parent.children", function () {
            ok(true, "node1 nestedevent:parent.children fired...");
        });
        node2.on("nestedevent:children", function () {
            ok(true, "node2 nestedevent:children fired...");
        });
        node3.on("nestedevent", function () {
            ok(true, "node3 nested fired...");
        });

        node1.on("change:children[0]", function () {
            ok(true, "node1 change:children[0] fired...");
        });
        node2.on("change:children[0]", function () {
            ok(true, "node2 change:children[0] fired...");
        });
        node3.on("change:children[0]", function () {
            ok(true, "node3 change:children[0] fired...");
        });


        //For all the events which could possibly fire
        /*node2.on('all',function(event){
         ok(true,"node2 " + event);
         });
         node1.on('all',function(event){
         ok(true,"node1 " + event);
         });
         node3.on('all',function(event){
         ok(true,"node3 " + event);
         });*/


        node1.set({parent:node2, children:[node3]});//2+1
        node2.set({parent:node3, children:[node1]});//4+2
        node3.set({parent:node1, children:[node2]});//4
    });

    test("toJSON", 1, function () {
        node1.set({parent:node2, children:[node3]});
        node2.set({parent:node3, children:[node1]});
        node3.set({parent:node1, children:[node2]});
        var rawJSON = {
            "name":"n1",
            "children":[
                {
                    "name":"n3",
                    "children":[
                        {
                            "name":"n2",
                            "children":[],
                            "parent":undefined
                        }
                    ],
                    "parent":undefined
                }
            ],
            "parent":{
                "name":"n2",
                "children":[],
                "parent":{
                    "name":"n3",
                    "children":[],
                    "parent":undefined
                }
            }
        };
        deepEqual(node1.toJSON(), rawJSON);
    });

    test("clone", 6, function () {
        node1.set({parent:node2, children:[node3]});
        var cloneNode = node1.clone();
        equal(node1.get('name'), cloneNode.get('name'), 'name of node should be same as clone');
        equal(node1.get('parent').get('name'), cloneNode.get('parent').get('name'), 'name of node should be same as clone');
        cloneNode.set({name:'clone-n1'});
        equal(node1.get('name'), 'n1', 'name of node1 should be `n1`');
        equal(cloneNode.get('name'), 'clone-n1', 'name of node should be `clone-n1`');

        cloneNode.get('parent').set({name:'clone-n2'});
        equal(node1.get('parent').get('name'), 'n2', "name of node1's parent should be `n2`");
        equal(cloneNode.get('parent').get('name'), 'clone-n2', "name of node1's parent should be `clone-n2`");
    });

    module("Examples", {
        setup:function () {

            emp = new Employee({
                fname:"John",
                lname:"Smith",
                age:21,
                sex:"M"
            });

            child1 = new Dependent({
                fname:"Jane",
                lname:"Smith",
                sex:"F",
                relationship:"C"

            });

            child2 = new Dependent({
                fname:"Barbara",
                lname:"Ruth",
                sex:"F",
                relationship:"C"

            });

            child3 = new Dependent({
                fname:"Gregory",
                lname:"Smith",
                sex:"M",
                relationship:"C"

            });

            child4 = new Dependent({
                fname:"Jane",
                lname:"Doe",
                sex:"F",
                relationship:"C"

            });

            parent1 = new Dependent({
                fname:"Edgar",
                lname:"Smith",
                sex:"M",
                relationship:"P"

            });

            loc1 = new Location({
                add1:"P.O Box 3899",
                zip:"94404",
                state:"CA"

            });

            loc2 = new Location({
                add1:"P.O Box 4899",
                zip:"95502",
                state:"CA"
            });

            project1 = new Project({
                name:"Project X",
                number:"2"
            });

            project2 = new Project({
                name:"Project Y",
                number:"2"
            });

            project2.get("locations").add(loc2);
            project1.get("locations").add(loc1);

            dept1 = new Department({
                name:"R&D",
                number:"23"
            });

            dept1.set({locations:[loc1, loc2]});
            dept1.set({controls:[project1, project2]});

            emp.set({"dependents":[child1, parent1]});
        }
    });

    test("example-1", 42, function () {
        emp.once('change', function () {
            console.log("Fired emp > change...");
            ok("Fired emp > change...");
            equal(true, emp.hasChanged());
            equal(true, emp.hasChanged("works_for"));
        });
        emp.once('change:works_for', function () {
            ok("Fired emp > change:works_for...");
            console.log("Fired emp > change:works_for...");
            var changed = emp.changedAttributes();
            deepEqual(changed['works_for'].toJSON(), emp.get("works_for").toJSON());
            equal(emp.previousAttributes()['works_for'].get('name'), "");
            equal(emp.previousAttributes()['works_for'].get('number'), -1);
            equal(emp.previousAttributes()['works_for'].get('locations').length, 0);
            equal(emp.previousAttributes()['works_for'].get('controls').length, 0);
        });

        emp.set({"works_for":dept1});//9

        emp.get('works_for').on('change', function () {
            console.log("Fired emp.works_for > change...");
            ok("Fired emp.works_for > change...");
            equal(true, emp.get("works_for").hasChanged());
            equal(emp.get("works_for").previousAttributes()["name"], "R&D");
        });
        emp.get('works_for').on('change:name', function () {
            console.log("Fired emp.works_for > change:name...");
            ok("Fired emp.works_for > change:name...");

        });

        emp.on('change:works_for.name', function () {
            console.log("Fired emp > change:works_for.name...");
            ok("Fired emp > change:works_for.name...");
            equal(true, emp.get("works_for").hasChanged());
            equal(true, emp.hasChanged());
            equal(true, emp.hasChanged("works_for"));
            deepEqual(emp.changedAttributes()['works_for'].toJSON(), emp.get("works_for").toJSON());
            equal(emp.get("works_for").previousAttributes()["name"], "R&D");
            equal(emp.get("works_for").previous("name"), "R&D");
        });

        emp.on('change:works_for', function () {
            console.log("Fired emp > change:works_for...");
            ok("Fired emp > change:works_for...");
            equal(true, emp.hasChanged());
            equal(true, emp.hasChanged("works_for"));
            deepEqual(emp.changedAttributes()['works_for'].toJSON(), emp.get("works_for").toJSON());
            equal(emp.previousAttributes().works_for.name, "R&D");
        });

        emp.get('works_for').set({name:"Marketing"});//17

        emp.get('works_for').get('locations').at(0).on('change:zip', function () {
            console.log("Fired emp.works_for.locations[0] > change:zip...");
            ok("Fired emp.works_for.locations[0] > change:zip...");
        });

        emp.get('works_for').get('locations').at(0).on('change', function () {
            console.log("Fired emp.works_for.locations[0] > change...");
            ok("Fired emp.works_for.locations[0] > change...");
        });

        emp.get('works_for').on('change:locations[0].zip', function () {
            console.log("Fired emp.works_for > change:locations[0].zip...");
            ok("Fired emp.works_for > change:locations[0].zip...");
        });

        emp.get('works_for').on('change:locations[0]', function () {
            console.log("Fired emp.works_for > change:locations[0]...");
            ok("Fired emp.works_for > change:locations[0]...");
        });

        emp.on('change:works_for.locations[0].zip', function () {
            console.log("Fired emp > change:works_for.locations[0].zip...");
            ok("Fired emp > change:works_for.locations[0].zip...");
        });

        emp.on('change:works_for.locations[0]', function () {
            console.log("Fired emp > change:works_for.locations[0]...");
            ok("Fired emp > change:works_for.locations[0]...");
        });


        emp.on('change:works_for.controls[0].locations[0].zip', function () {
            console.log("Fired emp > change:works_for.controls[0].locations[0].zip...");
            ok("Fired emp > change:works_for.controls[0].locations[0].zip...");
        });

        emp.on('change:works_for.controls[0].locations[0]', function () {
            console.log("Fired emp > change:works_for.controls[0].locations[0]...");
            ok("Fired emp > change:works_for.controls[0].locations[0]...");
        });

        emp.get('works_for').on('change:controls[0].locations[0].zip', function () {
            console.log("Fired emp.works_for > change:controls[0].locations[0].zip...");
            ok("Fired emp.works_for > change:controls[0].locations[0].zip...");
        });

        emp.get('works_for').on('change:controls[0].locations[0]', function () {
            console.log("Fired emp.works_for > change:controls[0].locations[0]...");
            ok("Fired emp.works_for > change:controls[0].locations[0]...");
        });

        emp.get('works_for').get("locations").at(0).set('zip', 94403);//10


        emp.on('add:dependents', function () {
            console.log("Fired emp > add:dependents...");
            ok("Fired emp > add:dependents...");
        });
        emp.on('remove:dependents', function () {
            console.log("Fired emp > remove:dependents...");
            ok("Fired emp > remove:dependents...");
        });
        emp.on('reset:dependents', function () {
            console.log("Fired emp > reset:dependents...");
            ok("Fired emp > reset:dependents...");
        });

        emp.get('dependents').on('add', function () {
            console.log("Fired emp.dependents add...");
            ok("Fired emp.dependents add...");
        });
        emp.get('dependents').on('remove', function () {
            console.log("Fired emp.dependents remove...");
            ok("Fired emp.dependents remove...");
        });
        emp.get('dependents').on('reset', function () {
            console.log("Fired emp.dependents reset...");
            ok("Fired emp.dependents reset...");
        });

        //6 events
        emp.get("dependents").add(child2);
        emp.get("dependents").remove([child1]);
        emp.get("dependents").reset();

        equal(emp.get('works_for.controls[0].locations[0].zip'), emp.get('works_for').get('controls').at(0).get('locations').at(0).get('zip'));

    });

    test("example-2", 41, function () {
        var listener = {};
        _.extend(listener, Backbone.Events);

        listener.listenTo(emp, 'change', function () {
            console.log("Fired emp > change...");
            ok("Fired emp > change...");
            equal(true, emp.hasChanged());
            equal(true, emp.hasChanged("works_for"));
        });
        listener.listenTo(emp, 'change:works_for', function () {
            ok("Fired emp > change:works_for...");
            console.log("Fired emp > change:works_for...");
            var changed = emp.changedAttributes();
            deepEqual(changed['works_for'].toJSON(), emp.get("works_for").toJSON());
            equal(emp.previousAttributes()['works_for'].get('name'), "");
            equal(emp.previousAttributes()['works_for'].get('number'), -1);
            equal(emp.previousAttributes()['works_for'].get('locations').length, 0);
            equal(emp.previousAttributes()['works_for'].get('controls').length, 0);
        });

        emp.set({"works_for":dept1});//9

        listener.stopListening();

        listener.listenTo(emp.get('works_for'), 'change', function () {
            console.log("Fired emp.works_for > change...");
            ok("Fired emp.works_for > change...");
            equal(true, emp.get("works_for").hasChanged());
            equal(emp.get("works_for").previousAttributes()["name"], "R&D");
        });
        listener.listenTo(emp.get('works_for'), 'change:name', function () {
            console.log("Fired emp.works_for > change:name...");
            ok("Fired emp.works_for > change:name...");

        });

        listener.listenTo(emp, 'change:works_for.name', function () {
            console.log("Fired emp > change:works_for.name...");
            ok("Fired emp > change:works_for.name...");
            equal(true, emp.get("works_for").hasChanged());
            equal(true, emp.hasChanged());
            equal(true, emp.hasChanged("works_for"));
            deepEqual(emp.changedAttributes()['works_for'].toJSON(), emp.get("works_for").toJSON());
            equal(emp.get("works_for").previousAttributes()["name"], "R&D");
            equal(emp.get("works_for").previous("name"), "R&D");
        });

        listener.listenTo(emp, 'change:works_for', function () {
            console.log("Fired emp > change:works_for...");
            ok("Fired emp > change:works_for...");
            equal(true, emp.hasChanged());
            equal(true, emp.hasChanged("works_for"));
            deepEqual(emp.changedAttributes()['works_for'].toJSON(), emp.get("works_for").toJSON());
            equal(emp.previousAttributes().works_for.name, "R&D");
        });

        emp.get('works_for').set({name:"Marketing"});//17

        listener.listenTo(emp.get('works_for').get('locations').at(0), 'change:zip', function () {
            console.log("Fired emp.works_for.locations[0] > change:zip...");
            ok("Fired emp.works_for.locations[0] > change:zip...");
        });

        listener.listenTo(emp.get('works_for').get('locations').at(0), 'change', function () {
            console.log("Fired emp.works_for.locations[0] > change...");
            ok("Fired emp.works_for.locations[0] > change...");
        });

        listener.listenTo(emp.get('works_for'), 'change:locations[0].zip', function () {
            console.log("Fired emp.works_for > change:locations[0].zip...");
            ok("Fired emp.works_for > change:locations[0].zip...");
        });

        listener.listenTo(emp.get('works_for'), 'change:locations[0]', function () {
            console.log("Fired emp.works_for > change:locations[0]...");
            ok("Fired emp.works_for > change:locations[0]...");
        });

        listener.listenTo(emp, 'change:works_for.locations[0].zip', function () {
            console.log("Fired emp > change:works_for.locations[0].zip...");
            ok("Fired emp > change:works_for.locations[0].zip...");
        });

        listener.listenTo(emp, 'change:works_for.locations[0]', function () {
            console.log("Fired emp > change:works_for.locations[0]...");
            ok("Fired emp > change:works_for.locations[0]...");
        });


        listener.listenTo(emp, 'change:works_for.controls[0].locations[0].zip', function () {
            console.log("Fired emp > change:works_for.controls[0].locations[0].zip...");
            ok("Fired emp > change:works_for.controls[0].locations[0].zip...");
        });

        listener.listenTo(emp, 'change:works_for.controls[0].locations[0]', function () {
            console.log("Fired emp > change:works_for.controls[0].locations[0]...");
            ok("Fired emp > change:works_for.controls[0].locations[0]...");
        });

        listener.listenTo(emp.get('works_for'), 'change:controls[0].locations[0].zip', function () {
            console.log("Fired emp.works_for > change:controls[0].locations[0].zip...");
            ok("Fired emp.works_for > change:controls[0].locations[0].zip...");
        });

        listener.listenTo(emp.get('works_for'), 'change:controls[0].locations[0]', function () {
            console.log("Fired emp.works_for > change:controls[0].locations[0]...");
            ok("Fired emp.works_for > change:controls[0].locations[0]...");
        });

        emp.get('works_for').get("locations").at(0).set('zip', 94403);//10

        listener.listenTo(emp, 'add:dependents', function () {
            console.log("Fired emp > add:dependents...");
            ok("Fired emp > add:dependents...");
        });
        listener.listenTo(emp, 'remove:dependents', function () {
            console.log("Fired emp > remove:dependents...");
            ok("Fired emp > remove:dependents...");
        });
        listener.listenTo(emp, 'reset:dependents', function () {
            console.log("Fired emp > reset:dependents...");
            ok("Fired emp > reset:dependents...");
        });

        listener.listenTo(emp.get('dependents'), 'add', function () {
            console.log("Fired emp.dependents add...");
            ok("Fired emp.dependents add...");
        });
        listener.listenTo(emp.get('dependents'), 'remove', function () {
            console.log("Fired emp.dependents remove...");
            ok("Fired emp.dependents remove...");
        });
        listener.listenTo(emp.get('dependents'), 'reset', function () {
            console.log("Fired emp.dependents reset...");
            ok("Fired emp.dependents reset...");
        });
        //6 events
        emp.get("dependents").add(child2);
        emp.get("dependents").remove([child1]);
        emp.get("dependents").reset();
    });
});