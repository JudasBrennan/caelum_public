import { APP_NAME, APP_SLOGAN, APP_SLOGAN_TRANSLATION, APP_VERSION } from "./appIdentity.js";

export function initAboutPage(mountEl) {
  const el = document.createElement("div");
  el.className = "page";
  el.innerHTML = `
    <div class="panel">
      <div class="panel__header">
        <h1 class="panel__title"><span class="ws-icon icon--about" aria-hidden="true"></span><span>About ${APP_NAME}</span></h1>
        <div class="badge">Reference</div>
      </div>
      <div class="panel__body">
        <section class="about-hero" aria-labelledby="aboutIdentityTitle">
          <div>
            <h2 id="aboutIdentityTitle">${APP_NAME} ${APP_VERSION}</h2>
            <p>
              ${APP_NAME} is a browser-based worldbuilding toolkit by <b>Judas Brennan</b>.
              <i>${APP_SLOGAN}</i> means "${APP_SLOGAN_TRANSLATION}": a tool for building fictional worlds
              from first principles, then carrying them through stars, systems, planets, moons,
              climate, calendars, cultures, and visual form.
            </p>
          </div>
          <div class="about-hero__slogan" aria-label="${APP_SLOGAN}">
            <span>${APP_SLOGAN}</span>
            <small>${APP_SLOGAN_TRANSLATION}</small>
          </div>
        </section>

        <div class="about-section-grid">
          <section class="about-section" aria-labelledby="aboutPurposeTitle">
            <h2 id="aboutPurposeTitle">What It Helps You Do</h2>
            <p>
              ${APP_NAME} is for writers, game masters, artists, and worldbuilders who want invented
              worlds to feel physically connected. Model stars, brown dwarfs, multi-star systems,
              rocky planets, gas giants, moons, comets, debris disks, Oort clouds, atmospheres,
              climates, tectonics, populations, calendars, apparent skies, and 3D system visualisations.
            </p>
          </section>

          <section class="about-section" aria-labelledby="aboutScienceTitle">
            <h2 id="aboutScienceTitle">Science And Validation</h2>
            <p>
              ${APP_NAME} uses real astrophysics and planetary-science relationships where they are useful,
              with bounded approximations where real systems are too complex or uncertain for a browser tool.
              The Science &amp; Maths reference explains equations and assumptions, and the Validation Matrix
              tracks tested outputs, source classes, limits, and known gaps.
            </p>
            <p>
              ${APP_NAME} is a worldbuilding instrument, not a scientific simulator. Its goal is coherent,
              inspectable, creatively useful worlds.
            </p>
          </section>

          <section class="about-section" aria-labelledby="aboutDataTitle">
            <h2 id="aboutDataTitle">Data And Output</h2>
            <p>
              ${APP_NAME} runs as a static web app in your browser. Your active world is stored locally in
              browser storage unless you export it. Use Import/Export regularly to back up worlds as JSON
              or move them between devices.
            </p>
            <p>
              Worlds, images, charts, posters, calendars, and other generated output belong to you.
              The app source code is licensed separately under MPL-2.0.
            </p>
          </section>

          <section class="about-section" aria-labelledby="aboutCreditsTitle">
            <h2 id="aboutCreditsTitle">Credits</h2>
            <p>
              ${APP_NAME} began as a browser-based successor inspired by the <b>WorldSmith 8.0</b>
              spreadsheet by <b>Artifexian</b>. The science, code, interface, and feature set have since
              been rebuilt for ${APP_NAME}.
            </p>
            <ul class="about-list">
              <li><b>Judas Brennan</b>: creator and maintainer</li>
              <li><b>Artifexian</b>: original WorldSmith 8.0 spreadsheet inspiration</li>
              <li><b>Chromant</b>: corrected temperature-dependent habitable-zone Desmos model</li>
              <li><b>&#x1D539;&#x1D55A;&#x1D55D;&#x1D55D; &#x2115;&#x1D56A;&#x1D556; the Science Guy</b>: style improvements <span class="about-muted">*Not THAT Bill Nye</span></li>
            </ul>
            <ul class="about-list about-list--links">
              <li><a href="https://www.youtube.com/c/Artifexian" target="_blank" rel="noopener noreferrer">Artifexian YouTube</a></li>
              <li><a href="https://docs.google.com/spreadsheets/d/1AML0mIQcWDrrEHj-InXoYsV_QlhlFVuUalE3o-TwQco/copy" target="_blank" rel="noopener noreferrer">WorldSmith 8.0 spreadsheet</a></li>
              <li><a href="https://www.desmos.com/calculator/gcgvefvuc7" target="_blank" rel="noopener noreferrer">Chromant Desmos model</a></li>
            </ul>
          </section>
        </div>

        <section class="about-section about-section--community" aria-labelledby="aboutCommunityTitle">
          <h2 id="aboutCommunityTitle">Community</h2>
          <ul class="about-list about-list--links">
            <li>Judas Brennan Discord: <a href="http://discord.gg/aZzaR3DjsG" target="_blank" rel="noopener noreferrer">http://discord.gg/aZzaR3DjsG</a></li>
            <li>Artifexian Discord: <a href="https://discord.com/invite/hPvqDBPkhg" target="_blank" rel="noopener noreferrer">https://discord.com/invite/hPvqDBPkhg</a></li>
          </ul>
        </section>

        <div class="about-actions">
          <a class="validation-action validation-action--accent" href="#/validation">View Validation Matrix</a>
          <button class="btn btn--accent" id="openChangelog" type="button">View Changelog</button>
          <button class="btn" id="openLicense" type="button">View License</button>
        </div>
      </div>
    </div>
  `;
  mountEl.innerHTML = "";
  mountEl.appendChild(el);

  el.querySelector("#openChangelog").addEventListener("click", openChangelog);
  el.querySelector("#openLicense").addEventListener("click", openLicense);
}

/* ── Changelog toast ──────────────────────────────────────── */

