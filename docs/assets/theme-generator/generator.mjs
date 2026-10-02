import {
  GENERATOR_VERSION,
  normalizeConfig,
  serializeConfig,
  readSchema,
  createTokenMaps,
  applyExplicitOverrides,
  validateTokenMaps,
  serializeCss
} from './engine.mjs';
import { applyColorConfiguration } from './recipe-engine.mjs';
import { applyDesignConfiguration } from './design-engine.mjs';
import { auditReadability } from './audit-engine.mjs';

function generateTheme(manifest,recipeData,input={}){
  const schema=readSchema(manifest);
  const config=normalizeConfig(input);
  const tokenMaps=createTokenMaps(schema);

  const colorReport=applyColorConfiguration(tokenMaps,schema,recipeData,config);
  const designReport=applyDesignConfiguration(tokenMaps,schema,config);

  // Advanced explicit overrides remain intentionally last.
  applyExplicitOverrides(tokenMaps,schema,config);
  validateTokenMaps(tokenMaps,schema);
  const readabilityReport=auditReadability(tokenMaps);

  const css=serializeCss(tokenMaps,schema,config);
  return Object.freeze({
    generatorVersion:GENERATOR_VERSION,
    schema,
    config,
    configJson:serializeConfig(config),
    reports:Object.freeze({color:colorReport,design:designReport,readability:readabilityReport}),
    tokens:Object.freeze({
      light:Object.freeze({...tokenMaps.light}),
      dark:Object.freeze({...tokenMaps.dark})
    }),
    css
  });
}

export {generateTheme};
