import { structuredTip } from "../tooltipCopy.js";

export const VISUALIZER_TIP_LABEL = {
  "View mode": structuredTip({
    overview: "Switch between the detailed Local Frame renderer and the schematic System Overview.",
    changes:
      "Local Frame shows one active host frame with its planets and orbit geometry. System Overview shows the whole stellar hierarchy and lets you jump between frames.",
    interpretAs:
      "Use Local Frame to inspect orbits and labels; use System Overview to understand multi-star hierarchy.",
    caveat: "System Overview is schematic and not drawn to the same physical scale as Local Frame.",
  }),
  "Body scale": structuredTip({
    overview: "Scale factor for representative body marker sizes in the system visualiser.",
    changes:
      "Only marker radii change. Orbital distances, periapsis placement, labels, and host-frame positions stay unchanged.",
    interpretAs:
      "Raise it when small bodies are hard to see; lower it when markers obscure labels or orbit detail.",
    caveat:
      "Representative marker size is visual readability, not physical planet/star radius scaling.",
  }),
  "Host frame": structuredTip({
    overview: "Active stellar host frame for the current detailed system view.",
    drawnFrom:
      "The selected star or pair frame in the saved stellar hierarchy. Single-star frames are S-type; pair barycentres are P-type.",
    changes:
      "Changing host frame changes which bodies, habitable zone, frost line, barycentre label, and orbit geometry are drawn.",
    caveat:
      "The visualizer shows the app's host-frame snapshot, not a full N-body integration of every component at once.",
    references: "See Science & Maths: multi-star host frames.",
  }),
  "Selected frame": structuredTip({
    overview: "Currently selected star or pair node in System Overview mode.",
    changes:
      "Selecting a frame changes the branch summary and gives you a target to inspect in Local Frame.",
    interpretAs:
      "A pair node represents a shared barycentre; a star node represents a single-star host frame.",
    caveat: "Hierarchy inset positions are schematic and may not be to physical scale.",
  }),
  "Controls help": structuredTip({
    overview:
      "Open the controls reference overlay for mouse, touch, keyboard, and focus interactions.",
    drawnFrom: "The visualizer's built-in interaction guide.",
    interpretAs: "Use this when camera movement, focus, zoom, or export controls are unclear.",
  }),
  "Logarithmic scale": structuredTip({
    overview: "Logarithmic AU spacing for orbital distances.",
    changes:
      "Compresses large outer-system distances so inner and outer orbits can fit in the same view.",
    interpretAs:
      "Useful for systems with distant giants, comets, or debris disks. Disable it for a linear distance read.",
    caveat:
      "Log scale changes visual spacing only; reported AU labels still use physical orbit distances.",
  }),
  "Physical size scale": structuredTip({
    overview:
      "Controls whether body markers use readable representative sizes or radius-aware scaling.",
    changes:
      "Representative keeps bodies easy to read. 1:1 scales body radii against the star radius while keeping the star's on-screen size fixed.",
    caveat:
      "Even 1:1 mode still uses visual compromises so planets remain visible at system scale.",
  }),
  Comets: structuredTip({
    overview:
      "Show or hide authored comet nuclei, clipped orbit arcs, comae, and tails in Local Frame mode.",
    drawnFrom:
      "Saved outer-object/comet settings, semi-major axis, eccentricity, periapsis orientation, and current orbital phase.",
    interpretAs:
      "The nucleus should sit on its drawn orbit; periapsis is the closest point to the selected host frame.",
    caveat: "Comet tails and clipped arcs are visual summaries, not a dust/plasma simulation.",
    references: "See Science & Maths: Keplerian orbit geometry.",
  }),
  "Eccentric orbits": structuredTip({
    overview: "Draw planet, gas-giant, and comet paths as ellipses instead of circles.",
    drawnFrom:
      "Each body's semi-major axis, eccentricity, longitude/argument of periapsis, inclination, and current orbital phase.",
    interpretAs:
      "Periapsis is the closest point to the host frame; apoapsis is the farthest point. Bodies move faster near periapsis and slower near apoapsis using the eccentric anomaly.",
    caveat:
      "Inclined orbits are projected into the camera view, so a tilted ellipse can look offset unless you rotate the scene.",
    references: "See Science & Maths: Keplerian orbit geometry.",
  }),
  "Pe / Ap markers": structuredTip({
    overview: "Show periapsis and apoapsis markers on eccentric orbits.",
    drawnFrom:
      "The same ellipse orientation used to draw eccentric orbits and place the body on its path.",
    interpretAs: "Pe marks closest approach to the host frame; Ap marks farthest distance.",
    caveat: "Markers are most meaningful when Eccentric orbits is enabled.",
    references: "See Science & Maths: Keplerian orbit geometry.",
  }),
  "Hill spheres": structuredTip({
    overview:
      "Show the approximate gravitational sphere of influence around each planet and gas giant.",
    drawnFrom: "Body mass, host mass, and orbital distance.",
    interpretAs:
      "A larger Hill sphere means a wider region where satellites can remain gravitationally associated.",
    caveat: "This is a stability guide, not a full long-term satellite integration.",
    references: "See Science & Maths: Hill sphere and moon stability.",
  }),
  "Lagrange points": structuredTip({
    overview: "Show L1-L5 equilibrium positions for each star-body pair.",
    drawnFrom:
      "The selected host frame, body orbit, and the Gascheau mass-ratio stability check for L4/L5.",
    interpretAs:
      "L4/L5 leading and trailing Trojan points sit about +/-60 degrees from the body; clicking a body reveals L1/L2 near it and L3 opposite the host.",
    caveat:
      "These are local restricted-three-body guides, not a capture or Trojan population model.",
    references: "See Science & Maths: Lagrange points.",
  }),
  "Frost line": structuredTip({
    overview: "Show the H2O frost line, the distance beyond which water ice can condense.",
    drawnFrom: "Host luminosity and the app's frost-line temperature threshold.",
    interpretAs:
      "Bodies beyond the line are more likely to retain icy building material during formation.",
    caveat:
      "It is a formation-context marker, not a guarantee that surface ice is currently stable.",
    references: "See Science & Maths: frost line.",
  }),
};

