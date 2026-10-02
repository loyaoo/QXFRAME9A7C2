import {normalizeConfig} from './engine.mjs';

const PALETTE_SEED_IDS=Object.freeze(['red','orange','yellow','lime','green','teal','cyan','blue','purple','pink','grey']);

const PROFILE_OVERRIDES=Object.freeze({
  shadow:Object.freeze({
    default:Object.freeze({}),
    flat:Object.freeze({
      '--qxframe9a7c2-theme-button-shadow-blur':'0',
      '--qxframe9a7c2-theme-card-shadow-blur-sm':'0',
      '--qxframe9a7c2-theme-card-shadow-blur-lg':'0',
      '--qxframe9a7c2-theme-card-shadow-y-lg':'0'
    }),
    crisp:Object.freeze({
      '--qxframe9a7c2-theme-button-shadow-blur':'var(--qxframe9a7c2-size-1)',
      '--qxframe9a7c2-theme-card-shadow-blur-sm':'var(--qxframe9a7c2-size-1)',
      '--qxframe9a7c2-theme-card-shadow-blur-lg':'var(--qxframe9a7c2-size-5)',
      '--qxframe9a7c2-theme-card-shadow-y-lg':'var(--qxframe9a7c2-size-2)'
    }),
    elevated:Object.freeze({
      '--qxframe9a7c2-theme-button-shadow-blur':'var(--qxframe9a7c2-size-2)',
      '--qxframe9a7c2-theme-card-shadow-blur-sm':'var(--qxframe9a7c2-size-2)',
      '--qxframe9a7c2-theme-card-shadow-blur-lg':'var(--qxframe9a7c2-size-12)',
      '--qxframe9a7c2-theme-card-shadow-y-lg':'var(--qxframe9a7c2-size-4)'
    })
  }),
  border:Object.freeze({
    default:Object.freeze({}),
    hairline:Object.freeze({
      '--qxframe9a7c2-family-control-border-width':'1px'
    }),
    standard:Object.freeze({
      '--qxframe9a7c2-family-control-border-width':'var(--qxframe9a7c2-size-1)'
    }),
    strong:Object.freeze({
      '--qxframe9a7c2-family-control-border-width':'var(--qxframe9a7c2-size-2)'
    })
  }),
  motion:Object.freeze({
    default:Object.freeze({}),
    none:Object.freeze({
      '--qxframe9a7c2-theme-motion-duration-1':'0ms',
      '--qxframe9a7c2-theme-motion-duration-2':'0ms',
      '--qxframe9a7c2-theme-motion-duration-3':'0ms',
      '--qxframe9a7c2-theme-motion-duration-5':'0ms'
    }),
    snappy:Object.freeze({
      '--qxframe9a7c2-theme-motion-duration-1':'90ms',
      '--qxframe9a7c2-theme-motion-duration-2':'140ms',
      '--qxframe9a7c2-theme-motion-duration-3':'180ms',
      '--qxframe9a7c2-theme-motion-duration-5':'280ms'
    }),
    relaxed:Object.freeze({
      '--qxframe9a7c2-theme-motion-duration-1':'180ms',
      '--qxframe9a7c2-theme-motion-duration-2':'240ms',
      '--qxframe9a7c2-theme-motion-duration-3':'320ms',
      '--qxframe9a7c2-theme-motion-duration-5':'480ms'
    })
  })
});

const MANAGED=Object.freeze(Object.fromEntries(Object.entries(PROFILE_OVERRIDES).map(([group,profiles])=>[
  group,
  Object.freeze([...new Set(Object.values(profiles).flatMap(profile=>Object.keys(profile)))])
])));

function clone(value){return JSON.parse(JSON.stringify(value));}

function applyPaletteSeed(config,palette,value){
  const id=String(palette||'').toLowerCase();
  if(!PALETTE_SEED_IDS.includes(id))throw new TypeError('Unknown physical Palette seed: '+palette);
  const next=clone(normalizeConfig(config));
  next.palette[id]=String(value||'').trim();
  return normalizeConfig(next);
}

function applyAdvancedProfile(config,group,profile){
  const groupId=String(group||''),profileId=String(profile||'');
  const profiles=PROFILE_OVERRIDES[groupId];
  if(!profiles)throw new TypeError('Unknown advanced profile group: '+group);
  if(!Object.prototype.hasOwnProperty.call(profiles,profileId))throw new TypeError('Unknown '+groupId+' profile: '+profile);

  const next=clone(normalizeConfig(config));
  next.advanced=next.advanced||{overrides:{}};
  next.advanced.overrides={...(next.advanced.overrides||{})};
  for(const name of MANAGED[groupId])delete next.advanced.overrides[name];
  Object.assign(next.advanced.overrides,profiles[profileId]);
  return normalizeConfig(next);
}

function inferAdvancedProfile(config,group){
  const normalized=normalizeConfig(config),profiles=PROFILE_OVERRIDES[group],overrides=normalized.advanced.overrides;
  if(!profiles)return null;
  for(const [id,profile] of Object.entries(profiles)){
    const managed=MANAGED[group];
    const exact=managed.every(name=>{
      const expected=profile[name];
      return expected===undefined?overrides[name]===undefined:overrides[name]===expected;
    });
    if(exact)return id;
  }
  return 'custom';
}

export {PALETTE_SEED_IDS,PROFILE_OVERRIDES,MANAGED,applyPaletteSeed,applyAdvancedProfile,inferAdvancedProfile};
