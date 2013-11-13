//adopted from Backbone 1.1.0 test suite
(function() {

  var sync = Backbone.sync;
  var ajax = Backbone.ajax;
  var emulateHTTP = Backbone.emulateHTTP;
  var emulateJSON = Backbone.emulateJSON;
  var model = Backbone.Model;

  QUnit.testStart(function() {
    var env = this.config.current.testEnvironment;

    // Capture ajax settings for comparison.
    Backbone.ajax = function(settings) {
      env.ajaxSettings = settings;
    };

    // Capture the arguments to Backbone.sync for comparison.
    Backbone.sync = function(method, model, options) {
      env.syncArgs = {
        method: method,
        model: model,
        options: options
      };
      sync.apply(this, arguments);
    };

    model = Backbone.OriginalModel = Backbone.Model;
    Backbone.Model = Backbone.AssociatedModel;

  });

  QUnit.testDone(function() {
    Backbone.sync = sync;
    Backbone.ajax = ajax;
    Backbone.emulateHTTP = emulateHTTP;
    Backbone.emulateJSON = emulateJSON;
    Backbone.Model = model;
  });

})();