const RELEASE_SCIENTISTS = {
  "1.0.0": {
    name: "Nicolaus Copernicus",
    born: 1473,
    died: 1543,
    country: "Poland",
    summary:
      "Proposed the heliocentric model of the solar system, placing the Sun rather than the Earth at the center.",
  },
  "1.1.0": {
    name: "Tycho Brahe",
    born: 1546,
    died: 1601,
    country: "Denmark",
    summary:
      "Made the most precise astronomical observations of the pre-telescopic era, compiling an extensive catalog of stellar and planetary positions.",
  },
  "1.2.0": {
    name: "Johannes Kepler",
    born: 1571,
    died: 1630,
    country: "Germany",
    summary:
      "Formulated the three laws of planetary motion, establishing that planets orbit the Sun in ellipses rather than perfect circles.",
  },
  "1.3.0": {
    name: "Galileo Galilei",
    born: 1564,
    died: 1642,
    country: "Italy",
    summary:
      "Pioneered the use of the telescope for astronomical observation, discovering Jupiter\u2019s moons and the phases of Venus.",
  },
  "1.4.0": {
    name: "Christiaan Huygens",
    born: 1629,
    died: 1695,
    country: "Netherlands",
    summary:
      "Proposed the wave theory of light, discovered Saturn\u2019s moon Titan, and invented the pendulum clock.",
  },
  "1.5.0": {
    name: "Isaac Newton",
    born: 1643,
    died: 1727,
    country: "England",
    summary: "Formulated the laws of motion and universal gravitation, and co-invented calculus.",
  },
  "1.6.0": {
    name: "William Herschel",
    born: 1738,
    died: 1822,
    country: "Germany",
    summary:
      "Discovered the planet Uranus, cataloged thousands of nebulae and double stars, and discovered infrared radiation.",
  },
  "1.7.0": {
    name: "Edwin Hubble",
    born: 1889,
    died: 1953,
    country: "United States",
    summary:
      "Demonstrated that galaxies exist beyond the Milky Way and discovered that the universe is expanding.",
  },
  "1.8.0": {
    name: "James Clerk Maxwell",
    born: 1831,
    died: 1879,
    country: "Scotland",
    summary:
      "Unified electricity, magnetism, and optics into a single theoretical framework, demonstrating that light is an electromagnetic wave.",
  },
  "1.9.0": {
    name: "Emmy Noether",
    born: 1882,
    died: 1935,
    country: "Germany",
    summary:
      "Proved Noether\u2019s theorem linking symmetries in physics to conservation laws, fundamental to modern theoretical physics.",
  },
  "1.10.0": {
    name: "Cecilia Payne-Gaposchkin",
    born: 1900,
    died: 1979,
    country: "England",
    summary:
      "Demonstrated that stars are composed primarily of hydrogen and helium, overturning the prevailing assumption of Earth-like composition.",
  },
  "1.11.0": {
    name: "Henrietta Swan Leavitt",
    born: 1868,
    died: 1921,
    country: "United States",
    summary:
      "Discovered the period\u2013luminosity relationship for Cepheid variables, providing the first reliable method for measuring cosmic distances.",
  },
  "1.12.0": {
    name: "Georges Lema\u00eetre",
    born: 1894,
    died: 1966,
    country: "Belgium",
    summary:
      "First proposed the Big Bang theory, describing the origin of the universe as an expansion from a \u2018primeval atom.\u2019",
  },
  "1.13.0": {
    name: "Caroline Herschel",
    born: 1750,
    died: 1848,
    country: "Germany",
    summary:
      "Discovered several comets and nebulae and was the first woman to receive a salary as a scientist.",
  },
  "1.14.0": {
    name: "Richard Feynman",
    born: 1918,
    died: 1988,
    country: "United States",
    summary:
      "Developed the path integral formulation of quantum mechanics and the theory of quantum electrodynamics.",
  },
  "1.15.0": {
    name: "Marie Curie",
    born: 1867,
    died: 1934,
    country: "Poland",
    summary:
      "Pioneered research on radioactivity and discovered polonium and radium. The only person to win Nobel Prizes in two different sciences.",
  },
  "1.16.0": {
    name: "Lise Meitner",
    born: 1878,
    died: 1968,
    country: "Austria",
    summary:
      "Provided the first theoretical explanation of nuclear fission, correctly interpreting the splitting of the uranium nucleus.",
  },
  "1.17.0": {
    name: "Subrahmanyan Chandrasekhar",
    born: 1910,
    died: 1995,
    country: "India",
    summary:
      "Calculated the maximum mass of a stable white dwarf star (the Chandrasekhar limit), showing that more massive stars must collapse further.",
  },
  "1.18.0": {
    name: "Niels Bohr",
    born: 1885,
    died: 1962,
    country: "Denmark",
    summary:
      "Developed the Bohr model of the atom with quantized electron orbits and made foundational contributions to quantum mechanics.",
  },
  "1.19.0": {
    name: "Max Planck",
    born: 1858,
    died: 1947,
    country: "Germany",
    summary:
      "Originated quantum theory by proposing that energy is emitted in discrete packets called quanta. His discovery of Planck\u2019s constant earned him the 1918 Nobel Prize in Physics.",
  },
  "1.20.0": {
    name: "Henri Poincar\u00e9",
    born: 1854,
    died: 1912,
    country: "France",
    summary:
      "Made foundational contributions to topology and celestial mechanics, and helped establish the modern study of dynamical systems and orbital stability.",
  },
  "1.21.0": {
    name: "Michael Faraday",
    born: 1791,
    died: 1867,
    country: "England",
    summary:
      "Discovered electromagnetic induction and established the experimental foundations of field theory, shaping how modern physics connects invisible structure to observable behavior.",
  },
  "1.22.0": {
    name: "Carl Sagan",
    born: 1934,
    died: 1996,
    country: "United States",
    summary:
      "Connected planetary science, climate, and the search for life into one public vision of inhabited worlds, helping define how modern astronomy imagines living moons and planets.",
  },
  "1.23.0 BETA": {
    name: "Alfred Wegener",
    born: 1880,
    died: 1930,
    country: "Germany",
    summary:
      "Proposed continental drift and helped lay the conceptual foundations for plate tectonics, making moving continents a scientifically coherent picture of planetary surfaces.",
  },
  "1.24.0": {
    name: "Vera Rubin",
    born: 1928,
    died: 2016,
    country: "United States",
    summary:
      "Provided compelling observational evidence for dark matter by measuring the unexpectedly flat rotation curves of galaxies, revealing hidden structure through careful astronomical observation.",
  },
  "1.25.0 BETA": {
    name: "Annie Jump Cannon",
    born: 1863,
    died: 1941,
    country: "United States",
    summary:
      "Built the modern stellar spectral classification system and cataloged hundreds of thousands of stars, turning overwhelming celestial complexity into a usable reference framework.",
  },
  "1.26.0": {
    name: "Jocelyn Bell Burnell",
    born: 1943,
    died: null,
    country: "Northern Ireland",
    summary:
      "Discovered the first radio pulsars and helped reveal how faint repeating signals can expose hidden structure in stellar systems, turning subtle patterns into usable astronomy.",
  },
  "1.27.0": {
    name: "Andrea Ghez",
    born: 1965,
    died: null,
    country: "United States",
    summary:
      "Tracked the orbits of stars around the Milky Way's center, showing how precise motion mapping can reveal hidden mass and system structure.",
  },
  "2.0.0": {
    name: "Roger Penrose",
    born: 1931,
    died: null,
    country: "England",
    summary:
      "Showed how geometry, gravity, and careful mathematical structure can reveal the hidden behaviour of complex astrophysical systems.",
  },
  "2.1.0": {
    name: "Katherine Johnson",
    born: 1918,
    died: 2020,
    country: "United States",
    summary:
      "Calculated launch windows, trajectories, and return paths for early spaceflight, showing how precise navigation can turn complex motion into something safe and usable.",
  },
  "2.2.0": {
    name: "Chien-Shiung Wu",
    born: 1912,
    died: 1997,
    country: "China",
    summary:
      "Experimentally proved that parity is not conserved in weak nuclear interactions, showing how careful instrumentation and rigorous verification can reveal structure hidden by prior assumptions.",
  },
  "2.3.0": {
    name: "Albert Einstein",
    born: 1879,
    died: 1955,
    country: "Germany",
    summary:
      "Developed the theories of special and general relativity, fundamentally reshaping our understanding of space, time, and gravity.",
  },
  "2.4.0": {
    name: "Kip Thorne",
    born: 1940,
    died: null,
    country: "United States",
    summary:
      "Made foundational contributions to gravitational physics and helped turn faint astrophysical signatures into measurable structure.",
  },
  "2.5.0": {
    name: "Neil deGrasse Tyson",
    born: 1958,
    died: null,
    country: "United States",
    summary:
      "Astrophysicist and science communicator who has helped make complex cosmic ideas approachable for broad audiences.",
  },
  "2.6.0 BETA": {
    name: "John Archibald Wheeler",
    born: 1911,
    died: 2008,
    country: "United States",
    summary:
      "Coined the term black hole and helped shape modern gravitational physics, turning extreme cosmic structure into language and models people could reason about.",
  },
  "2.7.0": {
    name: "Satyendra Nath Bose",
    born: 1894,
    died: 1974,
    country: "India",
    summary:
      "Developed Bose-Einstein statistics, helping reveal how matter can behave differently when its underlying physical state changes.",
  },
  "2.8.0": {
    name: "Stephen Hawking",
    born: 1942,
    died: 2018,
    country: "England",
    summary:
      "Linked black-hole physics, cosmology, and public understanding of cosmic time, making deep physical history legible to a wide audience.",
  },
  "2.9.0": {
    name: "Werner Heisenberg",
    born: 1901,
    died: 1976,
    country: "Germany",
    summary:
      "Formulated the uncertainty principle and helped make uncertainty a measurable part of physical theory rather than a flaw to hide.",
  },
  "2.10.0": {
    name: "Reinhard Genzel",
    born: 1952,
    died: null,
    country: "Germany",
    summary:
      "Used precise infrared observations of stellar orbits near the Milky Way's center to reveal hidden mass and system structure.",
  },
  "2.11.0": {
    name: "Abdus Salam",
    born: 1926,
    died: 1996,
    country: "Pakistan",
    summary:
      "Co-developed electroweak unification, showing how apparently separate forces can be described by one tested physical framework.",
  },
  "2.12.0": {
    name: "Ernest Rutherford",
    born: 1871,
    died: 1937,
    country: "New Zealand",
    summary:
      "Revealed the atomic nucleus through particle-scattering experiments, turning invisible interactions into measurable physical structure.",
  },
  "3.0.0": {
    name: "Maria Mitchell",
    born: 1818,
    died: 1889,
    country: "United States",
    summary:
      "Discovered a telescopic comet and helped open astronomy to a wider public, connecting careful observation with a more welcoming scientific culture.",
  },
  "3.1.0": {
    name: "J. J. Thomson",
    born: 1856,
    died: 1940,
    country: "England",
    summary:
      "Discovered the electron and showed that atoms have internal structure, making composition something measurable rather than merely named.",
  },
  "3.2.0": {
    name: "Saul Perlmutter",
    born: 1959,
    died: null,
    country: "United States",
    summary:
      "Led one of the teams that used distant supernovae to discover the accelerating expansion of the universe, turning stellar endpoints into evidence about cosmic fate.",
  },
};
function scientistCard(version) {
  const s = RELEASE_SCIENTISTS[version];
  if (!s) return "";
  const surname = s.name.split(" ").pop();
  const lifeYears = s.died === null ? `${s.born}\u2013` : `${s.born}\u2013${s.died}`;
  return `
        <div class="changelog-scientist">
          <div class="changelog-scientist__title">The ${surname} Release</div>
          <div class="changelog-scientist__detail">${s.name} (${lifeYears}) \u00b7 ${s.country}</div>
          <div class="changelog-scientist__summary">${s.summary}</div>
        </div>`;
}

function release(
  version,
  note,
  items,
  { open = false, rolledBack = false, rolledBackNote = "" } = {},
) {
  const openAttr = open ? " open" : "";
  const lis = items.map((i) => `<li>${i}</li>`).join("\n          ");
  const s = RELEASE_SCIENTISTS[version];
  const surname = s ? ` \u2014 The ${s.name.split(" ").pop()} Release` : "";
  const title = rolledBack ? `<s>Version ${version}${surname}</s>` : `Version ${version}${surname}`;
  const statusNote =
    rolledBack && rolledBackNote
      ? ` <span class="changelog-release__note"><b>Rolled back:</b> ${rolledBackNote}</span>`
      : "";
  return `
      <details class="changelog-release"${openAttr}>
        <summary class="changelog-release__summary"><b>${title}</b> <span class="changelog-release__note">${note}</span>${statusNote}</summary>${scientistCard(version)}
        <ul>${lis}</ul>
      </details>`;
}

