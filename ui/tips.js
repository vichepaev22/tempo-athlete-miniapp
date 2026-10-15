/* Reviewed educational paraphrases; not random raw retrieval or personal prescriptions. */
window.TempoTips = (() => {
  const cards=[
    {id:'specificity',title:'Прогресс связан с тем, что вы тренируете',text:'Физиологическая адаптация зависит от вида тренировочной деятельности. При оценке прогресса полезно смотреть на работу, близкую к вашей дисциплине: улучшение одного вида активности не означает одинакового улучшения всех остальных.',source:'Уилмор / Костилл · PDF-с. 198 · фрагмент 473',book:'book-01',chunk:473,page:198,href:'about.html#books'},
    {id:'effects',title:'Одна тренировка и подготовка — разные масштабы',text:'Тренировочный эффект — ответ на воздействие нагрузки. В книге рассматриваются эффекты отдельных занятий и более длительных периодов подготовки. Поэтому наблюдения за одной сессией и за серией тренировок отвечают на разные вопросы.',source:'Владимир Иссурин · PDF-с. 33 · фрагмент 73',book:'book-02',chunk:73,page:33,href:'about.html#books'},
    {id:'load',title:'Дистанция — ещё не вся нагрузка',text:'Величина тренировочного воздействия связана с объёмом, интенсивностью и новизной упражнений. Одинаковое время или дистанция сами по себе не описывают все три составляющие.',source:'Владимир Иссурин · PDF-с. 15 · фрагмент 24',book:'book-02',chunk:24,page:15,href:'about.html#books'}
  ];
  const labels={unknown:'Уровень не указан',beginner:'Для начинающего',recreational:'Для регулярных тренировок',experienced:'Для опытного спортсмена'};
  const framing={unknown:'Это общее знание. Укажите свой опыт, чтобы выбрать более подходящий уровень объяснения.',beginner:'Начните с различия между объёмом, интенсивностью и целью занятия. По одной дистанции нельзя определить, насколько тяжёлой была сессия.',recreational:'Сравнивайте одинаковые дисциплины и периоды, сохраняя цель и контекст каждой сессии.',experienced:'Разделяйте наблюдаемый объём и предполагаемый тренировочный эффект. Для вывода об интенсивности и адаптации одной сводки дистанции и длительности недостаточно.'};
  let last=null,getState,notify;
  const el=id=>document.getElementById(id);
  function show(next=true){
    const state=getState(),level=el('athlete-level').value;
    const candidates=cards.filter(c=>c.id!==last);
    const card=next?candidates[Math.floor(Math.random()*candidates.length)]:cards.find(c=>c.id===last);
    if(!card)return;
    last=card.id;const items=TempoViews.selected(state),minutes=items.reduce((v,a)=>v+a.min,0);
    const discipline=state.sport==='swim'?'Плавание':state.sport==='run'?'Бег':'Бег и плавание';
    el('tip-card').hidden=false;el('tip-card').dataset.card=card.id;el('tip-hint').hidden=true;
    el('tip-label').textContent=discipline+' / '+labels[level];el('tip-title').textContent=card.title;el('tip-text').textContent=card.text;
    el('tip-context').textContent=(TempoData.live?'Контекст выбранного периода Garmin: ':'Контекст демо-недели: ')+TempoViews.sessions(items.length)+', '+minutes+' мин. Индивидуальная реакция и персональные зоны не определены.';
    el('tip-application').textContent=framing[level];el('tip-source').textContent=card.source;el('tip-link').href=card.href;
    TempoMotion.enter(el('tip-card'));if(next)notify('Показано знание из книги: '+discipline.toLowerCase()+'.');
  }
  function init(stateGetter,toast){
    getState=stateGetter;notify=toast;
    try{const stored=localStorage.getItem('tempo-athlete-level');if(stored&&labels[stored])el('athlete-level').value=stored;}catch{}
    el('tip-next').addEventListener('click',()=>show());
    el('athlete-level').addEventListener('change',()=>{try{localStorage.setItem('tempo-athlete-level',el('athlete-level').value);}catch{}if(last)show(false);});
  }
  return {init,refresh:()=>{if(last)show(false);},cards};
})();
