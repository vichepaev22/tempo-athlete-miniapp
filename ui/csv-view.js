/* Generic renderer only. Personal rows are supplied by an authenticated API or private loopback response. */
window.TempoCsvView=(()=>{
  'use strict';
  const el=id=>document.getElementById(id),dayMs=86400000;
  const dateLabel=stamp=>new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'long',timeZone:'UTC'}).format(stamp);
  const dayStamp=value=>{const [y,m,d]=value.slice(0,10).split('-').map(Number);return Date.UTC(y,m-1,d);};
  const fmt=(n,digits=1)=>n.toLocaleString('ru-RU',{maximumFractionDigits:digits});
  let sourceRows=[];
  function apply(payload){
    const {activities,connection}=payload;
    const rows=activities.map(row=>{
      const stamp=dayStamp(row.start_time);
      return {...row,name:TempoViews.sportName(row.sport),date:dateLabel(stamp),when:stamp,stamp,
              local_start_time:row.start_time,month:row.start_time.slice(0,7),day:(new Date(stamp).getUTCDay()+6)%7,
              km:row.distance_m==null?null:row.distance_m/1000,min:row.duration_seconds/60};
    }).sort((a,b)=>a.local_start_time.localeCompare(b.local_start_time));
    sourceRows=rows;TempoData.live=true;TempoData.imported=true;TempoData.connection=connection;
    const shifted=new Date(Date.now()+5*3600000),today=Date.UTC(shifted.getUTCFullYear(),shifted.getUTCMonth(),shifted.getUTCDate());
    const monday=today-((new Date(today).getUTCDay()+6)%7)*dayMs;
    const months=[...new Set(rows.map(r=>r.month))].sort().reverse();
    const weeks={all:rows,current:rows.filter(r=>r.stamp>=monday&&r.stamp<monday+7*dayMs),previous:rows.filter(r=>r.stamp>=monday-7*dayMs&&r.stamp<monday)};
    const labels={all:['ВЕСЬ','ЭКСПОРТ GARMIN'],current:['НЕДЕЛЯ','ТЕКУЩАЯ'],previous:['НЕДЕЛЯ','ПРЕДЫДУЩАЯ']};
    const options=[['all','Весь экспорт · '+TempoViews.sessions(rows.length)],...months.map(month=>{
      const stamp=Date.parse(month+'-01T00:00:00Z'),name=new Intl.DateTimeFormat('ru-RU',{month:'long',year:'numeric',timeZone:'UTC'}).format(stamp);
      weeks[month]=rows.filter(r=>r.month===month);labels[month]=[name.split(' ')[0].toUpperCase(),month.slice(0,4)];return [month,name];
    }),['current','Текущая неделя'],['previous','Предыдущая неделя']];
    TempoData.weeks=weeks;TempoData.weekLabels=labels;
    const select=el('week-select'),old=window.TempoApp.state.week;
    select.replaceChildren(...options.map(([value,label])=>{const option=document.createElement('option');option.value=value;option.textContent=label;return option;}));
    const first=!TempoData.csvInitialized;TempoData.csvInitialized=true;
    window.TempoApp.state.week=first||!weeks[old]?'all':old;select.value=window.TempoApp.state.week;
    document.querySelector('.demo-pill').textContent='● Экспорт Garmin · '+TempoViews.sessions(rows.length);
    document.querySelector('.legend-note').textContent='Экспорт CSV · велосипед и походы серым';
    document.querySelector('.report-badge').textContent='Ваши данные · разбор экспорта';
    document.querySelector('.app-footer>span').textContent='ТЕМП / ЛИЧНЫЙ ЭКСПОРТ GARMIN';
    document.querySelector('.app-footer>p').textContent='Реальные записи из CSV. Автосинхронизация Garmin не подключена. Платный ИИ не используется.';
    document.querySelector('.avatar').textContent='М';
    TempoData.screens.overview=['ВАШИ ТРЕНИРОВКИ / 01','Ваша история.<br>В движении',TempoViews.sessions(rows.length)+': '+dateLabel(rows[0].stamp)+' — '+dateLabel(rows.at(-1).stamp)+' '+rows.at(-1).month.slice(0,4)+'. Реальные данные из экспорта Garmin.'];
    if(window.TempoApp.state.screen==='overview'){el('page-eyebrow').textContent=TempoData.screens.overview[0];el('page-title').innerHTML=TempoData.screens.overview[1]+'<span class="accent">.</span>';el('page-subtitle').textContent=TempoData.screens.overview[2];}
    el('consult-open').textContent='Разобрать период';
    document.querySelectorAll('.review-controls,.device-controls').forEach(n=>n.hidden=true);
    TempoData.sources.garmin=['Экспорт Garmin CSV',TempoViews.sessions(rows.length)+' с '+dateLabel(rows[0].stamp)+' по '+dateLabel(rows.at(-1).stamp)+'. Бег, плавание, велосипед и походы. Источник — сохранённый CSV; автоматический вход Garmin пока не работает. Даты сохранены как в экспорте: часовой пояс в нём не указан.'];
    const sources=el('sources-screen'),garminRow=sources.querySelector('[data-source="garmin"]').closest('.source-row');
    sources.querySelector('.source-count').innerHTML='01<small>/03</small>';
    sources.querySelector('.source-intro h2').textContent='Ваш экспорт Garmin загружен.';
    sources.querySelector('.source-intro p').textContent='История доступна в обзоре, журнале и разборе. Автосинхронизация аккаунта пока не подключена.';
    garminRow.querySelector('p').textContent='Личный CSV: бег, плавание, велосипед и походы.';
    garminRow.querySelector('.source-status').textContent='● Загружено: '+TempoViews.sessions(rows.length)+' · экспорт CSV';
    garminRow.querySelector('button').textContent='О данных ↗';
    sources.querySelector(':scope > .footnote').textContent='Графики построены по вашему экспорту. Данные Strava и Apple Watch пока не загружены; автоматического обмена с аккаунтами нет.';
    el('pair-open').hidden=true;
    if(!el('csv-analysis')){
      const section=document.createElement('section');section.className='report-section';section.id='csv-analysis';
      const index=document.createElement('span');index.className='report-index';index.textContent='ЭКСПОРТ / ФАКТЫ';
      const heading=document.createElement('h3');heading.textContent='Ваш объём в деталях';section.append(index,heading);
      document.querySelector('.report-intro').after(section);
    }
    window.TempoApp.refresh();
  }
  function buckets(items,state){
    if(state.week==='all')return [...new Set(sourceRows.map(r=>r.month))].sort().map(month=>({label:new Intl.DateTimeFormat('ru-RU',{month:'short',timeZone:'UTC'}).format(Date.parse(month+'-01T00:00:00Z')).replace('.',''),items:items.filter(r=>r.month===month)}));
    if(/^\d{4}-\d{2}$/.test(state.week)){const [year,month]=state.week.split('-').map(Number),last=new Date(Date.UTC(year,month,0)).getUTCDate();return [1,8,15,22,29].filter(start=>start<=last).map(start=>({label:start+'–'+Math.min(start+6,last),items:items.filter(r=>{const day=Number(r.local_start_time.slice(8,10));return day>=start&&day<start+7;})}));}
    return ['ПН','ВТ','СР','ЧТ','ПТ','СБ','ВС'].map((label,i)=>({label,items:items.filter(r=>r.day===i)}));
  }
  function report(items){
    const section=el('csv-analysis');if(!section)return;
    section.querySelectorAll('table,p').forEach(n=>n.remove());
    const table=document.createElement('table');table.className='csv-summary';
    const head=table.createTHead().insertRow();['Дисциплина','Занятия','Км','Таймер, ч:мин'].forEach(text=>{const cell=document.createElement('th');cell.textContent=text;head.append(cell);});
    const body=table.createTBody();
    for(const sport of ['run','swim','cycle','walk']){
      const rows=items.filter(r=>r.sport===sport);if(!rows.length)continue;
      const row=body.insertRow(),distance=rows.some(r=>r.km!=null)?fmt(rows.reduce((n,r)=>n+(r.km||0),0),3):'—';
      [TempoViews.sportName(sport),rows.length,distance,TempoViews.time(rows.reduce((n,r)=>n+r.min,0))].forEach(value=>{row.insertCell().textContent=value;});
    }
    section.append(table);
    const hr=items.filter(r=>r.heart_rate!=null).map(r=>r.heart_rate).sort((a,b)=>a-b);
    const median=hr.length?(hr[Math.floor((hr.length-1)/2)]+hr[Math.floor(hr.length/2)])/2:null;
    const days=[...new Set(items.map(r=>r.stamp))].sort((a,b)=>a-b);
    const gap=Math.max(0,...days.slice(1).map((d,i)=>(d-days[i])/dayMs-1));
    const elapsed=items.reduce((n,r)=>n+(r.elapsed_seconds||0),0),active=items.reduce((n,r)=>n+r.duration_seconds,0);
    const timeBySport=['run','swim','cycle','walk'].map(sport=>({sport,seconds:items.filter(r=>r.sport===sport).reduce((n,r)=>n+r.duration_seconds,0)})).sort((a,b)=>b.seconds-a.seconds);
    const monthCounts=[...new Set(items.map(r=>r.month))].map(month=>({month,count:items.filter(r=>r.month===month).length})).sort((a,b)=>b.count-a.count);
    const zeroDistance=items.filter(r=>r.distance_m===0&&r.duration_seconds>0);
    const facts=[
      ...(active?['Больше всего времени по таймеру: '+TempoViews.sportName(timeBySport[0].sport)+' — '+fmt(timeBySport[0].seconds/active*100)+'% выбранного объёма. Доля времени не равна доле физиологической нагрузки.']:[]),
      ...(monthCounts.length>1?['Больше всего записей в выбранном периоде: '+new Intl.DateTimeFormat('ru-RU',{month:'long',year:'numeric',timeZone:'UTC'}).format(Date.parse(monthCounts[0].month+'-01T00:00:00Z'))+' — '+TempoViews.sessions(monthCounts[0].count)+'. Первый и последний месяцы экспорта могут быть неполными.']:[]),
      ...(zeroDistance.length?['Записей с нулевой дистанцией и ненулевым временем: '+zeroDistance.length+'. Первая — '+dateLabel(zeroDistance[0].stamp)+', '+TempoViews.sportName(zeroDistance[0].sport)+'. Значения сохранены как в источнике; причину по CSV определить нельзя.']:[]),
      'Дней с тренировками: '+days.length+'. Самый длинный промежуток без записи, дней: '+gap+'. Отсутствие записи не доказывает отсутствие другой активности.',
      'Средний пульс есть у '+hr.length+' из '+items.length+' занятий.'+(median==null?'':' Медиана средних значений — '+fmt(median)+' уд/мин; это не средний пульс за весь период. Сравнивать интенсивность разных видов только по нему нельзя.'),
      'Полное время по записям: '+TempoViews.time(elapsed/60)+' ч:мин. Время таймера: '+TempoViews.time(active/60)+' ч:мин. Разница включает остановки; это не отдельная тренировочная нагрузка.',
      'Плавание в исходном CSV задано в метрах и переведено в километры. Даты и время сохранены как в экспорте, без предположения о часовом поясе. Это описательная сводка; персональный план и ИИ-консультация ещё не подключены.'
    ];
    facts.forEach(text=>{const p=document.createElement('p');p.textContent=text;section.append(p);});
  }
  function clear(){
    sourceRows=[];TempoData.imported=false;TempoData.csvInitialized=false;el('csv-analysis')?.remove();
    el('sources-screen').querySelector('.source-intro h2').textContent='Ваша история Garmin.';
    el('sources-screen').querySelector('.source-intro p').textContent='Текущий статус и обновление доступны в блоке Garmin.';
    const garminRow=el('sources-screen').querySelector('[data-source="garmin"]').closest('.source-row');
    garminRow.querySelector('p').textContent='Тренировки после синхронизации Garmin.';
    garminRow.querySelector('.source-status').textContent='Статус подключения — в блоке Garmin выше.';
    el('sources-screen').querySelector(':scope > .footnote').textContent='Данные Strava и Apple Watch пока не загружены.';
    TempoData.screens.overview=['ВАШИ ТРЕНИРОВКИ / 01','Ваша история.<br>В движении','История Garmin после синхронизации. Выберите период и дисциплину.'];
    if(window.TempoApp.state.screen==='overview')el('page-subtitle').textContent=TempoData.screens.overview[2];
  }
  return {apply,buckets,report,clear};
})();
if(window.TempoImportedDataset)TempoCsvView.apply(window.TempoImportedDataset);
