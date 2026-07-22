/*
 * Shared randomness helpers — UMD, mirrors the cal.js shape used across the
 * venture. Attaches to module.exports under Node, window.RND in the browser.
 * The browser (tool.js) is the only real consumer; generate.js renders a fixed
 * placeholder so builds stay reproducible (NO randomness in server output).
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.RND = factory();
})(typeof self !== "undefined" ? self : this, function () {
  // Uniform integer in [min, max] inclusive. Uses crypto.getRandomValues with
  // rejection sampling to avoid modulo bias; falls back to Math.random.
  function randInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    const range = max - min + 1;
    if (range <= 0) return min;
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
      const uint = 0x100000000;               // 2^32
      const limit = uint - (uint % range);    // largest multiple of range
      const buf = new Uint32Array(1);
      let x;
      do { crypto.getRandomValues(buf); x = buf[0]; } while (x >= limit);
      return min + (x % range);
    }
    return min + Math.floor(Math.random() * range);
  }

  // In-place Fisher–Yates shuffle using the unbiased randInt above.
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = randInt(0, i);
      const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  return { randInt: randInt, shuffle: shuffle };
});
