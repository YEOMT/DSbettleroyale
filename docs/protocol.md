# Protocol v33

Browser native WebSocket ↔ Node ws, JSON, compression disabled. HELLO must match protocolVersion, contentHash, engineRevision and buildId. Tokens are never query parameters.

AUTH (teacher secret) → CREATE; students JOIN with code/name. SESSION returns an opaque resume capability. RESUME increments connectionEpoch and supersedes the previous socket. All room commands carry roomInstanceId, matchId and connectionEpoch; combat commands also carry lifeSeq. Room number and nickname cannot recover an identity.

INPUT_BATCH contains up to four fixed-step intention samples. ACTION, quiz, reroll, augmentation and host commands use requestId. A bounded member ledger returns the original result for an identical retry; different payload with the same requestId is rejected. Input, action and event sequences are separate. Accepted ACTION means queued; SELF_STATE reports actual resolved/fired sequences.

QUIZ answer option IDs are opaque. Correctness, score and reroll allowance stay on the server. DRAFT_REROLL validates the current revision before atomically replacing the card and decrementing allowance. Zero-score students still receive one valid card. Wrong-answer lock is 1500 ms; correct-answer lock is 320 ms, as in the baseline.

Room state contains no quiz answer key. The teacher receives the member list and scores; each student receives only their own quiz/draft/private growth state. FULL_STATE explicitly marks expired event history and establishes a fresh cursor. Resume does not replay historical combat effects.
