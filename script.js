const buttons = [...document.querySelectorAll('[data-filter]')];
const posts = [...document.querySelectorAll('[data-category]')];

for (const button of buttons) {
  button.addEventListener('click', () => {
    const selected = button.dataset.filter;

    for (const item of buttons) {
      const active = item === button;
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-pressed', String(active));
    }

    for (const post of posts) {
      post.hidden = selected !== 'all' && post.dataset.category !== selected;
    }
  });
}

const year = document.querySelector('#year');
if (year) year.textContent = String(new Date().getFullYear());
