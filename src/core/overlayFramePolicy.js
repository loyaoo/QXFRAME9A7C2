// Migration stage 20→30: real ESM candidate extracted from the frozen HOTFIX6 kernel.
// Runtime consumers remain on the legacy registry until Rollup cutover; parity is enforced by tools/verify-esm-core-parity.mjs.

function normalizeOverlayButton(button, index, options) {
  var opts=options||{}, source=(typeof button==='string'||typeof button==='number')?{content:String(button)}:Object.assign({},button||{});
  if(!source||typeof source!=='object'||Array.isArray(source)) throw new TypeError('[QXFRAME9A7C2] ' + String(opts.owner||'Overlay') + ' button must be a string, number, or object.');
  source.key=source.key===undefined?'button-'+index:String(source.key);
  source.role=source.role==null?'':String(source.role).toLowerCase();
  if(source.content===undefined){ if(source.text!==undefined)source.content=source.text; else if(source.label!==undefined)source.content=source.label; else source.content=''; }
  var confirmRole=source.role==='confirm'||source.role==='ok'||source.role==='submit';
  var cancelRole=source.role==='cancel'||source.role==='close';
  var dangerRole=source.role==='danger'||source.role==='destructive'||source.role==='delete'||source.role==='remove';
  if(source.type===undefined) source.type=confirmRole?'primary':(dangerRole?(opts.dangerType||'danger'):'default');
  if(source.className==null && opts.classNamePolicy!==false) source.className=confirmRole?'is-solid':(cancelRole?'is-outlined':(dangerRole?'is-solid':'is-filled'));
  source.closeOnClick=source.closeOnClick===undefined?(opts.closeOnClickDefault===undefined?(confirmRole||cancelRole):opts.closeOnClickDefault===true):source.closeOnClick!==false;
  if(opts.autoLoadingDefault!==undefined) source.autoLoading=source.autoLoading===undefined?opts.autoLoadingDefault===true:source.autoLoading!==false;
  source.disabled=source.disabled===true;
  return source;
}
function resolveOverlayButtons(options, config) {
  var opts=options||{}, cfg=config||{};
  if(opts.footer===false||opts.footer===null) return [];
  if(Array.isArray(opts.buttons)) return opts.buttons.map(function(button,index){return normalizeOverlayButton(button,index,cfg);});
  if(cfg.defaultButtons===false || (cfg.requireExplicitFooter===true && opts.footer!==true)) return [];
  return [
    normalizeOverlayButton({content:opts.cancelText===undefined?'取消':opts.cancelText,role:'cancel'},0,cfg),
    normalizeOverlayButton({content:opts.confirmText===undefined?'确定':opts.confirmText,role:'confirm'},1,cfg)
  ];
}
function normalizeClosable(value, previousOptions, config) {
  var cfg=config||{}, previous=previousOptions&&previousOptions.closeOptions?previousOptions.closeOptions:{};
  if(value===undefined) return {visible:previousOptions?previousOptions.closable!==false:true,options:Object.assign({},previous)};
  if(typeof value==='boolean') return {visible:value,options:value?{}:Object.assign({},previous)};
  if(!value||typeof value!=='object'||Array.isArray(value)) throw new TypeError('[QXFRAME9A7C2] ' + String(cfg.owner||'Overlay') + ' closable must be boolean or an object.');
  var options=Object.assign({},value);
  if(options.disabled!==undefined&&typeof options.disabled!=='boolean') throw new TypeError('[QXFRAME9A7C2] ' + String(cfg.owner||'Overlay') + ' closable.disabled must be boolean.');
  if(cfg.placements&&options.placement!==undefined){ var placement=String(options.placement); if(cfg.placements.indexOf(placement)<0) throw new TypeError('[QXFRAME9A7C2] ' + String(cfg.owner||'Overlay') + ' closable.placement must be one of: '+cfg.placements.join(', ')+'.'); options.placement=placement; }
  if(options.afterClose!==undefined&&options.afterClose!==null&&typeof options.afterClose!=='function') throw new TypeError('[QXFRAME9A7C2] ' + String(cfg.owner||'Overlay') + ' closable.afterClose must be a function.');
  return {visible:options.visible!==false,options:options};
}

export const OverlayFramePolicy = Object.freeze({ normalizeButton: normalizeOverlayButton, resolveButtons: resolveOverlayButtons, normalizeClosable });
export { normalizeOverlayButton, resolveOverlayButtons, normalizeClosable };
