/* Binary64 range guards and bounded exact rounding. No UI or document dependencies. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else ((root.FZI ||= {}).MathIllustration ||= {}).ExpressionNumeric = api;
})(globalThis, function () {
  'use strict';
  const NORMAL_MIN = 2 ** -1022, SUBNORMAL_MIN = Number.MIN_VALUE;
  class ExpressionError extends Error {
    constructor(code) { super('Berekening niet beschikbaar (' + code + ').'); this.name = 'ExpressionError'; this.code = code; }
  }
  const fail = code => { throw new ExpressionError(code); };
  function finite(value, nonzero = false) {
    if (typeof value !== 'number' || !Number.isFinite(value)) fail('NON_FINITE_RESULT');
    if (value === 0 && nonzero) fail('NUMERIC_UNDERFLOW');
    return value === 0 ? 0 : value;
  }
  function multiply(a, b) { return finite(a * b, a !== 0 && b !== 0); }
  function divide(a, b) { if (b === 0) fail('DIVISION_BY_ZERO'); return finite(a / b, a !== 0); }
  function literal(text) {
    const normalized = text.replace(',', '.'), value = Number(normalized);
    return finite(value, /[1-9]/.test(normalized.split(/[eE]/)[0]));
  }
  const buffer = new ArrayBuffer(8), view = new DataView(buffer);
  function rational(value) {
    finite(value); view.setFloat64(0, value);
    const bits = view.getBigUint64(0), sign = bits >> 63n ? -1n : 1n;
    const exponent = Number((bits >> 52n) & 2047n), fraction = bits & ((1n << 52n) - 1n);
    const significand = exponent ? fraction + (1n << 52n) : fraction;
    const power = exponent ? exponent - 1075 : -1074;
    return power >= 0 ? [sign * (significand << BigInt(power)), 1n] : [sign * significand, 1n << BigInt(-power)];
  }
  function nearestInteger(n, d) {
    const q = n / d, r = n % d;
    return q + (2n * r > d || 2n * r === d && q % 2n !== 0n ? 1n : 0n);
  }
  function rationalToFloat(n, d) {
    if (d <= 0n) fail('INVALID_ARGUMENT');
    if (n === 0n) return 0;
    const negative = n < 0n; if (negative) n = -n;
    // Bounds are fixed by finite binary64 operands and digits <=10. No input BigInts.
    if (n.toString(2).length > 8192 || d.toString(2).length > 8192) fail('QUOTA_EXCEEDED');
    let exponent = n.toString(2).length - d.toString(2).length;
    if (exponent >= 0 ? n < (d << BigInt(exponent)) : (n << BigInt(-exponent)) < d) exponent--;
    const shift = exponent < -1022 ? 1074 : 52 - exponent;
    let significand = nearestInteger(shift >= 0 ? n << BigInt(shift) : n, shift >= 0 ? d : d << BigInt(-shift));
    if (significand === 0n) fail('NUMERIC_UNDERFLOW');
    let bits;
    if (exponent < -1022) bits = significand; // Carries naturally into the least normal number.
    else {
      if (significand === 1n << 53n) { significand >>= 1n; exponent++; }
      if (exponent > 1023) fail('NON_FINITE_RESULT');
      bits = (BigInt(exponent + 1023) << 52n) | (significand - (1n << 52n));
    }
    if (negative) bits |= 1n << 63n;
    view.setBigUint64(0, bits); return finite(view.getFloat64(0), true);
  }
  function quantize(value, digits, factor = 1, mode = 'round') {
    finite(value); finite(factor);
    if (!Number.isInteger(digits) || digits < 0 || digits > 10 || factor <= 0 || !['round', 'floor', 'ceil', 'trunc'].includes(mode)) fail('INVALID_ARGUMENT');
    const [vn, vd] = rational(value), [fn, fd] = rational(factor), scale = 10n ** BigInt(digits);
    let n = vn * fd * scale, d = vd * fn, integer;
    const sign = n < 0n ? -1n : 1n, magnitude = n < 0n ? -n : n;
    const q = magnitude / d, r = magnitude % d;
    if (mode === 'round') integer = sign * (q + (2n * r >= d ? 1n : 0n));
    else if (mode === 'floor') integer = sign * q - (sign < 0n && r ? 1n : 0n);
    else if (mode === 'ceil') integer = sign * q + (sign > 0n && r ? 1n : 0n);
    else integer = sign * q;
    return rationalToFloat(integer * fn, scale * fd);
  }
  function transcendental(name, value) {
    finite(value); let zero;
    if (['asin', 'acos'].includes(name) && (value < -1 || value > 1)) fail('DOMAIN_ERROR');
    if (['ln', 'log10'].includes(name) && value <= 0 || name === 'sqrt' && value < 0) fail('DOMAIN_ERROR');
    if (name === 'tan' && Math.abs(Math.cos(value)) <= 1e-12) fail('SINGULARITY');
    if (name === 'exp' || name === 'cos') zero = false;
    else if (name === 'acos') zero = value === 1;
    else if (name === 'ln' || name === 'log10') zero = value === 1;
    else zero = value === 0;
    const functions = {sin: Math.sin, cos: Math.cos, tan: Math.tan, asin: Math.asin, acos: Math.acos,
      atan: Math.atan, ln: Math.log, log10: Math.log10, exp: Math.exp, sqrt: Math.sqrt, abs: Math.abs};
    if (!Object.hasOwn(functions, name)) fail('INVALID_ARGUMENT');
    return finite(functions[name](value), !zero);
  }
  return Object.freeze({ExpressionError, fail, finite, multiply, divide, literal, rational, rationalToFloat,
    quantize, transcendental, NORMAL_MIN, SUBNORMAL_MIN});
});
