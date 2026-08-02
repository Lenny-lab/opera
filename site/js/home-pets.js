(function () {
  'use strict';

  const pet = document.querySelector('.home-pet');
  if (!pet) return;

  function react() {
    pet.classList.remove('is-reacting');
    void pet.offsetWidth;
    pet.classList.add('is-reacting');
    window.setTimeout(() => pet.classList.remove('is-reacting'), 760);
  }
  pet.addEventListener('click', react);
})();
