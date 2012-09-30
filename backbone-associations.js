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
(function() {
    // The top-level namespace. All public Backbone classes and modules will be attached to this.
    // Exported for the browser and CommonJS.
    var _, Backbone;
    if ( typeof window === 'undefined' ) {
        _ = require( 'underscore' );
        Backbone = require( 'backbone' );
        exports = module.exports = Backbone;
    }
    else {
        _ = window._;
        Backbone = window.Backbone;
        exports = window;
    }
    // Backbone.AssociatedModel
    // --------------

    //Add `Many` and `One` relations to Backbone Object
    Backbone.Many  = "Many";
    Backbone.One  = "One";
    //Define `AssociatedModel` (Extends Backbone.Model)
    Backbone.AssociatedModel = Backbone.Model.extend({
        //Define relations with Associated Model
        relations: undefined,
        //Set a hash of model attributes on the object,
        //firing `"change"` unless you choose to silence it.
        //It maintains relations between models during the set operation. It also bubbles up child events to the parent.
        set: function( key, value, options ) {
            var attributes,processedRelations,tbp;
            // Duplicate backbone's behavior to allow separate key/value parameters, instead of a single 'attributes' object.
            if ( _.isObject( key ) || key == null ) {
                attributes = key;
                options = value;
            }
            else {
                attributes = {};
                attributes[ key ] = value;
            }
            // Extract attributes and options.
            options || (options = {});
            if(!attributes) return this;
            if (options.unset) for (attr in attributes) attributes[attr] = void 0;
            //Check for existence of relations in this model
            if(this.relations){
                //Iterate over `this.relations` and `set` model and collection values
                _.each(this.relations ,function(relation){
                    var relationKey = relation.key, relatedModel = relation.relatedModel, collectiontype = relation.collectionType;
                    if (attributes[relationKey] != undefined ){
                        //Get value of attribute with relation key in `val`
                        var val = getValue(attributes,relationKey);
                        //Get class if relation is stored as a string
                        relatedModel && _.isString(relatedModel) && (relatedModel = eval(relatedModel));
                        collectiontype && _.isString(collectiontype) && (collectiontype = eval(collectiontype));
                        //Track reference change of associated model for `change:attribute` event
                        var refChanged = false;
                        //Merge in options specific to this relation
                        var relationOptions = relation.options?_.extend({},relation.options,options):options;
                        //If `relation` defines model as associated collection...
                        if(relation.type === Backbone.Many){
                            //`collectionType` should be instance of `Backbone.Collection`
                            if(collectiontype && !collectiontype.prototype instanceof Backbone.Collection){
                                throw new Error( 'collectionType must inherit from Backbone.Collection' );
                            }
                            //Create new `Backbone.Collection` with `collectionType`
                            if(!this.attributes[relationKey]){
                                this.attributes[relationKey] = collectiontype ? new collectiontype() : this._createCollection(relatedModel);
                                refChanged = true;
                            }
                            // Get all models if `val` is already instanceof `Backbone.Collection`
                            if(val instanceof Backbone.Collection){
                                val = val.models;
                            }
                            //Resetting new Collection with new value and options
                            this.attributes[relationKey].reset(val,relationOptions);
                        }
                        //If `relation` defines model as associated model...
                        else if(relation.type == Backbone.One && relatedModel){
                            //Create New `Backbone.Model` using `relatedModel` if `attributes` is not null
                            if(!this.attributes[relationKey]){
                                //If `val` is already instance of  `AssociatedModel`, reserve `relationKey` for `Backbone.Model.prototype.set`
                                if(val instanceof Backbone.AssociatedModel) return this;
                                this.attributes[relationKey] = new relatedModel();
                                refChanged = true;
                            }
                            //If the new attributes is a smaller subset, then use the default values for that attribute - if available.
                            else{
                                var opt = {};
                                var defaults = getValue(this.attributes[relationKey], 'defaults');
                                _.each(this.attributes[relationKey].attributes,function(value,key){
                                    !_.has(val,key) && (opt[key] = (defaults ? defaults[key] : void 0));
                                });
                                this.attributes[relationKey].set(opt,{silent:true});
                            }
                            //Set `val` to model with options
                            this.attributes[relationKey].set(val,relationOptions);
                        }
                        //Add proxy events to respective parents
                        this.attributes[relationKey].off("all");
                        this.attributes[relationKey].on("all",function(){return this.trigger.apply(this,arguments);},this);
                        //If reference has changed, trigger `change:attribute` event
                        refChanged && this.trigger('change:'+relationKey,this,this.get(relationKey),relationOptions);
                        //Create a local `processedRelations` array to store the relation key which has been processed.
                        //We cannot use `this.relations` because if there is no value defined for `relationKey`, it will not get processed by either Backbone `set` or the `AssociatedModel` set
                        !processedRelations && (processedRelations=[]);
                        if(_.indexOf(processedRelations,relationKey)===-1){
                            processedRelations.push(relationKey);
                        }
                    }
                },this);
            };
            if(processedRelations){
                //Find attributes yet to be processed - `tbp`
                tbp = {};
                for(var key in attributes){
                    if(_.indexOf(processedRelations,key)===-1){
                        tbp[key] = attributes[key];
                    }
                }
            }
            //Set all `attributes` to `tbp`
            else{
                tbp = attributes;
            }
            //Returns results for `Backbone.Model.prototype.set`
            return Backbone.Model.prototype.set.call( this, tbp , options);
        },
        //Returns New `collection` of type `relation.relatedModel`
        _createCollection: function(type) {
            var collection;
            var relatedModel = type;
            _.isString(relatedModel) && (relatedModel = eval(relatedModel));
            if ( relatedModel && relatedModel.prototype instanceof Backbone.AssociatedModel ) {
                //Creates new `Backbone.Collection` and defines model class
                collection = new Backbone.Collection();
                collection.model = relatedModel;
            }
            else{
                throw new Error( 'type must inherit from Backbone.AssociatedModel' );
            }
            return collection;
        },
        // `trigger` the event for `Associated Model`
        trigger : function(){
            //Check & Add `visited` tag to prevent event of cycle
            if(!this.visitedTrigger){
                // mark as `visited`
                this.visitedTrigger = true;
                Backbone.Model.prototype.trigger.apply(this,arguments);
                //delete `visited` tag to allow trigger for next `set` operation
                delete this.visitedTrigger;
            }
            return this;
        },
        //The JSON representation of the model.
        toJSON : function(){
            var json;
            if(!this.visited){
                this.visited = true;
                //Get json representation from `Backbone.Model.prototype.toJSON`
                json = Backbone.Model.prototype.toJSON.apply( this, arguments );
                //If `this.relations` is defined, iterate through each `relation` and added it's json representation to parents' json representation
                if(this.relations){
                    _.each(this.relations ,function(relation){
                        var attr = this.attributes[relation.key];
                        if(attr){
                            aJson = attr.toJSON();
                            json[relation.key] = _.isArray(aJson)?_.compact(aJson):aJson;
                        }
                    },this);
                }
                delete this.visited;
            }
            return json;
        },
        //deep `clone` the model.
        clone : function(){
            var cloneObj;
            if(!this.visited){
                this.visited = true;
                //Get shallow clone from `Backbone.Model.prototype.clone`
                cloneObj = Backbone.Model.prototype.clone.apply( this, arguments );
                //If `this.relations` is defined, iterate through each `relation` and `clone`
                if(this.relations){
                    _.each(this.relations ,function(relation){
                        if(this.attributes[relation.key]){
                            var sourceObj = cloneObj.attributes[relation.key];
                            if(sourceObj instanceof Backbone.Collection){
                                //Creates new `collection` using `relation`
                                var newCollection = relation.collectionType ? new relation.collectionType() : this._createCollection(relation.relatedModel);
                                //Added each `clone` model to `newCollection`
                                sourceObj.each(function(model){
                                    var mClone = model.clone()
                                    mClone && newCollection.add(mClone);
                                });
                                cloneObj.attributes[relation.key] = newCollection;
                            }
                            else if(sourceObj instanceof Backbone.Model){
                                cloneObj.attributes[relation.key] = sourceObj.clone();
                            }
                        }
                    },this);
                }
                delete this.visited;
            }
            return cloneObj;
        }
    });
    // Duplicate Backbone's behavior. To get a value from a Backbone object as a property
    // or as a function.
    var getValue = function(object, prop) {
        if (!(object && object[prop])) return null;
        return _.isFunction(object[prop]) ? object[prop]() : object[prop];
    };
})();
