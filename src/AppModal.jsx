import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

export function AppModal({ children, className = '', closeLabel, onClose, titleId }) {
  const dialogRef = useRef(null)
  const closeRef = useRef(null)
  const previousFocusRef = useRef(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    previousFocusRef.current = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current()
        return
      }
      if (event.key !== 'Tab') return
      const focusable = [...dialogRef.current.querySelectorAll('button:not(:disabled), a[href], input:not(:disabled), textarea:not(:disabled), select:not(:disabled), [tabindex]')].filter((element) => element.tabIndex >= 0 && element.getClientRects().length)
      const first = focusable[0]
      const last = focusable.at(-1)
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
      previousFocusRef.current?.focus()
    }
  }, [])

  return (
    <div className="app-modal-overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className={`app-modal-sheet ${className}`} role="dialog" aria-modal="true" aria-labelledby={titleId} ref={dialogRef}>
        <button className="app-modal-close" type="button" onClick={onClose} aria-label={closeLabel} ref={closeRef}>
          <X size={20} />
        </button>
        {children}
      </section>
    </div>
  )
}
