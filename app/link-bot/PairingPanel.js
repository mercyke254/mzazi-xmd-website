'use client';

// ─────────────────────────────────────────────────────────────────────────────
// MZAZI XMD — the pairing panel.
//
// Four steps: enter the number → get the code → type it on the phone → done.
//
// Every call below is a RELATIVE path. They land on this site's /api/[...path]
// bridge, which forwards them to the live MZAZI API (see that file for why), so
// the pairing itself is the same mechanism the main site and the Telegram bot
// use — one queue, one table, one bot that claims the request.
//
// The polling is deliberately patient but bounded: a code that has not arrived
// after two minutes is not going to, and the request slot has to be freed before
// another can be made.
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Button, Card, CardHeader, Badge, StatusIndicator, WizardSteps, Alert,
  ConfirmDialog, EmptyState, LoadingState, humaniseError, Icons,
} from '@/components/ui';
import site from '@/lib/site';

const STEPS = ['Enter number', 'Get pairing code', 'On your phone', 'Connected'];
const POLL_MS = 3000;
const POLL_LIMIT = 40; // 40 × 3s = two minutes

/** 254785016388 → +254 785 016 388, without pulling in a phone library. */
function prettyNumber(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length < 10) return value;
  const cc = digits.slice(0, 3);
  const rest = digits.slice(3);
  return `+${cc} ${(rest.match(/.{1,3}/g) || []).join(' ')}`;
}

function numberProblem(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (!digits) return 'Enter the WhatsApp number you want the bot on.';
  if (digits !== String(value || '').trim()) {
    return 'Numbers only — no +, spaces or dashes. For example 254785016388.';
  }
  if (digits.length < 10 || digits.length > 15) {
    return 'That does not look like a full international number. For example 254785016388.';
  }
  return '';
}

