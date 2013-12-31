//
//  Backbone-associations.js 0.5.4
//
//  (c) 2013 Dhruva Ray, Jaynti Kanani, Persistent Systems Ltd.
//  Backbone-associations may be freely distributed under the MIT license.
//  For all details and documentation:
//  https://github.com/dhruvaray/backbone-associations/
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
        CollectionProto, defaultEvents, AssociatedModel, pathChecker,
        collectionEvents, delimiters, pathSeparator, sources = [];

    if (typeof exports !== 'undefined') {
        _ = require('underscore');
        Backbone = require('backbone');
        if (typeof module !== 'undefined' && module.exports) {
            module.exports = Backbone;
        }
        exports = Backbone;
    } else {
        _ = root._;
        Backbone = root.Backbone;
    }
    // Create local reference `Model` prototype.
    BackboneModel = Backbone.Model;
    BackboneCollection = Backbone.Collection;
    ModelProto = BackboneModel.prototype;
    CollectionProto = BackboneCollection.prototype;

    // Built-in Backbone `events`.
    defaultEvents = ["change", "add", "remove", "reset", "sort", "destroy"];
    collectionEvents = ["reset", "sort"];

    Backbone.Associations = {
        VERSION: "0.5.4"
    };

    // Define `getter` and `setter` for `separator`
    var getSeparator = function() {
        return pathSeparator;
    };
    // Define `setSeperator`
    var setSeparator = function(value) {
        if (!_.isString(value) || _.size(value) < 1) {
            value = ".";
        }
        // set private properties
        pathSeparator = value;
        pathChecker = new RegExp("[\\" + pathSeparator + "\\[\\]]+", "g");
        delimiters = new RegExp("[^\\" + pathSeparator + "\\[\\]]+", "g");
    };

    try {
        // Define `SEPERATOR` property to Backbone.Associations
        Object.defineProperty(Backbone.Associations, 'SEPARATOR', {
            enumerable: true,
            get: getSeparator,
            set: setSeparator
        });
    } catch (e) {}

    // Backbone.AssociatedModel
    // --------------

    //Add `Many` and `One` relations to Backbone Object.
    Backbone.Associations.Many = Backbone.Many = "Many";
    Backbone.Associations.One = Backbone.One = "One";
    Backbone.Associations.Self = Backbone.Self = "Self";
    Backbone.Associations._ManyReverse = Backbone._ManyReverse = "_ManyReverse";
    // Set default separator
    Backbone.Associations.SEPARATOR = ".";
    Backbone.Associations.getSeparator = getSeparator;
    Backbone.Associations.setSeparator = setSeparator;

    Backbone.Associations.EVENTS_BUBBLE = true;
    Backbone.Associations.EVENTS_WILDCARD = true;
    Backbone.Associations.EVENTS_NC = true;


    setSeparator();

    // Define `AssociatedModel` (Extends Backbone.Model).
    AssociatedModel = Backbone.AssociatedModel = Backbone.Associations.AssociatedModel = BackboneModel.extend({
        // Define relations with Associated Model.
        relations:undefined,
        // Define `Model` property which can keep track of already fired `events`,
        // and prevent redundant event to be triggered in case of cyclic model graphs.
        _proxyCalls:undefined,

        // When constructing a model, defer processing of reverse
        // relations until initialization of the model is complete, 
        // to ensure that relation events are not triggered when the model isn't in a well-defined state.
        constructor:function () {
            this._deferReverseRelations = true;
            var result = AssociatedModel.__super__.constructor.apply(this, arguments);
            this._processPendingReverseRelations();
            return result;
        },

        // Get the value of an attribute.
        get:function (attr) {
            var obj = ModelProto.get.call(this, attr);
            return obj ? obj : this._getAttr.apply(this, arguments);
        },

        // Set a hash of model attributes on the Backbone Model.
        set:function (key, value, options) {
            var attributes, result;
            // Duplicate backbone's behavior to allow separate key/value parameters,
            // instead of a single 'attributes' object.
            if (_.isObject(key) || key == null) {
                attributes = key;
                options = value;
            } else {
                attributes = {};
                attributes[key] = value;
            }
            result = this._set(attributes, options);
            // Trigger events which have been blocked until the entire object graph is updated.
            this._processPendingEvents();
            return result;

        },

        // Works with an attribute hash and options + fully qualified paths
        _set:function (attributes, options) {
            var attr, modelMap, modelId, obj, result = this;
            if (!attributes) return this;
            for (attr in attributes) {
                //Create a map for each unique object whose attributes we want to set
                modelMap || (modelMap = {});
                if (attr.match(pathChecker)) {
                    var pathTokens = getPathArray(attr), initials = _.initial(pathTokens),
                        last = pathTokens[pathTokens.length - 1],
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
                    this._setAttr.call(obj.model, obj.data, options) || (result = false);

                }
            } else {
                result = this._setAttr.call(this, attributes, options);
            }
            return result;

        },

        // Set a hash of model attributes on the object,
        // fire Backbone `event` with options.
        // It maintains relations between models during the set operation.
        // It also bubbles up child events to the parent.
        _setAttr:function (attributes, options) {
            var attr;
            // Extract attributes and options.
            options || (options = {});
            if (options.unset) for (attr in attributes) attributes[attr] = void 0;
            this.parents = this.parents || [];

            if (this.relations) {
                // Iterate over `this.relations` and `set` model and collection values
                // if `relations` are available.
                _.each(this.relations, function (relation) {
                    var relationKey = relation.key,
                        relatedModel = relation.relatedModel,
                        collectionType = relation.collectionType,
                        map = relation.map,
                        currVal = this.attributes[relationKey],
                        idKey = currVal && currVal.idAttribute,
                        val, relationOptions, data, relationValue, newCtx = false,
                        reverseKey = relation.reverseKey, reverseRelation,
                        bubbleOK = Backbone.Associations.EVENTS_BUBBLE;

                    // Call function if relatedModel is implemented as a function
                    if (relatedModel && !(relatedModel.prototype instanceof BackboneModel))
                        relatedModel = _.isFunction(relatedModel) ?
                            relatedModel.call(this, relation, attributes) :
                            relatedModel;

                    // Get class if relation and map is stored as a string.
                    if (relatedModel && _.isString(relatedModel)) {
                        relatedModel = (relatedModel === Backbone.Self) ? this.constructor : map2Scope(relatedModel);
                    }
                    collectionType && _.isString(collectionType) && (collectionType = map2Scope(collectionType));
                    map && _.isString(map) && (map = map2Scope(map));
                    // Merge in `options` specific to this relation.
                    relationOptions = relation.options ? _.extend({}, relation.options, options) : options;

                    if ((!relatedModel) && (!collectionType))
                        throw new Error('specify either a relatedModel or collectionType');

                    if (attributes[relationKey]) {
                        // Get value of attribute with relation key in `val`.
                        val = _.result(attributes, relationKey);
                        // Map `val` if a transformation function is provided.
                        val = map ? map.call(this, val, collectionType ? collectionType : relatedModel) : val;

                        // If `relation.type` is `Backbone.Many`,
                        // Create `Backbone.Collection` with passed data and perform Backbone `set`.
                        if (relation.type === Backbone.Many) {
                            // `collectionType` of defined `relation` should be instance of `Backbone.Collection`.
                            if (collectionType && !collectionType.prototype instanceof BackboneCollection) {
                                throw new Error('collectionType must inherit from Backbone.Collection');
                            }

                            if (reverseKey) {
                                var relatedProto = relatedModel.prototype;
                                reverseRelation = {
                                    type: Backbone._ManyReverse,
                                    relatedModel: this.constructor,
                                    key: reverseKey,
                                    reverseOf: relation,
                                }
                                if (!relatedModel) {
                                    throw new Error('must specify a relatedModel if specifying reverseKey');
                                }
                                if (!_.findWhere(relatedProto.relations || [], reverseRelation)) {
                                    relatedProto.relations || (relatedProto.relations = []);
                                    if (_.findWhere(relatedProto.relations, {key: reverseKey})) {
                                        throw new Error('reverseKey "'+reverseKey+'" is the same as an existing key');
                                    }
                                    relatedProto.relations.push(reverseRelation);
                                }
                            }

                            if (currVal) {
                                // Setting this flag will prevent events from firing immediately. That way clients
                                // will not get events until the entire object graph is updated.
                                currVal._deferEvents = true;

                                // Use Backbone.Collection's `reset` or smart `set` method
                                currVal[relationOptions.reset ? 'reset' : 'set'](
                                    val instanceof BackboneCollection ? val.models : val, relationOptions);

                                data = currVal;

                            } else {
                                newCtx = true;

                                if (val instanceof BackboneCollection) {
                                    data = val;
                                    data._reverseRelation = reverseRelation;
                                    data._reverseModel = this;
                                } else {
                                    data = collectionType ? new collectionType() : this._createCollection(relatedModel);
                                    data._reverseRelation = reverseRelation;
                                    data._reverseModel = this;
                                    data._deferEvents = true;
                                    data[relationOptions.reset ? 'reset' : 'set'](val, relationOptions);
                                }
                            }

                        } else if (relation.type === Backbone.One || relation.type == Backbone._ManyReverse) {

                            if (!relatedModel)
                                throw new Error('specify a relatedModel for Backbone.One type');

                            if (!(relatedModel.prototype instanceof Backbone.AssociatedModel))
                                throw new Error('specify an AssociatedModel for Backbone.One type');

                            data = val instanceof AssociatedModel ? val : new relatedModel(val, relationOptions);
                            //Is the passed in data for the same key?
                            if (currVal && data.attributes[idKey] &&
                                currVal.attributes[idKey] === data.attributes[idKey]) {
                                // Setting this flag will prevent events from firing immediately. That way clients
                                // will not get events until the entire object graph is updated.
                                currVal._deferEvents = true;
                                // Perform the traditional `set` operation
                                currVal._set(val instanceof AssociatedModel ? val.attributes : val, relationOptions);
                                data = currVal;
                            } else {
                                newCtx = true;
                                if (relation.type === Backbone._ManyReverse) {
                                    this._updateReverseRelation(relation, data);
                                    bubbleOK = false; // Suppress circular triggers of the form change:parent.children[0].parent...
                                }
                            }
                        } else {
                            throw new Error('type attribute must be specified and have the values Backbone.One or Backbone.Many');
                        }


                        attributes[relationKey] = data;
                        relationValue = data;

                        // Add proxy events to respective parents.
                        // Only add callback if not defined or new Ctx has been identified.
                        if (newCtx || (relationValue && !relationValue._proxyCallback)) {
                            relationValue._proxyCallback = function () {
                                return bubbleOK &&
                                    this._bubbleEvent.call(this, relationKey, relationValue, arguments);
                            };
                            relationValue.on("all", relationValue._proxyCallback, this);
                        }

                    }
                    //Distinguish between the value of undefined versus a set no-op
                    if (attributes.hasOwnProperty(relationKey)) {
                        var updated = attributes[relationKey];
                        var original = this.attributes[relationKey];

                        if (relation.type == Backbone._ManyReverse && !updated) {
                            this._updateReverseRelation(relation, undefined);
                        }

                        //Maintain reverse pointers - a.k.a parents
                        if (updated) {
                            updated.parents = updated.parents || [];
                            (_.indexOf(updated.parents, this) == -1) && updated.parents.push(this);
                        } else if (original && original.parents.length > 0) { // New value is undefined
                            original.parents = _.difference(original.parents, [this]);
                            // Don't bubble to this parent anymore
                            original._proxyCallback && original.off("all", original._proxyCallback, this);
                        }
                    }
                }, this);
            }
            // Return results for `BackboneModel.set`.
            return  ModelProto.set.call(this, attributes, options);
        },
        // Bubble-up event to `parent` Model
        _bubbleEvent:function (relationKey, relationValue, eventArguments) {
            var args = eventArguments,
                opt = args[0].split(":"),
                eventType = opt[0],
                catch_all = args[0] == "nested-change",
                eventObject = args[1],
                indexEventObject = -1,
                _proxyCalls = relationValue._proxyCalls,
                cargs,
                eventPath = opt[1],
                basecolEventPath,
                orphanIndex = this._orphanIndex || {};


            //Short circuit the listen in to the nested-graph event
            if (catch_all) return;

            var isDefaultEvent = _.indexOf(defaultEvents, eventType) !== -1;

            // Find the specific object in the collection which has changed.
            var source = sources.pop() || eventObject;
            if (relationValue instanceof BackboneCollection && isDefaultEvent) {
                indexEventObject = orphanIndex[source.cid] || relationValue.indexOf(source);
                sources.push(relationValue.parents[0]);
            } else {
                sources.push(relationValue);
            }

            // Manipulate `eventPath`.
            eventPath = relationKey + ((indexEventObject !== -1 && (eventType === "change" || eventPath)) ?
                "[" + indexEventObject + "]" : "") + (eventPath ? pathSeparator + eventPath : "");

            // Short circuit collection * events

            if (Backbone.Associations.EVENTS_WILDCARD) {
                if (/\[\*\]/g.test(eventPath)) return this;
                basecolEventPath = eventPath.replace(/\[\d+\]/g, '[*]');
            }

            cargs = [];
            cargs.push.apply(cargs, args);
            cargs[0] = eventType + ":" + eventPath;

            // If event has been already triggered as result of same source `eventPath`,
            // no need to re-trigger event to prevent cycle.
            _proxyCalls = relationValue._proxyCalls = (_proxyCalls || {});
            if (this._isEventAvailable.call(this, _proxyCalls, eventPath)) return this;

            // Add `eventPath` in `_proxyCalls` to keep track of already triggered `event`.
            _proxyCalls[eventPath] = true;


            // Set up previous attributes correctly.
            if ("change" === eventType) {
                this._previousAttributes[relationKey] = relationValue._previousAttributes;
                this.changed[relationKey] = relationValue;
            }

            // Bubble up event to parent `model` with new changed arguments.
            this.trigger.apply(this, cargs);

            //Only fire for change. Not change:attribute
            if (Backbone.Associations.EVENTS_NC && "change" === eventType && this.get(eventPath) != args[2]) {
                var ncargs = ["nested-change", eventPath, args[1]];
                args[2] && ncargs.push(args[2]); //args[2] will be options if present
                this.trigger.apply(this, ncargs);
            }

            // Remove `eventPath` from `_proxyCalls`,
            // if `eventPath` and `_proxyCalls` are available,
            // which allow event to be triggered on for next operation of `set`.
            if (_proxyCalls && eventPath) delete _proxyCalls[eventPath];

            // Create a collection modified event with wild-card
            if (Backbone.Associations.EVENTS_WILDCARD && eventPath !== basecolEventPath) {
                cargs[0] = eventType + ":" + basecolEventPath;
                this.trigger.apply(this, cargs);
            }
            sources.pop();

            return this;
        },

        // Has event been fired from this source. Used to prevent event recursion in cyclic graphs
        _isEventAvailable:function (_proxyCalls, path) {
            return _.find(_proxyCalls, function (value, eventKey) {
                return path.indexOf(eventKey, path.length - eventKey.length) !== -1;
            });
        },

        // Returns New `collection` of type `relation.relatedModel`.
        _createCollection:function (type) {
            var collection, relatedModel = type;
            _.isString(relatedModel) && (relatedModel = map2Scope(relatedModel));
            // Creates new `Backbone.Collection` and defines model class.
            if (relatedModel && (relatedModel.prototype instanceof AssociatedModel) || _.isFunction(relatedModel)) {
                collection = new BackboneCollection();
                collection.model = relatedModel;
            } else {
                throw new Error('type must inherit from Backbone.AssociatedModel');
            }
            return collection;
        },

        // Called when a model updates a reverse key of a Many relation;
        // removes/adds from appropriate collections.
        _updateReverseRelation:function(relation, newValue) {
            if (this._deferReverseRelations) {
                this._deferReverseRelation("_updateReverseRelation", arguments);
                return;
            }
            this._deferEvents = true;
            this._reverseSetPending = true;

            var oldValue = this.attributes[relation.key];
            var collection;
            if (oldValue && oldValue != newValue && (collection = oldValue.attributes[relation.reverseOf.key])) {
                collection._deferEvents = true;
                if (!this._reverseRemovePending) {
                    this._newReverseModel = newValue;
                    collection.remove(this);
                }
                this._addAssociatedEventSources(collection);
            }
            if (newValue && (collection = newValue.attributes[relation.reverseOf.key])) {
                collection._deferEvents = true;
                collection.add(this);
            }
            delete this._reverseSetPending;
        },

        // Called when models are removed from a Many relation; sets their
        // their reverseKeys to null (unless the model is in the midst of
        // a setting the reverse key to something else).
        _propagateReverseRemove:function (relation, models, method, options) {
            if (this._deferReverseRelations) {
                this._deferReverseRelation("_propagateReverseRemove", arguments);
                return;
            }

            var reverseKey = relation.reverseKey;
            var collection = this.attributes[relation.key];
            var silent = (options || {}).silent;
            var attrs = {}

            attrs[reverseKey] = null;

            _.each(models, function(model) {
                this._orphanIndex || (this._orphanIndex = {})
                this._orphanIndex[model.cid] = collection.indexOf(model);
                if (!model._reverseSetPending) {
                    model._deferEvents = true;
                    model._reverseRemovePending = true;
                    model._setAttr(attrs);
                    delete model._reverseRemovePending;
                }
                // trigger explicitly, since by the time
                // pending events will get processed, the model
                // will no longer be in this collection
                if (method === "remove" && !silent) {
                    collection.trigger(method, model, collection, options);
                    collection.trigger("change", model, options);
                    collection.trigger("change:"+reverseKey, model, model._newReverseModel, options);
                }
            }, this);

            collection._addAssociatedEventSources(models);
        },

        // Called when models are removed from a Many relation; sets their
        // their reverseKeys to the new value.
        _propagateReverseAdd:function (relation, models) {
            if (this._deferReverseRelations) {
                this._deferReverseRelation("_propagateReverseAdd", arguments);
                return;
            }
            var reverseKey = relation.reverseKey;
            var attrs = {}
            attrs[reverseKey] = this;
            _.each(models, function(model) {
                if (!model._reverseSetPending && model.attributes[reverseKey] != this) {
                    model._deferEvents = true;
                    model._setAttr(attrs);
                }
            }, this);
            this.attributes[relation.key]._addAssociatedEventSources(models);
        },

        _deferReverseRelation: function(method, args) {
            this._pendingReverseRelations || (this._pendingReverseRelations = []);
            this._pendingReverseRelations.push({method: method, arguments: args});
        },

        _processPendingReverseRelations:function () {
            delete this._deferReverseRelations;
            if (this._pendingReverseRelations) {
                this._deferEvents = true;
                _.each(this._pendingReverseRelations, function(r) {
                    this[r.method].apply(this, r.arguments);
                }, this);
                delete this._pendingReverseRelations;
                this._processPendingEvents();
            }
        },

        // Add more sources of pending events that will need to be
        // processed. This is for sources whose relationship has been
        // severed (i.e. model no longer member of collection) and so
        // wouldn't be found when traversing relationships when processing
        // the deferred events.
        _addAssociatedEventSources:function (sources) {
            this._associatedEventSources || (this._associatedEventSources = []);
            this._associatedEventSources = this._associatedEventSources.concat(sources);
        },

        // Call this when intercepting a (non-deferred) "destroy" event, in
        // order to disconnect reverse relations silently to avoid sending
        // "change" events.
        _processDestroyEvent:function (eventArguments) {
            _.each(this.relations || [], function(relation) {
                if (relation.type == Backbone._ManyReverse) {
                    this._deferEvents = true;
                    var reverseKey = relation.key,
                        reverseModel = this.attributes[reverseKey],
                        attrs = {};
                    if (reverseModel) {
                        var collection = reverseModel.attributes[relation.reverseOf.key];
                        collection._deferEvents = true;

                        // disconnect reverse relation, silently to avoid
                        // change events
                        this.attributes[reverseKey] = null;
                        collection.remove(this, {silent: true});

                        // manually trigger "remove" and "destroy" events
                        this.trigger("remove", this, collection);
                        collection.trigger("remove destroy", this, collection);

                        this._addAssociatedEventSources(collection);
                    }
                }
            }, this);
            this._deferEvents = false;
            ModelProto.trigger.apply(this, eventArguments);
            this._processPendingEvents();
        },

        // Process all pending events after the entire object graph has been updated
        _processPendingEvents:function () {
            if (!this._processedEvents) {
                this._processedEvents = true;

                this._deferEvents = false;

                // Trigger all pending events
                _.each(this._pendingEvents, function (e) {
                    e.c.trigger.apply(e.c, e.a);
                });

                this._pendingEvents = [];

                // Traverse down the object graph and call process pending events on sub-trees
                _.each(this.relations, function (relation) {
                    var val = this.attributes[relation.key];
                    val && val._processPendingEvents();
                }, this);

                _.each(this._associatedEventSources, function(model) {
                    model._processPendingEvents();
                }, this);
                this._associatedEventSources = [];

                delete this._orphanIndex;
                delete this._processedEvents;
            }
        },

        // Override trigger to defer events in the object graph.
        trigger:function (name) {
            // Defer event processing
            if (this._deferEvents) {
                this._pendingEvents = this._pendingEvents || [];
                // Maintain a queue of pending events to trigger after the entire object graph is updated.
                this._pendingEvents.push({c:this, a:arguments});
            } else if (name == "destroy") {
                this._processDestroyEvent(arguments);
            } else {
                ModelProto.trigger.apply(this, arguments);
            }
        },

        // The JSON representation of the model.
        toJSON:function (options) {
            var json = {}, aJson;
            json[this.idAttribute] = this.id;
            if (!this.visited) {
                this.visited = true;
                // Get json representation from `BackboneModel.toJSON`.
                json = ModelProto.toJSON.apply(this, arguments);
                // If `this.relations` is defined, iterate through each `relation`
                // and added it's json representation to parents' json representation.
                if (this.relations) {
                    _.each(this.relations, function (relation) {
                        var key = relation.key,
                            remoteKey = relation.remoteKey,
                            attr = this.attributes[key],
                            serialize = !relation.isTransient;

                        // Remove default Backbone serialization for associations.
                        delete json[key];

                        //Assign to remoteKey if specified. Otherwise use the default key.
                        //Only for non-transient relationships
                        if (serialize) {
                            aJson = attr && attr.toJSON ? attr.toJSON(options) : attr;
                            json[remoteKey || key] = _.isArray(aJson) ? _.compact(aJson) : aJson;
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

        // Call this if you want to set an `AssociatedModel` to a falsy value like undefined/null directly.
        // Not calling this will leak memory and have wrong parents.
        // See test case "parent relations"
        cleanup:function () {
            _.each(this.relations, function (relation) {
                var val = this.attributes[relation.key];
                val && (val.parents = _.difference(val.parents, [this]));
            }, this);
            this.off();
        },

        // Navigate the path to the leaf object in the path to query for the attribute value
        _getAttr:function (path) {

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
                result = result instanceof BackboneCollection
                    ? (isNaN(key) ? undefined : result.at(key))
                    : result.attributes[key];
            }
            return result;
        }
    });

    // Tokenize the fully qualified event path
    var getPathArray = function (path) {
        if (path === '') return [''];
        return _.isString(path) ? (path.match(delimiters)) : path || [];
    };

    var map2Scope = function (path) {
        return _.reduce(path.split(pathSeparator), function (memo, elem) {
            return memo[elem];
        }, root);
    };

    //Infer the relation from the collection's parents and find the appropriate map for the passed in `models`
    var map2models = function (parents, target, models) {
        var relation, surrogate;
        //Iterate over collection's parents
        _.find(parents, function (parent) {
            //Iterate over relations
            relation = _.find(parent.relations, function (rel) {
                return parent.get(rel.key) === target;
            }, this);
            if (relation) {
                surrogate = parent;//surrogate for transformation
                return true;//break;
            }
        }, this);

        //If we found a relation and it has a mapping function
        if (relation && relation.map) {
            return relation.map.call(surrogate, models, target);
        }
        return models;
    };

    var proxies = {};
    // Proxy Backbone collection methods
    _.each(['set', 'remove', 'reset'], function (method) {
        proxies[method] = BackboneCollection.prototype[method];

        CollectionProto[method] = function (models, options) {
            var reverseRelation = this._reverseRelation;
            var reverseModel = this._reverseModel;
            var topLevel;

            //Short-circuit if this collection doesn't hold `AssociatedModels`
            if (this.model.prototype instanceof AssociatedModel && this.parents) {
                //Find a map function if available and perform a transformation
                arguments[0] = map2models(this.parents, this, models);
            }

            if (reverseRelation) {
                var models = [].concat(arguments[0]);
                topLevel = !this._deferEvents;
                this._deferEvents = true;
                _.each(models, function(model) { model._deferEvents = true; });
                var orphans, silent = (options || {}).silent;
                switch (method) {
                    case 'remove':
                        orphans = models;
                        break;
                    case 'reset':
                        orphans = _.difference(this.models, models);
                        break;
                };
                if (orphans) {
                    reverseModel._propagateReverseRemove(reverseRelation.reverseOf, orphans, method, options);
                }
            }

            var result = proxies[method].apply(this, arguments);

            if (reverseRelation) {
                if (method != 'remove') {
                    reverseModel._propagateReverseAdd(reverseRelation.reverseOf, [].concat(result));
                }
                if (topLevel) {
                    this._processPendingEvents();
                }
            }

            return result;
        }
    });

    // Override trigger to defer events in the object graph.
    proxies['trigger'] = CollectionProto['trigger'];
    CollectionProto['trigger'] = function (name) {
        if (this._deferEvents) {
            this._pendingEvents = this._pendingEvents || [];
            // Maintain a queue of pending events to trigger after the entire object graph is updated.
            this._pendingEvents.push({c:this, a:arguments});
        } else {
            proxies['trigger'].apply(this, arguments);
        }
    };

    // Attach process pending event functionality on collections as well. Re-use from `AssociatedModel`
    CollectionProto._processPendingEvents = AssociatedModel.prototype._processPendingEvents;
    CollectionProto._addAssociatedEventSources = AssociatedModel.prototype._addAssociatedEventSources;


}).call(this);
