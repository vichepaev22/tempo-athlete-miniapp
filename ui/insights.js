/* Source-backed educational interpretation. Rules inspect the journal, not the athlete's physiology. */
var TempoInsights=(()=>{
  'use strict';
  const dayMs=86400000,names={run:'бег',swim:'плавание',cycle:'велосипед',walk:'походы'};
  const book1='Уилмор и Костилл · Физиология спорта и двигательной активности';
  const book2='Владимир Иссурин · Подготовка спортсменов XXI века: научные основы и построение тренировки';
  const sources={
    adaptation:{kind:'book',book:'book-01',chunk:426,page:180,chapter:10,title:book1,summary:'Повторяющаяся работа на выносливость создаёт стимул для адаптации доставки и использования кислорода. Книга описывает механизм, а не оценивает форму по числу занятий.'},
    specificity:{kind:'book',book:'book-01',chunk:473,page:198,chapter:10,title:book1,summary:'Адаптация и её оценка связаны со спецификой двигательной деятельности. Достижения в одном виде нельзя автоматически приписать другому.'},
    oxygen:{kind:'book',book:'book-01',chunk:429,page:181,chapter:10,title:book1,summary:'МПК характеризует максимальную скорость использования кислорода при предельной нагрузке и рассматривается как показатель кардиореспираторной выносливости. Его не вычисляют из количества занятий.'},
    load:{kind:'book',book:'book-02',chunk:24,page:15,chapter:1,title:book2,summary:'Величину нагрузки характеризуют объём, интенсивность и новизна упражнений. Одной длительности или дистанции недостаточно для описания воздействия.'},
    effects:{kind:'book',book:'book-02',chunk:73,page:33,chapter:2,title:book2,summary:'Ответ на отдельное занятие и результат длительной подготовки относятся к разным временным масштабам. Их оценивают с учётом задачи и организации нагрузки.'},
    recoveryBook:{kind:'book',book:'book-01',chunk:629,page:257,chapter:13,title:book1,summary:'В подготовке нужны отдых и изменение объёма и интенсивности. Усталость после нескольких занятий сама по себе не означает синдром перетренированности.'},
    intervalsBook:{kind:'book',book:'book-02',chunk:507,page:177,chapter:7,title:book2,summary:'В книге рассмотрены исследования интенсивной аэробной работы у подготовленных спортсменов с изменением МПК. Пример исследовательской программы не становится универсальным планом.'},
    garmin:{kind:'article',title:'Garmin · Forerunner 245: оценка VO₂ max для бега',url:'https://www8.garmin.com/manuals/webhelp/forerunner245/EN-US/GUID-015C6746-435D-48E0-8ED8-CA2C81684E38.html',summary:'Руководство этой модели описывает настройку профиля и максимального пульса, датчик пульса, уличный бег и сохранение занятия. Для знакомства с результатами бегуна устройству может понадобиться несколько пробежек. У других моделей условия могут отличаться.'},
    helgerud:{kind:'article',title:'Helgerud и соавт., 2007 · аэробные интервалы и VO₂ max',url:'https://pubmed.ncbi.nlm.nih.gov/17414804/',summary:'В рандомизированной работе на 40 здоровых умеренно тренированных мужчинах интервальные группы улучшили VO₂ max. Это основание рассматривать интенсивность как отдельный стимул, а не гарантия эффекта или готовности конкретного человека.'},
    consensus:{kind:'article',title:'Meeusen и соавт., 2013 · консенсус ECSS / ACSM',url:'https://pubmed.ncbi.nlm.nih.gov/23247672/',summary:'Консенсус связывает подготовку с балансом нагрузки и восстановления. Единственного общепринятого диагностического маркера перетренированности нет; по одному журналу такой диагноз не ставят.'},
    talk:{kind:'article',title:'CDC · как оценивать относительную интенсивность',url:'https://www.cdc.gov/physical-activity-basics/measuring/',summary:'Разговорный тест — практический ориентир интенсивности: при умеренном усилии человек обычно может говорить, а при энергичной работе разговор ограничивается несколькими словами. Это не индивидуальная пульсовая зона и не измерение МПК.'}
  };
  const num=(v,d=1)=>v.toLocaleString('ru-RU',{maximumFractionDigits:d});
  const finite=v=>typeof v==='number'&&Number.isFinite(v)&&v>=0;
  function stamp(row){
    const value=row.local_start_time||row.start_time;
    if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}(?:T|$)/.test(value))return null;
    const date=value.slice(0,10),ms=Date.parse(date+'T00:00:00Z');
    return Number.isFinite(ms)&&new Date(ms).toISOString().slice(0,10)===date?ms:null;
  }
  const iso=ms=>new Date(ms).toISOString().slice(0,10);
  const day=ms=>new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(ms);
  const range=(a,b)=>day(a)+' — '+day(b);
  const clean=rows=>(Array.isArray(rows)?rows:[]).filter(r=>r&&Object.hasOwn(names,r.sport));
  function calendar(rows){
    const dated=rows.map(r=>({r,date:stamp(r)})).filter(v=>v.date!==null);
    const days=[...new Set(dated.map(v=>v.date))].sort((a,b)=>a-b),weeks=new Map();
    let longestGap={days:0,start:null,end:null},streak={days:0,start:null,end:null},start=null,last=null;
    for(const date of days){
      if(last!==null&&date-last>dayMs&&((date-last)/dayMs-1)>longestGap.days)longestGap={days:(date-last)/dayMs-1,start:iso(last+dayMs),end:iso(date-dayMs)};
      if(last===null||date-last!==dayMs)start=date;
      const length=(date-start)/dayMs+1;
      if(length>streak.days)streak={days:length,start:iso(start),end:iso(date)};
      last=date;
    }
    for(const {r,date} of dated){
      const monday=date-((new Date(date).getUTCDay()+6)%7)*dayMs;
      if(!weeks.has(monday))weeks.set(monday,{start:iso(monday),end:iso(monday+6*dayMs),minutes:0,count:0,days:new Set(),knownMinutes:0});
      const week=weeks.get(monday);week.count++;week.days.add(date);
      if(finite(r.min)){week.minutes+=r.min;week.knownMinutes++;}
    }
    const ranked=[...weeks.values()].sort((a,b)=>b.minutes-a.minutes||a.start.localeCompare(b.start));
    const peak=ranked.length?{...ranked[0],activeDays:ranked[0].days.size}:null;
    if(peak)delete peak.days;
    return {datedCount:dated.length,activeDays:days.length,activeWeeks:weeks.size,longestGap,streak,peak};
  }
  function build(input,{sport='all',contextRows=input}={}){
    const rows=clean(input),all=clean(contextRows),cal=calendar(rows),recovery=calendar(all);
    const stats={count:rows.length,minutes:rows.reduce((s,r)=>s+(finite(r.min)?r.min:0),0),knownMinutes:rows.filter(r=>finite(r.min)).length,
      hrCount:rows.filter(r=>finite(r.heart_rate)&&r.heart_rate>0).length,zoneCount:rows.filter(r=>Object.values(r.archive_metrics?.heart_rate_zone_seconds||{}).some(v=>finite(v)&&v>0)).length,
      datedCount:cal.datedCount,activeDays:cal.activeDays,activeWeeks:cal.activeWeeks,longestGap:cal.longestGap,vo2:null};
    if(!rows.length)return {stats,recovery,quadrants:[],recommendations:[]};
    const item=(id,title,fact,why,limit,next,sourceIds,kind='Наблюдение журнала')=>({id,title,fact,why,limit,next,sourceIds,kind});
    const discipline=names[sport]||'выбранные виды',kinds=[...new Set(rows.map(r=>r.sport))];
    const peak=recovery.peak;
    const peakFact=peak?'За '+range(Date.parse(peak.start),Date.parse(peak.end))+': '+peak.count+' занятий, '+num(peak.minutes)+' мин по известным длительностям. Это максимум записанного времени недели в выбранном периоде.':'Даты занятий неизвестны: наиболее объёмную неделю выделить нельзя.';
    const recoveryLimit='Объём не показывает интенсивность и не доказывает перегрузку. Границы периода могут обрезать неделю; другие занятия могли не попасть в экспорт. Отсутствие записей не подтверждает отдых.';
    const strengths=[
      item('history','У вас уже есть опора',stats.count+' записей · '+num(stats.minutes)+' мин. Длительность известна у '+stats.knownMinutes+' из '+stats.count+' занятий.',
        'Это выполненная работа, которую можно сохранять и осмысленно сопоставлять. Повторяемые занятия создают условия для адаптации; наличие записей ещё не доказывает её величину.',
        'По этим числам нельзя подтвердить сильную аэробную базу или высокий VO₂ max. Для этого нужны интенсивность, сопоставимые результаты и контекст спортсмена.',
        'Отметьте занятия, после которых было комфортное самочувствие. Они помогут описать привычный режим, не увеличивая его автоматически.',['adaptation','load']),
      kinds.length>1?item('variety','Движение в нескольких дисциплинах',kinds.map(k=>names[k]+': '+rows.filter(r=>r.sport===k).length).join(' · ')+'.',
        'В журнале есть разные виды двигательной работы. Это полезный материал, чтобы видеть подготовку шире одной дисциплины.',
        'Разнообразие не доказывает равную подготовленность во всех видах. Километры разных дисциплин не складываются в общий показатель формы.',
        'Сохраняйте отдельные цели и сравнения для каждого вида.',['specificity','effects']):
      item('return','Вы возвращаетесь к тренировкам',cal.datedCount?'Занятия отмечены в '+cal.activeDays+' днях и '+cal.activeWeeks+' календарных неделях.':'Даты неизвестны: повторяемость пока не оценена.',
        'Возвращение к занятиям — наблюдаемая опора подготовки. Серия наблюдений полезнее для сравнения, чем один удачный результат.',
        'Календарная частота не означает достаточную нагрузку, высокий уровень или подтверждённую регулярность вне выгрузки.',
        'Сравнивайте привычный режим по неделям вместе с задачей и ощущениями.',['effects','adaptation'])
    ];
    const attention=[
      item('intensity','Интенсивность стоит уточнить','Средний пульс есть у '+stats.hrCount+' из '+stats.count+' занятий; время в зонах Garmin — у '+stats.zoneCount+'. Индивидуальные пороги в этот разбор не переданы.',
        'Похожая дистанция или длительность может означать разное воздействие. Даже настроенные часы и Garmin Training Effect не заменяют проверку задачи и реакции.',
        'По среднему пульсу нельзя объявить все занятия лёгкими, вывести VO₂ max или назначить пульсовую зону.',
        'Добавьте задачу занятия и субъективную тяжесть. Перед работой по зонам проверьте их настройку.',['load']),
      item('gaps',cal.longestGap.days?'Ритм можно рассмотреть внимательнее':'Контекст ещё можно дополнить',
        cal.longestGap.days?'Самый длинный промежуток без записи: '+cal.longestGap.days+' дн., '+range(Date.parse(cal.longestGap.start),Date.parse(cal.longestGap.end))+'.':cal.datedCount?'Между отмеченными днями нет промежутка длиннее нуля дней. Это относится только к текущей выборке.':'Даты неизвестны; интервалы между занятиями не рассчитаны.',
        'Пауза может менять контекст следующей сессии. Полезно знать её причину, а не считать разрыв в журнале неудачей.',
        'Отсутствие записи может быть пропуском экспорта, поездкой или другим видом активности. Оно не доказывает потерю формы.',
        'Уточните полноту истории и причину паузы. Не компенсируйте пропущенные записи увеличением объёма.',['effects','recoveryBook'])
    ];
    const opportunities=[
      item('compare','Сделать прогресс видимым','Выбрано '+stats.count+' занятий: '+discipline+'.',
        'Повторяемое занятие с похожими условиями позволяет осмысленнее сопоставлять время, ощущения и реакцию пульса.',
        'Без одинаковых задачи, маршрута или бассейна, условий и отдыха разница темпа не доказывает прогресс.',
        sport==='swim'?'Отмечайте стиль, длину бассейна, отрезки и отдых; сравнивайте похожие заплывы.':'Отмечайте задачу, условия и самочувствие; сопоставляйте привычные занятия, не устраивая максимальный тест.',['specificity','effects']),
      item('next-stimulus','Выбирать следующий стимул осознанно','Время известно у '+stats.knownMinutes+' занятий, но цели, опыт и самочувствие не заданы.',
        'Объём — одна сторона подготовки. Выбор интенсивности и организации занятий должен отвечать вашей цели и учитывать восстановление.',
        'Отсутствие интервальной метки в импорте не означает, что интервалов не было. Готовность к интенсивной работе не определена.',
        'Сначала уточните цель и привычную нагрузку. Ниже — варианты для обсуждения, а не автоматически назначенный план.',['load','effects'],'Возможность после уточнения')
    ];
    const reinforce=[
      item('peak','Оставить место восстановлению',peakFact,
        'Самая объёмная по времени неделя — конкретное место, где полезно сопоставить нагрузку со сном, самочувствием и тяжестью занятий. Учтены все виды выбранного периода.',recoveryLimit,
        'Вспомните реакцию на эту неделю. При заметной усталости не добавляйте интенсивность автоматически; сначала оцените восстановление.',['recoveryBook','load','consensus']),
      item('streak','Замечать плотность дней',recovery.streak.days?'Самая длинная серия: '+recovery.streak.days+' дн. с записями подряд, '+range(Date.parse(recovery.streak.start),Date.parse(recovery.streak.end))+'. Учтены все дисциплины периода.':'Даты неизвестны: серия не рассчитана.',
        'Серия показывает расположение занятий во времени. Она помогает задавать вопросы о восстановлении рядом с нагрузкой.',
        'Последовательные дни не обязательно тяжёлые; одиночный свободный день не гарантирует восстановление. Диагноз по календарю не ставится.',
        'Добавляйте короткую отметку о сне, усталости и самочувствии. Стойкое необычное ухудшение — повод обсудить состояние со специалистом.',['recoveryBook','consensus'])
    ];
    const recommendations=[
      item('endurance','Выносливость: сохранить то, что получается',stats.count+' занятий и '+num(stats.minutes)+' мин — ваша наблюдаемая работа за выбранный период.',
        'Регулярная посильная работа на выносливость даёт стимул для адаптации кислородного обеспечения. Её польза не сводится к максимальному тесту.',
        'Интенсивность и индивидуальная реакция ещё не подтверждены; журнал не позволяет утверждать «сильная аэробная база».',
        sport==='swim'?'Повторяйте знакомые комфортные отрезки с привычным отдыхом, отмечая стиль и ощущения. Не увеличивайте дистанцию ради заполнения графика.':'Сохраняйте знакомую посильную работу. Для лёгкого варианта ориентируйтесь на комфортное усилие и возможность говорить фразами; длительность выбирайте в пределах уже привычной.',
        ['adaptation','load',...(sport==='swim'?[]:['talk'])],'Образовательный следующий шаг'),
      item('vo2','VO₂ max: сначала понять измерение','VO₂ max не передан в нормализованной выгрузке. Значение не вычисляется из темпа, среднего пульса или Garmin Training Effect.',
        'МПК описывает максимальную скорость использования кислорода — один из показателей кардиореспираторной выносливости. Оценка часов и прямое лабораторное измерение — разные способы оценки; значение одного вида нагрузки не переносится автоматически на другой.',
        sport==='swim'?'Беговая оценка Garmin не является оценкой техники или VO₂ max в плавании. Протокол уличной пробежки к заплывам не применяется.':'Условия оценки зависят от модели и дисциплины. Пример инструкции ниже относится к Forerunner 245 и бегу; он не назначает максимальное усилие и не гарантирует доступность функции на ваших часах.',
        sport==='swim'?'Сначала сопоставляйте похожие заплывы. Если нужно прямое измерение МПК, условия теста подбирают под задачу со специалистом.':sport==='run'||sport==='all'?'Проверьте поддержку функции на своей модели. В примере FR245 нужны настроенный профиль/максимальный пульс, датчик пульса, уличный бег не менее 10 минут и сохранение занятия. Не повышайте усилие ради получения цифры.':'Проверьте руководство именно своей модели и вида активности. Беговой пример не задаёт условия оценки для велосипеда или ходьбы.',
        ['oxygen','specificity',...(sport==='swim'?[]:['garmin'])],'Измерение пока отсутствует')
    ];
    if(sport==='run'||sport==='all'||sport==='cycle')recommendations.push(item('intervals','VO₂ max: интенсивность как отдельный стимул','Выгрузка не сообщает опыт, самочувствие и задачу каждого занятия. Отсутствие интервалов не установлено.',
      'Книга и исследование рассматривают аэробные интервалы как вариант стимула для МПК. Это отличается от простого увеличения дистанции.',
      'Исследование не доказывает вашу готовность к такому формату. Без контекста не назначаем количество повторов, длительность, темп и пульсовую дозу.',
      'Сначала уточните зоны, привычную частоту, цель и восстановление. Формат для обсуждения с тренером: разминка → чередование работы и лёгкого восстановления → заминка. Это возможная замена части нагрузки, не добавка поверх плотной недели.',
      ['intervalsBook','load','helgerud'],'Образовательный вариант, не план'));
    else recommendations.push(item('technique',sport==='swim'?'В воде: качество сопоставимых отрезков':'Ритм: привычная посильная работа',stats.count+' занятий выбранного вида доступны для сопоставления.',
      'Специфика движения важна для тренировки и оценки результата. Полезнее сравнивать похожую работу, чем переносить чужой протокол.',
      'По итоговой длительности нельзя оценить технику, качество движений или назначить новый объём.',
      sport==='swim'?'Запишите стиль, длину бассейна, отрезки и отдых. Повторите уже знакомый комфортный формат и сравните ощущения, не превращая его в гонку.':'Выберите знакомый комфортный формат и отмечайте ощущения. Не увеличивайте нагрузку только ради показателя часов.',
      ['specificity','effects'],'Следующий шаг для вашей дисциплины'));
    recommendations.push(item('recovery','Восстановление: смотреть рядом с нагрузкой',peakFact,
      'Планирование отдыха и изменение характера нагрузки поддерживают баланс подготовки. Для контекста здесь учтены все виды выбранного периода.',recoveryLimit,
      'Сверьте этот блок со сном, обычной усталостью и субъективной тяжестью. Если привычное усилие ощущается необычно тяжёлым, сначала обсудите облегчение нагрузки, а не новую интенсивную сессию.',
      ['recoveryBook','consensus'],'Контекст всех дисциплин'));
    return {stats,recovery,quadrants:[{key:'strengths',title:'Сильные стороны',caption:'На что уже можно опереться',items:strengths},{key:'opportunities',title:'Возможности',caption:'Куда направить следующий шаг',items:opportunities},{key:'attention',title:'Зоны внимания',caption:'Что пока ограничивает выводы',items:attention},{key:'reinforce',title:'Что укрепить',caption:'Бережно к нагрузке и восстановлению',items:reinforce}],recommendations};
  }

  let dialog=null,returnFocus=null,closeTimer=null;
  const node=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text)n.textContent=text;return n;};
  const reduced=()=>window.TempoMotion?.reduced()||matchMedia('(prefers-reduced-motion: reduce)').matches;
  function close(immediate=false){
    if(!dialog?.open)return;
    clearTimeout(closeTimer);
    if(immediate||reduced())dialog.close();else{dialog.classList.add('is-closing');closeTimer=setTimeout(()=>dialog.close(),140);}
  }
  function open(item,trigger,personal){
    returnFocus=trigger;
    if(!dialog){
      dialog=node('dialog','insight-dialog');dialog.id='insight-dialog';dialog.setAttribute('aria-labelledby','insight-dialog-title');
      document.body.append(dialog);
      dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
      dialog.addEventListener('keydown',event=>{
        if(event.key!=='Tab')return;
        const controls=[...dialog.querySelectorAll('button:not(:disabled),a[href]')].filter(n=>n.getClientRects().length),first=controls[0],last=controls.at(-1),active=document.activeElement;
        if(first&&event.shiftKey&&(active===first||!controls.includes(active))){event.preventDefault();last.focus();}
        else if(first&&!event.shiftKey&&active===last){event.preventDefault();first.focus();}
      });
      dialog.addEventListener('click',event=>{const r=dialog.getBoundingClientRect();if(event.target===dialog&&(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom))close();});
      dialog.addEventListener('close',()=>{clearTimeout(closeTimer);dialog.classList.remove('is-closing');if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});});
    }
    dialog.classList.remove('is-closing');dialog.replaceChildren();
    const header=node('header','insight-dialog-header'),label=node('div');label.append(node('p','eyebrow',personal?'ВАШИ ДАННЫЕ → ОСНОВАНИЕ':'ДЕМО → ПРИМЕР ОБЪЯСНЕНИЯ'));
    const title=node('h2','',item.title);title.id='insight-dialog-title';title.tabIndex=-1;label.append(title);
    const dismiss=node('button','insight-dismiss','Закрыть ×');dismiss.type='button';dismiss.addEventListener('click',()=>close());header.append(label,dismiss);dialog.append(header);
    const block=(title,text,cls='')=>{const section=node('section','insight-detail '+cls);section.append(node('h3','',title),node('p','',text));dialog.append(section);};
    block('01 / Что видно в выгрузке',item.fact,'insight-fact');block('02 / Почему это имеет значение',item.why);
    const evidence=node('section','insight-detail insight-evidence');evidence.append(node('h3','','03 / Книжное основание и дополнения'));
    item.sourceIds.forEach(id=>{
      const source=sources[id],section=node('article','insight-source');
      section.append(node('p','insight-source-kind',source.kind==='book'?'ОСНОВНАЯ КНИГА · ИЗ ОЦИФРОВАННОЙ БАЗЫ':source.url.includes('pubmed.ncbi.nlm.nih.gov')?'ВНЕШНЯЯ НАУЧНАЯ ПУБЛИКАЦИЯ · НЕ ОЦИФРОВАНА':'ВНЕШНЯЯ СПРАВОЧНАЯ СТРАНИЦА · ВНЕ КНИЖНОЙ БАЗЫ'),node('h4','',source.title));
      if(source.kind==='book')section.append(node('p','insight-source-location','PDF-с. '+source.page+' · глава '+source.chapter+' · '+source.book+':'+source.chunk));
      section.append(node('p','',source.summary));
      if(source.url){const a=node('a','text-button','Открыть первоисточник ↗');a.href=source.url;a.target='_blank';a.rel='noopener noreferrer';section.append(a);}
      evidence.append(section);
    });
    evidence.append(node('p','insight-caption','В оцифрованной базе ровно две основные книги. Книжные тезисы — пересказы OCR, не дословные цитаты; исходные PDF находятся в разделе «Книги и источники» личного кабинета. Внешние публикации добавлены отдельно для проверки общих положений и в книжную базу не входят. Применение принципа к журналу — правило сервиса, а не заключение автора книги о вас.'));dialog.append(evidence);
    block('04 / Что ещё неизвестно',item.limit);block('05 / Следующий шаг',item.next,'insight-next');
    const done=node('button','button primary','Понятно, вернуться к отчёту');done.type='button';done.addEventListener('click',()=>close());dialog.append(done);
    dialog.showModal();dialog.scrollTop=0;title.focus({preventScroll:true});
  }
  function render(rows,state){
    const target=document.getElementById('training-report');if(!target)return;
    close(true);
    const result=build(rows,{sport:state.sport,contextRows:window.TempoData?.weeks?.[state.week]||rows});
    if(!result.stats.count)return;
    const wrap=node('section','training-insights');wrap.id='training-insights';wrap.setAttribute('aria-labelledby','training-insights-title');
    wrap.append(node('p','eyebrow',TempoData.live?'ВАША КАРТА ПОДГОТОВКИ':'КАРТА ПОДГОТОВКИ / ДЕМО'));
    const h=node('h3','insights-title','Свод-анализ тренировок.');h.id='training-insights-title';wrap.append(h);
    wrap.append(node('p','insights-lede','Сильные стороны, вопросы и следующий шаг. Нажмите на наблюдение: внутри — ваши цифры, объяснение и конкретный источник.'));
    const grid=node('div','insight-matrix');
    result.quadrants.forEach((quadrant,index)=>{
      const section=node('section','insight-quadrant '+quadrant.key),head=node('div','quadrant-heading');head.append(node('span','quadrant-number',String(index+1).padStart(2,'0')),node('h4','',quadrant.title));section.append(head,node('p','quadrant-caption',quadrant.caption));
      quadrant.items.forEach(item=>{
        const button=node('button','insight-trigger');button.type='button';button.dataset.insight=item.id;button.setAttribute('aria-haspopup','dialog');
        button.append(node('strong','',item.title),node('span','insight-trigger-fact',item.fact),node('span','insight-trigger-more','Почему так · '+item.sourceIds.length+' основания ↗'));
        button.addEventListener('click',()=>open(item,button,!!TempoData.live));section.append(button);
      });grid.append(section);
    });wrap.append(grid);
    wrap.append(node('p','insight-caption','Наблюдения рассчитаны из выбранной истории. Книги объясняют принципы; готовность, физиологический уровень и диагноз по журналу не определяются.'));
    const advice=node('section','insight-advice');advice.append(node('p','eyebrow','ПОСЛЕ РАЗБОРА / ЧТО МОЖНО СДЕЛАТЬ'),node('h3','insights-title','Следующий шаг — по силам.'));
    const cards=node('div','insight-advice-grid');
    result.recommendations.forEach((item,index)=>{
      const article=node('article','insight-recommendation');article.append(node('span','insight-rec-index',String(index+1).padStart(2,'0')+' / '+item.kind),node('h4','',item.title),node('p','',item.next));
      const button=node('button','text-button','Объяснение и источники ↗');button.type='button';button.dataset.insight=item.id;button.setAttribute('aria-haspopup','dialog');button.addEventListener('click',()=>open(item,button,!!TempoData.live));article.append(button);cards.append(article);
    });advice.append(cards);wrap.append(advice);target.append(wrap);
  }
  return {build,sources,render};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=TempoInsights;
