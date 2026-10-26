/* Authenticated retrieval, separate from workout reports and image processing. */
window.TempoBooks=(()=>{
  'use strict';
  const node=(tag,text,cls)=>{const n=document.createElement(tag);n.textContent=text;if(cls)n.className=cls;return n;};
  async function search(question,book,jevConsent=false){
    const privatePreview=!!window.TempoPrivatePreview,initData=window.Telegram?.WebApp?.initData||'';
    if(!privatePreview&&!initData)throw new Error('Полный поиск доступен в вашем личном кабинете: откройте приложение через @tempo_athlete_bot. Описание обеих книг можно прочитать ниже.');
    const base=privatePreview?'api/books/search':(window.TempoGarminConfig?.api||'')+'/api/books/search';
    if(!privatePreview&&!window.TempoGarminConfig?.api)throw new Error('Адрес книжного сервиса пока не настроен.');
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),30000);
    try{
      const response=await fetch(base,{method:'POST',headers:{'Content-Type':'application/json',...(privatePreview?{'X-Tempo-Client':'books'}:{'X-Telegram-Init-Data':initData})},body:JSON.stringify({question,book:book||null,...(jevConsent?{jev_consent:true,request_id:crypto.randomUUID()}:{})}),cache:'no-store',credentials:'omit',signal:controller.signal});
      if(!response.ok)throw new Error(response.status===401?'Войдите заново через кнопку бота Telegram.':response.status===400?'Введите вопрос от 3 до 300 символов.':'Книжный сервис недоступен. Попробуйте ещё раз.');
      return await response.json();
    }finally{clearTimeout(timer);}
  }
  function bind(form,target){
    const consent=node('label','','check'), input=document.createElement('input');input.type='checkbox';
    consent.append(input,node('span','Дополнительно упорядочить через Jev. Разрешаю отправить TypeSafe вопрос и до 4 книжных отрывков; без тренировок и профиля. Не добавляйте личные сведения. Если сервис выключен, сохранится локальный порядок.'));
    form.querySelector('[type="submit"]').before(consent);
    form.addEventListener('submit',async event=>{
      event.preventDefault();const question=form.querySelector('[name="question"]').value.trim(),button=form.querySelector('[type="submit"]');
      if(question.length<3||question.length>300){target.replaceChildren(node('p','Введите вопрос от 3 до 300 символов.'));target.setAttribute('role','alert');return;}
      const previous=button.textContent;button.disabled=true;button.textContent='Ищем в двух книгах…';form.setAttribute('aria-busy','true');target.setAttribute('role','status');target.replaceChildren(node('p','Ищем подходящие фрагменты…'));
      try{
        const result=await search(question,form.querySelector('[name="book"]')?.value,input.checked);
        target.replaceChildren(node('h3',result.sources.length?'Найденные основания':'Подходящих фрагментов не найдено'));
        target.append(node('p','Поиск по '+result.total_chunks.toLocaleString('ru-RU')+' фрагментам. '+(result.jev?.status==='ranked'?'Jev упорядочил найденные источники; это не проверка истинности.':result.jev?.status==='fallback'?result.jev.message:'Вопрос не отправлялся внешней ИИ-модели.'),'footnote'));
        result.sources.forEach(source=>{const section=node('section','','book-hit');section.append(node('strong',source.title),node('p','PDF-с. '+source.pdf_page+' · глава '+source.chapter+' · '+source.id,'source-label'),node('p',source.text));target.append(section);});
        target.append(node('p',result.sources.length?result.limitation:'Попробуйте точнее: «объём и интенсивность», «специфичность адаптации» или «тренировочные эффекты».','footnote'));
      }catch(error){target.replaceChildren(node('p',error.name==='AbortError'?'Поиск занял слишком долго. Попробуйте ещё раз.':error.message));target.setAttribute('role','alert');}
      finally{button.disabled=false;button.textContent=previous;form.removeAttribute('aria-busy');}
    });
  }
  document.querySelectorAll('[data-book-search]').forEach(form=>bind(form,document.getElementById(form.dataset.result)));
  function originals(){
    const library=document.getElementById('library-screen');if(!library)return;
    const privatePreview=!!window.TempoPrivatePreview,initData=window.Telegram?.WebApp?.initData||'',connected=privatePreview||!!(initData&&window.TempoGarminConfig?.api);
    const base=privatePreview?'':(window.TempoGarminConfig?.api||'').replace(/\/$/,'')+'/',states=[];
    const button=document.createElement('button');button.type='button';button.className='text-button library-pdf-shortcut';button.textContent='К двум книгам и PDF ↓';
    button.addEventListener('click',()=>library.querySelector('.book-list').scrollIntoView({block:'start',behavior:window.TempoMotion?.reduced()?'instant':'smooth'}));library.querySelector('.section-lead').after(button);
    const heading=node('h2','Две основные книги','book-originals-heading');library.querySelector('.book-list').before(heading);
    for(const [key,id] of [['physiology','book-01'],['issurin','book-02']]){
      const row=library.querySelector('[data-book="'+key+'"]').parentElement,box=node('div','','book-pdf'),status=node('p',connected?'Проверяем исходный PDF…':'Исходный PDF доступен в личном кабинете владельца.','book-pdf-status');status.setAttribute('role','status');
      const action=node('button',connected?'Скачать исходный PDF ↓':'Открыть личный кабинет ↗','button primary');action.type='button';action.dataset.pdf=id;action.disabled=connected;
      if(!connected)action.addEventListener('click',()=>window.open('https://t.me/tempo_athlete_bot','_blank','noopener,noreferrer'));
      box.append(status,action);row.append(box);states.push({id,status,action});
    }
    const additions=node('section','','book-additions');additions.append(node('p','ДОПОЛНЕНИЯ / НЕ КНИГИ','eyebrow'),node('h2','Внешние публикации и справка'),node('p','Основу поиска и разбора составляют две книги выше. Эти материалы не оцифрованы и не добавлены в книжную базу: они используются отдельно для проверки общих положений. Meeusen2013 — научная статья-консенсус, а не третья книга.'));
    Object.values(window.TempoInsights?.sources||{}).filter(s=>s.kind!=='book').forEach(source=>{const article=node('article','','book-addition'),a=node('a',source.title+' ↗');a.href=source.url;a.target='_blank';a.rel='noopener noreferrer';article.append(a,node('p',source.url.includes('pubmed.ncbi.nlm.nih.gov')?'Научная публикация · внешний источник':'Справочная страница · внешний источник'));additions.append(article);});library.append(additions);
    if(!connected)return;
    const headers=privatePreview?{}:{'X-Telegram-Init-Data':initData};
    async function download(meta,entry){
      const {action,status}=entry,controller=new AbortController(),timer=setTimeout(()=>controller.abort(),180000);action.disabled=true;action.setAttribute('aria-busy','true');status.textContent='Загружаем PDF…';
      try{
        const response=await fetch(base+'api/books/pdf/'+meta.id,{headers,cache:'no-store',credentials:'omit',signal:controller.signal});
        if(!response.ok)throw new Error(response.status===401?'Откройте кабинет заново через Telegram.':'PDF сейчас недоступен. Попробуйте позже.');
        if(!response.headers.get('content-type')?.startsWith('application/pdf'))throw new Error('Сервер не подтвердил формат PDF.');
        const blob=await response.blob();if(blob.size!==meta.bytes)throw new Error('PDF получен не полностью. Повторите скачивание.');
        const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=meta.filename;link.hidden=true;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
        status.textContent='PDF передан браузеру для сохранения · '+meta.pages+' стр. Если файл открылся, используйте «Сохранить» или «Поделиться». ';action.textContent='Скачать PDF ещё раз ↓';
      }catch(error){status.textContent=error.name==='AbortError'?'Загрузка заняла слишком долго. Повторите скачивание.':error.message;}
      finally{clearTimeout(timer);action.disabled=false;action.removeAttribute('aria-busy');}
    }
    const catalogController=new AbortController(),catalogTimer=setTimeout(()=>catalogController.abort(),15000);
    fetch(base+'api/books/catalog',{headers,cache:'no-store',credentials:'omit',signal:catalogController.signal}).then(async response=>{
      if(!response.ok)throw new Error('Проверка PDF недоступна. Откройте кабинет заново.');return response.json();
    }).then(value=>{
      states.forEach(entry=>{
        const meta=value.books.find(b=>b.id===entry.id);
        if(!meta?.available){entry.status.textContent='Исходный PDF временно недоступен.';return;}
        entry.status.textContent='Исходный PDF · '+meta.pages+' стр. · '+(meta.bytes/1000000).toLocaleString('ru-RU',{maximumFractionDigits:1})+' МБ';entry.action.disabled=false;entry.action.addEventListener('click',()=>download(meta,entry));
      });
    }).catch(error=>states.forEach(entry=>{entry.status.textContent=error.name==='AbortError'?'Сервис PDF не ответил. Обновите страницу позже.':error.message;})).finally(()=>clearTimeout(catalogTimer));
  }
  originals();
  return {search,bind};
})();
