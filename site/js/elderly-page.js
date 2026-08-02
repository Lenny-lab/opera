/* ============================================
   老人陪伴 - 真实 Web Speech API 接入
   浏览器内置语音识别 + 浏览器内置 TTS
   ============================================ */

(function () {
  'use strict';

  const info = document.getElementById('elderlyInfo');
  const voiceBtn = document.getElementById('elderlyVoice');
  const lyricsBtn = document.getElementById('lyricsBtn');
  const lyricsLine = document.getElementById('lyricsLine');
  const speedStatus = document.getElementById('speedStatus');

  // ==================== 剧种按钮 ====================
  const INTENT_KEYWORDS = [
    { kws: ['京剧', '霸王', '虞姬', '京'], audio: 'elderly-bawang-bieji.mp3', label: '京剧《霸王别姬》' },
    { kws: ['豫剧', '花木兰', '木兰', '豫'], audio: 'elderly-hua-mulan.mp3', label: '豫剧《花木兰》' },
    { kws: ['越剧', '孟丽君', '丽君', '越'], audio: 'elderly-meng-li-jun.mp3', label: '越剧《孟丽君》' },
    { kws: ['黄梅', '天仙配', '七仙女', '黄'], audio: 'elderly-tian-xian-pei.mp3', label: '黄梅戏《天仙配》' }
  ];

  function matchIntent(text) {
    const t = (text || '').toLowerCase();
    for (const intent of INTENT_KEYWORDS) {
      for (const kw of intent.kws) {
        if (t.includes(kw.toLowerCase())) return intent;
      }
    }
    return null;
  }

  document.querySelectorAll('.elderly-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const audio = '../assets/audio/' + btn.dataset.audio;
      if (window.playOnGlobal) window.playOnGlobal(audio, btn.dataset.label);
      if (info) {
        info.textContent = '正在为您播放：' + btn.dataset.label;
        info.style.color = '#c8161d';
        info.style.fontWeight = '700';
      }
      // 同步在老人面板用 TTS 念出"正在为您播放：XXX"
      speakFriendly('正在为您播放，' + btn.dataset.label);
    });
  });

  // ==================== 戏词接龙 ====================
  const lines = [
    '刘大哥讲话理太偏，谁说女子享清闲。',
    '树上的鸟儿成双对，绿水青山带笑颜。',
    '垒起七星灶，铜壶煮三江。摆开八仙桌，招待十六方。',
    '海岛冰轮初转腾，见玉兔，玉兔又早东升。',
    '天上掉下个林妹妹，似一朵轻云刚出岫。'
  ];
  let lineIdx = 0;
  if (lyricsBtn) {
    lyricsBtn.addEventListener('click', () => {
      lineIdx = (lineIdx + 1) % lines.length;
      const next = lines[lineIdx];
      if (lyricsLine) lyricsLine.textContent = next;
      speakFriendly(next);
    });
  }

  document.querySelectorAll('.speed-btn').forEach(button => {
    button.addEventListener('click', () => {
      const speed = Number(button.dataset.speed || 1);
      const audio = document.getElementById('gpAudio');
      if (audio) audio.playbackRate = speed;
      document.querySelectorAll('.speed-btn').forEach(item => {
        item.classList.toggle('btn-primary', item === button);
        item.classList.toggle('btn-ghost', item !== button);
      });
      if (speedStatus) speedStatus.textContent = '当前：' + (speed < 1 ? '慢速' : '原速');
      speakFriendly(speed < 1 ? '已切换到慢速。' : '已恢复原速。');
    });
  });

  // ==================== 真实 Web Speech API ====================
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition = null;
  let isListening = false;

  if (SR) {
    recognition = new SR();
    recognition.lang = 'zh-CN';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      isListening = true;
      if (voiceBtn) {
        voiceBtn.classList.add('voice-listening');
        voiceBtn.innerHTML = '<div class="mic-icon">🎙</div><div>正在听…请说</div>';
      }
      if (info) {
        info.textContent = '正在听，请说您想听的剧种或唱段。';
        info.style.color = '#c8161d';
      }
    };
    recognition.onresult = (event) => {
      const transcript = (event.results[0][0].transcript || '').trim();
      if (info) {
        info.textContent = '我听到您说：' + transcript;
        info.style.color = '#1a1a1a';
        info.style.fontWeight = '500';
      }
      const intent = matchIntent(transcript);
      if (intent) {
        if (window.playOnGlobal) window.playOnGlobal('../assets/audio/' + intent.audio, intent.label);
        if (info) {
          info.textContent = '为您找到：' + intent.label + '，正在播放。';
          info.style.color = '#c8161d';
        }
        speakFriendly('为您找到' + intent.label + '，正在播放。');
      } else if (/停止|暂停|停/.test(transcript)) {
        const audio = document.getElementById('gpAudio');
        if (audio) audio.pause();
        speakFriendly('好的，已暂停。');
      } else if (/再|慢一点|放慢/.test(transcript)) {
        const audio = document.getElementById('gpAudio');
        if (audio) audio.playbackRate = Math.max(0.5, audio.playbackRate - 0.1);
        speakFriendly('好的，放慢一些。');
      } else {
        speakFriendly('抱歉，没有听清您说的剧种，请直接点击剧种按钮，或再说一次。');
        if (info) info.textContent = '没有匹配到剧种。请点击上方"京剧 / 豫剧 / 越剧 / 黄梅戏"按钮。';
      }
    };
    recognition.onerror = (event) => {
      const err = event.error;
      let msg = '语音识别出错：' + err;
      if (err === 'not-allowed' || err === 'service-not-allowed') {
        msg = '请允许浏览器使用麦克风（地址栏左侧小锁 → 允许麦克风）。';
      } else if (err === 'no-speech') {
        msg = '没有听到您说话，请重试。';
      } else if (err === 'network') {
        msg = '需要联网才能语音识别。请检查网络或直接点剧种按钮。';
      }
      if (info) {
        info.textContent = msg;
        info.style.color = '#8a0000';
      }
    };
    recognition.onend = () => {
      isListening = false;
      if (voiceBtn) {
        voiceBtn.classList.remove('voice-listening');
        voiceBtn.innerHTML = '<div class="mic-icon">🎙</div><div>点击后说“我想听京剧”</div>';
      }
    };
  } else {
    if (voiceBtn) {
      voiceBtn.addEventListener('click', () => {
        if (info) info.textContent = '当前浏览器不支持 Web Speech API，请直接点击剧种按钮。';
      });
    }
  }

  if (voiceBtn && recognition) {
    voiceBtn.addEventListener('click', () => {
      if (isListening) {
        try { recognition.stop(); } catch (e) {}
        return;
      }
      try {
        recognition.start();
      } catch (e) {
        if (info) info.textContent = '请再次点击麦克风。';
      }
    });
  }

  // ==================== 友好 TTS ====================
  function speakFriendly(text) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'zh-CN';
    u.rate = 0.95;
    u.pitch = 1;
    window.speechSynthesis.speak(u);
  }
})();