export default function PairingPanel() {
  const [authState, setAuthState] = useState('checking'); // checking | out | in
  const [account, setAccount] = useState(null);

  // sign-in form (only rendered while signed out)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginBusy, setLoginBusy] = useState(false);
  const [loginError, setLoginError] = useState('');

  // device list
  const [devices, setDevices] = useState(null); // null = not loaded yet
  const [plan, setPlan] = useState(null);
  const [maxDevices, setMaxDevices] = useState(1);
  const [loadError, setLoadError] = useState('');

  // bot selector — only shown when the API says there is a choice to make
  const [bots, setBots] = useState([]);
  const [botId, setBotId] = useState('');

  // the wizard
  const [phase, setPhase] = useState('idle'); // idle | requesting | waiting | done | error
  const [number, setNumber] = useState('');
  const [requested, setRequested] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const [busyNumber, setBusyNumber] = useState(null);
  const [confirm, setConfirm] = useState(null); // { number }
  const [notice, setNotice] = useState(null);   // { kind, text }

  const pollRef = useRef(null);
  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  // ── Load ──────────────────────────────────────────────────────────────────
  const loadDevices = useCallback(async () => {
    try {
      const res = await fetch('/api/pair/devices', { cache: 'no-store' });
      if (res.status === 401) { setAuthState('out'); return; }
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Could not load your devices.');
      setDevices(Array.isArray(d.devices) ? d.devices : []);
      setPlan(d.plan || 'FREE');
      setMaxDevices(Number(d.maxDevices) || 1);
      setLoadError('');
    } catch (e) {
      setLoadError(humaniseError(e, 'Could not load your devices.'));
      setDevices([]);
    }
  }, []);

  const loadBots = useCallback(async () => {
    try {
      const res = await fetch('/api/pair/bots', { cache: 'no-store' });
      if (!res.ok) return;
      const d = await res.json();
      const list = Array.isArray(d.bots) ? d.bots : [];
      setBots(list);
      if (list.length) setBotId((prev) => (list.some((b) => b.id === prev) ? prev : list[0].id));
    } catch {
      // The selector is optional: without it the API picks the bot itself.
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        if (cancelled) return;
        if (!res.ok) { setAuthState('out'); return; }
        const d = await res.json();
        if (cancelled) return;
        setAccount(d.user || null);
        setAuthState('in');
        loadDevices();
        loadBots();
      } catch {
        if (!cancelled) setAuthState('out');
      }
    })();
    return () => { cancelled = true; };
  }, [loadDevices, loadBots]);

  useEffect(() => stopPolling, [stopPolling]);

  // ── Sign in ───────────────────────────────────────────────────────────────
  // The live API verifies the password and replies with a Set-Cookie; the bridge
  // re-issues that cookie for this domain, which is the only reason a session
  // started here can then be used on the /api/pair/* calls below.
  const signIn = async () => {
    setLoginBusy(true);
    setLoginError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const d = await res.json().catch(() => ({}));

      if (!res.ok) {
        setLoginError(
          res.status === 429
            ? 'Too many attempts just now. Please wait a minute and try again.'
            : humaniseError(d.error || 'Check your email and password.')
        );
        return;
      }

      setPassword('');
      setAccount(d.user || null);
      setAuthState('in');
      loadDevices();
      loadBots();
    } catch (e) {
      setLoginError('We could not reach the server. Check your connection and try again.');
    } finally {
      setLoginBusy(false);
    }
  };

  // ── Pairing ───────────────────────────────────────────────────────────────
  const poll = (requestId) => {
    stopPolling();
    let attempts = 0;

    const check = async () => {
      attempts += 1;
      try {
        const res = await fetch(`/api/pair?requestId=${encodeURIComponent(requestId)}`, { cache: 'no-store' });
        const d = await res.json();

        if (d.status === 'done') {
          stopPolling();
          if (d.result?.code) {
            setCode(String(d.result.code));
            setPhase('done');
            // The session shows up in the list once WhatsApp confirms it, which
            // is usually a moment after the code is displayed.
            setTimeout(loadDevices, 4000);
          } else {
            setPhase('error');
            setError('The pairing finished but no code came back. Please try again.');
          }
          return;
        }

        if (d.status === 'failed') {
          stopPolling();
          setPhase('error');
          setError(humaniseError(d.error || 'Pairing failed. Please try again.'));
        }
      } catch {
        // A dropped poll is not a failed pairing — keep going until the limit.
      }

      if (attempts >= POLL_LIMIT) {
        stopPolling();
        setPhase('error');
        setError('That took longer than expected, so we stopped waiting. Please start again.');
      }
    };

    check();
    pollRef.current = setInterval(check, POLL_MS);
  };

  const startPairing = async () => {
    const problem = numberProblem(number);
    if (problem) { setPhase('error'); setError(problem); return; }

    const digits = String(number).replace(/\D/g, '');
    setPhase('requesting');
    setError('');
    setCode('');
    setCopied(false);
    setRequested(digits);
    setNotice(null);

    try {
      const res = await fetch('/api/pair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: digits, ...(botId ? { bot: botId } : {}) }),
      });
      const d = await res.json().catch(() => ({}));

      if (!res.ok) {
        setPhase('error');
        setError(humaniseError(d.error || 'Could not start pairing.'));
        return;
      }
      if (d.botName && !botId) setBotId(d.bot || '');
      setPhase('waiting');
      poll(d.requestId);
    } catch (e) {
      setPhase('error');
      setError('We could not reach the server. Check your connection and try again.');
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard blocked (http, or a denied permission) — the code is on screen
      // and selectable, so this is not worth an error message.
    }
  };

  const unlink = async (target) => {
    setBusyNumber(target);
    try {
      const res = await fetch('/api/pair/unlink', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: target, action: 'unlink', ...(botId ? { bot: botId } : {}) }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || 'Could not unlink that device.');
      setNotice({ kind: 'success', text: `${prettyNumber(target)} has been unlinked.` });
      await loadDevices();
    } catch (e) {
      setNotice({ kind: 'error', text: humaniseError(e, 'Could not unlink that device.') });
    } finally {
      setBusyNumber(null);
      setConfirm(null);
    }
  };

  const reset = () => {
    stopPolling();
    setPhase('idle');
    setCode('');
    setError('');
    setRequested('');
  };

  // ── Signed out ────────────────────────────────────────────────────────────
  if (authState === 'checking') {
    return <LoadingState message="Checking your session…" minHeight={220} />;
  }

  if (authState === 'out') {
    return (
      <Card>
        <CardHeader
          title="Sign in to link your WhatsApp"
          description="Pairing needs an account so the bot knows which number belongs to you."
          icon={<Icons.Shield size={18} />}
        />
        <div style={{ padding: '0 20px 20px', display: 'grid', gap: 16 }}>
          {/* The credentials are checked by the live MZAZI API — this form only
              forwards them. It exists here rather than linking to mzazi.shop
              because a session created there belongs to THAT domain: it could
              never authenticate a request made from this one. */}
          <form
            onSubmit={(e) => { e.preventDefault(); signIn(); }}
            style={{ display: 'grid', gap: 12 }}
          >
            <div>
              <label className="label" htmlFor="login-email">Email</label>
              <input
                id="login-email"
                className="input"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="login-password">Password</label>
              <input
                id="login-password"
                className="input"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {loginError && <Alert kind="error" title="Could not sign you in">{loginError}</Alert>}

            <Button
              type="submit"
              variant="primary"
              block
              loading={loginBusy}
              loadingText="Signing in…"
              icon={<Icons.User size={16} />}
            >
              Sign in
            </Button>
          </form>

          <p style={{ margin: 0, fontSize: 13.5, color: 'var(--muted)', textAlign: 'center' }}>
            No account yet?{' '}
            <a
              href={`${site.accountBase}/signup`}
              target="_blank"
              rel="noopener noreferrer"
              className="link"
            >
              Create one on mzazi.shop
            </a>{' '}
            — the same account works here straight away.
          </p>
        </div>
      </Card>
    );
  }

  // ── Signed in ─────────────────────────────────────────────────────────────
  const stepIndex = phase === 'idle' ? 0 : phase === 'done' ? 3 : 1;
  const atLimit = devices && devices.length >= maxDevices;
  const online = bots.find((b) => b.id === botId);

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      {notice && (
        <Alert kind={notice.kind} title={notice.kind === 'error' ? 'That did not work' : 'Done'}>
          {notice.text}
        </Alert>
      )}

      <Card>
        <CardHeader
          title="Link a WhatsApp number"
          description={online ? `Pairing into ${online.name}.` : 'Pairing into MZAZI XMD.'}
          icon={<Icons.Link size={18} />}
          action={plan ? <Badge tone="brand">{plan} plan</Badge> : null}
        />

        <div style={{ padding: '0 20px 20px', display: 'grid', gap: 18 }}>
          <WizardSteps steps={STEPS} current={stepIndex} />

          {/* ── Step 1: the number ── */}
          {phase === 'idle' && (
            <div style={{ display: 'grid', gap: 12 }}>
              {atLimit && (
                <Alert kind="warn" title="You are at your device limit">
                  Your {plan} plan allows {maxDevices} linked {maxDevices === 1 ? 'number' : 'numbers'} and
                  you already have {devices.length}. Unlink one below, or upgrade on mzazi.shop.
                </Alert>
              )}

              {bots.length > 1 && (
                <div>
                  <label className="label" htmlFor="pair-bot">Which bot</label>
                  <select
                    id="pair-bot"
                    className="input"
                    value={botId}
                    onChange={(e) => setBotId(e.target.value)}
                  >
                    {bots.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="label" htmlFor="pair-number">WhatsApp number</label>
                <input
                  id="pair-number"
                  className="input mono"
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="254785016388"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') startPairing(); }}
                  aria-describedby="pair-number-hint"
                />
                <p className="field-hint" id="pair-number-hint">
                  International format, digits only — no +, spaces or dashes.
                </p>
              </div>

              <div>
                <Button
                  variant="primary"
                  onClick={startPairing}
                  disabled={atLimit}
                  icon={<Icons.Zap size={16} />}
                  block
                >
                  Generate pairing code
                </Button>
              </div>
            </div>
          )}

          {/* ── Step 2: waiting for the code ── */}
          {(phase === 'requesting' || phase === 'waiting') && (
            <div style={{ display: 'grid', gap: 14 }}>
              <StatusIndicator
                status="warn"
                pulse
                label={phase === 'requesting' ? 'Asking WhatsApp for a code…' : 'Waiting for your code…'}
              />
              <p style={{ margin: 0, color: 'var(--muted)', fontSize: 14 }}>
                This usually takes a few seconds. Keep this page open — the code will appear here.
              </p>
              <div>
                <Button variant="ghost" size="sm" onClick={reset}>Cancel</Button>
              </div>
            </div>
          )}

          {/* ── Step 3: the code ── */}
          {phase === 'done' && (
            <div style={{ display: 'grid', gap: 16 }}>
              <div>
                <p className="label" style={{ marginBottom: 8 }}>Your pairing code</p>
                <button
                  type="button"
                  onClick={copyCode}
                  className="card mono tnum"
                  style={{
                    width: '100%', padding: '18px 16px', cursor: 'pointer',
                    fontFamily: 'var(--font-mono)', fontSize: 'clamp(24px, 6vw, 34px)',
                    fontWeight: 700, letterSpacing: '0.16em', textAlign: 'center',
                    color: 'var(--brand)', background: 'var(--brand-tint)',
                    border: '1px dashed var(--brand-soft)',
                  }}
                  aria-label={`Pairing code ${code.split('').join(' ')}, tap to copy`}
                >
                  {code}
                </button>
                <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
                  <Button size="sm" variant="ghost" onClick={copyCode} icon={<Icons.Copy size={15} />}>
                    {copied ? 'Copied' : 'Copy code'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={reset} icon={<Icons.Refresh size={15} />}>
                    New code
                  </Button>
                </div>
              </div>

              <Alert kind="brand" title="Now type it on your phone">
                <ol style={{ margin: '6px 0 0', paddingLeft: 18, lineHeight: 1.8 }}>
                  <li>Open <strong>WhatsApp</strong> on {prettyNumber(requested)}</li>
                  <li>Go to <strong>Settings → Linked devices</strong></li>
                  <li>Tap <strong>Link a device</strong>, then <strong>Link with phone number instead</strong></li>
                  <li>Enter the {String(code).length}-character code above</li>
                </ol>
              </Alert>

              <p style={{ margin: 0, fontSize: 13.5, color: 'var(--muted)' }}>
                Codes expire quickly. If it is refused, generate a new one.
              </p>
            </div>
          )}

          {/* ── Anything that went wrong ── */}
          {phase === 'error' && (
            <div style={{ display: 'grid', gap: 14 }}>
              <Alert kind="error" title="Pairing did not complete">{error}</Alert>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <Button variant="primary" onClick={reset} icon={<Icons.Refresh size={16} />}>
                  Try again
                </Button>
                <Button variant="ghost" href="/faq">Common questions</Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* ── Devices ── */}
      <Card>
        <CardHeader
          title="Your linked devices"
          description={
            devices === null
              ? 'Loading…'
              : `${devices.length} of ${maxDevices} ${maxDevices === 1 ? 'device' : 'devices'} used`
          }
          icon={<Icons.Phone size={18} />}
          action={
            <Button size="sm" variant="ghost" onClick={loadDevices} icon={<Icons.Refresh size={15} />}>
              Refresh
            </Button>
          }
        />

        <div style={{ padding: '0 20px 20px' }}>
          {loadError && <Alert kind="error" title="Could not load your devices">{loadError}</Alert>}

          {!loadError && devices === null && <LoadingState message="Loading your devices…" minHeight={140} />}

          {!loadError && devices && devices.length === 0 && (
            <EmptyState
              icon={<Icons.Phone size={26} />}
              title="No devices linked yet"
              description="Pair a number above and it appears here within a few seconds of you entering the code."
              compact
            />
          )}

          {!loadError && devices && devices.length > 0 && (
            <div style={{ display: 'grid', gap: 10 }}>
              {devices.map((d) => {
                const isBusy = busyNumber === d.number;
                const bot = bots.find((b) => b.id === d.bot);
                return (
                  <div
                    key={d.number}
                    className="row-item"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
                      opacity: isBusy ? 0.6 : 1,
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        width: 38, height: 38, flex: '0 0 38px', borderRadius: 'var(--r-md)',
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        background: 'var(--good-tint)', color: 'var(--good)',
                      }}
                    >
                      <Icons.WhatsApp size={18} />
                    </span>

                    <div style={{ minWidth: 0, flex: '1 1 180px' }}>
                      <p className="mono" style={{ margin: 0, fontWeight: 700, color: 'var(--ink)', fontSize: 15 }}>
                        {prettyNumber(d.number)}
                      </p>
                      <p style={{ margin: '3px 0 0', fontSize: 13, color: 'var(--muted)' }}>
                        {d.connectedAt ? `Linked ${new Date(d.connectedAt).toLocaleDateString()}` : 'Linked'}
                        {bot ? ` · ${bot.name}` : ''}
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto' }}>
                      <StatusIndicator status="good" label="Active" />
                      <Button
                        size="sm"
                        variant="danger"
                        disabled={isBusy}
                        loading={isBusy}
                        onClick={() => setConfirm({ number: d.number })}
                        icon={<Icons.LogOut size={15} />}
                      >
                        Unlink
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => unlink(confirm?.number)}
        loading={!!busyNumber}
        danger
        title="Unlink this device?"
        confirmLabel="Unlink"
        description={
          confirm
            ? `${prettyNumber(confirm.number)} will stop responding to commands immediately. You can pair it again at any time.`
            : ''
        }
      />
    </div>
  );
}