function changelogHTML() {
  return [
    release(
      "3.2.1",
      "(from 3.2.0)",
      [
        "<b>Science Corrections</b> &mdash; Stellar, planetary, moon, orbital, and tectonic calculations have been tightened so generated worlds stay more internally consistent.",
        "<b>Calibration Hardening</b> &mdash; Validation now separates strict point checks from calibrated and exploratory science areas, making uncertainty clearer without pretending every output is equally precise.",
        "<b>Edge-Case Fixes</b> &mdash; Volatile escape, vapor behavior, moon tides, Roche limits, rocky-solver guards, seafloor cooling, and stellar boundary cases now avoid several misleading results.",
        "<b>Release Confidence Checks</b> &mdash; Production-browser checks now exercise edge worlds across the main model routes and watch for visible invalid-number leaks before release.",
      ],
      { open: true },
    ),
    release(
      "3.2.0",
      "(from 3.1.0)",
      [
        "<b>System Fate</b> &mdash; A new main-nav workspace compares saved worlds across stellar time, showing current Promising Worlds, future windows, major risks, body drilldowns, and copy-ready fate reports.",
        "<b>Stellar Lifecycle Tracks</b> &mdash; Stars now expose analytic lifecycle stages, evolved luminosity and radius context, moving habitable zones, mass-loss and remnant endpoints, confidence labels, and model-limit caveats.",
        "<b>Birth-To-Endpoint Timelines</b> &mdash; Star, planet, moon, and System Fate views now show clearer lifecycle rows from origin through current era, next transition, risks, and broad endpoint.",
        "<b>Moon Origin And Solid-Body Depth</b> &mdash; Moons now include an Origin Pathway selector and deeper solid-body response context for tides, geology, oceans, atmospheres, magnetospheres, and habitability caveats.",
        "<b>Structured Help And Loading States</b> &mdash; High-value tooltips now explain what each item is, where it comes from, and what it feeds into, while skeleton loaders make route changes and heavier previews feel less blank.",
      ],
      { open: false },
    ),
    release(
      "3.1.0",
      "(from 3.0.0)",
      [
        "<b>Manual Composition Inventories</b> &mdash; Planets and moons now share inferred, reservoir, and expert-element composition modes for metal, silicate, water ice, volatile ice, carbonaceous material, sulfur, salts, major elements, and trace heat elements.",
        "<b>Sensible Composition Seeds</b> &mdash; The composition editor can fill reservoir, element, and trace boxes with scientifically bounded starter values derived from the current body state, then let users adjust them freely.",
        "<b>Composition-Aware Moons</b> &mdash; Moon inventories now feed hydrosphere priors, ocean chemistry, atmosphere source context, geology, magnetosphere diagnostics, and visual cues where the science supports it.",
        "<b>Reservoirs Drive Structure</b> &mdash; Manual reservoir values can affect rocky planet structure and moon material response, while expert element values improve chemistry and diagnostics without pretending to solve full mineralogy.",
        "<b>Density-Aware Validation</b> &mdash; Seeded and manual inventories now compare against body-aware density expectations, reducing false cautions for compressed rocky planets while preserving warnings for unsupported mixes.",
      ],
      { open: false },
    ),
    release(
      "3.0.0",
      "(from 2.12.0)",
      [
        "<b>Caelum Release</b> &mdash; Browser chrome, splash, first-run guidance, About copy, README, export metadata, and visible product surfaces now use the Caelum name and <i>Ex Nihilo, Astra</i> slogan while older WorldSmith saves and imports remain supported.",
        "<b>Cross-page UX Pass</b> &mdash; Star, Planet, Moon, Calendar, diagnostic, and utility routes now share a more consistent workflow shell with compact context, clearer source guidance, and less repeated setup copy.",
        "<b>Compact Authoring Controls</b> &mdash; Create-this sections, planet setup context, Apparent Size inputs, Local Cluster guidance, and visualiser controls have been tightened so the useful controls sit higher on the page.",
        "<b>About Page Rewrite</b> &mdash; About now focuses on purpose, science stance, data ownership, credits, community links, and the changelog action without duplicating operational guidance from other pages.",
        "<b>UI Review Coverage</b> &mdash; Browser review now captures desktop/mobile, dark/light spot checks, and critical horizontal-overflow guardrails across the main authoring, diagnostic, reference, and visualiser routes.",
      ],
      { open: false },
    ),
    release(
      "2.12.0",
      "(from 2.11.0)",
      [
        "<b>Surface Ocean Coverage</b> &mdash; Earth-like water inventories now infer Earth-like ocean coverage from a bounded basin and hypsometry model instead of needing a manual ocean override.",
        "<b>Icy Moon Exospheres</b> &mdash; Europa-like icy moons can now show replenished, non-breathable O2/H2 exospheres from parent-magnetosphere irradiation, with abiotic oxygen clearly separated from retained atmospheres.",
        "<b>Shared Water Context</b> &mdash; Hydrosphere, climate, carbon cycle, ocean chemistry, productivity, tectonics, visuals, timelines, and visualizer summaries now use the same inferred surface-water context.",
        "<b>Validation Closure</b> &mdash; The Science Verification Matrix now checks Earth surface-ocean coverage and Europa sputtered oxygen directly instead of treating them as accepted modeling gaps.",
        "<b>Validation Readability</b> &mdash; Dark-mode dropdowns on the Validation page now have stronger contrast while filtering the matrix.",
        "<b>Caelum Identity</b> &mdash; Browser chrome, splash, first-run guidance, About copy, README, and new export metadata now use the Caelum name and <i>Ex Nihilo, Astra</i> slogan while WorldSmith import paths remain supported.",
      ],
      { open: false },
    ),
    release(
      "2.11.0",
      "(from 2.10.0)",
      [
        "<b>Science Verification Matrix</b> &mdash; Validation now shows a connected science matrix instead of a loose calibration table, with benchmark anchors, invariants, trend checks, boundary checks, coupling checks, formula oracles, browser coverage, and release gates in one place.",
        "<b>Deeper Science Coupling</b> &mdash; Climate, atmosphere evolution, radiation, interiors, nitrogen context, small-body reservoirs, habitability, population, observability, and timelines now share more of the same bounded science context across pages.",
        "<b>Habitable Moon Observer Frames</b> &mdash; Calendar and Apparent Size can now use modeled moons as reference worlds, including moon-local days, parent-planet phases, eclipses, parent apparent size, and sibling moon visibility where the data exists.",
        "<b>Long-Term Dynamics</b> &mdash; Planetary systems now expose bounded diagnostics for secular and Kozai-Lidov susceptibility, precession, Cassini-state readiness, migration clues, and Trojan reservoir support without rewriting authored orbits.",
        "<b>Validation Page Clarity</b> &mdash; The Validation page now explains what each matrix family means in plain language, highlights open gaps and release gates, and links to the generated standalone matrix artifacts.",
      ],
      { open: false },
    ),
    release(
      "2.10.0",
      "(from 2.9.2)",
      [
        "<b>Orbital Integrity Diagnostics</b> &mdash; The Planetary System page now reports selected-host-frame mutual-Hill spacing for planets, gas giants, and brown-dwarf companions, with stable, packed, crowded, unstable, and unknown labels plus confidence notes.",
        "<b>Moon Tidal Evolution Context</b> &mdash; Moon outputs now show parent synchronous-orbit context, qualitative eccentricity pump/damp state, and clearer inward/outward migration reasoning from the existing tidal model.",
        "<b>Moon-System Torque Budget</b> &mdash; Modeled moon systems now get a bounded parent-level torque budget proxy so mixed sibling systems can summarize whether the net tidal trend is outward, inward, balanced, or unknown.",
        "<b>Shared Dynamical Context</b> &mdash; Generation checks, moon interiors, habitability persistence, parent ring/radiation notes, timelines, and page explanations now consume one bounded orbital/tidal context instead of separate private summaries.",
        "<b>System Slot Fixes</b> &mdash; Guided slot dragging now moves or swaps planets cleanly, manual-to-guided mode infers the nearest open slots from AU values, and the Planet page explains why Guided mode controls orbital distance.",
      ],
      { open: false },
    ),
    release(
      "2.9.2",
      "(from 2.9.1)",
      [
        "<b>Moon Parent Assignment</b> &mdash; The Planetary System viewer now keeps moon reassignment available in manual orbit mode and exposes moon drop zones for gas giants, so moons can be moved to their intended hosts from the system view.",
        "<b>Clearer Parent Locks</b> &mdash; Moon lock controls now say Lock parent or Unlock parent, locked moon drags explain why they cannot move, and the Moon page offers an inline unlock action beside the disabled parent selector.",
      ],
      { open: false },
    ),
    release(
      "2.9.1",
      "(from 2.9.0)",
      [
        "<b>Moon Ocean Hotfix</b> &mdash; Europa-like frozen moons can now infer a subsurface ocean from available water, cold ice, and tidal or internal support without needing the manual subsurface-ocean override.",
        "<b>Science Map Removed</b> &mdash; The unused Science Map page has been retired from navigation and release upkeep, leaving Science &amp; Maths, Lessons, and Validation as the maintained science references.",
      ],
      { open: false },
    ),
    release(
      "2.9.0",
      "(from 2.8.0)",
      [
        "<b>Validation Report</b> &mdash; WorldSmith now has a top-level Validation page with searchable calibration tables, Solar System and non-Solar anchor coverage, and prebuilt report artifacts shipped with each release.",
        "<b>Stellar Environment</b> &mdash; Stars now expose differential rotation, Rossby-linked activity, wind pressure, UV bands, prebiotic UV context, and clearer confidence labels for regimes where the science is less certain.",
        "<b>Coupled Planet And Moon Environments</b> &mdash; Planets and moons now share forcing, magnetosphere, radiation, atmosphere ledger, climate chemistry, cloud, carbon-cycle, ocean-chemistry, and biosignature-context diagnostics instead of isolated one-off summaries.",
        "<b>Calibration Realism</b> &mdash; Airless moon thermophysics, tiny-moon tides, gas and ice giant intrinsic heat, and non-Solar exoplanet benchmarks now keep the generic model better calibrated without tuning specifically for Sol.",
        "<b>Timeline And Visual Integration</b> &mdash; Era timelines, auto visual coverage, snapshots, and visualizer summaries now consume the shared coupled-environment context while keeping life claims and exact climate histories explicitly bounded.",
      ],
      { open: false },
    ),
    release(
      "2.8.0",
      "(from 2.7.1)",
      [
        "<b>Planetary Era Timeline</b> &mdash; Planet and Moon outputs now include a top-level physical-history timeline with past, current, and future entries, confidence badges, and model drivers for rocky planets, volatile worlds, giants, brown dwarfs, and moons.",
        "<b>Output Navigation</b> &mdash; Planet and Moon outputs now use shared tabs, matching section names, and an All view, so dense scientific readouts are easier to scan without losing the original long-column layout.",
        "<b>Result Summaries</b> &mdash; Planet outputs now get the same plain-language Result Summary treatment as Moon outputs, with family-aware wording for rocky, volatile, gas-giant, and brown-dwarf contexts.",
        "<b>Visual Editor Readouts</b> &mdash; Auto coverage controls now show their current percentages and short model reasons, while text and number inputs keep focus during editing.",
        "<b>Science Polish</b> &mdash; Small cohesive moons can now survive Roche-only crossings when material strength dominates, planet selectors show authored host-star names, and tilted body previews now rotate around their tilted axes.",
      ],
      { open: false },
    ),
    release(
      "2.7.1",
      "(from 2.7.0)",
      [
        "<b>Splash Startup Resilience</b> &mdash; The splash screen now shows Enter WorldSmith immediately, starts the main app behind the overlay, and falls back cleanly if the decorative 3D planet preview hangs in a browser-specific way.",
      ],
      { open: false },
    ),
    release(
      "2.7.0",
      "(from 2.6.0 Beta)",
      [
        "<b>Import/Export Control</b> &mdash; Current-world export, manual backups, backup-library management, import validation, starter worlds, and danger-zone resets now live in clearer separate workflows with stronger confirmation copy.",
        "<b>Backup Library Previews</b> &mdash; Backup previews now explain the specific reason a preview cannot be built, and restores create a pre-restore backup by default so recovery paths are easier to understand.",
        "<b>Ocean-World Phase Science</b> &mdash; Deep-ocean dense-ice warnings now compare seafloor pressure and estimated bottom-ocean temperature against the implemented water liquidus boundary instead of relying on fixed depth thresholds.",
        "<b>Mean Ocean Depth</b> &mdash; Rocky planets with substantial accessible surface liquid now show mean ocean depth and seafloor pressure context even when they are not classified as exotic ocean worlds.",
        "<b>Science Reference</b> &mdash; The Science and Maths page now includes a WorldSmith-tailored ocean-floor water phase guide with the model boundary, example cases, and uncertainty notes.",
      ],
      { open: false },
    ),
    release(
      "2.6.0 BETA",
      "(from 2.5.0)",
      [
        "<b>Planetary Visual Editor</b> &mdash; Planet-class bodies can now open a draft-safe appearance editor from the Planet page or Visualiser, with Auto/Draft comparison, compatible presets, seeded procedural variation, sparse overrides, per-field locks, and reset/randomize controls.",
        "<b>Custom Visual Persistence</b> &mdash; Visual-only overrides now save on canonical planetary bodies and survive browser storage, JSON import/export, snapshots, the Visualiser, Apparent Size, and system poster rendering without changing the underlying physical model.",
        "<b>Color Editing Polish</b> &mdash; Native color picker changes now wait for Apply, while swatches and hex fields remain quick to use. Compact color rows keep the planet preview static during scrolling and keep lock controls visible in dense editor layouts.",
        "<b>Exotic Subtype Visuals</b> &mdash; Conservative exotic subtype evidence now feeds visual hints and downstream summaries for carbon-rich, ocean/water, lava, icy dwarf, chthonian, rogue, sub-Neptune, hycean, super-puff, inflated giant, and related planet-class bodies.",
        "<b>Safer Old Save Support</b> &mdash; Older saves, split rocky/gas-giant collections, workbook imports, and runtime projections remain supported while new guardrails keep historical data handling contained.",
      ],
      { open: false },
    ),
    release(
      "2.5.0",
      "(from 2.4.0)",
      [
        "<b>Exotic Planetary Subtypes</b> &mdash; Planet-class bodies can now surface conservative subtype evidence such as carbon-rich, ocean/water, lava, icy dwarf, chthonian, rogue, sub-Neptune, hycean, and inflated giant candidates across Planet outputs, import/export summaries, the Visualiser, and system posters.",
        "<b>Clearer Dense Pages</b> &mdash; Star, Moon, Planet, and Calendar now lead with compact workflow context, action-first summaries, and progressively disclosed output detail, so the densest authoring pages are easier to scan before diving into the science.",
        "<b>Result Summaries</b> &mdash; Star and Moon outputs now open with plain-language summaries and keep secondary identity, physical, environment, activity, system, and habitability details collapsed until needed.",
        "<b>Apparent Visibility Fix</b> &mdash; Apparent Size and Brightness no longer labels extremely bright night-side planets as visible day and night when their elongation places them physically outside the day-side sky.",
        "<b>Dev Workflow Polish</b> &mdash; The dev server now falls forward to an available local port when the requested one is busy, targeted test runs can filter by filename, and the release checklist now matches the manual-upload workflow.",
      ],
      { open: false },
    ),
    release(
      "2.4.0",
      "(from 2.3.0)",
      [
        "<b>Stellar Class Authoring</b> &mdash; The Star page can now accept spectral class text such as G2V, K dwarf, sun-like, red dwarf, and L/T/Y brown dwarf targets, then solve the nearest matching mass for the focused star or companion. Clear status messages explain successful matches, invalid entries, and age-sensitive brown dwarf targets.",
        "<b>Wide-Orbit Controls</b> &mdash; Rocky planets, gas giants, debris disks, and comets now share AU controls that preserve fine inner-system slider precision while still allowing distant objects out to the million-AU model ceiling.",
        "<b>Tidal Locking Accuracy</b> &mdash; Rocky planet and moon-context tidal locking outputs now use differentiated-body Love-number and inertia factors, keeping Earth-like despinning timescales closer to expected long-term behavior.",
      ],
      { open: false },
    ),
    release(
      "2.3.0",
      "(from 2.2.0)",
      [
        "<b>Structural Intercalary Calendars</b> &mdash; Calendar profiles can now place named intercalary periods before months, after months, at year end, or inside a month instead of faking extra days by stretching the last month. Those structural days now render, export, and behave like real chronology throughout the calendar UI.",
        "<b>Rule Audit</b> &mdash; The Calendar page now includes a Rule Audit panel that previews the rule you are editing, shows a resolved agenda for the current month or year, and can jump straight to traced days. This makes it much easier to understand why a holiday, festival, or marker did or did not appear.",
        "<b>Calendar-True Recurrence</b> &mdash; Holiday and festival rules now recur by authored calendar year instead of assuming a 12-month year, and they can also use cyclic year intervals for every-N-years behavior. Custom calendars no longer need workarounds to keep yearly observances honest.",
        "<b>Safer Calendar Round-Trips</b> &mdash; Calendar JSON import/export now preserves more live state, printable and ICS outputs follow the resolved intercalary layout, and the shipped Sol and Realmspace presets better demonstrate the new structure.",
      ],
      { open: false },
    ),
    release(
      "2.2.0",
      "(from 2.1.0)",
      [
        "<b>Faster Celestial Rendering</b> &mdash; Planet, moon, gas giant, and ring textures now reuse more work across previews, the Visualiser, posters, and guided flows, so familiar bodies appear faster and large-system browsing stalls less often.",
        "<b>Printable Calendar Export</b> &mdash; Printable month and year exports now open more safely and handle blocked popup windows more gracefully, while still giving you a print-ready HTML fallback for saving to PDF.",
        "<b>Planet And Calendar Stability</b> &mdash; The Planet and Calendar pages received a large stability pass around host-frame logic, brown-dwarf companion outputs, profile handling, and export flows, helping dense editing sessions stay more predictable.",
        "<b>Storage Recovery Hardening</b> &mdash; Clearing unreadable or stale saved data is now more isolated and resilient, reducing the chance that browser storage problems leave the app in a half-cleared state.",
      ],
      { open: false },
    ),
    release(
      "2.1.0",
      "(from 2.0.1)",
      [
        "<b>Safer Deletes</b> &mdash; Deleting planets, moons, topology branches, calendar profiles, cluster items, or replacing world data now opens a shared confirmation dialog that tells you exactly what the fallout will be before anything changes.",
        "<b>Accessibility Pass</b> &mdash; Blocking dialogs and the mobile nav drawer now behave more consistently for keyboard and screen-reader users, while the tutorial panel stays a non-modal helper instead of competing with real dialogs.",
        "<b>Clearer Editors</b> &mdash; The Star and Calendar pages now show current-state summaries and more inline guidance, so you can understand topology, host ownership, profile scope, and rule counts without scanning every dense section.",
        "<b>Touch And Navigation Polish</b> &mdash; Sidebar controls, tooltip triggers, and tutorial interactions are easier to hit on touch devices, the desktop nav now starts expanded for first-time orientation, and the sidebar footer stays cleaner on smaller screens.",
      ],
      { open: false },
    ),
    release(
      "2.0.1",
      "(from 2.0.0)",
      [
        "<b>Apparent Moon Texture Fix</b> &mdash; The Apparent Size canvas no longer reuses the same moon texture for different moons that happen to share a broad moon class. Moon previews now key from the computed moon visual profile, so distinct moons stay visually distinct in the sky view.",
      ],
      { open: false },
    ),
    release(
      "2.0.0",
      "(from 1.27.0)",
      [
        "<b>Brown Dwarfs Everywhere</b> &mdash; Brown dwarfs now work as true first-class objects across the Star page, giant-companion workflows, Moon context, Visualiser, poster, and apparent-sky views. You can place them as host objects or orbiting companions and still get class-aware visuals, labels, and current temperate-zone outputs.",
        "<b>Moon Tidal Accuracy</b> &mdash; Moon orbital-fate outputs now use integrated tidal timescales instead of the old linear shortcut. Resonant moons also gained mass-aware forced eccentricity and a visible converging or diverging migration trend.",
        "<b>Rocky Photochemistry</b> &mdash; Rocky planets now report photochemical stability, ozone-column estimates, and UV shielding directly on the Planet page. This makes fragile or strongly irradiated atmospheres much easier to read honestly.",
        "<b>Editable Comets</b> &mdash; The Other Objects page can now store, name, duplicate, and edit comets instead of treating them as derived flavour. Comets now carry live orbit, activity, and appearance outputs and render directly in the Local Frame visualizer.",
        "<b>Oort Clouds</b> &mdash; WorldSmith now estimates a system-wide Oort cloud and lets you keep it automatic or tune it with Guided and Manual controls. You can also seed long-period comets straight from the resolved reservoir.",
        "<b>Science Page Search</b> &mdash; The Science &amp; Maths reference now has a search bar and live filtering, so large sections are much easier to navigate. Matching entries jump open and highlight directly instead of leaving you to scan the whole page.",
        "<b>Visualizer Orbit Polish</b> &mdash; Gas giants and comets now keep their eccentric orbit geometry, orientation, and appearance more consistently in the Local Frame visualizer. Complex outer-system scenes read much more cleanly as a result.",
      ],
      { open: false },
    ),
    release(
      "1.27.0",
      "(from 1.26.0)",
      [
        "<b>Multistar Systems Are Release-Ready</b> &mdash; Binary, triple, and quad home systems now work as a normalized first-class feature instead of an experimental branch. WorldSmith now supports paired quads, host-frame-aware editing across system pages, and a true `System Overview` mode in the Visualiser.",
        "<b>Random System Generator</b> &mdash; The System page can now draft full seeded star systems instead of only individual bodies. You can generate stars, planets, moons, and debris with curated random names, AU-safe orbit ladders, and preserve/reroll strategies like `keep stars, reroll planets`.",
        "<b>Star Page Redesign</b> &mdash; Multistar authoring now uses layout cards, an interactive topology map, and a single-focus inspector instead of one long stacked form. Every selected star now gets the same advanced physics controls, and the outputs area keeps every star visible and labeled.",
        "<b>Science Surfaces Synced</b> &mdash; The Science &amp; Maths page and Lesson 07 now explain the current multistar host-frame model, companion flux, stability limits, and hierarchy guardrails instead of lagging behind the live engine.",
        "<b>Tooltip Audit Completed</b> &mdash; The remaining unlabeled controls on Apparent, Calendar, Import/Export, Local Cluster, Moon, and Visualiser pages now carry proper explanatory tooltips, including science context where it helps.",
      ],
      { open: false },
    ),
    release(
      "1.26.0",
      "(from 1.25.0 BETA)",
      [
        "<b>Guided Creation Across All Major Objects</b> &mdash; Guided and Quick creation now cover moons, rocky worlds, gas giants, and stars. You can start from archetypes, answer structured goal questions, use interpreted phrases like `forest moon`, or let the solver search toward a target outcome instead of hand-tuning every field.",
        "<b>Moon Habitability Overhaul</b> &mdash; Moons now separate surface-ocean, radiation-limited, cool-star-mass-limited, and subsurface-ocean outcomes more explicitly. Radiation shielding, magnetic protection, spin state, and conservative orbit stability now feed the result directly, and guided moon search is much less likely to chase warm but hostile inner orbits.",
        "<b>Cool-Star Moon Calibration</b> &mdash; Exposed-surface moons around cool stars now use a more selective calibration instead of being treated like generic warm moons. The Moon page also surfaces explicit `Spin State` and `Surface Exomoon Calibration` outputs so you can see why a promising moon does or does not clear the surface-life bar.",
        "<b>Atmospheric Collapse On Tidally Locked Worlds</b> &mdash; Rocky planets now estimate whether a synchronously locked atmosphere can stay gaseous on the permanent night side. The Planet page surfaces the collapse state, modeled night-side minimum temperature, and dominant condensable gas directly in the rocky-world outputs.",
        "<b>XUV Luminosity Evolution</b> &mdash; Stars now own their XUV evolution, with mass-dependent saturation lifetimes and explicit XUV outputs on the Star page. That higher-energy history now feeds atmospheric escape, gas-giant mass loss, and moon-radiation calculations instead of relying on the older generic heuristic.",
        "<b>Hot Jupiter Radius Inflation</b> &mdash; Hot Jupiters now use a flux-based radius-inflation model when their radii are derived from mass. Highly irradiated giants gain a bounded inflation anomaly from incident flux instead of only showing a loose temperature-based suggestion.",
        "<b>Lava World Classification</b> &mdash; Rocky planets now distinguish `Standard rocky world`, `Lava world`, and `Magma ocean world` explicitly. Extremely hot close-in planets no longer read as generic rocky bodies when the solved surface state is much more extreme.",
        "<b>Transit Depth And RV Semi-Amplitude</b> &mdash; Rocky planets and gas giants now report exoplanet-detection metrics like transit depth, geometric transit probability, and stellar wobble amplitude. This makes it much easier to judge whether a generated world would be obvious in transit or radial-velocity surveys.",
        "<b>Rocky Planet Oblateness And J2</b> &mdash; Rocky planets now report rotational flattening, equatorial versus polar radius, and `J2`. Fast rotators no longer present as perfectly spherical bodies in the science outputs.",
        "<b>Science Reference Sync</b> &mdash; The Science &amp; Maths page and Lessons now match the newer moon, radiation, and stellar-XUV models more closely, so the educational surfaces explain the same logic the live engine is using.",
      ],
      { open: false },
    ),
    release(
      "1.25.0 BETA",
      "(beta, from 1.24.0)",
      [
        "<b>Guided Creation</b> &mdash; Moons and rocky planets now have dedicated `Quick`, `Guided`, and `Recipes` entry flows at the top of their editors. You can jump straight to a ready-made archetype, answer a few guided questions, or use Recipes as an Advanced-mode starting point without hunting through output cards.",
        "<b>Moon Science Modes</b> &mdash; The Moon page now exposes separate Hydrosphere, Atmosphere, and Orbital Coupling modes, with richer moon-world outputs behind the Full and Manual paths. Moon results now surface stronger atmosphere, ocean, climate, resonance, and formation context instead of behaving like a thinner special case.",
        "<b>Guided Moon Systems</b> &mdash; Guided moon creation can now launch from Moon, Planet, and System contexts, preview host fixes, and apply reviewed sibling-moon adjustments when resonance-backed setups need them. This makes oceanic, resonant, and biologically active moon builds much easier to reach deliberately.",
        "<b>Science Reference Refresh</b> &mdash; The Science page and Lessons are now aligned with the current moon and ring models. Lesson links, moon-system descriptions, and ring coverage now match the live simulation instead of lagging behind it.",
      ],
      { open: false },
    ),
    release(
      "1.24.0",
      "(from 1.23.1 BETA)",
      [
        "<b>Ring Controls</b> &mdash; Gas giants and rocky planets now share explicit ring visibility controls. You can keep the science-driven auto mode, force rings on, or force them off, and the Planet page now warns clearly when an override goes against the science.",
        "<b>Ring Styles</b> &mdash; Visible rings now resolve into authored families such as Saturnian bright, icy banded, dusty veil, narrow dark, arc dusty, and rocky debris. Auto mode picks a stable recommendation from the body state, while manual ring mode lets you choose the style directly.",
        "<b>Ring Lighting &amp; Shadows</b> &mdash; Rings no longer render as flat tinted discs. Preview, Visualiser, and poster output now share lit ring materials with banded textures, view-angle response, soft planet shadows across the rings, and softened ring shadows projected back onto ringed planets.",
      ],
      { open: false },
    ),
    release(
      "1.23.1 BETA",
      "(beta, from 1.23.0 BETA)",
      [
        "<b>Gas Giant Input Fix</b> &mdash; Gas-giant numeric inputs on the Planet page now update correctly again after the shared slider-id migration. This patch mainly targets the broken manual-entry path that was most noticeable on mobile devices.",
      ],
      { open: false },
    ),
    release(
      "1.23.0 BETA",
      "(beta, from 1.22.1)",
      [
        "<b>Rolled Back</b> &mdash; This beta release is no longer in the codebase. The tectonics-simulator branch was rolled back and its shipped feature set should be treated as historical release notes only, not as current product behavior.",
        "<b>Tectonics Simulator Beta</b> &mdash; The Tectonics page included a real plate-simulator preview with a persistent mostly-hex cell grid, seeded or painted plate ownership, rigid-plate playback, subduction-side resolution, and per-cell geology diagnostics.",
        "<b>Terrain and Topography Output</b> &mdash; The simulator derived terrain, bathymetry, shaded relief, and a dedicated topography map mode from the tectonic model. Terrain previews were smoother and more terrain-like, and the export buttons exposed the matching raster outputs directly.",
        "<b>Plate Editing Workflow</b> &mdash; Plate authoring supported select, brush, fill, and erase tools, separate ownership versus crust painting, richer selected-cell readouts, and JSON plate-map / crust-map imports. This gave the simulator a usable pre-climate authoring workflow instead of a seed-only preview.",
      ],
      {
        open: false,
        rolledBack: true,
        rolledBackNote: "This beta was rolled back and is no longer in the codebase.",
      },
    ),
    release("1.22.1", "(from 1.22.0)", [
      "<b>Unified Celestial Outputs</b> &mdash; Star, Planet, and Moon pages now share the same sectioned KPI layout, so dense output pages read as structured reports instead of one long wall of cards. Secondary values also open reliably on touch devices with explicit tap-to-expand detail.",
      "<b>Habitability Corrections</b> &mdash; The habitability model was recalibrated around clearer surface-water, subsurface-water, and alternative-solvent pathways while keeping the standard Earth Similarity Index intact. Planet and Moon pages now explain the active pathway directly, so scores are easier to interpret honestly.",
      "<b>UI Polish</b> &mdash; Long derived-detail rows now wrap cleanly, and the special colour cards keep a stable one-line title row with a single disclosure chevron. The result is a denser but calmer output layer across the most information-heavy pages.",
    ]),
    release("1.22.0", "(from 1.21.1)", [
      "<b>Moon Worlds</b> &mdash; Moons now model atmosphere, hydrosphere, climate, geology, biosphere, and habitability as one connected world state. You can build frozen ocean moons, hazy moons, volcanic moons, and biologically active moons from the same Moon workflow.",
      "<b>Moon Visuals</b> &mdash; Moon previews and recipes now react to modeled oceans, haze, vegetation, cryovolcanism, and captured-body shape. Irregular moons render as lumpy bodies, and atmospheric moons use a softer limb haze instead of the old solid aura.",
      "<b>Unified Habitability</b> &mdash; Planet and Moon habitability now use one shared PHI model with explicit surface-water, subsurface-water, chemistry, radiation, and persistence handling. Subsurface-ocean moons can now score honestly without implying exposed surface life.",
      "<b>Moon Workflow Integration</b> &mdash; Moon-world state now survives save, load, import, and export, and it appears in the Visualiser focus panel. The Lessons and Science pages now explain the moon-world model and the surface-versus-subsurface distinction.",
      "<b>Preset and Visual Refresh</b> &mdash; The Sol preset was refreshed to stay aligned with the new moon and habitability models, and Earth-like shallow-ocean rocky worlds now render with a clearer blue-ocean balance.",
    ]),
    release("1.21.1", "(from 1.21.0)", [
      "<b>Habitability Metrics Beta</b> &mdash; Rocky planets now show an Earth Similarity Index and a clearly-labeled Habitability Score (Beta). The new score is a first-pass comparative metric built from substrate, solvent, energy, and chemistry terms, and it is hidden on gas giants.",
      "<b>Physics Corrections</b> &mdash; Fixed several star, planet, and moon edge cases. Evolved high-metallicity stars no longer produce non-physical radii, CMF auto-calc now follows host-star metallicity, and retrograde moon orbital-fate cases behave more plausibly.",
      "<b>Visualizer Rotation Fix</b> &mdash; Corrected the visualiser spin convention so planets and moons now rotate in the proper direction relative to their orbits, including retrograde cases.",
      "<b>Tectonics Input Fix</b> &mdash; Active mountain-range text boxes on the Tectonics page no longer drop focus as soon as you click into them, so manual numeric editing works normally again.",
      "<b>Safer Updates</b> &mdash; Release updates are now more resilient to stale browser cache. WorldSmith keeps release-busted entry URLs and can detect a newer deployed version before reloading into the current build.",
      "<b>Route Resilience</b> &mdash; The Planet page now handles incomplete slider/input states more gracefully, reducing crashes caused by mixed-cache or partial render states during startup.",
      "<b>Detail &amp; Readability Polish</b> &mdash; Rocky-planet Radius and Gravity cards now show exact SI secondary values, and the main reading areas use roomier line spacing for easier scanning.",
    ]),
    release("1.21.0", "(from 1.20.0)", [
      "<b>Input Stability</b> &mdash; Text entry on the Star, Planet, and Moon pages no longer fights your typing. Draft numbers now stay in the field while you edit, making precise manual entry far more reliable on mobile keyboards.",
      "<b>Save Recovery</b> &mdash; WorldSmith now detects unreadable saved data and shows a recovery flow instead of silently resetting to a blank world. You can clear only the broken current save while keeping backup worlds available for restore.",
      "<b>Smarter Persistence</b> &mdash; Normal saves are now lighter and no longer rewrite the full backup history every time. Large worlds feel steadier during longer editing sessions, especially on slower browsers and devices.",
      "<b>Navigation Lock</b> &mdash; The desktop sidebar now includes a padlock beside the theme toggle so you can keep navigation pinned open while you work. The lock is remembered between sessions and stays hidden when the nav is collapsed.",
      "<b>UI Safety Pass</b> &mdash; Several remaining dynamic selectors, summaries, and detail panes were moved onto safer rendering paths. Edited and imported names with unusual text now behave more predictably across the affected pages.",
    ]),
    release("1.20.0", "(from 1.19.0)", [
      "<b>Engine Foundations</b> &mdash; Added canonical fixture worlds, a world-level snapshot API, and snapshot-backed adapters so read-only pages now derive stars, systems, planets, gas giants, and moons from one consistent engine path.",
      "<b>Engine Rework</b> &mdash; Split the largest body calculators into smaller internal modules and centralized shared radiative, orbital, escape, materials, and rotation helpers under a dedicated physics layer.",
      "<b>Validation Expansion</b> &mdash; Added cross-model climate, moon-system, apparent, calendar, and snapshot-parity regression suites so scientific composition errors are caught before they reach the UI.",
      "<b>Performance Pass</b> &mdash; Summary snapshot mode is now genuinely cheaper, import/export preview and Apparent selectors use explicit summary budgets, and guided System poster rendering no longer pays for a full-snapshot prepass.",
      "<b>Methane Greenhouse Recalibration</b> &mdash; Corrected methane forcing so Earth-like CH&#8324;/CO&#8322; attribution and Titan-like raw optical depth land in realistic target ranges.",
      "<b>WebGL Route Cleanup</b> &mdash; Fixed the System-page teardown path so moving from Planetary System into Local Cluster or System Visualiser no longer produces WebGL transition warnings in Brave.",
    ]),
    release("1.19.0", "(from 1.18.1)", [
      "<b>Schweitzer M-dwarf Radius</b> &mdash; Replaced the Eker quadratic below 0.5 M&#9737; with the Schweitzer et al. (2019) linear relation (R&nbsp;=&nbsp;0.0282&nbsp;+&nbsp;0.935&thinsp;M), with a smooth blend over 0.5&ndash;0.7 M&#9737;. Improves low-mass radius accuracy against benchmark stars.",
      "<b>L4/L5 Stability</b> &mdash; Lagrange Trojan points now show whether they are stable or unstable via the Gascheau (1843) criterion (&mu;&nbsp;&lt;&nbsp;0.0385). Unstable Trojans appear as dimmed amber diamonds in the visualiser.",
      "<b>Giant Planet Probability</b> &mdash; Updated to Kepler-era baseline (~7% at solar mass and metallicity) with stellar mass dependence from Johnson et al. (2010). M&nbsp;dwarfs now show lower probability; A/F&nbsp;stars show higher.",
      "<b>Collapsible Sidebar</b> &mdash; Replaced the dual top-nav + sidebar with a single collapsible sidebar. Starts as a slim icon rail on desktop; click to expand, click outside to collapse. On mobile, opens as a full drawer via a hamburger button. Nav reorganised into six semantic groups.",
      "<b>Light Mode Overhaul</b> &mdash; Warm-cream Paper Dashboard palette replacing the old grey theme. 18 dedicated light-mode icon variants, light favicon, flash-free theme loading, and redesigned Other Objects icon (comet + debris instead of gas giant).",
      "<b>Changelog Toast</b> &mdash; Changelog moved from the About page to a modal overlay with collapsible releases.",
      "<b>Release Scientists</b> &mdash; Each major release is now dedicated to a scientist, shown as a card in the changelog with name, dates, country, and contribution.",
    ]),
    release("1.18.1", "(from 1.18.0)", [
      "<b>Improved Mass-Radius Relation</b> &mdash; Extended the Eker (2018) quadratic MRR to its full calibration range of 1.5 M&#9737; (was 1.0). Above 1.5 M&#9737; the old Demircan &amp; Kahraman power law is replaced by a Stefan-Boltzmann derivation from Eker MLR + MTR, cutting RMSE against benchmark stars from ~28% to ~18%.",
      "<b>Mass-Temperature Relation</b> &mdash; New <code>massToTeff()</code> function implementing the Eker (2018) MTR for high-mass stars (M &gt; 1.5 M&#9737;).",
      "<b>Science &amp; Maths</b> &mdash; Updated MRR formula display with the new piecewise equation, and added the MTR formula entry.",
    ]),
    release("1.18.0", "(from 1.17.1)", [
      "<b>Calendar UX Redesign</b> &mdash; Rebuilt the Calendar page with a toolbar + closable drawer layout. The calendar grid now fills the full width when the drawer is closed. Four drawer tabs (Structure, Identity, Rules, Output) replace the previous eight collapsible panels.",
      "<b>Tutorials on Every Page</b> &mdash; All 13 interactive pages now have a &ldquo;Tutorials&rdquo; button in their header. Each tutorial walks you through the page&rsquo;s workflow in 4&ndash;8 steps with a persistent toast panel that remembers your position.",
      "<b>Live-Update Inputs</b> &mdash; Star, Moon, System, and Calendar pages now update outputs instantly as you type or drag sliders, removing the Apply button from these pages.",
      "<b>Calendar Structure Controls</b> &mdash; Replaced the three &ldquo;weeks per month&rdquo; sliders with direct &ldquo;Days per month&rdquo; and &ldquo;Days per week&rdquo; inputs with a structure readout showing weekly breakdown and drift warnings.",
      "<b>Bug Fixes</b> &mdash; Fixed infinite loop on Moon and Star pages when dragging sliders, fixed Science page crash from malformed data table call, fixed calendar rounding toggle responsiveness.",
    ]),
    release("1.17.1", "(from 1.17.0)", [
      "<b>Climate State Classification</b> &mdash; Planets are now classified as Stable, Snowball, Moist greenhouse, or Runaway greenhouse based on surface temperature and absorbed stellar flux. New KPI card on the planet page, climate advisory warnings, and Science &amp; Maths reference coverage.",
      "<b>Climate State NASA Validation</b> &mdash; 19 tests validating absorbed flux and climate state against Solar System data (Mercury, Venus, Earth, Mars, Ceres) in dry and wet configurations.",
      "<b>Calendar Rounding Override</b> &mdash; New &ldquo;Round derived data&rdquo; toggle on the Calendar page with a 0&ndash;6 decimal places slider. When enabled, rounds orbital periods before they enter the calendar model, affecting month lengths and leap cycles. Persists per profile.",
    ]),
    release("1.17.0", "(from 1.16.1)", [
      "<b>Lessons Page</b> &mdash; 20-lesson progressive curriculum covering every scientific concept in the model, organised into six units with a Basic/Advanced toggle and embedded mini-calculators.",
      "<b>Gas Giant Orbital Parameters</b> &mdash; Eccentricity, inclination, and axial tilt inputs for gas giants, unlocking periapsis/apoapsis temperatures, insolation, spin-orbit resonance, and giant-to-giant mean-motion resonance.",
      "<b>Gas Giant Physics</b> &mdash; Christensen energy-flux dynamo model, Chapman-Ferraro magnetopause with moon plasma inflation, per-species Jeans escape analysis, moon tidal heating, and atmospheric sputtering magnetopause inflation.",
      "<b>Rocky Planet Enhancements</b> &mdash; Periapsis/apoapsis temperatures, volatile sublimation flags for dwarf planets, and suggested gas giant resonance for all rocky planets.",
      "<b>Moon Volatile Inventory</b> &mdash; Moons now display surface ices and thin volatile atmospheres for seven species, with Jeans escape and geological retention checks.",
      "<b>Unified KPI Layout</b> &mdash; Rocky planet, gas giant, and moon pages now share a consistent KPI card order for shared concepts (Appearance, Composition, Radius, Density, Gravity, Escape Velocity, Magnetic Field, Temperature, Orbital Period). Derived detail sections split into labelled sub-headings for readability.",
    ]),
    release("1.16.1", "(from 1.16.0)", [
      "<b>Internal Heat UI</b> &mdash; Added the missing Internal Heat input section to the planet page with Simple (single slider) and Per-Isotope (U-238, U-235, Th-232, K-40) modes.",
      "<b>Toggle Consistency</b> &mdash; Atmospheric Escape and Vegetation toggles converted to pill-style controls matching the rest of the app.",
      "<b>Cluster Visualiser Export</b> &mdash; Fixed PNG and GIF exports producing blank images in cluster mode.",
    ]),
    release("1.16.0", "(from 1.15.0)", [
      "<b>Atmospheric Escape</b> &mdash; Per-species Jeans escape analysis with exobase temperature model, pressure-dependent XUV absorption, and non-thermal escape enhancement for H&#x2082; and He. Optional auto-strip toggle removes gases the body cannot retain. Calibrated against NASA Planetary Fact Sheet data.",
      "<b>Dwarf Planets</b> &mdash; Mass-based body classification (Dwarf planet below 0.01 M&#x2295;). Mass floor lowered to 0.0001 M&#x2295;. Sol preset adds Ceres, Pluto, and Charon.",
      "<b>Radioisotope Abundance</b> &mdash; Configurable radioisotope abundance for rocky planets with Simple (single slider) and Per-Isotope (U-238, U-235, Th-232, K-40) modes. Scales volcanic activity, lithosphere thickness, internal heat budget, and magnetic dynamo lifetime.",
      "<b>Moon Physics</b> &mdash; Surface temperature calculation, magnetospheric radiation dose from host planet, tidal-thermal feedback for rocky moons (Io-calibrated), and configurable initial rotation period with estimated current spin.",
      "<b>Orbit Placement Mode</b> &mdash; Guided / Manual orbit toggle on the System tab lets you place planets at arbitrary semi-major axes.",
      "<b>Local Cluster Limits</b> &mdash; Tightened input ranges (25 ly max radius, 0.1 /ly&sup3; max density) and raised system render cap from 99 to 750.",
      "<b>UI Polish</b> &mdash; Unified pill-toggle style across planet and star pages, section headings in Derived Details, and canvas loading performance optimisations (IndexedDB texture caching, worker pre-warming, progressive LOD).",
    ]),
    release("1.15.0", "(from 1.14.0)", [
      "<b>Tectonics</b> &mdash; New interactive tectonics page with mountain ranges, shield volcanoes, rift valleys, seafloor spreading, isostasy modes, continental margins, and a full plate canvas with Voronoi tessellation, Euler pole rotation, and boundary classification.",
      "<b>Climate Zones</b> &mdash; Latitude-based K&ouml;ppen climate classification with aridity indices, tidally-locked zone modelling, and colour-coded zone cards.",
      "<b>Population</b> &mdash; Carrying capacity, logistic growth curves, land-use cascades, and Zipf rank-size regional distribution across configurable tech eras.",
      "<b>Science &amp; Maths Expansion</b> &mdash; Six new formula sections (Stellar Evolution, Gas Giant Physics, Lagrange Points, Climate, Population, Debris Disks) and four expanded sections, bringing the reference to its then-current ~160 equations across 18 sections.",
      "<b>Tooltip Audit</b> &mdash; Added ~80 new tooltips across Tectonics, Climate, and Population pages. Rewrote existing tooltips for style guide compliance with declarative tone, Unicode units, and correct naming.",
      "<b>Preset Updates</b> &mdash; Sol, Realmspace, and Arrakis presets updated to the current schema with all new planet, moon, and gas giant fields. Fixed a data corruption bug affecting Venus and Toril preset values.",
      "<b>Import/Export</b> &mdash; Import preview now shows all nine world sections including tectonics, population, climate, and calendar summaries.",
    ]),
    release("1.14.0", "(from 1.13.0)", [
      "<b>Three.js Rendering</b> &mdash; All major render surfaces (Visualiser, System Poster, Apparent Sky, body previews) now use native Three.js WebGL with procedural textures, PBR materials, and LOD quality tiers.",
      "<b>Procedural Celestial Textures</b> &mdash; Rocky planets, gas giants, and moons generate unique equirectangular texture maps using 3D noise, domain warping, and rule-driven composition layers (oceans, ice caps, clouds, craters, bands, storms, and more).",
      "<b>Cluster Visualiser Overhaul</b> &mdash; Rewritten as a pure 2D overlay with radial-gradient star dots, native text labels with collision detection, and a toggleable starfield background.",
      "<b>Stellar Activity Model</b> &mdash; Three-tier activity model with cycle-aware flare modulation, split-rate CME channels, and an animated star preview showing real-time flare bursts and CME events.",
      "<b>Camera Controls</b> &mdash; Momentum-based pan and rotate with inertia, smooth zoom interpolation, click-to-center, double-click-to-zoom, focus lock that survives drag, animated reset, and full touch gesture support. Press <b>?</b> on the visualiser for the control reference.",
      "<b>Splash Screen Toggle</b> &mdash; Persistent opt-out checkbox in the header to skip the loading overlay on startup.",
      "<b>Gas Giant Styles</b> &mdash; Fantastical styles removed; 17 realistic styles with tuned palettes for higher saturation and contrast.",
    ]),
    release("1.13.0", "(from 1.12.0)", [
      "<b>Debris Disk Modelling</b> &mdash; Added resonance-driven asteroid belt and outer disk generation with derived composition, collision regime, and detection estimates.",
      "<b>Unified Body Visuals</b> &mdash; Rocky planets, gas giants, and moons now use a shared rendering pipeline for more consistent presentation across Planet, System Poster, Visualiser, and Apparent views.",
      "<b>Gas Giant Auto-Rings</b> &mdash; Ring visibility and visual style now auto-update from gas giant physics outputs, so appearance stays aligned with calculated ring properties.",
      "<b>System Page Consistency</b> &mdash; Star evolution overrides and slot-aware orbit inputs now propagate correctly into System Poster planet and moon calculations.",
    ]),
    release("1.12.0", "(from 1.11.1)", [
      "<b>3D Splash Screen</b> &mdash; Interactive loading overlay with a 3D planet model you can grab and spin. Biome colouring, clouds, atmosphere, and city lights on the night side. Click &ldquo;Enter WorldSmith&rdquo; to dismiss.",
      "<b>Rocky Planet Visuals</b> &mdash; Rocky planets now render with physics-driven canvas visuals matching gas giant richness. Surface palettes, oceans, ice caps, clouds, atmosphere rim, terrain types, vegetation, lava cracks, and tidal-lock darkening &mdash; all determined by the planet&rsquo;s properties.",
      "<b>Gas Giant Physics Overhaul</b> &mdash; Six new subsystems: rotational oblateness, atmospheric mass loss, interior structure &amp; core mass, age-dependent radius cooling, ring properties, and tidal locking/circularisation. All derived from existing inputs.",
      "<b>Stellar Evolution</b> &mdash; New &ldquo;Evolved&rdquo; toggle on the Star page. When enabled, luminosity, radius, and temperature evolve with age and metallicity instead of using static scaling laws. Propagates through planet insolation, habitable zone, surface temperature, and moon illumination.",
      "<b>Lagrange Points</b> &mdash; Toggle-able L1&ndash;L5 overlay in the system visualiser. Click a body to see all five equilibrium points.",
      "<b>Cluster Metallicity</b> &mdash; Each star system in the local cluster now receives a [Fe/H] value based on galactic position, with giant-planet probability.",
    ]),
    release("1.11.1", "(from 1.11.0)", [
      "<b>System Poster</b> &mdash; Dynamic solar system lineup visualization on the Planetary System page. Star glows on the left; rocky planets, gas giants, debris disks, and moons are arranged by orbital distance with power-law sizing. Includes curved orbital arcs for habitable zone and debris disks, irregular asteroid particle effects, control panel toggles, logarithmic/linear scale, fullscreen mode, and PNG export.",
    ]),
    release("1.11.0", "(from 1.10.0)", [
      "<b>Apparent Size &amp; Brightness</b> &mdash; Bug fixes (angular-diameter swap, Roche limit divisor, moon absolute magnitude formula), multi-moon support, Bond-to-geometric albedo conversion, and NASA-validated Sol reference data.",
      "<b>Sky Canvas</b> &mdash; Angular size comparison chart rendering star, moons, and planets as disks at true relative angular sizes with Sol reference outlines, phase crescents, brightness-scaled glow, and a day/night sky toggle using the planet engine&rsquo;s computed sky colours.",
      "<b>Sol System Preset</b> &mdash; Corrected orbital, physical, and photometric data for 19 bodies against NASA Planetary Fact Sheets.",
    ]),
    release("1.10.0", "(from 1.9.1)", [
      "<b>Rocky Planet Composition</b> &mdash; Seven composition classes (Ice world through Coreless) and six water regimes derived from core mass fraction and water mass fraction. Includes core radius, mass&ndash;radius scaling, and composition-dependent tidal parameters.",
      "<b>Rocky Planet Atmosphere</b> &mdash; Ten-gas atmosphere with three greenhouse modes (Manual, Core, Full). Sky and vegetation colours vary by star type and pressure. Adds circulation cells, atmospheric tide resistance, and liquid water checks.",
      "<b>Magnetic Field</b> &mdash; Dynamo model with dipolar and multipolar regimes, driven by core fraction, mass, age, and rotation.",
      "<b>Tectonic Regimes</b> &mdash; Probability distribution across four regimes (stagnant lid, mobile lid, episodic, plutonic-squishy) based on mass, age, water, composition, and tidal heating.",
      "<b>Science Divergences</b> &mdash; New section on the Science &amp; Maths page listing 22 places where WorldSmith departs from published formulas, with explanations.",
    ]),
    release("1.9.1", "(from 1.9.0)", [
      "<b>Cluster Import</b> &mdash; Paste a tab-separated table of star systems to replace the generated neighbourhood with custom data.",
    ]),
    release("1.9.0", "(from 1.8.1)", [
      "<b>Tidal Heating</b> &mdash; Moon tidal dissipation model with accurate high-eccentricity heating. Outputs total power, surface flux, and Earth-normalised flux.",
      "<b>Composition Override</b> &mdash; Seven interior classes for moons, with calibrated overrides for partially molten and subsurface ocean bodies.",
      "<b>Tidal Recession</b> &mdash; Orbital migration rate and fate prediction from competing planet and moon tidal torques.",
    ]),
    release("1.8.1", "(from 1.8.0)", [
      "<b>Greenhouse Modes</b> &mdash; Greenhouse effect can now be derived from atmospheric composition (Core or Full mode) or set manually.",
      "<b>Sol Preset</b> &mdash; All preset values cross-referenced against the NASA Planetary Fact Sheet.",
      "<b>Local Cluster</b> &mdash; Add or remove star types with +/&minus; buttons and manage companions via right-click context menu.",
    ]),
    release("1.8.0", "(from 1.7.0)", [
      "<b>Sky Colours</b> &mdash; Account for atmospheric column density and CO&sub2; tint.",
      "<b>Vegetation Colours</b> &mdash; Pressure-dependent plant colours with twilight variants for tidally locked worlds.",
      "<b>Science &amp; Maths</b> &mdash; New reference page documenting all equations with LaTeX rendering and interactive calculators.",
      "<b>Temperature</b> &mdash; Improved surface temperature accuracy for airless and thin-atmosphere bodies.",
      "<b>UI</b> &mdash; Expandable KPI cards with hover-to-reveal detail and contrast-aware text on colour swatches.",
    ]),
    release("1.7.0", "(from 1.6.0)", [
      "<b>Unified Visualiser</b> &mdash; System and Local Cluster views merged into one page with seamless zoom transitions.",
      "<b>Star</b> &mdash; Stellar metallicity [Fe/H] input driving giant planet probability and population labels.",
      "<b>Star</b> &mdash; Improved mass&ndash;luminosity and mass&ndash;radius relations replacing the old textbook approximations.",
    ]),
    release("1.6.0", "(from 1.5.0)", [
      "<b>Planets / Other Objects</b> &mdash; Reworked gas giant and debris disk mechanics.",
      "<b>System Visualiser</b> &mdash; Improved gas giant rendering covering many realistic types.",
    ]),
    release("1.5.0", "(from 1.4.0)", [
      "<b>Star</b> &mdash; Advanced Physics mode: choose which two of Radius/Luminosity/Temperature to set.",
      "<b>System Visualiser</b> &mdash; Eccentric orbits rendered as tilted, inclined ellipses with Kepler-solved motion.",
      "<b>System Visualiser</b> &mdash; Moons now share the same orbital mechanics as planets.",
      "<b>Local Cluster</b> &mdash; Fixed stellar population fractions, class-weighted multiplicity, companion mass filtering, habitable-zone probability, and disk geometry.",
      "<b>Import/Export</b> &mdash; Fantasy system preset included.",
    ]),
    release("1.4.0", "(from 1.3.1)", [
      "<b>Apparent Size</b> &mdash; New page for apparent magnitude, brightness, and angular size calculations.",
      "<b>Calendar</b> &mdash; New page for solar, lunar, and lunisolar calendar derivations.",
    ]),
    release("1.3.1", "(from 1.3.0)", [
      "<b>System Visualiser</b> &mdash; Fixed depth layering for planets and gas giants around the star.",
    ]),
    release("1.3.0", "(from 1.2.0)", [
      "<b>System Visualiser</b> &mdash; Full 3D camera navigation with PNG and GIF export.",
      "<b>Planet</b> &mdash; Moon orbit guardrails and improved sky-colour presentation.",
      "<b>Local Cluster</b> &mdash; Range/bearing grid and renameable star systems.",
      "<b>Import/Export</b> &mdash; Built-in Sol preset import.",
    ]),
    release("1.2.0", "(from 1.1.0)", [
      "<b>System</b> &mdash; Temperature-dependent habitable-zone model.",
      "<b>System Visualiser</b> &mdash; Habitable-zone overlay with show/hide toggle.",
    ]),
    release("1.1.0", "(from 1.0.0)", [
      "<b>Import/Export</b> &mdash; Direct XLSX import for WorldSmith 8.x workbooks, with multi-tab support.",
      "<b>System Visualiser</b> &mdash; Improved focus-follow and star rendering.",
      "<b>Star</b> &mdash; Solar flare and coronal mass ejection estimates based on star type and age.",
    ]),
    release("1.0.0", "", ["Initial release."]),
  ].join("");
}

