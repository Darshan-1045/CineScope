
import { watchmodeApi } from './watchmode'

// Represents a movie used by the CineScope UI.
export interface Movie {
  id: number
  title: string
  year?: number
  type?: string
  image_url?: string | null
}

// Complete movie details used by the details modal.
export interface MovieDetailsData extends Movie {
  plot_overview?: string | null
  runtime_minutes?: number | null
  release_date?: string | null
  genre_names?: string[]
  user_rating?: number | null
  critic_score?: number | null
  trailer?: string | null
}

interface WatchmodeResult {
  id: number
  name?: string
  title?: string
  year?: number
  type?: string
  image_url?: string | null
  poster?: string | null
  poster_url?: string | null
}

interface SearchResponse {
  results?: WatchmodeResult[]
}

interface WatchmodeGenre {
  id: number
  name: string
}

interface GenreTitle {
  id: number
  title?: string
  name?: string
  year?: number
  type?: string
  image_url?: string | null
  poster?: string | null
  poster_url?: string | null
}

interface GenreTitlesResponse {
  titles?: GenreTitle[]
  total_results?: number
  total_pages?: number
  page?: number
}

interface WatchmodeTitleDetails {
  id: number
  title?: string
  name?: string
  year?: number
  type?: string
  poster?: string | null
  posterMedium?: string | null
  posterLarge?: string | null
  poster_url?: string | null
  image_url?: string | null
  plot_overview?: string | null
  runtime_minutes?: number | null
  release_date?: string | null
  genre_names?: string[]
  user_rating?: number | null
  critic_score?: number | null
  trailer?: string | null
}

export interface GenreMoviesPage {
  movies: Movie[]
  currentPage: number
  totalPages: number
  hasMore: boolean
}

// Cache poster requests, including requests in progress.
const posterCache = new Map<number, Promise<string | null>>()

function getPosterUrl(
  ...values: (string | null | undefined)[]
): string | null {
  return (
    values.find(
      (value) =>
        typeof value === 'string' &&
        value.trim().length > 0 &&
        /^https?:\/\//i.test(value.trim()),
    )?.trim() ?? null
  )
}

// Normalize different Watchmode responses into one Movie shape.
function normalizeMovie(
  result: WatchmodeResult | GenreTitle | WatchmodeTitleDetails,
): Movie {
  const title =
    ('title' in result ? result.title : undefined) ??
    ('name' in result ? result.name : undefined) ??
    'Untitled movie'

  const imageUrl = getPosterUrl(
    'image_url' in result ? result.image_url : undefined,
    'posterLarge' in result ? result.posterLarge : undefined,
    'posterMedium' in result ? result.posterMedium : undefined,
    'poster' in result ? result.poster : undefined,
    'poster_url' in result ? result.poster_url : undefined,
  )

  return {
    id: result.id,
    title,
    year: result.year,
    type: result.type,
    image_url: imageUrl,
  }
}

// Get a poster from the Watchmode title-details endpoint.
async function fetchPosterUrl(movieId: number): Promise<string | null> {
  const cached = posterCache.get(movieId)

  if (cached) {
    return cached
  }

  const request = watchmodeApi
    .get<WatchmodeTitleDetails>(`/title/${movieId}/details/`)
    .then(({ data }) =>
      getPosterUrl(
        data.posterLarge,
        data.posterMedium,
        data.poster,
        data.poster_url,
        data.image_url,
      ),
    )
    .catch((error: unknown) => {
      posterCache.delete(movieId)
      console.warn(`Could not load poster for movie ${movieId}:`, error)
      return null
    })

  posterCache.set(movieId, request)
  return request
}

