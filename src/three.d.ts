// `three` ships its own types but doesn't expose them via package.json's
// "types"/"exports" map, so TS can't resolve them automatically.
// This ambient fallback silences the implicit-any import warning; if
// `@types/three` or an upstream fix is added later, this file can be removed.
declare module 'three';
