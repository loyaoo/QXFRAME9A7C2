// Canonical static capability bindings retained from the verified Registry cutover metadata.

import { DOMProjection } from '../core/domProjection.js';
import { IdManager } from '../utils/id.js';
import { InteractionDetails } from '../core/interactionDetails.js';
import { ScrollVisibility } from '../core/scrollVisibility.js';
import { URLPolicy } from '../utils/url.js';
import { Utils } from '../utils/utils.js';
import { DOMTemplate } from '../core/domTemplate.js';
import { LayerManager } from '../core/layerManager.js';
import { MotionPresets } from '../core/motionPresets.js';
import { PopupSurface } from '../core/popupSurface.js';
import { DateUnit } from '../utils/dateUnit.js';
import { InteractionPolicy } from '../core/interactionPolicy.js';
import { OverlayFramePolicy } from '../core/overlayFramePolicy.js';
import { TextInputBehavior } from '../core/textInputBehavior.js';
import { ValueEquality } from '../utils/valueEquality.js';
import { DOM } from '../core/dom.js';
import { Events } from '../core/events.js';
import { Lifecycle } from '../core/lifecycle.js';
import { Scheduler } from '../core/scheduler.js';
import { SemanticStyles } from '../utils/semanticStyles.js';
import { LogicalOwnership } from '../core/logicalOwnership.js';
import { ClearAction } from '../core/clearAction.js';
import { ItemAccessors } from '../core/itemAccessors.js';
import { NoticePreset } from '../core/noticePreset.js';
import { OptionTransaction } from '../core/optionTransaction.js';
import { TemporalGrid } from '../core/temporalGrid.js';
import { Config } from '../core/config.js';
import { DOMBinding } from '../core/domBinding.js';
import { DismissableLayer } from '../core/dismissableLayer.js';
import { EventDelegation } from '../core/eventDelegation.js';
import { FocusManager } from '../core/focusManager.js';
import { FocusOrigin } from '../core/focusOrigin.js';
import { FormBridge } from '../core/formBridge.js';
import { InteractionModality } from '../core/interactionModality.js';
import { KeyboardNavigation } from '../core/keyboardNavigation.js';
import { ObserverHub } from '../core/observerHub.js';
import { PointerSession } from '../core/pointerSession.js';
import { PositionAdapter } from '../core/position.js';
import { PressInteraction } from '../core/pressInteraction.js';
import { Renderer } from '../core/renderer.js';
import { RovingProjection } from '../core/rovingProjection.js';
import { ScrollLock } from '../core/scrollLock.js';
import { ActiveItem } from '../core/activeItem.js';
import { AsyncTask } from '../core/asyncTask.js';
import { Collection } from '../core/collection.js';
import { Disclosure } from '../core/disclosure.js';
import { HierarchicalSelection } from '../core/hierarchicalSelection.js';
import { ItemSchema } from '../core/itemSchema.js';
import { OpenStateBridge } from '../core/openStateBridge.js';
import { PaginationModel } from '../core/paginationModel.js';
import { SearchState } from '../core/searchState.js';
import { SegmentedInput } from '../core/segmentedInput.js';
import { Selection } from '../core/selection.js';
import { SelectionTags } from '../core/selectionTags.js';
import { TokenInput } from '../core/tokenInput.js';
import { TransformModel } from '../core/transformModel.js';
import { TreeModel } from '../core/treeModel.js';
import { ValueController } from '../core/valueController.js';
import { FieldHost } from '../core/fieldHost.js';
import { FocusScope } from '../core/focusScope.js';
import { InteractionIsolation } from '../core/interactionIsolation.js';
import { KeyboardRegion } from '../core/keyboardRegion.js';
import { MotionCore } from '../core/motion.js';
import { ReorderInteraction } from '../core/reorderInteraction.js';
import { ResponsiveOverflow } from '../core/responsiveOverflow.js';
import { TagNavigation } from '../core/tagNavigation.js';
import { TriggerInteraction } from '../core/triggerInteraction.js';
import { Virtualizer } from '../core/virtualizer.js';
import { AsyncAction } from '../core/asyncAction.js';
import { AsyncTaskGroup } from '../core/asyncTaskGroup.js';
import { TableModel } from '../core/tableModel.js';
import { UploadLifecycle } from '../core/uploadLifecycle.js';
import { FocusTrap } from '../core/focusTrap.js';
import { OverlayFrameShell } from '../core/overlayFrameShell.js';
import { OverlayRuntime } from '../core/overlayRuntime.js';
import { Transition } from '../core/transition.js';
import { TransitionGroup } from '../core/transitionGroup.js';
import { NumericInput } from '../core/numericInput.js';
import { PickerSession } from '../core/pickerSession.js';

