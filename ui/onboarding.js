/* Guided first visit and original Garmin account ZIP. No passwords or raw files at rest. */
(() => {
  'use strict';
  const app=window.TempoApp,byId=id=>document.getElementById(id);
  if(!app)return;
  const telegram=window.Telegram?.WebApp,initData=telegram?.initData||'';
  const privateMode=!!window.TempoPrivatePreview,connected=privateMode||!!(initData&&window.TempoGarminConfig?.api);
  const base=privateMode?'':window.TempoGarminConfig?.api||'';
  const storageKey='tempo-guide-v1-'+(privateMode?'private':initData?'telegram':'demo');
  const initial={version:1,tour:'new',tour_index:0,import_step:0};
  let progress={...initial},queue=Promise.resolve(),guide=null,previous=null,uploading=false,ready=false;
  let saveFailed=false,positionFrame=null,restoreFocus=null;
  function valid(p){return p&&p.version===1&&['new','done','skipped'].includes(p.tour)&&Number.isInteger(p.tour_index)&&p.tour_index>=0&&p.tour_index<4&&Number.isInteger(p.import_step)&&p.import_step>=0&&p.import_step<3;}
  try{const saved=JSON.parse(localStorage.getItem(storageKey));if(valid(saved))progress=saved;}catch{}
  function node(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text)n.textContent=text;return n;}
  function button(label,cls,action){const b=node('button',cls,label);b.type='button';b.addEventListener('click',action);return b;}
  function historyRows(){return TempoData.live?(TempoData.weeks?.all||[]):[];}
  async function request(path,{method='GET',body,zip=false}={}){
    if(!connected)throw Object.assign(new Error('telegram_required'),{detail:'telegram_required'});
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),zip?150000:10000);
    const headers=privateMode?{'X-Tempo-Client':'guide'}:{'X-Telegram-Init-Data':initData};
    if(body!==undefined)headers['Content-Type']=zip?'application/zip':'application/json';
    try{
      const response=await fetch(base+(privateMode?'api/':'/api/')+path,{method,headers,body:body===undefined?undefined:zip?body:JSON.stringify(body),credentials:'omit',cache:'no-store',signal:controller.signal});
      const value=await response.json().catch(()=>({}));
      if(!response.ok)throw Object.assign(new Error('request_failed'),{status:response.status,detail:value.detail});
      return value;
    }finally{clearTimeout(timer);}
  }
  function save(){
    const snapshot={...progress};try{localStorage.setItem(storageKey,JSON.stringify(snapshot));}catch{}
    if(connected)queue=queue.then(()=>request('onboarding',{method:'POST',body:snapshot})).then(()=>{saveFailed=false;}).catch(()=>{saveFailed=true;});
  }

  const setup=node('section','garmin-setup');setup.id='garmin-setup';setup.setAttribute('aria-labelledby','setup-title');
  const setupHead=node('div','setup-heading'),setupIntro=node('div');
  setupIntro.append(node('p','eyebrow','ВАША ИСТОРИЯ / ТРИ ШАГА'));
  const setupTitle=node('h2','', 'Из Garmin — в ваш ТЕМП.');setupTitle.id='setup-title';setupIntro.append(setupTitle,node('p','setup-lede','Запросите архив, сохраните его из письма и загрузите сюда. Всё остальное сделаем мы.'));
  const guideButton=button('Как пользоваться ↗','button secondary',()=>startTour(0));setupHead.append(setupIntro,guideButton);setup.append(setupHead);
  const steps=node('div','setup-steps');steps.setAttribute('aria-label','Шаги импорта Garmin');
  const stepButtons=['Запросить','Скачать','Загрузить'].map((label,i)=>{
    const b=button('', 'setup-step',()=>{progress.import_step=i;save();renderSetup();});
    b.append(node('span','setup-number',String(i+1).padStart(2,'0')),node('span','',label));steps.append(b);return b;
  });setup.append(steps);
  const panel=node('div','setup-panel');setup.append(panel);
  const sourceInfo=node('p','setup-source');
  const support=node('a','','Инструкция Garmin ↗');support.href='https://support.garmin.com/en-IE/marine/faq/W1TvTPW8JZ6LfJSfK512Q8/';support.target='_blank';support.rel='noopener noreferrer';sourceInfo.append(support,document.createTextNode(' · Вход выполняется на сайте Garmin.'));
  setup.append(sourceInfo);
  const result=node('div','setup-result');result.id='archive-result';result.setAttribute('role','status');result.hidden=true;setup.append(result);
  const sources=byId('sources-screen');sources.prepend(setup);
  const quick=node('aside','guide-quick');quick.id='guide-quick';
  const quickText=node('p');quick.append(quickText,button('Посмотреть возможности','text-button',()=>startTour(0)),button('Загрузить Garmin ZIP ↗','button primary',()=>openSetup()));
  byId('data-controls').before(quick);
  function renderQuick(){
    const count=historyRows().length;
    quickText.textContent=count?'Ваша история уже здесь: '+TempoViews.sessions(count)+'. Можно пройти короткий гид.':'Познакомьтесь с кабинетом и добавьте свои тренировки.';
    quick.lastElementChild.hidden=!!count;quick.hidden=app.state.screen==='sources';
  }
  function nextImport(i){progress.import_step=i;save();renderSetup();}
  function openSetup(){if(guide)closeTour('skipped',false);app.showScreen('sources',true);renderSetup();setup.scrollIntoView({block:'start',behavior:'instant'});setupTitle.tabIndex=-1;setupTitle.focus({preventScroll:true});}
  function renderSetup(){
    stepButtons.forEach((b,i)=>{b.setAttribute('aria-current',i===progress.import_step?'step':'false');b.disabled=uploading;});
    panel.replaceChildren();
    if(progress.import_step===0){
      panel.append(node('p','eyebrow','ШАГ 01 / НА САЙТЕ GARMIN'),node('h3','','Запросите свою историю.'),node('p','','Откройте управление данными Garmin. Войдите в свой аккаунт, выберите «Export Your Data» (Экспорт данных), затем «Request Data Export» (Запросить экспорт).'));
      const actions=node('div','setup-actions'),link=node('a','button primary','Открыть Garmin ↗');link.href='https://www.garmin.com/en-US/account/datamanagement/';link.target='_blank';link.rel='noopener noreferrer';
      actions.append(link,button('Я запросил архив →','button secondary',()=>nextImport(1)));panel.append(actions,node('p','setup-note','Пароль и коды Garmin остаются на сайте Garmin. ТЕМП их не запрашивает.'));
    }else if(progress.import_step===1){
      panel.append(node('p','eyebrow','ШАГ 02 / ПИСЬМО ОТ GARMIN'),node('h3','','Сохраните ZIP из письма.'),node('p','','Когда Garmin пришлёт письмо о готовности экспорта, откройте ссылку и скачайте архив. На телефоне сохраните его в «Файлы» или «Загрузки». Распаковывать ZIP не нужно.'),node('p','setup-note','По справке Garmin ссылка обычно приходит в течение 48 часов; иногда подготовка занимает до 30 дней. Пока ждёте, можно изучать кабинет. Мы не читаем вашу почту и не проверяем статус запроса.'));
      const actions=node('div','setup-actions');actions.append(button('Архив уже скачан →','button primary',()=>nextImport(2)),button('Пока посмотреть кабинет','button secondary',()=>app.showScreen('overview',true)));panel.append(actions);
    }else{
      panel.append(node('p','eyebrow','ШАГ 03 / ВАШ ОТЧЁТ'),node('h3','','Добавьте архив. Получите картину.'),node('p','','Выберите полный ZIP, скачанный по ссылке Garmin. Сохраним показатели тренировок, проверим повторы и построим отчёт. Лимит — 64 МБ.'));
      const label=node('label','upload-picker'),input=document.createElement('input');input.type='file';input.id='garmin-archive-file';input.accept='.zip,application/zip,application/x-zip-compressed';input.disabled=!connected||uploading;input.setAttribute('aria-label','Выбрать полный архив Garmin ZIP');
      input.addEventListener('change',()=>{const file=input.files?.[0];if(file)upload(file);});label.append(node('span','',uploading?'Передаём и проверяем архив…':'Выбрать ZIP с устройства ↗'),input);panel.append(label);
      if(!connected){const hint=node('p','setup-note','Для загрузки своей истории откройте «Мой кабинет» в Telegram-боте. Сейчас вы изучаете демо.');const link=node('a','text-button','Открыть @tempo_athlete_bot ↗');link.href='https://t.me/tempo_athlete_bot';link.target='_blank';link.rel='noopener noreferrer';panel.append(hint,link);}
      panel.append(node('p','setup-note','Исходный ZIP не сохраняется на сервере. Импортируем только сводки тренировок; профиль, GPS и прочие разделы архива в кабинет не попадают. Автосинхронизация этим не включается.'));
    }
    if(historyRows().length){panel.append(button('Ваша история уже загружена · открыть отчёт ↗','text-button',()=>app.showScreen('consultation',true)));}
    if(uploading){panel.setAttribute('aria-busy','true');}else panel.removeAttribute('aria-busy');
    renderQuick();
  }
  const errors={archive_incomplete:'В архиве отсутствует часть ранее загруженных тренировок. Прежняя история сохранена. Выберите полный экспорт того же аккаунта Garmin.',live_history_requires_review:'У вас уже подключена другая история. Прежние записи сохранены; замена требует отдельной проверки.',sync_busy:'Сейчас идёт другое обновление. Дождитесь его завершения и выберите архив снова.',invalid_archive:'Этот файл не удалось прочитать как полный экспорт Garmin. Выберите исходный ZIP из письма, без распаковки и пересборки.',archive_too_large:'Архив больше 64 МБ. Этот размер пока не поддерживается; прежняя история сохранена.',zip_required:'Нужен исходный ZIP из письма Garmin.',telegram_required:'Откройте кабинет заново через Telegram-бота.'};
  async function upload(file){
    if(uploading)return;
    result.replaceChildren();result.hidden=false;result.className='setup-result';
    if(file.size>64*1024*1024||!file.name.toLowerCase().endsWith('.zip')){result.classList.add('is-error');result.setAttribute('role','alert');result.textContent=file.size>64*1024*1024?errors.archive_too_large:errors.zip_required;return;}
    uploading=true;result.setAttribute('role','status');result.textContent='Передаём и проверяем архив. Можно оставить эту страницу открытой.';renderSetup();
    try{
      const value=await request('garmin/archive',{method:'POST',body:file,zip:true});
      if(!value.activities?.length||value.connection?.source!=='garmin_archive')throw new Error('invalid_response');
      TempoCsvView.apply(value);if(privateMode)window.TempoImportedDataset=value;
      const rows=value.activities,dates=rows.map(r=>r.start_time.slice(0,10)).sort(),kinds=[...new Set(rows.map(r=>TempoViews.sportName(r.sport)))];
      result.replaceChildren(node('p','eyebrow',value.unchanged?'АРХИВ УЖЕ ЗАГРУЖЕН':'ГОТОВО / ВАША ИСТОРИЯ'),node('h3','',TempoViews.sessions(rows.length)),node('p','',dates[0]+' — '+dates.at(-1)+' · '+kinds.join(', ')),node('p','',value.unchanged?'Повторов не добавлено. Ваш отчёт готов к просмотру.':'Показатели обновлены без дубликатов. Прежняя история сохранена в резервной копии.'),button('Открыть мой отчёт ↗','button primary',()=>app.showScreen('consultation',true)));
      if(value.connection.skipped)result.append(node('p','setup-note','Не поддерживаемые виды занятий пропущены: '+value.connection.skipped+'.'));
      progress.import_step=2;save();app.toast('Архив Garmin проверен. '+TempoViews.sessions(rows.length)+', без дубликатов.');
    }catch(error){
      result.classList.add('is-error');result.setAttribute('role','alert');
      const message=errors[error.detail]||(error.status===401?errors.telegram_required:error.name==='AbortError'?'Сервер не подтвердил завершение за отведённое время. Откройте отчёт и проверьте историю; повторная загрузка того же ZIP не создаст дубликатов.':'Не удалось получить подтверждение от сервера. Проверьте соединение и историю, затем выберите ZIP снова. Повтор не создаст дубликатов.');
      result.replaceChildren(node('h3','','Загрузка не подтверждена.'),node('p','',message));
    }finally{uploading=false;renderSetup();}
  }

  const tourSteps=[
    {title:'У каждого бега — своя история.',text:'Дистанция, темп, пульс и регулярность — всё о ваших пробежках в одном месте. Здесь переключаются дисциплины.',screen:'overview',sport:'run',target:'[data-sport="run"]'},
    {title:'Вода. Другой темп.',text:'Плавание рассматривается отдельно: объём, длительность и доступные показатели занятий. Переключение сохраняет выбранный период.',screen:'overview',sport:'swim',target:'[data-sport="swim"]'},
    {title:'Сначала — выводы.',text:'В полном отчёте собраны регулярность, объём, темп и пульс. Ниже — подробные цифры и книжные источники. Выберите период, который хотите изучить.',screen:'consultation',sport:'run',target:'#training-report h3'},
    {title:'Больше, чем цифры.',text:'Через «Мой кабинет» открывается студия: памятка для диагностики осанки и создание сторис о тренировках. Это отдельные возможности.',screen:'overview',sport:'all',target:'#profile-open'}
  ];
  function position(){
    positionFrame=null;if(!guide)return;
    const step=tourSteps[progress.tour_index],target=document.querySelector(step.target),card=guide.querySelector('.tour-card'),focus=guide.querySelector('.tour-focus');
    const width=document.documentElement.clientWidth,height=window.visualViewport?.height||innerHeight;
    if(target){const r=target.getBoundingClientRect();focus.hidden=false;Object.assign(focus.style,{left:Math.max(6,r.left-7)+'px',top:Math.max(6,r.top-7)+'px',width:Math.min(width-12,r.width+14)+'px',height:Math.min(height-12,r.height+14)+'px'});
      if(width>680){const left=Math.min(width-440,Math.max(16,r.left));const top=r.bottom+26+card.offsetHeight<height?r.bottom+26:Math.max(16,r.top-card.offsetHeight-26);card.style.left=left+'px';card.style.top=top+'px';}
    }else{focus.hidden=true;card.style.left=Math.max(16,(width-420)/2)+'px';card.style.top=Math.max(16,(height-card.offsetHeight)/2)+'px';}
    if(width<=680){card.style.left='12px';card.style.top='auto';}
  }
  function reposition(){if(!positionFrame)positionFrame=requestAnimationFrame(position);}
  function paintTour(){
    if(!guide)return;
    const step=tourSteps[progress.tour_index];app.showScreen(step.screen);
    document.querySelector('[data-sport="'+step.sport+'"]').click();
    if(TempoData.weeks?.all){app.state.week='all';byId('week-select').value='all';app.refresh();}
    guide.querySelector('.tour-counter').textContent=String(progress.tour_index+1).padStart(2,'0')+' / 04';
    guide.querySelector('#tour-title').textContent=step.title;guide.querySelector('#tour-copy').textContent=step.text;
    guide.querySelector('.tour-context').textContent=historyRows().length?'На ваших данных · '+TempoViews.sessions(historyRows().length):TempoData.live?'Личная история пока не загружена':'Демонстрационные данные · загрузите свои после знакомства';
    guide.querySelector('[data-tour="back"]').disabled=progress.tour_index===0;
    guide.querySelector('[data-tour="next"]').textContent=progress.tour_index===3?(historyRows().length?'Открыть мой отчёт ↗':'Загрузить мои тренировки ↗'):'Далее →';
    guide.querySelectorAll('.tour-dot').forEach((dot,i)=>dot.classList.toggle('active',i<=progress.tour_index));
    const target=document.querySelector(step.target);target?.scrollIntoView({block:innerWidth<=680?'start':'center',inline:'nearest',behavior:'instant'});
    save();requestAnimationFrame(()=>{position();guide?.querySelector('#tour-title').focus({preventScroll:true});});
  }
  function closeTour(status,finish=false){
    if(!guide)return;
    progress.tour=status;save();const current=guide;guide=null;current.close();current.remove();
    removeEventListener('resize',reposition);removeEventListener('scroll',reposition,true);window.visualViewport?.removeEventListener('resize',reposition);
    if(positionFrame)cancelAnimationFrame(positionFrame);positionFrame=null;
    if(previous){app.state.sport=previous.sport;document.querySelector('[data-sport="'+previous.sport+'"]').click();app.state.week=previous.week;byId('week-select').value=previous.week;app.showScreen(previous.screen);app.refresh();scrollTo({top:previous.scroll,behavior:'instant'});}
    if(restoreFocus?.isConnected)restoreFocus.focus({preventScroll:true});
    if(finish){if(historyRows().length)app.showScreen('consultation',true);else openSetup();}
  }
  function startTour(index=progress.tour_index){
    if(guide)return;
    app.closeWelcome();byId('detail-dialog').close();restoreFocus=document.activeElement;
    previous={screen:app.state.screen,sport:app.state.sport,week:app.state.week,scroll:scrollY};progress.tour='new';progress.tour_index=index;
    guide=node('dialog','tempo-guide');guide.id='tempo-guide';guide.setAttribute('aria-labelledby','tour-title');guide.setAttribute('aria-describedby','tour-copy');
    const focus=node('div','tour-focus');focus.setAttribute('aria-hidden','true');const card=node('section','tour-card');
    const top=node('div','tour-top');top.append(node('span','tour-counter'),button('Пропустить','text-button',()=>closeTour('skipped')));card.append(top);
    const heading=node('h2');heading.id='tour-title';heading.tabIndex=-1;const copy=node('p');copy.id='tour-copy';
    card.append(heading,copy,node('p','tour-context'));const bottom=node('div','tour-actions');
    const back=button('← Назад','button secondary',()=>{progress.tour_index--;paintTour();});back.dataset.tour='back';
    const next=button('Далее →','button primary',()=>{if(progress.tour_index===3)closeTour('done',true);else{progress.tour_index++;paintTour();}});next.dataset.tour='next';bottom.append(back,next);
    const dots=node('div','tour-dots');dots.setAttribute('aria-hidden','true');for(let i=0;i<4;i++)dots.append(node('i','tour-dot'));card.append(bottom,dots);guide.append(focus,card);document.body.append(guide);
    guide.addEventListener('cancel',event=>{event.preventDefault();closeTour('skipped');});
    try{guide.showModal();paintTour();addEventListener('resize',reposition);addEventListener('scroll',reposition,true);window.visualViewport?.addEventListener('resize',reposition);}catch{closeTour('skipped');app.toast('Гид недоступен. Кабинет можно изучить самостоятельно.','error');}
  }
  document.addEventListener('tempo:screen-change',renderQuick);
  document.addEventListener('tempo:welcome-end',()=>{if(ready&&progress.tour==='new')startTour();});
  window.TempoOnboarding={start:()=>startTour(0),openImport:openSetup,getState:()=>({...progress,saveFailed,uploading})};
  async function boot(){
    if(connected){try{const server=await request('onboarding');if(valid(server)){if(server.tour!=='new')progress=server;else if(progress.tour==='new')progress={...server,tour_index:Math.max(server.tour_index,progress.tour_index),import_step:Math.max(server.import_step,progress.import_step)};save();}}catch{saveFailed=true;}}
    if(window.TempoGarmin?.ready)await window.TempoGarmin.ready;
    ready=true;renderSetup();
    if(progress.tour==='new'){
      let welcomeSeen=false;try{welcomeSeen=sessionStorage.getItem('tempo-welcome-seen')==='true';}catch{}
      if(privateMode||welcomeSeen||progress.tour_index>0||!window.TempoWelcome)startTour();else{try{app.openWelcome();}catch{startTour();}}
    }
  }
  renderSetup();boot();
})();
