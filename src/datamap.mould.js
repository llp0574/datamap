(function() {

  // Save off default references
  var $ = window.jQuery,
    Datamaps = window.Datamaps,
    Zoom = window.Zoom;

  function Datamap(hookElement, mapColors) {
    this.$container = $(hookElement);
    this.instance = new Datamaps({
      scope: 'world',
      element: this.$container.get(0),
      projection: 'mercator',
      done: this._handleMapReady.bind(this),
      fills: {
        defaultFill: mapColors.fill_color,
      },
      geographyConfig: {
        dataUrl: null,
        hideAntarctica: true,
        borderWidth: 0.75,
        borderColor: mapColors.border_color,
        // popupTemplate: function(geography, data) {
        //     return '<div class="hoverinfo" style="color:' + mapColors.hoverinfo_text + ';background:' + mapColors.hoverinfo_bg + '">' +
        //         geography.properties.name + '</div>';
        // },
        popupOnHover: false,
        highlightOnHover: false,
        highlightFillColor: mapColors.highlight_fill_color,
        highlightBorderColor: mapColors.highlight_border_color,
        highlightBorderWidth: 2
      }
    });
  }

  Datamap.prototype._handleMapReady = function(datamap) {
    this.zoom = new Zoom({
      $container: this.$container,
      datamap: datamap
    });
  }

  // Expose library
  if (typeof exports === 'object') {
    $ = require('jquery');
    Datamaps = require('./datamaps.world');
    Zoom = require('./datamap.zoomer');
    module.exports = Datamap;
  } else {
    window.Datamap = Datamap;
  }

  if (window.jQuery) {
    window.jQuery.fn.datamaps = function(options, callback) {
      options = options || {};
      options.element = this[0];
      var datamap = new Datamap(options);
      if (typeof callback === "function") {
        callback(datamap, options);
      }
      return this;
    };
  }

})();