export const capabilityBindings = Object.freeze([
    Object.freeze({ name: 'DOMProjection', namespace: 'core', value: DOMProjection, metadata: Object.freeze({"name":"DOMProjection","dependencies":[]}) }),
    Object.freeze({ name: 'IdManager', namespace: 'core', value: IdManager, metadata: Object.freeze({"name":"IdManager","dependencies":[]}) }),
    Object.freeze({ name: 'InteractionDetails', namespace: 'core', value: InteractionDetails, metadata: Object.freeze({"name":"InteractionDetails","dependencies":[]}) }),
    Object.freeze({ name: 'ScrollVisibility', namespace: 'core', value: ScrollVisibility, metadata: Object.freeze({"name":"ScrollVisibility","dependencies":[]}) }),
    Object.freeze({ name: 'URLPolicy', namespace: 'core', value: URLPolicy, metadata: Object.freeze({"name":"URLPolicy","dependencies":[]}) }),
    Object.freeze({ name: 'Utils', namespace: 'core', value: Utils, metadata: Object.freeze({"name":"Utils","dependencies":[]}) }),
    Object.freeze({ name: 'DOMTemplate', namespace: 'domHeadless', value: DOMTemplate, metadata: Object.freeze({"name":"DOMTemplate","dependencies":[],"coreDependencies":["DOM"],"headlessDependencies":[]}) }),
    Object.freeze({ name: 'LayerManager', namespace: 'domHeadless', value: LayerManager, metadata: Object.freeze({"name":"LayerManager","dependencies":[],"coreDependencies":[],"headlessDependencies":[]}) }),
    Object.freeze({ name: 'MotionPresets', namespace: 'domHeadless', value: MotionPresets, metadata: Object.freeze({"name":"MotionPresets","dependencies":[],"coreDependencies":[],"headlessDependencies":[]}) }),
    Object.freeze({ name: 'PopupSurface', namespace: 'domHeadless', value: PopupSurface, metadata: Object.freeze({"name":"PopupSurface","dependencies":[],"coreDependencies":[],"headlessDependencies":[]}) }),
    Object.freeze({ name: 'DateUnit', namespace: 'headless', value: DateUnit, metadata: Object.freeze({"name":"DateUnit","coreDependencies":[]}) }),
    Object.freeze({ name: 'InteractionPolicy', namespace: 'headless', value: InteractionPolicy, metadata: Object.freeze({"name":"InteractionPolicy","coreDependencies":[]}) }),
    Object.freeze({ name: 'OverlayFramePolicy', namespace: 'headless', value: OverlayFramePolicy, metadata: Object.freeze({"name":"OverlayFramePolicy","coreDependencies":[]}) }),
    Object.freeze({ name: 'TextInputBehavior', namespace: 'headless', value: TextInputBehavior, metadata: Object.freeze({"name":"TextInputBehavior","coreDependencies":[]}) }),
    Object.freeze({ name: 'ValueEquality', namespace: 'headless', value: ValueEquality, metadata: Object.freeze({"name":"ValueEquality","coreDependencies":[]}) }),
    Object.freeze({ name: 'DOM', namespace: 'core', value: DOM, metadata: Object.freeze({"name":"DOM","dependencies":["Utils"]}) }),
    Object.freeze({ name: 'Events', namespace: 'core', value: Events, metadata: Object.freeze({"name":"Events","dependencies":["Utils"]}) }),
    Object.freeze({ name: 'Lifecycle', namespace: 'core', value: Lifecycle, metadata: Object.freeze({"name":"Lifecycle","dependencies":["Utils"]}) }),
    Object.freeze({ name: 'Scheduler', namespace: 'core', value: Scheduler, metadata: Object.freeze({"name":"Scheduler","dependencies":["Utils"]}) }),
    Object.freeze({ name: 'SemanticStyles', namespace: 'core', value: SemanticStyles, metadata: Object.freeze({"name":"SemanticStyles","dependencies":["DOMProjection"]}) }),
    Object.freeze({ name: 'LogicalOwnership', namespace: 'domHeadless', value: LogicalOwnership, metadata: Object.freeze({"name":"LogicalOwnership","dependencies":[],"coreDependencies":["Utils","IdManager"],"headlessDependencies":[]}) }),
    Object.freeze({ name: 'ClearAction', namespace: 'headless', value: ClearAction, metadata: Object.freeze({"name":"ClearAction","coreDependencies":[]}) }),
    Object.freeze({ name: 'ItemAccessors', namespace: 'headless', value: ItemAccessors, metadata: Object.freeze({"name":"ItemAccessors","coreDependencies":[]}) }),
    Object.freeze({ name: 'NoticePreset', namespace: 'headless', value: NoticePreset, metadata: Object.freeze({"name":"NoticePreset","coreDependencies":[]}) }),
    Object.freeze({ name: 'OptionTransaction', namespace: 'headless', value: OptionTransaction, metadata: Object.freeze({"name":"OptionTransaction","coreDependencies":["Utils"]}) }),
    Object.freeze({ name: 'TemporalGrid', namespace: 'headless', value: TemporalGrid, metadata: Object.freeze({"name":"TemporalGrid","coreDependencies":[]}) }),
    Object.freeze({ name: 'Config', namespace: 'core', value: Config, metadata: Object.freeze({"name":"Config","dependencies":["Events","Utils","DOMProjection"]}) }),
    Object.freeze({ name: 'DOMBinding', namespace: 'domHeadless', value: DOMBinding, metadata: Object.freeze({"name":"DOMBinding","dependencies":[],"coreDependencies":["DOM"],"headlessDependencies":[]}) }),
    Object.freeze({ name: 'DismissableLayer', namespace: 'domHeadless', value: DismissableLayer, metadata: Object.freeze({"name":"DismissableLayer","dependencies":["LayerManager"],"coreDependencies":["DOM","Lifecycle","Utils","InteractionDetails"],"headlessDependencies":[]}) }),
    Object.freeze({ name: 'EventDelegation', namespace: 'domHeadless', value: EventDelegation, metadata: Object.freeze({"name":"EventDelegation","dependencies":[],"coreDependencies":["DOM","Utils","InteractionDetails"],"headlessDependencies":[]}) }),
    Object.freeze({ name: 'FocusManager', namespace: 'domHeadless', value: FocusManager, metadata: Object.freeze({"name":"FocusManager","dependencies":["FocusOrigin"],"coreDependencies":["DOM"],"headlessDependencies":[]}) }),
    Object.freeze({ name: 'FormBridge', namespace: 'domHeadless', value: FormBridge, metadata: Object.freeze({"name":"FormBridge","dependencies":[],"coreDependencies":["DOM","Utils","IdManager"],"headlessDependencies":["ValueEquality"]}) }),
    Object.freeze({ name: 'FocusOrigin', namespace: 'domHeadless', value: FocusOrigin, metadata: Object.freeze({"name":"FocusOrigin","dependencies":[],"coreDependencies":["DOM","Scheduler"],"headlessDependencies":[]}) }),
    Object.freeze({ name: 'InteractionModality', namespace: 'domHeadless', value: InteractionModality, metadata: Object.freeze({"name":"InteractionModality","dependencies":[],"coreDependencies":[],"headlessDependencies":[]}) }),
    Object.freeze({ name: 'KeyboardNavigation', namespace: 'domHeadless', value: KeyboardNavigation, metadata: Object.freeze({"name":"KeyboardNavigation","dependencies":[],"coreDependencies":["DOM","Lifecycle","Utils"],"headlessDependencies":["ActiveItem"]}) }),
    Object.freeze({ name: 'ObserverHub', namespace: 'domHeadless', value: ObserverHub, metadata: Object.freeze({"name":"ObserverHub","dependencies":[],"coreDependencies":["Scheduler"],"headlessDependencies":[]}) }),
    Object.freeze({ name: 'PointerSession', namespace: 'domHeadless', value: PointerSession, metadata: Object.freeze({"name":"PointerSession","dependencies":[],"coreDependencies":["DOM","Lifecycle","InteractionDetails"],"headlessDependencies":["InteractionPolicy"]}) }),
    Object.freeze({ name: 'PositionAdapter', namespace: 'domHeadless', value: PositionAdapter, metadata: Object.freeze({"name":"PositionAdapter","dependencies":[],"coreDependencies":["Scheduler","Utils"],"headlessDependencies":[]}) }),
    Object.freeze({ name: 'PressInteraction', namespace: 'domHeadless', value: PressInteraction, metadata: Object.freeze({"name":"PressInteraction","dependencies":[],"coreDependencies":["DOM","Lifecycle","InteractionDetails"],"headlessDependencies":["InteractionPolicy"]}) }),
    Object.freeze({ name: 'Renderer', namespace: 'domHeadless', value: Renderer, metadata: Object.freeze({"name":"Renderer","dependencies":[],"coreDependencies":["DOM"],"headlessDependencies":[]}) }),
    Object.freeze({ name: 'RovingProjection', namespace: 'domHeadless', value: RovingProjection, metadata: Object.freeze({"name":"RovingProjection","dependencies":[],"coreDependencies":["DOM","Utils"],"headlessDependencies":[]}) }),
    Object.freeze({ name: 'ScrollLock', namespace: 'domHeadless', value: ScrollLock, metadata: Object.freeze({"name":"ScrollLock","dependencies":[],"coreDependencies":[],"headlessDependencies":[]}) }),
    Object.freeze({ name: 'ActiveItem', namespace: 'headless', value: ActiveItem, metadata: Object.freeze({"name":"ActiveItem","coreDependencies":["Utils","Events"]}) }),
    Object.freeze({ name: 'AsyncTask', namespace: 'headless', value: AsyncTask, metadata: Object.freeze({"name":"AsyncTask","coreDependencies":["Utils","Events"]}) }),
    Object.freeze({ name: 'Collection', namespace: 'headless', value: Collection, metadata: Object.freeze({"name":"Collection","coreDependencies":["Utils","Events"]}) }),
    Object.freeze({ name: 'Disclosure', namespace: 'headless', value: Disclosure, metadata: Object.freeze({"name":"Disclosure","coreDependencies":["Events","Utils"]}) }),
    Object.freeze({ name: 'HierarchicalSelection', namespace: 'headless', value: HierarchicalSelection, metadata: Object.freeze({"name":"HierarchicalSelection","coreDependencies":["Utils"]}) }),
    Object.freeze({ name: 'ItemSchema', namespace: 'headless', value: ItemSchema, metadata: Object.freeze({"name":"ItemSchema","coreDependencies":["Utils"]}) }),
    Object.freeze({ name: 'OpenStateBridge', namespace: 'headless', value: OpenStateBridge, metadata: Object.freeze({"name":"OpenStateBridge","coreDependencies":["Events","Utils"]}) }),
    Object.freeze({ name: 'PaginationModel', namespace: 'headless', value: PaginationModel, metadata: Object.freeze({"name":"PaginationModel","coreDependencies":["Events"]}) }),
    Object.freeze({ name: 'SearchState', namespace: 'headless', value: SearchState, metadata: Object.freeze({"name":"SearchState","coreDependencies":["Events","Utils"]}) }),
    Object.freeze({ name: 'SegmentedInput', namespace: 'headless', value: SegmentedInput, metadata: Object.freeze({"name":"SegmentedInput","coreDependencies":["Events","Utils"]}) }),
    Object.freeze({ name: 'Selection', namespace: 'headless', value: Selection, metadata: Object.freeze({"name":"Selection","coreDependencies":["Utils","Events"]}) }),
    Object.freeze({ name: 'SelectionTags', namespace: 'headless', value: SelectionTags, metadata: Object.freeze({"name":"SelectionTags","coreDependencies":["Utils"]}) }),
    Object.freeze({ name: 'TokenInput', namespace: 'headless', value: TokenInput, metadata: Object.freeze({"name":"TokenInput","coreDependencies":["Events","Utils"]}) }),
    Object.freeze({ name: 'TransformModel', namespace: 'headless', value: TransformModel, metadata: Object.freeze({"name":"TransformModel","coreDependencies":["Events"]}) }),
    Object.freeze({ name: 'TreeModel', namespace: 'headless', value: TreeModel, metadata: Object.freeze({"name":"TreeModel","coreDependencies":["Utils","Events"]}) }),
    Object.freeze({ name: 'ValueController', namespace: 'headless', value: ValueController, metadata: Object.freeze({"name":"ValueController","coreDependencies":["Utils","Events","InteractionDetails"],"headlessDependencies":["ValueEquality"]}) }),
    Object.freeze({ name: 'FieldHost', namespace: 'domHeadless', value: FieldHost, metadata: Object.freeze({"name":"FieldHost","dependencies":["DOMBinding"],"coreDependencies":["DOM"],"headlessDependencies":[]}) }),
    Object.freeze({ name: 'FocusScope', namespace: 'domHeadless', value: FocusScope, metadata: Object.freeze({"name":"FocusScope","dependencies":["FocusManager"],"coreDependencies":["DOM","Lifecycle","InteractionDetails"],"headlessDependencies":[]}) }),
    Object.freeze({ name: 'InteractionIsolation', namespace: 'domHeadless', value: InteractionIsolation, metadata: Object.freeze({"name":"InteractionIsolation","dependencies":["ObserverHub"],"coreDependencies":[],"headlessDependencies":[]}) }),
    Object.freeze({ name: 'KeyboardRegion', namespace: 'domHeadless', value: KeyboardRegion, metadata: Object.freeze({"name":"KeyboardRegion","dependencies":["KeyboardNavigation","FocusOrigin"],"coreDependencies":["DOM","Lifecycle","Utils"],"headlessDependencies":[]}) }),
    Object.freeze({ name: 'MotionCore', namespace: 'domHeadless', value: MotionCore, metadata: Object.freeze({"name":"MotionCore","dependencies":[],"coreDependencies":["Scheduler","Config"],"headlessDependencies":[]}) }),
    Object.freeze({ name: 'ReorderInteraction', namespace: 'domHeadless', value: ReorderInteraction, metadata: Object.freeze({"name":"ReorderInteraction","dependencies":["EventDelegation"],"coreDependencies":["DOM","Lifecycle"],"headlessDependencies":[]}) }),
    Object.freeze({ name: 'ResponsiveOverflow', namespace: 'domHeadless', value: ResponsiveOverflow, metadata: Object.freeze({"name":"ResponsiveOverflow","dependencies":["ObserverHub"],"coreDependencies":["Scheduler","DOM"],"headlessDependencies":[]}) }),
    Object.freeze({ name: 'TagNavigation', namespace: 'domHeadless', value: TagNavigation, metadata: Object.freeze({"name":"TagNavigation","dependencies":["KeyboardNavigation"],"coreDependencies":["Utils"],"headlessDependencies":[]}) }),
    Object.freeze({ name: 'TriggerInteraction', namespace: 'domHeadless', value: TriggerInteraction, metadata: Object.freeze({"name":"TriggerInteraction","dependencies":["PressInteraction"],"coreDependencies":["DOM","Lifecycle","Utils"],"headlessDependencies":[]}) }),
    Object.freeze({ name: 'Virtualizer', namespace: 'domHeadless', value: Virtualizer, metadata: Object.freeze({"name":"Virtualizer","dependencies":["ObserverHub"],"coreDependencies":["DOM","Lifecycle","Scheduler","Utils"],"headlessDependencies":[]}) }),
    Object.freeze({ name: 'AsyncAction', namespace: 'headless', value: AsyncAction, metadata: Object.freeze({"name":"AsyncAction","coreDependencies":["Events","Utils"]}) }),
    Object.freeze({ name: 'AsyncTaskGroup', namespace: 'headless', value: AsyncTaskGroup, metadata: Object.freeze({"name":"AsyncTaskGroup","coreDependencies":["Utils"]}) }),
    Object.freeze({ name: 'TableModel', namespace: 'headless', value: TableModel, metadata: Object.freeze({"name":"TableModel","coreDependencies":["Utils","Events"]}) }),
    Object.freeze({ name: 'UploadLifecycle', namespace: 'headless', value: UploadLifecycle, metadata: Object.freeze({"name":"UploadLifecycle","coreDependencies":["Utils","Events"]}) }),
    Object.freeze({ name: 'FocusTrap', namespace: 'domHeadless', value: FocusTrap, metadata: Object.freeze({"name":"FocusTrap","dependencies":["FocusScope"],"coreDependencies":[],"headlessDependencies":[]}) }),
    Object.freeze({ name: 'OverlayFrameShell', namespace: 'domHeadless', value: OverlayFrameShell, metadata: Object.freeze({"name":"OverlayFrameShell","dependencies":["Renderer"],"coreDependencies":["DOM","URLPolicy"],"headlessDependencies":["AsyncAction"]}) }),
    Object.freeze({ name: 'OverlayRuntime', namespace: 'domHeadless', value: OverlayRuntime, metadata: Object.freeze({"name":"OverlayRuntime","dependencies":["DismissableLayer","LayerManager","FocusManager","FocusScope","InteractionIsolation","ObserverHub","ScrollLock","PositionAdapter"],"coreDependencies":["Utils","DOM","Lifecycle","IdManager","Config","DOMProjection"],"headlessDependencies":[]}) }),
    Object.freeze({ name: 'Transition', namespace: 'domHeadless', value: Transition, metadata: Object.freeze({"name":"Transition","dependencies":["MotionCore","MotionPresets"],"coreDependencies":[],"headlessDependencies":[]}) }),
    Object.freeze({ name: 'TransitionGroup', namespace: 'domHeadless', value: TransitionGroup, metadata: Object.freeze({"name":"TransitionGroup","dependencies":["MotionCore","MotionPresets"],"coreDependencies":["Scheduler","Config"],"headlessDependencies":[]}) }),
    Object.freeze({ name: 'NumericInput', namespace: 'headless', value: NumericInput, metadata: Object.freeze({"name":"NumericInput","coreDependencies":["Events","Utils"]}) }),
    Object.freeze({ name: 'PickerSession', namespace: 'headless', value: PickerSession, metadata: Object.freeze({"name":"PickerSession","coreDependencies":["Utils"]}) }),
]);
