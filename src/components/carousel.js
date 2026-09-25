import { Component } from '../core/component.js';
import { componentHooks } from '../core/componentHooks.js';
import { ComponentContracts } from '../core/componentContracts.js';
import { DOM } from '../core/dom.js';
import { Lifecycle } from '../core/lifecycle.js';
import { Scheduler } from '../core/scheduler.js';
import { Config } from '../core/config.js';
import { Renderer } from '../core/renderer.js';
import { PointerSession } from '../core/pointerSession.js';
import { ValueController } from '../core/valueController.js';
import { FocusController } from '../core/focusController.js';
import { InteractionController } from '../core/interactionController.js';
import { CapabilityController } from '../core/capabilityController.js';
import { MotionController } from '../core/motionController.js';
import { URLPolicy } from '../utils/url.js';
import { Utils } from '../utils/utils.js';

const EFFECTS = Object.freeze(['slide', 'fade', 'card']);
const DIRECTIONS = Object.freeze(['horizontal', 'vertical']);
const DOT_PLACEMENTS = Object.freeze(['top', 'bottom', 'start', 'end', 'outside', 'none']);
const DOT_TRIGGERS = Object.freeze(['click', 'hover']);
const LEGACY_ITEM_FIELDS = Object.freeze(['name', 'node', 'html']);
const state = new WeakMap();
const own = Utils.own;

function oneOf(value, allowed, label, fallback) {
    const next = String(value == null ? fallback : value).toLowerCase();
    if (allowed.indexOf(next) < 0) throw new TypeError('[QXFRAME9A7C2] Carousel ' + label + ' must be one of: ' + allowed.join(', ') + '.');
    return next;
}
function finiteNumber(value, fallback, label, minimum) {
    const number = Number(value == null ? fallback : value);
    if (!Number.isFinite(number) || number < minimum) throw new TypeError('[QXFRAME9A7C2] Carousel ' + label + ' must be a finite number >= ' + minimum + '.');
    return number;
}
function normalizeArrows(value) {
    if (value === true || value === false) return value;
    const next = String(value == null ? 'always' : value).toLowerCase();
    if (next !== 'always' && next !== 'hover' && next !== 'never') throw new TypeError('[QXFRAME9A7C2] Carousel arrows must be true, false, "always", "hover", or "never".');
    return next;
}
function normalizeItems(items) {
    if (!Array.isArray(items)) throw new TypeError('[QXFRAME9A7C2] Carousel items must be an array.');
    return items.map((item, index) => {
        if (item && typeof item === 'object' && !Renderer.isNodeLike(item) && !Array.isArray(item)) {
            LEGACY_ITEM_FIELDS.forEach(name => {
                if (own(item, name)) throw new TypeError('[QXFRAME9A7C2] Carousel item ' + index + ' does not accept legacy field "' + name + '".');
            });
        }
        return item;
    });
}
function renderOutput(container, output, doc) { return Renderer.replace(container, output == null ? '' : output, doc); }
function recordFor(instance) {
    const record = state.get(instance);
    if (!record) throw new TypeError('[QXFRAME9A7C2] Invalid Carousel instance.');
    return record;
}

