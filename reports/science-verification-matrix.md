# Caelum Science Verification Matrix

Generated: 2026-07-15T19:25:33.880Z

App version: 3.6.0-beta.0

Science verification matrix covering benchmark anchors, invariants, trend checks, boundary checks, cross-system coupling, units, independent formula oracles, sensitivity, population sanity, browser coverage, and release gates.

Anchor benchmarks are only one family. Physics invariants, metamorphic trends, boundary behavior, coupling checks, and user-visible release gates are shown separately so users can see how each science area is bounded.

## Headline Counts

Metric | Value
--- | ---
Model areas | 31
Verification rows | 372
Passed rows | 363
Warnings | 0
Failures | 0
Modeling gaps | 0
Blocked rows | 0
Release gates passed | 1
Strict calibration rows | 147
Strict calibration failures | 0
Calibrated rows | 106
Exploratory rows | 33

## Model Area Coverage

Model area | Trust | Registry keys | Coverage
--- | --- | --- | ---
Stellar Environment | strong | stellarHistoryDose | anchor, metamorphic, unit, empirical-validation, source-coverage
Stellar Lifecycle | strong | stellarLifecycle | source-coverage
Rocky Planets | strong | planetRadiationEnvironment, surfaceClimate, geodynamics, interiorEvolution | anchor, invariant, metamorphic, cross-system, unit, sensitivity, empirical-validation, source-coverage
Hydrosphere And Ocean Chemistry | strong | co2ClimateTendency, productivity, nitrogenCycle | invariant, metamorphic, boundary, cross-system, source-coverage
Atmosphere And Climate Coupling | strong | atmosphereEvolution, coupledClimatePass, co2ClimateTendency, surfaceClimate | invariant, metamorphic, boundary, cross-system, unit, oracle, sensitivity, source-coverage
Moons And Tidal Worlds | strong | observerFrame, eclipseTiming, moonOrientation, secularStress, gasGiantMoonInfluenceSummary | anchor, invariant, metamorphic, boundary, cross-system, unit, oracle, population, source-coverage
Gas Giants And Rings | strong | ringMagnetosphere, gasGiantMoonInfluenceSummary | anchor, invariant, source-coverage
Orbital Dynamics And Architecture | strong | longTermDynamics, dynamicalVariability, secularDynamics, precession, cassiniState, migrationHistory, trojanPopulation, orbitalEpoch | anchor, cross-system, unit, oracle, source-coverage
Small Bodies And Impacts | strong | smallBodyReservoir, impactEnvironment | anchor, source-coverage
Habitability, Productivity, And Biosignatures | strong | productivity, nitrogenCycle, stellarHistoryDose | invariant, population, source-coverage
Observability And User-Facing Science | strong | observability, observerFrame, eclipseTiming | anchor, population, browser, source-coverage, release-gate
Surface ocean coverage and hypsometry context | strong | surfaceOceanCoverage | source-coverage
System fate aggregate timeline | strong | systemFate | source-coverage
Stellar neighbourhood hazard model | strong | stellarNeighbourhoodHazards | source-coverage
Moon solid-body structure and response context | strong | moonSolidBodyStructure | source-coverage
Icy moon sputtered oxygen exosphere | strong | icyMoonExosphere | source-coverage
Radius-valley boundary context | strong | radiusValleyBoundary | source-coverage
Host-frame stability | strong | hostFrame.stability | source-coverage
Selected-frame orbital architecture | strong | hostFrame.orbitalArchitecture | source-coverage
Mutual Hill spacing | strong | orbitalArchitecture.mutualHillSpacing | source-coverage
Eccentricity overlap | strong | orbitalArchitecture.eccentricityOverlap | source-coverage
Parent synchronous orbit | strong | moon.synchronousOrbit | source-coverage
Moon migration direction | strong | moon.migrationDirection | source-coverage
Eccentricity persistence | strong | moon.eccentricityPersistence | source-coverage
Sustained tidal heating | strong | moon.sustainedTidalHeating | source-coverage
Moon-system torque budget | strong | moonSystem.torqueBudget | source-coverage
Parent ring context | strong | parent.ringContext | source-coverage
Parent radiation and plasma context | strong | parent.radiationContext | source-coverage
Generation and repair guidance | strong | generation.guidance | source-coverage
Habitability persistence bridge | strong | habitability.persistenceBridge | source-coverage
Dynamical timeline events | strong | timeline.dynamicalEvents | source-coverage

## Calibration Tier Summary

Tier | Rows | Pass | Warn | Fail | Gap | Blocked
--- | --- | --- | --- | --- | --- | ---
calibrated | 106 | 106 | 0 | 0 | 0 | 0
exploratory | 33 | 29 | 0 | 0 | 0 | 0
strict | 147 | 147 | 0 | 0 | 0 | 0

## Open Gaps And Watch Items

No gaps, warnings, blocked rows, or failures.

## Verification Rows

