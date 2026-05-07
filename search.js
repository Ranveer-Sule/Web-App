const apikey = 'd3baaac06925eabab0eb1a72d6d00742';
const posterBaseUrl = 'https://image.tmdb.org/t/p/w500';

async function loadfeaturedMovies() {
  const response = await fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${apikey}&language=en-US&page=1`);
  const data = await response.json();
  const movies = data.results;
  const movieRow = document.getElementById('movie-row');
  const browseRow = document.getElementById('browse-row');
  movies.forEach(movie => {
    const posterUrl = posterBaseUrl + movie.poster_path;
    const movieCard = document.createElement('div');
    movieCard.classList.add('movie-card');
    movieCard.innerHTML = `
      <img id='poster' src="${posterUrl}" alt="${movie.title} Poster">
      <h3>${movie.title}</h3>
      <p id='rating'>Rating: ${(movie.vote_average/2).toFixed(1)} &#9733;</p>
    `;
    movieRow.appendChild(movieCard);
  });
}

loadfeaturedMovies();

async function searchMovies(query) {
  const response = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${apikey}&language=en-US&query=${encodeURIComponent(query)}&page=1&include_adult=false`);
  const data = await response.json();
  return data.results;
}

document.getElementById('search').addEventListener('submit', async (e) => {
  e.preventDefault();
  const query = document.getElementById('search-input').value;
  const results = await searchMovies(query);
  const searchResultsDiv = document.getElementById('search-results');
  searchResultsDiv.innerHTML = '';
  results.forEach(movie => {
    const posterUrl = posterBaseUrl + movie.poster_path;
    const resultCard = document.createElement('div');
    resultCard.classList.add('result-card');
    resultCard.innerHTML = `
      <img id='poster' src="${posterUrl}" alt="${movie.title} Poster">
      <h3>${movie.title}</h3>
      <p>Rating: ${(movie.vote_average/2).toFixed(1)} &#9733;</p>
    `;
    searchResultsDiv.appendChild(resultCard);
  });
});

