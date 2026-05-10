# Security Policy

## Supported Versions

| Version           | Supported             |
| ----------------- | --------------------- |
| `0.1.x` (current) | ✅ Active development |
| Earlier           | ❌ Not supported      |

ZerithDB is in **alpha**. APIs and security properties are subject to change.

---

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, email **security@zerithdb.dev** with:

- A description of the vulnerability and its potential impact
- Steps to reproduce (proof of concept if possible)
- Affected version(s) and package(s)
- Any suggested mitigations

You will receive an acknowledgement within **48 hours** and a full response within **7 days**.

We follow **coordinated disclosure** — we will work with you on a fix before any public disclosure,
and we will credit you in the security advisory unless you prefer to remain anonymous.

---

## Security Model

Understanding ZerithDB's security design helps identify what is and isn't in scope:

### In Scope (we consider these bugs)

- Broken cryptographic verification — a forged message that passes `auth.verify()`
- Private key leakage through a public API or log output
- Cross-origin data access — one app reading another app's IndexedDB namespace
- CRDT update injection without a valid signature
- Signaling server routing data to the wrong room

### Out of Scope (by design, documented limitations)

- **Private keys in localStorage** — vulnerable to XSS. We know. Mitigation planned for v0.5
  (non-extractable WebCrypto keys). For now, treat XSS prevention as the app developer's
  responsibility.
- **Peer data visibility** — any peer with the room ID can read all data in that room. Fine-grained
  access control is on the roadmap (v0.4). ZerithDB is not suitable for private data without
  collection-level encryption (also v0.4).
- **Signaling server metadata** — the signaling server sees IP addresses of connecting peers. This
  is inherent to WebSocket connections.
- **Browser security bugs** — vulnerabilities in V8, WebRTC stack, or IndexedDB implementations are
  out of scope.

---

## Responsible Disclosure Hall of Fame

_We will list security researchers who responsibly disclosed vulnerabilities here._

| Researcher   | Vulnerability | Fixed in |
| ------------ | ------------- | -------- |
| _(none yet)_ |               |          |
