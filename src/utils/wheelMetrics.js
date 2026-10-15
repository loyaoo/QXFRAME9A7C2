// Canonical wheel sizing metrics. Components may choose options; size-to-metric projection lives here.
import { Utils } from './utils.js';

const ITEM_HEIGHT_BY_SIZE = Object.freeze({ xs:24, sm:28, md:32, lg:36, xl:40 });
function normalizeSize(value) { return Utils.normalizeSize(value, 'md'); }
function itemHeight(value) { return ITEM_HEIGHT_BY_SIZE[normalizeSize(value)]; }
function viewportHeight(visibleItemCount, height) { return Math.max(1, Math.trunc(Number(visibleItemCount) || 1)) * Math.max(1, Number(height) || itemHeight('md')); }
function centerOffset(visibleItemCount, height) { return Math.max(0, Math.floor(Math.max(1, Math.trunc(Number(visibleItemCount) || 1)) / 2)) * Math.max(1, Number(height) || itemHeight('md')); }

export const WheelMetrics = Object.freeze({ sizes:ITEM_HEIGHT_BY_SIZE, normalizeSize, itemHeight, viewportHeight, centerOffset });
