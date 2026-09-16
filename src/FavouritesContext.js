import { createContext, useContext } from 'react'
export const FavouritesContext = createContext(null)
export const useFavourites = () => useContext(FavouritesContext)
