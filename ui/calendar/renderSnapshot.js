export function createCalendarRenderSnapshotReader({ state, loadWorld, buildContext }) {
  return function readRenderSnapshot(world = loadWorld()) {
    return {
      world,
      ctx: buildContext(world, state),
    };
  };
}
