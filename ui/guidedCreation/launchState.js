const GUIDED_LAUNCH_SESSION_KEY = "worldsmith.guidedCreation.launch";

function readLaunchRequest() {
  try {
    const raw = sessionStorage.getItem(GUIDED_LAUNCH_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export function queueGuidedCreationLaunch(request = {}) {
  if (!request || typeof request !== "object") return false;
  const objectType = String(request.objectType || "").trim();
  if (!objectType) return false;
  try {
    sessionStorage.setItem(
      GUIDED_LAUNCH_SESSION_KEY,
      JSON.stringify({
        objectType,
        uxMode: request.uxMode === "quick" ? "quick" : "guided",
        sourcePage: request.sourcePage ? String(request.sourcePage) : "",
        createdAt: Date.now(),
      }),
    );
    return true;
  } catch {
    return false;
  }
}

export function consumeGuidedCreationLaunch(objectType) {
  const requestedObjectType = String(objectType || "").trim();
  if (!requestedObjectType) return null;
  const request = readLaunchRequest();
  if (!request || request.objectType !== requestedObjectType) return null;
  try {
    sessionStorage.removeItem(GUIDED_LAUNCH_SESSION_KEY);
  } catch {
    // Ignore storage failures and still return the request we read.
  }
  return request;
}

export function clearGuidedCreationLaunch() {
  try {
    sessionStorage.removeItem(GUIDED_LAUNCH_SESSION_KEY);
    return true;
  } catch {
    return false;
  }
}
