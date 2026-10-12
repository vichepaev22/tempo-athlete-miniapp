window.TempoForms = (() => {
  const key='tempo-local-questions-v1';let busy=false;
  const el=id=>document.getElementById(id);
  function read(){try{const value=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(value)?value.filter(v=>typeof v.text==='string'&&v.text.length<=600&&Number.isFinite(v.created)).slice(-10):[];}catch{return [];}}
  function latest(){const rows=read(),last=rows.at(-1);el('saved-questions').hidden=!last;if(last){el('saved-question-text').textContent=last.text;el('saved-question-date').textContent=new Date(last.created).toLocaleString('ru-RU')+' · В этом браузере';}}
  function error(message,toast){el('question-error').hidden=false;el('question-error').textContent=message;el('question').setAttribute('aria-invalid','true');toast(message,'error');TempoMotion.enter(el('question-error'));}
  function init(toast){
    latest();el('question').addEventListener('input',()=>{
      el('question-count').textContent=el('question').value.length+' / 600';
      el('question-error').hidden=true;el('question').removeAttribute('aria-invalid');
    });
    el('question-form').addEventListener('submit',async event=>{
      event.preventDefault();if(busy)return;
      const text=el('question').value.trim();el('question-result').hidden=true;
      if(text.length<10){error('Добавьте немного деталей: вопрос должен содержать хотя бы 10 символов.',toast);el('question').focus();return;}
      if(text.length>600){error('Сократите вопрос до 600 символов.',toast);return;}
      busy=true;el('question-submit').disabled=true;el('question-form').setAttribute('aria-busy','true');el('submit-label').textContent='Сохраняем…';el('question-error').hidden=true;
      await new Promise(resolve=>setTimeout(resolve,450));
      try{
        if(el('form-outcome').value==='error'){el('form-outcome').value='success';throw new Error('demo');}
        const rows=read();rows.push({text,created:Date.now()});localStorage.setItem(key,JSON.stringify(rows.slice(-10)));
        el('question-result').hidden=false;el('question-result').textContent='✓ Вопрос сохранён в этом браузере. Вы можете вернуться к нему позже.';
        el('question').value='';el('question-count').textContent='0 / 600';el('question').removeAttribute('aria-invalid');latest();
        toast('Вопрос сохранён в этом браузере.','success');TempoMotion.enter(el('question-result'));
      }catch{
        error('Не удалось сохранить вопрос. Текст остался — попробуйте ещё раз.',toast);
      }finally{
        busy=false;el('question-submit').disabled=false;el('question-form').removeAttribute('aria-busy');el('submit-label').textContent=el('question-error').hidden?'Сохранить вопрос':'Повторить сохранение';
      }
    });
  }
  return {init,latest};
})();
