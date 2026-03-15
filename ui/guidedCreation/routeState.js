function normalizeUxMode(value) {
  return value === "quick" ? "quick" : value === "guided" ? "guided" : "";
}

function joinHashSegments(segments = []) {
  return `#/${segments.filter(Boolean).join("/")}`;
}

export function buildGuidedRouteHash(pageKey, objectType, uxMode) {
  const page = String(pageKey || "").trim() || "star";
  const mode = normalizeUxMode(uxMode) || "guided";
  if (page === "planet" && objectType === "gasGiant") {
    return joinHashSegments(["planet", "gas-giant", mode]);
  }
  if (page === "planet" && objectType === "rockyPlanet") {
    return joinHashSegments(["planet", mode]);
  }
  return joinHashSegments([page, mode]);
}

export function buildBaseRouteHash(pageKey) {
  return joinHashSegments([String(pageKey || "").trim() || "star"]);
}

export function parseGuidedRoute(hashValue = "") {
  const hash = String(hashValue || "#/star");
  const pathPart = hash.split("#/")[1] || "star";
  const requestedPath = pathPart.split("?")[0];
  const segments = requestedPath.split("/").filter(Boolean);
  const pageKey = segments[0] || "star";
  const baseHash = buildBaseRouteHash(pageKey);
  let guided = null;

  if (pageKey === "planet") {
    const bodySegment = segments[1] || "";
    const routeMode = normalizeUxMode(segments[2] || bodySegment);
    const objectType = bodySegment === "gas-giant" ? "gasGiant" : "rockyPlanet";
    const isDedicated =
      !!routeMode &&
      (segments.length === 2 || (segments.length >= 3 && bodySegment === "gas-giant"));
    if (isDedicated) {
      guided = {
        objectType,
        uxMode: routeMode,
        dedicated: true,
        routeHash: buildGuidedRouteHash("planet", objectType, routeMode),
        baseHash,
      };
    }
  } else if (pageKey === "moon" || pageKey === "star") {
    const routeMode = normalizeUxMode(segments[1]);
    if (routeMode) {
      guided = {
        objectType: pageKey,
        uxMode: routeMode,
        dedicated: true,
        routeHash: buildGuidedRouteHash(pageKey, pageKey, routeMode),
        baseHash,
      };
    }
  }

  return {
    pageKey,
    baseHash,
    segments,
    guided,
  };
}
