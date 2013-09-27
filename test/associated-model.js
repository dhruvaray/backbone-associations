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
            id:-1,
            add1:"",
            add2:null,
            zip:"",
            state:""
        },
        urlRoot:'/location'
    });

    //location store
    var locations = new Backbone.Collection([
        new Location({id:3, add1:"loc3", state:"AL"}),
        new Location({id:4, add1:"loc4", state:"VA"}),
        new Location({id:5, add1:"loc5", state:"CA"}),
        new Location({id:6, add1:"loc6", state:"IN"}),
        new Location({id:7, add1:"loc7", state:"NY"}),
        new Location({id:8, add1:"loc8", state:"NY"})
    ]);

    var map2locs = function (ids) {

        if (ids instanceof Backbone.Collection) return ids;
        if (_.isArray(ids) && ids.length > 0) {
            if (_.isObject(ids[0])) //dummy logic to check whether array has ids or objects
                return ids;
        } else {
            if (_.isObject(ids))
                return ids;
        }

        ids = _.isArray(ids) ? ids.slice() : [ids];
        return _.map(ids, function (id) {
            var mapped = _.find(locations.models, function (m) {
                if (m.get('id') == id) return m;
            });
            return mapped ? mapped : id;
        });
    };

    var Project = Backbone.AssociatedModel.extend({
        relations:[
            {
                type:Backbone.Many,
                key:'locations',
                relatedModel:Location,
                map:map2locs
            }
        ],
        defaults:{
            name:"",
            number:0,
            locations:[]
        },
        urlRoot:'/project'
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
                relatedModel:Location,
                map:map2locs
            }
        ],
        defaults:{
            name:'',
            locations:[],
            number:-1,
            controls:[]
        },
        urlRoot:'/department'
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
        },
        urlRoot:'/dependent'
    });

    //dept store
    var store = new Backbone.Collection([new Department({number:99, name:"sales"}), new Department({number:100, name:"admin"})]);

    var map2dept = function (id) {

        if (id instanceof Department) return id;
        if (_.isObject(id)) return id;

        var found = _.find(store.models, function (m) {
            return m.get('number') == id
        });
        return found ? found : id;
    };

    Employee = Backbone.AssociatedModel.extend({
        relations:[
            {
                type:Backbone.One,
                key:'works_for',
                relatedModel:Department,
                map:map2dept
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
        },
        urlRoot:'/employee'
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
                state:"CA",
                id:"1"

            });

            loc2 = new Location({
                add1:"P.O Box 4899",
                zip:"95502",
                state:"CA",
                id:"2"
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

    test("VERSION", 1, function () {
        ok(Backbone.Associations.VERSION, "Backbone.Associations.VERSION exists");
    });

    test("SEPARATOR", 13, function () {
        // Change separator to `~`
        Backbone.Associations.SEPARATOR = "~";
        equal(Backbone.Associations.SEPARATOR, "~", "Backbone.Associations.SEPERATOR should be `~`");
        equal(emp.get('dependents[0]~fname'), emp.get('dependents').at(0).get('fname'));
        equal(emp.get('works_for~controls[0]~locations[0]~zip'), 94404);

        emp.once('change:works_for~controls[0]~locations[0]', function () {
            ok(true, "Fired emp change:works_for~controls[0]~locations[0]...");
        });

        emp.once('change:works_for~controls[*]~locations[*]', function () {
            ok(true, "Fired emp change:works_for~controls[*]~locations[*]...");
        });

        emp.once('change:works_for~controls[*]~locations[*]~zip', function () {
            ok(true, "Fired emp change:works_for~controls[*]~locations[*]~zip...");
        });

        emp.get('works_for').get("locations").at(0).set('zip', 94403); // 3

        // Change separator to `->`
        Backbone.Associations.SEPARATOR = "->";
        equal(Backbone.Associations.SEPARATOR, "->", "Backbone.Associations.SEPERATOR should be `->`");
        emp.get('works_for').on('change:locations[*]', function () {
            ok(true, "Fired emp.works_for change:locations[*]...");
        });

        emp.get('works_for').on('change:locations[0]->zip', function () {
            ok(true, "Fired emp.works_for change:locations[0].zip...");
        });

        emp.get('works_for').on('change:controls[0]->locations[0]->zip', function () {
            ok(true, "Fired emp.works_for change:controls[0]->locations[0]->zip...");
        });
        emp.get('works_for').get("locations").at(0).set('zip', 94405);
        equal(emp.get('works_for->controls[0]->locations[0]->zip'), 94405);
        equal(emp.get('dependents[0]->fname'), emp.get('dependents').at(0).get('fname'));

        // Change separator to `.`
        Backbone.Associations.SEPARATOR = ".";
        equal(Backbone.Associations.SEPARATOR, ".", "Backbone.Associations.SEPERATOR should be `.`");
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

    test("invalid relations", 4, function () {
        var em1 = Backbone.AssociatedModel.extend({
            relations:[
                {
                    type1:Backbone.One, //no type specified
                    key:'parent',
                    relatedModel:'Node'
                }
            ]
        });

        try {
            var emi1 = new em1;
            emi1.set('parent', {id:1});
        } catch (e) {
            equal(e.message === "type attribute must be specified and have the values Backbone.One or Backbone.Many", true)
        }

        var em2 = Backbone.AssociatedModel.extend({
            relations:[
                {
                    type:Backbone.Oxne, //wrong value of type
                    key:'parent',
                    relatedModel:'Node'
                }
            ]
        });

        try {
            var em2i = new em2;
            em2i.set('parent', {id:1});
        } catch (e) {
            equal(e.message === "type attribute must be specified and have the values Backbone.One or Backbone.Many", true)
        }

        var em3 = Backbone.AssociatedModel.extend({
            relations:[
                {
                    type:Backbone.One,
                    key:'parent',
                    collectionType:em2//no RelatedModel specified
                }
            ]
        });

        try {
            var em3i = new em3;
            em3i.set('parent', {id:1});
        } catch (e) {
            equal(e.message === "specify a relatedModel for Backbone.One type", true)
        }

        var Owner = Backbone.Model.extend();
        var House = Backbone.AssociatedModel.extend({
            relations:[
                {
                    type:Backbone.One,
                    key:'owner',
                    relatedModel:Owner
                }
            ]
        });
        var owner = new Owner;
        try {
            new House({owner:owner});
        } catch (e) {
            equal(e.message === "specify an AssociatedModel for Backbone.One type", true)
        }

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

        dept1.on('change:locations[0]', function () {
            ok(false, 'First model in nested collection should not change');
        });
        dept1.on('change:locations[1]', function () {
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
        emp.set({'works_for.name':'Marketing'});//4+7
        emp.set('works_for', {name:"Marketing", number:29});//2
        emp.set('works_for', undefined);//2
        emp.set('works_for', dept1);//2
        emp.set('works_for', dept1);//0
    });

    test("child `change in collection`", 18, function () {
        emp.get('works_for').get('locations').at(0).on('change:zip', function () {
            ok(true, "Fired works_for locations[0]:zip change...");
        });
        emp.get('works_for').get('locations').at(0).on('change', function () {
            equal(true, emp.get('works_for').hasChanged());
            equal(true, emp.hasChanged());
            var changed = emp.get('works_for').changedAttributes();
            equal(changed['locations'].at(0).changed['zip'], 94403);
            equal(changed['controls'].at(0).changed['locations'].at(0).changed['zip'], 94403);
            ok(true, "Fired works_for locations0 change...");
        });


        emp.get('works_for').on('change:locations[*]', function () {
            ok(true, "Fired emp.works_for change:locations[*]...");
        });

        emp.get('works_for').on('change:locations[0].zip', function () {
            ok(true, "Fired emp.works_for change:locations[0].zip...");
        });

        emp.get('works_for').on('change:locations[0]', function () {
            ok(true, "Fired emp.works_for change:locations[0]...");
        });

        emp.get('works_for').on('change:controls[0].locations[0].zip', function () {
            ok(true, "Fired emp.works_for change:controls[0].locations[0].zip...");
        });

        emp.get('works_for').on('change:controls[0].locations[0]', function () {
            ok(true, "Fired emp.works_for change:controls[0].locations[0]...");
        });

        emp.get('works_for').on('change:controls.locations', function () {
            ok(true, "Fired emp.works_for change:controls.locations...");
        });

        emp.on('change:works_for.locations[0].zip', function () {
            ok(true, "Fired emp change:works_for.locations[0].zip...");
        });

        emp.on('change:works_for.locations[0]', function () {
            ok(true, "Fired emp change:works_for.locations[0]...");
        });

        emp.on('change:works_for.locations[*]', function () {
            ok(true, "Fired emp change:works_for.locations[*]...");
        });

        emp.on('change:works_for.controls[0].locations[0].zip', function () {
            ok(true, "Fired emp change:works_for.controls[0].locations[0].zip...");
        });

        emp.on('change:works_for.controls[0].locations[0]', function () {
            ok(true, "Fired emp change:works_for.controls[0].locations[0]...");
        });

        emp.on('change:works_for.controls[*].locations[*]', function () {
            ok(true, "Fired emp change:works_for.controls[*].locations[*]...");
        });

        emp.on('change:works_for.controls[*].locations[*].zip', function () {
            ok(true, "Fired emp change:works_for.controls[*].locations[*].zip...");
        });

        emp.get('works_for').get("locations").at(0).set('zip', 94403);
    });

    test("collection `*` change", 12, function () {
        emp.on('change:works_for.controls[0].locations[0]', function () {
            ok(true, "Fired emp change:works_for.controls[0].locations[0]");
        });
        emp.on('change:works_for.controls[*].locations[*]', function () {
            ok(true, "Fired emp change:works_for.controls[*].locations[*]");
        });
        emp.on('change:works_for.controls[*].locations[*].zip', function () {
            ok(true, "Fired emp change:works_for.controls[*].locations[*].zip");
        });

        emp.on('change:works_for.controls[1].locations', function () {
            ok(true, "Fired emp change:works_for.controls[1].locations");
        });
        emp.on('change:works_for.controls[*].locations', function () {
            ok(true, "Fired emp change:works_for.controls[*].locations");
        });
        emp.get('works_for.controls[0].locations[0]').set('zip', 94406); //3
        emp.get('works_for.controls[1].locations[0]').set('add1', 'new changed address'); //1

        emp.set('works_for.controls[1].locations', undefined); // 2
        emp.set('works_for.controls[1].locations', [loc1]); // 2

        emp.on('change:works_for.locations[0]', function () {
            ok(false, "emp change:works_for.locations[0] should not be fired");
        });
        emp.on('change:works_for.locations[1]', function () {
            ok(true, "Fired emp change:works_for.locations[1]");
        });
        emp.on('change:works_for.locations[*]', function () {
            ok(true, "Fired emp change:works_for.locations[*]");
        });
        emp.get('works_for.locations[1]').set('zip', 94407); //2

        emp.get('works_for').on('change:locations', function () {
            ok(true, "Fired emp.works_for change:locations...");
        });

        emp.set('works_for.locations', undefined); //1
        emp.set('works_for.locations', [loc1]); //1
    });

    test("collection `*` add", 5, function () {
        emp.on('add:works_for.controls[0].locations', function () {
            ok(true, "Fired emp add:works_for.controls[0].locations...");
        });
        emp.on('add:works_for.controls[1].locations', function () {
            ok(true, "Fired emp add:works_for.controls[1].locations...");
        });
        emp.on('add:works_for.controls[*].locations', function () {
            ok(true, "Fired emp add:works_for.controls[*].locations...");
        });

        emp.on('add:works_for.locations', function () {
            ok(true, "add:works_for.locations");
        });

        emp.on('add:works_for.locations[*]', function () {
            ok(false, "emp add:works_for.location[*] should not be fired.");
        });

        emp.get('works_for.controls[0].locations').add(loc2); //2
        emp.get('works_for.controls[1].locations').add({ //2
            id:3,
            add1:"loc3"
        });
        emp.get('works_for.locations').add({ //1
            id:4,
            add1:"loc4"
        });
    });

    test("collection `*` remove", 5, function () {
        emp.get('works_for.controls[0].locations').add(loc2);
        emp.get('works_for.locations').add(loc2);

        emp.on('remove:works_for.controls[0].locations', function () {
            ok(true, "Fired emp remove:works_for.controls[0].locations...");
        });
        emp.on('remove:works_for.controls[1].locations', function () {
            ok(true, "Fired emp remove:works_for.controls[1].locations...");
        });
        emp.on('remove:works_for.controls[*].locations', function () {
            ok(true, "Fired emp remove:works_for.controls[*].locations...");
        });

        emp.on('remove:works_for.locations', function () {
            ok(true, "Fired remove:works_for.locations");
        });

        emp.on('remove:works_for.locations[*]', function () {
            ok(false, "emp remove:works_for.location[*] should not be fired.");
        });

        emp.get('works_for.controls[0].locations').remove(loc2); //2
        emp.get('works_for.controls[1].locations').remove(loc2); //2
        emp.get('works_for.locations').remove(loc2); //1
    });

    test("collection `*` reset", 3, function () {
        emp.on('reset:works_for.controls[0].locations', function () {
            ok(true, "Fired emp reset:works_for.controls[0].locations");
        });

        emp.on('reset:works_for.controls[*].locations', function () {
            ok(true, "Fired emp reset:works_for.controls[*].locations");
        });

        emp.on('reset:works_for.locations', function () {
            ok(true, "Fired reset:works_for.locations");
        });
        emp.get('works_for.controls[0].locations').reset();
        emp.get('works_for.locations').reset();
    });

    test("collection `*` destroy", function () {
        emp.on("destroy:works_for.controls[0].locations", function () {
            ok(true, "Fired emp destroy:works_for.controls[0].locations");
        });
        emp.on("destroy:works_for.controls[*].locations", function () {
            ok(true, "Fired emp destroy:works_for.controls[*].locations");
        });
        var loc = emp.get('works_for.controls[0].locations[0]');
        loc.sync = function (method, model, options) {
            return options.success.call(this, null, options);
        };
        loc.destroy();
    });

    test("collection `*` sort", function () {
        emp.on('change:works_for.controls[0].locations', function () {
            ok(true, "Fired emp change:works_for.controls[0].locations");
        });
        emp.on('change:works_for.controls[*].locations', function () {
            ok(true, "Fired emp change:works_for.controls[*].locations");
        });
        emp.get('works_for').on('change:controls[0]', function () {
            ok(true, "Fired emp change:works_for.controls[0]");
        });
        emp.on('nested-change', function () {
            ok(true, "Fired emp nested-change");
        });
        emp.set('works_for.controls[0].locations', locations); //4

        // check length and add comparator
        var locCol = emp.get('works_for.controls[0].locations');
        equal(locCol.length, 6, "location collection's length should be 6.");

        locCol.comparator = function (l) {
            return l.get("state");
        };

        emp.on('sort:works_for.controls[0].locations', function () {
            ok(true, "Fired emp sort:works_for.controls[0].locations");
        });
        emp.on('sort:works_for.controls[*].locations', function () {
            ok(true, "Fired emp sort:works_for.controls[*].locations");
        });
        emp.on('sort:works_for.controls.locations', function () {
            ok(false, "emp sort:works_for.controls.locations should not be fired");
        });
        emp.get('works_for.controls[0].locations').sort();
    });

    test("child `nested-change`", 9, function () {
        emp.get('works_for').get('locations').on('change', function () {
            ok(true, "Regular backbone change event from collections...");
        });

        emp.get('works_for').on('nested-change', function () {

            if (arguments[0] == "controls[0].locations[0]")
                ok(true, "Fired emp.works_for change:controls[0].locations[0]...");
            if (arguments[0] == "locations[0]")
                ok(true, "Fired emp.works_for change:locations[0]...");
            equal(arguments[2].dummy, true);

        });

        emp.on('nested-change', function () {
            if (arguments[0] == "works_for.controls[0].locations[0]")
                ok(true, "Fired emp change:works_for.controls[0].locations[0]...");
            if (arguments[0] == "works_for.locations[0]")
                ok(true, "Fired emp change:works_for.locations[0]...");

            equal(arguments[2].dummy, true);

        });

        emp.get('works_for').get("locations").at(0).set('zip', 94403, {dummy:true});
    });

    test("Set closure scope correctly - while setting BB Collection & Model instances directly", 5, function () {

        var Location = Backbone.AssociatedModel.extend({
            defaults:{
                name:"",
                zip:""
            }
        });

        var Group = Backbone.AssociatedModel.extend({
            relations:[
                {
                    type:Backbone.One,
                    key:'meetup',
                    relatedModel:Location
                }
            ],
            defaults:{
                meetup:undefined,
                name:""
            }
        });

        var loc1 = new Location({name:"CA", zip:"94404", id:1});
        var loc2 = new Location({name:"OH", zip:"92201", id:2});

        var cb = function () {
            ok(true)
        };

        var g1 = new Group({name:"AO", meetup:loc1});
        g1.on("change:meetup", cb);

        var g2 = new Group({name:"SO", meetup:loc2});
        g2.on("change:meetup", cb);

        g1.set('meetup', loc2); //1

        g2.set('meetup.zip', '93303'); //2 : Should fire change for both g1 and g2

        g1.set('meetup', undefined); //1
        g2.set('meetup.zip', '93304'); //1 : Should fire change for g2 only


    });

    test("Fetch collection repeatedly: Issue#47", 3, function () {

        var User = Backbone.AssociatedModel.extend({
            defaults:{
                name:"",
                email:""
            }
        });

        var Container = Backbone.AssociatedModel.extend({
            relations:[
                {
                    type:Backbone.Many,
                    key:'xxx',
                    relatedModel:User
                }
            ],
            defaults:{
                'xxx':[],
                name:""
            }
        });

        var ContainerCollection = Backbone.Collection.extend({
            model:Container,
            url:"fc",
            sync:function (resp, model, options) {
                options.success(
                    [
                        {
                            "id":425,
                            "name":"I am so cool",
                            "xxx":[
                                {
                                    "id":418,
                                    "email":"art@garfunkel.com"
                                }
                            ]
                        }
                    ]
                );
            }

        });

        var f = new ContainerCollection();
        f.on('add:xxx', function () {
            ok(true)
        });

        f.fetch();
        f.at(0).get('xxx').add({name:"n1"}); //Fire add:xxx
        f.at(0).get('xxx').add({name:"n4"}); //Fire add:xxx

        f.fetch();
        f.at(0).get('xxx').add({name:"n2"}); //Fire add:xxx
    });

    test("Polymorphic Associate : Issue#23", 4, function () {

        var Models = {};
        var findPolyMorphicType = Models.findPolyMorphicType = function (relation, attributes) {
            var key = relation.key + '_type';
            return Models[attributes[key] || this.get(key)];
        };

        Models.Job = Backbone.AssociatedModel.extend({
            relations:[
                {
                    type:Backbone.One,
                    key:'organizable',
                    relatedModel:findPolyMorphicType
                }
            ]

        });

        Models.Comment = Backbone.AssociatedModel.extend({
            relations:[
                {
                    type:Backbone.One,
                    key:'commentable',
                    relatedModel:findPolyMorphicType
                }
            ]
        });

        Models.Company = Backbone.AssociatedModel.extend({

        });
        Models.Department = Backbone.AssociatedModel.extend({

        });


        Models.Article = Backbone.AssociatedModel.extend({

        });
        Models.StatusUpdate = Backbone.AssociatedModel.extend({

        });

        var cjob = new Models.Job({organizable_type:'Company', name:"J1", organizable:{name:"Google"}});
        var djob = new Models.Job({organizable_type:'Department', name:"J2", organizable:{name:"Google Reader"}});

        var articleComment = new Models.Comment({
            commentable_type:'Article',
            name:"c1",
            commentable:{body:"Wonderful post!"}
        });
        var statusComment = new Models.Comment({
            commentable_type:'StatusUpdate',
            name:"c2",
            commentable:{body:"Why are you updating your status with pointless crap?"}
        });

        equal(cjob.get('organizable') instanceof Models.Company, true);
        equal(djob.get('organizable') instanceof Models.Department, true);

        equal(articleComment.get('commentable') instanceof Models.Article, true);
        equal(statusComment.get('commentable') instanceof Models.StatusUpdate, true);

    });


    test("Fetch collection with reset: Issue#45", 5, function () {
        var Product = Backbone.AssociatedModel.extend({
            defaults:{
                name:undefined, // String
                productId:undefined // String
            }
        });

        var Category = Backbone.AssociatedModel.extend();
        var Brand = Backbone.AssociatedModel.extend();
        var Vendor = Backbone.AssociatedModel.extend();
        var Tag = Backbone.AssociatedModel.extend();

        var SearchFacet = Backbone.AssociatedModel.extend({
            relations:[
                {
                    type:Backbone.Many,
                    key:'categories',
                    relatedModel:Category
                },
                {
                    type:Backbone.Many,
                    key:'brands',
                    relatedModel:Brand
                },
                {
                    type:Backbone.Many,
                    key:'vendors',
                    relatedModel:Vendor
                },
                {
                    type:Backbone.Many,
                    key:'tags',
                    relatedModel:Tag
                }
            ]
        });
        var counter = 1;
        var SearchResult = Backbone.AssociatedModel.extend({
            relations:[
                {
                    type:Backbone.One,
                    key:'searchFacet',
                    relatedModel:SearchFacet
                },
                {
                    type:Backbone.Many,
                    key:'products',
                    relatedModel:Product
                }
            ],
            sync:function (method, model, options) {
                return options.success.call(this, {
                    id:1,
                    products:[
                        {
                            id:counter,
                            name:'product' + counter,
                            productId:'productId' + counter++
                        },
                        {
                            id:counter,
                            name:'product' + counter,
                            productId:'productId' + counter++
                        },
                        {
                            id:counter,
                            name:'product' + counter,
                            productId:'productId' + counter++
                        },
                        {
                            id:counter,
                            name:'product' + counter,
                            productId:'productId' + counter++
                        }
                    ],
                    searchFacet:{
                        id:'sf1',
                        categories:[
                            {
                                name:'category' + counter++
                            }
                        ],
                        brands:[
                            {
                                name:'brand' + counter++
                            }
                        ],
                        tags:[
                            {
                                name:'tag' + counter++
                            }
                        ],
                        vendors:[
                            {
                                name:'vendor' + counter++
                            }
                        ]
                    }
                });
            },
            urlRoot:'/search'
        });

        var searchResult = new SearchResult();
        searchResult.on("reset:products", function (e) {
            ok(false, 'searchResult reset:products should not fired.'); //0
        });
        searchResult.on("reset:searchFacet.tags", function (e) {
            ok(false, 'searchResult reset:searchFacet.tags should not fired.'); //0
        });
        searchResult.fetch();
        equal(searchResult.get('products').length, 4, "searchResult.products.length should be 4."); //1
        searchResult.fetch();
        equal(searchResult.get('products').length, 4, "searchResult.products.length should be 4."); //1

        searchResult.off();
        searchResult.on("reset:products", function (e) {
            ok(true, 'searchResult reset:products fired.'); //1
        });
        searchResult.on("reset:searchFacet.tags", function (e) {
            ok(true, 'searchResult reset:searchFacet.tags fired.'); //1
        });
        searchResult.fetch({reset:true});
        equal(searchResult.get('products').length, 4, "searchResult.products.length should be 4."); //1
    });

    test("Cycle save: Issue#51", 3, function () {
        var MyApp = {
            Models:{},
            Context:{provinceRecords:[]}
        };

        var Models = MyApp.Models;

        Models.ChildMinder = Backbone.AssociatedModel.extend({
        });

        Models.ChildrenMinders = Backbone.Collection.extend({
            model:Models.ChildMinder
        });

        Models.Record = Backbone.AssociatedModel.extend({
            relations:[
                {
                    type:Backbone.Many,
                    key:'childrenMinders',
                    collectionType:Models.ChildrenMinders
                }
            ],

            // For demo purposes only
            sync:function (method, model, options) {
                var response = {};
                if (method === 'create') {
                    response[model.idAttribute] = counter++; // dummy id
                } else if (method === 'update') {
                    // Let's assume that - after success update, server sends model's json object
                    response = model.toJSON();
                }
                return options.success.call(this, response);
            }
        });

        Models.ChildMinder.relations = [];
        Models.ChildMinder.relations.push(
            {
                type:Backbone.One,
                key:'record',
                relatedModel:Models.Record
            }
        );

        var provinceRecord = new Models.Record({id:2, name:'test1'});
        MyApp.Context.provinceRecords.push(provinceRecord);

        var childrenMinders = new Models.ChildrenMinders([
            new Models.ChildMinder({id:1, type:'test1', record:provinceRecord}),
            new Models.ChildMinder({id:2, type:'test2', record:provinceRecord}),
            new Models.ChildMinder({id:3, type:'test3', record:provinceRecord})
        ]
        );
        provinceRecord.set('childrenMinders', childrenMinders);
        provinceRecord.save();

        equal(provinceRecord.get('childrenMinders').at(0).get('record') === provinceRecord, true);
        equal(provinceRecord.get('childrenMinders') === childrenMinders, true);
        equal(provinceRecord.get('childrenMinders').at(0) === childrenMinders.at(0), true);

    });


    test("Polymorphic associations + map: Issue#54", 9, function () {
        var Fruit = Backbone.AssociatedModel.extend();
        var Banana = Fruit.extend();
        var Tomato = Fruit.extend();

        var polymorphic = function (relation, attributes) {
            var key = relation.key + '_type';
            return attributes[key] || this.get(key);

        };

        var fruitStore = {};
        fruitStore['Banana'] = [
            new Banana({species:"Robusta", id:3}),
            new Banana({species:"Yallaki", id:4}),
            new Banana({species:"Genetic Modification", id:5}),
            new Banana({species:"Organic", id:6})
        ];
        fruitStore['Tomato'] = [
            new Tomato({species:"Cherry", id:3}),
            new Tomato({species:"Regular", id:4})
        ];


        //Handles both an array of ids and an id
        var lazy = function (fids, type) {
            fids = _.isArray(fids) ? fids : [fids];
            type = type instanceof Backbone.Collection ? type.model : type;
            var store = function (type) {
                if (type == Banana)
                    return fruitStore['Banana'];
                if (type == Tomato)
                    return fruitStore['Tomato'];
            }(type);

            return _.map(
                fids,
                function (fid) {
                    return _.findWhere(store, {id:fid});
                }
            );
        };

        var Oatmeal = Backbone.AssociatedModel.extend({
            relations:[
                {
                    type:Backbone.One,
                    key:'fruitable',
                    relatedModel:polymorphic,
                    map:lazy
                }
            ]
        });

        var aHealthyBowl = new Oatmeal({fruitable_type:Banana, fruitable:{species:"Robusta"}});

        equal(aHealthyBowl.get('fruitable') instanceof Banana, true);
        equal(aHealthyBowl.get('fruitable') instanceof Tomato, false);


        var aHealthyBowl2 = new Oatmeal({fruitable_type:Banana, fruitable:3});

        equal(aHealthyBowl2.get('fruitable') instanceof Banana, true);


        //Test with Backbone.Many
        var FruitExplosion = Backbone.AssociatedModel.extend({
            relations:[
                {
                    type:Backbone.Many,
                    key:'fruitable',
                    relatedModel:polymorphic,
                    map:lazy
                }
            ]
        });

        var bananaExplosion = new FruitExplosion({fruitable_type:Banana, fruitable:[3, 4]});
        equal(bananaExplosion.get('fruitable').at(0).get('species') === "Robusta", true);
        equal(bananaExplosion.get('fruitable').at(1).get('species') === "Yallaki", true);

        bananaExplosion.get('fruitable').add([5, 6]);

        equal(bananaExplosion.get('fruitable').at(2).get('species') === "Genetic Modification", true);
        equal(bananaExplosion.get('fruitable').at(3).get('species') === "Organic", true);


        var tomatoExplosion = new FruitExplosion({fruitable_type:Tomato, fruitable:[3, 4]});
        equal(tomatoExplosion.get('fruitable').at(0).get('species') === "Cherry", true);
        equal(tomatoExplosion.get('fruitable').at(1).get('species') === "Regular", true);


    });


    test("Issue #28", 2, function () {
        var ItemModel = Backbone.AssociatedModel.extend({
            relations:[
                {
                    type:Backbone.One,
                    key:'product',
                    relatedModel:Backbone.AssociatedModel.extend()
                }
            ],
            initialize:function () {
                this.on('change', function () {
                    ok('change');
                });
                this.on('nested-change', function () {
                    ok('change');
                });
                this.on('change:product', function () {
                    ok('change:product');
                });
            }
        });

        var item = new ItemModel({ product:{ name:'johnny' } });

        item.get('product').set({ name:'dave' });
    });


    test("transform from store", 16, function () {
        emp.set('works_for', 99);
        ok(emp.get('works_for').get('name') == "sales", "Mapped id to dept instance");

        emp.get('works_for').set('locations', [3, 4]);
        ok(emp.get('works_for').get('locations').length == 2, "Mapped ids to location instances");
        ok(emp.get('works_for').get('locations').at(0).get("id") == 3);
        ok(emp.get('works_for').get('locations').at(1).get("id") == 4);

        emp.get('works_for').get('locations').add(5);

        ok(emp.get('works_for').get('locations').length == 3, "Mapped ids to location instances");
        ok(emp.get('works_for').get('locations').at(2).get("id") == 5);

        emp.get('works_for').get('locations').remove(3);
        ok(emp.get('works_for').get('locations').length == 2);
        ok(emp.get('works_for').get('locations').at(0).get("id") == 4);
        ok(emp.get('works_for').get('locations').at(1).get("id") == 5);

        emp.get('works_for').get('locations').reset([6, 7, 8]);
        ok(emp.get('works_for').get('locations').length == 3);
        ok(emp.get('works_for').get('locations').at(0).get("id") == 6);
        ok(emp.get('works_for').get('locations').at(1).get("id") == 7);
        ok(emp.get('works_for').get('locations').at(2).get("id") == 8);

        emp.get('works_for').get('locations').set([3, 7]);
        ok(emp.get('works_for').get('locations').length == 2);
        ok(emp.get('works_for').get('locations').at(0).get("id") == 7);
        ok(emp.get('works_for').get('locations').at(1).get("id") == 3);

    });

    test("Issue  #35", 4, function () {

        var FieldInputType = Backbone.AssociatedModel.extend({
            defaults:{
                id:"-1",
                type:"",
                source:"<div/>"
            }
        });

        store = new Backbone.Collection([
            {id:1, type:"text", source:"<input type='text'/>"},
            {id:2, type:'email', source:"<input type='email'/>"
            }
        ], {model:FieldInputType});

        var Field = Backbone.AssociatedModel.extend({
            relations:[
                {
                    type:Backbone.One,
                    key:'type',
                    relatedModel:function () {
                        return  FieldInputType;
                    },
                    map:function (id) {
                        return store.findWhere({type:id});
                    }
                }
            ],

            defaults:{
                type:undefined,
                data:undefined,
                name:""
            },


            //Custom over-ride for James-demo to simulate a network
            sync:function (method, model, options) {
                var name = "Field" + Math.floor((Math.random() * 10) + 1);
                return options.success.call(this, {
                    type:"text",
                    data:"value to be shown on UI",
                    name:name
                }, options);
            }

        });

        //Scenario 1 : Local set/get
        var second = new Field({name:'First Name', type:'text' });
        var job = new Field({name:'Job', type:'email'});

        equal(second.get('type').get('source'), "<input type='text'/>");
        equal(job.get('type').get('source'), "<input type='email'/>");

        //Scenario 2 : Over the wire set/get
        var first = new Field();
        first.fetch();

        equal(first.get('type').get('source'), "<input type='text'/>");

        //Scenario 3: Set the id to a different value at a later stage
        second.set('type', "email");
        equal(second.get('type').get('source'), "<input type='email'/>");


    });


    test("Issue #40", 5, function () {

        var CartItem = Backbone.AssociatedModel.extend({
            defaults:{
                qty:0
            }
        });

        var Cart = Backbone.AssociatedModel.extend({
            relations:[
                {
                    type:Backbone.Many,
                    key:'items',
                    relatedModel:CartItem
                }
            ],
            getCartQty:function () {
                return this.get('items').reduce(function (memo, item) {
                    return memo + item.get('qty');
                }, 0);
            },

            defaults:{
                items:undefined
            }
        });

        var Account = Backbone.AssociatedModel.extend({
            relations:[
                {
                    type:Backbone.One,
                    key:'cart',
                    relatedModel:Cart
                }
            ],
            defaults:{
                cart:undefined
            }
        });

        var a = new Account();
        var c = new Cart();

        a.set('cart', c);

        a.on('change:cart.items', function () {
            ok(true, "Fired change:cart.items");
        });

        var ci1 = new CartItem({qty:5});
        var ci2 = new CartItem({qty:7});
        c.set('items', [ci1, ci2]); // change:cart.items => 1
        equal(a.get('cart').getCartQty(), 12); // => 1        

        a.once('add:cart.items', function () {
            ok(true, "Fired add:cart.items");
        });

        var ci3 = new CartItem({qty:7});
        c.get('items').add(ci3); // add:cart.items => 1
        equal(a.get('cart').getCartQty(), 19); // => 1

        a.on('change:cart.items[*]', function () {
            equal(a.get('cart').getCartQty(), 24);
        });

        c.get('items').at(0).set('qty', 10); // change:cart.items[*] => 1
    });

    test("Issue #31", 5, function () {

        var Model1 = Backbone.AssociatedModel.extend({});
        var Model2 = Backbone.AssociatedModel.extend({
            relations:[
                {
                    type:Backbone.One,
                    key:"model1",
                    relatedModel:Model1
                }
            ]
        });
        var m2 = new Model2({id:1, model1:{id:2, name:"Name"}, version:"m2.0"});
        var m1 = m2.get("model1");
        m2.once("change:model1", function () {
            //both the parent object and the child object have the updated values in the event handler
            equal(m2.get('version'), "m2.1");
            equal(m2.get('model1').get('name'), "Name2");
        });

        m2.get('model1').on("change", function () {
            //both the parent object and the child object have the updated values in the event handler
            equal(m2.get('version'), "m2.1");
            equal(m2.get('model1').get('name'), "Name2");
        });

        // Fake server response : The response from server side can update m2 on success
        m2.set({id:1, model1:{id:2, name:"Name2"}, version:"m2.1"});

        equal(m1, m2.get("model1"));

        //Should not trigger event in m2.get('model1').on("change", callback) as we have a diff model1 instance
        m2.set({id:1, model1:{id:3, name:"Name3"}, version:"m2.1"});

    });

    test("Issue#67 : Nested set shouldn't destroy references", 2, function () {

        var Team = Backbone.Collection.extend({
                model:Employee
            }),
            json1 = [
                {
                    id:'e1',
                    fname:"John",
                    manager:{
                        id:'m1',
                        fname:'Mikeeee'
                    }
                },
                {
                    id:'e2',
                    fname:"Edgar"
                }
            ],
            json2 = [
                {
                    id:'e1',
                    fname:"John",
                    manager:{
                        id:'m1',
                        fname:'Mike'
                    }
                },
                {
                    id:'e2',
                    fname:"Edgar"
                }
            ];

        var team = new Team(json1);
        var employee1 = team.at(0);
        var manager1 = employee1.get('manager');

        team.set(json2);

        equal(employee1.get('manager.fname'), 'Mike');

        equal(manager1.get('fname'), 'Mike');

    });

    test("Issue #31 nested collection", 2, function () {
        var Node = Backbone.AssociatedModel.extend({
            defaults:{
                id:null,
                value:"",
                nodes:[]
            },
            relations:[
                {
                    type:Backbone.Many,
                    key:"nodes",
                    relatedModel:Backbone.Self
                }
            ]
        });

        var treeJson = {
            id:0,
            value:"0",
            nodes:[
                {
                    id:1,
                    value:"1",
                    nodes:[
                        {
                            id:2,
                            value:"2"
                        }
                    ]
                }
            ]
        };

        var treeModel = new Node(treeJson);
        var nodes0 = treeModel.get("nodes");
        var nodes1 = treeModel.get("nodes[0].nodes");

        ///The response from server side can update treeModel on success
        treeModel.set(treeJson);
        equal(nodes0 === treeModel.get("nodes"), true);
        equal(nodes1 === treeModel.get("nodes[0].nodes"), true);
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

    test("child `add`", 21, function () {
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
        emp.on('change:dependents[*].age', function () {
            ok(true, "Fired emp change:dependents[*].age...");
        });
        emp.on('change:dependents[0]', function () {
            ok(true, "Fired emp change:dependents[0]...");
        });
        emp.on('change:dependents[*]', function () {
            ok(true, "Fired emp change:dependents[*]...");
        });
        emp.on('change:dependents', function () {
            ok(true, "Fired emp change:dependents...");
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

        emp.get("dependents").at(0).set({age:15}); //8

        emp.get("dependents").add(child2); //2
        emp.get("dependents").add([child3, child4]); //4
        emp.get("dependents").remove([child1, child4]); //5
        emp.get("dependents").reset(); //2
    });

    test("Check clone while assigning prev attributes in event bubble-up", 1, function () {
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
                {"add1":"P.O Box 3899", "add2":null, "id":"1", "zip":"94404", "state":"CA"}
            ], "name":"Project X", "number":"2"},
            {"locations":[
                {"add1":"P.O Box 4899", "add2":null, "id":"2", "zip":"95502", "state":"CA"}
            ], "name":"Project Y", "number":"2"}
        ], "locations":[
            {"add1":"P.O Box 3899", "add2":null, "id":"1", "zip":"94404", "state":"CA"},
            {"add1":"P.O Box 4899", "add2":null, "id":"2", "zip":"95502", "state":"CA"}
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
        equal(emp2.get('fname'), 'newEmp2', "emp's fname should be changed");
        equal(emp2.get('manager').get('fname'), 'newEmp2', "manager's fname should be changed");

        var emp3 = new Employee({fname:'emp3', manager:{fname:'emp4'}});
        equal(emp3.get('manager.fname'), 'emp4', "manager's fname should be emp4");
    });

    test("Backbone.Self", 9, function () {
        var User = Backbone.AssociatedModel.extend({
            relations:[
                {
                    key:'friends',
                    type:Backbone.Many,
                    relatedModel:Backbone.Self
                }
            ],
            defaults:{
                username:undefined,
                fname:'',
                lname:'',
                aboutMe:'',
                friends:[]
            }
        });

        var user1 = new User({id:1, username:'user1'});
        var user2 = new User({id:2, username:'user2', friends:[user1]});
        var user3 = new User({id:3, username:'user3', friends:[user1, {id:4, username:'user4'}]});

        equal(user1.get('username'), 'user1', "user1's username should be correct");
        equal(user1.get('friends').length, 0, "count of friends of user1 should be 0");

        equal(user2.get('username'), 'user2', "user2's username should be correct");
        equal(user2.get('friends').length, 1, "count of friends of user2 should be 1");
        equal(user2.get('friends[0].username'), 'user1', "username of first follower of user2 should be user1");

        equal(user3.get('username'), 'user3');
        equal(user3.get('friends').length, 2);
        equal(user3.get('friends[0].username'), 'user1');
        equal(user3.get('friends[1].username'), 'user4');
    });

    test("Self-Reference `toJSON`", function () {
        var emp2 = new Employee({'fname':'emp2'});
        emp2.idAttribute = "emp_id";
        emp2.set('emp_id', 1);
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
            "emp_id":1,
            "fname":"emp2",
            "lname":"",
            "manager":{emp_id:1}
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

        emp.set('works_for', undefined);
        emp.set(
            {
                works_for:{
                    id:6,
                    number:6
                }
            }
        );
        equal(emp.get('works_for').get('number'), 6);
        emp.set(
            {
                works_for:{
                    id:6,
                    name:'PR'
                }
            }
        );
        equal(emp.get('works_for').get('number'), 6);
        emp.set(
            {
                works_for:{
                }
            }
        );
        equal(emp.get('works_for').get('number'), -1);

    });

    test("save", 1, function () {
        emp = new Backbone.Model();
        emp.sync = function (method, model, options) {
            options.success.call(this, null, options);
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
            options.success.call(this, {sex:'O'}, options);
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

    test("parent relations", 7, function () {
        emp.set('works_for', {name:"Marketing", number:29});

        var emp2 = new Employee({
            fname:"Tom",
            lname:"Hanks",
            age:41,
            sex:"M"
        });

        var emp3 = new Employee({
            fname:"Michelle",
            lname:"Pfiefer",
            age:42,
            sex:"F"
        });

        var works_for = emp.get('works_for');

        equal(works_for.parents.length, 1);

        emp3.set('works_for', works_for);
        emp2.set('works_for', works_for);
        //add multiple times. Should be idempotent
        emp3.set('works_for', works_for);

        equal(works_for.parents.length, 3);

        emp2.set('works_for', undefined);
        equal(works_for.parents.length, 2);

        emp.set('works_for', undefined);
        equal(works_for.parents.length, 1);

        equal(emp.parents.length, 0);
        equal(emp2.parents.length, 0);

        //Could cause mem leaks if you set emp3 = undefined
        //emp3 = undefined;
        //equal(works_for.parents.length,1);

        emp3.cleanup();
        emp3 = undefined;
        equal(works_for.parents.length, 0);

    });


    test("parents - Issue #39", 3, function () {
        var Nested = Backbone.AssociatedModel.extend();

        var Child = Backbone.AssociatedModel.extend({
            relations:[
                {
                    type:Backbone.One,
                    key:'nested',
                    relatedModel:Nested
                }
            ]
        });

        var Root = Backbone.AssociatedModel.extend({
            relations:[
                {
                    type:Backbone.One,
                    key:'child',
                    relatedModel:Child
                },
                {
                    type:Backbone.One,
                    key:'nested',
                    relatedModel:Nested
                }
            ]
        });

        var root = new Root;
        var child = new Child;

        // Add 'nested' to root model
        root.set('nested', new Nested);
        equal(root.get('nested').parents[0] === root, true);


        // Add 'nested' to child model
        child.set('nested', new Nested);
        equal(child.get('nested').parents[0] === child, true);

        // Add child to parent
        root.set('child', child);
        equal(root.get('nested').parents[0] === root, true);


    });


    test("Many relation's options : parse", 3, function () {
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
                return options.success.call(this, {
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

    test("One relation's options passed from parent", 2, function () {
        var NewEmployee = Employee.extend({
            parse:function (obj) {
                obj.prefix = "Mr.";
                return obj;
            }
        });

        var Room = Backbone.AssociatedModel.extend({
            url:"/unit",
            relations:[
                {
                    type:Backbone.One,
                    relatedModel:NewEmployee,
                    key:'employee'
                }
            ],
            defaults:{
                name:'',
                employee:null
            },
            //proxy for server
            sync:function (method, model, options) {
                return options.success.call(this, {
                    name:'room-name',
                    employee:{
                        fname:"John",
                        lname:"Smith"
                    }
                }, options);
            }
        });
        var room = new Room(null, {parse:true});
        room.fetch({
            success:function (model, response) {
                equal(model.get("name"), "room-name", "Unit name should be room-name");
                equal(model.get("employee").get('prefix'), "Mr.", "Prefix of employee should be Mr.");
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
                options.success.call(this, null, options);
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
            node1.id = "n1";
            node2 = new Node({name:'n2'});
            node2.id = "n2";
            node3 = new Node({name:'n3'});
            node3.id = "n3";

        }
    });

    test("Call toJSON in cycles -  Issue#58", 1, function () {

        node1.set({parent:node3, children:[node2]});

        node1.on('add:children', function () {
            var node12Json = "{\"name\":\"n1\",\"parent\":{\"name\":\"n3\"},\"children\":[{\"name\":\"n2\"},{\"name\":\"n3\"}]}";
            equal(JSON.stringify(node1.toJSON()), node12Json);
        });

        node1.set({parent:node3, children:[node2, node3]});
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

        node1.on("change:children[0]", function () {
            ok(true, "node1 change:children[0] fired...");
        });
        node2.on("change:children[0]", function () {
            ok(true, "node2 change:children[0] fired...");
        });
        node3.on("change:children[0]", function () {
            ok(true, "node3 change:children[0] fired...");
        });

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
                            "children":[
                                {"id":"n1"}
                            ],
                            "parent":{"id":"n3"}
                        }
                    ],
                    "parent":{"id":"n1"}
                }
            ],
            "parent":{
                "name":"n2",
                "children":[
                    {"id":"n1"}
                ],
                "parent":{
                    "name":"n3",
                    "children":[
                        {"id":"n2"}
                    ],
                    "parent":{"id":"n1"}
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
