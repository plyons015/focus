import { useEffect, useRef, useState } from 'react';
import { linkStatus } from '../domain/calendar';
import { copy } from '../domain/copy';
import type { ContextTag, Task } from '../domain/types';
import type { Planner } from '../app/usePlanner';

function ContextChips({ value, onChange }: { value: ContextTag; onChange: (next: ContextTag) => void }) {
  const options: Array<[ContextTag, string]> = [
    ['chaplain', copy.chaplain],
    ['founder', copy.founder],
    ['personal', copy.personal],
  ];
  return (
    <div className="row">
      {options.map(([id, label]) => (
        <button key={id} type="button" className="chip" aria-pressed={value === id} onClick={() => onChange(id)}>
          {label}
        </button>
      ))}
    </div>
  );
}

function TaskDetails({ planner, task }: { planner: Planner; task: Task }) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button type="button" className="ghost" onClick={() => setOpen(true)}>
        {copy.details}
      </button>
    );
  }
  return (
    <div>
      <ContextChips value={task.context} onChange={(next) => planner.saveContext(task.id, next)} />
      <label htmlFor={`due-${task.id}`}>{copy.due}</label>
      <input
        id={`due-${task.id}`}
        type="datetime-local"
        value={toLocalInput(task.dueDate)}
        onChange={(event) => planner.saveDue(task.id, event.target.value ? new Date(event.target.value).toISOString() : null)}
      />
      <div className="row">
        <button type="button" className="ghost" onClick={() => planner.saveDue(task.id, null)}>
          {copy.clearDate}
        </button>
        {planner.home && task.dueDate ? (
          <button type="button" className="ghost" onClick={() => planner.putOnCalendar(task.id)}>
            {copy.putOnCalendar}
          </button>
        ) : null}
      </div>
      {planner.snap.projects.length > 0 ? (
        <>
          <label htmlFor={`project-${task.id}`}>{copy.projects}</label>
          <select
            id={`project-${task.id}`}
            value={task.projectId ?? ''}
            onChange={(event) => planner.saveProject(task.id, event.target.value || null)}
          >
            <option value="">{copy.noProjects}</option>
            {planner.snap.projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </>
      ) : null}
    </div>
  );
}