Object.assign(VISUALIZER_TIP_LABEL, {
  Labels: structuredTip({
    overview: "Show or hide text labels for rendered bodies and disk features.",
    changes: "Affects label visibility only; bodies, orbits, and exported data stay unchanged.",
    caveat: "Dense systems may still need leader lines or zooming to read cleanly.",
  }),
  "Label leader lines": structuredTip({
    overview: "Show or hide connector lines between labels and their bodies.",
    changes: "Improves readability in crowded views without moving the bodies.",
    caveat: "Leader lines are a visual aid and do not represent physical vectors.",
  }),
  Moons: structuredTip({
    overview: "Show or hide moon markers around planets and gas giants.",
    drawnFrom: "Saved moon lists, parent assignments, and solved moon orbits.",
    caveat: "Tiny moon paths are scaled for readability and are not a local N-body simulation.",
  }),
  Orbits: structuredTip({
    overview: "Show or hide orbital guide paths.",
    drawnFrom:
      "Planet, moon, gas-giant, comet, and frost-line orbit/placement data for the active host frame.",
    caveat:
      "Guide paths are rendered from the app's Keplerian/orbit snapshot, not live integration.",
    references: "See Science & Maths: Keplerian orbit geometry.",
  }),
  "Habitable zone": structuredTip({
    overview: "Show or hide the host-frame habitable-zone band.",
    drawnFrom: "Selected host luminosity, effective temperature, and HZ flux thresholds.",
    caveat: "The band is a flux screen, not a climate or life guarantee.",
    references: "See Science & Maths: habitable-zone model.",
  }),
  "Debris disks": structuredTip({
    overview: "Show or hide authored debris disk bands and asteroid-field particles.",
    drawnFrom: "Saved debris disk inner/outer edges, density, and host-frame assignment.",
    caveat: "Particles are visual texture, not individual tracked bodies.",
  }),
  Distances: structuredTip({
    overview: "Show orbital distance labels in AU.",
    drawnFrom: "Each body's solved or authored semi-major axis in the active host frame.",
    caveat: "Labels report physical distances even when logarithmic visual spacing is enabled.",
  }),
  "AU grid": structuredTip({
    overview: "Draw faint concentric reference rings at round AU intervals.",
    changes: "Adds scale guides to the canvas without changing body positions.",
    caveat: "Grid spacing follows the active scale mode and can be compressed in log view.",
  }),
  Rotation: structuredTip({
    overview: "Show or hide animated spin markers on planets and moons.",
    drawnFrom: "Saved rotation period, axial tilt, and visual body state.",
    caveat: "Spin markers are illustrative; surface weather and circulation are not animated.",
  }),
  "Axial tilt helpers": structuredTip({
    overview: "Show projected spin-axis helper overlays.",
    drawnFrom: "Each body's axial tilt and rendered orientation.",
    caveat:
      "Projection depends on camera angle, so the helper may look shorter or shifted in tilted views.",
  }),
  "Click zoom bodies": structuredTip({
    overview: "Enable click-to-focus interactions for planets, gas giants, and comets.",
    changes: "Single-click centres the body; double-click zooms to fit it.",
    caveat: "Turning this off only changes interaction behaviour, not rendering.",
  }),
  "Click zoom star": structuredTip({
    overview: "Enable click-to-focus interactions for the host star.",
    changes: "Single-click centres the star; double-click zooms in.",
    caveat: "In pair-host frames, barycentre and component-star labels may still be schematic.",
  }),
  "Multistar info": structuredTip({
    overview: "Show or hide the multistar hierarchy/context overlay.",
    drawnFrom: "Saved stellar topology, selected host frame, and companion branch data.",
    caveat: "The inset is explanatory and may not be to physical scale.",
    references: "See Science & Maths: multi-star host frames.",
  }),
  Debug: structuredTip({
    overview: "Enable console debug logging for visualizer internals.",
    changes: "Adds diagnostic logs for development and bug investigation.",
    caveat: "Debug logging can be noisy and is not needed for normal use.",
  }),
  Speed: structuredTip({
    overview: "Animation speed in simulated Earth-days per second.",
    changes: "Changes orbital/spin playback rate only.",
    caveat: "High speeds make eccentric orbits harder to inspect frame by frame.",
  }),
  Centre: structuredTip({
    overview: "Reset camera orientation and zoom to the default centred view.",
    changes: "Only camera state changes; no system data is altered.",
  }),
  Refresh: structuredTip({
    overview: "Redraw the visualizer from latest saved world data.",
    drawnFrom: "Current saved star/system/body state.",
    caveat: "Unsaved draft edits on other pages may not appear until committed.",
  }),
  Play: structuredTip({
    overview: "Toggle orbital animation on or off.",
    changes: "Pauses or resumes visual phase motion; saved orbital elements do not change.",
  }),
  "Reset view": structuredTip({
    overview: "Reset zoom and pan to the default overview.",
    changes: "Only camera state changes.",
  }),
  Controls: structuredTip({
    overview: "Toggle the visualizer controls panel.",
    changes: "Shows or hides display options, animation settings, and scale controls.",
  }),
  Fullscreen: structuredTip({
    overview: "Enter browser fullscreen mode for the visualizer.",
    changes: "Expands the canvas viewport if the browser grants fullscreen permission.",
    caveat: "Exit behaviour is controlled by the browser.",
  }),
  "Download image": structuredTip({
    overview: "Save a static PNG snapshot of the current canvas view.",
    drawnFrom: "The currently rendered visualizer frame.",
    caveat:
      "Only the visible canvas is exported; hidden controls and off-screen data are not included.",
  }),
  "Download GIF": structuredTip({
    overview: "Record a short animated GIF from the current canvas view.",
    drawnFrom: "The current animated visualizer state.",
    caveat: "Available only while animation is playing and may be limited by browser performance.",
  }),
  "Cluster Labels": structuredTip({
    overview: "Show or hide labels on plotted local-cluster systems.",
    changes: "Affects label visibility only.",
  }),
  Links: structuredTip({
    overview: "Draw guide lines from each system to the X/Z plane.",
    interpretAs: "Useful for reading 3D height/depth in the cluster view.",
    caveat: "Guide lines are spatial aids, not physical connections.",
  }),
  Axes: structuredTip({
    overview: "Show X/Y/Z reference axes in cluster view.",
    interpretAs: "Use axes to read orientation and vertical offset.",
  }),
  "Range/Bearing Grid": structuredTip({
    overview: "Show distance rings and degree bearings on the X/Z plane.",
    drawnFrom: "Local-cluster display scale and selected bearing-unit mode.",
    caveat: "The grid is a navigation aid, not a density model.",
  }),
  "Bearing Units": structuredTip({
    overview: "Switch bearing labels between degrees and mils.",
    changes: "Only the angle labels change; plotted positions remain the same.",
  }),
  Starfield: structuredTip({
    overview: "Show a decorative background field of distant stars.",
    changes: "Affects scene backdrop only.",
    caveat: "Background stars are visual ambience, not catalogue objects.",
  }),
  "Cluster Speed": structuredTip({
    overview: "Auto-spin speed for the local-cluster view.",
    changes: "Controls camera rotation playback, not system positions.",
  }),
});

export const VISUALIZER_TUTORIAL_STEPS = [
  {
    title: "Getting Started",
    body:
      "The Visualiser shows your system in interactive 3D. Left-drag to pan, " +
      "right-drag to rotate, scroll to zoom. Click a body to focus on it; " +
      "double-click to zoom in.",
  },
  {
    title: "Navigation",
    body:
      "Press Escape to release focus on a body. Press ? to see the full " +
      "control reference. The view transitions smoothly between local cluster " +
      "and system scales as you zoom.",
  },
  {
    title: "Display Options",
    body:
      "Toggle orbits, habitable zone, frost line, debris disks, Lagrange " +
      "points, and labels using the Controls panel. Switch between logarithmic " +
      "and linear distance scaling.",
  },
  {
    title: "Animation",
    body:
      "Play or pause orbital animation and adjust the speed multiplier. " +
      "Bodies move along their actual orbits with correct relative periods.",
  },
  {
    title: "Export",
    body:
      "Save a PNG snapshot of the current view, or record a GIF animation. " +
      "Use the fullscreen button for a larger viewport.",
  },
];
