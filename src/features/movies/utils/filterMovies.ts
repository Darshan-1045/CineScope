import type { Movie } from '../api/movies'

export type SortOption = 'default' | 'title-asc' | 'title-desc'

export interface MovieFilters {
  year: string
  type: string
  sortBy: SortOption
}

export function filterAndSortMovies(
  movies: Movie[],
  filters: MovieFilters,
): Movie[] {
  let result = [...movies]

  // Filter by release year
  if (filters.year) {
    result = result.filter(
      (movie) => String(movie.year ?? '') === filters.year,
    )
  }

  // Filter by movie type
  if (filters.type) {
    result = result.filter(
      (movie) =>
        (movie.type ?? '').toLowerCase() ===
        filters.type.toLowerCase(),
    )
  }

  // Sort by title
  if (filters.sortBy === 'title-asc') {
    result.sort((a, b) => a.title.localeCompare(b.title))
  } else if (filters.sortBy === 'title-desc') {
    result.sort((a, b) => b.title.localeCompare(a.title))
  }

  return result
}