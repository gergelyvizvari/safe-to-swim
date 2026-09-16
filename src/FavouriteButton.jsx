import { Star } from 'lucide-react'
import { locationDisplayName } from './locationNames.js'
import { useFavourites } from './FavouritesContext.js'

export default function FavouriteButton({ location, locale, t, className = '' }) {
  const { favourites, toggle } = useFavourites()
  const selected = favourites.some(item => item.id === location.id)
  const label = t(selected ? 'favourites.remove' : 'favourites.add', { name: locationDisplayName(location, locale) })
  return <button className={`favourite-button ${className}`} type="button" aria-pressed={selected} aria-label={label} title={label} onClick={() => toggle(location)}>
    <Star size={22} fill={selected ? 'currentColor' : 'none'} aria-hidden="true" />
  </button>
}
