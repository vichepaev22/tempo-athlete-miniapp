/* 15-second welcome. Native SVG rendering on one finite clock; no external calls. */
(function () {
  'use strict';
  const DURATION = 15000;
  const PHASES = [
    [0, 'Анализ тренировок'], [2200, 'Бег: от тренировки к прогрессу'],
    [4000, 'Бег: источник, анализ, рекомендации'], [6500, 'Одна история тренировок'],
    [8200, 'Плавание: движение и дистанция'], [10000, 'Плавание: динамика и общая история'],
    [12700, 'Ваш темп. Ваш прогресс.']
  ];
  let active = null;
  let sequence = 0;
  const clamp = (n, a = 0, b = 1) => Math.max(a, Math.min(b, n));
  const ease = n => { const p = clamp(n); return p * p * (3 - 2 * p); };
  const mix = (a, b, n) => a + (b - a) * n;
  const between = (time, from, to) => ease((time - from) / (to - from));
  const round = n => Math.round(n * 100) / 100;
  const point = (x, y) => `${round(x)},${round(y)}`;
  function open(options = {}) {
    const container = options.container || document.body;
    if (!(container instanceof HTMLElement) || !container.isConnected) throw new TypeError('TempoWelcome: container must be a connected HTMLElement.');
    if (active) active.close();
    const id = `tempo-welcome-${++sequence}`;
    const reduced = typeof options.reducedMotion === 'boolean' ? options.reducedMotion : window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const root = document.createElement('section');
    root.className = 'tempo-welcome';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-labelledby', `${id}-title`);
    root.setAttribute('aria-describedby', `${id}-description`);
    root.innerHTML = `
      <div class="tempo-welcome__pattern" aria-hidden="true"></div>
      <header class="tempo-welcome__header">
        <div class="tempo-welcome__brand" aria-hidden="true">ТЕМП<b>·</b><span class="tempo-welcome__edition">Бег / Плавание / Прогресс</span></div>
        <button class="tempo-welcome__skip" type="button">Пропустить</button>
      </header>
      <h1 class="tempo-welcome__sr" id="${id}-title">Добро пожаловать в ТЕМП</h1>
      <p class="tempo-welcome__sr" id="${id}-description">Приветствие длится 15 секунд. Его можно поставить на паузу или пропустить и сразу открыть кабинет.</p>
      <div class="tempo-welcome__stage">
        <svg class="tempo-welcome__art" viewBox="0 0 720 700" role="img" aria-labelledby="${id}-art-title">
          <title id="${id}-art-title">Бег и плавание соединяются в единую историю тренировок</title>
          <defs><clipPath id="${id}-title-clip"><rect data-part="title-clip" x="48" y="170" width="625" height="250" /></clipPath></defs>
          <g data-part="orbits" fill="none" stroke="#ffffff" stroke-opacity=".09"><circle cx="360" cy="340" r="245"/><circle cx="360" cy="340" r="180"/><path d="M55 340H665 M360 36V648"/></g>
          <g data-part="title" clip-path="url(#${id}-title-clip)">
            <text class="tw-title" x="55" y="280">АНАЛИЗ</text><text class="tw-title tw-title-small" x="55" y="355">ТРЕНИРОВОК</text>
            <path data-part="title-rule" stroke="#ff682d" stroke-width="7" d="M60 383H658"/>
            <text class="tw-caption" x="60" y="429">Всё начинается с вашей тренировки.</text>
          </g>
          <g data-part="run-features">
            <g data-feature="run-0"><text class="tw-feature-index" x="80" y="319">01 / ИСТОЧНИК</text><text class="tw-feature" x="80" y="355">Подключить приложение</text></g>
            <g data-feature="run-1"><text class="tw-feature-index" x="80" y="399">02 / АНАЛИЗ</text><text class="tw-feature" x="80" y="435">Разобрать тренировки</text></g>
            <g data-feature="run-2"><text class="tw-feature-index" x="80" y="479">03 / ПРОГРЕСС</text><text class="tw-feature" x="80" y="515">Получить рекомендации</text></g>
          </g>
          <g data-part="swim-features">
            <g data-feature="swim-0"><text class="tw-feature-index" x="80" y="319">01 / ДИСТАНЦИЯ</text><text class="tw-feature" x="80" y="355">Разобрать дистанцию</text></g>
            <g data-feature="swim-1"><text class="tw-feature-index" x="80" y="399">02 / ДИНАМИКА</text><text class="tw-feature" x="80" y="435">Увидеть свой прогресс</text></g>
            <g data-feature="swim-2"><text class="tw-feature-index" x="80" y="479">03 / ИСТОРИЯ</text><text class="tw-feature" x="80" y="515">Всё в одном кабинете</text></g>
          </g>
          <g data-part="runner" class="tw-athlete">
            <g data-part="runner-body"><circle cx="26" cy="-82" r="15"/><path d="M17 -58L0 0"/><polyline data-part="run-arm-a"/><polyline data-part="run-arm-b"/><polyline data-part="run-leg-a"/><polyline data-part="run-leg-b"/></g>
            <path class="tw-accent" stroke-width="3" d="M-78 106H78"/>
          </g>
          <g data-part="geometry" fill="none" stroke="#f6f7f8" stroke-width="4">
            <g data-part="geometry-core"><rect x="-62" y="-62" width="124" height="124"/><path class="tw-accent" d="M0 -90L90 0L0 90L-90 0Z"/><circle r="32"/></g>
            <path data-part="fragment-0"/><path data-part="fragment-1"/><path data-part="fragment-2"/><path data-part="fragment-3"/><path data-part="fragment-4"/><path data-part="fragment-5"/>
          </g>
          <g data-part="swimmer" class="tw-athlete"><circle cx="82" cy="-15" r="14"/><path d="M60 0L-70 4"/><polyline data-part="swim-arm-a"/><polyline data-part="swim-arm-b"/><polyline data-part="swim-leg-a"/><polyline data-part="swim-leg-b"/><path data-part="water" class="tw-accent" stroke-width="3"/></g>
          <g data-part="final">
            <text class="tw-final-word" text-anchor="middle" x="360" y="330">ТЕМП</text>
            <path data-part="final-rule" stroke="#ff682d" stroke-width="6" d="M104 360H616"/>
            <text class="tw-final-caption" text-anchor="middle" x="360" y="414">Ваш темп. Ваш прогресс.</text>
            <text class="tw-final-sports" text-anchor="middle" x="360" y="467">БЕГ · ПЛАВАНИЕ</text>
          </g>
        </svg>
      </div>
      <footer class="tempo-welcome__footer">
        <div class="tempo-welcome__controls"><button class="tempo-welcome__pause" type="button">Пауза</button><button class="tempo-welcome__replay" type="button">Повторить</button><span class="tempo-welcome__clock" aria-hidden="true">00:00 / 00:15</span></div>
        <button class="tempo-welcome__start" type="button">Начать</button>
        <div class="tempo-welcome__progress" role="progressbar" aria-label="Приветствие" aria-valuemin="0" aria-valuemax="15" aria-valuenow="0"><span></span></div>
        <p class="tempo-welcome__phase" aria-live="polite" aria-atomic="true"></p>
        ${options.previewControls ? '<div class="tempo-welcome__preview"><label for="' + id + '-seek">Кадр</label><input id="' + id + '-seek" type="range" min="0" max="15000" step="100" value="0" aria-label="Кадр приветствия, миллисекунды"><span>15 сек</span></div>' : ''}
      </footer>`;
    container.append(root);
    const inertRecords = [];
    for (let branch = root; branch && branch !== document.body; branch = branch.parentElement) {
      const parent = branch.parentElement;
      if (!parent) break;
      Array.from(parent.children).forEach(element => {
        if (element === branch || !(element instanceof HTMLElement) || ['SCRIPT', 'STYLE', 'LINK'].includes(element.tagName)) return;
        inertRecords.push({ element, had: element.hasAttribute('inert'), value: element.getAttribute('inert') });
        element.setAttribute('inert', '');
      });
    }
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    const parts = Object.fromEntries(Array.from(root.querySelectorAll('[data-part]')).map(el => [el.dataset.part, el]));
    const pauseButton = root.querySelector('.tempo-welcome__pause');
    const replayButton = root.querySelector('.tempo-welcome__replay');
    const startButton = root.querySelector('.tempo-welcome__start');
    const skipButton = root.querySelector('.tempo-welcome__skip');
    const phaseStatus = root.querySelector('.tempo-welcome__phase');
    const progress = root.querySelector('.tempo-welcome__progress');
    const progressLine = progress.firstElementChild;
    const clock = root.querySelector('.tempo-welcome__clock');
    const seeker = root.querySelector('input[type="range"]');
    const features = ['run', 'swim'].map(kind => [0, 1, 2].map(i => root.querySelector(`[data-feature="${kind}-${i}"]`)));
    let elapsed = reduced ? DURATION : 0;
    let running = !reduced && !document.hidden;
    let closed = false;
    let started = false;
    let hiddenPause = !reduced && document.hidden;
    let anchor = performance.now() - elapsed;
    let frame = null;
    let lastPhase = -1;
    let lastSecond = -1;
    let driftX = 0;
    let driftY = 0;
    const setOpacity = (element, n) => element.setAttribute('opacity', String(round(clamp(n))));
    const setPosition = (element, x, y, scale = 1, rotate = 0) => element.setAttribute('transform', `translate(${round(x)} ${round(y)}) scale(${round(scale)}) rotate(${round(rotate)})`);
    const setLine = (element, points) => element.setAttribute('points', points.map(p => point(...p)).join(' '));
    function drawAthletes(time) {
      const phase = time / 130;
      const cycle = Math.sin(phase);
      parts['runner-body'].setAttribute('transform', `translate(0 ${round(-Math.abs(cycle) * 6)})`);
      [0, 1].forEach((index) => {
        const swing = Math.sin(phase + index * Math.PI);
        const knee = [swing * 40, 36 - Math.max(0, swing) * 15];
        const ankle = [knee[0] - swing * 27, knee[1] + 44 - Math.max(0, -swing) * 31];
        setLine(parts[index ? 'run-leg-b' : 'run-leg-a'], [[0, 0], knee, ankle, [ankle[0] + 15, ankle[1] + 2]]);
        const elbow = [15 - swing * 35, -29 + Math.abs(swing) * 6];
        const hand = [elbow[0] + 25, elbow[1] - 26];
        setLine(parts[index ? 'run-arm-b' : 'run-arm-a'], [[17, -55], elbow, hand]);
      });
      const swimCycle = time / 240;
      const sweep = Math.sin(swimCycle);
      const lift = Math.max(0, Math.cos(swimCycle));
      setLine(parts['swim-arm-a'], [[52, 0], [55 + sweep * 47, -lift * 70 - 4], [55 + sweep * 103, -lift * 34]]);
      setLine(parts['swim-arm-b'], [[49, 3], [45 - sweep * 54, 28], [46 - sweep * 105, 16 + lift * 17]]);
      setLine(parts['swim-leg-a'], [[-68, 4], [-113, sweep * 14 + 10], [-162, sweep * 22 + 2], [-174, sweep * 22 - 4]]);
      setLine(parts['swim-leg-b'], [[-68, 4], [-113, -sweep * 13 + 4], [-158, -sweep * 20 - 4], [-172, -sweep * 20 - 8]]);
      const wave = Math.sin(time / 450) * 5;
      parts.water.setAttribute('d', `M-185 49 Q-140 ${49 + wave} -95 49 T-5 49 T85 49 T175 49 M-126 65 Q-80 ${65 - wave} -34 65 T58 65 T150 65`);
    }
    function render(time) {
      const phaseIndex = PHASES.reduce((value, [from], index) => time >= from ? index : value, 0);
      if (phaseIndex !== lastPhase) {
        lastPhase = phaseIndex;
        phaseStatus.textContent = PHASES[phaseIndex][1];
        root.dataset.phase = String(phaseIndex);
      }
      const second = Math.floor(time / 1000);
      if (second !== lastSecond) {
        lastSecond = second;
        clock.textContent = `00:${String(second).padStart(2, '0')} / 00:15`;
        progress.setAttribute('aria-valuenow', String(second));
      }
      progressLine.style.width = `${time / DURATION * 100}%`;
      if (seeker) seeker.value = String(Math.round(time / 100) * 100);
      const titleIn = between(time, 80, 900);
      const titleOut = between(time, 2450, 3650);
      setOpacity(parts.title, titleIn * (1 - titleOut));
      parts.title.setAttribute('transform', `translate(${round((1 - titleIn) * 65 - titleOut * 40)} ${round((1 - titleIn) * 35 - titleOut * 22)})`);
      parts['title-clip'].setAttribute('height', String(round(260 * titleIn)));
      parts['title-rule'].setAttribute('stroke-dasharray', '600');
      parts['title-rule'].setAttribute('stroke-dashoffset', String(600 * (1 - between(time, 650, 1500))));
      const runIn = between(time, 2200, 3000);
      const runUp = between(time, 4000, 4650);
      const runOut = between(time, 6500, 7300);
      setOpacity(parts.runner, runIn * (1 - runOut));
      setPosition(parts.runner, mix(mix(120, 365, runIn), 535, runUp) - runOut * 175, mix(416, 175, runUp) + runOut * 125, mix(mix(1.8, 1.6, runIn), .7, runUp) * (1 - runOut * .65));
      features[0].forEach((element, index) => {
        const arrival = between(time, 4330 + index * 490, 4750 + index * 490);
        setOpacity(element, arrival * (1 - runOut));
        element.setAttribute('transform', `translate(${round((1 - arrival) * 36 + runOut * (200 - index * 60))} ${round((1 - arrival) * 18 - runOut * (80 + index * 60))})`);
      });
      const geometryIn = between(time, 6550, 7550);
      const geometryOut = between(time, 8200, 8700);
      setOpacity(parts.geometry, geometryIn * (1 - geometryOut));
      setPosition(parts.geometry, 360, 342, mix(1.5, 1, geometryIn), mix(-28, 45, geometryIn) + geometryOut * 18);
      parts['geometry-core'].setAttribute('transform', `scale(${round(mix(.35, 1, geometryIn))} ${round(mix(1.35, 1, geometryIn))})`);
      [0, 1, 2, 3, 4, 5].forEach(index => {
        const angle = index * Math.PI / 3;
        const radius = mix(255, 74, geometryIn);
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        parts[`fragment-${index}`].setAttribute('d', `M${point(x - 16, y - 16)}L${point(x + 16, y + 16)}`);
      });
      const swimIn = between(time, 8200, 8850);
      const swimUp = between(time, 10000, 10700);
      const swimOut = between(time, 12700, 13200);
      setOpacity(parts.swimmer, swimIn * (1 - swimOut));
      setPosition(parts.swimmer, mix(355, 468, swimUp), mix(365, 173, swimUp) - swimOut * 38, mix(mix(.28, 1.5, swimIn), .79, swimUp) * (1 - swimOut * .25));
      features[1].forEach((element, index) => {
        const arrival = between(time, 10400 + index * 490, 10850 + index * 490);
        setOpacity(element, arrival * (1 - swimOut));
        element.setAttribute('transform', `translate(${round((1 - arrival) * 38)} ${round((1 - arrival) * 18 - swimOut * 24)})`);
      });
      const finalIn = between(time, 12800, 14000);
      setOpacity(parts.final, finalIn);
      parts.final.setAttribute('transform', `translate(0 ${round((1 - finalIn) * 38)})`);
      parts['final-rule'].setAttribute('stroke-dasharray', '512');
      parts['final-rule'].setAttribute('stroke-dashoffset', String(512 * (1 - between(time, 13600, 14800))));
      setOpacity(parts.orbits, time < 12700 ? .35 + .3 * Math.sin(time / 5500) : .18);
      root.style.setProperty('--tw-drift-x', `${round(reduced ? 0 : Math.sin(time / 4000) * 7 + driftX)}px`);
      root.style.setProperty('--tw-drift-y', `${round(reduced ? 0 : Math.cos(time / 4600) * 5 + driftY)}px`);
      if (!reduced) drawAthletes(time);
      root.dataset.playback = time >= DURATION ? 'complete' : running ? 'playing' : 'paused';
      pauseButton.disabled = time >= DURATION;
      pauseButton.textContent = time >= DURATION ? 'Готово' : running ? 'Пауза' : 'Продолжить';
    }
    function cancelFrame() { if (frame !== null) cancelAnimationFrame(frame); frame = null; }
    function tick(now) {
      frame = null;
      if (!running || closed) return;
      elapsed = Math.min(DURATION, now - anchor);
      if (elapsed >= DURATION) running = false;
      render(elapsed);
      if (running) frame = requestAnimationFrame(tick);
    }
    function stopClock() {
      if (running) elapsed = Math.min(DURATION, performance.now() - anchor);
      running = false;
      cancelFrame();
    }
    function pause() { if (closed) return; hiddenPause = false; stopClock(); render(elapsed); }
    function resume() {
      if (closed || elapsed >= DURATION || reduced) return;
      if (document.hidden) { hiddenPause = true; return; }
      hiddenPause = false;
      running = true;
      anchor = performance.now() - elapsed;
      cancelFrame();
      render(elapsed);
      frame = requestAnimationFrame(tick);
    }
    function replay() {
      if (closed) return;
      cancelFrame();
      elapsed = reduced ? DURATION : 0;
      running = false;
      hiddenPause = false;
      lastPhase = -1;
      render(elapsed);
      if (!reduced) resume();
    }
    function seek(milliseconds) {
      if (closed || !Number.isFinite(milliseconds)) return;
      stopClock();
      hiddenPause = false;
      elapsed = reduced ? DURATION : clamp(milliseconds, 0, DURATION);
      render(elapsed);
    }
    function onVisibility() {
      if (document.hidden && running) { stopClock(); hiddenPause = true; render(elapsed); }
      else if (!document.hidden && hiddenPause) resume();
    }
    function onPointer(event) {
      if (!running || reduced || event.pointerType !== 'mouse') return;
      driftX = clamp(event.clientX / Math.max(1, window.innerWidth) - .5, -.5, .5) * 10;
      driftY = clamp(event.clientY / Math.max(1, window.innerHeight) - .5, -.5, .5) * 8;
    }
    function focusables() { return Array.from(root.querySelectorAll('button:not(:disabled), input:not(:disabled)')).filter(element => !element.hidden); }
    function onKey(event) {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); finish(); return; }
      if (event.key !== 'Tab') return;
      const items = focusables();
      const first = items[0]; const last = items[items.length - 1];
      if (event.shiftKey && (document.activeElement === first || !root.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !root.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
    }
    function close() {
      if (closed) return;
      stopClock();
      closed = true;
      document.removeEventListener('visibilitychange', onVisibility);
      root.removeEventListener('keydown', onKey);
      root.removeEventListener('pointermove', onPointer);
      root.remove();
      inertRecords.forEach(({ element, had, value }) => { if (had) element.setAttribute('inert', value || ''); else element.removeAttribute('inert'); });
      document.body.style.overflow = previousOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected && !previousFocus.closest('[inert]')) previousFocus.focus({ preventScroll: true });
      if (active === controller) active = null;
    }
    function finish() {
      if (started || closed) return;
      started = true;
      close();
      if (typeof options.onStart === 'function') options.onStart();
    }
    const controller = { close, replay, pause, resume, seek, getState: () => ({ elapsed: Math.round(running ? Math.min(DURATION, performance.now() - anchor) : elapsed), duration: DURATION, phase: lastPhase, status: closed ? 'closed' : elapsed >= DURATION ? 'complete' : running ? 'playing' : 'paused', reducedMotion: reduced }) };
    active = controller;
    root.addEventListener('keydown', onKey);
    root.addEventListener('pointermove', onPointer);
    document.addEventListener('visibilitychange', onVisibility);
    pauseButton.addEventListener('click', () => running ? pause() : resume());
    replayButton.addEventListener('click', replay);
    startButton.addEventListener('click', finish);
    skipButton.addEventListener('click', finish);
    if (seeker) seeker.addEventListener('input', event => seek(Number(event.target.value)));
    render(elapsed);
    skipButton.focus({ preventScroll: true });
    if (running) frame = requestAnimationFrame(tick);
    return controller;
  }
  window.TempoWelcome = Object.freeze({ open });
})();
