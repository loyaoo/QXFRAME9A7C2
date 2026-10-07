const h = require("./huge.tsx")
module.exports = new Proxy({ __esModule: true, HugeiconsIcon: h.HugeiconsIcon }, { get: (t, k) => (k in t ? t[k] : []) })
