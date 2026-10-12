import { useQuery } from '@tanstack/react-query'
import { fetchMovieDetails } from './movieDetails'

export function useMovieDetails(movieId: number) {
  return useQuery({
    queryKey: ['movies', 'details', movieId],
    queryFn: () => fetchMovieDetails(movieId),
    enabled: movieId > 0,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })
}