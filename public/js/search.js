const apikey = 'd3baaac06925eabab0eb1a72d6d00742';
const posterBaseUrl = 'https://image.tmdb.org/t/p/w500';

const movieRow = document.getElementById('movie-row');
const searchInput = document.getElementById('search');
const searchResults = document.getElementById('search-results');

let page = 1;
let totalPages = Infinity;
let loading = false;
let activeSearchController = null;
const searchCache = new Map();

function addCard(parent, item, className) {
  if (!item.poster_path) {
    return;
  }

  const title = item.title || item.name;
  const type = item.media_type || (item.title ? 'movie' : 'tv');
  const card = document.createElement('div');
  card.className = `${className} clickable-card`;
  card.innerHTML = `
    <img id='poster' src="${posterBaseUrl + item.poster_path}" alt="${title} Poster">
    <h3>${title}</h3>
    <p>Rating: ${(item.vote_average / 2).toFixed(1)} &#9733;</p>
  `;
  card.addEventListener('click', () => {
    window.location.href = `/pages/selected_item.html?id=${item.id}&type=${type}`;
  });
  parent.appendChild(card);
}

function renderSearchResults(items) {
  if (!searchResults) {
    return;
  }

  searchResults.innerHTML = '<h2>Search Results</h2>';
  items.forEach((item) => addCard(searchResults, item, 'result-card'));
}

function clearSearchResults() {
  if (searchResults) {
    searchResults.innerHTML = '';
  }
}

async function loadFeaturedPage() {
  if (!movieRow || loading || page > totalPages) {
    return;
  }

  loading = true;
  try {
    const [movieRes, tvRes] = await Promise.all([
      fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${apikey}&language=en-US&page=${page}`),
      fetch(`https://api.themoviedb.org/3/tv/popular?api_key=${apikey}&language=en-US&page=${page}`)
    ]);
    const [movieData, tvData] = await Promise.all([movieRes.json(), tvRes.json()]);

    totalPages = Math.max(movieData.total_pages || 1, tvData.total_pages || 1);
    const combined = [...(movieData.results || []), ...(tvData.results || [])];
    combined.forEach((item) => addCard(movieRow, item, 'movie-search-card'));
    page += 1;
  } catch (error) {
    console.error(error);
  } finally {
    loading = false;
  }
}

async function searchNow(query = searchInput ? searchInput.value.trim() : '') {
  if (!searchResults) {
    return;
  }

  if (!query) {
    clearSearchResults();
    return;
  }

  if (searchCache.has(query)) {
    renderSearchResults(searchCache.get(query));
    return;
  }

  if (activeSearchController) {
    activeSearchController.abort();
  }

  activeSearchController = new AbortController();

  try {
    const response = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${apikey}&language=en-US&query=${encodeURIComponent(query)}&page=1&include_adult=false`, {
      signal: activeSearchController.signal
    });
    const data = await response.json();
    const results = (data.results || []).filter((item) => item.media_type === 'movie' || item.media_type === 'tv');
    searchCache.set(query, results);
    renderSearchResults(results);
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error(error);
    }
  } finally {
    if (activeSearchController && !activeSearchController.signal.aborted) {
      activeSearchController = null;
    }
  }
}

window.addEventListener('scroll', () => {
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 300) {
    loadFeaturedPage();
  }
});

if (searchInput) {
  searchInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      searchNow(searchInput.value.trim());
    }
  });
}

const params = new URLSearchParams(window.location.search);
const prefilledQuery = params.get('q');
if (prefilledQuery && searchInput) {
  searchInput.value = prefilledQuery;
  searchNow();
}

loadFeaturedPage();
