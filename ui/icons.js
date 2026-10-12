window.TempoIcons = (() => {
  const paths = {
    overview:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    journal:'<path d="M5 3h14v18H5zM8 7h8M8 12h8M8 17h5"/>',
    message:'<path d="M4 4h16v12H9l-5 4V4zM8 8h8M8 12h5"/>',
    book:'<path d="M12 5v15M3 4h5l4 2 4-2h5v15h-5l-4 2-4-2H3z"/>',
    link:'<path d="m9 15 6-6M8 11l-2 2a4 4 0 0 0 5 5l2-2M11 8l2-2a4 4 0 0 1 5 5l-2 2"/>',
    check:'<path d="m5 12 4 4L19 6"/>',
    alert:'<path d="m12 3 10 18H2L12 3zM12 9v5M12 17v.1"/>',
    arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',
    close:'<path d="m6 6 12 12M6 18 18 6"/>',
    watch:'<rect x="6" y="6" width="12" height="12" rx="3"/><path d="M9 6V2h6v4M9 18v4h6v-4m-3-8v3l2 1"/>'
  };
  const svg = name => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(paths[name]||paths.arrow)+'</svg>';
  function athlete(sport){
    const start='<svg viewBox="0 0 96 64" fill="none" stroke="currentColor" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';
    if(sport==='run')return start+'<path class="speed-lines" opacity=".55" d="M5 29h14M9 39h11M4 49h11"/><path opacity=".4" d="M12 59h74"/><g class="runner-body"><circle cx="48" cy="11" r="5"/><path d="m44 20-5 17"/><g class="runner-arm back"><path d="m43 24-12-3-6 10"/></g><g class="runner-leg back"><path d="m39 37 12 10-2 11"/></g><g class="runner-arm front"><path d="m43 24 9 8 11-8"/></g><g class="runner-leg front"><path d="m39 37-11 12H15"/></g></g></svg>';
    if(sport==='swim')return start+'<g class="swimmer-body"><circle cx="68" cy="26" r="4.5"/><path d="m60 31-33 3"/><g class="swim-arm rear"><path d="m58 31 16 9 12-6"/></g><g class="swim-arm front"><path d="m58 31-13-16-22 2"/></g><path class="swim-leg first" d="m28 34-17-4"/><path class="swim-leg second" d="m28 34-18 6"/></g><path class="water-line" opacity=".55" d="M4 48q8-7 16 0t16 0 16 0 16 0 16 0"/><path opacity=".3" d="M16 56h65"/></svg>';
    return start+'<path class="route-path" d="M19 44h42a13 13 0 0 0 0-26H36a8 8 0 0 0 0 16h37"/><circle cx="19" cy="44" r="4"/><path d="m67 28 7 6-7 6"/></svg>';
  }
  const hydrate=root=>(root||document).querySelectorAll('[data-icon]').forEach(el=>el.innerHTML=svg(el.dataset.icon));
  return {svg,athlete,hydrate};
})();
