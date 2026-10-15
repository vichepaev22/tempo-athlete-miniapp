/* Calculated observations from supplied workouts. No model calls or hidden scores. */
var TempoReport=(()=>{
  'use strict';
  const names={run:'Бег',swim:'Плавание',cycle:'Велосипед',walk:'Походы'},dayMs=86400000;
  const fmt=(v,d=1)=>v.toLocaleString('ru-RU',{maximumFractionDigits:d});
  const clock=m=>Math.floor(Math.round(m)/60)+':'+String(Math.round(m)%60).padStart(2,'0');
  const sessions=n=>n+' '+(n%100>=11&&n%100<=14?'тренировок':n%10===1?'тренировка':n%10>=2&&n%10<=4?'тренировки':'тренировок');
  const median=values=>{const a=values.slice().sort((a,b)=>a-b);return a.length?(a[Math.floor((a.length-1)/2)]+a[Math.floor(a.length/2)])/2:null;};
  const stamp=r=>{const value=r.local_start_time||r.start_time;return value?Date.parse(value.slice(0,10)+'T00:00:00Z'):null;};
  const date=d=>new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'long',timeZone:'UTC'}).format(d);
  function build(rows,{sport='all',period='Весь период'}={}){
    const count=rows.length,minutes=rows.reduce((s,r)=>s+(r.min||0),0),bySport={};
    for(const key of Object.keys(names)){const selected=rows.filter(r=>r.sport===key);bySport[key]={count:selected.length,minutes:selected.reduce((s,r)=>s+(r.min||0),0),km:selected.reduce((s,r)=>s+(r.km||0),0)};}
    const days=[...new Set(rows.map(stamp).filter(v=>v!==null&&Number.isFinite(v)))].sort((a,b)=>a-b);
    const gapDays=Math.max(0,...days.slice(1).map((d,i)=>(d-days[i])/dayMs-1));
    const hr=rows.map(r=>r.heart_rate).filter(v=>v!=null&&Number.isFinite(v));
    const zeroDistance=rows.filter(r=>r.km===0&&r.min>0).length,missingDistance=rows.filter(r=>r.km==null).length;
    const dated=rows.filter(r=>stamp(r)!==null),months=[...new Set(dated.map(r=>(r.local_start_time||r.start_time).slice(0,7)))].sort().map(month=>{
      const group=dated.filter(r=>(r.local_start_time||r.start_time).startsWith(month));return {month,count:group.length,minutes:group.reduce((s,r)=>s+r.min,0),km:group.reduce((s,r)=>s+(r.km||0),0)};
    });
    const paceRows=rows.filter(r=>r.km>0&&r.min>0),pace=sport==='run'&&paceRows.length?paceRows.reduce((s,r)=>s+r.min,0)/paceRows.reduce((s,r)=>s+r.km,0):null;
    const zoneRows=rows.filter(r=>Object.values(r.archive_metrics?.heart_rate_zone_seconds||{}).some(value=>Number.isFinite(value)&&value>0)),zones={};
    for(const r of zoneRows)for(const [zone,seconds] of Object.entries(r.archive_metrics.heart_rate_zone_seconds))zones[zone]=(zones[zone]||0)+seconds;
    const result={count,minutes,bySport,days:days.length,gapDays,months,hrCount:hr.length,hrMedian:median(hr),zeroDistance,missingDistance,pace,zoneCount:zoneRows.length,zones,sections:[]};
    if(!count)return result;
    const longest=Math.max(...rows.map(r=>r.min||0)),typical=median(rows.map(r=>r.min||0)),span=days.length?(days.at(-1)-days[0])/dayMs+1:0;
    const weeks=new Set(days.map(d=>d-((new Date(d).getUTCDay()+6)%7)*dayMs));
    const dominant=Object.entries(bySport).sort((a,b)=>b[1].minutes-a[1].minutes)[0];
    result.headline=sport==='all'?'Главная дисциплина — '+names[dominant[0]].toLowerCase():names[sport]+': ваша история за выбранный период';
    result.summary=sessions(count)+' · '+clock(minutes)+' ч:мин'+(days.length?' · '+date(days[0])+' — '+date(days.at(-1)):'')+'. '+(sport==='all'?names[dominant[0]]+' занимает '+fmt(dominant[1].minutes/Math.max(1,minutes)*100)+'% времени по таймеру.':'Дистанция — '+fmt(bySport[sport].km,3)+' км.');
    if(months.length>2){const top=months.slice().sort((a,b)=>b.minutes-a.minutes).slice(0,2);result.sections.push({title:'Главный вывод по истории',text:'На два самых объёмных по времени месяца — '+top.map(m=>new Intl.DateTimeFormat('ru-RU',{month:'long',timeZone:'UTC'}).format(Date.parse(m.month+'-01T00:00:00Z'))).join(' и ')+' — приходится '+fmt(top.reduce((n,m)=>n+m.minutes,0)/minutes*100)+'% времени выбранной истории. Объём распределён по месяцам неравномерно. Для сравнения формы нужны сопоставимые занятия с известной задачей; по одному объёму вывод о прогрессе сделать нельзя.'});}
    result.sections.push({title:'Регулярность и восстановление',text:days.length?'Записи есть в '+days.length+' днях и '+weeks.size+' календарных неделях. Период между первой и последней записью — '+span+' дн.; в среднем '+fmt(count/span*7)+' занятия за 7 дней. Самый длинный промежуток без записи — '+gapDays+' дн. Это характеристика журнала; отсутствие записей не доказывает отсутствие активности или полноценное восстановление.':'Даты занятий неизвестны: частоту и интервалы оценить нельзя.'});
    result.sections.push({title:'Как распределён объём',text:'Типичная сессия по медиане — '+fmt(typical)+' мин, самая длинная — '+fmt(longest)+' мин ('+fmt(longest/Math.max(1,minutes)*100)+'% времени периода). '+(sport==='all'?'Объёмы бега, плавания и велосипеда показаны раздельно: складывать километры в общий тренировочный объём некорректно.':'Средняя длительность — '+fmt(minutes/count)+' мин. Длительность сама по себе не показывает интенсивность или тренировочный эффект.')});
    if(months.length>1){const peak=months.slice().sort((a,b)=>b.minutes-a.minutes)[0];result.sections.push({title:'Динамика периода',text:'Больше всего времени в журнале: '+new Intl.DateTimeFormat('ru-RU',{month:'long',year:'numeric',timeZone:'UTC'}).format(Date.parse(peak.month+'-01T00:00:00Z'))+' — '+clock(peak.minutes)+' ч:мин и '+peak.count+' занятий. В таблице ниже — месяцы с записями выбранного вида. Первый и последний месяцы могут быть неполными: по их уменьшению нельзя заключить, что подготовка ухудшилась.'});}
    if(pace!==null){const seconds=Math.round(pace*60);result.sections.push({title:'Темп бега: что можно сравнивать',text:'Суммарное время занятий с известной положительной дистанцией / их дистанция: '+Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0')+' мин/км. В расчёте '+paceRows.length+' из '+count+' записей. Это темп всей выборки по таймеру, а не соревновательный прогноз. Изменение темпа без сопоставимых маршрута, условий и задачи не доказывает улучшение или ухудшение формы.'});}
    result.sections.push({title:'Пульс и интенсивность',text:hr.length?'Средний пульс указан у '+hr.length+' из '+count+' занятий. Медиана этих значений — '+fmt(result.hrMedian)+' уд/мин, диапазон — '+Math.min(...hr)+'–'+Math.max(...hr)+'. Это распределение средних по занятиям, не средний пульс всего периода. '+(zoneRows.length?'Время в настроенных зонах Garmin показано ниже. Индивидуальные пороги и задача занятий ещё нужны для интерпретации интенсивности.':'Без индивидуальных порогов и задачи занятий долю лёгких тренировок определить нельзя.'):'Средний пульс в записях отсутствует. Интенсивность и индивидуальные зоны не рассчитываются.'});
    const actions=[sport==='run'?'Для следующего разбора добавьте в Garmin описания задач пробежек: лёгкая, длительная, темповая или интервальная. Тогда объём можно будет сопоставлять с интенсивностью.':sport==='swim'?'Для сравнения заплывов нужны задача, стиль, отрезки и отдых. Длина бассейна из ZIP, когда она записана Garmin, уже доступна в карточке занятия.':'Для следующего разбора полезны задача каждой сессии и субъективная тяжесть; это поможет различать объём и интенсивность.'];
    if(zoneRows.length)result.sections.push({title:'Зоны, записанные Garmin',text:'В архиве есть время в зонах для '+zoneRows.length+' из '+count+' занятий. '+Object.entries(zones).filter(([zone])=>Number(zone)>=1&&Number(zone)<=5).map(([zone,seconds])=>'Зона '+zone+': '+fmt(seconds/60)+' мин').join('; ')+'. Это исходные настройки Garmin, а не зоны, рассчитанные нашим сервисом. Без порогов и проверки их настройки нельзя оценить правильность зон или назначать по ним нагрузку.'});
    if(zeroDistance)actions.push('Проверьте '+zeroDistance+' запись с нулевой дистанцией: это может быть особенность тренировки или экспорта; причина не определена.');
    if(missingDistance)actions.push('Дистанция отсутствует у '+missingDistance+' занятий: дополните её, если она известна.');
    actions.push('Для следующего персонального шага укажите цель, опыт и самочувствие. Этот отчёт не назначает увеличение нагрузки и не оценивает готовность к старту.');
    result.sections.push({title:'Что делать дальше',text:actions.join(' ')});
    return result;
  }
  function render(rows,state){
    if(typeof document==='undefined')return;
    const target=document.getElementById('training-report');if(!target)return;
    const result=build(rows,{sport:state.sport,period:state.week});target.replaceChildren();
    const p=(text,cls)=>{const n=document.createElement('p');n.textContent=text;if(cls)n.className=cls;return n;};
    target.append(p(TempoData.live?'ВАШ ОТЧЁТ / ПО ДАННЫМ ЭКСПОРТА':'ПРИМЕР ОТЧЁТА / ДЕМО-ДАННЫЕ','eyebrow'));
    const title=document.createElement('h2');title.textContent=result.count?result.headline:'За этот период записей нет';target.append(title);
    target.append(p(result.count?result.summary:'Выберите другой месяц или весь экспорт. По пустой выборке выводы не строятся.','report-summary'));
    if(window.TempoInsights)TempoInsights.render(rows,state);
    result.sections.forEach((s,i)=>{const section=document.createElement('section');section.className='report-section';const h=document.createElement('h3');h.textContent=String(i+1).padStart(2,'0')+' / '+s.title;section.append(h,p(s.text));target.append(section);});
    if(result.months.length>1){const table=document.createElement('table');table.className='csv-summary';const head=table.createTHead().insertRow();['Месяц','Занятия','Ч:мин',...(state.sport==='all'?[]:['Км'])].forEach(label=>{const th=document.createElement('th');th.textContent=label;head.append(th);});const body=table.createTBody();result.months.forEach(m=>{const row=body.insertRow();[new Intl.DateTimeFormat('ru-RU',{month:'short',timeZone:'UTC'}).format(Date.parse(m.month+'-01T00:00:00Z')),m.count,clock(m.minutes),...(state.sport==='all'?[]:[fmt(m.km,3)])].forEach(value=>row.insertCell().textContent=value);});target.append(table);}
    target.append(p('Расчётный отчёт построен по выбранным записям. ИИ-модель не вызывалась; медицинская оценка и индивидуальный тренировочный план в него не входят.','footnote'));
    const intro=document.getElementById('report-observation');if(intro)intro.textContent='Сначала — готовые выводы и следующие действия. Ниже — проверяемые показатели, в конце — источники.';
    const insight=document.querySelector('#insight-panel .insight-content');if(insight){insight.querySelector('.eyebrow').textContent='ВАШ ОТЧЁТ';insight.querySelector('h2').textContent='Что говорят ваши тренировки.';insight.querySelector('p').textContent=result.count?result.summary:'Выберите период с тренировками.';insight.querySelector('.insight-foot').textContent='РЕГУЛЯРНОСТЬ · ОБЪЁМ · ПУЛЬС · СЛЕДУЮЩИЙ ШАГ';}
  }
  return {build,render};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=TempoReport;
