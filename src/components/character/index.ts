// src/components/character/index.ts
// Interactive Character Layer exports.

export { CharacterStage } from './CharacterStage';
export { CharacterRuntime } from './CharacterRuntime';
export { CharacterAnimationController } from './CharacterAnimationController';
export { loadCharacterGltf } from './loadCharacterGltf';
export {
  resolveDefaultClipName,
  findClipByName,
  normalizeClipNames,
} from './characterAnimationMath';
export {
  CHARACTER_ACTION_LIBRARY,
  resolveCharacterTimeScaleFromBpm,
  resolveActionPlaybackTimeScale,
  resolveActionClipName,
  listResolvableActions,
} from './characterActionMath';
export {
  resolveCharacterActionForEmotion,
  resolveBpmFromBeatMap,
  resolveBeatEmphasis,
  resolveCharacterBeatResponse,
} from './characterRhythmMath';
export {
  canAcceptCharacterClick,
  resolveNextSpecialAction,
  isSpecialActionActive,
  shouldSampleCharacterRaycast,
  stepHoverIntensity,
  resolveHoverEmissive,
  CHARACTER_CLICK_COOLDOWN_MS,
  CHARACTER_SPECIAL_ACTION_DURATION_SEC,
} from './characterInteractionMath';
export {
  resolveCharacterFit,
  measureObjectSize,
  applyCharacterFit,
} from './characterFitMath';
export { CharacterStageErrorBoundary } from './CharacterStageErrorBoundary';
