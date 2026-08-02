(function () {
  'use strict';

  const pets = Array.from(document.querySelectorAll('.home-pet'));
  if (!pets.length) return;

  const mobileQuery = window.matchMedia('(max-width: 1100px)');
  let activeIndex = 0;
  let rotationTimer = null;

  function react(pet) {
    pet.classList.remove('is-reacting');
    void pet.offsetWidth;
    pet.classList.add('is-reacting');
    window.setTimeout(() => pet.classList.remove('is-reacting'), 760);
  }

  function showMobilePet(index) {
    activeIndex = index % pets.length;
    pets.forEach((pet, petIndex) => pet.classList.toggle('is-mobile-active', petIndex === activeIndex));
  }

  function configureRotation() {
    if (rotationTimer) window.clearInterval(rotationTimer);
    rotationTimer = null;
    if (!mobileQuery.matches) {
      pets.forEach(pet => pet.classList.remove('is-mobile-active'));
      return;
    }
    showMobilePet(activeIndex);
    rotationTimer = window.setInterval(() => showMobilePet(activeIndex + 1), 60_000);
  }

  pets.forEach(pet => pet.addEventListener('click', () => react(pet)));
  if (mobileQuery.addEventListener) mobileQuery.addEventListener('change', configureRotation);
  else mobileQuery.addListener(configureRotation);
  configureRotation();
})();
