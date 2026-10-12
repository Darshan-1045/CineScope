import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Movie } from '../api/movies'

interface WatchlistState {
  watchlist: Movie[]
  addMovie: (movie: Movie) => void
  removeMovie: (movieId: number) => void
  isInWatchlist: (movieId: number) => boolean
}

export const useWatchlistStore = create<WatchlistState>()(
  persist(
    (set, get) => ({
      watchlist: [],

      addMovie: (movie) =>
        set((state) => {
          const alreadyAdded = state.watchlist.some(
            (item) => item.id === movie.id,
          )

          if (alreadyAdded) return state

          return {
            watchlist: [...state.watchlist, movie],
          }
        }),

      removeMovie: (movieId) =>
        set((state) => ({
          watchlist: state.watchlist.filter(
            (movie) => movie.id !== movieId,
          ),
        })),

      isInWatchlist: (movieId) =>
        get().watchlist.some((movie) => movie.id === movieId),
    }),
    {
      name: 'cinescope-watchlist',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)