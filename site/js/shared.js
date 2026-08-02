(function () {
  'use strict';

  const navToggle = document.getElementById('navToggle');
  const navLinks = document.querySelector('.nav-links');
  if (navToggle && navLinks) {
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.addEventListener('click', () => {
      const open = navLinks.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(open));
    });
    navLinks.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    }));
    document.addEventListener('keydown', (event) => {
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
  const AUDIO_CACHE_VERSION = '20260802-3';
  let currentTitle = '';
  let wantsPlayback = false;
  let slowLoadTimer = 0;

  function getFileName(value) {
    try {
      return new URL(value, document.baseURI).pathname.split('/').pop();
    } catch (_) {
      return String(value || '').split('?')[0].split('/').pop();
    }
  }

  function getPlayableUrl(audioFile) {
    const url = new URL(audioFile, document.baseURI);
    url.searchParams.set('v', AUDIO_CACHE_VERSION);
    return url.href;
  }

  function setPlayerMessage(prefix, isError = false) {
    if (!gpTitle) return;
    gpTitle.textContent = `${prefix}${currentTitle}`;
    gpTitle.setAttribute('aria-live', 'polite');
    globalPlayer?.classList.toggle('is-error', isError);
    globalPlayer?.classList.toggle('is-loading', prefix.startsWith('正在加载'));
  }

  function setPlayerIcons(isPlaying) {
    if (gpPlayIcon) gpPlayIcon.hidden = isPlaying;
    if (gpPauseIcon) gpPauseIcon.hidden = !isPlaying;
  }

  function markActiveTrack(audioFile) {
    document.querySelectorAll('.is-playing').forEach((item) => item.classList.remove('is-playing'));
    const fileName = getFileName(audioFile);
    document.querySelectorAll('[data-audio], [data-global-audio]').forEach((trigger) => {
      const source = trigger.dataset.globalAudio || trigger.dataset.audio || '';
      if (getFileName(source) === fileName) {
        const card = trigger.closest('.audio-track-card, .red-card, .sample-card');
        (card || trigger).classList.add('is-playing');
      }
    });
  }

  function clearSlowLoadTimer() {
    window.clearTimeout(slowLoadTimer);
    slowLoadTimer = 0;
  }

  function beginSlowLoadWatch() {
    clearSlowLoadTimer();
    slowLoadTimer = window.setTimeout(() => {
      if (gpAudio && gpAudio.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        wantsPlayback = false;
        setPlayerMessage('加载较慢，请点播放重试：', true);
        setPlayerIcons(false);
      }
    }, 12000);
  }

  function requestPlayback() {
    if (!gpAudio) return;
    wantsPlayback = true;
    setPlayerMessage('正在加载：');
    setPlayerIcons(false);
    beginSlowLoadWatch();
    gpAudio.play().catch((error) => {
      if (error?.name === 'AbortError') return;
      wantsPlayback = false;
      clearSlowLoadTimer();
      setPlayerMessage('暂时无法播放，请重试：', true);
      setPlayerIcons(false);
    });
  }

  window.playOnGlobal = function (audioFile, title) {
    if (!gpAudio || !globalPlayer || !audioFile) return;
    currentTitle = title || '戏曲选段';
    wantsPlayback = true;
    globalPlayer.hidden = false;
    globalPlayer.classList.remove('is-error');
    markActiveTrack(audioFile);
    gpAudio.pause();
    gpAudio.preload = 'auto';
    gpAudio.playsInline = true;
    gpAudio.src = getPlayableUrl(audioFile);
    gpAudio.load();
    requestPlayback();
  };

  if (gpToggle && gpAudio) {
    gpToggle.addEventListener('click', () => {
      if (gpAudio.paused) requestPlayback();
      else {
        wantsPlayback = false;
        gpAudio.pause();
      }
    });
  }

  if (gpAudio) {
    gpAudio.addEventListener('loadstart', () => {
      if (wantsPlayback) setPlayerMessage('正在加载：');
    });
    gpAudio.addEventListener('waiting', () => {
      if (wantsPlayback) setPlayerMessage('正在缓冲：');
    });
    gpAudio.addEventListener('playing', () => {
      clearSlowLoadTimer();
      globalPlayer?.classList.remove('is-error', 'is-loading');
      setPlayerMessage('正在播放：');
      setPlayerIcons(true);
    });
    gpAudio.addEventListener('pause', () => setPlayerIcons(false));
    gpAudio.addEventListener('error', () => {
      wantsPlayback = false;
      clearSlowLoadTimer();
      setPlayerMessage('音频加载失败，请点播放重试：', true);
      setPlayerIcons(false);
    });
    gpAudio.addEventListener('ended', () => {
      wantsPlayback = false;
      clearSlowLoadTimer();
      setPlayerMessage('播放完毕：');
      setPlayerIcons(false);
      document.querySelectorAll('.is-playing').forEach((item) => item.classList.remove('is-playing'));
    });
  }

  if (gpClose && gpAudio && globalPlayer) {
    gpClose.addEventListener('click', () => {
      wantsPlayback = false;
      clearSlowLoadTimer();
      gpAudio.pause();
      gpAudio.removeAttribute('src');
      gpAudio.load();
      globalPlayer.hidden = true;
      document.querySelectorAll('.is-playing').forEach((item) => item.classList.remove('is-playing'));
    });
  }

  document.querySelectorAll('[data-global-audio]').forEach((trigger) => trigger.addEventListener('click', () => {
    window.playOnGlobal(trigger.dataset.globalAudio, trigger.dataset.label || '戏曲选段');
  }));

  const exchangeAudioBtn = document.getElementById('exchangeAudioBtn');
  if (exchangeAudioBtn) {
    exchangeAudioBtn.addEventListener('click', () => window.playOnGlobal('../assets/audio/intro-exchange.mp3', '文明互鉴序章'));
  }
})();
