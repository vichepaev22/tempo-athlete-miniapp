/* Educational running roadmap. Measurements stay measurements; templates are not prescriptions. */
var TempoRunRoadmap=(()=>{
  'use strict';
  const evidence=typeof module!=='undefined'&&module.exports?require('./insights.js'):window.TempoInsights;
  const phases=[
    {id:'base',title:'Основа и движение',tag:'01 / ПОДГОТОВИТЬ ОПОРУ',accent:'Экономичность',
      goal:'Сохранить регулярность и сделать привычное движение устойчивым.',
      work:'Лёгкий бег в разговорном усилии, знакомые силовые упражнения и работа над техникой без погони за каденсом. Экономичность поддерживается и на следующих этапах.',
      example:'Учебный пример: 20–40 мин лёгкого бега в пределах уже привычной длительности. Знакомую силовую работу выполняют отдельно, с корректной техникой; новые прыжки и тяжёлые веса автоматически не добавляются.',
      transition:'Привычная частота переносится устойчиво, после занятий вы возвращаетесь к обычному самочувствию. Частоту и длительность не повышают ради перехода.',
      check:'Сопоставимые лёгкие пробежки помогают наблюдать реакцию. Измерение экономичности — расход кислорода при одной и той же скорости; пульс и каденс его не заменяют.',sourceIds:['economyBook','mixedBook','economyStudy']},
    {id:'threshold',title:'Устойчивое усилие',tag:'02 / ПАНО',accent:'Порог',
      goal:'Научиться дольше поддерживать управляемое усилие, сохраняя лёгкую работу.',
      work:'Ровная темповая работа или разделённые отрезки около индивидуально установленного порога. Нужны подтверждённый порог/задача и опыт, а не процент от среднего пульса.',
      example:'Учебный пример для подготовленного бегуна: 10–15 мин разминки → 2 × 6 мин управляемой пороговой работы, между ними 3 мин лёгкого движения → 5–10 мин заминки. Интенсивность уточняют с тренером; это не назначение по вашим данным.',
      transition:'Отрезки выполняются ровно, без финиша «до отказа», обычное восстановление сохраняется. Без уточнённого порога можно остаться на первом этапе.',
      check:'Сравнивать скорость/потребление кислорода на том же определённом пороге по сопоставимому протоколу. Пороговый пульс ≠ доля VO₂ max.',sourceIds:['thresholdBook','load','recoveryBook']},
    {id:'power',title:'Аэробная мощность',tag:'03 / VO₂ MAX',accent:'VO₂ max',
      goal:'Рассмотреть более интенсивный стимул, когда основа и восстановление это позволяют.',
      work:'Аэробные интервалы с лёгким восстановлением. Такой стимул заменяет часть привычной нагрузки, а не добавляется сверху. Лёгкий бег и экономичность остаются.',
      example:'Учебный пример для подготовленного бегуна: 10–15 мин разминки → 3 × 2 мин интенсивного, контролируемого бега, между ними 2–3 мин лёгкого движения → 5–10 мин заминки. Без спринта и заданного вам темпа/пульса; объём обсуждают с тренером.',
      transition:'Опыт и индивидуальная интенсивность уточнены, нет необычной усталости. При ухудшении реакции — облегчить или вернуться к знакомой работе, а не повышать нагрузку.',
      check:'Тренд оценки Garmin сравнивают в похожих условиях и с датами; для прямого сравнения МПК нужен сопоставимый тест. Один новый балл не доказывает изменение формы.',sourceIds:['oxygen','intervalsBook','helgerud','recoveryBook']},
    {id:'transfer',title:'Закрепить и проверить',tag:'04 / ПЕРЕНОС В БЕГ',accent:'Сочетание',
      goal:'Оценить результат и выбрать следующий акцент без накопления лишней усталости.',
      work:'Сохранить привычное лёгкое движение, снизить утомляющую работу, сравнить уже имеющиеся сопоставимые записи или прошлые старты. Не проводить максимальный тест ради карточки.',
      example:'Учебный пример: знакомая лёгкая пробежка 20–30 мин вместо тяжёлого занятия, если это соответствует привычной нагрузке. Контроль — сравнение сопоставимых результатов, не обязательная гонка.',
      transition:'Есть сопоставимые измерения и понятна реакция на работу. Если их нет, сначала дополнить исходные данные; выбирать «слабое звено» по одной цифре нельзя.',
      check:'Проверить VO₂ max, скорость на пороге и кислородную стоимость раздельно. Время на 10 км зависит от их сочетания и условий, а не только от МПК.',sourceIds:['effects','blocksBook','specificity','raceStudy']}
  ];
  const weeks=[
    {title:'Привычный ритм',phase:0,emphasis:['Поддержка','—','Акцент']},
    {title:'Движение и опора',phase:0,emphasis:['Поддержка','—','Акцент']},
    {title:'Ровное усилие',phase:1,emphasis:['Поддержка','Акцент','Поддержка']},
    {title:'Устойчивость',phase:1,emphasis:['Поддержка','Акцент','Поддержка']},
    {title:'Усвоить работу',phase:0,easy:true,emphasis:['Легче','Легче','Знакомая техника']},
    {title:'Аэробный стимул',phase:2,emphasis:['Акцент','Поддержка','Поддержка']},
    {title:'Повторить по реакции',phase:2,emphasis:['Акцент','Поддержка','Поддержка']},
    {title:'Закрепление',phase:3,easy:true,emphasis:['Проверка','Проверка','Проверка']}
  ];
  const dayMs=86400000;
  function dateStamp(value){
    if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return null;
    const ms=Date.parse(value+'T00:00:00Z');return Number.isFinite(ms)&&new Date(ms).toISOString().slice(0,10)===value?ms:null;
  }
  const today=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');};
  const clock=seconds=>Math.floor(seconds/60)+':'+String(Math.round(seconds%60)).padStart(2,'0');
  const fmt=n=>n.toLocaleString('ru-RU',{maximumFractionDigits:1});
  function build(input,{sport='all'}={}){
    if(!['run','all'].includes(sport))return null;
    const rows=(Array.isArray(input)?input:[]).filter(r=>r?.sport==='run');if(!rows.length)return null;
    const vo2=evidence.readVO2(rows);
    const candidates=rows.filter(r=>typeof r.km==='number'&&Number.isFinite(r.km)&&[5,10].some(k=>Math.abs(k-r.km)<=k*.01)&&typeof r.elapsed_seconds==='number'&&Number.isFinite(r.elapsed_seconds)&&r.elapsed_seconds>0&&dateStamp((r.local_start_time||r.start_time||'').slice(0,10))!==null)
      .map(r=>({date:(r.local_start_time||r.start_time).slice(0,10),distanceKm:Math.abs(r.km-5)<=.05?5:10,recordedKm:r.km,seconds:Math.round(r.elapsed_seconds)})).sort((a,b)=>b.date.localeCompare(a.date));
    return {count:rows.length,vo2,phases,weeks,candidates,metrics:[
      {id:'vo2',title:'VO₂ max',value:vo2?.value??null,unit:'мл/кг/мин',target:null,definition:'Максимальная скорость использования кислорода.',
        status:vo2?'Оценка Garmin · '+vo2.date+' · '+vo2.count+' записей':'В выбранной истории не передан',
        next:'Сравнивать тренд в одинаковых условиях; цель в баллах без контекста не назначается.',sourceIds:['oxygen','garmin']},
      {id:'threshold',title:'ПАНО / доля VO₂ max',value:null,unit:'% VO₂ max',target:null,definition:'Какая доля аэробной мощности доступна на определённом пороге.',
        status:'Нет измерения в этой сводке',next:'Нужны метод определения порога и VO₂ на нём. Доля = VO₂ на пороге / VO₂ max × 100 из сопоставимого теста; % максимального пульса не подходит.',sourceIds:['thresholdBook']},
      {id:'economy',title:'Экономичность бега',value:null,unit:'мл O₂/кг/мин при заданной скорости',target:null,definition:'Сколько кислорода нужно для поддержания одной и той же скорости.',
        status:'Нет измерения расхода кислорода',next:'Для сравнения нужны одинаковые скорость и условия измерения. Более низкая кислородная стоимость при этих условиях означает лучшую экономичность.',sourceIds:['economyBook','economyStudy']}
    ]};
  }
  function predict(input={},now=today()){
    const fail=error=>({ok:false,error}),{distanceKm,time,date,confirmed}=input;
    if(confirmed!==true)return fail('Подтвердите точную дистанцию, полное время и соревновательный характер прошлого результата.');
    if(![5,10].includes(distanceKm))return fail('Выберите точные 5 или 10 км.');
    const measured=dateStamp(date),current=dateStamp(now);
    if(measured===null||current===null)return fail('Укажите корректную дату прошлого результата.');
    if(measured>current)return fail('Результат не может быть из будущего.');
    if(current-measured>60*dayMs)return fail('Результат старше 60 дней: текущий ориентир не рассчитан. 60 дней — правило актуальности этого сервиса.');
    if(typeof time!=='string'||!/^\d{1,3}:[0-5]\d$/.test(time))return fail('Введите полное время в формате минуты:секунды, например 25:00.');
    const [minutes,seconds]=time.split(':').map(Number),total=minutes*60+seconds;
    if(total<distanceKm*60||total>distanceKm*24*60)return fail('Проверьте время и выбранную дистанцию.');
    const result=distanceKm===10?total:Math.round(total*2**1.07/30)*30;
    return {ok:true,kind:distanceKm===10?'actual':'estimate',seconds:result,pace:result/10,date,inputSeconds:total};
  }
  const node=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
  function button(text,cls,action){const b=node('button',cls,text);b.type='button';b.addEventListener('click',action);return b;}
  function explain(item,trigger,result){
    evidence.explain({title:item.title,fact:result.vo2?'В выбранной истории '+result.count+' пробежек. Беговая оценка Garmin: '+fmt(result.vo2.value)+' мл/кг/мин от '+result.vo2.date+'. ПАНО и кислородная стоимость не переданы.':'В выбранной истории '+result.count+' пробежек; физиологические измерения для выбора лимитирующего фактора не переданы.',
      why:item.goal||item.definition,limit:'По неполным данным не определяем слабое звено, индивидуальные зоны, готовность или целевые баллы. Шаблон и численные примеры составлены сервисом для объяснения; это не дословная программа из книги.',
      next:item.check||item.next,sourceIds:item.sourceIds},trigger);
  }
  function render(rows,state){
    const result=build(rows,{sport:state.sport}),target=document.getElementById('training-report');if(!result||!target)return;
    const wrap=node('details','run-roadmap');wrap.id='run-roadmap';
    const summary=node('summary','roadmap-summary'),summaryText=node('span');
    summaryText.append(node('span','eyebrow',window.TempoData?.live?'БЕГ / СЛЕДУЮЩИЙ ШАГ':'БЕГ / ДЕМО'),node('span','roadmap-title','Карта развития бега'),node('span','roadmap-subtitle','VO₂ max · ПАНО · экономичность'));
    summary.append(summaryText,node('span','roadmap-disclose','Открыть ↓'));wrap.append(summary);
    const body=node('div','roadmap-body');wrap.append(body);
    body.append(node('p','roadmap-lede','Три стороны одного результата. Сначала — что известно о вас. Затем — как выбрать акцент и проверить изменения.'));
    const metrics=node('div','roadmap-metrics');
    result.metrics.forEach((m,i)=>{const card=node('article','roadmap-metric');card.dataset.metric=m.id;
      card.append(node('p','eyebrow','0'+(i+1)+' / '+m.title),node('strong','roadmap-value',m.value!==null?fmt(m.value):'Не измерено'),node('span','roadmap-unit',m.unit),node('p','roadmap-status',m.status),node('p','',m.definition));
      const b=button('Что означает и откуда ↗','text-button',()=>explain(m,b,result));card.append(b);metrics.append(card);
    });body.append(metrics);
    body.append(node('p','roadmap-context',result.count+' пробежек в выбранном периоде — это история работы, а не оценка спортивного уровня. По VO₂ max не определяем автоматически слабое звено или результат на 10 км.'));
    const modes=node('div','roadmap-modes');modes.setAttribute('aria-label','Вид карты');
    const phaseView=node('div','roadmap-phase-view'),weekView=node('div','roadmap-week-view');weekView.hidden=true;
    const phaseMode=button('По этапам','roadmap-mode',()=>mode(false)),weekMode=button('Пример 8 недель','roadmap-mode',()=>mode(true));
    function mode(weekly){phaseView.hidden=weekly;weekView.hidden=!weekly;phaseMode.setAttribute('aria-pressed',String(!weekly));weekMode.setAttribute('aria-pressed',String(weekly));}
    modes.append(phaseMode,weekMode);mode(false);body.append(modes,phaseView,weekView);
    phaseView.append(node('p','roadmap-caption','Переход — по реакции и данным. Календарь не заставляет двигаться дальше.'));
    const phaseNav=node('div','roadmap-phase-nav');phaseNav.setAttribute('aria-label','Выбрать этап');const phaseDetail=node('div','roadmap-detail');
    const phaseButtons=result.phases.map((p,i)=>{const b=button('0'+(i+1)+' / '+p.title,'roadmap-phase',()=>selectPhase(i));b.dataset.phase=p.id;phaseNav.append(b);return b;});
    function details(container,p,weekly){
      container.replaceChildren();container.append(node('p','eyebrow',weekly||p.tag),node('h4','',p.title),node('p','roadmap-goal',p.goal));
      const sections=[['Что тренировать',p.work],['Как может выглядеть занятие',p.example],['Когда менять акцент',p.transition],['Как заметить изменение',p.check]];
      sections.forEach(([title,text])=>{const part=node('section');part.append(node('h5','',title),node('p','',text));container.append(part);});
      const source=button('Книжное основание и ограничения ↗','text-button',()=>explain(p,source,result));container.append(source);
    }
    function selectPhase(index){phaseButtons.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));details(phaseDetail,result.phases[index]);}
    phaseView.append(phaseNav,phaseDetail);selectPhase(0);
    weekView.append(node('p','roadmap-caption','Учебная схема, не назначенный вам план. Восемь недель — пример сервиса, не обязательный срок из книги. Выбирайте неделю, чтобы увидеть её задачу.'));
    const tableBox=node('div','roadmap-table-scroll');tableBox.tabIndex=0;tableBox.setAttribute('role','region');tableBox.setAttribute('aria-label','Акценты по неделям, таблица прокручивается горизонтально');
    const table=node('table','roadmap-table'),caption=node('caption','sr-only','Три параметра и акценты восьми недель');table.append(caption);
    const head=table.createTHead().insertRow();head.append(node('th','','Параметр'));const weekButtons=[];
    result.weeks.forEach((w,i)=>{const th=node('th');th.scope='col';const b=button(String(i+1),'roadmap-week',()=>selectWeek(i));b.setAttribute('aria-label','Неделя '+(i+1)+': '+w.title);b.dataset.week=String(i);weekButtons.push(b);th.append(b);head.append(th);});
    const tb=table.createTBody();['VO₂ max','ПАНО','Экономичность'].forEach((name,j)=>{const tr=tb.insertRow(),th=node('th','',name);th.scope='row';tr.append(th);result.weeks.forEach(w=>{const td=tr.insertCell();td.textContent=w.emphasis[j];td.className=w.emphasis[j]==='Акцент'?'roadmap-cell-accent':w.easy?'roadmap-cell-easy':'';});});
    tableBox.append(table);weekView.append(tableBox);const weekDetail=node('div','roadmap-detail');weekView.append(weekDetail);
    function selectWeek(index){weekButtons.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));table.querySelectorAll('tr').forEach(tr=>[...tr.cells].forEach((cell,i)=>cell.classList.toggle('roadmap-selected',i===index+1)));const w=result.weeks[index];
      details(weekDetail,w.easy&&index===4?{...result.phases[0],title:'Усвоить работу',goal:'Облегчение вместо нового стимула.',example:'Замените качественную работу знакомым лёгким движением или отдыхом по реакции. Не увеличивайте ни частоту, ни длительность; следующая неделя не наступает автоматически.',transition:'Обычное самочувствие восстановилось; если нет, повторите облегчение и уточните причину.'}:result.phases[w.phase],'НЕДЕЛЯ '+(index+1)+' / '+w.title.toUpperCase());}
    selectWeek(0);
    body.append(node('p','roadmap-rule','Через все этапы: привычная лёгкая работа, экономичность и восстановление. Сохраняйте привычное число выходов. Интенсивный вариант — возможная замена, не добавка; между тяжёлыми занятиями оставляйте лёгкие дни/отдых по реакции. Учитывайте плавание и велосипед тоже. При боли или необычном ухудшении прекратите интенсивную работу и обсудите состояние со специалистом.'));
    renderForecast(body,result);target.append(wrap);
  }
  function renderForecast(parent,result){
    const block=node('section','roadmap-forecast');block.append(node('p','eyebrow','10 КМ / ОРИЕНТИР'),node('h4','','Какой результат уже можно сопоставить?'),node('p','','Garmin VO₂ max и средний темп тренировок не дают здесь персонального прогноза. Нужен недавний подтверждённый результат на точной дистанции 5 или 10 км.'));
    const form=node('form','roadmap-race-form');form.noValidate=true;
    function field(label,control){const box=node('label','roadmap-field');box.append(node('span','',label),control);form.append(box);return control;}
    const pick=node('select');pick.id='roadmap-record';pick.append(node('option','','Ввести прошлый результат вручную'));pick.options[0].value='';
    result.candidates.forEach((c,i)=>{const o=node('option','',c.date+' · '+fmt(c.recordedKm)+' км · полное '+clock(c.seconds));o.value=String(i);pick.append(o);});field('Запись из выбранной истории (требует подтверждения)',pick);
    const dist=node('select');dist.id='roadmap-distance';[5,10].forEach(n=>{const o=node('option','',n+' км');o.value=String(n);dist.append(o);});field('Точная дистанция',dist);
    const time=node('input');time.id='roadmap-time';time.type='text';time.inputMode='numeric';time.placeholder='25:00';time.maxLength=6;field('Полное время · минуты:секунды',time);
    const date=node('input');date.id='roadmap-date';date.type='date';date.max=today();field('Дата результата',date);
    const confirm=node('input');confirm.type='checkbox';confirm.id='roadmap-confirm';
    const confirmation=node('label','roadmap-confirm');confirmation.append(confirm,node('span','','Подтверждаю: точная дистанция, полное время со всеми остановками и прошлый соревновательный результат, а не лёгкая тренировка.'));form.append(confirmation);
    const submit=node('button','button primary','Рассчитать ориентир');submit.type='submit';form.append(submit);
    const output=node('div','roadmap-race-output');output.setAttribute('role','status');output.textContent='Пока недостаточно данных для ориентира на 10 км.';
    const hint=node('p','roadmap-caption','Выбор записи — только черновик: GPS-дистанция может отличаться, назначение занятия неизвестно. Используем полное elapsed-время; таймер с исключёнными остановками не подставляем. Форма остаётся только в памяти страницы и сбрасывается при смене фильтра.');
    pick.addEventListener('change',()=>{const c=pick.value===''?null:result.candidates[Number(pick.value)];confirm.checked=false;time.value=c?clock(c.seconds):'';date.value=c?.date||'';dist.value=String(c?.distanceKm||5);reset();});
    function reset(){output.classList.remove('has-result');output.textContent='Данные изменены. Проверьте их и рассчитайте ориентир.';}
    form.addEventListener('input',reset);
    form.addEventListener('submit',event=>{event.preventDefault();const r=predict({distanceKm:Number(dist.value),time:time.value.trim(),date:date.value,confirmed:confirm.checked});output.replaceChildren();output.classList.toggle('has-result',r.ok);
      if(!r.ok){output.append(node('p','',r.error));return;}
      output.append(node('p','eyebrow',r.kind==='actual'?'ВАШ ПОДТВЕРЖДЁННЫЙ РЕЗУЛЬТАТ / НЕ ПРОГНОЗ':'ОЦЕНОЧНЫЙ ОРИЕНТИР / НЕ ГАРАНТИЯ'),node('strong','roadmap-race-time',clock(r.seconds)),node('p','',clock(Math.round(r.pace))+' мин/км · 10 км · исходный результат '+r.date));
      output.append(node('p','',r.kind==='actual'?'Это введённое вами полное время на 10 км. Новое время из него не предсказывается.':'Расчёт: T₁₀ = T₅ × (10 / 5)^1,07. Результат округлён до 30 секунд. Погрешность для вас неизвестна: рельеф, погода, подготовка к дистанции и усилие могут изменить результат. Это не прогноз по трём физиологическим показателям и не целевой темп тренировки.'));
    });
    const source=button('Метод расчёта и источники ↗','text-button',()=>explain({title:'Ориентир на 10 км',definition:'Соревновательные результаты можно сопоставлять с помощью эмпирической модели. Garmin VO₂ сам по себе не является результатом на дистанции.',next:'Riegel: T10 = T5 × 2^1,07. Условия и подготовка должны быть сопоставимыми. 60 дней — ограничение актуальности сервиса, не вывод книги; индивидуальную ошибку мы не знаем.',sourceIds:['specificity','raceStudy']},source,result));
    block.append(form,output,hint,source);parent.append(block);
  }
  return {build,predict,render};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=TempoRunRoadmap;
