window.TempoViews = (() => {
  const el=id=>document.getElementById(id);
  const km=value=>value.toLocaleString('ru-RU',{minimumFractionDigits:1,maximumFractionDigits:1});
  const time=value=>Math.floor(value/60)+':'+String(value%60).padStart(2,'0');
  const sessions=value=>value+' '+(value%100>=11&&value%100<=14?'тренировок':value%10===1?'тренировка':value%10>=2&&value%10<=4?'тренировки':'тренировок');
  const selected=state=>TempoData.weeks[state.week].filter(a=>state.sport==='all'||state.sport===a.sport);
  const metric=(label,value,unit,note)=>'<div class="metric"><div class="metric-label">'+label+'</div><div class="metric-value">'+value+' <small>'+unit+'</small></div><div class="metric-note">'+note+'</div></div>';
  function chart(items){
    let html='<title>Длительность тренировок по дням в минутах</title><desc>'+items.map(a=>a.date+': '+a.name+', '+a.min+' мин').join('; ')+'</desc><defs><pattern id="swim-pattern" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="#171b1e"/><path d="M0 8 8 0" stroke="#fff" stroke-opacity=".18"/></pattern></defs>';
    for(const n of [0,30,60,90]){const y=228-n*2;html+='<line x1="34" y1="'+y+'" x2="656" y2="'+y+'" stroke="#dfe3e5"/><text x="4" y="'+(y+4)+'" fill="#62686e" font-size="11">'+n+'</text>';}
    ['ПН','ВТ','СР','ЧТ','ПТ','СБ','ВС'].forEach((day,i)=>{
      const x=58+i*86;let y=228;
      items.filter(a=>a.day===i).forEach(a=>{const h=a.min*2;y-=h;html+='<rect x="'+x+'" y="'+y+'" width="42" height="'+h+'" rx="3" fill="'+(a.sport==='run'?'#ff682d':'url(#swim-pattern)')+'"/>';});
      html+='<text x="'+(x+21)+'" y="260" text-anchor="middle" fill="#62686e" font-size="12">'+day+'</text>';
    });el('week-chart').innerHTML=html;
  }
  function list(target,items,onActivity){
    target.replaceChildren();
    items.slice().reverse().forEach(a=>{
      const b=document.createElement('button');b.type='button';b.className='activity';
      b.setAttribute('aria-label',a.name+', '+a.date+', '+km(a.km)+' километра');
      b.innerHTML='<span class="sport-mark '+(a.sport==='swim'?'swim':'')+'">'+(a.sport==='run'?'БЕГ':'ПЛВ')+'</span><span><span class="activity-title">'+a.name+'</span><span class="activity-meta">'+a.date+' · '+(a.sport==='run'?'Бег':'Плавание')+'</span></span><span class="activity-value">'+km(a.km)+' <small>км</small></span><span class="activity-value activity-duration">'+a.min+' <small>мин</small></span><span class="activity-arrow" aria-hidden="true">↗</span>';
      b.addEventListener('click',()=>onActivity(a));target.append(b);
    });
    if(!items.length){const note=document.createElement('p');note.className='footnote';note.textContent='В этом периоде тренировок выбранной дисциплины нет.';target.append(note);}
  }
  function render(state,onActivity){
    const items=selected(state),total=items.reduce((v,a)=>v+a.min,0);
    const run=items.filter(a=>a.sport==='run').reduce((v,a)=>v+a.km,0),swim=items.filter(a=>a.sport==='swim').reduce((v,a)=>v+a.km,0);
    let html=metric('Время в движении',time(total),'ч:мин','В выбранном периоде')+metric('Тренировки',items.length,'','Ваша демо-история');
    html+=state.sport==='all'?metric('Бег',km(run),'км','Дистанция бега')+metric('Плавание',km(swim),'км','Дистанция плавания'):metric('Дистанция',km(state.sport==='run'?run:swim),'км','Выбранная дисциплина')+metric('Средняя сессия',Math.round(total/Math.max(1,items.length)),'мин','По длительности');
    el('metric-grid').innerHTML=html;chart(items);list(el('recent-list'),items.slice(-3),onActivity);list(el('journal-list'),items,onActivity);
    el('journal-count').textContent=items.length+' СЕССИЙ';
    el('stamp-days').textContent=state.week==='current'?'05—11':'28—04';el('stamp-month').textContent=state.week==='current'?'ОКТЯБРЬ 2026':'СЕНТЯБРЬ / ОКТЯБРЬ';
    const longest=items.length?Math.max(...items.map(a=>a.min)):0;
    el('chart-summary').textContent=sessions(items.length)+' · '+total+' мин в движении · самая длинная сессия '+longest+' мин.';
    el('report-observation').textContent='В выбранной демо-истории '+sessions(items.length)+' общей длительностью '+time(total)+' ч:мин. '+(state.sport==='all'?'Бег: '+km(run)+' км. Плавание: '+km(swim)+' км.':(state.sport==='run'?'Бег: '+km(run):'Плавание: '+km(swim))+' км.');
    el('report-fact').textContent='Самая длинная сессия — '+longest+' минут. Пульс в этой демо-истории отсутствует: зоны и интенсивность по нему не рассчитываем.';
  }
  return {render,selected,km,time,sessions};
})();
