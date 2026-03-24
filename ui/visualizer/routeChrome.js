export function createVisualizerRouteChrome({
  state,
  elements,
  TIP_LABEL,
  addDisposableListener,
  canUseSystemOverview,
  isSystemOverviewMode,
  isPhysicalScale,
  syncZoneToggleLabel,
  onHostFrameChange,
  onViewModeChange,
}) {
  const {
    root,
    vizDropdown,
    btnPlay,
    btnClusterPlay,
    btnExportImage,
    btnExportGif,
    offscaleNoteEl,
    hostFrameRow,
    hostFrameHintRow,
    hostFrameSelect,
    hostFrameLabelEl,
    hostFrameTipEl,
    hostFrameHintEl,
    viewModeRow,
    vizViewLocal,
    vizViewOverview,
    speedControlEl,
    distanceToggleWrap,
    sizeToggleWrap,
    bodyScaleRow,
    systemCheckToggles,
  } = elements;

  function syncExportButtons() {
    const playing = state.mode === "cluster" ? state.clusterIsPlaying : state.isPlaying;
    const overviewMode = state.mode === "system" && state.systemViewMode === "overview";
    const canCaptureGif = playing && !state.exportingGif && !overviewMode;
    if (btnExportGif) btnExportGif.disabled = !canCaptureGif;
    if (btnExportGif) {
      const gifHint = overviewMode
        ? "GIF export is unavailable in System Overview."
        : TIP_LABEL["Download GIF"] || "";
      btnExportGif.setAttribute("data-tip", gifHint);
      btnExportGif.title = overviewMode ? "GIF export is unavailable in System Overview." : "";
    }
    if (btnExportImage) btnExportImage.disabled = state.exportingGif;
    if (btnPlay) btnPlay.disabled = state.exportingGif;
    if (btnClusterPlay) btnClusterPlay.disabled = state.exportingGif;
  }

  function hideOffscaleZoneNotice() {
    if (!offscaleNoteEl) return;
    offscaleNoteEl.style.display = "none";
    offscaleNoteEl.setAttribute("aria-hidden", "true");
    offscaleNoteEl.textContent = "";
  }

  function getOffscaleNoticeTopPx() {
    const controlsOpen = vizDropdown?.style.display !== "none";
    const controlsHeight = controlsOpen ? vizDropdown?.getBoundingClientRect?.().height || 0 : 0;
    return Math.round(12 + controlsHeight);
  }

  function updateOffscaleZoneNotice(info) {
    if (!offscaleNoteEl) return;
    const lines = Array.isArray(info?.lines) ? info.lines.filter(Boolean) : [];
    if (state.mode !== "system" || !lines.length) {
      hideOffscaleZoneNotice();
      return;
    }
    offscaleNoteEl.style.top = `${getOffscaleNoticeTopPx()}px`;
    offscaleNoteEl.textContent = [
      "Extreme-distance zones not rendered",
      ...lines,
      "Arrow indicates off-canvas direction.",
    ].join("\n");
    offscaleNoteEl.style.display = "";
    offscaleNoteEl.setAttribute("aria-hidden", "false");
  }

  function syncHostFrameControls(snapshot) {
    if (!hostFrameRow || !hostFrameSelect || !hostFrameHintEl || !hostFrameHintRow) return;
    syncZoneToggleLabel(snapshot);
    const options = Array.isArray(snapshot?.hostFrameOptions) ? snapshot.hostFrameOptions : [];
    const show = (snapshot?.topologyKind || "single") !== "single" && options.length > 1;
    const overviewMode = isSystemOverviewMode(snapshot);
    hostFrameRow.style.display = show ? "" : "none";
    hostFrameHintRow.style.display = show ? "" : "none";
    if (hostFrameLabelEl) {
      hostFrameLabelEl.textContent = overviewMode ? "Selected frame" : "Host frame";
    }
    if (hostFrameTipEl) {
      hostFrameTipEl.setAttribute(
        "data-tip",
        overviewMode ? TIP_LABEL["Selected frame"] || "" : TIP_LABEL["Host frame"] || "",
      );
    }
    if (!show) return;
    if (hostFrameSelect.options.length !== options.length) {
      hostFrameSelect.replaceChildren(
        ...options.map((option) => {
          const node = hostFrameSelect.ownerDocument.createElement("option");
          node.value = option.id;
          node.textContent = option.label;
          return node;
        }),
      );
    }
    const resolvedHostFrameId = snapshot?.activeHostFrameId || options[0]?.id || "";
    if (hostFrameSelect.value !== resolvedHostFrameId) {
      hostFrameSelect.value = resolvedHostFrameId;
    }
    if (overviewMode) {
      const activePathLabels = (snapshot?.overviewModel?.activePathNodeIds || [])
        .map((nodeId) => snapshot?.overviewModel?.nodesById?.[nodeId]?.shortLabel || nodeId)
        .filter(Boolean);
      hostFrameHintEl.textContent = [
        "System overview is schematic, not to scale.",
        `${snapshot?.activeHostFrameLabel || "Selected frame"} is currently selected.`,
        activePathLabels.length > 0 ? `Hierarchy path: ${activePathLabels.join(" -> ")}.` : "",
        "Click a star or pair node to inspect that host frame, then use View locally for detailed orbits.",
      ]
        .filter(Boolean)
        .join(" ");
      return;
    }
    const isPairHost = snapshot?.activeHostFrame?.frameKind === "pair";
    const isHierarchical = snapshot?.topologyKind === "triple" || snapshot?.topologyKind === "quad";
    const hintParts = isPairHost
      ? [
          `${snapshot?.activeHostFrameLabel || "Host frame"} barycenter view.`,
          isHierarchical
            ? "Combined pair light sets the local climate in this frame while outer stars still add hierarchy-level flux and stability context."
            : "Combined pair light sets the climate in this frame.",
        ]
      : [
          `${snapshot?.activeHostFrameLabel || "Host frame"} view.`,
          Number(snapshot?.companionFluxEarth || 0) > 0.0005
            ? `${isHierarchical ? "Other stars add" : "Companion adds"} ~${Number(snapshot.companionFluxEarth).toFixed(3)}x Earth flux.`
            : isHierarchical
              ? "Outer-star heating is negligible in this host frame."
              : "Companion heating is negligible.",
        ];
    if (isPairHost && Number(snapshot?.activeHostFrame?.stability?.criticalInnerAu || 0) > 0) {
      hintParts.push(
        `Circumbinary stability floor near ${Number(snapshot.activeHostFrame.stability.criticalInnerAu).toFixed(2)} AU.`,
      );
    }
    if (snapshot?.hierarchySummary?.outerBranches?.length > 0) {
      hintParts.push(
        `Outer companion ${snapshot.hierarchySummary.outerBranches.length > 1 ? "branches" : "branch"}: ${snapshot.hierarchySummary.outerBranches
          .map((branch) => branch.label)
          .join(" | ")}.`,
      );
    }
    if (Number(snapshot?.fluxVariabilityFraction || 0) > 0.001) {
      hintParts.push(
        `Flux varies by about ${(Number(snapshot.fluxVariabilityFraction) * 100).toFixed(1)}% across the ${isHierarchical ? "host-star hierarchy" : "binary orbit"}.`,
      );
    }
    hostFrameHintEl.textContent = hintParts.join(" ");
  }

  function syncSystemViewModeControls(snapshot) {
    if (!viewModeRow || !vizViewLocal || !vizViewOverview) return;
    const supportsOverview = canUseSystemOverview(snapshot);
    if (!supportsOverview && state.systemViewMode !== "local") {
      state.systemViewMode = "local";
    }
    const overviewMode = isSystemOverviewMode(snapshot);
    viewModeRow.style.display = supportsOverview ? "" : "none";
    vizViewLocal.checked = !overviewMode;
    vizViewOverview.checked = overviewMode;

    if (btnPlay) btnPlay.style.display = overviewMode ? "none" : "";
    if (speedControlEl) speedControlEl.style.display = overviewMode ? "none" : "";
    if (distanceToggleWrap) distanceToggleWrap.style.display = overviewMode ? "none" : "";
    if (sizeToggleWrap) sizeToggleWrap.style.display = overviewMode ? "none" : "";
    if (bodyScaleRow) bodyScaleRow.style.display = overviewMode || isPhysicalScale() ? "none" : "";

    const showMap = {
      labels: true,
      leaderLines: !overviewMode,
      moons: !overviewMode,
      orbits: !overviewMode,
      hz: !overviewMode,
      debris: !overviewMode,
      comets: !overviewMode,
      eccentric: !overviewMode,
      peAp: !overviewMode,
      hill: !overviewMode,
      lagrange: !overviewMode,
      frost: !overviewMode,
      distances: !overviewMode,
      grid: !overviewMode,
      rotation: !overviewMode,
      axialTilt: !overviewMode,
      multistarInfo: true,
      clickBodies: !overviewMode,
      clickStar: !overviewMode,
      debug: true,
    };
    Object.entries(systemCheckToggles || {}).forEach(([key, node]) => {
      if (!node) return;
      node.style.display = showMap[key] ? "" : "none";
    });
  }

  function bindRouteControlEvents() {
    if (hostFrameSelect) {
      addDisposableListener(hostFrameSelect, "change", () => {
        const nextHostFrameId = String(hostFrameSelect.value || "").trim() || null;
        onHostFrameChange?.(nextHostFrameId);
      });
    }

    const viewModeInputs = root?.querySelectorAll?.('[name="vizViewMode"]') || [];
    viewModeInputs.forEach((element) => {
      addDisposableListener(element, "change", () => {
        const requestedMode = vizViewOverview?.checked ? "overview" : "local";
        onViewModeChange?.(requestedMode);
      });
    });
  }

  return {
    bindRouteControlEvents,
    getOffscaleNoticeTopPx,
    hideOffscaleZoneNotice,
    syncExportButtons,
    syncHostFrameControls,
    syncSystemViewModeControls,
    updateOffscaleZoneNotice,
  };
}