function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function TodayScreen({ planner }: { planner: Planner }) {
  const captureRef = useRef<HTMLInputElement>(null);
  const [why, setWhy] = useState(planner.now?.why ?? '');

  useEffect(() => {
    setWhy(planner.now?.why ?? '');
  }, [planner.now?.id, planner.now?.why]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT');
      if (typing) return;
      if (event.key === 'c' || ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k')) {
        event.preventDefault();
        captureRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const conflicts = planner.snap.tasks.flatMap((task) =>
    task.calendarLinks.flatMap((link) => {
      const event = planner.snap.events.find((item) => item.eventId === link.eventId && item.ownedByZigzag);
      if (!event) return [];
      const status = linkStatus({ taskUpdatedAt: task.updatedAt, taskDue: task.dueDate, link, event });
      return status.type === 'conflict' ? [{ task, eventStart: status.eventStart, etag: event.etag }] : [];
    }),
  );

  return (
    <section>
      <button type="button" className="strip" onClick={planner.openDeadlines}>
        {planner.summary}
      </button>
      {planner.inbox.length > 0 ? (
        <button type="button" className="ghost" onClick={planner.openTriage}>
          {copy.inboxLink(planner.inbox.length)}
        </button>
      ) : null}
      {planner.canUndo ? (
        <div className="toast card">
          <span>{copy.captured}</span>
          <button type="button" className="ghost" onClick={planner.undo}>
            {copy.undo}
          </button>
        </div>
      ) : null}
      <article className="card now">
        {planner.now ? (
          <>
            <p className="kicker">{labelFor(planner.now.context)}{planner.now.source === 'deeproots' ? ` · ${copy.fromDeepRoots}` : ''}</p>
            <h2>{planner.now.title}</h2>
            <label htmlFor="why">{copy.whyLabel}</label>
            <input
              id="why"
              className="why"
              value={why}
              placeholder=""
              onChange={(event) => setWhy(event.target.value)}
              onBlur={() => planner.saveWhy(planner.now!.id, why)}
            />
            <div className="row">
              {planner.now.canComplete ? (
                <button type="button" className="primary" onClick={() => planner.done(planner.now!.id)}>
                  {copy.done}
                </button>
              ) : null}
              <button type="button" className="ghost" onClick={() => planner.park(planner.now!.id)}>
                {copy.park}
              </button>
              {planner.next.length > 0 ? (
                <button type="button" className="ghost" onClick={planner.swapNow}>
                  {copy.swap}
                </button>
              ) : null}
              {planner.now.openUrl ? (
                <a className="ghost" href={planner.now.openUrl}>
                  {copy.openInDeepRoots}
                </a>
              ) : null}
            </div>
            <TaskDetails planner={planner} task={planner.now} />
          </>
        ) : (
          <h2>{copy.emptyNow}</h2>
        )}
      </article>
      {planner.recoveryFor ? (
        <div className="card">
          <p>{copy.blockRecovery}</p>
          <div className="row">
            <button type="button" className="ghost" onClick={() => planner.acceptRecovery(15)}>{copy.min15}</button>
            <button type="button" className="ghost" onClick={() => planner.acceptRecovery(30)}>{copy.min30}</button>
            <button type="button" className="ghost" onClick={() => planner.acceptRecovery(60)}>{copy.min60}</button>
            <button type="button" className="ghost" onClick={planner.dismissRecovery}>{copy.close}</button>
          </div>
        </div>
      ) : null}
      <section className="section">
        {planner.next.map((task) => (
          <article key={task.id} className="card">
            <p className="kicker">{labelFor(task.context)}</p>
            <h2>{task.title}</h2>
            <button type="button" className="ghost" onClick={() => planner.makeNow(task.id)}>
              {copy.makeNow}
            </button>
          </article>
        ))}
      </section>
      {conflicts.map((item) => (
        <div key={item.task.id} className="card" role="group" aria-label={copy.calendarDiffers}>
          <p>{copy.calendarDiffers}</p>
          <p>{item.task.title}</p>
          <div className="row">
            <button type="button" className="ghost" onClick={() => planner.keepConflict(item.task.id, item.eventStart, item.etag)}>
              {copy.keepTaskTime}
            </button>
            <button type="button" className="ghost" onClick={() => planner.useConflict(item.task.id, item.eventStart, item.etag)}>
              {copy.useCalendarTime}
            </button>
          </div>
        </div>
      ))}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const field = captureRef.current;
          if (!field) return;
          planner.capture(field.value);
          field.value = '';
        }}
      >
        <label className="quiet" htmlFor="capture">{copy.capturePlaceholder}</label>
        <input id="capture" ref={captureRef} className="capture" autoComplete="off" />
      </form>
    </section>
  );
}

export function TriageScreen({ planner }: { planner: Planner }) {
  const card = planner.inbox[0];
  if (!card) {
    return (
      <section className="card">
        <h2>{copy.inboxClear}</h2>
        <button type="button" className="primary" onClick={planner.dismissTriage}>{copy.today}</button>
      </section>
    );
  }
  return (
    <section>
      <p className="kicker">{copy.inboxLeft(planner.inbox.length)}</p>
      <article className="card">
        <h2>{card.title}</h2>
        {card.note ? <p>{card.note}</p> : null}
        <p className="quiet">{card.source === 'email' ? copy.email : card.source === 'deeproots' ? copy.fromDeepRoots : card.source === 'calendar' ? copy.comingUp : ''}</p>
        {card.createdAt ? <p className="quiet">{new Date(card.createdAt).toLocaleString()}</p> : null}
      </article>
      <div className="stack">
        <button type="button" className="primary" onClick={() => planner.chooseToday(card.id)}>{copy.today}</button>
        <button type="button" className="ghost" onClick={() => planner.chooseWeek(card.id)}>{copy.thisWeek}</button>
        <button type="button" className="ghost" onClick={() => planner.chooseSomeday(card.id)}>{copy.someday}</button>
        <button type="button" className="ghost" onClick={() => planner.chooseDelete(card.id)}>{copy.delete}</button>
        <button type="button" className="ghost" onClick={() => planner.skip(card.id)}>{copy.skip}</button>
        {planner.inbox.length > 15 ? (
          <button type="button" className="ghost" onClick={() => planner.sendRest(card.id)}>{copy.sendRest}</button>
        ) : null}
        <button type="button" className="ghost" onClick={planner.dismissTriage}>{copy.dismissTriage}</button>
      </div>
      {planner.canUndo ? (
        <div className="toast card">
          <button type="button" className="ghost" onClick={planner.undo}>{copy.undo}</button>
        </div>
      ) : null}
    </section>
  );
}

