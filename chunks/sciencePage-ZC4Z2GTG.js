import{a as fe,b as ge,c as ee}from"./chunk-ADFJEJXT.js";import{b as ue,d as me,e as he}from"./chunk-ME2DCGO3.js";import{a as pe}from"./chunk-4UJIQIOS.js";import{d as de}from"./chunk-PECJ5KLU.js";import{d as ce}from"./chunk-WXXZZXYD.js";import"./chunk-YZYZEETI.js";import{a as O}from"./chunk-EHRPTLYW.js";import{a as oe}from"./chunk-EZA3XW5K.js";import{b as J,c as Y}from"./chunk-TR2TDQN3.js";import{a as L,b as V}from"./chunk-LHEZNGZ5.js";import{O as ne,P as le,R as X}from"./chunk-JVKPTJKR.js";import"./chunk-Q3EXAOWE.js";import"./chunk-ASLSWSPR.js";import"./chunk-MTXM7GCO.js";import{A as m}from"./chunk-JAT3QFT3.js";import"./chunk-6DA3R6ZF.js";import"./chunk-RC2KHOII.js";import"./chunk-FFUDGKDT.js";function j(i,r){return i&&(i.textContent=r==null?"":String(r),i)}function be(i,{countLabel:r="32",countValue:n="",alphaValue:p=""}={}){return i&&(Y(i,["N",J("sub",{text:r}),` = ${n} \u2014 \u03B1 = ${p}`]),i)}function U(i,r=[],n=""){if(!i)return i;let p=(r||[]).filter(Boolean);if(!p.length)return i.textContent=n==null?"":String(n),i;let l=[];return p.forEach((u,f)=>{f>0&&l.push(J("br")),l.push(J("strong",{text:u?.fraction||""}),` \u2014 ${u?.description||""}`)}),Y(i,l),i}function t(i){return`<span class="sci-math sci-math--block">${i}</span>`}function e(i){return`<span class="sci-math">${i}</span>`}function o(i){return`<table class="sci-vars"><tbody>${i.map(([r,n])=>`<tr><td>${e(r)}</td><td>${n}</td></tr>`).join("")}</tbody></table>`}function s(i){return`<p class="sci-cite">${i}</p>`}function a(i,r){return`<div class="sci-formula"><h3 class="sci-formula__name">${i}</h3>${r}</div>`}var $e=Object.freeze({stellar:[{label:"Star",href:"#/star"}],evolution:[{label:"Star",href:"#/star"}],activity:[{label:"Star",href:"#/star"}],planetary:[{label:"Planet",href:"#/planet"},{label:"Climate",href:"#/climate"}],interior:[{label:"Planet",href:"#/planet"}],tectonics:[{label:"Planet",href:"#/planet"},{label:"Tectonics",href:"#/tectonics"}],atmosphere:[{label:"Planet",href:"#/planet"},{label:"Climate",href:"#/climate"}],climate:[{label:"Climate",href:"#/climate"},{label:"Planet",href:"#/planet"}],gasgiant:[{label:"Planet",href:"#/planet"},{label:"Moon",href:"#/moon"}],orbital:[{label:"Moon",href:"#/moon"},{label:"System",href:"#/system"}],calendar:[{label:"Calendar",href:"#/calendar"}],system:[{label:"System",href:"#/system"},{label:"Star",href:"#/star"}],divergences:[{label:"Validation",href:"#/validation"}]});function Me(i){let r=$e[i]||[];return r.length?`<nav class="sci-related-pages" aria-label="Related app pages">
    <span>Related app pages</span>
    ${r.map(n=>`<a class="sci-related-pages__link" href="${n.href}">${n.label}</a>`).join("")}
  </nav>`:""}function c(i,r){return`<table class="sci-data"><thead><tr>${i.map(n=>`<th>${n}</th>`).join("")}</tr></thead><tbody>${r.map(n=>`<tr>${n.map(p=>`<td>${p}</td>`).join("")}</tr>`).join("")}</tbody></table>`}var Z=Object.freeze({tempMinK:240,tempMaxK:715,pressureMinGPa:.05,pressureMaxGPa:10,left:104,right:664,top:44,bottom:300});function _e(i,r,n){return Math.min(n,Math.max(r,i))}function W(i){let{tempMinK:r,tempMaxK:n,left:p,right:l}=Z,u=(Number(i)-r)/(n-r);return p+_e(u,0,1)*(l-p)}function z(i){let{pressureMinGPa:r,pressureMaxGPa:n,top:p,bottom:l}=Z,u=Math.log10(r),f=Math.log10(n),v=(Math.log10(Math.max(Number(i),r))-u)/(f-u);return l-_e(v,0,1)*(l-p)}function Se(i,r){return`${m(i,1)},${m(r,1)}`}function qe(i,r,n=3){let p=[];for(let u=i;u<=r;u+=n){let f=V(u);!f.validRange||!Number.isFinite(f.pressurePa)||p.push({tempK:u,pressureGPa:f.pressurePa/1e9,x:W(u),y:z(f.pressurePa/1e9)})}let l=V(r);return l.validRange&&Number.isFinite(l.pressurePa)&&p.push({tempK:r,pressureGPa:l.pressurePa/1e9,x:W(r),y:z(l.pressurePa/1e9)}),p}function Ce(i){return i.length?`M ${i.map(r=>Se(r.x,r.y)).join(" L ")}`:""}function Te(){let i=[250,300,350,400,500,600,700],r=[.1,.3,.6,1,2.2,5,10],{left:n,right:p,top:l,bottom:u}=Z;return[...i.map(f=>{let v=W(f);return`<g class="sci-phase-gridline"><line x1="${m(v,1)}" y1="${l}" x2="${m(v,1)}" y2="${u}" /><text x="${m(v,1)}" y="${u+24}">${f} K</text></g>`}),...r.map(f=>{let v=z(f);return`<g class="sci-phase-gridline"><line x1="${n}" y1="${m(v,1)}" x2="${p}" y2="${m(v,1)}" /><text class="sci-phase-y-tick" x="${n-14}" y="${m(v+4,1)}">${f>=1?m(f,1):m(f,1)} GPa</text></g>`})].join("")}function ke(){return[{tempK:288,pressureGPa:.52,label:"0.52 GPa / 288 K",note:"below liquidus",className:"liquid",dx:10,dy:-12},{tempK:288,pressureGPa:1.2,label:"1.2 GPa / 288 K",note:"ice VI stable",className:"ice",dx:10,dy:-12},{tempK:500,pressureGPa:2.3,label:"2.3 GPa / 500 K",note:"hot deep liquid",className:"warm",dx:10,dy:18}].map(r=>{let n=W(r.tempK),p=z(r.pressureGPa);return`<g class="sci-phase-marker sci-phase-marker--${r.className}" transform="translate(${m(n,1)} ${m(p,1)})">
        <circle r="5" />
        <text x="${r.dx}" y="${r.dy}">${r.label}</text>
        <text x="${r.dx}" y="${r.dy+14}" class="sci-phase-marker__note">${r.note}</text>
      </g>`}).join("")}function Pe(){let{left:i,right:r,top:n,bottom:p}=Z,l=r-i,u=p-n,f=i+l/2,v=n+u/2,S=qe(L.iceIhIceIiiLiquid.tempK,715),M=Ce(S),P=S[0],R=S[S.length-1],C=P&&R?`${M} L ${r},${n} L ${i},${n} Z`:"",A=[{label:"III",tempK:L.iceIhIceIiiLiquid.tempK,pressureGPa:L.iceIhIceIiiLiquid.pressurePa/1e9},{label:"V",tempK:L.iceIiiIceVLiquid.tempK,pressureGPa:L.iceIiiIceVLiquid.pressurePa/1e9},{label:"VI",tempK:L.iceVIceViLiquid.tempK,pressureGPa:L.iceVIceViLiquid.pressurePa/1e9},{label:"VII",tempK:L.iceViIceViiLiquid.tempK,pressureGPa:L.iceViIceViiLiquid.pressurePa/1e9}].map(G=>{let H=W(G.tempK),I=z(G.pressureGPa);return`<g class="sci-phase-triple">
        <circle cx="${m(H,1)}" cy="${m(I,1)}" r="4" />
        <text x="${m(H+7,1)}" y="${m(I-7,1)}">ice ${G.label}</text>
      </g>`}).join("");return`<div class="sci-phase-diagram-wrap">
    <svg class="sci-phase-diagram" viewBox="0 0 700 360" role="img" aria-label="Caelum ocean-floor water phase diagram">
      <rect x="${i}" y="${n}" width="${l}" height="${u}" class="sci-phase-liquid" />
      <path d="${C}" class="sci-phase-ice" />
      <rect x="${i}" y="${n}" width="${m(W(251.165)-i,1)}" height="${u}" class="sci-phase-unsupported" />
      ${Te()}
      <path d="${M}" class="sci-phase-liquidus" />
      ${A}
      ${ke()}
      <text x="${m(f,1)}" y="${n-16}" class="sci-phase-axis sci-phase-axis--top">Estimated bottom-ocean temperature</text>
      <text x="28" y="${m(v,1)}" class="sci-phase-axis sci-phase-axis--left" transform="rotate(-90 28 ${m(v,1)})">Seafloor pressure</text>
      <text x="${i+28}" y="${n+38}" class="sci-phase-region sci-phase-region--ice">Dense ice stable above boundary</text>
      <text x="${r-220}" y="${p-30}" class="sci-phase-region sci-phase-region--liquid">Liquid remains stable below boundary</text>
    </svg>
    <div class="sci-phase-legend" aria-label="Diagram legend">
      <span><i class="sci-phase-swatch sci-phase-swatch--liquid"></i>Liquid estimate</span>
      <span><i class="sci-phase-swatch sci-phase-swatch--ice"></i>Dense ice stable</span>
      <span><i class="sci-phase-swatch sci-phase-swatch--curve"></i>IAPWS liquidus used by Caelum</span>
    </div>
  </div>`}function D(i){return String(i??"").trim().toLowerCase()}function Re(i,r){if(!r)return 0;let n=D(i.title);if(n===r)return 120;if(n.startsWith(r))return 90;if(n.includes(r))return 70;let p=D(i.sectionTitle);return p===r?52:p.includes(r)?40:D(i.text).includes(r)?18:0}function Ae(i){return Array.from(i.querySelectorAll(".sci-section")).flatMap(r=>{let n=String(r.id||"").trim(),p=r.querySelector(".sci-section__title")?.textContent?.trim()||"Science Section";return Array.from(r.querySelectorAll(".sci-formula")).map((l,u)=>{let f=`${n}-formula-${u+1}`;return l.id=f,l.setAttribute("tabindex","-1"),{id:f,sectionId:n,sectionTitle:p,title:l.querySelector(".sci-formula__name")?.textContent?.trim()||"Formula",text:l.textContent||""}})})}function ye(i,r,n=8){let p=D(r);return p?i.map(l=>({entry:l,score:Re(l,p)})).filter(l=>l.score>0).sort((l,u)=>u.score-l.score||l.entry.sectionTitle.localeCompare(u.entry.sectionTitle)||l.entry.title.localeCompare(u.entry.title)).slice(0,n).map(l=>l.entry):[]}function He(){return[a("Mass-Luminosity Relation",`<div class="sci-formula__eq">${t("L = c \\cdot M^{\\alpha}")}</div>
      <p>Six-piece empirical power law relating stellar mass to luminosity, fitted to 509 eclipsing binary components.</p>
      ${c(["Mass range (M&#9737;)","\\(\\alpha\\)","c"],[["M &lt; 0.45","2.028","0.0892"],["0.45 &le; M &lt; 0.72","4.572","0.68"],["0.72 &le; M &lt; 1.05","5.743","1.0"],["1.05 &le; M &lt; 2.4","4.329","1.072"],["2.4 &le; M &lt; 7.0","3.967","1.471"],["M &ge; 7.0","2.865","12.55"]])}
      ${s("Eker et al. (2018) MNRAS 479, 5491 &mdash; Table 4")}
      <div class="sci-try">
        <div class="sci-try__title">Try it</div>
        <div class="sci-try__row">
          <label>Mass <span class="unit">M&#9737;</span></label>
          <input id="sci-mlr-mass" type="number" value="1" min="0.075" max="100" step="0.01" />
          <input id="sci-mlr-slider" type="range" />
        </div>
        <div class="sci-try__output">
          <span class="sci-try__label">Luminosity</span>
          <span class="sci-try__value" id="sci-mlr-result">1.000 L&#9737;</span>
        </div>
      </div>`),a("Mass-Radius Relation",`<div class="sci-formula__eq">${t("R = \\begin{cases} 0.0282 + 0.935\\,M & M \\le 0.5 \\\\ \\text{blend}(\\text{Schweitzer},\\,\\text{Eker quad}) & 0.5 < M \\le 0.7 \\\\ (0.438M^2 + 0.479M + 0.075) \\times \\text{norm} & 0.7 < M \\le 1.5 \\\\ \\sqrt{L}\\,(5776/T_{\\text{eff}})^2 \\times \\text{norm}_{\\text{SB}} & M > 1.5 \\end{cases}")}</div>
      <p>M dwarfs (M &le; 0.5): Schweitzer et al. (2019) linear relation from 55 eclipsing binaries, blended smoothly into the Eker quadratic over 0.5&ndash;0.7 M&#9737;. Mid-mass (0.7&ndash;1.5): Eker quadratic, normalised so R(1.0) = 1.0 R&#9737;. High-mass (M &gt; 1.5): Stefan-Boltzmann derivation from Eker MLR + MTR.</p>
      ${o([["R","Stellar radius (R&#9737;)"],["M","Stellar mass (M&#9737;)"],["L","Luminosity from MLR (L&#9737;)"],["T_{\\text{eff}}","Temperature from MTR (K)"],["\\text{norm}","1 / 0.992 (solar normalisation)"],["\\text{norm}_{\\text{SB}}","Continuity factor at 1.5 M&#9737;"]])}
      ${s("Schweitzer et al. (2019, A&amp;A 625, A68); Eker et al. (2018, MNRAS 479, 5491)")}`),a("Mass-Temperature Relation (Eker MTR)",`<div class="sci-formula__eq">${t("\\log T_{\\text{eff}} = -0.170\\,(\\log M)^2 + 0.888\\,\\log M + 3.671")}</div>
      <p>Empirical mass-temperature relation for M &gt; 1.5 M&#9737; from Eker et al. (2018, Table 5). Used with the MLR and Stefan-Boltzmann law to derive radius for high-mass stars where the quadratic MRR is not calibrated.</p>
      ${o([["T_{\\text{eff}}","Effective temperature (K)"],["M","Stellar mass (M&#9737;)"]])}
      ${s("Eker et al. (2018, MNRAS 479, 5491)")}`),a("Effective Temperature (Stefan-Boltzmann)",`<div class="sci-formula__eq">${t("T_{\\text{eff}} = \\left(\\frac{L}{R^2}\\right)^{1/4} \\times 5776 \\text{ K}")}</div>
      <p>Solar-normalised form of the Stefan-Boltzmann law ${e("L = 4\\pi R^2 \\sigma T^4")}. Reference temperature 5776 K is the solar effective temperature.</p>
      ${o([["L","Luminosity (L&#9737;)"],["R","Radius (R&#9737;)"]])}`),a("Maximum Stellar Age",`<div class="sci-formula__eq">${t("\\tau_{\\max} = \\frac{M}{L} \\times 10 \\text{ Gyr}")}</div>
      <p>Main-sequence lifetime: fuel supply (mass) divided by burn rate (luminosity). Equivalent to the classic ${e("10 / M^{2.5}")} for ideal MS stars.</p>`),a("Habitable Zone (S<sub>eff</sub> Polynomials)",`<div class="sci-formula__eq">${t("d = \\sqrt{\\frac{L}{S_{\\text{eff}}}}")}</div>
      <p>Inner and outer boundaries computed from 4th-order flux polynomials in ${e("\\Delta T = T_{\\text{eff}} - 5778")}:</p>
      <div class="sci-formula__eq">${t("S_{\\text{in}} = 1.107 + 1.332{\\times}10^{-4}\\Delta T + 1.58{\\times}10^{-8}\\Delta T^2 - 8.308{\\times}10^{-12}\\Delta T^3 - 5.073{\\times}10^{-15}\\Delta T^4")}</div>
      <div class="sci-formula__eq">${t("S_{\\text{out}} = 0.356 + 6.171{\\times}10^{-5}\\Delta T + 1.698{\\times}10^{-9}\\Delta T^2 - 3.198{\\times}10^{-12}\\Delta T^3 - 5.575{\\times}10^{-16}\\Delta T^4")}</div>
      <p>Temperature proxy: ${e("T_{\\text{eff}} = 5778 \\times M^{0.55}")}</p>
      ${s("Kopparapu et al. (2013/2014) style; Chromant Desmos correction")}
      <div class="sci-try">
        <div class="sci-try__title">Try it</div>
        <div class="sci-try__row">
          <label>Mass <span class="unit">M&#9737;</span></label>
          <input id="sci-hz-mass" type="number" value="1" min="0.075" max="100" step="0.01" />
          <input id="sci-hz-slider" type="range" />
        </div>
        <div class="sci-try__output">
          <span class="sci-try__label">Habitable zone</span>
          <span class="sci-try__value" id="sci-hz-result">0.95 &ndash; 1.67 AU</span>
        </div>
      </div>`),a("Giant Planet Probability",`<div class="sci-formula__eq">${t("P = \\text{clamp}\\left(0.07 \\times M_\\star \\times 10^{2[\\text{Fe/H}]},\\; 0,\\; 1\\right)")}</div>
      <p>Probability of hosting a giant planet (&gt;0.3 M<sub>Jup</sub>) as a function of stellar metallicity and mass.
      ~7% baseline at solar mass and metallicity ([Fe/H]&nbsp;=&nbsp;0, M&nbsp;=&nbsp;1&nbsp;M<sub>&odot;</sub>).
      The metallicity exponent is from Fischer &amp; Valenti (2005); the linear stellar mass factor
      is from Johnson et al. (2010): giant planets are ~3&times; more common around 2&nbsp;M<sub>&odot;</sub>
      A-type stars than 0.5&nbsp;M<sub>&odot;</sub> M&nbsp;dwarfs.</p>
      ${s("Fischer &amp; Valenti (2005) ApJ 622, 1102; Johnson et al. (2010) PASP 122, 905; Petigura et al. (2018) AJ 155, 89")}`),a("Star Colour (Blackbody RGB)",`<p>Tanner Helland&rsquo;s piecewise approximation converts effective temperature to sRGB. Valid 1000&ndash;40,000 K (R&sup2; &gt; 0.987). Let ${e("t = T/100")}:</p>
      <div class="sci-formula__eq">${t("R = \\begin{cases} 255 & t \\le 66 \\\\ 329.70 \\cdot (t-60)^{-0.133} & t > 66 \\end{cases}")}</div>
      <div class="sci-formula__eq">${t("G = \\begin{cases} 99.47\\ln(t) - 161.12 & t \\le 66 \\\\ 288.12 \\cdot (t-60)^{-0.076} & t > 66 \\end{cases}")}</div>
      <div class="sci-formula__eq">${t("B = \\begin{cases} 255 & t \\ge 66 \\\\ 0 & t \\le 19 \\\\ 138.52\\ln(t-10) - 305.04 & \\text{otherwise} \\end{cases}")}</div>
      ${s("Tanner Helland (2012) &mdash; tannerhelland.com")}`),a("Spectral Classification",`<p>Hydrogen-burning stars use a generic MK-like estimate rather than named-star catalog lookups. Effective temperature selects the nearest subtype on a published dwarf temperature scale; surface gravity and lifecycle state select the luminosity class.</p>
      <div class="sci-formula__eq">${t("\\log g = 4.438 + \\log_{10}(M/M_\\odot) - 2\\log_{10}(R/R_\\odot)")}</div>
      <div class="sci-formula__eq">${t("M_{\\text{bol}} = 4.74 - 2.5\\log_{10}(L/L_\\odot)")}</div>
      <p>The direct physical class is assembled as ${e("\\text{temperature subtype} + \\text{luminosity class}")}. The displayed class then runs through a narrow observational MK layer. The default morphology provider interpolates a compact BOSZ 2024 reduced line-index grid for Balmer, Ca K, Mg 4481, metal-line, molecular-band, helium-line, and rotation-broadening indices, then applies conservative generic subtype offsets where supported. Example: a solar-temperature dwarf resolves near G2V; an authored low-gravity K star may resolve as K-type IV/III depending on mass and radius.</p>
      ${c(["Component","How it is derived","Exposed output"],[["Physical temperature subtype","Nearest O-M dwarf Teff anchor","O/B/A/F/G/K/M subtype"],["Luminosity class","Surface gravity, lifecycle state, and physical overrides","V, IV, III, II, or I"],["Observational MK offset","Generic line-index morphology where supported","Subtype shift plus caveat"],["Morphology drivers","Modelled Balmer/Ca/Mg/metal/molecular/rotation indices","Provider, confidence, and driver labels"],["Surface gravity","Mass and radius","log g, m/s^2, and solar-relative g"],["Bolometric magnitude","Luminosity","Mbol"],["Confidence/caveats","Coverage, metallicity, rotation, lifecycle, and overrides","High/medium/low/unsupported plus notes"]])}
      <p>Metallicity and rotation can alter the observed line morphology of a true MK spectrum. Caelum exposes the direct physical class, displayed observational class, subtype offset, morphology drivers, and caveats rather than applying star-specific corrections. The bundled BOSZ grid is generated from generic synthetic spectra rather than known-star catalog answers; exact observed MK classification still requires actual spectra or fuller validated atmosphere-line modelling.</p>
      ${s("Pecaut &amp; Mamajek (2013) ApJS 208, 9; Gray &amp; Corbally (2009) Stellar Spectral Classification")}`),a("Stellar Environment Diagnostics",`<div class="sci-formula__eq">${t("Ro = P_{\\text{rot}} / \\tau_c")}</div>
      <div class="sci-formula__eq">${t("P_{\\text{wind}}(r) = P_{\\text{wind},1\\text{AU}} / r^2")}</div>
      <div class="sci-formula__eq">${t("F_{200-280}(r) = F_{200-280,1\\text{AU}} / r^2")}</div>
      <p>Caelum groups rotation, wind, and UV into a shared stellar-environment layer so Star, Planet, Moon, and visualiser views use the same host diagnostics.</p>
      <p><b>Gyrochronology limits:</b> the rotation estimate is a differentially rotating surface model. The representative gyrochronology period is best calibrated for FGK main-sequence stars; young stars, evolved stars, hot stars, M dwarfs, and brown dwarfs carry lower confidence or unsupported labels.</p>
      <p><b>Wind scaling:</b> stellar-wind mass loss, speed, and ram pressure are order-of-magnitude environment diagnostics. Planet pages dilute host wind by orbital distance and add wide companion wind from the selected host frame, but this is not yet a full magnetopause or atmospheric-erosion solver.</p>
      <p><b>Prebiotic UV window:</b> the 200&ndash;280 nm band is a photospheric blackbody estimate. It supports a bounded starter-chemistry diagnostic after atmospheric shielding, haze attenuation, surface-liquid, and temperature checks; it does not imply abiogenesis, life, or biosignatures, and it does not explicitly solve flare-driven UV bursts from active cool stars.</p>
      <p><b>Organic haze interpretation:</b> the planet photochemistry model uses CH<sub>4</sub>/CO<sub>2</sub>, oxygen suppression, pressure, and UV supply to report Titan/Archean-style organic haze likelihood, optical-depth proxies, surface-light reduction, and anti-greenhouse cooling potential. Phase 4 feeds that cooling into a bounded coupled-climate diagnostic, but it is not fed back into the climate temperature and leaves the baseline surface-temperature solve unchanged.</p>
      ${s("Barnes (2007) ApJ 669, 1167; Mamajek &amp; Hillenbrand (2008) ApJ 687, 1264; Wood et al. (2005) ApJ 628, L143; Ranjan &amp; Sasselov (2017) Astrobiology 17, 169; Arney et al. (2016) Astrobiology 16, 873")}`)].join("")}function Ee(){return[a("Metallicity Conversion",`<div class="sci-formula__eq">${t("Z = Z_\\odot \\cdot 10^{[\\text{Fe/H}]}")}</div>
      <p>Converts spectroscopic iron abundance to total metal mass fraction, where ${e("Z_\\odot = 0.02")}.</p>
      ${o([["Z","Total metal mass fraction"],["[\\text{Fe/H}]","Iron abundance relative to Solar (dex), clamped to [&minus;3, +1]"]])}`),a("ZAMS Luminosity",`<div class="sci-formula__eq">${t("L_{\\text{ZAMS}} = \\frac{a_0 M^{5.5} + a_1 M^{11}}{a_2 + M^3 + a_3 M^5 + a_4 M^7 + a_5 M^8 + a_6 M^{9.5}}")}</div>
      <p>Rational polynomial fit to zero-age main-sequence luminosity. Each coefficient ${e("a_i")} is itself a
      polynomial in ${e("\\zeta = \\log_{10}(Z/0.02)")}, encoding metallicity dependence.</p>
      ${s("Tout, Pols, Eggleton &amp; Han (1996), MNRAS 281, 257")}`),a("ZAMS Radius",`<div class="sci-formula__eq">${t("R_{\\text{ZAMS}} = \\frac{a_0 M^{2.5} + a_1 M^{6.5} + a_2 M^{11} + a_3 M^{19} + a_4 M^{19.5}}{a_5 + a_6 M^2 + a_7 M^{8.5} + M^{18.5} + a_8 M^{19.5}}")}</div>
      <p>Matching rational polynomial for ZAMS radius, with metallicity-dependent coefficients.</p>
      ${s("Tout et al. (1996), MNRAS 281, 257")}`),a("Main-Sequence Lifetime",`<div class="sci-formula__eq">${t("t_{\\text{BGB}} = \\frac{a_0 + a_1 M^4 + a_2 M^{5.5} + M^7}{a_3 M^2 + a_4 M^7} \\;\\text{Myr}")}</div>
      <div class="sci-formula__eq">${t("t_{\\text{MS}} \\approx 0.95 \\, t_{\\text{BGB}}")}</div>
      <p>Time from zero-age to the base of the giant branch. The main-sequence lifetime is
      approximately 95% of this. Coefficients are polynomials in ${e("\\zeta")}.</p>
      ${s("Hurley, Pols &amp; Tout (2000), MNRAS 315, 543 &mdash; eq. 4")}`),a("Terminal MS Luminosity",`<div class="sci-formula__eq">${t("L_{\\text{TMS}} = \\frac{a_{11} M^3 + a_{12} M^4 + a_{13} M^{a_{16}+1.8}}{a_{14} + a_{15} M^5 + M^{a_{16}}}")}</div>
      <p>Luminosity at the end of the main sequence (terminal-age). Anchors the evolved luminosity track.</p>
      ${s("Hurley et al. (2000) &mdash; eq. 8")}`),a("Terminal MS Radius",`<p>Piecewise fit: low-mass stars (${e("M \\le a_{17}")}) and high-mass stars are computed
      with different rational polynomials, smoothly interpolated across the boundary.</p>
      ${s("Hurley et al. (2000) &mdash; eq. 9")}`),a("Evolved Luminosity &amp; Radius",`<div class="sci-formula__eq">${t("\\log(L/L_{\\text{ZAMS}}) = \\alpha_L \\tau + \\beta_L \\tau^\\eta + \\gamma \\tau^2")}</div>
      <div class="sci-formula__eq">${t("\\log(R/R_{\\text{ZAMS}}) = \\alpha_R \\tau + \\gamma_R \\tau^3")}</div>
      ${o([["\\tau","Fractional age = age / t_MS (0 at ZAMS, 1 at TMS)"],["\\alpha_L,\\, \\alpha_R","Evolution rates (Hurley eqs. 19&ndash;20)"],["\\beta_L","Curvature term; mass-dependent (eq. 20)"],["\\eta","10 (M &le; 1), 20 (M &ge; 1.1), interpolated between"],["\\gamma","Chosen so L(1) = L_TMS exactly"]])}
      <p>The parametric forms reproduce full stellar-evolution tracks from ZAMS to the terminal main sequence,
      with smooth luminosity and radius growth that accelerates near turn-off.</p>
      ${s("Hurley, Pols &amp; Tout (2000), MNRAS 315, 543")}`),a("Stellar Track Provider",`<p>Automatic stellar luminosity, radius, and effective temperature pass through a provider layer. The product default is <code>auto</code>: it chooses the most specific published grid that covers the requested mass, age, and composition, and exposes the actual backend plus any fallback reason. Covered ultracool objects use a reduced table of exact BHAC15 rows; other covered main-sequence stars prefer bundled MIST v2.5 data, then the compact generic grid, before analytic fallback.</p>
      <div class="sci-formula__eq">${t("\\text{Track} = f(M,\\,t,\\,[\\text{Fe/H}],\\,[\\alpha/\\text{Fe}],\\,v/v_{\\text{crit}},\\,\\text{mode})")}</div>
      <div class="sci-formula__eq">${t("[M/H] \\approx [Fe/H] + \\log_{10}(0.638\\,10^{[\\alpha/Fe]} + 0.362)")}</div>
      <div class="sci-formula__eq">${t("T_{\\text{phot}} = T_{\\text{track}} - \\Delta T_{\\text{cool dwarf}}(M,\\,[Fe/H],\\,\\tau_{MS},\\,Ro)")}</div>
      ${c(["Mode","Behavior","Fallback"],[["auto (default)","Uses BHAC15/MIST/generic grids when covered","Analytic SSE"],["grid","Prefers the same published/bundled grids","Generic grid, then analytic SSE"],["analytic","Requests internal SSE/Hurley-Tout equations","BHAC15 below SSE mass coverage"]])}
      <p>The Tout et al. analytic ZAMS fits are published for ${e("0.1\\le M/M_\\odot\\le100")} and ${e("0.0001\\le Z\\le0.03")}. Analytic requests outside that composition interval are clamped to the nearest published boundary and carry an explicit confidence caveat; the solver does not extrapolate the metallicity polynomial into the super-solar reversal seen beyond its stated range.</p>
      <p>For ${e("0.07\\le M/M_\\odot\\le0.10")}, Caelum interpolates exact mass/age samples from the BHAC15 authors&rsquo; machine-readable tracks. The reduced offline table records its source URL and SHA-256 checksum. It is solar-composition-only, so non-solar requests retain that limitation as a caveat.</p>
      <p>The bundled MIST grids are deterministic, offline, and generic: they contain mass, fractional-main-sequence-age, metallicity, optional alpha-enhancement, and optional rotation axes plus luminosity, radius, track effective temperature, surface gravity, current mass, zero-age-main-sequence age, and terminal-main-sequence age. Fractional age aligns equivalent evolutionary progress across different stellar masses. Interpolation uses log-mass bracketing, monotone cubic age interpolation, and multilinear composition interpolation.</p>
      <p>The current bundle includes broad alpha-solar metallicity coverage, a low-mass extension, alpha-enhanced metal-poor slices, and a solar-metallicity rotation slice. Old metal-poor grid-mode stars can infer a generic Galactic alpha enhancement; requested rotation is used only when the rotating MIST slice covers the input. For MIST tracks, the user-facing <code>[Fe/H]</code> is treated as photospheric abundance, while mature FGK dwarfs may infer a small initial <code>[Fe/H]</code> offset for the model-grid axis. The applied initial value and offset are shown in the Star output.</p>
      <p>Cool dwarfs also expose a generic photosphere correction. The raw track temperature and luminosity are preserved separately, while the visible photospheric temperature can be lowered by a smooth function of mass, metallicity, fractional main-sequence age, and Rossby/activity context. For automatic dwarf tracks, bolometric luminosity is adjusted by the corresponding ${e("(T_{phot}/T_{track})^4")} factor so the reported luminosity, radius, and temperature remain Stefan&ndash;Boltzmann consistent. The correction never heats an already cooler track and is not applied to authored overrides, post-main-sequence states, or BHAC15 temperatures.</p>
      <p>Track source, confidence, caveats, data version, raw track temperature, and photosphere correction are exposed with the star model so downstream pages can distinguish analytic estimates, grid interpolation, fallback, metallicity clamps, alpha inference, rotation coverage, and authored R/L/T overrides.</p>
      <p><b>No catalog anchoring:</b> known stars are validation fixtures only. Caelum does not use named-star spectral classes, observed radii, or catalog temperatures as runtime truth for generated stars.</p>
      ${s('<a href="https://adsabs.harvard.edu/pdf/1996MNRAS.281..257T" target="_blank" rel="noopener">Tout et al. (1996), primary ZAMS fits</a>; <a href="https://arxiv.org/abs/astro-ph/0001295" target="_blank" rel="noopener">Hurley, Pols &amp; Tout (2000), SSE</a>; <a href="https://doi.org/10.1051/0004-6361/201425481" target="_blank" rel="noopener">Baraffe et al. (2015), BHAC15</a>; <a href="https://perso.ens-lyon.fr/isabelle.baraffe/BHAC15dir/" target="_blank" rel="noopener">BHAC15 authors&rsquo; data</a>')}`),a("Analytic Stellar Lifecycle Track",`<div class="sci-formula__eq">${t("S(t) = \\{\\text{MS},\\,\\text{TMS},\\,\\text{subgiant/blue dwarf},\\,\\text{giant},\\,\\text{He burning},\\,\\text{AGB/supergiant},\\,\\text{remnant}\\}")}</div>
      <div class="sci-formula__eq">${t("t_i = t_{\\text{MS}} + f_i(M)\\,t_{\\text{MS}}")}</div>
      <div class="sci-formula__eq">${t("M_{\\text{rem}} \\approx \\begin{cases}0.96M & M < 0.35 \\\\ 0.109M+0.394 & 0.35 \\le M \\le 8 \\\\ 1.3\\text{--}2.1 & 10 \\le M \\le 25 \\\\ \\text{fallback/direct-collapse BH screen} & M > 25\\end{cases}")}</div>
      <div class="sci-formula__eq">${t("I_{\\text{HZ}}(a) = \\bigcup\\,[t_a,t_b]\\;\\text{where}\\; d_{\\text{in}}(t) \\le a \\le d_{\\text{out}}(t)")}</div>
      <div class="sci-formula__eq">${t("t_{\\text{HZ}} = \\sum |I_i|,\\quad t_{\\text{longest}} = \\max |I_i|,\\quad a \\le 0.00465047\\,R_\\star(t) \\Rightarrow \\text{engulfment flag}")}</div>
      <p>The lifecycle provider turns the existing Hurley/Tout main-sequence lifetime into a compact, static timeline. It samples stage windows, current mass loss, core-mass proxies, remnant endpoint class, and the moving habitable zone without loading third-party tabulated MESA/MIST grids. The Star page renders those samples as an Era Timeline so current phase, high-energy youth, HZ migration, and remnant endpoint are visible outside Derived Details.</p>
      <p><b>Low-mass branch:</b> fully convective red dwarfs below about ${e("0.35\\,M_\\odot")} are handled as a far-future theoretical path: main sequence, terminal main sequence, blue-dwarf phase, then helium white dwarf. Caelum does not insert red-giant, core-helium-burning, or AGB stages for that branch.</p>
      <p>When a saved planet or giant has an orbit, Caelum can also summarize lifecycle exposure for that orbit: current conservative/optimistic HZ status, total and longest continuous HZ duration, first entry and last exit ages, temporary late-habitability flags, red-giant irradiation, stellar-envelope engulfment, and compact-remnant caveats.</p>
      ${o([["S(t)","Current lifecycle stage at age t"],["f_i(M)","Mass-dependent duration fractions for post-main-sequence stages"],["M_{\\text{rem}}","Approximate endpoint remnant mass"],["I_{\\text{HZ}}(a)","Sampled HZ intervals for an orbit a"],["0.00465047","Solar radii converted to AU"]])}
      <p><b>Important limit:</b> post-main-sequence luminosities, radii, winds, HZ intervals, and compact remnants are diagnostic approximations. They are useful for worldbuilding timelines and HZ migration, but they do not solve radial stellar structure, nuclear networks, convection, rotation, binaries, hydrodynamic engulfment, climate hysteresis, accretion disks, or supernova fallback.</p>
      ${s("Hurley, Pols &amp; Tout (2000), MNRAS 315, 543; Kalirai et al. (2008), ApJ 676, 594; Spera et al. (2015), MNRAS 451, 4086; Kopparapu et al. (2013/2014)")}`)].join("")}function Le(){return[a("Mass&ndash;Radius Relation (Radius-First)",`<div class="sci-formula__eq">${t("R_\\oplus = (1.07 - 0.21 \\cdot \\text{CMF}) \\cdot M_\\oplus^{\\,\\alpha}")}</div>
      <p>where ${e("\\alpha(M) = \\min\\!\\left(\\tfrac{1}{3},\\; 0.257 - 0.0161 \\ln M_\\oplus\\right)")}.</p>
      <p>CMF scaling from Zeng &amp; Sasselov (2016); mass-dependent compression exponent calibrated to all four Solar System rocky planets (Mercury 0.3%, Venus 0.8%, Earth 0.2%, Mars 0.5%). Bulk density is then derived: ${e("\\rho = 5.51 \\cdot M_\\oplus / R_\\oplus^{\\,3}")}.</p>
      ${o([["M_\\oplus","Planet mass (Earth masses)"],["\\text{CMF}","Core-mass fraction (0&ndash;1)"],["\\alpha","Mass-dependent exponent (approaches 1/3 at low mass)"],["R_\\oplus","Planet radius (Earth radii)"],["\\rho","Bulk density (g/cm&sup3;)"]])}
      <div class="sci-try">
        <div class="sci-try__title">Try it</div>
        <div class="sci-try__row">
          <label>Mass <span class="unit">M&#8853;</span></label>
          <input id="sci-dens-mass" type="number" value="1" min="0.01" max="100" step="0.01" />
          <input id="sci-dens-mass-slider" type="range" />
        </div>
        <div class="sci-try__row">
          <label>CMF <span class="unit">%</span></label>
          <input id="sci-dens-cmf" type="number" value="33" min="0" max="100" step="1" />
          <input id="sci-dens-cmf-slider" type="range" />
        </div>
        <div class="sci-try__output">
          <span class="sci-try__label">Radius &amp; Density</span>
          <span class="sci-try__value" id="sci-dens-result">1.002 R&#8853; &mdash; 5.48 g/cm&sup3;</span>
        </div>
      </div>`),a("Surface Gravity",`<div class="sci-formula__eq">${t("g = \\frac{M_\\oplus}{R_\\oplus^{\\,2}} \\quad (\\text{in Earth } g)")}</div>
      <p>Newtonian surface gravity ${e("g = GM/R^2")} in Earth-normalised units. SI: multiply by 9.81 m/s&sup2;.</p>`),a("Escape Velocity",`<div class="sci-formula__eq">${t("v_{\\text{esc}} = \\sqrt{\\frac{M_\\oplus}{R_\\oplus}} \\times 11.186 \\text{ km/s}")}</div>
      <p>From ${e("v_{\\text{esc}} = \\sqrt{2GM/R}")}, Earth&rsquo;s escape velocity is 11.186 km/s.</p>`),a("Insolation (Inverse Square Law)",`<div class="sci-formula__eq">${t("S = \\frac{L}{d^2}")}</div>
      <p>Stellar flux at the planet relative to Earth (S&#8853; = 1). ${e("L")} in L&#9737;, ${e("d")} in AU.</p>`),a("Surface Temperature (Energy Balance)",`<p>Four-step chain from stellar flux to surface temperature:</p>
      <div class="sci-formula__eq">${t("X = \\sqrt{\\frac{(1-A) \\cdot L_{\\text{erg}}}{16\\pi\\sigma}}")}</div>
      <div class="sci-formula__eq">${t("T_{\\text{eff}} = \\frac{\\sqrt{X}}{\\sqrt{d_{\\text{cm}}}}")}</div>
      <div class="sci-formula__eq">${t("T_{\\text{eq}}^4 = T_{\\text{eff}}^4 \\cdot \\left(1 + \\frac{3\\tau}{4}\\right)")}</div>
      <div class="sci-formula__eq">${t("T_{\\text{surface}} = \\left(\\frac{T_{\\text{eq}}^4}{\\text{surfDiv}}\\right)^{1/4}")}</div>
      ${o([["A","Bond albedo"],["\\sigma","Stefan-Boltzmann constant (5.670 &times; 10&supmin;&sup5; erg cm&supmin;&sup2; s&supmin;&sup1; K&supmin;&sup4;)"],["\\tau","Grey IR optical depth = G<sub>h</sub> &times; 0.5841"],["G_h","Model-specific greenhouse multiplier (dimensionless; about 1.19 is Earth-equivalent in &tau; = 0.5841 G<sub>h</sub>)"],["\\text{surfDiv}","1 &minus; (1 &minus; 0.9) &times; min(&tau;, 1) &mdash; ramps from 1.0 (airless) to 0.9 (&tau; &ge; 1)"]])}
      <p>In <b>Core</b> and <b>Full</b> modes, ${e("G_h")} is computed from atmospheric gas composition (see <em>Greenhouse Optical Depth from Gas Composition</em> in the Atmosphere &amp; Colour section). In <b>Manual</b> mode, ${e("G_h")} is set directly by the user.</p>`),a("Clausius-Clapeyron Boiling Point",`<div class="sci-formula__eq">${t("T_b = \\frac{1}{\\dfrac{1}{373.15} - \\dfrac{\\ln(p)}{L_v / R_g}}")}</div>
      <p>Pressure-dependent boiling point of water. ${e("L_v/R_g = 40700/8.314 = 4894.4")} K. Calibrated: 1 atm &rarr; 373 K, 218 atm &rarr; 647 K (critical point).</p>`),a("Ocean-Floor Water Phase Boundary",`${Pe()}
      <div class="sci-formula__eq">${t("P_{\\text{floor}} \\approx \\rho_{\\text{eff}}\\,g\\,d")}</div>
      <div class="sci-formula__eq">${t("P_{\\text{floor}} > P_{\\text{liquidus}}(T_b) \\Rightarrow \\text{dense ice stable at the ocean floor}")}</div>
      <p>Caelum uses this reduced phase diagram for ocean-world and moon-ocean dense-ice warnings. The model compares local seafloor pressure against the pure-water liquidus pressure at the estimated bottom-ocean temperature ${e("T_b")}.</p>
      <p>That is why pressure alone is not enough: a 0.52 GPa, 288 K ocean floor is below the modeled ice VI boundary, while a colder or higher-pressure floor can cross into dense-ice stability. Hot deep oceans can remain liquid at pressures that sound enormous because the ice VI and ice VII liquidus curves rise steeply with temperature.</p>
      ${c(["Boundary used","Temperature range","Anchor in model"],[["ice III / liquid","251.165&ndash;256.164 K","0.209&ndash;0.350 GPa"],["ice V / liquid","256.164&ndash;273.31 K","0.350&ndash;0.632 GPa"],["ice VI / liquid","273.31&ndash;355 K","0.632&ndash;2.216 GPa"],["ice VII / liquid","355&ndash;715 K",`${m(V(550).pressurePa/1e9,2)} GPa at 550 K`]])}
      <p>The chart is intentionally tailored to Caelum&rsquo;s current model: it focuses on the high-pressure liquid/dense-ice boundary relevant to ocean floors, not the full low-pressure vapour field. Salinity, ammonia, mixing, and long-term thermal structure are represented as uncertainty, so the app may show a pressure-only caution when bottom-ocean temperature is not constrained.</p>
      ${s("IAPWS R14-08(2011), Revised Release on the Pressure along the Melting and Sublimation Curves of Ordinary Water Substance; Wagner, Riethmann, Feistel &amp; Harvey (2011), JPCRD 40, 043103.")}`),a("Surface Ocean Coverage And Hypsometry",`<div class="sci-formula__eq">${t("D_{\\text{eq}} = \\frac{M_{\\text{water}}}{4\\pi R^2\\rho_{\\text{water}}}")}</div>
      <div class="sci-formula__eq">${t("D_{\\text{eff}} = \\frac{D_{\\text{eq}}}{S_{\\text{relief}}}")}</div>
      <div class="sci-formula__eq">${t("f_{\\text{ocean}} = H_{\\text{Earth}}(D_{\\text{eff}})")}</div>
      <div class="sci-formula__eq">${t("\\bar{d}_{\\text{ocean}} = \\frac{D_{\\text{eq}}}{\\max(f_{\\text{ocean}},\\epsilon)}")}</div>
      ${o([["D_{\\text{eq}}","Global equivalent water depth from water mass fraction, radius, and water density"],["S_{\\text{relief}}","Gravity- and tectonics-scaled relief factor relative to Earth"],["H_{\\text{Earth}}","Earth-hypsometry basin-capacity proxy"],["f_{\\text{ocean}}","Inferred liquid-ocean surface fraction before climate transfer"]])}
      <p>Caelum now estimates surface-ocean coverage from water inventory and basin capacity instead of mapping each water-regime label to a fixed ocean percentage. Earth-like WMF at Earth mass/radius fills an Earth-hypsometry proxy to about 71% ocean coverage, while climate transfer can turn the same basin fill into permanent ice or steam for snowball and runaway greenhouse cases.</p>
      <p>Manual visual or population overrides remain authoring controls. They can change displayed land/ocean split for those pages, but they do not rewrite the inferred science context used by climate, carbon-cycle, productivity, tectonics, and validation outputs.</p>
      ${s("NASA Space Place water inventory notes; NASA/JPL planetary fact sheets; NOAA/NCEI ETOPO global relief data; Cowan &amp; Abbot (2014), ApJ 781, 27; Pedersen et al. (2024), A&amp;A 685, A162")}`),a("Atmospheric Density (Ideal Gas Law)",`<div class="sci-formula__eq">${t("\\rho = \\frac{p \\cdot M_w}{R \\cdot T}")}</div>
      ${o([["p","Surface pressure (Pa) &mdash; 1 atm = 101,325 Pa"],["M_w","Mean molecular weight (kg/mol)"],["R","Gas constant (8.3145 J mol&supmin;&sup1; K&supmin;&sup1;)"],["T","Surface temperature (K)"]])}`),a("Mean Molecular Weight",`<div class="sci-formula__eq">${t("M_w = \\frac{\\sum_i f_i \\cdot m_i}{100} \\quad \\text{(kg/mol)}")}</div>
      ${c(["Gas","Formula","m<sub>i</sub> (kg/mol)"],[["N&#8322;","remainder (100 &minus; &sum; others)","0.028"],["O&#8322;","user input","0.032"],["CO&#8322;","user input","0.044"],["Ar","user input","0.040"],["H&#8322;O","user input","0.018"],["CH&#8324;","user input","0.016"],["H&#8322;","user input (Full mode)","0.002"],["He","user input (Full mode)","0.004"],["SO&#8322;","user input (Full mode)","0.064"],["NH&#8323;","user input (Full mode)","0.017"]])}
      <p>Weighted average molecular mass of the 10-gas atmosphere. N&#8322; fills the remainder so that all fractions ${e("f_i")} sum to 100%. In Core mode the Full-mode gases default to 0; their stored values still participate in gas balance and molecular weight.</p>`),a("Horizon Distance",`<div class="sci-formula__eq">${t("d = \\frac{\\sqrt{2Rh + h^2}}{1000} \\text{ km}")}</div>
      <p>Geometric distance to the horizon from height ${e("h")} (metres) above a sphere of radius ${e("R")} (metres). R = 6,371,000 &times; R&#8853;.</p>`),a("Orbital Period (Kepler III)",`<div class="sci-formula__eq">${t("P = \\sqrt{\\frac{a^3}{M_\\star}} \\text{ years}")}</div>
      <p>Kepler&rsquo;s third law in solar units (${e("a")} in AU, ${e("M_\\star")} in M&#9737;). 1 year = 365.256 days.</p>`),a("Atmospheric Circulation Cells",`<p>Number of Hadley/Ferrel/polar cell pairs determined by rotation period:</p>
      ${c(["Rotation period","Cells"],[["&ge; 48 h","1 (single Hadley)"],["6 &ndash; 48 h","3 (Earth-like)"],["3 &ndash; 6 h","7 (rapid rotator)"],["&lt; 3 h","5 (very rapid)"]])}`)].join("")}function Fe(){return[a("Mass&ndash;Radius Relation",`<p>Two-regime power law calibrated to Solar System giants:</p>
      <div class="sci-formula__eq">${t("R_\\oplus = \\begin{cases} 0.861\\,M_\\oplus^{\\,0.53} & M < 131.6\\,M_\\oplus \\\\ C_J\\,M_\\oplus^{\\,-0.044} & M \\ge 131.6\\,M_\\oplus \\end{cases}")}</div>
      <p>The Neptunian regime has radius growing with mass; the Jovian regime has radius
      <em>shrinking</em> due to degeneracy pressure. The boundary at 131.6 ${e("M_\\oplus")}
      (0.414 ${e("M_J")}) enforces continuity. ${e("C_J")} is derived from the boundary condition.</p>
      ${s("Chen &amp; Kipping (2017), ApJ 834, 17")}`),a("Sudarsky Classification",`<p>Temperature-based atmospheric classification with bond albedos:</p>
      ${c(["Class","T<sub>eq</sub> (K)","Cloud deck","Albedo"],[["I","&le; 150","NH&#8323; ice","0.34"],["II","150&ndash;250","H&#8322;O","0.81"],["III","250&ndash;800","Cloudless","0.12"],["IV","800&ndash;1400","Alkali metals","0.10"],["V","&gt; 1400","Silicate/iron","0.55"]])}
      <p>Ice giants (${e("M < 0.15\\,M_J")}) at ${e("T_{\\text{eq}} < 100")} K override to methane haze (albedo 0.3).</p>
      ${s("Sudarsky, Burrows &amp; Pinto (2000), ApJ 538, 885")}`),a("Cloud Condensation Layers",`<p>Species condense out of the atmosphere at characteristic temperatures:</p>
      ${c(["Species","T<sub>cond</sub> (K)","Pressure level"],[["Iron (Fe)","1800","0.01 bar"],["Silicate (MgSiO&#8323;)","1400","0.1 bar"],["H&#8322;O","300","5 bar"],["NH&#8324;SH","200","2 bar"],["NH&#8323;","150","0.7 bar"],["CH&#8324; (ice giants)","80","1.5 bar"]])}
      ${s("Lodders &amp; Fegley (2002); Visscher, Moses &amp; Fegley (2010)")}`),a("Atmospheric Metallicity",`<div class="sci-formula__eq">${t("\\log_{10}(Z/Z_\\odot) = 0.66 - 0.68\\,\\log_{10}(M/M_J)")}</div>
      <p>Lower-mass giants are more metal-enriched. Jupiter &asymp; 4.6&times;, Saturn &asymp; 10&times;,
      Neptune &asymp; 33&times; solar. Clamped to [1, 200] &times; solar.</p>
      ${s("Thorngren &amp; Fortney (2019), ApJL 874, L31")}`),a("Intrinsic And Effective Temperature",`<div class="sci-formula__eq">${t("T_{\\text{eq}} = 279\\,K \\left(\\frac{L_\\star}{a^2}\\right)^{1/4}(1-A_B)^{1/4}")}</div>
      <div class="sci-formula__eq">${t("T_{\\text{eff}} = \\left(T_{\\text{eq}}^4 + T_{\\text{int}}^4\\right)^{1/4}")}</div>
      <div class="sci-formula__eq">${t("F_{\\text{int}} = \\sigma T_{\\text{int}}^4")}</div>
      <p>Gas and ice giants emit absorbed starlight plus retained internal heat from Kelvin-Helmholtz cooling and interior transport. Caelum reports equilibrium temperature (${e("T_{\\text{eq}}")}) and effective temperature (${e("T_{\\text{eff}}")}) separately so cold, self-luminous giants are not treated like rocky surfaces.</p>
      ${o([["A_B","Bond albedo from Sudarsky/cloud class or ice-giant haze class"],["T_{\\text{int}}","Intrinsic temperature from mass, density, age, enrichment, irradiation, and heat transport"],["F_{\\text{int}}","Internal flux per square metre"]])}
      <p>Auto heat transport is efficient for dense convective ice giants and metallic-H gas giants, layered for low-density ice giants with likely compositional stratification, and irradiation-suppressed for highly heated close-in giants. Manual transport modes can override this when the user is intentionally modelling a suppressed or layered interior.</p>
      <p><b>Calibration stance:</b> Solar System giants are used as benchmark anchors for a generic model, not as object-specific weights. The same equations are also checked against non-Solar transiting-giant observables so Sol-system agreement does not hide overfitting.</p>`),a("Magnetic Field (Dual-Normalised Energy-Flux Dynamo)",`<div class="sci-formula__eq">${t("B_{\\text{surf}} = B_{\\text{ref}} \\cdot \\frac{\\text{raw}(\\text{planet})}{\\text{raw}(\\text{ref})}")}</div>
      <div class="sci-formula__eq">${t("\\text{raw} = \\sqrt{\\rho} \\cdot q_{\\text{eff}}^{1/3} \\cdot \\left(\\frac{r_o}{R}\\right)^{\\!3.2}")}</div>
      <p>Christensen (2009) energy-flux dynamo scaling with dual normalisation.
        Gas giants normalise to Jupiter (${e("B_{\\text{ref}} = 4.28")} G);
        ice giants normalise to the Uranus/Neptune geometric mean
        (${e("B_{\\text{ref}} = \\sqrt{0.23 \\times 0.14} \\approx 0.18")} G).
        Separate references avoid cross-regime extrapolation between
        thick-shell dipolar and thin-shell multipolar dynamos.</p>
      ${o([["\\rho","Bulk density (g/cm\\(^3\\)), proxy for dynamo-region density"],["q_{\\text{eff}}","max(internal flux + moon tidal flux, 0.4 W/m\\(^2\\)) &mdash; compositional convection floor"],["r_o/R","Dynamo shell outer boundary fraction (see below)"]])}
      <p><b>Dynamo shell geometry:</b></p>
      <ul style="font-size:13px;color:var(--muted);margin:4px 0 4px 18px">
        <li><b>Gas giants</b> (${e("M \\geq 0.15\\,M_J")}): metallic H transition.
            ${e("r_o/R = 0.40 + 0.43 \\cdot \\ln(M/0.3)/\\ln(1/0.3)")}
            &mdash; Jupiter 0.83, Saturn 0.40 (French+ 2012, Stanley &amp; Glatzmaier 2010)</li>
        <li><b>Ice giants</b> (${e("M < 0.15\\,M_J")}): density-dependent ionic ocean.
            ${e("r_o/R = 0.70 \\cdot (\\rho_{\\text{ref}}/\\rho)^{0.82}")}
            &mdash; less dense ice giants reach ionic dissociation at larger
            fractional radius (Stanley &amp; Bloxham 2004)</li>
      </ul>
      <p><b>Shell exponent (3.2):</b> The theoretical dipole attenuation is
        ${e("(r_o/R)^3")}. The additional 0.2 accounts for thin-shell
        dipolarity reduction (Heimpel+ 2005) and stable-layer field filtering
        above the dynamo (Christensen &amp; Wicht 2008).</p>
      <p><b>Morphology:</b> Gas giants &rarr; dipolar (thick metallic-H shell).
        Ice giants &rarr; multipolar (thin ionic shell).</p>
      ${c(["Planet","Model B (G)","Observed B (G)","Ratio"],[["Jupiter","4.28","4.28","1.00&times;"],["Saturn","~0.21","0.21","~0.99&times;"],["Uranus","~0.24","0.23","~1.02&times;"],["Neptune","~0.14","0.14","~1.00&times;"]])}
      <div class="sci-formula__eq">${t("R_{\\text{CF}} = \\left(\\frac{B^2}{2\\,\\mu_0\\,P_{\\text{sw}}}\\right)^{1/6}")}</div>
      <p>Magnetopause standoff distance (Chapman&ndash;Ferraro dipole pressure balance).
      ${e("P_{\\text{sw}} = P_{1\\text{AU}}/r^2")} is the solar wind dynamic pressure at orbit distance.</p>
      <p>Tidally heated moons drive volcanism and plasma loading that inflates the magnetosphere (e.g. Io plasma torus at Jupiter):</p>
      <div class="sci-formula__eq">${t("R_{\\text{mp}} = R_{\\text{CF}} \\times (1 + H_{\\text{moon}}/H_{\\text{ref}})^{\\gamma}")}</div>
      <p>where ${e("H_{\\text{moon}}")} is total tidal heating on all moons from the planet, with tidal-thermal feedback for intensely heated bodies.
      ${e("H_{\\text{ref}} = 4 \\times 10^5")} W and ${e("\\gamma = 0.047")} are calibrated to Jupiter (${e("f \\approx 2.4")}) and Saturn (${e("f \\approx 1.6")}).
      Below ${e("10^8")} W total moon heating, no plasma inflation is applied.</p>
      ${c(["Planet","Model R<sub>mp</sub>","Observed R<sub>mp</sub>","Error"],[["Jupiter","75 Rp","75 Rp","~0%"],["Saturn","22 Rp","22 Rp","~0%"],["Uranus","19 Rp","18 Rp","~3%"],["Neptune","18 Rp","23 Rp","~21%"]])}
      ${s("Chapman &amp; Ferraro (1931); Peale, Cassen &amp; Reynolds (1979); Christensen+ (2009), Nature 457, 167; Stanley &amp; Bloxham (2004), Nature 428, 151")}`),a("Atmospheric Dynamics",`<div class="sci-formula__eq">${t("L_{\\text{Rh}} = \\pi\\sqrt{U/\\beta}, \\quad \\beta = 2\\Omega/R")}</div>
      <div class="sci-formula__eq">${t("N_{\\text{bands}} = \\pi R / L_{\\text{Rh}}")}</div>
      <p>Wind speed baseline: ${e("U = 150\\sqrt{T_{\\text{eff}}/125}")} m/s. Band count clamped to [2, 30].
      Gas giants have prograde equatorial jets; ice giants have retrograde.</p>
      ${s("Rhines (1975), JFM 69; Vasavada &amp; Showman (2005)")}`),a("Oblateness (Darwin&ndash;Radau)",`<div class="sci-formula__eq">${t("f = \\frac{2.5\\,q}{1 + 6.25\\,(1 - 1.5\\xi)^2}, \\quad q = \\frac{\\omega^2 R^3}{GM}")}</div>
      ${o([["f","Geometric flattening (equatorial bulge)"],["q","Rotation parameter"],["\\xi","Normalised moment of inertia (Saturn 0.239, Jupiter 0.269)"],["J_2","(2f &minus; q) / 3"]])}
      <p>Equatorial radius: ${e("R_{\\text{eq}} = R(1 + f/3)")}; polar: ${e("R_{\\text{pol}} = R(1 - 2f/3)")}.</p>`),a("XUV-Driven Mass Loss",`<div class="sci-formula__eq">${t("\\dot{M} = \\frac{\\varepsilon\\,\\pi\\,R_p^3\\,F_{\\text{XUV}}}{G\\,M_p}")}</div>
      <div class="sci-formula__eq">${t("F_{\\text{XUV}} = F_\\odot\\,L_\\star\\,(t/t_\\odot)^{-1.23}\\,/\\,r^2")}</div>
      ${o([["\\varepsilon","Heating efficiency = 0.15"],["F_\\odot","Solar XUV at 1 AU = 4.64 erg cm&sup2; s&sup1;"],["t_\\odot","Solar age = 4.6 Gyr"]])}
      <p>Roche lobe from Eggleton (1983): ${e("R_L = 0.462\\,a\\,(M_p/3M_\\star)^{1/3}")}.</p>
      ${s("Ribas et al. (2005), ApJ 622; Eggleton (1983), ApJ 268")}`),a("Heavy Element / Core Mass",`<div class="sci-formula__eq">${t("M_Z = 49.3\\,M_J^{\\,0.61}\\;M_\\oplus")}</div>
      <p>Total heavy-element content from transit + RV constraints. Estimated core mass:
      ${e("M_{\\text{core}} = \\min(M_Z/2,\\; 25\\,M_\\oplus)")}.</p>
      ${s("Thorngren, Fortney, Murray-Clay &amp; Lopez (2016), ApJ 831, 64")}`),a("Radius Regimes, Contraction, And Irradiation",`<div class="sci-formula__eq">${t("R_{\\text{cold}} = R_{\\text{mass-radius}} \\cdot C_{\\text{composition}}")} </div>
      <div class="sci-formula__eq">${t("C_{\\text{age}} = \\begin{cases}1 + 0.1\\left[(4.5/t)^{0.35}-1\\right], & t < 4.5\\,\\text{Gyr} \\\\ 1, & t \\ge 4.5\\,\\text{Gyr}\\end{cases}")}</div>
      <p>The statistical mass&ndash;radius relation supplies a mature cold baseline. The model
      keeps H/He giants and composition-rich ice giants distinct; when composition is not
      authored, mass below 0.15 ${e("M_J")} selects the ice-rich regime and applies a small
      Solar-System-calibrated correction. The 4.5 Gyr reference follows the mature tables of
      Fortney, Marley &amp; Barnes, so a Solar-age planet is not automatically inflated.</p>
      <p>Young contraction and incident-flux inflation are separate. Above
      ${e("2\\times10^8")} erg s<sup>&minus;1</sup> cm<sup>&minus;2</sup>, the existing hot-Jupiter term is
      applied after contraction. Mass alone does not determine core/envelope composition, so
      Caelum reports an 8% H/He or 12% ice-rich interval, widened for very young or irradiated
      cases. Radii use Jupiter&rsquo;s 69,911 km volumetric-mean convention.</p>
      ${s("Chen &amp; Kipping (2017), ApJ 834, 17; Fortney, Marley &amp; Barnes (2007), ApJ 659; NASA/NSSDC Planetary Fact Sheets")}`),a("Ring Properties",`<p>Ring mass model with a Gaussian enhancement peaked at Saturn&rsquo;s mass:</p>
      <div class="sci-formula__eq">${t("M_{\\text{ring}} = 10^{12}\\sqrt{M_J} + 3{\\times}10^{19}\\,\\exp\\!\\left(-\\frac{(\\log M - \\log M_{\\text{Sat}})^2}{2\\sigma^2}\\right)\\;\\text{kg}")}</div>
      <p>Optical depth: ${e("\\tau = \\Sigma / 67")} kg/m&sup2; (Saturn B-ring reference).
      Classification: dense (${e("\\tau > 1")}), moderate (0.1&ndash;1), tenuous (${e("\\tau \\le 0.1")}).
      Ring composition: icy (${e("T < 150")} K), mixed (150&ndash;300 K), rocky (&gt; 300 K).</p>`),a("Moon Tidal Heating on Host",`<div class="sci-formula__eq">${t("\\dot{E}_{\\text{host}} = \\frac{21}{2}\\,\\frac{k_{2}}{Q} \\, \\frac{G \\, M_m^{\\,2} \\, R_p^{\\,5} \\, n}{a^6} \\, f(e)")}</div>
      <p>Same Peale et al.&nbsp;(1979) formula as rocky planets, but gas/ice giants are fluid bodies&mdash;the rigid-body Love number from Munk &amp; MacDonald does not apply. Instead, ${e("k_2")} and ${e("Q")} are mass-dependent empirical fits.</p>

      <p><b>Fluid Love number</b> ${e("k_2")} &mdash; sigmoid in log-mass space, capturing the transition from core-dominated ice giants to envelope-dominated gas giants:</p>
      <div class="sci-formula__eq">${t("k_2(M) = k_{\\min} + \\frac{k_{\\max} - k_{\\min}}{1 + e^{\\,-s\\,(\\log_{10} M - \\log_{10} M_{\\text{mid}})}}")}</div>
      ${o([["k_{\\min}","0.09 (heavily core-dominated sub-ice-giant)"],["k_{\\max}","0.385 (fluid-envelope-dominated gas giant)"],["M_{\\text{mid}}","0.072 M_J (core-to-envelope transition mass)"],["s","15 (transition steepness)"]])}
      ${c(["Body","Mass (M<sub>J</sub>)","Model k&#8322;","Observed k&#8322;","Source"],[["Jupiter","1.0","0.385","0.379","Wahl+ 2016 (Juno)"],["Saturn","0.30","0.385","0.390","Lainey+ 2017 (Cassini)"],["Uranus","0.046","0.104","0.104","Gavrilov &amp; Zharkov 1977"],["Neptune","0.054","0.128","0.127","Gavrilov &amp; Zharkov 1977"]])}

      <p><b>Tidal quality factor</b> ${e("Q")} &mdash; piecewise mass-dependent. Non-monotonic: Saturn&rsquo;s Q is anomalously low due to resonance locking (Fuller+ 2016).</p>
      ${c(["Regime","Mass range","Q","Analogue"],[["Ice giant","&lt; 0.15 M<sub>J</sub>","15,000","Uranus, Neptune"],["Saturn-like","0.2&ndash;0.5 M<sub>J</sub>","2,500","Saturn (resonance locking)"],["Jupiter-like","&ge; 0.8 M<sub>J</sub>","35,000","Jupiter"]])}
      <p>Transitions between regimes use log-space interpolation.</p>

      <p><b>Physical context:</b> Moon tidal heating deposited in the <em>host planet</em> is negligible compared to Kelvin-Helmholtz contraction (${e("\\sim 10^{-6}\\%")} of Jupiter&rsquo;s internal luminosity). The same formula applied to the <em>moon</em> (with the moon&rsquo;s k&#8322;/Q) gives the familiar Io ${e("\\sim 10^{14}")} W.</p>
      ${s("Peale, Cassen &amp; Reynolds (1979); Wahl et al. (2016); Lainey et al. (2009, 2017); Fuller, Luan &amp; Quataert (2016)")}`)].join("")}function Ge(){return[a("Kepler&rsquo;s Third Law (Moon Orbit)",`<div class="sci-formula__eq">${t("P = \\frac{2\\pi\\sqrt{a^3 / G(M_p + M_m)}}{86400} \\text{ days}")}</div>
      ${o([["a","Semi-major axis (metres)"],["G","6.674 &times; 10&supmin;&sup1;&sup1; N m&sup2; kg&supmin;&sup2;"],["M_p, M_m","Planet and moon masses (kg)"]])}`),a("Periapsis and Apoapsis",`<div class="sci-formula__eq">${t("r_p = a(1-e), \\quad r_a = a(1+e)")}</div>
      <p>Orbital distance extremes from the standard Keplerian elements.</p>`),a("Roche Limit",`<div class="sci-formula__eq">${t("d_{\\text{Roche}} = 2.44 \\, R_p \\left(\\frac{\\rho_p}{\\rho_m}\\right)^{1/3}")}</div>
      <p>Orbital distance inside which tidal forces exceed the satellite&rsquo;s self-gravity, causing disruption. The classical fluid-body result is appropriate for gravity-dominated, weak aggregate bodies.</p>
      <p>Very small moons below roughly 20 km across can be strength-dominated rather than self-gravity-dominated. For those bodies, material cohesion, porosity, fracture history, and rubble-pile structure can let the moon survive inside the classical fluid Roche limit, so Caelum treats the Roche boundary as a caveated warning rather than an automatic disruption rule.</p>`),a("Hill Sphere",`<div class="sci-formula__eq">${t("r_H = a_p \\left(\\frac{M_p}{3 M_\\star}\\right)^{1/3}")}</div>
      <p>Gravitational sphere of influence of the planet relative to the host star. Moons beyond ${e("r_H")} cannot remain bound.</p>`),a("Mutual Hill Spacing",`<div class="sci-formula__eq">${t("\\Delta = \\frac{a_2 - a_1}{R_{H,m}}, \\quad R_{H,m} = \\frac{a_1 + a_2}{2}\\left(\\frac{m_1 + m_2}{3M_\\star}\\right)^{1/3}")}</div>
      ${o([["\\Delta","Adjacent-orbit separation in mutual Hill radii"],["a_1, a_2","Inner and outer semi-major axes"],["m_1, m_2","Adjacent body masses"],["M_\\star","Selected host-frame mass"]])}
      <p>Caelum applies this diagnostic to planets, gas giants, and brown-dwarf companions in the selected host frame. It is a conservative architecture warning, not an N-body integration.</p>
      ${c(["Label","Separation","Meaning"],[["Stable","&ge; 10 R<sub>H,m</sub>","Comfortably separated for this simplified diagnostic"],["Packed","6 to &lt; 10 R<sub>H,m</sub>","Dynamically close but often plausible"],["Crowded","2&radic;3 to &lt; 6 R<sub>H,m</sub>","Long-term stability is questionable"],["Unstable","&lt; 2&radic;3 R<sub>H,m</sub>","Below the circular coplanar Hill-stability boundary"]])}
      <p>Missing masses or semi-major axes return <b>unknown</b>. Eccentricity overlap or high-mutual-inclination contexts lower confidence because the mutual-Hill threshold assumes near-circular, near-coplanar orbits.</p>
      ${s("Gladman (1993); Chambers, Wetherill & Boss (1996); Murray & Dermott (1999)")}`),a("Love Number k<sub>2</sub>",`<div class="sci-formula__eq">${t("k_2 = \\frac{1.5}{1 + \\dfrac{19\\mu}{2\\rho g R}}")}</div>
      ${o([["\\mu","Rigidity (composition-dependent: 3.5&ndash;100 GPa)"],["\\rho","Mean density (kg/m&sup3;)"],["g","Surface gravity (m/s&sup2;)"],["R","Body radius (metres)"]])}
      <p>Dimensionless measure of a body&rsquo;s tidal deformation response. Higher ${e("k_2")} means the body deforms more easily.</p>`),a("Tidal Lock Timescale",`<div class="sci-formula__eq">${t("\\tau = \\frac{\\omega \\, a^6 \\, I \\, Q}{3 G M_{\\text{tide}}^2 \\, k_2 \\, R^5}")}</div>
      ${o([["\\omega","Initial spin angular velocity (rad/s)"],["I","Moment of inertia (0.4 MR&sup2; for solid sphere)"],["Q","Tidal quality factor (composition-dependent: 5&ndash;80)"],["a","Orbital semi-major axis (metres)"],["M_{\\text{tide}}","Mass of the body raising the tide (see below)"],["R","Radius of the body being locked"],["k_2","Love number of the body being locked"]])}
      <p>Time for tidal dissipation to synchronise a body&rsquo;s spin with its orbit. Applied three times per system:</p>
      <ul style="font-size:13px;color:var(--muted);margin:4px 0 4px 18px">
        <li><b>Moon &rarr; planet</b>: ${e("M_{\\text{tide}}")} = planet mass, ${e("R, k_2")} = moon</li>
        <li><b>Planet &rarr; moon</b>: ${e("M_{\\text{tide}}")} = moon mass, ${e("R, k_2")} = planet</li>
        <li><b>Planet &rarr; star</b>: ${e("M_{\\text{tide}}")} = star mass, ${e("R, k_2")} = planet</li>
      </ul>
      ${s("Duchene &amp; Kraus (2013); tidal dissipation model")}`),a("Parent Synchronous Orbit",`<div class="sci-formula__eq">${t("r_{\\text{sync}} = \\left(\\frac{G M_p}{\\Omega_p^2}\\right)^{1/3}, \\quad \\Omega_p = \\frac{2\\pi}{P_{\\text{rot}}}")}</div>
      ${o([["r_{\\text{sync}}","Orbital radius where a prograde moon's mean motion matches parent spin"],["M_p","Parent mass"],["\\Omega_p","Parent spin angular velocity"],["P_{\\text{rot}}","Parent sidereal rotation period"]])}
      <p>For a prograde moon inside ${e("r_{\\text{sync}}")}, the moon orbits faster than the parent spins and the parent tide tends to pull it inward. Outside ${e("r_{\\text{sync}}")}, a faster-spinning parent tends to push the orbit outward. Retrograde moons are treated separately because their tidal evolution is generally inward.</p>
      <p>Missing parent mass, missing rotation, or non-positive rotation returns <b>unknown</b>. The value is calibrated against Earth geostationary distance and the Mars synchronous-orbit boundary that separates Phobos-like and Deimos-like cases.</p>
      ${s("Murray & Dermott (1999); NASA/JPL planetary fact sheets")}`),a("Spin-Orbit Resonance",`<div class="sci-formula__eq">${t("H(p,\\,e)")}</div>
      ${o([["H(\\tfrac{3}{2},\\,e) = \\tfrac{7}{2}\\,e","3:2 resonance (e.g. Mercury)"],["H(2,\\,e) = \\tfrac{17}{2}\\,e^2","2:1 resonance"],["H(\\tfrac{5}{2},\\,e) = \\tfrac{845}{48}\\,e^3","5:2 resonance"]])}
      <p>Goldreich &amp; Peale (1966) eccentricity functions.
      During tidal despinning, the planet encounters resonances from highest to lowest.
      A resonance is &ldquo;capturable&rdquo; when its ${e("H(p,e)")} exceeds a threshold
      (0.25 for 3:2, 0.5 for 2:1 and 5:2). Higher orbital eccentricity enables
      higher-order resonances; low eccentricity leads to synchronous 1:1 lock.</p>
      <p>The resonance rotation period is ${e("P_{\\text{rot}} = P_{\\text{orb}} / p")} where ${e("p")} is the spin rate in units of orbital frequency (1.5 for 3:2, etc.).</p>
      ${s("Goldreich &amp; Peale (1966), AJ 71, 425")}`),a("Atmospheric Tide Resistance",`<div class="sci-formula__eq">${t("b_{\\text{atm}} = C \\; \\frac{P_s \\; S}{g \\; T_{\\text{eq}}}")}</div>
      ${o([["P_s","Surface pressure (atm)"],["S = L/a^2","Insolation relative to Earth"],["g","Surface gravity (m/s&sup2;)"],["T_{\\text{eq}}","Equilibrium temperature (K), before greenhouse"],["C = 12","Calibration constant (Venus &rarr; b &gt; 1)"]])}
      <p>Ratio of atmospheric thermal-tide torque to gravitational body-tide torque.
      Stellar heating creates an asymmetric pressure bulge whose torque opposes tidal
      synchronisation.</p>
      <ul style="font-size:13px;color:var(--muted);margin:4px 0 4px 18px">
        <li>${e("b < 1")}: body tide dominates &mdash; effective lock time = ${e("\\tau / (1 - b)")}</li>
        <li>${e("b \\ge 1")}: atmosphere prevents locking entirely (e.g. Venus)</li>
      </ul>
      ${s("Leconte et al. (2015), Science 347, 632; Ingersoll &amp; Dobrovolskis (1978), Nature 275, 37")}`),a("Tidal Force",`<div class="sci-formula__eq">${t("F_{\\text{tidal}} = \\frac{2 G M_1 M_2}{d^3}")}</div>
      <p>Differential tidal stretching force. Scales as ${e("M/d^3")} (not ${e("M/d^2")}). Normalised to Earth&rsquo;s combined lunar + solar tidal force (1.50 &times; 10&sup1;&sup2; N).</p>`),a("Synodic Period",`<div class="sci-formula__eq">${t("\\frac{1}{P_{\\text{syn}}} = \\left|\\frac{1}{P_{\\text{sid}}} - \\frac{1}{P_{\\text{orb}}}\\right|")}</div>
      <p>Apparent lunar phase cycle as seen from the planet&rsquo;s surface.</p>`),a("Tidal Heating",`<div class="sci-formula__eq">${t("\\dot{E} = \\frac{21}{2}\\,\\frac{k_2}{Q} \\, \\frac{G \\, M_p^{\\,2} \\, R_m^{\\,5} \\, n}{a^6} \\, f(e)")}</div>
      ${o([["k_2","Love number of the moon (composition-dependent)"],["Q","Tidal quality factor of the moon"],["M_p","Parent body mass (kg)"],["R_m","Moon radius (metres)"],["n","Mean orbital motion = 2&pi;/P<sub>sid</sub> (rad/s)"],["e","Orbital eccentricity"],["a","Semi-major axis (metres)"],["f(e)","Wisdom (2008) eccentricity function (see below)"]])}
      <p>The eccentricity function ${e("f(e)")} replaces the simple ${e("e^2")} truncation with a series valid for high eccentricities:</p>
      <div class="sci-formula__eq">${t("f(e) = \\frac{e^2 \\cdot N_a(e)}{(1 - e^2)^{15/2}}, \\quad N_a = 1 + \\tfrac{31}{2}e^2 + \\tfrac{255}{8}e^4 + \\tfrac{185}{16}e^6 + \\tfrac{25}{64}e^8")}</div>
      <p>Note: obliquity tides (${e("\\propto \\sin^2\\varepsilon")}) are omitted. Orbital inclination is not the same as spin-axis obliquity, and forced obliquity for tidally locked moons requires Cassini-state theory to compute.</p>
      <p>Composition determines ${e("k_2")} and ${e("Q")} via bulk density:</p>
      <table style="font-size:12px;color:var(--muted);margin:4px 0 4px 8px;border-collapse:collapse">
        <tr><th style="text-align:left;padding:2px 8px">Class</th><th style="padding:2px 8px">&rho; (g/cm&sup3;)</th><th style="padding:2px 8px">&mu; (GPa)</th><th style="padding:2px 8px">Q</th><th style="padding:2px 8px">Calibration</th></tr>
        <tr><td style="padding:2px 8px">Very icy</td><td style="text-align:center;padding:2px 8px">&lt; 1.0</td><td style="text-align:center;padding:2px 8px">3.5</td><td style="text-align:center;padding:2px 8px">5</td><td style="padding:2px 8px"></td></tr>
        <tr><td style="padding:2px 8px">Icy</td><td style="text-align:center;padding:2px 8px">1.0&ndash;2.0</td><td style="text-align:center;padding:2px 8px">4</td><td style="text-align:center;padding:2px 8px">10</td><td style="padding:2px 8px"></td></tr>
        <tr><td style="padding:2px 8px">Subsurface ocean</td><td style="text-align:center;padding:2px 8px">override</td><td style="text-align:center;padding:2px 8px">0.3</td><td style="text-align:center;padding:2px 8px">2</td><td style="padding:2px 8px">Enceladus</td></tr>
        <tr><td style="padding:2px 8px">Mixed rock/ice</td><td style="text-align:center;padding:2px 8px">2.0&ndash;3.2</td><td style="text-align:center;padding:2px 8px">20</td><td style="text-align:center;padding:2px 8px">15</td><td style="padding:2px 8px"></td></tr>
        <tr><td style="padding:2px 8px">Rocky</td><td style="text-align:center;padding:2px 8px">3.2&ndash;5.0</td><td style="text-align:center;padding:2px 8px">50</td><td style="text-align:center;padding:2px 8px">30</td><td style="padding:2px 8px"></td></tr>
        <tr><td style="padding:2px 8px">Partially molten</td><td style="text-align:center;padding:2px 8px">override</td><td style="text-align:center;padding:2px 8px">10</td><td style="text-align:center;padding:2px 8px">10</td><td style="padding:2px 8px">Io</td></tr>
        <tr><td style="padding:2px 8px">Iron-rich</td><td style="text-align:center;padding:2px 8px">&gt; 5.0</td><td style="text-align:center;padding:2px 8px">100</td><td style="text-align:center;padding:2px 8px">80</td><td style="padding:2px 8px"></td></tr>
      </table>
      <p><b>Why composition overrides?</b> Bulk density is a reliable proxy for cold, geologically quiet moons, but it systematically underestimates heating for bodies with extreme interiors. Io&rsquo;s rocky density (3.53 g/cm&sup3;) maps to ${e("\\mu")} = 50 GPa and ${e("Q")} = 30, under-predicting its observed 10&sup1;&sup4; W by ~7&times;. Enceladus&rsquo;s icy density (1.61 g/cm&sup3;) gives ${e("\\mu")} = 4 GPa and ${e("Q")} = 10, under-predicting its Cassini-measured 1.6 &times; 10&sup1;&deg; W by ~60&times;.</p>
      <p>The override classes address this by modelling the interior state rather than just bulk composition:</p>
      <ul style="font-size:13px;color:var(--muted);margin:4px 0 4px 18px">
        <li><b>Partially molten</b> &mdash; extreme tidal heating has melted the interior, creating a magma ocean or mushy mantle that dramatically lowers rigidity. Calibrated to Io: predicted heating matches observed power within 1%.</li>
        <li><b>Subsurface ocean</b> &mdash; a global liquid ocean beneath a thin ice shell decouples the shell from the core and amplifies dissipation. Calibrated to Enceladus: predicted heating matches Cassini observations within 10%. Less reliable for large icy moons (Titan predicted ~37&times; too high, an active area of research).</li>
      </ul>
      <p>Validation against Solar System moons: Europa 1.4&times; observed, Ganymede and Callisto within order of magnitude, Earth&rsquo;s Moon 0.9&times;. Recession rate for the Earth&ndash;Moon system predicted at 3.5 cm/yr vs. observed 3.83 cm/yr (0.9&times;).</p>
      <p>Surface flux = ${e("\\dot{E} / 4\\pi R_m^2")}. Normalised to Earth&rsquo;s mean geothermal flux (0.09 W/m&sup2;).</p>
      ${s("Wisdom (2004); Peale, Cassen &amp; Reynolds (1979)")}`),a("Eccentricity Pump-Damp Context",`<div class="sci-formula__eq">${t("e_{\\text{eff}} = \\max(e_{\\text{authored}}, e_{\\text{forced}})")}</div>
      <p>Caelum uses the existing resonance and forced-eccentricity context to classify whether tidal heating is likely to persist. This is a qualitative pump-versus-damp diagnostic, not a full resonant Hamiltonian or de/dt integration.</p>
      ${c(["State","Model meaning"],[["Maintained","A resonance or forced-eccentricity floor is present, so damping alone is unlikely to erase heating quickly"],["Damping","No sustained forcing is found and tides should circularise the orbit over the modeled age"],["Overdriven","Forced eccentricity and tidal heat are both high enough to imply extreme stress"],["Uncertain","Required age, damping, heating, or resonance inputs are missing or weak"]])}
      <p>The UI keeps the output qualitative because real eccentricity equilibrium depends on resonance widths, tidal Q evolution, migration history, and sibling masses. Reference fixtures check Io-style maintained forcing, isolated damping cases, and high-stress overdriven boundaries.</p>
      ${s("Peale, Cassen & Reynolds (1979); Murray & Dermott (1999)")}`),a("Moon Tidal Heating on Planet",`<div class="sci-formula__eq">${t("\\dot{E}_{\\text{planet}} = \\frac{21}{2}\\,\\frac{k_{2p}}{Q_p} \\, \\frac{G \\, M_m^{\\,2} \\, R_p^{\\,5} \\, n}{a^6} \\, f(e)")}</div>
      ${o([["k_{2p}, Q_p","Love number and quality factor of the planet"],["M_m","Moon mass (kg) &mdash; the perturber"],["R_p","Planet radius (metres) &mdash; the heated body"],["n","Moon mean orbital motion = 2&pi;/P<sub>sid</sub> (rad/s)"],["a","Moon semi-major axis (metres)"],["f(e)","Wisdom (2008) eccentricity function (same as moon heating)"]])}
      <p>Reciprocal of the moon tidal heating formula: now the planet is the body being deformed.
      Rocky planets use composition-dependent ${e("k_2")} and ${e("Q")} (from CMF and WMF).
      Gas/ice giants use a separate fluid ${e("k_2")} and mass-dependent ${e("Q")} model (see Gas Giant Physics &sect; Moon Tidal Heating on Host).</p>
      <p><b>Retained-heat context:</b> total moon heating is compared with the present internal
      heat budget, while its surface flux is also expressed in Earth-geothermal units:</p>
      <div class="sci-formula__eq">${t("f_{\\text{tidal}} = \\frac{\\dot{E}_{\\text{planet}}}{44 \\times 10^{12} \\cdot (M/M_\\oplus) \\cdot A}, \\qquad H_{\\text{tidal}} = \\frac{\\dot{E}_{\\text{planet}}/(4\\pi R_p^2)}{0.087\\;\\text{W m}^{-2}}")}</div>
      <p>These are context and uncertainty diagnostics. The shared core model does <b>not</b>
      multiply its central cooling coordinate by tidal heat, and it never grants an infinite
      liquid-core lifetime. Values above 2&times; Earth geothermal add a high-retained-heat caveat;
      a liquid core still does not guarantee convection or a magnetic dynamo.</p>
      ${s("Peale, Cassen &amp; Reynolds (1979); Wisdom (2008)")}`),a("Tidal Recession",`<div class="sci-formula__eq">${t("\\frac{da}{dt} = \\underbrace{\\operatorname{sgn}(\\Omega_p - n)\\;\\frac{3\\,k_{2p}}{Q_p}\\,\\frac{m_m}{m_p}\\,\\frac{n\\,R_p^5}{a^4}}_{\\text{planet tide}} \\;-\\; \\underbrace{\\frac{21}{2}\\,\\frac{k_{2m}}{Q_m}\\,\\frac{m_p}{m_m}\\,\\frac{n\\,R_m^5\\,e^2}{a^4}}_{\\text{moon tide}}")}</div>
      ${o([["\\Omega_p","Planet spin angular velocity (rad/s)"],["n","Moon mean orbital motion (rad/s)"],["k_{2p}, Q_p","Love number and quality factor of the planet"],["k_{2m}, Q_m","Love number and quality factor of the moon"],["m_p, m_m","Planet and moon masses (kg)"],["R_p, R_m","Planet and moon radii (metres)"]])}
      <p>When the planet spins faster than the moon orbits (${e("\\Omega_p > n")}), the planet&rsquo;s tidal bulge leads the moon and transfers angular momentum outward &mdash; the orbit expands (Earth&ndash;Moon: +3.8 cm/yr). When ${e("\\Omega_p < n")}, angular momentum is lost and the moon spirals inward (Phobos).</p>
      ${s("Leconte et al. (2010); constant-time-lag tidal model")}`),a("Moon-System Torque Budget",`<div class="sci-formula__eq">${t("B_{\\text{moon system}} = \\sum_i m_i\\,\\left(\\frac{da}{dt}\\right)_i")}</div>
      <p>The first-pass parent moon-system budget sums each modeled moon's migration-rate sign and moon-mass weighting. This is a stable comparison proxy for net inward, outward, or balanced tidal evolution; it is not reported as an exact physical torque.</p>
      ${o([["m_i","Moon mass"],["(da/dt)_i","Modeled total migration rate for that moon"],["B_{\\text{moon system}}","Mass-weighted migration proxy used for classification"]])}
      <p>The budget reports the dominant moon only when one contribution clearly controls the signed sum. Otherwise the parent is labelled balanced or mixed. Missing moon masses or migration rates keep the budget <b>unknown</b>.</p>
      ${s("Goldreich & Soter (1966); Murray & Dermott (1999)")}`),a("Shared Dynamical Context",`<p>Caelum now routes orbital architecture, moon synchronous-orbit state, pump-damp context, moon-system torque budget, ring context, and parent radiation context through one shared dynamical context. Pages and generation checks read that context instead of rebuilding private versions of the same physics.</p>
      <p><b>Science bound:</b> the shared layer is a coupling and explanation layer, not a new N-body integrator. It preserves the upstream owners for mutual-Hill spacing, Roche and Hill limits, synchronous orbit, tidal migration, resonance pump-damp state, magnetosphere environment, and ring science.</p>
      <p><b>Sustained tidal heating:</b> moon interiors and timelines distinguish current tidal heat from sustained tidal support. A moon can be currently heated, likely sustained, damping, overdriven, or uncertain; none of those labels claims that an ocean is permanent.</p>
      <p><b>Dynamical persistence confidence:</b> habitability receives visible persistence reasons and confidence labels before any direct habitability-score penalty. Missing inputs produce <b>unknown</b> or no-op context rather than hidden scoring changes.</p>
      <p><b>Parent ring and radiation context:</b> gas-giant ring and radiation notes reuse existing Roche/ring-zone, magnetosphere, plasma-source, and assigned-moon outputs. They remain qualitative unless the source model already owns a calibrated numeric output; the shared context is not a detailed magnetodisk model.</p>
      <p><b>Generation and repair:</b> hard blocks are reserved for existing physical impossibilities such as Roche/collision/Hill failures. Crowded architecture, uncertain persistence, and degraded confidence produce warnings or repair suggestions rather than silent rewrites.</p>
      ${s("Gladman (1993); Murray & Dermott (1999); Peale, Cassen & Reynolds (1979); Paranicas et al. (2009)")}`),a("Moon Origin Pathways",`<div class="sci-formula__eq">${t("P_{\\text{origin}} \\in \\{\\text{disk},\\,\\text{impact},\\,\\text{capture},\\,\\text{exchange},\\,\\text{coformed},\\,\\text{reaccretion},\\,\\text{unknown}\\}")}</div>
      <p>Moon origins are treated as <b>model priors</b>, not solved formation events. If the user leaves Origin Pathway on Auto, Caelum infers a broad pathway from parent type, mass ratio, orbit distance, eccentricity, inclination, and retrograde context. If the user selects a pathway, that choice becomes a visible prior that changes the formation label, confidence, warnings, and Lifecycle Timeline birth era without silently rewriting the orbit or climate model.</p>
      ${c(["Pathway","What it means in the model","Typical warning"],[["Circumplanetary disk","Regular moon assembled in a disk around a giant or massive parent, with possible migration or resonance capture.","Lower confidence for highly inclined, eccentric, or retrograde orbits."],["Giant impact debris disk","Large rocky moon assembled from impact debris around a rocky parent.","Low confidence around gas giants or substellar parents."],["Captured irregular","Captured body on an inclined, distant, eccentric, or retrograde orbit.","Lower confidence for close, circular, low-inclination regular orbits."],["Binary exchange capture","Large capture aided by disruption of a binary small-body pair, Triton-style.","Usually more plausible for large captured moons than tiny irregulars."],["Co-formed companion","Companion-like formation with a planetary or substellar primary.","Lower confidence for ordinary low-mass planet moons."],["Tidal disruption reaccretion","Ring or Roche-disrupted material reassembled into a moon.","Lower confidence without Roche or ring context."],["Unknown / authored","No constrained origin prior.","Keeps confidence intentionally low."]])}
      <p>The pathway also exposes qualitative timeline effects such as early tidal-heating pulse, initial eccentricity bias, inclination expectation, volatile-retention bias, and resonance likelihood. Those effects are explanatory hooks only in this release.</p>
      <p><b>Important limit:</b> Caelum does not simulate capture encounters, impact hydrodynamics, circumplanetary disk evolution, debris reaccretion, binary exchange dynamics, or long-term N-body survival from the origin event.</p>
      ${s("Canup (2004); Mosqueira &amp; Estrada (2003); Agnor &amp; Hamilton (2006); Cuk &amp; Gladman (2005); Charnoz et al. (2010); Caelum moon-origin prior model")}`),a("Long-Term Dynamical History",`<p>Caelum now composes secular/Kozai susceptibility, first-order precession, Cassini-state readiness, migration-history evidence, and Trojan-reservoir diagnostics into one read-only long-term dynamics layer. These outputs explain long-cycle risks and history clues; they do not change authored orbits, climate temperatures, calendar periods, or apparent-size geometry.</p>
      <div class="sci-formula__eq">${t("i_{\\text{crit}} = \\cos^{-1}\\!\\sqrt{3/5} = 39.23^\\circ")}</div>
      <div class="sci-formula__eq">${t("t_{KL} \\approx \\frac{8}{15\\pi}\\frac{M_{tot}}{M_{pert}}\\frac{P_{out}^2}{P_{in}}(1-e_{out}^2)^{3/2}")}</div>
      <div class="sci-formula__eq">${t("\\epsilon_{oct} = \\frac{a_{in}}{a_{out}}\\frac{e_{out}}{1-e_{out}^2}\\left|\\frac{m_1-m_2}{m_1+m_2}\\right|")}</div>
      <p><b>Kozai-Lidov guard:</b> the app only reports possible/likely KL behaviour for hierarchical systems with enough inclination context. Missing inclination stays <b>unknown</b>; compact non-hierarchical systems do not use the KL timescale formula.</p>
      <div class="sci-formula__eq">${t("\\dot\\Omega_{J2} = -\\frac{3}{2}J_2 n\\left(\\frac{R}{a}\\right)^2\\frac{\\cos i}{(1-e^2)^2}")}</div>
      <div class="sci-formula__eq">${t("\\dot\\omega_{GR} = \\frac{3nGM}{c^2a(1-e^2)}")}</div>
      <p><b>Precession guard:</b> J2 and relativistic precession are first-order diagnostics. The Mercury fixture is calibrated near 43 arcsec/century for GR perihelion precession, but ordinary calendar and climate calculations remain based on current authored periods.</p>
      <div class="sci-formula__eq">${t("\\alpha\\cos\\epsilon\\sin\\epsilon + g\\sin(\\epsilon-I)=0")}</div>
      <p><b>Cassini-state guard:</b> without moment of inertia, obliquity, spin-axis state, orbit-plane precession, and dissipation context, Caelum reports readiness only. It does not assign named Cassini states or obliquity-tide heating from this screen.</p>
      <p><b>Migration history guard:</b> hot giants, resonant chains, excited giant orbits, Trojan capture hints, and volatile/orbit tension are reported as <i>evidence consistent with</i> migration scenarios. Grand-Tack-like and Nice-model-like labels are analogy classes, not unique reconstructions.</p>
      <p><b>Trojan reservoir guard:</b> L4/L5 linear stability is necessary but not sufficient. Eccentricity, inclination, neighboring perturbers, and supply/capture evidence decide whether the reservoir is sparse, possible, rich, eroded, or unsupported.</p>
      ${s("Naoz (2016); NASA Milankovitch overview; Ward & Hamilton (2004); Tremaine et al. (2009); Kley & Nelson (2012); Walsh et al. (2011); Tsiganis et al. (2005); NASA Lagrange point reference; Emery et al. (2015); Dvorak et al. (2005)")}`),a("Habitable Moon Observer Frames",`<p>Calendar and Apparent Size can use either a planet or a modeled moon as the observer/reference body. A moon frame is a physical viewpoint, not a habitability override: any surface-applicable modeled moon may be selected, and missing inputs produce partial diagnostics instead of invented precision.</p>
      <p><b>Moon-local calendar:</b> the year is the parent planet's host-star orbital period unless a barycentric moon orbit is explicitly modeled. The local sidereal day comes from the moon spin state; a strongly synchronous moon may use its moon-parent period as the local sidereal rotation assumption. The primary phase cycle is the parent planet's phase as seen from the moon, not the observer moon's own appearance.</p>
      <div class="sci-formula__eq">${t("\\theta_{\\text{parent}} = 2\\,\\arctan\\!\\left(\\frac{R_p}{d_m}\\right)")}</div>
      ${o([["R_p","Parent planet radius"],["d_m","Moon-parent distance, normally the moon semi-major axis"],["\\theta_{\\text{parent}}","Approximate parent angular diameter in the moon sky"]])}
      <p><b>Eclipse readiness:</b> phase alone is insufficient for an eclipse. Exact schedules require orbital inclination, longitude of node, a reference epoch, periods, and the relevant body radii. Without those inputs, Caelum reports likelihood/readiness classes only.</p>
      <p><b>Long-cycle orientation:</b> Laplace-plane, J2 nodal/apsidal precession, and Cassini-state outputs are bounded diagnostics. The first-order Laplace radius and J2 precession proxies indicate the likely regime, but they are not a coupled secular spin-orbit solution and should not be used as exact season or pole-star predictions.</p>
      ${s("NASA GSFC Eclipse; LPI Moon Phases; Heller & Barnes (2013); Forgan & Yotov (2014); Tremaine et al. (2009); Ward & Hamilton (2004); NASA Milankovitch overview")}`),a("Tidal-Thermal Feedback",`<p>Intense tidal heating partially melts a rocky interior, lowering rigidity ${e("\\mu")} and quality factor ${e("Q")}, which further amplifies dissipation &mdash; a positive feedback loop. This is the key mechanism behind Io&rsquo;s extreme volcanism in the Laplace resonance (Io&ndash;Europa&ndash;Ganymede 1:2:4).</p>
      <p>For rocky moons (${e("\\rho \\ge 3.2")} g/cm&sup3;) without a manual composition override, the model first computes tidal flux with cold (density-derived) material properties. A melt fraction ${e("f")} is then derived from the ratio of flux to a critical threshold:</p>
      <div class="sci-formula__eq">${t("f = \\frac{1}{1 + (F_{\\text{crit}} / F_0)^3}, \\quad F_{\\text{crit}} = 0.02 \\;\\text{W/m}^2")}</div>
      <p>Rigidity and Q are blended toward partially-molten values:</p>
      <div class="sci-formula__eq">${t("\\mu_{\\text{eff}} = \\exp\\!\\left[(1 - f)\\,\\ln\\mu_{\\text{cold}} + f\\,\\ln\\mu_{\\text{melt}}\\right], \\quad Q_{\\text{eff}} = (1 - f)\\,Q_{\\text{cold}} + f\\,Q_{\\text{melt}}")}</div>
      ${o([["F_0","Initial tidal flux from cold material properties (W/m\xB2)"],["F_{\\text{crit}}","Critical flux for partial melting (0.02 W/m\xB2)"],["\\mu_{\\text{melt}}","10 GPa (partially molten rigidity)"],["Q_{\\text{melt}}","10 (partially molten quality factor)"]])}
      <p>Tidal heating is then recalculated with ${e("\\mu_{\\text{eff}}")} and ${e("Q_{\\text{eff}}")}. For Io: cold flux = 0.35 W/m&sup2; triggers full melting (${e("f \\approx 1")}), giving ${e("\\sim 10^{14}")} W &mdash; matching observed heating.</p>
      ${s("Moore (2003); Segatz et al. (1988) \u2014 tidal-convective equilibrium models")}`),a("Moon Surface Temperature",`<div class="sci-formula__eq">${t("T_{\\text{eq}} = \\left(\\frac{L_\\star\\,(1 - a)}{16\\,\\pi\\,\\sigma\\,d^2}\\right)^{1/4}")}</div>
      <p>Global equilibrium temperature for an airless body before greenhouse warming. It is a radiative baseline, not a prediction of the hottest or coldest measured surface pixels. The moon&rsquo;s distance from the star is approximated as the parent planet&rsquo;s semi-major axis.</p>
      <div class="sci-formula__eq">${t("T_{\\text{surf}} = \\left(T_{\\text{eq}}^4 + \\frac{F_{\\text{tidal}}}{\\sigma} + \\frac{F_{\\text{radio}}}{\\sigma}\\right)^{1/4}")}</div>
      <p>Total surface temperature adds tidal heating flux and radiogenic heating flux as additional energy inputs. Radiogenic flux:</p>
      <div class="sci-formula__eq">${t("F_{\\text{radio}} = \\frac{44\\;\\text{TW} \\times (M_m / M_\\oplus) \\times A}{4\\,\\pi\\,R_m^2}")}</div>
      <div class="sci-formula__eq">${t("T_{\\text{observable}} \\in [T_{\\text{cold}},\\,T_{\\text{warm}}]")}</div>
      <p>Airless moons also report an observable thermal envelope for brightness-style or local-temperature comparisons. That range broadens with low thermal inertia, slow rotation, roughness, eclipses, and inferred albedo. If only geometric or visual albedo is available, Caelum estimates Bond albedo through a phase-integral proxy and lowers confidence instead of tuning the object.</p>
      ${o([["L_\\star","Star luminosity (W)"],["a","Moon Bond albedo"],["d","Star\u2013planet distance (metres)"],["\\sigma","Stefan-Boltzmann constant (5.67\xD710\u207B\u2078 W m\u207B\xB2 K\u207B\u2074)"],["F_{\\text{tidal}}","Tidal heating surface flux (W/m\xB2)"],["A","Radioisotope abundance (\xD7 Earth)"],["M_m, R_m","Moon mass (kg) and radius (metres)"]])}
      <p>For Earth&rsquo;s Moon: ${e("T_{\\text{eq}} \\approx 270")} K. Tidal and radiogenic contributions are negligible. For Io: tidal heating adds ~4 K to the mean surface temperature.</p>`),a("Magnetospheric Radiation",`<div class="sci-formula__eq">${t("B(r) = B_{\\text{surf}} \\times \\left(\\frac{R_p}{r}\\right)^3")}</div>
      <p>Dipole magnetic field at the moon&rsquo;s orbital distance. The radiation dose from trapped charged particles scales as ${e("B^3")}:</p>
      <div class="sci-formula__eq">${t("D = 3.97 \\times 10^9 \\times B(r)^3 \\;\\text{rem/day}")}</div>
      <p>where ${e("B")} is in Gauss. Calibrated to Jupiter&ndash;Europa: ${e("B \\approx 5.14 \\times 10^{-3}")} G &rarr; 540 rem/day.</p>
      ${o([["B_{\\text{surf}}","Planet surface field (Gauss)"],["R_p","Planet radius"],["r","Moon semi-major axis"]])}
      <p>Magnetopause standoff (Chapman&ndash;Ferraro scaling from Earth):</p>
      <div class="sci-formula__eq">${t("L_{\\text{mp}} = 10 \\times B_{\\oplus}^{1/3} \\times d_{\\text{AU}}^{1/3} \\;\\text{[planet radii]}")}</div>
      <p>where ${e("B_{\\oplus}")} is the planet&rsquo;s surface field in Earth units. Moons beyond the magnetopause receive zero trapped-particle radiation.</p>
      <p>Magnetopause shadowing: energetic particle drift orbits that intersect the magnetopause are lost, depleting the outer radiation belts. Applied as a logistic attenuation factor:</p>
      <div class="sci-formula__eq">${t("D_{\\text{eff}} = \\frac{D}{1 + e^{25(L/L_{\\text{mp}} - 0.3)}} ")}</div>
      <p>where ${e("L/L_{\\text{mp}}")} is the moon&rsquo;s L-shell as a fraction of the magnetopause distance. The rolloff onset at 30% matches observed radiation depletion at Callisto (${e("L/L_{\\text{mp}} \\approx 0.35")}).</p>
      <p>Caelum then converts the parent-belt term into separate surface and subsurface exposure classes with simple shielding factors:</p>
      <div class="sci-formula__eq">${t("D_{\\text{surface}} = (D_{\\text{eff}} + D_{\\text{XUV}})\\,(1 - S_{\\text{atm}})\\,(1 - S_{\\text{mag}})")}</div>
      <div class="sci-formula__eq">${t("D_{\\text{sub}} = D_{\\text{surface}} \\times f_{\\text{ice}}")}</div>
      <p>Here ${e("S_{\\text{atm}}")} is atmosphere shielding, ${e("S_{\\text{mag}}")} combines intrinsic and induced magnetic shielding, and ${e("f_{\\text{ice}}")} reduces dose below an ice shell. Ganymede-like intrinsic dynamos and salty-ocean induced fields are treated as partial shields rather than total immunity. Thick atmospheres often dominate surface protection, while buried oceans or thick ice shells are much safer than the surface.</p>
      <p>This is why Caelum can classify the same moon as a <b>radiation-limited surface ocean</b> but still keep <b>subsurface ocean plausible</b>.</p>
      <p><b>Calibration note:</b> the parent-belt term remains a comparative, Europa-anchored radiation model rather than a full first-principles particle-transport solution. The output is most reliable as a relative moon-environment classifier, not as an absolute dose forecast for arbitrary exomoon systems.</p>
      ${s("Paranicas et al. (2009); Divine & Garrett (1983) \u2014 Jupiter radiation environment")}`),a("Icy Moon Sputtered Oxygen Exospheres",`<p>Europa-like icy moons can carry an abiotic O<sub>2</sub>/H<sub>2</sub> exosphere without having breathable air. Caelum treats this as a surface-boundary context: parent magnetospheric particles dissociate exposed water ice, sputtering and radiolysis release neutrals, and pickup ions plus surface trapping remove them.</p>
      <div class="sci-formula__eq">${t("Q_{O_2} \\approx 12\\;\\frac{R_m^2}{R_E^2}\\;S_{ice}\\;S_{particles}\\;S_{pressure}\\;\\text{kg s}^{-1}")}</div>
      ${o([["Q_{O_2}","Global O2 production proxy"],["R_m/R_E","Moon radius relative to Europa"],["S_{ice}","Exposed water-ice support"],["S_{particles}","Parent magnetospheric particle context"],["S_{pressure}","Suppression by retained dense atmospheres"]])}
      <p><b>Calibration:</b> the current anchor is Europa. Juno/JADE constrains total O<sub>2</sub> production near 12 kg/s, with a broad 6-18 kg/s acceptance range. Hubble detections establish the tenuous oxygen atmosphere, while exosphere modeling keeps the result surface-boundary and loss-balanced rather than a retained surface atmosphere.</p>
      <p><b>Guardrail:</b> exosphere O<sub>2</sub> is never added to retained pressure, greenhouse warming, breathability, vegetation, or life confidence. It only contributes abiotic-oxygen caution, parent plasma loading evidence, atmosphere-ledger source/sink terms, and timeline context.</p>
      ${s("NASA Juno/JADE Europa oxygen production; Szalay et al. (2024); Hall et al. (1995); Teolis et al. (2017)")}`),a("Volatile Inventory &amp; Atmospheric Retention",`<p>Identifies surface ices and thin atmospheres on airless moons via three checks per species:</p>
      <p><b>1. Presence:</b> In <b>Core</b> mode, species availability falls back to the older bulk-density guard (${e("\\rho < \\rho_{\\text{max}}")}) for that ice. In <b>Full</b> and <b>Manual</b> modes, Caelum instead folds in explicit water inventory, ammonia fraction, composition override, and manual gas-mix requests before deciding whether a species reservoir is available. Exception: SO&#8322; still requires active tidal feedback or a manual atmospheric request.</p>
      <p><b>2. Sublimation:</b> Vacuum sublimation onset when ${e("T_{\\text{surf}} \\geq T_{\\text{sub}}")} (temperature
      at which vapor pressure &asymp; 1 Pa). These thresholds are lower than the triple-point temperatures
      used for planets because moons exist in near-vacuum.</p>
      <p><b>3. Retention (Jeans escape):</b></p>
      <div class="sci-formula__eq">${t("\\lambda = \\frac{m_s\\, v_{\\text{esc}}^2}{2\\, k_B\\, T}")}</div>
      ${o([["m_s","Molecular mass of species (kg)"],["v_{\\text{esc}}","Moon surface escape velocity (m/s)"],["k_B","Boltzmann constant"],["T","Surface temperature (K)"]])}
      <p>${e("\\lambda > 6")} &rArr; instantaneous retention; ${e("\\lambda < 3")} &rArr; escaping.</p>
      <p><b>4. Geological retention (escape timescale):</b></p>
      <p>Instantaneous retention (${e("\\lambda > 6")}) is necessary but not sufficient. The atmosphere must also persist over the system&rsquo;s age:</p>
      <div class="sci-formula__eq">${t("\\tau_{\\text{esc}} = \\frac{P}{g \\sqrt{\\frac{m_s}{2\\pi\\, k_B T}}\\,(1 + \\lambda)\\, e^{-\\lambda}}")}</div>
      ${o([["P","Surface vapor pressure (Pa)"],["g","Moon surface gravity (m/s&sup2;)"]])}
      <p>A species sustains a thin atmosphere only if ${e("\\tau_{\\text{esc}} > t_{\\text{age}}")}. This eliminates false positives like Titania, where ${e("\\lambda \\approx 17")} but ${e("\\tau_{\\text{esc}} \\approx 38")} years. SO&#8322; from active volcanism is exempt (continuous resupply).</p>
      <p><b>Vapor pressure (Clausius&ndash;Clapeyron):</b></p>
      <div class="sci-formula__eq">${t("P = P_{\\text{tp}} \\exp\\!\\left[-\\frac{\\Delta H_{\\text{sub}}}{R}\\!\\left(\\frac{1}{T} - \\frac{1}{T_{\\text{tp}}}\\right)\\right]")}</div>
      <p>Gives approximate surface pressure for display (e.g. N&#8322; ~14 Pa for Triton).</p>
      ${c(["Species","T_{sub} (K)","\\rho_{max}","Source"],[["N\\u2082","35","2.5 g/cm\\u00B3","Fray & Schmitt (2009)"],["CO","35","2.5 g/cm\\u00B3",""],["CH\\u2084","50","2.5 g/cm\\u00B3",""],["CO\\u2082","115","3.2 g/cm\\u00B3",""],["NH\\u2083","130","2.5 g/cm\\u00B3",""],["SO\\u2082","140","volcanic",""],["H\\u2082O","210","3.2 g/cm\\u00B3",""]])}
      ${s("Fray & Schmitt (2009, PSS 57, 2053); Jeans (1916) \u2014 atmospheric escape theory; Chamberlain (1963) \u2014 hydrodynamic escape timescale")}`),a("Moon Worlds in Caelum",`<p>Caelum&rsquo;s moon-world outputs are built as a layered model rather than a single published formula. The Moon page combines atmosphere, hydrosphere, climate, geology, biosphere, and habitability outputs into one reference state for each moon.</p>
      <p><b>Science modes:</b> the Moon page now exposes separate <b>Hydrosphere</b>, <b>Atmosphere</b>, and <b>Orbital Coupling</b> modes. <b>Core</b> preserves the lighter heuristic path, <b>Full</b> enables the richer moon-world and coupled-system science, and <b>Manual</b> accepts extra physical inputs while still solving the outputs rather than hard-overriding them.</p>
      <p><b>ESI vs. Habitability Index:</b> ESI is the standard four-term Earth Similarity Index (radius, density, escape velocity, temperature). Caelum&rsquo;s <i>Habitability Index</i> is a custom comparative metric: PHI-inspired, but not a direct implementation of the published literature PHI. It chooses a solvent pathway first (surface water, subsurface water, or alternative solvent when enabled), then scores substrate, solvent, energy, chemistry, stability, radiation, and persistence under that pathway.</p>
      <ul style="font-size:13px;color:var(--muted);margin:4px 0 4px 18px">
        <li><b>Atmosphere</b> combines volatile availability, escape, source type, and greenhouse or anti-greenhouse behaviour.</li>
        <li><b>Hydrosphere</b> separates dry, surface-ocean, frozen-surface, subsurface-ocean, and steam states, including high-pressure-ice barriers where applicable.</li>
        <li><b>Climate</b> adds parent reflected light, parent thermal flux, eclipse duty cycle, tidal and radiogenic heating, synchronous contrast, and collapse-risk diagnostics to the star-driven equilibrium temperature.</li>
        <li><b>Geology</b> tracks volcanic or cryovolcanic resurfacing, volatile replenishment, and whether an internal ocean is likely to persist.</li>
        <li><b>Biosphere</b> is surface-only: exposed biology and plant-life outputs require accessible surface liquid, adequate atmosphere, tolerable radiation, and livable surface climate.</li>
        <li><b>Habitability</b> can score both exposed surface solvent and buried subsurface solvent, so a moon can rate as chemically or physically promising without supporting an exposed biosphere.</li>
      </ul>
      <p><b>Five-gate outcome:</b> the current moon-world stack effectively behaves like a five-gate habitability screen: stellar-zone context for exposed-surface cases, stable circumplanetary orbit, combined energy budget, atmosphere retention, and radiation shielding. A moon does not need to pass all five to remain scientifically interesting, but exposed surface-biosphere outcomes require the full set.</p>
      <p><b>Orbit stability policy:</b> Caelum now treats the full Hill sphere as only the formal outer bound. The long-term stable moon zone is kept more conservatively inside it: roughly one-third of the Hill radius for prograde moons and about one-half for retrograde moons, with an additional comfort margin before the outer edge.</p>
      <p><b>Coupled moon systems:</b> in Full and Manual orbital-coupling modes, the moon solver can incorporate sibling-moon resonances, Laplace-chain tagging, forced eccentricity floors, a derived tidal-habitable-zone diagnostic, and formation classification before the final moon-world outputs are derived.</p>
      <p><b>Surface vs. subsurface:</b> a buried ocean below an ice shell can raise the moon&rsquo;s internal or comparative habitability score, but it does <em>not</em> by itself imply surface life, plant life, or an Earth-like surface environment. Surface biosphere outputs remain tied to exposed surface conditions, while the moon summary can now separate <i>surface ocean plausible</i>, <i>radiation-limited surface ocean</i>, and <i>subsurface ocean plausible</i> outcomes.</p>
      <p><b>Radiation and shielding:</b> moon results now track parent-belt exposure, stellar high-energy input, atmospheric attenuation, intrinsic dynamo shielding, induced salty-ocean shielding, and ice-shell attenuation together. This lets Caelum flag a moon as surface-wet but radiation-limited without discarding its deeper subsurface potential.</p>
      <p><b>Beyond the stellar habitable zone:</b> the star&rsquo;s habitable zone mainly matters for <em>surface</em> liquid-water cases. Outside the stellar HZ, moons can still remain scientifically plausible life candidates through buried oceans sustained by tides, chemistry, and internal heat.</p>
      <p><b>Stellar-HZ context:</b> exposed surface cases now use the star engine&rsquo;s actual habitable-zone output when available, then apply moon-specific caution for very low-mass stars where the habitable zone sits so close in that circumplanetary stability and early XUV exposure become harder constraints.</p>
      <p><b>Cool-star surface calibration:</b> exposed surface-habitable moons around cool stars now pass through a paper-informed calibration layer rather than a pure temperature check. The current layer weighs moon mass, host giant mass, parent orbital distance, bulk composition, and spin state so that a merely warm moon is not automatically treated as a defensible surface-life candidate.</p>
      <p><b>Mass floor and giant-host regime:</b> the calibration is intentionally selective. Surface atmosphere-bearing moons around cool stars become harder below the current moon-mass floor, and the model treats more massive giant hosts as a more favorable regime than weak giant hosts. This is a calibration layer, not a first-principles exomoon climate proof.</p>
      <p><b>Spin-state nuance:</b> the tidal path can now distinguish strict 1:1 synchronous lock from 3:2 resonance and from non-resonant states. A justified 3:2 state modestly softens permanent day-night contrast relative to 1:1 lock, so it can slightly improve exposed-surface plausibility without acting as a free habitability override.</p>
      <p><b>Calibration scope:</b> this cool-star surface calibration only constrains exposed surface-ocean and surface-biosphere outcomes. Subsurface-ocean and buried-life candidates remain available outside the stellar HZ and are not blocked by the surface calibration alone.</p>
      <p><b>Reference inputs:</b> this moon-world layer sits on top of the tidal heating, moon temperature, magnetospheric radiation, volatile-retention, magnetosphere, and atmosphere-stability blocks documented above, then adds Caelum&rsquo;s own hydrosphere, geology, biosphere, and integrated habitability policy layers.</p>`)].join("")}function Ie(){return[a("Hill Sphere",`<div class="sci-formula__eq">${t("r_H = a \\left(\\frac{m}{3M_\\star}\\right)^{1/3}")}</div>
      <p>Radius of gravitational dominance. Objects within the Hill sphere are bound to the body
      rather than the star.</p>`),a("L1 and L2",`<div class="sci-formula__eq">${t("L_1 = a - r_H, \\quad L_2 = a + r_H")}</div>
      <p>Collinear Lagrange points on the star&ndash;body line, located at approximately one Hill radius
      sunward (L1) and anti-sunward (L2) of the body.</p>`),a("L3",`<div class="sci-formula__eq">${t("L_3 = a\\left(1 + \\frac{5m}{12M_\\star}\\right)")}</div>
      <p>Located on the far side of the star, 180&deg; from the body. The mass-ratio correction is
      negligible for planetary masses.</p>`),a("L4 and L5 (Trojans)",`<div class="sci-formula__eq">${t("r = a, \\quad \\theta = \\theta_{\\text{body}} \\pm 60\xB0")}</div>
      <p>Equilateral triangle points leading (+60&deg;, L4) and trailing (&minus;60&deg;, L5) the body
      in its orbit.</p>
      <div class="sci-formula__eq">${t("\\mu = \\frac{m}{m + M_\\star} < \\mu_{\\text{crit}} = \\frac{1 - \\sqrt{69}/9}{2} \\approx 0.0385")}</div>
      <p>Gascheau (1843) stability criterion: L4/L5 are linearly stable only when the
      secondary mass ratio &mu; is below &mu;<sub>crit</sub>. This simplifies to roughly
      ${e("m/M_\\star < 1/25")} for planetary masses. In the visualiser, unstable Trojans
      are shown as dimmed amber diamonds. The long-term dynamics layer adds reservoir labels
      only after checking eccentricity, inclination, neighboring perturbations, and source/capture
      evidence; stable points do not guarantee populated Trojans.</p>`)].join("")}function Oe(){return[a("Stellar Absolute Magnitude",`<div class="sci-formula__eq">${t("M_V = 4.81 - 2.5\\log_{10}(L)")}</div>
      <p>Sun&rsquo;s absolute visual magnitude is 4.81; the factor 2.5 comes from Pogson&rsquo;s magnitude scale definition.</p>`),a("Distance Modulus (Apparent Magnitude)",`<div class="sci-formula__eq">${t("m = M_V + 5\\log_{10}\\!\\left(\\frac{d}{1\\text{ pc}}\\right) - 5")}</div>
      <p>Converts absolute magnitude to apparent magnitude at distance ${e("d")}. 1 pc = 206,264.806 AU.</p>`),a("Body Absolute Magnitude (H)",`<div class="sci-formula__eq">${t("H = 5\\log_{10}\\!\\left(\\frac{1329}{D_{\\text{km}} \\sqrt{p_V}}\\right)")}</div>
      <p>IAU standard H-magnitude for solar system bodies relating size and albedo to intrinsic brightness.</p>
      ${s("Bowell et al. (1989) H-G photometry system")}
      <div class="sci-try">
        <div class="sci-try__title">Try it</div>
        <div class="sci-try__row">
          <label>Radius <span class="unit">km</span></label>
          <input id="sci-hmag-rad" type="number" value="6371" min="1" max="100000" step="1" />
        </div>
        <div class="sci-try__row">
          <label>Albedo</label>
          <input id="sci-hmag-alb" type="number" value="0.434" min="0.01" max="1" step="0.01" />
          <input id="sci-hmag-alb-slider" type="range" />
        </div>
        <div class="sci-try__output">
          <span class="sci-try__label">H magnitude</span>
          <span class="sci-try__value" id="sci-hmag-result">&mdash;</span>
        </div>
      </div>`),a("Bowell H-G Phase Function",`<div class="sci-formula__eq">${t("\\Phi(\\alpha) = (1-G)\\,e^{-3.33\\tan^{0.63}(\\alpha/2)} + G\\,e^{-1.87\\tan^{1.22}(\\alpha/2)}")}</div>
      ${o([["\\alpha","Phase angle (radians)"],["G","Slope parameter (0.28 rocky, 0.15 tiny)"]])}
      ${s("Bowell et al. (1989)")}`),a("Phase Angle (Law of Cosines)",`<div class="sci-formula__eq">${t("\\cos\\alpha = \\frac{r^2 + \\Delta^2 - d_h^2}{2\\,r\\,\\Delta}")}</div>
      ${o([["r","Body&rsquo;s orbital distance (AU)"],["\\Delta","Body-to-observer distance (AU)"],["d_h","Observer&rsquo;s orbital distance (AU)"]])}`),a("Elongation",`<div class="sci-formula__eq">${t("\\cos(\\text{elong}) = \\frac{d_h^2 + \\Delta^2 - r^2}{2\\,d_h\\,\\Delta}")}</div>
      <p>Sun-observer-body angle determining whether the body is visible above the horizon.</p>`),a("Bond to Geometric Albedo",`<div class="sci-formula__eq">${t("p_V = \\frac{A_B}{q}")}</div>
      <p>Phase integral ${e("q")} by body type: rocky airless 0.48, rocky atmosphere 0.90, gas giant 0.94, tiny 0.39.</p>`),a("Eclipse Classification",`<p>Compare angular radii of moon and star as seen from the planet surface:</p>
      <div class="sci-formula__eq">${t("\\theta_{\\text{moon}} = \\frac{R_{\\text{moon}}}{a_{\\text{moon}}}, \\quad \\theta_\\star = \\frac{R_\\star}{d_{\\text{planet}}}")}</div>
      <p>If ${e("\\theta_{\\text{moon}} \\ge \\theta_\\star")}: total eclipses. Otherwise: annular only.</p>`),a("Exoplanet Observability And Detectability",`<div class="sci-formula__eq">${t("\\delta_{\\text{transit}} = \\left(\\frac{R_p}{R_\\star}\\right)^2")}</div>
      <div class="sci-formula__eq">${t("P_{\\text{transit}} \\approx \\frac{R_\\star + R_p}{a}")}</div>
      <div class="sci-formula__eq">${t("K \\approx 28.43\\,\\text{m/s}\\,\\left(\\frac{M_p}{M_J}\\right)\\left(\\frac{P}{1\\,\\text{yr}}\\right)^{-1/3}\\left(\\frac{M_\\star}{M_\\odot}\\right)^{-2/3}")}</div>
      <div class="sci-formula__eq">${t("\\theta_{\\text{sep}}\\,[\\text{arcsec}] \\approx \\frac{a\\,[\\text{AU}]}{d\\,[\\text{pc}]}")}</div>
      <p>Planet pages separate geometric observability from interpretive atmosphere readiness. Transit depth, geometric transit probability, radial-velocity semi-amplitude, and direct-imaging angular separation are first-pass physical signals.</p>
      <p><b>Transmission readiness</b> is a bounded class derived from scale height, transit signal, clouds, haze, atmosphere persistence, stellar activity noise, and radiation context. It estimates whether an atmosphere is easier or harder to interpret; it is not a telescope-specific exposure-time calculator.</p>
      <p><b>Biosignature observability</b> combines the transmission feature score with non-biological caveats, false-positive risk, and productivity context. A strong score means the modeled atmosphere would be easier to characterise, not that biology has been detected.</p>
      ${o([["\\delta_{\\text{transit}}","Fractional stellar dimming during transit"],["P_{\\text{transit}}","Geometric transit probability"],["K","Radial-velocity semi-amplitude for a near-circular orbit"],["\\theta_{\\text{sep}}","Maximum angular separation for direct-imaging context"]])}
      ${s("Winn (2010), Exoplanet Transits and Occultations; Perryman (2018), The Exoplanet Handbook; Seager &amp; Sasselov (2000), ApJ 537, 916")}`)].join("")}function Ne(){return[a("Scale Height Correction",`<div class="sci-formula__eq">${t("\\frac{H_{\\text{planet}}}{H_\\oplus} = \\frac{T / T_\\oplus}{g / g_\\oplus}")}</div>
      <div class="sci-formula__eq">${t("p_{\\text{eff}} = p \\times \\frac{H_{\\text{planet}}}{H_\\oplus}")}</div>
      <p>Atmospheric column depth depends on scale height ${e("H = kT/mg")}. Lower gravity or higher temperature increases the effective optical depth for a given surface pressure.</p>
      ${s("PanoptesV (panoptesv.com/SciFi)")}`),a("OKLab Colour Space",`<p>Perceptually uniform colour space used for all colour interpolation. sRGB &rarr; linear &rarr; LMS (cube roots) &rarr; OKLab:</p>
      <div class="sci-formula__eq">${t("\\begin{pmatrix} l' \\\\ m' \\\\ s' \\end{pmatrix} = \\sqrt[3]{\\begin{pmatrix} 0.412 & 0.536 & 0.051 \\\\ 0.212 & 0.681 & 0.107 \\\\ 0.088 & 0.282 & 0.630 \\end{pmatrix} \\begin{pmatrix} R \\\\ G \\\\ B \\end{pmatrix}}")}</div>
      <div class="sci-formula__eq">${t("\\begin{pmatrix} L \\\\ a \\\\ b \\end{pmatrix} = \\begin{pmatrix} 0.210 & 0.794 & -0.004 \\\\ 1.978 & -2.429 & 0.451 \\\\ 0.026 & 0.783 & -0.809 \\end{pmatrix} \\begin{pmatrix} l' \\\\ m' \\\\ s' \\end{pmatrix}")}</div>
      ${s("Bjorn Ottosson (2020) &mdash; OKLab perceptually uniform colour space")}`),a("CO&#8322; Atmospheric Tint",`<div class="sci-formula__eq">${t("\\text{strength} = \\text{clamp}\\!\\left(\\sqrt{f_{\\text{CO}_2}} \\times 0.7,\\; 0,\\; 1\\right)")}</div>
      <p>Square root gives a perceptually gradual tint increase. Blended via OKLab toward an amber/brown target.</p>`),a("Vegetation Colours (PanoptesV)",`<p>2D lookup table mapping <b>spectral class &times; surface pressure</b> to pale/deep vegetation hex colours. Anchors at 1, 3, and 10 atm from PanoptesV radiative-transfer simulations across 10 spectral types (A0&ndash;M8).</p>
      <p>Interpolation uses bilinear OKLab blending in log-pressure space. Extrapolation beyond 10 atm and below 1 atm continues the nearest empirical trend with 50% dampening.</p>
      ${s("PanoptesV (panoptesv.com/SciFi) &mdash; Kiang (2007); Lehmer et al. (2021)")}`),a("Insolation Darkening",`<div class="sci-formula__eq">${t("f = \\text{clamp}\\!\\left(0.5 + 0.15\\log_2 S,\\; 0,\\; 1\\right)")}</div>
      <p>Low-light environments favour broader-spectrum absorption (darker pigments). Log&#8322; scaling gives smooth correction across orders of magnitude of insolation ${e("S")}.</p>`),a("Effective Pressure for Sky Colour","<p>The scale-height-adjusted effective pressure is used to index a sky colour lookup table derived from PanoptesV atmospheric data. This accounts for the fact that a low-gravity world with 1 atm surface pressure has a thicker optical column than Earth at 1 atm.</p>"),a("Rocky Planet Radiation Environment",`<p>Rocky planets now report a bounded radiation-environment context that keeps three effects separate: high-energy stellar forcing, atmospheric/ozone UV shielding, and magnetosphere charged-particle shielding.</p>
      <div class="sci-formula__eq">${t("H_{\\text{surface}} = 0.56\\,H_{\\text{particle}} + 0.44\\,H_{\\text{UV}}")}</div>
      <div class="sci-formula__eq">${t("P_{\\text{rad}} = 1 - 0.88\\,H_{\\text{surface}}")}</div>
      <p>${e("P_{\\text{rad}}")} is a habitability multiplier, not a physical dose. Dense atmospheres can shield particles even without a strong dynamo, ozone/photochemistry is needed for UV shielding, and magnetic fields mainly affect charged particles and aurora readiness.</p>
      ${s("NASA magnetosphere overview; NASA Ozone Watch; NASA Planetary Fact Sheets")}`),a("Coupled Science Contexts",`<p>Several engine subsystems now share the same bounded context objects instead of rebuilding separate page-local heuristics. Baseline/manual values remain visible; effective values are used only when the source context has enough confidence.</p>
      <div class="sci-formula__eq">${t("T_{\\text{effective}} = T_{\\text{baseline}} + \\Delta T_{\\text{chem/cloud}}")}</div>
      <p>The coupled climate pass can feed hydrosphere, habitability, productivity, population, atmosphere persistence, and observability. It is a single confidence-gated pass, not an iterative general circulation model.</p>
      <p><b>Atmosphere and stellar history:</b> source/sink, carbon-cycle, XUV/wind history, and photochemistry contexts add lifetime, water-loss, CO&#8322; tendency, and abiotic oxygen caveats without changing authored gas percentages.</p>
      <p><b>Small bodies:</b> debris disks, Oort-cloud injection, comets, and gas-giant architecture route into impact flux, crater retention, volatile delivery, ring/source persistence, and era timelines. These are source/tendency classes, not stochastic impact predictions.</p>
      <p><b>Nitrogen:</b> atmospheric N&#8322; can support background pressure and pressure broadening, while fixed-nitrogen availability can limit productivity. This is a nutrient and pressure-buffer screen, not evidence for biology or a full nitrogen cycle.</p>
      ${s("Kopparapu et al. (2013); Walker, Hays & Kasting (1981); Luger & Barnes (2015); Zahnle & Catling (2017); NASA Planetary Fact Sheets; Vitousek & Howarth (1991)")}`),a("Atmosphere Source-Sink Ledger",`<div class="sci-formula__eq">${t("I_{\\text{source}} = 1 - \\prod_i (1 - s_i), \\quad I_{\\text{sink}} = 1 - \\prod_j (1 - k_j)")}</div>
      <div class="sci-formula__eq">${t("B_{\\text{net}} = I_{\\text{source}} - I_{\\text{sink}}")}</div>
      <p>The atmosphere ledger is an order-of-magnitude source-sink diagnostic, not a mass-balance solver. It keeps the user's gas mix visible, then reports whether the surrounding context suggests a replenished, stable, declining, or rapidly lost atmosphere.</p>
      ${c(["Ledger side","Examples"],[["Sources","Volcanic outgassing, cryovolcanic outgassing, impact delivery, comet delivery, retained volatiles, composition volatile budgets, ocean buffering, radiolytic sputtered O<sub>2</sub>."],["Sinks","Jeans escape, XUV escape, wind stripping, pickup-ion loss, photolysis H escape, condensation collapse, weathering sequestration, surface adsorption, cold trapping."]])}
      <p>Each active source or sink contributes a bounded score. The combined source index and sink index use retained-product combination so multiple weak terms can matter without any single term forcing the result. The strongest terms are shown as the dominant source and dominant sink.</p>
      <p>Composition inventories can add C/N/S/H/O reservoir context, but the ledger does not assume every reservoir becomes atmospheric gas. Escape and wind terms remain confidence-bounded tendencies, especially for moons and active cool-star environments.</p>
      ${o([["s_i","Bounded source score for source term i"],["k_j","Bounded sink score for sink term j"],["B_{\\text{net}}","Net source-minus-sink balance used for trend labels"]])}
      ${s("Catling &amp; Kasting (2017), Atmospheric Evolution on Inhabited and Lifeless Worlds; Zahnle &amp; Catling (2017), ApJ 843, 122; Luger &amp; Barnes (2015), Astrobiology 15, 119")}`),a("Greenhouse Optical Depth from Gas Composition",`<p>Grey IR optical depth ${e("\\tau")} computed from gas partial pressures with Lorentz pressure broadening. Used in <b>Core</b> and <b>Full</b> modes.</p>
      <div class="sci-formula__eq">${t("\\text{pb} = P^{0.684}")}</div>
      <div class="sci-formula__eq">${t("\\tau_{\\text{CO}_2} = 0.503 \\cdot \\ln\\!\\left(1 + \\frac{p_{\\text{CO}_2}}{p_{\\text{ref}}}\\right) \\cdot \\text{pb}")}</div>
      <div class="sci-formula__eq">${t("\\tau_{\\text{H}_2\\text{O}} = 0.336 \\cdot \\ln\\!\\left(1 + \\frac{p_{\\text{H}_2\\text{O}}}{p_{\\text{ref}}}\\right) \\cdot \\text{pb} \\cdot \\omega")}</div>
      <div class="sci-formula__eq">${t("\\tau_{\\text{CH}_4} = 0.45 \\cdot \\sqrt{\\frac{p_{\\text{CH}_4}}{p_{\\text{ref}}}} \\cdot \\text{pb}")}</div>
      <div class="sci-formula__eq">${t("\\tau = \\tau_{\\text{CO}_2} + \\tau_{\\text{H}_2\\text{O}} + \\tau_{\\text{CH}_4}")}</div>
      ${o([["P","Total surface pressure (atm)"],["p_X","Partial pressure of gas X = P &times; X% / 100 (atm)"],["p_{\\text{ref}}","Reference partial pressure = 0.001 atm (linear&ndash;logarithmic transition scale)"],["\\text{pb}","Pressure-broadening factor (Robinson &amp; Catling 2012)"],["\\omega","CO&#8322;&ndash;H&#8322;O band overlap factor (see next formula)"]])}
      <p><b>Functional forms.</b> CO&#8322; and H&#8322;O use logarithmic scaling (band saturation at high concentrations; Myhre 1998, Pierrehumbert 2010 ch. 4). CH&#8324; uses square-root scaling (weaker absorber; IPCC TAR Table 6.2). The ${e("P^{0.684}")} exponent captures Lorentz pressure broadening of molecular absorption lines.</p>
      <p><b>Calibration.</b> The numerical coefficients (0.503, 0.336, 0.45) are <em>Caelum-derived fits</em> calibrated against NASA Planetary Fact Sheet surface temperatures, not taken from a single published source. They reproduce:</p>
      ${c(["Body","P (atm)","CO&#8322; %","H&#8322;O %","CH&#8324; %","&tau;","T<sub>surf</sub> (K)"],[["Earth","1.0","0.04","0.40","0","0.70","288"],["Venus","92","96.5","0","0","126","737"],["Mars","0.006","95.3","0","0","0.029","211"]])}
      <p>The greenhouse effect parameter used by the energy-balance model is ${e("G_h = \\tau / 0.5841")}.</p>
      ${s("Robinson &amp; Catling (2012) pressure broadening; Myhre (1998) CO&#8322; band saturation; IPCC TAR (2001) CH&#8324; square-root law. Coefficients: Caelum calibration.")}`),a("CO&#8322;&ndash;H&#8322;O Band Overlap Suppression",`<p>CO&#8322; and H&#8322;O share absorption in the 12&ndash;18 &mu;m and 4.3 &mu;m regions. When CO&#8322; is optically thick, those bands are already saturated and additional H&#8322;O contributes little extra opacity. This is modelled by an overlap factor applied to the H&#8322;O optical depth:</p>
      <div class="sci-formula__eq">${t("\\omega = \\frac{1}{1 + \\tau_{\\text{CO}_2} / k}")}</div>
      ${o([["\\omega","Overlap suppression factor (0 to 1)"],["\\tau_{\\text{CO}_2}","CO&#8322; optical depth (computed above)"],["k","Half-saturation constant = 6"]])}
      <p>At Earth conditions (${e("\\tau_{\\text{CO}_2} \\approx 0.18")}), ${e("\\omega \\approx 0.97")} &mdash; almost no suppression. At Venus conditions (${e("\\tau_{\\text{CO}_2} \\approx 126")}), ${e("\\omega \\approx 0.045")} &mdash; H&#8322;O contribution reduced by 95%.</p>
      <p><b>This is a Caelum-derived model.</b> The half-saturation form ${e("1/(1 + x/k)")} and the value ${e("k = 6")} were chosen to reproduce Venus&rsquo;s 737 K surface temperature when trace H&#8322;O (30 ppm) is included. The H&#8322;O coefficient was then re-fitted from 0.327 to 0.336 to recover Earth&rsquo;s 288 K. The physics justification is spectral band overlap, but the specific parameterisation is an empirical fit, not from a published radiative-transfer study.</p>`),a("Expert Gas Terms (Full Mode)",`<p>In <b>Full</b> mode, three additional absorbers are added to the core optical depth. SO&#8322; and NH&#8323; receive a core-opacity overlap factor: at high ${e("\\tau_{\\text{core}}")}, pressure-broadened CO&#8322; wings fill the atmospheric window, reducing their marginal contribution.</p>
      <div class="sci-formula__eq">${t("\\tau_{\\text{H}_2} = 3.0 \\cdot f_{\\text{H}_2} \\cdot f_{\\text{N}_2} \\cdot P^2")}</div>
      <div class="sci-formula__eq">${t("\\tau_{\\text{SO}_2} = \\frac{0.15 \\cdot \\ln\\!\\left(1 + \\frac{p_{\\text{SO}_2}}{p_{\\text{ref}}}\\right) \\cdot \\text{pb}}{1 + \\tau_{\\text{core}} / 8}")}</div>
      <div class="sci-formula__eq">${t("\\tau_{\\text{NH}_3} = \\frac{1.5 \\cdot \\sqrt{\\frac{p_{\\text{NH}_3}}{p_{\\text{ref}}}} \\cdot \\text{pb}}{1 + \\tau_{\\text{core}} / 20}")}</div>
      <div class="sci-formula__eq">${t("\\tau_{\\text{total}} = \\tau_{\\text{core}} + \\tau_{\\text{H}_2} + \\tau_{\\text{SO}_2} + \\tau_{\\text{NH}_3}")}</div>
      ${o([["f_{\\text{H}_2},\\; f_{\\text{N}_2}","Volume fractions (0&ndash;1) of H&#8322; and N&#8322;"],["P","Total surface pressure (atm)"],["\\text{pb}","Pressure-broadening factor = P<sup>0.684</sup>"],["\\tau_{\\text{core}}","&tau;<sub>CO&#8322;</sub> + &tau;<sub>H&#8322;O</sub> + &tau;<sub>CH&#8324;</sub> (computed from core gases)"]])}
      <p><b>H&#8322;&ndash;N&#8322; collision-induced absorption (CIA).</b> H&#8322; is homonuclear and lacks a permanent dipole, but collisions with N&#8322; induce a transient dipole that absorbs in the thermal IR. The opacity scales with the product of both number densities and ${e("P^2")} (collision rate). At 10% H&#8322;, 90% N&#8322;, 1 bar this gives ${e("\\tau \\approx 0.27")} (&sim;12 K warming). H&#8322;&ndash;N&#8322; CIA is a broadband mechanism (not a line absorber) and does not receive overlap suppression.</p>
      <p><b>SO&#8322;</b> has strong absorption bands at 7.3 and 8.7 &mu;m. Logarithmic scaling (like CO&#8322;) but with a weaker coefficient reflecting its narrower band coverage. The overlap denominator (${e("k = 8")}) suppresses SO&#8322; when the core gases are already optically thick &mdash; at Venus conditions (${e("\\tau_{\\text{core}} \\approx 127")}), SO&#8322; retains only &sim;6% of its raw contribution.</p>
      <p><b>NH&#8323;</b> is a potent absorber at 10.5 &mu;m (within the atmospheric window). Square-root scaling (like CH&#8324;) captures its sub-linear saturation behaviour. The larger overlap constant (${e("k = 20")}) reflects the fact that the 10.5 &mu;m window is less affected by CO&#8322; pressure broadening than the SO&#8322; bands.</p>
      <p><b>He</b> has no IR absorption and contributes ${e("\\tau = 0")}. It only affects the mean molecular weight (0.004 kg/mol), atmospheric density, and scale height.</p>
      <p><b>Overlap constants are Caelum-derived.</b> The values ${e("k_{\\text{SO}_2} = 8")} and ${e("k_{\\text{NH}_3} = 20")} were calibrated so that Venus in Full mode (with NASA trace gases) matches the 737 K surface temperature. The physics basis is that pressure-broadened CO&#8322; wings extend beyond 15 &mu;m into the atmospheric window at high pressures, but the specific ${e("k")} values are empirical fits.</p>
      ${s("H&#8322;&ndash;N&#8322; CIA: Wordsworth &amp; Pierrehumbert (2013), Science 339. SO&#8322; and NH&#8323; coefficients and overlap constants: Caelum calibration.")}`),a("Jeans Escape Parameter",`<p>For each gas species with molar mass ${e("M")} (kg/mol), the Jeans escape parameter ${e("\\lambda")} determines whether the gas can be retained against thermal escape over geological time:</p>
      <div class="sci-formula__eq">${t("\\lambda = \\frac{v_{\\text{esc}}^2 \\cdot M}{2\\,R\\,T_{\\text{exo}}}")}</div>
      ${o([["v_{\\text{esc}}","Surface escape velocity (m/s)"],["M","Molar mass of gas species (kg/mol)"],["R","Universal gas constant = 8.3145 J/(mol&middot;K)"],["T_{\\text{exo}}","Exobase temperature (K)"]])}
      ${c(["\\u03BB range","Status","Meaning"],[["\\u2265 6","Retained","Firmly held over geological time (> 4.5 Gyr)"],["3 &ndash; 6","Marginal","Slow escape; may be lost on Gyr timescales"],["< 3","Lost","Rapid thermal escape (lost within ~100 Myr)"]])}
      <p>These are the base thresholds for standard Jeans thermal escape. H&#8322; and He use enhanced thresholds that account for non-thermal loss (see Non-Thermal Escape Enhancement below).</p>
      <p>When the Atmospheric Escape toggle is enabled, gases classified as &ldquo;Lost&rdquo; are zeroed before computing greenhouse effect, partial pressures, and density.</p>
      ${s("Jeans (1925), The Dynamical Theory of Gases. Hunten (1973), J. Atmos. Sci. 30. Catling &amp; Zahnle (2009), Sci. Am. 300.")}`),a("Exobase Temperature",`<p>The exobase temperature is estimated from the equilibrium temperature (without greenhouse) plus XUV-driven thermospheric heating, countered by CO&#8322; radiative cooling and a pressure-dependent absorption term:</p>
      <div class="sci-formula__eq">${t("T_{\\text{exo}} = \\min\\!\\left(T_{\\text{eq}} \\cdot \\left(1 + \\frac{3.0\\;\\eta_{\\text{abs}}\\,\\sqrt{F_{\\text{XUV}} / F_0}}{1 + 100\\,P\\,f_{\\text{CO}_2}}\\right),\\; 5000\\right)")}</div>
      <div class="sci-formula__eq">${t("\\eta_{\\text{abs}} = \\frac{P}{P + P_{1/2}}")}</div>
      ${o([["T_{\\text{eq}}","Equilibrium temperature without greenhouse (K)"],["\\eta_{\\text{abs}}","XUV absorption efficiency (Beer-Lambert saturation)"],["P_{1/2}","Half-absorption pressure = 0.06 atm"],["F_{\\text{XUV}}","XUV flux at the planet's orbit (erg cm&#8315;&#178; s&#8315;&#185;)"],["F_0","Present-day solar XUV at 1 AU = 4.64 erg cm&#8315;&#178; s&#8315;&#185;"],["P","Surface pressure (atm)"],["f_{\\text{CO}_2}","CO&#8322; volume fraction (0&ndash;1)"]])}
      <p>Thin atmospheres (P &lt;&lt; 0.06 atm) lack sufficient column density to absorb the full XUV flux, so &eta;<sub>abs</sub> &rarr; 0 and the exobase stays near T<sub>eq</sub>. The 5000 K cap represents hydrodynamic blowoff.</p>
      <p><b>Calibration:</b></p>
      ${c(["Body","T<sub>eq</sub> (K)","F/F<sub>0</sub>","P (atm)","&eta;<sub>abs</sub>","T<sub>exo</sub> (K)","Observed"],[["Earth","254","1.0","1.0","0.94","~944","700&ndash;1400"],["Venus","229","1.9","92","1.00","~229","250&ndash;300"],["Mars","210","0.43","0.006","0.09","~233","200&ndash;350"],["Pluto","32","0.0006","10&#8315;&#8309;","&lt;0.001","~32","~65&ndash;70"]])}
      <p><b>Caelum-derived model.</b> The coefficient 3.0 is calibrated to reproduce Earth's ~1000 K exobase temperature. The CO&#8322; cooling term captures the efficient 15 &mu;m radiative cooling that suppresses thermospheric heating on Venus. The &eta;<sub>abs</sub> term corrects for thin atmospheres (Mars, Pluto) that let most XUV pass through unabsorbed.</p>`),a("XUV Flux (Ribas et al. 2005)",`<div class="sci-formula__eq">${t("F_{\\text{XUV}} = F_0 \\cdot L_\\star \\cdot \\left(\\frac{t}{4.6\\,\\text{Gyr}}\\right)^{-1.23} \\cdot \\frac{1}{d^2}")}</div>
      ${o([["F_0","Present-day solar XUV at 1 AU = 4.64 erg cm&#8315;&#178; s&#8315;&#185;"],["L_\\star","Stellar luminosity (L&#9737;)"],["t","Stellar age (Gyr)"],["d","Orbital distance (AU)"]])}
      <p>Young stars have stronger XUV emission, decaying as a power law with exponent &minus;1.23. This is the same formula used for gas giant atmospheric mass loss.</p>
      ${s("Ribas et al. (2005), ApJ 622, 680 &mdash; Evolution of the Solar Activity over Time.")}`),a("Non-Thermal Escape Enhancement",`<p>Pure Jeans (thermal) escape underestimates loss of light gases from warm terrestrial planets. Charge exchange with stellar-wind protons, polar wind escape through magnetic cusps, and ion pickup by the stellar wind all strip H&#8322; and He regardless of whether the body has a magnetic field.</p>
      <p>Research shows magnetised and unmagnetised planets lose atmosphere at similar rates. These non-thermal channels effectively raise the retention threshold for the two lightest species:</p>
      ${c(["Gas","Factor","Lost","Marginal","Retained"],[["H&#8322;","&times;3.0","&lambda; < 9","9 &le; &lambda; < 18","&lambda; &ge; 18"],["He","&times;5.0","&lambda; < 15","15 &le; &lambda; < 30","&lambda; &ge; 30"],["Others","&times;1.0","&lambda; < 3","3 &le; &lambda; < 6","&lambda; &ge; 6"]])}
      <p>The enhancement only applies when T<sub>exo</sub> &gt; 100 K. Beyond ~10 AU, stellar wind flux is negligible and standard Jeans thermal escape dominates.</p>
      <p><b>Calibration:</b> Earth H&#8322; (&lambda; &asymp; 16) is correctly classified as Marginal &mdash; present in trace amounts but slowly escaping via polar wind. Mars H&#8322; and He are Marginal. Mercury and Ceres lose all light gases.</p>
      ${s("Gunell et al. (2018), A&amp;A 614, L3 &mdash; Why an intrinsic magnetic field does not protect a planet against atmospheric escape. Gronoff et al. (2020), JGR Space Physics 125 &mdash; Atmospheric Escape Processes and Planetary Atmospheric Evolution.")}`)].join("")}function Be(){return[a("Temperature at Latitude",`<div class="sci-formula__eq">${t("T(\\phi) = T_{\\text{eq}} - G\\,\\sin^2\\phi")}</div>
      <div class="sci-formula__eq">${t("T_{\\text{eq}} = T_{\\text{global}} + G/3")}</div>
      ${o([["\\phi","Latitude (radians)"],["T_{\\text{eq}}","Equatorial mean temperature"],["G","Equator-to-pole temperature gradient (K)"]])}`),a("Equator&ndash;Pole Gradient",`<div class="sci-formula__eq">${t("G = \\frac{60}{1 + 0.8\\,P/\\sqrt{g}}")}</div>
      <p>Higher surface pressure and lower gravity increase atmospheric heat redistribution,
      reducing the gradient. ${e("P")} in atm, ${e("g")} in m/s&sup2;. Clamped to [1, 80] K.</p>`),a("Seasonal Amplitude",`<div class="sci-formula__eq">${t("A = \\frac{15\\,\\sin\\phi \\cdot (\\varepsilon / 23.44\xB0)}{1 + 0.3\\,P/\\sqrt{g}}\\;\xB0\\text{C}")}</div>
      <p>Peak-to-mean seasonal temperature swing at each latitude. Scales linearly with axial tilt
      ${e("\\varepsilon")} relative to Earth&rsquo;s 23.44&deg;; damped by atmospheric mass.</p>`),a("Moisture Index",`<p>Zonal model based on atmospheric circulation cells:</p>
      ${c(["Zone","Base moisture"],[["Hadley equatorial (lat &lt; 0.7&times;cell)","0.9 &minus; 0.75&times;fraction"],["Hadley subsidence edge","0.15"],["Ferrel warm-coast","0.70"],["Ferrel cold-coast","0.45"],["Ferrel general","0.55"],["Polar","0.20"]])}
      <p>Scaled by water regime (0.1 for dry, 1.0 for ocean worlds) and surface H&#8322;O fraction.</p>`),a("K&ouml;ppen Decision Tree",`<p>Classification from warmest-month (${e("T_w")}), coldest-month (${e("T_c")}), and moisture index (${e("m")}):</p>
      ${c(["Class","Condition"],[["EF (ice cap)","T<sub>w</sub> &lt; 0 &deg;C"],["ET (tundra)","0 &le; T<sub>w</sub> &lt; 10 &deg;C"],["BW (desert)","m &lt; 0.25"],["BS (steppe)","0.25 &le; m &lt; 0.45"],["Af (tropical wet)","T<sub>c</sub> &ge; 18 &deg;C, m &ge; 0.75"],["Am (monsoon)","T<sub>c</sub> &ge; 18 &deg;C, 0.55 &le; m &lt; 0.75"],["Aw (savanna)","T<sub>c</sub> &ge; 18 &deg;C, m &lt; 0.55"],["D (continental)","T<sub>c</sub> &lt; &minus;3 &deg;C, T<sub>w</sub> &ge; 10"],["C (temperate)","Remainder with T<sub>w</sub> &ge; 10 &deg;C"]])}
      <p>Temperature subtypes: a (T<sub>w</sub> &ge; 22), b (&ge; 15), c (default), d (T<sub>c</sub> &lt; &minus;38).</p>
      ${s("K\xF6ppen (1884); Peel, Finlayson &amp; McMahon (2007)")}`),a("Tidally Locked Zones",`<p>For synchronously rotating planets, three climate zones replace latitude bands:</p>
      <div class="sci-formula__eq">${t("T_{\\text{sub}} = T_g\\,(1 + 0.3 / (1 + 0.5P))")}</div>
      <div class="sci-formula__eq">${t("T_{\\text{term}} = T_g\\,(0.85 + 0.15\\,\\min(P/2,\\,1))")}</div>
      <div class="sci-formula__eq">${t("T_{\\text{anti}} = T_g\\,(0.5 + 0.3\\,\\min(P/2,\\,1))")}</div>
      <p>Higher surface pressure (${e("P")} in atm) increases heat redistribution, warming the terminator
      and antistellar point while cooling the substellar point.</p>`),a("Cloud, Circulation, And Carbon-Cycle Context",`<div class="sci-formula__eq">${t("\\Delta T_{\\text{cloud}} = -\\mathrm{clamp}(4.2A_c + 3.2S_c,\\,0,\\,8)")}</div>
      <div class="sci-formula__eq">${t("\\Theta_{\\text{carb}} = \\min(W,\\,V,\\,R)\\,(0.55 + 0.45B)\\,C")}</div>
      <div class="sci-formula__eq">${t("T_f = 273.15\\text{ K} - \\min(45,\\,0.55S + 1.35A)")}</div>
      <p>Caelum treats clouds and carbonate-silicate cycling as bounded context layers. Cloud/circulation uses pressure, exposed water, temperature, rotation, tidal lock state, stellar flux, haze opacity, and collapse risk to estimate cloud fraction, substellar-cloud likelihood, heat redistribution, and a small diagnostic albedo-cooling term.</p>
      <p>The carbon-cycle context is a tendency model, not a solved atmospheric CO<sub>2</sub> history. It combines exposed-rock weathering, limited seafloor weathering, CO<sub>2</sub> availability, volcanic supply, tectonic recycling, climate state, and high-pressure-ice caveats into a thermostat-strength diagnostic.</p>
      <p>The ocean-chemistry context adds salinity/ammonia freezing-point depression, carbonate buffering, acidity class, rock-ocean access, and hydrothermal/nutrient support. Salinity is consumed from explicit moon inputs when available; otherwise it is inferred only as a low-confidence class from water inventory and ocean depth.</p>
      <p>Biosignature context is deliberately non-diagnostic of life. O<sub>2</sub>/O<sub>3</sub>, CH<sub>4</sub>, CO, organic haze, redox state, atmosphere source-sink balance, ocean sinks, and stellar UV/XUV are combined into false-positive risk, disequilibrium strength, and source-demand language. O<sub>2</sub>+CH<sub>4</sub> means a replenishing source is required; it does not identify biology.</p>
      <p>The era timeline consumes these source contexts as chronology evidence: high-XUV and wind-compression intervals, atmosphere source-sink trends, haze-rich anoxic chemistry, bounded climate forcing, carbon-cycle limits, ocean-chemistry constraints, and biosignature-context cautions. Timeline rows are confidence-labelled context summaries, not independent climate histories or life claims.</p>
      <p>World snapshots and the visualizer reuse the same solved source contexts for star forcing, planet forcing, gas-giant magnetospheres, moon radiation, and era timelines, so read-only views remain aligned with the engine instead of rebuilding separate science summaries.</p>
      <p>Dry, airless, deep-ocean, or high-pressure-ice worlds are deliberately limited. Stagnant-lid planets can still outgas, but they do not receive an Earth-like mobile-lid recycling bonus. Icy ocean moons can report rock-ocean chemistry potential without being treated as exposed-land weathering worlds.</p>
      ${o([["A_c","Cloud-albedo effect"],["S_c","Substellar cloud-deck likelihood"],["S","Ocean salinity percent by mass"],["A","Ocean ammonia percent by mass"],["W","Weathering efficiency"],["V","Volcanic/outgassing supply"],["R","Tectonic recycling efficiency"],["B","Weathering/outgassing balance term"],["C","Extreme-climate penalty"]])}
      ${s("Yang, Cowan &amp; Abbot (2013), ApJ 771, L45; Walker, Hays &amp; Kasting (1981), JGR 86, 9776; Berner (2004), The Phanerozoic Carbon Cycle; Foley (2015), ApJ 812, 36; Cullum, Stevens &amp; Joshi (2016), Astrobiology 16, 763; Meadows et al. (2018), Astrobiology 18, 630; Luger &amp; Barnes (2015), Astrobiology 15, 119; Krissansen-Totton et al. (2018), Science Advances 4, eaao5747; Thompson et al. (2022), PNAS 119, e2117933119")}`),a("Environmental Lapse Rate",`<div class="sci-formula__eq">${t("\\frac{dT}{dz} = -6.5\\;\xB0\\text{C/km}")}</div>
      <p>ISA standard tropospheric lapse rate, applied to altitude-adjusted temperatures for
      elevated terrain. Used for all climate zone calculations.</p>`)].join("")}function De(){return[a("Power-Law Flare Rate",`<div class="sci-formula__eq">${t("N(> E) = N_{32} \\left(\\frac{E}{10^{32} \\text{ erg}}\\right)^{-\\alpha}")}</div>
      <p>Cumulative flare frequency distribution: expected flares per day with energy above ${e("E")}.</p>
      ${c(["Spectral bin","T<sub>eff</sub> (K)","Old","Mid","Young","&alpha;"],[["FGK","&ge; 3900","0.05","0.25","1.0","1.8"],["Early M","3200&ndash;3900","0.5","2.0","8.0","2.0"],["Late M","&lt; 3200","2.0","8.0","30.0","2.2"]])}
      ${s("Gunther et al. (2020) TESS superflare rates; Lacy et al. (1976) power-law")}
      <div class="sci-try">
        <div class="sci-try__title">Try it</div>
        <div class="sci-try__row">
          <label>T<sub>eff</sub> <span class="unit">K</span></label>
          <input id="sci-flare-temp" type="number" value="5776" min="2000" max="10000" step="100" />
          <input id="sci-flare-temp-slider" type="range" />
        </div>
        <div class="sci-try__row">
          <label>Age <span class="unit">Gyr</span></label>
          <input id="sci-flare-age" type="number" value="4.6" min="0.01" max="13" step="0.1" />
          <input id="sci-flare-age-slider" type="range" />
        </div>
        <div class="sci-try__output">
          <span class="sci-try__label">N<sub>32</sub> / &alpha;</span>
          <span class="sci-try__value" id="sci-flare-result">&mdash;</span>
        </div>
      </div>`),a("Inverse-CDF Energy Sampling",`<div class="sci-formula__eq">${t("E = \\left[E_{\\min}^{-\\alpha} - u\\left(E_{\\min}^{-\\alpha} - E_{\\max}^{-\\alpha}\\right)\\right]^{-1/\\alpha}")}</div>
      <p>Inverse transform sampling of a truncated power-law distribution. ${e("u \\in (0,1)")} uniform random. Efficiently draws random flare energies without rejection.</p>`),a("Poisson Waiting Time",`<div class="sci-formula__eq">${t("\\Delta t = -\\frac{\\ln(1-u)}{\\lambda}")}</div>
      <p>Time until next flare event drawn from an exponential distribution. Models flares as a Poisson process with mean rate ${e("\\lambda")} per second.</p>`),a("CME Association Probability",`<p>Energy-dependent step function based on solar flare&ndash;CME associations:</p>
      ${c(["Flare energy (erg)","P(CME)"],[["&lt; 10&sup3;&sup2;","0.005"],["10&sup3;&sup2; &ndash; 10&sup3;&sup3;","0.12"],["10&sup3;&sup3; &ndash; 10&sup3;&sup4;","0.4"],["&gt; 10&sup3;&sup4;","0.75"]])}
      <p>Base probability is modulated by a soft-suppression factor at high N&#8323;&#8322; and a saturation limiter
      that prevents CME rate from exceeding the activity-cycle target.</p>
      ${s("Yashiro et al. (2006) flare-CME association rates; probabilities Caelum-calibrated")}`),a("CME Rate from Activity Cycle",`<div class="sci-formula__eq">${t("\\text{rate} = 0.5 + 5.5t \\text{ CME/day}")}</div>
      <p>Linear interpolation from solar minimum (0.5/day) to maximum (6.0/day), ${e("t \\in [0,1]")}.</p>`),a("Flare Rate Reference Table (N&#8323;&#8322;)",`<p>Flares per day above ${e("10^{32}")} erg, binned by spectral class and stellar age:</p>
      ${c(["Spectral bin","Old","Mid","Young","&alpha;"],[["FGK (T &ge; 3900 K)","0.05","0.25","1.0","1.8"],["Early M (3200&ndash;3900 K)","0.5","2.0","8.0","2.0"],["Late M (&lt; 3200 K)","2.0","8.0","30.0","2.2"]])}
      <p>Age band boundaries differ by spectral type: FGK old &ge; 2 Gyr, early-M old &ge; 4 Gyr,
      late-M old &ge; 6 Gyr. The power-law index ${e("\\alpha")} steepens for cooler stars,
      meaning their energy distribution is more bottom-heavy.</p>
      ${s("G\xFCnther et al. (2020) TESS superflare rates; binning Caelum")}`),a("Flare Cycle Multiplier",`<p>Flare rate is modulated by an 11-year-analogue activity cycle. At cycle phase ${e("\\phi \\in [0,1]")}:</p>
      ${c(["Spectral bin","Min (&phi;=0)","Mid (&phi;=0.5)","Max (&phi;=1)"],[["FGK","0.35","1.0","1.65"],["Early M","0.6","1.0","1.4"],["Late M","0.75","1.0","1.25"]])}
      <p>Cooler stars have a smaller cycle amplitude, consistent with
      observations that M-dwarf activity varies less over magnetic cycles.</p>`)].join("")}function We(){return[a("Local Day Scale",`<div class="sci-formula__eq">${t("\\text{scale} = \\frac{P_{\\text{rot}}}{24}")}</div>
      <div class="sci-formula__eq">${t("\\text{local year} = \\frac{P_{\\text{orb}}}{\\text{scale}} \\text{ local days}")}</div>
      <p>Converts Earth-day orbital periods into the number of planetary rotations per year.</p>`),a("Continued-Fraction Leap Cycles",`<p>A year is rarely an exact number of days. The fractional leftover must be corrected with <b>leap days</b>, or the calendar drifts out of sync with the seasons. The continued-fraction algorithm finds the best correction cycles &mdash; each one trading simplicity for accuracy.</p>
      <div class="sci-formula__eq">${t("f = \\cfrac{1}{a_1 + \\cfrac{1}{a_2 + \\cfrac{1}{a_3 + \\cdots}}}")}</div>
      <p>Each convergent ${e("p/q")} means: <b>add ${e("p")} leap days every ${e("q")} years</b>. Earlier entries are simpler but less accurate; later entries are more precise but harder to remember.</p>
      <p><b>Earth example</b> (365.2422 days, fractional part 0.2422):</p>
      <ul style="font-size:13px;color:var(--muted);margin:4px 0 8px 18px;line-height:1.6">
        <li><b>1/4</b> &mdash; 1 leap day every 4 years (Julian calendar). Simple, but drifts ~1 day per 128 years.</li>
        <li><b>8/33</b> &mdash; 8 leap days every 33 years (Iranian/Persian calendar). Much more accurate: drifts ~1 day per 4,000 years.</li>
        <li><b>97/400</b> &mdash; 97 leap days every 400 years (Gregorian calendar). The &ldquo;divisible by 4, except centuries, except 400s&rdquo; rule. Drifts ~1 day per 8,000 years.</li>
      </ul>
      <p>For alien worlds, the fractional part may be very different from Earth&rsquo;s, so the algorithm generates whichever cycles best fit that world&rsquo;s year length. A worldbuilder typically picks the simplest cycle whose drift is acceptable.</p>
      <div class="sci-try">
        <div class="sci-try__title">Try it</div>
        <div class="sci-try__row">
          <label>Year length <span class="unit">local days</span></label>
          <input id="sci-leap-len" type="number" value="365.2422" min="1" max="9999" step="0.0001" />
        </div>
        <div class="sci-try__output" id="sci-leap-output">
          <span class="sci-try__label">Leap cycles</span>
          <span class="sci-try__value" id="sci-leap-result">&mdash;</span>
        </div>
      </div>`),a("Leap Rule Application",`<div class="sci-formula__eq">${t("\\text{active} = (y - \\text{offset}) \\bmod \\text{cycle} = 0")}</div>
      <p>A leap rule fires when the year minus its starting offset is divisible by the cycle length.</p>`),a("Moon Phase Illumination",`<div class="sci-formula__eq">${t("I = \\frac{1}{2}\\left(1 - \\cos\\!\\left(\\frac{2\\pi \\cdot \\text{age}}{P_{\\text{syn}}}\\right)\\right)")}</div>
      <p>Fraction of the moon&rsquo;s visible disk illuminated. 0 at new moon, 1 at full moon. Divided into 8 named phases at 1/16-period boundaries.</p>`),a("Year Start Weekday",`<div class="sci-formula__eq">${t("w_y = \\left(w_1 + \\sum_{i=1}^{y-1} L_i\\right) \\bmod D_w")}</div>
      <p>Day-of-week index for year ${e("y")}, where ${e("L_i")} is the length of year ${e("i")} and ${e("D_w")} is days per week. Computed in O(rules) time by counting leap rule firings.</p>`)].join("")}function Ke(){return[a("Neighbourhood Volume",`<div class="sci-formula__eq">${t("V = \\frac{4}{3}\\pi R^3")}</div>
      <p>Spherical volume of radius ${e("R")} in light-years. Total stellar objects: ${e("N = \\rho \\cdot V")} where ${e("\\rho")} defaults to 0.004 ly&supmin;&sup3; (HIPPARCOS solar neighbourhood).</p>`),a("Population Fractions",`<p>Stellar object composition based on the 10 pc solar-neighbourhood census:</p>
      ${c(["Category","Fraction"],[["Main-sequence stars","72%"],["White dwarfs","6%"],["Brown dwarfs","19%"],["Other (giants, subdwarfs)","3%"]])}
      ${s("Reyle et al. (2021) solar-neighbourhood census; RECONS 10 pc survey")}`),a("Galactic Habitable Zone (GHZ)",`<div class="sci-formula__eq">${t("P = \\exp\\!\\left(-\\frac{1}{2}\\left(\\frac{r - 0.53R}{0.1R}\\right)^2\\right)")}</div>
      ${o([["r","Distance from galactic centre (ly)"],["R","Galaxy radius (ly)"]])}
      <p>Gaussian peaked at 53% of galactic radius, &sigma; = 10%. Hard band: 47%&ndash;60% of R.</p>
      ${s("Lineweaver et al. (2004) Galactic Habitable Zone")}
      <div class="sci-try">
        <div class="sci-try__title">Try it</div>
        <div class="sci-try__row">
          <label>Galaxy radius <span class="unit">ly</span></label>
          <input id="sci-ghz-r" type="number" value="52850" min="1000" max="200000" step="100" />
        </div>
        <div class="sci-try__row">
          <label>Location <span class="unit">ly from centre</span></label>
          <input id="sci-ghz-loc" type="number" value="27000" min="0" max="200000" step="100" />
        </div>
        <div class="sci-try__output">
          <span class="sci-try__label">GHZ probability</span>
          <span class="sci-try__value" id="sci-ghz-result">&mdash;</span>
        </div>
      </div>`),a("Metallicity Gradient",`<div class="sci-formula__eq">${t("[\\text{Fe/H}] = [\\text{Fe/H}]_\\odot + \\Delta R \\cdot g_R + |z| \\cdot g_z + \\delta_{\\text{class}} + \\mathcal{N}(0,\\,\\sigma)")}</div>
      ${o([["g_R","Radial gradient: &minus;0.06 dex/kpc (Luck &amp; Lambert 2011)"],["g_z","Vertical gradient: &minus;0.30 dex/kpc (Schlesinger et al. 2014)"],["\\delta_{\\text{class}}","Spectral-class shift (e.g. white dwarfs &minus;0.15 dex)"],["\\sigma","Scatter &sigma; = 0.20 dex"]])}
      <p>Clamped to [&minus;3.0,&thinsp;+0.5]. ${e("\\Delta R")} is the radial offset from the solar galactocentric distance.</p>
      ${s("Luck &amp; Lambert (2011); Schlesinger et al. (2014)")}`),a("Multiplicity (Stars per System)",`<div class="sci-formula__eq">${t("\\bar{n} = 1 + f_b + 2f_t + 3f_q")}</div>
      <p>Average stars per system from binary (${e("f_b")}), triple (${e("f_t")}), and quadruple (${e("f_q")}) fractions, weighted by spectral class.</p>
      ${c(["Class","Binary","Triple","Quadruple"],[["O","0.70","0.12","0.05"],["B","0.50","0.09","0.04"],["A","0.45","0.08","0.03"],["F","0.46","0.08","0.03"],["G","0.46","0.08","0.03"],["K","0.35","0.05","0.02"],["M","0.27","0.03","0.01"],["WD","0.25","0.02","0.005"],["L/T/Y","0.15","0.01","0.003"]])}
      ${s("Duch&ecirc;ne &amp; Kraus (2013) multiplicity survey")}`),a("Park-Miller PRNG",`<div class="sci-formula__eq">${t("s_{n+1} = 48271 \\cdot s_n \\mod (2^{31} - 1)")}</div>
      <p>Minimal standard linear congruential generator. Modulus 2&sup3;&sup1;&minus;1 (Mersenne prime). Output: ${e("u = s / (2^{31}-1) \\in (0,1)")}.</p>`),a("Disk Z-Scale",`<div class="sci-formula__eq">${t("z = \\max\\!\\left(0.15,\\; 1 - \\frac{R - 50}{1000}\\right) \\quad (R > 50 \\text{ ly})")}</div>
      <p>Galactic disk flattening for large neighbourhood radii. At 50 ly the neighbourhood is spherical; at 500 ly z &asymp; 0.55; floors at 0.15.</p>`)].join("")}function ze(){return[a("Ocean Fraction by Water Regime",`${c(["Water regime","Ocean fraction"],[["Dry","0%"],["Shallow oceans","50%"],["Extensive oceans","71%"],["Global ocean","90%"],["Deep ocean","95%"],["Ice world","0%"]])}
      <p>Determines the land area available for settlement: ${e("A_{\\text{land}} = 4\\pi R^2 \\cdot (1 - f_{\\text{ocean}})")}.</p>`),a("Habitability Fraction",`<p>Fraction of land area that is habitable, computed by latitude-weighted spherical area:</p>
      <div class="sci-formula__eq">${t("f_{\\text{hab}} = \\frac{\\sum_{\\text{habitable}} |\\sin\\phi_2 - \\sin\\phi_1|}{\\sum_{\\text{all}} |\\sin\\phi_2 - \\sin\\phi_1|}")}</div>
      <p>K&ouml;ppen classes E (polar) and X (uninhabitable) are excluded.</p>`),a("Productivity And Nitrogen Limiting Factors",`<div class="sci-formula__eq">${t("P_{\\text{prod}} = \\min(S_{\\text{climate}}, S_{\\text{light}}, S_{\\text{solvent}}, S_{\\text{nutrients}}, S_{\\text{carbon}}, S_{\\text{oxygen}}, S_{\\text{radiation}}, S_{\\text{pressure}})\\,(0.55 + 0.45A_{\\text{surface}})")}</div>
      <p>Primary productivity is treated as a limiting-factor screen. It estimates environmental potential only; it does not assert life, ecology, agriculture, or biosignatures.</p>
      ${c(["Limiter","What it represents"],[["Climate","How much of the surface climate is clement enough for active chemistry."],["Light","Surface light after stellar flux, haze, cloud, and atmospheric attenuation."],["Solvent","Accessible liquid water or subsurface-liquid pathway."],["Nutrients","Ocean chemistry support and fixed-nitrogen availability."],["Carbon","CO<sub>2</sub> availability and carbon-cycle context."],["Oxygenation","O<sub>2</sub> and N<sub>2</sub> support for aerobic-style surface complexity."],["Radiation","Surface protection after atmosphere, ozone/photochemistry, and magnetic shielding."],["Pressure","Whether the atmosphere provides enough working pressure for surface processes."]])}
      <p>Nitrogen is split into three roles. Bulk N<sub>2</sub> can provide background pressure, N<sub>2</sub> plus greenhouse gases can support pressure broadening, and fixed nitrogen controls nutrient availability. A large N<sub>2</sub> reservoir is therefore not automatically usable biology.</p>
      ${o([["S_x","Bounded score for each environmental limiter"],["A_{\\text{surface}}","Land/ocean surface-area opportunity factor"]])}
      ${s("Vitousek &amp; Howarth (1991), Biogeochemistry 13, 87; Kasting &amp; Catling (2003), ARAA 41, 429; Catling &amp; Kasting (2017)")}`),a("Carrying Capacity",`<div class="sci-formula__eq">${t("K = A \\cdot d \\cdot \\frac{1 + (C_e - 1)\\,f_c}{1 + (C_e - 1) \\cdot 0.77}")}</div>
      ${o([["A","Habitable land area (km&sup2;)"],["d","Tech-era population density (people/km&sup2;)"],["C_e","Crop efficiency = 4&times; (crops feed more than livestock)"],["f_c","Crop fraction; 0.77 = Earth reference"]])}
      ${c(["Era","Density (km&sup2;)","Growth (%/yr)"],[["Hunter-Gatherer","0.05","0.5"],["Neolithic","2","0.8"],["Bronze Age","8","1.0"],["Iron Age","15","1.0"],["Medieval","30","1.0"],["Early Industrial","80","1.5"],["Industrial","200","2.0"],["Post-Industrial","400","0.5"],["Sci-Fi High","1000","0.3"]])}`),a("Logistic Growth (Verhulst)",`<div class="sci-formula__eq">${t("P(t) = \\frac{K}{1 + \\frac{K - P_0}{P_0}\\,e^{-rt}}")}</div>
      ${o([["K","Carrying capacity"],["P_0","Initial population"],["r","Growth rate (per year)"],["t","Time (years)"]])}
      <p>Doubling time: ${e("t_d = \\ln 2 / r")}. Saturation: ${e("P/K \\times 100\\%")}.</p>
      ${s("Verhulst (1838), Correspondance math&eacute;matique et physique")}`),a("Zipf Rank&ndash;Size Distribution",`<div class="sci-formula__eq">${t("P(\\text{rank}) = \\frac{P(1)}{\\text{rank}^q}, \\quad P(1) = \\frac{P_{\\text{total}}}{H(n,q)}")}</div>
      <p>${e("H(n,q) = \\sum_{i=1}^{n} 1/i^q")} is the generalised harmonic number. The exponent
      ${e("q")} controls inequality: ${e("q=1")} gives classic Zipf&rsquo;s law.</p>
      ${s("Zipf (1949), Human Behavior and the Principle of Least Effort")}`)].join("")}function Ve(){return[a("Water-Aware Radius (Zeng & Sasselov 2016)",`<div class="sci-formula__eq">${t("R = R_{\\text{dry}} \\cdot \\left(1 + \\left(\\frac{R_{50}}{R_{\\text{ref}}} - 1\\right) \\cdot \\min\\!\\left(\\frac{\\text{WMF}}{0.5},\\;1\\right)\\right)")}</div>
      <p>Interpolates between a dry (Earth-like) mass-radius curve and the 50%-water curve from Zeng &amp; Sasselov (2016, ApJ 819, 127). When WMF = 0 the result equals ${e("R_{\\text{dry}}")} exactly.</p>
      ${o([["R_{\\text{dry}}","Radius from the CMF-based density formula (unchanged)"],["R_{50} = 1.38\\,M^{0.263}","Zeng 50%-water mass-radius curve"],["R_{\\text{ref}} = 1.00\\,M^{0.270}","Zeng Earth-like dry mass-radius curve"],["\\text{WMF}","Water mass fraction (0&ndash;0.5)"]])}
      ${s("Zeng, L. &amp; Sasselov, D. (2016), ApJ 819, 127")}`),a("Core Radius Fraction",`<div class="sci-formula__eq">${t("\\text{CRF} = \\sqrt{\\text{CMF}}")}</div>
      <p>Empirical approximation relating the fractional core radius to the core mass fraction. Earth: CMF = 0.325 &rarr; CRF &approx; 0.57 (observed 0.545, within 5%).</p>
      ${o([["\\text{CRF}","Core radius / total planetary radius"],["\\text{CMF}","Core mass fraction (0&ndash;1)"]])}
      ${s("Zeng, L. &amp; Jacobsen, S. (2017)")}`),a("Magnetic Dipole Scaling (Olson & Christensen 2006)",`<div class="sci-formula__eq">${t("B_{\\text{raw}} = \\sqrt{\\rho_c} \\cdot \\text{CRF}^3 \\cdot M^{1/3} \\cdot (0.8 + 0.4S_{\\text{dyn}}), \\qquad B_{\\text{surf}} = \\frac{B_{\\text{raw}}}{B_{\\oplus}} f_{\\text{strat}} f_{\\text{comp}}")}</div>
      <p>Self-normalised dynamo scaling law. The same shared core-evolution model supplies
      ${e("S_{\\text{dyn}}")} for both the planet and the Earth reference. The magnetic model
      then applies rotation/morphology, small-iron-world stratification, and composition context.
      Fields below 0.005&times; Earth are treated as below measurable global-dynamo strength.</p>
      ${o([["\\rho_c = \\text{CMF} \\cdot \\rho / \\text{CRF}^3","Core density from mass conservation (two-layer model)"],["\\text{CRF} = \\sqrt{\\text{CMF}}","Core radius fraction (Zeng &amp; Jacobsen 2017)"],["M^{1/3}","Comparative power/size proxy from planet mass"],["S_{\\text{dyn}}","Shared core model's maximum thermal or compositional support score"],["f_{\\text{strat}}","Bounded small, core-dominated-world stratification calibration"],["f_{\\text{comp}}","Rocky composition-inventory magnetic factor, bounded to 0.85&ndash;1.15"],["B_{\\oplus}","Earth reference evaluated with the same runtime model"]])}
      <p><b>Material state is separate from field activity.</b> The model first requires a
      significant metallic core, a remaining liquid shell, and ${e("S_{\\text{dyn}} \\ge 0.65")}.
      Rotation and morphology can still suppress the surface field after those tests. A liquid
      outer core is therefore necessary but not sufficient.</p>
      <p><b>Rotation handling (Christensen &amp; Aubert 2006):</b> In the ordinary dipolar regime, field strength is set by the energy budget (buoyancy flux), <em>not</em> rotation rate. Outside that regime, rotation controls morphology and the associated amplitude reduction:</p>
      <ul style="font-size:13px;color:var(--muted);margin:4px 0 4px 18px">
        <li><b>Dipolar</b> (${e("P < P_{\\text{dip}}")}): no rotation penalty</li>
        <li><b>Multipolar</b> (${e("P_{\\text{dip}} < P < 50\\,P_{\\text{dip}}")}): smooth sigmoid transition toward 0.05&times; (20&times; dipole reduction)</li>
        <li><b>No dynamo</b> (${e("P > 50\\,P_{\\text{dip}}")}): magnetic Reynolds number too low</li>
      </ul>
      <p><b>Mercury-like exception:</b> highly core-dominated worlds at the small-iron-world
      calibration limit retain the slow-rotation amplitude reduction, but their reported
      large-scale morphology is dipolar to match MESSENGER&rsquo;s predominantly dipolar,
      north-offset field. This does not imply an Earth-like magnetosphere.</p>
      <p>Dipolar limit: ${e("P_{\\text{dip}} = 96 \\cdot \\sqrt{M} \\cdot \\sqrt{\\text{CMF}/0.33}")} hours.</p>
      ${s("Olson, P. &amp; Christensen, U. (2006), EPSL 250, 561; Christensen, U. &amp; Aubert, J. (2006), GJI 166")}`),a("Core Crystallisation and Inner-Core Growth",`<div class="sci-formula__eq">${t("\\tau_{\\text{proxy}} = 2 + 12\\,\\text{CMF}\\sqrt{\\max(M,0.01)}, \\qquad p = t/\\tau_{\\text{proxy}}")}</div>
      <div class="sci-formula__eq">${t("u = \\operatorname{clamp}\\!\\left(\\frac{p-0.60}{1.95-0.60},0,1\\right), \\qquad \\frac{r_{ic}}{r_c}=\\sqrt{u}, \\qquad \\frac{V_{ic}}{V_c}=\\left(\\frac{r_{ic}}{r_c}\\right)^3")}</div>
      <p>${e("\\tau_{\\text{proxy}}")} is a comparative cooling coordinate, <b>not</b> a
      literal whole-core freeze time. Inner-core growth is zero before explicit nucleation at
      ${e("p=0.60")}; after nucleation, radius follows a square-root-style approximation and
      solid volume follows cubic geometry. The central fully-solid coordinate is
      ${e("p=1.95")}.</p>
      ${o([["\\tau_{\\text{proxy}}","Earth-anchored comparative cooling timescale (Gyr)"],["p","Planet age divided by the cooling-timescale proxy"],["\\text{CMF}","Core mass fraction (0&ndash;1)"],["M","Planet mass in Earth masses"],["r_{ic}/r_c","Solid inner-core radius fraction of the total core radius"],["V_{ic}/V_c","Solid inner-core volume fraction; never interchangeable with radius fraction"]])}
      <p><b>Uncertainty bounds:</b> Earth-anchored nucleation uses
      ${e("p \\in [0.50,0.70]")} and full solidification ${e("p \\in [1.65,2.50]")}.
      Comparative worlds widen these to ${e("[0.35,1.50]")} and ${e("[1.35,5.00]")}.
      Bounds pair later nucleation with slower growth for the minimum radius and earlier
      nucleation with faster growth for the maximum.</p>
      ${c(["Applicability tier","Runtime range","Interpretation"],[["Earth-anchored / medium confidence","Planet; 0.5&ndash;2 M&#8853;; CMF 0.20&ndash;0.45; valid age/geometry; no severe composition warning","Rounded central geometry plus bounded ranges"],["Comparative / low confidence","Differentiated rocky planet; 0.05&ndash;5 M&#8853;; CMF 0.01&ndash;0.75","Qualitative-first result with deliberately broad ranges"],["Limited","Moons, missing/invalid geometry, unsupported composition, or outside the comparative range","No numeric inner-core geometry"]])}
      <p><b>Dynamo-support diagnostics:</b></p>
      <div class="sci-formula__eq">${t("S_T = 1-\\operatorname{smoothstep}(0.30,1.50,p), \\qquad S_C = \\operatorname{clamp}\\!\\left[\\frac{r_{ic}}{r_c}\\,\\operatorname{smoothstep}\\!\\left(0,0.15,1-\\frac{r_{ic}}{r_c}\\right)\\,\\operatorname{clamp}\\!\\left(\\frac{\\text{CMF}}{0.33},0.25,1.50\\right),0,1\\right]")}</div>
      <div class="sci-formula__eq">${t("S_{\\text{dyn}}=\\max(S_T,S_C)")}</div>
      <p>The source is thermal, mixed, predominantly compositional, or weak/stratified according
      to the relative scores (0.35 dominance margin) and the 0.65 support threshold. These are
      comparative support scores, not an entropy budget in watts.</p>
      <p><b>Model boundary:</b> no radial pressure-temperature profile, core-alloy phase diagram,
      conductivity evolution, core-mantle-boundary heat-flow history, or light-element
      partitioning is solved. Whole-body sulfur only widens uncertainty. Radiogenic and tidal
      heat add retained-heat caveats but do not alter the central growth coordinate or make a
      core liquid indefinitely.</p>
      ${s("PREM: Dziewonski & Anderson (1981); Buffett et al. (1992, 1996); Labrosse et al. (2001); Labrosse (2003); Pozzo et al. (2012); Driscoll & Bercovici (2014); Lythgoe et al. (2015); Boujibar et al. (2020); Wardinski et al. (2021); Le Maistre et al. (2023); Bi et al. (2025)")}`),a("Radioisotope Abundance",`<div class="sci-formula__eq">${t("A = \\sum_i a_i \\cdot w_i")}</div>
      <p>Effective radioisotope abundance relative to Earth. In <b>Simple</b> mode, ${e("A")} is set directly by the slider.
      In <b>Per-Isotope</b> mode, ${e("A")} is the weighted sum of individual isotope abundances ${e("a_i")} and their
      present-day fractional contributions ${e("w_i")} to Earth&rsquo;s radiogenic heat budget:</p>
      ${c(["Isotope","Half-life (Gyr)","Heat fraction <i>w<sub>i</sub></i>"],[["U-238","4.47","0.39"],["U-235","0.70","0.04"],["Th-232","14.05","0.40"],["K-40","1.25","0.17"]])}
      <p>When all four abundances equal 1.0, ${e("A = 1.0")} (Earth).
      ${e("A")} scales the internal heat budget, volcanic decay rate, and lithosphere cooling
      age. For core evolution it is retained-heat uncertainty context only; it does not multiply
      the central cooling/growth coordinate.</p>
      <p>Range: 0.01&ndash;5.0 (per-isotope), 0.1&ndash;3.0 (simple slider).</p>`),a("Composition Inventory Coupling",`<div class="sci-formula__eq">${t("A_{\\text{trace}} = 0.39U + 0.40Th + 0.17K")}</div>
      <p>Manual rocky-body inventories are separated into <b>component reservoirs</b> and <b>element inventories</b>. Component reservoirs describe bulk material pools such as metal, silicate, water ice, volatile ice, carbonaceous material, sulfur, and salts. Element inventories expose major and trace elements for chemistry and diagnostics.</p>
      ${c(["Coupling target","Inventory signals used"],[["Atmosphere","C/N/S/H/O volatile budgets, sulfur sources, water reservoirs, and caveats about incomplete retention."],["Ocean chemistry","Water, salts, sulfur, carbonaceous material, sodium/chlorine, and rock-ocean access."],["Interior heat","K, U, and Th trace values as present-day Earth-relative radiogenic heat multipliers."],["Geology and magnetism","Metal fraction, silicate inventory, density consistency, and heat-production context."],["Visual/material cues","Iron-rich, sulfur-rich, salt-rich, and dark carbonaceous diagnostics."]])}
      <p>The coupling layer is deliberately diagnostic. It passes bounded reservoir scores downstream, but it is not a mineral-equilibrium solver and does not infer a complete petrologic or atmospheric evolution history from element boxes alone.</p>
      ${o([["U, Th, K","Earth-relative trace element abundances supplied in the composition inventory"],["A_{\\text{trace}}","Trace-radiogenic abundance multiplier used by supported heat contexts"]])}
      ${s("McDonough &amp; Sun (1995), Chemical Geology 120, 223; Arevalo, McDonough &amp; Luong (2009), Earth Planet. Sci. Lett. 278, 361; Catling &amp; Kasting (2017)")}`),a("Moon Solid-Body Structure And Tidal Response",`<div class="sci-formula__eq">${t("\\text{class} = f(M, R, \\rho, \\text{ice}, \\text{metal}, \\text{silicate}, \\text{ocean}, \\phi)")}</div>
      <div class="sci-formula__eq">${t("I = CMR^2, \\quad C \\in [0.31, 0.40]")}</div>
      <div class="sci-formula__eq">${t("k_2 = \\frac{1.5}{1 + 19\\mu_{\\text{eff}}/(2\\rho g R)}, \\quad Q = Q(\\text{structure}, \\text{ocean}, \\text{melt})")}</div>
      <p>Moons now pass through a shared solid-body layer before geology, tides, magnetism, hydrosphere, and display diagnostics are assembled. The layer classifies bodies as small-porous-body, compact-rocky-moon, differentiated-rocky-moon, ice-rock-ocean-world, volatile-rich-icy-body, iron-rich-body, or planetary-rocky-body, then derives a layer-aware moment-of-inertia factor, effective rigidity, Love number, and material Q.</p>
      <p>This is a static, composition-aware response model. It lets icy ocean worlds, porous captured moons, and differentiated rocky moons produce different tidal heating, hydrothermal potential, dynamo support, crater retention, and rock-ocean exchange labels. It is <b>not a 1-D thermochemical interior solver</b>: there is no radial pressure-temperature grid, mineral phase equilibrium, viscoelastic shell solve, or time-dependent mantle/ocean evolution.</p>
      ${o([["\\phi","Porosity proxy from small size, low density, and carbonaceous/icy inventory"],["C","Moment-of-inertia factor; lower values indicate more differentiated mass distribution"],["\\mu_{\\text{eff}}","Layer-aware effective rigidity used by the tidal Love-number proxy"],["Q","Material dissipation factor; lowered by ocean/melt response and raised by cold rigid bodies"]])}
      ${s("Peale, Cassen &amp; Reynolds (1979), Science 203, 892; Hussmann, Sohl &amp; Spohn (2002), Icarus 156, 143; Sohl et al. (2003), JGR 108; Vance et al. (2018), JGR Planets 123, 180")}`),a("Stellar CMF Derivation",`<div class="sci-formula__eq">${t("\\text{Fe/Mg} = 0.83 \\cdot 10^{[\\text{Fe/H}]}")}</div>
      <div class="sci-formula__eq">${t("\\text{CMF} = \\frac{\\text{Fe/Mg} \\cdot 55.85}{\\text{Fe/Mg} \\cdot 55.85 + 172}")}</div>
      <p>Derives a suggested core mass fraction from the host star&rsquo;s metallicity [Fe/H], using solar Fe/Mg = 0.83 and a simplified mantle molecular weight of 172 g/mol. ~75% of observed rocky exoplanets match their host star&rsquo;s predicted CMF.</p>
      ${o([["[\\text{Fe/H}]","Stellar iron-to-hydrogen ratio (dex)"],["55.85","Molar mass of iron (g/mol)"],["172","Effective molar mass of silicate mantle"]])}
      ${s("Schulze, J. et al. (2021), PSJ 2, 113")}`),a("Body Classification",`<p>Rocky bodies are classified by mass:</p>
      ${c(["Class","Condition"],[["Dwarf planet","M &lt; 0.01 M&#8853;"],["Planet","M &ge; 0.01 M&#8853;"]])}
      <p>The threshold is 0.01 M&#8853;, between Mercury (0.055 M&#8853;) and
      Eris (0.0028 M&#8853;). The physics model is identical for both classes
      &mdash; mass&ndash;radius relation, composition, atmosphere, and tectonics
      all apply unchanged. This is purely a labelling convention for worldbuilding.</p>
      <p>Real examples: Ceres (0.00016 M&#8853;), Pluto (0.0022 M&#8853;), Eris (0.0028 M&#8853;).</p>`),a("Composition Classification",`<p>Planets are classified by core mass fraction (CMF) and water mass fraction (WMF):</p>
      ${c(["Class","Condition"],[["Ice world","WMF &gt; 0.1"],["Ocean world","WMF &gt; 0.001"],["Iron world","CMF &gt; 0.6"],["Mercury-like","CMF &gt; 0.45"],["Earth-like","CMF &ge; 0.25"],["Mars-like","CMF &ge; 0.1"],["Coreless","CMF &lt; 0.1"]])}
      <p>Water regime labels: Dry (&lt; 0.01%), Shallow oceans (&lt; 0.1%), Extensive (&lt; 1%),
      Global ocean (&lt; 10%), Deep ocean (&lt; 30%), Ice world (&ge; 30%).</p>`),a("Planetary Subtype Evidence Overlays",`<p>Planetary subtypes are conservative evidence overlays on top of the main planet family. They add context such as ocean world, steam world, lava world, iron-rich world, carbon-rich world, desert world, Hycean candidate, super-puff, chthonian candidate, or rogue planet without rewriting the selected family.</p>
      ${c(["Subtype family","Typical evidence"],[["Water/ocean/icy","Water mass fraction, hydrosphere state, climate phase, radius-density context, and ice-line history."],["Lava/steam/desert","Surface temperature, insolation, atmosphere state, water availability, and runaway or arid climate flags."],["Iron/carbon-rich","Density, core fraction, stellar or manual composition context, and inventory evidence."],["Hycean/super-puff","Low-density volatile envelopes, mass-radius scale, temperature envelope, and atmosphere context."],["Chthonian/rogue","Envelope-loss or no-host evidence plus thermal, orbit, and stellar-history caveats."]])}
      <p>The primary subtype shown in the UI is priority-ranked so unusual cases surface first, but supporting subtype evidence remains visible as explanation. Boundary traits such as radiusValley and volatileCandidate are handled as contextual flags rather than absolute origin labels.</p>
      ${s("Madhusudhan et al. (2021), ApJ 918, 1; Fulton et al. (2017), AJ 154, 109; Baraffe et al. (2014), Protostars and Planets VI")}`),a("Radius-Valley Boundary Context",`<p>The super-Earth/sub-Neptune radius valley is treated as a <b>population-level boundary diagnostic</b>, not a deterministic single-planet origin label. Caelum records whether a boundary-family planet is boundary-sized and whether its orbital period or irradiation makes envelope-loss interpretation relevant.</p>
      ${c(["Context class","Interpretation"],[["close-in-boundary-relevant","Radius is in the small-planet boundary range and period, irradiation, or orbit makes radius-valley envelope-loss context relevant."],["long-period-weakly-constrained","Radius is boundary-sized but long-period, lower-irradiation context weakens a photoevaporation/core-powered-loss reading."],["boundary-sized-low-irradiation","Radius is boundary-sized, but the close-in irradiation evidence is not strong."],["unknown","Radius or orbital/irradiation context is missing."]])}
      <p>This context is surfaced beside boundary traits such as radiusValley and volatileCandidate, and it does not rewrite the selected planetary family.</p>
      ${s("Fulton et al. (2017), AJ 154, 109; Van Eylen et al. (2018), MNRAS 479, 4786")}`),a("Mantle Outgassing Oxidation States",`<p>Volcanic gas composition depends on mantle oxygen fugacity:</p>
      ${c(["State","&Delta;IW","Primary gases"],[["Highly reduced","&minus;4","H&#8322; + CO"],["Moderately reduced","&minus;2","H&#8322; + CO&#8322; (mixed)"],["Earth-like","+1","CO&#8322; + H&#8322;O"],["Oxidised","+3","CO&#8322; + H&#8322;O + SO&#8322;"]])}
      <p>The iron-w&uuml;stite (IW) buffer sets the reference. Earth is approximately IW+1.</p>
      ${s("Ortenzi et al. (2020), Sci. Rep. 10, 10907")}`)].join("")}function Je(){return[a("Maximum Mountain Height",`<div class="sci-formula__eq">${t("H_{\\max} = \\frac{\\sigma_y}{\\rho \\cdot g} \\approx \\frac{9{,}267}{g} \\text{ m}")}</div>
      <p>Tallest mountain a planet&rsquo;s crust can support before compressive failure at the base. The yield strength of silicate rock (~100 MPa) sets an upper bound that scales inversely with surface gravity.</p>
      ${o([["\\sigma_y","Compressive yield strength of silicate rock (~100 MPa)"],["\\rho","Crustal rock density (~2,800 kg/m&sup3;)"],["g","Surface gravity (relative to Earth, where g = 9.81 m/s&sup2;)"]])}
      <p>Earth: 9,267 m (Everest 8,849 m). Mars at 0.38 g: 24,387 m (Olympus Mons 21,900 m base-to-peak).</p>
      ${s("Weisskopf, V. F. (1975), &ldquo;Of Atoms, Mountains, and Stars&rdquo;, Science 187, 605&ndash;612")}`),a("Ocean Floor Subsidence (PSM Plate Model)",`<p>Seafloor depth increases with crustal age as the lithosphere cools after formation at a mid-ocean ridge. Two regimes:</p>
      <div class="sci-formula__eq">${t("d = d_r + 350\\sqrt{t} \\quad (t \\le 20 \\text{ Myr}, \\; \\text{half-space})")}</div>
      <div class="sci-formula__eq">${t("d = 6{,}400 - 3{,}073\\,e^{-t/62.8} \\quad (t > 20 \\text{ Myr}, \\; \\text{plate model})")}</div>
      ${o([["d_r","Mid-ocean ridge depth (default 2,600 m below sea level, GDH1)"],["t","Crustal age (Myr)"],["350","Subsidence rate coefficient (m/Myr&frac12;)"],["6{,}400","Asymptotic ocean depth (m)"],["3{,}073","Intersection amplitude (WS-modified from PSM&rsquo;s 3,200 m)"],["62.8","Thermal time constant (Myr)"]])}
      <p>Young crust (&lt;20 Myr) follows half-space cooling (${e("\\sqrt{t}")} diffusion). Older crust flattens toward an asymptotic depth as basal heating from the mantle balances surface cooling.</p>
      ${s("Parsons, B. &amp; Sclater, J. G. (1977), JGR 82, 803. Stein, C. &amp; Stein, S. (1992), Nature 359 (GDH1 model).")}`),a("Airy Isostatic Root Depth",`<div class="sci-formula__eq">${t("d_{\\text{root}} = h \\cdot \\frac{\\rho_c}{\\rho_m - \\rho_c}")}</div>
      ${o([["h","Mountain elevation above datum (m)"],["\\rho_c","Crustal density (2,800 kg/m&sup3;)"],["\\rho_m","Mantle density (3,300 kg/m&sup3;)"]])}
      <p>Mountains float on denser mantle like icebergs in water. The Airy model keeps density constant but varies crustal thickness: higher elevations require deeper roots. For Earth, every 1 km of elevation produces a 5.6 km root.</p>
      ${s("Turcotte, D. L. &amp; Schubert, G. (2014), Geodynamics, Ch. 2")}`),a("Pratt Isostatic Compensation",`<div class="sci-formula__eq">${t("\\rho(h) = \\rho_0 \\cdot \\frac{D}{D + h}")}</div>
      ${o([["h","Elevation above datum (m)"],["D","Compensation depth (default 100 km)"],["\\rho_0","Base crustal density (2,800 kg/m&sup3;)"]])}
      <p>Alternative to the Airy model: crust has uniform thickness but variable density. Higher terrain is less dense. Both models satisfy the same hydrostatic equilibrium condition but imply different internal structures.</p>
      ${s("Turcotte, D. L. &amp; Schubert, G. (2014), Geodynamics, Ch. 2")}`),a("Volcanic Arc Distance",`<div class="sci-formula__eq">${t("d_{\\text{arc}} = \\frac{h_{\\text{slab}}}{\\tan(\\theta)}")}</div>
      ${o([["h_{\\text{slab}}","Depth to slab top beneath volcanic front (110 km global mean)"],["\\theta","Subduction angle (10&ndash;90&deg;)"]])}
      <p>The volcanic arc forms above the point where the descending slab reaches ~110 km depth, triggering partial melting due to dehydration of hydrous minerals. Shallow subduction (Laramide-style, ~15&deg;) pushes the arc hundreds of km inland; steep subduction (Andean, ~45&deg;) places it closer to the trench.</p>
      ${s("Syracuse, E. &amp; Abers, G. (2006), G&sup3;, 7 &mdash; global mean 105&plusmn;19 km")}`),a("Linear Erosion",`<div class="sci-formula__eq">${t("H(t) = H_0 - \\varepsilon \\cdot t")}</div>
      ${o([["H_0","Initial mountain height (m)"],["\\varepsilon","Erosion rate (default 5 m/Myr)"],["t","Elapsed time (Myr)"]])}
      <p>Simple linear denudation. The global median outcrop erosion rate from cosmogenic nuclide measurements is ~5.4 m/Myr, though individual rates span 0.1&ndash;50+ m/Myr depending on lithology, climate, and tectonic uplift.</p>
      ${s("Cosmogenic nuclide compilation &mdash; global outcrop median 5.4 m/Myr")}`),a("Spreading Rate Categories",`<p>Seafloor spreading velocity at mid-ocean ridges, classified by tectonic regime:</p>
      ${c(["Regime","Rate (mm/yr)","Label"],[["Mobile lid","20&ndash;200","Active spreading"],["Episodic overturn","5&ndash;50","Episodic spreading"],["Plutonic-squishy","2&ndash;20","Sluggish spreading"],["Stagnant lid","0","No spreading"]])}
      <p>Earth&rsquo;s present full spreading rates range from ~10 mm/yr (ultraslow, Arctic Gakkel Ridge) to ~200 mm/yr (ultrafast, East Pacific Rise). Evidence from Dalton et al. (2022) suggests a global slowdown since 15 Ma.</p>
      ${s("Dalton, C. A. et al. (2022), GRL &mdash; global plate speed evolution since 200 Ma")}`),a("Shield Volcano Height Scaling",`<div class="sci-formula__eq">${t("H_{\\text{shield}} = \\frac{10{,}000}{g} \\times f_{\\text{lid}}")}</div>
      ${o([["10{,}000","Earth reference shield height (m), Mauna Kea base-to-peak"],["g","Surface gravity (Earth = 1)"],["f_{\\text{lid}}","Stagnant-lid factor: 1.5 if stagnant lid, 1.0 otherwise"]])}
      <p>Shield volcano height scales inversely with gravity: lower gravity allows magma columns to build taller before the base yields. Stagnant-lid planets lack plate recycling, allowing persistent hotspot volcanism to build larger edifices.</p>
      <p>Validation: Mars at 0.38 g with stagnant lid gives 39,474 m. Olympus Mons is 21,900 m base-to-peak (the model gives a theoretical maximum, not typical height).</p>
      ${s("McGovern, P. J. &amp; Solomon, S. C. (1993, 1998), JGR &mdash; volcanic loading and lithospheric support")}`),a("Continental Margin Dimensions",`<p>Passive continental margins comprise four morphological zones:</p>
      ${c(["Zone","Typical width","Depth range","Slope"],[["Continental shelf","80 km","0&ndash;130 m","~0.1&deg;"],["Continental slope","varies","130&ndash;3,000 m","3&ndash;4&deg;"],["Continental rise","200 km","3,000&ndash;4,500 m","~0.5&deg;"],["Abyssal plain","indefinite","4,500+ m","~0&deg;"]])}
      <p>The shelf break at ~130 m depth corresponds to Pleistocene sea-level lowstands, when shorelines were at the current shelf edge. Shelf width varies from &lt;10 km (active margins) to &gt;300 km (passive margins like eastern North America).</p>
      ${s("Standard geomorphology references; shelf break 130 m from Pleistocene lowstands")}`),a("Tectonic Regime Probability Distribution",`<div class="sci-formula__eq">${t("P_i = \\frac{w_i}{\\sum_j w_j}, \\quad w_i = f_M(i) \\cdot f_t(i) \\cdot f_W(i) \\cdot f_C(i) \\cdot f_T(i)")}</div>
      <p>Estimates the probability of each tectonic regime (stagnant lid, mobile lid, episodic overturn, plutonic-squishy lid) from five planetary parameters. Each factor is a smooth Gaussian preference curve centred on the optimal parameter range for that regime. Factors are multiplied together and normalised to sum to 1.0.</p>
      ${o([["f_M(i)","Mass factor &mdash; log-Gaussian centred on optimal mass for regime i"],["f_t(i)","Age factor &mdash; Gaussian in t centred on optimal age for regime i"],["f_W(i)","Water factor &mdash; WMF-dependent multiplier (Korenaga 2010)"],["f_C(i)","CMF factor &mdash; penalises mobile lid for high core fraction"],["f_T(i)","Tidal heating factor &mdash; reduces stagnant lid probability"]])}
      <p>Key regimes: <b>Mobile lid</b> peaks at 0.5&ndash;3 M&oplus;, 2&ndash;6 Gyr, WMF 0.001&ndash;0.1. <b>Stagnant lid</b> dominates below 0.3 M&oplus; or above 5 M&oplus; + old age. <b>Episodic</b> favours young, massive planets. <b>Plutonic-squishy</b> favours young, moderate-mass planets.</p>
      ${s("Valencia, D. et al. (2007), ApJL 670, L45; O&rsquo;Neill, C. &amp; Lenardic, A. (2007), GRL 34; Noack, L. &amp; Breuer, D. (2014), P&amp;SS 98; Korenaga, J. (2010), ApJL 725, L43")}`),a("Composition-Dependent Peak Heights",`${c(["Composition class","H<sub>max</sub> (m)"],[["Iron world","12,000"],["Mercury-like","11,000"],["Earth-like","9,267"],["Mars-like","8,500"],["Ocean world","7,000"],["Ice world","3,000"],["Coreless","7,000"]])}
      <p>Yield-stress-limited peak height divided by surface gravity. Ice worlds have much lower yield stress (10 MPa vs 300 MPa for basalt).</p>`),a("Elastic Lithosphere Thickness",`<div class="sci-formula__eq">${t("T_e = 20\\,\\sqrt{t_{\\text{Gyr}} / A} \\cdot M_\\oplus^{0.3}\\;\\text{km}")}</div>
      <p>Thickens with age (cooling) and mass (higher pressure). Higher radioisotope abundance ${e("A")} slows cooling, producing a thinner lithosphere at the same age. Tidal heating thins the lithosphere further:
      ${e("T_e \\times \\max(0.2,\\; 1 - 0.3\\log_{10}(\\dot{E}_{\\text{tidal}}))")} when tidal heating &gt; 0.1&times; Earth.
      Clamped to [5, 300] km.</p>`),a("Volcanic Activity",`<div class="sci-formula__eq">${t("a = e^{-0.15\\,t\\,/\\,A} + 0.5\\,\\min(1,\\; \\dot{E}_{\\text{tidal}}/2)")}</div>
      <p>Activity relative to Earth (1.0). Decays exponentially with planetary age as internal heat
      diminishes. Dividing by radioisotope abundance ${e("A")} means a planet with 2&times; Earth&rsquo;s isotopes behaves as if it were half its actual thermal age. Tidal heating can sustain volcanism independently. Clamped to [0.01, 2.0].</p>`),a("Climate-Adjusted Erosion",`<div class="sci-formula__eq">${t("\\varepsilon = 5 \\cdot \\max(0.2,\\; T/288) \\cdot \\max(0.1,\\; 1 + f_{\\text{H}_2\\text{O}})\\;\\text{m/Myr}")}</div>
      <p>Baseline 5 m/Myr (global median from cosmogenic nuclides) scaled by temperature and
      moisture. Warmer, wetter planets erode faster. Clamped to [0.5, 50] m/Myr.</p>`),`<div class="sci-formula">
      <h3 class="sci-formula__name">Interactive: Gravity &rarr; Mountain &amp; Volcano Heights</h3>
      <p>Adjust gravity to see the maximum mountain height (yield-strength limit) and maximum shield volcano height (1/g scaling).</p>
      <div class="sci-try">
        <div class="sci-try__title">Try it</div>
        <div class="sci-try__row">
          <label>Surface gravity <span class="unit">g</span></label>
          <input id="sci-tec-grav" type="number" value="1" min="0.05" max="5" step="0.01" />
          <input id="sci-tec-grav-slider" type="range" />
        </div>
        <div class="sci-try__output">
          <span class="sci-try__label">Max mountain</span>
          <span class="sci-try__value" id="sci-tec-mtn">&mdash;</span>
        </div>
        <div class="sci-try__output">
          <span class="sci-try__label">Max shield volcano</span>
          <span class="sci-try__value" id="sci-tec-shield">&mdash;</span>
        </div>
        <div class="sci-try__output">
          <span class="sci-try__label">Airy root (5 km peak)</span>
          <span class="sci-try__value" id="sci-tec-root">&mdash;</span>
        </div>
      </div>
    </div>`].join("")}function je(){return[a("Mean-Motion Resonance Positions",`<div class="sci-formula__eq">${t("a_{\\text{res}} = a_p\\,(p/q)^{2/3}")}</div>
      <p>Orbital distances where a body&rsquo;s period is a rational multiple of a giant planet&rsquo;s.
      Resonances sculpt disk edges and gaps:</p>
      ${c(["Resonance","(p/q)<sup>2/3</sup>"],[["3:2 exterior","1.310"],["2:1 exterior","1.587"],["5:2 exterior","1.842"],["1:2 interior","0.630"],["1:4 interior","0.397"],["1:8 interior","0.250"]])}`),a("Condensation Sequence",`<p>Species condense from a cooling solar-composition nebula at characteristic temperatures:</p>
      ${c(["Species","T<sub>cond</sub> (K)","Mass %"],[["Corundum (Al&#8322;O&#8323;)","1700","0.4"],["Iron-nickel","1450","7"],["Enstatite (MgSiO&#8323;)","1350","12"],["Forsterite (Mg&#8322;SiO&#8324;)","1300","14"],["Feldspar","1200","6"],["Troilite (FeS)","700","4"],["Organics","300","6"],["Water ice","170","33"],["NH&#8323; hydrate","130","2"],["CO&#8322; ice","70","5"],["CH&#8324; ice","31","4"],["CO ice","25","3"],["N&#8322; ice","22","2"]])}
      ${s("Lodders (2003), ApJ 591, 1220")}`),a("Dust Equilibrium Temperature",`<div class="sci-formula__eq">${t("T = 279\\,\\frac{\\sqrt{L_\\star}}{\\sqrt{r_{\\text{AU}}}}\\;\\text{K}")}</div>
      <p>Blackbody equilibrium temperature for a grain at distance ${e("r")} from a star
      of luminosity ${e("L_\\star")} (solar units).</p>`),a("Fractional Luminosity",`<div class="sci-formula__eq">${t("f_{\\max} = 2.4{\\times}10^{-8}\\,\\frac{r^{7/3}\\,(\\Delta r / r)}{t_{\\text{age}}}")}</div>
      <p>Maximum disk-to-star luminosity ratio from collisional steady state. Capped at 0.01
      (physical limit). ${e("t_{\\text{age}}")} in Gyr, ${e("r")} in AU.</p>
      ${s("Wyatt et al. (2007), ApJ 658, 569")}`),a("Blowout Grain Size",`<div class="sci-formula__eq">${t("s_{\\text{blow}} = 0.57\\,L_\\star / M_\\star\\;\\mu\\text{m}")}</div>
      <p>Minimum grain size that remains bound; smaller grains are ejected by radiation pressure.
      Typical surviving grains are ${e("\\sim 10\\,s_{\\text{blow}}")}.</p>`),a("Poynting&ndash;Robertson Drag Timescale",`<div class="sci-formula__eq">${t("t_{\\text{PR}} = 700\\,\\frac{s\\,r^2}{L_\\star}\\;\\text{yr}")}</div>
      <p>Time for a grain of size ${e("s")} (&mu;m) at distance ${e("r")} (AU) to spiral into the star
      due to radiation drag. If ${e("t_{\\text{PR}} > t_{\\text{coll}}")}, collisions dominate.</p>`),a("Collisional Lifetime",`<div class="sci-formula__eq">${t("t_{\\text{coll}} = \\frac{P_{\\text{orb}}}{4\\pi\\tau}")}</div>
      <p>Mean time between destructive collisions. ${e("\\tau")} is the normal optical depth of the disk.
      Collision velocity: ${e("v_{\\text{col}} = e\\,v_{\\text{Kep}}\\sqrt{2}")}; regimes: accretionary (&lt; 10 m/s),
      erosive (10&ndash;100), catastrophic (&gt; 100).</p>`),a("Chaotic Zone",`<div class="sci-formula__eq">${t("\\delta a = 1.3\\,a\\left(\\frac{M_p}{M_\\star}\\right)^{2/7}")}</div>
      <p>Half-width of the dynamically unstable region around a giant planet. Debris within
      this zone is rapidly ejected or accreted.</p>
      ${s("Wisdom (1980), AJ 85, 1122")}`),a("Exo-Oort Cloud Hill Scaling",`<div class="sci-formula__eq">${t("r_{\\text{H,OC}} \\approx 1.5\\times10^5\\,\\left(\\frac{M_\\star}{M_\\odot}\\right)^{1/3}\\left(\\frac{R_{\\text{gal}}}{R_{\\text{gal},\\odot}}\\right)^{2/3}\\;\\text{AU}")}</div>
      <p>Caelum scales exo-Oort cloud size from the parent system&rsquo;s Hill radius in the Galactic potential. This follows the same ${e("M_\\star^{1/3} R_{\\text{gal}}^{2/3}")} dependence used in exo-Oort scaling work.</p>
      ${o([["r_{\\text{H,OC}}","Characteristic Hill / tidal size of the exo-Oort reservoir"],["M_\\star","Total mass of the host stellar system"],["R_{\\text{gal}}","Galactocentric distance of the system"],["R_{\\text{gal},\\odot}","Solar-circle reference radius used by Caelum's Local Cluster defaults"]])}
      ${s("Moro-Mart\xEDn (2019, AJ 157, 86), following Hanse et al. (2018) and Veras et al. (2014)")}`),a("Exo-Oort Cloud Edges",`<div class="sci-formula__eq">${t("a_{\\text{in}} \\approx 3\\times10^3\\,\\left(\\frac{r_{\\text{H,OC}}}{1.5\\times10^5\\;\\text{AU}}\\right)")}</div>
      <div class="sci-formula__eq">${t("a_{\\text{out}} \\approx 10^5\\,\\left(\\frac{r_{\\text{H,OC}}}{1.5\\times10^5\\;\\text{AU}}\\right)")}</div>
      <div class="sci-formula__eq">${t("a_{\\text{in,WS}} = \\max\\left(a_{\\text{in}},\\;80\\,a_{\\text{giant,max}}\\right)")}</div>
      <p>The base inner and outer edges follow Solar Oort-cloud reference values scaled by Galactic Hill radius. Caelum then applies an outer-giant architecture floor so the detached cloud does not begin unrealistically close to the scattering giant-planet region.</p>
      ${o([["a_{\\text{in}}","Hill-scaled inner edge before architecture adjustment"],["a_{\\text{out}}","Hill-scaled outer edge"],["a_{\\text{giant,max}}","Semi-major axis of the outermost giant planet in the system"]])}
      ${s("Solar reference extents from Moro-Mart\xEDn (2019, AJ 157, 86); environment dependence of the inner edge from Kaib, Ro\u0161kar & Quinn (2011, Icarus 215, 491)")}`),a("Oort Cloud Mass And LPC Flux (Caelum Simplification)",`<div class="sci-formula__eq">${t("M_{\\text{OC}} \\approx 7\\,M_\\oplus\\,\\left(\\frac{M_\\star}{M_\\odot}\\right) F_{\\text{giants}} F_{\\text{outer}} F_{\\text{eject}} F_{\\text{age}} F_{\\text{ret}}")}</div>
      <div class="sci-formula__eq">${t("\\Gamma_{\\text{LPC}} \\approx 2.5\\,\\text{yr}^{-1}\\,\\left(\\frac{M_{\\text{OC}}}{5\\,M_\\oplus}\\right)\\left(\\frac{n_\\star}{0.004\\;\\text{ly}^{-3}}\\right)^{1/2}\\left(\\frac{3000\\;\\text{AU}}{a_{\\text{in,WS}}}\\right)^{0.35}")}</div>
      <p>No single paper gives a closed-form exo-Oort mass or long-period-comet injection formula from authored system inputs. Caelum therefore uses a disclosed proxy: star-mass scaling from exo-Oort literature, an outer-giant architecture gate inspired by scattering-outcome maps, an inner-ejector penalty for Jupiter-dominated systems, an age saturation term, and an environmental retention factor for Galactic tides and stellar encounters.</p>
      ${o([["F_{\\text{giants}}","Total giant-mass factor relative to the Solar giant planets"],["F_{\\text{outer}}","Outermost-giant extent factor relative to Neptune's orbit"],["F_{\\text{eject}}","Penalty for massive inner ejectors that deplete the cloud"],["F_{\\text{age}}","Age saturation term for cloud emplacement"],["F_{\\text{ret}}","Retention factor from galactocentric location and stellar density"],["\\Gamma_{\\text{LPC}}","New long-period comet injection rate"]])}
      <p>The Solar normalization targets a few Earth masses in the cloud and about 2&ndash;3 new LPCs per year, consistent with the broad literature ranges and with the commonly quoted Solar LPC flux.</p>
      ${s("Wyatt et al. (2017, MNRAS) for scattering outcomes; Brasser et al. (2010, A&A 516, A72) and Kaib et al. (2011, Icarus 215, 491) for environment dependence; Moro-Mart\xEDn (2019, AJ 157, 86) for the Solar LPC flux reference")}`),a("Oort Cloud Authoring Layers (Caelum Overlay)",`<p><b>Automatic baseline science layer:</b> the Oort-cloud formulas above are the literature-inspired baseline model. Caelum resolves that automatic model first, then optionally layers authoring controls on top.</p>
      <p><b>Guided mode:</b> Guided Oort controls are a <b>Caelum authoring overlay</b>. They are worldbuilding adjustments layered on top of the automatic Oort model, not a separate published exo-Oort inference.</p>
      <div class="sci-formula__eq">${t("M^{\\prime} = M_{\\text{auto}}\\,F_{\\text{form}}\\,F_{\\text{ret}}\\,F_{\\text{inst}}")}</div>
      <div class="sci-formula__eq">${t("a_{\\text{in}}^{\\prime} = a_{\\text{in,auto}}\\,F_{\\text{comp}}\\,F_{\\text{inst,in}}")}</div>
      <div class="sci-formula__eq">${t("a_{\\text{out}}^{\\prime} = \\mathrm{clamp}\\!\\left(a_{\\text{out,auto}}\\,F_{\\text{out}},\\;2.2\\,a_{\\text{in}}^{\\prime},\\;0.95\\,r_H\\right)")}</div>
      <div class="sci-formula__eq">${t("\\Gamma^{\\prime} = \\Gamma_{\\text{auto}}\\left(\\frac{M^{\\prime}}{M_{\\text{auto}}}\\right)\\left(\\frac{a_{\\text{in,auto}}}{a_{\\text{in}}^{\\prime}}\\right)^{0.35}F_{\\text{inst},\\Gamma}")}</div>
      ${o([["F_{\\text{form}}","Guided formation-efficiency multiplier"],["F_{\\text{ret}}","Guided retention / erosion multiplier"],["F_{\\text{comp}}","Guided inner-cloud compactness multiplier"],["F_{\\text{inst}}","Guided instability mass multiplier"],["F_{\\text{inst,in}}","Guided instability inner-edge multiplier"],["F_{\\text{inst},\\Gamma}","Guided instability LPC-flux multiplier"]])}
      <p><b>Manual mode:</b> Manual Oort settings are direct user overrides of the displayed reservoir state. Manual mode is not a scientific inference; it is explicit authored world data.</p>
      ${s("Automatic baseline science: see the Oort-cloud entries above. Guided and manual controls are Caelum authoring overlays resolved in engine/oortCloud.js.")}`),a("IR Excess at 24 &mu;m",`<div class="sci-formula__eq">${t("\\text{excess} = f \\cdot \\frac{B_\\nu(T_{\\text{disk}},\\,24\\,\\mu\\text{m})}{B_\\nu(T_\\star,\\,24\\,\\mu\\text{m})}")}</div>
      <p>Ratio of disk to stellar flux at 24 &mu;m via Planck functions.
      Detectable if &gt; 0.1 (easily), marginal 0.01&ndash;0.1, undetectable &lt; 0.01.</p>`)].join("")}function Ue(){let i=(r,n)=>`<div class="sci-formula"><h3 class="sci-formula__name">${r}</h3>${n}</div>`;return[`<p class="sci-diverge-intro">Caelum aims to reproduce published astrophysical models wherever possible.
    In several areas, however, published models are incomplete, internally inconsistent, or
    too complex for a real-time calculator. This section documents every place where
    Caelum uses its own empirical fits, simplifications, or calibrations instead of
    (or in addition to) a single published formula. Items marked <b>WS-derived</b> are original
    to Caelum; items marked <b>Simplified</b> are reductions of published work.</p>`,i("Oort Cloud Mass And LPC Flux Proxy (WS-derived / Simplified)",`<p>Caelum&rsquo;s Oort-cloud mass and long-period-comet flux are not taken from a single published closed-form model. The edge scaling follows exo-Oort Hill-radius work, but the mass and LPC-rate outputs are Caelum proxies built from five factors: total giant mass, outer-giant extent, inner-ejector depletion, age saturation, and environmental retention.</p>
      <p><b>Why diverge?</b> The literature provides pieces of the problem rather than one direct calculator. Moro-Mart\xEDn (2019) scales cloud extent to the Galactic Hill radius, Wyatt et al. (2017) map which planet architectures favor Oort clouds versus prompt ejection, Brasser et al. (2010) and Kaib et al. (2011) show strong environmental dependence, and Veras et al. (2011/2014) quantify later clearing. Caelum combines those ingredients into a disclosed proxy calibrated so Sol lands near the canonical ${e("a_{\\text{in}} \\sim 3000\\;\\text{AU}")}, ${e("a_{\\text{out}} \\sim 10^5\\;\\text{AU}")}, and a few-Earth-mass cloud with a Solar LPC flux of order 2&ndash;3 per year.</p>
      ${s("Moro-Mart\xEDn (2019), Wyatt et al. (2017), Brasser et al. (2010), Kaib et al. (2011), Veras et al. (2011, 2014).")}`),i("Greenhouse Optical Depth Coefficients (WS-derived)",`<p>The grey IR optical depth coefficients for CO&#8322; (0.503), H&#8322;O (0.336), and CH&#8324; (0.45) are
      <em>not</em> taken from a single published radiative-transfer study. They are Caelum fits
      calibrated so that the energy-balance model reproduces NASA Planetary Fact Sheet surface
      temperatures for Earth (288 K), Venus (737 K), and Mars (211 K) simultaneously.</p>
      <p><b>Why diverge?</b> Published greenhouse models (e.g. Pierrehumbert 2010, Robinson &amp; Catling 2012)
      use either line-by-line radiative transfer (too slow for real-time) or parameterisations tied
      to specific atmospheric compositions. Caelum needs a single grey-opacity formula that
      works from Mars (0.006 atm, 95% CO&#8322;) through Earth (1 atm, mixed) to Venus (92 atm, 96% CO&#8322;).
      No published parameterisation spans this range in a single expression.</p>
      <p><b>Functional forms</b> (logarithmic for CO&#8322;/H&#8322;O, square-root for CH&#8324;) <em>are</em>
      grounded in published physics: Myhre (1998) band saturation for CO&#8322;, IPCC TAR Table 6.2
      for CH&#8324;, Robinson &amp; Catling (2012) for pressure broadening (${e("P^{0.684}")}).</p>
      ${s("Coefficients: Caelum calibration. Functional forms: Myhre (1998), IPCC TAR (2001), Robinson &amp; Catling (2012).")}`),i("CO&#8322;&ndash;H&#8322;O Band Overlap Suppression (WS-derived)",`<p>The half-saturation model ${e("\\omega = 1/(1 + \\tau_{\\text{CO}_2}/6)")} and the constant
      ${e("k = 6")} are Caelum-derived. No published radiative-transfer study provides a
      single-parameter overlap correction of this form.</p>
      <p><b>Why diverge?</b> Real spectral overlap between CO&#8322; and H&#8322;O in the 12&ndash;18 &mu;m
      and 4.3 &mu;m regions is well established in atmospheric physics, but published models handle it
      through correlated-k or line-by-line methods, not analytic expressions. The value ${e("k = 6")}
      was chosen so Venus (96% CO&#8322; + 30 ppm H&#8322;O) gives 737 K; the H&#8322;O coefficient was then
      re-fitted from 0.327 to 0.336 to recover Earth&rsquo;s 288 K.</p>`),i("Expert Gas Overlap Constants (WS-derived)",`<p>The overlap constants ${e("k_{\\text{SO}_2} = 8")} and ${e("k_{\\text{NH}_3} = 20")}
      and the H&#8322;&ndash;N&#8322; CIA coefficient (3.0) are Caelum calibrations.</p>
      <p><b>Why diverge?</b> H&#8322;&ndash;N&#8322; CIA opacity is published (Wordsworth &amp;
      Pierrehumbert 2013), but as absorption coefficients for specific P-T grids, not as a
      single scalar. The coefficient 3.0 reproduces ~12 K warming at 10% H&#8322; / 90% N&#8322; / 1 bar,
      consistent with their Figure 2. SO&#8322; and NH&#8323; overlap constants were calibrated so
      Venus in Full mode matches 737 K with NASA trace-gas values.</p>
      ${s("H&#8322;&ndash;N&#8322; CIA: Wordsworth &amp; Pierrehumbert (2013), Science 339. SO&#8322;/NH&#8323; overlap: Caelum calibration.")}`),i("Surface Temperature Divisor (WS-derived)",`<p>The factor ${e("\\text{surfDiv} = 1 - 0.1 \\cdot \\min(\\tau, 1)")} that ramps from
      1.0 (airless) to 0.9 (atmosphere with ${e("\\tau \\ge 1")}) is a Caelum parameterisation.</p>
      <p><b>Why diverge?</b> In real atmospheres, convective transport creates a temperature
      difference between the radiative emission level and the surface (the lapse rate). Published
      models use full convective adjustment or adiabatic profiles. The 0.9 factor is a crude
      correction that improves surface temperature accuracy for Earth-like atmospheres without
      adding a convective model. It has no published basis beyond calibration.</p>`),i("Planet Mass&ndash;Radius Compression Exponent (WS-derived)",`<p>The mass-dependent exponent ${e("\\alpha(M) = \\min(1/3,\\; 0.257 - 0.0161 \\ln M)")})
      is a Caelum fit. Published mass-radius relations (Zeng &amp; Sasselov 2013, Fortney 2007)
      provide specific curves for fixed compositions, not a single analytic expression with CMF
      as a continuous parameter.</p>
      <p><b>Why diverge?</b> Caelum needs a formula where both mass and CMF are free
      parameters. The CMF prefactor ${e("(1.07 - 0.21 \\cdot \\text{CMF})")} comes from Zeng &amp;
      Sasselov (2016). The exponent was fitted to reproduce all four Solar System rocky planets:
      Mercury (0.3% error), Venus (0.8%), Earth (0.2%), Mars (0.5%).</p>
      ${s("CMF scaling: Zeng &amp; Sasselov (2016). Exponent: Caelum fit to Solar System data.")}`),i("Core Cooling and Inner-Core Growth (WS-derived / Simplified)",`<p>The cooling coordinate ${e("\\tau_{\\text{proxy}}=2+12\\,\\text{CMF}\\sqrt{\\max(M,0.01)}")},
      nucleation coordinate 0.60, fully-solid coordinate 1.95, and the Earth/comparative bound
      pairs are Caelum calibration constants. The post-nucleation square-root radial form is
      literature-informed, while applying it to this comparative coordinate is a simplification.</p>
      <p><b>Why diverge?</b> Published thermal-evolution models solve coupled core/mantle energy
      and entropy balances using alloy composition, conductivity, core-mantle heat flow,
      viscosity, and initial conditions that Caelum does not ask users to supply. The bounded
      parameterisation preserves explicit nucleation, monotonic spherical growth, and the cubic
      radius-to-volume identity without pretending to be a one-dimensional thermal history.
      Earth is the central anchor; Mercury and Mars deliberately remain low-confidence,
      broad-range comparisons rather than named-body overrides.</p>
      ${s("Buffett et al. (1992, 1996); Labrosse et al. (2001); Labrosse (2003); Driscoll & Bercovici (2014); Lythgoe et al. (2015)")}`),i("Magnetic Field: Core-Power and Small-Iron-World Calibration (WS-derived)",`<p>The magnetic power factor ${e("0.8+0.4S_{\\text{dyn}}")} and the bounded
      small-iron-world calibration are Caelum parameters. The latter uses a smooth CMF score
      from 0.45 to 0.70, fades out between 0.08 and 0.30 Earth masses, and applies at most an
      85% field suppression. It represents uncertain stratification or a restricted convecting
      region&mdash;not a fabricated solid-core fraction or stable-layer thickness.</p>
      <p><b>Why diverge?</b> Published dynamo scalings motivate energy-flux control and the
      dipolar/multipolar distinction, but the app lacks a solved entropy budget and radial
      conductivity structure. Keeping core material state, convective support, rotation, and
      morphology as separate gates reproduces Earth&rsquo;s strong field, Mercury&rsquo;s weak active
      field, and Mars&rsquo;s absent global field without claiming that a fieldless planet has a
      frozen core.</p>
      ${s("Olson & Christensen (2006); Christensen & Aubert (2006); Wardinski et al. (2021); Le Maistre et al. (2023); Bi et al. (2025)")}`),i("Magnetic Field: Dipolar Limit Scaling (Simplified)",`<p>The dipolar limit ${e("P_{\\text{dip}} = 96 \\cdot \\sqrt{M} \\cdot \\sqrt{\\text{CMF}/0.33}")}
      hours is a Caelum proxy for the local Rossby number. Published dynamo simulations
      (Christensen &amp; Aubert 2006) define the dipolar&ndash;multipolar transition at ${e("Ro_l \\approx 0.12")},
      which depends on convective velocity, core shell thickness, and rotation rate.</p>
      <p><b>Why diverge?</b> Computing the local Rossby number requires knowing the convective
      velocity (from buoyancy flux) and shell geometry. The mass/CMF proxy captures the key
      trend: larger, more iron-rich planets can rotate more slowly while maintaining a dipolar field.
      The 96-hour base and 50&times; Rm cutoff were calibrated so Earth (24 h) is well inside the
      dipolar regime and Venus (5832 h) has no field. A bounded Mercury-like exception preserves
      the slow-rotation amplitude reduction but reports the observed predominantly dipolar,
      north-offset large-scale geometry.</p>`),i("Magnetic Field: Multipolar Factor 0.05 (Simplified)",`<p>The 20&times; reduction in dipole field strength for the limiting multipolar calibration is a literature-informed
      simplification. Published simulations show a wide range (5&ndash;20&times;) depending on the
      Ekman number and boundary conditions.</p>
      <p><b>Why diverge?</b> Caelum uses the weak end of that range to preserve weak-field
      amplitudes for slow rotators, including the amplitude side of the Mercury-like calibration.
      The sigmoid transition avoids the unphysical discontinuity that a step function would
      produce at the dipolar limit.</p>`),i("Core Radius Fraction CRF = &radic;CMF (Simplified)",`<p>The relation ${e("\\text{CRF} = \\sqrt{\\text{CMF}}")} is a first-order approximation.
      Zeng &amp; Jacobsen (2017) derive CRF from self-consistent interior structure models that
      account for compression, phase transitions, and the density contrast between core and
      mantle at each pressure.</p>
      <p><b>Why diverge?</b> The full Zeng &amp; Jacobsen model requires numerical integration of
      the hydrostatic equation. The square-root approximation gives Earth CRF = 0.57 vs. observed
      0.545 (5% error) and scales correctly with CMF for other planets. The error is systematic
      (slight overestimate) and consistent across the rocky-planet mass range.</p>
      ${s("Zeng, L. &amp; Jacobsen, S. (2017). Approximation: Caelum simplification.")}`),i("Water-Radius Inflation: Linear Interpolation (Simplified)",`<p>Caelum linearly interpolates between the Zeng dry curve (${e("R = 1.00\\,M^{0.270}")})
      and the 50%-water curve (${e("R = 1.38\\,M^{0.263}")}) using ${e("\\text{WMF}/0.5")} as the
      blend factor. Zeng &amp; Sasselov (2016) provide discrete curves at specific water fractions,
      not a continuous interpolation scheme.</p>
      <p><b>Why diverge?</b> Publishing interior-structure curves at every possible WMF is impractical.
      Linear interpolation in the inflation factor is physically reasonable because the ice/water
      layer is less compressible than rock, making its effect on radius roughly proportional to its
      mass fraction. The error is &lt; 3% for WMF &lt; 0.3.</p>`),i("Atmospheric Circulation Cell Count (Simplified)",`<p>The step function mapping rotation period to Hadley cell count (1 / 3 / 7 / 5 cells)
      is a coarse simplification. Published GCM studies (e.g. Kaspi &amp; Showman 2015, Komacek &amp;
      Abbot 2019) show a continuous relationship where cell number depends on the Rossby
      deformation radius, which involves rotation rate, planetary radius, and static stability.</p>
      <p><b>Why diverge?</b> Running a GCM is not feasible in real time. The step function captures
      the qualitative pattern: slow rotators have a single overturning cell, Earth-like rotators
      have three, and rapid rotators have more. The specific thresholds (48 h, 6 h, 3 h) are
      approximate and should not be interpreted as sharp physical transitions.</p>`),i("Tectonic Regime Probabilities (WS-derived)",`<p>The entire five-factor multiplicative model for tectonic regime probabilities is a Caelum
      construction. No published paper provides a quantitative probability distribution over
      tectonic regimes as a function of mass, age, water, CMF, and tidal heating.</p>
      <p><b>Why diverge?</b> The science of exoplanet tectonics is genuinely unsettled.
      Valencia et al. (2007) argue that super-Earths should have plate tectonics;
      O&rsquo;Neill &amp; Lenardic (2007) argue the opposite. Noack &amp; Breuer (2014) show
      strong sensitivity to initial conditions. Caelum synthesises these qualitative findings
      into a quantitative prior that helps worldbuilders, but the specific Gaussian widths, peak
      positions, and multiplicative structure are heuristic.</p>
      ${s("Qualitative basis: Valencia et al. (2007), O'Neill &amp; Lenardic (2007), Noack &amp; Breuer (2014), Korenaga (2010). Quantitative model: Caelum.")}`),i("Habitable Zone: Chromant Desmos Correction (Modified)",`<p>The Seff polynomials and the temperature proxy ${e("T_{\\text{eff}} = 5778 \\cdot M^{0.55}")}
      are described as &ldquo;Chromant Desmos correction&rdquo; rather than the original
      Kopparapu et al. (2013/2014) coefficients. The polynomial coefficients differ slightly
      from the published values.</p>
      <p><b>Why diverge?</b> The original Kopparapu polynomials use actual stellar effective
      temperature as input. Caelum derives Teff from mass, introducing a proxy step.
      The Chromant correction adjusts the polynomial coefficients to compensate for this
      proxy and improve agreement across the 0.1&ndash;2 M&#9737; range where the mass-Teff
      relation deviates from the simple power law.</p>`),i("Atmospheric Tide Calibration Constant C = 12 (WS-derived)",`<p>The dimensionless constant ${e("C = 12")} in the atmospheric tide ratio
      ${e("b = C \\cdot P_s \\cdot S / (g \\cdot T_{\\text{eq}})")} is a Caelum calibration.</p>
      <p><b>Why diverge?</b> Published atmospheric tide models (Leconte et al. 2015, Ingersoll &amp;
      Dobrovolskis 1978) derive torque from thermal tide amplitude, which depends on atmospheric
      structure. The constant C = 12 is calibrated so Venus (92 atm, S &approx; 1.9, g &approx; 8.8,
      T<sub>eq</sub> &approx; 229 K) gives ${e("b > 1")}, correctly preventing tidal lock.
      Earth (1 atm) gives ${e("b \\ll 1")}, correctly allowing tidal evolution.</p>`),i("Planet Composition-Dependent Rigidity and Q (WS-derived)",`<p>The functions for planet tidal rigidity (${e("\\mu")}) and quality factor (${e("Q")})
      as continuous functions of CMF and WMF are Caelum parameterisations. Published values
      exist only for specific bodies (Earth: ${e("\\mu")} &approx; 80 GPa mantle + 160 GPa core averaged,
      Q &approx; 12&ndash;280 frequency-dependent).</p>
      <p><b>Why diverge?</b> Caelum needs a continuous function for arbitrary compositions.
      The base values (rock 30 GPa, iron boost 50 GPa above CMF 0.33, ice 3.5 GPa) are
      literature anchor points. The CMF-dependent Q (12 + 70&times;max(0, CMF&minus;0.2)) interpolates
      between low-Q rocky mantles and high-Q iron-rich interiors, consistent with the observation
      that Mercury (Q &sim; 30&ndash;70) is more dissipative than metallic cores but less than pure rock.</p>`),i("Moon Composition Overrides: Io and Enceladus (WS-derived)",`<p>The &ldquo;Partially molten&rdquo; (${e("\\mu")} = 10 GPa, Q = 10) and &ldquo;Subsurface ocean&rdquo;
      (${e("\\mu")} = 0.3 GPa, Q = 2) composition classes are Caelum calibrations that override
      the density-based lookup.</p>
      <p><b>Why diverge?</b> Bulk density is a reliable proxy for cold, geologically quiet moons
      but fails dramatically for extreme interiors. Without overrides, Io&rsquo;s heating is
      underpredicted by ~7&times; and Enceladus&rsquo;s by ~60&times;. The override values were chosen
      to match observed heat outputs (Io: ~10&sup1;&sup4; W, Enceladus: ~1.6 &times; 10&sup1;&deg; W within 10%).
      This approach is limited: Titan is predicted ~37&times; too high, an active area of research.</p>`),i("Love Number Differentiation Factor k&#8322; &times; 0.37 (WS-derived)",`<p>The homogeneous-body Love number formula gives k&#8322; &approx; 0.82 for Earth, but the observed
      value is 0.299 (PREM). The factor 0.37 multiplied into k&#8322; calibrates the formula to
      differentiated bodies.</p>
      <p><b>Why diverge?</b> The analytic Love number formula assumes a uniform body. Real planets
      are differentiated (dense core + less dense mantle), which reduces k&#8322;. Published corrections
      require full interior-structure integration. The 0.37 factor gives realistic Earth-Moon
      recession (3.5 cm/yr modelled vs 3.83 cm/yr observed) and consistent results across the
      Solar System.</p>`),i("Stellar CMF from Metallicity (Simplified)",`<p>The formula deriving CMF from [Fe/H] via molar mass balance uses a fixed Si/Mg ratio
      and a simplified mantle molecular weight (172 g/mol). Schulze et al. (2021) use a more
      detailed mineralogical model with multiple mantle phases.</p>
      <p><b>Why diverge?</b> The full Schulze model requires a mantle mineralogy solver. The
      simplified version captures the dominant trend: higher stellar [Fe/H] &rarr; higher Fe/Mg
      &rarr; higher CMF. It reproduces the key result that ~75% of observed rocky exoplanets
      have CMFs consistent with their host star&rsquo;s metallicity.</p>
      ${s("Schulze, J. et al. (2021), PSJ 2, 113. Simplification: Caelum.")}`),i("Vegetation Colour Extrapolation (Simplified)",`<p>PanoptesV provides pre-computed vegetation colours at 1, 3, and 10 atm for spectral
      classes A0&ndash;M8. Caelum extrapolates below 1 atm and above 10 atm with 50% dampening,
      which has no published basis.</p>
      <p><b>Why diverge?</b> No published model provides vegetation colours outside the 1&ndash;10 atm
      range. The 50% dampening is a conservative choice: physically, Rayleigh scattering effects
      should diminish below 1 atm and saturate above 10 atm, but the rate of change is unknown.
      Dampening prevents unphysical extrapolation artefacts.</p>
      ${s("LUT data: PanoptesV (panoptesv.com/SciFi). Extrapolation: Caelum.")}`),i("Spin-Orbit Resonance Capture Thresholds (Simplified)",`<p>The thresholds for resonance capture (H &gt; 0.25 for 3:2, H &gt; 0.5 for 2:1 and 5:2)
      are Caelum choices. Goldreich &amp; Peale (1966) derive capture probabilities that depend
      on the tidal dissipation rate and the approach trajectory, not just the eccentricity
      function amplitude.</p>
      <p><b>Why diverge?</b> Full capture probability computation requires integrating the
      spin-down trajectory through each resonance, which depends on Q and the spin-down rate.
      The threshold approach gives the correct qualitative result: Mercury (e = 0.206) captures
      into 3:2, and higher eccentricities enable higher-order resonances. The specific threshold
      values are order-of-magnitude estimates.</p>
      ${s("Goldreich, P. &amp; Peale, S. (1966), AJ 71, 425. Thresholds: Caelum simplification.")}`),i("Flare Rate Binning (Simplified)",`<p>The N&#8323;&#8322; values (flares per day above 10&sup3;&sup2; erg) are discretised into three spectral
      bins (FGK / early-M / late-M) and three age bands per bin. Published data (G&uuml;nther et al. 2020)
      provide continuous distributions that vary more smoothly with Teff and age.</p>
      <p><b>Why diverge?</b> The binning provides a tractable lookup table that captures the dominant
      trends: cooler stars flare more frequently, younger stars flare more frequently. Interpolation
      within bins was considered but rejected because the published uncertainties (factors of 2&ndash;5)
      are larger than the binning error. The specific N&#8323;&#8322; values within each bin are Caelum
      estimates informed by the TESS statistics.</p>`),i("Gas Giant Tidal k&#8322; &amp; Q (Empirical Fits)",`<p>Gas giant tidal parameters use mass-dependent empirical fits rather than first-principles
      interior models. The fluid Love number k&#8322; follows a sigmoid in log-mass space calibrated
      to Juno (Jupiter), Cassini (Saturn), and Voyager (ice giants). The tidal quality factor Q uses
      a piecewise fit: Jupiter \u2248 3.5&times;10&#8308; (Lainey+ 2009), Saturn \u2248 2,500 (resonance locking,
      Fuller+ 2016), ice giants \u2248 1.5&times;10&#8308; (Tittemore &amp; Wisdom 1990).</p>
      <p><b>Why diverge?</b> A first-principles k&#8322; requires solving the full interior structure
      equations with an H/He equation of state. Q depends on poorly understood dissipation mechanisms
      (turbulent viscosity, inertial waves, resonance locking). The empirical fits match all four
      Solar System giants&rsquo; observed k&#8322;/Q ratios within published uncertainty ranges.
      The k&#8322;/Q ratio also feeds into the dynamo model via moon tidal heating flux.</p>`),i("Class I Bond Albedo (Chromophore-Adjusted)",`<p>Sudarsky (2000) Class I &ldquo;ammonia cloud&rdquo; bond albedo is lowered from 0.57
      to 0.34. The original value assumed pure NH&#8323; ice crystals; real ammonia cloud
      decks contain UV-photolysis products (chromophores) that darken the atmosphere.
      The adjusted value 0.34 matches the observed geometric mean of Jupiter (0.343) and
      Saturn (0.342).</p>
      <p><b>Why diverge?</b> The theoretical Sudarsky albedo produces T<sub>eq</sub> errors of
      ~11% for all Class I gas giants, cascading into ~30% errors in internal heat flux
      and ~4% errors in magnetic field strength. The chromophore-adjusted value brings
      Jupiter T<sub>eq</sub> from 99 K to 110 K (NASA: 110 K) and internal flux from
      3.8 to 5.5 W/m&sup2; (observed: 5.4).</p>`),i("Gas Giant Magnetic Dynamo (Dual-Normalised Christensen Scaling)",`<p>The gas giant magnetic field uses Christensen (2009) energy-flux scaling with
      dual normalisation: gas giants to Jupiter (4.28 G), ice giants to the Uranus/Neptune
      geometric mean (0.18 G). A density-dependent ionic ocean shell model
      (${e("r_o/R = 0.70 \\cdot (\\rho_{\\text{ref}}/\\rho)^{0.82}")}) captures how less dense
      ice giants have thicker conducting shells due to ionic dissociation occurring at larger
      fractional radius. A compositional convection floor (0.4 W/m&sup2;) prevents unrealistically
      weak fields for low-internal-heat planets.</p>
      <p><b>Why diverge?</b> The full Christensen scaling requires numerical dynamo simulations
      to determine the proportionality constant and shell-geometry corrections. Dual normalisation
      avoids cross-regime extrapolation between thick-shell dipolar dynamos (gas giants) and
      thin-shell multipolar dynamos (ice giants). The density-dependent shell exponent (0.82) is
      calibrated to reproduce the Uranus/Neptune field ratio. The shell power law uses exponent 3.2
      instead of the theoretical 3 to account for thin-shell dipolarity reduction and stable-layer
      attenuation (Heimpel+ 2005, Christensen &amp; Wicht 2008). All four Solar System giant fields
      match within ~2%.</p>`),i("Magnetopause Plasma Inflation from Moon Tidal Heating and Atmospheric Sputtering",`<p>The magnetopause standoff uses first-principles Chapman&ndash;Ferraro dipole pressure
      balance, then inflates by a power-law factor based on total plasma loading from the planet&rsquo;s
      moons: ${e("f = (1 + H_{\\text{total}}/H_{\\text{ref}})^\\gamma")} with ${e("H_{\\text{ref}} = 4 \\times 10^5")} W
      and ${e("\\gamma = 0.047")}.</p>
      <p>Two plasma sources contribute to ${e("H_{\\text{total}}")}:</p>
      <ol>
        <li><b>Volcanic outgassing</b> (Io mechanism): tidal heating estimated via cold-body
        ${e("k_2/Q")} with thermal feedback for intensely heated moons.</li>
        <li><b>Atmospheric sputtering</b> (Triton mechanism): moons with sublimation-driven
        volatile atmospheres (N&#x2082;, CO, CH&#x2084;) are sputtered by magnetospheric ions.
        Equivalent plasma power: ${e("W = \\min(P, P_{\\text{sat}}) \\times \\pi R^2 / g \\times K")}
        where ${e("P")} is the surface vapor pressure, ${e("P_{\\text{sat}} = 10")} Pa caps
        thick-atmosphere shielding, and ${e("K = 6.5 \\times 10^{-6}")} is the calibrated
        sputtering efficiency. SO&#x2082; is excluded (already covered by tidal heating).</li>
      </ol>
      <p>Species eligibility requires: density below max threshold, surface temperature in the
      sublimation regime (below triple point), Jeans ${e("\\lambda > 6")}, and escape timescale
      exceeding system age.</p>
      <p><b>Why diverge?</b> The conversion from heating/sputtering to plasma loading
      involves complex intermediate steps that cannot be computed from first principles without
      detailed interior and magnetospheric models. The power-law inflation is calibrated
      to all four Solar System giants: Jupiter ~75 Rp, Saturn ~22 Rp, Uranus ~18 Rp,
      Neptune ~23 Rp (all within 3%).</p>`),i("Maximum Stellar Age M/L &times; 10 Gyr (Simplified)",`<p>The main-sequence lifetime formula ${e("\\tau_{\\max} = M/L \\times 10")} Gyr is a
      standard textbook approximation. Published stellar evolution models (e.g. MESA/MIST,
      Choi et al. 2016) compute lifetimes from full evolutionary tracks that include composition
      effects, overshooting, and mass loss.</p>
      <p><b>Why diverge?</b> Full evolutionary tracks require stellar structure codes. The M/L
      formula captures the dominant scaling: more massive stars burn fuel faster. It matches
      MIST grid lifetimes within 20% for 0.5&ndash;2 M&#9737; and is widely used in planetary science
      for order-of-magnitude lifetime estimates.</p>`),i("Ocean Subsidence Intersection Constant (WS-modified)",`<p>The plate-model intersection amplitude uses 3,073 m instead of Parsons &amp; Sclater&rsquo;s
      published 3,200 m. This is a Caelum hybrid calibration chosen so the half-space and
      plate-model regimes intersect smoothly at 20 Myr.</p>
      <p><b>Why diverge?</b> The original PSM (1977) constants were derived independently for each
      regime. A strict join at 20 Myr with the published 3,200 m amplitude produces a ~50 m
      discontinuity. The adjusted value 3,073 eliminates this artefact while staying within
      the published uncertainty range.</p>
      ${s("Parsons &amp; Sclater (1977), JGR 82, 803. Adjustment: Caelum calibration.")}`),i("Shield Volcano 1/g Scaling (Simplified)",`<p>The shield volcano height formula ${e("H = 10{,}000/g \\times f_{\\text{lid}}")} uses a
      simple inverse-gravity scaling with a single reference point (Earth, 10 km) and a 1.5&times;
      stagnant-lid multiplier. Published models (McGovern &amp; Solomon 1993, 1998) consider
      lithospheric flexure, magma supply rates, and elastic thickness.</p>
      <p><b>Why diverge?</b> Full volcanic loading models require knowledge of lithospheric
      rheology and thermal structure. The 1/g law captures the dominant physics: yield strength
      limits column height, and gravity is the primary control. The stagnant-lid factor accounts
      for the observation that plate tectonics limits volcanic edifice lifetime. Mars validates
      the approach: 0.38 g &times; 1.5 gives 39.5 km theoretical max vs. 21.9 km observed for
      Olympus Mons (the model gives an upper bound, not a typical height).</p>`),i("Continental Margin Fixed Dimensions (Simplified)",`<p>The continental margin profile uses fixed default parameters (shelf 80 km &times; 130 m,
      slope 3.5&deg;, rise 200 km) that represent Earth averages. Real margins vary enormously:
      shelf width ranges from &lt;10 km (active margins) to &gt;300 km (passive margins).</p>
      <p><b>Why diverge?</b> A physics-based margin model would need sediment supply,
      subsidence history, sea-level curves, and tectonic setting. The fixed defaults provide a
      reasonable starting point for worldbuilding, with user-adjustable parameters for
      customisation. The 130 m shelf break depth is well-established from Pleistocene
      glacioeustatic lowstands.</p>`),i("Gas Giant Intrinsic Heat Transport Proxy (WS-derived)",`<p>The intrinsic heat model estimates ${e("T_{\\text{int}}")} from mass, density,
      age, irradiation, atmospheric enrichment, and an inferred heat-transport class. It then
      combines internal and absorbed stellar flux as
      ${e("T_{\\text{eff}}^4 = T_{\\text{eq}}^4 + T_{\\text{int}}^4")}.</p>
      <p><b>Why diverge?</b> Full gas-giant cooling tracks require detailed interior composition,
      helium rain, layered convection, equations of state, and initial entropy. Caelum uses a
      disclosed proxy so arbitrary giants can be compared consistently. Solar System giants are
      benchmark anchors, not object-specific weights, and non-Solar transiting giants are kept in
      the calibration suite to guard against Sol-system overfitting.</p>`),i("Gas Giant Ring Mass Gaussian Model (WS-derived)",`<p>The ring mass model ${e("M_{\\text{ring}} = 3 \\times 10^{19} \\, e^{-0.5(M/M_J - 1)^2}")} kg
      with Gaussian optical depth is a Caelum parameterisation. Published ring models focus on
      dynamics and structure of known ring systems, not on predicting ring properties from planet mass.</p>
      <p><b>Why diverge?</b> Ring formation and evolution depend on satellite disruption history,
      meteoroid bombardment, and viscous spreading&mdash;processes too complex for a parametric model.
      The Gaussian peaked at 1 ${e("M_J")} reflects that Saturn-mass planets have the most prominent
      rings in the Solar System.</p>`),i("Gas Giant Oblateness MOI Interpolation (WS-derived)",`<p>The moment-of-inertia factor is interpolated between 0.25 (rock-like core) and 0.22
      (centrally condensed gas giant) based on mass. Published interior models compute MOI from
      self-consistent density profiles with equations of state for hydrogen and helium.</p>
      <p><b>Why diverge?</b> Full interior structure models (e.g. Hubbard &amp; Militzer 2016)
      require numerical integration of the hydrostatic equation with an H/He EOS. The interpolation
      captures the trend that more massive giants are more centrally condensed, giving reasonable
      oblateness values for the Darwin-Radau relation.</p>`),i("Population Tech Era Density/Growth Tables (WS-derived)",`<p>The population density and growth rate values for each technological era (Hunter-Gatherer
      through Sci-Fi High) are Caelum estimates. Published historical demography provides data
      for Earth&rsquo;s specific trajectory, not generic per-era densities.</p>
      <p><b>Why diverge?</b> Earth&rsquo;s population history is a single data point shaped by
      geography, disease, and culture. The era-based table provides plausible defaults for
      worldbuilding by abstracting the dominant technological constraint on carrying capacity.
      Values are order-of-magnitude consistent with Earth history but should not be treated as
      predictions.</p>`),i("Climate Moisture Index Zone Model (WS-derived)",`<p>The three-zone moisture model (tropical Hadley: 0.9, midlatitude Ferrel: 0.5, polar: 0.2)
      with transitions at 30&deg; and 60&deg; latitude is a Caelum simplification. Published
      climate models compute precipitation from GCM-resolved atmospheric dynamics.</p>
      <p><b>Why diverge?</b> Running a GCM is not feasible in real time. The three-zone model
      captures the first-order pattern: ITCZ convergence drives tropical rainfall, subtropical
      subsidence creates deserts, and midlatitude storm tracks provide moderate precipitation.
      The zone boundaries are approximate and shift with rotation rate and obliquity.</p>`),i("Climate Tidally-Locked Temperature Model (WS-derived)",`<p>The substellar/terminator/antistellar temperature model with redistribution efficiency
      ${e("\\varepsilon")} is a Caelum parameterisation. Published tidally locked climate models
      (e.g. Pierrehumbert 2011, Leconte et al. 2013) use 3D GCMs that resolve atmospheric heat
      transport.</p>
      <p><b>Why diverge?</b> The analytic model provides instant temperature estimates for the
      three characteristic zones of a tidally locked planet. The redistribution efficiency
      ${e("\\varepsilon")} encapsulates atmospheric heat transport in a single parameter, varying
      from 0 (no atmosphere) to 1 (perfect redistribution). Real atmospheres show complex spatial
      patterns that depend on composition, pressure, and stellar spectrum.</p>`)].join("")}function Ze(){return[a("Titius-Bode Orbit Spacing",`<div class="sci-formula__eq">${t("a_n = \\begin{cases} a_1 & n = 1 \\\\ a_1 + s \\cdot 2^{n-2} & n \\ge 2 \\end{cases}")}</div>
      <p>Geometric sequence of orbital slots generalising the Titius-Bode law. Spacing factor ${e("s")} is user-adjustable.</p>`),a("Host Frames (S-Type and P-Type)",`<div class="sci-formula__eq">${t("\\text{host frame} \\in \\{\\text{star} \\Rightarrow \\text{S-type},\\; \\text{pair} \\Rightarrow \\text{P-type}\\}")}</div>
      <p>Caelum resolves planetary architectures from a stellar hierarchy tree. A <b>star node</b> creates a circumstellar <b>S-type</b> host frame around one star. A <b>pair node</b> creates a circumbinary or barycentric <b>P-type</b> host frame around a bound stellar pair.</p>
      <p>Each host frame gets its own orbit ladder, habitable zone, frost line, visible companion forcing, and stability envelope. In triples and quads, the active frame is taken from the selected star or pair node inside the hierarchical topology.</p>
      <p>This is why the same planetary semi-major axis can be viable in one host frame and unstable in another: the selected frame changes which stars count as the local host and which count as outer companions.</p>`),a("Frost Line",`<div class="sci-formula__eq">${t("d_{\\text{frost}} = 4.85 \\sqrt{L} \\text{ AU}")}</div>
      <p>Distance at which water ice is stable, derived from the equilibrium temperature condition (~170 K).</p>`),a("System Inner Limit (Roche)",`<div class="sci-formula__eq">${t("d_{\\text{inner}} = \\frac{2.455 \\cdot R_\\star \\cdot (\\rho_\\star / 5400)^{1/3}}{1 \\text{ AU}}")}</div>
      <p>Fluid Roche limit for the closest orbit a body can occupy without tidal disruption. Reference density 5,400 kg/m&sup3;.</p>
      <p>Caelum also reuses Roche-limit logic inside the ring-science pipeline. In rocky-world auto mode, rings only appear when an assigned moon&rsquo;s current periapsis crosses the rocky Roche limit, turning the disrupted-moon case into a visible ring source rather than a stable moon orbit.</p>`),a("Binary Stability Limits (Holman-Wiegert)",`<p>For binary systems, Caelum uses Holman &amp; Wiegert (1999) style empirical critical radii to decide whether an orbit stays comfortably stable in an S-type or P-type frame.</p>
      <div class="sci-formula__eq">${t("a_{\\text{c,S}} = \\bigl(0.464 - 0.380\\mu - 0.631e + 0.586\\mu e + 0.150e^2 - 0.198\\mu e^2\\bigr)\\,a_{\\text{bin}}")}</div>
      <div class="sci-formula__eq">${t("a_{\\text{c,P}} = \\bigl(1.60 + 5.10e - 2.22e^2 + 4.12\\mu - 4.27\\mu e - 5.09\\mu^2 + 4.61\\mu^2 e^2\\bigr)\\,a_{\\text{bin}}")}</div>
      ${o([["a_{\\text{c,S}}","outer stability edge for circumstellar S-type planets"],["a_{\\text{c,P}}","inner stability edge for circumbinary P-type planets"],["a_{\\text{bin}}","binary semi-major axis"],["e","binary eccentricity"],["\\mu","companion mass fraction = M_2 / (M_1 + M_2)"]])}
      <p>Caelum also carries simple disk-edge companions to these limits: circumstellar disk truncation ${e("a_{\\text{disk,S}} \\approx 0.3\\,a_{\\text{bin}}(1-e)")} and circumbinary inner clearing ${e("a_{\\text{disk,P}} \\approx 2\\,a_{\\text{bin}}(1+e)")}. These are used to explain why some host frames have narrow or heavily truncated orbit families.</p>
      ${s("Holman &amp; Wiegert (1999), AJ 117, 621; Artymowicz &amp; Lubow (1994), ApJ 421, 651")}`),a("Companion Flux and Habitable-Zone Shift",`<p>Outer companion stars are sampled across their hierarchy orbits and their mean visible-light forcing is added to the active host frame as an extra heating term:</p>
      <div class="sci-formula__eq">${t("S_{\\text{comp}} = \\sum_i \\frac{L_i}{d_i^2}")}</div>
      <p>Caelum then shifts the host frame&rsquo;s habitable-zone bounds by subtracting that companion flux from the required stellar-flux threshold:</p>
      <div class="sci-formula__eq">${t("d' = \\sqrt{\\frac{L_{\\text{host}}}{S_{\\text{eff}} - S_{\\text{comp}}}}")}</div>
      ${o([["S_{\\text{comp}}","mean companion visible flux in Earth-flux units"],["L_i","luminosity of companion star i (solar units)"],["d_i","sampled distance from the active host frame to companion star i (AU)"],["L_{\\text{host}}","luminosity carried by the active local host frame"],["S_{\\text{eff}}","required habitable-zone effective flux threshold"]])}
      <p>Numerically, the same companion flux also shifts the effective frost-line context because the selected host frame sees more total radiative power than the local star or pair alone.</p>
      ${s("Caelum hierarchical host-frame flux model in engine/homeSystem/flux.js")}`),a("Hierarchical Guardrail for Triples and Quads",`<p>For nested triples and quads, Caelum uses a Mardling-Aarseth style separation floor so outer branches do not crowd inner pairs:</p>
      <div class="sci-formula__eq">${t("a_{\\text{out,min}} \\approx a_{\\text{in}} \\cdot \\frac{2.8\\,(1+q_{\\text{out}})^{2/5}(1+e_{\\text{out}})^{2/5}}{(1-e_{\\text{out}})^{6/5}} \\cdot f_i")}</div>
      ${o([["a_{\\text{in}}","inner pair semi-major axis"],["a_{\\text{out,min}}","recommended minimum outer semi-major axis"],["q_{\\text{out}}","outer companion-to-inner-system mass ratio"],["e_{\\text{out}}","outer eccentricity"],["f_i","inclination factor used by Caelum (0.7&ndash;1.0)"]])}
      <p>The Star page guardrail summary labels layouts as <b>Good</b>, <b>Caution</b>, <b>Unstable</b>, or <b>Blocked</b> by comparing the chosen outer orbit against this threshold and against the simpler periapsis-versus-apocentre overlap test.</p>
      ${s("Mardling &amp; Aarseth (2001), MNRAS 321, 398; Caelum hierarchy guardrails in engine/homeSystem/stability.js")}`),a("Lifecycle Timeline Evidence Model",`<div class="sci-formula__eq">${t("\\text{state} \\in \\{\\text{past},\\;\\text{current},\\;\\text{future},\\;\\text{conditional}\\}")}</div>
      <div class="sci-formula__eq">${t("\\text{role} \\in \\{\\text{birth},\\;\\text{early},\\;\\text{current},\\;\\text{transition},\\;\\text{risk},\\;\\text{endpoint}\\}")}</div>
      <div class="sci-formula__eq">${t("\\text{state}(t) = \\begin{cases}\\text{future} & t_{\\text{now}} < t_{\\text{start}} \\\\ \\text{past} & t_{\\text{now}} > t_{\\text{end}} \\\\ \\text{current} & \\text{otherwise}\\end{cases}")}</div>
      <p>Lifecycle Timelines are evidence-weighted summaries assembled from the same source contexts used elsewhere in the app. They add explicit birth, current, transition/risk, and endpoint roles to the older Era Timeline object shape, so star, planet, moon, and System Fate pages can read from formation to broad endpoint without creating a parallel renderer.</p>
      <p>Stellar timelines group formation/ignition, saturated high-energy youth, lifecycle phase, HZ migration, supernova transition risk where applicable, and remnant endpoint. Planet and moon timelines group formation, volatile delivery or loss, high-XUV exposure, atmosphere trends, ocean chemistry, tidal support, magnetosphere/radiation context, haze, carbon-cycle limits, subtype evidence, orbital fate, parent stellar fate, and small-body forcing.</p>
      <p>Rows are labelled as past, current, future, or conditional when age bounds allow it, and each row carries confidence, drivers, caveats, source-model versions, and model-limit notes. The timeline is not a reconstructed history and does not run a time-stepped stellar-structure, climate, geology, biology, or orbital evolution simulation.</p>
      ${c(["Accuracy tier","Used for","How to read it"],[["Analytic","Stellar lifecycle tracks and broad remnant endpoints.","Stage order and broad timing are useful, but this is not a MESA-grade stellar-structure solve."],["Evidence-summary","Planet and giant timelines assembled from current climate, atmosphere, interior, orbit, and stellar-exposure outputs.","Good for worldbuilding chronology and visible risks, not exact climate history."],["Inferred-prior","Moon origin pathways and other formation/history priors.","A plausible scenario label with confidence and warnings, not proof of the actual event."]])}
      ${c(["Timeline ingredient","How it contributes"],[["Atmosphere ledger","Current replenishment or loss tendency, dominant source, dominant sink, and future collapse/loss risk."],["Stellar history","High-XUV, wind-compression, flare, and activity intervals that can shape escape or radiation context."],["Climate and carbon cycle","Greenhouse, cloud, haze, thermostat, snowball, runaway, or CO<sub>2</sub> tendency evidence."],["Moons and tides","Shared dynamical context, resonance support, tidal heating, exospheres, and parent-radiation environment."],["Small bodies","Impact flux, volatile delivery, debris, rings, Oort-cloud injection, and crater-retention context."]])}
      <p><b>Shared limits:</b> Lifecycle Timelines do not model N-body formation, capture dynamics, impact hydrodynamics, disk evolution, stochastic bombardment, time-dependent climate, mantle/ocean thermochemistry, biosphere evolution, or detailed interior evolution. Stellar rows also do not solve full radial stellar structure, nuclear networks, convection, rotation, binary mass transfer, hydrodynamic engulfment, explosion energy, nucleosynthesis, fallback, remnant kicks, or light curves.</p>
      ${s("Caelum planetary-era context model; Catling &amp; Kasting (2017); Luger &amp; Barnes (2015); Zahnle &amp; Catling (2017)")}`),a("System Fate Aggregate Model",`<div class="sci-formula__eq">${t("\\text{lane}_{i} = \\text{body}_{i,\\text{current}} + \\text{HZ exposure}_{i}(t) + \\text{era caveats}_{i}")}</div>
      <div class="sci-formula__eq">${t("\\text{preview}(t_*) = \\{S_\\star(t_*),\\;L_\\star(t_*),\\;R_\\star(t_*),\\;\\text{HZ}(t_*),\\;\\text{lane status}_i(t_*)\\}")}</div>
      <p>The System Fate page is a whole-system aggregation layer. It combines the host-frame stellar lifecycle track, per-orbit habitable-zone exposure intervals, current planet/moon model outputs, and object Lifecycle Timeline caveats into lanes, rankings, selected-age previews, lifecycle endpoint rows, and a copy-ready report.</p>
      <p><b>Important limit:</b> the selected-age scrubber previews stellar exposure only. It does not integrate each body's future climate, ocean inventory, atmosphere chemistry, geology, orbit, biosphere, or population. A future HZ window is a worldbuilding flag, not a guarantee of future surface habitability.</p>
      ${c(["System Fate source","How it is used"],[["Stellar lifecycle track","Host stage, luminosity, radius, remnant endpoint, moving HZ, and giant/remnant caveats."],["Per-orbit HZ exposure","Current HZ status, conservative/optimistic windows, late-stage windows, engulfment, drag, and remnant flags."],["Planet and moon Lifecycle Timelines","Body-specific origin, current era, next transition, endpoint, atmosphere, hydrosphere, tidal, radiation, interior, and model-limit evidence."],["Current body model","Candidate/risk rankings use the current solved habitability, water, climate, radiation, and subtype context."]])}
      ${s("Caelum system-fate aggregation model; Hurley, Pols &amp; Tout (2000); Kopparapu et al. (2013/2014)")}`),a("Stellar Neighbourhood Hazard Model",`<div class="sci-formula__eq">${t("R_\\mathrm{SN}(<d) \\approx \\rho_\\star\\,\\Gamma_\\mathrm{SN}\\,{4\\pi d^3 \\over 3}")}</div>
      <div class="sci-formula__eq">${t("R_\\mathrm{flyby} \\approx \\rho_\\star\\,v_\\mathrm{enc}\\,\\pi b^2")}</div>
      <p>The Stellar Neighbourhood Hazards page is the external deep-time companion to System Fate. Local Cluster still owns nearby-star authoring and visual context; the hazard page interprets that neighbourhood as broad nearby-supernova exposure, stellar-flyby exposure, comet-shower/Oort disturbance potential, dense-cluster stress, affected-world groupings, assumptions, and copy-ready report text.</p>
      <p><b>Important limit:</b> expected intervals are rate screens, not scheduled events. The model does not integrate exact flyby histories, individual supernova light curves, blast transport, N-body encounters, impactor size-frequency populations, climate response, or biology.</p>
      ${c(["Hazard source","How it is interpreted"],[["Nearby supernovae","Uses local stellar density, GHZ context, generated massive-star signals, and 3 pc / 10 pc distance proxies for atmosphere stripping and mass-extinction-style exposure."],["Stellar flybys","Uses analytic encounter cross sections for very-close architecture stress and wider Oort-stirring encounters."],["Comet showers","Combines flyby exposure with Oort-cloud mass/injection and small-body reservoir context to flag background injection or shower-prone reservoirs."],["Dense-cluster stress","Classifies crowded stellar fields where external perturbation and reservoir stripping become part of the system identity."],["Affected worlds","Groups saved bodies by consequence: atmospheres/surfaces, impacts, outer reservoirs, or mostly indirect effects. It does not claim equal risk for every body."]])}
      ${s("Caelum stellar-neighbourhood hazard model; Lineweaver et al. (2004); Gehrels et al. (2003); NASA Oort Cloud and comet references; Oort-cloud literature such as Dones et al. (2004) and Kaib &amp; Quinn (2009)")}`)].join("")}function Qe(i,r){let n=r/100,p=Math.log(Math.max(i,1e-6)),l=Math.min(1/3,.257-.0161*p),u=(1.07-.21*n)*Math.pow(i,l),f=i*5.51/Math.pow(u,3);return{R:u,rho:f}}function Xe(i){let r=i.querySelector("#sci-mlr-mass"),n=i.querySelector("#sci-mlr-slider"),p=i.querySelector("#sci-mlr-result");if(r&&n&&p){let _=()=>{let h=X(Number(r.value));p.textContent=`${m(h,4)} L\u2609`};O({numberEl:r,sliderEl:n,min:.075,max:100,step:.01,mode:"log"}),r.addEventListener("input",_),n.addEventListener("input",()=>{r.dispatchEvent(new Event("input"))}),_()}let l=i.querySelector("#sci-hz-mass"),u=i.querySelector("#sci-hz-slider"),f=i.querySelector("#sci-hz-result");if(l&&u&&f){let _=()=>{let h=Number(l.value),$=X(h),T=ne(h),N=le({luminosityLsol:$,teffK:T});j(f,`${m(N.innerAu,2)} \u2013 ${m(N.outerAu,2)} AU`)};O({numberEl:l,sliderEl:u,min:.075,max:100,step:.01,mode:"log"}),l.addEventListener("input",_),u.addEventListener("input",()=>{l.dispatchEvent(new Event("input"))}),_()}let v=i.querySelector("#sci-dens-mass"),S=i.querySelector("#sci-dens-mass-slider"),M=i.querySelector("#sci-dens-cmf"),P=i.querySelector("#sci-dens-cmf-slider"),R=i.querySelector("#sci-dens-result");if(v&&S&&M&&P&&R){let _=()=>{let{R:h,rho:$}=Qe(Number(v.value),Number(M.value));j(R,`${m(h,3)} R\u2295 \u2014 ${m($,2)} g/cm\xB3`)};O({numberEl:v,sliderEl:S,min:.01,max:100,step:.01,mode:"log"}),O({numberEl:M,sliderEl:P,min:0,max:100,step:1,mode:"linear"}),[v,S,M,P].forEach(h=>h.addEventListener("input",_)),_()}let C=i.querySelector("#sci-hmag-rad"),F=i.querySelector("#sci-hmag-alb"),A=i.querySelector("#sci-hmag-alb-slider"),G=i.querySelector("#sci-hmag-result");if(C&&F&&G){let _=()=>{let h=Number(C.value),$=Number(F.value);if(h>0&&$>0){let T=de({radiusKm:h,geometricAlbedo:$});G.textContent=`H = ${m(T,2)}`}};A&&O({numberEl:F,sliderEl:A,min:.01,max:1,step:.01,mode:"linear"}),[C,F].forEach(h=>h.addEventListener("input",_)),A&&A.addEventListener("input",_),_()}let H=i.querySelector("#sci-flare-temp"),I=i.querySelector("#sci-flare-temp-slider"),B=i.querySelector("#sci-flare-age"),d=i.querySelector("#sci-flare-age-slider"),g=i.querySelector("#sci-flare-result");if(H&&B&&g){let _=()=>{let h=ce({teffK:Number(H.value),ageGyr:Number(B.value)});be(g,{countLabel:"32",countValue:h.N32,alphaValue:h.alpha})};I&&O({numberEl:H,sliderEl:I,min:2e3,max:1e4,step:100,mode:"linear"}),d&&O({numberEl:B,sliderEl:d,min:.01,max:13,step:.1,mode:"linear"}),[H,I,B,d].filter(Boolean).forEach(h=>h.addEventListener("input",_)),_()}let x=i.querySelector("#sci-leap-len"),w=i.querySelector("#sci-leap-result");if(x&&w){let _=$=>{if($===0)return{p:0,q:1};let T=0,N=1;for(let E=1;E<=1e4;E++){let q=Math.round($*E);if(Math.abs(q/E-$)<1e-9){T=q,N=E;break}}return{p:T,q:N}},h=()=>{let $=Number(x.value),T=$-Math.floor($);if(T<1e-9){U(w,[],"No leap cycle needed (integer year)");return}let E=pe(T,6).slice(1).map(_).filter(q=>q.q>0);if(E.length===0){U(w,[],"No usable cycle found");return}U(w,E.map(q=>{let se=Math.abs(q.p/q.q-T),re=se>1e-12?Math.round(1/se):1/0,xe=re===1/0?"exact":`~1 day drift per ${m(re,0)} yr`;return{fraction:`${q.p}/${q.q}`,description:`${q.p} leap day${q.p!==1?"s":""} every ${q.q} years (${xe})`}}))};x.addEventListener("input",h),h()}let k=i.querySelector("#sci-ghz-r"),b=i.querySelector("#sci-ghz-loc"),y=i.querySelector("#sci-ghz-result");if(k&&b&&y){let _=()=>{let h=Number(k.value),$=Number(b.value),T=.53*h,N=.1*h,E=Math.exp(-.5*Math.pow(($-T)/N,2)),q=$>=.47*h&&$<=.6*h;j(y,`${m(E*100,1)}%${q?" (in hard band)":""}`)};[k,b].forEach(h=>h.addEventListener("input",_)),_()}let K=i.querySelector("#sci-tec-grav"),Q=i.querySelector("#sci-tec-grav-slider"),te=i.querySelector("#sci-tec-mtn"),ae=i.querySelector("#sci-tec-shield"),ie=i.querySelector("#sci-tec-root");if(K&&Q&&te&&ae&&ie){let _=()=>{let h=Number(K.value);h>0&&(te.textContent=`${m(ue(h),0)} m`,ae.textContent=`${m(he(h),0)} m`,ie.textContent=`${m(me(5e3),0)} m`)};O({numberEl:K,sliderEl:Q,min:.05,max:5,step:.01,mode:"log"}),K.addEventListener("input",_),Q.addEventListener("input",()=>{K.dispatchEvent(new Event("input"))}),_()}}var ve=[{id:"stellar",title:"Stellar Physics",count:9,builder:He},{id:"evolution",title:"Stellar Evolution",count:9,builder:Ee},{id:"planetary",title:"Planetary Physics",count:14,builder:Le},{id:"gasgiant",title:"Gas Giant Physics",count:13,builder:Fe},{id:"interior",title:"Interior &amp; Composition",count:10,builder:Ve},{id:"tectonics",title:"Tectonics &amp; Geodynamics",count:14,builder:Je},{id:"orbital",title:"Orbital Mechanics",count:23,builder:Ge},{id:"lagrange",title:"Lagrange Points",count:4,builder:Ie},{id:"photometry",title:"Photometry &amp; Magnitudes",count:9,builder:Oe},{id:"atmosphere",title:"Atmosphere &amp; Colour",count:11,builder:Ne},{id:"climate",title:"Climate Classification",count:8,builder:Be},{id:"activity",title:"Stellar Activity",count:7,builder:De},{id:"calendar",title:"Calendar Systems",count:5,builder:We},{id:"cluster",title:"Local Cluster",count:7,builder:Ke},{id:"population",title:"Population Dynamics",count:6,builder:ze},{id:"system",title:"System Architecture",count:8,builder:Ze},{id:"debris",title:"Debris Disks",count:12,builder:je},{id:"divergences",title:"Divergences from Published Science",count:36,builder:Ue}];function ht(i){let r=document.createElement("div");r.className="page";let n=ve.map(d=>`<a class="sci-toc__link" data-target="sci-${d.id}" href="#sci-${d.id}">${d.title}</a>`).join(""),p=ve.map((d,g)=>`<details class="sci-section" id="sci-${d.id}"${g===0?" open":""}>
        <summary class="sci-section__summary">
          <span class="sci-section__title">${d.title}</span>
          <span class="sci-section__count">${d.count} equations</span>
        </summary>
        <div class="sci-section__body">${Me(d.id)}${d.builder()}</div>
      </details>`).join("");r.innerHTML=`
    <div class="panel">
      <div class="panel__header">
        <h1 class="panel__title">
          <span class="ws-icon icon--science" aria-hidden="true"></span>
          <span>Science &amp; Maths</span>
        </h1>
        <div class="badge">Reference</div>
      </div>
      <div class="panel__body">
        <p>Every calculation in Caelum is grounded in published astrophysical
        research. This page documents the formulas, models, and algorithms used
        by the engine, with citations to the original papers. The final section,
        <em>Divergences from Published Science</em>, documents every place where
        Caelum uses its own empirical fits or simplifications.</p>
        <div class="science-validation-link">
          <a class="validation-action validation-action--accent" href="#/validation">Open Validation Matrix</a>
          <span>Review benchmark anchors, invariants, trend checks, boundary checks, cross-system coupling, and release gates.</span>
        </div>
        <div class="sci-search">
          <label class="sci-search__field" for="sciencePageSearch">
            <span>Find a formula or topic</span>
            <input
              id="sciencePageSearch"
              type="search"
              placeholder="Search for habitable zone, CMF, tectonics..."
              autocomplete="off"
            />
          </label>
          <div
            id="sciencePageSearchStatus"
            class="hint sci-search__status"
            aria-live="polite"
            hidden
          ></div>
          <div id="sciencePageSearchResults" class="sci-search__results" hidden></div>
        </div>
      </div>
    </div>
    <div class="sci-reference-layout">
      <aside class="sci-local-nav" aria-label="Science topics">
        <div class="sci-local-nav__label">Topics</div>
        <div class="sci-toc">${n}</div>
      </aside>
      <div class="sci-sections">${p}</div>
    </div>
  `,i.innerHTML="",i.appendChild(r),oe(r);let l=Array.from(r.querySelectorAll(".sci-section")),u=Array.from(r.querySelectorAll(".sci-formula")),f=Array.from(r.querySelectorAll(".sci-toc__link")),v=r.querySelector("#sciencePageSearch"),S=r.querySelector("#sciencePageSearchStatus"),M=r.querySelector("#sciencePageSearchResults"),P=Ae(r),R=null,C=!1,F=l.find(d=>d.open)?.id||l[0]?.id||null,A=(d,{exclusive:g=!C}={})=>{d&&(g?l.forEach(x=>{x.open=x===d}):d.open=!0,!C&&d.id&&(F=d.id))},G=()=>{R&&(clearTimeout(R),R=null),r.querySelectorAll(".sci-formula.is-search-hit").forEach(d=>{d.classList.remove("is-search-hit")})},H=d=>{if(!d)return;let g=r.querySelector(`#${d}`);if(!g)return;let x=g.closest(".sci-section");A(x),G(),g.classList.add("is-search-hit"),ee(g,{block:"center"}),g.focus?.({preventScroll:!0}),R=window.setTimeout(()=>{g.classList.remove("is-search-hit"),R=null},2200)},I=d=>{let g=D(d);if(G(),!g){C=!1,r.classList.remove("is-search-filtering"),u.forEach(y=>{y.hidden=!1,y.classList.remove("is-search-match","is-search-filtered-out")}),l.forEach(y=>{y.hidden=!1,y.classList.remove("is-search-match","is-search-filtered-out")}),f.forEach(y=>{y.hidden=!1,y.classList.remove("is-search-filtered-out")});let b=l.find(y=>y.id===F)||l[0]||null;return A(b,{exclusive:!0}),[]}let x=ye(P,g,P.length),w=new Set(x.map(b=>b.id)),k=new Set(x.map(b=>b.sectionId));return C=!0,r.classList.add("is-search-filtering"),u.forEach(b=>{let y=w.has(b.id);b.hidden=!y,b.classList.toggle("is-search-match",y),b.classList.toggle("is-search-filtered-out",!y)}),l.forEach(b=>{let y=k.has(b.id);b.hidden=!y,b.open=y,b.classList.toggle("is-search-match",y),b.classList.toggle("is-search-filtered-out",!y)}),f.forEach(b=>{let y=k.has(b.dataset.target||"");b.hidden=!y,b.classList.toggle("is-search-filtered-out",!y)}),x},B=(d,g=null)=>{if(!M||!S)return[];let x=D(d);if(!x)return M.hidden=!0,M.innerHTML="",S.hidden=!0,S.textContent="",[];let w=g||ye(P,x,P.length),k=w.slice(0,8);return S.hidden=!1,S.textContent=w.length>0?`${w.length} match${w.length===1?"":"es"}${w.length>k.length?`, showing top ${k.length}`:""}`:"No matches found",w.length===0?(M.hidden=!1,M.innerHTML='<div class="sci-search__empty">No formulas or topics matched that search.</div>',[]):(M.hidden=!1,M.innerHTML=k.map(b=>`
          <button class="sci-search__result" type="button" data-target-id="${b.id}">
            <span class="sci-search__result-title">${b.title}</span>
            <span class="sci-search__result-meta">${b.sectionTitle}</span>
          </button>`).join(""),k)};l.forEach(d=>{d.addEventListener("toggle",()=>{if(d.open){if(!C&&d.id&&(F=d.id),C)return;l.forEach(g=>{g!==d&&(g.open=!1)})}})}),f.forEach(d=>{d.addEventListener("click",g=>{g.preventDefault();let x=d.dataset.target,w=r.querySelector(`#${x}`);w&&(A(w),ee(w,{block:"start"}))})}),v?.addEventListener("input",()=>{let d=I(v.value);B(v.value,d)}),v?.addEventListener("keydown",d=>{if(d.key!=="Enter")return;let g=I(v.value),[x]=B(v.value,g);x&&(d.preventDefault(),H(x.id))}),M?.addEventListener("click",d=>{let g=d.target.closest(".sci-search__result");g&&H(g.getAttribute("data-target-id"))}),Xe(r),fe().then(d=>ge(r,d))}export{ht as initSciencePage};
