import{a as r}from"./chunk-DFN46JRM.js";import{a as s}from"./chunk-7PVDVLB6.js";import{b as l}from"./chunk-XMLMEZIZ.js";function e(t=[]){return(Array.isArray(t)?t:[]).filter(a=>a&&a.value!=null&&a.value!=="")}function d(t=[]){return l("div",{className:"stat-rows"},e(t).map(a=>l("div",{className:"stat-row"},[l("div",{className:"stat-row__label"},[a.label||""," ",r(a.tip||"")]),l("div",{className:"stat-row__value"},[a.value]),a.meta?l("div",{className:"stat-row__meta"},[a.meta]):null])))}function i(t=[]){return`<div class="stat-rows">${e(t).map(a=>`
      <div class="stat-row">
        <div class="stat-row__label">${a.labelHtml||`${s(a.label||"")}${a.tip?` ${a.tip}`:""}`}</div>
        <div class="stat-row__value">${a.valueHtml||s(a.value)}</div>
        ${a.meta?`<div class="stat-row__meta">${s(a.meta)}</div>`:a.metaHtml?`<div class="stat-row__meta">${a.metaHtml}</div>`:""}
      </div>`).join("")}</div>`}export{d as a,i as b};
