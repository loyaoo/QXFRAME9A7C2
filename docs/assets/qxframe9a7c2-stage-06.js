(function(){
  'use strict';
  var Q=window.QXFRAME9A7C2, logNode=document.getElementById('event-log'), button=null, sw=null;
  function log(msg){logNode.textContent='['+new Date().toLocaleTimeString()+'] '+msg+'\n'+logNode.textContent;}
  function buttonState(){return button?{disabled:button.disabled,loading:button.classList.contains('is-loading'),classes:button.className}:'removed';}
  function switchState(){var input=sw&&sw.querySelector('input');return input?{checked:input.checked,disabled:input.disabled,name:input.name,value:input.value}:'removed';}
  function refresh(){document.getElementById('registry').textContent=Q.ComponentRegistry.list().map(function(x){return x.name;}).join(', ');document.getElementById('button-state').textContent=JSON.stringify(buttonState());document.getElementById('switch-state').textContent=JSON.stringify(switchState());document.getElementById('badge-state').textContent='static HTML + CSS · no Component controller';}
  function makeButton(){var host=document.getElementById('button-host');host.textContent='';button=document.createElement('button');button.type='button';button.className='qxframe9a7c2-button is-primary is-solid is-md';button.textContent='Programmatic DOM Button';host.appendChild(button);button.addEventListener('click',function(){log('native Button click');});refresh();}
  function makeSwitch(){var host=document.getElementById('switch-host');host.textContent='';sw=document.createElement('label');sw.className='qxframe9a7c2-switch is-md';sw.innerHTML='<input class="qxframe9a7c2-switch-input" type="checkbox"><span class="qxframe9a7c2-switch-track"><span class="qxframe9a7c2-switch-thumb"></span></span><span>Native change</span>';host.appendChild(sw);sw.querySelector('input').addEventListener('change',function(){log('Switch native change = '+this.checked);refresh();});refresh();}
  makeButton();makeSwitch();
  document.getElementById('btn-success').addEventListener('click',function(){button.className='qxframe9a7c2-button is-success is-solid is-md';button.textContent='Success';refresh();});
  document.getElementById('btn-loading').addEventListener('click',function(){button.classList.toggle('is-loading');button.disabled=button.classList.contains('is-loading');refresh();});
  document.getElementById('btn-focus').addEventListener('click',function(){button.focus();log('native button.focus()');});
  document.getElementById('btn-destroy').addEventListener('click',function(){button.remove();button=null;refresh();});
  document.getElementById('btn-recreate').addEventListener('click',makeButton);
  var themeInput=document.querySelector('#theme-switch .qxframe9a7c2-switch-input')||document.querySelector('#theme-switch input');
  if(themeInput)themeInput.addEventListener('change',function(){var dark=this.checked,html=document.documentElement;html.classList.toggle('qxframe9a7c2-theme-dark',dark);html.classList.toggle('qxframe9a7c2-theme-light',!dark);log('Theme = '+(dark?'Dark':'Light'));});
  window.QXFRAME9A7C2_STAGE06_DEMO=Object.freeze({getButton:function(){return button;},getSwitch:function(){return sw;}});
})();
