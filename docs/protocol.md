# Protocol v33

Browser native WebSocket ↔ Node ws, JSON, compression disabled. HELLO must match protocolVersion, contentHash, engineRevision and buildId. Tokens are never query parameters.

AUTH (teacher secret) → CREATE; students JOIN with code/name. SESSION returns an opaque resume capability. RESUME increments connectionEpoch and supersedes the previous socket. All room commands carry roomInstanceId, matchId and connectionEpoch; combat commands also carry lifeSeq. Room number and nickname cannot recover an identity.

INPUT_BATCH contains up to four fixed-step intention samples. ACTION, quiz, reroll, augmentation and host commands use requestId. A bounded member ledger returns the original result for an identical retry; different payload with the same requestId is rejected. Input, action and event sequences are separate. Accepted ACTION means queued; SELF_STATE reports actual resolved/fired sequences.

QUIZ answer option IDs are opaque. Correctness, score and reroll allowance stay on the server. DRAFT_REROLL validates the current revision before atomically replacing the card and decrementing allowance. Zero-score students still receive one valid card. Wrong-answer lock is 1500 ms; correct-answer lock is 320 ms, as in the baseline.

Room state contains no quiz answer key. The teacher receives the member list and scores; each student receives only their own quiz/draft/private growth state. FULL_STATE explicitly marks expired event history and establishes a fresh cursor. Resume does not replay historical combat effects.

## v33.2 presentation contract

ROOM_STATE includes serverTime/quizEndsAt/battleStartedAt. Clients derive display countdowns from that deadline; reconnect/render does not extend it. Only the server changes phase. Teacher-only roster draft metadata supports the original assignment roster. Students retain only their own draft.

SNAPSHOT adds display-only actor visual fields, presentation (final/end/focus/announcement/feed), original zone geometry metadata and native projectile vfx/orbit/face fields. Teacher hostEffects carries bounded engine particles, rings, signatures, floating text and screen feedback. getVisibleState removes hostEffects and snapshotEncoder excludes it from the shared prefix; the privacy test exercises both paths. Native turret rows are interest-filtered per student. Private self.capturePoints is the original server capture record, never client-scored.

DRAFT_RECOVER has an optional playerId. Students may recover only themselves; hosts may refresh a student in DRAFT. A valid card is unchanged. A missing/invalid card is reconstructed from the existing deterministic initial/reroll stream with spent credits retained. Recovery cannot grant a free reroll. Duplicate requests retain the standard command ledger rules.

A successful REMATCH ACK may establish a new match scope only when its requestId matches this client's pending REMATCH and that pending command belongs to the current old match. Arbitrary/late command ACKs cannot change scope. Combat execution, 60 Hz physics, content hash and protocol authority remain unchanged; deploy client and server from the same build.
