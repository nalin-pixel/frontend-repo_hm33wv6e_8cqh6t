import { useEffect, useMemo, useState } from 'react'
import { Search, PlayCircle, ChevronRight, Clock } from 'lucide-react'
import { BrowserRouter, Link, Routes, Route, useParams } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

function Header({ onSearch }) {
  return (
    <header className="sticky top-0 z-20 backdrop-blur bg-white/70 border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
        <Link to="/" className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Anime streaming</Link>
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            onChange={e => onSearch(e.target.value)}
            placeholder="Search anime..."
            className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <a href="/test" className="text-sm text-gray-600 hover:text-gray-900">Status</a>
      </div>
    </header>
  )
}

function AnimeCard({ anime }) {
  return (
    <Link to={`/anime/${anime.id}`} className="group rounded-xl overflow-hidden bg-white shadow hover:shadow-lg transition">
      <div className="aspect-[3/4] bg-gray-100">
        {anime.cover_url ? (
          <img src={anime.cover_url} alt={anime.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full grid place-items-center text-gray-400">No Cover</div>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-semibold line-clamp-1">{anime.title}</h3>
        {anime.tags?.length ? (
          <p className="text-xs text-gray-500 mt-1">{anime.tags.join(' • ')}</p>
        ) : null}
      </div>
    </Link>
  )
}

function Home() {
  const [query, setQuery] = useState('')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    document.title = 'Anime streaming'
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    const load = async () => {
      try {
        setLoading(true)
        const res = await fetch(`${API_BASE}/api/anime${query ? `?q=${encodeURIComponent(query)}` : ''}`, { signal: controller.signal })
        const data = await res.json()
        setItems(data)
      } catch (e) {
        setItems([])
      } finally {
        setLoading(false)
      }
    }
    load()
    return () => controller.abort()
  }, [query])

  return (
    <div>
      <Header onSearch={setQuery} />
      <main className="max-w-6xl mx-auto px-4 py-6">
        <h2 className="text-xl font-semibold mb-4">Trending</h2>
        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {items.map(a => (
              <AnimeCard key={a.id} anime={a} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

function formatMinutes(mins) {
  if (!mins && mins !== 0) return null
  return `${mins} min`
}

function EpisodeRow({ ep, isActive }) {
  return (
    <Link to={`?ep=${ep.number}`} className={`group flex items-center justify-between p-3 rounded-lg border ${isActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:bg-gray-50'}`}>
      <div className="flex items-center gap-3">
        <div className="relative w-16 h-10 bg-gray-200 rounded overflow-hidden flex-shrink-0">
          {ep.thumbnail_url && <img src={ep.thumbnail_url} alt={ep.title} className="w-full h-full object-cover" />}
          {ep.duration != null && (
            <span className={`absolute bottom-0 right-0 m-0.5 text-[10px] leading-none px-1.5 py-0.5 rounded ${isActive ? 'bg-indigo-600 text-white' : 'bg-black/70 text-white'}`}>
              {formatMinutes(ep.duration)}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <p className="font-medium truncate">Episode {ep.number}</p>
          <p className="text-xs text-gray-500 truncate">{ep.title}</p>
        </div>
      </div>
      <PlayCircle className={`h-5 w-5 ${isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
    </Link>
  )
}

function Player() {
  const { animeId } = useParams()
  const [anime, setAnime] = useState(null)
  const [episodes, setEpisodes] = useState([])
  const [current, setCurrent] = useState(null)

  const epParam = new URLSearchParams(window.location.search).get('ep')

  useEffect(() => {
    const load = async () => {
      try {
        const [aRes, eRes] = await Promise.all([
          fetch(`${API_BASE}/api/anime/${animeId}`),
          fetch(`${API_BASE}/api/anime/${animeId}/episodes`)
        ])
        const a = await aRes.json()
        const eps = await eRes.json()
        setAnime(a)
        setEpisodes(eps)
        const initial = eps.find(x => String(x.number) === String(epParam)) || eps[0]
        setCurrent(initial || null)
        if (a?.title) document.title = `${a.title} • Anime streaming`
      } catch (e) {
        setAnime(null)
        setEpisodes([])
      }
    }
    load()
  }, [animeId])

  useEffect(() => {
    if (!episodes.length) return
    const chosen = episodes.find(x => String(x.number) === String(epParam)) || episodes[0]
    setCurrent(chosen)
  }, [epParam, episodes])

  return (
    <div>
      <Header onSearch={() => {}} />
      <main className="max-w-6xl mx-auto px-4 py-6 grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="aspect-video bg-black rounded-xl overflow-hidden">
            {current ? (
              <video src={current.stream_url} className="w-full h-full" controls autoPlay poster={current.thumbnail_url} />
            ) : (
              <div className="w-full h-full grid place-items-center text-white/70">No episode selected</div>
            )}
          </div>
          {anime && (
            <div className="mt-4">
              <h1 className="text-2xl font-bold">{anime.title}</h1>
              {current?.title && (
                <p className="text-gray-700 mt-1 flex items-center gap-2">
                  <PlayCircle className="h-4 w-4 text-indigo-600" />
                  <span className="font-medium">Episode {current.number}:</span>
                  <span className="truncate">{current.title}</span>
                  {current.duration != null && (
                    <span className="ml-2 inline-flex items-center gap-1 text-gray-500 text-sm">
                      <Clock className="h-4 w-4" /> {formatMinutes(current.duration)}
                    </span>
                  )}
                </p>
              )}
              {anime.description && <p className="text-gray-600 mt-2">{anime.description}</p>}
              {anime.tags?.length ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {anime.tags.map(t => (
                    <span key={t} className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">{t}</span>
                  ))}
                </div>
              ) : null}
            </div>
          )}
        </div>
        <aside>
          <h3 className="font-semibold mb-3 flex items-center gap-2">Episodes <ChevronRight className="h-4 w-4" />
            {episodes?.length ? (
              <span className="text-xs font-normal text-gray-500">({episodes.length})</span>
            ) : null}
          </h3>
          <div className="space-y-2 max-h-[70vh] overflow-auto pr-1">
            {episodes.map(ep => (
              <EpisodeRow key={ep.id} ep={ep} isActive={current && ep.number === current.number} />
            ))}
          </div>
        </aside>
      </main>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/anime/:animeId" element={<Player />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
