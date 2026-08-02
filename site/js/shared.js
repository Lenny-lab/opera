(function(){
  'use strict';
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.querySelector('.nav-links');
  if (navToggle && navLinks) {
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.addEventListener('click', () => {
      const open = navLinks.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(open));
    });
    navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      navLinks.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    }));
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        navLinks.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.focus();
      }
    });
  }
  const globalPlayer = document.getElementById('globalPlayer');
  const gpTitle = document.getElementById('gpTitle');
  const gpAudio = document.getElementById('gpAudio');
  const gpToggle = document.getElementById('gpToggle');
  const gpPlayIcon = document.getElementById('gpPlayIcon');
  const gpPauseIcon = document.getElementById('gpPauseIcon');
  const gpClose = document.getElementById('gpClose');
  let currentTitle = '';
  function markActiveTrack(audioFile) {
    document.querySelectorAll('.is-playing').forEach(item => item.classList.remove('is-playing'));
    const fileName = String(audioFile || '').split('/').pop();
    document.querySelectorAll('[data-audio], [data-global-audio]').forEach(trigger => {
      const source = trigger.dataset.globalAudio || trigger.dataset.audio || '';
      if (source.split('/').pop() === fileName) {
        const card = trigger.closest('.audio-track-card, .red-card, .sample-card');
        (card || trigger).classList.add('is-playing');
      }
    });
  }
  window.playOnGlobal = function(audioFile, title) {
    if (!gpAudio || !globalPlayer) return;
    currentTitle = title || '正在播放';
    globalPlayer.classList.remove('is-error');
    gpAudio.src = audioFile;
    if (gpTitle) {
      gpTitle.textContent = currentTitle;
      gpTitle.setAttribute('aria-live', 'polite');
    }
    globalPlayer.hidden = false;
    markActiveTrack(audioFile);
    gpAudio.play().catch(() => {
      globalPlayer.classList.add('is-error');
      if (gpTitle) gpTitle.textContent = '暂时无法播放：' + currentTitle;
    });
  };
  if (gpToggle && gpAudio) gpToggle.addEventListener('click', () => gpAudio.paused ? gpAudio.play() : gpAudio.pause());
  if (gpAudio) {
    gpAudio.addEventListener('play', () => {
      globalPlayer?.classList.remove('is-error');
      if (gpTitle) gpTitle.textContent = '正在播放：' + currentTitle;
      if(gpPlayIcon) gpPlayIcon.hidden = true;
      if(gpPauseIcon) gpPauseIcon.hidden = false;
    });
    gpAudio.addEventListener('pause', () => { if(gpPlayIcon) gpPlayIcon.hidden = false; if(gpPauseIcon) gpPauseIcon.hidden = true; });
    gpAudio.addEventListener('error', () => {
      globalPlayer?.classList.add('is-error');
      if (gpTitle) gpTitle.textContent = '音频加载失败：' + currentTitle;
    });
    gpAudio.addEventListener('ended', () => document.querySelectorAll('.is-playing').forEach(item => item.classList.remove('is-playing')));
  }
  if (gpClose && gpAudio && globalPlayer) gpClose.addEventListener('click', () => {
    gpAudio.pause();
    globalPlayer.hidden = true;
    document.querySelectorAll('.is-playing').forEach(item => item.classList.remove('is-playing'));
  });
  document.querySelectorAll('[data-global-audio]').forEach(trigger => trigger.addEventListener('click', () => {
    window.playOnGlobal(trigger.dataset.globalAudio, trigger.dataset.label || '戏曲选段');
  }));
  const exchangeAudioBtn = document.getElementById('exchangeAudioBtn');
  if (exchangeAudioBtn) exchangeAudioBtn.addEventListener('click', () => window.playOnGlobal('../assets/audio/intro-exchange.mp3','文明互鉴序章'));
})();
