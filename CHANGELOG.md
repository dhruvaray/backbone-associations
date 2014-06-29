### Version 0.6.2 - [Diff](https://github.com/dhruvaray/backbone-associations/compare/v0.6.1...v0.6.2)

* Introducing `collectionOptions` - Can be an options hash or a function which returns an options hash. These options will be utilized while instantiating a new collection of type `collectionType`
* Allow leaf nodes of the object graph to be simple Backbone.Model(s) as well.
* Set `parents` property eagerly, so that it is available in the children `initialize` at the time of graph creation.
* Bug fix : Remove references from parents during re-assignment and model `destroy` operations (Issue #111 & #114)
* Bug fix : Check for existence (rather than value) for `idAttribute` (Issue #112) 
* Bug fix : Check for null/undefined v/s legitimate false value scenarios (Issue #137)
* Bug fix : Checks for maps returning null values (Issue #133)


### Version 0.6.1 - [Diff](https://github.com/dhruvaray/backbone-associations/compare/v0.6.0...v0.6.1)

* Bug fix : Add underscore as explicit dependency for BB-Associations in the node.js environment.
* Compatible with Backbone.js v1.1.2.

### Version 0.6.0 - [Diff](https://github.com/dhruvaray/backbone-associations/compare/v0.5.5...v0.6.0)

* __Use v0.6.1 when using Backbone-Associations in node.js environments__
* Significantly improve event bubbling performance. Only bubble events if objects are listening to those event paths. 
* BREAKING CHANGE : nested-change events are not fired by default. To switch them on set Backbone.Associations.EVENTS_NC = true at any point in your application flow.
* `collectionType` can be a function as well. This makes the API of `relatedModel` and `collectionType` uniform.
* Added support for specifying global scopes. When `relatedModel` and `collectionType` are specified as strings, the global scopes will also be searched for locating the model definition.
* Additional attribute - `scope` - can now be specified while defining a relation. Use to it define the scope of `relatedModel` and `collectionType` string.
* Additional attribute - `serialize` - can now be specified while defining a relation. Use this attribute to set an array of attributes (singleton or subset) which will be serialized to the server end-point. 
* Compatible with Backbone.js v1.1.1.

### Version 0.5.5 - [Diff](https://github.com/dhruvaray/backbone-associations/compare/v0.5.4...v0.5.5)

* Improve event bubbling performance for large object graphs.
* Introduces flags to switch off/on events. Set Backbone.Associations.EVENTS_WILDCARD = false to stop throwing wild-char events. Set Backbone.Associations.EVENTS_NC = false to stop throwing nested-change events. Set Backbone.Associations.EVENTS_BUBBLE = false to conditionally stop events from bubbling up. May be useful when constructing complex object (sub) graphs. After construction the value can be set to true. Note that all of these flags can be toggled at any time during the application flow.
* Introduces isTransient flag to avoid serializing the particular attribute in toJSON().
* Introduces remoteKey for serializing relations to a different key name. Useful in ROR nested-attributes like scenarios.

### Version 0.5.4 - [Diff](https://github.com/dhruvaray/backbone-associations/compare/v0.5.3...v0.5.4)

* Supports Backbone v1.1.0
* Allows for polymorphic models in 1:M relations
* IE 8 compatibility fix - Issue #77
* Fix for idAttribute - Issue #80

### Version 0.5.3 - [Diff](https://github.com/dhruvaray/backbone-associations/compare/v0.5.2...v0.5.3)

* Enhancement (Issue #68) : Allow users to change path separator globally. This will allow attributes with a period('.') in their name.
* Bug Fix #67 : Preserve object references.
* Bug Fix #66 : Browserify compatibility.

### Version 0.5.2 - [Diff](https://github.com/dhruvaray/backbone-associations/compare/v0.5.1...v0.5.2)

* Bug fix : Nested collections re-use references.
* Bug fix : Propagate user defined options for nested-change events.
* Bug fix : In a cycle scenario, a call to toJSON inside an event handler would not create the right JSON.
* Increase error handling so that users will not trip up when they mis-type or enter wrong values during relation defintions.
* The map function is now called with a specific AssociatedModel instance (as context). It takes in an additional paramter - which specifies the type of the relatedModel or Collection type. Could be useful in scnearios when you want to generalize the map function across relation types. See this [recipe](http://dhruvaray.github.io/backbone-associations/recipes.html#tut-map2).
* For cycle scenarios, the toJSON method serializes with {id:value} when it detects a cycle. This is a good default. Users can over-ride if necessary. See this [recipe](http://dhruvaray.github.io/backbone-associations/recipes.html#tut-rev).

### Version 0.5.1 - [Diff](https://github.com/dhruvaray/backbone-associations/compare/v0.5.0...v0.5.1)

* `relatedModel` can now also be a function. Could be used to model polymorphic associations like in this [gist](https://gist.github.com/dhruvaray/5988996).
* `relatedModel` can be passed a special value called `Backbone.self` to handle self references.
* Introducing explicit cleanup on `Backbone.Model` to prevent memory leaks when users set `Backbone.Model` to undefined explicitly.
* Fixed the handling of {reset:true} option on `Backbone.Collection`.
* Fixed a scenario where repeated fetch on the same `Backbone.Model` or `Backbone.Collection` caused event bubbling to stop.


#### Version 0.5.0 - [Diff](https://github.com/dhruvaray/backbone-associations/compare/v0.4.2...v0.5.0)
* Introducing "nested-change" event to allow parents (and higher) to listen to any changes in the hierarchy.
* Introducing * operator in paths involving collections. Has semantics of any item in the collection.
* change, add, remove, reset, destroy and sort events are compatible with * operator.
* Implicit reverse relations.
* Provision for mapping data before assigning to AssociatedModel attribute.
* Whether to create or update a nested AssociatedModel (or Backbone Collection) is now dependent on value of the
existing idAttribute on the AssociatedModel or Collection.
* New website with improved help and tutorials.

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

