import  $ from 'jquery';
  // Utility function to extend Data Map Zoom functionality
  function Zoom(args) {
    $.extend(this, {
      $buttons: $(".zoom-button"),
      $info: $("#zoom-info"),
      scale: {
        max: 50,
        currentShift: 0
      },
      $container: args.$container,
      datamap: args.datamap
    });

    this.init();
  }

  Zoom.prototype.init = function() {
    var paths = this.datamap.svg.selectAll("path"),
      subunits = this.datamap.svg.selectAll(".datamaps-subunit");

    // preserve stroke thickness
    paths.attr("vector-effect", "non-scaling-stroke");

    // disable click on drag end
    subunits.call(
      d3.behavior.drag().on("dragend", function() {
        d3.event.sourceEvent.stopPropagation();
      })
    );

    this.scale.set = this._getScalesArray();
    this.d3Zoom = d3.behavior.zoom().scaleExtent([1, this.scale.max]);

    this._displayPercentage(1);
    this._shift('in');
    this.listen();
  };

  Zoom.prototype.listen = function() {
    this.$buttons.off("click").on("click", this._handleClick.bind(this));

    this.datamap.svg
      .call(this.d3Zoom.on("zoom", this._handleScroll.bind(this)))
      .on("dblclick.zoom", null); // disable zoom on double-click
  };

  Zoom.prototype.reset = function() {
    this._shift("reset");
  };

  Zoom.prototype._handleScroll = function() {
    var translate = d3.event.translate,
      scale = d3.event.scale,
      // limited = this._bound(translate, scale);
      limited = {
        translate: translate,
        scale: scale
      };

    this.scrolled = true;

    // console.debug('Scrolling Map . . .: ');
    // console.debug(limited);
    // console.debug(scale);

    this._update(limited.translate, limited.scale);
  };

  Zoom.prototype._handleClick = function(event) {
    var direction = $(event.target).data("zoom");
    this._shift(direction);
  };

  Zoom.prototype._shift = function(direction) {
    var center = [this.$container.width() / 2, this.$container.height() / 2],
      translate = this.d3Zoom.translate(),
      translate0 = [],
      l = [],
      view = {
        x: translate[0],
        y: translate[1],
        k: this.d3Zoom.scale()
      },
      target = {},
      bounded;
      // console.debug('Beginning shifting map ...');
      // console.debug(view);

    if (direction == "reset") {
      view.x = -300/1000 * this.$container.width();
      view.y = 0;
      view.k = 1;
      target.k = 2.5;

      translate0 = [
        (center[0] - view.x) / view.k,
        (center[1] - view.y) / view.k
      ];

      view.k = target.k;

      l = [translate0[0] * view.k + view.x, translate0[1] * view.k + view.y];

      view.x += center[0] - l[0];
      view.y += center[1] - l[1];

      target.x = view.x;
      target.y = view.y;


      this.scrolled = true;
    } else if (direction == "whole") {
      target.x = 0;
      target.y = 0;
      target.k = 1;

      this.scrolled = true;
    } else {
      target.k = this._getNextScale(direction);
      // debugger
      translate0 = [
        (center[0] - view.x) / view.k,
        (center[1] - view.y) / view.k
      ];

      view.k = target.k;

      l = [translate0[0] * view.k + view.x, translate0[1] * view.k + view.y];

      view.x += center[0] - l[0];
      view.y += center[1] - l[1];

      target.x = view.x;
      target.y = view.y;

      // bounded = this._bound([view.x, view.y], view.k);
    }

    // console.debug('Shifting map ...');
    // console.debug(view);

    bounded = {
      translate: [target.x, target.y],
      scale: target.k
    };
    // console.debug(bounded);
    this._animate(bounded.translate, bounded.scale);
  };

  Zoom.prototype._bound = function(translate, scale) {
    var width = this.$container.width(),
      height = this.$container.height();

    translate[0] = Math.min(
      (width / height) * (scale - 1),
      Math.max(width * (1 - scale), translate[0])
    );

    translate[1] = Math.min(0, Math.max(height * (1 - scale), translate[1]));

    return {
      translate: translate,
      scale: scale
    };
  };

  Zoom.prototype._update = function(translate, scale) {
    // console.debug('Updating Map . . .: ');
    // console.debug(translate);
    // console.debug(scale);
    this.datamap.svg.selectAll("path").attr("vector-effect", "non-scaling-stroke");
    this.d3Zoom
      .translate(translate)
      .scale(scale);

    this.datamap.svg.selectAll("g")
      .attr("transform", "translate(" + translate + ")scale(" + scale + ")");

    this._displayPercentage(scale);
  };

  Zoom.prototype._animate = function(translate, scale) {
    // console.debug('Animating Map . . .: ');
    // console.debug(translate);
    // console.debug(scale);
    var _this = this,
      d3Zoom = this.d3Zoom;

    d3.transition().duration(350).tween("zoom", function() {
      var iTranslate = d3.interpolate(d3Zoom.translate(), translate),
        iScale = d3.interpolate(d3Zoom.scale(), scale);

      return function(t) {
        _this._update(iTranslate(t), iScale(t));
      };
    });
  };

  // caculate the displayed scale persentage based on current scale
  Zoom.prototype._displayPercentage = function(scale) {
    var value;

    value = Math.round(Math.log(scale) / Math.log(this.scale.max) * 100);
    this.$info.text(value + "%");
  };

  // caculate a scale array from 1 to this.scale.max in 10 steps
  Zoom.prototype._getScalesArray = function() {
    var array = [],
      scaleMaxLog = Math.log(this.scale.max);

    for (var i = 0; i <= 10; i++) {
      array.push(Math.pow(Math.E, 0.1 * i * scaleMaxLog));
    }

    return array;
  };

  Zoom.prototype._getNextScale = function(direction) {
    var scaleSet = this.scale.set,
      currentScale = this.d3Zoom.scale(),
      lastShift = scaleSet.length - 1,
      shift, temp = [];

    // debugger

    if (this.scrolled) {

      for (shift = 0; shift <= lastShift; shift++) {
        temp.push(Math.abs(scaleSet[shift] - currentScale));
      }

      shift = temp.indexOf(Math.min.apply(null, temp));

      if (currentScale >= scaleSet[shift] && shift < lastShift) {
        shift++;
      }

      if (direction == "out" && shift > 0) {
        shift--;
      }

      this.scrolled = false;

    } else {

      shift = this.scale.currentShift;

      if (direction == "out") {
        shift > 0 && shift--;
      } else {
        shift < lastShift && shift++;
      }
    }

    this.scale.currentShift = shift;

    return scaleSet[shift];
  };

  export default Zoom;
  // Expose library
//   if (typeof exports === 'object') {
//     $ = require('jquery');
//     module.exports = Zoom;
//   } else if (typeof define === "function" && define.amd) {
//     define("zoom", ["require", "jquery"], function(require) {
//       $ = require('jquery');
//       return Zoom;
//     });
//   } else {
//     window.Zoom = window.Zoomer = Zoom;
//   }

//   if (window.jQuery) {
//     window.jQuery.fn.zoomer = function(options, callback) {
//       options = options || {};
//       options.element = this[0];
//       var zoomer = new Zoom(options);
//       if (typeof callback === "function") {
//         callback(zoomer, options);
//       }
//       return this;
//     };
//   }
// })();
