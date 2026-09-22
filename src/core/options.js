
import { copyOwn } from '../utils/utils.js';

function mergeOptions(base, next) {
    const output = Object.create(null);
    copyOwn(output, base);
    copyOwn(output, next);
    return output;
}

export const Options = Object.freeze({ merge: mergeOptions });
export { mergeOptions };
