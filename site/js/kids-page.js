(function(){
  'use strict';
  document.querySelectorAll('.kids-tab').forEach(tab => tab.addEventListener('click', () => {
    document.querySelectorAll('.kids-tab').forEach(t => t.classList.toggle('active', t === tab));
    document.querySelectorAll('.kids-panel').forEach(p => p.classList.toggle('active', p.dataset.panel === tab.dataset.tab));
  }));
  document.querySelectorAll('.color-btn').forEach(btn => btn.addEventListener('click', () => {
    const target = document.getElementById(btn.dataset.target); if (target) target.setAttribute('fill', btn.dataset.color);
  }));
  const reset = document.getElementById('faceReset'); if (reset) reset.addEventListener('click', () => document.getElementById('faceShape').setAttribute('fill','#f5e6c8'));
  const audioBtn = document.getElementById('kidsAudioBtn'); if(audioBtn) audioBtn.addEventListener('click', () => window.playOnGlobal('../assets/audio/intro-kids.mp3','戏曲小知识'));
  document.querySelectorAll('.quiz-answer').forEach(btn => btn.addEventListener('click', () => { document.getElementById('quizResult').textContent = btn.dataset.answer === '京剧' ? '答对啦：这一关示例讲的是京剧国粹。' : '再想想：听“唱念做打”和“国粹”两个关键词。'; }));
})();
