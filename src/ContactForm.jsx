import { useRef, useState } from 'react'
import { Check, Mail, Send } from 'lucide-react'
import { AppModal } from './AppModal.jsx'

export function ContactForm({ onClose, t }) {
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const requestId = useRef(crypto.randomUUID())
  const busy = useRef(false)
  async function submit(event) {
    event.preventDefault()
    if (busy.current) return
    const fields = Object.fromEntries(new FormData(event.currentTarget))
    busy.current = true
    setStatus('sending')
    setError('')
    try {
      const response = await fetch('/api/contact', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...fields, requestId: requestId.current }),
        signal: AbortSignal.timeout(15_000),
      })
      const result = await response.json()
      if (!response.ok || !result.ok) {
        setError(['invalid', 'rateLimit'].includes(result.error) ? result.error : 'unavailable')
        setStatus('idle')
      } else setStatus('success')
    } catch {
      setError('unavailable')
      setStatus('idle')
    } finally { busy.current = false }
  }
  return (
    <AppModal className="contact-sheet" onClose={onClose} closeLabel={t('contact.close')} titleId="contact-title">
      <div className="support-icon">{status === 'success' ? <Check size={25} /> : <Mail size={25} />}</div>
      <h2 id="contact-title">{t('contact.title')}</h2>
      {status === 'success' ? <>
        <p role="status">{t('contact.success')}</p>
        <button className="install-done" type="button" onClick={onClose}>{t('contact.done')}</button>
      </> : <>
        <p>{t('contact.intro')}</p>
        <form className="contact-form" onSubmit={submit} aria-busy={status === 'sending'}>
          <label htmlFor="contact-name">{t('contact.name')}<input id="contact-name" name="name" autoComplete="name" maxLength={100} disabled={status === 'sending'} /></label>
          <label htmlFor="contact-email">{t('contact.email')}<input id="contact-email" name="email" type="email" autoComplete="email" required maxLength={254} disabled={status === 'sending'} /></label>
          <label htmlFor="contact-message">{t('contact.message')}<textarea id="contact-message" name="message" required minLength={10} maxLength={5000} rows={4} aria-describedby="contact-hint" disabled={status === 'sending'} /></label>
          <p id="contact-hint" className="contact-hint">{t('contact.hint')}</p>
          <div hidden aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
          {error && <p className="contact-error" role="alert">{t(`contact.${error}`)}</p>}
          <button className="install-done" type="submit" disabled={status === 'sending'}><Send size={16} />{t(status === 'sending' ? 'contact.sending' : 'contact.send')}</button>
          <p className="contact-hint">{t('contact.privacy')}</p>
        </form>
      </>}
    </AppModal>
  )
}
