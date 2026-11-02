# Architecture

The server owns room phases, identities, quizzes, drafts, combat and results. The production engine is ordinary ES modules under packages/engine/src. It contains the original 77-character code, split into 26 responsibility modules and 307 source units, with a separate binding context for every room. There is no browser, DOM shim, eval, VM or original-HTML loading in production.

The migration tool under tools/baseline is development-only. It preserves original initialization/override order and emits docs/source-map.json. It is not run by the server or client. Browser/Node numeric comparison permits 1e-10 absolute error for JS engine floating-point differences; discrete events, damage decisions, life and entity counts must match.

Time is injected as active simulation milliseconds. Each step is exactly 1000/60 ms. The original setTimeout result transition is converted to a server-owned finish signal. Rendering and participant canvas allocation are absent from the headless engine. Event sinks carry effects to clients.

Compatibility debt: original transient FX state and RNG draw order are currently preserved because original cosmetic draws affect later combat RNG. A complete separation of this legacy RNG consumption is still required; do not claim A05 complete solely from the two-room isolation test.
