import assert from 'node:assert/strict';import {AsyncTask} from '../src/core/asyncTask.js';
let calls=0, task;
task=AsyncTask.create({task(){calls+=1;return 'ran';},onStateChange(state){if(state.pending)task.destroy();}});
await assert.rejects(task.run('x'),/AsyncTask is destroyed/);assert.equal(calls,0);
let cancelCalls=0,cancelTask;cancelTask=AsyncTask.create({task(){cancelCalls+=1;return 'ran';},onStateChange(state){if(state.pending)cancelTask.cancel('pending-callback');}});assert.equal(await cancelTask.run('x'),undefined);assert.equal(cancelCalls,0);cancelTask.destroy();
console.log(JSON.stringify({ok:true,calls:calls+cancelCalls}));
