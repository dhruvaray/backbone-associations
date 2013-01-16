//
//      Backbone-associations.js 0.4.0
//
//      (c) 2013 Dhruva Ray, Jaynti Kanani, Persistent Systems Ltd.
//      Backbone-associations may be freely distributed under the MIT license.
//      For all details and documentation:
//      https://github.com/dhruvaray/backbone-associations/
//

// Initial Setup
// --------------
(function () {
    "use strict";

    // Save a reference to the global object (`window` in the browser, `exports`
    // on the server).
    var root = this;

    // The top-level namespace. All public Backbone classes and modules will be attached to this.
    // Exported for the browser and CommonJS.
    var _, Backbone, BackboneModel, BackboneCollection, ModelProto,
        defaultEvents, AssociatedModel, pathChecker;

    if (typeof require !== 'undefined') {
        _ = require('underscore');
        Backbone = require('backbone');
        exports = module.exports = Backbone;
    } else {
        _ = root._;
        Backbone = root.Backbone;
    }
    // Create local reference `Model` prototype.
    BackboneModel = Backbone.Model;
    BackboneCollection = Backbone.Collection;
    ModelProto = BackboneModel.prototype;
    pathChecker = /[\.\[\]]+/g;

    // Built-in Backbone `events`.
    defaultEvents = ["change", "add", "remove", "reset", "destroy",
        "sync", "error", "sort", "request"];

    // Backbone.AssociatedModel
    // --------------

    //Add `Many` and `One` relations to Backbone Object.
    Backbone.Many = "Many";
    Backbone.One = "One";
    // Define `AssociatedModel` (Extends Backbone.Model).
    AssociatedModel = Backbone.AssociatedModel = BackboneModel.extend({
        // Define relations with Associated Model.
        relations:undefined,
        // Define `Model` property which can keep track of already fired `events`,
        // and prevent redundant event to be triggered in case of circular model graph.
        _proxyCalls:undefined,

        // Get the value of an attribute.
        get:function (attr) {
            var obj = ModelProto.get.call(this, attr);
            return obj ? obj : this.getAttr.apply(this, arguments);
        },

        // Set a hash of model attributes on the Backbone Model.
        set:function (key, value, options) {
            var attributes, attr, modelMap, modelId, obj, result = this;
            // Duplicate backbone's behavior to allow separate key/value parameters,
            // instead of a single 'attributes' object.
            if (_.isObject(key) || key == null) {
                attributes = key;
                options = value;
            } else {
                attributes = {};
                attributes[key] = value;
            }
            if (!attributes) return this;
            for (attr in attributes) {
                //Create a map for each unique object whose attributes we want to set
                modelMap || (modelMap = {});
                if (attr.match(pathChecker)) {
                    var pathTokens = getPathArray(attr), initials = _.initial(pathTokens), last = pathTokens[pathTokens.length - 1],
                        parentModel = this.get(initials);
                    if (parentModel instanceof AssociatedModel) {
                        obj = modelMap[parentModel.cid] || (modelMap[parentModel.cid] = {'model':parentModel, 'data':{}});
                        obj.data[last] = attributes[attr];
                    }
                } else {
                    obj = modelMap[this.cid] || (modelMap[this.cid] = {'model':this, 'data':{}});
                    obj.data[attr] = attributes[attr];
                }
            }
            if (modelMap) {
                for (modelId in modelMap) {
                    obj = modelMap[modelId];
                    this.setAttr.call(obj.model, obj.data, options) || (result = false);
                }
            } else {
                return this.setAttr.call(this, attributes, options);
            }
            return result;
        },

        // Set a hash of model attributes on the object,
        // fire Backbone `event` with options.
        // It maintains relations between models during the set operation.
        // It also bubbles up child events to the parent.
        setAttr:function (attributes, options) {
            var processedRelations, tbp, attr;
            // Extract attributes and options.
            options || (options = {});
            if (options.unset) for (attr in attributes) attributes[attr] = void 0;

            if (this.relations) {
                // Iterate over `this.relations` and `set` model and collection values
                // if `relations` are available.
                _.each(this.relations, function (relation) {
                    var relationKey = relation.key, relatedModel = relation.relatedModel,
                        collectionType = relation.collectionType,
                        val, relationOptions, data, relationValue;
                    if (attributes[relationKey]) {
                        //Get value of attribute with relation key in `val`.
                        val = _.result(attributes, relationKey);
                        // Get class if relation is stored as a string.
                        relatedModel && _.isString(relatedModel) && (relatedModel = eval(relatedModel));
                        collectionType && _.isString(collectionType) && (collectionType = eval(collectionType));
                        // Merge in `options` specific to this relation.
                        relationOptions = relation.options ? _.extend({}, relation.options, options) : options;
                        // If `relation.type` is `Backbone.Many`,
                        // create `Backbone.Collection` with passed data and perform Backbone `set`.
                        if (relation.type === Backbone.Many) {
                            // `collectionType` of defined `relation` should be instance of `Backbone.Collection`.
                            if (collectionType && !collectionType.prototype instanceof BackboneCollection) {
                                throw new Error('collectionType must inherit from Backbone.Collection');
                            }

                            // If `attributes` has no property present,
                            // create `Collection` having `relation.collectionType` as type and
                            // `relation.Model` as model reference and perform Backbone `set`.
                            if (val instanceof BackboneCollection) {
                                ModelProto.set.call(this, relationKey, val, relationOptions);
                            } else if (!this.attributes[relationKey]) {
                                data = collectionType ? new collectionType() : this._createCollection(relatedModel);
                                data.add(val, relationOptions);
                                ModelProto.set.call(this, relationKey, data, relationOptions);
                            } else {
                                this.attributes[relationKey].reset(val, relationOptions);
                            }
                        } else if (relation.type === Backbone.One && relatedModel) {
                            // If passed data is not instance of `Backbone.AssociatedModel`,
                            // create `AssociatedModel` and perform backbone `set`.
                            data = val instanceof AssociatedModel ? val : new relatedModel(val);
                            ModelProto.set.call(this, relationKey, data, relationOptions)
                        }

                        relationValue = this.attributes[relationKey];

                        // Add proxy events to respective parents.
                        // Only add callback if not defined.
                        if (relationValue && !relationValue._proxyCallback) {
                            relationValue._proxyCallback = function () {
                                return this._bubbleEvent.call(this, relationKey, arguments);
                            };
                            relationValue.on("all", relationValue._proxyCallback, this);
                        }

                        // Create a local `processedRelations` array to store the relation key which has been processed.
                        // We cannot use `this.relations` because if there is no value defined for `relationKey`,
                        // it will not get processed by either `BackboneModel` `set` or the `AssociatedModel` `set`.
                        !processedRelations && (processedRelations = []);
                        if (_.indexOf(processedRelations, relationKey) === -1) {
                            processedRelations.push(relationKey);
                        }
                    }
                }, this);
            }
            if (processedRelations) {
                // Find attributes yet to be processed - `tbp`.
                tbp = {};
                for (attr in attributes) {
                    if (_.indexOf(processedRelations, attr) === -1) {
                        tbp[attr] = attributes[attr];
                    }
                }
            } else {
                // Set all `attributes` to `tbp`.
                tbp = attributes;
            }
            // Return results for `BackboneModel.set`.
            return ModelProto.set.call(this, tbp, options);
        },
        // Bubble-up event to `parent` Model
        _bubbleEvent:function (relationKey, eventArguments) {
            var args = eventArguments,
                opt = args[0].split(":"),
                eventType = opt[0],
                eventObject = args[1],
                indexEventObject = -1,
                relationValue = this.attributes[relationKey],
                _proxyCalls = relationValue._proxyCalls,
                eventPath,
                eventAvailable;
            // Change the event name to a fully qualified path.
            if (_.contains(defaultEvents, eventType)) {
                _.size(opt) > 1 && (eventPath = opt[1]);
                // Find the specific object in the collection which has changed.
                if (relationValue instanceof BackboneCollection && "change" === eventType && eventObject) {
                    var pathTokens = getPathArray(eventPath),
                        initialTokens = _.initial(pathTokens), colModel;

                    colModel = relationValue.find(function (model) {
                        var changedModel = model.get(pathTokens);
                        return eventObject === (changedModel instanceof AssociatedModel
                            || changedModel instanceof BackboneCollection)
                            ? changedModel : (model.get(initialTokens) || model);
                    });
                    colModel && (indexEventObject = relationValue.indexOf(colModel));
                }
                // Manipulate `eventPath`.
                eventPath = relationKey + (indexEventObject !== -1 ?
                    "[" + indexEventObject + "]" : "") + (eventPath ? "." + eventPath : "");
                args[0] = eventType + ":" + eventPath;

                // If event has been already triggered as result of same source `eventPath`,
                // no need to re-trigger event to prevent cycle.
                if (_proxyCalls) {
                    eventAvailable = _.find(_proxyCalls, function (value, eventKey) {
                        return eventPath.indexOf(eventKey, eventPath.length - eventKey.length) !== -1;
                    });
                    if (eventAvailable) return this;
                } else {
                    _proxyCalls = relationValue._proxyCalls = {};
                }
                // Add `eventPath` in `_proxyCalls` to keep track of already triggered `event`.
                _proxyCalls[eventPath] = true;
            }

            // Bubble up event to parent `model` with new changed arguments.
            this.trigger.apply(this, args);

            // Remove `eventPath` from `_proxyCalls`,
            // if `eventPath` and `_proxCalls` are available,
            // which allow event to be triggered on for next operation of `set`.
            if (eventPath && _proxyCalls) {
                delete _proxyCalls[eventPath];
            }
            return this;
        },
        // Returns New `collection` of type `relation.relatedModel`.
        _createCollection:function (type) {
            var collection, relatedModel = type;
            _.isString(relatedModel) && (relatedModel = eval(relatedModel));
            // Creates new `Backbone.Collection` and defines model class.
            if (relatedModel && relatedModel.prototype instanceof AssociatedModel) {
                collection = new BackboneCollection();
                collection.model = relatedModel;
            } else {
                throw new Error('type must inherit from Backbone.AssociatedModel');
            }
            return collection;
        },
        // Has the model changed. Traverse the object hierarchy to compute dirtyness.
        hasChanged:function (attr) {
            var isDirty, relation, attrValue, i, dirtyObjects;
            // To prevent cycles, check if this node is visited.
            if (!this.visitedHC) {
                this.visitedHC = true;
                //Get the 'first-level' hasChanged() value by calling the backbone implementation
                isDirty = ModelProto.hasChanged.apply(this, arguments);
                if (!isDirty && this.relations) {
                    // Go down the hierarchy to see if anything has `changed`.
                    for (i = 0; i < this.relations.length; ++i) {
                        relation = this.relations[i];
                        attrValue = this.attributes[relation.key];
                        if (attrValue) {
                            if (attrValue instanceof BackboneCollection) {
                                //filter out the dirty objects in the collection
                                dirtyObjects = attrValue.filter(function (m) {
                                    return m.hasChanged() === true;
                                });
                                //If there is even one changed object, set the dirty flag
                                _.size(dirtyObjects) > 0 && (isDirty = true);
                            } else {
                                //Go down the object graph
                                isDirty = attrValue.hasChanged && attrValue.hasChanged();
                            }
                            //Break the computation if any of the sub graphs are dirty
                            if (isDirty) {
                                break;
                            }
                        }
                    }
                }
                delete this.visitedHC;
            }
            return isDirty;
        },
        // Returns a hash of the changed attributes.
        changedAttributes:function (diff) {
            var delta, relation, attrValue, changedCollection, i;
            // To prevent cycles, check if this node is visited.
            if (!this.visited) {
                this.visited = true;
                //Get the 'first-level' changed attributes by calling the backbone implementation
                delta = ModelProto.changedAttributes.apply(this, arguments);
                if (this.relations) {
                    //Traverse down the object graph
                    for (i = 0; i < this.relations.length; ++i) {
                        relation = this.relations[i];
                        attrValue = this.attributes[relation.key];
                        if (attrValue) {
                            if (attrValue instanceof BackboneCollection) {
                                //For each model in the collection, get the changed hash. Filter out those models where nothing has changed
                                changedCollection = _.filter(attrValue.map(function (m) {
                                    return m.changedAttributes();
                                }), function (m) {
                                    return !!m;
                                });
                                //If any of the models in the collection has changed
                                if (_.size(changedCollection) > 0) {
                                    //Assign the changed models in the collection to that key
                                    delta[relation.key] = changedCollection;
                                }
                            } else if (attrValue instanceof AssociatedModel && attrValue.hasChanged()) {
                                //store the changed JSON value of the sub graph
                                delta[relation.key] = attrValue.toJSON();
                            }
                        }
                    }
                }
                delete this.visited;
            }
            //return false if nothing has changed. Else return the changed hash
            return !delta ? false : delta;
        },
        // Returns the hash of the previous attributes of the graph.
        previousAttributes:function () {
            var pa, attrValue, pattrValue, pattrJSON;
            // To prevent cycles, check if this node is visited.
            if (!this.visited) {
                this.visited = true;
                //Get the 'first-level' previous attributes by calling the backbone implementation
                pa = ModelProto.previousAttributes.apply(this, arguments);
                if (this.relations) {
                    //Traverse down the object graph
                    _.each(this.relations, function (relation) {
                        attrValue = this.attributes[relation.key];
                        pattrValue = pa[relation.key];
                        pattrJSON = pattrValue ? pattrValue.toJSON() : undefined;
                        //Navigate down the object tree only if the entire object object rooted at attributes[relation.key] has not changed.
                        if (pattrValue && pattrValue == attrValue) {
                            if (attrValue instanceof AssociatedModel) {
                                //Go down the graph recursively
                                pa[relation.key] = attrValue.previousAttributes();
                            } else if (attrValue instanceof BackboneCollection) {
                                //Previous values of all models in the collection
                                pa[relation.key] = attrValue.map(function (m) {
                                    return m.previousAttributes();
                                });
                            }
                        } else {
                            //An externally defined object graph is assigned to this attribute. So previous attribute is the old graph itself
                            if (pattrValue)
                                pa[relation.key] = pattrJSON;
                        }
                    }, this);
                }
                delete this.visited;
            }
            return pa;
        },
        // Return the previous value of the passed in attribute.
        previous:function (attr) {
            return this.previousAttributes()[attr];
        },

        // The JSON representation of the model.
        toJSON:function (options) {
            var json, aJson;
            if (!this.visited) {
                this.visited = true;
                // Get json representation from `BackboneModel.toJSON`.
                json = ModelProto.toJSON.apply(this, arguments);
                // If `this.relations` is defined, iterate through each `relation`
                // and added it's json representation to parents' json representation.
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

        // Create a new model with identical attributes to this one.
        clone:function () {
            return new this.constructor(this.toJSON());
        },

        //Navigate the path to the leaf object in the path to query for the attribute value
        getAttr:function (path) {

            var result = this,
            //Tokenize the path
                attrs = getPathArray(path),
                key,
                i;
            if (_.size(attrs) < 1) return;
            for (i = 0; i < attrs.length; i++) {
                key = attrs[i];
                if (!result) break;
                //Navigate the path to get to the result
                result = result instanceof BackboneCollection && (!isNaN(key)) ? result.at(key) : result.attributes[key];
            }
            return result;
        }
    });

    var delimiters = /[^\.\[\]]+/g;

    // Tokenize the fully qualified event path
    var getPathArray = function (path) {
        if (path === '') return [''];
        return _.isString(path) ? (path.match(delimiters)) : path || [];
    }
}).call(this);