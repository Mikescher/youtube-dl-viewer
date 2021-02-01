
/* https://unpkg.com/frappe-datatable@1.15.3/dist/frappe-datatable.js */

var DataTable = (function (Sortable) {
    'use strict';

    Sortable = Sortable && Sortable.hasOwnProperty('default') ? Sortable['default'] : Sortable;

    function $(expr, con) {
        return typeof expr === 'string' ?
            (con || document).querySelector(expr) :
            expr || null;
    }

    $.each = (expr, con) => {
        return typeof expr === 'string' ?
            Array.from((con || document).querySelectorAll(expr)) :
            expr || null;
    };

    $.create = (tag, o) => {
        let element = document.createElement(tag);

        for (let i in o) {
            let val = o[i];

            if (i === 'inside') {
                $(val).appendChild(element);
            } else
            if (i === 'around') {
                let ref = $(val);
                ref.parentNode.insertBefore(element, ref);
                element.appendChild(ref);
            } else
            if (i === 'styles') {
                if (typeof val === 'object') {
                    Object.keys(val).map(prop => {
                        element.style[prop] = val[prop];
                    });
                }
            } else
            if (i in element) {
                element[i] = val;
            } else {
                element.setAttribute(i, val);
            }
        }

        return element;
    };

    $.on = (element, event, selector, callback) => {
        if (!callback) {
            callback = selector;
            $.bind(element, event, callback);
        } else {
            $.delegate(element, event, selector, callback);
        }
    };

    $.off = (element, event, handler) => {
        element.removeEventListener(event, handler);
    };

    $.bind = (element, event, callback) => {
        event.split(/\s+/).forEach(function (event) {
            element.addEventListener(event, callback);
        });
    };

    $.delegate = (element, event, selector, callback) => {
        element.addEventListener(event, function (e) {
            const delegatedTarget = e.target.closest(selector);
            if (delegatedTarget) {
                e.delegatedTarget = delegatedTarget;
                callback.call(this, e, delegatedTarget);
            }
        });
    };

    $.unbind = (element, o) => {
        if (element) {
            for (let event in o) {
                let callback = o[event];

                event.split(/\s+/).forEach(function (event) {
                    element.removeEventListener(event, callback);
                });
            }
        }
    };

    $.fire = (target, type, properties) => {
        let evt = document.createEvent('HTMLEvents');

        evt.initEvent(type, true, true);

        for (let j in properties) {
            evt[j] = properties[j];
        }

        return target.dispatchEvent(evt);
    };

    $.data = (element, attrs) => { // eslint-disable-line
        if (!attrs) {
            return element.dataset;
        }

        for (const attr in attrs) {
            element.dataset[attr] = attrs[attr];
        }
    };

    $.style = (elements, styleMap) => { // eslint-disable-line

        if (typeof styleMap === 'string') {
            return $.getStyle(elements, styleMap);
        }

        if (!Array.isArray(elements)) {
            elements = [elements];
        }

        elements.map(element => {
            for (const prop in styleMap) {
                element.style[prop] = styleMap[prop];
            }
        });
    };

    $.removeStyle = (elements, styleProps) => {
        if (!Array.isArray(elements)) {
            elements = [elements];
        }

        if (!Array.isArray(styleProps)) {
            styleProps = [styleProps];
        }

        elements.map(element => {
            for (const prop of styleProps) {
                element.style[prop] = '';
            }
        });
    };

    $.getStyle = (element, prop) => {
        if (!prop) {
            return getComputedStyle(element);
        }

        let val = getComputedStyle(element)[prop];

        if (['width', 'height'].includes(prop)) {
            val = parseFloat(val);
        }

        return val;
    };

    $.closest = (selector, element) => {
        if (!element) return null;

        if (element.matches(selector)) {
            return element;
        }

        return $.closest(selector, element.parentNode);
    };

    $.inViewport = (el, parentEl) => {
        const {
            top,
            left,
            bottom,
            right
        } = el.getBoundingClientRect();
        const {
            top: pTop,
            left: pLeft,
            bottom: pBottom,
            right: pRight
        } = parentEl.getBoundingClientRect();

        return top >= pTop && left >= pLeft && bottom <= pBottom && right <= pRight;
    };

    $.scrollTop = function scrollTop(element, pixels) {
        requestAnimationFrame(() => {
            element.scrollTop = pixels;
        });
    };

    $.scrollbarSize = function scrollbarSize() {
        if (!$.scrollBarSizeValue) {
            $.scrollBarSizeValue = getScrollBarSize();
        }
        return $.scrollBarSizeValue;
    };

    function getScrollBarSize() {
        // assume scrollbar width and height would be the same

        // Create the measurement node
        const scrollDiv = document.createElement('div');
        $.style(scrollDiv, {
            width: '100px',
            height: '100px',
            overflow: 'scroll',
            position: 'absolute',
            top: '-9999px'
        });
        document.body.appendChild(scrollDiv);

        // Get the scrollbar width
        const scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth;

        // Delete the DIV
        document.body.removeChild(scrollDiv);

        return scrollbarWidth;
    }

    $.hasVerticalOverflow = function (element) {
        return element.scrollHeight > element.offsetHeight + 10;
    };

    $.hasHorizontalOverflow = function (element) {
        return element.scrollWidth > element.offsetWidth + 10;
    };

    $.measureTextWidth = function (text) {
        const div = document.createElement('div');
        div.style.position = 'absolute';
        div.style.visibility = 'hidden';
        div.style.height = 'auto';
        div.style.width = 'auto';
        div.style.whiteSpace = 'nowrap';
        div.innerText = text;
        document.body.appendChild(div);
        return div.clientWidth + 1;
    };

    /**
     * Checks if `value` is the
     * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
     * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is an object, else `false`.
     * @example
     *
     * _.isObject({});
     * // => true
     *
     * _.isObject([1, 2, 3]);
     * // => true
     *
     * _.isObject(_.noop);
     * // => true
     *
     * _.isObject(null);
     * // => false
     */
    function isObject(value) {
      var type = typeof value;
      return value != null && (type == 'object' || type == 'function');
    }

    var isObject_1 = isObject;

    var isObject$1 = /*#__PURE__*/Object.freeze({
        default: isObject_1,
        __moduleExports: isObject_1
    });

    var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function commonjsRequire () {
    	throw new Error('Dynamic requires are not currently supported by rollup-plugin-commonjs');
    }

    function unwrapExports (x) {
    	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
    }

    function createCommonjsModule(fn, module) {
    	return module = { exports: {} }, fn(module, module.exports), module.exports;
    }

    /** Detect free variable `global` from Node.js. */
    var freeGlobal = typeof commonjsGlobal == 'object' && commonjsGlobal && commonjsGlobal.Object === Object && commonjsGlobal;

    var _freeGlobal = freeGlobal;

    var _freeGlobal$1 = /*#__PURE__*/Object.freeze({
        default: _freeGlobal,
        __moduleExports: _freeGlobal
    });

    var freeGlobal$1 = ( _freeGlobal$1 && _freeGlobal ) || _freeGlobal$1;

    /** Detect free variable `self`. */
    var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

    /** Used as a reference to the global object. */
    var root = freeGlobal$1 || freeSelf || Function('return this')();

    var _root = root;

    var _root$1 = /*#__PURE__*/Object.freeze({
        default: _root,
        __moduleExports: _root
    });

    var root$1 = ( _root$1 && _root ) || _root$1;

    /**
     * Gets the timestamp of the number of milliseconds that have elapsed since
     * the Unix epoch (1 January 1970 00:00:00 UTC).
     *
     * @static
     * @memberOf _
     * @since 2.4.0
     * @category Date
     * @returns {number} Returns the timestamp.
     * @example
     *
     * _.defer(function(stamp) {
     *   console.log(_.now() - stamp);
     * }, _.now());
     * // => Logs the number of milliseconds it took for the deferred invocation.
     */
    var now = function() {
      return root$1.Date.now();
    };

    var now_1 = now;

    var now$1 = /*#__PURE__*/Object.freeze({
        default: now_1,
        __moduleExports: now_1
    });

    /** Built-in value references. */
    var Symbol = root$1.Symbol;

    var _Symbol = Symbol;

    var _Symbol$1 = /*#__PURE__*/Object.freeze({
        default: _Symbol,
        __moduleExports: _Symbol
    });

    var Symbol$1 = ( _Symbol$1 && _Symbol ) || _Symbol$1;

    /** Used for built-in method references. */
    var objectProto = Object.prototype;

    /** Used to check objects for own properties. */
    var hasOwnProperty = objectProto.hasOwnProperty;

    /**
     * Used to resolve the
     * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
     * of values.
     */
    var nativeObjectToString = objectProto.toString;

    /** Built-in value references. */
    var symToStringTag = Symbol$1 ? Symbol$1.toStringTag : undefined;

    /**
     * A specialized version of `baseGetTag` which ignores `Symbol.toStringTag` values.
     *
     * @private
     * @param {*} value The value to query.
     * @returns {string} Returns the raw `toStringTag`.
     */
    function getRawTag(value) {
      var isOwn = hasOwnProperty.call(value, symToStringTag),
          tag = value[symToStringTag];

      try {
        value[symToStringTag] = undefined;
      } catch (e) {}

      var result = nativeObjectToString.call(value);
      {
        if (isOwn) {
          value[symToStringTag] = tag;
        } else {
          delete value[symToStringTag];
        }
      }
      return result;
    }

    var _getRawTag = getRawTag;

    var _getRawTag$1 = /*#__PURE__*/Object.freeze({
        default: _getRawTag,
        __moduleExports: _getRawTag
    });

    /** Used for built-in method references. */
    var objectProto$1 = Object.prototype;

    /**
     * Used to resolve the
     * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
     * of values.
     */
    var nativeObjectToString$1 = objectProto$1.toString;

    /**
     * Converts `value` to a string using `Object.prototype.toString`.
     *
     * @private
     * @param {*} value The value to convert.
     * @returns {string} Returns the converted string.
     */
    function objectToString(value) {
      return nativeObjectToString$1.call(value);
    }

    var _objectToString = objectToString;

    var _objectToString$1 = /*#__PURE__*/Object.freeze({
        default: _objectToString,
        __moduleExports: _objectToString
    });

    var getRawTag$1 = ( _getRawTag$1 && _getRawTag ) || _getRawTag$1;

    var objectToString$1 = ( _objectToString$1 && _objectToString ) || _objectToString$1;

    /** `Object#toString` result references. */
    var nullTag = '[object Null]',
        undefinedTag = '[object Undefined]';

    /** Built-in value references. */
    var symToStringTag$1 = Symbol$1 ? Symbol$1.toStringTag : undefined;

    /**
     * The base implementation of `getTag` without fallbacks for buggy environments.
     *
     * @private
     * @param {*} value The value to query.
     * @returns {string} Returns the `toStringTag`.
     */
    function baseGetTag(value) {
      if (value == null) {
        return value === undefined ? undefinedTag : nullTag;
      }
      return (symToStringTag$1 && symToStringTag$1 in Object(value))
        ? getRawTag$1(value)
        : objectToString$1(value);
    }

    var _baseGetTag = baseGetTag;

    var _baseGetTag$1 = /*#__PURE__*/Object.freeze({
        default: _baseGetTag,
        __moduleExports: _baseGetTag
    });

    /**
     * Checks if `value` is object-like. A value is object-like if it's not `null`
     * and has a `typeof` result of "object".
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
     * @example
     *
     * _.isObjectLike({});
     * // => true
     *
     * _.isObjectLike([1, 2, 3]);
     * // => true
     *
     * _.isObjectLike(_.noop);
     * // => false
     *
     * _.isObjectLike(null);
     * // => false
     */
    function isObjectLike(value) {
      return value != null && typeof value == 'object';
    }

    var isObjectLike_1 = isObjectLike;

    var isObjectLike$1 = /*#__PURE__*/Object.freeze({
        default: isObjectLike_1,
        __moduleExports: isObjectLike_1
    });

    var baseGetTag$1 = ( _baseGetTag$1 && _baseGetTag ) || _baseGetTag$1;

    var isObjectLike$2 = ( isObjectLike$1 && isObjectLike_1 ) || isObjectLike$1;

    /** `Object#toString` result references. */
    var symbolTag = '[object Symbol]';

    /**
     * Checks if `value` is classified as a `Symbol` primitive or object.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
     * @example
     *
     * _.isSymbol(Symbol.iterator);
     * // => true
     *
     * _.isSymbol('abc');
     * // => false
     */
    function isSymbol(value) {
      return typeof value == 'symbol' ||
        (isObjectLike$2(value) && baseGetTag$1(value) == symbolTag);
    }

    var isSymbol_1 = isSymbol;

    var isSymbol$1 = /*#__PURE__*/Object.freeze({
        default: isSymbol_1,
        __moduleExports: isSymbol_1
    });

    var isObject$2 = ( isObject$1 && isObject_1 ) || isObject$1;

    var isSymbol$2 = ( isSymbol$1 && isSymbol_1 ) || isSymbol$1;

    /** Used as references for various `Number` constants. */
    var NAN = 0 / 0;

    /** Used to match leading and trailing whitespace. */
    var reTrim = /^\s+|\s+$/g;

    /** Used to detect bad signed hexadecimal string values. */
    var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;

    /** Used to detect binary string values. */
    var reIsBinary = /^0b[01]+$/i;

    /** Used to detect octal string values. */
    var reIsOctal = /^0o[0-7]+$/i;

    /** Built-in method references without a dependency on `root`. */
    var freeParseInt = parseInt;

    /**
     * Converts `value` to a number.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to process.
     * @returns {number} Returns the number.
     * @example
     *
     * _.toNumber(3.2);
     * // => 3.2
     *
     * _.toNumber(Number.MIN_VALUE);
     * // => 5e-324
     *
     * _.toNumber(Infinity);
     * // => Infinity
     *
     * _.toNumber('3.2');
     * // => 3.2
     */
    function toNumber(value) {
      if (typeof value == 'number') {
        return value;
      }
      if (isSymbol$2(value)) {
        return NAN;
      }
      if (isObject$2(value)) {
        var other = typeof value.valueOf == 'function' ? value.valueOf() : value;
        value = isObject$2(other) ? (other + '') : other;
      }
      if (typeof value != 'string') {
        return value === 0 ? value : +value;
      }
      value = value.replace(reTrim, '');
      var isBinary = reIsBinary.test(value);
      return (isBinary || reIsOctal.test(value))
        ? freeParseInt(value.slice(2), isBinary ? 2 : 8)
        : (reIsBadHex.test(value) ? NAN : +value);
    }

    var toNumber_1 = toNumber;

    var toNumber$1 = /*#__PURE__*/Object.freeze({
        default: toNumber_1,
        __moduleExports: toNumber_1
    });

    var now$2 = ( now$1 && now_1 ) || now$1;

    var toNumber$2 = ( toNumber$1 && toNumber_1 ) || toNumber$1;

    /** Error message constants. */
    var FUNC_ERROR_TEXT = 'Expected a function';

    /* Built-in method references for those with the same name as other `lodash` methods. */
    var nativeMax = Math.max,
        nativeMin = Math.min;

    /**
     * Creates a debounced function that delays invoking `func` until after `wait`
     * milliseconds have elapsed since the last time the debounced function was
     * invoked. The debounced function comes with a `cancel` method to cancel
     * delayed `func` invocations and a `flush` method to immediately invoke them.
     * Provide `options` to indicate whether `func` should be invoked on the
     * leading and/or trailing edge of the `wait` timeout. The `func` is invoked
     * with the last arguments provided to the debounced function. Subsequent
     * calls to the debounced function return the result of the last `func`
     * invocation.
     *
     * **Note:** If `leading` and `trailing` options are `true`, `func` is
     * invoked on the trailing edge of the timeout only if the debounced function
     * is invoked more than once during the `wait` timeout.
     *
     * If `wait` is `0` and `leading` is `false`, `func` invocation is deferred
     * until to the next tick, similar to `setTimeout` with a timeout of `0`.
     *
     * See [David Corbacho's article](https://css-tricks.com/debouncing-throttling-explained-examples/)
     * for details over the differences between `_.debounce` and `_.throttle`.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Function
     * @param {Function} func The function to debounce.
     * @param {number} [wait=0] The number of milliseconds to delay.
     * @param {Object} [options={}] The options object.
     * @param {boolean} [options.leading=false]
     *  Specify invoking on the leading edge of the timeout.
     * @param {number} [options.maxWait]
     *  The maximum time `func` is allowed to be delayed before it's invoked.
     * @param {boolean} [options.trailing=true]
     *  Specify invoking on the trailing edge of the timeout.
     * @returns {Function} Returns the new debounced function.
     * @example
     *
     * // Avoid costly calculations while the window size is in flux.
     * jQuery(window).on('resize', _.debounce(calculateLayout, 150));
     *
     * // Invoke `sendMail` when clicked, debouncing subsequent calls.
     * jQuery(element).on('click', _.debounce(sendMail, 300, {
     *   'leading': true,
     *   'trailing': false
     * }));
     *
     * // Ensure `batchLog` is invoked once after 1 second of debounced calls.
     * var debounced = _.debounce(batchLog, 250, { 'maxWait': 1000 });
     * var source = new EventSource('/stream');
     * jQuery(source).on('message', debounced);
     *
     * // Cancel the trailing debounced invocation.
     * jQuery(window).on('popstate', debounced.cancel);
     */
    function debounce(func, wait, options) {
      var lastArgs,
          lastThis,
          maxWait,
          result,
          timerId,
          lastCallTime,
          lastInvokeTime = 0,
          leading = false,
          maxing = false,
          trailing = true;

      if (typeof func != 'function') {
        throw new TypeError(FUNC_ERROR_TEXT);
      }
      wait = toNumber$2(wait) || 0;
      if (isObject$2(options)) {
        leading = !!options.leading;
        maxing = 'maxWait' in options;
        maxWait = maxing ? nativeMax(toNumber$2(options.maxWait) || 0, wait) : maxWait;
        trailing = 'trailing' in options ? !!options.trailing : trailing;
      }

      function invokeFunc(time) {
        var args = lastArgs,
            thisArg = lastThis;

        lastArgs = lastThis = undefined;
        lastInvokeTime = time;
        result = func.apply(thisArg, args);
        return result;
      }

      function leadingEdge(time) {
        // Reset any `maxWait` timer.
        lastInvokeTime = time;
        // Start the timer for the trailing edge.
        timerId = setTimeout(timerExpired, wait);
        // Invoke the leading edge.
        return leading ? invokeFunc(time) : result;
      }

      function remainingWait(time) {
        var timeSinceLastCall = time - lastCallTime,
            timeSinceLastInvoke = time - lastInvokeTime,
            timeWaiting = wait - timeSinceLastCall;

        return maxing
          ? nativeMin(timeWaiting, maxWait - timeSinceLastInvoke)
          : timeWaiting;
      }

      function shouldInvoke(time) {
        var timeSinceLastCall = time - lastCallTime,
            timeSinceLastInvoke = time - lastInvokeTime;

        // Either this is the first call, activity has stopped and we're at the
        // trailing edge, the system time has gone backwards and we're treating
        // it as the trailing edge, or we've hit the `maxWait` limit.
        return (lastCallTime === undefined || (timeSinceLastCall >= wait) ||
          (timeSinceLastCall < 0) || (maxing && timeSinceLastInvoke >= maxWait));
      }

      function timerExpired() {
        var time = now$2();
        if (shouldInvoke(time)) {
          return trailingEdge(time);
        }
        // Restart the timer.
        timerId = setTimeout(timerExpired, remainingWait(time));
      }

      function trailingEdge(time) {
        timerId = undefined;

        // Only invoke if we have `lastArgs` which means `func` has been
        // debounced at least once.
        if (trailing && lastArgs) {
          return invokeFunc(time);
        }
        lastArgs = lastThis = undefined;
        return result;
      }

      function cancel() {
        if (timerId !== undefined) {
          clearTimeout(timerId);
        }
        lastInvokeTime = 0;
        lastArgs = lastCallTime = lastThis = timerId = undefined;
      }

      function flush() {
        return timerId === undefined ? result : trailingEdge(now$2());
      }

      function debounced() {
        var time = now$2(),
            isInvoking = shouldInvoke(time);

        lastArgs = arguments;
        lastThis = this;
        lastCallTime = time;

        if (isInvoking) {
          if (timerId === undefined) {
            return leadingEdge(lastCallTime);
          }
          if (maxing) {
            // Handle invocations in a tight loop.
            clearTimeout(timerId);
            timerId = setTimeout(timerExpired, wait);
            return invokeFunc(lastCallTime);
          }
        }
        if (timerId === undefined) {
          timerId = setTimeout(timerExpired, wait);
        }
        return result;
      }
      debounced.cancel = cancel;
      debounced.flush = flush;
      return debounced;
    }

    var debounce_1 = debounce;

    var debounce$1 = /*#__PURE__*/Object.freeze({
        default: debounce_1,
        __moduleExports: debounce_1
    });

    var debounce$2 = ( debounce$1 && debounce_1 ) || debounce$1;

    /** Error message constants. */
    var FUNC_ERROR_TEXT$1 = 'Expected a function';

    /**
     * Creates a throttled function that only invokes `func` at most once per
     * every `wait` milliseconds. The throttled function comes with a `cancel`
     * method to cancel delayed `func` invocations and a `flush` method to
     * immediately invoke them. Provide `options` to indicate whether `func`
     * should be invoked on the leading and/or trailing edge of the `wait`
     * timeout. The `func` is invoked with the last arguments provided to the
     * throttled function. Subsequent calls to the throttled function return the
     * result of the last `func` invocation.
     *
     * **Note:** If `leading` and `trailing` options are `true`, `func` is
     * invoked on the trailing edge of the timeout only if the throttled function
     * is invoked more than once during the `wait` timeout.
     *
     * If `wait` is `0` and `leading` is `false`, `func` invocation is deferred
     * until to the next tick, similar to `setTimeout` with a timeout of `0`.
     *
     * See [David Corbacho's article](https://css-tricks.com/debouncing-throttling-explained-examples/)
     * for details over the differences between `_.throttle` and `_.debounce`.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Function
     * @param {Function} func The function to throttle.
     * @param {number} [wait=0] The number of milliseconds to throttle invocations to.
     * @param {Object} [options={}] The options object.
     * @param {boolean} [options.leading=true]
     *  Specify invoking on the leading edge of the timeout.
     * @param {boolean} [options.trailing=true]
     *  Specify invoking on the trailing edge of the timeout.
     * @returns {Function} Returns the new throttled function.
     * @example
     *
     * // Avoid excessively updating the position while scrolling.
     * jQuery(window).on('scroll', _.throttle(updatePosition, 100));
     *
     * // Invoke `renewToken` when the click event is fired, but not more than once every 5 minutes.
     * var throttled = _.throttle(renewToken, 300000, { 'trailing': false });
     * jQuery(element).on('click', throttled);
     *
     * // Cancel the trailing throttled invocation.
     * jQuery(window).on('popstate', throttled.cancel);
     */
    function throttle(func, wait, options) {
      var leading = true,
          trailing = true;

      if (typeof func != 'function') {
        throw new TypeError(FUNC_ERROR_TEXT$1);
      }
      if (isObject$2(options)) {
        leading = 'leading' in options ? !!options.leading : leading;
        trailing = 'trailing' in options ? !!options.trailing : trailing;
      }
      return debounce$2(func, wait, {
        'leading': leading,
        'maxWait': wait,
        'trailing': trailing
      });
    }

    var throttle_1 = throttle;

    /** `Object#toString` result references. */
    var asyncTag = '[object AsyncFunction]',
        funcTag = '[object Function]',
        genTag = '[object GeneratorFunction]',
        proxyTag = '[object Proxy]';

    /**
     * Checks if `value` is classified as a `Function` object.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a function, else `false`.
     * @example
     *
     * _.isFunction(_);
     * // => true
     *
     * _.isFunction(/abc/);
     * // => false
     */
    function isFunction(value) {
      if (!isObject$2(value)) {
        return false;
      }
      // The use of `Object#toString` avoids issues with the `typeof` operator
      // in Safari 9 which returns 'object' for typed arrays and other constructors.
      var tag = baseGetTag$1(value);
      return tag == funcTag || tag == genTag || tag == asyncTag || tag == proxyTag;
    }

    var isFunction_1 = isFunction;

    var isFunction$1 = /*#__PURE__*/Object.freeze({
        default: isFunction_1,
        __moduleExports: isFunction_1
    });

    /** Used to detect overreaching core-js shims. */
    var coreJsData = root$1['__core-js_shared__'];

    var _coreJsData = coreJsData;

    var _coreJsData$1 = /*#__PURE__*/Object.freeze({
        default: _coreJsData,
        __moduleExports: _coreJsData
    });

    var coreJsData$1 = ( _coreJsData$1 && _coreJsData ) || _coreJsData$1;

    /** Used to detect methods masquerading as native. */
    var maskSrcKey = (function() {
      var uid = /[^.]+$/.exec(coreJsData$1 && coreJsData$1.keys && coreJsData$1.keys.IE_PROTO || '');
      return uid ? ('Symbol(src)_1.' + uid) : '';
    }());

    /**
     * Checks if `func` has its source masked.
     *
     * @private
     * @param {Function} func The function to check.
     * @returns {boolean} Returns `true` if `func` is masked, else `false`.
     */
    function isMasked(func) {
      return !!maskSrcKey && (maskSrcKey in func);
    }

    var _isMasked = isMasked;

    var _isMasked$1 = /*#__PURE__*/Object.freeze({
        default: _isMasked,
        __moduleExports: _isMasked
    });

    /** Used for built-in method references. */
    var funcProto = Function.prototype;

    /** Used to resolve the decompiled source of functions. */
    var funcToString = funcProto.toString;

    /**
     * Converts `func` to its source code.
     *
     * @private
     * @param {Function} func The function to convert.
     * @returns {string} Returns the source code.
     */
    function toSource(func) {
      if (func != null) {
        try {
          return funcToString.call(func);
        } catch (e) {}
        try {
          return (func + '');
        } catch (e) {}
      }
      return '';
    }

    var _toSource = toSource;

    var _toSource$1 = /*#__PURE__*/Object.freeze({
        default: _toSource,
        __moduleExports: _toSource
    });

    var isFunction$2 = ( isFunction$1 && isFunction_1 ) || isFunction$1;

    var isMasked$1 = ( _isMasked$1 && _isMasked ) || _isMasked$1;

    var toSource$1 = ( _toSource$1 && _toSource ) || _toSource$1;

    /**
     * Used to match `RegExp`
     * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
     */
    var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;

    /** Used to detect host constructors (Safari). */
    var reIsHostCtor = /^\[object .+?Constructor\]$/;

    /** Used for built-in method references. */
    var funcProto$1 = Function.prototype,
        objectProto$2 = Object.prototype;

    /** Used to resolve the decompiled source of functions. */
    var funcToString$1 = funcProto$1.toString;

    /** Used to check objects for own properties. */
    var hasOwnProperty$1 = objectProto$2.hasOwnProperty;

    /** Used to detect if a method is native. */
    var reIsNative = RegExp('^' +
      funcToString$1.call(hasOwnProperty$1).replace(reRegExpChar, '\\$&')
      .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
    );

    /**
     * The base implementation of `_.isNative` without bad shim checks.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a native function,
     *  else `false`.
     */
    function baseIsNative(value) {
      if (!isObject$2(value) || isMasked$1(value)) {
        return false;
      }
      var pattern = isFunction$2(value) ? reIsNative : reIsHostCtor;
      return pattern.test(toSource$1(value));
    }

    var _baseIsNative = baseIsNative;

    var _baseIsNative$1 = /*#__PURE__*/Object.freeze({
        default: _baseIsNative,
        __moduleExports: _baseIsNative
    });

    /**
     * Gets the value at `key` of `object`.
     *
     * @private
     * @param {Object} [object] The object to query.
     * @param {string} key The key of the property to get.
     * @returns {*} Returns the property value.
     */
    function getValue(object, key) {
      return object == null ? undefined : object[key];
    }

    var _getValue = getValue;

    var _getValue$1 = /*#__PURE__*/Object.freeze({
        default: _getValue,
        __moduleExports: _getValue
    });

    var baseIsNative$1 = ( _baseIsNative$1 && _baseIsNative ) || _baseIsNative$1;

    var getValue$1 = ( _getValue$1 && _getValue ) || _getValue$1;

    /**
     * Gets the native function at `key` of `object`.
     *
     * @private
     * @param {Object} object The object to query.
     * @param {string} key The key of the method to get.
     * @returns {*} Returns the function if it's native, else `undefined`.
     */
    function getNative(object, key) {
      var value = getValue$1(object, key);
      return baseIsNative$1(value) ? value : undefined;
    }

    var _getNative = getNative;

    var _getNative$1 = /*#__PURE__*/Object.freeze({
        default: _getNative,
        __moduleExports: _getNative
    });

    var getNative$1 = ( _getNative$1 && _getNative ) || _getNative$1;

    /* Built-in method references that are verified to be native. */
    var nativeCreate = getNative$1(Object, 'create');

    var _nativeCreate = nativeCreate;

    var _nativeCreate$1 = /*#__PURE__*/Object.freeze({
        default: _nativeCreate,
        __moduleExports: _nativeCreate
    });

    var nativeCreate$1 = ( _nativeCreate$1 && _nativeCreate ) || _nativeCreate$1;

    /**
     * Removes all key-value entries from the hash.
     *
     * @private
     * @name clear
     * @memberOf Hash
     */
    function hashClear() {
      this.__data__ = nativeCreate$1 ? nativeCreate$1(null) : {};
      this.size = 0;
    }

    var _hashClear = hashClear;

    var _hashClear$1 = /*#__PURE__*/Object.freeze({
        default: _hashClear,
        __moduleExports: _hashClear
    });

    /**
     * Removes `key` and its value from the hash.
     *
     * @private
     * @name delete
     * @memberOf Hash
     * @param {Object} hash The hash to modify.
     * @param {string} key The key of the value to remove.
     * @returns {boolean} Returns `true` if the entry was removed, else `false`.
     */
    function hashDelete(key) {
      var result = this.has(key) && delete this.__data__[key];
      this.size -= result ? 1 : 0;
      return result;
    }

    var _hashDelete = hashDelete;

    var _hashDelete$1 = /*#__PURE__*/Object.freeze({
        default: _hashDelete,
        __moduleExports: _hashDelete
    });

    /** Used to stand-in for `undefined` hash values. */
    var HASH_UNDEFINED = '__lodash_hash_undefined__';

    /** Used for built-in method references. */
    var objectProto$3 = Object.prototype;

    /** Used to check objects for own properties. */
    var hasOwnProperty$2 = objectProto$3.hasOwnProperty;

    /**
     * Gets the hash value for `key`.
     *
     * @private
     * @name get
     * @memberOf Hash
     * @param {string} key The key of the value to get.
     * @returns {*} Returns the entry value.
     */
    function hashGet(key) {
      var data = this.__data__;
      if (nativeCreate$1) {
        var result = data[key];
        return result === HASH_UNDEFINED ? undefined : result;
      }
      return hasOwnProperty$2.call(data, key) ? data[key] : undefined;
    }

    var _hashGet = hashGet;

    var _hashGet$1 = /*#__PURE__*/Object.freeze({
        default: _hashGet,
        __moduleExports: _hashGet
    });

    /** Used for built-in method references. */
    var objectProto$4 = Object.prototype;

    /** Used to check objects for own properties. */
    var hasOwnProperty$3 = objectProto$4.hasOwnProperty;

    /**
     * Checks if a hash value for `key` exists.
     *
     * @private
     * @name has
     * @memberOf Hash
     * @param {string} key The key of the entry to check.
     * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
     */
    function hashHas(key) {
      var data = this.__data__;
      return nativeCreate$1 ? (data[key] !== undefined) : hasOwnProperty$3.call(data, key);
    }

    var _hashHas = hashHas;

    var _hashHas$1 = /*#__PURE__*/Object.freeze({
        default: _hashHas,
        __moduleExports: _hashHas
    });

    /** Used to stand-in for `undefined` hash values. */
    var HASH_UNDEFINED$1 = '__lodash_hash_undefined__';

    /**
     * Sets the hash `key` to `value`.
     *
     * @private
     * @name set
     * @memberOf Hash
     * @param {string} key The key of the value to set.
     * @param {*} value The value to set.
     * @returns {Object} Returns the hash instance.
     */
    function hashSet(key, value) {
      var data = this.__data__;
      this.size += this.has(key) ? 0 : 1;
      data[key] = (nativeCreate$1 && value === undefined) ? HASH_UNDEFINED$1 : value;
      return this;
    }

    var _hashSet = hashSet;

    var _hashSet$1 = /*#__PURE__*/Object.freeze({
        default: _hashSet,
        __moduleExports: _hashSet
    });

    var hashClear$1 = ( _hashClear$1 && _hashClear ) || _hashClear$1;

    var hashDelete$1 = ( _hashDelete$1 && _hashDelete ) || _hashDelete$1;

    var hashGet$1 = ( _hashGet$1 && _hashGet ) || _hashGet$1;

    var hashHas$1 = ( _hashHas$1 && _hashHas ) || _hashHas$1;

    var hashSet$1 = ( _hashSet$1 && _hashSet ) || _hashSet$1;

    /**
     * Creates a hash object.
     *
     * @private
     * @constructor
     * @param {Array} [entries] The key-value pairs to cache.
     */
    function Hash(entries) {
      var index = -1,
          length = entries == null ? 0 : entries.length;

      this.clear();
      while (++index < length) {
        var entry = entries[index];
        this.set(entry[0], entry[1]);
      }
    }

    // Add methods to `Hash`.
    Hash.prototype.clear = hashClear$1;
    Hash.prototype['delete'] = hashDelete$1;
    Hash.prototype.get = hashGet$1;
    Hash.prototype.has = hashHas$1;
    Hash.prototype.set = hashSet$1;

    var _Hash = Hash;

    var _Hash$1 = /*#__PURE__*/Object.freeze({
        default: _Hash,
        __moduleExports: _Hash
    });

    /**
     * Removes all key-value entries from the list cache.
     *
     * @private
     * @name clear
     * @memberOf ListCache
     */
    function listCacheClear() {
      this.__data__ = [];
      this.size = 0;
    }

    var _listCacheClear = listCacheClear;

    var _listCacheClear$1 = /*#__PURE__*/Object.freeze({
        default: _listCacheClear,
        __moduleExports: _listCacheClear
    });

    /**
     * Performs a
     * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
     * comparison between two values to determine if they are equivalent.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to compare.
     * @param {*} other The other value to compare.
     * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
     * @example
     *
     * var object = { 'a': 1 };
     * var other = { 'a': 1 };
     *
     * _.eq(object, object);
     * // => true
     *
     * _.eq(object, other);
     * // => false
     *
     * _.eq('a', 'a');
     * // => true
     *
     * _.eq('a', Object('a'));
     * // => false
     *
     * _.eq(NaN, NaN);
     * // => true
     */
    function eq(value, other) {
      return value === other || (value !== value && other !== other);
    }

    var eq_1 = eq;

    var eq$1 = /*#__PURE__*/Object.freeze({
        default: eq_1,
        __moduleExports: eq_1
    });

    var eq$2 = ( eq$1 && eq_1 ) || eq$1;

    /**
     * Gets the index at which the `key` is found in `array` of key-value pairs.
     *
     * @private
     * @param {Array} array The array to inspect.
     * @param {*} key The key to search for.
     * @returns {number} Returns the index of the matched value, else `-1`.
     */
    function assocIndexOf(array, key) {
      var length = array.length;
      while (length--) {
        if (eq$2(array[length][0], key)) {
          return length;
        }
      }
      return -1;
    }

    var _assocIndexOf = assocIndexOf;

    var _assocIndexOf$1 = /*#__PURE__*/Object.freeze({
        default: _assocIndexOf,
        __moduleExports: _assocIndexOf
    });

    var assocIndexOf$1 = ( _assocIndexOf$1 && _assocIndexOf ) || _assocIndexOf$1;

    /** Used for built-in method references. */
    var arrayProto = Array.prototype;

    /** Built-in value references. */
    var splice = arrayProto.splice;

    /**
     * Removes `key` and its value from the list cache.
     *
     * @private
     * @name delete
     * @memberOf ListCache
     * @param {string} key The key of the value to remove.
     * @returns {boolean} Returns `true` if the entry was removed, else `false`.
     */
    function listCacheDelete(key) {
      var data = this.__data__,
          index = assocIndexOf$1(data, key);

      if (index < 0) {
        return false;
      }
      var lastIndex = data.length - 1;
      if (index == lastIndex) {
        data.pop();
      } else {
        splice.call(data, index, 1);
      }
      --this.size;
      return true;
    }

    var _listCacheDelete = listCacheDelete;

    var _listCacheDelete$1 = /*#__PURE__*/Object.freeze({
        default: _listCacheDelete,
        __moduleExports: _listCacheDelete
    });

    /**
     * Gets the list cache value for `key`.
     *
     * @private
     * @name get
     * @memberOf ListCache
     * @param {string} key The key of the value to get.
     * @returns {*} Returns the entry value.
     */
    function listCacheGet(key) {
      var data = this.__data__,
          index = assocIndexOf$1(data, key);

      return index < 0 ? undefined : data[index][1];
    }

    var _listCacheGet = listCacheGet;

    var _listCacheGet$1 = /*#__PURE__*/Object.freeze({
        default: _listCacheGet,
        __moduleExports: _listCacheGet
    });

    /**
     * Checks if a list cache value for `key` exists.
     *
     * @private
     * @name has
     * @memberOf ListCache
     * @param {string} key The key of the entry to check.
     * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
     */
    function listCacheHas(key) {
      return assocIndexOf$1(this.__data__, key) > -1;
    }

    var _listCacheHas = listCacheHas;

    var _listCacheHas$1 = /*#__PURE__*/Object.freeze({
        default: _listCacheHas,
        __moduleExports: _listCacheHas
    });

    /**
     * Sets the list cache `key` to `value`.
     *
     * @private
     * @name set
     * @memberOf ListCache
     * @param {string} key The key of the value to set.
     * @param {*} value The value to set.
     * @returns {Object} Returns the list cache instance.
     */
    function listCacheSet(key, value) {
      var data = this.__data__,
          index = assocIndexOf$1(data, key);

      if (index < 0) {
        ++this.size;
        data.push([key, value]);
      } else {
        data[index][1] = value;
      }
      return this;
    }

    var _listCacheSet = listCacheSet;

    var _listCacheSet$1 = /*#__PURE__*/Object.freeze({
        default: _listCacheSet,
        __moduleExports: _listCacheSet
    });

    var listCacheClear$1 = ( _listCacheClear$1 && _listCacheClear ) || _listCacheClear$1;

    var listCacheDelete$1 = ( _listCacheDelete$1 && _listCacheDelete ) || _listCacheDelete$1;

    var listCacheGet$1 = ( _listCacheGet$1 && _listCacheGet ) || _listCacheGet$1;

    var listCacheHas$1 = ( _listCacheHas$1 && _listCacheHas ) || _listCacheHas$1;

    var listCacheSet$1 = ( _listCacheSet$1 && _listCacheSet ) || _listCacheSet$1;

    /**
     * Creates an list cache object.
     *
     * @private
     * @constructor
     * @param {Array} [entries] The key-value pairs to cache.
     */
    function ListCache(entries) {
      var index = -1,
          length = entries == null ? 0 : entries.length;

      this.clear();
      while (++index < length) {
        var entry = entries[index];
        this.set(entry[0], entry[1]);
      }
    }

    // Add methods to `ListCache`.
    ListCache.prototype.clear = listCacheClear$1;
    ListCache.prototype['delete'] = listCacheDelete$1;
    ListCache.prototype.get = listCacheGet$1;
    ListCache.prototype.has = listCacheHas$1;
    ListCache.prototype.set = listCacheSet$1;

    var _ListCache = ListCache;

    var _ListCache$1 = /*#__PURE__*/Object.freeze({
        default: _ListCache,
        __moduleExports: _ListCache
    });

    /* Built-in method references that are verified to be native. */
    var Map = getNative$1(root$1, 'Map');

    var _Map = Map;

    var _Map$1 = /*#__PURE__*/Object.freeze({
        default: _Map,
        __moduleExports: _Map
    });

    var Hash$1 = ( _Hash$1 && _Hash ) || _Hash$1;

    var ListCache$1 = ( _ListCache$1 && _ListCache ) || _ListCache$1;

    var Map$1 = ( _Map$1 && _Map ) || _Map$1;

    /**
     * Removes all key-value entries from the map.
     *
     * @private
     * @name clear
     * @memberOf MapCache
     */
    function mapCacheClear() {
      this.size = 0;
      this.__data__ = {
        'hash': new Hash$1,
        'map': new (Map$1 || ListCache$1),
        'string': new Hash$1
      };
    }

    var _mapCacheClear = mapCacheClear;

    var _mapCacheClear$1 = /*#__PURE__*/Object.freeze({
        default: _mapCacheClear,
        __moduleExports: _mapCacheClear
    });

    /**
     * Checks if `value` is suitable for use as unique object key.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is suitable, else `false`.
     */
    function isKeyable(value) {
      var type = typeof value;
      return (type == 'string' || type == 'number' || type == 'symbol' || type == 'boolean')
        ? (value !== '__proto__')
        : (value === null);
    }

    var _isKeyable = isKeyable;

    var _isKeyable$1 = /*#__PURE__*/Object.freeze({
        default: _isKeyable,
        __moduleExports: _isKeyable
    });

    var isKeyable$1 = ( _isKeyable$1 && _isKeyable ) || _isKeyable$1;

    /**
     * Gets the data for `map`.
     *
     * @private
     * @param {Object} map The map to query.
     * @param {string} key The reference key.
     * @returns {*} Returns the map data.
     */
    function getMapData(map, key) {
      var data = map.__data__;
      return isKeyable$1(key)
        ? data[typeof key == 'string' ? 'string' : 'hash']
        : data.map;
    }

    var _getMapData = getMapData;

    var _getMapData$1 = /*#__PURE__*/Object.freeze({
        default: _getMapData,
        __moduleExports: _getMapData
    });

    var getMapData$1 = ( _getMapData$1 && _getMapData ) || _getMapData$1;

    /**
     * Removes `key` and its value from the map.
     *
     * @private
     * @name delete
     * @memberOf MapCache
     * @param {string} key The key of the value to remove.
     * @returns {boolean} Returns `true` if the entry was removed, else `false`.
     */
    function mapCacheDelete(key) {
      var result = getMapData$1(this, key)['delete'](key);
      this.size -= result ? 1 : 0;
      return result;
    }

    var _mapCacheDelete = mapCacheDelete;

    var _mapCacheDelete$1 = /*#__PURE__*/Object.freeze({
        default: _mapCacheDelete,
        __moduleExports: _mapCacheDelete
    });

    /**
     * Gets the map value for `key`.
     *
     * @private
     * @name get
     * @memberOf MapCache
     * @param {string} key The key of the value to get.
     * @returns {*} Returns the entry value.
     */
    function mapCacheGet(key) {
      return getMapData$1(this, key).get(key);
    }

    var _mapCacheGet = mapCacheGet;

    var _mapCacheGet$1 = /*#__PURE__*/Object.freeze({
        default: _mapCacheGet,
        __moduleExports: _mapCacheGet
    });

    /**
     * Checks if a map value for `key` exists.
     *
     * @private
     * @name has
     * @memberOf MapCache
     * @param {string} key The key of the entry to check.
     * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
     */
    function mapCacheHas(key) {
      return getMapData$1(this, key).has(key);
    }

    var _mapCacheHas = mapCacheHas;

    var _mapCacheHas$1 = /*#__PURE__*/Object.freeze({
        default: _mapCacheHas,
        __moduleExports: _mapCacheHas
    });

    /**
     * Sets the map `key` to `value`.
     *
     * @private
     * @name set
     * @memberOf MapCache
     * @param {string} key The key of the value to set.
     * @param {*} value The value to set.
     * @returns {Object} Returns the map cache instance.
     */
    function mapCacheSet(key, value) {
      var data = getMapData$1(this, key),
          size = data.size;

      data.set(key, value);
      this.size += data.size == size ? 0 : 1;
      return this;
    }

    var _mapCacheSet = mapCacheSet;

    var _mapCacheSet$1 = /*#__PURE__*/Object.freeze({
        default: _mapCacheSet,
        __moduleExports: _mapCacheSet
    });

    var mapCacheClear$1 = ( _mapCacheClear$1 && _mapCacheClear ) || _mapCacheClear$1;

    var mapCacheDelete$1 = ( _mapCacheDelete$1 && _mapCacheDelete ) || _mapCacheDelete$1;

    var mapCacheGet$1 = ( _mapCacheGet$1 && _mapCacheGet ) || _mapCacheGet$1;

    var mapCacheHas$1 = ( _mapCacheHas$1 && _mapCacheHas ) || _mapCacheHas$1;

    var mapCacheSet$1 = ( _mapCacheSet$1 && _mapCacheSet ) || _mapCacheSet$1;

    /**
     * Creates a map cache object to store key-value pairs.
     *
     * @private
     * @constructor
     * @param {Array} [entries] The key-value pairs to cache.
     */
    function MapCache(entries) {
      var index = -1,
          length = entries == null ? 0 : entries.length;

      this.clear();
      while (++index < length) {
        var entry = entries[index];
        this.set(entry[0], entry[1]);
      }
    }

    // Add methods to `MapCache`.
    MapCache.prototype.clear = mapCacheClear$1;
    MapCache.prototype['delete'] = mapCacheDelete$1;
    MapCache.prototype.get = mapCacheGet$1;
    MapCache.prototype.has = mapCacheHas$1;
    MapCache.prototype.set = mapCacheSet$1;

    var _MapCache = MapCache;

    var _MapCache$1 = /*#__PURE__*/Object.freeze({
        default: _MapCache,
        __moduleExports: _MapCache
    });

    /** Used to stand-in for `undefined` hash values. */
    var HASH_UNDEFINED$2 = '__lodash_hash_undefined__';

    /**
     * Adds `value` to the array cache.
     *
     * @private
     * @name add
     * @memberOf SetCache
     * @alias push
     * @param {*} value The value to cache.
     * @returns {Object} Returns the cache instance.
     */
    function setCacheAdd(value) {
      this.__data__.set(value, HASH_UNDEFINED$2);
      return this;
    }

    var _setCacheAdd = setCacheAdd;

    var _setCacheAdd$1 = /*#__PURE__*/Object.freeze({
        default: _setCacheAdd,
        __moduleExports: _setCacheAdd
    });

    /**
     * Checks if `value` is in the array cache.
     *
     * @private
     * @name has
     * @memberOf SetCache
     * @param {*} value The value to search for.
     * @returns {number} Returns `true` if `value` is found, else `false`.
     */
    function setCacheHas(value) {
      return this.__data__.has(value);
    }

    var _setCacheHas = setCacheHas;

    var _setCacheHas$1 = /*#__PURE__*/Object.freeze({
        default: _setCacheHas,
        __moduleExports: _setCacheHas
    });

    var MapCache$1 = ( _MapCache$1 && _MapCache ) || _MapCache$1;

    var setCacheAdd$1 = ( _setCacheAdd$1 && _setCacheAdd ) || _setCacheAdd$1;

    var setCacheHas$1 = ( _setCacheHas$1 && _setCacheHas ) || _setCacheHas$1;

    /**
     *
     * Creates an array cache object to store unique values.
     *
     * @private
     * @constructor
     * @param {Array} [values] The values to cache.
     */
    function SetCache(values) {
      var index = -1,
          length = values == null ? 0 : values.length;

      this.__data__ = new MapCache$1;
      while (++index < length) {
        this.add(values[index]);
      }
    }

    // Add methods to `SetCache`.
    SetCache.prototype.add = SetCache.prototype.push = setCacheAdd$1;
    SetCache.prototype.has = setCacheHas$1;

    var _SetCache = SetCache;

    var _SetCache$1 = /*#__PURE__*/Object.freeze({
        default: _SetCache,
        __moduleExports: _SetCache
    });

    /**
     * The base implementation of `_.findIndex` and `_.findLastIndex` without
     * support for iteratee shorthands.
     *
     * @private
     * @param {Array} array The array to inspect.
     * @param {Function} predicate The function invoked per iteration.
     * @param {number} fromIndex The index to search from.
     * @param {boolean} [fromRight] Specify iterating from right to left.
     * @returns {number} Returns the index of the matched value, else `-1`.
     */
    function baseFindIndex(array, predicate, fromIndex, fromRight) {
      var length = array.length,
          index = fromIndex + (fromRight ? 1 : -1);

      while ((fromRight ? index-- : ++index < length)) {
        if (predicate(array[index], index, array)) {
          return index;
        }
      }
      return -1;
    }

    var _baseFindIndex = baseFindIndex;

    var _baseFindIndex$1 = /*#__PURE__*/Object.freeze({
        default: _baseFindIndex,
        __moduleExports: _baseFindIndex
    });

    /**
     * The base implementation of `_.isNaN` without support for number objects.
     *
     * @private
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is `NaN`, else `false`.
     */
    function baseIsNaN(value) {
      return value !== value;
    }

    var _baseIsNaN = baseIsNaN;

    var _baseIsNaN$1 = /*#__PURE__*/Object.freeze({
        default: _baseIsNaN,
        __moduleExports: _baseIsNaN
    });

    /**
     * A specialized version of `_.indexOf` which performs strict equality
     * comparisons of values, i.e. `===`.
     *
     * @private
     * @param {Array} array The array to inspect.
     * @param {*} value The value to search for.
     * @param {number} fromIndex The index to search from.
     * @returns {number} Returns the index of the matched value, else `-1`.
     */
    function strictIndexOf(array, value, fromIndex) {
      var index = fromIndex - 1,
          length = array.length;

      while (++index < length) {
        if (array[index] === value) {
          return index;
        }
      }
      return -1;
    }

    var _strictIndexOf = strictIndexOf;

    var _strictIndexOf$1 = /*#__PURE__*/Object.freeze({
        default: _strictIndexOf,
        __moduleExports: _strictIndexOf
    });

    var baseFindIndex$1 = ( _baseFindIndex$1 && _baseFindIndex ) || _baseFindIndex$1;

    var baseIsNaN$1 = ( _baseIsNaN$1 && _baseIsNaN ) || _baseIsNaN$1;

    var strictIndexOf$1 = ( _strictIndexOf$1 && _strictIndexOf ) || _strictIndexOf$1;

    /**
     * The base implementation of `_.indexOf` without `fromIndex` bounds checks.
     *
     * @private
     * @param {Array} array The array to inspect.
     * @param {*} value The value to search for.
     * @param {number} fromIndex The index to search from.
     * @returns {number} Returns the index of the matched value, else `-1`.
     */
    function baseIndexOf(array, value, fromIndex) {
      return value === value
        ? strictIndexOf$1(array, value, fromIndex)
        : baseFindIndex$1(array, baseIsNaN$1, fromIndex);
    }

    var _baseIndexOf = baseIndexOf;

    var _baseIndexOf$1 = /*#__PURE__*/Object.freeze({
        default: _baseIndexOf,
        __moduleExports: _baseIndexOf
    });

    var baseIndexOf$1 = ( _baseIndexOf$1 && _baseIndexOf ) || _baseIndexOf$1;

    /**
     * A specialized version of `_.includes` for arrays without support for
     * specifying an index to search from.
     *
     * @private
     * @param {Array} [array] The array to inspect.
     * @param {*} target The value to search for.
     * @returns {boolean} Returns `true` if `target` is found, else `false`.
     */
    function arrayIncludes(array, value) {
      var length = array == null ? 0 : array.length;
      return !!length && baseIndexOf$1(array, value, 0) > -1;
    }

    var _arrayIncludes = arrayIncludes;

    var _arrayIncludes$1 = /*#__PURE__*/Object.freeze({
        default: _arrayIncludes,
        __moduleExports: _arrayIncludes
    });

    /**
     * This function is like `arrayIncludes` except that it accepts a comparator.
     *
     * @private
     * @param {Array} [array] The array to inspect.
     * @param {*} target The value to search for.
     * @param {Function} comparator The comparator invoked per element.
     * @returns {boolean} Returns `true` if `target` is found, else `false`.
     */
    function arrayIncludesWith(array, value, comparator) {
      var index = -1,
          length = array == null ? 0 : array.length;

      while (++index < length) {
        if (comparator(value, array[index])) {
          return true;
        }
      }
      return false;
    }

    var _arrayIncludesWith = arrayIncludesWith;

    var _arrayIncludesWith$1 = /*#__PURE__*/Object.freeze({
        default: _arrayIncludesWith,
        __moduleExports: _arrayIncludesWith
    });

    /**
     * Checks if a `cache` value for `key` exists.
     *
     * @private
     * @param {Object} cache The cache to query.
     * @param {string} key The key of the entry to check.
     * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
     */
    function cacheHas(cache, key) {
      return cache.has(key);
    }

    var _cacheHas = cacheHas;

    var _cacheHas$1 = /*#__PURE__*/Object.freeze({
        default: _cacheHas,
        __moduleExports: _cacheHas
    });

    /* Built-in method references that are verified to be native. */
    var Set = getNative$1(root$1, 'Set');

    var _Set = Set;

    var _Set$1 = /*#__PURE__*/Object.freeze({
        default: _Set,
        __moduleExports: _Set
    });

    /**
     * This method returns `undefined`.
     *
     * @static
     * @memberOf _
     * @since 2.3.0
     * @category Util
     * @example
     *
     * _.times(2, _.noop);
     * // => [undefined, undefined]
     */
    function noop() {
      // No operation performed.
    }

    var noop_1 = noop;

    var noop$1 = /*#__PURE__*/Object.freeze({
        default: noop_1,
        __moduleExports: noop_1
    });

    /**
     * Converts `set` to an array of its values.
     *
     * @private
     * @param {Object} set The set to convert.
     * @returns {Array} Returns the values.
     */
    function setToArray(set) {
      var index = -1,
          result = Array(set.size);

      set.forEach(function(value) {
        result[++index] = value;
      });
      return result;
    }

    var _setToArray = setToArray;

    var _setToArray$1 = /*#__PURE__*/Object.freeze({
        default: _setToArray,
        __moduleExports: _setToArray
    });

    var Set$1 = ( _Set$1 && _Set ) || _Set$1;

    var noop$2 = ( noop$1 && noop_1 ) || noop$1;

    var setToArray$1 = ( _setToArray$1 && _setToArray ) || _setToArray$1;

    /** Used as references for various `Number` constants. */
    var INFINITY = 1 / 0;

    /**
     * Creates a set object of `values`.
     *
     * @private
     * @param {Array} values The values to add to the set.
     * @returns {Object} Returns the new set.
     */
    var createSet = !(Set$1 && (1 / setToArray$1(new Set$1([,-0]))[1]) == INFINITY) ? noop$2 : function(values) {
      return new Set$1(values);
    };

    var _createSet = createSet;

    var _createSet$1 = /*#__PURE__*/Object.freeze({
        default: _createSet,
        __moduleExports: _createSet
    });

    var SetCache$1 = ( _SetCache$1 && _SetCache ) || _SetCache$1;

    var arrayIncludes$1 = ( _arrayIncludes$1 && _arrayIncludes ) || _arrayIncludes$1;

    var arrayIncludesWith$1 = ( _arrayIncludesWith$1 && _arrayIncludesWith ) || _arrayIncludesWith$1;

    var cacheHas$1 = ( _cacheHas$1 && _cacheHas ) || _cacheHas$1;

    var createSet$1 = ( _createSet$1 && _createSet ) || _createSet$1;

    /** Used as the size to enable large array optimizations. */
    var LARGE_ARRAY_SIZE = 200;

    /**
     * The base implementation of `_.uniqBy` without support for iteratee shorthands.
     *
     * @private
     * @param {Array} array The array to inspect.
     * @param {Function} [iteratee] The iteratee invoked per element.
     * @param {Function} [comparator] The comparator invoked per element.
     * @returns {Array} Returns the new duplicate free array.
     */
    function baseUniq(array, iteratee, comparator) {
      var index = -1,
          includes = arrayIncludes$1,
          length = array.length,
          isCommon = true,
          result = [],
          seen = result;

      if (comparator) {
        isCommon = false;
        includes = arrayIncludesWith$1;
      }
      else if (length >= LARGE_ARRAY_SIZE) {
        var set = iteratee ? null : createSet$1(array);
        if (set) {
          return setToArray$1(set);
        }
        isCommon = false;
        includes = cacheHas$1;
        seen = new SetCache$1;
      }
      else {
        seen = iteratee ? [] : result;
      }
      outer:
      while (++index < length) {
        var value = array[index],
            computed = iteratee ? iteratee(value) : value;

        value = (comparator || value !== 0) ? value : 0;
        if (isCommon && computed === computed) {
          var seenIndex = seen.length;
          while (seenIndex--) {
            if (seen[seenIndex] === computed) {
              continue outer;
            }
          }
          if (iteratee) {
            seen.push(computed);
          }
          result.push(value);
        }
        else if (!includes(seen, computed, comparator)) {
          if (seen !== result) {
            seen.push(computed);
          }
          result.push(value);
        }
      }
      return result;
    }

    var _baseUniq = baseUniq;

    var _baseUniq$1 = /*#__PURE__*/Object.freeze({
        default: _baseUniq,
        __moduleExports: _baseUniq
    });

    var baseUniq$1 = ( _baseUniq$1 && _baseUniq ) || _baseUniq$1;

    /**
     * Creates a duplicate-free version of an array, using
     * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
     * for equality comparisons, in which only the first occurrence of each element
     * is kept. The order of result values is determined by the order they occur
     * in the array.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Array
     * @param {Array} array The array to inspect.
     * @returns {Array} Returns the new duplicate free array.
     * @example
     *
     * _.uniq([2, 1, 2]);
     * // => [2, 1]
     */
    function uniq(array) {
      return (array && array.length) ? baseUniq$1(array) : [];
    }

    var uniq_1 = uniq;

    function camelCaseToDash(str) {
        return str.replace(/([A-Z])/g, (g) => `-${g[0].toLowerCase()}`);
    }

    function makeDataAttributeString(props) {
        const keys = Object.keys(props);

        return keys
            .map((key) => {
                const _key = camelCaseToDash(key);
                const val = props[key];

                if (val === undefined) return '';
                return `data-${_key}="${val}" `;
            })
            .join('')
            .trim();
    }

    function copyTextToClipboard(text) {
        // https://stackoverflow.com/a/30810322/5353542
        var textArea = document.createElement('textarea');

        //
        // *** This styling is an extra step which is likely not required. ***
        //
        // Why is it here? To ensure:
        // 1. the element is able to have focus and selection.
        // 2. if element was to flash render it has minimal visual impact.
        // 3. less flakyness with selection and copying which **might** occur if
        //    the textarea element is not visible.
        //
        // The likelihood is the element won't even render, not even a flash,
        // so some of these are just precautions. However in IE the element
        // is visible whilst the popup box asking the user for permission for
        // the web page to copy to the clipboard.
        //

        // Place in top-left corner of screen regardless of scroll position.
        textArea.style.position = 'fixed';
        textArea.style.top = 0;
        textArea.style.left = 0;

        // Ensure it has a small width and height. Setting to 1px / 1em
        // doesn't work as this gives a negative w/h on some browsers.
        textArea.style.width = '2em';
        textArea.style.height = '2em';

        // We don't need padding, reducing the size if it does flash render.
        textArea.style.padding = 0;

        // Clean up any borders.
        textArea.style.border = 'none';
        textArea.style.outline = 'none';
        textArea.style.boxShadow = 'none';

        // Avoid flash of white box if rendered for any reason.
        textArea.style.background = 'transparent';

        textArea.value = text;

        document.body.appendChild(textArea);

        textArea.select();

        try {
            document.execCommand('copy');
        } catch (err) {
            console.log('Oops, unable to copy');
        }

        document.body.removeChild(textArea);
    }

    function isNumeric(val) {
        return !isNaN(val);
    }

    let throttle$1 = throttle_1;

    let debounce$3 = debounce_1;

    function nextTick(fn, context = null) {
        return (...args) => {
            return new Promise(resolve => {
                const execute = () => {
                    const out = fn.apply(context, args);
                    resolve(out);
                };
                setTimeout(execute);
            });
        };
    }
    function linkProperties(target, source, properties) {
        const props = properties.reduce((acc, prop) => {
            acc[prop] = {
                get() {
                    return source[prop];
                }
            };
            return acc;
        }, {});
        Object.defineProperties(target, props);
    }
    function isSet(val) {
        return val !== undefined || val !== null;
    }

    function notSet(val) {
        return !isSet(val);
    }

    function isNumber(val) {
        return !isNaN(val);
    }

    function ensureArray(val) {
        if (!Array.isArray(val)) {
            return [val];
        }
        return val;
    }

    function uniq$1(arr) {
        return uniq_1(arr);
    }

    function numberSortAsc(a, b) {
        return a - b;
    }
    function stripHTML(html) {
        return html.replace(/<[^>]*>/g, '');
    }

    class DataManager {
        constructor(options) {
            this.options = options;
            this.sortRows = nextTick(this.sortRows, this);
            this.switchColumn = nextTick(this.switchColumn, this);
            this.removeColumn = nextTick(this.removeColumn, this);
            this.options.filterRows = nextTick(this.options.filterRows, this);
        }

        init(data, columns) {
            if (!data) {
                data = this.options.data;
            }
            if (columns) {
                this.options.columns = columns;
            }

            this.data = data;

            this.rowCount = 0;
            this.columns = [];
            this.rows = [];

            this.prepareColumns();
            this.prepareRows();
            this.prepareTreeRows();
            this.prepareRowView();
            this.prepareNumericColumns();
        }

        // computed property
        get currentSort() {
            const col = this.columns.find(col => col.sortOrder !== 'none');
            return col || {
                colIndex: -1,
                sortOrder: 'none'
            };
        }

        prepareColumns() {
            this.columns = [];
            this.validateColumns();
            this.prepareDefaultColumns();
            this.prepareHeader();
        }

        prepareDefaultColumns() {
            if (this.options.checkboxColumn && !this.hasColumnById('_checkbox')) {
                const cell = {
                    id: '_checkbox',
                    content: this.getCheckboxHTML(),
                    editable: false,
                    resizable: false,
                    sortable: false,
                    focusable: false,
                    dropdown: false,
                    width: 32
                };
                this.columns.push(cell);
            }

            if (this.options.serialNoColumn && !this.hasColumnById('_rowIndex')) {
                let cell = {
                    id: '_rowIndex',
                    content: '',
                    align: 'center',
                    editable: false,
                    resizable: false,
                    focusable: false,
                    dropdown: false
                };

                this.columns.push(cell);
            }
        }

        prepareHeader() {
            let columns = this.columns.concat(this.options.columns);
            const baseCell = {
                isHeader: 1,
                editable: true,
                sortable: true,
                resizable: true,
                focusable: true,
                dropdown: true,
                width: null,
                format: (value) => {
                    if (value === null || value === undefined) {
                        return '';
                    }
                    return value + '';
                }
            };

            this.columns = columns
                .map((cell, i) => this.prepareCell(cell, i))
                .map(col => Object.assign({}, baseCell, col))
                .map(col => {
                    col.content = col.content || col.name || '';
                    col.id = col.id || col.content;
                    return col;
                });
        }

        prepareCell(content, i) {
            const cell = {
                content: '',
                sortOrder: 'none',
                colIndex: i,
                column: this.columns[i]
            };

            if (content !== null && typeof content === 'object') {
                // passed as column/header
                Object.assign(cell, content);
            } else {
                cell.content = content;
            }

            return cell;
        }

        prepareNumericColumns() {
            const row0 = this.getRow(0);
            if (!row0) return;
            this.columns = this.columns.map((column, i) => {

                const cellValue = row0[i].content;
                if (!column.align && isNumeric(cellValue)) {
                    column.align = 'right';
                }

                return column;
            });
        }

        prepareRows() {
            this.validateData(this.data);

            this.rows = this.data.map((d, i) => {
                const index = this._getNextRowCount();

                let row = [];
                let meta = {
                    rowIndex: index
                };

                if (Array.isArray(d)) {
                    // row is an array
                    if (this.options.checkboxColumn) {
                        row.push(this.getCheckboxHTML());
                    }
                    if (this.options.serialNoColumn) {
                        row.push((index + 1) + '');
                    }
                    row = row.concat(d);

                    while (row.length < this.columns.length) {
                        row.push('');
                    }

                } else {
                    // row is an object
                    for (let col of this.columns) {
                        if (col.id === '_checkbox') {
                            row.push(this.getCheckboxHTML());
                        } else if (col.id === '_rowIndex') {
                            row.push((index + 1) + '');
                        } else {
                            row.push(d[col.id]);
                        }
                    }

                    meta.indent = d.indent || 0;
                }

                return this.prepareRow(row, meta);
            });
        }

        prepareTreeRows() {
            this.rows.forEach((row, i) => {
                if (isNumber(row.meta.indent)) {
                    // if (i === 36) debugger;
                    const nextRow = this.getRow(i + 1);
                    row.meta.isLeaf = !nextRow ||
                        notSet(nextRow.meta.indent) ||
                        nextRow.meta.indent <= row.meta.indent;
                    row.meta.isTreeNodeClose = false;
                }
            });
        }

        prepareRowView() {
            // This is order in which rows will be rendered in the table.
            // When sorting happens, only this.rowViewOrder will change
            // and not the original this.rows
            this.rowViewOrder = this.rows.map(row => row.meta.rowIndex);
        }

        prepareRow(row, meta) {
            const baseRowCell = {
                rowIndex: meta.rowIndex,
                indent: meta.indent
            };

            row = row
                .map((cell, i) => this.prepareCell(cell, i))
                .map(cell => Object.assign({}, baseRowCell, cell));

            // monkey patched in array object
            row.meta = meta;
            return row;
        }

        validateColumns() {
            const columns = this.options.columns;
            if (!Array.isArray(columns)) {
                throw new DataError('`columns` must be an array');
            }

            columns.forEach((column, i) => {
                if (typeof column !== 'string' && typeof column !== 'object') {
                    throw new DataError(`column "${i}" must be a string or an object`);
                }
            });
        }

        validateData(data) {
            if (Array.isArray(data) &&
                (data.length === 0 || Array.isArray(data[0]) || typeof data[0] === 'object')) {
                return true;
            }
            throw new DataError('`data` must be an array of arrays or objects');
        }

        appendRows(rows) {
            this.validateData(rows);

            this.rows.push(...this.prepareRows(rows));
        }

        sortRows(colIndex, sortOrder = 'none') {
            colIndex = +colIndex;

            // reset sortOrder and update for colIndex
            this.getColumns()
                .map(col => {
                    if (col.colIndex === colIndex) {
                        col.sortOrder = sortOrder;
                    } else {
                        col.sortOrder = 'none';
                    }
                });

            this._sortRows(colIndex, sortOrder);
        }

        _sortRows(colIndex, sortOrder) {

            if (this.currentSort.colIndex === colIndex) {
                // reverse the array if only sortOrder changed
                if (
                    (this.currentSort.sortOrder === 'asc' && sortOrder === 'desc') ||
                    (this.currentSort.sortOrder === 'desc' && sortOrder === 'asc')
                ) {
                    this.reverseArray(this.rowViewOrder);
                    this.currentSort.sortOrder = sortOrder;
                    return;
                }
            }

            this.rowViewOrder.sort((a, b) => {
                const aIndex = a;
                const bIndex = b;

                let aContent = this.getCell(colIndex, a).content;
                let bContent = this.getCell(colIndex, b).content;
                aContent = aContent == null ? '' : aContent;
                bContent = bContent == null ? '' : bContent;

                if (sortOrder === 'none') {
                    return aIndex - bIndex;
                } else if (sortOrder === 'asc') {
                    if (aContent < bContent) return -1;
                    if (aContent > bContent) return 1;
                    if (aContent === bContent) return 0;
                } else if (sortOrder === 'desc') {
                    if (aContent < bContent) return 1;
                    if (aContent > bContent) return -1;
                    if (aContent === bContent) return 0;
                }
                return 0;
            });

            if (this.hasColumnById('_rowIndex')) {
                // update row index
                const srNoColIndex = this.getColumnIndexById('_rowIndex');
                this.rows.forEach((row, index) => {
                    const viewIndex = this.rowViewOrder.indexOf(index);
                    const cell = row[srNoColIndex];
                    cell.content = (viewIndex + 1) + '';
                });
            }
        }

        reverseArray(array) {
            let left = null;
            let right = null;
            let length = array.length;

            for (left = 0, right = length - 1; left < right; left += 1, right -= 1) {
                const temporary = array[left];

                array[left] = array[right];
                array[right] = temporary;
            }
        }

        switchColumn(index1, index2) {
            // update columns
            const temp = this.columns[index1];
            this.columns[index1] = this.columns[index2];
            this.columns[index2] = temp;

            this.columns[index1].colIndex = index1;
            this.columns[index2].colIndex = index2;

            // update rows
            this.rows.forEach(row => {
                const newCell1 = Object.assign({}, row[index1], {
                    colIndex: index2
                });
                const newCell2 = Object.assign({}, row[index2], {
                    colIndex: index1
                });

                row[index2] = newCell1;
                row[index1] = newCell2;
            });
        }

        removeColumn(index) {
            index = +index;
            const filter = cell => cell.colIndex !== index;
            const map = (cell, i) => Object.assign({}, cell, {
                colIndex: i
            });
            // update columns
            this.columns = this.columns
                .filter(filter)
                .map(map);

            // update rows
            this.rows.forEach(row => {
                // remove cell
                row.splice(index, 1);
                // update colIndex
                row.forEach((cell, i) => {
                    cell.colIndex = i;
                });
            });
        }

        updateRow(row, rowIndex) {
            if (row.length < this.columns.length) {
                if (this.hasColumnById('_rowIndex')) {
                    const val = (rowIndex + 1) + '';

                    row = [val].concat(row);
                }

                if (this.hasColumnById('_checkbox')) {
                    const val = '<input type="checkbox" />';

                    row = [val].concat(row);
                }
            }

            const _row = this.prepareRow(row, {rowIndex});
            const index = this.rows.findIndex(row => row[0].rowIndex === rowIndex);
            this.rows[index] = _row;

            return _row;
        }

        updateCell(colIndex, rowIndex, options) {
            let cell;
            if (typeof colIndex === 'object') {
                // cell object was passed,
                // must have colIndex, rowIndex
                cell = colIndex;
                colIndex = cell.colIndex;
                rowIndex = cell.rowIndex;
                // the object passed must be merged with original cell
                options = cell;
            }
            cell = this.getCell(colIndex, rowIndex);

            // mutate object directly
            for (let key in options) {
                const newVal = options[key];
                if (newVal !== undefined) {
                    cell[key] = newVal;
                }
            }

            return cell;
        }

        updateColumn(colIndex, keyValPairs) {
            const column = this.getColumn(colIndex);
            for (let key in keyValPairs) {
                const newVal = keyValPairs[key];
                if (newVal !== undefined) {
                    column[key] = newVal;
                }
            }
            return column;
        }

        filterRows(filters) {
            return this.options.filterRows(this.rows, filters)
                .then(result => {
                    if (!result) {
                        result = this.getAllRowIndices();
                    }

                    if (!result.then) {
                        result = Promise.resolve(result);
                    }

                    return result.then(rowsToShow => {
                        this._filteredRows = rowsToShow;

                        const rowsToHide = this.getAllRowIndices()
                            .filter(index => !rowsToShow.includes(index));

                        return {
                            rowsToHide,
                            rowsToShow
                        };
                    });
                });
        }

        getFilteredRowIndices() {
            return this._filteredRows || this.getAllRowIndices();
        }

        getAllRowIndices() {
            return this.rows.map(row => row.meta.rowIndex);
        }

        getRowCount() {
            return this.rowCount;
        }

        _getNextRowCount() {
            const val = this.rowCount;

            this.rowCount++;
            return val;
        }

        getRows(start, end) {
            return this.rows.slice(start, end);
        }

        getRowsForView(start, end) {
            const rows = this.rowViewOrder.map(i => this.rows[i]);
            return rows.slice(start, end);
        }

        getColumns(skipStandardColumns) {
            let columns = this.columns;

            if (skipStandardColumns) {
                columns = columns.slice(this.getStandardColumnCount());
            }

            return columns;
        }

        getStandardColumnCount() {
            if (this.options.checkboxColumn && this.options.serialNoColumn) {
                return 2;
            }

            if (this.options.checkboxColumn || this.options.serialNoColumn) {
                return 1;
            }

            return 0;
        }

        getColumnCount(skipStandardColumns) {
            let val = this.columns.length;

            if (skipStandardColumns) {
                val = val - this.getStandardColumnCount();
            }

            return val;
        }

        getColumn(colIndex) {
            colIndex = +colIndex;

            if (colIndex < 0) {
                // negative indexes
                colIndex = this.columns.length + colIndex;
            }

            return this.columns.find(col => col.colIndex === colIndex);
        }

        getColumnById(id) {
            return this.columns.find(col => col.id === id);
        }

        getRow(rowIndex) {
            rowIndex = +rowIndex;
            return this.rows[rowIndex];
        }

        getCell(colIndex, rowIndex) {
            rowIndex = +rowIndex;
            colIndex = +colIndex;
            return this.getRow(rowIndex)[colIndex];
        }

        getChildren(parentRowIndex) {
            parentRowIndex = +parentRowIndex;
            const parentIndent = this.getRow(parentRowIndex).meta.indent;
            const out = [];

            for (let i = parentRowIndex + 1; i < this.rowCount; i++) {
                const row = this.getRow(i);
                if (isNaN(row.meta.indent)) continue;

                if (row.meta.indent > parentIndent) {
                    out.push(i);
                }

                if (row.meta.indent === parentIndent) {
                    break;
                }
            }

            return out;
        }

        getImmediateChildren(parentRowIndex) {
            parentRowIndex = +parentRowIndex;
            const parentIndent = this.getRow(parentRowIndex).meta.indent;
            const out = [];
            const childIndent = parentIndent + 1;

            for (let i = parentRowIndex + 1; i < this.rowCount; i++) {
                const row = this.getRow(i);
                if (isNaN(row.meta.indent) || row.meta.indent > childIndent) continue;

                if (row.meta.indent === childIndent) {
                    out.push(i);
                }

                if (row.meta.indent === parentIndent) {
                    break;
                }
            }

            return out;
        }

        get() {
            return {
                columns: this.columns,
                rows: this.rows
            };
        }

        /**
         * Returns the original data which was passed
         * based on rowIndex
         * @param {Number} rowIndex
         * @returns Array|Object
         * @memberof DataManager
         */
        getData(rowIndex) {
            return this.data[rowIndex];
        }

        hasColumn(name) {
            return Boolean(this.columns.find(col => col.content === name));
        }

        hasColumnById(id) {
            return Boolean(this.columns.find(col => col.id === id));
        }

        getColumnIndex(name) {
            return this.columns.findIndex(col => col.content === name);
        }

        getColumnIndexById(id) {
            return this.columns.findIndex(col => col.id === id);
        }

        getCheckboxHTML() {
            return '<input type="checkbox" />';
        }
    }

    // Custom Errors
    class DataError extends TypeError {}

    /* eslint-disable max-len */

    // Icons from https://feathericons.com/

    let icons = {
        chevronDown: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-chevron-down"><polyline points="6 9 12 15 18 9"></polyline></svg>',
        chevronRight: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-chevron-right"><polyline points="9 18 15 12 9 6"></polyline></svg>'
    };

    class CellManager {
        constructor(instance) {
            this.instance = instance;
            linkProperties(this, this.instance, [
                'wrapper',
                'options',
                'style',
                'header',
                'bodyScrollable',
                'columnmanager',
                'rowmanager',
                'datamanager',
                'keyboard'
            ]);

            this.bindEvents();
        }

        bindEvents() {
            this.bindFocusCell();
            this.bindEditCell();
            this.bindKeyboardSelection();
            this.bindCopyCellContents();
            this.bindMouseEvents();
            this.bindTreeEvents();
        }

        bindFocusCell() {
            this.bindKeyboardNav();
        }

        bindEditCell() {
            this.$editingCell = null;

            $.on(this.bodyScrollable, 'dblclick', '.dt-cell', (e, cell) => {
                this.activateEditing(cell);
            });

            this.keyboard.on('enter', () => {
                if (this.$focusedCell && !this.$editingCell) {
                    // enter keypress on focused cell
                    this.activateEditing(this.$focusedCell);
                } else if (this.$editingCell) {
                    // enter keypress on editing cell
                    this.deactivateEditing();
                }
            });
        }

        bindKeyboardNav() {
            const focusLastCell = (direction) => {
                if (!this.$focusedCell || this.$editingCell) {
                    return false;
                }

                let $cell = this.$focusedCell;
                const {
                    rowIndex,
                    colIndex
                } = $.data($cell);

                if (direction === 'left') {
                    $cell = this.getLeftMostCell$(rowIndex);
                } else if (direction === 'right') {
                    $cell = this.getRightMostCell$(rowIndex);
                } else if (direction === 'up') {
                    $cell = this.getTopMostCell$(colIndex);
                } else if (direction === 'down') {
                    $cell = this.getBottomMostCell$(colIndex);
                }

                this.focusCell($cell);
                return true;
            };

            ['left', 'right', 'up', 'down', 'tab', 'shift+tab']
                .map(direction => this.keyboard.on(direction, () => this.focusCellInDirection(direction)));

            ['left', 'right', 'up', 'down']
                .map(direction => this.keyboard.on(`ctrl+${direction}`, () => focusLastCell(direction)));

            this.keyboard.on('esc', () => {
                this.deactivateEditing(false);
                this.columnmanager.toggleFilter(false);
            });

            if (this.options.inlineFilters) {
                this.keyboard.on('ctrl+f', (e) => {
                    const $cell = $.closest('.dt-cell', e.target);
                    const { colIndex } = $.data($cell);

                    this.activateFilter(colIndex);
                    return true;
                });

                $.on(this.header, 'focusin', '.dt-filter', () => {
                    this.unfocusCell(this.$focusedCell);
                });
            }
        }

        bindKeyboardSelection() {
            const getNextSelectionCursor = (direction) => {
                let $selectionCursor = this.getSelectionCursor();

                if (direction === 'left') {
                    $selectionCursor = this.getLeftCell$($selectionCursor);
                } else if (direction === 'right') {
                    $selectionCursor = this.getRightCell$($selectionCursor);
                } else if (direction === 'up') {
                    $selectionCursor = this.getAboveCell$($selectionCursor);
                } else if (direction === 'down') {
                    $selectionCursor = this.getBelowCell$($selectionCursor);
                }

                return $selectionCursor;
            };

            ['left', 'right', 'up', 'down']
                .map(direction =>
                    this.keyboard.on(`shift+${direction}`, () => this.selectArea(getNextSelectionCursor(direction))));
        }

        bindCopyCellContents() {
            this.keyboard.on('ctrl+c', () => {
                const noOfCellsCopied = this.copyCellContents(this.$focusedCell, this.$selectionCursor);
                const message = `${noOfCellsCopied} cell${noOfCellsCopied > 1 ? 's' : ''} copied`;
                if (noOfCellsCopied) {
                    this.instance.showToastMessage(message, 2);
                }
            });

            if (this.options.pasteFromClipboard) {
                this.keyboard.on('ctrl+v', (e) => {
                    // hack
                    // https://stackoverflow.com/a/2177059/5353542
                    this.instance.pasteTarget.focus();

                    setTimeout(() => {
                        const data = this.instance.pasteTarget.value;
                        this.instance.pasteTarget.value = '';
                        this.pasteContentInCell(data);
                    }, 10);

                    return false;
                });
            }
        }

        bindMouseEvents() {
            let mouseDown = null;

            $.on(this.bodyScrollable, 'mousedown', '.dt-cell', (e) => {
                mouseDown = true;
                this.focusCell($(e.delegatedTarget));
            });

            $.on(this.bodyScrollable, 'mouseup', () => {
                mouseDown = false;
            });

            const selectArea = (e) => {
                if (!mouseDown) return;
                this.selectArea($(e.delegatedTarget));
            };

            $.on(this.bodyScrollable, 'mousemove', '.dt-cell', throttle$1(selectArea, 50));
        }

        bindTreeEvents() {
            $.on(this.bodyScrollable, 'click', '.dt-tree-node__toggle', (e, $toggle) => {
                const $cell = $.closest('.dt-cell', $toggle);
                const { rowIndex } = $.data($cell);

                if ($cell.classList.contains('dt-cell--tree-close')) {
                    this.rowmanager.openSingleNode(rowIndex);
                } else {
                    this.rowmanager.closeSingleNode(rowIndex);
                }
            });
        }

        focusCell($cell, {
            skipClearSelection = 0,
            skipDOMFocus = 0,
            skipScrollToCell = 0
        } = {}) {
            if (!$cell) return;

            // don't focus if already editing cell
            if ($cell === this.$editingCell) return;

            const {
                colIndex,
                isHeader
            } = $.data($cell);
            if (isHeader) {
                return;
            }

            const column = this.columnmanager.getColumn(colIndex);
            if (column.focusable === false) {
                return;
            }

            if (!skipScrollToCell) {
                this.scrollToCell($cell);
            }

            this.deactivateEditing();
            if (!skipClearSelection) {
                this.clearSelection();
            }

            if (this.$focusedCell) {
                this.$focusedCell.classList.remove('dt-cell--focus');
            }

            this.$focusedCell = $cell;
            $cell.classList.add('dt-cell--focus');

            if (!skipDOMFocus) {
                // so that keyboard nav works
                $cell.focus();
            }

            this.highlightRowColumnHeader($cell);
        }

        unfocusCell($cell) {
            if (!$cell) return;

            // remove cell border
            $cell.classList.remove('dt-cell--focus');
            this.$focusedCell = null;

            // reset header background
            if (this.lastHeaders) {
                this.lastHeaders.forEach(header => header && header.classList.remove('dt-cell--highlight'));
            }
        }

        highlightRowColumnHeader($cell) {
            const {
                colIndex,
                rowIndex
            } = $.data($cell);

            const srNoColIndex = this.datamanager.getColumnIndexById('_rowIndex');
            const colHeaderSelector = `.dt-cell--header-${colIndex}`;
            const rowHeaderSelector = `.dt-cell--${srNoColIndex}-${rowIndex}`;

            if (this.lastHeaders) {
                this.lastHeaders.forEach(header => header && header.classList.remove('dt-cell--highlight'));
            }

            const colHeader = $(colHeaderSelector, this.wrapper);
            const rowHeader = $(rowHeaderSelector, this.wrapper);

            this.lastHeaders = [colHeader, rowHeader];
            this.lastHeaders.forEach(header => header && header.classList.add('dt-cell--highlight'));
        }

        selectAreaOnClusterChanged() {
            if (!(this.$focusedCell && this.$selectionCursor)) return;
            const {
                colIndex,
                rowIndex
            } = $.data(this.$selectionCursor);
            const $cell = this.getCell$(colIndex, rowIndex);

            if (!$cell || $cell === this.$selectionCursor) return;

            // selectArea needs $focusedCell
            const fCell = $.data(this.$focusedCell);
            this.$focusedCell = this.getCell$(fCell.colIndex, fCell.rowIndex);

            this.selectArea($cell);
        }

        focusCellOnClusterChanged() {
            if (!this.$focusedCell) return;

            const {
                colIndex,
                rowIndex
            } = $.data(this.$focusedCell);
            const $cell = this.getCell$(colIndex, rowIndex);

            if (!$cell) return;
            // this function is called after hyperlist renders the rows after scroll,
            // focusCell calls clearSelection which resets the area selection
            // so a flag to skip it
            // we also skip DOM focus and scroll to cell
            // because it fights with the user scroll
            this.focusCell($cell, {
                skipClearSelection: 1,
                skipDOMFocus: 1,
                skipScrollToCell: 1
            });
        }

        selectArea($selectionCursor) {
            if (!this.$focusedCell) return;

            if (this._selectArea(this.$focusedCell, $selectionCursor)) {
                // valid selection
                this.$selectionCursor = $selectionCursor;
            }
        }

        _selectArea($cell1, $cell2) {
            if ($cell1 === $cell2) return false;

            const cells = this.getCellsInRange($cell1, $cell2);
            if (!cells) return false;

            this.clearSelection();
            this._selectedCells = cells.map(index => this.getCell$(...index));
            requestAnimationFrame(() => {
                this._selectedCells.map($cell => $cell.classList.add('dt-cell--highlight'));
            });
            return true;
        }

        getCellsInRange($cell1, $cell2) {
            let colIndex1, rowIndex1, colIndex2, rowIndex2;

            if (typeof $cell1 === 'number') {
                [colIndex1, rowIndex1, colIndex2, rowIndex2] = arguments;
            } else
            if (typeof $cell1 === 'object') {
                if (!($cell1 && $cell2)) {
                    return false;
                }

                const cell1 = $.data($cell1);
                const cell2 = $.data($cell2);

                colIndex1 = +cell1.colIndex;
                rowIndex1 = +cell1.rowIndex;
                colIndex2 = +cell2.colIndex;
                rowIndex2 = +cell2.rowIndex;
            }

            if (rowIndex1 > rowIndex2) {
                [rowIndex1, rowIndex2] = [rowIndex2, rowIndex1];
            }

            if (colIndex1 > colIndex2) {
                [colIndex1, colIndex2] = [colIndex2, colIndex1];
            }

            if (this.isStandardCell(colIndex1) || this.isStandardCell(colIndex2)) {
                return false;
            }

            const cells = [];
            let colIndex = colIndex1;
            let rowIndex = rowIndex1;
            const rowIndices = [];

            while (rowIndex <= rowIndex2) {
                rowIndices.push(rowIndex);
                rowIndex += 1;
            }

            rowIndices.map((rowIndex) => {
                while (colIndex <= colIndex2) {
                    cells.push([colIndex, rowIndex]);
                    colIndex++;
                }
                colIndex = colIndex1;
            });

            return cells;
        }

        clearSelection() {
            (this._selectedCells || [])
                .forEach($cell => $cell.classList.remove('dt-cell--highlight'));

            this._selectedCells = [];
            this.$selectionCursor = null;
        }

        getSelectionCursor() {
            return this.$selectionCursor || this.$focusedCell;
        }

        activateEditing($cell) {
            this.focusCell($cell);
            const {
                rowIndex,
                colIndex
            } = $.data($cell);

            const col = this.columnmanager.getColumn(colIndex);
            if (col && (col.editable === false || col.focusable === false)) {
                return;
            }

            const cell = this.getCell(colIndex, rowIndex);
            if (cell && cell.editable === false) {
                return;
            }

            if (this.$editingCell) {
                const {
                    _rowIndex,
                    _colIndex
                } = $.data(this.$editingCell);

                if (rowIndex === _rowIndex && colIndex === _colIndex) {
                    // editing the same cell
                    return;
                }
            }

            this.$editingCell = $cell;
            $cell.classList.add('dt-cell--editing');

            const $editCell = $('.dt-cell__edit', $cell);
            $editCell.innerHTML = '';

            const editor = this.getEditor(colIndex, rowIndex, cell.content, $editCell);

            if (editor) {
                this.currentCellEditor = editor;
                // initialize editing input with cell value
                editor.initValue(cell.content, rowIndex, col);
            }
        }

        deactivateEditing(submitValue = true) {
            if (submitValue) {
                this.submitEditing();
            }
            // keep focus on the cell so that keyboard navigation works
            if (this.$focusedCell) this.$focusedCell.focus();

            if (!this.$editingCell) return;
            this.$editingCell.classList.remove('dt-cell--editing');
            this.$editingCell = null;
        }

        getEditor(colIndex, rowIndex, value, parent) {
            const column = this.datamanager.getColumn(colIndex);
            const row = this.datamanager.getRow(rowIndex);
            const data = this.datamanager.getData(rowIndex);
            let editor = this.options.getEditor ?
                this.options.getEditor(colIndex, rowIndex, value, parent, column, row, data) :
                this.getDefaultEditor(parent);

            if (editor === false) {
                // explicitly returned false
                return false;
            }
            if (editor === undefined) {
                // didn't return editor, fallback to default
                editor = this.getDefaultEditor(parent);
            }

            return editor;
        }

        getDefaultEditor(parent) {
            const $input = $.create('input', {
                class: 'dt-input',
                type: 'text',
                inside: parent
            });

            return {
                initValue(value) {
                    $input.focus();
                    $input.value = value;
                },
                getValue() {
                    return $input.value;
                },
                setValue(value) {
                    $input.value = value;
                }
            };
        }

        submitEditing() {
            let promise = Promise.resolve();
            if (!this.$editingCell) return promise;

            const $cell = this.$editingCell;
            const {
                rowIndex,
                colIndex
            } = $.data($cell);
            const col = this.datamanager.getColumn(colIndex);

            if ($cell) {
                const editor = this.currentCellEditor;

                if (editor) {
                    let valuePromise = editor.getValue();

                    // convert to stubbed Promise
                    if (!valuePromise.then) {
                        valuePromise = Promise.resolve(valuePromise);
                    }

                    promise = valuePromise.then((value) => {
                        const done = editor.setValue(value, rowIndex, col);
                        const oldValue = this.getCell(colIndex, rowIndex).content;

                        // update cell immediately
                        this.updateCell(colIndex, rowIndex, value);
                        $cell.focus();

                        if (done && done.then) {
                            // revert to oldValue if promise fails
                            done.catch((e) => {
                                console.log(e);
                                this.updateCell(colIndex, rowIndex, oldValue);
                            });
                        }
                        return done;
                    });
                }
            }

            this.currentCellEditor = null;
            return promise;
        }

        copyCellContents($cell1, $cell2) {
            if (!$cell2 && $cell1) {
                // copy only focusedCell
                const {
                    colIndex,
                    rowIndex
                } = $.data($cell1);
                const cell = this.getCell(colIndex, rowIndex);
                copyTextToClipboard(cell.content);
                return 1;
            }
            const cells = this.getCellsInRange($cell1, $cell2);

            if (!cells) return 0;

            const rows = cells
                // get cell objects
                .map(index => this.getCell(...index))
                // convert to array of rows
                .reduce((acc, curr) => {
                    const rowIndex = curr.rowIndex;

                    acc[rowIndex] = acc[rowIndex] || [];
                    acc[rowIndex].push(curr.content);

                    return acc;
                }, []);

            const values = rows
                // join values by tab
                .map(row => row.join('\t'))
                // join rows by newline
                .join('\n');

            copyTextToClipboard(values);

            // return no of cells copied
            return rows.reduce((total, row) => total + row.length, 0);
        }

        pasteContentInCell(data) {
            if (!this.$focusedCell) return;

            const matrix = data
                .split('\n')
                .map(row => row.split('\t'))
                .filter(row => row.length && row.every(it => it));

            let { colIndex, rowIndex } = $.data(this.$focusedCell);

            let focusedCell = {
                colIndex: +colIndex,
                rowIndex: +rowIndex
            };

            matrix.forEach((row, i) => {
                let rowIndex = i + focusedCell.rowIndex;
                row.forEach((cell, j) => {
                    let colIndex = j + focusedCell.colIndex;
                    this.updateCell(colIndex, rowIndex, cell);
                });
            });
        }

        activateFilter(colIndex) {
            this.columnmanager.toggleFilter();
            this.columnmanager.focusFilter(colIndex);

            if (!this.columnmanager.isFilterShown) {
                // put focus back on cell
                this.$focusedCell && this.$focusedCell.focus();
            }
        }

        updateCell(colIndex, rowIndex, value) {
            const cell = this.datamanager.updateCell(colIndex, rowIndex, {
                content: value
            });
            this.refreshCell(cell);
        }

        refreshCell(cell) {
            const $cell = $(this.selector(cell.colIndex, cell.rowIndex), this.bodyScrollable);
            $cell.innerHTML = this.getCellContent(cell);
        }

        toggleTreeButton(rowIndex, flag) {
            const colIndex = this.columnmanager.getFirstColumnIndex();
            const $cell = this.getCell$(colIndex, rowIndex);
            if ($cell) {
                $cell.classList[flag ? 'remove' : 'add']('dt-cell--tree-close');
            }
        }

        isStandardCell(colIndex) {
            // Standard cells are in Sr. No and Checkbox column
            return colIndex < this.columnmanager.getFirstColumnIndex();
        }

        focusCellInDirection(direction) {
            if (!this.$focusedCell) {
                return false;
            } else if (this.$editingCell && ['tab', 'shift+tab'].includes(direction)) {
                this.deactivateEditing();
            }

            let $cell = this.$focusedCell;

            if (direction === 'left' || direction === 'shift+tab') {
                $cell = this.getLeftCell$($cell);
            } else if (direction === 'right' || direction === 'tab') {
                $cell = this.getRightCell$($cell);
            } else if (direction === 'up') {
                $cell = this.getAboveCell$($cell);
            } else if (direction === 'down') {
                $cell = this.getBelowCell$($cell);
            }

            if (!$cell) {
                return false;
            }

            const {
                colIndex
            } = $.data($cell);
            const column = this.columnmanager.getColumn(colIndex);

            if (!column.focusable) {
                let $prevFocusedCell = this.$focusedCell;
                this.unfocusCell($prevFocusedCell);
                this.$focusedCell = $cell;
                let ret = this.focusCellInDirection(direction);
                if (!ret) {
                    this.focusCell($prevFocusedCell);
                }
                return ret;
            }

            this.focusCell($cell);
            return true;
        }

        getCell$(colIndex, rowIndex) {
            return $(this.selector(colIndex, rowIndex), this.bodyScrollable);
        }

        getAboveCell$($cell) {
            const {
                colIndex
            } = $.data($cell);

            let $aboveRow = $cell.parentElement.previousElementSibling;
            while ($aboveRow && $aboveRow.classList.contains('dt-row--hide')) {
                $aboveRow = $aboveRow.previousElementSibling;
            }

            if (!$aboveRow) return $cell;
            return $(`.dt-cell--col-${colIndex}`, $aboveRow);
        }

        getBelowCell$($cell) {
            const {
                colIndex
            } = $.data($cell);

            let $belowRow = $cell.parentElement.nextElementSibling;
            while ($belowRow && $belowRow.classList.contains('dt-row--hide')) {
                $belowRow = $belowRow.nextElementSibling;
            }

            if (!$belowRow) return $cell;
            return $(`.dt-cell--col-${colIndex}`, $belowRow);
        }

        getLeftCell$($cell) {
            return $cell.previousElementSibling;
        }

        getRightCell$($cell) {
            return $cell.nextElementSibling;
        }

        getLeftMostCell$(rowIndex) {
            return this.getCell$(this.columnmanager.getFirstColumnIndex(), rowIndex);
        }

        getRightMostCell$(rowIndex) {
            return this.getCell$(this.columnmanager.getLastColumnIndex(), rowIndex);
        }

        getTopMostCell$(colIndex) {
            return this.getCell$(colIndex, this.rowmanager.getFirstRowIndex());
        }

        getBottomMostCell$(colIndex) {
            return this.getCell$(colIndex, this.rowmanager.getLastRowIndex());
        }

        getCell(colIndex, rowIndex) {
            return this.instance.datamanager.getCell(colIndex, rowIndex);
        }

        getRowHeight() {
            return $.style($('.dt-row', this.bodyScrollable), 'height');
        }

        scrollToCell($cell) {
            if ($.inViewport($cell, this.bodyScrollable)) return false;

            const {
                rowIndex
            } = $.data($cell);
            this.rowmanager.scrollToRow(rowIndex);
            return false;
        }

        getRowCountPerPage() {
            return Math.ceil(this.instance.getViewportHeight() / this.getRowHeight());
        }

        getCellHTML(cell) {
            const {
                rowIndex,
                colIndex,
                isHeader,
                isFilter,
                isTotalRow
            } = cell;
            const dataAttr = makeDataAttributeString({
                rowIndex,
                colIndex,
                isHeader,
                isFilter,
                isTotalRow
            });

            const row = this.datamanager.getRow(rowIndex);

            const isBodyCell = !(isHeader || isFilter || isTotalRow);

            const className = [
                'dt-cell',
                'dt-cell--col-' + colIndex,
                isBodyCell ? `dt-cell--${colIndex}-${rowIndex}` : '',
                isBodyCell ? 'dt-cell--row-' + rowIndex : '',
                isHeader ? 'dt-cell--header' : '',
                isHeader ? `dt-cell--header-${colIndex}` : '',
                isFilter ? 'dt-cell--filter' : '',
                isBodyCell && (row && row.meta.isTreeNodeClose) ? 'dt-cell--tree-close' : ''
            ].join(' ');

            return `
            <div class="${className}" ${dataAttr} tabindex="0">
                ${this.getCellContent(cell)}
            </div>
        `;
        }

        getCellContent(cell) {
            const {
                isHeader,
                isFilter,
                colIndex
            } = cell;

            const editable = !isHeader && cell.editable !== false;
            const editCellHTML = editable ? this.getEditCellHTML(colIndex) : '';

            const sortable = isHeader && cell.sortable !== false;
            const sortIndicator = sortable ?
                `<span class="sort-indicator">
                ${this.options.sortIndicator[cell.sortOrder]}
            </span>` :
                '';

            const resizable = isHeader && cell.resizable !== false;
            const resizeColumn = resizable ? '<span class="dt-cell__resize-handle"></span>' : '';

            const hasDropdown = isHeader && cell.dropdown !== false;
            const dropdown = hasDropdown ? this.columnmanager.getDropdownHTML() : '';

            const customFormatter = cell.format || (cell.column && cell.column.format) || null;

            let contentHTML;
            if (isHeader || isFilter || !customFormatter) {
                contentHTML = cell.content;
            } else {
                const row = this.datamanager.getRow(cell.rowIndex);
                const data = this.datamanager.getData(cell.rowIndex);
                contentHTML = customFormatter(cell.content, row, cell.column, data);
            }

            cell.html = contentHTML;

            if (this.options.treeView && !(isHeader || isFilter) && cell.indent !== undefined) {
                const nextRow = this.datamanager.getRow(cell.rowIndex + 1);
                const addToggle = nextRow && nextRow.meta.indent > cell.indent;
                const leftPadding = 20;
                const unit = 'px';

                // Add toggle and indent in the first column
                const firstColumnIndex = this.datamanager.getColumnIndexById('_rowIndex') + 1;
                if (firstColumnIndex === cell.colIndex) {
                    const padding = ((cell.indent || 0)) * leftPadding;
                    const toggleHTML = addToggle ?
                        `<span class="dt-tree-node__toggle" style="left: ${padding - leftPadding}${unit}">
                        <span class="icon-open">${icons.chevronDown}</span>
                        <span class="icon-close">${icons.chevronRight}</span>
                    </span>` : '';
                    contentHTML = `<span class="dt-tree-node" style="padding-left: ${padding}${unit}">
                    ${toggleHTML}
                    <span>${contentHTML}</span>
                </span>`;
                }
            }

            const className = [
                'dt-cell__content',
                isHeader ? `dt-cell__content--header-${colIndex}` : `dt-cell__content--col-${colIndex}`
            ].join(' ');

            return `
            <div class="${className}">
                ${contentHTML}
                ${sortIndicator}
                ${resizeColumn}
                ${dropdown}
            </div>
            ${editCellHTML}
        `;
        }

        getEditCellHTML(colIndex) {
            return `<div class="dt-cell__edit dt-cell__edit--col-${colIndex}"></div>`;
        }

        selector(colIndex, rowIndex) {
            return `.dt-cell--${colIndex}-${rowIndex}`;
        }
    }

    class ColumnManager {
        constructor(instance) {
            this.instance = instance;

            linkProperties(this, this.instance, [
                'options',
                'fireEvent',
                'header',
                'datamanager',
                'cellmanager',
                'style',
                'wrapper',
                'rowmanager',
                'bodyScrollable',
                'bodyRenderer'
            ]);

            this.bindEvents();
        }

        renderHeader() {
            this.header.innerHTML = '<div></div>';
            this.refreshHeader();
        }

        refreshHeader() {
            const columns = this.datamanager.getColumns();

            // refresh html
            $('div', this.header).innerHTML = this.getHeaderHTML(columns);

            this.$filterRow = $('.dt-row-filter', this.header);
            if (this.$filterRow) {
                $.style(this.$filterRow, { display: 'none' });
            }
            // reset columnMap
            this.$columnMap = [];
            this.bindMoveColumn();
        }

        getHeaderHTML(columns) {
            let html = this.rowmanager.getRowHTML(columns, {
                isHeader: 1
            });
            if (this.options.inlineFilters) {
                html += this.rowmanager.getRowHTML(columns, {
                    isFilter: 1
                });
            }
            return html;
        }

        bindEvents() {
            this.bindDropdown();
            this.bindResizeColumn();
            this.bindPerfectColumnWidth();
            this.bindFilter();
        }

        bindDropdown() {
            let toggleClass = '.dt-dropdown__toggle';
            let dropdownClass = '.dt-dropdown__list';

            // attach the dropdown list to container
            this.instance.dropdownContainer.innerHTML = this.getDropdownListHTML();
            this.$dropdownList = this.instance.dropdownContainer.firstElementChild;

            $.on(this.header, 'click', toggleClass, e => {
                this.openDropdown(e);
            });

            const deactivateDropdownOnBodyClick = (e) => {
                const selector = [
                    toggleClass, toggleClass + ' *',
                    dropdownClass, dropdownClass + ' *'
                ].join(',');
                if (e.target.matches(selector)) return;
                deactivateDropdown();
            };
            $.on(document.body, 'click', deactivateDropdownOnBodyClick);
            document.addEventListener('scroll', deactivateDropdown, true);

            this.instance.on('onDestroy', () => {
                $.off(document.body, 'click', deactivateDropdownOnBodyClick);
                $.off(document, 'scroll', deactivateDropdown);
            });

            $.on(this.$dropdownList, 'click', '.dt-dropdown__list-item', (e, $item) => {
                if (!this._dropdownActiveColIndex) return;
                const dropdownItems = this.options.headerDropdown;
                const { index } = $.data($item);
                const colIndex = this._dropdownActiveColIndex;
                let callback = dropdownItems[index].action;

                callback && callback.call(this.instance, this.getColumn(colIndex));
                this.hideDropdown();
            });

            const _this = this;
            function deactivateDropdown(e) {
                _this.hideDropdown();
            }

            this.hideDropdown();
        }

        openDropdown(e) {
            if (!this._dropdownWidth) {
                $.style(this.$dropdownList, { display: '' });
                this._dropdownWidth = $.style(this.$dropdownList, 'width');
            }
            $.style(this.$dropdownList, {
                display: '',
                left: (e.clientX - this._dropdownWidth + 4) + 'px',
                top: (e.clientY + 4) + 'px'
            });
            const $cell = $.closest('.dt-cell', e.target);
            const { colIndex } = $.data($cell);
            this._dropdownActiveColIndex = colIndex;
        }

        hideDropdown() {
            $.style(this.$dropdownList, {
                display: 'none'
            });
            this._dropdownActiveColIndex = null;
        }

        bindResizeColumn() {
            let isDragging = false;
            let $resizingCell, startWidth, startX;

            $.on(this.header, 'mousedown', '.dt-cell .dt-cell__resize-handle', (e, $handle) => {
                document.body.classList.add('dt-resize');
                const $cell = $handle.parentNode.parentNode;
                $resizingCell = $cell;
                const {
                    colIndex
                } = $.data($resizingCell);
                const col = this.getColumn(colIndex);

                if (col && col.resizable === false) {
                    return;
                }

                isDragging = true;
                startWidth = $.style($('.dt-cell__content', $resizingCell), 'width');
                startX = e.pageX;
            });

            const onMouseup = (e) => {
                document.body.classList.remove('dt-resize');
                if (!$resizingCell) return;
                isDragging = false;

                const {
                    colIndex
                } = $.data($resizingCell);
                this.setColumnWidth(colIndex);
                this.style.setBodyStyle();
                $resizingCell = null;
            };
            $.on(document.body, 'mouseup', onMouseup);
            this.instance.on('onDestroy', () => {
                $.off(document.body, 'mouseup', onMouseup);
            });

            const onMouseMove = (e) => {
                if (!isDragging) return;
                const finalWidth = startWidth + (e.pageX - startX);
                const {
                    colIndex
                } = $.data($resizingCell);

                let columnMinWidth = this.options.minimumColumnWidth;
                if (columnMinWidth > finalWidth) {
                    // don't resize past 30 pixels
                    return;
                }
                this.datamanager.updateColumn(colIndex, {
                    width: finalWidth
                });
                this.setColumnHeaderWidth(colIndex);
            };
            $.on(document.body, 'mousemove', onMouseMove);
            this.instance.on('onDestroy', () => {
                $.off(document.body, 'mousemove', onMouseMove);
            });
        }

        bindPerfectColumnWidth() {
            $.on(this.header, 'dblclick', '.dt-cell .dt-cell__resize-handle', (e, $handle) => {
                const $cell = $handle.parentNode.parentNode;
                const { colIndex } = $.data($cell);

                let longestCell = this.bodyRenderer.visibleRows
                    .map(d => d[colIndex])
                    .reduce((acc, curr) => acc.content.length > curr.content.length ? acc : curr);

                let $longestCellHTML = this.cellmanager.getCellHTML(longestCell);
                let $div = document.createElement('div');
                $div.innerHTML = $longestCellHTML;
                let cellText = $div.querySelector('.dt-cell__content').textContent;

                let {
                    borderLeftWidth,
                    borderRightWidth,
                    paddingLeft,
                    paddingRight
                } = $.getStyle(this.bodyScrollable.querySelector('.dt-cell__content'));

                let padding = [borderLeftWidth, borderRightWidth, paddingLeft, paddingRight]
                    .map(parseFloat)
                    .reduce((sum, val) => sum + val);

                let width = $.measureTextWidth(cellText) + padding;
                this.datamanager.updateColumn(colIndex, { width });
                this.setColumnHeaderWidth(colIndex);
                this.setColumnWidth(colIndex);
            });
        }

        bindMoveColumn() {
            if (this.options.disableReorderColumn) return;

            const $parent = $('.dt-row', this.header);

            this.sortable = Sortable.create($parent, {
                onEnd: (e) => {
                    const {
                        oldIndex,
                        newIndex
                    } = e;
                    const $draggedCell = e.item;
                    const {
                        colIndex
                    } = $.data($draggedCell);
                    if (+colIndex === newIndex) return;

                    this.switchColumn(oldIndex, newIndex);
                },
                preventOnFilter: false,
                filter: '.dt-cell__resize-handle, .dt-dropdown',
                chosenClass: 'dt-cell--dragging',
                animation: 150
            });
        }

        sortColumn(colIndex, nextSortOrder) {
            this.instance.freeze();
            this.sortRows(colIndex, nextSortOrder)
                .then(() => {
                    this.refreshHeader();
                    return this.rowmanager.refreshRows();
                })
                .then(() => this.instance.unfreeze())
                .then(() => {
                    this.fireEvent('onSortColumn', this.getColumn(colIndex));
                });
        }

        removeColumn(colIndex) {
            const removedCol = this.getColumn(colIndex);
            this.instance.freeze();
            this.datamanager.removeColumn(colIndex)
                .then(() => {
                    this.refreshHeader();
                    return this.rowmanager.refreshRows();
                })
                .then(() => this.instance.unfreeze())
                .then(() => {
                    this.fireEvent('onRemoveColumn', removedCol);
                });
        }

        switchColumn(oldIndex, newIndex) {
            this.instance.freeze();
            this.datamanager.switchColumn(oldIndex, newIndex)
                .then(() => {
                    this.refreshHeader();
                    return this.rowmanager.refreshRows();
                })
                .then(() => {
                    this.setColumnWidth(oldIndex);
                    this.setColumnWidth(newIndex);
                    this.instance.unfreeze();
                })
                .then(() => {
                    this.fireEvent('onSwitchColumn',
                        this.getColumn(oldIndex), this.getColumn(newIndex)
                    );
                });
        }

        toggleFilter(flag) {
            if (!this.options.inlineFilters) return;

            let showFilter;
            if (flag === undefined) {
                showFilter = !this.isFilterShown;
            } else {
                showFilter = flag;
            }

            if (showFilter) {
                $.style(this.$filterRow, { display: '' });
            } else {
                $.style(this.$filterRow, { display: 'none' });
            }

            this.isFilterShown = showFilter;
            this.style.setBodyStyle();
        }

        focusFilter(colIndex) {
            if (!this.isFilterShown) return;

            const $filterInput = $(`.dt-cell--col-${colIndex} .dt-filter`, this.$filterRow);
            $filterInput.focus();
        }

        bindFilter() {
            if (!this.options.inlineFilters) return;
            const handler = e => {
                this.applyFilter(this.getAppliedFilters());
            };
            $.on(this.header, 'keydown', '.dt-filter', debounce$3(handler, 300));
        }

        applyFilter(filters) {
            this.datamanager.filterRows(filters)
                .then(({
                    rowsToShow
                }) => {
                    this.rowmanager.showRows(rowsToShow);
                });
        }

        getAppliedFilters() {
            const filters = {};
            $.each('.dt-filter', this.header).map((input) => {
                const value = input.value;
                if (value) {
                    filters[input.dataset.colIndex] = value;
                }
            });
            return filters;
        }

        applyDefaultSortOrder() {
            // sort rows if any 1 column has a default sortOrder set
            const columnsToSort = this.getColumns().filter(col => col.sortOrder !== 'none');

            if (columnsToSort.length === 1) {
                const column = columnsToSort[0];
                this.sortColumn(column.colIndex, column.sortOrder);
            }
        }

        sortRows(colIndex, sortOrder) {
            return this.datamanager.sortRows(colIndex, sortOrder);
        }

        getColumn(colIndex) {
            return this.datamanager.getColumn(colIndex);
        }

        getColumns() {
            return this.datamanager.getColumns();
        }

        setColumnWidth(colIndex, width) {
            colIndex = +colIndex;

            let columnWidth = width || this.getColumn(colIndex).width;

            const selector = [
                `.dt-cell__content--col-${colIndex}`,
                `.dt-cell__edit--col-${colIndex}`
            ].join(', ');

            const styles = {
                width: columnWidth + 'px'
            };

            this.style.setStyle(selector, styles);
        }

        setColumnHeaderWidth(colIndex) {
            colIndex = +colIndex;
            this.$columnMap = this.$columnMap || [];
            const selector = `.dt-cell__content--header-${colIndex}`;
            const {
                width
            } = this.getColumn(colIndex);

            let $column = this.$columnMap[colIndex];
            if (!$column) {
                $column = this.header.querySelector(selector);
                this.$columnMap[colIndex] = $column;
            }

            $column.style.width = width + 'px';
        }

        getColumnMinWidth(colIndex) {
            colIndex = +colIndex;
            return this.getColumn(colIndex).minWidth || 24;
        }

        getFirstColumnIndex() {
            return this.datamanager.getColumnIndexById('_rowIndex') + 1;
        }

        getHeaderCell$(colIndex) {
            return $(`.dt-cell--header-${colIndex}`, this.header);
        }

        getLastColumnIndex() {
            return this.datamanager.getColumnCount() - 1;
        }

        getDropdownHTML() {
            const { dropdownButton } = this.options;

            return `
            <div class="dt-dropdown">
                <div class="dt-dropdown__toggle">${dropdownButton}</div>
            </div>
      `;
        }

        getDropdownListHTML() {
            const { headerDropdown: dropdownItems } = this.options;

            return `
            <div class="dt-dropdown__list">
            ${dropdownItems.map((d, i) => `
                <div class="dt-dropdown__list-item" data-index="${i}">${d.label}</div>
            `).join('')}
            </div>
        `;
        }
    }

    class RowManager {
        constructor(instance) {
            this.instance = instance;
            linkProperties(this, this.instance, [
                'options',
                'fireEvent',
                'wrapper',
                'bodyScrollable',
                'bodyRenderer',
                'style'
            ]);

            this.bindEvents();
            this.refreshRows = nextTick(this.refreshRows, this);
        }

        get datamanager() {
            return this.instance.datamanager;
        }

        get cellmanager() {
            return this.instance.cellmanager;
        }

        bindEvents() {
            this.bindCheckbox();
        }

        bindCheckbox() {
            if (!this.options.checkboxColumn) return;

            // map of checked rows
            this.checkMap = [];

            $.on(this.wrapper, 'click', '.dt-cell--col-0 [type="checkbox"]', (e, $checkbox) => {
                const $cell = $checkbox.closest('.dt-cell');
                const {
                    rowIndex,
                    isHeader
                } = $.data($cell);
                const checked = $checkbox.checked;

                if (isHeader) {
                    this.checkAll(checked);
                } else {
                    this.checkRow(rowIndex, checked);
                }
            });
        }

        refreshRows() {
            this.instance.renderBody();
            this.instance.setDimensions();
        }

        refreshRow(row, rowIndex) {
            const _row = this.datamanager.updateRow(row, rowIndex);

            _row.forEach(cell => {
                this.cellmanager.refreshCell(cell);
            });
        }

        getCheckedRows() {
            if (!this.checkMap) {
                return [];
            }

            let out = [];
            for (let rowIndex in this.checkMap) {
                const checked = this.checkMap[rowIndex];
                if (checked === 1) {
                    out.push(rowIndex);
                }
            }

            return out;
        }

        highlightCheckedRows() {
            this.getCheckedRows()
                .map(rowIndex => this.checkRow(rowIndex, true));
        }

        checkRow(rowIndex, toggle) {
            const value = toggle ? 1 : 0;
            const selector = rowIndex => `.dt-cell--0-${rowIndex} [type="checkbox"]`;
            // update internal map
            this.checkMap[rowIndex] = value;
            // set checkbox value explicitly
            $.each(selector(rowIndex), this.bodyScrollable)
                .map(input => {
                    input.checked = toggle;
                });
            // highlight row
            this.highlightRow(rowIndex, toggle);
            this.showCheckStatus();
            this.fireEvent('onCheckRow', this.datamanager.getRow(rowIndex));
        }

        checkAll(toggle) {
            const value = toggle ? 1 : 0;

            // update internal map
            if (toggle) {
                this.checkMap = Array.from(Array(this.getTotalRows())).map(c => value);
            } else {
                this.checkMap = [];
            }
            // set checkbox value
            $.each('.dt-cell--col-0 [type="checkbox"]', this.bodyScrollable)
                .map(input => {
                    input.checked = toggle;
                });
            // highlight all
            this.highlightAll(toggle);
            this.showCheckStatus();
            this.fireEvent('onCheckRow');
        }

        showCheckStatus() {
            if (!this.options.checkedRowStatus) return;
            const checkedRows = this.getCheckedRows();
            const count = checkedRows.length;
            if (count > 0) {
                this.bodyRenderer.showToastMessage(`${count} row${count > 1 ? 's' : ''} selected`);
            } else {
                this.bodyRenderer.clearToastMessage();
            }
        }

        highlightRow(rowIndex, toggle = true) {
            const $row = this.getRow$(rowIndex);
            if (!$row) return;

            if (!toggle && this.bodyScrollable.classList.contains('dt-scrollable--highlight-all')) {
                $row.classList.add('dt-row--unhighlight');
                return;
            }

            if (toggle && $row.classList.contains('dt-row--unhighlight')) {
                $row.classList.remove('dt-row--unhighlight');
            }

            this._highlightedRows = this._highlightedRows || {};

            if (toggle) {
                $row.classList.add('dt-row--highlight');
                this._highlightedRows[rowIndex] = $row;
            } else {
                $row.classList.remove('dt-row--highlight');
                delete this._highlightedRows[rowIndex];
            }
        }

        highlightAll(toggle = true) {
            if (toggle) {
                this.bodyScrollable.classList.add('dt-scrollable--highlight-all');
            } else {
                this.bodyScrollable.classList.remove('dt-scrollable--highlight-all');
                for (const rowIndex in this._highlightedRows) {
                    const $row = this._highlightedRows[rowIndex];
                    $row.classList.remove('dt-row--highlight');
                }
                this._highlightedRows = {};
            }
        }

        showRows(rowIndices) {
            rowIndices = ensureArray(rowIndices);
            const rows = rowIndices.map(rowIndex => this.datamanager.getRow(rowIndex));
            this.bodyRenderer.renderRows(rows);
        }

        showAllRows() {
            const rowIndices = this.datamanager.getAllRowIndices();
            this.showRows(rowIndices);
        }

        getChildrenToShowForNode(rowIndex) {
            const row = this.datamanager.getRow(rowIndex);
            row.meta.isTreeNodeClose = false;

            return this.datamanager.getImmediateChildren(rowIndex);
        }

        openSingleNode(rowIndex) {
            const childrenToShow = this.getChildrenToShowForNode(rowIndex);
            const visibleRowIndices = this.bodyRenderer.visibleRowIndices;
            const rowsToShow = uniq$1([...childrenToShow, ...visibleRowIndices]).sort(numberSortAsc);

            this.showRows(rowsToShow);
        }

        getChildrenToHideForNode(rowIndex) {
            const row = this.datamanager.getRow(rowIndex);
            row.meta.isTreeNodeClose = true;

            const rowsToHide = this.datamanager.getChildren(rowIndex);
            rowsToHide.forEach(rowIndex => {
                const row = this.datamanager.getRow(rowIndex);
                if (!row.meta.isLeaf) {
                    row.meta.isTreeNodeClose = true;
                }
            });

            return rowsToHide;
        }

        closeSingleNode(rowIndex) {
            const rowsToHide = this.getChildrenToHideForNode(rowIndex);
            const visibleRows = this.bodyRenderer.visibleRowIndices;
            const rowsToShow = visibleRows
                .filter(rowIndex => !rowsToHide.includes(rowIndex))
                .sort(numberSortAsc);

            this.showRows(rowsToShow);
        }

        expandAllNodes() {
            let rows = this.datamanager.getRows();
            let rootNodes = rows.filter(row => !row.meta.isLeaf);

            const childrenToShow = rootNodes.map(row => this.getChildrenToShowForNode(row.meta.rowIndex)).flat();
            const visibleRowIndices = this.bodyRenderer.visibleRowIndices;
            const rowsToShow = uniq$1([...childrenToShow, ...visibleRowIndices]).sort(numberSortAsc);

            this.showRows(rowsToShow);
        }

        collapseAllNodes() {
            let rows = this.datamanager.getRows();
            let rootNodes = rows.filter(row => row.meta.indent === 0);

            const rowsToHide = rootNodes.map(row => this.getChildrenToHideForNode(row.meta.rowIndex)).flat();
            const visibleRows = this.bodyRenderer.visibleRowIndices;
            const rowsToShow = visibleRows
                .filter(rowIndex => !rowsToHide.includes(rowIndex))
                .sort(numberSortAsc);

            this.showRows(rowsToShow);
        }

        setTreeDepth(depth) {
            let rows = this.datamanager.getRows();

            const rowsToOpen = rows.filter(row => row.meta.indent < depth);
            const rowsToClose = rows.filter(row => row.meta.indent >= depth);
            const rowsToHide = rowsToClose.filter(row => row.meta.indent > depth);

            rowsToClose.forEach(row => {
                if (!row.meta.isLeaf) {
                    row.meta.isTreeNodeClose = true;
                }
            });
            rowsToOpen.forEach(row => {
                if (!row.meta.isLeaf) {
                    row.meta.isTreeNodeClose = false;
                }
            });

            const rowsToShow = rows
                .filter(row => !rowsToHide.includes(row))
                .map(row => row.meta.rowIndex)
                .sort(numberSortAsc);
            this.showRows(rowsToShow);
        }

        getRow$(rowIndex) {
            return $(this.selector(rowIndex), this.bodyScrollable);
        }

        getTotalRows() {
            return this.datamanager.getRowCount();
        }

        getFirstRowIndex() {
            return 0;
        }

        getLastRowIndex() {
            return this.datamanager.getRowCount() - 1;
        }

        scrollToRow(rowIndex) {
            rowIndex = +rowIndex;
            this._lastScrollTo = this._lastScrollTo || 0;
            const $row = this.getRow$(rowIndex);
            if ($.inViewport($row, this.bodyScrollable)) return;

            const {
                height
            } = $row.getBoundingClientRect();
            const {
                top,
                bottom
            } = this.bodyScrollable.getBoundingClientRect();
            const rowsInView = Math.floor((bottom - top) / height);

            let offset = 0;
            if (rowIndex > this._lastScrollTo) {
                offset = height * ((rowIndex + 1) - rowsInView);
            } else {
                offset = height * ((rowIndex + 1) - 1);
            }

            this._lastScrollTo = rowIndex;
            $.scrollTop(this.bodyScrollable, offset);
        }

        getRowHTML(row, props) {
            const dataAttr = makeDataAttributeString(props);
            let rowIdentifier = props.rowIndex;

            if (props.isFilter) {
                row = row.map(cell => (Object.assign({}, cell, {
                    content: this.getFilterInput({
                        colIndex: cell.colIndex
                    }),
                    isFilter: 1,
                    isHeader: undefined,
                    editable: false
                })));

                rowIdentifier = 'filter';
            }

            if (props.isHeader) {
                rowIdentifier = 'header';
            }

            return `
            <div class="dt-row dt-row-${rowIdentifier}" ${dataAttr}>
                ${row.map(cell => this.cellmanager.getCellHTML(cell)).join('')}
            </div>
        `;
        }

        getFilterInput(props) {
            const dataAttr = makeDataAttributeString(props);
            return `<input class="dt-filter dt-input" type="text" ${dataAttr} tabindex="1" />`;
        }

        selector(rowIndex) {
            return `.dt-row-${rowIndex}`;
        }
    }

    var hyperlist = createCommonjsModule(function (module, exports) {
    (function(f){{module.exports=f();}})(function(){return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof commonjsRequire&&commonjsRequire;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t);}return n[i].exports}for(var u="function"==typeof commonjsRequire&&commonjsRequire,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(_dereq_,module,exports){

    // Default configuration.

    Object.defineProperty(exports, "__esModule", {
      value: true
    });

    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    var defaultConfig = {
      width: '100%',
      height: '100%'

      // Check for valid number.
    };var isNumber = function isNumber(input) {
      return Number(input) === Number(input);
    };

    // Add a class to an element.
    var addClass = 'classList' in document.documentElement ? function (element, className) {
      element.classList.add(className);
    } : function (element, className) {
      var oldClass = element.getAttribute('class') || '';
      element.setAttribute('class', oldClass + ' ' + className);
    };

    /**
     * Creates a HyperList instance that virtually scrolls very large amounts of
     * data effortlessly.
     */

    var HyperList = function () {
      _createClass(HyperList, null, [{
        key: 'create',
        value: function create(element, userProvidedConfig) {
          return new HyperList(element, userProvidedConfig);
        }

        /**
         * Merge given css style on an element
         * @param {DOMElement} element
         * @param {Object} style
         */

      }, {
        key: 'mergeStyle',
        value: function mergeStyle(element, style) {
          for (var i in style) {
            if (element.style[i] !== style[i]) {
              element.style[i] = style[i];
            }
          }
        }
      }, {
        key: 'getMaxBrowserHeight',
        value: function getMaxBrowserHeight() {
          // Create two elements, the wrapper is `1px` tall and is transparent and
          // positioned at the top of the page. Inside that is an element that gets
          // set to 1 billion pixels. Then reads the max height the browser can
          // calculate.
          var wrapper = document.createElement('div');
          var fixture = document.createElement('div');

          // As said above, these values get set to put the fixture elements into the
          // right visual state.
          HyperList.mergeStyle(wrapper, { position: 'absolute', height: '1px', opacity: 0 });
          HyperList.mergeStyle(fixture, { height: '1e7px' });

          // Add the fixture into the wrapper element.
          wrapper.appendChild(fixture);

          // Apply to the page, the values won't kick in unless this is attached.
          document.body.appendChild(wrapper);

          // Get the maximum element height in pixels.
          var maxElementHeight = fixture.offsetHeight;

          // Remove the element immediately after reading the value.
          document.body.removeChild(wrapper);

          return maxElementHeight;
        }
      }]);

      function HyperList(element, userProvidedConfig) {
        var _this = this;

        _classCallCheck(this, HyperList);

        this._config = {};
        this._lastRepaint = null;
        this._maxElementHeight = HyperList.getMaxBrowserHeight();

        this.refresh(element, userProvidedConfig);

        var config = this._config;

        // Create internal render loop.
        var render = function render() {
          var scrollTop = _this._getScrollPosition();
          var lastRepaint = _this._lastRepaint;

          _this._renderAnimationFrame = window.requestAnimationFrame(render);

          if (scrollTop === lastRepaint) {
            return;
          }

          var diff = lastRepaint ? scrollTop - lastRepaint : 0;
          if (!lastRepaint || diff < 0 || diff > _this._averageHeight) {
            var rendered = _this._renderChunk();

            _this._lastRepaint = scrollTop;

            if (rendered !== false && typeof config.afterRender === 'function') {
              config.afterRender();
            }
          }
        };

        render();
      }

      _createClass(HyperList, [{
        key: 'destroy',
        value: function destroy() {
          window.cancelAnimationFrame(this._renderAnimationFrame);
        }
      }, {
        key: 'refresh',
        value: function refresh(element, userProvidedConfig) {
          var _scrollerStyle;

          Object.assign(this._config, defaultConfig, userProvidedConfig);

          if (!element || element.nodeType !== 1) {
            throw new Error('HyperList requires a valid DOM Node container');
          }

          this._element = element;

          var config = this._config;

          var scroller = this._scroller || config.scroller || document.createElement(config.scrollerTagName || 'tr');

          // Default configuration option `useFragment` to `true`.
          if (typeof config.useFragment !== 'boolean') {
            this._config.useFragment = true;
          }

          if (!config.generate) {
            throw new Error('Missing required `generate` function');
          }

          if (!isNumber(config.total)) {
            throw new Error('Invalid required `total` value, expected number');
          }

          if (!Array.isArray(config.itemHeight) && !isNumber(config.itemHeight)) {
            throw new Error('\n        Invalid required `itemHeight` value, expected number or array\n      '.trim());
          } else if (isNumber(config.itemHeight)) {
            this._itemHeights = Array(config.total).fill(config.itemHeight);
          } else {
            this._itemHeights = config.itemHeight;
          }

          // Width and height should be coerced to string representations. Either in
          // `%` or `px`.
          Object.keys(defaultConfig).filter(function (prop) {
            return prop in config;
          }).forEach(function (prop) {
            var value = config[prop];
            var isValueNumber = isNumber(value);

            if (value && typeof value !== 'string' && typeof value !== 'number') {
              var msg = 'Invalid optional `' + prop + '`, expected string or number';
              throw new Error(msg);
            } else if (isValueNumber) {
              config[prop] = value + 'px';
            }
          });

          var isHoriz = Boolean(config.horizontal);
          var value = config[isHoriz ? 'width' : 'height'];

          if (value) {
            var isValueNumber = isNumber(value);
            var isValuePercent = isValueNumber ? false : value.slice(-1) === '%';
            // Compute the containerHeight as number
            var numberValue = isValueNumber ? value : parseInt(value.replace(/px|%/, ''), 10);
            var innerSize = window[isHoriz ? 'innerWidth' : 'innerHeight'];

            if (isValuePercent) {
              this._containerSize = innerSize * numberValue / 100;
            } else {
              this._containerSize = isNumber(value) ? value : numberValue;
            }
          }

          var scrollContainer = config.scrollContainer;
          var scrollerHeight = config.itemHeight * config.total;
          var maxElementHeight = this._maxElementHeight;

          if (scrollerHeight > maxElementHeight) {
            console.warn(['HyperList: The maximum element height', maxElementHeight + 'px has', 'been exceeded; please reduce your item height.'].join(' '));
          }

          // Decorate the container element with styles that will match
          // the user supplied configuration.
          var elementStyle = {
            width: '' + config.width,
            height: scrollContainer ? scrollerHeight + 'px' : '' + config.height,
            overflow: scrollContainer ? 'none' : 'auto',
            position: 'relative'
          };

          HyperList.mergeStyle(element, elementStyle);

          if (scrollContainer) {
            HyperList.mergeStyle(config.scrollContainer, { overflow: 'auto' });
          }

          var scrollerStyle = (_scrollerStyle = {
            opacity: '0',
            position: 'absolute'
          }, _defineProperty(_scrollerStyle, isHoriz ? 'height' : 'width', '1px'), _defineProperty(_scrollerStyle, isHoriz ? 'width' : 'height', scrollerHeight + 'px'), _scrollerStyle);

          HyperList.mergeStyle(scroller, scrollerStyle);

          // Only append the scroller element once.
          if (!this._scroller) {
            element.appendChild(scroller);
          }

          var padding = this._computeScrollPadding();
          this._scrollPaddingBottom = padding.bottom;
          this._scrollPaddingTop = padding.top;

          // Set the scroller instance.
          this._scroller = scroller;
          this._scrollHeight = this._computeScrollHeight();

          // Reuse the item positions if refreshed, otherwise set to empty array.
          this._itemPositions = this._itemPositions || Array(config.total).fill(0);

          // Each index in the array should represent the position in the DOM.
          this._computePositions(0);

          // Render after refreshing. Force render if we're calling refresh manually.
          this._renderChunk(this._lastRepaint !== null);

          if (typeof config.afterRender === 'function') {
            config.afterRender();
          }
        }
      }, {
        key: '_getRow',
        value: function _getRow(i) {
          var config = this._config;
          var item = config.generate(i);
          var height = item.height;

          if (height !== undefined && isNumber(height)) {
            item = item.element;

            // The height isn't the same as predicted, compute positions again
            if (height !== this._itemHeights[i]) {
              this._itemHeights[i] = height;
              this._computePositions(i);
              this._scrollHeight = this._computeScrollHeight(i);
            }
          } else {
            height = this._itemHeights[i];
          }

          if (!item || item.nodeType !== 1) {
            throw new Error('Generator did not return a DOM Node for index: ' + i);
          }

          addClass(item, config.rowClassName || 'vrow');

          var top = this._itemPositions[i] + this._scrollPaddingTop;

          HyperList.mergeStyle(item, _defineProperty({
            position: 'absolute'
          }, config.horizontal ? 'left' : 'top', top + 'px'));

          return item;
        }
      }, {
        key: '_getScrollPosition',
        value: function _getScrollPosition() {
          var config = this._config;

          if (typeof config.overrideScrollPosition === 'function') {
            return config.overrideScrollPosition();
          }

          return this._element[config.horizontal ? 'scrollLeft' : 'scrollTop'];
        }
      }, {
        key: '_renderChunk',
        value: function _renderChunk(force) {
          var config = this._config;
          var element = this._element;
          var scrollTop = this._getScrollPosition();
          var total = config.total;

          var from = config.reverse ? this._getReverseFrom(scrollTop) : this._getFrom(scrollTop) - 1;

          if (from < 0 || from - this._screenItemsLen < 0) {
            from = 0;
          }

          if (!force && this._lastFrom === from) {
            return false;
          }

          this._lastFrom = from;

          var to = from + this._cachedItemsLen;

          if (to > total || to + this._cachedItemsLen > total) {
            to = total;
          }

          // Append all the new rows in a document fragment that we will later append
          // to the parent node
          var fragment = config.useFragment ? document.createDocumentFragment() : []
          // Sometimes you'll pass fake elements to this tool and Fragments require
          // real elements.


          // The element that forces the container to scroll.
          ;var scroller = this._scroller;

          // Keep the scroller in the list of children.
          fragment[config.useFragment ? 'appendChild' : 'push'](scroller);

          for (var i = from; i < to; i++) {
            var row = this._getRow(i);

            fragment[config.useFragment ? 'appendChild' : 'push'](row);
          }

          if (config.applyPatch) {
            return config.applyPatch(element, fragment);
          }

          element.innerHTML = '';
          element.appendChild(fragment);
        }
      }, {
        key: '_computePositions',
        value: function _computePositions() {
          var from = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;

          var config = this._config;
          var total = config.total;
          var reverse = config.reverse;

          if (from < 1 && !reverse) {
            from = 1;
          }

          for (var i = from; i < total; i++) {
            if (reverse) {
              if (i === 0) {
                this._itemPositions[0] = this._scrollHeight - this._itemHeights[0];
              } else {
                this._itemPositions[i] = this._itemPositions[i - 1] - this._itemHeights[i];
              }
            } else {
              this._itemPositions[i] = this._itemHeights[i - 1] + this._itemPositions[i - 1];
            }
          }
        }
      }, {
        key: '_computeScrollHeight',
        value: function _computeScrollHeight() {
          var _HyperList$mergeStyle2,
              _this2 = this;

          var config = this._config;
          var isHoriz = Boolean(config.horizontal);
          var total = config.total;
          var scrollHeight = this._itemHeights.reduce(function (a, b) {
            return a + b;
          }, 0) + this._scrollPaddingBottom + this._scrollPaddingTop;

          HyperList.mergeStyle(this._scroller, (_HyperList$mergeStyle2 = {
            opacity: 0,
            position: 'absolute',
            top: '0px'
          }, _defineProperty(_HyperList$mergeStyle2, isHoriz ? 'height' : 'width', '1px'), _defineProperty(_HyperList$mergeStyle2, isHoriz ? 'width' : 'height', scrollHeight + 'px'), _HyperList$mergeStyle2));

          // Calculate the height median
          var sortedItemHeights = this._itemHeights.slice(0).sort(function (a, b) {
            return a - b;
          });
          var middle = Math.floor(total / 2);
          var averageHeight = total % 2 === 0 ? (sortedItemHeights[middle] + sortedItemHeights[middle - 1]) / 2 : sortedItemHeights[middle];

          var clientProp = isHoriz ? 'clientWidth' : 'clientHeight';
          var element = config.scrollContainer ? config.scrollContainer : this._element;
          var containerHeight = element[clientProp] ? element[clientProp] : this._containerSize;
          this._screenItemsLen = Math.ceil(containerHeight / averageHeight);
          this._containerSize = containerHeight;

          // Cache 3 times the number of items that fit in the container viewport.
          this._cachedItemsLen = Math.max(this._cachedItemsLen || 0, this._screenItemsLen * 3);
          this._averageHeight = averageHeight;

          if (config.reverse) {
            window.requestAnimationFrame(function () {
              if (isHoriz) {
                _this2._element.scrollLeft = scrollHeight;
              } else {
                _this2._element.scrollTop = scrollHeight;
              }
            });
          }

          return scrollHeight;
        }
      }, {
        key: '_computeScrollPadding',
        value: function _computeScrollPadding() {
          var config = this._config;
          var isHoriz = Boolean(config.horizontal);
          var isReverse = config.reverse;
          var styles = window.getComputedStyle(this._element);

          var padding = function padding(location) {
            var cssValue = styles.getPropertyValue('padding-' + location);
            return parseInt(cssValue, 10) || 0;
          };

          if (isHoriz && isReverse) {
            return {
              bottom: padding('left'),
              top: padding('right')
            };
          } else if (isHoriz) {
            return {
              bottom: padding('right'),
              top: padding('left')
            };
          } else if (isReverse) {
            return {
              bottom: padding('top'),
              top: padding('bottom')
            };
          } else {
            return {
              bottom: padding('bottom'),
              top: padding('top')
            };
          }
        }
      }, {
        key: '_getFrom',
        value: function _getFrom(scrollTop) {
          var i = 0;

          while (this._itemPositions[i] < scrollTop) {
            i++;
          }

          return i;
        }
      }, {
        key: '_getReverseFrom',
        value: function _getReverseFrom(scrollTop) {
          var i = this._config.total - 1;

          while (i > 0 && this._itemPositions[i] < scrollTop + this._containerSize) {
            i--;
          }

          return i;
        }
      }]);

      return HyperList;
    }();

    exports.default = HyperList;
    module.exports = exports['default'];

    },{}]},{},[1])(1)
    });
    });

    var HyperList = unwrapExports(hyperlist);

    class BodyRenderer {
        constructor(instance) {
            this.instance = instance;
            this.options = instance.options;
            this.datamanager = instance.datamanager;
            this.rowmanager = instance.rowmanager;
            this.cellmanager = instance.cellmanager;
            this.bodyScrollable = instance.bodyScrollable;
            this.footer = this.instance.footer;
            this.log = instance.log;
        }

        renderRows(rows) {
            this.visibleRows = rows;
            this.visibleRowIndices = rows.map(row => row.meta.rowIndex);

            if (rows.length === 0) {
                this.bodyScrollable.innerHTML = this.getNoDataHTML();
                return;
            }

            const rowViewOrder = this.datamanager.rowViewOrder.map(index => {
                if (this.visibleRowIndices.includes(index)) {
                    return index;
                }
                return null;
            }).filter(index => index !== null);

            const computedStyle = getComputedStyle(this.bodyScrollable);

            let config = {
                width: computedStyle.width,
                height: computedStyle.height,
                itemHeight: this.options.cellHeight,
                total: rows.length,
                generate: (index) => {
                    const el = document.createElement('div');
                    const rowIndex = rowViewOrder[index];
                    const row = this.datamanager.getRow(rowIndex);
                    const rowHTML = this.rowmanager.getRowHTML(row, row.meta);
                    el.innerHTML = rowHTML;
                    return el.children[0];
                },
                afterRender: () => {
                    this.restoreState();
                }
            };

            if (!this.hyperlist) {
                this.hyperlist = new HyperList(this.bodyScrollable, config);
            } else {
                this.hyperlist.refresh(this.bodyScrollable, config);
            }

            this.renderFooter();
        }

        render() {
            const rows = this.datamanager.getRowsForView();
            this.renderRows(rows);
            // setDimensions requires atleast 1 row to exist in dom
            this.instance.setDimensions();
        }

        renderFooter() {
            if (!this.options.showTotalRow) return;

            const totalRow = this.getTotalRow();
            let html = this.rowmanager.getRowHTML(totalRow, { isTotalRow: 1, rowIndex: 'totalRow' });

            this.footer.innerHTML = html;
        }

        getTotalRow() {
            const columns = this.datamanager.getColumns();
            const totalRowTemplate = columns.map(col => {
                let content = null;
                if (['_rowIndex', '_checkbox'].includes(col.id)) {
                    content = '';
                }
                return {
                    content,
                    isTotalRow: 1,
                    colIndex: col.colIndex,
                    column: col
                };
            });

            const totalRow = totalRowTemplate.map((cell, i) => {
                if (cell.content === '') return cell;

                if (this.options.hooks.columnTotal) {
                    const columnValues = this.visibleRows.map(row => row[i].content);
                    const result = this.options.hooks.columnTotal.call(this.instance, columnValues, cell);
                    if (result != null) {
                        cell.content = result;
                        return cell;
                    }
                }

                cell.content = this.visibleRows.reduce((acc, prevRow) => {
                    const prevCell = prevRow[i];
                    if (typeof prevCell.content === 'number') {
                        if (acc == null) acc = 0;
                        return acc + prevCell.content;
                    }
                    return acc;
                }, cell.content);

                return cell;
            });

            return totalRow;
        }

        restoreState() {
            this.rowmanager.highlightCheckedRows();
            this.cellmanager.selectAreaOnClusterChanged();
            this.cellmanager.focusCellOnClusterChanged();
        }

        showToastMessage(message, hideAfter) {
            this.instance.toastMessage.innerHTML = this.getToastMessageHTML(message);

            if (hideAfter) {
                setTimeout(() => {
                    this.clearToastMessage();
                }, hideAfter * 1000);
            }
        }

        clearToastMessage() {
            this.instance.toastMessage.innerHTML = '';
        }

        getNoDataHTML() {
            return `<div class="dt-scrollable__no-data">${this.options.noDataMessage}</div>`;
        }

        getToastMessageHTML(message) {
            return `<span class="dt-toast__message">${message}</span>`;
        }
    }

    class Style {
        constructor(instance) {
            this.instance = instance;

            linkProperties(this, this.instance, [
                'options', 'datamanager', 'columnmanager',
                'header', 'footer', 'bodyScrollable', 'datatableWrapper',
                'getColumn', 'bodyRenderer'
            ]);

            this.scopeClass = 'dt-instance-' + instance.constructor.instances;
            instance.datatableWrapper.classList.add(this.scopeClass);

            const styleEl = document.createElement('style');
            instance.wrapper.insertBefore(styleEl, instance.datatableWrapper);
            this.styleEl = styleEl;

            this.bindResizeWindow();
            this.bindScrollHeader();
        }

        get stylesheet() {
            return this.styleEl.sheet;
        }

        bindResizeWindow() {
            this.onWindowResize = this.onWindowResize.bind(this);
            this.onWindowResize = throttle$1(this.onWindowResize, 300);

            if (this.options.layout === 'fluid') {
                $.on(window, 'resize', this.onWindowResize);
            }
        }

        bindScrollHeader() {
            this._settingHeaderPosition = false;

            $.on(this.bodyScrollable, 'scroll', (e) => {
                if (this._settingHeaderPosition) return;

                this._settingHeaderPosition = true;

                requestAnimationFrame(() => {
                    const left = -e.target.scrollLeft;

                    $.style(this.header, {
                        transform: `translateX(${left}px)`
                    });
                    $.style(this.footer, {
                        transform: `translateX(${left}px)`
                    });
                    this._settingHeaderPosition = false;
                });
            });
        }

        onWindowResize() {
            this.distributeRemainingWidth();
            this.refreshColumnWidth();
            this.setBodyStyle();
        }

        destroy() {
            this.styleEl.remove();
            $.off(window, 'resize', this.onWindowResize);
        }

        setStyle(selector, styleObject) {
            if (selector.includes(',')) {
                selector.split(',')
                    .map(s => s.trim())
                    .forEach(selector => {
                        this.setStyle(selector, styleObject);
                    });
                return;
            }

            selector = selector.trim();
            if (!selector) return;

            this._styleRulesMap = this._styleRulesMap || {};
            const prefixedSelector = this._getPrefixedSelector(selector);

            if (this._styleRulesMap[prefixedSelector]) {
                this.removeStyle(selector);

                // merge with old styleobject
                styleObject = Object.assign({}, this._styleRulesMap[prefixedSelector], styleObject);
            }

            const styleString = this._getRuleString(styleObject);
            const ruleString = `${prefixedSelector} { ${styleString} }`;

            this._styleRulesMap[prefixedSelector] = styleObject;
            this.stylesheet.insertRule(ruleString);
        }

        removeStyle(selector) {
            if (selector.includes(',')) {
                selector.split(',')
                    .map(s => s.trim())
                    .forEach(selector => {
                        this.removeStyle(selector);
                    });
                return;
            }

            selector = selector.trim();
            if (!selector) return;

            // find and remove
            const prefixedSelector = this._getPrefixedSelector(selector);
            const index = Array.from(this.stylesheet.cssRules)
                .findIndex(rule => rule.selectorText === prefixedSelector);

            if (index === -1) return;
            this.stylesheet.deleteRule(index);
        }

        _getPrefixedSelector(selector) {
            return `.${this.scopeClass} ${selector}`;
        }

        _getRuleString(styleObject) {
            return Object.keys(styleObject)
                .map(prop => {
                    let dashed = prop;
                    if (!prop.includes('-')) {
                        dashed = camelCaseToDash(prop);
                    }
                    return `${dashed}:${styleObject[prop]};`;
                })
                .join('');
        }

        setDimensions() {
            this.setCellHeight();
            this.setupMinWidth();
            this.setupNaturalColumnWidth();
            this.setupColumnWidth();
            this.distributeRemainingWidth();
            this.setColumnStyle();
            this.setBodyStyle();
        }

        setCellHeight() {
            this.setStyle('.dt-cell', {
                height: this.options.cellHeight + 'px'
            });
        }

        setupMinWidth() {
            $.each('.dt-cell--header', this.header).map(col => {
                const { colIndex } = $.data(col);
                const column = this.getColumn(colIndex);

                if (!column.minWidth) {
                    const width = $.style($('.dt-cell__content', col), 'width');
                    // only set this once
                    column.minWidth = width;
                }
            });
        }

        setupNaturalColumnWidth() {
            if (!$('.dt-row')) return;

            $.each('.dt-row-header .dt-cell', this.header).map($headerCell => {
                const { colIndex } = $.data($headerCell);
                const column = this.datamanager.getColumn(colIndex);
                let width = $.style($('.dt-cell__content', $headerCell), 'width');
                if (typeof width === 'number' && width >= this.options.minimumColumnWidth) {
                    column.naturalWidth = width;
                } else {
                    column.naturalWidth = this.options.minimumColumnWidth;
                }
            });

            // set initial width as naturally calculated by table's first row
            $.each('.dt-row-0 .dt-cell', this.bodyScrollable).map($cell => {
                const {
                    colIndex
                } = $.data($cell);
                const column = this.datamanager.getColumn(colIndex);

                let naturalWidth = $.style($('.dt-cell__content', $cell), 'width');

                if (column.id === '_rowIndex') {
                    naturalWidth = this.getRowIndexColumnWidth();
                    column.width = naturalWidth;
                }

                if (typeof naturalWidth === 'number' && naturalWidth >= column.naturalWidth) {
                    column.naturalWidth = naturalWidth;
                } else {
                    column.naturalWidth = column.naturalWidth;
                }
            });
        }

        setupColumnWidth() {
            if (this.options.layout === 'ratio') {
                let totalWidth = $.style(this.datatableWrapper, 'width');

                if (this.options.serialNoColumn) {
                    const rowIndexColumn = this.datamanager.getColumnById('_rowIndex');
                    totalWidth = totalWidth - rowIndexColumn.width - 1;
                }

                if (this.options.checkboxColumn) {
                    const rowIndexColumn = this.datamanager.getColumnById('_checkbox');
                    totalWidth = totalWidth - rowIndexColumn.width - 1;
                }

                const totalParts = this.datamanager.getColumns()
                    .map(column => {
                        if (column.id === '_rowIndex' || column.id === '_checkbox') {
                            return 0;
                        }
                        if (!column.width) {
                            column.width = 1;
                        }
                        column.ratioWidth = parseInt(column.width, 10);
                        return column.ratioWidth;
                    })
                    .reduce((a, c) => a + c);

                const onePart = totalWidth / totalParts;

                this.datamanager.getColumns()
                    .map(column => {
                        if (column.id === '_rowIndex' || column.id === '_checkbox') return;
                        column.width = Math.floor(onePart * column.ratioWidth) - 1;
                    });
            } else {
                this.datamanager.getColumns()
                    .map(column => {
                        if (!column.width) {
                            column.width = column.naturalWidth;
                        }
                        if (column.width < this.options.minimumColumnWidth) {
                            column.width = this.options.minimumColumnWidth;
                        }
                    });
            }
        }

        distributeRemainingWidth() {
            if (this.options.layout !== 'fluid') return;

            const wrapperWidth = $.style(this.instance.datatableWrapper, 'width');
            let firstRow = $('.dt-row', this.bodyScrollable);
            let firstRowWidth = wrapperWidth;
            if (!firstRow) {
                let headerRow = $('.dt-row', this.instance.header);
                let cellWidths = Array.from(headerRow.children)
                    .map(cell => cell.offsetWidth);
                firstRowWidth = cellWidths.reduce((sum, a) => sum + a, 0);
            } else {
                firstRowWidth = $.style(firstRow, 'width');
            }
            const resizableColumns = this.datamanager.getColumns().filter(col => col.resizable);
            const deltaWidth = (wrapperWidth - firstRowWidth) / resizableColumns.length;

            resizableColumns.map(col => {
                const width = $.style(this.getColumnHeaderElement(col.colIndex), 'width');
                let finalWidth = Math.floor(width + deltaWidth) - 2;

                this.datamanager.updateColumn(col.colIndex, {
                    width: finalWidth
                });
            });
        }

        setColumnStyle() {
            // align columns
            this.datamanager.getColumns()
                .map(column => {
                    // alignment
                    if (!column.align) {
                        column.align = 'left';
                    }
                    if (!['left', 'center', 'right'].includes(column.align)) {
                        column.align = 'left';
                    }
                    this.setStyle(`.dt-cell--col-${column.colIndex}`, {
                        'text-align': column.align
                    });

                    // width
                    this.columnmanager.setColumnHeaderWidth(column.colIndex);
                    this.columnmanager.setColumnWidth(column.colIndex);
                });
        }

        refreshColumnWidth() {
            this.datamanager.getColumns()
                .map(column => {
                    this.columnmanager.setColumnHeaderWidth(column.colIndex);
                    this.columnmanager.setColumnWidth(column.colIndex);
                });
        }

        setBodyStyle() {
            const bodyWidth = $.style(this.datatableWrapper, 'width');
            const firstRow = $('.dt-row', this.bodyScrollable);
            if (!firstRow) return;
            const rowWidth = $.style(firstRow, 'width');

            let width = bodyWidth > rowWidth ? rowWidth : bodyWidth;
            $.style(this.bodyScrollable, {
                width: width + 'px'
            });

            // remove the body height, so that it resets to it's original
            $.removeStyle(this.bodyScrollable, 'height');

            // when there are less rows than the container
            // adapt the container height
            let bodyHeight = $.getStyle(this.bodyScrollable, 'height');
            const scrollHeight = (this.bodyRenderer.hyperlist || {})._scrollHeight || Infinity;
            const hasHorizontalOverflow = $.hasHorizontalOverflow(this.bodyScrollable);

            let height;

            if (scrollHeight < bodyHeight) {
                height = scrollHeight;

                // account for scrollbar size when
                // there is horizontal overflow
                if (hasHorizontalOverflow) {
                    height += $.scrollbarSize();
                }

                $.style(this.bodyScrollable, {
                    height: height + 'px'
                });
            }

            const verticalOverflow = this.bodyScrollable.scrollHeight - this.bodyScrollable.offsetHeight;
            if (verticalOverflow < $.scrollbarSize()) {
                // if verticalOverflow is less than scrollbar size
                // then most likely scrollbar is causing the scroll
                // which is not needed
                $.style(this.bodyScrollable, {
                    overflowY: 'hidden'
                });
            }

            if (this.options.layout === 'fluid') {
                $.style(this.bodyScrollable, {
                    overflowX: 'hidden'
                });
            }
        }

        getColumnHeaderElement(colIndex) {
            colIndex = +colIndex;
            if (colIndex < 0) return null;
            return $(`.dt-cell--col-${colIndex}`, this.header);
        }

        getRowIndexColumnWidth() {
            const rowCount = this.datamanager.getRowCount();
            const padding = 22;
            return $.measureTextWidth(rowCount + '') + padding;
        }
    }

    const KEYCODES = {
        13: 'enter',
        91: 'meta',
        16: 'shift',
        17: 'ctrl',
        18: 'alt',
        37: 'left',
        38: 'up',
        39: 'right',
        40: 'down',
        9: 'tab',
        27: 'esc',
        67: 'c',
        70: 'f',
        86: 'v'
    };

    class Keyboard {
        constructor(element) {
            this.listeners = {};
            $.on(element, 'keydown', this.handler.bind(this));
        }

        handler(e) {
            let key = KEYCODES[e.keyCode];

            if (e.shiftKey && key !== 'shift') {
                key = 'shift+' + key;
            }

            if ((e.ctrlKey && key !== 'ctrl') || (e.metaKey && key !== 'meta')) {
                key = 'ctrl+' + key;
            }

            const listeners = this.listeners[key];

            if (listeners && listeners.length > 0) {
                for (let listener of listeners) {
                    const preventBubbling = listener(e);
                    if (preventBubbling === undefined || preventBubbling === true) {
                        e.preventDefault();
                    }
                }
            }
        }

        on(key, listener) {
            const keys = key.split(',').map(k => k.trim());

            keys.map(key => {
                this.listeners[key] = this.listeners[key] || [];
                this.listeners[key].push(listener);
            });
        }
    }

    function filterRows(rows, filters) {
        let filteredRowIndices = [];

        if (Object.keys(filters).length === 0) {
            return rows.map(row => row.meta.rowIndex);
        }

        for (let colIndex in filters) {
            const keyword = filters[colIndex];

            const filteredRows = filteredRowIndices.length ?
                filteredRowIndices.map(i => rows[i]) :
                rows;

            const cells = filteredRows.map(row => row[colIndex]);

            let filter = guessFilter(keyword);
            let filterMethod = getFilterMethod(filter);

            if (filterMethod) {
                filteredRowIndices = filterMethod(filter.text, cells);
            } else {
                filteredRowIndices = cells.map(cell => cell.rowIndex);
            }
        }

        return filteredRowIndices;
    }
    function getFilterMethod(filter) {
        const stringCompareValue = cell =>
            String(stripHTML(cell.html || '') || cell.content || '').toLowerCase();

        const numberCompareValue = cell => parseFloat(cell.content);

        const getCompareValues = (cell, keyword) => {
            if (cell.column.compareValue) {
                const compareValues = cell.column.compareValue(cell, keyword);
                if (compareValues && Array.isArray(compareValues)) return compareValues;
            }

            // check if it can be converted to number
            const float = numberCompareValue(cell);
            if (!isNaN(float)) {
                return [float, keyword];
            }

            return [stringCompareValue(cell), keyword];
        };

        let filterMethodMap = {
            contains(keyword, cells) {
                return cells
                    .filter(cell => {
                        const hay = stringCompareValue(cell);
                        const needle = (keyword || '').toLowerCase();
                        return !needle || hay.includes(needle);
                    })
                    .map(cell => cell.rowIndex);
            },

            greaterThan(keyword, cells) {
                return cells
                    .filter(cell => {
                        const [compareValue, keywordValue] = getCompareValues(cell, keyword);
                        return compareValue > keywordValue;
                    })
                    .map(cell => cell.rowIndex);
            },

            lessThan(keyword, cells) {
                return cells
                    .filter(cell => {
                        const [compareValue, keywordValue] = getCompareValues(cell, keyword);
                        return compareValue < keywordValue;
                    })
                    .map(cell => cell.rowIndex);
            },

            equals(keyword, cells) {
                return cells
                    .filter(cell => {
                        const value = parseFloat(cell.content);
                        return value === keyword;
                    })
                    .map(cell => cell.rowIndex);
            },

            notEquals(keyword, cells) {
                return cells
                    .filter(cell => {
                        const value = parseFloat(cell.content);
                        return value !== keyword;
                    })
                    .map(cell => cell.rowIndex);
            },

            range(rangeValues, cells) {
                return cells
                    .filter(cell => {
                        const values1 = getCompareValues(cell, rangeValues[0]);
                        const values2 = getCompareValues(cell, rangeValues[1]);
                        const value = values1[0];
                        return value >= values1[1] && value <= values2[1];
                    })
                    .map(cell => cell.rowIndex);
            },

            containsNumber(keyword, cells) {
                return cells
                    .filter(cell => {
                        let number = parseFloat(keyword, 10);
                        let string = keyword;
                        let hayNumber = numberCompareValue(cell);
                        let hayString = stringCompareValue(cell);

                        return number === hayNumber || hayString.includes(string);
                    })
                    .map(cell => cell.rowIndex);
            }
        };

        return filterMethodMap[filter.type];
    }

    function guessFilter(keyword = '') {
        if (keyword.length === 0) return {};

        let compareString = keyword;

        if (['>', '<', '='].includes(compareString[0])) {
            compareString = keyword.slice(1);
        } else if (compareString.startsWith('!=')) {
            compareString = keyword.slice(2);
        }

        if (keyword.startsWith('>')) {
            if (compareString) {
                return {
                    type: 'greaterThan',
                    text: compareString.trim()
                };
            }
        }

        if (keyword.startsWith('<')) {
            if (compareString) {
                return {
                    type: 'lessThan',
                    text: compareString.trim()
                };
            }
        }

        if (keyword.startsWith('=')) {
            if (isNumber(compareString)) {
                return {
                    type: 'equals',
                    text: Number(keyword.slice(1).trim())
                };
            }
        }

        if (isNumber(compareString)) {
            return {
                type: 'containsNumber',
                text: compareString
            };
        }

        if (keyword.startsWith('!=')) {
            if (isNumber(compareString)) {
                return {
                    type: 'notEquals',
                    text: Number(keyword.slice(2).trim())
                };
            }
        }

        if (keyword.split(':').length === 2) {
            compareString = keyword.split(':');
            return {
                type: 'range',
                text: compareString.map(v => v.trim())
            };
        }

        return {
            type: 'contains',
            text: compareString.toLowerCase()
        };
    }

    var DEFAULT_OPTIONS = {
        columns: [],
        data: [],
        dropdownButton: icons.chevronDown,
        headerDropdown: [
            {
                label: 'Sort Ascending',
                action: function (column) {
                    this.sortColumn(column.colIndex, 'asc');
                }
            },
            {
                label: 'Sort Descending',
                action: function (column) {
                    this.sortColumn(column.colIndex, 'desc');
                }
            },
            {
                label: 'Reset sorting',
                action: function (column) {
                    this.sortColumn(column.colIndex, 'none');
                }
            },
            {
                label: 'Remove column',
                action: function (column) {
                    this.removeColumn(column.colIndex);
                }
            }
        ],
        events: {
            onRemoveColumn(column) {},
            onSwitchColumn(column1, column2) {},
            onSortColumn(column) {},
            onCheckRow(row) {},
            onDestroy() {}
        },
        hooks: {
            columnTotal: null
        },
        sortIndicator: {
            asc: '↑',
            desc: '↓',
            none: ''
        },
        overrideComponents: {
            // ColumnManager: CustomColumnManager
        },
        filterRows: filterRows,
        freezeMessage: '',
        getEditor: null,
        serialNoColumn: true,
        checkboxColumn: false,
        clusterize: true,
        logs: false,
        layout: 'fixed', // fixed, fluid, ratio
        noDataMessage: 'No Data',
        cellHeight: 40,
        minimumColumnWidth: 30,
        inlineFilters: false,
        treeView: false,
        checkedRowStatus: true,
        dynamicRowHeight: false,
        pasteFromClipboard: false,
        showTotalRow: false,
        direction: 'ltr',
        disableReorderColumn: false
    };

    let defaultComponents = {
        DataManager,
        CellManager,
        ColumnManager,
        RowManager,
        BodyRenderer,
        Style,
        Keyboard
    };

    class DataTable {
        constructor(wrapper, options) {
            DataTable.instances++;

            if (typeof wrapper === 'string') {
                // css selector
                wrapper = document.querySelector(wrapper);
            }
            this.wrapper = wrapper;
            if (!(this.wrapper instanceof HTMLElement)) {
                throw new Error('Invalid argument given for `wrapper`');
            }

            this.buildOptions(options);
            this.prepare();
            this.initializeComponents();

            if (this.options.data) {
                this.refresh();
                this.columnmanager.applyDefaultSortOrder();
            }
        }

        buildOptions(options) {
            this.options = this.options || {};

            this.options = Object.assign(
                {}, DEFAULT_OPTIONS,
                this.options || {}, options
            );

            options.headerDropdown = options.headerDropdown || [];
            this.options.headerDropdown = [
                ...DEFAULT_OPTIONS.headerDropdown,
                ...options.headerDropdown
            ];

            // custom user events
            this.events = Object.assign(
                {}, DEFAULT_OPTIONS.events,
                this.options.events || {},
                options.events || {}
            );
            this.fireEvent = this.fireEvent.bind(this);
        }

        prepare() {
            this.prepareDom();
            this.unfreeze();
        }

        initializeComponents() {
            let components = Object.assign({}, defaultComponents, this.options.overrideComponents);
            let {
                Style: Style$$1,
                Keyboard: Keyboard$$1,
                DataManager: DataManager$$1,
                RowManager: RowManager$$1,
                ColumnManager: ColumnManager$$1,
                CellManager: CellManager$$1,
                BodyRenderer: BodyRenderer$$1
            } = components;

            this.style = new Style$$1(this);
            this.keyboard = new Keyboard$$1(this.wrapper);
            this.datamanager = new DataManager$$1(this.options);
            this.rowmanager = new RowManager$$1(this);
            this.columnmanager = new ColumnManager$$1(this);
            this.cellmanager = new CellManager$$1(this);
            this.bodyRenderer = new BodyRenderer$$1(this);
        }

        prepareDom() {
            this.wrapper.innerHTML = `
            <div class="datatable" dir="${this.options.direction}">
                <div class="dt-header"></div>
                <div class="dt-scrollable"></div>
                <div class="dt-footer"></div>
                <div class="dt-freeze">
                    <span class="dt-freeze__message">
                        ${this.options.freezeMessage}
                    </span>
                </div>
                <div class="dt-toast"></div>
                <div class="dt-dropdown-container"></div>
                <textarea class="dt-paste-target"></textarea>
            </div>
        `;

            this.datatableWrapper = $('.datatable', this.wrapper);
            this.header = $('.dt-header', this.wrapper);
            this.footer = $('.dt-footer', this.wrapper);
            this.bodyScrollable = $('.dt-scrollable', this.wrapper);
            this.freezeContainer = $('.dt-freeze', this.wrapper);
            this.toastMessage = $('.dt-toast', this.wrapper);
            this.pasteTarget = $('.dt-paste-target', this.wrapper);
            this.dropdownContainer = $('.dt-dropdown-container', this.wrapper);
        }

        refresh(data, columns) {
            this.datamanager.init(data, columns);
            this.render();
            this.setDimensions();
        }

        destroy() {
            this.wrapper.innerHTML = '';
            this.style.destroy();
            this.fireEvent('onDestroy');
        }

        appendRows(rows) {
            this.datamanager.appendRows(rows);
            this.rowmanager.refreshRows();
        }

        refreshRow(row, rowIndex) {
            this.rowmanager.refreshRow(row, rowIndex);
        }

        render() {
            this.renderHeader();
            this.renderBody();
        }

        renderHeader() {
            this.columnmanager.renderHeader();
        }

        renderBody() {
            this.bodyRenderer.render();
        }

        setDimensions() {
            this.style.setDimensions();
        }

        showToastMessage(message, hideAfter) {
            this.bodyRenderer.showToastMessage(message, hideAfter);
        }

        clearToastMessage() {
            this.bodyRenderer.clearToastMessage();
        }

        getColumn(colIndex) {
            return this.datamanager.getColumn(colIndex);
        }

        getColumns() {
            return this.datamanager.getColumns();
        }

        getRows() {
            return this.datamanager.getRows();
        }

        getCell(colIndex, rowIndex) {
            return this.datamanager.getCell(colIndex, rowIndex);
        }

        getColumnHeaderElement(colIndex) {
            return this.columnmanager.getColumnHeaderElement(colIndex);
        }

        getViewportHeight() {
            if (!this.viewportHeight) {
                this.viewportHeight = $.style(this.bodyScrollable, 'height');
            }

            return this.viewportHeight;
        }

        sortColumn(colIndex, sortOrder) {
            this.columnmanager.sortColumn(colIndex, sortOrder);
        }

        removeColumn(colIndex) {
            this.columnmanager.removeColumn(colIndex);
        }

        scrollToLastColumn() {
            this.datatableWrapper.scrollLeft = 9999;
        }

        freeze() {
            $.style(this.freezeContainer, {
                display: ''
            });
        }

        unfreeze() {
            $.style(this.freezeContainer, {
                display: 'none'
            });
        }

        updateOptions(options) {
            this.buildOptions(options);
        }

        fireEvent(eventName, ...args) {
            // fire internalEventHandlers if any
            // and then user events
            const handlers = [
                ...(this._internalEventHandlers[eventName] || []),
                this.events[eventName]
            ].filter(Boolean);

            for (let handler of handlers) {
                handler.apply(this, args);
            }
        }

        on(event, handler) {
            this._internalEventHandlers = this._internalEventHandlers || {};
            this._internalEventHandlers[event] = this._internalEventHandlers[event] || [];
            this._internalEventHandlers[event].push(handler);
        }

        log() {
            if (this.options.logs) {
                console.log.apply(console, arguments);
            }
        }
    }

    DataTable.instances = 0;

    var name = "frappe-datatable";
    var version = "0.0.0-development";
    var description = "A modern datatable library for the web";
    var main = "dist/frappe-datatable.cjs.js";
    var unpkg = "dist/frappe-datatable.min.js";
    var jsdelivr = "dist/frappe-datatable.min.js";
    var scripts = {"start":"yarn run dev","build":"rollup -c && NODE_ENV=production rollup -c","dev":"rollup -c -w","cy:server":"http-server -p 8989","cy:open":"cypress open","cy:run":"cypress run","test":"start-server-and-test cy:server http://localhost:8989 cy:run","test-local":"start-server-and-test cy:server http://localhost:8989 cy:open","travis-deploy-once":"travis-deploy-once","semantic-release":"semantic-release","lint":"eslint src","commit":"npx git-cz"};
    var files = ["dist","src"];
    var devDependencies = {"autoprefixer":"^9.0.0","chai":"3.5.0","cypress":"3.0.1","cz-conventional-changelog":"^2.1.0","deepmerge":"^2.0.1","eslint":"^5.0.1","eslint-config-airbnb":"^16.1.0","eslint-config-airbnb-base":"^12.1.0","eslint-plugin-import":"^2.11.0","http-server":"^0.11.1","mocha":"3.3.0","postcss-custom-properties":"^7.0.0","postcss-nested":"^3.0.0","rollup":"^0.59.4","rollup-plugin-commonjs":"^8.3.0","rollup-plugin-eslint":"^4.0.0","rollup-plugin-json":"^2.3.0","rollup-plugin-node-resolve":"^3.0.3","rollup-plugin-postcss":"^1.2.8","rollup-plugin-uglify-es":"^0.0.1","semantic-release":"^15.6.3","start-server-and-test":"^1.4.1","travis-deploy-once":"^5.0.1"};
    var repository = {"type":"git","url":"https://github.com/frappe/datatable.git"};
    var keywords = ["datatable","data","grid","table"];
    var author = "Faris Ansari";
    var license = "MIT";
    var bugs = {"url":"https://github.com/frappe/datatable/issues"};
    var homepage = "https://frappe.github.io/datatable";
    var dependencies = {"hyperlist":"^1.0.0-beta","lodash":"^4.17.5","sortablejs":"^1.7.0"};
    var config = {"commitizen":{"path":"cz-conventional-changelog"}};
    var packageJson = {
    	name: name,
    	version: version,
    	description: description,
    	main: main,
    	unpkg: unpkg,
    	jsdelivr: jsdelivr,
    	scripts: scripts,
    	files: files,
    	devDependencies: devDependencies,
    	repository: repository,
    	keywords: keywords,
    	author: author,
    	license: license,
    	bugs: bugs,
    	homepage: homepage,
    	dependencies: dependencies,
    	config: config
    };

    DataTable.__version__ = packageJson.version;

    return DataTable;

}(Sortable));