export function ListScreen({ planner, which }: { planner: Planner; which: 'week' | 'someday' }) {
  const items = which === 'week' ? planner.week : planner.someday;
  return (
    <section>
      <h2>{which === 'week' ? copy.thisWeek : copy.someday}</h2>
      {items.length === 0 ? <p className="quiet">{which === 'week' ? copy.weekEmpty : copy.somedayEmpty}</p> : null}
      {items.map((task) => (
        <article key={task.id} className="card">
          <h2>{task.title}</h2>
          <div className="row">
            <button type="button" className="ghost" onClick={() => planner.chooseToday(task.id)}>{copy.today}</button>
            <button type="button" className="ghost" onClick={() => planner.makeNow(task.id)}>{copy.makeNow}</button>
          </div>
        </article>
      ))}
    </section>
  );
}

export function ProjectsScreen({ planner }: { planner: Planner }) {
  const [name, setName] = useState('');
  const [context, setContext] = useState<ContextTag>('founder');
  const [note, setNote] = useState('');
  return (
    <section>
      <h2>{copy.projects}</h2>
      {planner.snap.projects.length === 0 ? <p className="quiet">{copy.noProjects}</p> : null}
      {planner.snap.projects.map((project) => (
        <button key={project.id} type="button" className="list-button" onClick={() => planner.openProject(project.id)}>
          <strong>{project.name}</strong>
          <div className="quiet">{labelFor(project.context)}</div>
        </button>
      ))}
      <form
        className="card"
        onSubmit={(event) => {
          event.preventDefault();
          if (!name.trim()) return;
          planner.saveProjectRecord({ name, context, note });
          setName('');
          setNote('');
        }}
      >
        <h2>{copy.newProject}</h2>
        <label htmlFor="project-name">{copy.projectName}</label>
        <input id="project-name" value={name} onChange={(event) => setName(event.target.value)} />
        <ContextChips value={context} onChange={setContext} />
        <label htmlFor="project-note">{copy.note}</label>
        <textarea id="project-note" value={note} onChange={(event) => setNote(event.target.value)} />
        <button type="submit" className="primary">{copy.save}</button>
      </form>
    </section>
  );
}

export function ProjectScreen({ planner }: { planner: Planner }) {
  const project = planner.snap.projects.find((item) => item.id === planner.projectId);
  if (!project) return <p>{copy.noProjects}</p>;
  const tasks = planner.snap.tasks.filter((task) => task.projectId === project.id && task.status !== 'done');
  return (
    <section>
      <button type="button" className="ghost" onClick={planner.openProjects}>{copy.back}</button>
      <h2>{project.name}</h2>
      <p className="quiet">{labelFor(project.context)}</p>
      {project.note ? <p>{project.note}</p> : null}
      <h3>{copy.projectTasks}</h3>
      {tasks.length === 0 ? <p className="quiet">{copy.noTasks}</p> : null}
      {tasks.map((task) => (
        <p key={task.id}>{task.title}</p>
      ))}
    </section>
  );
}

export function DeadlineScreen({ planner }: { planner: Planner }) {
  return (
    <section>
      <button type="button" className="ghost" onClick={planner.openToday}>{copy.back}</button>
      <h2>{copy.comingUp}</h2>
      {planner.rows.length === 0 ? <p className="quiet">{planner.summary}</p> : null}
      {planner.rows.map((row) => (
        <article key={row.id} className="card">
          <p className="kicker">{row.label}</p>
          <h2>{row.title}</h2>
          <p>{new Date(row.at).toLocaleString()}</p>
          {row.addable && row.eventId ? (
            <button type="button" className="ghost" onClick={() => planner.addEvent(row.eventId!)}>
              {copy.addToInbox}
            </button>
          ) : null}
        </article>
      ))}
    </section>
  );
}

