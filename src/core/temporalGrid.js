
import { DateUnit } from '../utils/dateUnit.js';

function keyAction(key, options) {
  var opts=options||{}, columns=Math.max(1,Number(opts.columns||7));
  if(key==='ArrowLeft') return Object.freeze({ type:'step', amount:-1, action:'left' });
  if(key==='ArrowRight') return Object.freeze({ type:'step', amount:1, action:'right' });
  if(key==='ArrowUp') return Object.freeze({ type:'step', amount:-columns, action:'up' });
  if(key==='ArrowDown') return Object.freeze({ type:'step', amount:columns, action:'down' });
  if(key==='Home') return Object.freeze({ type:'home', amount:0, action:'home' });
  if(key==='End') return Object.freeze({ type:'end', amount:0, action:'end' });
  if(key==='PageUp') return Object.freeze({ type:'page', amount:-1, action:'page-up' });
  if(key==='PageDown') return Object.freeze({ type:'page', amount:1, action:'page-down' });
  if(key==='Enter' || key===' ') return Object.freeze({ type:'activate', amount:0, action:'activate' });
  return null;
}
function moveIndex(index, key, options) {
  var opts=options||{}, action=keyAction(key, opts), length=Math.max(0,Number(opts.length||0)), columns=Math.max(1,Number(opts.columns||1));
  if(!action || !length) return index;
  if(action.type==='step') return Math.max(0,Math.min(length-1,Number(index||0)+action.amount));
  if(action.type==='home') return opts.rowHome === true ? Math.floor(Number(index||0)/columns)*columns : 0;
  if(action.type==='end') return opts.rowHome === true ? Math.min(length-1,Math.floor(Number(index||0)/columns)*columns+columns-1) : length-1;
  return Number(index||0);
}
function moveDate(value, action, options) {
  var opts=options||{}, next=DateUnit.clone(value)||new Date(), step=Math.max(1,Number(opts.pageStep||1)), weekStarts=Number(opts.weekStartsOn||0);
  if(action==='left') next.setDate(next.getDate()-1);
  else if(action==='right') next.setDate(next.getDate()+1);
  else if(action==='up') next.setDate(next.getDate()-7);
  else if(action==='down') next.setDate(next.getDate()+7);
  else if(action==='page-up') next.setMonth(next.getMonth()-step);
  else if(action==='page-down') next.setMonth(next.getMonth()+step);
  else if(action==='home') { var start=DateUnit.startOfWeek(next,weekStarts); if(start) next=start; }
  else if(action==='end') { var end=DateUnit.startOfWeek(next,weekStarts); if(end){end.setDate(end.getDate()+6);next=end;} }
  return next;
}
function moveDateByKey(value, key, options) { var action=keyAction(key, Object.assign({columns:7},options||{})); return action && action.type !== 'activate' ? moveDate(value, action.action, options) : DateUnit.clone(value); }

export const TemporalGrid = Object.freeze({ keyAction, moveIndex, moveDate, moveDateByKey });
export { keyAction, moveIndex, moveDate, moveDateByKey };
