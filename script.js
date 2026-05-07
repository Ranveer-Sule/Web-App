const apikey = 'd3baaac06925eabab0eb1a72d6d00742';
const posterBaseUrl = 'https://image.tmdb.org/t/p/w500';

async function loadfeaturedMovies() {
  const response = await fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${apikey}&language=en-US&page=1`);
  const data = await response.json();
  const movies = data.results;
  const browseRow = document.getElementById('browse-row');
  movies.forEach(movie => {
    const posterUrl = posterBaseUrl + movie.poster_path;
    const movieCard = document.createElement('div');
    movieCard.classList.add('movie-card');
    movieCard.innerHTML = `
    <div id='browse-movie-card'>
      <img id='poster' src="${posterUrl}" alt="${movie.title} Poster">
      <h3>${movie.title}</h3>
      <p id='rating'>Rating: ${(movie.vote_average/2).toFixed(1)} &#9733;</p>
      </div>
    `;
    browseRow.appendChild(movieCard);
  });
}

loadfeaturedMovies();
