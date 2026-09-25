import { FieldComponent, fieldHooks, createSimpleFieldProfile } from './field.js';
import { Control } from './control.js';
import { componentHooks } from '../core/componentHooks.js';
import { ComponentContracts, validateContractOptions } from '../core/componentContracts.js';
import { DOM } from '../core/dom.js';
import { Lifecycle } from '../core/lifecycle.js';
import { ValueController } from '../core/valueController.js';
import { PointerSession } from '../core/pointerSession.js';
import { Utils } from '../utils/utils.js';

export const SLIDER_SIZES = Object.freeze(['xs','sm','md','lg','xl']);
const state = new WeakMap();
const hasOwn = Utils.own;

function finite(value, label) {
    const output = Number(value);
    if (!Number.isFinite(output)) throw new TypeError('[QXFRAME9A7C2] Slider ' + label + ' must be a finite number.');
    return output;
}
function normalizeSize(value) { return Utils.normalizeEnum(value == null ? 'md' : value, SLIDER_SIZES, undefined, 'Slider size'); }
function normalizeRange(value) {
    if (value === true || value === false || value == null) return value === true;
    if (typeof value !== 'object' || Array.isArray(value)) throw new TypeError('[QXFRAME9A7C2] Slider range must be boolean or a range options object.');
    const editable = value.editable === true;
    const minCount = value.minCount == null ? (editable ? 1 : 2) : Number(value.minCount);
    const maxCount = value.maxCount == null ? (editable ? Infinity : 2) : Number(value.maxCount);
    if (!Number.isInteger(minCount) || minCount < 1) throw new RangeError('[QXFRAME9A7C2] Slider range.minCount must be an integer >= 1.');
    if (!(maxCount === Infinity || (Number.isInteger(maxCount) && maxCount >= minCount))) throw new RangeError('[QXFRAME9A7C2] Slider range.maxCount must be an integer >= minCount or Infinity.');
    if (!editable && (minCount !== 2 || maxCount !== 2)) throw new TypeError('[QXFRAME9A7C2] Slider range minCount/maxCount require range.editable=true.');
    return Object.freeze({ draggableTrack: value.draggableTrack === true, editable, minCount, maxCount });
}
function isRangeValue(value) { return value === true || !!(value && typeof value === 'object'); }
function decimals(value) { const text = String(value); if (/e-/i.test(text)) return Math.max(0, Number(text.split(/e-/i)[1]) || 0); const point = text.indexOf('.'); return point < 0 ? 0 : text.length - point - 1; }
function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
function cloneExternal(values, range) { return range ? values.slice() : values[0]; }
function normalizeSliderOptions(input) {
    const candidate = Utils.mergeOwn( input || {});
    candidate.min = finite(candidate.min == null ? 0 : candidate.min, 'min');
    candidate.max = finite(candidate.max == null ? 100 : candidate.max, 'max');
    if (!(candidate.max > candidate.min)) throw new RangeError('[QXFRAME9A7C2] Slider max must be greater than min.');
    if (candidate.step !== null) {
        candidate.step = finite(candidate.step == null ? 1 : candidate.step, 'step');
        if (!(candidate.step > 0)) throw new RangeError('[QXFRAME9A7C2] Slider step must be greater than 0 or null.');
    }
    candidate.range = normalizeRange(candidate.range);
    candidate.size = normalizeSize(candidate.size);
    if (candidate.marks != null && (typeof candidate.marks !== 'object' || Array.isArray(candidate.marks))) throw new TypeError('[QXFRAME9A7C2] Slider marks must be an object keyed by numeric values.');
    if (candidate.tooltip != null && (typeof candidate.tooltip !== 'object' || Array.isArray(candidate.tooltip))) throw new TypeError('[QXFRAME9A7C2] Slider tooltip must be an options object or null.');
    if (candidate.handleDisabled != null && !Array.isArray(candidate.handleDisabled) && typeof candidate.handleDisabled !== 'function') throw new TypeError('[QXFRAME9A7C2] Slider handleDisabled must be an array, function, or null.');
    return candidate;
}
function recordFor(instance) { const record = state.get(instance); if (!record) throw new TypeError('[QXFRAME9A7C2] Invalid Slider instance.'); return record; }

