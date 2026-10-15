/* Authenticated retrieval, separate from workout reports and image processing. */
window.TempoBooks=(()=>{
  'use strict';
  const node=(tag,text,cls)=>{const n=document.createElement(tag);n.textContent=text;if(cls)n.className=cls;return n;};
  async function search(question,book){
    const privatePreview=!!window.TempoPrivatePreview,initData=window.Telegram?.WebApp?.initData||'';
    if(!privatePreview&&!initData)throw new Error('Полный поиск доступен в вашем личном кабинете: откройте приложение через @tempo_athlete_bot. Описание обеих книг можно прочитать ниже.');
    const base=privatePreview?'api/books/search':(window.TempoGarminConfig?.api||'')+'/api/books/search';
    if(!privatePreview&&!window.TempoGarminConfig?.api)throw new Error('Адрес книжного сервиса пока не настроен.');
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
    try{
      const response=await fetch(base,{method:'POST',headers:{'Content-Type':'application/json',...(privatePreview?{'X-Tempo-Client':'books'}:{'X-Telegram-Init-Data':initData})},body:JSON.stringify({question,book:book||null}),cache:'no-store',credentials:'omit',signal:controller.signal});
      if(!response.ok)throw new Error(response.status===401?'Войдите заново через кнопку бота Telegram.':response.status===400?'Введите вопрос от 3 до 300 символов.':'Книжный сервис недоступен. Попробуйте ещё раз.');
      return await response.json();
    }finally{clearTimeout(timer);}
  }
  function bind(form,target){
    form.addEventListener('submit',async event=>{
      event.preventDefault();const question=form.querySelector('[name="question"]').value.trim(),button=form.querySelector('[type="submit"]');
      if(question.length<3||question.length>300){target.replaceChildren(node('p','Введите вопрос от 3 до 300 символов.'));target.setAttribute('role','alert');return;}
      const previous=button.textContent;button.disabled=true;button.textContent='Ищем в двух книгах…';form.setAttribute('aria-busy','true');target.setAttribute('role','status');target.replaceChildren(node('p','Ищем подходящие фрагменты…'));
      try{
        const result=await search(question,form.querySelector('[name="book"]')?.value);
        target.replaceChildren(node('h3',result.sources.length?'Найденные основания':'Подходящих фрагментов не найдено'));
        target.append(node('p','Поиск по '+result.total_chunks.toLocaleString('ru-RU')+' фрагментам. Вопрос не отправлялся внешней ИИ-модели.','footnote'));
        result.sources.forEach(source=>{const section=node('section','','book-hit');section.append(node('strong',source.title),node('p','PDF-с. '+source.pdf_page+' · глава '+source.chapter+' · '+source.id,'source-label'),node('p',source.text));target.append(section);});
        target.append(node('p',result.sources.length?result.limitation:'Попробуйте точнее: «объём и интенсивность», «специфичность адаптации» или «тренировочные эффекты».','footnote'));
      }catch(error){target.replaceChildren(node('p',error.name==='AbortError'?'Поиск занял слишком долго. Попробуйте ещё раз.':error.message));target.setAttribute('role','alert');}
      finally{button.disabled=false;button.textContent=previous;form.removeAttribute('aria-busy');}
    });
  }
  document.querySelectorAll('[data-book-search]').forEach(form=>bind(form,document.getElementById(form.dataset.result)));
  return {search,bind};
})();
