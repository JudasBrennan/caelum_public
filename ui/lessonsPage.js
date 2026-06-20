/**
 * Lessons page - progressive curriculum teaching the scientific concepts
 * behind every Caelum calculator.
 *
 * Architecture mirrors sciencePage.js: lazy KaTeX, collapsible accordion,
 * TOC with unit groupings, and embedded mini-calculators. A global
 * Basic / Advanced toggle switches every lesson between plain-language
 * explainers and equation-level deep-dives.
 */

import { CURRICULUM } from "./lessons/curriculum.js";
import { loadKaTeX, renderAllMath } from "./katexLoader.js";
import { scrollIntoViewRespectingMotion } from "./motion.js";

const MODE_KEY = "worldsmith.lessons.mode";

function savedMode() {
  try {
    const value = localStorage.getItem(MODE_KEY);
    if (value === "advanced") return "advanced";
  } catch {
    // Ignore localStorage access errors and fall back to the default mode.
  }
  return "basic";
}

function saveMode(mode) {
  try {
    localStorage.setItem(MODE_KEY, mode);
  } catch {
    // Ignore localStorage access errors and keep the mode in memory only.
  }
}

function buildToc() {
  return CURRICULUM.map(
    (unit) => `
    <div class="les-toc__unit">
      <div class="les-toc__unit-title">${unit.unit}</div>
      <div class="les-toc__links">
        ${unit.lessons.map((lesson) => `<a class="les-toc__link" data-target="${lesson.id}">${lesson.num}. ${lesson.title}</a>`).join("")}
      </div>
    </div>`,
  ).join("");
}

function buildSections() {
  return CURRICULUM.map(
    (unit) =>
      `<div class="les-unit-divider">${unit.unit}</div>` +
      unit.lessons
        .map(
          (lesson) => `
      <details class="les-section" id="les-${lesson.id}">
        <summary class="les-section__summary">
          <span class="les-section__number">${lesson.num}</span>
          <span class="les-section__title">${lesson.title}</span>
          <span class="les-section__meta">${lesson.subtitle}</span>
        </summary>
        <div class="les-section__body" data-lesson="${lesson.id}"></div>
      </details>`,
        )
        .join(""),
  ).join("");
}

export function initLessonsPage(mountEl) {
  let mode = savedMode();
  let renderSequence = 0;

  const wrap = document.createElement("div");
  wrap.className = "page";

  wrap.innerHTML = `
    <div class="panel">
      <div class="panel__header">
        <h1 class="panel__title">
          <span class="ws-icon icon--lessons" aria-hidden="true"></span>
          <span>Lessons</span>
        </h1>
        <div style="display:flex;align-items:center;gap:12px">
          <div class="physics-duo-toggle les-mode-toggle" id="lessonModeToggle">
            <input type="radio" name="lessonMode" id="lesModeBasic" value="basic" ${mode !== "advanced" ? "checked" : ""} />
            <label for="lesModeBasic">Basic</label>
            <input type="radio" name="lessonMode" id="lesModeAdvanced" value="advanced" ${mode === "advanced" ? "checked" : ""} />
            <label for="lesModeAdvanced">Advanced</label>
            <span></span>
          </div>
          <div class="badge">Educational</div>
        </div>
      </div>
      <div class="panel__body">
        <p style="color:var(--muted);font-size:13px;margin:0 0 4px">
          A progressive curriculum covering every scientific concept in Caelum.
          Work through the units in order, or jump to any topic.
        </p>
        ${buildToc()}
      </div>
    </div>

    <div class="les-sections">${buildSections()}</div>
  `;

  mountEl.innerHTML = "";
  mountEl.appendChild(wrap);

  const allLessons = CURRICULUM.flatMap((unit) => unit.lessons);
  const lessonById = Object.fromEntries(allLessons.map((lesson) => [lesson.id, lesson]));

  async function renderLesson(id) {
    const lesson = lessonById[id];
    if (!lesson) return;

    const body = wrap.querySelector(`.les-section__body[data-lesson="${id}"]`);
    if (!body) return;

    const renderToken = ++renderSequence;
    body.dataset.lessonState = "loading";
    body.innerHTML = `<div class="hint">Loading lesson...</div>`;

    let lessonRuntime;
    try {
      lessonRuntime = await lesson.load();
    } catch (error) {
      if (renderToken !== renderSequence || !body.isConnected) return;
      body.dataset.lessonState = "error";
      body.innerHTML = `<div class="hint">Lesson content failed to load.</div>`;
      console.error(`[Caelum] Failed to load lesson ${id}:`, error);
      return;
    }

    if (renderToken !== renderSequence || !body.isConnected) return;

    body.innerHTML = lessonRuntime.build(mode);
    body.dataset.lessonState = "ready";

    try {
      lessonRuntime.wire?.(body);
    } catch (error) {
      console.error(`[Caelum] Failed to wire lesson ${id}:`, error);
    }

    if (mode === "advanced") {
      void loadKaTeX()
        .then((katex) => {
          if (renderToken !== renderSequence || !body.isConnected) return;
          renderAllMath(body, katex);
        })
        .catch((error) => {
          console.error(`[Caelum] Failed to load KaTeX for lesson ${id}:`, error);
        });
    }
  }

  const sections = wrap.querySelectorAll(".les-section");

  sections.forEach((section) => {
    section.addEventListener("toggle", () => {
      if (!section.open) return;

      sections.forEach((other) => {
        if (other !== section && other.open) other.open = false;
      });

      const id = section.id.replace("les-", "");
      void renderLesson(id);
      scrollIntoViewRespectingMotion(section, { block: "start" });
    });
  });

  wrap.querySelectorAll(".les-toc__link").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const target = link.dataset.target;
      const section = wrap.querySelector(`#les-${target}`);
      if (section) {
        section.open = true;
        // The toggle handler renders the lesson when the section opens.
      }
    });
  });

  wrap.querySelector("#lessonModeToggle").addEventListener("change", (event) => {
    mode = event.target.value;
    saveMode(mode);

    const openSection = wrap.querySelector(".les-section[open]");
    if (openSection) {
      const id = openSection.id.replace("les-", "");
      void renderLesson(id);
    }
  });
}
