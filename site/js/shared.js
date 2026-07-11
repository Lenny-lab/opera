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
  window.playOnGlobal = function(audioFile, title) {
    if (!gpAudio || !globalPlayer) return;
    gpAudio.src = audioFile;
    if (gpTitle) gpTitle.textContent = title || '正在播放';
    globalPlayer.hidden = false;
    gpAudio.play().catch(() => {});
  };
  if (gpToggle && gpAudio) gpToggle.addEventListener('click', () => gpAudio.paused ? gpAudio.play() : gpAudio.pause());
  if (gpAudio) {
    gpAudio.addEventListener('play', () => { if(gpPlayIcon) gpPlayIcon.hidden = true; if(gpPauseIcon) gpPauseIcon.hidden = false; });
    gpAudio.addEventListener('pause', () => { if(gpPlayIcon) gpPlayIcon.hidden = false; if(gpPauseIcon) gpPauseIcon.hidden = true; });
  }
  if (gpClose && gpAudio && globalPlayer) gpClose.addEventListener('click', () => { gpAudio.pause(); globalPlayer.hidden = true; });
  const exchangeAudioBtn = document.getElementById('exchangeAudioBtn');
  if (exchangeAudioBtn) exchangeAudioBtn.addEventListener('click', () => window.playOnGlobal('../assets/audio/intro-exchange.mp3','文明互鉴序章'));
})();
