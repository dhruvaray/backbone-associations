# Backbone-associations
Backbone-associations provides a way of specifying 1:1 and 1:N relationships between Backbone models. Additionally, parent model instances (and objects extended from `Backbone.Events`) can listen in to CRUD events initiated on any children - in the object graph - by providing an appropriately qualified event path name. It aims to provide a clean implementation which is easy to understand and extend. It is [performant](#performance) for CRUD operations - even on deeply nested object graphs - and uses a low memory footprint. Web applications leveraging the client-side-MVC architectural style will benefit by using `backbone-associations` to define and manipulate client object graphs.

It comes with
* The [annotated](http://dhruvaray.github.com/backbone-associations/docs/backbone-associations.html) source code.
* An online [test suite](http://dhruvaray.github.com/backbone-associations/test/test-suite.html) which includes backbone test cases.
* Performance [tests](http://jsperf.com/backbone-associations-speed-suit/2).

It was originally born out of a need to provide a simpler and speedier implementation of [Backbone-relational](https://github.com/PaulUithol/Backbone-relational/)

## Contents
* [Download](#download)
* [Installation](#installation)
* [Specifying Associations](#associations)
* [Eventing with Associations](#eventing)
* [Performance](#performance)
* [Change Log](#changelog)


## <a name="download"/>Download

* [Minified & gzipped version (1.6KB) 0.3.0](http://dhruvaray.github.com/backbone-associations/backbone-associations-min.js)
* [Development version 0.3.0](http://dhruvaray.github.com/backbone-associations/backbone-associations.js)


## <a name="installation"/>Installation

Backbone-associations depends on [backbone](https://github.com/documentcloud/backbone) (and thus on  [underscore](https://github.com/documentcloud/underscore)). Include Backbone-associations right after Backbone and Underscore:

```html
<script type="text/javascript" src="./js/underscore.js"></script>
<script type="text/javascript" src="./js/backbone.js"></script>
<script type="text/javascript" src="./js/backbone-associations.js"></script>
```

Backbone-associations works with both Backbone 0.9.9 and 0.9.2. Underscore v1.3.3 upwards is supported.


## <a name="associations"/>Specifying Associations

Each `Backbone.AssociatedModel` can contain an array of `relations`. Each relation defines a `relatedModel`, `key`, `type` and (optionally) `collectionType`. This can be easily understood by some examples.

### Specifying One-to-One Relationship 


```javascript

var Employee = Backbone.AssociatedModel.extend({  	  
	relations: [
        {
            type: Backbone.One, //nature of the relationship
            key: 'manager', // attribute of Employee
            relatedModel: 'Employee' //AssociatedModel for attribute key
        }
    ],
  defaults: {
    age : 0,
    fname : "",
    lname : "",
    manager : null
  }        
});


````
### Specifying One-to-Many Relationship

```javascript

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
	    type: Backbone.Many,//nature of the relation
	    key: 'locations', //attribute of Project 
	    relatedModel:Location //AssociatedModel for attribute key
	  }
  ],
  defaults: {
    name : "",
    number : 0,
    locations : []
  }        
});

```

#### Valid values for 


##### relatedModel 
A string (which can be resolved to an object type on the global scope), or a reference to a `Backbone.AssociatedModel` type.

##### key 
A string which references an attribute name on `relatedModel`.

##### type : `Backbone.One` or `Backbone.Many`
Used for specifying one-to-one or one-to-many relationships.

##### collectionType (optional) : 
A string (which can be resolved to an object type on the global scope), or a reference to a `Backbone.Collection` type. Determine the type of collections used for a `Many` relation.

### Tutorial : Defining a graph of `AssociatedModel` relationships

#### A sample entity relationship graph
![er-example](http://dhruvaray.github.com/backbone-associations/docs/img/er-example.png)

#### The corresponding representation using `AssociatedModels`
````javascript
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

    var Employee = Backbone.AssociatedModel.extend({
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

````

## <a name="eventing"/>Eventing with `AssociatedModels`
CRUD operations on AssociatedModels trigger the appropriate Backbone [system events](http://backbonejs.org/#Events-catalog).  However, because we are working with an object graph, the event name now contains the fully qualified path from the source of the event to the receiver of the event. The remaining event arguments are identical to the Backbone event arguments and vary based on [event type](http://backbonejs.org/#Events-catalog).

An update like this
````javascript
emp.get('works_for').get("locations").at(0).set('zip', 94403);
````
can be listened to at various levels by spelling out the appropriate path
````javascript
emp.on('change:works_for.controls.locations[0].zip', callback_function);

emp.get('works_for').on('change:controls.locations[0].zip', callback_function);

emp.get('works_for').get('locations').at(0).on('change:zip', callback_function);

````
A detailed example is provided below to illustrate the behavior for other event types as well as the appropriate usage of the Backbone [change-related methods](http://backbonejs.org/#Model-hasChanged) used in callbacks.

### Tutorial : Eventing with a graph of `AssociatedModel` objects

````javascript

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


    emp.on('change', function () {
        console.log("Fired emp > change...");
        //emp.hasChanged() === true;
        //emp.hasChanged("works_for") === true;
    });
    emp.on('change:works_for', function () {
        console.log("Fired emp > change:works_for...");
        var changed = emp.changedAttributes();
        //JSON.stringify(changed['works_for']) === JSON.stringify(emp.get("works_for")));
        //emp.previousAttributes()['works_for'].name === "");
        //emp.previousAttributes()['works_for'].number === -1;
        //emp.previousAttributes()['works_for'].locations.length === 0;
        //emp.previousAttributes()['works_for'].controls.length === 0;
    });

    emp.set({"works_for":dept1});
    //Console log
    //Fired emp > change:works_for...
    //Fired emp > change...


    var dept1snapshot = dept1.toJSON();

    //Remove event handlers. Can also use backbone 0.0.0 once API (on the earlier emp event handlers) instead of `off`
    emp.off()

    emp.get('works_for').on('change', function () {
        console.log("Fired emp.works_for > change...");
        //emp.get("works_for").hasChanged() === true;
        //emp.get("works_for").previousAttributes()["name"] === "R&D";
    });
    emp.get('works_for').on('change:name', function () {
        console.log("Fired emp.works_for > change:name...");

    });

    emp.on('change:works_for.name', function () {
        console.log("Fired emp > change:works_for.name...");
        //emp.get("works_for").hasChanged() === true;
        //emp.hasChanged() === true;
        //emp.hasChanged("works_for") === true;
        //JSON.stringify(emp.changedAttributes()['works_for']) === JSON.stringify(emp.get("works_for")));
        //emp.get("works_for").previousAttributes()["name"] === "R&D";
        //emp.get("works_for").previous("name") === "R&D";
    });

    emp.on('change:works_for', function () {
        console.log("Fired emp > change:works_for...");
        //emp.hasChanged());
        //emp.hasChanged("works_for"));
        //JSON.stringify(emp.changedAttributes()['works_for']) === JSON.stringify(emp.get("works_for"));
        //emp.previousAttributes().works_for.name === "R&D";
        //_.isEqual(emp.previous("works_for"), dept1snapshot) === true;

    });

    emp.get('works_for').set({name:"Marketing"});


    //Console log
    //Fired emp.works_for > change:name
    //Fired emp > change:works_for.name...
    //Fired emp.works_for > change...
    //Fired emp > change:works_for...


    emp.get('works_for').get('locations').at(0).on('change:zip', function () {
        console.log("Fired emp.works_for.locations[0] > change:zip...");
    });

    emp.get('works_for').get('locations').at(0).on('change', function () {
        console.log("Fired emp.works_for.locations[0] > change...");
    });

    emp.get('works_for').on('change:locations[0].zip', function () {
        console.log("Fired emp.works_for > change:locations[0].zip...");
    });

    emp.get('works_for').on('change:locations[0]', function () {
        console.log("Fired emp.works_for > change:locations[0]...");
    });

    emp.on('change:works_for.locations[0].zip', function () {
        console.log("Fired emp > change:works_for.locations[0].zip...");
    });

    emp.on('change:works_for.locations[0]', function () {
        console.log("Fired emp > change:works_for.locations[0]...");
    });


    emp.on('change:works_for.controls.locations[0].zip', function () {
        console.log("Fired emp > change:works_for.controls.locations[0].zip...");
    });

    emp.on('change:works_for.controls.locations[0]', function () {
        console.log("Fired emp > change:works_for.controls.locations[0]...");
    });

    emp.get('works_for').on('change:controls.locations[0].zip', function () {
        console.log("Fired emp.works_for > change:controls.locations[0].zip...");
    });

    emp.get('works_for').on('change:controls.locations[0]', function () {
        console.log("Fired emp.works_for > change:controls.locations[0]...");
    });


    emp.get('works_for').get("locations").at(0).set('zip', 94403);

    //Console log
    //Fired emp.works_for > change:controls.locations[0]...
    //Fired emp.works_for > change:controls.locations[0].zip...
    //Fired emp.works_for > change:locations[0]...
    //Fired emp.works_for > change:locations[0].zip...

    //Fired emp > change:works_for.controls.locations[0]...
    //Fired emp > change:works_for.controls.locations[0].zip...
    //Fired emp > change:works_for.locations[0]...
    //Fired emp > change:works_for.locations[0].zip...

    //Fired emp.works_for.locations[0] > change...
    //Fired emp.works_for.locations[0].zip > change...

    emp.on('add:dependents', function () {
        console.log("Fired emp > add:dependents...");
    });
    emp.on('remove:dependents', function () {
        console.log("Fired emp > remove:dependents...");
    });
    emp.on('reset:dependents', function () {
        console.log("Fired emp > reset:dependents...");
    });

    emp.get('dependents').on('add', function () {
        console.log("Fired emp.dependents add...");
    });
    emp.get('dependents').on('remove', function () {
        console.log("Fired emp.dependents remove...");
    });
    emp.get('dependents').on('reset', function () {
        console.log("Fired emp.dependents reset...");
    });


    emp.get("dependents").add(child2);
    emp.get("dependents").remove([child1]);
    emp.get("dependents").reset();

    //Console log
    //Fired emp.dependents add...
    //Fired Fired emp.dependents remove...
    //Fired emp.dependents reset...

    //Fired emp > add:dependents...
    //Fired emp > remove:dependents...
    //Fired emp > reset:dependents...


````
The above example corresponds to this [test case](http://dhruvaray.github.com/backbone-associations/test/test-suite.html?module=Examples&testNumber=32).
Other examples can be found in the [test suite](http://dhruvaray.github.com/backbone-associations/test/test-suite.html).

## <a name="performance"/>Performance

![Performance]((http://dhruvaray.github.com/backbone-associations/docs/img/speed.png)

Each operation comprises of n (10, 15, 20, 25, 30) inserts. The chart above compares the performance (time and operations/sec) of the two implementations.

Want to change the test? You can do it [here](http://jsperf.com/backbone-associations-speed-suit/2)

## <a name="changelog"/>Change Log
#### Version 0.3.0 - [Diff](https://github.com/dhruvaray/backbone-associations/compare/v0.2.0...v0.3.0)
* Added support for fully qualified event "path" names.
* Event arguments and event paths are semantically consistent.
* Now supports backbone 0.9.9 and underscore 1.4.3.
* New tutorials on usage (part of README.md)



#### Version 0.2.0 - [Diff](https://github.com/dhruvaray/backbone-associations/compare/v0.1.0...v0.2.0)
Added support for cyclic object graphs.

#### Version 0.1.0
Initial Backbone-associations release.

