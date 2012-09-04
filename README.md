# Backbone-associations
Backbone-associations was born out of a need to provide a lightweight implementation of [Backbone-relational](https://github.com/PaulUithol/Backbone-relational/) with a limited, but commonly used feature subset. It supports one-to-one and one-to-many relations between Backbone.Models. This implementation offers speed and a low memory footprint for models having these relation types. It is able to handle updates to nested models in a performing fashion. Refer to the online [test suite](http://dhruvaray.github.com/backbone-associations/test/test-suite.html). 

![Performance](https://raw.github.com/dhruvaray/backbone-associations/master/test/speed.png)

Each operation comprises of n (10, 15, 20, 25, 30) inserts. The chart above compares the performance (time and operations/sec) of the two implementations. 

The [annotated](http://dhruvaray.github.com/backbone-associations/docs/backbone-associations.html) version of the source code is also provided.

## Contents
* [Download](#download)
* [Installation](#installation)
* [Specifying Associations](#associations)
* [Eventing with Associations](#eventing)
* [Change Log](#changelog)


### <a name="download"/>Download

* [Minified version 0.2.0 ](http://dhruvaray.github.com/backbone-associations/backbone-associations-min.js)
* [Development version 0.2.0](http://dhruvaray.github.com/backbone-associations/backbone-associations.js)


### <a name="installation"/>Installation

Backbone-associations depends on [backbone](https://github.com/documentcloud/backbone) (and thus on  [underscore](https://github.com/documentcloud/underscore)). Include Backbone-relational right after Backbone and Underscore:

```html
<script type="text/javascript" src="./js/underscore.js"></script>
<script type="text/javascript" src="./js/backbone.js"></script>
<script type="text/javascript" src="./js/backbone-associations.js"></script>
```

Backbone-associations has been tested with Backbone 0.9.2 (or newer) and Underscore 1.3.1 (or newer).


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
    mananger : {}
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

## <a name="eventing"/>Eventing with `AssociatedModels`
CRUD operations on AssociatedModels trigger the appropriate events - identical to base Backbone Models & Collections.  This is best understood with a simple example. More detailed examples can be found in the [test suite](http://dhruvaray.github.com/backbone-associations/test/test-suite.html). 


````javascript

var emp = new Employee({
  fname : "John",
  lname : "Smith",
  age : 21,
});
var mgr = new Employee({
  fname : "Tom",
  lname : "Hanks",
  age : 32,
});

var loc1 = new Location({
  add1 : "P.O Box 3899",
  zip: "94404",
  state : "CA"
});

var loc2 = new Location({
  add1 : "P.O Box 4899",
  zip: "95502",
  state : "CA"
});

var project1 = new Project({
  name : "Project X",
  number: "2"
});

 //set up eventing
emp.on('change:manager',function(){
  console.log("change:manager fired...");
});                

emp.set({manager:mgr});

emp.get("manager").on('change',function(){
  console.log("change on manager fired...");
});

emp.get("manager").set({'fname':'Greg'});    

//set up eventing
project1.get('locations').on('reset',function(){
  console.log("reset on locations fired...");
});                
project1.get('locations').on('add',function(){
  console.log("change:locations fired...");
});                

project1.get('locations').add([loc1, loc2]);
project1.get('locations').reset();

//Console Log
//change:manager fired...
//change on manager fired...
//change:locations fired...
//change:locations fired...
//reset on locations fired...

````

## <a name="changelog"/>Change Log
#### Version 0.2.0
Added support for cyclic object graphs.

#### Version 0.1.0
Initial Backbone-associations release.

