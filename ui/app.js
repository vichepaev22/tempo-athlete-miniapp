(() => {
  'use strict';
  const el=id=>document.getElementById(id);
  const state={screen:'overview',sport:'all',week:'current',history:'ready'};
  let returnFocus=null,welcome=null,retryTimer=null;
  function toast(text,type='success'){
    const item=document.createElement('div');item.className='toast '+type;item.setAttribute('role',type==='error'?'alert':'status');
    item.innerHTML=TempoIcons.svg(type==='error'?'alert':'check');const p=document.createElement('p');p.textContent=text;item.append(p);
    const close=document.createElement('button');close.type='button';close.setAttribute('aria-label','Закрыть уведомление');close.innerHTML=TempoIcons.svg('close');
    let timer;const remove=()=>{clearTimeout(timer);item.remove();};close.addEventListener('click',remove);item.append(close);
    el('toast-stack').replaceChildren(item);TempoMotion.enter(item);if(type==='success')timer=setTimeout(remove,6000);
  }
  function showScreen(name,focus=false){
    if(!TempoData.screens[name])return;
    state.screen=name;const available=(name==='sources'||name==='library')?'ready':state.history;
    Object.keys(TempoData.screens).forEach(key=>el(key+'-screen').hidden=key!==name||available!=='ready');
    ['empty','error','loading'].forEach(key=>el('state-'+key).hidden=available!==key);
    document.querySelectorAll('[data-screen]').forEach(b=>{if(b.dataset.screen===name)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
    const t=TempoData.screens[name];el('page-eyebrow').textContent=t[0];el('page-title').innerHTML=t[1]+'<span class="accent">.</span>';el('page-subtitle').textContent=t[2];
    el('data-controls').hidden=name==='sources'||name==='library';el('consult-open').hidden=name==='consultation';
    el('screen-status').textContent=t[1].replace('<br>',' ');history.replaceState(null,'','#'+name);
    TempoMotion.enter(el(name+'-screen'));TempoMotion.underline();
    if(focus){el('main').scrollIntoView({block:'start',behavior:'instant'});el('page-title').focus({preventScroll:true});}
  }
  function dialog(title,content,eyebrow='Подробнее'){
    returnFocus=document.activeElement;el('dialog-title').textContent=title;el('dialog-eyebrow').textContent=eyebrow;
    const target=el('dialog-content');target.replaceChildren();
    if(typeof content==='string'){const p=document.createElement('p');p.textContent=content;target.append(p);}else target.append(content);
    TempoIcons.hydrate(target);el('detail-dialog').showModal();TempoMotion.enter(el('detail-dialog'));el('dialog-close').focus();
  }
  function activity(a){
    const box=document.createElement('section'),note=document.createElement('p');note.className='muted';note.textContent=a.date+' · '+TempoViews.sportName(a.sport);box.append(note);
    const grid=document.createElement('div');grid.className='dialog-grid';grid.innerHTML='<div><strong>'+TempoViews.km(a.km)+' км</strong><small>Дистанция</small></div><div><strong>'+a.min.toLocaleString('ru-RU',{maximumFractionDigits:1})+' мин</strong><small>Длительность</small></div>';box.append(grid);
    const p=document.createElement('p');p.textContent=TempoData.live?((TempoData.imported?'Источник: экспорт Garmin CSV. Даты — как в исходном файле, часовой пояс не указан. ':'Источник: Garmin, личное неофициальное подключение. ')+(a.heart_rate==null?'Средний пульс отсутствует.':'Средний пульс: '+a.heart_rate+' уд/мин. ')+(a.duration_kind==='elapsed'?'Длительность включает паузы.':'Длительность по таймеру.')):'Источник: демонстрационная история. Пульс отсутствует; зоны и интенсивность по нему не рассчитываются. На телефоне доступны те же подробности.';box.append(p);if(TempoData.imported){const detail=document.createElement('p');detail.textContent='Начало по экспорту: '+a.local_start_time.replace('T',' ')+'. Полное время: '+(a.elapsed_seconds==null?'—':TempoViews.time(a.elapsed_seconds/60))+' ч:мин. Время таймера: '+TempoViews.time(a.min)+' ч:мин.';box.append(detail);}dialog(a.name,box,'Ваша тренировка');
  }
  function profile(){
    const box=document.createElement('div');
    const p=document.createElement('p');p.textContent=TempoData.imported?'Ваш личный экспорт Garmin. Автоматическая синхронизация пока не подключена.':TempoData.live?'Личный кабинет Telegram. Статус Garmin и обновление — в разделе «Источники». Данные обрабатываются на вашем VPS.':'Демонстрационный кабинет. Для личных данных откройте приложение через кнопку бота Telegram.';box.append(p);
    const row=document.createElement('label');row.className='setting-row';row.innerHTML='<input type="checkbox" id="motion-toggle"><span>Уменьшить движение<small>Спортсмены и декоративные эффекты останутся статичными.</small></span>';
    const input=row.querySelector('input');input.checked=TempoMotion.reduced();input.disabled=matchMedia('(prefers-reduced-motion:reduce)').matches;
    input.addEventListener('change',()=>{TempoMotion.setReduced(input.checked);toast(input.checked?'Движение уменьшено.':'Анимация включена.');});box.append(row);
    const button=document.createElement('button');button.className='button primary';button.textContent='Повторить приветствие';button.addEventListener('click',()=>{el('detail-dialog').close();openWelcome();});box.append(button);
    const hint=document.createElement('p');hint.className='footnote';hint.textContent=input.disabled?'Уменьшение движения включено в настройках устройства.':'Настройка сохраняется в этом браузере.';box.append(hint);dialog('Ваш кабинет',box,'Профиль / движение');
  }
  function openWelcome(){
    if(!window.TempoWelcome){toast('Приветствие недоступно. Кабинет остаётся доступен.','error');return;}
    welcome=TempoWelcome.open({reducedMotion:TempoMotion.reduced(),onStart:()=>{welcome=null;try{sessionStorage.setItem('tempo-welcome-seen','true');}catch{}el('page-title').focus({preventScroll:true});}});
  }
  TempoIcons.hydrate();TempoMotion.init();TempoForms.init(toast);
  TempoViews.render(state,activity);TempoMotion.sport('all',false);TempoTips.init(()=>state,toast);
  document.querySelectorAll('[data-screen]').forEach(b=>b.addEventListener('click',()=>showScreen(b.dataset.screen,true)));
  document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>showScreen(b.dataset.go,true)));
  el('consult-open').addEventListener('click',()=>showScreen('consultation',true));
  document.querySelector('.brand').addEventListener('click',e=>{e.preventDefault();showScreen('overview',true);});
  document.querySelectorAll('[data-sport]').forEach(b=>b.addEventListener('click',()=>{
    state.sport=b.dataset.sport;document.querySelectorAll('[data-sport]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
    TempoViews.render(state,activity);TempoMotion.sport(state.sport);TempoMotion.update();TempoMotion.underline();TempoTips.refresh();
    el('screen-status').textContent='Дисциплина: '+b.textContent+'. '+TempoViews.sessions(TempoViews.selected(state).length)+'.';
  }));
  el('athlete-tile').addEventListener('click',()=>TempoMotion.sport(state.sport));
  el('week-select').addEventListener('change',e=>{state.week=e.target.value;TempoViews.render(state,activity);TempoMotion.update();TempoTips.refresh();el('screen-status').textContent='Период: '+e.target.selectedOptions[0].textContent;});
  el('state-select').addEventListener('change',e=>{clearTimeout(retryTimer);state.history=e.target.value;showScreen(state.screen);});
  el('state-retry').addEventListener('click',()=>{
    state.history='loading';showScreen(state.screen);el('state-select').value='loading';
    retryTimer=setTimeout(()=>{state.history='ready';el('state-select').value='ready';showScreen(state.screen);toast('Демо-история восстановлена.');},600);
  });
  document.querySelectorAll('[data-source]').forEach(b=>b.addEventListener('click',()=>{const s=TempoData.sources[b.dataset.source];dialog(s[0],s[1],'Источник тренировок');}));
  document.querySelectorAll('[data-book]').forEach(b=>b.addEventListener('click',()=>{
    const book=TempoData.books[b.dataset.book],box=document.createElement('div'),p=document.createElement('p');p.textContent=book.text;box.append(p);const a=document.createElement('a');a.href=book.href;a.textContent='Подробный разбор источника ↗';box.append(a);dialog(book.title,box,book.eyebrow);
  }));
  el('pair-open').addEventListener('click',()=>dialog('Телефон и компьютер','Будущий вход: браузер показывает одноразовый запрос. Вы подтверждаете его в Telegram на телефоне и открываете тот же профиль. В этой версии дизайна действующего запроса или QR-кода нет.','Один профиль'));
  el('profile-open').addEventListener('click',profile);el('motion-open').addEventListener('click',profile);
  el('welcome-replay').addEventListener('click',openWelcome);
  el('dialog-close').addEventListener('click',()=>el('detail-dialog').close());
  el('detail-dialog').addEventListener('close',()=>{if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});});
  function device(phone){el('app-frame').classList.toggle('phone',phone);el('mode-phone').setAttribute('aria-pressed',String(phone));el('mode-desktop').setAttribute('aria-pressed',String(!phone));TempoMotion.underline();}
  el('mode-phone').addEventListener('click',()=>device(true));el('mode-desktop').addEventListener('click',()=>device(false));
  document.addEventListener('tempo-motion-change',()=>{if(TempoMotion.reduced()&&welcome)welcome.close();});
  addEventListener('pagehide',()=>{clearTimeout(retryTimer);welcome?.close();});
  const hash=location.hash.slice(1);showScreen(TempoData.screens[hash]?hash:'overview');
  window.TempoApp={refresh(){TempoViews.render(state,activity);TempoMotion.update();TempoTips.refresh();},toast,state};
  let seen=false;try{seen=sessionStorage.getItem('tempo-welcome-seen')==='true';}catch{}
  if(!seen&&!window.TempoPrivatePreview)openWelcome();
})();
