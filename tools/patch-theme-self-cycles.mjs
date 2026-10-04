import fs from 'node:fs';

const patches=[
  ['src/styles/components/_item-surface.scss',[
    ['--_qxframe9a7c2-item-radius:var(--_qxframe9a7c2-item-radius,','--_qxframe9a7c2-item-radius:var(--qxframe9a7c2-item-radius,',1]
  ]],
  ['src/styles/components/_card.scss',[
    ['--_qxframe9a7c2-card-font-size:var(--_qxframe9a7c2-card-font-size,','--_qxframe9a7c2-card-font-size:var(--qxframe9a7c2-card-font-size,',1],
    ['--_qxframe9a7c2-card-shadow:var(--_qxframe9a7c2-card-shadow,','--_qxframe9a7c2-card-shadow:var(--qxframe9a7c2-card-shadow,',5]
  ]],
  ['src/styles/components/_switch.scss',[
    ['--_qxframe9a7c2-switch-track-radius:var(--_qxframe9a7c2-switch-track-radius,','--_qxframe9a7c2-switch-track-radius:var(--qxframe9a7c2-switch-track-radius,',1],
    ['--_qxframe9a7c2-switch-thumb-radius:var(--_qxframe9a7c2-switch-thumb-radius,','--_qxframe9a7c2-switch-thumb-radius:var(--qxframe9a7c2-switch-thumb-radius,',1]
  ]],
  ['src/styles/components/_menu.scss',[
    ['--_qxframe9a7c2-menu-item-radius:var(--_qxframe9a7c2-menu-item-radius,','--_qxframe9a7c2-menu-item-radius:var(--qxframe9a7c2-menu-item-radius,',2]
  ]],
  ['src/styles/components/_slider.scss',[
    ['--_qxframe9a7c2-slider-handle-radius:var(--_qxframe9a7c2-slider-handle-radius,','--_qxframe9a7c2-slider-handle-radius:var(--qxframe9a7c2-slider-handle-radius,',1],
    ['--_qxframe9a7c2-slider-rail-radius:var(--_qxframe9a7c2-slider-rail-radius,','--_qxframe9a7c2-slider-rail-radius:var(--qxframe9a7c2-slider-rail-radius,',1]
  ]]
];

for(const [file,replacements] of patches){
  let text=fs.readFileSync(file,'utf8');
  for(const [from,to,expected] of replacements){
    const count=text.split(from).length-1;
    if(count!==expected)throw new Error(`${file}: expected ${expected} occurrences of ${from}, found ${count}`);
    text=text.split(from).join(to);
  }
  fs.writeFileSync(file,text);
}
console.log(JSON.stringify({ok:true,files:patches.map(([file])=>file),cyclesFixed:8}));
