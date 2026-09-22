(function (global, document) {
  'use strict';
  var theme = global.QXFRAME9A7C2_DOCS_THEME;
  if (!theme) return;

  var DEBOUNCE_MS = 120;
  var timers = Object.create(null);

  function q(selector) { return document.querySelector(selector); }
  function qa(selector) { return Array.prototype.slice.call(document.querySelectorAll(selector)); }
  function hex(value) { return /^#[0-9a-f]{6}$/i.test(String(value || '').trim()); }
  function option(value, label) { var node=document.createElement('option'); node.value=value; node.textContent=label; return node; }
  function clearTimer(key) { if (timers[key]) { global.clearTimeout(timers[key]); delete timers[key]; } }
  function debounceState(key, next, delay) {
    clearTimer(key);
    timers[key] = global.setTimeout(function () { delete timers[key]; theme.setState(next); }, delay == null ? DEBOUNCE_MS : delay);
  }
  function commitState(key, next) { clearTimer(key); theme.setState(next); }

  function renderStaticOptions() {
    var base=q('[data-sg-theme-base]'), font=q('[data-sg-theme-font]'), presets=q('[data-sg-theme-presets]');
    if (base && !base.options.length) Object.keys(theme.bases).forEach(function (key) { base.appendChild(option(key, theme.bases[key].name)); });
    if (font && !font.options.length) Object.keys(theme.fonts).forEach(function (key) { font.appendChild(option(key, theme.fonts[key].name)); });
    if (presets && !presets.children.length) theme.presets.forEach(function (entry) {
      var button=document.createElement('button'); button.type='button'; button.className='sg-theme-preset'; button.style.setProperty('--sg-preset',entry.seed); button.dataset.sgThemePreset=entry.key; button.title=entry.name+' · '+entry.seed;
      button.addEventListener('click',function(){commitState('primary',{preset:entry.key,primarySeed:entry.seed});}); presets.appendChild(button);
    });
  }

  function sync() {
    var state=theme.getState(), effective=state.effectiveMode;
    var toggle=q('[data-sg-theme-toggle]');
    if(toggle){toggle.dataset.mode=effective;toggle.title=effective==='dark'?'切换到 Light':'切换到 Dark';toggle.setAttribute('aria-label',toggle.title);}
    var primaryValue=q('[data-sg-theme-primary-value]'); if(primaryValue) primaryValue.textContent=state.primarySeed;
    var color=q('[data-sg-theme-primary-color]'); if(color && document.activeElement!==color) color.value=state.primarySeed;
    var text=q('[data-sg-theme-primary-text]'); if(text && document.activeElement!==text) text.value=state.primarySeed;
    qa('[data-sg-theme-preset]').forEach(function(button){var entry=theme.presets.find(function(x){return x.key===button.dataset.sgThemePreset;});button.classList.toggle('is-active',!!entry&&entry.seed.toLowerCase()===state.primarySeed.toLowerCase());});
    var base=q('[data-sg-theme-base]'); if(base) base.value=state.base;
    var mix=q('[data-sg-theme-mix]'); if(mix){mix.value=state.mixRatio;mix.disabled=state.base!=='mixed';}
    var mixOutput=q('[data-sg-theme-mix-output]'); if(mixOutput) mixOutput.value=mixOutput.textContent=state.mixRatio+'%';
    var mixValue=q('[data-sg-theme-mix-value]'); if(mixValue) mixValue.textContent=state.mixRatio+'%'+(state.mixRatio===100?' · r2':'');
    var font=q('[data-sg-theme-font]'); if(font) font.value=state.font;
    var radius=q('[data-sg-theme-radius]'); if(radius) radius.value=state.radius;
    var radiusOutput=q('[data-sg-theme-radius-output]'); if(radiusOutput) radiusOutput.value=radiusOutput.textContent=state.radius+'px';
    var radiusValue=q('[data-sg-theme-radius-value]'); if(radiusValue) radiusValue.textContent=state.radius+'px';
    var focus=q('[data-sg-theme-focus]'); if(focus) focus.value=state.focusRing;
    var focusOutput=q('[data-sg-theme-focus-output]'); if(focusOutput) focusOutput.value=focusOutput.textContent=state.focusRing+'px';
    var focusValue=q('[data-sg-theme-focus-value]'); if(focusValue) focusValue.textContent=state.focusRing+'px';
  }

  function themeCss() {
    var state=theme.getState(), selectedBase=theme.bases[state.base], selectedFont=theme.fonts[state.font];
    var lines=[
      '/* QXFRAME9A7C2 Public Theme',
      ' * mode: '+state.effectiveMode,
      ' * preset: '+state.preset,
      ' * Apply the matching qxframe9a7c2-theme-light / qxframe9a7c2-theme-dark class separately.',
      ' */',
      ':root {',
      '  --qxframe9a7c2-theme-primary: '+state.primarySeed+';',
      '  --qxframe9a7c2-theme-neutral-mix-ratio: '+state.mixRatio+'%;',
      '  --qxframe9a7c2-theme-radius: '+state.radius+'px;',
      '  --qxframe9a7c2-theme-font-family: '+selectedFont.value+';',
      '  --qxframe9a7c2-theme-focus-ring-size: '+state.focusRing+'px;'
    ];
    if(selectedBase.palette){
      for(var step=1;step<=13;step+=1) lines.push('  --qxframe9a7c2-theme-neutral-'+step+': rgb(var(--qxframe9a7c2-color-'+selectedBase.palette+'-'+step+'));');
    } else {
      lines.push('  /* Neutral tones are synthesized by the framework from Grey + resolved Primary using the r2 MIX curve × the ratio above. */');
    }
    lines.push('}');
    return lines.join('\n');
  }

  function exportTheme() {
    var state=theme.getState(), blob=new Blob([themeCss()+'\n'],{type:'text/css;charset=utf-8'}), url=URL.createObjectURL(blob), link=document.createElement('a');
    link.href=url; link.download='qxframe9a7c2-theme-'+state.effectiveMode+'-'+(state.preset||'custom')+'.css';
    document.body.appendChild(link); link.click(); link.remove(); global.setTimeout(function(){URL.revokeObjectURL(url);},0);
    var button=q('[data-sg-theme-export]'); if(button){var old=button.textContent;button.textContent='已导出';global.setTimeout(function(){button.textContent=old;},900);}
  }

  function localizeSnapshotIds() {
    var seen = Object.create(null);
    qa('[id]').forEach(function (node) {
      var oldId = node.id;
      if (!oldId) return;
      if (!seen[oldId]) { seen[oldId] = true; return; }
      var scope = node.closest('article.sg-example');
      if (!scope || !scope.id) return;
      var nextId = oldId + '--' + scope.id;
      var index = 2;
      while (document.getElementById(nextId)) nextId = oldId + '--' + scope.id + '-' + index++;
      ['for','aria-controls','aria-labelledby','aria-describedby','aria-activedescendant','aria-owns','list','form','headers'].forEach(function (name) {
        Array.prototype.slice.call(scope.querySelectorAll('[' + name + ']')).forEach(function (ref) {
          var value = ref.getAttribute(name) || '';
          var tokens = value.split(/\s+/).map(function (token) { return token === oldId ? nextId : token; });
          ref.setAttribute(name, tokens.join(' '));
        });
      });
      Array.prototype.slice.call(scope.querySelectorAll('[href]')).forEach(function (ref) {
        if (ref.getAttribute('href') === '#' + oldId) ref.setAttribute('href', '#' + nextId);
      });
      node.id = nextId;
      seen[nextId] = true;
    });
  }

  function applyStaticNativeStates() {
    qa('[data-sg-indeterminate]').forEach(function (input) { if (input && input.type === 'checkbox') input.indeterminate = true; });
  }

  function previewRange(input, outputSelector, valueSelector, suffix, value) {
    var output=q(outputSelector), label=q(valueSelector), text=String(value)+suffix;
    if(output) output.value=output.textContent=text;
    if(label) label.textContent=text+(suffix==='%'&&Number(value)===100?' · r2':'');
  }

  function setInspectorOpen(open) {
    var host=q('[data-sg-theme-popover]'), trigger=q('[data-sg-theme-inspector-trigger]');
    if(host) host.classList.toggle('is-open',!!open);
    if(trigger) trigger.setAttribute('aria-expanded',open?'true':'false');
  }

  function wire() {
    var toggle=q('[data-sg-theme-toggle]'); if(toggle) toggle.addEventListener('click',function(){var state=theme.getState();theme.setState({mode:state.effectiveMode==='dark'?'light':'dark'});});
    var inspector=q('[data-sg-theme-inspector-trigger]'); if(inspector) inspector.addEventListener('click',function(event){event.stopPropagation();var host=q('[data-sg-theme-popover]'),open=!(host&&host.classList.contains('is-open'));setInspectorOpen(open);if(!open)inspector.blur();});
    document.addEventListener('pointerdown',function(event){var host=q('[data-sg-theme-popover]');if(host&&host.classList.contains('is-open')&&!host.contains(event.target))setInspectorOpen(false);});
    document.addEventListener('keydown',function(event){if(event.key==='Escape')setInspectorOpen(false);});

    var color=q('[data-sg-theme-primary-color]'); if(color){
      color.addEventListener('input',function(){var value=color.value;var label=q('[data-sg-theme-primary-value]');if(label)label.textContent=value;debounceState('primary',{primarySeed:value,preset:'custom'});});
      color.addEventListener('change',function(){commitState('primary',{primarySeed:color.value,preset:'custom'});});
    }
    var text=q('[data-sg-theme-primary-text]'); if(text) {
      text.addEventListener('input',function(){var value=text.value.trim();if(hex(value)){var label=q('[data-sg-theme-primary-value]');if(label)label.textContent=value;debounceState('primary',{primarySeed:value,preset:'custom'},180);}});
      text.addEventListener('change',function(){var value=text.value.trim();if(hex(value)) commitState('primary',{primarySeed:value,preset:'custom'}); else sync();});
      text.addEventListener('keydown',function(event){if(event.key==='Enter'){event.preventDefault();text.blur();}});
    }
    var base=q('[data-sg-theme-base]'); if(base) base.addEventListener('change',function(){theme.setState({base:base.value});});
    var mix=q('[data-sg-theme-mix]'); if(mix){
      mix.addEventListener('input',function(){var value=Number(mix.value);previewRange(mix,'[data-sg-theme-mix-output]','[data-sg-theme-mix-value]','%',value);debounceState('mix',{mixRatio:value});});
      mix.addEventListener('change',function(){commitState('mix',{mixRatio:Number(mix.value)});});
    }
    var font=q('[data-sg-theme-font]'); if(font) font.addEventListener('change',function(){theme.setState({font:font.value});});
    var radius=q('[data-sg-theme-radius]'); if(radius){
      radius.addEventListener('input',function(){var value=Number(radius.value);previewRange(radius,'[data-sg-theme-radius-output]','[data-sg-theme-radius-value]','px',value);debounceState('radius',{radius:value});});
      radius.addEventListener('change',function(){commitState('radius',{radius:Number(radius.value)});});
    }
    var focus=q('[data-sg-theme-focus]'); if(focus){
      focus.addEventListener('input',function(){var value=Number(focus.value);previewRange(focus,'[data-sg-theme-focus-output]','[data-sg-theme-focus-value]','px',value);debounceState('focus',{focusRing:value});});
      focus.addEventListener('change',function(){commitState('focus',{focusRing:Number(focus.value)});});
    }
    var reset=q('[data-sg-theme-reset]'); if(reset) reset.addEventListener('click',function(){Object.keys(timers).forEach(clearTimer);theme.reset();});
    var exportButton=q('[data-sg-theme-export]'); if(exportButton) exportButton.addEventListener('click',exportTheme);
    global.addEventListener('qxframe9a7c2:docs-theme-change',sync);
  }

  function boot(){localizeSnapshotIds();renderStaticOptions();applyStaticNativeStates();wire();theme.apply(null,{persist:false});sync();}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})(window, document);
