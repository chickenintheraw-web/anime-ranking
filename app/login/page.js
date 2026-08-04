import LoginForm from './LoginForm';
import styles from './login.module.css';

export default async function LoginPage({ searchParams }) {
  const { next, error } = await searchParams;

  return (
    <main className={styles.main}>
      <h1>Sign in</h1>
      <p className={styles.subtitle}>
        Sign in to build and save your own anime and theme rankings.
      </p>
      <LoginForm next={next || '/'} initialError={error || null} />
    </main>
  );
}
