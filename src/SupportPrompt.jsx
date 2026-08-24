import { Beer, ExternalLink } from 'lucide-react'
import { AppModal } from './AppModal.jsx'

const SUPPORT_URL = 'https://buymeacoffee.com/gergelyvizvari'

export function SupportPrompt({ onClose, t }) {
  return (
    <AppModal className="support-sheet" closeLabel={t('support.close')} onClose={onClose} titleId="support-title">
        <span className="support-icon" aria-hidden="true"><Beer size={30} /></span>
        <h2 id="support-title">{t('support.title')}</h2>
        <p>{t('support.text')}</p>
        <small>{t('support.optional')}</small>
        <a className="support-action" href={SUPPORT_URL} target="_blank" rel="noreferrer">
          <Beer size={18} /> {t('support.action')} <ExternalLink size={15} />
        </a>
    </AppModal>
  )
}
