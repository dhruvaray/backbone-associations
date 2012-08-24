$(document).ready(function() {

    var Location = Backbone.AssociatedModel.extend({		  
        defaults: {
                add1 : "",
                add2 : null,
                zip : "",
                state : ""
        }        
    });

    var Project = Backbone.AssociatedModel.extend({		  
        relations: [
            {
                type: Backbone.Many,
                key: 'locations',
                relatedModel:Location 
            }
        ],
        defaults: {
                name : "",
                number : 0,
                locations : []
        }        
    });

    
    var Department = Backbone.AssociatedModel.extend({				 			  
        relations: [
            {
                type: Backbone.Many,
                key: 'controls',
                relatedModel: Project
            },
            {
                type: Backbone.Many,
                key: 'locations',
                relatedModel: Location
            }
        ],
        defaults:{
            name : '',
            locations : [],
            number :-1,
            controls :[]
        }
    });

    var Dependent = Backbone.AssociatedModel.extend({
        validate:function(attr){
           return (attr.sex && attr.sex != "M" && attr.sex != "F") ? "invalid sex value" : undefined;
        },
        defaults: {
            fname : '',
            lname : '',
            sex : 'F', //{F,M}
            age : 0, 
            relationship : 'S' //Values {C=Child, P=Parents}
        }
    });	

    Employee = Backbone.AssociatedModel.extend({		  
        relations: [
            {
                type: Backbone.One,
                key: 'works_for',
                relatedModel: Department
            },
            {
                type: Backbone.Many,
                key: 'dependents',
                relatedModel: Dependent
            },
            {
                type: Backbone.One,
                key: 'manager',
                relatedModel: 'Employee'
            }
        ],
        validate:function(attr){
           return (attr.sex && attr.sex != "M" && attr.sex != "F") ? "invalid sex value" : undefined;
        },
        defaults: {
            sex : 'M', //{F,M}
            age : 0,
            fname : "",
            lname : "",
            works_for:{},
            dependents:[],
            manager : null
        }        
    });
    
    module("Backbone.AssociatedModel",{
        setup: function() {
            emp = new Employee({
                fname : "John",
                lname : "Smith",
                age : 21,
                sex : "M"
            });

            child1 = new Dependent({
                fname : "Jane",
                lname : "Smith",
                sex : "F",
                relationship : "C"

            });
            parent1 = new Dependent({
                fname : "Edgar",
                lname : "Smith",
                sex : "M",
                relationship : "P"

            });

            loc1 = new Location({
                add1 : "P.O Box 3899",
                zip: "94404",
                state : "CA"

            });

            loc2 = new Location({
                add1 : "P.O Box 4899",
                zip: "95502",
                state : "CA"
            });

            project1 = new Project({
                name : "Project X",
                number: "2"
            });

            project2 = new Project({
                name : "Project Y",
                number: "2"
            });

            project2.get("locations").add(loc2);
            project1.get("locations").add(loc1);

            dept1 = new Department({
                name : "R&D",
                number: "23"
            });

            dept1.set({locations:[loc1, loc2]});
            dept1.set({controls:[project1, project2]});

            emp.set({"works_for":dept1});
            emp.set({"dependents":[child1,parent1]});
        }
    });		

    test("initialize", 1, function() {	  								
        equal(emp.get('fname'),'John','name should be John');
    });

    test("primitive attribute set operation", 2, function() {		
        emp.set({'age':22});
        equal(emp.get("age"),22,"emp's should be 22 years");
        
        loc1.set({'zip':'95502'});
        ok(dept1.get('locations').at(0) == loc1,"dept1's first location should be same as loc1");
    });

    test("model can also be passed as attribute on set", 2, function() {		
        var emp2 = new Employee({
            fname : "Tom",
            lname : "Hanks",
            age : 45,
            sex : "M"
        });
        emp.set(emp2);
        equal(emp.get("fname"),"Tom","emp name should be Tom");
        equal(emp.get("age"),45,"emp age should be 45 years");
    });

    test("function can also be passed as value of attribute on set", 2, function() {		
        var dept2 = function(){
            return {
                name : "Marketing",
                number : "24"
            };
        };
        equal(emp.get("works_for").get("name"),"R&D","department name should be R&D");
        emp.set({"works_for":dept2});        
        equal(emp.get("works_for").get("name"),"Marketing","department name should be set to Marketing");        
    });

    test("unset", 2, function() {		
        emp.get('works_for').unset('locations');
        equal(emp.get('works_for').get('locations'),void 0,"locations should be void");
        emp.unset('works_for');		
        equal(emp.get('works_for'),void 0,"should have no departments");
    });

    test("setDefaults", 2, function() {			
        emp.get("works_for").set({'number':5});
        equal(emp.get("works_for").get('number'),5,"number has new value");
        emp.set({"works_for":dept1.defaults});
        equal(emp.get("works_for").get('number'),-1,"number has default value");
    });

    test("escape", 1, function() {		
        emp.get('works_for').get("locations").at(0).set({'add1':'<a>New Address</a>'});		
        equal(_.escape(emp.get('works_for').get("locations").at(0).get("add1")),'&lt;a&gt;New Address&lt;&#x2F;a&gt;',"City should be in HTML-escaped version");
    });

    test("has", 3, function() {		
        ok(emp.get("works_for").get("locations").at(0).has('add2') == false,"Add2 is undefined in department address");
        emp.get("works_for").get("locations").at(0).set({'add2':'Add2 value'});
        ok(emp.get("works_for").get("locations").at(0).has('add2') == true,"Add2 is defined in department address");
        ok(emp.has('add2') == false,"Add2 is undefined in patient");
    });

    test("validate", 2, function() {		
        emp.get('dependents').at(0).set({sex:"X"});
        equal(emp.get('dependents').at(0).get('sex'),'F',"sex validation prevents values other than M & F");						
        emp.get('dependents').at(0).set({sex:"M"});
        equal(emp.get('dependents').at(0).get('sex'),'M',"sex validation allows legal values - M & F");						
    });

    test("clear", 2, function() {		
        emp.clear();
        equal(emp.get('works_for'),void 0,"Deparment should be set to undefined");								
        equal(emp.get('dependents'),void 0,"Dependents should be undefined");						
    });
    
    test("clone", 7, function() {       
        var emp2 = emp.clone();
        equal(emp.get('fname'), 'John');
        equal(emp.get('works_for').get('name'), 'R&D');        
        equal(emp2.get('fname'), emp.get('fname'), "fname should be the same on the clone.");
        equal(emp2.get('works_for').get('name'), emp.get('works_for').get('name'), "name of department should be the same on the clone.");
        ok(_.isEqual(emp.toJSON(),emp2.toJSON()),"emp should be the same on the clone");
        emp.set({
            works_for : {
                name : 'Marketing',
                number : '24'
            }
        });
        equal(emp.get('works_for').get('name'), 'Marketing');
        equal(emp2.get('works_for').get('name'), 'R&D', "Changing a parent attribute does not change the clone.");
    });
    
    test("change, hasChanged, changedAttributes, previous, previousAttributes", function() {        
        //equal(emp.changedAttributes(), false);        
        emp.on('change', function() {
            ok(emp.get('works_for').hasChanged('name'), "department's name changed");            
            ok(_.isEqual(emp.get('works_for').changedAttributes(), {name : 'Marketing',number:'24'}), 'changedAttributes returns the changed attrs');
            equal(emp.get('works_for').previous('name'), 'R&D');
            ok(emp.get('works_for').previousAttributes().name, 'R&D', 'previousAttributes is correct');
        });
        equal(emp.get('works_for').hasChanged(), false);
        equal(emp.get('works_for').hasChanged(undefined), false);
        emp.set(
            {
                works_for : {
                    name : 'Marketing',
                    number : '24'
                }
            }, 
            {silent : true}
        );
        equal(emp.get('works_for').hasChanged(), true);        
        equal(emp.get('works_for').hasChanged('name'), true);
        emp.get('works_for').change();
        equal(emp.get('works_for').get('name'), 'Marketing');
    });

    test("child `change`", 5, function() {
       
        emp.on('change',function(){
            ok(true,"Fired emp change...");
        });
        emp.get('works_for').on('change',function(){
            ok(true,"Fired works_for change...");
        });
        emp.get('works_for').on('change:name',function(){
            ok(true,"Fired dept:name change...");
        });				
        emp.on('change:dependents',function(){
            ok(true,"Fired dependents change...");
        });
        emp.get("dependents").on('add',function(){
            ok(true,"Fired dependents added...");
        });
        emp.get('works_for').set({name:"Marketing"});
        child2 = new Dependent({
                fname : "Greg",
                lname : "Smith",
                sex : "M",
                relationship : "C"
        });
        emp.get("dependents").at(0).set({age:15});
        emp.get("dependents").add(child2);

    });
    
    test("toJSON", 2, function() {                     
        var json1 = emp.get('dependents').toJSON();
        var rawJson1 = [
            {"fname":"Jane","lname":"Smith","sex":"F","age":0,"relationship":"C"},
            {"fname":"Edgar","lname":"Smith","sex":"M","age":0,"relationship":"P"}
        ];
        ok(_.isEqual(json1,rawJson1),"collection.toJSON() and json object are identical");
        
        var json2 = emp.toJSON();
        var rawJson2 = {"works_for":{"controls":[{"locations":[{"add1":"P.O Box 3899","add2":null,"zip":"94404","state":"CA"}],"name":"Project X","number":"2"},{"locations":[{"add1":"P.O Box 4899","add2":null,"zip":"95502","state":"CA"}],"name":"Project Y","number":"2"}],"locations":[{"add1":"P.O Box 3899","add2":null,"zip":"94404","state":"CA"},{"add1":"P.O Box 4899","add2":null,"zip":"95502","state":"CA"}],"name":"R&D","number":"23"},"dependents":[{"fname":"Jane","lname":"Smith","sex":"F","age":0,"relationship":"C"},{"fname":"Edgar","lname":"Smith","sex":"M","age":0,"relationship":"P"}],"sex":"M","age":21,"fname":"John","lname":"Smith","manager":null};        
        ok(_.isEqual(json2,rawJson2),"model.toJSON() and json object are identical");                 
    });
    
    test("Collection `length`", 2, function() { 
        child2 = new Dependent({
                fname : "Greg",
                lname : "Smith",
                sex : "M",
                relationship : "C"
        });
        equal(emp.get("dependents").length,2,"dependents.length should be 2");
        emp.get("dependents").add(child2);    
        equal(emp.get("dependents").length,3,"dependents.length should be 3");
    });
    
    test("Collection `reset`", 3, function() {               
        child2 = new Dependent({
                fname : "Greg",
                lname : "Smith",
                sex : "M",
                relationship : "C"
        });
        emp.get("dependents").on("reset",function(){
            ok(true,"Fired `reset` event for dependents...");
        });        
        emp.get("dependents").add(child2);    
        equal(emp.get("dependents").length,3,"dependents.length should be 3");
        emp.get("dependents").reset();
        equal(emp.get("dependents").length,0,"dependents.length should be set to 0");
    });
       
    test("Self-Reference", function() {                               
        var emp2 = new Employee({'fname':'emp2'});        
        
        emp2.on('change:manager',function(){
            ok(true,"`change:manager` fired...");
        });                
        
        emp2.set({'manager' : emp2});
        emp2.get("manager").on('change',function(){
            ok(true,"`change` on manager fired...");
        });
               
        emp2.get('manager').set({'fname':'newEmp2'});        
        equal(emp2.get('fname'),'newEmp2',"emp's fname should be canged");
        equal(emp2.get('manager').get('fname'),'newEmp2',"manager's fname should be canged");        
    });
    
    test("Self-Reference `toJSON`", function() {                               
        var emp2 = new Employee({'fname':'emp2'});                                              
        emp2.set({'manager' : emp2});                
        var rawJson  =  {
                            "works_for": {
                                "controls": [],
                                "locations": [],
                                "name": "",
                                "number": -1
                            },
                            "dependents": [],
                            "sex": "M",
                            "age": 0,
                            "fname": "emp2",
                            "lname": "",
                            "manager": undefined
                        };
        ok(_.isEqual(emp2.toJSON(),rawJson),"emp2.toJSON() is identical as rawJson");        
    });
    
    test("Defaults clear", function() {                               
        emp.set(
            {
                works_for : {
                    name : 'Marketing',
                    number : '5'        
                }
            }
        );  
        equal(emp.get('works_for').get('number'),5);
        emp.set(
            {
                works_for : {
                    name : 'R&D'                    
                }
            }
        );        
        equal(emp.get('works_for').get('number'),-1);
        equal(emp.get('works_for').get('type'),void 0);
        
    });
});

