# Backbone-associations
Backbone-associations provides a way of specifying 1:1 and 1:N relationships between Backbone models. Additionally, parent model instances (and objects extended from `Backbone.Events`) can listen in to CRUD events initiated on any children - in the object graph - by providing an appropriately qualified event path name. It aims to provide a clean implementation which is easy to understand and extend. It is [performant](#performance) for CRUD operations - even on deeply nested object graphs - and uses a low memory footprint. Web applications leveraging the client-side-MVC architectural style will benefit by using `backbone-associations` to define and manipulate client object graphs.

It comes with
* The [annotated](http://dhruvaray.github.com/backbone-associations/docs/backbone-associations.html) source code.
* An online [test suite](http://dhruvaray.github.com/backbone-associations/test/test-suite.html) which includes backbone test cases run with `AssociatedModel`s.
* Performance [tests](http://dhruvaray.github.com/backbone-associations/test/speed-comparison.html).

It was originally born out of a need to provide a simpler and speedier implementation of [Backbone-relational](https://github.com/PaulUithol/Backbone-relational/)

## Contents
* [Download](#download)
* [Installation](#installation)
* [Specifying Associations](#associations)
* [Tutorial : Defining a graph of `AssociatedModel` relationships](#tutorial-associationsdef)
* [Eventing with Associations](#eventing)
* [Tutorial : Eventing with a graph of `AssociatedModel` objects](#tutorial-eventing)
* [Perform set and get operations with fully qualified paths](#paths)
* [Pitfalls](#pitfalls)
* [Performance Comparison](#performance)
* [Change Log](#changelog)


## <a name="download"/>Download

* [Production version - 0.4.2](http://dhruvaray.github.com/backbone-associations/backbone-associations-min.js) (1.44K packed and gzipped)
* [Development version - 0.4.2](http://dhruvaray.github.com/backbone-associations/backbone-associations.js)
* [Edge version : ] (https://raw.github.com/dhruvaray/backbone-associations/master/backbone-associations.js)[![Build Status](https://travis-ci.org/dhruvaray/backbone-associations.png?branch=master)](https://travis-ci.org/dhruvaray/backbone-associations)


## <a name="installation"/>Installation

Backbone-associations depends on [backbone](https://github.com/documentcloud/backbone) (and thus on  [underscore](https://github.com/documentcloud/underscore)). Include Backbone-associations right after Backbone and Underscore:

```html
<script type="text/javascript" src="./js/underscore.js"></script>
<script type="text/javascript" src="./js/backbone.js"></script>
<script type="text/javascript" src="./js/backbone-associations.js"></script>
```

Backbone-associations works with Backbone v0.9.10. Underscore v1.4.3 upwards is supported.


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

## <a name="tutorial-associationsdef"/> Tutorial : Defining a graph of `AssociatedModel` relationships

This tutorial demonstrates how to convert the following relationship graph into an `AssociatedModels` representation
![cd_example](http://dhruvaray.github.com/backbone-associations/docs/img/cd_example.png)
This image was generated via [code](https://github.com/dhruvaray/backbone-associations/blob/master/docs/cd_example.tex).

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
emp.on('change:works_for.locations[0].zip', callback_function);

emp.get('works_for').on('change:locations[0].zip', callback_function);

emp.get('works_for').get('locations').at(0).on('change:zip', callback_function);

````

With backbone v0.9.9 onwards, another object can also listen in to events like this

````javascript

var listener = {};
_.extend(listener, Backbone.Events);

listener.listenTo(emp, 'change:works_for.locations[0].zip', callback_function);

listener.listenTo(emp.get('works_for'), 'change:locations[0].zip', callback_function);

listener.listenTo(emp.get('works_for').get('locations').at(0), 'change:zip', callback_function);


````


A detailed example is provided below to illustrate the behavior for other event types as well as the appropriate usage of the Backbone [change-related methods](http://backbonejs.org/#Model-hasChanged) used in callbacks.

## <a name="tutorial-eventing"/>  Tutorial : Eventing with a graph of `AssociatedModel` objects

This tutorial demonstrates the usage of eventing and change-related methods with `AssociatedModels`

#### Setup of relationships between `AssociatedModel` instances
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

````

#### Assign `Associated Model` instances to other properties
````javascript
    emp.on('change', function () {
        console.log("Fired emp > change...");
        //emp.hasChanged() === true;
        //emp.hasChanged("works_for") === true;
    });
    emp.on('change:works_for', function () {
        console.log("Fired emp > change:works_for...");
        var changed = emp.changedAttributes();
        //changed['works_for'].toJSON() equals emp.get("works_for").toJSON()
        //emp.previousAttributes()['works_for'].get('name') === "");
        //emp.previousAttributes()['works_for'].get('number') === -1;
        //emp.previousAttributes()['works_for'].get('locations').length === 0;
        //emp.previousAttributes()['works_for'].get('controls').length === 0;
    });

    emp.set({works_for:dept1});
    //Console log
    //Fired emp > change:works_for...
    //Fired emp > change...

````

#### Update attributes of `AssociatedModel` instances

````javascript

    //Remove event handlers. Can also use backbone 0.9.9+ once API (on the previous emp event handlers)
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
        //emp.changedAttributes()['works_for'].toJSON() equals emp.get("works_for").toJSON();
        //emp.get("works_for").previousAttributes()["name"] === "R&D";
        //emp.get("works_for").previous("name") === "R&D";
    });

    emp.on('change:works_for', function () {
        console.log("Fired emp > change:works_for...");
        //emp.hasChanged());
        //emp.hasChanged("works_for"));
        //emp.changedAttributes()['works_for'].toJSON() equals emp.get("works_for").toJSON();
        //emp.previousAttributes().works_for.name === "R&D";
    });

    emp.get('works_for').set({name:"Marketing"});

    //Console log
    //Fired emp.works_for > change:name
    //Fired emp > change:works_for.name...
    //Fired emp.works_for > change...
    //Fired emp > change:works_for...

````

#### Update an item in a `Collection` of `AssociatedModel`s
````javascript
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

    emp.on('change:works_for.controls[0].locations[0].zip', function () {
        console.log("Fired emp > change:works_for.controls[0].locations[0].zip...");
    });

    emp.on('change:works_for.controls[0].locations[0]', function () {
        console.log("Fired emp > change:works_for.controls[0].locations[0]...");
    });

    emp.get('works_for').on('change:controls[0].locations[0].zip', function () {
        console.log("Fired emp.works_for > change:controls[0].locations[0].zip...");
    });

    emp.get('works_for').on('change:controls[0].locations[0]', function () {
        console.log("Fired emp.works_for > change:controls[0].locations[0]...");
    });

    emp.get('works_for').get("locations").at(0).set('zip', 94403);

    //Console log
    //Fired emp.works_for > change:controls[0].locations[0]...
    //Fired emp.works_for > change:controls[0].locations[0].zip...
    //Fired emp.works_for > change:locations[0]...
    //Fired emp.works_for > change:locations[0].zip...

    //Fired emp > change:works_for.controls[0].locations[0]...
    //Fired emp > change:works_for.controls[0].locations[0].zip...
    //Fired emp > change:works_for.locations[0]...
    //Fired emp > change:works_for.locations[0].zip...

    //Fired emp.works_for.locations[0] > change...
    //Fired emp.works_for.locations[0].zip > change...
````

#### Add, remove and reset operations
````javascript

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
The preceding examples corresponds to this [test case](http://dhruvaray.github.com/backbone-associations/test/test-suite.html?module=Examples).
Other examples can be found in the [test suite](http://dhruvaray.github.com/backbone-associations/test/test-suite.html).

## <a name="paths"/>Retrieve and set data with fully qualified paths
For convenience, it is also possible to retrieve or set data by specifying a path to the destination (of the retrieve or set operation).


````javascript
    emp.get('works_for.controls[0].locations[0].zip') //94404
    //Equivalent to emp.get('works_for').get('controls').at(0).get('locations').at(0).get('zip');
    emp.set('works_for.locations[0].zip', 94403);
    //Equivalent to emp.get('works_for').get('locations').at(0).set('zip',94403);
````

## <a name="performance"/>Pitfalls

##### Query the appropriate object to determine change

When assigning a previously created object graph to a property in an associated model, care must be taken to query the appropriate object for the changed properties.

````javascript
dept1 = new Department({
    name:"R&D",
    number:"23"
});

//dept1.hasChanged() === false;

emp.set('works_for', dept1);
````

Then inside a previously defined `change` event handler

````javascript

emp.on('change:works_for', function () {
    //emp.get('works_for').hasChanged() === false; as we query a previously created `dept1` instance
    //emp.hasChanged('works_for') === true; as we query emp whose 'works_for' attribute has changed
});

````

##### Use unqualified `change` event name with care

This extension makes use of _fully-qualified-event-path names_ to identify the location of the change in the object graph. (And the event arguments would have the changed object or object property).

The unqualified `change` event would work if an entire object graph is being replaced with another. For example

```javascript

    emp.on('change', function () {
        console.log("emp has changed");//This WILL fire
    });
    emp.on('change:works_for', function () {
        console.log('emp attribute works_for has changed');//This WILL fire
    });
    emp.set('works_for', {name:'Marketing', number:'24'});

```

However, if attributes of a nested object are changed, the unqualified `change` event will not fire for objects (and their parents) who have that nested object as their child.

```javascript

    emp.on('change', function () {
            console.log("emp has changed"); //This will NOT fire
    });
    emp.on('change:works_for', function () {
            console.log('emp attribute works_for has changed');//This WILL fire
    });
    emp.get('works_for').set('name','Marketing');

```
Refer to issue [#28](https://github.com/dhruvaray/backbone-associations/issues/28) for a more detailed reasoning.

## <a name="performance"/>Performance Comparison

![Performance](http://dhruvaray.github.com/backbone-associations/docs/img/speed0.4.1.png)

Each operation comprises of n (10, 15, 20, 25, 30) inserts. The chart above compares the performance (time and operations/sec) of the two implementations. (backbone-associations v0.4.1 v/s backbone-relational v0.7.1)

Run tests on your machine configuration instantly [here](http://dhruvaray.github.com/backbone-associations/test/speed-comparison.html)

Write your own test case [here](http://jsperf.com/backbone-associations-speed-suit/3)

## <a name="changelog"/>Change Log

#### Version 0.4.2 - [Diff](https://github.com/dhruvaray/backbone-associations/compare/v0.4.1...v0.4.2)
* Support for backbone 1.0.0.

#### Version 0.4.1 - [Diff](https://github.com/dhruvaray/backbone-associations/compare/v0.4.0...v0.4.1)
* Support for backbone 0.9.10.
* Faster (Non-recursive) implementation of AssociatedModel change-related methods.

#### Version 0.4.0 - [Diff](https://github.com/dhruvaray/backbone-associations/compare/v0.3.1...v0.4.0)
* Ability to perform set and retrieve operations with fully qualified paths.

#### Version 0.3.1 - [Diff](https://github.com/dhruvaray/backbone-associations/compare/v0.3.0...v0.3.1)
* Bug fix for event paths involving collections at multiple levels in the object graph.
* Updated README with class diagram and example for paths involving collections.


#### Version 0.3.0 - [Diff](https://github.com/dhruvaray/backbone-associations/compare/v0.2.0...v0.3.0)
* Added support for fully qualified event "path" names.
* Event arguments and event paths are semantically consistent.
* Now supports both backbone 0.9.9 and 0.9.2.
* New tutorials on usage. (part of README.md)



#### Version 0.2.0 - [Diff](https://github.com/dhruvaray/backbone-associations/compare/v0.1.0...v0.2.0)
Added support for cyclic object graphs.

#### Version 0.1.0
Initial Backbone-associations release.

