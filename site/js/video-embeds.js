(function () {
  'use strict';

  document.querySelectorAll('.video-load').forEach(button => {
    button.addEventListener('click', () => {
      const card = button.closest('.video-card');
      const frame = card?.querySelector('.video-frame');
      if (!card || !frame) return;

      if (card.classList.contains('is-open')) {
        card.classList.remove('is-open');
        frame.replaceChildren();
        button.textContent = '在本页播放';
        button.setAttribute('aria-expanded', 'false');
        return;
      }

      document.querySelectorAll('.video-card.is-open').forEach(openCard => {
        openCard.classList.remove('is-open');
        openCard.querySelector('.video-frame')?.replaceChildren();
        const openButton = openCard.querySelector('.video-load');
        if (openButton) {
          openButton.textContent = '在本页播放';
          openButton.setAttribute('aria-expanded', 'false');
        }
      });

      const iframe = document.createElement('iframe');
      iframe.src = button.dataset.embed;
      iframe.title = card.querySelector('h3')?.textContent + '外部视频播放器';
      iframe.loading = 'lazy';
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      iframe.allow = 'autoplay; fullscreen; picture-in-picture; encrypted-media';
      iframe.allowFullscreen = true;
      frame.appendChild(iframe);
      card.classList.add('is-open');
      button.textContent = '收起播放器';
      button.setAttribute('aria-expanded', 'true');
    });
    button.setAttribute('aria-expanded', 'false');
  });
})();
