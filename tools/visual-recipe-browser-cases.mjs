// Executed in the real Theme Studio page by verify-theme-studio-browser.mjs.
export async function runVisualRecipeCases(){
  const studio=window.QXFRAME9A7C2_THEME_STUDIO,C=window.QXFRAME9A7C2.Components,B=window.QXFRAME9A7C2.BuildingBlocks;
  const check=(ok,label)=>{if(!ok)throw new Error('Visual Recipe: '+label);};
  const pause=()=>new Promise(resolve=>setTimeout(resolve,350));
  const set=(key,value)=>{const el=document.querySelector('[data-studio-input="'+key+'"]');check(el,'missing control '+key);el.value=value;el.dispatchEvent(new Event('change',{bubbles:true}));};
  const root=document.querySelector('[data-studio-mount="menu"]');
  check(!root.querySelector('.qxframe9a7c2-menu-item.is-open'),'Workspace navigation initial closed');
  check(!root.querySelector('.qxframe9a7c2-menu-submenu-panel:not([hidden])'),'Workspace popup initial hidden');
  const host=document.createElement('div');host.style.cssText='width:24rem;position:relative';document.body.appendChild(host);
  const sub=()=>{const h=document.createElement('div');host.appendChild(h);return h;};
  const live=[];
  const input=B.Control.create({container:sub(),inputValue:'Anchor',size:'md'});live.push(input);
  const number=B.Control.create({container:sub(),inputType:'number',inputValue:'123',size:'md'});live.push(number);
  const area=B.Control.create({container:sub(),editor:'textarea',inputValue:'Anchor',size:'md'});live.push(area);
  const tags=C.TagInput.create({container:sub(),defaultValue:[{key:'a',value:'a',label:'Anchor'}],size:'md'});live.push(tags);
  const multi=C.Select.create({container:sub(),multiple:true,searchable:true,value:['a'],items:[{key:'a',value:'a',label:'Anchor'}],size:'md'});live.push(multi);
  const menuHost=sub(),menu=C.Menu.create({container:menuHost,portalContainer:menuHost,mode:'vertical',selectedKey:'b',items:[{key:'a',label:'Branch',items:[{key:'c',label:'Child'}]},{key:'b',label:'Current'}]});live.push(menu);menuHost.setAttribute('data-qxframe9a7c2-menu-recipe','tree');
  const picker=C.Select.create({container:sub(),items:[{key:'x',value:'x',label:'Option'}]});live.push(picker);
  const marker=document.createElement('div');marker.innerHTML='<label class="qxframe9a7c2-native-form"><input type="radio"><input type="checkbox"></label><span class="qxframe9a7c2-avatar">A</span><span class="qxframe9a7c2-tag">Tag</span><button class="qxframe9a7c2-button is-default is-outlined is-md">Action</button><button class="qxframe9a7c2-button is-default is-outlined is-md is-loading"><span class="qxframe9a7c2-button-spinner"></span>Action</button>';host.appendChild(marker);
  let shapeCases=0,switchCases=0,menuCases=0;
  try{
    set('body','serif');set('heading','mono');await pause();
    const fields=[input.getInputElement(),number.getInputElement(),area.getInputElement(),tags.getInputElement(),multi.getRootElement().querySelector('.qxframe9a7c2-tags-input')];
    const signature=el=>{const s=getComputedStyle(el);return [s.fontFamily,s.fontSize,s.fontWeight,s.lineHeight].join('|');};
    check(new Set(fields.map(signature)).size===1,'Control/Input type typography equality: '+fields.map(signature).join(';'));
    check(getComputedStyle(fields[0]).fontFamily.includes('Georgia'),'Body Font reaches input values');
    check(getComputedStyle(document.querySelector('.qxframe9a7c2-card-title')).fontFamily.includes('monospace'),'Heading Font reaches Card');
    const inputStart=fields[0].getBoundingClientRect().left-input.getRootElement().getBoundingClientRect().left;
    for(const instance of [tags,multi]){
      const r=instance.getRootElement(),tag=r.querySelector('.qxframe9a7c2-tag'),label=tag.querySelector('.qxframe9a7c2-tag-label,.qxframe9a7c2-tag-content');
      const anchor=label.getBoundingClientRect().left-r.getBoundingClientRect().left;
      check(Math.abs(anchor-inputStart)<=1,'Compound text anchor: '+anchor+' versus '+inputStart);
      const rr=r.getBoundingClientRect(),tr=tag.getBoundingClientRect();
      check(Math.abs((tr.top-rr.top)-(rr.bottom-tr.bottom))<=1,'Compound symmetric vertical inset');
      check(getComputedStyle(tag).fontSize===getComputedStyle(fields[0]).fontSize,'Tag Body size');
    }
    for(const size of ['xs','sm','md','lg','xl']){
      [input,tags,multi].forEach(instance=>instance.updateOptions({size}));await pause();
      const heights=[input,tags,multi].map(instance=>instance.getRootElement().getBoundingClientRect().height);
      check(Math.max(...heights)-Math.min(...heights)<=1,'Control/Compound '+size+' heights '+heights.join('/'));
    }
    [input,tags,multi].forEach(instance=>instance.updateOptions({size:'md'}));
    const disabled=document.createElement('button');disabled.className='qxframe9a7c2-button is-default is-solid is-md is-disabled';disabled.textContent='Disabled';marker.appendChild(disabled);
    const disabledPaint=()=>[getComputedStyle(disabled).backgroundColor,getComputedStyle(disabled).color].join('|');
    await pause();const beforePrimary=disabledPaint();set('primary','purple');await pause();check(disabledPaint()===beforePrimary,'Default Disabled remains in Neutral family '+beforePrimary+' / '+disabledPaint());
    disabled.remove();
    const buttons=marker.querySelectorAll('button'),spinner=marker.querySelector('.qxframe9a7c2-button-spinner');
    check(Math.abs(buttons[0].getBoundingClientRect().height-buttons[1].getBoundingClientRect().height)<1,'Loading preserves Control height');
    check(Math.abs(parseFloat(getComputedStyle(spinner).width)-parseFloat(getComputedStyle(buttons[0]).fontSize))<1,'Loading icon follows text scale '+spinner.getBoundingClientRect().width+'/'+getComputedStyle(buttons[0]).fontSize+' / '+getComputedStyle(buttons[1]).getPropertyValue('--_qxframe9a7c2-control-icon-size'));
    for(const mode of ['light','dark']){
      document.querySelector('[data-studio-mode="'+mode+'"]').click();
      for(const policy of ['follow','intrinsic','square']){
        set('radius','none');['choice','toggle','range','compact','identity'].forEach(f=>set('shape-'+f,policy));await pause();
        const radio=getComputedStyle(marker.querySelector('input[type=radio]')).borderRadius;
        const avatar=getComputedStyle(marker.querySelector('.qxframe9a7c2-avatar')).borderRadius;
        check(policy==='intrinsic'?parseFloat(radio)>0:parseFloat(radio)===0,'Radio None/'+policy+'/'+mode+' = '+radio);
        check(policy==='intrinsic'?parseFloat(avatar)>0:parseFloat(avatar)===0,'Avatar None/'+policy+'/'+mode);
        shapeCases++;
      }
    }
    set('radius','default');['choice','toggle','range','compact','identity'].forEach(f=>set('shape-'+f,'intrinsic'));
    for(const style of ['vega','nova','maia','lyra','mira','luma','sera','rhea']){
      set('style',style);await pause();
      const track=document.querySelector('[data-qxframe9a7c2-studio-commercial] .qxframe9a7c2-switch-track'),thumb=track.querySelector('.qxframe9a7c2-switch-thumb'),switchRoot=track.closest('.qxframe9a7c2-switch');
      // Disable animation only on the measurement probe, retaining actual CSS geometry.
      thumb.style.setProperty('transition','none','important');track.style.setProperty('transition','none','important');const native=switchRoot.querySelector('input');
      const state=native.checked,paint=checked=>{native.checked=checked;switchRoot.classList.toggle('is-checked',checked);return {track:track.getBoundingClientRect(),thumb:thumb.getBoundingClientRect(),border:parseFloat(getComputedStyle(track).borderLeftWidth)};};
      const off=paint(false);await new Promise(resolve=>setTimeout(resolve,300));const on=paint(true);await new Promise(resolve=>setTimeout(resolve,300));const settledOn={track:track.getBoundingClientRect(),thumb:thumb.getBoundingClientRect(),border:parseFloat(getComputedStyle(track).borderLeftWidth)},left=off.thumb.left-off.track.left-off.border,right=settledOn.track.right-settledOn.thumb.right-settledOn.border;
      check(Math.abs(left-right)<=.6,'Switch '+style+' end gaps '+left+'/'+right);
      check(Math.abs(off.thumb.top-off.track.top-off.border-(off.track.bottom-off.thumb.bottom-off.border))<=.6,'Switch '+style+' vertical center');
      paint(state);thumb.style.transition='';track.style.transition='';switchCases++;
    }
    set('style','vega');set('menuScope','all-menus');await pause();
    picker.open();await pause();
    const pickerSurface=picker.getPopupElement(),pickerBackground=pickerSurface&&getComputedStyle(pickerSurface).backgroundColor;
    check(pickerSurface,'Select popup available for ownership check');
    for(const scheme of ['normal','neutral','inverse','brand'])for(const accent of ['text','soft','solid','indicator','neutral','accent']){
      set('menuScheme',scheme);set('menuStyle',accent);await pause();
      const r=menu.getRootElement(),selected=r.querySelector('.is-selected');
      check(getComputedStyle(selected).color===studio.getTheme().tokens[document.documentElement.getAttribute('data-qxframe9a7c2-theme')]['--qxframe9a7c2-menu-recipe-selected-text'],'Menu resolved selected text '+scheme+'/'+accent+' actual='+getComputedStyle(selected).color+' expected='+studio.getTheme().tokens[document.documentElement.getAttribute('data-qxframe9a7c2-theme')]['--qxframe9a7c2-menu-recipe-selected-text']);
      check(getComputedStyle(pickerSurface).backgroundColor===pickerBackground,'Picker isolated from Menu '+scheme+'/'+accent);
      menuCases++;
    }
    check(pickerSurface.getAttribute('data-qxframe9a7c2-surface-context')==='picker','Picker declares its own ownership');
    picker.close();
    set('menuScheme','brand');set('menuScope','current-menu');await pause();menuHost.setAttribute('data-qxframe9a7c2-menu-recipe','current');
    const branch=menu.getRootElement().querySelector('.qxframe9a7c2-menu-item');branch.click();await pause();
    const popup=menuHost.querySelector('.qxframe9a7c2-menu-submenu-panel:not([hidden])');check(popup,'Menu click opens popup');
    check(getComputedStyle(popup).backgroundColor!==getComputedStyle(menu.getRootElement()).backgroundColor,'Current Menu excludes popup');
    set('menuScope','menu-tree');await pause();menuHost.setAttribute('data-qxframe9a7c2-menu-recipe','tree');
    check(getComputedStyle(popup).backgroundColor===getComputedStyle(menu.getRootElement()).backgroundColor,'Menu Tree includes popup');
    menuHost.setAttribute('data-qxframe9a7c2-theme','light');await pause();
    check(getComputedStyle(menu.getRootElement()).backgroundColor===studio.getTheme().tokens.light['--qxframe9a7c2-menu-recipe-background'],'Menu follows nearest explicit Light scope inside Dark');
    menuHost.removeAttribute('data-qxframe9a7c2-theme');
    check(popup.getAttribute('data-qxframe9a7c2-surface-context')==='menu','Popup declares Menu ownership');
    return {shapeCases,switchCases,menuCases,controlTypography:true,compoundAnchor:true,pickerIsolation:true,popupInitiallyClosed:true};
  }finally{
    live.reverse().forEach(instance=>instance.destroy());host.remove();studio.reset();await pause();
  }
}
