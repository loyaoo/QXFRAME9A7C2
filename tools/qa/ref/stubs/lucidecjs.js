const React = require("react")
const { IconPlaceholder } = require("./icon.tsx")
module.exports = new Proxy({ __esModule: true }, { get: (t, k) => (k in t ? t[k] : (p) => React.createElement(IconPlaceholder, Object.assign({ lucide: k }, p))) })