// Add missing posters with limited concurrency.
async function enrichMoviesWithPosters(
  movies: Movie[],
  concurrency = 2,
): Promise<Movie[]> {
  const enrichedMovies = movies.map((movie) => ({ ...movie }))
  let nextIndex = 0

  async function worker(): Promise<void> {
    while (nextIndex < enrichedMovies.length) {
      const index = nextIndex++
      const movie = enrichedMovies[index]

      if (!movie || movie.image_url) continue

      const posterUrl = await fetchPosterUrl(movie.id)

      if (posterUrl) {
        movie.image_url = posterUrl
      }
    }
  }

  const workerCount = Math.min(concurrency, enrichedMovies.length)

  await Promise.all(
    Array.from({ length: workerCount }, () => worker()),
  )

  return enrichedMovies
}

// Search movies by title.
export async function searchMovies(query: string): Promise<Movie[]> {
  const trimmedQuery = query.trim()

  if (!trimmedQuery) return []

  const response = await watchmodeApi.get<SearchResponse>(
    '/autocomplete-search/',
    {
      params: {
        search_value: trimmedQuery,
        search_type: 3,
      },
    },
  )

  const movies = (response.data.results ?? []).map(normalizeMovie)
  return enrichMoviesWithPosters(movies)
}

// Cache the available genres.
let cachedGenres: WatchmodeGenre[] | null = null

async function fetchGenres(): Promise<WatchmodeGenre[]> {
  if (cachedGenres !== null) return cachedGenres

  const response = await watchmodeApi.get<WatchmodeGenre[]>('/genres/')

  cachedGenres = Array.isArray(response.data) ? response.data : []
  return cachedGenres
}

// Fetch a genre page and fill in missing poster URLs.
export async function fetchMoviesByGenre(
  genreName: string,
  page = 1,
): Promise<GenreMoviesPage> {
  const genres = await fetchGenres()
  const normalizedName = genreName.toLowerCase().trim()

  const genre = genres.find(
    (item) => item.name.toLowerCase().trim() === normalizedName,
  )

  if (!genre) {
    return {
      movies: [],
      currentPage: page,
      totalPages: 0,
      hasMore: false,
    }
  }

  const response = await watchmodeApi.get<GenreTitlesResponse>(
    '/list-titles/',
    {
      params: {
        types: 'movie',
        genres: String(genre.id),
        sort_by: 'popularity_desc',
        page,
        limit: 20,
      },
    },
  )

  const data = response.data
  const movies = (data.titles ?? []).map(normalizeMovie)
  const moviesWithPosters = await enrichMoviesWithPosters(movies, 2)

  const currentPage = data.page ?? page
  const totalPages = data.total_pages ?? currentPage

  return {
    movies: moviesWithPosters,
    currentPage,
    totalPages,
    hasMore: currentPage < totalPages,
  }
}

// Support searches such as "Action Movies" and normal movie titles.
export async function searchMoviesOrGenre(
  query: string,
): Promise<Movie[]> {
  const trimmedQuery = query.trim()

  if (!trimmedQuery) return []

  const genreMatch = trimmedQuery.match(
    /^(.+?)\s+(?:movies?|films?)$/i,
  )

  if (genreMatch) {
    const genreName = genreMatch[1].trim()
    const result = await fetchMoviesByGenre(genreName, 1)

    if (result.movies.length > 0) {
      return result.movies
    }
  }

  return searchMovies(trimmedQuery)
}

// Fetch complete details for one movie.
export async function fetchMovieDetails(
  movieId: number,
): Promise<MovieDetailsData> {
  const { data } = await watchmodeApi.get<WatchmodeTitleDetails>(
    `/title/${movieId}/details/`,
  )

  const movie = normalizeMovie(data)

  // Reuse the poster cache if the details response has no image.
  if (!movie.image_url) {
    movie.image_url = await fetchPosterUrl(movieId)
  }

  return {
    ...movie,
    plot_overview: data.plot_overview ?? null,
    runtime_minutes: data.runtime_minutes ?? null,
    release_date: data.release_date ?? null,
    genre_names: data.genre_names ?? [],
    user_rating: data.user_rating ?? null,
    critic_score: data.critic_score ?? null,
    trailer: data.trailer ?? null,
  }
}
