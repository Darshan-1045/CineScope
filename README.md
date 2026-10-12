# 🎬 CineScope

CineScope is a responsive movie discovery application built with React and TypeScript. It allows users to explore movies, search by title, browse genres, apply filters, view movie details, and maintain a personal watchlist.

## ✨ Features

- Movie discovery and genre-based browsing
- Search movies by title
- Infinite scrolling for movie collections
- Filtering by year and media type
- Sorting movie results
- Movie details view
- Persistent personal watchlist
- URL-based search and filter synchronization
- Browser Back and Forward navigation
- Responsive user interface

## 🛠️ Tech Stack

- **React** — UI development
- **TypeScript** — Type safety
- **Vite** — Development and build tooling
- **pnpm** — Package management
- **TanStack Query** — Server state, caching, and data fetching
- **Zustand** — Client state and watchlist management
- **Watchmode API** — Movie and entertainment data
- **CSS** — Responsive styling

## 📁 Project Structure

```text
CineScope/
├── public/
├── src/
│   ├── components/
│   ├── hooks/
│   ├── stores/
│   ├── types/
│   ├── App.tsx
│   ├── main.tsx
│   └── ...
├── .env
├── .gitignore
├── index.html
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── vite.config.ts
└── README.md
```

*Note: Keep this section aligned with the actual folders and files in your repository.*

## ⚙️ Application Workflow

1. **Data fetching:** The application requests movie data from the Watchmode API.
2. **Server state management:** TanStack Query handles API requests, caching, and asynchronous data.
3. **Movie discovery:** Users browse genres, search titles, and explore additional results through infinite scrolling.
4. **Filtering and sorting:** Users refine the displayed movies using available filters and sorting options.
5. **Movie details:** Selecting a movie displays its additional information.
6. **Client state management:** Zustand manages the watchlist.
7. **Persistence:** Watchlist data is retained between browser sessions.
8. **URL synchronization:** Search and filter state is reflected in the URL, supporting browser navigation.

## 🔑 Environment Configuration

The application uses the following environment variable:

```env
VITE_WATCHMODE_API_KEY=your_watchmode_api_key
```

The `.env` file should be excluded from Git tracking. Variables prefixed with `VITE_` are exposed to client-side code, so the API key should not be treated as a secret in a deployed frontend.

## ▶️ Development Workflow

| Command | Purpose |
|---|---|
| `pnpm dev` | Start the development server |
| `pnpm build` | Build the application for production |
| `pnpm preview` | Preview the production build |

## 🧠 Key Learnings

- Separating server state from client state
- Implementing API caching with TanStack Query
- Managing shared state with Zustand
- Handling infinite queries and asynchronous data fetching
- Synchronizing UI state with URL parameters
- Building reusable React components with TypeScript
- Creating a responsive frontend application

## 🌐 Deployment Workflow

1. Push the completed project to GitHub.
2. Connect the repository to a deployment platform.
3. Configure the required environment variables.
4. Build the application using `pnpm build`.
5. Deploy the generated `dist` directory.
6. Verify movie discovery, search, filters, details, and watchlist functionality on the live site.

---

**CineScope — Discover your next favorite movie. 🍿**
