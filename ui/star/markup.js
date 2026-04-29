import { buildPageIntroHtml } from "../pageIntro.js";
import { getGuidedEntryModeTooltip } from "../guidedCreation/tooltips.js";
import { tipAttr, tipIcon } from "../tooltip.js";
import { TIP_LABEL } from "./constants.js";

export function buildStarPageMarkup({ hostComponentMassMinText }) {
  return `
    <div class="panel">
      <div class="panel__header">
        <h1 class="panel__title"><span class="ws-icon icon--star" aria-hidden="true"></span><span>Star</span></h1>
        <button id="starTutorials" type="button" class="ws-tutorial-trigger">Tutorials</button>
      </div>
      <div class="panel__body">
        ${buildPageIntroHtml({
          summary:
            "Define the home-system layout and shared stellar context before editing later body pages.",
          controls:
            "The system topology, default orbit host, and whichever star or shared pair is currently selected.",
          affects:
            "System slots, host-frame context, stellar flux, and stability assumptions used across planet and moon workflows.",
          primaryAction:
            "Choose the topology first, then confirm the default orbit host before tuning stellar properties.",
        })}
        <div id="starCurrentStatePanel" class="context-summary" aria-label="Current star system context">
          <div class="context-summary__header">
            <div>
              <div class="context-summary__title">Current System Context</div>
              <div id="starCurrentStateCopy" class="context-summary__copy"></div>
            </div>
          </div>
          <div id="starCurrentStateGrid" class="context-summary__grid"></div>
          <div id="starCurrentStateNotes" class="context-summary__notes"></div>
        </div>
      </div>
    </div>

    <div class="grid-2">
      <div class="panel">
        <div class="panel__header"><h2>Inputs</h2></div>
        <div class="panel__body">
          <div id="starCreateEntry" class="guided-entry-strip">
            <div class="guided-entry-strip__title">Create This Star</div>
            <div id="starCreateEntryHint" class="guided-entry-strip__copy">
              Quick applies a stellar archetype, Guided walks you to a recommendation, and
              Advanced is the direct editor below. Sol-ish Preset and Reset remain available as
              direct input helpers.
            </div>
            <div class="guided-entry-strip__modes">
              <button id="starCreateQuickBtn" type="button" class="guided-entry-strip__mode" ${tipAttr(getGuidedEntryModeTooltip("quick"))}>
                Quick
              </button>
              <button id="starCreateGuidedBtn" type="button" class="guided-entry-strip__mode" ${tipAttr(getGuidedEntryModeTooltip("guided"))}>
                Guided
              </button>
              <span class="guided-entry-strip__mode guided-entry-strip__mode--current" aria-current="page" ${tipAttr(getGuidedEntryModeTooltip("advanced"))}>
                Advanced
              </span>
            </div>
          </div>

          <div class="subsection">
            <div class="subsection__title">Home System Layout ${tipIcon(TIP_LABEL["Home System Architecture"] || "")}</div>
            <div id="starTopologyGuidance" class="context-summary__note context-summary__note--accent"></div>

            <div class="form-row">
              <div>
                <div class="label">Topology ${tipIcon(TIP_LABEL["Topology"] || "")}</div>
                <div class="hint" id="topologyHint">
                  Single keeps the classic one-star flow. Binary adds a companion and a shared pair orbit.
                </div>
              </div>
              <div>
                <select id="topologyKind" aria-label="Home system topology">
                  <option value="single">Single star</option>
                  <option value="binary">Binary system</option>
                  <option value="triple">Hierarchical triple</option>
                  <option value="quad">Hierarchical quad</option>
                </select>
              </div>
            </div>

            <div class="form-row" id="quadLayoutRow" style="display:none">
              <div>
                <div class="label">Quad Layout ${tipIcon(TIP_LABEL["Quad Layout"] || "")}</div>
                <div class="hint" id="quadLayoutHint">
                  Chain: one outer companion is added at each layer.
                </div>
              </div>
              <div class="physics-duo-toggle">
                <input type="radio" name="quadLayoutKind" id="quadLayoutChain" value="chain" />
                <label for="quadLayoutChain">Chain</label>
                <input type="radio" name="quadLayoutKind" id="quadLayoutPaired" value="paired" />
                <label for="quadLayoutPaired">Paired</label>
                <span></span>
              </div>
            </div>

            <div class="form-row" id="activeHostFrameRow" style="display:none">
              <div>
                <div class="label">Default Orbit Host ${tipIcon(TIP_LABEL["Default Orbit Host"] || "")}</div>
                <div class="hint">New planets and gas giants start here by default. Existing bodies stay where they are until reassigned later.</div>
              </div>
              <div>
                <select id="activeHostFrame" aria-label="Default orbit host"></select>
              </div>
            </div>
            <div class="hint" id="activeHostFrameSummary" role="status" aria-live="polite" aria-atomic="true" style="display:none;margin-top:6px"></div>

            <div id="topologyHealthPanel" class="subsection" style="display:none;margin-top:12px">
              <div class="subsection__title">Hierarchy Health ${tipIcon(TIP_LABEL["Hierarchy Health"] || "")}</div>
              <div class="hint" id="topologyHealthSummary" aria-live="polite"></div>
              <div class="hint" id="topologyHealthMeta" style="margin-top:6px"></div>
              <div id="topologyHealthLayers" style="margin-top:8px"></div>
            </div>
          </div>

          <div id="binaryAuthoringSection" class="subsection" style="display:none">
            <div class="subsection__title">Secondary Star ${tipIcon(TIP_LABEL["Companion Star"] || "")}</div>

            <div class="form-row">
              <div>
                <div class="label">Companion Name ${tipIcon(TIP_LABEL["Name"] || "")}</div>
                <div class="hint">Appears in topology-aware host-frame labels and future visualiser views.</div>
              </div>
              <div>
                <input id="companionName" type="text" maxlength="80" aria-label="Companion star name" />
              </div>
            </div>

            <div class="form-row">
              <div>
                <div class="label">Companion Mass <span class="unit">Msol</span> ${tipIcon(TIP_LABEL["Mass"] || "")}</div>
                <div class="hint">Shapes the companion luminosity, class, and future binary context.</div>
              </div>
              <div>
                <input id="companionMass" type="number" step="0.0001" min="${hostComponentMassMinText}" max="100" aria-label="Companion mass" />
              </div>
            </div>

            <div class="hint" id="companionSummaryHint" style="margin-top:6px"></div>

            <div id="binaryPairTitle" class="subsection__title" style="margin-top:14px">Inner Pair A+B ${tipIcon(TIP_LABEL["Binary Pair"] || "")}</div>

            <div class="form-row">
              <div>
                <div class="label">Semi-Major Axis <span class="unit">AU</span> ${tipIcon(TIP_LABEL["Binary Semi-Major Axis"] || "")}</div>
                <div class="hint">Average star-to-star separation. Wider pairs read as looser companions.</div>
              </div>
              <div>
                <input id="binarySemiMajorAxis" type="number" step="0.001" min="0.001" max="100000" aria-label="Binary semi-major axis" />
              </div>
            </div>

            <div class="form-row">
              <div>
                <div class="label">Eccentricity ${tipIcon(TIP_LABEL["Binary Eccentricity"] || "")}</div>
                <div class="hint">Controls how circular or stretched the binary orbit is.</div>
              </div>
              <div>
                <input id="binaryEccentricity" type="number" step="0.001" min="0" max="0.95" aria-label="Binary eccentricity" />
              </div>
            </div>

            <div class="form-row">
              <div>
                <div class="label">Inclination <span class="unit">deg</span> ${tipIcon(TIP_LABEL["Binary Inclination"] || "")}</div>
                <div class="hint">Stored for future orbit rendering and phase-aware views.</div>
              </div>
              <div>
                <input id="binaryInclination" type="number" step="0.1" min="0" max="180" aria-label="Binary inclination" />
              </div>
            </div>

            <div class="form-row">
              <div>
                <div class="label">Arg. Periapsis <span class="unit">deg</span> ${tipIcon(TIP_LABEL["Binary Argument of Periapsis"] || "")}</div>
                <div class="hint">Orientation of closest approach inside the orbital plane.</div>
              </div>
              <div>
                <input id="binaryArgPeriapsis" type="number" step="0.1" min="0" max="360" aria-label="Binary argument of periapsis" />
              </div>
            </div>

            <div class="form-row">
              <div>
                <div class="label">Mean Anomaly <span class="unit">deg</span> ${tipIcon(TIP_LABEL["Binary Mean Anomaly"] || "")}</div>
                <div class="hint">Saved orbital phase position for future animated layouts.</div>
              </div>
              <div>
                <input id="binaryMeanAnomaly" type="number" step="0.1" min="0" max="360" aria-label="Binary mean anomaly" />
              </div>
            </div>

            <div class="hint" id="binaryPairGuardrailHint" style="margin-top:8px"></div>
          </div>

          <div id="tertiaryAuthoringSection" class="subsection" style="display:none">
            <div class="subsection__title">Tertiary Star ${tipIcon(TIP_LABEL["Tertiary Star"] || "")}</div>

            <div class="form-row">
              <div>
                <div class="label">Tertiary Name ${tipIcon(TIP_LABEL["Name"] || "")}</div>
                <div class="hint">Appears in outer hierarchical host-frame labels and multi-star canvases.</div>
              </div>
              <div>
                <input id="tertiaryName" type="text" maxlength="80" aria-label="Tertiary star name" />
              </div>
            </div>

            <div class="form-row">
              <div>
                <div class="label">Tertiary Mass <span class="unit">Msol</span> ${tipIcon(TIP_LABEL["Mass"] || "")}</div>
                <div class="hint">Shapes the tertiary light contribution and the outer stability boundary.</div>
              </div>
              <div>
                <input id="tertiaryMass" type="number" step="0.0001" min="${hostComponentMassMinText}" max="100" aria-label="Tertiary mass" />
              </div>
            </div>

            <div class="hint" id="tertiarySummaryHint" style="margin-top:6px"></div>

            <div id="tertiaryPairTitle" class="subsection__title" style="margin-top:14px">Outer Pair (A+B)+C ${tipIcon(TIP_LABEL["Hierarchy Pair"] || "")}</div>

            <div class="form-row">
              <div>
                <div class="label">Semi-Major Axis <span class="unit">AU</span> ${tipIcon(TIP_LABEL["Binary Semi-Major Axis"] || "")}</div>
                <div class="hint" id="tertiaryPairAxisHint">Average separation between the inner pair and the tertiary star.</div>
              </div>
              <div>
                <input id="tripleOuterSemiMajorAxis" type="number" step="0.001" min="0.001" max="100000" aria-label="Triple outer semi-major axis" />
              </div>
            </div>

            <div class="form-row">
              <div>
                <div class="label">Eccentricity ${tipIcon(TIP_LABEL["Binary Eccentricity"] || "")}</div>
                <div class="hint" id="tertiaryPairEccentricityHint">Controls how strongly the tertiary swings toward and away from the inner pair.</div>
              </div>
              <div>
                <input id="tripleOuterEccentricity" type="number" step="0.001" min="0" max="0.95" aria-label="Triple outer eccentricity" />
              </div>
            </div>

            <div class="form-row">
              <div>
                <div class="label">Inclination <span class="unit">deg</span> ${tipIcon(TIP_LABEL["Binary Inclination"] || "")}</div>
                <div class="hint">Stored for future topology-aware orbit rendering.</div>
              </div>
              <div>
                <input id="tripleOuterInclination" type="number" step="0.1" min="0" max="180" aria-label="Triple outer inclination" />
              </div>
            </div>

            <div class="form-row">
              <div>
                <div class="label">Arg. Periapsis <span class="unit">deg</span> ${tipIcon(TIP_LABEL["Binary Argument of Periapsis"] || "")}</div>
                <div class="hint">Orientation of the tertiary orbit inside its plane.</div>
              </div>
              <div>
                <input id="tripleOuterArgPeriapsis" type="number" step="0.1" min="0" max="360" aria-label="Triple outer argument of periapsis" />
              </div>
            </div>

            <div class="form-row">
              <div>
                <div class="label">Mean Anomaly <span class="unit">deg</span> ${tipIcon(TIP_LABEL["Binary Mean Anomaly"] || "")}</div>
                <div class="hint">Saved orbital phase position for future animated multi-star layouts.</div>
              </div>
              <div>
                <input id="tripleOuterMeanAnomaly" type="number" step="0.1" min="0" max="360" aria-label="Triple outer mean anomaly" />
              </div>
            </div>

            <div class="hint" id="triplePairGuardrailHint" style="margin-top:8px"></div>
          </div>

          <div id="quaternaryAuthoringSection" class="subsection" style="display:none">
            <div class="subsection__title">Quaternary Star ${tipIcon(TIP_LABEL["Quaternary Star"] || "")}</div>

            <div class="form-row">
              <div>
                <div class="label">Quaternary Name ${tipIcon(TIP_LABEL["Name"] || "")}</div>
                <div class="hint">Appears in the outermost hierarchical host-frame labels and overview canvases.</div>
              </div>
              <div>
                <input id="quaternaryName" type="text" maxlength="80" aria-label="Quaternary star name" />
              </div>
            </div>

            <div class="form-row">
              <div>
                <div class="label">Quaternary Mass <span class="unit">Msol</span> ${tipIcon(TIP_LABEL["Mass"] || "")}</div>
                <div class="hint">Extends the outermost light contribution and top-level stability envelope.</div>
              </div>
              <div>
                <input id="quaternaryMass" type="number" step="0.0001" min="${hostComponentMassMinText}" max="100" aria-label="Quaternary mass" />
              </div>
            </div>

            <div class="hint" id="quaternarySummaryHint" style="margin-top:6px"></div>

            <div id="quaternaryPairTitle" class="subsection__title" style="margin-top:14px">Outer Pair ((A+B)+C)+D ${tipIcon(TIP_LABEL["Hierarchy Pair"] || "")}</div>

            <div class="form-row">
              <div>
                <div class="label">Semi-Major Axis <span class="unit">AU</span> ${tipIcon(TIP_LABEL["Binary Semi-Major Axis"] || "")}</div>
                <div class="hint" id="quaternaryPairAxisHint">Average separation between the inner triple hierarchy and the fourth star.</div>
              </div>
              <div>
                <input id="quadOuterSemiMajorAxis" type="number" step="0.001" min="0.001" max="100000" aria-label="Quad outer semi-major axis" />
              </div>
            </div>

            <div class="form-row">
              <div>
                <div class="label">Eccentricity ${tipIcon(TIP_LABEL["Binary Eccentricity"] || "")}</div>
                <div class="hint" id="quaternaryPairEccentricityHint">Controls how strongly the fourth star modulates the outermost hierarchy.</div>
              </div>
              <div>
                <input id="quadOuterEccentricity" type="number" step="0.001" min="0" max="0.95" aria-label="Quad outer eccentricity" />
              </div>
            </div>

            <div class="form-row">
              <div>
                <div class="label">Inclination <span class="unit">deg</span> ${tipIcon(TIP_LABEL["Binary Inclination"] || "")}</div>
                <div class="hint">Stored for future topology-aware orbit rendering.</div>
              </div>
              <div>
                <input id="quadOuterInclination" type="number" step="0.1" min="0" max="180" aria-label="Quad outer inclination" />
              </div>
            </div>

            <div class="form-row">
              <div>
                <div class="label">Arg. Periapsis <span class="unit">deg</span> ${tipIcon(TIP_LABEL["Binary Argument of Periapsis"] || "")}</div>
                <div class="hint">Orientation of the outermost orbit inside its plane.</div>
              </div>
              <div>
                <input id="quadOuterArgPeriapsis" type="number" step="0.1" min="0" max="360" aria-label="Quad outer argument of periapsis" />
              </div>
            </div>

            <div class="form-row">
              <div>
                <div class="label">Mean Anomaly <span class="unit">deg</span> ${tipIcon(TIP_LABEL["Binary Mean Anomaly"] || "")}</div>
                <div class="hint">Saved orbital phase position for future animated multi-star layouts.</div>
              </div>
              <div>
                <input id="quadOuterMeanAnomaly" type="number" step="0.1" min="0" max="360" aria-label="Quad outer mean anomaly" />
              </div>
            </div>

            <div class="hint" id="quadPairGuardrailHint" style="margin-top:8px"></div>
          </div>

          <div class="form-row" id="primaryStarNameRow">
            <div>
              <div class="label">Name ${tipIcon(TIP_LABEL["Name"] || "")}</div>
              <div class="hint">Used across pages and in the visualiser labels.</div>
            </div>
            <div>
              <input id="starName" type="text" maxlength="80" aria-label="Star name" />
            </div>
          </div>

          <div class="form-row" id="primaryStarMassRow">
            <div>
              <div class="label">Mass <span class="unit">Msol</span> ${tipIcon(TIP_LABEL["Mass"] || "")}</div>
              <div class="hint">Valid host-component range: ${hostComponentMassMinText} to 100.</div>
            </div>
            <div class="input-pair">
            <input id="mass" type="number" step="0.0001" min="${hostComponentMassMinText}" max="100" aria-label="Mass" />
            <input id="mass_slider" type="range" aria-label="Mass slider" />
            <div class="range-meta"><span id="mass_min"></span><span id="mass_max"></span></div>
          </div>
          </div>

          <div class="form-row star-class-entry-row" id="stellarClassInputRow">
            <div>
              <div class="label">Stellar Class ${tipIcon(TIP_LABEL["Class Input"] || "")}</div>
              <div class="hint">Apply a supported class as a mass-based shortcut.</div>
            </div>
            <div class="star-class-entry">
              <div class="star-class-entry__controls">
                <input
                  id="stellarClassInput"
                  type="text"
                  maxlength="32"
                  placeholder="G2V, K dwarf, T6 BD"
                  aria-label="Stellar class"
                  aria-describedby="stellarClassStatus"
                />
                <button id="stellarClassApply" type="button">Apply</button>
              </div>
              <div
                class="hint star-class-entry__status"
                id="stellarClassStatus"
                role="status"
                aria-live="polite"
                aria-atomic="true"
              >
                Supports OBAFGKM dwarfs and age-dependent L/T/Y brown dwarfs. Very cool Y targets may need older system ages.
              </div>
            </div>
          </div>

          <div class="form-row" id="sharedAgeRow">
            <div>
              <div class="label">Current Age <span class="unit">Gyr</span> ${tipIcon(TIP_LABEL["Current Age"] || "")}</div>
              <div class="hint">Used to check if Earth-like life is plausible. Shared across the home system in binary mode.</div>
            </div>
            <div class="input-pair">
            <input id="age" type="number" step="0.001" min="0" max="20" aria-label="Current Age" />
            <input id="age_slider" type="range" aria-label="Current Age slider" />
            <div class="range-meta"><span id="age_min"></span><span id="age_max"></span></div>
          </div>
          </div>

          <div id="sharedEvolutionBlock">
            <div style="height:8px"></div>
            <div class="label">Stellar Evolution ${tipIcon(TIP_LABEL["Stellar Evolution"] || "")}</div>
            <div class="physics-duo-toggle" style="margin:4px 0 6px">
              <input type="radio" name="evolutionMode" id="evolutionOff" value="zams" />
              <label for="evolutionOff">Off</label>
              <input type="radio" name="evolutionMode" id="evolutionOn" value="evolved" />
              <label for="evolutionOn">On</label>
              <span></span>
            </div>
            <div class="hint" id="evolutionHint" style="margin-bottom:8px"></div>
          </div>

          <div class="form-row" id="sharedMetallicityRow">
            <div>
              <div class="label">Metallicity [Fe/H] <span class="unit">dex</span> ${tipIcon(TIP_LABEL["Metallicity [Fe/H]"] || "")}</div>
              <div class="hint">Sun = 0.0 · Metal-poor halo ≈ −2 · Metal-rich disk ≈ +0.3 · Shared across the home system in binary mode.</div>
            </div>
            <div class="input-pair">
            <input id="metallicity" type="number" step="0.01" min="-3" max="1" aria-label="Metallicity [Fe/H]" />
            <input id="metallicity_slider" type="range" aria-label="Metallicity slider" />
            <div class="range-meta"><span id="metallicity_min"></span><span id="metallicity_max"></span></div>
          </div>
          </div>

          <div id="primaryPhysicsBlock">
            <div style="height:8px"></div>
            <div class="label">Physics Mode ${tipIcon(TIP_LABEL["Physics Mode"] || "")}</div>
            <div class="physics-duo-toggle" style="margin:4px 0 6px">
              <input type="radio" name="physicsMode" id="physicsSimple" value="simple" />
              <label for="physicsSimple">Simple</label>
              <input type="radio" name="physicsMode" id="physicsAdvanced" value="advanced" />
              <label for="physicsAdvanced">Advanced</label>
              <span></span>
            </div>
            <div class="hint" id="physicsModeHint" style="margin-bottom:8px"></div>
          </div>

          <div id="advancedDerivRow" style="display:none;margin-bottom:8px">
            <div class="label" style="margin-bottom:6px">Derivation Mode</div>
            <div class="physics-trio-toggle">
              <input type="radio" name="physicsDerivMode" id="derivModeRl" value="rl" />
              <label for="derivModeRl">R + L → T</label>
              <input type="radio" name="physicsDerivMode" id="derivModeRt" value="rt" />
              <label for="derivModeRt">R + T → L</label>
              <input type="radio" name="physicsDerivMode" id="derivModeLt" value="lt" />
              <label for="derivModeLt">L + T → R</label>
              <span></span>
            </div>
            <div class="hint" style="margin-top:5px">R = Radius (Rsol) · L = Luminosity (Lsol) · T = Temperature (K) · Arrow = computed value</div>
          </div>

          <div class="form-row" id="radiusOverrideRow">
            <div>
              <div class="label">Radius <span class="unit">Rsol</span> ${tipIcon(TIP_LABEL["Radius Override"] || "")}</div>
              <div class="hint" id="radiusHint">Auto (mass-derived)</div>
            </div>
            <div style="display:flex;gap:6px;align-items:center">
              <input id="radiusOverride" type="number" step="0.001" min="0.001" max="1000" placeholder="Auto" aria-label="Radius override" />
              <button id="radiusClear" type="button">Auto</button>
            </div>
          </div>

          <div class="form-row" id="luminosityOverrideRow">
            <div>
              <div class="label">Luminosity <span class="unit">Lsol</span> ${tipIcon(TIP_LABEL["Luminosity Override"] || "")}</div>
              <div class="hint" id="luminosityHint">Auto (mass-derived)</div>
            </div>
            <div style="display:flex;gap:6px;align-items:center">
              <input id="luminosityOverride" type="number" step="0.001" min="0.0001" max="1000000" placeholder="Auto" aria-label="Luminosity override" />
              <button id="luminosityClear" type="button">Auto</button>
            </div>
          </div>

          <div class="form-row" id="tempOverrideRow">
            <div>
              <div class="label">Temperature <span class="unit">K</span> ${tipIcon(TIP_LABEL["Temperature Override"] || "")}</div>
              <div class="hint" id="tempHint">Auto (derived from R and L)</div>
            </div>
            <div style="display:flex;gap:6px;align-items:center">
              <input id="tempOverride" type="number" step="1" min="1" max="100000" placeholder="Auto" aria-label="Temperature override" />
              <button id="tempClear" type="button">Auto</button>
            </div>
          </div>

          <div class="hint" id="resolutionStatus" style="margin-top:4px;font-style:italic"></div>

          <div id="primaryStarActionsRow" class="button-row">
            <button id="btn-sol">Sol-ish Preset</button>
            <button id="btn-reset">Reset to Defaults</button>
          </div>

          <div id="inputAutosaveHint" class="hint" style="margin-top:10px">
            Autosaves locally as you make changes.
          </div>
        </div>
      </div>

      <div class="panel">
        <div class="panel__header"><h2>Outputs</h2></div>
        <div class="panel__body">
          <div id="kpis"></div>
          <div id="details"></div>
        </div>
      </div>
    </div>
  `;
}
