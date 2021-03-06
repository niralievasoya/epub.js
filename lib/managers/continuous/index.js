"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _core = require("../../utils/core");

var _default = require("../default");

var _default2 = _interopRequireDefault(_default);

var _constants = require("../../utils/constants");

var _debounce = require("lodash/debounce");

var _debounce2 = _interopRequireDefault(_debounce);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var ContinuousViewManager = function (_DefaultViewManager) {
	_inherits(ContinuousViewManager, _DefaultViewManager);

	function ContinuousViewManager(options) {
		_classCallCheck(this, ContinuousViewManager);

		var _this = _possibleConstructorReturn(this, (ContinuousViewManager.__proto__ || Object.getPrototypeOf(ContinuousViewManager)).call(this, options));

		_this.name = "continuous";

		_this.settings = (0, _core.extend)(_this.settings || {}, {
			infinite: true,
			overflow: undefined,
			axis: undefined,
			flow: "scrolled",
			offset: 500,
			offsetDelta: 250,
			width: undefined,
			height: undefined
		});

		(0, _core.extend)(_this.settings, options.settings || {});

		// Gap can be 0, but defaults doesn't handle that
		if (options.settings.gap != "undefined" && options.settings.gap === 0) {
			_this.settings.gap = options.settings.gap;
		}

		_this.viewSettings = {
			ignoreClass: _this.settings.ignoreClass,
			axis: _this.settings.axis,
			flow: _this.settings.flow,
			layout: _this.layout,
			width: 0,
			height: 0,
			forceEvenPages: false
		};

		_this.scrollTop = 0;
		_this.scrollLeft = 0;
		return _this;
	}

	_createClass(ContinuousViewManager, [{
		key: "display",
		value: function display(section, target) {
			return _default2.default.prototype.display.call(this, section, target).then(function () {
				return this.fill();
			}.bind(this));
		}
	}, {
		key: "fill",
		value: function fill(_full) {
			var _this2 = this;

			var full = _full || new _core.defer();

			this.q.enqueue(function () {
				return _this2.check();
			}).then(function (result) {
				if (result) {
					_this2.fill(full);
				} else {
					full.resolve();
				}
			});

			return full.promise;
		}
	}, {
		key: "moveTo",
		value: function moveTo(offset) {
			// var bounds = this.stage.bounds();
			// var dist = Math.floor(offset.top / bounds.height) * bounds.height;
			var distX = 0,
			    distY = 0;

			var offsetX = 0,
			    offsetY = 0;

			if (!this.isPaginated) {
				distY = offset.top;
				offsetY = offset.top + this.settings.offset;
			} else {
				distX = Math.floor(offset.left / this.layout.delta) * this.layout.delta;
				offsetX = distX + this.settings.offset;
			}

			if (distX > 0 || distY > 0) {
				this.scrollBy(distX, distY, true);
			}
		}
	}, {
		key: "afterResized",
		value: function afterResized(view) {
			this.emit(_constants.EVENTS.MANAGERS.RESIZE, view.section);
		}

		// Remove Previous Listeners if present

	}, {
		key: "removeShownListeners",
		value: function removeShownListeners(view) {

			// view.off("shown", this.afterDisplayed);
			// view.off("shown", this.afterDisplayedAbove);
			view.onDisplayed = function () {};
		}
	}, {
		key: "add",
		value: function add(section) {
			var _this3 = this;

			var view = this.createView(section);

			this.views.append(view);

			view.on(_constants.EVENTS.VIEWS.RESIZED, function (bounds) {
				view.expanded = true;
			});

			view.on(_constants.EVENTS.VIEWS.AXIS, function (axis) {
				_this3.updateAxis(axis);
			});

			// view.on(EVENTS.VIEWS.SHOWN, this.afterDisplayed.bind(this));
			view.onDisplayed = this.afterDisplayed.bind(this);
			view.onResize = this.afterResized.bind(this);

			return view.display(this.request);
		}
	}, {
		key: "append",
		value: function append(section) {
			var view = this.createView(section);

			view.on(_constants.EVENTS.VIEWS.RESIZED, function (bounds) {
				view.expanded = true;
			});

			/*
   view.on(EVENTS.VIEWS.AXIS, (axis) => {
   	this.updateAxis(axis);
   });
   */

			this.views.append(view);

			view.onDisplayed = this.afterDisplayed.bind(this);

			return view;
		}
	}, {
		key: "prepend",
		value: function prepend(section) {
			var _this4 = this;

			var view = this.createView(section);

			view.on(_constants.EVENTS.VIEWS.RESIZED, function (bounds) {
				_this4.counter(bounds);
				view.expanded = true;
			});

			/*
   view.on(EVENTS.VIEWS.AXIS, (axis) => {
   	this.updateAxis(axis);
   });
   */

			this.views.prepend(view);

			view.onDisplayed = this.afterDisplayed.bind(this);

			return view;
		}
	}, {
		key: "counter",
		value: function counter(bounds) {
			if (this.settings.axis === "vertical") {
				this.scrollBy(0, bounds.heightDelta, true);
			} else {
				this.scrollBy(bounds.widthDelta, 0, true);
			}
		}
	}, {
		key: "update",
		value: function update(_offset) {
			var container = this.bounds();
			var views = this.views.all();
			var viewsLength = views.length;
			var visible = [];
			var offset = typeof _offset != "undefined" ? _offset : this.settings.offset || 0;
			var isVisible;
			var view;

			var updating = new _core.defer();
			var promises = [];
			for (var i = 0; i < viewsLength; i++) {
				view = views[i];

				isVisible = this.isVisible(view, offset, offset, container);

				if (isVisible === true) {
					// console.log("visible " + view.index);

					if (!view.displayed) {
						var displayed = view.display(this.request).then(function (view) {
							view.show();
						}, function (err) {
							view.hide();
						});
						promises.push(displayed);
					} else {
						view.show();
					}
					visible.push(view);
				} else {
					this.q.enqueue(view.destroy.bind(view));
					// console.log("hidden " + view.index);

					clearTimeout(this.trimTimeout);
					this.trimTimeout = setTimeout(function () {
						this.q.enqueue(this.trim.bind(this));
					}.bind(this), 250);
				}
			}

			if (promises.length) {
				return Promise.all(promises).catch(function (err) {
					updating.reject(err);
				});
			} else {
				updating.resolve();
				return updating.promise;
			}
		}
	}, {
		key: "check",
		value: function check(_offsetLeft, _offsetTop) {
			var _this5 = this;

			var checking = new _core.defer();
			var newViews = [];

			var horizontal = this.settings.axis === "horizontal";
			var delta = this.settings.offset || 0;

			if (_offsetLeft && horizontal) {
				delta = _offsetLeft;
			}

			if (_offsetTop && !horizontal) {
				delta = _offsetTop;
			}

			var bounds = this._bounds; // bounds saved this until resize

			var rtl = this.settings.direction === "rtl";
			var dir = horizontal && rtl ? -1 : 1; //RTL reverses scrollTop

			var offset = horizontal ? this.scrollLeft : this.scrollTop * dir;
			var visibleLength = horizontal ? bounds.width : bounds.height;
			var contentLength = horizontal ? this.container.scrollWidth : this.container.scrollHeight;

			var prepend = function prepend() {
				var first = _this5.views.first();
				var prev = first && first.section.prev();

				if (prev) {
					newViews.push(_this5.prepend(prev));
				}
			};

			var append = function append() {
				var last = _this5.views.last();
				var next = last && last.section.next();

				if (next) {
					newViews.push(_this5.append(next));
				}
			};

			if (offset + visibleLength + delta >= contentLength) {
				if (horizontal && rtl) {
					prepend();
				} else {
					append();
				}
			}

			if (offset - delta < 0) {
				if (horizontal && rtl) {
					append();
				} else {
					prepend();
				}
			}

			var promises = newViews.map(function (view) {
				return view.displayed;
			});

			if (newViews.length) {
				return Promise.all(promises).then(function () {
					if (_this5.layout.name === "pre-paginated" && _this5.layout.props.spread) {
						return _this5.check();
					}
				}).then(function () {
					// Check to see if anything new is on screen after rendering
					return _this5.update(delta);
				}, function (err) {
					return err;
				});
			} else {
				this.q.enqueue(function () {
					this.update();
				}.bind(this));
				checking.resolve(false);
				return checking.promise;
			}
		}
	}, {
		key: "trim",
		value: function trim() {
			var task = new _core.defer();
			var displayed = this.views.displayed();
			var first = displayed[0];
			var last = displayed[displayed.length - 1];
			var firstIndex = this.views.indexOf(first);
			var lastIndex = this.views.indexOf(last);
			var above = this.views.slice(0, firstIndex);
			var below = this.views.slice(lastIndex + 1);

			// Erase all but last above
			for (var i = 0; i < above.length - 1; i++) {
				this.erase(above[i], above);
			}

			// Erase all except first below
			for (var j = 1; j < below.length; j++) {
				this.erase(below[j]);
			}

			task.resolve();
			return task.promise;
		}
	}, {
		key: "erase",
		value: function erase(view, above) {
			//Trim

			var prevTop;
			var prevLeft;

			if (this.settings.height) {
				prevTop = this.container.scrollTop;
				prevLeft = this.container.scrollLeft;
			} else {
				prevTop = window.scrollY;
				prevLeft = window.scrollX;
			}

			var bounds = view.bounds();

			this.views.remove(view);

			if (above) {
				if (this.settings.axis === "vertical") {
					this.scrollTo(0, prevTop - bounds.height, true);
				} else {
					this.scrollTo(prevLeft - bounds.width, 0, true);
				}
			}
		}
	}, {
		key: "addEventListeners",
		value: function addEventListeners(stage) {

			window.addEventListener("unload", function (e) {
				this.ignore = true;
				// this.scrollTo(0,0);
				this.destroy();
			}.bind(this));

			this.addScrollListeners();
		}
	}, {
		key: "addScrollListeners",
		value: function addScrollListeners() {
			var scroller;

			this.tick = _core.requestAnimationFrame;

			if (this.settings.height) {
				this.prevScrollTop = this.container.scrollTop;
				this.prevScrollLeft = this.container.scrollLeft;
			} else {
				this.prevScrollTop = window.scrollY;
				this.prevScrollLeft = window.scrollX;
			}

			this.scrollDeltaVert = 0;
			this.scrollDeltaHorz = 0;

			if (this.settings.height) {
				scroller = this.container;
				this.scrollTop = this.container.scrollTop;
				this.scrollLeft = this.container.scrollLeft;
			} else {
				scroller = window;
				this.scrollTop = window.scrollY;
				this.scrollLeft = window.scrollX;
			}

			scroller.addEventListener("scroll", this.onScroll.bind(this));
			this._scrolled = (0, _debounce2.default)(this.scrolled.bind(this), 30);
			// this.tick.call(window, this.onScroll.bind(this));

			this.didScroll = false;
		}
	}, {
		key: "removeEventListeners",
		value: function removeEventListeners() {
			var scroller;

			if (this.settings.height) {
				scroller = this.container;
			} else {
				scroller = window;
			}

			scroller.removeEventListener("scroll", this.onScroll.bind(this));
		}
	}, {
		key: "onScroll",
		value: function onScroll() {
			var scrollTop = void 0;
			var scrollLeft = void 0;
			var dir = this.settings.direction === "rtl" ? -1 : 1;

			if (this.settings.height) {
				scrollTop = this.container.scrollTop;
				scrollLeft = this.container.scrollLeft;
			} else {
				scrollTop = window.scrollY * dir;
				scrollLeft = window.scrollX * dir;
			}

			this.scrollTop = scrollTop;
			this.scrollLeft = scrollLeft;

			if (!this.ignore) {

				this._scrolled();
			} else {
				this.ignore = false;
			}

			this.scrollDeltaVert += Math.abs(scrollTop - this.prevScrollTop);
			this.scrollDeltaHorz += Math.abs(scrollLeft - this.prevScrollLeft);

			this.prevScrollTop = scrollTop;
			this.prevScrollLeft = scrollLeft;

			clearTimeout(this.scrollTimeout);
			this.scrollTimeout = setTimeout(function () {
				this.scrollDeltaVert = 0;
				this.scrollDeltaHorz = 0;
			}.bind(this), 150);

			this.didScroll = false;
		}
	}, {
		key: "scrolled",
		value: function scrolled() {
			this.q.enqueue(function () {
				this.check();
			}.bind(this));

			this.emit(_constants.EVENTS.MANAGERS.SCROLL, {
				top: this.scrollTop,
				left: this.scrollLeft
			});

			clearTimeout(this.afterScrolled);
			this.afterScrolled = setTimeout(function () {
				this.emit(_constants.EVENTS.MANAGERS.SCROLLED, {
					top: this.scrollTop,
					left: this.scrollLeft
				});
			}.bind(this));
		}
	}, {
		key: "next",
		value: function next() {

			var dir = this.settings.direction;
			var delta = this.layout.props.name === "pre-paginated" && this.layout.props.spread ? this.layout.props.delta * 2 : this.layout.props.delta;

			if (!this.views.length) return;

			if (this.isPaginated && this.settings.axis === "horizontal") {

				this.scrollBy(delta, 0, true);
			} else {

				this.scrollBy(0, this.layout.height, true);
			}

			this.q.enqueue(function () {
				this.check();
			}.bind(this));
		}
	}, {
		key: "prev",
		value: function prev() {

			var dir = this.settings.direction;
			var delta = this.layout.props.name === "pre-paginated" && this.layout.props.spread ? this.layout.props.delta * 2 : this.layout.props.delta;

			if (!this.views.length) return;

			if (this.isPaginated && this.settings.axis === "horizontal") {

				this.scrollBy(-delta, 0, true);
			} else {

				this.scrollBy(0, -this.layout.height, true);
			}

			this.q.enqueue(function () {
				this.check();
			}.bind(this));
		}
	}, {
		key: "updateAxis",
		value: function updateAxis(axis, forceUpdate) {

			if (!this.isPaginated) {
				axis = "vertical";
			}

			if (!forceUpdate && axis === this.settings.axis) {
				return;
			}

			this.settings.axis = axis;

			this.stage && this.stage.axis(axis);

			this.viewSettings.axis = axis;

			if (this.mapping) {
				this.mapping.axis(axis);
			}

			if (this.layout) {
				if (axis === "vertical") {
					this.layout.spread("none");
				} else {
					this.layout.spread(this.layout.settings.spread);
				}
			}

			if (axis === "vertical") {
				this.settings.infinite = true;
			} else {
				this.settings.infinite = false;
			}
		}
	}]);

	return ContinuousViewManager;
}(_default2.default);

exports.default = ContinuousViewManager;
module.exports = exports["default"];