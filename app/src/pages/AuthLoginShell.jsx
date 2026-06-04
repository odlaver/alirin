import { Link } from 'react-router-dom'
import { ArrowLeft, Droplets, LogIn } from 'lucide-react'
import './AuthLoginPage.css'

export default function AuthLoginShell({
  icon: Icon,
  kicker,
  title,
  description,
  emailId,
  passwordId,
  email,
  password,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  submitLabel,
  error,
  demoContent,
}) {
  return (
    <div className="auth-page">
      <div className="auth-grid" aria-hidden="true" />
      <span className="auth-wave auth-wave-one" aria-hidden="true" />
      <span className="auth-wave auth-wave-two" aria-hidden="true" />
      <span className="auth-current auth-current-one" aria-hidden="true" />
      <span className="auth-current auth-current-two" aria-hidden="true" />

      <form className="auth-card" onSubmit={onSubmit}>
        <Link to="/" className="auth-back">
          <ArrowLeft size={16} /> Beranda
        </Link>

        <div className="auth-heading">
          <div className="auth-icon">
            <Icon size={26} />
          </div>
          <div>
            <span className="auth-kicker">
              <Droplets size={13} /> {kicker}
            </span>
            <h1>{title}</h1>
          </div>
        </div>

        <p className="auth-description">{description}</p>

        <label className="auth-label" htmlFor={emailId}>Email</label>
        <input
          id={emailId}
          className="auth-input"
          type="email"
          value={email}
          onChange={(event) => onEmailChange(event.target.value)}
          autoComplete="username"
        />

        <label className="auth-label auth-label-spaced" htmlFor={passwordId}>Password</label>
        <input
          id={passwordId}
          className="auth-input"
          type="password"
          value={password}
          onChange={(event) => onPasswordChange(event.target.value)}
          autoComplete="current-password"
        />

        {error && <div className="auth-error">{error}</div>}

        <button type="submit" className="btn btn-primary btn-large auth-submit">
          <LogIn size={18} />
          {submitLabel}
        </button>

        {demoContent && (
          <div className="auth-demo">
            {demoContent}
          </div>
        )}
      </form>
    </div>
  )
}
