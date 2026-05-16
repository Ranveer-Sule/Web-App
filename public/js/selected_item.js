const apikey = 'd3baaac06925eabab0eb1a72d6d00742';
const posterBaseUrl = 'https://image.tmdb.org/t/p/w500';

const params = new URLSearchParams(window.location.search);
const itemId = params.get('id');
const itemType = params.get('type') || 'movie';

let selectedRating = null;

async function loadItem() {
  if (!itemId) return;

  try {
    const res = await fetch(`https://api.themoviedb.org/3/${itemType}/${itemId}?api_key=${apikey}&language=en-US`);
    const item = await res.json();

    const title = item.title || item.name;
    const year = (item.release_date || item.first_air_date || '').slice(0, 4);
    const genres = (item.genres || []).map(g => g.name).slice(0, 3).join(', ');
    const runtime = item.runtime
      ? `${item.runtime} min`
      : (item.episode_run_time?.[0] ? `${item.episode_run_time[0]} min/ep` : '');

    document.title = `${title} — CineRate`;

    const posterEl = document.getElementById('item-poster');
    if (item.poster_path) {
      document.getElementById('bg-image').style.backgroundImage = `url(${posterBaseUrl + item.poster_path})`;
      posterEl.src = posterBaseUrl + item.poster_path;
    }
    posterEl.alt = title;

    document.getElementById('item-title').textContent = title;
    document.getElementById('item-meta').textContent = [year, genres, runtime].filter(Boolean).join(' · ');
    document.getElementById('item-tagline').textContent = item.tagline || '';
    document.getElementById('item-overview').textContent = item.overview || '';
    document.getElementById('imdb-rating').textContent = item.vote_average ? (item.vote_average / 2).toFixed(1) : '—';

    loadUserRatings();
  } catch (err) {
    console.error(err);
  }
}

async function loadUserRatings() {
  try {
    const res = await fetch(`/ratings/${itemId}`);
    const data = await res.json();
    if (data.count > 0) {
      document.getElementById('user-rating').textContent = data.average.toFixed(1);
      document.getElementById('user-rating-count').textContent = `${data.count} rating${data.count !== 1 ? 's' : ''}`;
    } else {
      document.getElementById('user-rating').textContent = '—';
      document.getElementById('user-rating-count').textContent = 'No ratings yet';
    }
  } catch (err) {
    console.error(err);
  }
}

function buildStarWidget() {
  const widget = document.getElementById('star-widget');

  for (let pos = 1; pos <= 5; pos++) {
    const container = document.createElement('span');
    container.className = 'star-container';
    container.innerHTML = `
      <span class="half-star left-half" data-value="${pos - 0.5}"></span>
      <span class="half-star right-half" data-value="${pos}"></span>
      <i class="fa fa-star-o star-icon"></i>
    `;
    widget.appendChild(container);
  }

  widget.addEventListener('mouseover', e => {
    const half = e.target.closest('.half-star');
    if (half) highlightStars(parseFloat(half.dataset.value));
  });
  widget.addEventListener('mouseout', () => highlightStars(selectedRating ?? 0));
  widget.addEventListener('click', e => {
    const half = e.target.closest('.half-star');
    if (half) {
      const val = parseFloat(half.dataset.value);
      selectedRating = selectedRating === val ? 0 : val;
      highlightStars(selectedRating);
    }
  });
}

function highlightStars(rating) {
  document.querySelectorAll('.star-icon').forEach((icon, i) => {
    const pos = i + 1;
    if (rating >= pos) {
      icon.className = 'fa fa-star star-icon active-star';
    } else if (rating >= pos - 0.5) {
      icon.className = 'fa fa-star-half-o star-icon active-star';
    } else {
      icon.className = 'fa fa-star-o star-icon';
    }
  });
}

document.getElementById('submit-rating').addEventListener('click', async () => {
  const username = localStorage.getItem('loggedInUser');
  const message = document.getElementById('rate-message');

  if (!username) {
    message.textContent = 'Please log in to rate.';
    return;
  }
  if (selectedRating === null) {
    message.textContent = 'Please select a rating first.';
    return;
  }

  try {
    const res = await fetch('/ratings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, movie_id: itemId, rating: selectedRating })
    });
    const data = await res.json();
    if (data.success) {
      message.textContent = 'Rating saved!';
      loadUserRatings();
    } else {
      message.textContent = data.message || 'Error saving rating.';
    }
  } catch (err) {
    console.error(err);
    message.textContent = 'Error saving rating.';
  }
});

buildStarWidget();
loadItem();
