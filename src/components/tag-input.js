import { FieldComponent, fieldHooks } from './field.js';
import { Control } from './control.js';
import { componentHooks } from '../core/componentHooks.js';
import { getContract } from '../core/componentContracts.js';
import { KeyboardNavigation } from '../core/keyboardNavigation.js';
import { TagNavigation } from '../core/tagNavigation.js';
import { InteractionPolicy } from '../core/interactionPolicy.js';
import { Utils } from '../utils/utils.js';

const state = new WeakMap();
const own = Utils.own;
function copyValue(value) {
    return (Array.isArray(value) ? value : []).map(tag => {
        if (!tag || typeof tag !== 'object') throw new TypeError('[QXFRAME9A7C2] TagInput value entries must be objects.');
        if (tag.key === undefined || tag.key === null || tag.key === '') throw new TypeError('[QXFRAME9A7C2] TagInput value[].key is required.');
        if (tag.value === undefined || tag.value === null) throw new TypeError('[QXFRAME9A7C2] TagInput value[].value is required.');
        if (tag.label === undefined || tag.label === null) throw new TypeError('[QXFRAME9A7C2] TagInput value[].label is required.');
        return { key:String(tag.key), value:String(tag.value), label:String(tag.label), removable:tag.removable !== false, disabled:tag.disabled === true };
    });
}
function recordFor(instance){const record=state.get(instance);if(!record)throw new TypeError('[QXFRAME9A7C2] Invalid TagInput instance.');return record;}

export class TagInput extends FieldComponent {
    static contract = getContract('TagInput');
    static options = Object.freeze({ inputValue:'', creatable:true, clearable:false, value:[] });
    static immutableOptions = Object.freeze(['target','container','formField']);
    static optionNormalizers = Object.freeze({ value:copyValue, defaultValue:copyValue });
    static create(source, overrides){return new this(source, overrides).render();}
    static enhance(input, options){return this.create(input, options || {});}

    constructor(source={}, overrides){
        const fieldInit=Control.resolveFieldOptions(source,overrides),incoming=fieldInit.options;
        if(fieldInit.formField&&!own(incoming,'value')&&!own(incoming,'defaultValue')&&fieldInit.nativeValue!=='')incoming.value=[{key:fieldInit.nativeValue,value:fieldInit.nativeValue,label:fieldInit.nativeValue}];
        if(!own(incoming,'value')&&own(incoming,'defaultValue'))incoming.value=copyValue(incoming.defaultValue);
        super(incoming);
        if(!this.options.container&&!this.options.formField)throw new TypeError('[QXFRAME9A7C2] TagInput requires target/container or formField.');
        const record={fieldInit,control:null,keyboard:null,tagNavigation:null,inputValue:this.options.inputValue==null?'':String(this.options.inputValue),rendered:false};state.set(this,record);
        this.setFieldValue(copyValue(this.options.value),{silent:true,force:true});
    }

