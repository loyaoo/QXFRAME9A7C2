# QXFRAME9A7C2 ESM / Component 迁移 v9

## 本轮定位

本轮继续保持生产 `dist` 冻结，不把 Rollup 未执行的 PRE-CUTOVER 冒充完成。
在 v8 的 `Component` 基类基础上补齐真正的 option transaction / contract validation，并建立第一个 concrete class candidate：`Result extends Component`。

## 1. Component options 统一事务

`src/core/component.js` 现在统一拥有：

- 继承链 `static options` 合并
- 继承链 `static optionNormalizers` 合并
- 继承链 `static immutableOptions` 合并
- contract raw input validation
- normalizer 执行
- normalized candidate contract validation
- atomic commit：校验失败不会污染当前 options
- immutable option 拒绝
- `optionsUpdated` hook 与公开 `options` event

`OptionTransaction.create(initial, normalizers)` 原调用保持兼容；新增第三个可选 validator 参数供 Component 使用。

## 2. ComponentContracts 纯 ESM owner

新增：

- `src/core/componentContracts.js`

它从冻结的 `src/modules/component-contracts.js` 抽取 contract catalog 与 validator，不依赖：

- ComponentRuntime
- Registry
- defineModule
- global QX namespace

因此 class component 可以直接使用静态 contract，而不需要回到 legacy registry 查询。

## 3. 第一个 concrete class candidate

新增：

- `src/components/result.js`
- `src/components/index.js`

结构：

```text
Component
  ↓
Result
```

`Result` 不实现自己的 `destroy()`，也不实现自己的 `updateOptions()`；生命周期和 options transaction 均由 `Component` 唯一拥有。

Result 仅保留自身差异：

- SVG result icon projection
- name / visible 状态投影
- title / subtitle / extra 渲染
- SemanticStyles
- restart scheduler
- Result-specific public methods `show/hide/restart/setName/getState/getRootElement/getIconElement`

## 4. parity 验证

新增：

- `tools/verify-component-class-candidates.mjs`
- `npm run verify:component-classes`

对旧 `Components.Result` 与新 `Result extends Component` 同时执行：

- create
- initial state
- initial DOM
- show / hide
- setName
- updateOptions
- custom icon
- immutable container/document
- invalid option rejection
- failed transaction atomicity
- restart + FrameScheduler
- destroy / destroy idempotency

结果：全部 PASS。

同时结构守卫明确禁止 Result candidate 出现：

```text
Registry.get/assert/define
defineModule()
globalThis.QXFRAME9A7C2
自写 destroy()
自写 updateOptions()
```

## 5. ESM graph

加入 `src/components/index.js` 后：

```text
files: 89
edges: 276
cycles: 0
legacy imports: 0
```

## 6. 生产冻结

本轮没有把 `src/index.js` 的公开 Result 切到 class candidate。

当前仍是：

```text
public source Result -> cutover runtime -> legacy component module
```

而新的：

```text
src/components/result.js -> Result extends Component
```

属于已经通过 parity 的迁移候选。

只有在 Rollup cutover 可以真实执行并通过 bundle/browser parity 后，才允许逐个 concrete component 接管公开 authority。

## 7. 验收

- Component base verifier: PASS
- Result class parity: PASS
- 79 ESM kernel capability parity: PASS
- kernel coverage / waves / consumers: PASS
- cutover rehearsal/source: PASS
- ESM public entry: PASS
- release: PASS
- browser smoke: PASS

Release verify：

```text
JS/MJS syntax files: 213
JSON files: 22
runtime modules: 72
```

Frozen artifacts：

```text
dist/qxframe9a7c2.js
13dc56032a6562003827220dd83c0ce9fd6307f9efb046052138b1829251372d

dist/qxframe9a7c2.css
5042e59366a6424516f4d2d17af8b61da4e24f5521224c7cbc4adedfb74eca92

dist/qxframe9a7c2.d.ts
fea48995b11ceea218af66e7c290dfe6bcd938f1f53b729ebb222f75f23dc573
```

## 下一步

继续用同一规则迁移第二个低风险普通组件，而不是扩大 Base 职责：

```text
Concrete Component -> extends Component
纵向生命周期 -> Component
横向能力 -> import/composition
组件特有 DOM/state -> concrete class
```

仍不在 Rollup 未真实执行前删除 legacy production kernel 或把 PRE-CUTOVER 标记完成。
