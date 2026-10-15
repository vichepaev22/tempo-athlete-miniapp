(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const preview = window.TempoDeployment?.mode === 'preview';
  const api = '';
  let signedIn = false, ai = false, recipe = null, finalURL = null, postureVersion = 0, storyVersion = 0, wardrobe = 'shorts';
  const previewURLs = new Map();
  const scenes = {'a winding woodland trail':'лесная тропа','a coastal promenade':'набережная','a mountain path above the clouds':'горная тропа над облаками','an urban park':'городской парк','an athletic track at sunset':'стадион на закате'};
  const palettes = {'warm amber and cream':'янтарный и кремовый','cool blue and orange':'синий и оранжевый','muted green and peach':'зелёный и персиковый','violet and soft pink':'фиолетовый и розовый','monochrome with a coral accent':'монохром с коралловым акцентом'};
  let toastTimer;
  function notify(text, error = false) {
    clearTimeout(toastTimer); $('toast').hidden = false; $('toast').classList.toggle('error', error);
    $('toast').setAttribute('role', error ? 'alert' : 'status'); $('toast').querySelector('span').textContent = text;
    if (!error) toastTimer = setTimeout(() => {$('toast').hidden = true;}, 6000);
  }
  $('toast').querySelector('button').addEventListener('click', () => {$('toast').hidden = true;});
  async function request(path, data, method = 'POST', binary = false) {
    if (preview) throw new Error('Для этой функции нужен подключённый API. Сейчас открыт публичный предпросмотр.');
    let response;
    try { response = await fetch(api + path, {method, credentials:'include', headers:{'Content-Type':'application/json','X-Tempo-Client':'studio'}, body:data === undefined ? undefined : JSON.stringify(data)}); }
    catch (_) { throw new Error('Сервис сейчас недоступен. Проверьте соединение и попробуйте позже.'); }
    if (!response.ok) {
      const value = await response.json().catch(() => ({}));
      if (response.status === 401) setSession(false, false);
      throw new Error(typeof value.error === 'string' ? value.error : typeof value.detail === 'string' ? value.detail : 'Не удалось выполнить действие. Проверьте поля и согласия.');
    }
    return binary ? response.blob() : response.json();
  }
  function setSession(value, provider) {
    signedIn = value; ai = provider; $('login-panel').hidden = value; $('logout').hidden = !value;
    $('connection').textContent = value ? 'Личный пилот' : 'Вход по коду'; $('connection').classList.toggle('online', value);
    
    document.querySelectorAll('.ai-note').forEach(p => p.textContent = ai ? 'ИИ подключён. Отправка только с вашим согласием.' : 'ИИ ещё не подключён. Схемы съёмки и общие карточки доступны после входа.');
  }
  async function action(form, task, success) {
    const button = form.querySelector('button[type=submit]'), old = Array.from(button.childNodes);
    button.disabled = true; button.textContent = 'Выполняем…'; form.setAttribute('aria-busy','true');
    try { await task(); if (success) notify(success); } catch (error) { notify(error.message, true); }
    finally { button.disabled = false; button.replaceChildren(...old); form.removeAttribute('aria-busy'); }
  }
  function requireSession() { if (preview) throw new Error('Книжный поиск и ИИ доступны в приватном пилоте. Публичный API ещё не подключён.'); if (!signedIn) throw new Error('Сначала войдите по коду личного пилота.'); }
  function requireAI() { requireSession(); if (!ai) throw new Error('ИИ пока выключен. Поиск в книгах и сторис с оригинальным фото уже доступны.'); }
  function node(tag, text, className) { const n=document.createElement(tag); n.textContent=text; if(className)n.className=className; return n; }
  function clearResult(target, label) { target.replaceChildren(node('p',label,'eyebrow')); }
  document.querySelectorAll('[data-tab]').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('[data-tab]').forEach(b => {if (b === button)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
    document.querySelectorAll('.panel').forEach(p => p.hidden = p.id !== button.dataset.tab);
    history.replaceState(null,'','#'+button.dataset.tab);
  }));
  const initial = document.querySelector('[data-tab="'+(['knowledge','posture','stories'].includes(location.hash.slice(1))?location.hash.slice(1):'knowledge')+'"]'); initial.click();
  $('login-form').addEventListener('submit', e => {e.preventDefault(); action(e.currentTarget, async () => {
    await request('/api/session',{code:$('code').value}); $('code').value=''; const s=await request('/api/session',undefined,'GET'); setSession(true,s.external_ai);
  }, 'Вы вошли в личный пилот.');});
  $('logout').addEventListener('click', async () => {try {await request('/api/session',undefined,'DELETE');clearPhotos();clearStory();clearResult($('rag-result'),'Ваш результат');setSession(false,false);notify('Сессия завершена. Фотографии удалены из вкладки.');}catch(e){notify(e.message,true);}});
  const views=[['front','Спереди'],['side','Сбоку'],['back','Сзади']];
  views.forEach(([view,label]) => {
    const slot=node('div','','photo-slot'), input=document.createElement('input'), labelNode=node('label',label);
    input.type='file';input.id='photo-'+view;input.accept='image/jpeg,image/png,image/webp';labelNode.htmlFor=input.id;
    const preview=document.createElement('img');preview.alt='Выбранный снимок: '+label;preview.hidden=true;
    const mirrored=node('label','','check'), checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.id='mirror-'+view;mirrored.append(checkbox,node('span','Снимок в зеркале / зеркальное отражение'));
    slot.append(labelNode,input,preview,mirrored);$('photo-inputs').append(slot);
    input.addEventListener('change',()=>{try {postureVersion++;const file=validFile(input);const old=previewURLs.get(view);if(old)URL.revokeObjectURL(old);preview.hidden=!file;if(file){const url=URL.createObjectURL(file);previewURLs.set(view,url);preview.src=url;}else{preview.removeAttribute('src');previewURLs.delete(view);}clearResult($('posture-result'),'Ваша диагностика осанки');}catch(error){input.value='';notify(error.message,true);}});
  });
  function validFile(input) {
    const file=input.files[0];if(!file)return null;
    if (!['image/jpeg','image/png','image/webp'].includes(file.type)) throw new Error('Нужен JPEG, PNG или WebP. HEIC экспортируйте в JPEG.');
    if (file.size > 5*1024*1024) throw new Error('Один снимок должен быть не больше 5 МБ.');
    return file;
  }
  function base64(file) {return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.onerror=()=>reject(new Error('Не удалось прочитать файл.'));reader.readAsDataURL(file);});}
  function clearPhotos() {
    postureVersion++; $('posture-form').reset(); previewURLs.forEach(url=>URL.revokeObjectURL(url));previewURLs.clear();
    document.querySelectorAll('.photo-slot img').forEach(img=>{img.hidden=true;img.removeAttribute('src');});
    clearResult($('posture-result'),'Фото и отчёт очищены');
    $('posture-result').append(node('p','Можно выбрать новые снимки по инструкции.','muted'));
  }
  $('clear-photos').addEventListener('click',()=>{clearPhotos();notify('Фото и отчёт удалены из текущей вкладки.');});
  $('posture-form').addEventListener('submit',e=>{e.preventDefault();action(e.currentTarget,async()=>{
    requireAI();const version=postureVersion, photos=[];
    for(const [view] of views){const f=validFile($('photo-'+view));if(f)photos.push({view,image:await base64(f),mirrored:$('mirror-'+view).checked});}
    if(!photos.length)throw new Error('Добавьте хотя бы один снимок.');
    const report=await request('/api/posture/analyze',{photos,consent:{adult:$('adult').checked,own_photo:$('own').checked,sportswear:$('own').checked,provider_consent:$('photo-provider').checked},pain_or_injury:$('pain').checked,request_id:crypto.randomUUID()});
    if(version!==postureVersion)return;
    const target=$('posture-result');clearResult(target,report.accepted?'Наблюдения по кадру':'Нужна пересъёмка');target.append(node('p',report.reason,'result-text'));
    report.observations.forEach(o=>{const item=node('section','','observation');item.append(node('strong',o.feature),node('p',o.observation),node('p',o.uncertainty,'fine'));target.append(item);});
    report.limitations.forEach(text=>target.append(node('p',text,'fine')));target.append(node('p',report.scope,'fine'));
  });});
  async function download(path,name) {
    if(preview){const guide=path.match(/^\/api\/posture\/guide\/([0-2])\.png/), movement=path.match(/^\/api\/posture\/cards\/([0-2])\.png/);const file=guide?'shooting-'+wardrobe+'-'+(Number(guide[1])+1)+'.png':movement?'movement-'+(Number(movement[1])+1)+'.png':null;if(!file)throw new Error('Карточка недоступна.');const link=document.createElement('a');link.href='assets/'+file;link.download=name;link.click();notify('Карточка подготовлена к скачиванию.');return;}
    requireSession();const blob=await request(path,undefined,'GET',true);const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),2000);notify('Карточка подготовлена к скачиванию.');
  }
  document.querySelectorAll('[data-guide]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();download('/api/posture/guide/'+a.dataset.guide+'.png?wardrobe='+wardrobe,'tempo-shooting-'+wardrobe+'-'+a.dataset.guide+'.png').catch(error=>notify(error.message,true));}));
  document.querySelectorAll('[data-movement]').forEach(b=>b.addEventListener('click',()=>download('/api/posture/cards/'+b.dataset.movement+'.png','tempo-movement-'+b.dataset.movement+'.png').catch(error=>notify(error.message,true))));
  document.querySelectorAll('button[data-wardrobe]').forEach(b=>b.addEventListener('click',()=>{wardrobe=b.dataset.wardrobe;document.querySelector('.guide-row').dataset.wardrobe=wardrobe;document.querySelectorAll('button[data-wardrobe]').forEach(other=>other.setAttribute('aria-pressed',String(other===b)));}));
  $('privacy-open').addEventListener('click',()=>$('privacy').showModal());$('privacy-close').addEventListener('click',()=>$('privacy').close());
  function clearFinal() {if(finalURL)URL.revokeObjectURL(finalURL);finalURL=null;$('story-final').hidden=true;$('story-final').removeAttribute('src');$('story-download').hidden=true;$('story-download').removeAttribute('href');}
  function clearStory() {storyVersion++;clearFinal();$('story-form').reset();recipe=null;$('story-consent-row').hidden=true;$('recipe-label').textContent='Ваш кадр без художественной обработки.';$('story-canvas').hidden=true;$('story-canvas').getContext('2d').clearRect(0,0,1080,1920);$('story-empty').hidden=false;$('preview-label').textContent='Здесь появится ваш кадр';}
  $('clear-story').addEventListener('click',()=>{clearStory();notify('Фото, статистика и сторис удалены из вкладки.');});
  async function imageFile(file) {const url=URL.createObjectURL(file);try{return await new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>{if(img.naturalWidth*img.naturalHeight>25000000)reject(new Error('Слишком большое разрешение изображения.'));else resolve(img);};img.onerror=()=>reject(new Error('Не удалось открыть изображение.'));img.src=url;});}finally{URL.revokeObjectURL(url);}}
  async function drawPreview() {
    const version=++storyVersion;clearFinal();const photo=validFile($('story-photo')),sticker=validFile($('story-overlay'));
    if(!photo){$('story-canvas').hidden=true;$('story-empty').hidden=false;return;}
    const source=await imageFile(photo);if(version!==storyVersion)return;
    const ctx=$('story-canvas').getContext('2d'),scale=Math.max(1080/source.width,1920/source.height);
    ctx.clearRect(0,0,1080,1920);ctx.drawImage(source,(1080-source.width*scale)/2,(1920-source.height*scale)/2,source.width*scale,source.height*scale);
    const bottom=$('position').value==='bottom';const gradient=ctx.createLinearGradient(0,bottom?1100:0,0,bottom?1920:820);gradient.addColorStop(0,bottom?'#0000':'#000b');gradient.addColorStop(1,bottom?'#000b':'#0000');ctx.fillStyle=gradient;ctx.fillRect(0,0,1080,1920);
    if(sticker){const image=await imageFile(sticker);if(version!==storyVersion)return;const layer=document.createElement('canvas');layer.width=image.width;layer.height=image.height;const c=layer.getContext('2d',{willReadFrequently:true});c.drawImage(image,0,0);const pixels=c.getImageData(0,0,layer.width,layer.height),bg=$('remove-bg').value,ref=bg==='white'?255:0;let left=layer.width,right=0,top=layer.height,bottomEdge=0;
      for(let i=0;i<pixels.data.length;i+=4){if(bg&&Math.max(Math.abs(pixels.data[i]-ref),Math.abs(pixels.data[i+1]-ref),Math.abs(pixels.data[i+2]-ref))<=8)pixels.data[i+3]=0;if(pixels.data[i+3]){const n=i/4,x=n%layer.width,y=Math.floor(n/layer.width);left=Math.min(left,x);right=Math.max(right,x+1);top=Math.min(top,y);bottomEdge=Math.max(bottomEdge,y+1);}}
      c.putImageData(pixels,0,0);if(right>left&&bottomEdge>top){const w=right-left,h=bottomEdge-top,k=Math.min(1,900/w,620/h);ctx.drawImage(layer,left,top,w,h,(1080-w*k)/2,bottom?1780-h*k:140,w*k,h*k);}else throw new Error('После удаления фона слой пустой. Проверьте выбранный цвет.');}
    $('story-empty').hidden=true;$('story-canvas').hidden=false;$('preview-label').textContent=$('style').value==='original'?'Предварительный просмотр · исходное фото':'Черновик композиции · художественный стиль появится после обработки';
  }
  ['story-photo','story-overlay','remove-bg','position'].forEach(id=>$(id).addEventListener('change',()=>drawPreview().catch(e=>notify(e.message,true))));
  async function newRecipe(random=false){if($('style').value==='original'&&!random){recipe=null;$('recipe-label').textContent='Ваш кадр без художественной обработки.';$('story-consent-row').hidden=true;return;}requireSession();const r=await request('/api/stories/recipe',{style:random?null:$('style').value,previous:recipe?.id||null});recipe=r;$('style').value=r.style;$('recipe-label').textContent=r.label+' · '+scenes[r.scene]+' · '+palettes[r.palette]+'.';$('story-consent-row').hidden=false;}
  $('style').addEventListener('change',async()=>{try{await newRecipe();await drawPreview();}catch(e){notify(e.message,true);}});
  $('random-scene').addEventListener('click',async()=>{try{await newRecipe(true);await drawPreview();notify('Новая сцена выбрана. Фото ещё не отправлено.');}catch(e){notify(e.message,true);}});
  $('story-form').addEventListener('submit',e=>{e.preventDefault();action(e.currentTarget,async()=>{
    if(preview){
      if($('style').value!=='original')throw new Error('Художественная обработка появится после подключения ИИ. Сейчас доступно оригинальное фото.');
      if(!$('story-own').checked)throw new Error('Подтвердите право использовать фото.');
      if(!validFile($('story-photo'))||!validFile($('story-overlay')))throw new Error('Нужны фотография и отдельный слой маршрута.');
      await drawPreview();const version=storyVersion;
      const blob=await new Promise((resolve,reject)=>$('story-canvas').toBlob(value=>value?resolve(value):reject(new Error('Не удалось собрать PNG.')),'image/png'));
      if(version!==storyVersion)return;
      clearFinal();finalURL=URL.createObjectURL(blob);$('story-final').src=finalURL;$('story-final').hidden=false;$('story-canvas').hidden=true;$('story-empty').hidden=true;$('story-download').href=finalURL;$('story-download').hidden=false;$('preview-label').textContent='Готовая сторис · 1080 × 1920 · собрано на устройстве';notify('Сторис готова. Фото и статистика не отправлялись на сервер.');return;
    }
    requireSession();if($('style').value!=='original')requireAI();if($('style').value!=='original'&&!$('story-provider').checked)throw new Error('Подтвердите передачу фотографии внешнему ИИ.');
    const photo=validFile($('story-photo')),overlay=validFile($('story-overlay'));if(!photo||!overlay)throw new Error('Нужны фотография и отдельный слой маршрута.');
    const version=storyVersion;const blob=await request('/api/stories/compose',{photo:await base64(photo),overlay:await base64(overlay),style:$('style').value,seed:recipe?.seed||null,position:$('position').value,remove_background:$('remove-bg').value||null,provider_consent:$('story-provider').checked,photo_permission:$('story-own').checked,request_id:crypto.randomUUID()},'POST',true);
    if(version!==storyVersion)return;clearFinal();finalURL=URL.createObjectURL(blob);$('story-canvas').hidden=true;$('story-empty').hidden=true;$('story-final').src=finalURL;$('story-final').hidden=false;$('story-download').href=finalURL;$('story-download').hidden=false;$('preview-label').textContent='Готовая сторис · 1080 × 1920';notify('Сторис готова. Маршрут и показатели взяты из вашего слоя.');
  });});
  window.addEventListener('pagehide',()=>{previewURLs.forEach(url=>URL.revokeObjectURL(url));if(finalURL)URL.revokeObjectURL(finalURL);});
  if(preview){
    $('connection').textContent=window.TempoPrivatePreview?'Личная студия':'Предпросмотр';$('login-panel').hidden=true;
    const banner=node('section','','login-panel');banner.append(node('p',(window.TempoPrivatePreview?'Личная студия. Поиск по двум книгам подключён.':'Публичный предпросмотр. Книжный поиск доступен в личном кабинете.')+' Диагностика осанки ожидает подключения ИИ. Схемы доступны, оригинальные сторис собираются на вашем устройстве.'));$('login-panel').after(banner);
    for(const id of ['login-form','posture-form']){$(id).querySelectorAll('input,textarea,select,button[type=submit]').forEach(control=>control.disabled=true);}
    $('rag-form').querySelector('.fine').textContent='Поиск по обеим книгам работает в личном кабинете. Введите вопрос и нажмите кнопку; источник и PDF-страницы появятся рядом.';
    document.querySelectorAll('.ai-note').forEach(p=>p.textContent='Диагностика осанки ожидает подключения ИИ. Фотографии здесь не собираются.');
    Array.from($('style').options).forEach(option=>option.disabled=option.value!=='original');$('random-scene').disabled=true;$('random-scene').title='После подключения ИИ';
    $('recipe-label').textContent='Оригинальное фото. Художественные стили появятся после подключения ИИ.';
    document.querySelector('footer p').textContent='Предпросмотр. Ручной импорт Garmin доступен в личном Telegram-пилоте. Аккаунты ещё не синхронизируются.';
  }else (async()=>{try{await request('/api/health',undefined,'GET');try{const s=await request('/api/session',undefined,'GET');setSession(true,s.external_ai);}catch(_){setSession(false,false);}}catch(_){$('connection').textContent='Сервис недоступен';setSession(false,false);$('connection').textContent='Сервис недоступен';}})();
})();
