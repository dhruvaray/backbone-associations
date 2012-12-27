(function () {
    var e, g, i, o, n;
    "undefined" !== typeof require ? (e = require("underscore"), g = require("backbone"), exports = module.exports = g) : (e = window._, g = window.Backbone);
    i = g.Model.prototype;
    o = "change add remove reset destroy sync error sort request".split(" ");
    g.Many = "Many";
    g.One = "One";
    n = g.AssociatedModel = g.Model.extend({relations:void 0, _proxyCalls:void 0, set:function (b, a, c) {
        var d, f, h;
        if (e.isObject(b) || b == null) {
            d = b;
            c = a
        } else {
            d = {};
            d[b] = a
        }
        c || (c = {});
        if (!d)return this;
        if (c.unset)for (h in d)d[h] = void 0;
        this.relations &&
        e.each(this.relations, function (a) {
            var b = a.key, h = a.relatedModel, k = a.collectionType, l, m;
            if (d[b]) {
                l = e.result(d, b);
                h && e.isString(h) && (h = eval(h));
                k && e.isString(k) && (k = eval(k));
                m = a.options ? e.extend({}, a.options, c) : c;
                if (a.type === g.Many) {
                    if (k && !k.prototype instanceof g.Collection)throw Error("collectionType must inherit from Backbone.Collection");
                    if (l instanceof g.Collection)i.set.call(this, b, l, m); else if (this.attributes[b])this.attributes[b].reset(l, m); else {
                        a = k ? new k : this._createCollection(h);
                        a.add(l, m);
                        i.set.call(this, b, a, m)
                    }
                } else if (a.type === g.One && h) {
                    a = l instanceof n ? l : new h(l);
                    i.set.call(this, b, a, m)
                }
                if (!this.attributes[b]._proxyCallback) {
                    this.attributes[b]._proxyCallback = function () {
                        var a = arguments, c = a[0].split(":"), d = c[0], f = a[1], h = -1, i = this.attributes[b]._proxyCalls, j;
                        if (e.contains(o, d)) {
                            c && e.size(c) > 1 && (j = c[1]);
                            this.attributes[b]instanceof g.Collection && "change" === d && (h = e.indexOf(this.attributes[b].models, f));
                            j = b + (h !== -1 ? "[" + h + "]" : "") + (j ? "." + j : "");
                            a[0] = d + ":" + j;
                            if (i) {
                                if (c = e.find(i, function (a, b) {
                                    return j.indexOf(b, j.length - b.length) !== -1
                                }))return this
                            } else i = this.attributes[b]._proxyCalls = {};
                            i[j] = true
                        }
                        this.trigger.apply(this, a);
                        j && i && delete i[j];
                        return this
                    };
                    this.attributes[b].on("all", this.attributes[b]._proxyCallback, this)
                }
                !f && (f = []);
                e.indexOf(f, b) === -1 && f.push(b)
            }
        }, this);
        if (f) {
            b = {};
            for (h in d)e.indexOf(f, h) === -1 && (b[h] = d[h])
        } else b = d;
        return i.set.call(this, b, c)
    }, _createCollection:function (b) {
        var a = b;
        e.isString(a) && (a = eval(a));
        if (a && a.prototype instanceof n) {
            b = new g.Collection;
            b.model =
                a
        } else throw Error("type must inherit from Backbone.AssociatedModel");
        return b
    }, hasChanged:function (b) {
        var a, c, d;
        if (!this.visitedHC) {
            this.visitedHC = true;
            a = i.hasChanged.apply(this, arguments);
            if (!a && this.relations)for (d = 0; d < this.relations.length; ++d) {
                c = this.relations[d];
                if (c = this.attributes[c.key]) {
                    if (c instanceof g.Collection) {
                        c = c.filter(function (a) {
                            return a.hasChanged() === true
                        });
                        e.size(c) > 0 && (a = true)
                    } else a = c.hasChanged && c.hasChanged();
                    if (a)break
                }
            }
            delete this.visitedHC
        }
        return!!a
    }, changedAttributes:function (b) {
        var a,
            c, d, f;
        if (!this.visited) {
            this.visited = true;
            a = i.changedAttributes.apply(this, arguments);
            if (this.relations)for (f = 0; f < this.relations.length; ++f) {
                c = this.relations[f];
                if (d = this.attributes[c.key])if (d instanceof g.Collection) {
                    d = e.filter(d.map(function (a) {
                        return a.changedAttributes()
                    }), function (a) {
                        return!!a
                    });
                    e.size(d) > 0 && (a[c.key] = d)
                } else d instanceof n && d.hasChanged() && (a[c.key] = d.toJSON())
            }
            delete this.visited
        }
        return!a ? false : a
    }, previousAttributes:function () {
        var b, a, c, d;
        if (!this.visited) {
            this.visited = true;
            b = i.previousAttributes.apply(this, arguments);
            this.relations && e.each(this.relations, function (f) {
                a = this.attributes[f.key];
                d = (c = b[f.key]) ? c.toJSON() : void 0;
                c && c == a ? a instanceof n ? b[f.key] = a.previousAttributes() : a instanceof g.Collection && (b[f.key] = a.map(function (a) {
                    return a.previousAttributes()
                })) : c && (b[f.key] = d)
            }, this);
            delete this.visited
        }
        return b
    }, previous:function (b) {
        return this.previousAttributes()[b]
    }, toJSON:function (b) {
        var a, c;
        if (!this.visited) {
            this.visited = true;
            a = i.toJSON.apply(this, arguments);
            this.relations && e.each(this.relations, function (d) {
                var f = this.attributes[d.key];
                if (f) {
                    c = f.toJSON(b);
                    a[d.key] = e.isArray(c) ? e.compact(c) : c
                }
            }, this);
            delete this.visited
        }
        return a
    }, clone:function () {
        var b, a;
        if (!this.visited) {
            this.visited = true;
            b = i.clone.apply(this, arguments);
            this.relations && e.each(this.relations, function (c) {
                if (this.attributes[c.key]) {
                    var d = b.attributes[c.key];
                    if (d instanceof g.Collection) {
                        a = c.collectionType ? new c.collectionType : this._createCollection(c.relatedModel);
                        d.each(function (b) {
                            (b =
                                b.clone()) && a.add(b)
                        });
                        b.attributes[c.key] = a
                    } else d instanceof g.Model && (b.attributes[c.key] = d.clone())
                }
            }, this);
            delete this.visited
        }
        return b
    }})
})();
