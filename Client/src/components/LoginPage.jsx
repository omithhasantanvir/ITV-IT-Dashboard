import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Eye, EyeOff, Loader2, Moon, Sun } from 'lucide-react';
import { BrandLogo, BrandMark, LoginDecor } from '@/components/BrandLogo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { getErrorMessage } from '@/lib/api';
import { loginSchema } from '@/lib/validation';

// Inline errors sit right under the field they belong to, and the label turns
// red so a failing field is obvious without hunting for it.
function FieldError({ message }) {
  if (!message) return null;
  return (
    <p className="flex items-center gap-1.5 text-xs font-medium text-destructive" role="alert">
      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
      {message}
    </p>
  );
}

export function LoginPage() {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setFocus,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    mode: 'onTouched',
    defaultValues: { username: '', password: '' },
  });

  const onSubmit = async (values) => {
    setServerError('');
    try {
      // On success AuthProvider flips isAuthenticated and App swaps the shell in,
      // so there is nothing to navigate to by hand here.
      await login(values.username, values.password);
    } catch (requestError) {
      setServerError(getErrorMessage(requestError));
      // Wrong password: drop it so the next attempt starts clean, and send focus
      // back to the field that can actually be fixed.
      setValue('password', '');
      setFocus('password');
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
          <Card className="border-border/70 shadow-card">
            <CardContent className="p-8">
              <div className="flex flex-col items-center text-center">
                <BrandLogo className="h-16 w-16" alt="Independent" />
                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">Independent</p>
                <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">Welcome Engineer!</h1>
                <p className="mt-1 text-sm text-muted-foreground">Sign in with your IT desk credentials.</p>
              </div>

              {serverError ? (
                <div
                  className="mt-6 flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
                  role="alert"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{serverError}</span>
                </div>
              ) : null}

              <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
                <div className="space-y-2">
                  <Label htmlFor="username" className={errors.username ? 'text-destructive' : undefined}>
                    Username
                  </Label>
                  <Input
                    id="username"
                    autoComplete="username"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck="false"
                    placeholder="omith.hasan"
                    aria-invalid={Boolean(errors.username)}
                    className={errors.username ? 'border-destructive focus-visible:ring-destructive/30' : undefined}
                    {...register('username')}
                  />
                  <FieldError message={errors.username?.message} />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className={errors.password ? 'text-destructive' : undefined}>
                      Password
                    </Label>
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      aria-invalid={Boolean(errors.password)}
                      className={`pr-16 ${errors.password ? 'border-destructive focus-visible:ring-destructive/30' : ''}`}
                      {...register('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded text-muted-foreground transition-colors hover:text-foreground"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <FieldError message={errors.password?.message} />
                </div>

                <Button type="submit" className="h-11 w-full bg-brand-red text-white hover:bg-brand-red/90" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Signing in…
                    </>
                  ) : (
                    'Login'
                  )}
                </Button>
              </form>

              <Separator className="my-6" />

              <p className="text-center text-xs text-muted-foreground">
                Internal system — authorised IT staff only.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
