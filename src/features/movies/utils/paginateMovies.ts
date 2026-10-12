// Import the Movie type to ensure type-safe movie data.
import type { Movie } from '../api/movies'

// TASK 1: Return only the movies needed for the selected page.
export function paginateMovies(
  movies: Movie[],
  page: number,
  pageSize: number,
): Movie[] {
  // TASK 2: Calculate the starting index.
  // Page 1 starts at index 0; page 2 starts at index 6 if pageSize is 6.
  const startIndex = (page - 1) * pageSize

  // TASK 3: Calculate the ending index (exclusive).
  const endIndex = startIndex + pageSize

  // TASK 4: Extract the current page without modifying the original array.
  return movies.slice(startIndex, endIndex)
}