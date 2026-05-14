const apikey = 'd3baaac06925eabab0eb1a72d6d00742';
const posterBaseUrl = 'https://image.tmdb.org/t/p/w500';
const search = document.getElementById('search');
const genreMap = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
  99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
  27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi',
  10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western'
};

function getGenreText(genreIds = []) {
  const names = genreIds.map((id) => genreMap[id]).filter(Boolean).slice(0, 2);
  return names.length ? names.join(', ') : 'Unknown Genre';
}

async function loadfeaturedMovies() {
  const featuredCard = document.getElementById('featured-card');
  const browseRow = document.getElementById('browse-row');
  if (!featuredCard || !browseRow) {
    return;
  }

  try {
    const movieRes = await fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${apikey}&language=en-US&page=1`);
    const tvRes = await fetch(`https://api.themoviedb.org/3/tv/popular?api_key=${apikey}&language=en-US&page=1`);
    const movieData = await movieRes.json();
    const tvData = await tvRes.json();
    const combined = [...(movieData.results || []), ...(tvData.results || [])];
    const movies = combined.filter((item) => item.poster_path);
  if (!movies.length) {
    return;
  }

    const featured = movies[0];
    const featuredTitle = featured.title || featured.name;
    const featuredYear = (featured.release_date || featured.first_air_date || '').slice(0, 4);
    featuredCard.innerHTML = `
      <div class="featured-movie-card">
        <img class="featured-bg-img" src="${posterBaseUrl + featured.poster_path}" alt="${featuredTitle} Poster">
        <div class="featured-overlay"></div>
        <div id="featured-info">
          <h3>${featuredTitle}</h3>
          <p id='featured-meta'>${featuredYear} &bull; ${getGenreText(featured.genre_ids)}</p>
          <p id='stars'>&#9733;&#9733;&#9733;&#9733;&#9734; <span>${(featured.vote_average / 2).toFixed(1)}</span></p>
          <button id="btn">Rate This</button>
        </div>
      </div>
    `;

    const browseMovies = movies.slice(1, 40);
    browseMovies.forEach((movie) => {
      const type = movie.title ? 'movie' : 'tv';
      const title = movie.title || movie.name;
      const movieCard = document.createElement('div');
      movieCard.className = 'movie-card';
      movieCard.style.cursor = 'pointer';
      movieCard.innerHTML = `
        <div id='browse-movie-card'>
          <img id='poster' src="${posterBaseUrl + movie.poster_path}" alt="${title} Poster">
          <h3>${title}</h3>
          <p id='rating'>Rating: ${(movie.vote_average / 2).toFixed(1)} &#9733;</p>
        </div>
      `;
      movieCard.addEventListener('click', () => {
        window.location.href = `/public/pages/selected_item.html?id=${movie.id}&type=${type}`;
      });
      browseRow.appendChild(movieCard);
    });
  } catch (error) {
    console.error(error);
  }
}

if (search) {
  search.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      const query = search.value.trim();
      if (query) {
        window.location.href = `/public/pages/search.html?q=${encodeURIComponent(query)}`;
      }
    }
  });
}

loadfeaturedMovies();
