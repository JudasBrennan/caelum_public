import{a as t}from"./chunk-7PVDVLB6.js";function e(a,r,s){return`
    <div class="page-intro__item" data-page-intro-key="${t(a)}">
      <dt class="page-intro__label">${t(r)}</dt>
      <dd class="page-intro__value">${t(s)}</dd>
    </div>
  `}function c({summary:a="",controls:r="",affects:s="",primaryAction:n="",compact:o=!1,detailsTitle:l="Details",detailsSummary:p=""}={}){let i=`
    <dl class="page-intro__grid">
      ${e("controls","Controls",r)}
      ${e("affects","Affects",s)}
      ${e("start","Start with",n)}
    </dl>
  `;return o?`
      <div class="page-intro page-intro--compact" data-page-intro="true">
        <p class="page-intro__summary">${t(a)}</p>
        <details class="page-intro__details">
          <summary>
            <span>${t(l)}</span>
            <span>${t(p)}</span>
          </summary>
          ${i}
        </details>
      </div>
    `:`
    <div class="page-intro" data-page-intro="true">
      <p class="page-intro__summary">${t(a)}</p>
      ${i}
    </div>
  `}export{c as a};
