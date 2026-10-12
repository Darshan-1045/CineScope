import { watchmodeApi } from './watchmode'

export interface MovieDetailsData {
  id: number
  title: string
  year?: number
  plot_overview?: string | null
  release_date?: string | null
  genre_names?: string[] | null
  runtime_minutes?: number | null
  user_rating?: number | null
  critic_score?: number | null
  trailer?: string | null
  imdb_id?: string | null

  // Poster images from Watchmode
  poster?: string | null
  posterMedium?: string | null
  posterLarge?: string | null
}

export async function fetchMovieDetails(
  movieId: number,
): Promise<MovieDetailsData> {
  const response = await watchmodeApi.get<MovieDetailsData>(
    `/title/${movieId}/details/`,
  )

  return response.data
}