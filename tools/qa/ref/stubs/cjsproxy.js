// CommonJS proxy so any named import resolves at runtime.
const g = require("./generic.tsx")
module.exports = new Proxy({ __esModule: true, default: g.default }, { get: (t, k) => (k in t ? t[k] : (g[k] !== undefined ? g[k] : g.default[k])) })
