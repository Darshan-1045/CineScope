
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {
  fetchMovieDetails,
  fetchMoviesByGenre,
  searchMovies,
} from './movies'

// Search movies by title or genre.
export function useMovieSearch(query: string) {
  const trimmedQuery = query.trim()

  const genreMatch = trimmedQuery.match(
    /^(.+?)\s+(?:movies?|films?)$/i,
  )

  const genreName = genreMatch?.[1]?.trim() ?? ''

  return useQuery({
    queryKey: ['movies', 'search', trimmedQuery],
    queryFn: async () => {
      if (genreName) {
        const result = await fetchMoviesByGenre(genreName, 1)

        if (result.movies.length > 0) {
          return result.movies
        }
      }

      return searchMovies(trimmedQuery)
    },
    enabled: trimmedQuery.length > 0,
    staleTime: 60 * 1000,
    retry: 1,
  })
}

// Fetch genre movies one page at a time.
export function useInfiniteGenreMovies(genreName: string) {
  return useInfiniteQuery({
    queryKey: ['movies', 'genre', genreName.toLowerCase().trim()],
    queryFn: ({ pageParam }) =>
      fetchMoviesByGenre(genreName, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.currentPage + 1 : undefined,
    enabled: genreName.trim().length > 0,
    staleTime: 60 * 1000,
    retry: 1,
  })
}

// Fetch and cache details for an individual movie.
export function useMovieDetails(movieId: number) {
  return useQuery({
    queryKey: ['movies', 'details', movieId],
    queryFn: () => fetchMovieDetails(movieId),
    enabled: movieId > 0,
    staleTime: 24 * 60 * 60 * 1000,
    retry: 1,
  })
}

// Prefetch details before opening a movie.
export function usePrefetchMovieDetails() {
  const queryClient = useQueryClient()

  return (movieId: number) => {
    if (movieId <= 0) return

    return queryClient.prefetchQuery({
      queryKey: ['movies', 'details', movieId],
      queryFn: () => fetchMovieDetails(movieId),
      staleTime: 24 * 60 * 60 * 1000,
    })
  }
}