Model area | Family | Tier | Subject | Metric | Status | Severity | Output | Expected | Action
--- | --- | --- | --- | --- | --- | --- | --- | --- | ---
stellar-environment | anchor | calibrated | Stellar evolution / Sun | Luminosity | PASS | info | 0.9767 Lsol | 1.000 Lsol | No action
stellar-environment | anchor | calibrated | Stellar evolution / Sun | Radius | PASS | info | 0.9967 Rsol | 1.000 Rsol | No action
stellar-environment | anchor | calibrated | Stellar evolution / Sun | Effective temperature | PASS | info | 5751 K | 5772 K | No action
stellar-environment | anchor | calibrated | Stellar evolution / Alpha Cen A | Luminosity | PASS | info | 1.496 Lsol | 1.519 Lsol | No action
stellar-environment | anchor | calibrated | Stellar evolution / Alpha Cen A | Radius | PASS | info | 1.203 Rsol | 1.223 Rsol | No action
stellar-environment | anchor | calibrated | Stellar evolution / Alpha Cen A | Effective temperature | PASS | info | 5825 K | 5790 K | No action
stellar-environment | anchor | calibrated | Stellar evolution / Alpha Cen B | Luminosity | PASS | info | 0.4693 Lsol | 0.5030 Lsol | No action
stellar-environment | anchor | calibrated | Stellar evolution / Alpha Cen B | Radius | PASS | info | 0.8489 Rsol | 0.8630 Rsol | No action
stellar-environment | anchor | calibrated | Stellar evolution / Alpha Cen B | Effective temperature | PASS | info | 5189 K | 5260 K | No action
stellar-environment | anchor | calibrated | Stellar evolution / Tau Ceti | Luminosity | PASS | info | 0.4309 Lsol | 0.4880 Lsol | No action
stellar-environment | anchor | calibrated | Stellar evolution / Tau Ceti | Radius | PASS | info | 0.7622 Rsol | 0.7930 Rsol | No action
stellar-environment | anchor | calibrated | Stellar evolution / Tau Ceti | Effective temperature | PASS | info | 5360 K | 5344 K | No action
stellar-environment | anchor | calibrated | Stellar evolution / 70 Oph A | Luminosity | PASS | info | 0.5247 Lsol | 0.4570 Lsol | No action
stellar-environment | anchor | calibrated | Stellar evolution / 70 Oph A | Radius | PASS | info | 0.8549 Rsol | 0.8620 Rsol | No action
stellar-environment | anchor | calibrated | Stellar evolution / 70 Oph A | Effective temperature | PASS | info | 5317 K | 5314 K | No action
stellar-environment | anchor | calibrated | Stellar evolution / Eps Eridani | Luminosity | PASS | info | 0.3246 Lsol | 0.3400 Lsol | No action
stellar-environment | anchor | calibrated | Stellar evolution / Eps Eridani | Radius | PASS | info | 0.7333 Rsol | 0.7350 Rsol | No action
stellar-environment | anchor | calibrated | Stellar evolution / Eps Eridani | Effective temperature | PASS | info | 5091 K | 5084 K | No action
stellar-environment | anchor | calibrated | Stellar evolution / 61 Cyg A | Luminosity | PASS | info | 0.1665 Lsol | 0.1530 Lsol | No action
stellar-environment | anchor | calibrated | Stellar evolution / 61 Cyg A | Radius | PASS | info | 0.6664 Rsol | 0.6650 Rsol | No action
stellar-environment | anchor | calibrated | Stellar evolution / 61 Cyg A | Effective temperature | PASS | info | 4520 K | 4526 K | No action
stellar-environment | anchor | calibrated | Stellar evolution / Sirius A | Luminosity | PASS | info | 24.56 Lsol | 25.40 Lsol | No action
stellar-environment | anchor | calibrated | Stellar evolution / Sirius A | Radius | PASS | info | 1.673 Rsol | 1.711 Rsol | No action
stellar-environment | anchor | calibrated | Stellar evolution / Sirius A | Effective temperature | PASS | info | 9940 K | 9940 K | No action
stellar-environment | anchor | calibrated | Stellar evolution / Pi3 Orionis | Luminosity | PASS | info | 2.519 Lsol | 2.820 Lsol | No action
stellar-environment | anchor | calibrated | Stellar evolution / Pi3 Orionis | Radius | PASS | info | 1.275 Rsol | 1.323 Rsol | No action
stellar-environment | anchor | calibrated | Stellar evolution / Pi3 Orionis | Effective temperature | PASS | info | 6444 K | 6516 K | No action
rocky-planets | anchor | strict | Rocky planets / Mercury | Density | PASS | info | 5.413 g/cm3 | 5.429 g/cm3 | No action
rocky-planets | anchor | strict | Rocky planets / Mercury | Radius | PASS | info | 0.3832 Rearth | 0.3830 Rearth | No action
rocky-planets | anchor | strict | Rocky planets / Mercury | Surface gravity | PASS | info | 0.3765 g | 0.3770 g | No action
rocky-planets | anchor | calibrated | Rocky planets / Mercury | Surface temperature | PASS | info | 440.0 K | 440.0 K | No action
rocky-planets | anchor | strict | Rocky planets / Mercury | Core radius fraction | PASS | info | 0.8367 | 0.8500 | No action
rocky-planets | anchor | calibrated | Rocky planets / Mercury | Surface magnetic field | PASS | info | 0.0092 Earth | 0.0030 Earth to 0.0300 Earth | No action
rocky-planets | anchor | strict | Rocky planets / Mercury | Composition class | PASS | info | Iron world | Mercury-like or Iron world | No action
observability-user-facing | anchor | strict | Climate state / Mercury | Absorbed stellar flux | PASS | info | 2117 W/m2 | 2117 W/m2 | No action
observability-user-facing | anchor | strict | Climate state / Mercury | Observed dry-body state | PASS | info | Stable | Stable | No action
rocky-planets | anchor | strict | Rocky planets / Venus | Density | PASS | info | 5.224 g/cm3 | 5.243 g/cm3 | No action
rocky-planets | anchor | strict | Rocky planets / Venus | Radius | PASS | info | 0.9508 Rearth | 0.9490 Rearth | No action
rocky-planets | anchor | strict | Rocky planets / Venus | Surface gravity | PASS | info | 0.9015 g | 0.9050 g | No action
rocky-planets | anchor | calibrated | Rocky planets / Venus | Surface temperature | PASS | info | 736.0 K | 737.0 K | No action
rocky-planets | anchor | calibrated | Rocky planets / Venus | Surface magnetic field | PASS | info | 0 Earth | 0 Earth | No action
rocky-planets | anchor | strict | Rocky planets / Venus | Composition class | PASS | info | Earth-like | Earth-like | No action
observability-user-facing | anchor | strict | Climate state / Venus | Absorbed stellar flux | PASS | info | 156.2 W/m2 | 156.2 W/m2 | No action
observability-user-facing | anchor | strict | Climate state / Venus | Observed dry-body state | PASS | info | Stable | Stable | No action
rocky-planets | anchor | strict | Rocky planets / Earth | Density | PASS | info | 5.481 g/cm3 | 5.514 g/cm3 | No action
rocky-planets | anchor | strict | Rocky planets / Earth | Radius | PASS | info | 1.002 Rearth | 1.000 Rearth | No action
rocky-planets | anchor | strict | Rocky planets / Earth | Surface gravity | PASS | info | 0.9965 g | 1.000 g | No action
rocky-planets | anchor | calibrated | Rocky planets / Earth | Surface temperature | PASS | info | 282.0 K | 288.0 K | No action
rocky-planets | anchor | strict | Rocky planets / Earth | Core radius fraction | PASS | info | 0.5701 | 0.5470 | No action
rocky-planets | anchor | strict | Rocky planets / Earth | Core radius | PASS | info | 3638 km | 3485 km | No action
rocky-planets | anchor | calibrated | Rocky planets / Earth | Surface magnetic field | PASS | info | 0.9787 Earth | 1.000 Earth | No action
rocky-planets | anchor | strict | Rocky planets / Earth | Composition class | PASS | info | Earth-like | Earth-like | No action
observability-user-facing | anchor | strict | Climate state / Earth | Absorbed stellar flux | PASS | info | 236.1 W/m2 | 236.1 W/m2 | No action
observability-user-facing | anchor | strict | Climate state / Earth | Observed dry-body state | PASS | info | Stable | Stable | No action
rocky-planets | anchor | strict | Rocky planets / Mars | Density | PASS | info | 3.966 g/cm3 | 3.934 g/cm3 | No action
rocky-planets | anchor | strict | Rocky planets / Mars | Radius | PASS | info | 0.5297 Rearth | 0.5320 Rearth | No action
rocky-planets | anchor | strict | Rocky planets / Mars | Surface gravity | PASS | info | 0.3813 g | 0.3780 g | No action
rocky-planets | anchor | calibrated | Rocky planets / Mars | Surface temperature | PASS | info | 211.0 K | 210.0 K | No action
rocky-planets | anchor | calibrated | Rocky planets / Mars | Surface magnetic field | PASS | info | 0 Earth | 0 Earth | No action
rocky-planets | anchor | strict | Rocky planets / Mars | Composition class | PASS | info | Mars-like | Mars-like | No action
observability-user-facing | anchor | strict | Climate state / Mars | Absorbed stellar flux | PASS | info | 109.9 W/m2 | 109.9 W/m2 | No action
observability-user-facing | anchor | strict | Climate state / Mars | Observed dry-body state | PASS | info | Stable | Stable | No action
observability-user-facing | anchor | strict | Climate state / Ceres | Absorbed stellar flux | PASS | info | 42.84 W/m2 | 42.84 W/m2 | No action
observability-user-facing | anchor | strict | Climate state / Ceres | Observed dry-body state | PASS | info | Stable | Stable | No action
observability-user-facing | anchor | strict | Climate state / Earth + water | Water-enabled climate state | PASS | info | Stable | Stable | No action
observability-user-facing | anchor | strict | Climate state / Venus + water | Water-enabled climate state | PASS | info | Moist greenhouse | Moist greenhouse | No action
observability-user-facing | anchor | strict | Climate state / Venus primordial wet | Water-enabled climate state | PASS | info | Runaway greenhouse | Runaway greenhouse | No action
observability-user-facing | anchor | strict | Climate state / Mars + water | Water-enabled climate state | PASS | info | Snowball | Snowball | No action
observability-user-facing | anchor | strict | Climate state / Mercury + water | Water-enabled climate state | PASS | info | Runaway greenhouse | Runaway greenhouse | No action
observability-user-facing | anchor | strict | Climate state / Ceres + water | Water-enabled climate state | PASS | info | Snowball | Snowball | No action
gas-giants | anchor | strict | Gas and ice giants / Jupiter | Density | PASS | info | 1.326 g/cm3 | 1.326 g/cm3 | No action
gas-giants | anchor | strict | Gas and ice giants / Jupiter | Escape velocity | PASS | info | 60.20 km/s | 60.20 km/s | No action
gas-giants | anchor | strict | Gas and ice giants / Jupiter | Orbital period | PASS | info | 11.86 yr | 11.86 yr | No action
gas-giants | anchor | strict | Gas and ice giants / Jupiter | Orbital velocity | PASS | info | 13.06 km/s | 13.07 km/s | No action
gas-giants | anchor | strict | Gas and ice giants / Jupiter | Equatorial radius | PASS | info | 71423 km | 71492 km | No action
gas-giants | anchor | strict | Gas and ice giants / Jupiter | Polar radius | PASS | info | 66886 km | 66854 km | No action
gas-giants | anchor | strict | Gas and ice giants / Jupiter | Flattening | PASS | info | 0.0649 | 0.0649 | No action
gas-giants | anchor | strict | Gas and ice giants / Jupiter | Equatorial gravity | PASS | info | 24.83 m/s2 | 24.79 m/s2 | No action
gas-giants | anchor | calibrated | Gas and ice giants / Jupiter | Effective temperature | PASS | info | 123.7 K | 124.4 K | Phase 3 implemented: keep intrinsic-heat benchmark
gas-giants | anchor | calibrated | Gas and ice giants / Jupiter | Bond albedo | PASS | info | 0.3400 | 0.3430 | No action
gas-giants | anchor | calibrated | Gas and ice giants / Jupiter | Surface magnetic field | PASS | info | 4.279 G | 4.280 G | No action
gas-giants | anchor | calibrated | Gas and ice giants / Jupiter | Magnetic morphology | PASS | info | dipolar | dipolar | No action
gas-giants | anchor | calibrated | Gas and ice giants / Jupiter | Conductivity regime | PASS | info | metallic-H | metallic-H | No action
gas-giants | anchor | calibrated | Gas and ice giants / Jupiter | Magnetopause with real moons | PASS | info | 74.60 Rp | 75.00 Rp | No action
gas-giants | anchor | strict | Gas and ice giants / Saturn | Density | PASS | info | 0.6870 g/cm3 | 0.6870 g/cm3 | No action
gas-giants | anchor | strict | Gas and ice giants / Saturn | Escape velocity | PASS | info | 36.09 km/s | 36.09 km/s | No action
gas-giants | anchor | strict | Gas and ice giants / Saturn | Orbital period | PASS | info | 29.53 yr | 29.46 yr | No action
gas-giants | anchor | strict | Gas and ice giants / Saturn | Orbital velocity | PASS | info | 9.640 km/s | 9.680 km/s | No action
gas-giants | anchor | strict | Gas and ice giants / Saturn | Equatorial radius | PASS | info | 60130 km | 60268 km | No action
gas-giants | anchor | strict | Gas and ice giants / Saturn | Polar radius | PASS | info | 54435 km | 54364 km | No action
gas-giants | anchor | strict | Gas and ice giants / Saturn | Flattening | PASS | info | 0.0978 | 0.0980 | No action
gas-giants | anchor | strict | Gas and ice giants / Saturn | Equatorial gravity | PASS | info | 10.49 m/s2 | 10.44 m/s2 | No action
gas-giants | anchor | calibrated | Gas and ice giants / Saturn | Effective temperature | PASS | info | 95.40 K | 95.00 K | Phase 3 implemented: keep intrinsic-heat benchmark
gas-giants | anchor | calibrated | Gas and ice giants / Saturn | Bond albedo | PASS | info | 0.3400 | 0.3420 | No action
gas-giants | anchor | calibrated | Gas and ice giants / Saturn | Surface magnetic field | PASS | info | 0.2280 G | 0.2100 G | No action
gas-giants | anchor | calibrated | Gas and ice giants / Saturn | Magnetic morphology | PASS | info | dipolar | dipolar | No action
gas-giants | anchor | calibrated | Gas and ice giants / Saturn | Conductivity regime | PASS | info | metallic-H | metallic-H | No action
gas-giants | anchor | calibrated | Gas and ice giants / Saturn | Magnetopause with real moons | PASS | info | 22.70 Rp | 22.00 Rp | No action
gas-giants | anchor | strict | Gas and ice giants / Uranus | Density | PASS | info | 1.270 g/cm3 | 1.270 g/cm3 | No action
gas-giants | anchor | strict | Gas and ice giants / Uranus | Escape velocity | PASS | info | 21.37 km/s | 21.38 km/s | No action
gas-giants | anchor | strict | Gas and ice giants / Uranus | Orbital period | PASS | info | 84.25 yr | 84.01 yr | No action
gas-giants | anchor | strict | Gas and ice giants / Uranus | Orbital velocity | PASS | info | 6.790 km/s | 6.800 km/s | No action
gas-giants | anchor | strict | Gas and ice giants / Uranus | Equatorial radius | PASS | info | 25556 km | 25559 km | No action
gas-giants | anchor | strict | Gas and ice giants / Uranus | Polar radius | PASS | info | 24973 km | 24973 km | No action
gas-giants | anchor | strict | Gas and ice giants / Uranus | Flattening | PASS | info | 0.0230 | 0.0229 | No action
gas-giants | anchor | strict | Gas and ice giants / Uranus | Equatorial gravity | PASS | info | 8.870 m/s2 | 8.870 m/s2 | No action
gas-giants | anchor | calibrated | Gas and ice giants / Uranus | Effective temperature | PASS | info | 59.60 K | 58.20 K | Phase 3 implemented: keep intrinsic-heat benchmark
gas-giants | anchor | calibrated | Gas and ice giants / Uranus | Bond albedo | PASS | info | 0.3000 | 0.3000 | No action
gas-giants | anchor | calibrated | Gas and ice giants / Uranus | Surface magnetic field | PASS | info | 0.2350 G | 0.2300 G | No action
gas-giants | anchor | calibrated | Gas and ice giants / Uranus | Magnetic morphology | PASS | info | multipolar | multipolar | No action
gas-giants | anchor | calibrated | Gas and ice giants / Uranus | Conductivity regime | PASS | info | ionic | ionic | No action
gas-giants | anchor | calibrated | Gas and ice giants / Uranus | Magnetopause with real moons | PASS | info | 18.60 Rp | 18.00 Rp | No action
gas-giants | anchor | strict | Gas and ice giants / Neptune | Density | PASS | info | 1.638 g/cm3 | 1.638 g/cm3 | No action
gas-giants | anchor | strict | Gas and ice giants / Neptune | Escape velocity | PASS | info | 23.56 km/s | 23.56 km/s | No action
gas-giants | anchor | strict | Gas and ice giants / Neptune | Orbital period | PASS | info | 165.2 yr | 164.8 yr | No action
gas-giants | anchor | strict | Gas and ice giants / Neptune | Orbital velocity | PASS | info | 5.430 km/s | 5.430 km/s | No action
gas-giants | anchor | strict | Gas and ice giants / Neptune | Equatorial radius | PASS | info | 24763 km | 24764 km | No action
gas-giants | anchor | strict | Gas and ice giants / Neptune | Polar radius | PASS | info | 24339 km | 24341 km | No action
gas-giants | anchor | strict | Gas and ice giants / Neptune | Flattening | PASS | info | 0.0172 | 0.0171 | No action
gas-giants | anchor | strict | Gas and ice giants / Neptune | Equatorial gravity | PASS | info | 11.15 m/s2 | 11.15 m/s2 | No action
gas-giants | anchor | calibrated | Gas and ice giants / Neptune | Effective temperature | PASS | info | 72.00 K | 72.00 K | Phase 3 implemented: keep intrinsic-heat benchmark
gas-giants | anchor | calibrated | Gas and ice giants / Neptune | Bond albedo | PASS | info | 0.3000 | 0.2900 | No action
gas-giants | anchor | calibrated | Gas and ice giants / Neptune | Surface magnetic field | PASS | info | 0.1420 G | 0.1400 G | No action
gas-giants | anchor | calibrated | Gas and ice giants / Neptune | Magnetic morphology | PASS | info | multipolar | multipolar | No action
gas-giants | anchor | calibrated | Gas and ice giants / Neptune | Conductivity regime | PASS | info | ionic | ionic | No action
gas-giants | anchor | calibrated | Gas and ice giants / Neptune | Magnetopause with real moons | PASS | info | 23.20 Rp | 23.00 Rp | No action
observability-user-facing | anchor | calibrated | Exoplanet giant benchmarks / GJ 436 b | Bulk density | PASS | info | 1.803 g/cm3 | 1.800 g/cm3 | Phase 4 implemented: keep non-Solar generalization benchmark
observability-user-facing | anchor | strict | Exoplanet giant benchmarks / GJ 436 b | Orbital period | PASS | info | 2.640 days | 2.644 days | Phase 4 implemented: keep non-Solar generalization benchmark
observability-user-facing | anchor | calibrated | Exoplanet giant benchmarks / GJ 436 b | Zero-albedo equilibrium temperature | PASS | info | 656.8 K | 686.0 K | Phase 4 implemented: keep non-Solar generalization benchmark
observability-user-facing | anchor | calibrated | Exoplanet giant benchmarks / GJ 436 b | Transit depth | PASS | info | 0.6750 % | 0.6819 % | Phase 4 implemented: keep non-Solar generalization benchmark
observability-user-facing | anchor | strict | Exoplanet giant benchmarks / GJ 436 b | RV semi-amplitude | PASS | info | 17.01 m/s | 17.09 m/s | Phase 4 implemented: keep non-Solar generalization benchmark
observability-user-facing | anchor | calibrated | Exoplanet giant benchmarks / HAT-P-11 b | Bulk density | PASS | info | 1.773 g/cm3 | 1.172 g/cm3 | Phase 4 implemented: keep non-Solar generalization benchmark
observability-user-facing | anchor | strict | Exoplanet giant benchmarks / HAT-P-11 b | Orbital period | PASS | info | 4.890 days | 4.888 days | Phase 4 implemented: keep non-Solar generalization benchmark
observability-user-facing | anchor | calibrated | Exoplanet giant benchmarks / HAT-P-11 b | Zero-albedo equilibrium temperature | PASS | info | 877.9 K | 838.0 K | Phase 4 implemented: keep non-Solar generalization benchmark
observability-user-facing | anchor | calibrated | Exoplanet giant benchmarks / HAT-P-11 b | Transit depth | PASS | info | 0.3275 % | 0.4342 % | Phase 4 implemented: keep non-Solar generalization benchmark
observability-user-facing | anchor | strict | Exoplanet giant benchmarks / HAT-P-11 b | RV semi-amplitude | PASS | info | 10.83 m/s | 10.42 m/s | Phase 4 implemented: keep non-Solar generalization benchmark
observability-user-facing | anchor | calibrated | Exoplanet giant benchmarks / HD 189733 b | Bulk density | PASS | info | 1.038 g/cm3 | 0.9430 g/cm3 | Phase 4 implemented: keep non-Solar generalization benchmark
observability-user-facing | anchor | strict | Exoplanet giant benchmarks / HD 189733 b | Orbital period | PASS | info | 2.270 days | 2.219 days | Phase 4 implemented: keep non-Solar generalization benchmark
observability-user-facing | anchor | calibrated | Exoplanet giant benchmarks / HD 189733 b | Zero-albedo equilibrium temperature | PASS | info | 1210 K | 1209 K | Phase 4 implemented: keep non-Solar generalization benchmark
observability-user-facing | anchor | calibrated | Exoplanet giant benchmarks / HD 189733 b | Transit depth | PASS | info | 2.292 % | 2.400 % | Phase 4 implemented: keep non-Solar generalization benchmark
observability-user-facing | anchor | strict | Exoplanet giant benchmarks / HD 189733 b | RV semi-amplitude | PASS | info | 204.3 m/s | 205.0 m/s | Phase 4 implemented: keep non-Solar generalization benchmark
observability-user-facing | anchor | calibrated | Exoplanet giant benchmarks / HD 209458 b | Bulk density | PASS | info | 0.3605 g/cm3 | 0.3620 g/cm3 | Phase 4 implemented: keep non-Solar generalization benchmark
observability-user-facing | anchor | strict | Exoplanet giant benchmarks / HD 209458 b | Orbital period | PASS | info | 3.360 days | 3.525 days | Phase 4 implemented: keep non-Solar generalization benchmark
observability-user-facing | anchor | calibrated | Exoplanet giant benchmarks / HD 209458 b | Zero-albedo equilibrium temperature | PASS | info | 1469 K | 1459 K | Phase 4 implemented: keep non-Solar generalization benchmark
observability-user-facing | anchor | calibrated | Exoplanet giant benchmarks / HD 209458 b | Transit depth | PASS | info | 1.378 % | 1.500 % | Phase 4 implemented: keep non-Solar generalization benchmark
observability-user-facing | anchor | strict | Exoplanet giant benchmarks / HD 209458 b | RV semi-amplitude | PASS | info | 86.21 m/s | 84.70 m/s | Phase 4 implemented: keep non-Solar generalization benchmark
observability-user-facing | anchor | calibrated | Exoplanet giant benchmarks / KELT-9 b | Bulk density | PASS | info | 0.5648 g/cm3 | 0.5300 g/cm3 | Phase 4 implemented: keep non-Solar generalization benchmark
observability-user-facing | anchor | strict | Exoplanet giant benchmarks / KELT-9 b | Orbital period | PASS | info | 1.480 days | 1.481 days | Phase 4 implemented: keep non-Solar generalization benchmark
observability-user-facing | anchor | calibrated | Exoplanet giant benchmarks / KELT-9 b | Zero-albedo equilibrium temperature | PASS | info | 4046 K | 4050 K | Phase 4 implemented: keep non-Solar generalization benchmark
observability-user-facing | anchor | calibrated | Exoplanet giant benchmarks / KELT-9 b | Transit depth | PASS | info | 0.6472 % | 0.6770 % | Phase 4 implemented: keep non-Solar generalization benchmark
observability-user-facing | anchor | strict | Exoplanet giant benchmarks / KELT-9 b | RV semi-amplitude | PASS | info | 277.0 m/s | 276.0 m/s | Phase 4 implemented: keep non-Solar generalization benchmark
observability-user-facing | anchor | calibrated | Exoplanet giant benchmarks / WASP-12 b | Bulk density | PASS | info | 0.2569 g/cm3 | 0.2660 g/cm3 | Phase 4 implemented: keep non-Solar generalization benchmark
observability-user-facing | anchor | strict | Exoplanet giant benchmarks / WASP-12 b | Orbital period | PASS | info | 1.140 days | 1.091 days | Phase 4 implemented: keep non-Solar generalization benchmark
observability-user-facing | anchor | calibrated | Exoplanet giant benchmarks / WASP-12 b | Zero-albedo equilibrium temperature | PASS | info | 2572 K | 2601 K | Phase 4 implemented: keep non-Solar generalization benchmark
observability-user-facing | anchor | calibrated | Exoplanet giant benchmarks / WASP-12 b | Transit depth | PASS | info | 1.365 % | 1.538 % | Phase 4 implemented: keep non-Solar generalization benchmark
observability-user-facing | anchor | strict | Exoplanet giant benchmarks / WASP-12 b | RV semi-amplitude | PASS | info | 237.2 m/s | 219.9 m/s | Phase 4 implemented: keep non-Solar generalization benchmark
moons | anchor | strict | Moons / Luna | Radius | PASS | info | 1737 km | 1737 km | No action
moons | anchor | strict | Moons / Luna | Surface gravity | PASS | info | 1.623 m/s2 | 1.624 m/s2 | No action
moons | anchor | strict | Moons / Luna | Escape velocity | PASS | info | 2.380 km/s | 2.380 km/s | No action
moons | anchor | strict | Moons / Luna | Sidereal period | PASS | info | 27.29 days | 27.32 days | No action
moons | anchor | calibrated | Moons / Luna | Surface temperature | PASS | info | 269.0 K | 270.0 K | No action: revisit after Phase 1 thermal-envelope implementation
moons | anchor | exploratory | Moons / Luna | Tidally locked | PASS | info | Yes | Yes | No action
moons | anchor | strict | Moons / Io | Radius | PASS | info | 1821 km | 1822 km | No action
moons | anchor | strict | Moons / Io | Surface gravity | PASS | info | 1.796 m/s2 | 1.796 m/s2 | No action
moons | anchor | strict | Moons / Io | Escape velocity | PASS | info | 2.564 km/s | 2.558 km/s | No action
moons | anchor | strict | Moons / Io | Sidereal period | PASS | info | 1.770 days | 1.769 days | No action
moons | anchor | calibrated | Moons / Io | Surface temperature | PASS | info | 109.0 K | 110.0 K | No action: revisit after Phase 1 thermal-envelope implementation
moons | anchor | exploratory | Moons / Io | Tidally locked | PASS | info | Yes | Yes | No action
moons | anchor | strict | Moons / Europa | Radius | PASS | info | 1561 km | 1561 km | No action
moons | anchor | strict | Moons / Europa | Surface gravity | PASS | info | 1.314 m/s2 | 1.314 m/s2 | No action
moons | anchor | strict | Moons / Europa | Escape velocity | PASS | info | 2.031 km/s | 2.025 km/s | No action
moons | anchor | strict | Moons / Europa | Sidereal period | PASS | info | 3.552 days | 3.551 days | No action
moons | anchor | calibrated | Moons / Europa | Surface temperature | PASS | info | 92.00 K | 102.0 K | No action: revisit after Phase 1 thermal-envelope implementation
moons | anchor | exploratory | Moons / Europa | Tidally locked | PASS | info | Yes | Yes | No action
moons | anchor | strict | Moons / Ganymede | Radius | PASS | info | 2631 km | 2631 km | No action
moons | anchor | strict | Moons / Ganymede | Surface gravity | PASS | info | 1.428 m/s2 | 1.428 m/s2 | No action
moons | anchor | strict | Moons / Ganymede | Escape velocity | PASS | info | 2.748 km/s | 2.741 km/s | No action
moons | anchor | strict | Moons / Ganymede | Sidereal period | PASS | info | 7.155 days | 7.155 days | No action
moons | anchor | calibrated | Moons / Ganymede | Surface temperature | PASS | info | 105.0 K | 110.0 K | No action: revisit after Phase 1 thermal-envelope implementation
moons | anchor | exploratory | Moons / Ganymede | Tidally locked | PASS | info | Yes | Yes | No action
moons | anchor | strict | Moons / Callisto | Radius | PASS | info | 2410 km | 2410 km | No action
moons | anchor | strict | Moons / Callisto | Surface gravity | PASS | info | 1.236 m/s2 | 1.235 m/s2 | No action
moons | anchor | strict | Moons / Callisto | Escape velocity | PASS | info | 2.447 km/s | 2.440 km/s | No action
moons | anchor | strict | Moons / Callisto | Sidereal period | PASS | info | 16.69 days | 16.69 days | No action
moons | anchor | calibrated | Moons / Callisto | Surface temperature | PASS | info | 141.4 K | 134.0 K | No action: revisit after Phase 1 thermal-envelope implementation
moons | anchor | exploratory | Moons / Callisto | Tidally locked | PASS | info | Yes | Yes | No action
moons | anchor | strict | Moons / Titan | Radius | PASS | info | 2575 km | 2575 km | No action
moons | anchor | strict | Moons / Titan | Surface gravity | PASS | info | 1.354 m/s2 | 1.352 m/s2 | No action
moons | anchor | strict | Moons / Titan | Escape velocity | PASS | info | 2.647 km/s | 2.639 km/s | No action
moons | anchor | strict | Moons / Titan | Sidereal period | PASS | info | 15.95 days | 15.95 days | No action
moons | anchor | calibrated | Moons / Titan | Surface temperature | PASS | info | 121.8 K | 94.00 K | Keep Titan thick-atmosphere temperature as a broad validation anchor
moons | anchor | exploratory | Moons / Titan | Tidally locked | PASS | info | Yes | Yes | No action
moons | anchor | strict | Moons / Enceladus | Radius | PASS | info | 251.9 km | 252.1 km | No action
moons | anchor | strict | Moons / Enceladus | Surface gravity | PASS | info | 0.1134 m/s2 | 0.1130 m/s2 | No action
moons | anchor | strict | Moons / Enceladus | Escape velocity | PASS | info | 0.2396 km/s | 0.2390 km/s | No action
moons | anchor | strict | Moons / Enceladus | Sidereal period | PASS | info | 1.375 days | 1.370 days | No action
moons | anchor | calibrated | Moons / Enceladus | Observable surface temperature range | PASS | info | 14.80 K to 87.80 K | 75.00 K | Phase 1 implemented: keep envelope comparison as calibration anchor
moons | anchor | exploratory | Moons / Enceladus | Global-equilibrium temperature | INFO | info | 59.20 K | 75.00 K | No tuning action: use observable envelope row for Phase 1 calibration
moons | anchor | exploratory | Moons / Enceladus | Tidally locked | PASS | info | Yes | Yes | No action
moons | anchor | strict | Moons / Triton | Radius | PASS | info | 1353 km | 1353 km | No action
moons | anchor | strict | Moons / Triton | Surface gravity | PASS | info | 0.7810 m/s2 | 0.7790 m/s2 | No action
moons | anchor | strict | Moons / Triton | Escape velocity | PASS | info | 1.457 km/s | 1.455 km/s | No action
moons | anchor | strict | Moons / Triton | Sidereal period | PASS | info | 5.878 days | 5.877 days | No action
moons | anchor | calibrated | Moons / Triton | Surface temperature | PASS | info | 36.48 K | 38.00 K | No action: revisit after Phase 1 thermal-envelope implementation
moons | anchor | exploratory | Moons / Triton | Tidally locked | PASS | info | Yes | Yes | No action
moons | anchor | strict | Moons / Miranda | Radius | PASS | info | 235.4 km | 235.8 km | No action
moons | anchor | strict | Moons / Miranda | Surface gravity | PASS | info | 0.0775 m/s2 | 0.0790 m/s2 | No action
moons | anchor | strict | Moons / Miranda | Escape velocity | PASS | info | 0.1915 km/s | 0.1930 km/s | No action
moons | anchor | strict | Moons / Miranda | Sidereal period | PASS | info | 1.414 days | 1.413 days | No action
moons | anchor | calibrated | Moons / Miranda | Observable surface temperature range | PASS | info | 14.60 K to 87.30 K | 86.00 K | Phase 1 implemented: keep envelope comparison as calibration anchor
moons | anchor | exploratory | Moons / Miranda | Global-equilibrium temperature | INFO | info | 58.50 K | 86.00 K | No tuning action: use observable envelope row for Phase 1 calibration
moons | anchor | exploratory | Moons / Miranda | Tidally locked | PASS | info | Yes | Yes | No action
moons | anchor | strict | Moons / Titania | Radius | PASS | info | 788.6 km | 788.4 km | No action
moons | anchor | strict | Moons / Titania | Surface gravity | PASS | info | 0.3771 m/s2 | 0.3780 m/s2 | No action
moons | anchor | strict | Moons / Titania | Escape velocity | PASS | info | 0.7732 km/s | 0.7700 km/s | No action
moons | anchor | strict | Moons / Titania | Sidereal period | PASS | info | 8.694 days | 8.706 days | No action
moons | anchor | calibrated | Moons / Titania | Observable surface temperature range | PASS | info | 15.80 K to 88.00 K | 70.00 K | Phase 1 implemented: keep envelope comparison as calibration anchor
moons | anchor | exploratory | Moons / Titania | Global-equilibrium temperature | INFO | info | 58.90 K | 70.00 K | No tuning action: use observable envelope row for Phase 1 calibration
moons | anchor | exploratory | Moons / Titania | Tidally locked | PASS | info | Yes | Yes | No action
moons | anchor | strict | Moons / Charon | Radius | PASS | info | 605.8 km | 606.0 km | No action
moons | anchor | strict | Moons / Charon | Surface gravity | PASS | info | 0.2882 m/s2 | 0.2880 m/s2 | No action
moons | anchor | strict | Moons / Charon | Escape velocity | PASS | info | 0.5924 km/s | 0.5900 km/s | No action
moons | anchor | strict | Moons / Charon | Sidereal period | PASS | info | 6.390 days | 6.387 days | No action
moons | anchor | calibrated | Moons / Charon | Observable surface temperature range | PASS | info | 14.70 K to 61.80 K | 53.00 K | Phase 1 implemented: keep envelope comparison as calibration anchor
moons | anchor | exploratory | Moons / Charon | Global-equilibrium temperature | INFO | info | 41.40 K | 53.00 K | No tuning action: use observable envelope row for Phase 1 calibration
moons | anchor | exploratory | Moons / Charon | Tidally locked | PASS | info | Yes | Yes | No action
moons | anchor | exploratory | Moons / Io | Tidal heat | PASS | info | 9.577e+13 W | 1.000e+14 W | No action
moons | anchor | exploratory | Moons / Enceladus | Tidal heat | PASS | info | 5.123e+8 W | 5.000e+9 W | No action
moons | anchor | calibrated | Moon volatiles / Triton | Primary atmosphere species | PASS | info | N2 | N2 | No action
moons | anchor | calibrated | Moon volatiles / Io | Primary atmosphere species | PASS | info | SO2 | SO2 | No action
moons | anchor | calibrated | Moon volatiles / Titan | N2 retained | PASS | info | true | true | No action
moons | anchor | calibrated | Moon volatiles / Titania | No substantial atmosphere | PASS | info | true | true | No action
moons | anchor | exploratory | Dedicated tidal validation / Io | Tidal heating power | PASS | info | 9.118e+13 W | 1.000e+14 W | No action: keep as broad tidal validation anchor
moons | anchor | exploratory | Dedicated tidal validation / Io | Surface heat flux | PASS | info | 2.188 W/m2 | 2.240 W/m2 | No action: keep as broad tidal validation anchor
moons | anchor | exploratory | Dedicated tidal validation / Europa | Tidal heating power | PASS | info | 2.308e+12 W | 1.000e+12 W | No action: keep as broad tidal validation anchor
moons | anchor | exploratory | Dedicated tidal validation / Europa | Surface heat flux | PASS | info | 0.0754 W/m2 | 0.0500 W/m2 | No action: keep as broad tidal validation anchor
moons | anchor | exploratory | Dedicated tidal validation / Enceladus | Tidal heating power | PASS | info | 2.799e+10 W | 1.580e+10 W | No action: keep as broad tidal validation anchor
moons | anchor | exploratory | Dedicated tidal validation / Enceladus | Surface heat flux | PASS | info | 0.0351 W/m2 | 0.0200 W/m2 | No action: keep as broad tidal validation anchor
moons | anchor | exploratory | Dedicated tidal validation / Titan | Tidal heating power | PASS | info | 1.779e+12 W | 3.500e+12 W | No action: keep as broad tidal validation anchor
moons | anchor | exploratory | Dedicated tidal validation / Titan | Surface heat flux | PASS | info | 0.0214 W/m2 | 0.0050 W/m2 | No action: keep as broad tidal validation anchor
moons | anchor | exploratory | Dedicated tidal validation / Moon | Tidal heating power | PASS | info | 2.379e+9 W | 3.000e+9 W | No action: keep as broad tidal validation anchor
moons | anchor | exploratory | Dedicated tidal validation / Moon | Orbital recession | PASS | info | 3.455 cm/yr | 3.830 cm/yr | No action: keep as broad tidal validation anchor
moons | anchor | exploratory | Dedicated tidal validation / Phobos | Orbital recession | PASS | info | -1.765 cm/yr | -1.800 cm/yr | Phase 2 implemented: keep as broad tidal small-body validation anchor
moons | anchor | exploratory | Dedicated tidal validation / Deimos | Orbital recession | PASS | info | 0.0016 cm/yr | 0.0060 cm/yr | No action: keep as broad tidal validation anchor
moons | anchor | exploratory | Dedicated tidal validation / Mimas | Surface heat flux | PASS | info | 0.0169 W/m2 | 0.0010 W/m2 | No action: keep as broad tidal validation anchor
orbital-dynamics | anchor | strict | Orbital and tidal dynamics / Venus-Earth | Mutual Hill separation | PASS | info | 26.35 R_H,m | 26.40 R_H,m | Keep as source-bounded calibration anchor for surfaced orbital architecture spacing.
orbital-dynamics | anchor | strict | Orbital and tidal dynamics / Jupiter-Saturn | Mutual Hill separation | PASS | info | 7.894 R_H,m | 7.890 R_H,m | Keep as source-bounded calibration anchor for surfaced orbital architecture spacing.
orbital-dynamics | anchor | strict | Orbital and tidal dynamics / Earth | Synchronous orbit distance | PASS | info | 42164 km | 42164 km | Keep as source-bounded calibration anchor for surfaced synchronous-orbit context.
orbital-dynamics | anchor | strict | Orbital and tidal dynamics / Mars | Synchronous orbit distance | PASS | info | 20399 km | 20400 km | Keep as source-bounded calibration anchor for surfaced synchronous-orbit context.
small-bodies-impacts | anchor | strict | Debris disks / Asteroid Belt | Midpoint | PASS | info | 2.670 AU | 2.665 AU | No action
small-bodies-impacts | anchor | strict | Debris disks / Asteroid Belt | Midpoint temperature | PASS | info | 170.9 K | 170.9 K | No action
small-bodies-impacts | anchor | strict | Debris disks / Asteroid Belt | Inner temperature | PASS | info | 194.4 K | 194.4 K | No action
small-bodies-impacts | anchor | strict | Debris disks / Asteroid Belt | Outer temperature | PASS | info | 154.3 K | 154.3 K | No action
small-bodies-impacts | anchor | strict | Debris disks / Asteroid Belt | Orbital period | PASS | info | 4.350 yr | 4.350 yr | No action
small-bodies-impacts | anchor | strict | Debris disks / Asteroid Belt | Frost-line relation | PASS | info | Inside | Inside | No action
small-bodies-impacts | anchor | strict | Debris disks / Asteroid Belt | Composition class | PASS | info | Mixed silicate-ice | Mixed silicate-ice | No action
small-bodies-impacts | anchor | strict | Debris disks / Asteroid Belt | Classification | PASS | info | Asteroid belt analog | Asteroid belt analog | No action
small-bodies-impacts | anchor | strict | Debris disks / Kuiper Belt | Midpoint | PASS | info | 43.60 AU | 43.60 AU | No action
small-bodies-impacts | anchor | strict | Debris disks / Kuiper Belt | Midpoint temperature | PASS | info | 42.30 K | 42.30 K | No action
small-bodies-impacts | anchor | strict | Debris disks / Kuiper Belt | Inner temperature | PASS | info | 44.40 K | 44.40 K | No action
small-bodies-impacts | anchor | strict | Debris disks / Kuiper Belt | Outer temperature | PASS | info | 40.40 K | 40.40 K | No action
small-bodies-impacts | anchor | strict | Debris disks / Kuiper Belt | Orbital period | PASS | info | 287.9 yr | 287.8 yr | No action
small-bodies-impacts | anchor | strict | Debris disks / Kuiper Belt | Frost-line relation | PASS | info | Outside | Outside | No action
small-bodies-impacts | anchor | strict | Debris disks / Kuiper Belt | Composition class | PASS | info | Ice-dominated | Ice-dominated | No action
small-bodies-impacts | anchor | strict | Debris disks / Kuiper Belt | Classification | PASS | info | Kuiper belt analog | Kuiper belt analog | No action
small-bodies-impacts | anchor | strict | Debris disks / Kuiper Belt | Dominant process | PASS | info | Collision-dominated | Collision-dominated | No action
stellar-environment | anchor | strict | Stellar environment / Sol | Luminosity fixture | PASS | info | 1.000 Lsol | 1.000 Lsol | No action
stellar-environment | anchor | strict | Stellar environment / Sol | Equatorial rotation | PASS | info | 23.59 days | 22.00 days to 26.00 days | No action
stellar-environment | anchor | strict | Stellar environment / Sol | Polar rotation | PASS | info | 33.03 days | 30.00 days to 37.00 days | No action
stellar-environment | anchor | calibrated | Stellar environment / Sol | Wind pressure at 1 AU | PASS | info | 0.9989 Earth ratio | 1.000 Earth ratio | No action
rocky-planets | anchor | calibrated | Environment coupling / Earth | Magnetopause | PASS | info | 9.930 Earth radii | 6.000 Earth radii to 12.00 Earth radii | No action
rocky-planets | anchor | calibrated | Environment coupling / Earth | Surface ocean coverage | PASS | info | 0.7060 fraction | 0.6800 fraction to 0.7400 fraction | Phase 5 implemented: keep Earth ocean coverage as active calibrated row
rocky-planets | anchor | calibrated | Environment coupling / Mars | Ancient water timeline cue | PASS | info | true | true | No action
rocky-planets | anchor | calibrated | Environment coupling / Jupiter | Variable magnetosphere range | PASS | info | 31.60 Jupiter radii | 20.00 Jupiter radii to 120.0 Jupiter radii | No action
rocky-planets | anchor | calibrated | Environment coupling / Europa | Subsurface ocean timeline cue | PASS | info | true | true | No action
rocky-planets | anchor | calibrated | Environment coupling / Europa | Sputtered oxygen exosphere class | PASS | info | Europa-like | Europa-like | Phase 5 implemented: keep Europa exosphere as active calibration row
rocky-planets | anchor | calibrated | Environment coupling / Europa | Sputtered oxygen O2 production | PASS | info | 11.60 kg/s | 6.000 kg/s to 18.00 kg/s | Phase 5 implemented: keep Europa O2 production as broad range anchor
stellar-environment | source-coverage | n/a | Stellar Environment | Registry source and limitation coverage | PASS | low | Registry metadata present | Source summary, assumptions, valid range, and limitations | Keep source registry entries current as science changes.
stellar-lifecycle | source-coverage | n/a | Stellar Lifecycle | Registry source and limitation coverage | PASS | low | Registry metadata present | Source summary, assumptions, valid range, and limitations | Keep source registry entries current as science changes.
rocky-planets | source-coverage | n/a | Rocky Planets | Registry source and limitation coverage | PASS | low | Registry metadata present | Source summary, assumptions, valid range, and limitations | Keep source registry entries current as science changes.
hydrosphere-ocean | source-coverage | n/a | Hydrosphere And Ocean Chemistry | Registry source and limitation coverage | PASS | low | Registry metadata present | Source summary, assumptions, valid range, and limitations | Keep source registry entries current as science changes.
atmosphere-climate | source-coverage | n/a | Atmosphere And Climate Coupling | Registry source and limitation coverage | PASS | low | Registry metadata present | Source summary, assumptions, valid range, and limitations | Keep source registry entries current as science changes.
moons | source-coverage | n/a | Moons And Tidal Worlds | Registry source and limitation coverage | PASS | low | Registry metadata present | Source summary, assumptions, valid range, and limitations | Keep source registry entries current as science changes.
gas-giants | source-coverage | n/a | Gas Giants And Rings | Registry source and limitation coverage | PASS | low | Registry metadata present | Source summary, assumptions, valid range, and limitations | Keep source registry entries current as science changes.
orbital-dynamics | source-coverage | n/a | Orbital Dynamics And Architecture | Registry source and limitation coverage | PASS | low | Registry metadata present | Source summary, assumptions, valid range, and limitations | Keep source registry entries current as science changes.
small-bodies-impacts | source-coverage | n/a | Small Bodies And Impacts | Registry source and limitation coverage | PASS | low | Registry metadata present | Source summary, assumptions, valid range, and limitations | Keep source registry entries current as science changes.
habitability-biosignatures | source-coverage | n/a | Habitability, Productivity, And Biosignatures | Registry source and limitation coverage | PASS | low | Registry metadata present | Source summary, assumptions, valid range, and limitations | Keep source registry entries current as science changes.
observability-user-facing | source-coverage | n/a | Observability And User-Facing Science | Registry source and limitation coverage | PASS | low | Registry metadata present | Source summary, assumptions, valid range, and limitations | Keep source registry entries current as science changes.
context-surfaceoceancoverage | source-coverage | n/a | Surface ocean coverage and hypsometry context | Registry source and limitation coverage | PASS | low | Registry metadata present | Source summary, assumptions, valid range, and limitations | Keep source registry entries current as science changes.
context-systemfate | source-coverage | n/a | System fate aggregate timeline | Registry source and limitation coverage | PASS | low | Registry metadata present | Source summary, assumptions, valid range, and limitations | Keep source registry entries current as science changes.
context-stellarneighbourhoodhazards | source-coverage | n/a | Stellar neighbourhood hazard model | Registry source and limitation coverage | PASS | low | Registry metadata present | Source summary, assumptions, valid range, and limitations | Keep source registry entries current as science changes.
context-moonsolidbodystructure | source-coverage | n/a | Moon solid-body structure and response context | Registry source and limitation coverage | PASS | low | Registry metadata present | Source summary, assumptions, valid range, and limitations | Keep source registry entries current as science changes.
context-icymoonexosphere | source-coverage | n/a | Icy moon sputtered oxygen exosphere | Registry source and limitation coverage | PASS | low | Registry metadata present | Source summary, assumptions, valid range, and limitations | Keep source registry entries current as science changes.
context-radiusvalleyboundary | source-coverage | n/a | Radius-valley boundary context | Registry source and limitation coverage | PASS | low | Registry metadata present | Source summary, assumptions, valid range, and limitations | Keep source registry entries current as science changes.
context-hostframe-stability | source-coverage | n/a | Host-frame stability | Registry source and limitation coverage | PASS | low | Registry metadata present | Source summary, assumptions, valid range, and limitations | Keep source registry entries current as science changes.
context-hostframe-orbitalarchitecture | source-coverage | n/a | Selected-frame orbital architecture | Registry source and limitation coverage | PASS | low | Registry metadata present | Source summary, assumptions, valid range, and limitations | Keep source registry entries current as science changes.
context-orbitalarchitecture-mutualhillspacing | source-coverage | n/a | Mutual Hill spacing | Registry source and limitation coverage | PASS | low | Registry metadata present | Source summary, assumptions, valid range, and limitations | Keep source registry entries current as science changes.
context-orbitalarchitecture-eccentricityoverlap | source-coverage | n/a | Eccentricity overlap | Registry source and limitation coverage | PASS | low | Registry metadata present | Source summary, assumptions, valid range, and limitations | Keep source registry entries current as science changes.
context-moon-synchronousorbit | source-coverage | n/a | Parent synchronous orbit | Registry source and limitation coverage | PASS | low | Registry metadata present | Source summary, assumptions, valid range, and limitations | Keep source registry entries current as science changes.
context-moon-migrationdirection | source-coverage | n/a | Moon migration direction | Registry source and limitation coverage | PASS | low | Registry metadata present | Source summary, assumptions, valid range, and limitations | Keep source registry entries current as science changes.
context-moon-eccentricitypersistence | source-coverage | n/a | Eccentricity persistence | Registry source and limitation coverage | PASS | low | Registry metadata present | Source summary, assumptions, valid range, and limitations | Keep source registry entries current as science changes.
context-moon-sustainedtidalheating | source-coverage | n/a | Sustained tidal heating | Registry source and limitation coverage | PASS | low | Registry metadata present | Source summary, assumptions, valid range, and limitations | Keep source registry entries current as science changes.
context-moonsystem-torquebudget | source-coverage | n/a | Moon-system torque budget | Registry source and limitation coverage | PASS | low | Registry metadata present | Source summary, assumptions, valid range, and limitations | Keep source registry entries current as science changes.
context-parent-ringcontext | source-coverage | n/a | Parent ring context | Registry source and limitation coverage | PASS | low | Registry metadata present | Source summary, assumptions, valid range, and limitations | Keep source registry entries current as science changes.
context-parent-radiationcontext | source-coverage | n/a | Parent radiation and plasma context | Registry source and limitation coverage | PASS | low | Registry metadata present | Source summary, assumptions, valid range, and limitations | Keep source registry entries current as science changes.
context-generation-guidance | source-coverage | n/a | Generation and repair guidance | Registry source and limitation coverage | PASS | low | Registry metadata present | Source summary, assumptions, valid range, and limitations | Keep source registry entries current as science changes.
context-habitability-persistencebridge | source-coverage | n/a | Habitability persistence bridge | Registry source and limitation coverage | PASS | low | Registry metadata present | Source summary, assumptions, valid range, and limitations | Keep source registry entries current as science changes.
context-timeline-dynamicalevents | source-coverage | n/a | Dynamical timeline events | Registry source and limitation coverage | PASS | low | Registry metadata present | Source summary, assumptions, valid range, and limitations | Keep source registry entries current as science changes.
rocky-planets | invariant | n/a | Earth fixture | Mass-radius-density consistency | PASS | low | 5.4783 g/cm3 | 5.4823 g/cm3 from M/R^3 | Investigate density/radius bookkeeping if this fails.
atmosphere-climate | invariant | n/a | Earth fixture | Partial pressure sum bounded by total pressure | PASS | low | 1 atm | 1 atm | No action required.
hydrosphere-ocean | invariant | n/a | Earth hydrosphere | Surface fractions normalize | PASS | low | 1 | 1.0 | No action required.
hydrosphere-ocean | invariant | n/a | Mars thin atmosphere | Triple-point liquid water guard | PASS | low | pressure=0.006 atm; accessible=0 | No stable accessible surface liquid | No action required.
moons | invariant | n/a | Europa orbit | Roche, collision, current orbit, and stable zone ordering | PASS | low | inner=74379 km; orbit=671100 km; outer=17382213 km | inner < orbit < outer | No action required.
gas-giants | invariant | n/a | Jupiter fixture | Positive finite giant properties | PASS | low | density=1.3261 g/cm3; field=13.82 Earth | Finite positive density and magnetic context | No action required.
habitability-biosignatures | invariant | n/a | Earth-like timeline | No life claim guard | PASS | low | No claim | No explicit life-exists claim | No action required.
rocky-planets | empirical-validation | calibrated | Core evolution / Earth | Central inner-core radius fraction | PASS | low | 0.36 | 0.30-0.40 of total core radius | Review the Earth growth calibration before changing central core constants.
rocky-planets | empirical-validation | calibrated | Core evolution / Earth | NASA inner-core radius and liquid-shell thickness | PASS | low | 1309 km inner; 2330 km liquid shell | 1,221 km inner radius; approximately 2,250 km liquid shell | Keep both Earth geometry projections inside their direct NASA tolerances.
rocky-planets | empirical-validation | calibrated | Core evolution / Earth | PREM inner-core radius lies inside model range | PASS | low | 741-1778 km | 1221 km contained | Keep the PREM radius within the Earth-anchored uncertainty envelope.
rocky-planets | empirical-validation | calibrated | Core evolution / Mars | Total metallic-core radius | PASS | low | 1653 km | 1500-2100 km | Keep the solved Mars total-core radius inside the NASA interval.
rocky-planets | empirical-validation | exploratory | Core evolution / Mercury | Metallic-core radius and broad inner-core containment | PASS | low | 2043 km core; inner range 0-1827 km | 2,074 km core; approximately 1,000 km inner-core radius contained | Preserve Mercury's direct total-core scale without claiming a precise inner radius.
rocky-planets | empirical-validation | exploratory | Core evolution / Mars | Liquid outer core and broad 600 km inner-core consistency | PASS | low | mostly-solid; liquid=true; range 204-1653 km | Liquid outer core; approximately 600 km contained by broad range | Do not equate Mars's absent global field with a fully frozen core.
rocky-planets | empirical-validation | exploratory | Core evolution / Mercury | Liquid outer core remains compatible with weak global field | PASS | low | liquid=true; field=0.0092 Earth | Liquid outer core, weak active dipole (0.003-0.03 Earth), and compact 1-2 RM magnetopause | Preserve Mercury's liquid-core/weak-field separation and broad confidence.
rocky-planets | cross-system | n/a | Core evolution downstream ownership | Core, magnetism, and interior projections remain identical | PASS | low | Four shared-context parity checks | One versioned core state and support result per solve | Prevent downstream consumers from re-solving or contradicting core evolution.
rocky-planets | invariant | n/a | Core evolution geometry | Solid volume fraction is the cube of radius fraction | PASS | low | 0.046503 vs 0.046503 | V_ic/V_core = (r_ic/r_core)^3 | Fix radius/volume projection if the cubic identity drifts.
rocky-planets | invariant | n/a | Core phase and magnetic activity | Absent dynamo does not imply a solid core | PASS | low | dynamo=false; liquid=true; state=mostly-solid | No dynamo while liquid outer core remains | Keep material state, convective support, rotation, and field activity separate.
orbital-dynamics | unit | n/a | Astronomical unit | AU to kilometers | PASS | low | 149597870.7 | 149597870.7 | Fix unit constants or conversion helpers if this fails.
rocky-planets | unit | n/a | Earth mass/radius | Earth mean density from constants | PASS | low | 5.5133 | 5.51 | Fix unit constants or conversion helpers if this fails.
atmosphere-climate | unit | n/a | Atmospheric pressure | atm to Pa | PASS | low | 101325 | 101325 | Fix unit constants or conversion helpers if this fails.
moons | unit | n/a | Orbital migration | cm/yr to m/s conversion sanity | PASS | low | 3.17e-10 | 3.1688e-10 m/s for 1 cm/yr | Fix unit constants or conversion helpers if this fails.
stellar-environment | unit | n/a | Solar luminosity | Solar flux at 1 AU | PASS | low | 1361.17 W/m2 | about 1361 W/m2 | Fix unit constants or conversion helpers if this fails.
orbital-dynamics | oracle | n/a | Earth orbit | Independent Kepler period | PASS | low | 1 yr | 1 yr | No action required.
atmosphere-climate | oracle | n/a | Earth absorbed flux | Independent inverse-square absorbed flux | PASS | low | 236.133 W/m2 | 236.162 W/m2 | No action required.
moons | oracle | n/a | Earth synchronous orbit | Independent synchronous radius | PASS | low | 42163 km | about 42164 km | No action required.
stellar-lifecycle | stellar-lifecycle | n/a | Solar analog | Present Sun remains main sequence | PASS | low | Main sequence | Main sequence | Review lifecycle stage windows, remnant screens, and HZ sampling if this fails.
stellar-lifecycle | stellar-lifecycle | n/a | Solar analog future | Post-MS state brightens and expands | PASS | low | Main sequence: L=0.964, R=0.991; Subgiant branch: L=5.511, R=5.197 | Subgiant luminosity and radius exceed current solar values | Review lifecycle stage windows, remnant screens, and HZ sampling if this fails.
stellar-lifecycle | stellar-lifecycle | n/a | Mass-lifetime ordering | Higher-mass stars leave MS sooner | PASS | low | 75.741 -> 1.115 Gyr | decrease with mass | Review lifecycle stage windows, remnant screens, and HZ sampling if this fails.
stellar-lifecycle | stellar-lifecycle | n/a | Lifecycle HZ track | Solar HZ migrates outward before remnant cooling | PASS | low | 0.023 - 31.917 AU | inner edge expands beyond present-day Earth orbit | Review lifecycle stage windows, remnant screens, and HZ sampling if this fails.
stellar-lifecycle | stellar-lifecycle | n/a | Planet HZ interval | Earth-like orbit has a current conservative HZ interval | PASS | low | conservative; longest=6.02 Gyr | current conservative HZ with multi-Gyr continuous interval | Review lifecycle stage windows, remnant screens, and HZ sampling if this fails.
stellar-lifecycle | stellar-lifecycle | n/a | Planet HZ hazard | Close solar orbit is flagged for engulfment | PASS | low | engulfed=true; age=12.355 Gyr; late=true | engulfment and late-habitability caveats | Review lifecycle stage windows, remnant screens, and HZ sampling if this fails.
stellar-lifecycle | stellar-lifecycle | n/a | Fixture benchmark matrix | Representative masses and metallicities stay in broad ranges | PASS | low | 9 masses x 3 metallicities | stage order, lifetime, and remnant ranges all pass | Review lifecycle stage windows, remnant screens, and HZ sampling if this fails.
stellar-lifecycle | stellar-lifecycle | n/a | Massive-star endpoint | Core-collapse endpoint is compact remnant | PASS | low | Neutron star remnant; Neutron star | neutron star or black hole endpoint | Review lifecycle stage windows, remnant screens, and HZ sampling if this fails.
stellar-environment | empirical-validation | calibrated | Spectral Morphology | Pickles template validation rows within one subtype | PASS | low | exact=35/39; within1=39/39; unsupported=0 | All supported validation rows within one subtype; no unsupported ordinary dwarfs | Review morphology provider, grid coverage, and coefficient audit if this gate regresses.
stellar-environment | empirical-validation | calibrated | Spectral Morphology | Validation provider and confidence coverage | PASS | low | providers: bosz2024-reduced-line-index-grid-v1=25, line-index-approx-v1=14; confidence: high=26, medium=13 | Provider and confidence distribution recorded for release review | Review provider/fallback shifts when spectral grid or coefficient versions change.
atmosphere-climate | metamorphic | n/a | Orbit distance | Moving outward lowers absorbed flux | PASS | low | 236.13 -> 163.98 W/m2 | decrease | Investigate sign, unit, or coupling regression if this trend fails.
stellar-environment | metamorphic | n/a | Stellar luminosity | Increasing luminosity raises surface temperature | PASS | low | 282 -> 296 K | increase | Investigate sign, unit, or coupling regression if this trend fails.
atmosphere-climate | metamorphic | n/a | Albedo | Increasing albedo lowers absorbed flux | PASS | low | 236.13 -> 170.13 W/m2 | decrease | Investigate sign, unit, or coupling regression if this trend fails.
hydrosphere-ocean | metamorphic | n/a | Water inventory | Increasing WMF does not reduce water coverage before phase transitions | PASS | low | 0.046 -> 0.995 | nondecrease | Investigate sign, unit, or coupling regression if this trend fails.
rocky-planets | metamorphic | n/a | Stellar XUV | Increasing XUV does not reduce atmosphere-loss stress | PASS | low | 0.5 -> 5 | increase | Investigate sign, unit, or coupling regression if this trend fails.
moons | metamorphic | n/a | Moon eccentricity | Increasing eccentricity raises tidal heating | PASS | low | 0.41812 -> 42.194015 W/m2 | increase | Investigate sign, unit, or coupling regression if this trend fails.
hydrosphere-ocean | boundary | n/a | Dry planet | Dry boundary | PASS | low | Dry | Dry | Review threshold logic and user-facing caveats if this boundary fails.
hydrosphere-ocean | boundary | n/a | Snowball planet | Snowball transfers liquid to ice | PASS | low | ice=0.874; liquid=0 | ice present and accessible liquid limited | Review threshold logic and user-facing caveats if this boundary fails.
hydrosphere-ocean | boundary | n/a | Deep waterworld | High-pressure ice boundary is surfaced | PASS | low | ice-vii | caution/plausible/likely or stable phase diagnostic | Review threshold logic and user-facing caveats if this boundary fails.
atmosphere-climate | boundary | n/a | Mars pressure | Thin atmosphere remains thin/transient | PASS | low | declining-transient | declining-transient | Review threshold logic and user-facing caveats if this boundary fails.
moons | boundary | n/a | Luna | Airless/exosphere boundary | PASS | low | Airless | Airless | Review threshold logic and user-facing caveats if this boundary fails.
moons | boundary | n/a | Europa | Subsurface ocean boundary | PASS | low | Ice shell over subsurface ocean | Ice shell over subsurface ocean | Review threshold logic and user-facing caveats if this boundary fails.
hydrosphere-ocean | cross-system | n/a | Hydrosphere to habitability | Surface water feeds PHI solvent pathway | PASS | low | surface-water | surface-water | Route downstream output through the shared upstream context if this fails.
atmosphere-climate | cross-system | n/a | Atmosphere ledger to climate | Venus dense atmosphere remains hot in coupled climate context | PASS | low | stable-retained; 736.4 K | stable-retained and hot | Route downstream output through the shared upstream context if this fails.
moons | cross-system | n/a | Tides to moon hydrosphere | Europa tide/interior context feeds subsurface ocean timeline | PASS | low | true | true | Route downstream output through the shared upstream context if this fails.
moons | cross-system | n/a | Parent magnetosphere to moon radiation | Europa inside parent magnetosphere feeds radiation hazard | PASS | low | true; Surface-sterilizing | inside magnetosphere with surface hazard | Route downstream output through the shared upstream context if this fails.
orbital-dynamics | cross-system | n/a | System architecture | Adjacent-pair mutual Hill diagnostics exist | PASS | low | 2 adjacent pairs | at least two pairs | Route downstream output through the shared upstream context if this fails.
rocky-planets | sensitivity | n/a | Mass perturbation | 1% mass perturbation keeps bulk outputs finite | PASS | low | gravity 0.9962 -> 1.001 | finite and modest | Review divide-by-near-zero and threshold logic if this fails.
atmosphere-climate | sensitivity | n/a | Orbit perturbation | 1% orbit perturbation avoids unrelated temperature cliff | PASS | low | surface 282 -> 281 K | less than 10 K shift | Review divide-by-near-zero and threshold logic if this fails.
atmosphere-climate | sensitivity | n/a | Pressure perturbation | 1% pressure perturbation keeps atmosphere contexts finite | PASS | low | density 1.24959 -> 1.262086 | finite output | Review divide-by-near-zero and threshold logic if this fails.
observability-user-facing | population | n/a | Science calibration fixture set | Fixture builders remain finite | PASS | low | 5 solved planet fixtures | Finite core outputs | Fix fixture migrations or engine defaults if this fails.
habitability-biosignatures | population | n/a | Hostile calibration fixtures | Hostile worlds do not bypass habitability guardrails | PASS | low | Guardrails hold | No obvious hostile world with high habitability index | Review habitability penalties if this fails.
moons | population | n/a | Moon calibration fixture availability | Europa-like and Titan-like worlds exist for downstream suites | PASS | low | Europa-like calibration; Titan-like calibration | Moon fixture worlds present | Keep moon fixtures updated when moon schema changes.
observability-user-facing | browser | n/a | Validation page | Browser regression suite coverage | INFO | info | Covered by npm run test:browser during release verification | Validation page loads matrix artifact and filters rows | Run browser tests before release; investigate any Validation page failure.
observability-user-facing | release-gate | n/a | science:verify | Release verification command | PASS | info | Recorded at 2026-07-15T19:25:33.880Z | PASS before release | No action required.
observability-user-facing | release-gate | n/a | check | Release verification command | INFO | info | Run during full release verification | PASS before release | Run this gate before tagging or publishing a release.
observability-user-facing | release-gate | n/a | build | Release verification command | INFO | info | Run during full release verification | PASS before release | Run this gate before tagging or publishing a release.
observability-user-facing | release-gate | n/a | bundle | Release verification command | INFO | info | Run during full release verification | PASS before release | Run this gate before tagging or publishing a release.
observability-user-facing | release-gate | n/a | browser | Release verification command | INFO | info | Run during full release verification | PASS before release | Run this gate before tagging or publishing a release.