export class Carousel extends Component {
    static profile = Object.freeze({
        name:'Carousel',
        value:Object.freeze({ mode:'current-index' }),
        focus:Object.freeze({ mode:'carousel-region' }),
        interaction:Object.freeze({ keymap:'carousel-navigation' }),
        capability:Object.freeze({ operations:Object.freeze(['navigate']) }),
        motion:Object.freeze({ mode:'slide-transition' }),
        ownership:Object.freeze({
            value:'ValueController', focus:'FocusController', interaction:'InteractionController',
            capability:'CapabilityController', motion:'MotionController'
        })
    });
    static options = Object.freeze({
        items: [], initialIndex: 0, loop: true, autoplay: false, interval: 4000,
        pauseOnHover: true, pauseOnFocus: true, arrows: true, dots: true,
        keyboard: true, swipe: true, draggable: true, effect: 'slide', direction: 'horizontal',
        dotPlacement: 'bottom', trigger: 'click', adaptiveHeight: false, duration: 320,
        easing: 'cubic-bezier(.2,.8,.2,1)', waitForAnimate: true, disabled: false,
        swipeThreshold: 36, cardHeight: 0
    });
    static optionNormalizers = Object.freeze({
        effect: value => oneOf(value, EFFECTS, 'effect', 'slide'),
        direction: value => oneOf(value, DIRECTIONS, 'direction', 'horizontal'),
        dotPlacement: value => oneOf(value, DOT_PLACEMENTS, 'dotPlacement', 'bottom'),
        trigger: value => oneOf(value, DOT_TRIGGERS, 'trigger', 'click'),
        arrows: normalizeArrows,
        interval: value => finiteNumber(value, 4000, 'interval', 0),
        duration: value => finiteNumber(value, 320, 'duration', 0),
        swipeThreshold: value => finiteNumber(value, 36, 'swipeThreshold', 0),
        cardHeight: value => finiteNumber(value, 0, 'cardHeight', 0),
        items: normalizeItems
    });
    static immutableOptions = Object.freeze(['container', 'document']);
    static contract = ComponentContracts.get('Carousel');

