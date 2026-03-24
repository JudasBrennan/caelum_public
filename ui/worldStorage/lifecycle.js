let lifecycleFlushHandlersInstalled = false;

export function installWorldStorageLifecycleFlushHandlers(requestFlush) {
  if (lifecycleFlushHandlersInstalled) return;

  const handlePagehide = () => {
    void requestFlush();
  };
  const handleVisibilityChange = () => {
    if (typeof document === "undefined") return;
    if (document.visibilityState !== "hidden") return;
    void requestFlush();
  };

  if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
    window.addEventListener("pagehide", handlePagehide);
    window.addEventListener("beforeunload", handlePagehide);
  }

  if (typeof document !== "undefined" && typeof document.addEventListener === "function") {
    document.addEventListener("visibilitychange", handleVisibilityChange);
  }

  lifecycleFlushHandlersInstalled = true;
}
