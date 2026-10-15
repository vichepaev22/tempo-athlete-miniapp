window.TempoViews = (() => {
  const el=id=>document.getElementById(id);
  const km=value=>value==null?'—':value.toLocaleString('ru-RU',{minimumFractionDigits:1,maximumFractionDigits:1});
  const time=value=>Math.floor(Math.round(value)/60)+':'+String(Math.round(value)%60).padStart(2,'0');
  const sportName=value=>({run:'Бег',swim:'Плавание',cycle:'Велосипед',walk:'Ходьба / поход'})[value]||'Тренировка';
  const sessions=value=>value+' '+(value%100>=11&&value%100<=14?'тренировок':value%10===1?'тренировка':value%10>=2&&value%10<=4?'тренировки':'тренировок');
  const selected=state=>TempoData.weeks[state.week].filter(a=>state.sport==='all'||state.sport===a.sport);
  const metric=(label,value,unit,note)=>'<div class="metric"><div class="metric-label">'+label+'</div><div class="metric-value">'+value+' <small>'+unit+'</small></div><div class="metric-note">'+note+'</div></div>';
  function chart(items,state){
    const bins=TempoData.imported?TempoCsvView.buckets(items,state):['ПН','ВТ','СР','ЧТ','ПТ','СБ','ВС'].map((label,day)=>({label,items:items.filter(a=>a.day===day)}));
    const ceiling=Math.max(90,Math.ceil(Math.max(0,...bins.map(bin=>bin.items.reduce((sum,a)=>sum+a.min,0)))/30)*30),scale=180/ceiling;
    const chartLabel=TempoData.imported&&state.week==='all'?'Длительность тренировок по месяцам в минутах':'Длительность тренировок по периодам в минутах';
    el('week-chart').setAttribute('aria-label',chartLabel);
    let html='<title>'+chartLabel+'</title><desc>'+bins.map(bin=>bin.label+': '+Math.round(bin.items.reduce((n,a)=>n+a.min,0))+' мин').join('; ')+'</desc><defs><pattern id="swim-pattern" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="#171b1e"/><path d="M0 8 8 0" stroke="#fff" stroke-opacity=".18"/></pattern></defs>';
    for(const n of [0,ceiling/3,ceiling*2/3,ceiling]){const y=228-n*scale;html+='<line x1="34" y1="'+y+'" x2="656" y2="'+y+'" stroke="#dfe3e5"/><text x="4" y="'+(y+4)+'" fill="#62686e" font-size="11">'+Math.round(n)+'</text>';}
    bins.forEach((bin,i)=>{
      const spacing=600/bins.length,x=46+i*spacing,width=Math.min(48,spacing-18);let y=228;
      bin.items.forEach(a=>{const h=a.min*scale;y-=h;html+='<rect x="'+x+'" y="'+y+'" width="'+width+'" height="'+h+'" rx="3" fill="'+(a.sport==='run'?'#ff682d':a.sport==='swim'?'url(#swim-pattern)':'#84929b')+'"/>';});
      html+='<text x="'+(x+width/2)+'" y="260" text-anchor="middle" fill="#62686e" font-size="12">'+bin.label+'</text>';
    });el('week-chart').innerHTML=html;
  }
  function list(target,items,onActivity){
    target.replaceChildren();
    items.slice().reverse().forEach(a=>{
      const b=document.createElement('button');b.type='button';b.className='activity';
      b.setAttribute('aria-label',a.name+', '+a.date+', '+km(a.km)+' километра');
      b.innerHTML='<span class="sport-mark '+(a.sport==='swim'?'swim':'')+'">'+({run:'БЕГ',swim:'ПЛВ',cycle:'ВЕЛ',walk:'ШАГ'})[a.sport]+'</span><span><span class="activity-title">'+a.name+'</span><span class="activity-meta">'+a.date+' · '+sportName(a.sport)+'</span></span><span class="activity-value">'+km(a.km)+' <small>км</small></span><span class="activity-value activity-duration">'+a.min.toLocaleString('ru-RU',{maximumFractionDigits:1})+' <small>мин</small></span><span class="activity-arrow" aria-hidden="true">↗</span>';
      b.addEventListener('click',()=>onActivity(a));target.append(b);
    });
    if(!items.length){const note=document.createElement('p');note.className='footnote';note.textContent='В этом периоде тренировок выбранной дисциплины нет.';target.append(note);}
  }
  function render(state,onActivity){
    const items=selected(state),total=Math.round(items.reduce((v,a)=>v+a.min,0)*10)/10;
    const distance=sport=>{const chosen=items.filter(a=>a.sport===sport);return chosen.some(a=>a.km!=null)?chosen.reduce((v,a)=>v+(a.km||0),0):chosen.length?null:0;};
    const run=distance('run'),swim=distance('swim');
    let html=metric('Длительность',time(total),'ч:мин','В выбранном периоде')+metric('Тренировки',items.length,'',TempoData.live?'Ваш Garmin':'Ваша демо-история');
    html+=state.sport==='all'?metric('Бег',km(run),'км','Дистанция бега')+metric('Плавание',km(swim),'км','Дистанция плавания'):metric('Дистанция',km(distance(state.sport)),'км','Выбранная дисциплина')+metric('Средняя сессия',Math.round(total/Math.max(1,items.length)),'мин','По длительности');
    el('metric-grid').innerHTML=html;el('week-chart').hidden=state.week==='all'&&!TempoData.imported;if(!el('week-chart').hidden)chart(items,state);list(el('recent-list'),items.slice(-3),onActivity);list(el('journal-list'),items,onActivity);
    if(TempoData.imported){const panel=el('week-chart').closest('.chart-panel');panel.querySelector('h2').textContent=state.week==='all'?'Время тренировок по месяцам':/^\d{4}-\d{2}$/.test(state.week)?'Время тренировок за месяц':'Время тренировок по дням';panel.querySelector('.unit-label').textContent=state.week==='all'?'МИНУТЫ / МЕСЯЦ':'МИНУТЫ / ПЕРИОД';}
    el('journal-count').textContent=items.length+' СЕССИЙ';
    const label=TempoData.weekLabels?.[state.week];el('stamp-days').textContent=label?label[0]:state.week==='current'?'05—11':'28—04';el('stamp-month').textContent=label?label[1]:state.week==='current'?'ОКТЯБРЬ 2026':'СЕНТЯБРЬ / ОКТЯБРЬ';
    const longest=items.length?Math.round(Math.max(...items.map(a=>a.min))*10)/10:0;
    el('chart-summary').textContent=sessions(items.length)+' · '+total.toLocaleString('ru-RU')+' мин · самая длинная сессия '+longest.toLocaleString('ru-RU')+' мин.'+(state.week==='all'&&!TempoData.imported?' Выберите неделю для графика по дням.':'')+(items.some(a=>a.km==null)?' Дистанция известна не для всех занятий.':'');
    el('report-observation').textContent='В выбранной '+(TempoData.live?'истории Garmin ':'демо-истории ')+sessions(items.length)+' общей длительностью '+time(total)+' ч:мин. '+(state.sport==='all'?'Бег: '+km(run)+' км. Плавание: '+km(swim)+' км.':sportName(state.sport)+': '+km(distance(state.sport))+' км.');
    el('report-fact').textContent='Самая длинная сессия — '+longest.toLocaleString('ru-RU')+' минут. '+(TempoData.live?'Это сводка полученных данных; персональные зоны и рекомендации модели ещё не рассчитываются.':'Пульс в этой демо-истории отсутствует: зоны и интенсивность по нему не рассчитываем.');
    if(TempoData.imported)TempoCsvView.report(items,state);
    if(window.TempoReport)TempoReport.render(items,state);
  }
  return {render,selected,km,time,sessions,sportName};
})();