    [componentHooks.render]() {
        const existing = state.get(this);
        if (existing && existing.root) return existing.root;
        let opts = this.options;
        if (!opts.container || opts.container.nodeType !== 1) throw new TypeError('[QXFRAME9A7C2] Carousel container must be an Element.');

        const instance = this;
        const api = this;
        const doc = opts.document || opts.container.ownerDocument || globalThis.document;
        const scope = Lifecycle.createScope();
        let itemScope = Lifecycle.createScope();
        let current = 0;
        let animating = false;
        let pointerSession = null;
        let pausedByHover = false;
        let pausedByFocus = false;
        let pausedByVisibility = !!(doc && doc.hidden);
        let autoplayDelay = null;
        let cancelMotionWait = null;
        let animationMeta = null;
        let valueBinding = null;
        let focusController = null;
        let interactionController = null;
        let interactionLease = null;
        let capabilityController = null;

        const root = doc.createElement('div');
        const viewport = doc.createElement('div');
        const track = doc.createElement('div');
        const prev = doc.createElement('button');
        const next = doc.createElement('button');
        const dots = doc.createElement('div');

        root.className = 'qxframe9a7c2-carousel';
        viewport.className = 'qxframe9a7c2-carousel-viewport';
        track.className = 'qxframe9a7c2-carousel-track';
        prev.className = 'qxframe9a7c2-carousel-arrow qxframe9a7c2-carousel-prev';
        next.className = 'qxframe9a7c2-carousel-arrow qxframe9a7c2-carousel-next';
        dots.className = 'qxframe9a7c2-carousel-dots';
        prev.type = 'button';
        next.type = 'button';
        viewport.appendChild(track);
        root.appendChild(viewport);
        root.appendChild(prev);
        root.appendChild(next);
        root.appendChild(dots);
        opts.container.appendChild(root);

        const motionEnabled = () => Config.motionEnabled(root);
        const items = () => opts.items;
        const count = () => items().length;
        const itemKey = item => item && typeof item === 'object' && !Renderer.isNodeLike(item) && own(item, 'key') ? String(item.key) : null;
        const activeItemKey = () => count() ? itemKey(items()[current]) : null;
        const indexForKey = key => {
            if (key === null || key === undefined) return -1;
            for (let i = 0; i < count(); i += 1) if (itemKey(items()[i]) === key) return i;
            return -1;
        };
        const normalizeIndex = index => {
            const total = count();
            if (!total) return 0;
            let number = Number(index);
            if (!Number.isFinite(number)) throw new TypeError('[QXFRAME9A7C2] Carousel index must be a finite number.');
            number = Math.trunc(number);
            if (opts.loop !== false) return (number % total + total) % total;
            return Math.max(0, Math.min(number, total - 1));
        };
        const initialIndex = value => {
            if (!count()) return 0;
            const number = Number(value == null ? 0 : value);
            if (!Number.isFinite(number)) throw new TypeError('[QXFRAME9A7C2] Carousel initialIndex must be a finite number.');
            return Math.max(0, Math.min(Math.trunc(number), count() - 1));
        };
        current = initialIndex(opts.initialIndex);
        valueBinding = ValueController.createValueBinding({
            value: current,
            normalizeValue: value => normalizeIndex(value)
        });
        capabilityController = CapabilityController.create({
            getState: () => ({ disabled:instance.destroyed || opts.disabled === true }),
            getCapabilities: () => ({
                focusable:opts.keyboard !== false,
                navigable:opts.keyboard !== false,
                activatable:true,
                draggable:(opts.swipe === true || opts.draggable === true)
            })
        });
        focusController = FocusController.create({ root, document:doc, manageTabIndex:false, activeRegion:'carousel' });
        interactionController = InteractionController.create();
        scope.add(() => valueBinding.destroy());
        scope.add(() => capabilityController.destroy());
        scope.add(() => focusController.destroy());
        scope.add(() => interactionController.destroy());
        const syncCurrent = (next, meta, external) => {
            const normalized = normalizeIndex(next);
            if (external === true) valueBinding.syncExternal(normalized, Utils.mergeOwn({ silent:true, source:'options', reason:'carousel-sync' }, meta || {}));
            else valueBinding.write(normalized, Utils.mergeOwn({ silent:true, source:'carousel', reason:'carousel-current' }, meta || {}));
            current = valueBinding.value;
            return current;
        };

        const resolveItemOutput = (value, index, slot) => typeof value === 'function' ? value(Object.freeze({ index, item: items()[index], slot, instance: api })) : value;
        const defaultArrow = direction => {
            const glyph = doc.createElement('span');
            glyph.className = 'qxframe9a7c2-icon qxframe9a7c2-icon-caret-' + (direction === 'prev' ? 'left' : 'right') + ' is-line is-round is-stroke-3 is-sm';
            return glyph;
        };
        const renderArrow = (button, output, direction) => {
            const value = output === undefined ? defaultArrow(direction) : resolveItemOutput(output, current, direction + '-arrow');
            renderOutput(button, value, doc);
        };
        const renderSlideContent = (slide, item, index) => {
            if (Renderer.isNodeLike(item) || Array.isArray(item) || item == null || typeof item !== 'object') {
                renderOutput(slide, resolveItemOutput(item, index, 'content'), doc);
                return;
            }
            if (item.src) {
                const image = doc.createElement('img');
                image.className = 'qxframe9a7c2-carousel-image';
                image.src = URLPolicy.sanitize(item.src, 'image');
                image.alt = item.alt == null ? '' : String(item.alt);
                image.draggable = false;
                if (item.loading != null) image.loading = String(item.loading);
                if (item.objectFit != null) image.style.objectFit = String(item.objectFit);
                slide.appendChild(image);
            }
            if (own(item, 'content')) {
                const content = doc.createElement('div');
                content.className = 'qxframe9a7c2-carousel-content';
                renderOutput(content, resolveItemOutput(item.content, index, 'content'), doc);
                slide.appendChild(content);
            } else if (!item.src) {
                const emptyContent = doc.createElement('div');
                emptyContent.className = 'qxframe9a7c2-carousel-content';
                renderOutput(emptyContent, '', doc);
                slide.appendChild(emptyContent);
            }
            if (item.caption !== undefined && item.caption !== null && item.caption !== '') {
                const caption = doc.createElement('div');
                caption.className = 'qxframe9a7c2-carousel-caption';
                renderOutput(caption, resolveItemOutput(item.caption, index, 'caption'), doc);
                slide.appendChild(caption);
            }
        };
        const arrowVisible = () => opts.arrows !== false && opts.arrows !== 'never' && count() > 1;
        const syncControls = () => {
            const total = count();
            const locked = opts.disabled === true || total <= 1;
            const showArrows = arrowVisible();
            const showDots = !(opts.dots === false || opts.dotPlacement === 'none' || total <= 1);
            if (showArrows) { root.appendChild(prev); root.appendChild(next); }
            else { if (prev.parentNode) prev.parentNode.removeChild(prev); if (next.parentNode) next.parentNode.removeChild(next); }
            if (showDots) root.appendChild(dots); else if (dots.parentNode) dots.parentNode.removeChild(dots);
            prev.disabled = locked || (opts.loop === false && current <= 0);
            next.disabled = locked || (opts.loop === false && current >= total - 1);
            root.classList.toggle('is-arrows-hover', opts.arrows === 'hover');
            root.classList.toggle('is-arrows-always', opts.arrows === true || opts.arrows === 'always');
        };
        const adjacent = (index, delta) => {
            const total = count();
            if (!total) return -1;
            const candidate = index + delta;
            if (opts.loop !== false) return normalizeIndex(candidate);
            return candidate < 0 || candidate >= total ? -1 : candidate;
        };
        const markActive = () => {
            const previousCard = adjacent(current, -1);
            const nextCard = adjacent(current, 1);
            Array.prototype.forEach.call(track.children, (slide, index) => {
                slide.classList.toggle('is-active', index === current);
                slide.classList.toggle('is-prev-card', index === previousCard && index !== current);
                slide.classList.toggle('is-next-card', index === nextCard && index !== current);
            });
            Array.prototype.forEach.call(dots.children, (dot, index) => {
                dot.classList.toggle('is-active', index === current);
                const bar = dot.querySelector('.qxframe9a7c2-carousel-dot-bar');
                if (bar) bar.classList.toggle('is-autoplaying', index === current && shouldAutoplay() && !!(autoplayDelay && autoplayDelay.pending));
            });
        };
        const syncRoot = () => {
            root.classList.toggle('is-fade', opts.effect === 'fade');
            root.classList.toggle('is-card', opts.effect === 'card');
            root.classList.toggle('is-vertical', opts.direction === 'vertical');
            root.classList.toggle('is-horizontal', opts.direction === 'horizontal');
            root.classList.toggle('is-adaptive-height', opts.adaptiveHeight === true);
            root.classList.toggle('is-disabled', opts.disabled === true);
            DOM.setPrivate(root, 'dotPlacement', opts.dotPlacement);
            root.style.setProperty('--qxframe9a7c2-carousel-duration', Math.max(0, opts.duration) + 'ms');
            root.style.setProperty('--qxframe9a7c2-carousel-easing', String(opts.easing || 'ease'));
            root.style.setProperty('--qxframe9a7c2-carousel-autoplay-duration', Math.max(800, opts.interval) + 'ms');
            root.tabIndex = opts.keyboard !== false && opts.disabled !== true ? 0 : -1;
            syncControls();
        };

        const measureFrame = Scheduler.createFrameScheduler(() => {
            if (instance.destroyed) return;
            const active = track.children[current];
            if (opts.adaptiveHeight === true && active) viewport.style.height = Math.max(0, Number(active.offsetHeight || 0), Number(active.scrollHeight || 0)) + 'px';
            else viewport.style.height = '';
            if (opts.effect === 'card' && active) {
                const height = Math.max(Number(active.offsetHeight || 0), Number(active.scrollHeight || 0), Number(opts.cardHeight || 0));
                if (height > 0) root.style.setProperty('--qxframe9a7c2-carousel-card-height', height + 'px');
                else root.style.removeProperty('--qxframe9a7c2-carousel-card-height');
            } else root.style.removeProperty('--qxframe9a7c2-carousel-card-height');
        });
        scope.add(() => measureFrame.dispose());
        scope.add(() => itemScope.dispose());
        const requestMeasure = reason => measureFrame.request(reason || 'carousel');
        autoplayDelay = Scheduler.createDelayScheduler(() => {
            nextSlide({ reason: 'autoplay', source: 'autoplay', user: true });
            if (shouldAutoplay() && !autoplayDelay.pending) scheduleAutoplay();
        });
        const clearMotionWait = () => { if (!cancelMotionWait) return false; const cancel = cancelMotionWait; cancelMotionWait = null; return cancel(); };
        const clearAutoplayTimer = () => autoplayDelay && autoplayDelay.cancel();
        scope.add(() => { clearMotionWait(); autoplayDelay.dispose(); });

        function shouldAutoplay() {
            return opts.autoplay === true && opts.disabled !== true && count() > 1
                && !(opts.pauseOnHover !== false && pausedByHover)
                && !(opts.pauseOnFocus !== false && pausedByFocus)
                && !pausedByVisibility;
        }
        function scheduleAutoplay() {
            clearAutoplayTimer();
            if (!shouldAutoplay()) { markActive(); return api; }
            autoplayDelay.request(Math.max(800, Number(opts.interval || 0)), 'autoplay');
            markActive();
            return api;
        }
        function stop() { clearAutoplayTimer(); markActive(); return api; }
        function start() { pausedByHover = false; pausedByFocus = false; return scheduleAutoplay(); }
        function restartAutoplay() { return opts.autoplay === true ? scheduleAutoplay() : stop(); }
        function finishAnimation(reason) {
            if (!animating) return false;
            animating = false;
            clearMotionWait();
            const meta = animationMeta || {};
            animationMeta = null;
            if (typeof opts.afterChange === 'function') {
                opts.afterChange(current, Object.freeze({
                    current, previous: meta.previous, item: items()[current], reason: reason || meta.reason || 'transition-end',
                    source: meta.source || 'transition', originalEvent: meta.originalEvent || null, instance: api
                }));
            }
            return true;
        }
        function updatePosition(animate, meta) {
            if (!count()) current = 0;
            else current = normalizeIndex(current);
            const duration = animate === false || !motionEnabled() ? 0 : Math.max(0, Number(opts.duration || 0));
            track.style.transitionDuration = duration + 'ms';
            track.style.transitionTimingFunction = String(opts.easing || 'ease');
            if (opts.effect === 'fade' || opts.effect === 'card') track.style.transform = '';
            else if (opts.direction === 'vertical') {
                const active = track.children[current];
                const offset = active ? Number(active.offsetTop || 0) : 0;
                track.style.transform = 'translate3d(0,' + (-offset) + 'px,0)';
            } else track.style.transform = 'translate3d(' + (-current * 100) + '%,0,0)';
            markActive();
            syncControls();
            requestMeasure('position');
            clearMotionWait();
            if (animate !== false && duration > 0) {
                animating = true;
                animationMeta = meta || null;
                cancelMotionWait = MotionController.waitMotionEnd(track, 'transition', { duration }, () => {
                    cancelMotionWait = null;
                    finishAnimation('motion-end');
                });
            } else {
                animating = false;
                animationMeta = null;
            }
        }
        function emitChange(previous, meta) {
            if (typeof opts.onChange !== 'function') return;
            opts.onChange(current, Object.freeze({ current, previous, item: items()[current], reason: meta.reason, source: meta.source, originalEvent: meta.originalEvent || null, instance: api }));
        }
        function goTo(index, config) {
            if (instance.destroyed || !count()) return api;
            const meta = Utils.assignOwn({ reason: 'go-to', source: 'api', user: false, animate: true }, config || {});
            if (meta.user === true && !capabilityController.can('navigate')) return api;
            const resolved = normalizeIndex(index);
            if (resolved === current) { restartAutoplay(); return api; }
            if (animating && opts.waitForAnimate !== false && meta.animate !== false) return api;
            const previous = current;
            if (typeof opts.beforeChange === 'function' && opts.beforeChange(previous, resolved, Object.freeze({ reason: meta.reason, source: meta.source, originalEvent: meta.originalEvent || null, instance: api })) === false) return api;
            syncCurrent(resolved, { source:meta.source, reason:meta.reason, originalEvent:meta.originalEvent }, false);
            updatePosition(meta.animate !== false, { previous, reason: meta.reason, source: meta.source, originalEvent: meta.originalEvent || null });
            emitChange(previous, meta);
            if (!animating && typeof opts.afterChange === 'function') {
                opts.afterChange(current, Object.freeze({ current, previous, item: items()[current], reason: meta.reason, source: meta.source, originalEvent: meta.originalEvent || null, instance: api }));
            }
            restartAutoplay();
            return api;
        }
        function nextSlide(config) { return goTo(current + 1, Utils.assignOwn({ reason: 'next' }, config || {})); }
        function prevSlide(config) { return goTo(current - 1, Utils.assignOwn({ reason: 'prev' }, config || {})); }

        function renderItems() {
            itemScope.dispose();
            itemScope = Lifecycle.createScope();
            while (track.firstChild) track.removeChild(track.firstChild);
            while (dots.firstChild) dots.removeChild(dots.firstChild);
            syncCurrent(count() ? normalizeIndex(current) : 0, { source:'render', reason:'items-clamp' }, true);
            syncRoot();
            items().forEach((item, index) => {
                const slide = doc.createElement('div');
                slide.className = 'qxframe9a7c2-carousel-slide';
                DOM.setPrivate(slide, 'carouselIndex', String(index));
                if (item && typeof item === 'object' && !Renderer.isNodeLike(item) && own(item, 'key')) DOM.setPrivate(slide, 'carouselKey', String(item.key));
                renderSlideContent(slide, item, index);
                track.appendChild(slide);
                itemScope.add(DOM.listen(slide, 'click', event => {
                    if (opts.effect === 'card' && index !== current && opts.disabled !== true) goTo(index, { reason: 'card', source: 'pointer', user: true, originalEvent: event });
                }));
                Array.prototype.forEach.call(slide.querySelectorAll('img'), image => itemScope.add(DOM.listen(image, 'load', () => requestMeasure('image-load'))));
                const dot = doc.createElement('button');
                const bar = doc.createElement('span');
                dot.type = 'button';
                dot.className = 'qxframe9a7c2-carousel-dot';
                dot.disabled = opts.disabled === true;
                bar.className = 'qxframe9a7c2-carousel-dot-bar';
                if (typeof opts.renderDot === 'function') renderOutput(dot, opts.renderDot(index, item, Object.freeze({ active: index === current, instance: api })), doc);
                if (!dot.childNodes.length) dot.appendChild(bar);
                const activate = event => goTo(index, { reason: 'dot', source: DOM.activationSource(event), user: true, originalEvent: event });
                itemScope.add(DOM.listen(dot, 'click', activate));
                if (opts.trigger === 'hover') itemScope.add(DOM.listen(dot, 'mouseenter', activate));
                dots.appendChild(dot);
            });
            renderArrow(prev, opts.prevArrow, 'prev');
            renderArrow(next, opts.nextArrow, 'next');
            updatePosition(false, { previous: current, reason: 'render', source: 'render' });
            restartAutoplay();
            return api;
        }

        const userUnlocked = () => !instance.destroyed && opts.disabled !== true;
        const clearPointerState = () => { if (root) root.classList.remove('is-dragging'); };
        pointerSession = PointerSession.create({
            target: viewport,
            threshold: 0,
            axis: opts.direction === 'vertical' ? 'y' : 'x',
            getState: () => ({ disabled: !userUnlocked() || (!opts.swipe && !opts.draggable) || count() <= 1 }),
            capabilities: { draggable: true },
            canStart: detail => {
                const event = detail.originalEvent;
                return !(event && event.target && event.target.closest && event.target.closest('button,a,input,select,textarea'));
            },
            onStart: () => { if (root) root.classList.add('is-dragging'); },
            onEnd: detail => {
                clearPointerState();
                const primary = opts.direction === 'vertical' ? detail.deltaY : detail.deltaX;
                const cross = opts.direction === 'vertical' ? detail.deltaX : detail.deltaY;
                const threshold = Math.max(24, Math.min(80, Number(opts.swipeThreshold || 36)));
                if (Math.abs(primary) >= threshold && Math.abs(primary) > Math.abs(cross)) {
                    (primary < 0 ? nextSlide : prevSlide)({ reason: 'swipe', source: 'pointer', user: true, originalEvent: detail.originalEvent });
                }
            },
            onCancel: clearPointerState
        });
        scope.add(() => { if (pointerSession) pointerSession.destroy(); pointerSession = null; clearPointerState(); });
        scope.add(Config.onMotionChange(() => { if (!instance.destroyed && !motionEnabled() && animating) finishAnimation('motion-disabled'); }));
        scope.add(DOM.listen(prev, 'click', event => { if (event.preventDefault) event.preventDefault(); prevSlide({ reason: 'arrow', source: DOM.activationSource(event), user: true, originalEvent: event }); }));
        scope.add(DOM.listen(next, 'click', event => { if (event.preventDefault) event.preventDefault(); nextSlide({ reason: 'arrow', source: DOM.activationSource(event), user: true, originalEvent: event }); }));
        interactionLease = interactionController.registerScope({
            id:this.id + '-carousel',
            root,
            document:doc,
            owner:this,
            capability:capabilityController,
            resolveAction:event => {
                if (opts.keyboard === false) return null;
                const interactiveTarget = event.target && event.target !== root && event.target.closest
                    ? event.target.closest('button,a[href],input,select,textarea,[contenteditable="true"]')
                    : null;
                if (interactiveTarget && root.contains(interactiveTarget)) return null;
                const key = String(event && event.key || '');
                if ((opts.direction === 'horizontal' && key === 'ArrowLeft') || (opts.direction === 'vertical' && key === 'ArrowUp')) return 'PREVIOUS';
                if ((opts.direction === 'horizontal' && key === 'ArrowRight') || (opts.direction === 'vertical' && key === 'ArrowDown')) return 'NEXT';
                if (key === 'Home') return 'FIRST';
                if (key === 'End') return 'LAST';
                return null;
            },
            operationOf:() => 'navigate',
            onAction:(action, context) => {
                const event = context.originalEvent;
                if (action === 'PREVIOUS') prevSlide({ reason:'keyboard', source:'keyboard', user:true, originalEvent:event });
                else if (action === 'NEXT') nextSlide({ reason:'keyboard', source:'keyboard', user:true, originalEvent:event });
                else if (action === 'FIRST') goTo(0, { reason:'keyboard', source:'keyboard', user:true, originalEvent:event });
                else if (action === 'LAST') goTo(Math.max(0, count() - 1), { reason:'keyboard', source:'keyboard', user:true, originalEvent:event });
                else return 'pass';
                return 'handled';
            }
        });
        scope.add(() => { if (interactionLease) interactionLease.release(); interactionLease = null; });
        scope.add(DOM.listen(root, 'keydown', event => { interactionController.dispatch(event, { ownerId:this.id + '-carousel', source:'keyboard' }); }));
        scope.add(DOM.listen(root, 'mouseenter', () => { if (opts.pauseOnHover === false) return; pausedByHover = true; stop(); }));
        scope.add(DOM.listen(root, 'mouseleave', () => { if (opts.pauseOnHover === false) return; pausedByHover = false; scheduleAutoplay(); }));
        scope.add(DOM.listen(root, 'focusin', () => { if (opts.pauseOnFocus === false) return; pausedByFocus = true; stop(); }));
        scope.add(DOM.listen(root, 'focusout', event => { if (opts.pauseOnFocus === false) return; if (event.relatedTarget && root.contains(event.relatedTarget)) return; pausedByFocus = false; scheduleAutoplay(); }));
        if (doc && doc.addEventListener) scope.add(DOM.listen(doc, 'visibilitychange', () => { pausedByVisibility = !!doc.hidden; if (pausedByVisibility) stop(); else scheduleAutoplay(); }));

        const applyOptions = (nextOptions, patch) => {
            const hasInitial = own(patch, 'initialIndex');
            const key = activeItemKey();
            const fallbackIndex = current;
            opts = nextOptions;
            if (hasInitial) syncCurrent(initialIndex(patch.initialIndex), { source:'options', reason:'initial-index' }, true);
            else {
                const keyedIndex = indexForKey(key);
                syncCurrent(count() ? (keyedIndex >= 0 ? keyedIndex : normalizeIndex(fallbackIndex)) : 0, { source:'options', reason:'items-reconcile' }, true);
            }
            focusController.setDisabled(opts.disabled === true || opts.keyboard === false);
            if (opts.disabled === true) {
                if (pointerSession) pointerSession.cancel('disabled');
                clearPointerState();
            }
            renderItems();
            return api;
        };
        const apiMeta = (config, defaults) => Utils.mergeOwn( defaults || {}, config || {}, { source: 'api', user: false });
        const destroyRuntime = () => {
            if (pointerSession) pointerSession.cancel('destroy');
            clearPointerState();
            scope.dispose();
            DOM.removeNode(root);
            return true;
        };

        const record = {
            root, viewport, track, prev, next, dots,
            nextSlide, prevSlide, goTo, start, stop, renderItems, applyOptions, apiMeta,
            getState: () => Object.freeze({
                index: current, count: count(), loop: opts.loop !== false, autoplay: !!(autoplayDelay && autoplayDelay.pending),
                disabled: opts.disabled === true, effect: opts.effect, direction: opts.direction,
                dotPlacement: opts.dotPlacement, animating, destroyed: instance.destroyed
            }),
            getValueController: () => valueBinding.getValueController(),
            getFocusController: () => focusController,
            getInteractionController: () => interactionController,
            getCapabilityController: () => capabilityController,
            getMotionController: () => MotionController
        };
        state.set(this, record);
        this.own(destroyRuntime);
        renderItems();
        return root;
    }