    #controlOptions(includeValue){
        const r=recordFor(this),opts=this.options,next={
            container:opts.container,formField:opts.formField,mode:'tags',tags:includeValue?copyValue(this.value):undefined,inputValue:r.inputValue,
            creatableTags:opts.creatable!==false,tokenSeparators:opts.tokenSeparators,tokenizeOnPaste:opts.tokenizeOnPaste!==false,addOnEnter:opts.addOnEnter!==false,addOnTab:opts.addOnTab===true,addOnBlur:opts.addOnBlur===true,uniqueTags:opts.unique!==false,maxTags:opts.maxTags,maxTagLength:opts.maxTagLength,normalizeTag:opts.normalizeTag,validateTag:opts.validateTag,beforeTagAdd:opts.beforeAdd,beforeTagEdit:opts.beforeEdit,beforeTagRemove:opts.beforeRemove,clearable:opts.clearable===true,clearVisibility:opts.clearVisibility,disabled:opts.disabled===true,readOnly:opts.readOnly===true,required:opts.required===true,size:opts.size,status:opts.status,variant:opts.variant,focusOutline:opts.focusOutline,placeholder:opts.placeholder,prefix:opts.prefix,suffix:opts.suffix,name:opts.name,
            onInput:(value,event)=>{r.inputValue=value;if(typeof this.options.onInput==='function')this.options.onInput(value,{originalEvent:event,instance:this});},
            onTagAdd:(tag,detail)=>{if(typeof this.options.onAdd==='function')this.options.onAdd(tag,{...detail,instance:this});},
            onTagEdit:(tag,detail)=>{if(typeof this.options.onEdit==='function')this.options.onEdit(tag,{...detail,instance:this});},
            onTagRemove:(tag,detail)=>{if(typeof this.options.onRemove==='function')this.options.onRemove(tag,{...detail,instance:this});},
            onTagsChange:(tags,detail)=>{this.setFieldValue(copyValue(tags),{silent:true,force:true});if(typeof this.options.onChange==='function')this.options.onChange(copyValue(tags),{...detail,instance:this});},
            onTagInvalid:detail=>{if(typeof this.options.onInvalid==='function')this.options.onInvalid({...detail,instance:this});},
            onFocus:event=>{if(typeof this.options.onFocus==='function')this.options.onFocus(event,this);},onBlur:event=>{if(typeof this.options.onBlur==='function')this.options.onBlur(event,this);},
            onKeydown:(event,controlApi,detail)=>{if(typeof this.options.onKeydown==='function'&&this.options.onKeydown(event,controlApi,detail)===true)return true;if(event&&event.defaultPrevented)return true;return this.#handleTagInputKeydown(event);}
        };
        Object.keys(next).forEach(key=>{if(next[key]===undefined)delete next[key];});if(!includeValue)delete next.tags;return next;
    }
    #handleTagInputKeydown(event){const r=recordFor(this);return r.tagNavigation?r.tagNavigation.handleKeydown(event):false;}
    #bindTagVirtualFocus(){
        const r=recordFor(this),input=r.control?.getInputElement?.();if(!input||!r.control?.getTags?.())return false;
        r.keyboard=this.own(KeyboardNavigation.create({root:input,focusRoot:()=>input,editableKeys:true,handlers:{}}));
        r.tagNavigation=this.own(TagNavigation.create({keyboard:r.keyboard,domainName:'tag-input-tags',owner:()=>r.control?.getTags?.()||null,getInputElement:()=>r.control?.getInputElement?.()||null,isLocked:()=>this.destroyed||InteractionPolicy.mutationLocked(this.options)}));return true;
    }
    [componentHooks.render](){const r=recordFor(this);if(r.rendered)return r.control.getRootElement();r.control=this.own(Control.create(this.#controlOptions(true)));r.control.getRootElement().classList.add('qxframe9a7c2-tag-input');this.#bindTagVirtualFocus();r.rendered=true;this.bindFocusTarget(r.control.getInputElement());return r.control.getRootElement();}
    [fieldHooks.fieldOptionsUpdated](next,previous,patch){const r=recordFor(this);if(!r.control)return;const update=this.#controlOptions(false);delete update.container;if(own(patch,'value')){const value=copyValue(next.value);this.setFieldValue(value,{silent:true,force:true});update.tags=value;}if(own(patch,'inputValue')){r.inputValue=next.inputValue==null?'':String(next.inputValue);update.inputValue=r.inputValue;}r.control.updateOptions(update);}

    setValue(value){if(this.destroyed)return false;const r=recordFor(this),next=copyValue(value);this.setFieldValue(next,{silent:true,force:true});r.control?.setTags(next);return this;}
    setInputValue(value){if(this.destroyed)return false;const r=recordFor(this);r.inputValue=value==null?'':String(value);r.control?.setInputValue(r.inputValue);return this;}
    #tagsOwner(){const r=recordFor(this);return r.control?.getTags?.()||null;}
    add(text,meta){return this.destroyed?false:(this.#tagsOwner()?.add(text,meta)??false);}
    editAt(index,text,meta){return this.destroyed?false:(this.#tagsOwner()?.editAt(index,text,meta)??false);}
    removeAt(index,meta){return this.destroyed?false:(this.#tagsOwner()?.removeAt(index,meta)??false);}
    clear(meta){return this.destroyed?false:(this.#tagsOwner()?.clear(meta)??false);}
    focus(){const c=recordFor(this).control;return this.destroyed||!c?false:c.focus();}
    blur(){const c=recordFor(this).control;return this.destroyed||!c?false:c.blur();}
    getState(){const r=recordFor(this),c=r.control?r.control.getState():null;return Object.freeze({value:c?copyValue(c.tags):copyValue(this.value),inputValue:c?c.inputValue:r.inputValue,disabled:c?c.disabled:this.disabled,readOnly:c?c.readOnly:this.readOnly,focused:c?c.focused:false,destroyed:this.destroyed});}
    getControl(){return recordFor(this).control;}
    getRootElement(){return recordFor(this).control?.getRootElement?.()||this.root;}
    getInputElement(){return recordFor(this).control?.getInputElement?.()||null;}
}