function prepare(source, overrides) {
    const fieldInit = Control.resolveFieldOptions(source, overrides);
    const incoming = fieldInit.options;
    validateContractOptions(ComponentContracts.get('Slider'), incoming, 'Slider');
    if (fieldInit.hasNativeValue && !hasOwn(incoming, 'value') && !hasOwn(incoming, 'defaultValue')) {
        const rawNative = String(fieldInit.nativeValue == null ? '' : fieldInit.nativeValue);
        incoming.value = incoming.range ? rawNative.split(',').filter(part => part !== '').map(Number) : Number(rawNative);
    }
    const preview = normalizeSliderOptions(Utils.assignOwn({ min:0,max:100,step:1,range:false,included:true,vertical:false,reverse:false,keyboard:true,disabled:false,readOnly:false,allowCross:true,dots:false,marks:null,tooltip:{},size:'md',required:false }, incoming));
    if (!preview.container && !preview.formField) throw new TypeError('[QXFRAME9A7C2] Slider requires target/container or formField.');
    const doc = fieldInit.document || preview.document || (preview.container && preview.container.ownerDocument) || (preview.formField && preview.formField.ownerDocument) || globalThis.document;
    return { fieldInit, incoming, doc };
}

function createRuntime(instance, prepared) {
    const { fieldInit, incoming, doc } = prepared;
    let opts = normalizeSliderOptions(Utils.mergeOwn( instance.options));
    let projectionScope = Lifecycle.createScope();
    let root = doc.createElement('div');
    let rail = null, track = null, stepsHolder = null, marksHolder = null;
    let handles = [], values = [], valueState = null, activeHandle = 0, dragging = false, dragMode = 'handle', dragStartPoint = 0, dragStartValues = null;
    let destroyed = false, keyboardSession = null, formBridge = null, pointerSession = null;
    const api = instance;

    root.className = 'qxframe9a7c2-slider';
    if (opts.container) opts.container.appendChild(root); else Control.placeFieldRoot(root, null, opts.formField);

    const rangeMode = () => isRangeValue(opts.range);
    const rangeConfig = () => opts.range && typeof opts.range === 'object' ? opts.range : null;
    const editableRange = () => !!(rangeConfig() && rangeConfig().editable === true);
    const minHandleCount = () => rangeConfig() ? rangeConfig().minCount : (rangeMode() ? 2 : 1);
    const maxHandleCount = () => rangeConfig() ? rangeConfig().maxCount : (rangeMode() ? 2 : 1);
    const draggableTrack = () => !!(rangeConfig() && rangeConfig().draggableTrack === true);
    function handleDisabled(index) {
        if (opts.disabled === true) return true;
        if (typeof opts.handleDisabled === 'function') return opts.handleDisabled(index, values[index], { values: values.slice(), instance: api }) === true;
        return Array.isArray(opts.handleDisabled) ? opts.handleDisabled[index] === true : false;
    }
    function markEntries() {
        const marks = opts.marks || {};
        return Object.keys(marks).map(raw => ({ value: Number(raw), content: marks[raw] }))
            .filter(entry => Number.isFinite(entry.value) && entry.value >= opts.min && entry.value <= opts.max)
            .sort((a,b) => a.value - b.value);
    }
    function precision() { const candidates = [opts.min, opts.max]; if (opts.step !== null) candidates.push(opts.step); markEntries().forEach(entry => candidates.push(entry.value)); return Math.min(12, Math.max.apply(Math, candidates.map(decimals))); }
    function align(rawValue) {
        const raw = clamp(finite(rawValue, 'value'), opts.min, opts.max), candidates = [];
        if (opts.step !== null) candidates.push(opts.min + Math.round((raw - opts.min) / opts.step) * opts.step);
        markEntries().forEach(entry => candidates.push(entry.value));
        if (!candidates.length) return Number(raw.toFixed(precision()));
        let best = null, bestDistance = Infinity;
        candidates.forEach(candidate => { if (candidate < opts.min || candidate > opts.max) return; const distance = Math.abs(candidate - raw); if (distance < bestDistance) { best = candidate; bestDistance = distance; } });
        if (best === null) best = raw;
        return Number(clamp(best, opts.min, opts.max).toFixed(precision()));
    }
    function normalize(next) {
        let sourceValues = Array.isArray(next) ? next.slice() : [next];
        let first = sourceValues[0]; if (first === undefined || first === null || first === '') first = opts.min;
        if (!rangeMode()) return [align(first)];
        if (!editableRange()) {
            let second = sourceValues[1]; if (second === undefined || second === null || second === '') second = opts.max;
            let pair = [align(first), align(second)]; if (opts.allowCross === false && pair[0] > pair[1]) pair = [pair[1], pair[0]]; return pair;
        }
        if (!sourceValues.length) sourceValues = [opts.min, opts.max];
        let output = sourceValues.filter(value => value !== undefined && value !== null && value !== '').map(align);
        if (!output.length) output = [opts.min]; if (output.length > maxHandleCount()) output = output.slice(0, maxHandleCount());
        while (output.length < minHandleCount()) output.push(output.length ? output[output.length - 1] : opts.min);
        if (opts.allowCross === false) output.sort((a,b) => a-b); return output;
    }
    const externalValue = () => cloneExternal(values, rangeMode());
    const percent = value => ((value - opts.min) / (opts.max - opts.min)) * 100;
    const visualPercent = value => opts.reverse === true ? 100 - percent(value) : percent(value);
    function tooltipText(value, index) {
        if (!opts.tooltip || opts.tooltip.open === false || opts.tooltip.formatter === null) return '';
        if (typeof opts.tooltip.formatter === 'function') { const output = opts.tooltip.formatter(value, { index, instance: api }); return output == null ? '' : String(output); }
        return String(value);
    }
    function tooltipPlacement() { if (opts.tooltip && opts.tooltip.placement) return String(opts.tooltip.placement); if (opts.vertical) return opts.reverse ? 'right' : 'left'; return 'top'; }
    const interactive = index => { const capability=instance.getCapabilityController();return !destroyed && (!capability || capability.can('edit')) && (index === undefined || !handleDisabled(index)); };
    const sameValues = (a,b) => a.length === b.length && a.every((value,index) => value === b[index]);
    function emit(name, reason, event, sourceValues) {
        if (typeof opts[name] !== 'function') return;
        const output = sourceValues ? cloneExternal(sourceValues, rangeMode()) : externalValue();
        opts[name](output, { reason, originalEvent:event || null, activeHandle, controlled:!!(valueState && valueState.controlled), instance:api });
    }
    function updateRootState() {
        SLIDER_SIZES.forEach(size => root.classList.remove('is-' + size)); root.classList.add('is-' + opts.size);
        root.classList.toggle('is-range', rangeMode()); root.classList.toggle('is-vertical', opts.vertical === true); root.classList.toggle('is-reverse', opts.reverse === true);
        root.classList.toggle('has-marks', markEntries().length > 0); root.classList.toggle('is-disabled', opts.disabled === true); root.classList.toggle('is-readonly', opts.readOnly === true); root.classList.toggle('is-dragging', dragging === true);
    }
    function updateProjection() {
        if (!rail || !track) return;
        updateRootState(); const points = values.map(visualPercent); let start, end;
        if (rangeMode()) { start = Math.min.apply(Math, points); end = Math.max.apply(Math, points); }
        else if (opts.reverse === true) { start = points[0]; end = 100; } else { start = 0; end = points[0]; }
        if (opts.included === false) { if (track.parentNode) track.parentNode.removeChild(track); }
        else if (track.parentNode !== root) root.insertBefore(track, stepsHolder && stepsHolder.parentNode === root ? stepsHolder : null);
        if (opts.vertical) { track.style.left=''; track.style.width=''; track.style.bottom=start+'%'; track.style.height=Math.max(0,end-start)+'%'; }
        else { track.style.bottom=''; track.style.height=''; track.style.left=start+'%'; track.style.width=Math.max(0,end-start)+'%'; }
        handles.forEach((handle,index) => {
            const point=visualPercent(values[index]); if(opts.vertical){handle.style.left='';handle.style.bottom=point+'%';}else{handle.style.bottom='';handle.style.left=point+'%';}
            handle.classList.toggle('is-active',index===activeHandle); const disabledHandle=handleDisabled(index); handle.tabIndex=disabledHandle?-1:0; handle.classList.toggle('is-disabled',disabledHandle);
            let tip=handle.querySelector('.qxframe9a7c2-slider-tooltip'); const nextTip=tooltipText(values[index],index);
            if(nextTip!==''){if(!tip){tip=doc.createElement('span');tip.className='qxframe9a7c2-slider-tooltip is-'+tooltipPlacement();if(opts.tooltip&&opts.tooltip.open===true)tip.classList.add('is-always-open');handle.appendChild(tip);}tip.textContent=nextTip;}else if(tip&&tip.parentNode)tip.parentNode.removeChild(tip);
        });
        if(stepsHolder)Array.prototype.forEach.call(stepsHolder.children,dot=>{const dotValue=Number(dot.getAttribute('data-slider-dot')),low=Math.min.apply(Math,values),high=Math.max.apply(Math,values);let active=opts.included!==false&&(rangeMode()?dotValue>=low&&dotValue<=high:dotValue<=values[0]);if(!rangeMode()&&opts.reverse===true)active=opts.included!==false&&dotValue>=values[0];dot.classList.toggle('is-active',active);});
    }
    function renderMarkContent(node, content, value) { let output=content;if(content&&typeof content==='object'&&!content.nodeType&&hasOwn(content,'label'))output=content.label;if(output&&output.nodeType)node.appendChild(output);else node.textContent=output==null?String(value):String(output); }
    function buildProjection() {
        projectionScope.dispose(); projectionScope=Lifecycle.createScope(); while(root.firstChild)root.removeChild(root.firstChild); handles=[];
        rail=doc.createElement('div');track=doc.createElement('div');stepsHolder=doc.createElement('div');marksHolder=doc.createElement('div');
        rail.className='qxframe9a7c2-slider-rail';track.className='qxframe9a7c2-slider-track';stepsHolder.className='qxframe9a7c2-slider-steps';marksHolder.className='qxframe9a7c2-slider-marks';if(draggableTrack())track.classList.add('is-draggable');
        root.appendChild(rail);if(opts.included!==false)root.appendChild(track);root.appendChild(stepsHolder);root.appendChild(marksHolder);
        if(opts.dots===true&&opts.step!==null){const dotCount=Math.floor((opts.max-opts.min)/opts.step);if(dotCount<=500)for(let dotIndex=0;dotIndex<=dotCount;dotIndex+=1){const dotValue=Number((opts.min+dotIndex*opts.step).toFixed(precision()));if(dotValue>opts.max)break;const dot=doc.createElement('span');dot.className='qxframe9a7c2-slider-dot';dot.setAttribute('data-slider-dot',String(dotValue));const dotPoint=visualPercent(dotValue);if(opts.vertical)dot.style.bottom=dotPoint+'%';else dot.style.left=dotPoint+'%';stepsHolder.appendChild(dot);}}
        markEntries().forEach(entry=>{const mark=doc.createElement('button');mark.type='button';mark.tabIndex=-1;mark.className='qxframe9a7c2-slider-mark';mark.setAttribute('data-slider-mark',String(entry.value));const point=visualPercent(entry.value);if(opts.vertical)mark.style.bottom=point+'%';else mark.style.left=point+'%';if(entry.content&&typeof entry.content==='object'&&!entry.content.nodeType&&entry.content.style)Object.keys(entry.content.style).forEach(name=>{if(Utils.safeOwnKey(name))mark.style[name]=entry.content.style[name];});renderMarkContent(mark,entry.content,entry.value);projectionScope.add(DOM.listen(mark,'click',event=>{if(!interactive())return;if(event.preventDefault)event.preventDefault();setNearestValue(entry.value,{user:true,reason:'mark',originalEvent:event,final:true});}));marksHolder.appendChild(mark);});
        const handleCount=rangeMode()?values.length:1;for(let index=0;index<handleCount;index+=1){const handle=doc.createElement('button');handle.type='button';handle.className='qxframe9a7c2-slider-handle';handle.setAttribute('data-slider-handle',String(index));const initialTip=tooltipText(values[index],index);if(initialTip!==''){const tip=doc.createElement('span');tip.className='qxframe9a7c2-slider-tooltip is-'+tooltipPlacement();tip.textContent=initialTip;if(opts.tooltip&&opts.tooltip.open===true)tip.classList.add('is-always-open');handle.appendChild(tip);}projectionScope.add(DOM.listen(handle,'focus',()=>{activeHandle=index;updateProjection();}));projectionScope.add(DOM.listen(handle,'keyup',event=>handleKeyup(index,event)));projectionScope.add(DOM.listen(handle,'blur',event=>{if(keyboardSession&&keyboardSession.index===index)finalizeKeyboardSession(event,'keyboard-blur');}));handles.push(handle);root.appendChild(handle);}
        projectionScope.add(DOM.listen(rail,'dblclick',event=>{if(!interactive()||!editableRange())return;if(event.preventDefault)event.preventDefault();addHandle(valueFromPointer(event),{user:true,reason:'editable-add',originalEvent:event,final:true});})); updateProjection();
    }
    function setValues(next, config) {
        if(destroyed)return false;const settings=config||{};if(settings.user===true&&!interactive())return false;const normalized=normalize(next);if(rangeMode()&&!editableRange()&&opts.allowCross===false){normalized[0]=Math.min(normalized[0],normalized[1]);normalized[1]=Math.max(normalized[0],normalized[1]);}
        const changed=!sameValues(values,normalized);if(changed){const stateMeta={silent:true,source:settings.source||(settings.user===true?'user':'api'),reason:settings.reason||'set-value',originalEvent:settings.originalEvent||null};if((settings.user===true||settings.request===true)&&valueState.controlled)valueState.requestChange(normalized,stateMeta);else{valueState.setValue(normalized,stateMeta);values=valueState.value;instance.setFieldValue(externalValue(),{force:true,silent:true,sync:true,source:stateMeta.source,reason:stateMeta.reason});}}
        updateProjection();if(formBridge)formBridge.setValue(externalValue(),settings);if(changed&&settings.silent!==true)emit('onChange',settings.reason||'set-value',settings.originalEvent,normalized);if(settings.final===true)emit('onAfterChange',settings.reason||'set-value',settings.originalEvent,normalized);return changed;
    }
    function nearestHandleIndex(next){if(!rangeMode())return 0;const candidates=values.map((value,index)=>({index,distance:Math.abs(value-next),disabled:handleDisabled(index)})).filter(entry=>!entry.disabled);if(!candidates.length)return-1;candidates.sort((a,b)=>a.distance!==b.distance?a.distance-b.distance:(a.index===activeHandle?-1:(b.index===activeHandle?1:a.index-b.index)));return candidates[0].index;}
    function setNearestValue(next,config){const nearest=nearestHandleIndex(next);if(nearest<0)return false;activeHandle=nearest;const output=values.slice();output[activeHandle]=align(next);if(rangeMode()&&opts.allowCross===false){if(editableRange()){if(activeHandle>0)output[activeHandle]=Math.max(output[activeHandle],values[activeHandle-1]);if(activeHandle<values.length-1)output[activeHandle]=Math.min(output[activeHandle],values[activeHandle+1]);}else{if(activeHandle===0)output[0]=Math.min(output[0],output[1]);else output[1]=Math.max(output[1],output[0]);}}return setValues(output,config);}
    function pointFromEvent(event){const rect=root.getBoundingClientRect();if(opts.vertical){const vertical=clamp((rect.bottom-Number(event.clientY||0))/Math.max(1,rect.height),0,1);return opts.reverse===true?1-vertical:vertical;}const horizontal=clamp((Number(event.clientX||0)-rect.left)/Math.max(1,rect.width),0,1);return opts.reverse===true?1-horizontal:horizontal;}
    const valueFromPointer=event=>align(opts.min+pointFromEvent(event)*(opts.max-opts.min));
    function moveRangeTrack(event){const delta=(pointFromEvent(event)-dragStartPoint)*(opts.max-opts.min),low=Math.min.apply(Math,dragStartValues),high=Math.max.apply(Math,dragStartValues);let adjusted=delta;if(low+adjusted<opts.min)adjusted=opts.min-low;if(high+adjusted>opts.max)adjusted=opts.max-high;setValues(dragStartValues.map(value=>align(value+adjusted)),{user:true,reason:'track-drag',originalEvent:event});}
    function addHandle(value,config){if(destroyed||!editableRange())return false;const settings=config||{};if(settings.user===true&&!interactive())return false;if(values.length>=maxHandleCount())return false;let output=values.concat([align(value)]);if(opts.allowCross===false)output.sort((a,b)=>a-b);const addedValue=align(value),changed=setValues(output,Utils.mergeOwn(settings,{reason:settings.reason||'add-handle'}));if(changed){activeHandle=values.indexOf(addedValue);buildProjection();}return changed;}
    function removeHandle(index,config){if(destroyed||!editableRange())return false;index=Number(index);if(!Number.isInteger(index)||index<0||index>=values.length)return false;const settings=config||{};if(settings.user===true&&!interactive(index))return false;if(values.length<=minHandleCount())return false;const output=values.slice(0,index).concat(values.slice(index+1)),changed=setValues(output,Utils.mergeOwn(settings,{reason:settings.reason||'remove-handle'}));activeHandle=Math.max(0,Math.min(values.length-1,index));if(changed)buildProjection();return changed;}
    function endDrag(event){if(!dragging)return;const reason=dragMode==='track'?'track-drag':'drag';dragging=false;updateProjection();emit('onAfterChange',reason,event);const handle=handles[activeHandle];if(handle&&handle.tabIndex>=0)DOM.focusElement(handle);}
    function beginDrag(event,mode){dragging=true;dragMode=mode==='track'?'track':'handle';dragStartValues=values.slice();dragStartPoint=pointFromEvent(event);emit('onBeforeChange',dragMode==='track'?'track-drag':'drag',event);updateProjection();}
    const directionalKey=key=>key==='ArrowRight'||key==='ArrowUp'||key==='ArrowLeft'||key==='ArrowDown'||key==='PageUp'||key==='PageDown'||key==='Home'||key==='End';
    function beginKeyboardSession(index,event){if(keyboardSession&&keyboardSession.index===index){keyboardSession.keys[event.key]=true;return keyboardSession;}if(keyboardSession)finalizeKeyboardSession(event,'keyboard-switch');keyboardSession={index,startValues:values.slice(),keys:Object.create(null),changed:false};keyboardSession.keys[event.key]=true;activeHandle=index;emit('onBeforeChange','keyboard',event);return keyboardSession;}
    function finalizeKeyboardSession(event,reason){if(!keyboardSession)return false;const session=keyboardSession;keyboardSession=null;if(session.changed)emit('onAfterChange',reason||'keyboard',event);return session.changed;}
    function cancelKeyboardSession(event,reason){if(!keyboardSession)return false;const session=keyboardSession;keyboardSession=null;if(!sameValues(values,session.startValues))setValues(session.startValues,{user:false,reason:reason||'keyboard-cancel',originalEvent:event});return true;}
    function handleKeyup(index,event){if(!keyboardSession||keyboardSession.index!==index||!directionalKey(event.key))return false;delete keyboardSession.keys[event.key];if(!Object.keys(keyboardSession.keys).length)finalizeKeyboardSession(event,'keyboard');return true;}
    function handleKeydown(index,event){if(typeof opts.onKeyDown==='function')opts.onKeyDown(event,{index,value:externalValue(),instance:api});if(!interactive(index)||opts.keyboard===false)return;if(event.key==='Escape'&&keyboardSession){if(event.preventDefault)event.preventDefault();cancelKeyboardSession(event,'keyboard-escape');return;}if(editableRange()&&(event.key==='Delete'||event.key==='Backspace')){if(event.preventDefault)event.preventDefault();removeHandle(index,{user:true,reason:'keyboard-remove',originalEvent:event,final:true});return;}const unit=opts.step===null?1:opts.step,direction=opts.reverse===true?-1:1;let next=null;if(event.key==='ArrowRight'||event.key==='ArrowUp')next=values[index]+unit*direction;else if(event.key==='ArrowLeft'||event.key==='ArrowDown')next=values[index]-unit*direction;else if(event.key==='PageUp')next=values[index]+unit*10;else if(event.key==='PageDown')next=values[index]-unit*10;else if(event.key==='Home')next=opts.min;else if(event.key==='End')next=opts.max;else return;if(event.preventDefault)event.preventDefault();const keySession=beginKeyboardSession(index,event);activeHandle=index;const output=values.slice();output[index]=align(next);if(rangeMode()&&opts.allowCross===false){if(editableRange()){if(index>0)output[index]=Math.max(output[index],values[index-1]);if(index<values.length-1)output[index]=Math.min(output[index],values[index+1]);}else{if(index===0)output[0]=Math.min(output[0],output[1]);else output[1]=Math.max(output[1],output[0]);}}if(setValues(output,{user:true,reason:'keyboard',originalEvent:event}))keySession.changed=true;const handle=handles[index];if(handle)DOM.focusElement(handle);}

    opts=normalizeSliderOptions(opts);let initial=rangeMode()?[opts.min,opts.max]:opts.min;if(hasOwn(opts,'defaultValue'))initial=opts.defaultValue;if(hasOwn(opts,'value'))initial=opts.value;
    valueState=ValueController.create({value:normalize(initial),controlled:incoming.controlled===true,normalizeValue:normalize,equals:sameValues,copyValue:list=>list.slice()});
    instance.bindValueController(valueState, { projectValue: list => cloneExternal(list, rangeMode()), syncExternal:false });
    values=valueState.value;instance.setFieldValue(externalValue(),{force:true,silent:true,sync:true,source:'init',reason:'slider-init'});
    const initialValue=externalValue();
    formBridge=Control.createFormFieldBridge({root,target:opts.container,formField:opts.formField,document:doc,moveIntoRoot:false,projectLayout:Control.projectFormFieldLayout,name:opts.name,disabled:opts.disabled===true,readOnly:opts.readOnly===true,required:opts.required===true,value:externalValue(),serializeValue:opts.serializeValue,getValue:externalValue,onReset:()=>{if(valueState.controlled){values=valueState.value;instance.setFieldValue(externalValue(),{force:true,silent:true,sync:true,source:'form',reason:'reset-preserve'});buildProjection();if(formBridge)formBridge.setValue(externalValue(),{silent:true});return;}setValues(initialValue,{silent:true,source:'form',reason:'reset'});}});
    const capability=instance.bindCapabilityController({getCapabilities:()=>({focusable:true,tabbable:true,activatable:true,editable:true,draggable:true})});
    instance.bindFocusController(root,{manageTabIndex:false,navigation:{handlers:{}}});
    instance.bindInteractionController(root,{
        id:instance.id+'-slider-interaction',capabilityController:capability,
        resolveAction:event=>{
            if(opts.keyboard===false)return null;
            const handle=event.target&&event.target.closest?event.target.closest('.qxframe9a7c2-slider-handle'):null;
            if(!handle||!root.contains(handle))return null;
            if(event.key==='Escape'&&keyboardSession)return 'SLIDER_KEY';
            if(editableRange()&&(event.key==='Delete'||event.key==='Backspace'))return 'SLIDER_KEY';
            if(directionalKey(event.key))return 'SLIDER_KEY';
            return null;
        },
        operationOf:()=> 'edit',
        onAction:(_action,context)=>{
            const event=context.originalEvent,handle=event&&event.target&&event.target.closest?event.target.closest('.qxframe9a7c2-slider-handle'):null;
            const index=handle?Number(handle.getAttribute('data-slider-handle')):-1;
            if(!Number.isInteger(index)||index<0||index>=handles.length)return 'pass';
            handleKeydown(index,event);return 'handled';
        }
    });
    instance.bindFeedbackControl({updateOptions:patch=>{root.classList.toggle('is-busy',patch.busy===true);root.classList.toggle('is-error',patch.status==='error');root.classList.toggle('is-warning',patch.status==='warning');}});

    pointerSession=PointerSession.create({target:root,document:doc,threshold:0,getState:()=>({disabled:opts.disabled===true,readOnly:opts.readOnly===true}),canStart:detail=>{const event=detail.originalEvent;if(!event||!interactive())return false;const target=event.target,handle=target&&target.closest?target.closest('.qxframe9a7c2-slider-handle'):null;if(handle&&root.contains(handle)){const handleIndex=Number(handle.getAttribute('data-slider-handle'));if(!interactive(handleIndex))return false;if(event.preventDefault)event.preventDefault();activeHandle=handleIndex;beginDrag(event,'handle');return true;}if(track&&(target===track||track.contains(target))){if(event.preventDefault)event.preventDefault();if(draggableTrack()&&rangeMode()&&values.every((_,index)=>interactive(index)))beginDrag(event,'track');else{const trackValue=valueFromPointer(event),trackNearest=nearestHandleIndex(trackValue);if(trackNearest<0)return false;activeHandle=trackNearest;beginDrag(event,'handle');setNearestValue(trackValue,{user:true,reason:'track',originalEvent:event});}return true;}if(rail&&(target===rail||rail.contains(target))){if(event.preventDefault)event.preventDefault();const railValue=valueFromPointer(event),railNearest=nearestHandleIndex(railValue);if(railNearest<0)return false;activeHandle=railNearest;beginDrag(event,'handle');setNearestValue(railValue,{user:true,reason:'rail',originalEvent:event});return true;}return false;},onMove:detail=>{if(!dragging)return;const event=detail.originalEvent;if(dragMode==='track'&&rangeMode())moveRangeTrack(event);else setNearestValue(valueFromPointer(event),{user:true,reason:'drag',originalEvent:event});},onEnd:detail=>endDrag(detail.originalEvent),onCancel:detail=>endDrag(detail.originalEvent)});

    buildProjection();
    return {
        get root(){return root;},
        setValue(next,config){setValues(next,Utils.mergeOwn(config||{},{reason:(config&&config.reason)||'set-value'}));return api;},
        addHandle,removeHandle,getValue:externalValue,
        focus(index,focusOptions){if(destroyed)return false;const handle=handles[Math.max(0,Math.min(handles.length-1,Number(index)||0))];if(!handle||handle.tabIndex<0)return false;DOM.focusElement(handle,focusOptions||{preventScroll:true});return doc.activeElement===handle;},
        blur(){if(destroyed)return false;const active=handles.find(handle=>handle===doc.activeElement);if(active)active.blur();return !active||doc.activeElement!==active;},
        applyOptions(next,patch){if(destroyed)return false;const candidate=normalizeSliderOptions(Utils.mergeOwn(next));cancelKeyboardSession(null,'options-update');if(dragging){dragging=false;pointerSession.cancel('options-update');}opts=candidate;valueState.updateOptions({normalizeValue:normalize,equals:sameValues,copyValue:list=>list.slice()});if(hasOwn(patch||{},'controlled'))valueState.setControlled(next.controlled===true);if(hasOwn(patch||{},'value')){valueState.syncExternal(next.value,{silent:true,source:'options',reason:'options-value'});}else if(!valueState.controlled)valueState.setValue(values,{silent:true,source:'options',reason:'renormalize'});values=valueState.value;instance.setFieldValue(externalValue(),{force:true,silent:true,sync:true,source:'options',reason:'slider-options'});activeHandle=Math.max(0,Math.min(values.length-1,activeHandle));buildProjection();if(formBridge){formBridge.updateOptions({name:opts.name,disabled:opts.disabled===true,readOnly:opts.readOnly===true,required:opts.required===true,serializeValue:opts.serializeValue});formBridge.setValue(externalValue(),{silent:true});}return api;},
        getState(){return Object.freeze({value:externalValue(),values:values.slice(),min:opts.min,max:opts.max,step:opts.step,range:rangeMode(),editable:editableRange(),minCount:minHandleCount(),maxCount:maxHandleCount(),included:opts.included!==false,vertical:opts.vertical===true,reverse:opts.reverse===true,dragging,activeHandle,handleDisabled:values.map((_,index)=>handleDisabled(index)),disabled:opts.disabled===true,readOnly:opts.readOnly===true,destroyed});},
        getFormField(){return formBridge?formBridge.getFormField():null;},getFormBridge(){return formBridge;},getHandles(){return handles.slice();},
        dispose(){if(destroyed)return false;cancelKeyboardSession(null,'destroy');destroyed=true;dragging=false;try{projectionScope.dispose();}catch{}try{if(pointerSession)pointerSession.destroy();}catch{}pointerSession=null;try{if(valueState)valueState.destroy();}catch{}valueState=null;try{if(formBridge)formBridge.destroy();}catch{}formBridge=null;DOM.removeNode(root);root=rail=track=stepsHolder=marksHolder=null;handles=[];return true;}
    };
}

