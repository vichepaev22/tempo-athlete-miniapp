/* Personal owner pilot: Telegram signature stays in memory; no Garmin secrets. */
(() => {
  'use strict';
  const api=window.TempoGarminConfig?.api,app=window.TempoApp;
  if(!app||!api||window.TempoPrivatePreview)return;
  const telegram=window.Telegram?.WebApp,initData=telegram?.initData||'';
  const section=document.createElement('section');section.className='garmin-connection';section.setAttribute('aria-label','Синхронизация Garmin');
  const heading=document.createElement('h2');heading.textContent='Ваш Garmin.';
  const status=document.createElement('p');status.setAttribute('role','status');
  const note=document.createElement('p');note.className='footnote';note.textContent='Личное неофициальное подключение. После входа — обновление каждые 15 минут. Время — UTC+5. ИИ-анализ пока не подключён.';
  const sync=document.createElement('button');sync.className='button primary';sync.textContent='Обновить Garmin';sync.disabled=!initData;
  section.append(heading,status,sync,note);document.getElementById('sources-screen').prepend(section);
  let pollTimer,stopped=false;
  const labels={imported:'Загружен ваш экспорт Garmin. Автосинхронизация не подключена.',partial_sync_kept_export:'Новая загрузка неполная. Сохранён прежний экспорт CSV.',auth_required:'Требуется подключение Garmin через приватную форму на компьютере.',ready:'Garmin синхронизирован.',partial:'История получена частично: достигнут предел загрузки.',rate_limited:'Garmin отклонил запрос (429). Автосинхронизация остановлена; ручная попытка доступна после паузы.',access_denied:'Garmin отклонил доступ. Автосинхронизация остановлена; проверьте подключение.',provider_unavailable:'Garmin сейчас недоступен. Ранее полученная история сохранена.',invalid_response:'Не удалось проверить ответ Garmin. Ранее полученная история сохранена.',mcp_unavailable:'Сервер синхронизации временно недоступен.',loading:'Загружаем ваш Garmin…'};
  function apply(rows,connection){
    if(['garmin_csv','garmin_archive'].includes(connection.source)){TempoCsvView.apply({activities:rows,connection});return;}
    if(TempoData.imported)TempoCsvView.clear();
    const shifted=new Date(Date.now()+5*3600000),today=Date.UTC(shifted.getUTCFullYear(),shifted.getUTCMonth(),shifted.getUTCDate());
    const monday=today-((new Date(today).getUTCDay()+6)%7)*86400000;
    const date=value=>new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'long',timeZone:'Asia/Yekaterinburg'}).format(value);
    const day=value=>{const d=new Date(value+5*3600000);return Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate());};
    const mapped=rows.map(row=>{const when=Date.parse(row.start_time);return {id:row.id,sport:row.sport,name:TempoViews.sportName(row.sport),date:date(when),when,day:(new Date(day(when)).getUTCDay()+6)%7,km:row.distance_m==null?null:row.distance_m/1000,min:Math.round(row.duration_seconds/6)/10,heart_rate:row.heart_rate,duration_kind:row.duration_kind};}).sort((a,b)=>a.when-b.when);
    TempoData.live=true;TempoData.connection=connection;
    TempoData.weeks={current:mapped.filter(a=>day(a.when)>=monday&&day(a.when)<monday+7*86400000),previous:mapped.filter(a=>day(a.when)>=monday-7*86400000&&day(a.when)<monday),all:mapped};
    const select=document.getElementById('week-select');
    select.replaceChildren();[['current',date(monday-5*3600000)+' — '+date(monday+6*86400000-5*3600000)],['previous',date(monday-7*86400000-5*3600000)+' — '+date(monday-86400000-5*3600000)],['all','Вся история']].forEach(([value,label])=>{const option=document.createElement('option');option.value=value;option.textContent=label;select.append(option);});
    if(!TempoData.weeks[app.state.week])app.state.week='current';select.value=app.state.week;
    TempoData.weekLabels={current:[new Date(monday).getUTCDate()+'—'+new Date(monday+6*86400000).getUTCDate(),'ТЕКУЩАЯ НЕДЕЛЯ / UTC+5'],previous:[new Date(monday-7*86400000).getUTCDate()+'—'+new Date(monday-86400000).getUTCDate(),'ПРОШЛАЯ НЕДЕЛЯ / UTC+5'],all:['ВСЯ','ИСТОРИЯ GARMIN']};
    document.querySelector('.demo-pill').textContent=connection.status==='ready'?'● Garmin · '+TempoViews.sessions(mapped.length):'○ Garmin · '+(labels[connection.status]||'Проверка подключения');
    document.querySelector('.legend-note').textContent='Garmin / личный пилот · прочие виды серым';
    document.querySelector('.app-footer>span').textContent='ТЕМП / ВАШ GARMIN';document.querySelector('.app-footer>p').textContent='Данные Garmin через MCP. Персональный анализ ИИ ещё не подключён.';
    document.querySelector('.report-badge').textContent='Сводка Garmin · без ИИ';
    const review=document.querySelector('.review-controls');if(review)review.hidden=true;
    document.querySelector('.avatar').textContent='Т';
    TempoData.sources.garmin=['Ваш Garmin через MCP',(labels[connection.status]||'Проверка подключения')+' Получено '+mapped.length+' занятий. Статус и обновление доступны в блоке Garmin. Это неофициальное личное подключение.'];
    app.refresh();
  }
  async function request(path,method='GET'){
    const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),20000);
    try{const response=await fetch(api+path,{method,headers:{'X-Telegram-Init-Data':initData},credentials:'omit',cache:'no-store',signal:controller.signal});if(!response.ok)throw Object.assign(new Error('request_failed'),{status:response.status});return await response.json();}finally{clearTimeout(timeout);}
  }
  function describe(connection){
    note.textContent=connection.source==='garmin_archive'?'Источник: полный архив Garmin ZIP. История уточнена без дубликатов CSV; автоматическая синхронизация ещё не подключена.':connection.source==='garmin_csv'?'Источник: личный экспорт Garmin CSV. Даты без указанного часового пояса. Автоматическое подключение Garmin пока не выполнено.':connection.retry_paused?'Автосинхронизация приостановлена после отказа Garmin. Ранее загруженная история сохранена. ИИ-анализ пока не подключён.':'Личное неофициальное подключение. После входа — обновление каждые 15 минут. Время — UTC+5. ИИ-анализ пока не подключён.';
    const when=connection.last_sync?new Intl.DateTimeFormat('ru-RU',{dateStyle:'short',timeStyle:'short',timeZone:'Asia/Yekaterinburg'}).format(connection.last_sync*1000):'';
    status.textContent=(connection.syncing?'Получаем тренировки…':labels[connection.status]||'Проверка подключения')+(when?' Последнее успешное обновление: '+when+' (UTC+5).':'')+(connection.skipped?' Пропущено неподдерживаемых занятий: '+connection.skipped+'.':'');
  }
  async function load(){
    try{const result=await request('/api/garmin/workouts');apply(result.activities,result.connection);describe(result.connection);}catch(error){status.textContent=error.status===401?'Откройте кабинет заново через кнопку бота Telegram.':'Не удалось связаться с сервером Garmin. Попробуйте позже.';}
  }
  async function poll(){
    if(stopped)return;
    try{const result=await request('/api/garmin/status');describe(result);if(result.syncing){pollTimer=setTimeout(poll,4000);}else{sync.disabled=false;sync.textContent='Обновить Garmin';await load();}}catch{sync.disabled=false;status.textContent='Связь с сервером прервалась. Попробуйте обновить позже.';}
  }
  sync.addEventListener('click',async()=>{sync.disabled=true;sync.textContent='Обновляем…';try{await request('/api/garmin/sync','POST');await poll();}catch(error){sync.disabled=false;sync.textContent='Обновить Garmin';status.textContent=error.status===429?'Подождите минуту перед повторным обновлением.':error.status===401?'Откройте кабинет заново через кнопку бота Telegram.':'Не удалось начать обновление. История сохранена.';}});
  if(initData){telegram.ready();apply([],{status:'loading'});load();}else{status.textContent='Для личной истории откройте «Мой кабинет» в @tempo_athlete_bot. В обычном браузере показан демонстрационный кабинет.';}
  addEventListener('pagehide',()=>{stopped=true;clearTimeout(pollTimer);});
})();
