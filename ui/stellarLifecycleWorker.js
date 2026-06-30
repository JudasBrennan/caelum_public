import { computeStellarLifecycleTrack } from "../engine/stellarLifecycle.js";

self.onmessage = (event) => {
  const msg = event?.data || {};
  const id = Number(msg.id);
  if (!Number.isFinite(id)) return;

  try {
    const track = computeStellarLifecycleTrack(msg.payload || {});
    self.postMessage({
      id,
      ok: true,
      signature: msg.signature || "",
      track,
    });
  } catch (err) {
    self.postMessage({
      id,
      ok: false,
      signature: msg.signature || "",
      error: err instanceof Error ? err.message : String(err),
    });
  }
};