export class Slider extends FieldComponent {
    static profile = createSimpleFieldProfile('Slider');
    static options = Object.freeze({ min:0,max:100,step:1,range:false,included:true,vertical:false,reverse:false,keyboard:true,disabled:false,readOnly:false,allowCross:true,dots:false,marks:null,tooltip:{},size:'md',required:false });
    static immutableOptions = Object.freeze(['target','container','formField']);
    static optionNormalizers = Object.freeze({
        min:value=>finite(value,'min'), max:value=>finite(value,'max'), step:value=>value===null?null:finite(value,'step'), range:normalizeRange, size:normalizeSize,
        marks:value=>{if(value!=null&&(typeof value!=='object'||Array.isArray(value)))throw new TypeError('[QXFRAME9A7C2] Slider marks must be an object keyed by numeric values.');return value;},
        tooltip:value=>{if(value!=null&&(typeof value!=='object'||Array.isArray(value)))throw new TypeError('[QXFRAME9A7C2] Slider tooltip must be an options object or null.');return value;},
        handleDisabled:value=>{if(value!=null&&!Array.isArray(value)&&typeof value!=='function')throw new TypeError('[QXFRAME9A7C2] Slider handleDisabled must be an array, function, or null.');return value;}
    });
    static contract = ComponentContracts.get('Slider');
    static create(source = {}, overrides) { return new this(source, overrides).render(); }
    static enhance(input, options) { return this.create(input, options || {}); }

