import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Eye, EyeOff, Loader2, LogIn, Moon, ShieldCheck, Sun } from 'lucide-react';
import { BrandBackdrop, BrandLogo } from '@/components/BrandLogo';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { getErrorMessage } from '@/lib/api';

const inputClass =
  'h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none ring-0 placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

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
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10 text-foreground">
      <BrandBackdrop />
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        className="absolute right-5 top-5"
        aria-label="Toggle light and dark theme"
        title="Toggle light and dark theme"
      >
        {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>

      <div className="w-full max-w-md">
        <div className="flex flex-col items-center text-center">
          {/* The plate behind the cut-out logo keeps the red mark legible on the
              light background, where a bare transparent PNG would wash out. */}
          <div className="flex items-center justify-center rounded-full bg-card p-4 shadow-soft ring-1 ring-border">
            <BrandLogo className="h-24 w-24" alt="Independent" />
          </div>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight">IT Operations</h1>
          <p className="mt-1 text-sm text-muted-foreground">Asset Control System</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 rounded-xl border border-border bg-card/90 p-6 shadow-soft backdrop-blur-xl">
          <div className="flex items-center gap-2 text-muted-foreground">
            <ShieldCheck className="h-4 w-4" />
            <p className="text-xs font-medium uppercase tracking-[0.2em]">Sign in</p>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">Use your IT desk credentials to continue.</p>

          {error ? (
            <div className="mt-5 flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}


<div className="mt-5 space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="username" className="text-sm font-medium">
                Username
              </label>
              <input
                id="username"
                ref={usernameRef}
                className={inputClass}
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="omith.hasan"
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                disabled={submitting}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className={`${inputClass} pr-10`}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
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
            </div>
          </div>

          <Button type="submit" className="mt-6 w-full" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing in…
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                Sign in
              </>
            )}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">Internal system — authorised IT staff only.</p>
      </div>
    </div>
  );
}

export default LoginPage;
