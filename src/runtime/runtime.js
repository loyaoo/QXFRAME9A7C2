import { capabilityBindings } from './capabilityBindings.js';
import { moduleManifestData } from './moduleManifestData.js';
import { Components } from './componentAdapters.js';
export { Components };
import { ComponentRuntime, ComponentInitializer, configureComponents } from './componentRuntime.js';
import { PerformanceDiagnostics } from '../core/performanceDiagnostics.js';
import { EmptyProjection } from '../core/emptyProjection.js';
import { Control } from '../components/control.js';
import { TextField } from '../components/text-field.js';
import { Calendar } from '../components/calendar.js';
import { ColorPanel } from '../components/color-panel.js';
import { PeriodPanel } from '../components/period-panel.js';
import { TimePanel } from '../components/time-panel.js';
import { VirtualList } from '../components/virtual-list.js';
import { ItemCollection } from '../components/item-collection.js';
import { OptionList } from '../components/option-list.js';
import { Tree } from '../components/tree.js';
import { List } from '../components/list.js';
import { Item } from '../components/item.js';
import { NoticeClock } from '../core/noticeClock.js';
import { NoticeService } from '../core/noticeService.js';

function namespaceFor(namespace) {
    return Object.freeze(Object.fromEntries(capabilityBindings.filter(entry => entry.namespace === namespace).map(entry => [entry.name, entry.value])));
}
export const Core = Object.freeze(Object.assign({}, namespaceFor('core'), { PerformanceDiagnostics }));
export const Headless = namespaceFor('headless');
export const DOMHeadless = Object.freeze(Object.assign({}, namespaceFor('domHeadless'), { EmptyProjection }));

export const BuildingBlocks = Object.freeze({
    Calendar, ColorPanel, Control, Item, ItemCollection, List, NoticeClock, NoticeService, OptionList, PeriodPanel, TextField, TimePanel, Tree,
    VirtualList:Object.freeze({ create:function(){return VirtualList.create.apply(VirtualList,arguments);}, createDefaultDOM:VirtualList.createDefaultDOM })
});

configureComponents(Components);

const manifestByName = new Map(moduleManifestData.map(record => [record.name, record]));
export const ModuleManifest = Object.freeze({
    list:()=>moduleManifestData.slice(),
    has:name=>manifestByName.has(String(name || '').trim()),
    get:name=>manifestByName.get(String(name || '').trim()) || null
});

export const QXFRAME9A7C2 = Object.freeze({
    Core, Headless, DOMHeadless, BuildingBlocks, Components, ModuleManifest, ComponentRuntime, ComponentInitializer,
    init:TextField.init
});
export default QXFRAME9A7C2;