    constructor(source = {}, overrides) {
        const prepared = prepare(source, overrides);
        super(Utils.mergeOwn( prepared.incoming, { document: prepared.doc }));
        state.set(this, { prepared, runtime:null });
    }
    [componentHooks.beforeOptionsUpdate](patch, previous) { normalizeSliderOptions(Utils.mergeOwn( previous, patch)); }
    [componentHooks.render]() {
        const record=recordFor(this);if(record.runtime)return record.runtime.root;
        record.runtime=createRuntime(this,record.prepared);this.own(record.runtime);return record.runtime.root;
    }
    [fieldHooks.fieldOptionsUpdated](next,_previous,patch){const runtime=recordFor(this).runtime;if(runtime)runtime.applyOptions(next,patch);}
    [componentHooks.afterDestroy](){const record=state.get(this);if(record)record.runtime=null;}
    setValue(next,config){const r=recordFor(this).runtime;if(!r)return this;r.setValue(next,config);return this;}
    addHandle(value,config){const r=recordFor(this).runtime;return r?r.addHandle(value,config):false;}
    removeHandle(index,config){const r=recordFor(this).runtime;return r?r.removeHandle(index,config):false;}
    getValue(){const r=recordFor(this).runtime;return r?r.getValue():this.value;}
    focus(index,options){const r=recordFor(this).runtime;return r?r.focus(index,options):false;}
    blur(){const r=recordFor(this).runtime;return r?r.blur():false;}
    setDisabled(value){this.updateOptions({disabled:value===true});return this;}
    setReadOnly(value){this.updateOptions({readOnly:value===true});return this;}
    getState(){const r=recordFor(this).runtime;return r?r.getState():Object.freeze({value:this.value,values:Array.isArray(this.value)?this.value.slice():[this.value],destroyed:this.destroyed});}
    getRootElement(){const r=recordFor(this).runtime;return r?r.root:null;}
    getFormField(){const r=recordFor(this).runtime;return r?r.getFormField():null;}
    getFormBridge(){const r=recordFor(this).runtime;return r?r.getFormBridge():null;}
    getHandles(){const r=recordFor(this).runtime;return r?r.getHandles():[];}
}

export default Slider;
