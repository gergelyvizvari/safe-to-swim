import { Check, Menu, Share, Smartphone } from 'lucide-react'
import { AppModal } from './AppModal.jsx'

export function InstallGuide({ isIOS, onClose, t }) {
  const steps = isIOS
    ? [
        { icon: Share, text: t('install.iosShare') },
        { icon: Smartphone, text: t('install.iosAdd') },
        { icon: Check, text: t('install.iosConfirm') },
      ]
    : [
        { icon: Menu, text: t('install.browserMenu') },
        { icon: Smartphone, text: t('install.browserInstall') },
        { icon: Check, text: t('install.browserConfirm') },
      ]

  return (
    <AppModal className="install-sheet" closeLabel={t('install.close')} onClose={onClose} titleId="install-title">
      <span className="install-icon" aria-hidden="true"><Smartphone size={29} /></span>
      <h2 id="install-title">{t('install.title')}</h2>
      <p>{t('install.description')}</p>
      <ol className="install-steps">
        {steps.map(({ icon: Icon, text }) => (
          <li key={text}><span><Icon size={18} /></span><strong>{text}</strong></li>
        ))}
      </ol>
      <button className="install-done" type="button" onClick={onClose}>{t('install.done')}</button>
    </AppModal>
  )
}
