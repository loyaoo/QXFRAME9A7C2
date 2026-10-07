import * as React from "react"
export type DayButton = any; export type Locale = any; export type DateRange = any
export function getDefaultClassNames() { return new Proxy({}, { get: (_t, k: string) => "rdp-" + k }) as any }
const same = (a: Date, b: Date) => a && b && a.toDateString() === b.toDateString()
export function DayPicker(props: any) {
  const c = props.classNames || {}; const C = props.components || {}
  const Root = C.Root || ((p: any) => <div {...p} />)
  const DayBtn = C.DayButton || ((p: any) => <button {...p} />)
  const Chev = C.Chevron || (() => null)
  const sel = props.selected instanceof Date ? props.selected : props.selected?.from
  const base = props.month || props.defaultMonth || sel || new Date(2025, 5, 1)
  const first = new Date(base.getFullYear(), base.getMonth(), 1)
  const start = new Date(first); start.setDate(1 - first.getDay())
  const weeks: Date[][] = []; let d = new Date(start)
  for (let w = 0; w < 6; w++) { const row = []; for (let i = 0; i < 7; i++) { row.push(new Date(d)); d.setDate(d.getDate() + 1) } weeks.push(row); if (d.getMonth() !== base.getMonth() && w >= 4) break }
  const isSel = (x: Date) => props.mode === "range" ? (props.selected?.from && props.selected?.to && x >= props.selected.from && x <= props.selected.to) : (sel && same(x, sel))
  return <Root className={[props.className, c.root].join(" ")} rootRef={null} style={props.style}>
    <div className={c.months}>
      <nav className={c.nav}><button className={c.button_previous} aria-label="prev"><Chev orientation="left" /></button><button className={c.button_next} aria-label="next"><Chev orientation="right" /></button></nav>
      <div className={c.month}>
        <div className={c.month_caption}><span className={c.caption_label}>{base.toLocaleString("en-US", { month: "long", year: "numeric" })}</span></div>
        <table className={c.month_grid}><thead><tr className={c.weekdays}>{["Su","Mo","Tu","We","Th","Fr","Sa"].map(w => <th key={w} className={c.weekday}>{w}</th>)}</tr></thead>
        <tbody>{weeks.map((row, i) => <tr key={i} className={c.week}>{row.map((x, j) => {
          const outside = x.getMonth() !== base.getMonth(); const s = !!isSel(x)
          const cls = [c.day, outside && c.outside, s && props.mode !== "range" && c.selected].filter(Boolean).join(" ")
          return <td key={j} className={cls} data-selected={s || undefined} data-outside={outside || undefined}>
            <DayBtn day={{ date: x, outside }} modifiers={{ selected: s && props.mode !== "range", range_start: false, range_end: false, range_middle: false, focused: false, outside }} className={c.day_button}>{x.getDate()}</DayBtn></td>
        })}</tr>)}</tbody></table>
      </div></div></Root>
}
