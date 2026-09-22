# QXFRAME9A7C2 ESM 迁移 v8：Component Base 预备

> 基线：PRE-CUTOVER v7  
> 当前生产 authority：legacy build / frozen dist  
> 当前 source ESM authority：`src/index.js -> src/cutover-entry.js`  
> 30→35：仍未完成（`@floating-ui/dom` / Rollup 安装受当前执行环境 DNS 阻塞）  
> 本轮状态：只提前完成 35→40 的 Component 基类底座，不迁具体组件，不宣称 35→40 完成。

## 1. 新增 canonical owner

- `src/core/component.js`
- `src/core/componentHooks.js`
- `src/core/instanceRegistry.js`

`src/core/index.js` 已导出这三个 owner；`src/index.js` 已增加 `Component` named export。

## 2. Component 严格职责

本轮 Component 只实现所有组件都成立的通用实例能力：

- static options 继承链合并
- instance identity
- instance registry
- render/mount/reload/updateOptions 公共壳
- on/off/emit
- own(resource)
- listen(...)
- resource/listener cleanup
- root binding
- destroy 幂等
- contract 读取

没有引入：Popup、Overlay、Selection、Tree、Picker、Tag、Keyboard、Virtual focus、Position、Scroll lock 等职责。

## 3. Hook 策略

`componentHooks` 使用 Symbol，允许未来 Family Base 在不重写完整 public lifecycle shell 的前提下扩展：

- render
- mount
- reload
- optionsUpdated
- beforeDestroy
- afterDestroy

这为后面的 FieldComponent / PopupComponent / PopupFieldComponent / OverlayComponent / PickerComponent 提供统一扩展点。

## 4. InstanceRegistry

InstanceRegistry 是纯 ESM 本地 owner：

- `register/unregister`
- `bindRoot/unbindRoot`
- `get/has`
- `size/list`

它不通过旧 Registry 做 dependency resolution，也不写 `globalThis.QXFRAME9A7C2`。

组件 instance id 与公共 `options.id` 分离：公共 id option 仍完整保留给具体组件语义，内部 instance identity 使用独立生成值，避免未来 Popup 等组件既有 id option 与内部实例注册冲突。

## 5. 新增机器验收

新增：`tools/verify-component-base.mjs`

覆盖：

- options inheritance
- options immutability
- event on/off/emit
- render/mount/reload hooks
- resource LIFO cleanup
- native event listener cleanup
- root binding
- instance registry cleanup
- destroy idempotency
- static create() canonical shell
- family-specific responsibility = 0

同时直接扫描 `src/core/component.js`，禁止 legacy Registry、`defineModule()`、global QX namespace，以及 Popup/Overlay/Keyboard/Selection 等越界能力进入 Component。

`verify:component-base` 已加入总 `npm run verify` 链。

## 6. 当前验证结果

- Component base：PASS
- ESM kernel candidate parity：79/79 PASS
- ESM import graph：86 files / 265 edges / 0 cycles / 0 legacy imports
- executable source cutover：PASS
- source cutover reachable graph：166 files / 346 edges
- public component named exports：40 PASS
- legacy modules bootstrap：72 PASS
- release verify：PASS（209 JS/MJS，22 JSON）
- browser smoke：PASS

## 7. 生产产物冻结

仍为 HOTFIX6：

- `dist/qxframe9a7c2.js` SHA-256 `13dc56032a6562003827220dd83c0ce9fd6307f9efb046052138b1829251372d`
- `dist/qxframe9a7c2.css` SHA-256 `5042e59366a6424516f4d2d17af8b61da4e24f5521224c7cbc4adedfb74eca92`
- `dist/qxframe9a7c2.d.ts` SHA-256 `fea48995b11ceea218af66e7c290dfe6bcd938f1f53b729ebb222f75f23dc573`

`src/qxframe9a7c2.js` 仍为 14,471 行，没有为了绕过 bundler 门槛直接修改。

## 8. Rollup 门槛

当前执行：

```text
npm run build:rollup
...
Built 72 modules; dependency graph verified.
sh: 1: rollup: not found
exit=127
```

因此本轮不执行生产 authority cutover，也不删除 legacy kernel section。

## 9. 下一步

优先级仍是：

1. Rollup 可执行后，直接 bundle 当前 `src/index.umd.js` cutover graph。
2. `verify:rollup` 比较 legacy-control 与 cutover bundle。
3. browser parity PASS 后正式删除已失去 source authority 的 legacy kernel capability sections。
4. 30→35 将 Floating UI 改为 `@floating-ui/dom` ESM dependency。
5. 然后正式进入 35→40，把本轮 Component Base 从“预备 owner”升级为迁移 authority，并开始最简单组件/FieldComponent 的真实 class migration。

