import { useEffect, useMemo, useState } from 'react';
import { copy } from '../domain/copy';
import { HelpScreen } from '../help/HelpScreen';
import { firebaseServices, pingSync, readFirebaseEnv, signInEmail, signInGoogle, signOutUser, watchUser, type FirebaseEnv } from '../data/firebase';
import { createFirestoreStore } from '../data/firestoreStore';
import { migrateLocalIntoCloud } from '../data/migrate';
import { createLocalStore, type DataStore } from '../data/store';
import {
  BlockDialog,
  DeadlineScreen,
  ListScreen,
  ProjectScreen,
  ProjectsScreen,
  SettingsScreen,
  SwapDialog,
  TodayScreen,
  TriageScreen,
} from '../features/screens';
import { usePlanner } from './usePlanner';

const DEVICE_KEY = 'zigzag-device-only';

export function App() {
  const [env] = useState(readFirebaseEnv);
  const [deviceOnly, setDeviceOnly] = useState(() => localStorage.getItem(DEVICE_KEY) === '1' || !env);
  const [uid, setUid] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(!env || deviceOnly);
  const [cloudReady, setCloudReady] = useState(false);
  const store = useMemo(() => {
    if (!authReady) return null;
    if (env && uid && !deviceOnly) {
      if (!cloudReady) return null;
      return createFirestoreStore(firebaseServices(env).db, uid);
    }
    if (!env || deviceOnly) return createLocalStore();
    return null;
  }, [authReady, env, uid, deviceOnly, cloudReady]);

  useEffect(() => {
    if (!env || !uid || deviceOnly) return;
    let cancel = false;
    void migrateLocalIntoCloud(uid, firebaseServices(env).db).finally(() => {
      if (!cancel) setCloudReady(true);
    });
    return () => {
      cancel = true;
    };
  }, [env, uid, deviceOnly]);

  useEffect(() => {
    if (!env || deviceOnly) return;
    const { auth } = firebaseServices(env);
    return watchUser(auth, (next) => {
      setUid(next);
      setAuthReady(true);
    });
  }, [env, deviceOnly]);

  if (!authReady) return <main className="app"><p>{copy.appName}</p></main>;
  if (env && !deviceOnly && !uid) {
    return <SignIn env={env} onDevice={() => { localStorage.setItem(DEVICE_KEY, '1'); setDeviceOnly(true); }} />;
  }
  if (!store) return <main className="app"><p>{copy.appName}</p></main>;

  return <PlannerApp store={store} ownerId={uid ?? 'local'} env={env} onSignOut={() => {
    localStorage.removeItem(DEVICE_KEY);
    if (env) void signOutUser(firebaseServices(env).auth);
    setDeviceOnly(false);
    setCloudReady(false);
    setUid(null);
  }} />;
}

function PlannerApp({ store, ownerId, env, onSignOut }: { store: DataStore; ownerId: string; env: FirebaseEnv | null; onSignOut: () => void }) {
  const planner = usePlanner(store, ownerId);
  useEffect(() => {
    if (!env || ownerId === 'local') return;
    const timer = window.setInterval(() => {
      void pingSync(firebaseServices(env).auth);
    }, 15 * 60 * 1000);
    void pingSync(firebaseServices(env).auth);
    return () => window.clearInterval(timer);
  }, [env, ownerId]);

  if (!planner.ready) {
    return (
      <main className="app">
        <h1>{copy.appName}</h1>
      </main>
    );
  }

  return (
    <main className="app">
      <header className="mark">
        <img src="/icon.png" alt="" />
        <div>
          <h1>{copy.appName}</h1>
          <p>{copy.appFullName}</p>
        </div>
        <button type="button" className="ghost" onClick={planner.openHelp}>{copy.help}</button>
      </header>
      {planner.view === 'today' ? <TodayScreen planner={planner} /> : null}
      {planner.view === 'triage' ? <TriageScreen planner={planner} /> : null}
      {planner.view === 'week' ? <ListScreen planner={planner} which="week" /> : null}
      {planner.view === 'someday' ? <ListScreen planner={planner} which="someday" /> : null}
      {planner.view === 'projects' ? <ProjectsScreen planner={planner} /> : null}
      {planner.view === 'project' ? <ProjectScreen planner={planner} /> : null}
      {planner.view === 'deadlines' ? <DeadlineScreen planner={planner} /> : null}
      {planner.view === 'settings' ? <SettingsScreen planner={planner} /> : null}
      {planner.view === 'help' ? <HelpScreen onBack={planner.openToday} /> : null}
      <SwapDialog planner={planner} />
      <BlockDialog planner={planner} />
      <nav className="nav" aria-label={copy.today}>
        <button type="button" aria-current={planner.view === 'today' ? 'page' : undefined} onClick={planner.openToday}>{copy.today}</button>
        <button type="button" aria-current={planner.view === 'week' ? 'page' : undefined} onClick={planner.openWeek}>{copy.thisWeek}</button>
        <button type="button" aria-current={planner.view === 'someday' ? 'page' : undefined} onClick={planner.openSomeday}>{copy.someday}</button>
        <button type="button" aria-current={planner.view === 'projects' || planner.view === 'project' ? 'page' : undefined} onClick={planner.openProjects}>{copy.projects}</button>
        <button type="button" aria-current={planner.view === 'settings' ? 'page' : undefined} onClick={planner.openSettings}>{copy.settings}</button>
      </nav>
      {env && ownerId !== 'local' ? (
        <p><button type="button" className="ghost" onClick={onSignOut}>{copy.signOut}</button></p>
      ) : null}
    </main>
  );
}

function SignIn({ env, onDevice }: { env: FirebaseEnv; onDevice: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [note, setNote] = useState('');
  const auth = firebaseServices(env).auth;
  return (
    <main className="app">
      <header className="mark">
        <img src="/icon.png" alt="" />
        <div>
          <h1>{copy.appName}</h1>
          <p>{copy.appFullName}</p>
        </div>
      </header>
      <p>{copy.sameAccount}</p>
      <form
        className="card stack"
        onSubmit={(event) => {
          event.preventDefault();
          void signInEmail(auth, email, password, false).catch(() => setNote(copy.signInMismatch));
        }}
      >
        <label htmlFor="email">{copy.email}</label>
        <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" />
        <label htmlFor="password">{copy.password}</label>
        <input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" />
        <button type="submit" className="primary">{copy.signIn}</button>
        <button
          type="button"
          className="ghost"
          onClick={() => void signInEmail(auth, email, password, true).catch(() => setNote(copy.signInMismatch))}
        >
          {copy.createAccount}
        </button>
        <button type="button" className="ghost" onClick={() => void signInGoogle(auth).catch(() => setNote(copy.googleClosed))}>
          {copy.signInGoogle}
        </button>
        {note ? <p>{note}</p> : null}
      </form>
      <button type="button" className="ghost" onClick={onDevice}>{copy.useThisDevice}</button>
    </main>
  );
}
