# Backbone-associations
Backbone-associations was born out of a need to provide a lightweight implementation of [Backbone-relational](https://github.com/PaulUithol/Backbone-relational/) with a limited, but commonly used feature subset. We support one-to-one and one-to-many relations between Backbone.Models. This implementation offers speed and a low memory footprint for models having these relation types. It is able to handle updates to nested models in a performing fashion. See [benchmarks and tests](https://raw.github.com/dhruvaray/backbone-associations/master/test/test-suite.html) for detailed results.


## Contents

* [Download](#download)
* [Installation](#installation)
* [Specifying Associations](#associations)
* [Eventing with Associations](#eventing)
* [Known Issues](#issues)

### <a name="download"/>Download
You can download the latest 

* [Development Version 0.1](https://raw.github.com/dhruvaray/backbone-associations/master/backbone-associations.js)
* [Production Version 0.1](https://raw.github.com/dhruvaray/backbone-associations/master/backbone-associations-min.js) 

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
CRUD operations on AssociatedModels trigger the appropriate events - identical to base Backbone Models & Collections.  This is best understood with a simple example. More detailed examples can be found in the [test suite](https://raw.github.com/dhruvaray/backbone-associations/master/test/test-suite.html). 


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

emp.get("manager").on('change',function(){
  console.log("`change` on manager fired...");
});

emp.set({manager:mgr});

//Console Log
//change:manager fired...
//`change` on manager fired...

//set up eventing
project1.on('change',function(){
  console.log("change:project fired...");
});                
project1.on('change:locations',function(){
  console.log("change:locations fired...");
});                

project1.set({locations:[loc1, loc2]});

//Console Log
//change:project fired...
//"change:locations fired...

````

## <a name="issues"/>Known Issues

#### Version 0.1
Cyclic object graphs are not supported.

