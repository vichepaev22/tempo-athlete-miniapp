window.TempoViews = (() => {
  const el=id=>document.getElementById(id);
  const km=value=>value==null?'—':value.toLocaleString('ru-RU',{minimumFractionDigits:1,maximumFractionDigits:1});
  const time=value=>Math.floor(Math.round(value)/60)+':'+String(Math.round(value)%60).padStart(2,'0');
  const sportName=value=>({run:'Бег',swim:'Плавание',cycle:'Велосипед',walk:'Ходьба / поход'})[value]||'Тренировка';
  const sessions=value=>value+' '+(value%100>=11&&value%100<=14?'тренировок':value%10===1?'тренировка':value%10>=2&&value%10<=4?'тренировки':'тренировок');
  const selected=state=>TempoData.weeks[state.week].filter(a=>state.sport==='all'||state.sport===a.sport);
  const metric=(label,value,unit,note)=>'<div class="metric"><div class="metric-label">'+label+'</div><div class="metric-value">'+value+' <small>'+unit+'</small></div><div class="metric-note">'+note+'</div></div>';
  function chart(items){
    const ceiling=Math.max(90,Math.ceil(Math.max(0,...Array.from({length:7},(_,day)=>items.filter(a=>a.day===day).reduce((sum,a)=>sum+a.min,0)))/30)*30),scale=180/ceiling;
    let html='<title>Длительность тренировок по дням в минутах</title><desc>'+items.map(a=>a.date+': '+a.name+', '+a.min+' мин').join('; ')+'</desc><defs><pattern id="swim-pattern" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="#171b1e"/><path d="M0 8 8 0" stroke="#fff" stroke-opacity=".18"/></pattern></defs>';
    for(const n of [0,ceiling/3,ceiling*2/3,ceiling]){const y=228-n*scale;html+='<line x1="34" y1="'+y+'" x2="656" y2="'+y+'" stroke="#dfe3e5"/><text x="4" y="'+(y+4)+'" fill="#62686e" font-size="11">'+Math.round(n)+'</text>';}
    ['ПН','ВТ','СР','ЧТ','ПТ','СБ','ВС'].forEach((day,i)=>{
      const x=58+i*86;let y=228;
      items.filter(a=>a.day===i).forEach(a=>{const h=a.min*scale;y-=h;html+='<rect x="'+x+'" y="'+y+'" width="42" height="'+h+'" rx="3" fill="'+(a.sport==='run'?'#ff682d':a.sport==='swim'?'url(#swim-pattern)':'#84929b')+'"/>';});
      html+='<text x="'+(x+21)+'" y="260" text-anchor="middle" fill="#62686e" font-size="12">'+day+'</text>';
    });el('week-chart').innerHTML=html;
  }
  function list(target,items,onActivity){
    target.replaceChildren();
    items.slice().reverse().forEach(a=>{
      const b=document.createElement('button');b.type='button';b.className='activity';
      b.setAttribute('aria-label',a.name+', '+a.date+', '+km(a.km)+' километра');
      b.innerHTML='<span class="sport-mark '+(a.sport==='swim'?'swim':'')+'">'+({run:'БЕГ',swim:'ПЛВ',cycle:'ВЕЛ',walk:'ШАГ'})[a.sport]+'</span><span><span class="activity-title">'+a.name+'</span><span class="activity-meta">'+a.date+' · '+sportName(a.sport)+'</span></span><span class="activity-value">'+km(a.km)+' <small>км</small></span><span class="activity-value activity-duration">'+a.min+' <small>мин</small></span><span class="activity-arrow" aria-hidden="true">↗</span>';
      b.addEventListener('click',()=>onActivity(a));target.append(b);
    });
    if(!items.length){const note=document.createElement('p');note.className='footnote';note.textContent='В этом периоде тренировок выбранной дисциплины нет.';target.append(note);}
  }
  function render(state,onActivity){
    const items=selected(state),total=Math.round(items.reduce((v,a)=>v+a.min,0)*10)/10;
    const distance=sport=>{const chosen=items.filter(a=>a.sport===sport);return chosen.some(a=>a.km!=null)?chosen.reduce((v,a)=>v+(a.km||0),0):chosen.length?null:0;};
    const run=distance('run'),swim=distance('swim');
    let html=metric('Длительность',time(total),'ч:мин','В выбранном периоде')+metric('Тренировки',items.length,'',TempoData.live?'Ваш Garmin':'Ваша демо-история');
    html+=state.sport==='all'?metric('Бег',km(run),'км','Дистанция бега')+metric('Плавание',km(swim),'км','Дистанция плавания'):metric('Дистанция',km(state.sport==='run'?run:swim),'км','Выбранная дисциплина')+metric('Средняя сессия',Math.round(total/Math.max(1,items.length)),'мин','По длительности');
    el('metric-grid').innerHTML=html;el('week-chart').hidden=state.week==='all';if(state.week!=='all')chart(items);list(el('recent-list'),items.slice(-3),onActivity);list(el('journal-list'),items,onActivity);
    el('journal-count').textContent=items.length+' СЕССИЙ';
    const label=TempoData.weekLabels?.[state.week];el('stamp-days').textContent=label?label[0]:state.week==='current'?'05—11':'28—04';el('stamp-month').textContent=label?label[1]:state.week==='current'?'ОКТЯБРЬ 2026':'СЕНТЯБРЬ / ОКТЯБРЬ';
    const longest=items.length?Math.max(...items.map(a=>a.min)):0;
    el('chart-summary').textContent=sessions(items.length)+' · '+total+' мин · самая длинная сессия '+longest+' мин.'+(state.week==='all'?' Выберите неделю для графика по дням.':'')+(items.some(a=>a.km==null)?' Дистанция известна не для всех занятий.':'');
    el('report-observation').textContent='В выбранной '+(TempoData.live?'истории Garmin ':'демо-истории ')+sessions(items.length)+' общей длительностью '+time(total)+' ч:мин. '+(state.sport==='all'?'Бег: '+km(run)+' км. Плавание: '+km(swim)+' км.':(state.sport==='run'?'Бег: '+km(run):'Плавание: '+km(swim))+' км.');
    el('report-fact').textContent='Самая длинная сессия — '+longest+' минут. '+(TempoData.live?'Это сводка полученных данных; персональные зоны и рекомендации модели ещё не рассчитываются.':'Пульс в этой демо-истории отсутствует: зоны и интенсивность по нему не рассчитываем.');
  }
  return {render,selected,km,time,sessions,sportName};
})();
