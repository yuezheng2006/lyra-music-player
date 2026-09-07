// electron/gpuCrashEscalationPolicy.cjs
// Pure policy for the macOS GPU-crash backend escalation ladder.
//
// Evidence (2026-08-03, macOS 26.4.1 + Electron 41.8.0 + Apple Silicon):
// the default Skia Graphite (Dawn Metal) backend sporadically kills the GPU
// helper mid-playback (child-process-gone, exitCode=512) and wedges the
// renderer for ~1min before Chromium declares the process gone. Upstream
// Graphite fixes (electron#49608 / #49904) are already in 41.8.0, so this is
// an OS/driver-level crash we can only route around:
//
// - Level 0: Chromium default (Graphite Metal; x64 boots with use-angle=gl).
// - Level 1: `disable-skia-graphite` -> Skia Ganesh. Still fully
//   hardware-accelerated (GPU compositing + WebGL intact), long-stable
//   pre-M135 backend. Cheap enough to apply on the FIRST crash.
// - Level 2: software-ish last resort - SwiftShader on arm64 (legacy GL ANGLE
//   fails outright there), legacy GL ANGLE on x64.
// - Level 3 (x64 only): SwiftShader.
//
// De-escalation never drops below level 1 once a crash has occurred:
// returning to Graphite after 20 stable minutes just re-enters the
// crash-every-session loop the user reported ("启动后播放一直卡死").

const GPU_CRASH_REPEAT_WINDOW_MS = 15 * 60 * 1000;

/** Highest ladder level for the arch (arm64 has no working legacy-GL step). */
const resolveMaxEscalationLevel = (arch) => (arch === 'x64' ? 3 : 2);

/** Chromium switches to append before app-ready for a given ladder level. */
const resolveGpuEscalationSwitches = (level, arch) => {
  if (level <= 0) return [];
  const switches = [
    ['ignore-gpu-blocklist'],
    ['disable-skia-graphite'],
  ];
  if (arch === 'x64') {
    if (level >= 2) switches.push(['use-angle', 'gl']);
    if (level >= 3) {
      switches.push(['use-angle', 'swiftshader'], ['enable-unsafe-swiftshader']);
    }
  } else if (level >= 2) {
    switches.push(['use-angle', 'swiftshader'], ['enable-unsafe-swiftshader']);
  }
  return switches;
};

/**
 * Next ladder level after a GPU-process death.
 * First crash always escalates 0 -> 1 (Ganesh keeps full HW acceleration, so
 * there is no reason to retry the backend that just crashed). Beyond level 1
 * escalation costs real performance, so it requires a repeat crash landing
 * within the repeat window of the previous relaunch.
 */
const resolveNextEscalationLevel = ({
  currentLevel,
  lastRelaunchAt,
  now,
  arch,
  repeatWindowMs = GPU_CRASH_REPEAT_WINDOW_MS,
}) => {
  const maxLevel = resolveMaxEscalationLevel(arch);
  if (currentLevel <= 0) return Math.min(1, maxLevel);
  const isRepeatCrash = lastRelaunchAt > 0 && (now - lastRelaunchAt) < repeatWindowMs;
  if (!isRepeatCrash) return currentLevel;
  return Math.min(currentLevel + 1, maxLevel);
};

/**
 * Step-down after a stable session. Floors at level 1: Graphite crashed on
 * this machine before, and Ganesh costs nothing, so never auto-return to it.
 */
const resolveDeEscalatedLevel = (currentLevel) => {
  if (currentLevel <= 0) return 0;
  return Math.max(currentLevel - 1, 1);
};

module.exports = {
  GPU_CRASH_REPEAT_WINDOW_MS,
  resolveMaxEscalationLevel,
  resolveGpuEscalationSwitches,
  resolveNextEscalationLevel,
  resolveDeEscalatedLevel,
};
