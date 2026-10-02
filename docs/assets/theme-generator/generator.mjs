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

function generateTheme(manifest,recipeData,input={}){
  const schema=readSchema(manifest);
  const config=normalizeConfig(input);
  const tokenMaps=createTokenMaps(schema);

  const colorReport=applyColorConfiguration(tokenMaps,schema,recipeData,config);

  // Later TG-D stages mutate the same public token maps here:
  // style preset -> typography -> radius -> density -> component presets.
  // Explicit advanced overrides remain intentionally last.
  applyExplicitOverrides(tokenMaps,schema,config);
  validateTokenMaps(tokenMaps,schema);

  const css=serializeCss(tokenMaps,schema,config);
  return Object.freeze({
    generatorVersion:GENERATOR_VERSION,
    schema,
    config,
    configJson:serializeConfig(config),
    reports:Object.freeze({color:colorReport}),
    tokens:Object.freeze({
      light:Object.freeze({...tokenMaps.light}),
      dark:Object.freeze({...tokenMaps.dark})
    }),
    css
  });
}

export {generateTheme};