export function SettingsScreen({ planner }: { planner: Planner }) {
  const deep = planner.snap.integrations.deeproots;
  const [uid, setUid] = useState(deep.mcdillUid);
  const [host, setHost] = useState(deep.host);
  const [raw, setRaw] = useState('');
  const [importNote, setImportNote] = useState('');
  return (
    <section>
      <h2>{copy.settings}</h2>
      <p>{copy.settingsNote}</p>
      <p className="quiet">{copy.deviceNote}</p>
      <form
        className="card"
        onSubmit={(event) => {
          event.preventDefault();
          planner.saveIntegrations({
            ...planner.snap.integrations,
            deeproots: { ...deep, mcdillUid: uid.trim(), host: host.trim(), status: uid.trim() ? 'connected' : 'off' },
          });
        }}
      >
        <h2>{copy.connectDeepRoots}</h2>
        <p className="quiet">{uid.trim() ? copy.connected : copy.notConnected}</p>
        <label htmlFor="mcdill-uid">{copy.mcdillUid}</label>
        <input id="mcdill-uid" value={uid} onChange={(event) => setUid(event.target.value)} autoComplete="off" />
        <label htmlFor="mcdill-host">{copy.deepRootsHost}</label>
        <input id="mcdill-host" value={host} onChange={(event) => setHost(event.target.value)} autoComplete="off" />
        <button type="submit" className="primary">{copy.save}</button>
      </form>
      <form
        className="card"
        onSubmit={(event) => {
          event.preventDefault();
          try {
            const parsed = JSON.parse(raw) as { items?: unknown[] };
            if (!parsed.items) throw new Error('items');
            planner.importOpenWork(parsed as Parameters<Planner['importOpenWork']>[0]);
            setImportNote(copy.captured);
          } catch {
            setImportNote(copy.importSnapshot);
          }
        }}
      >
        <label htmlFor="snapshot">{copy.importSnapshot}</label>
        <textarea id="snapshot" value={raw} onChange={(event) => setRaw(event.target.value)} />
        <button type="submit" className="ghost">{copy.save}</button>
        {importNote ? <p>{importNote}</p> : null}
        <p className="quiet">{copy.checkoffNote}</p>
      </form>
      <CalendarCard planner={planner} provider="zoho" title={copy.zoho} />
      <CalendarCard planner={planner} provider="google" title={copy.google} />
      <p className="quiet">{copy.calendarNote}</p>
    </section>
  );
}

function CalendarCard({ planner, provider, title }: { planner: Planner; provider: 'zoho' | 'google'; title: string }) {
  const link = planner.snap.integrations[provider];
  const [calendarId, setCalendarId] = useState(link.writeCalendarId);
  return (
    <form
      className="card"
      onSubmit={(event) => {
        event.preventDefault();
        const home = true;
        const other = provider === 'zoho' ? 'google' : 'zoho';
        planner.saveIntegrations({
          ...planner.snap.integrations,
          [provider]: {
            ...link,
            status: calendarId.trim() ? 'connected' : 'off',
            writeCalendarId: calendarId.trim(),
            calendarIds: calendarId.trim() ? [calendarId.trim()] : [],
            home,
          },
          [other]: { ...planner.snap.integrations[other], home: false },
        });
      }}
    >
      <h2>{title}</h2>
      <p className="quiet">{link.status === 'connected' ? copy.connected : copy.notConnected}</p>
      {link.lastError ? <p>{link.lastError}</p> : null}
      <label htmlFor={`${provider}-cal`}>{copy.homeCalendar}</label>
      <input id={`${provider}-cal`} value={calendarId} onChange={(event) => setCalendarId(event.target.value)} autoComplete="off" />
      <button type="submit" className="ghost">{copy.save}</button>
    </form>
  );
}

export function SwapDialog({ planner }: { planner: Planner }) {
  if (!planner.swap) return null;
  const incoming = planner.snap.tasks.find((task) => task.id === planner.swap?.incomingId);
  return (
    <div className="card dialog" role="dialog" aria-modal="true" aria-labelledby="swap-title">
      <h2 id="swap-title">{copy.swapPrompt}</h2>
      {incoming ? <p>{incoming.title}</p> : null}
      <div className="stack">
        {planner.swap.nextIds.map((id) => {
          const task = planner.snap.tasks.find((item) => item.id === id);
          return (
            <button key={id} type="button" className="ghost" onClick={() => planner.resolveSwap({ type: 'displace', id })}>
              {task?.title}
            </button>
          );
        })}
        <button type="button" className="ghost" onClick={() => planner.resolveSwap({ type: 'to-week' })}>
          {copy.sendNewToWeek}
        </button>
        <button type="button" className="ghost" onClick={planner.dismissSwap}>{copy.close}</button>
      </div>
    </div>
  );
}

export function BlockDialog({ planner }: { planner: Planner }) {
  if (!planner.blockAsk) return null;
  return (
    <div className="card dialog" role="dialog" aria-modal="true">
      <div className="row">
        <button type="button" className="ghost" onClick={() => planner.confirmBlock(true)}>{copy.removeBlock}</button>
        <button type="button" className="ghost" onClick={() => planner.confirmBlock(false)}>{copy.keepBlock}</button>
      </div>
    </div>
  );
}

function labelFor(context: ContextTag): string {
  if (context === 'chaplain') return copy.chaplain;
  if (context === 'founder') return copy.founder;
  return copy.personal;
}
