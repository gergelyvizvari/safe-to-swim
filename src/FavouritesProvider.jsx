import { useEffect, useRef, useState } from 'react'
import { FavouritesContext } from './FavouritesContext.js'
import { FAVOURITES_STORAGE_KEY, readFavourites, toggleFavourite, writeFavourites } from './favourites.js'

const storage = {
  getItem: key => window.localStorage.getItem(key),
  setItem: (key, value) => window.localStorage.setItem(key, value),
}

export default function FavouritesProvider({ children }) {
  const [favourites, setFavourites] = useState(() => readFavourites(storage))
  const current = useRef(favourites)
  const [saveFailed, setSaveFailed] = useState(false)
  useEffect(() => {
    const synchronize = event => {
      if (event.key !== FAVOURITES_STORAGE_KEY && event.key !== null) return
      current.current = readFavourites(storage)
      setFavourites(current.current)
      setSaveFailed(false)
    }
    window.addEventListener('storage', synchronize)
    return () => window.removeEventListener('storage', synchronize)
  }, [])
  const toggle = location => {
    const next = toggleFavourite(current.current, location)
    current.current = next
    setFavourites(next)
    setSaveFailed(!writeFavourites(storage, next))
  }
  return <FavouritesContext.Provider value={{ favourites, toggle, saveFailed }}>{children}</FavouritesContext.Provider>
}
