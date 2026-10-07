const g = require("./generic.tsx")
const empty = () => null
module.exports = new Proxy({ __esModule: true, default: (k) => ({ data: undefined, error: undefined, isLoading: false, mutate() {} }) }, { get: (t, k) => (k in t ? t[k] : (k[0] === k[0]?.toUpperCase?.() ? g.default[k] : empty)) })
