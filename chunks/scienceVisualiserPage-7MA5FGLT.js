import{a as z,b as w,c as C}from"./chunk-7FZHNDMX.js";import{a as b,d as M}from"./chunk-L76EVWF4.js";import{b as o,c as f}from"./chunk-XMLMEZIZ.js";import{a as v}from"./chunk-7PVDVLB6.js";import"./chunk-VC46IEJQ.js";var g={Explore:"Toggle the exploration controls for search, filters, and graph mode.","Reset focus":"Restore the default metallicity-focused trace and re-enable all graph filters.",Concept:"Search by concept name, tag, or short description.","Hop depth":"Trace mode shows concepts within the selected number of links around the active concept.",View:`Switch between Path trace and Atlas layouts.

Path trace focuses on the currently selected concept and its nearby dependencies. Atlas shows all enabled sections at once.`,Evidence:`Filter edges by how strongly the codebase ties them to runtime behaviour.

Runtime edges are used directly by the app, documented edges are described in comments or docs, and curated edges are explanatory links maintained for learning and navigation.`,Sections:"Show or hide major science sections in the graph so you can focus on a narrower slice of the model.","Visible Nodes":"Number of concepts currently visible after applying the active view mode, section filters, and search focus.","Visible Links":`Number of graph edges currently visible between the displayed concepts.

This includes both runtime-backed and explanatory curated links that survive the current filters.`,Upstream:"Direct prerequisite concepts that feed into the selected node. In dependency terms, these are the immediate inputs.",Downstream:"Direct dependent concepts that the selected node influences. In dependency terms, these are the immediate outputs."},J=Object.freeze({"Science - Metallicity Gradient":"Science - Local Cluster","Science - Planetary Interiors":"Science - Interior Composition","Science - Density and Radius":"Science - Planetary Physics","Science - Magnetospheres":"Science - Interior Composition","Science - Atmospheres":"Science - Atmosphere & Colour","Science - Surface Temperature":"Science - Planetary Physics","Science - Tides":"Science - Orbital Mechanics","Science - Water and Climate":"Science - Climate Classification","Science - Plate Tectonics":"Science - Tectonic & Geomorphic Science","Science - Population":"Science - Population Dynamics","Science - Apparent Sky":"Science - Photometry & Magnitudes","Science - Moons":"Science - Orbital Mechanics","Science - Gas Giants":"Science - Gas Giant Physics"}),p=Object.freeze({marginX:28,marginY:28,laneWidth:188,sectionWidth:170,sectionLabelHeight:34,sectionPadX:10,sectionPadY:12,nodeHeight:50,rowGap:18}),T=Object.freeze({trace:"Path trace",atlas:"Atlas"}),k=Object.freeze({runtime:"Runtime",documented:"Documented",curated:"Curated"}),G=Object.freeze({input:"Input",model:"Model",derived:"Derived",classifier:"Classifier"}),y="stellar_metallicity",A="trace",D="2",Q=6,I=new Map(z.map(t=>[t.id,t])),N=new Map(w.map(t=>[t.id,t])),F=new Map,j=new Map;for(let t of w)F.set(t.id,[]),j.set(t.id,[]);for(let t of C)F.get(t.sourceId)?.push(t),j.get(t.targetId)?.push(t);var V=new Map;for(let t of z)V.set(t.id,0);for(let t of w)V.set(t.sectionId,Math.max(V.get(t.sectionId)||0,t.row+1));var q=new Map(z.map(t=>{let e=Math.max(1,V.get(t.id)||1),s=p.sectionLabelHeight+p.sectionPadY*2+e*p.nodeHeight+Math.max(0,e-1)*p.rowGap;return[t.id,{x:p.marginX+t.lane*p.laneWidth,y:t.y,width:p.sectionWidth,height:s}]})),B=(()=>{let t=0,e=0;for(let s of q.values())t=Math.max(t,s.x+s.width),e=Math.max(e,s.y+s.height);return{width:t+p.marginX,height:e+p.marginY}})();function $(t){return String(t??"").trim().toLowerCase()}function L(t){return t&&typeof t.closest=="function"?t:null}function R(t,e){let s=I.get(t.sectionId),c=I.get(e.sectionId),a=(s?.lane||0)-(c?.lane||0);if(a!==0)return a;let d=(s?.y||0)-(c?.y||0);if(d!==0)return d;let l=t.row-e.row;return l!==0?l:t.label.localeCompare(e.label)}function P(t){return[...new Set(t)].map(e=>N.get(e)).filter(Boolean).sort(R).map(e=>e.id)}function W(t){return q.get(t)}function O(t){let e=W(t.sectionId),s=e.x+p.sectionPadX,c=e.y+p.sectionLabelHeight+p.sectionPadY+t.row*(p.nodeHeight+p.rowGap);return{x:s,y:c,width:e.width-p.sectionPadX*2,height:p.nodeHeight}}function Z(t,e){if(!e)return 0;let s=$(t.label);return s===e?100:s.startsWith(e)?70:s.includes(e)?50:(t.tags||[]).some(d=>$(d).includes(e))?35:$(t.summary).includes(e)?20:0}function ee(t={}){let e=String(t.label||"");return String(t.href||"")!=="#/science"?t:{...t,label:J[e]||e}}function Y(t,e){let s=$(t);return s?w.filter(c=>e.has(c.sectionId)).map(c=>({node:c,score:Z(c,s)})).filter(c=>c.score>0).sort((c,a)=>a.score-c.score||R(c.node,a.node)).slice(0,Q).map(c=>c.node):[]}function te(t,e,s){if(!t)return new Set;let c=e==="all"?Number.POSITIVE_INFINITY:Math.max(1,Number(e)||1),a=new Map;for(let i of s)a.has(i.sourceId)||a.set(i.sourceId,[]),a.has(i.targetId)||a.set(i.targetId,[]),a.get(i.sourceId).push(i.targetId),a.get(i.targetId).push(i.sourceId);let d=new Set([t]),l=[{nodeId:t,depth:0}];for(;l.length;){let i=l.shift();if(!(!i||i.depth>=c))for(let n of a.get(i.nodeId)||[])d.has(n)||(d.add(n),l.push({nodeId:n,depth:i.depth+1}))}return d}function ie(t){let e=new Set(w.filter(r=>t.enabledSections.has(r.sectionId)).map(r=>r.id)),s=C.filter(r=>t.enabledEvidence.has(r.evidence)&&e.has(r.sourceId)&&e.has(r.targetId)),c=t.selectedNodeId;e.has(c)||(c=e.has(y)?y:[...e][0]||null);let a=e;t.viewMode==="trace"&&c&&(a=te(c,t.hopDepth,s));let d=w.filter(r=>a.has(r.id)),l=s.filter(r=>a.has(r.sourceId)&&a.has(r.targetId)),i=P(l.filter(r=>r.targetId===c).map(r=>r.sourceId)),n=P(l.filter(r=>r.sourceId===c).map(r=>r.targetId)),u=new Set([c,...i,...n]),h=new Set(d.map(r=>r.sectionId)),m=l.filter(r=>r.evidence==="runtime").length,_=Y(t.search,t.enabledSections);return{selectedNodeId:c,selectedNode:N.get(c)||null,visibleNodes:d,visibleEdges:l,visibleSectionIds:h,upstreamNodeIds:i,downstreamNodeIds:n,connectedNodeIds:u,runtimeEdgeCount:m,searchResults:_}}function se(t){let e=N.get(t.sourceId),s=N.get(t.targetId);if(!e||!s)return"";let c=O(e),a=O(s);if(I.get(e.sectionId)?.lane===I.get(s.sectionId)?.lane){let m=c.x+c.width*.7,_=c.y+c.height,r=a.x+a.width*.3,E=a.y,x=Math.max(26,Math.abs(E-_)*.35),X=_+(E>=_?x:-x),K=E-(E>=_?x:-x);return`M ${m} ${_} C ${m} ${X}, ${r} ${K}, ${r} ${E}`}let l=c.x+c.width,i=c.y+c.height/2,n=a.x,u=a.y+a.height/2,h=Math.max(40,Math.abs(n-l)*.42);return`M ${l} ${i} C ${l+h} ${i}, ${n-h} ${u}, ${n} ${u}`}function ce(t){return z.map(e=>`
      <label class="science-viz__check">
        <input
          type="checkbox"
          name="scienceVizSection"
          value="${v(e.id)}"
          ${t.has(e.id)?"checked":""}
        />
        <span>${v(e.label)}</span>
      </label>`).join("")}function ne(t){return Object.entries(k).map(([e,s])=>`
      <label class="science-viz__check">
        <input
          type="checkbox"
          name="scienceVizEvidence"
          value="${v(e)}"
          ${t.has(e)?"checked":""}
        />
        <span>${v(s)}</span>
      </label>`).join("")}function U(t){return t?o("span",{className:"tip-icon",attrs:{tabindex:"0",role:"note","aria-label":"Info"},dataset:{tip:t},text:"i"}):null}function S(t,e="science-viz__empty"){return o("div",{className:e,text:t})}function ae(t,e){let s=e.selectedNode?e.selectedNode.label:"No focus";return f(t,[{label:"Visible Nodes",value:e.visibleNodes.length,meta:`${e.visibleSectionIds.size} sections in view`},{label:"Visible Links",value:e.visibleEdges.length,meta:`${e.runtimeEdgeCount} runtime-backed`},{label:"Upstream",value:e.upstreamNodeIds.length,meta:`Direct inputs to ${s}`},{label:"Downstream",value:e.downstreamNodeIds.length,meta:`Direct outputs from ${s}`}].map(c=>o("div",{className:"kpi-wrap"},[o("div",{className:"kpi"},[o("div",{className:"kpi__label"},[c.label," ",U(g[c.label]||"")]),o("div",{className:"kpi__value",text:c.value}),o("div",{className:"kpi__meta",text:c.meta})])]))),t}function oe(t,e){return e.selectedNode?t.viewMode==="trace"?`${t.hopDepth==="all"?"full trace":`${t.hopDepth}-hop trace`} around ${e.selectedNode.label}, showing ${e.visibleNodes.length} concepts and ${e.visibleEdges.length} links.`:`Atlas view across ${e.visibleSectionIds.size} sections, with ${e.visibleNodes.length} concepts and ${e.visibleEdges.length} links visible.`:"No visible concept matches the current filters."}function re(t,e,s,c){return $(c)?e.length?(f(t,e.map(a=>{let d=I.get(a.sectionId);return o("button",{className:`science-viz__result ${a.id===s?"is-active":""}`.trim(),attrs:{type:"button"},dataset:{selectNode:a.id}},[o("span",{className:"science-viz__result-title",text:a.label}),o("span",{className:"science-viz__result-meta",text:d?.label||""})])})),t):(f(t,S("No matching concepts in the enabled sections.")),t):(f(t,S('Try "metallicity", "CMF", "surface temperature", or "tectonics".')),t)}function de(t,e){let s=new Set(e.visibleNodes.map(i=>i.id)),a=z.filter(i=>e.visibleSectionIds.has(i.id)).map(i=>{let n=W(i.id);return`
        <g class="science-viz__section">
          <rect
            x="${n.x}"
            y="${n.y}"
            width="${n.width}"
            height="${n.height}"
            rx="18"
            ry="18"
          />
          <text x="${n.x+12}" y="${n.y+22}" class="science-viz__section-label">${v(i.label)}</text>
        </g>`}).join(""),d=e.visibleEdges.map(i=>{let n=N.get(i.sourceId),u=N.get(i.targetId),h=i.sourceId===e.selectedNodeId||i.targetId===e.selectedNodeId?" is-connected":"",m=e.selectedNodeId&&t.viewMode==="atlas"&&!h?" is-muted":"",_=`${n?.label||i.sourceId} \u2192 ${u?.label||i.targetId} (${k[i.evidence]||i.evidence})`;return`
        <path
          class="science-viz__edge science-viz__edge--${v(i.evidence)}${h}${m}"
          d="${se(i)}"
          marker-end="url(#scienceVizArrow)"
        >
          <title>${v(_)}</title>
        </path>`}).join(""),l=e.visibleNodes.slice().sort(R).map(i=>{let n=O(i),u=i.id===e.selectedNodeId?" is-selected":"",h=i.id!==e.selectedNodeId&&e.connectedNodeIds.has(i.id)?" is-connected":"",m=e.selectedNodeId&&t.viewMode==="atlas"&&!e.connectedNodeIds.has(i.id)?" is-muted":"",_=I.get(i.sectionId),r=`${i.label}: ${i.summary}`;return`
        <g
          class="science-viz__node science-viz__node--${v(i.kind)}${u}${h}${m}"
          transform="translate(${n.x}, ${n.y})"
          tabindex="0"
          role="button"
          aria-label="Select ${v(i.label)}"
          data-node-id="${v(i.id)}"
          data-tip="${v(r)}"
        >
          <rect width="${n.width}" height="${n.height}" rx="14" ry="14" />
          <text x="12" y="21" class="science-viz__node-label">${v(i.label)}</text>
          <text x="12" y="38" class="science-viz__node-meta">${v(`${G[i.kind]} - ${_?.label||""}`)}</text>
        </g>`}).join("");return s.size?`
    <svg
      class="science-viz__svg"
      viewBox="0 0 ${B.width} ${B.height}"
      aria-label="Science dependency graph"
    >
      <defs>
        <marker
          id="scienceVizArrow"
          markerWidth="8"
          markerHeight="8"
          refX="6"
          refY="4"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M 0 0 L 8 4 L 0 8 z" fill="context-stroke" />
        </marker>
      </defs>
      ${a}
      <g class="science-viz__edges">${d}</g>
      <g class="science-viz__nodes">${l}</g>
    </svg>
    <div class="science-viz__legend" aria-label="Graph legend">
      <div class="science-viz__legend-group">
        <div class="science-viz__legend-title">Nodes</div>
        <div class="science-viz__legend-item"><span class="science-viz__legend-swatch science-viz__legend-swatch--input"></span> Input</div>
        <div class="science-viz__legend-item"><span class="science-viz__legend-swatch science-viz__legend-swatch--derived"></span> Derived</div>
        <div class="science-viz__legend-item"><span class="science-viz__legend-swatch science-viz__legend-swatch--model"></span> Model</div>
        <div class="science-viz__legend-item"><span class="science-viz__legend-swatch science-viz__legend-swatch--classifier"></span> Classifier</div>
      </div>
      <div class="science-viz__legend-group">
        <div class="science-viz__legend-title">Edges</div>
        <div class="science-viz__legend-item"><span class="science-viz__legend-line science-viz__legend-line--runtime"></span> Runtime</div>
        <div class="science-viz__legend-item"><span class="science-viz__legend-line science-viz__legend-line--documented"></span> Documented</div>
        <div class="science-viz__legend-item"><span class="science-viz__legend-line science-viz__legend-line--curated"></span> Curated</div>
      </div>
    </div>
  `:'<div class="science-viz__empty science-viz__empty--canvas">No concepts are visible with the current filters.</div>'}function H(t){return t.length?t.map(e=>{let s=N.get(e);return o("button",{className:"science-viz__chip",attrs:{type:"button"},dataset:{selectNode:e},text:s?.label||e},[])}):[S("None in the current filter.")]}function le(t,e){let s=e.selectedNode;if(!s)return f(t,S("Choose a visible concept to inspect its dependencies.")),t;let c=I.get(s.sectionId);return f(t,[o("div",{className:"science-viz__inspector"},[o("div",{className:"science-viz__inspector-head"},[o("div",{},[o("div",{className:"science-viz__eyebrow",text:c?.label||"Unknown section"}),o("h3",{className:"science-viz__inspector-title",text:s.label})]),o("div",{className:"badge",text:G[s.kind]})]),o("p",{className:"science-viz__summary",text:s.summary}),s.formula?o("div",{className:"science-viz__formula",text:s.formula}):null,o("div",{className:"science-viz__inspector-grid"},[o("div",{},[o("div",{className:"science-viz__label",text:"Depends On"}),o("div",{className:"science-viz__chip-row"},[H(e.upstreamNodeIds)])]),o("div",{},[o("div",{className:"science-viz__label",text:"Feeds Into"}),o("div",{className:"science-viz__chip-row"},[H(e.downstreamNodeIds)])])]),o("div",{className:"science-viz__label",text:"Engine Sources"}),o("div",{className:"science-viz__code-row"},(s.engineRefs||[]).length?(s.engineRefs||[]).map(a=>o("code",{className:"science-viz__code-chip",text:a})):S("No runtime source listed.")),o("div",{className:"science-viz__label",text:"Reference Pages"}),o("div",{className:"science-viz__chip-row"},(s.docs||[]).length?(s.docs||[]).map(a=>{let d=ee(a);return o("a",{className:"science-viz__link-chip",attrs:{href:d.href},text:d.label})}):S("No documentation links listed.")),o("div",{className:"science-viz__label",text:"Tags"}),o("div",{className:"science-viz__tag-row"},(s.tags||[]).length?(s.tags||[]).map(a=>o("span",{className:"science-viz__tag",text:a})):S("No tags."))])]),t}function _e(t){let e={search:"",selectedNodeId:y,viewMode:A,hopDepth:D,enabledSections:new Set(z.map(i=>i.id)),enabledEvidence:new Set(Object.keys(k)),controlsOpen:!1},s=document.createElement("div");s.className="page science-viz-page",s.innerHTML=`
    <div class="science-viz-layout">
      <div class="panel science-viz-panel">
        <div class="panel__header">
          <h1 class="panel__title">
            <span class="ws-icon icon--science-viz" aria-hidden="true"></span>
            <span>Science Visualiser</span>
          </h1>
          <div class="viz-canvas-actions science-viz__actions">
            <div class="badge" id="scienceVizHeaderBadge">Path trace</div>
            <button id="scienceVizBtnControls" type="button" class="small">
              ${b(g.Explore)} Explore &#x25BE;
            </button>
            <button id="scienceVizResetFocus" type="button" class="small">
              ${b(g["Reset focus"])} Reset focus
            </button>
          </div>
        </div>
        <div class="science-viz-canvas-area">
          <div id="scienceVizControlsDropdown" class="science-viz-controls-dropdown" hidden>
            <div class="science-viz-controls-dropdown__row">
              <label class="science-viz__field science-viz__field--grow">
                <span>Concept ${b(g.Concept)}</span>
                <input
                  id="scienceVizSearch"
                  type="search"
                  placeholder="Search for CMF, habitable zone, tectonics..."
                  autocomplete="off"
                />
              </label>
            </div>
            <div class="science-viz-controls-dropdown__row">
              <div class="science-viz__dropdown-block science-viz__dropdown-block--results">
                <div class="science-viz__dropdown-label">Matches</div>
                <div id="scienceVizSearchResults" class="science-viz__results"></div>
              </div>
            </div>
            <div class="science-viz-controls-dropdown__row science-viz-controls-dropdown__row--dual">
              <div class="science-viz__dropdown-block">
                <div class="science-viz__dropdown-label">View ${b(g.View||"")}</div>
                <div class="physics-duo-toggle science-viz__mode-toggle" id="scienceVizModeToggle">
                  <input type="radio" name="scienceVizViewMode" id="scienceVizTrace" value="trace" checked />
                  <label for="scienceVizTrace">Path trace</label>
                  <input type="radio" name="scienceVizViewMode" id="scienceVizAtlas" value="atlas" />
                  <label for="scienceVizAtlas">Atlas</label>
                  <span></span>
                </div>
              </div>
              <label class="science-viz__field science-viz__field--compact science-viz__field--select">
                <span>Hop depth ${b(g["Hop depth"])}</span>
                <select id="scienceVizHopDepth">
                  <option value="1">1 hop</option>
                  <option value="2" selected>2 hops</option>
                  <option value="3">3 hops</option>
                  <option value="all">Full trace</option>
                </select>
              </label>
            </div>
            <div class="science-viz-controls-dropdown__row">
              <div class="science-viz__dropdown-block">
                <div class="science-viz__dropdown-label">Evidence ${b(g.Evidence||"")}</div>
                <div id="scienceVizEvidenceFilters" class="science-viz__checklist">
                  ${ne(e.enabledEvidence)}
                </div>
              </div>
            </div>
            <div class="science-viz-controls-dropdown__row">
              <div class="science-viz__dropdown-block">
                <div class="science-viz__dropdown-label">Sections ${b(g.Sections||"")}</div>
                <div id="scienceVizSectionFilters" class="science-viz__checklist">
                  ${ce(e.enabledSections)}
                </div>
              </div>
            </div>
          </div>

          <div class="science-viz__status">
            <div>
              <p class="science-viz__lede">
                Trace how WorldSmith concepts feed into each other, from stellar metallicity and multistar host frames through companion flux, orbital layout, interiors, atmospheres, moon systems, cool-star surface-moon calibration, 3:2 spin states, radiation and shielding, surface-vs-subsurface moon outcomes, climates, gas giants, debris belts, rings, and population.
              </p>
              <p id="scienceVizSummary" class="hint science-viz__summary-line"></p>
            </div>
            <div class="badge" id="scienceVizModeBadge">Path trace</div>
          </div>

          <div id="scienceVizGraph" class="science-viz__canvas"></div>

          <div class="science-viz__details">
            <div class="science-viz__details-block">
              <div class="science-viz__details-title">Overview</div>
              <div id="scienceVizKpis" class="kpi-grid science-viz__kpis"></div>
            </div>

            <div class="science-viz__details-block science-viz__details-block--inspector">
              <div class="science-viz__details-title">Inspector</div>
              <div id="scienceVizInspector"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;let c={controlsButton:s.querySelector("#scienceVizBtnControls"),controlsDropdown:s.querySelector("#scienceVizControlsDropdown"),headerBadge:s.querySelector("#scienceVizHeaderBadge"),modeBadge:s.querySelector("#scienceVizModeBadge"),searchInput:s.querySelector("#scienceVizSearch"),searchResults:s.querySelector("#scienceVizSearchResults"),hopDepth:s.querySelector("#scienceVizHopDepth"),summary:s.querySelector("#scienceVizSummary"),kpis:s.querySelector("#scienceVizKpis"),graph:s.querySelector("#scienceVizGraph"),inspector:s.querySelector("#scienceVizInspector")};function a(i){e.controlsOpen=!!i,c.controlsDropdown&&(c.controlsDropdown.hidden=!e.controlsOpen),c.controlsButton&&f(c.controlsButton,[U(g.Explore)," Explore ",e.controlsOpen?"\u25B4":"\u25BE"])}function d(){let i=ie(e);e.selectedNodeId=i.selectedNodeId,c.searchInput&&(c.searchInput.value=e.search),c.headerBadge&&(c.headerBadge.textContent=T[e.viewMode]),c.modeBadge&&(c.modeBadge.textContent=T[e.viewMode]),c.hopDepth&&(c.hopDepth.disabled=e.viewMode!=="trace"),c.summary&&(c.summary.textContent=oe(e,i)),c.searchResults&&re(c.searchResults,i.searchResults,i.selectedNodeId,e.search),c.kpis&&ae(c.kpis,i),c.graph&&(c.graph.innerHTML=de(e,i)),c.inspector&&le(c.inspector,i),M(s)}function l(i,n,u){return u?(i.add(n),!0):i.size===1&&i.has(n)?!1:(i.delete(n),!0)}s.addEventListener("input",i=>{let n=L(i.target);if(!(!n||!n.matches("input, select"))){if(n.id==="scienceVizSearch"){e.search=n.value,d();return}if(n.name==="scienceVizViewMode"){e.viewMode=n.value,d();return}if(n.id==="scienceVizHopDepth"){e.hopDepth=n.value,d();return}if(n.name==="scienceVizSection"){l(e.enabledSections,n.value,n.checked)||(n.checked=!0),d();return}n.name==="scienceVizEvidence"&&(l(e.enabledEvidence,n.value,n.checked)||(n.checked=!0),d())}}),s.addEventListener("keydown",i=>{if(i.key==="Escape"&&e.controlsOpen){a(!1);return}if(i.target===c.searchInput&&i.key==="Enter"){let u=Y(e.search,e.enabledSections)[0];u&&(e.selectedNodeId=u.id,d());return}let n=i.target?.getAttribute?.("data-node-id");n&&(i.key!=="Enter"&&i.key!==" "||(i.preventDefault(),e.selectedNodeId=n,d()))}),s.addEventListener("mousedown",i=>{let n=L(i.target);!n||!e.controlsOpen||n.closest("#scienceVizControlsDropdown")||n.closest("#scienceVizBtnControls")||a(!1)}),s.addEventListener("click",i=>{let n=L(i.target);if(n?.closest("#scienceVizBtnControls")||null){a(!e.controlsOpen);return}e.controlsOpen&&!n?.closest("#scienceVizControlsDropdown")&&a(!1);let h=n?.closest("[data-select-node]")||null;if(h){e.selectedNodeId=h.getAttribute("data-select-node")||y,d();return}let m=n?.closest("[data-node-id]")||null;if(m){e.selectedNodeId=m.getAttribute("data-node-id")||y,d();return}n?.closest("#scienceVizResetFocus")&&(e.search="",e.selectedNodeId=y,e.viewMode=A,e.hopDepth=D,e.enabledSections=new Set(z.map(r=>r.id)),e.enabledEvidence=new Set(Object.keys(k)),s.querySelector("#scienceVizTrace").checked=!0,s.querySelector("#scienceVizHopDepth").value=D,s.querySelectorAll('input[name="scienceVizSection"]').forEach(r=>{r.checked=!0}),s.querySelectorAll('input[name="scienceVizEvidence"]').forEach(r=>{r.checked=!0}),a(!1),d())}),t.innerHTML="",t.appendChild(s),a(!1),d(),M(s)}export{_e as initScienceVisualiserPage};
