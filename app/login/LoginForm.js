'use client';

import { useActionState, useState } from 'react';
import { signIn, signUp } from './actions';
import styles from './login.module.css';

export default function LoginForm({ next = '/', initialError = null }) {
  const [mode, setMode] = useState('signin');
  const action = mode === 'signin' ? signIn : signUp;
  const [state, formAction, pending] = useActionState(action, {
    error: initialError,
    message: null,
  });

  return (
    <div className={styles.card}>
      <div className={styles.tabs}>
        <button
          type="button"
          className={mode === 'signin' ? styles.tabActive : styles.tab}
          onClick={() => setMode('signin')}
        >
          Sign in
        </button>
        <button
          type="button"
          className={mode === 'signup' ? styles.tabActive : styles.tab}
          onClick={() => setMode('signup')}
        >
          Create account
        </button>
      </div>

      <form action={formAction} className={styles.form}>
        <input type="hidden" name="next" value={next} />

        {mode === 'signup' && (
          <label className={styles.field}>
            Username
            <input type="text" name="username" required minLength={2} maxLength={32} />
          </label>
        )}

        <label className={styles.field}>
          Email
          <input type="email" name="email" required />
        </label>

        <label className={styles.field}>
          Password
          <input type="password" name="password" required minLength={6} />
        </label>

        {state?.error && <p className={styles.error}>{state.error}</p>}
        {state?.message && <p className={styles.message}>{state.message}</p>}

        <button type="submit" className={styles.submit} disabled={pending}>
          {pending ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
        </button>
      </form>
    </div>
  );
}
