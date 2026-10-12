import type { Movie } from '../../features/movies/api/movies'
import MovieCard from './MovieCard'

interface MovieGridProps {
  movies: Movie[]
  onSelect: (movie: Movie) => void
  isLoading?: boolean
  error?: string | null
  onRetry?: () => void
  isEmpty?: boolean
}

export default function MovieGrid({
  movies,
  onSelect,
  isLoading = false,
  error = null,
  onRetry,
  isEmpty = false,
}: MovieGridProps) {
  if (isLoading) {
    return (
      <div className="movie-grid" aria-label="Loading movies">
        {Array.from({ length: 10 }, (_, index) => (
          <div
            key={index}
            className="movie-card movie-skeleton"
            aria-hidden="true"
          >
            <div className="movie-poster" />
            <div className="movie-info">
              <div className="skeleton-line" />
              <div className="skeleton-line skeleton-line-short" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="welcome-panel" role="alert">
        <h3>Unable to load movies</h3>
        <p>{error}</p>
        {onRetry && (
          <button
            type="button"
            className="movie-modal-action"
            onClick={onRetry}
          >
            Try Again
          </button>
        )}
      </div>
    )
  }

  if (isEmpty || movies.length === 0) {
    return (
      <div className="welcome-panel">
        <h3>No movies found</h3>
        <p>Try another title or change your filters.</p>
      </div>
    )
  }

  return (
    <div className="movie-grid">
      {movies.map((movie) => (
        <MovieCard
          key={movie.id}
          movie={movie}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}