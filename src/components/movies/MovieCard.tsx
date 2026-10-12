
import { useState } from 'react'
import type { Movie } from '../../features/movies/api/movies'
import { useWatchlistStore } from '../../features/movies/store/watchlistStore'
import { usePrefetchMovieDetails } from '../../features/movies/api/movieQueries'

interface MovieCardProps {
  movie: Movie
  onSelect: (movie: Movie) => void
}

export default function MovieCard({ movie, onSelect }: MovieCardProps) {
  const addMovie = useWatchlistStore((state) => state.addMovie)
  const removeMovie = useWatchlistStore((state) => state.removeMovie)

  const isSaved = useWatchlistStore((state) =>
    state.isInWatchlist(movie.id),
  )

  // Prefetch movie details before the user opens the movie.
  const prefetchMovieDetails = usePrefetchMovieDetails()

  // Use the poster URL already provided by the movie list.
  const posterUrl = movie.image_url

  // Track broken poster images.
  const [posterFailed, setPosterFailed] = useState(false)

  function handleWatchlist() {
    if (isSaved) {
      removeMovie(movie.id)
    } else {
      addMovie(movie)
    }
  }

  return (
    <article className="movie-card">
      <button
        type="button"
        className="movie-card-details"
        onClick={() => onSelect(movie)}
        onMouseEnter={() => prefetchMovieDetails(movie.id)}
        onFocus={() => prefetchMovieDetails(movie.id)}
        aria-label={`View details for ${movie.title}`}
      >
        {posterUrl && !posterFailed ? (
          <img
            className="movie-poster"
            src={posterUrl}
            alt={`${movie.title} poster`}
            loading="lazy"
            onError={() => setPosterFailed(true)}
          />
        ) : (
          <div className="movie-poster movie-poster-placeholder">
            No poster available
          </div>
        )}

        <div className="movie-info">
          <h3>{movie.title}</h3>

          <div className="movie-meta">
            {movie.year && <span>{movie.year}</span>}

            {movie.type && (
              <span>{movie.type.replace(/_/g, ' ')}</span>
            )}
          </div>
        </div>
      </button>

      <button
        type="button"
        className={`movie-card-watchlist${isSaved ? ' is-saved' : ''}`}
        onClick={handleWatchlist}
        aria-label={
          isSaved
            ? `Remove ${movie.title} from watchlist`
            : `Add ${movie.title} to watchlist`
        }
      >
        {isSaved ? '✓ Saved' : '+ Watchlist'}
      </button>
    </article>
  )
}
