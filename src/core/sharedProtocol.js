import { ActionContext } from './actionContext.js';
import { OperationResult } from './operationResult.js';
import { LogicalOwnerTree } from './logicalOwnerTree.js';
import { ControllableStateCore } from './controllableStateCore.js';
import { InteractionModality as InputModality } from './interactionModality.js';
import { DataRevision } from './dataRevision.js';
import { ProjectionScheduler } from './projectionScheduler.js';
import { EnvironmentPort } from './environmentPort.js';
import { Diagnostics } from './diagnostics.js';
import { ComponentProfile } from './componentProfile.js';

export const SharedProtocol = Object.freeze({
  ActionContext,
  OperationResult,
  LogicalOwnerTree,
  ControllableStateCore,
  InputModality,
  DataRevision,
  ProjectionScheduler,
  EnvironmentPort,
  Diagnostics,
  ComponentProfile
});
export default SharedProtocol;
