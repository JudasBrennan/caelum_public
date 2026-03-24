/**
 * Curriculum manifest - defines the ordered lesson list and unit groupings.
 *
 * Each entry carries metadata used by the page controller to build the TOC
 * and accordion. Lesson code is loaded on demand so the Lessons route does
 * not eagerly pull every lesson module into its first chunk.
 */

function createLessonLoader(importLesson, buildExportName, wireExportName = null) {
  let lessonPromise = null;

  return async () => {
    lessonPromise ??= importLesson().then((mod) => {
      const build = mod?.[buildExportName];
      if (typeof build !== "function") {
        throw new Error(`Lesson module is missing ${buildExportName}.`);
      }
      const wire =
        wireExportName && typeof mod?.[wireExportName] === "function" ? mod[wireExportName] : null;
      return { build, wire };
    });
    return lessonPromise;
  };
}

/**
 * @typedef {{
 *   id: string,
 *   num: number,
 *   title: string,
 *   subtitle: string,
 *   load: () => Promise<{ build: (mode: string) => string, wire: ((root: Element) => void) | null }>
 * }} LessonEntry
 */

/** @type {{ unit: string, lessons: LessonEntry[] }[]} */
export const CURRICULUM = [
  {
    unit: "Stars",
    lessons: [
      {
        id: "L01",
        num: 1,
        title: "What Is a Star?",
        subtitle: "Mass, luminosity, and the master variable",
        load: createLessonLoader(
          () => import("./L01_starBasics.js"),
          "buildLesson01",
          "wireLesson01",
        ),
      },
      {
        id: "L02",
        num: 2,
        title: "Classifying Stars",
        subtitle: "Spectral types and the colour-temperature link",
        load: createLessonLoader(() => import("./L02_spectralTypes.js"), "buildLesson02"),
      },
      {
        id: "L03",
        num: 3,
        title: "Stellar Luminosity",
        subtitle: "The mass-luminosity relation",
        load: createLessonLoader(
          () => import("./L03_luminosity.js"),
          "buildLesson03",
          "wireLesson03",
        ),
      },
      {
        id: "L04",
        num: 4,
        title: "Stellar Evolution",
        subtitle: "From birth to giant branch",
        load: createLessonLoader(() => import("./L04_stellarEvolution.js"), "buildLesson04"),
      },
      {
        id: "L05",
        num: 5,
        title: "The Habitable Zone",
        subtitle: "Where liquid water can exist",
        load: createLessonLoader(
          () => import("./L05_habitableZone.js"),
          "buildLesson05",
          "wireLesson05",
        ),
      },
    ],
  },
  {
    unit: "Orbits & Systems",
    lessons: [
      {
        id: "L06",
        num: 6,
        title: "Orbital Mechanics",
        subtitle: "Kepler's laws and elliptical orbits",
        load: createLessonLoader(() => import("./L06_orbitalMechanics.js"), "buildLesson06"),
      },
      {
        id: "L07",
        num: 7,
        title: "Planetary Systems",
        subtitle: "Frost lines, spacing, and architecture",
        load: createLessonLoader(() => import("./L07_planetarySystems.js"), "buildLesson07"),
      },
    ],
  },
  {
    unit: "Terrestrial Worlds",
    lessons: [
      {
        id: "L08",
        num: 8,
        title: "Rocky Planets",
        subtitle: "Composition, density, and gravity",
        load: createLessonLoader(
          () => import("./L08_rockyPlanets.js"),
          "buildLesson08",
          "wireLesson08",
        ),
      },
      {
        id: "L09",
        num: 9,
        title: "Atmospheres",
        subtitle: "Pressure, escape, and outgassing",
        load: createLessonLoader(() => import("./L09_atmospheres.js"), "buildLesson09"),
      },
      {
        id: "L10",
        num: 10,
        title: "Surface Temperature",
        subtitle: "Energy balance and the greenhouse effect",
        load: createLessonLoader(
          () => import("./L10_surfaceTemperature.js"),
          "buildLesson10",
          "wireLesson10",
        ),
      },
    ],
  },
  {
    unit: "Giants & Moons",
    lessons: [
      {
        id: "L11",
        num: 11,
        title: "Gas Giants",
        subtitle: "Mass-radius relations and cloud layers",
        load: createLessonLoader(
          () => import("./L11_gasGiants.js"),
          "buildLesson11",
          "wireLesson11",
        ),
      },
      {
        id: "L12",
        num: 12,
        title: "Moons & Tides",
        subtitle: "Roche limits, Hill spheres, and tidal heating",
        load: createLessonLoader(
          () => import("./L12_moonsTides.js"),
          "buildLesson12",
          "wireLesson12",
        ),
      },
    ],
  },
  {
    unit: "Surface & Climate",
    lessons: [
      {
        id: "L13",
        num: 13,
        title: "Interiors & Tectonics",
        subtitle: "Plates, mountains, and volcanism",
        load: createLessonLoader(() => import("./L13_tectonics.js"), "buildLesson13"),
      },
      {
        id: "L14",
        num: 14,
        title: "Climate Zones",
        subtitle: "Köppen classification and circulation",
        load: createLessonLoader(() => import("./L14_climateZones.js"), "buildLesson14"),
      },
    ],
  },
  {
    unit: "The Wider Universe",
    lessons: [
      {
        id: "L15",
        num: 15,
        title: "Stellar Activity",
        subtitle: "Flares, CMEs, and habitability",
        load: createLessonLoader(
          () => import("./L15_stellarActivity.js"),
          "buildLesson15",
          "wireLesson15",
        ),
      },
      {
        id: "L16",
        num: 16,
        title: "Observing the Sky",
        subtitle: "Magnitudes, brightness, and visibility",
        load: createLessonLoader(
          () => import("./L16_observing.js"),
          "buildLesson16",
          "wireLesson16",
        ),
      },
      {
        id: "L17",
        num: 17,
        title: "Calendars & Time",
        subtitle: "Days, months, years, and leap cycles",
        load: createLessonLoader(
          () => import("./L17_calendars.js"),
          "buildLesson17",
          "wireLesson17",
        ),
      },
      {
        id: "L18",
        num: 18,
        title: "Population & Civilisation",
        subtitle: "Carrying capacity and growth",
        load: createLessonLoader(() => import("./L18_population.js"), "buildLesson18"),
      },
      {
        id: "L19",
        num: 19,
        title: "The Local Cluster",
        subtitle: "Stellar neighbourhoods and multiplicity",
        load: createLessonLoader(() => import("./L19_localCluster.js"), "buildLesson19"),
      },
      {
        id: "L20",
        num: 20,
        title: "Debris & Small Bodies",
        subtitle: "Rings, asteroids, and resonance sculpting",
        load: createLessonLoader(() => import("./L20_debrisDisks.js"), "buildLesson20"),
      },
    ],
  },
];