    [componentHooks.optionsUpdated](next, _previous, patch) {
        const record = state.get(this);
        if (record && record.root) record.applyOptions(next, patch);
    }

    next(config) { const record = recordFor(this); return record.nextSlide(record.apiMeta(config)); }
    prev(config) { const record = recordFor(this); return record.prevSlide(record.apiMeta(config)); }
    goTo(index, config) { const record = recordFor(this); return record.goTo(index, record.apiMeta(config)); }
    setActiveItem(index, config) { const record = recordFor(this); return record.goTo(index, record.apiMeta(config, { reason: 'set-active-item' })); }
    start() { return recordFor(this).start(); }
    stop() { return recordFor(this).stop(); }
    setItems(nextItems) { return this.destroyed ? false : this.updateOptions({ items: nextItems }); }
    getState() { return recordFor(this).getState(); }
    getValueController() { return recordFor(this).getValueController(); }
    getFocusController() { return recordFor(this).getFocusController(); }
    getInteractionController() { return recordFor(this).getInteractionController(); }
    getCapabilityController() { return recordFor(this).getCapabilityController(); }
    getMotionController() { return recordFor(this).getMotionController(); }
    getRootElement() { return this.root; }
}

export { EFFECTS as CAROUSEL_EFFECTS, DIRECTIONS as CAROUSEL_DIRECTIONS, DOT_PLACEMENTS as CAROUSEL_DOT_PLACEMENTS };
export default Carousel;
