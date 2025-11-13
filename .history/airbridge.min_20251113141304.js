(function() {
    var $jscomp = $jscomp || {};
    $jscomp.scope = {};
    $jscomp.arrayIteratorImpl = function(q) {
        var u = 0;
        return function() {
            return u < q.length ? {
                done: !1,
                value: q[u++]
            } : {
                done: !0
            }
        }
    }
    ;
    $jscomp.arrayIterator = function(q) {
        return {
            next: $jscomp.arrayIteratorImpl(q)
        }
    }
    ;
    $jscomp.ASSUME_ES5 = !1;
    $jscomp.ASSUME_NO_NATIVE_MAP = !1;
    $jscomp.ASSUME_NO_NATIVE_SET = !1;
    $jscomp.SIMPLE_FROUND_POLYFILL = !1;
    $jscomp.ISOLATE_POLYFILLS = !1;
    $jscomp.FORCE_POLYFILL_PROMISE = !1;
    $jscomp.FORCE_POLYFILL_PROMISE_WHEN_NO_NATIVE_REJECTION = !1;
    $jscomp.defineProperty = $jscomp.ASSUME_ES5 || "function" == typeof Object.defineProperties ? Object.defineProperty : function(q, u, z) {
        if (q == Array.prototype || q == Object.prototype)
            return q;
        q[u] = z.value;
        return q
    }
    ;
    $jscomp.getGlobal = function(q) {
        q = ["object" == typeof globalThis && globalThis, q, "object" == typeof window && window, "object" == typeof self && self, "object" == typeof global && global];
        for (var u = 0; u < q.length; ++u) {
            var z = q[u];
            if (z && z.Math == Math)
                return z
        }
        throw Error("Cannot find global object");
    }
    ;
    $jscomp.global = $jscomp.getGlobal(this);
    $jscomp.IS_SYMBOL_NATIVE = "function" === typeof Symbol && "symbol" === typeof Symbol("x");
    $jscomp.TRUST_ES6_POLYFILLS = !$jscomp.ISOLATE_POLYFILLS || $jscomp.IS_SYMBOL_NATIVE;
    $jscomp.polyfills = {};
    $jscomp.propertyToPolyfillSymbol = {};
    $jscomp.POLYFILL_PREFIX = "$jscp$";
    var $jscomp$lookupPolyfilledValue = function(q, u, z) {
        if (!z || null != q) {
            z = $jscomp.propertyToPolyfillSymbol[u];
            if (null == z)
                return q[u];
            z = q[z];
            return void 0 !== z ? z : q[u]
        }
    };
    $jscomp.polyfill = function(q, u, z, x) {
        u && ($jscomp.ISOLATE_POLYFILLS ? $jscomp.polyfillIsolated(q, u, z, x) : $jscomp.polyfillUnisolated(q, u, z, x))
    }
    ;
    $jscomp.polyfillUnisolated = function(q, u, z, x) {
        z = $jscomp.global;
        q = q.split(".");
        for (x = 0; x < q.length - 1; x++) {
            var A = q[x];
            if (!(A in z))
                return;
            z = z[A]
        }
        q = q[q.length - 1];
        x = z[q];
        u = u(x);
        u != x && null != u && $jscomp.defineProperty(z, q, {
            configurable: !0,
            writable: !0,
            value: u
        })
    }
    ;
