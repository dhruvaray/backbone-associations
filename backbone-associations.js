//
// Backbone-associations.js 0.2.0
//
// (c) 2012 Dhruva Ray, Jaynti Kanani
//
// Backbone-associations may be freely distributed under the MIT license; see the accompanying LICENSE.txt.
//
// Depends on [Backbone](https://github.com/documentcloud/backbone) (and thus on [Underscore](https://github.com/documentcloud/underscore/) as well)
//
// A complete [Test & Benchmark Suite](../test/test-suite.html) is included for your perusal.

// Initial Setup
// --------------
(function () {
    // The top-level namespace. All public Backbone classes and modules will be attached to this.
    // Exported for the browser and CommonJS.
    var root = this, _ = root._, Backbone = root.Backbone, BackboneModel, defaultEvents;
    if (!_ && typeof exports !== 'undefined') {
        _ = require('underscore');
        Backbone = require('backbone');
        exports = module.exports = Backbone;
    }
    BackboneModel = Backbone.Model.prototype;
    defaultEvents = ["change", "add", "remove", "reset", "destroy", "sync", "error"];

    // Backbone.AssociatedModel
    // --------------

    //Add `Many` and `One` relations to Backbone Object
    Backbone.Many = "Many";
    Backbone.One = "One";
    //Define `AssociatedModel` (Extends Backbone.Model)
    Backbone.AssociatedModel = Backbone.Model.extend({
        //Define relations with Associated Model
        relations:undefined,
        _proxyCalls:undefined,
        //Set a hash of model attributes on the object,
        //firing `"change"` unless you choose to silence it.
        //It maintains relations between models during the set operation. It also bubbles up child events to the parent.
        set:function (key, value, options) {
            var attributes, processedRelations, tbp, attr;
            // Duplicate backbone's behavior to allow separate key/value parameters, instead of a single 'attributes' object.
            if (_.isObject(key) || key == null) {
                attributes = key;
                options = value;
            } else {
                attributes = {};
                attributes[key] = value;
            }
            // Extract attributes and options.
            options || (options = {});
            if (!attributes) return this;
            if (options.unset) for (attr in attributes) attributes[attr] = void 0;
            //Check for existence of relations in this model
            if (this.relations) {
                //Iterate over `this.relations` and `set` model and collection values
                _.each(this.relations, function (relation) {
                    var relationKey = relation.key, relatedModel = relation.relatedModel, collectionType = relation.collectionType,
                        val, relationOptions, data, defaults;
                    if (attributes[relationKey]) {
                        //Get value of attribute with relation key in `val`
                        val = getValue(attributes, relationKey);
                        //Get class if relation is stored as a string
                        relatedModel && _.isString(relatedModel) && (relatedModel = eval(relatedModel));
                        collectionType && _.isString(collectionType) && (collectionType = eval(collectionType));
                        //Merge in options specific to this relation
                        relationOptions = relation.options ? _.extend({}, relation.options, options) : options;
                        //If `relation` defines model as associated collection...
                        if (relation.type === Backbone.Many) {
                            //`collectionType` should be instance of `Backbone.Collection`
                            if (collectionType && !collectionType.prototype instanceof Backbone.Collection) {
                                throw new Error('collectionType must inherit from Backbone.Collection');
                            }

                            if (val instanceof Backbone.Collection) {
                                BackboneModel.set.call(this, relationKey, val);
                            } else if (!this.attributes[relationKey]) {
                                data = collectionType ? new collectionType() : this._createCollection(relatedModel);
                                data.add(val, relationOptions);
                                BackboneModel.set.call(this, relationKey, data);
                            } else {
                                this.attributes[relationKey].reset(val, relationOptions);
                            }

                            //If `relation` defines model as associated model...
                        } else if (relation.type === Backbone.One && relatedModel) {
                            if (val instanceof Backbone.AssociatedModel) {
                                BackboneModel.set.call(this, relationKey, val);
                            } else if (!this.attributes[relationKey]) {
                                data = new relatedModel(val);
                                BackboneModel.set.call(this, relationKey, data);
                            } else {
                                data = {};
                                defaults = getValue(this.attributes[relationKey], 'defaults');
                                _.each(this.attributes[relationKey].attributes, function (value, key) {
                                    !_.has(val, key) && (data[key] = (defaults ? defaults[key] : void 0));
                                });
                                this.attributes[relationKey].set(data, {silent:true});
                                this.attributes[relationKey].set(val);
                            }
                        }

                        //Add proxy events to respective parents. Only add callback if not defined
                        if (!this.attributes[relationKey]._proxyCallback) {
                            this.attributes[relationKey]._proxyCallback = function () {
                                var args = arguments,
                                    opt = args[0].split(":"),
                                    eventType = opt[0],
                                    eventObject = args[1],
                                    indexEventObject = -1,
                                    _proxyCalls = this.attributes[relationKey]._proxyCalls,
                                    eventPath,
                                    eventAvailable;

                                //Change the event name to a fully qualified path
                                if (_.contains(defaultEvents, eventType)) {
                                    if (opt && _.size(opt) > 1) {
                                        eventPath = opt[1];
                                    }
                                    //find the specific object in the collection which has changed
                                    if (this.attributes[relationKey] instanceof Backbone.Collection && "change" === eventType) {
                                        indexEventObject = _.indexOf(this.attributes[relationKey].models, eventObject);
                                    }

                                    eventPath = relationKey + (indexEventObject !== -1 ? "[" + indexEventObject + "]" : "") + (eventPath ? "." + eventPath : "");
                                    args[0] = eventType + ":" + eventPath;

                                    if (this.attributes[relationKey] instanceof Backbone.AssociatedModel) {
                                        if (_proxyCalls) {
                                            //If event has been already triggered as result of same source `eventPath`,
                                            //no need to re-trigger event to prevent cycle
                                            eventAvailable = _.find(_proxyCalls, function (value, eventKey) {
                                                //`event` ends with eventKey
                                                var d = eventPath.length - eventKey.length;
                                                return eventPath.indexOf(eventKey, d) !== -1;
                                            });
                                            if (eventAvailable) {
                                                return this;
                                            }
                                        } else {
                                            _proxyCalls = this.attributes[relationKey]._proxyCalls = {};
                                        }
                                        // Add `eventPath` in `_proxyCalls` hash to track of.
                                        _proxyCalls[eventPath] = true;
                                    }


                                }

                                // bubble up event to parent `model`
                                this.trigger.apply(this, args);

                                // remove `eventPath` from `_proxyCalls`, if `eventPath` and `_proxCalls` are available.
                                if (eventPath && _proxyCalls) {
                                    delete _proxyCalls[eventPath];
                                }
                                return this;
                            };

                            this.attributes[relationKey].on("all", this.attributes[relationKey]._proxyCallback, this);
                        }

                        //Create a local `processedRelations` array to store the relation key which has been processed.
                        //We cannot use `this.relations` because if there is no value defined for `relationKey`, it will not get processed by either Backbone `set` or the `AssociatedModel` set
                        !processedRelations && (processedRelations = []);
                        if (_.indexOf(processedRelations, relationKey) === -1) {
                            processedRelations.push(relationKey);
                        }
                    }
                }, this);
            }
            if (processedRelations) {
                //Find attributes yet to be processed - `tbp`
                tbp = {};
                for (attr in attributes) {
                    if (_.indexOf(processedRelations, attr) === -1) {
                        tbp[attr] = attributes[attr];
                    }
                }
            } else {
                //Set all `attributes` to `tbp`
                tbp = attributes;
            }
            //Returns results for `BackboneModel.set`
            return BackboneModel.set.call(this, tbp, options);
        },
        //Returns New `collection` of type `relation.relatedModel`
        _createCollection:function (type) {
            var collection, relatedModel = type;
            _.isString(relatedModel) && (relatedModel = eval(relatedModel));
            if (relatedModel && relatedModel.prototype instanceof Backbone.AssociatedModel) {
                //Creates new `Backbone.Collection` and defines model class
                collection = new Backbone.Collection();
                collection.model = relatedModel;
            } else {
                throw new Error('type must inherit from Backbone.AssociatedModel');
            }
            return collection;
        },
        //Has the model changed. Traverse the object hierarchy to compute dirtyness
        hasChanged:function (attr) {
            var isDirty;
            //To prevent cycles, check if this node is visited
            if (!this.visitedHC) {
                this.visitedHC = true;
                if (!arguments.length) {
                    isDirty = Backbone.Model.prototype.hasChanged.call(this);
                    //Go down the hierarchy to see if anything has changed
                    if (!isDirty) {
                        if (this.relations) {
                            for (var i = 0; i < this.relations.length; ++i) {
                                var relation = this.relations[i];
                                if (this.attributes[relation.key] != undefined) {
                                    if (this.attributes[relation.key] instanceof Backbone.AssociatedModel) {
                                        if (this.attributes[relation.key].hasChanged())
                                            isDirty = true;
                                        break;
                                    }
                                    if (this.attributes[relation.key] instanceof Backbone.Collection) {
                                        var dirtyObjects = _.filter(this.attributes[relation.key].models, function (m) {
                                            return (m.hasChanged() === true)
                                        });
                                        if (dirtyObjects && dirtyObjects.length > 0) {
                                            isDirty = true;
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                    }
                } else {
                    isDirty = (this.attributes[attr] !== undefined) && (this.attributes[attr] instanceof Backbone.AssociatedModel) ?
                        this.attributes[attr].hasChanged() : Backbone.Model.prototype.hasChanged.call(this, attr);
                }
                delete this.visitedHC;
            }
            return isDirty;

        },
        //Returns a hash of the changed attributes
        changedAttributes:function (diff) {
            if (!diff) {
                var delta = false;
                //To prevent cycles, check if this node is visited
                if (!this.visitedCA) {
                    this.visitedCA = true;
                    delta = Backbone.Model.prototype.changedAttributes.call(this);
                    if (this.relations) {
                        for (var i = 0; i < this.relations.length; ++i) {
                            var relation = this.relations[i];
                            if (this.attributes[relation.key] !== undefined) {
                                if (this.attributes[relation.key] instanceof Backbone.AssociatedModel) {
                                    if (this.attributes[relation.key].hasChanged())
                                        delta[relation.key] = this.attributes[relation.key].toJSON();
                                }
                                if (this.attributes[relation.key] instanceof Backbone.Collection) {
                                    var changedCollection = _.filter(_.map(this.attributes[relation.key].models, function (m) {
                                        return m.changedAttributes();
                                    }), function (m) {
                                        return m !== false;
                                    });
                                    if (changedCollection && changedCollection.length > 0) {
                                        delta[relation.key] = changedCollection;
                                    }
                                }
                            }
                        }
                    }
                    delete this.visitedCA;
                }
                return delta;
            }
            var val, changed = false, old = this.previousAttributes();
            for (var attr in diff) {
                if (_.isEqual(old[attr], (val = diff[attr]))) continue;
                (changed || (changed = {}))[attr] = val;
            }
            return changed;
        },
        //Returns the previous attributes of the graph
        previousAttributes:function () {
            var pa;
            //To prevent cycles, check if this node is visited
            if (!this.visitedPA) {
                this.visitedPA = true;
                pa = BackboneModel.previousAttributes.apply(this, arguments);
                if (this.relations) {
                    _.each(this.relations, function (relation) {
                        if (this.attributes[relation.key] instanceof Backbone.AssociatedModel)
                            pa[relation.key] = this.attributes[relation.key].previousAttributes();
                        if (this.attributes[relation.key] instanceof Backbone.Collection)
                            pa[relation.key] = _.map(this.attributes[relation.key].models, function (m) {
                                return m.previousAttributes()
                            });
                    }, this);
                }
                delete this.visitedPA;
            }
            return pa;
        },
        //Return the previous value of the passed in attribute
        previous:function (attr) {
            return this.previousAttributes()[attr];
        },
        //The JSON representation of the model.
        toJSON:function (options) {
            var json, aJson;
            if (!this.visited) {
                this.visited = true;
                //Get json representation from `BackboneModel.toJSON`
                json = BackboneModel.toJSON.apply(this, arguments);
                //If `this.relations` is defined, iterate through each `relation` and added it's json representation to parents' json representation
                if (this.relations) {
                    _.each(this.relations, function (relation) {
                        var attr = this.attributes[relation.key];
                        if (attr) {
                            aJson = attr.toJSON(options);
                            json[relation.key] = _.isArray(aJson) ? _.compact(aJson) : aJson;
                        }
                    }, this);
                }
                delete this.visited;
            }
            return json;
        },
        //deep `clone` the model.
        clone:function () {
            var cloneObj, newCollection;
            if (!this.visited) {
                this.visited = true;
                //Get shallow clone from `BackboneModel.clone`
                cloneObj = BackboneModel.clone.apply(this, arguments);
                //If `this.relations` is defined, iterate through each `relation` and `clone`
                if (this.relations) {
                    _.each(this.relations, function (relation) {
                        if (this.attributes[relation.key]) {
                            var sourceObj = cloneObj.attributes[relation.key];
                            if (sourceObj instanceof Backbone.Collection) {
                                //Creates new `collection` using `relation`
                                newCollection = relation.collectionType ? new relation.collectionType() : this._createCollection(relation.relatedModel);
                                //Added each `clone` model to `newCollection`
                                sourceObj.each(function (model) {
                                    var mClone = model.clone();
                                    mClone && newCollection.add(mClone);
                                });
                                cloneObj.attributes[relation.key] = newCollection;
                            } else if (sourceObj instanceof Backbone.Model) {
                                cloneObj.attributes[relation.key] = sourceObj.clone();
                            }
                        }
                    }, this);
                }
                delete this.visited;
            }
            return cloneObj;
        }
    });
    // Duplicate Backbone's behavior. To get a value from a Backbone object as a property
    // or as a function.
    var getValue = function (object, prop) {
        if (!(object && object[prop])) return null;
        return _.isFunction(object[prop]) ? object[prop]() : object[prop];
    };
})();
