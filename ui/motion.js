window.TempoMotion = (() => {
  const system=matchMedia('(prefers-reduced-motion: reduce)');
  let custom=false,stopTimer,frame=0,visible=false;
  const animations=new Set();
  try{custom=localStorage.getItem('tempo-motion-reduced')==='true';}catch{}
  const reduced=()=>system.matches||custom;
  function animate(el,frames,options={duration:280,easing:'cubic-bezier(.2,.8,.2,1)'}){
    if(!el||reduced()||!el.animate||document.hidden)return;
    el.getAnimations().forEach(a=>a.cancel());
    const animation=el.animate(frames,options);animations.add(animation);
    animation.finished.then(()=>animations.delete(animation),()=>animations.delete(animation));
    return animation;
  }
  function stop(){
    clearTimeout(stopTimer);animations.forEach(a=>a.cancel());animations.clear();
    const tile=document.getElementById('athlete-tile');
    tile?.classList.remove('playing','signal');if(tile)tile.dataset.motion='static';
  }
  function sport(name,play=true){
    stop();const tile=document.getElementById('athlete-tile');
    document.getElementById('athlete-art').innerHTML=TempoIcons.athlete(name);
    tile.setAttribute('aria-label','Повторить анимацию: '+({run:'бег',swim:'плавание',all:'все дисциплины'}[name]));
    tile.dataset.sport=name;tile.dataset.motion='static';
    if(play&&!reduced()&&!document.hidden){
      tile.classList.add('playing','signal');tile.dataset.motion='playing';
      stopTimer=setTimeout(()=>{tile.classList.remove('playing','signal');tile.dataset.motion='complete';},1900);
    }
  }
  function enter(el){animate(el,[{opacity:.4,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}]);}
  function update(){
    animate(document.getElementById('metric-grid'),[{opacity:.55,transform:'translateY(4px)'},{opacity:1,transform:'translateY(0)'}]);
    animate(document.getElementById('week-chart'),[{opacity:.3,transform:'translateY(6px)'},{opacity:1,transform:'translateY(0)'}],{duration:340,easing:'ease-out'});
  }
  function underline(){
    const selected=document.querySelector('[data-sport][aria-pressed="true"]');
    const line=document.getElementById('sport-underline');
    line.style.width=selected.offsetWidth+'px';line.style.left=selected.offsetLeft+'px';
  }
  function syncPreference(){
    document.documentElement.classList.toggle('motion-off',reduced());
    stop();document.querySelector('.track-pattern').style.transform='none';
    document.dispatchEvent(new CustomEvent('tempo-motion-change',{detail:{reduced:reduced()}}));
  }
  function setReduced(value){custom=value;try{localStorage.setItem('tempo-motion-reduced',String(value));}catch{}syncPreference();}
  function parallax(){
    if(frame)return;
    frame=requestAnimationFrame(()=>{
      frame=0;
      if(!visible||reduced()||document.hidden||matchMedia('(pointer:coarse)').matches)return;
      const panel=document.getElementById('insight-panel');
      const y=Math.max(-12,Math.min(12,(panel.getBoundingClientRect().top-innerHeight*.35)*-.04));
      panel.querySelector('.track-pattern').style.transform='translateY('+y+'px)';
    });
  }
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;},{threshold:.05});
  function init(){
    syncPreference();observer.observe(document.getElementById('insight-panel'));
    system.addEventListener('change',syncPreference);
    addEventListener('resize',underline);addEventListener('scroll',parallax,{passive:true});
    document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
    addEventListener('pagehide',()=>{stop();observer.disconnect();cancelAnimationFrame(frame);});
  }
  return {init,reduced,setReduced,sport,enter,update,underline};
})();
