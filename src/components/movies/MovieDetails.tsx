import type { Movie } from '../../features/movies/api/movies'
import { useMovieDetails } from '../../features/movies/api/movieDetailQueries'
import { useWatchlistStore } from '../../features/movies/store/watchlistStore'

interface MovieDetailsProps {
  movie: Movie
  onClose: () => void
}

export default function MovieDetails({
  movie,
  onClose,
}: MovieDetailsProps) {
  const addMovie = useWatchlistStore((state) => state.addMovie)
  const removeMovie = useWatchlistStore((state) => state.removeMovie)
  const isSaved = useWatchlistStore((state) =>
    state.isInWatchlist(movie.id),
  )

  const {
    data: details,
    isLoading,
    isError,
  } = useMovieDetails(movie.id)

  function handleWatchlist() {
    if (isSaved) {
      removeMovie(movie.id)
    } else {
      addMovie(movie)
    }
  }

  return (
    <div className="movie-modal-overlay" onClick={onClose}>
      <section
        className="movie-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="movie-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="movie-modal-close"
          onClick={onClose}
          aria-label="Close movie details"
        >
          ×
        </button>

        {movie.image_url ? (
          <img
            className="movie-modal-poster"
            src={movie.image_url}
            alt={`${movie.title} poster`}
          />
        ) : (
          <div className="movie-modal-poster movie-poster-placeholder">
            No poster available
          </div>
        )}

        <div className="movie-modal-content">
          <p className="eyebrow">MOVIE DETAILS</p>

          <h2 id="movie-modal-title">
            {details?.title ?? movie.title}
          </h2>

          <div className="movie-meta">
            {(details?.year ?? movie.year) && (
              <span>{details?.year ?? movie.year}</span>
            )}

            {movie.type && <span>{movie.type.replace(/_/g, ' ')}</span>}

            {details?.runtime_minutes != null && (
              <span>{details.runtime_minutes} min</span>
            )}
          </div>

          {details?.release_date && (
            <p className="movie-detail-line">
              Release date: {details.release_date}
            </p>
          )}

          {details?.genre_names && details.genre_names.length > 0 && (
            <p className="movie-detail-line">
              Genres: {details.genre_names.join(', ')}
            </p>
          )}

          {details?.user_rating != null && (
            <p className="movie-detail-line">
              Rating: ⭐ {details.user_rating}/10
            </p>
          )}

          {details?.critic_score != null && (
            <p className="movie-detail-line">
              Critic score: {details.critic_score}
            </p>
          )}

          <p className="movie-modal-description">
            {isLoading
              ? 'Loading movie information...'
              : details?.plot_overview ||
                (isError
                  ? 'Movie details could not be loaded. You can still save this movie to your watchlist.'
                  : 'No overview is available for this movie.')}
          </p>

          {details?.trailer && (
            <a
              className="movie-modal-back"
              href={details.trailer}
              target="_blank"
              rel="noreferrer"
            >
              Watch Trailer
            </a>
          )}

          <button
            type="button"
            className="movie-modal-action"
            onClick={handleWatchlist}
          >
            {isSaved ? '✓ Added to Watchlist' : '+ Add to Watchlist'}
          </button>

          <button
            type="button"
            className="movie-modal-back"
            onClick={onClose}
          >
            Back to Discover
          </button>
        </div>
      </section>
    </div>
  )
}