function openChangelog() {
  openAboutToast("Changelog", changelogHTML());
}

function openLicense() {
  openAboutToast(
    "License",
    `<div class="about-license">
      <p>
        <b>${APP_NAME} source code</b>, including its rendering and image-generation code,
        is released under the <b>Mozilla Public License 2.0 (MPL-2.0)</b>.
      </p>
      <p>
        The MPL-2.0 applies to the software code itself. <b>Generated output</b>, such as worlds,
        images, charts, and exports created with ${APP_NAME}, is user output and is not automatically
        licensed under the MPL-2.0 just because the app created it.
      </p>
      <p>
        <b>You may use, modify, publish, and share your generated output however you see fit.</b>
      </p>
      <p>
        Third-party components remain under their own licenses. For the full license text and
        third-party notices, see the public repository:
      </p>
      <ul>
        <li><a href="https://github.com/JudasBrennan/caelum_public/blob/main/LICENSE" target="_blank" rel="noopener noreferrer">MPL-2.0 License</a></li>
        <li><a href="https://github.com/JudasBrennan/caelum_public/blob/main/THIRD_PARTY_NOTICES.md" target="_blank" rel="noopener noreferrer">Third-Party Notices</a></li>
      </ul>
    </div>`,
  );
}

function openAboutToast(title, bodyHTML) {
  if (document.querySelector(".changelog-backdrop")) return;

  const backdrop = document.createElement("div");
  backdrop.className = "changelog-backdrop";
  backdrop.innerHTML = `
    <div class="changelog-toast">
      <div class="changelog-toast__header">
        <h2 class="changelog-toast__title">${title}</h2>
        <button class="changelog-toast__close" type="button" aria-label="Close">&times;</button>
      </div>
      <div class="changelog-toast__body">${bodyHTML}</div>
    </div>`;

  document.body.appendChild(backdrop);

  const closeBtn = backdrop.querySelector(".changelog-toast__close");

  function close() {
    window.removeEventListener("keydown", onKey);
    backdrop.removeEventListener("click", onBackdropClick);
    closeBtn?.removeEventListener("click", close);
    backdrop.remove();
  }

  function onBackdropClick(e) {
    if (e.target === backdrop) close();
  }

  function onKey(e) {
    if (e.key === "Escape") {
      close();
    }
  }

  backdrop.addEventListener("click", onBackdropClick);
  closeBtn?.addEventListener("click", close);
  window.addEventListener("keydown", onKey);
}
