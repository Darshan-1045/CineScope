/*
============================================================
CineScope - Main Application Component
============================================================

Features:
1. Movie search
2. API loading and error handling
3. Filtering and sorting
4. Client-side pagination for title search
5. Infinite scrolling for genre browsing
6. Watchlist management
7. Movie details modal
8. URL synchronization
9. Discover and Watchlist navigation
*/

import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type { Movie } from './features/movies/api/movies'

import {
  useMovieSearch,
  useInfiniteGenreMovies,
} from './features/movies/api/movieQueries'

import MovieGrid from './components/movies/MovieGrid'
import MovieDetails from './components/movies/MovieDetails'

import { useWatchlistStore } from './features/movies/store/watchlistStore'

import {
  filterAndSortMovies,
  type SortOption,
} from './features/movies/utils/filterMovies'

import { paginateMovies } from './features/movies/utils/paginateMovies'

export default function App() {
  // ==========================================================
  // TASK 1: SEARCH STATE
  // ==========================================================

  // Read the existing search parameters from the URL.
  const initialParams = new URLSearchParams(window.location.search)
  const initialGenre = initialParams.get('genre') ?? ''

  const initialQuery =
    initialParams.get('q') ??
    (initialGenre ? `${initialGenre} Movies` : '')

  // Text currently typed into the search box.
  const [input, setInput] = useState(initialQuery)

  // Submitted search query.
  const [query, setQuery] = useState(initialQuery)

  // Selected genre. An empty string means title search.
  const [selectedGenre, setSelectedGenre] = useState(initialGenre)

  // ==========================================================
  // TASK 2: SELECTED MOVIE AND CURRENT VIEW
  // ==========================================================

  // Movie selected for the details modal.
  const [selectedMovie, setSelectedMovie] =
    useState<Movie | null>(null)

  // false = Discover, true = Watchlist.
  const [showWatchlist, setShowWatchlist] = useState(false)

  // ==========================================================
  // TASK 3: FILTER AND SORT STATE
  // ==========================================================

  const [filterYear, setFilterYear] = useState(
    initialParams.get('year') ?? '',
  )

  const [filterType, setFilterType] = useState(
    initialParams.get('type') ?? '',
  )

  const [sortBy, setSortBy] = useState<SortOption>(() => {
    const value = initialParams.get('sort')

    if (value === 'title-asc' || value === 'title-desc') {
      return value
    }

    return 'default'
  })

  // ==========================================================
  // TASK 4: PAGINATION AND INFINITE-SCROLL STATE
  // ==========================================================

  // Current client-side page for title-search results.
  const [page, setPage] = useState(1)

  // Number of title-search results displayed per page.
  const PAGE_SIZE = 10

  // The observer watches this element near the end of the list.
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  // Prevents duplicate automatic loading during one intersection.
  const isAutoLoadingRef = useRef(false)

  // ==========================================================
  // TASK 5: WATCHLIST STATE AND ACTIONS
  // ==========================================================

  const watchlist = useWatchlistStore((state) => state.watchlist)
  const removeMovie = useWatchlistStore((state) => state.removeMovie)

  // ==========================================================
  // TASK 6: URL SYNCHRONIZATION
  // ==========================================================

  // Keep the URL synchronized with the current search and filters.
  useEffect(() => {
    const params = new URLSearchParams()

    if (query) params.set('q', query)
    if (selectedGenre) params.set('genre', selectedGenre)
    if (filterYear) params.set('year', filterYear)
    if (filterType) params.set('type', filterType)

    if (sortBy !== 'default') {
      params.set('sort', sortBy)
    }

    const search = params.toString()
    const nextSearch = search ? `?${search}` : ''

    const newUrl =
      window.location.pathname +
      nextSearch +
      window.location.hash

    if (window.location.search !== nextSearch) {
      window.history.pushState(null, '', newUrl)
    }
  }, [query, selectedGenre, filterYear, filterType, sortBy])

  // Restore state when the browser Back or Forward button is pressed.
  useEffect(() => {
    function handlePopState() {
      const params = new URLSearchParams(window.location.search)
      const genre = params.get('genre') ?? ''

      const searchQuery =
        params.get('q') ??
        (genre ? `${genre} Movies` : '')

      const sort = params.get('sort')

      setInput(searchQuery)
      setQuery(searchQuery)
      setSelectedGenre(genre)
      setFilterYear(params.get('year') ?? '')
      setFilterType(params.get('type') ?? '')

      setSortBy(
        sort === 'title-asc' || sort === 'title-desc'
          ? sort
          : 'default',
      )

      // Reset pagination and the automatic-loading lock.
      setPage(1)
      isAutoLoadingRef.current = false

      setShowWatchlist(false)
      setSelectedMovie(null)
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  // ==========================================================
  // TASK 7: FETCH MOVIES
  // ==========================================================

  // Fetch title-search results only when no genre is selected.
  const titleQuery = useMovieSearch(selectedGenre ? '' : query)

  // Fetch genre movies page by page.
  const genreQuery = useInfiniteGenreMovies(selectedGenre)

  // Combine results from the currently active query.
  const movies: Movie[] = useMemo(() => {
    if (!selectedGenre) {
      return titleQuery.data ?? []
    }

    const allMovies =
      genreQuery.data?.pages.flatMap((page) => page.movies) ?? []

    // Remove duplicates in case API pages overlap.
    return Array.from(
      new Map(
        allMovies.map((movie) => [movie.id, movie]),
      ).values(),
    )
  }, [selectedGenre, genreQuery.data, titleQuery.data])

  // Loading state for the active query.
  const isLoading = selectedGenre
    ? genreQuery.isLoading
    : titleQuery.isLoading

  // Error state for the active query.
  const isError = selectedGenre
    ? genreQuery.isError
    : titleQuery.isError

  const error = selectedGenre
    ? genreQuery.error
    : titleQuery.error

  // ==========================================================
  // TASK 8: FILTER AND SORT MOVIES
  // ==========================================================

  const filteredMovies = useMemo(
    () =>
      filterAndSortMovies(movies, {
        year: filterYear,
        type: filterType,
        sortBy,
      }),
    [movies, filterYear, filterType, sortBy],
  )

  // ==========================================================
  // TASK 9: DISPLAY MOVIES WITH PAGINATION
  // ==========================================================

  // Genre browsing displays all movies fetched so far.
  // Title search displays only the current client-side page.
  const visibleMovies = useMemo(
    () =>
      selectedGenre
        ? filteredMovies
        : paginateMovies(filteredMovies, page, PAGE_SIZE),
    [filteredMovies, page, selectedGenre],
  )

  // Check whether more movies can be displayed or fetched.
  const hasMoreMovies = selectedGenre
    ? Boolean(genreQuery.hasNextPage)
    : page * PAGE_SIZE < filteredMovies.length

  // ==========================================================
  // TASK 10: GENRE SHORTCUTS
  // ==========================================================

  const genres = [
    'Action',
    'Comedy',
    'Horror',
    'Drama',
    'Romance',
    'Sci-Fi',
  ]

  function handleGenreSelect(genre: string) {
    const searchTerm = `${genre} Movies`

    setSelectedGenre(genre)
    setInput(searchTerm)
    setQuery(searchTerm)

    // Reset pagination and automatic loading.
    setPage(1)
    isAutoLoadingRef.current = false

    setShowWatchlist(false)
    setSelectedMovie(null)

    clearFilters()
  }

  // ==========================================================
  // TASK 11: HANDLE SEARCH SUBMISSION
  // ==========================================================

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const searchTerm = input.trim()

    setSelectedGenre('')
    setQuery(searchTerm)
    setShowWatchlist(false)
    setSelectedMovie(null)

    // clearFilters() also resets pagination and the loading lock.
    clearFilters()
  }

  // ==========================================================
  // TASK 12: CLEAR FILTERS
  // ==========================================================

  function clearFilters() {
    setFilterYear('')
    setFilterType('')
    setSortBy('default')

    // Start pagination from the first page again.
    setPage(1)
    isAutoLoadingRef.current = false
  }

  // ==========================================================
  // TASK 13: AUTOMATIC LOADING
  // ==========================================================

  useEffect(() => {
    // Do not load movies while the Watchlist is displayed.
    if (showWatchlist) return

    // Find the element that triggers automatic loading.
    const target = loadMoreRef.current

    // Stop if the sentinel does not exist or no results remain.
    if (!target || !hasMoreMovies) return

    // When title-search pagination advances, allow the observer
    // to reveal the next page if the sentinel is still nearby.
    if (!selectedGenre) {
      isAutoLoadingRef.current = false
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]

        if (!entry) return

        // Allow loading again when the sentinel leaves the area.
        if (!entry.isIntersecting) {
          isAutoLoadingRef.current = false
          return
        }

        // Prevent duplicate requests or repeated page increments.
        if (isAutoLoadingRef.current) return

        if (selectedGenre) {
          // GENRE BROWSING:
          // Fetch the next page from the API.
          if (
            genreQuery.hasNextPage &&
            !genreQuery.isFetchingNextPage
          ) {
            isAutoLoadingRef.current = true

            void genreQuery.fetchNextPage().finally(() => {
              isAutoLoadingRef.current = false
            })
          }
        } else {
          // TITLE SEARCH:
          // Results have already been fetched.
          // Reveal the next group of results locally.
          isAutoLoadingRef.current = true

          setPage((currentPage) => {
            const maxPage = Math.ceil(
              filteredMovies.length / PAGE_SIZE,
            )

            return Math.min(currentPage + 1, maxPage)
          })
        }
      },
      {
        // Start loading before the user reaches the bottom.
        rootMargin: '300px 0px',
        threshold: 0,
      },
    )

    observer.observe(target)

    // Clean up the observer when dependencies change.
    return () => observer.disconnect()
  }, [
    showWatchlist,
    hasMoreMovies,
    selectedGenre,
    filteredMovies.length,
    page,
    genreQuery.hasNextPage,
    genreQuery.isFetchingNextPage,
    genreQuery.fetchNextPage,
  ])

  // ==========================================================
  // TASK 14: RENDER THE APPLICATION
  // ==========================================================

  return (
    <div className="app-shell">
      {/* NAVBAR */}
      <header className="navbar">
        <a
          className="logo"
          href="#discover"
          onClick={() => setShowWatchlist(false)}
        >
          Cine<span>Scope</span>
        </a>

        <nav>
          <a
            href="#discover"
            onClick={() => setShowWatchlist(false)}
          >
            Discover
          </a>

          <a
            href="#watchlist"
            onClick={(event) => {
              event.preventDefault()
              setShowWatchlist(true)
              setSelectedMovie(null)
            }}
          >
            My Watchlist ({watchlist.length})
          </a>
        </nav>
      </header>

      <main>
        {/* HERO AND SEARCH */}
        <section className="hero" id="discover">
          <p className="eyebrow">
            YOUR NEXT FAVORITE FILM AWAITS
          </p>

          <h1>
            Discover movies
            <br />
            <span>worth watching.</span>
          </h1>

          <p className="hero-description">
            Explore stories, discover hidden gems, and find
            something amazing to watch next.
          </p>

          <form className="search-form" onSubmit={handleSearch}>
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Search for a movie..."
              aria-label="Search movies"
            />

            <button type="submit" disabled={!input.trim()}>
              Search
            </button>
          </form>

          {/* GENRE SHORTCUTS */}
          <div className="genre-quick-links">
            <span className="genre-quick-label">
              Explore by genre
            </span>

            <div className="genre-quick-buttons">
              {genres.map((genre) => (
                <button
                  key={genre}
                  type="button"
                  className="genre-quick-button"
                  aria-pressed={selectedGenre === genre}
                  onClick={() => handleGenreSelect(genre)}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* MOVIES SECTION */}
        <section className="movies-section" id="watchlist">
          <div className="section-heading">
            <div>
              <p className="eyebrow">
                {showWatchlist
                  ? 'YOUR PERSONAL COLLECTION'
                  : 'EXPLORE THE COLLECTION'}
              </p>

              <h2>
                {showWatchlist
                  ? 'My Watchlist'
                  : query
                    ? `Results for "${query}"`
                    : 'Discover Movies'}
              </h2>
            </div>

            <span className="section-badge">
              {showWatchlist
                ? `${watchlist.length} saved`
                : query
                  ? `${filteredMovies.length} loaded results`
                  : 'Your next watch'}
            </span>
          </div>

          {/* WATCHLIST VIEW */}
          {showWatchlist ? (
            watchlist.length > 0 ? (
              <div className="movie-grid">
                {watchlist.map((movie) => (
                  <div className="movie-card" key={movie.id}>
                    <button
                      type="button"
                      className="movie-card-details"
                      onClick={() => setSelectedMovie(movie)}
                      aria-label={`View details for ${movie.title}`}
                    >
                      {movie.image_url ? (
                        <img
                          className="movie-poster"
                          src={movie.image_url}
                          alt={`${movie.title} poster`}
                          loading="lazy"
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
                            <span>
                              {movie.type.replace(/_/g, ' ')}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      className="movie-modal-back"
                      onClick={() => removeMovie(movie.id)}
                    >
                      Remove from Watchlist
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="welcome-panel">
                <span className="welcome-icon">♡</span>

                <h3>Your watchlist is empty.</h3>

                <p>
                  Search for movies and save the ones you want
                  to watch later.
                </p>

                <button
                  type="button"
                  className="movie-modal-action"
                  onClick={() => setShowWatchlist(false)}
                >
                  Discover Movies
                </button>
              </div>
            )
          ) : (
            /* DISCOVER VIEW */
            <>
              {isLoading && (
                <p className="status-message">
                  {selectedGenre
                    ? `Loading ${selectedGenre} movies...`
                    : 'Searching for movies...'}
                </p>
              )}

              {isError && (
                <p className="status-message error-message">
                  Search failed:{' '}
                  {error instanceof Error
                    ? error.message
                    : 'Unknown error'}
                </p>
              )}

              {!isLoading &&
                !isError &&
                query &&
                movies.length === 0 && (
                  <p className="status-message">
                    No movies found. Try another title or genre.
                  </p>
                )}

              {!query && (
                <div className="welcome-panel">
                  <span className="welcome-icon">✦</span>

                  <h3>Your next movie night starts here.</h3>

                  <p>
                    Search for a movie above to explore the collection.
                  </p>
                </div>
              )}

              {query &&
                !isLoading &&
                !isError &&
                movies.length > 0 && (
                  <>
                    {/* FILTER AND SORT CONTROLS */}
                    <div className="movie-filters">
                      <select
                        value={filterYear}
                        onChange={(event) => {
                          setFilterYear(event.target.value)
                          setPage(1)
                          isAutoLoadingRef.current = false
                        }}
                        aria-label="Filter by release year"
                      >
                        <option value="">All years</option>

                        {[
                          ...new Set(
                            movies
                              .map((movie) => movie.year)
                              .filter(
                                (year): year is number =>
                                  year != null,
                              ),
                          ),
                        ]
                          .sort((a, b) => b - a)
                          .map((year) => (
                            <option
                              key={year}
                              value={String(year)}
                            >
                              {year}
                            </option>
                          ))}
                      </select>

                      <select
                        value={filterType}
                        onChange={(event) => {
                          setFilterType(event.target.value)
                          setPage(1)
                          isAutoLoadingRef.current = false
                        }}
                        aria-label="Filter by type"
                      >
                        <option value="">All types</option>

                        {[
                          ...new Set(
                            movies
                              .map((movie) => movie.type)
                              .filter(
                                (type): type is string =>
                                  Boolean(type),
                              ),
                          ),
                        ]
                          .sort()
                          .map((type) => (
                            <option key={type} value={type}>
                              {type.replace(/_/g, ' ')}
                            </option>
                          ))}
                      </select>

                      <select
                        value={sortBy}
                        onChange={(event) => {
                          setSortBy(
                            event.target.value as SortOption,
                          )
                          setPage(1)
                          isAutoLoadingRef.current = false
                        }}
                        aria-label="Sort movies"
                      >
                        <option value="default">Default order</option>
                        <option value="title-asc">Title: A–Z</option>
                        <option value="title-desc">Title: Z–A</option>
                      </select>

                      <button
                        type="button"
                        className="movie-filter-reset"
                        onClick={clearFilters}
                      >
                        Clear filters
                      </button>
                    </div>

                   {/* MOVIE RESULTS */}
                    {isError ? (
                      <MovieGrid
                        movies={[]}
                        onSelect={setSelectedMovie}
                        error={
                          error instanceof Error
                            ? error.message
                            : 'Something went wrong. Please try again.'
                        }
                        onRetry={() => {
                          if (selectedGenre) {
                            void genreQuery.refetch()
                          } else {
                            void titleQuery.refetch()
                          }
                        }}
                      />
                    ) : isLoading ? (
                      <MovieGrid
                        movies={[]}
                        onSelect={setSelectedMovie}
                        isLoading
                      />
                    ) : filteredMovies.length > 0 ? (
                      <>
                        <MovieGrid
                          movies={visibleMovies}
                          onSelect={setSelectedMovie}
                        />

                        {/* Keep your existing infinite-scroll sentinel,
                            Load More button, retry button, and end message here. */}

                        {/* Infinite-scroll sentinel for both search
                            pagination and genre API pagination. */}
                        {hasMoreMovies && (
                          <div
                            ref={loadMoreRef}
                            className="movie-load-more"
                            role="status"
                            aria-live="polite"
                          >
                            {selectedGenre
                              ? genreQuery.isFetchingNextPage
                                ? 'Loading more movies...'
                                : 'Scroll to load more movies'
                              : 'Scroll to discover more movies'}
                          </div>
                        )}

                        {/* Manual fallback for title-search pagination. */}
                        {!selectedGenre && hasMoreMovies && (
                          <button
                            type="button"
                            className="movie-load-more"
                            onClick={() => {
                              setPage((currentPage) =>
                                Math.min(
                                  currentPage + 1,
                                  Math.ceil(
                                    filteredMovies.length / PAGE_SIZE,
                                  ),
                                ),
                              )
                              isAutoLoadingRef.current = false
                            }}
                          >
                            Load More Movies
                          </button>
                        )}

                        {/* Retry if fetching the next genre page failed. */}
                        {selectedGenre &&
                          genreQuery.isFetchNextPageError && (
                            <button
                              type="button"
                              className="movie-load-more"
                              onClick={() => {
                                isAutoLoadingRef.current = false
                                void genreQuery.fetchNextPage()
                              }}
                            >
                              Retry loading more movies
                            </button>
                          )}

                        {/* Show the end message for genre results. */}
                        {selectedGenre &&
                          !hasMoreMovies &&
                          !genreQuery.isFetchingNextPage && (
                            <p className="status-message">
                              You have reached the end of the results.
                            </p>
                          )}
                      </>
                    ) : (
                      <p className="status-message">
                        No movies match these filters. Try changing or clearing them.
                      </p>
                    )}
                  </>
                )}
            </>
          )}
        </section>
      </main>

      {/* FOOTER */}
      <footer className="footer">
        <p>CineScope · Find your next favorite story.</p>
      </footer>

      {/* MOVIE DETAILS MODAL */}
      {selectedMovie && (
        <MovieDetails
          movie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
        />
      )}
    </div>
  )
}