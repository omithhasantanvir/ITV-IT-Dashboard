import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Eye, EyeOff, Loader2, Moon, Sun } from 'lucide-react';
import { BrandLogo, BrandMark, LoginDecor } from '@/components/BrandLogo';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { getErrorMessage } from '@/lib/api';

const inputClass =
  'h-11 w-full rounded-lg border border-input bg-background px-4 text-sm text-foreground outline-none ring-0 placeholder:text-muted-foreground focus-visible:border-brand-red focus-visible:ring-2 focus-visible:ring-brand-red/25';

export function LoginPage() {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const usernameRef = useRef(null);

  // Land on the username field so the form is keyboard-ready on open.
  useEffect(() => {
    usernameRef.current?.focus();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;

    const trimmedUsername = username.trim();
    if (!trimmedUsername || !password) {
      setError('Enter both your username and password.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      // On success AuthProvider flips isAuthenticated and App swaps the shell in,
      // so there is nothing to navigate to by hand here.
      await login(trimmedUsername, password);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
      setPassword('');
    } finally {
      setSubmitting(false);
    }
  };
return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <LoginDecor />

      <button
        type="button"
        onClick={toggleTheme}
        className="absolute right-5 top-5 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card/80 text-muted-foreground backdrop-blur transition-colors hover:bg-accent hover:text-accent-foreground"
        aria-label="Toggle light and dark theme"
        title="Toggle light and dark theme"
      >
        {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>

      {/* Two-column shell: oversized mark on the left, sign-in card on the right. */}
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col items-center gap-12 px-6 py-12 lg:flex-row lg:justify-between lg:gap-8">
        <div className="flex flex-col items-center gap-6 lg:items-start">
          <BrandMark className="h-56 w-56 lg:h-80 lg:w-80" />
          <div className="text-center lg:text-left">
            <p className="text-3xl font-bold tracking-tight text-brand-red lg:text-4xl">INDEPENDENT</p>
            <p className="mt-1 text-sm text-muted-foreground">Asset Control System</p>
          </div>
        </div>

        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-border/70 bg-card p-8 shadow-card">
            <div className="flex flex-col items-center text-center">
              <BrandLogo className="h-16 w-16" alt="Independent" />
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">Independent</p>
              <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">Welcome Engineer!</h1>
              <p className="mt-1 text-sm text-muted-foreground">Sign in with your IT desk credentials.</p>
            </div>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
              {error ? (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              ) : null}


<input
                id="username"
                ref={usernameRef}
                className={inputClass}
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Username"
                aria-label="Username"
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                disabled={submitting}
              />

            <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className={`${inputClass} pr-11`}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Password"
                  aria-label="Password"
                  autoComplete="current-password"
                  disabled={submitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand-red text-sm font-medium text-white transition-colors hover:bg-brand-red/90 disabled:pointer-events-none disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  'Login'
                )}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">Internal system — authorised IT staff only.</p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
