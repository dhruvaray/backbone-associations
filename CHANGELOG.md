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

