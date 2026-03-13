import { buildTerrainRaster } from "../engine/tectonics-sim/terrain.js";

self.onmessage = (event) => {
  const msg = event?.data || {};
  const requestId = Number(msg.id);
  if (!Number.isFinite(requestId)) return;

  try {
    const raster = buildTerrainRaster(msg.model, {
      width: Number(msg.width) || 1024,
      height: Number(msg.height) || 512,
      mode: String(msg.mode || "shaded"),
      topographyBandStepM: Number(msg.topographyBandStepM) || 250,
      topographyPeakColor: msg.topographyPeakColor ? String(msg.topographyPeakColor) : null,
      terrainStylePreset: String(msg.terrainStylePreset || "physical"),
      reliefStrength: Number(msg.reliefStrength) || 1,
      coastlineEmphasis: Number(msg.coastlineEmphasis) || 1,
    });
    const colors = new Uint8ClampedArray(raster.colors);
    const heights = new Float32Array(raster.heights);
    const contourHeights = new Float32Array(raster.contourHeights || raster.heights);
    const cellIds = new Uint16Array(raster.cellIds);
    const slopeDeg = new Float32Array(raster.slopeDeg || 0);
    const aspectDeg = new Float32Array(raster.aspectDeg || 0);
    const hillshade = new Float32Array(raster.hillshade || 0);

    self.postMessage(
      {
        id: requestId,
        ok: true,
        raster: {
          width: raster.width,
          height: raster.height,
          mode: raster.mode,
          colorsBuffer: colors.buffer,
          heightsBuffer: heights.buffer,
          contourHeightsBuffer: contourHeights.buffer,
          cellIdsBuffer: cellIds.buffer,
          slopeDegBuffer: slopeDeg.buffer,
          aspectDegBuffer: aspectDeg.buffer,
          hillshadeBuffer: hillshade.buffer,
        },
      },
      [
        colors.buffer,
        heights.buffer,
        contourHeights.buffer,
        cellIds.buffer,
        slopeDeg.buffer,
        aspectDeg.buffer,
        hillshade.buffer,
      ],
    );
  } catch (error) {
    self.postMessage({
      id: requestId,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
