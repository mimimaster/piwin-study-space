# Study Space (optional standalone extension)

Install from the piwin extension marketplace as `mimimaster/piwin-study-space`. This repository is the source; piwin does not bundle or auto-enable it.

Original, dependency-free-at-runtime teaching extension for **Pi 0.84.2** in piwin. The Host supplies Pi's Extension API and `typebox` 1.1.38. There is no server, custom scheduler/FSRS, native-store access, application import, install script, or automatic enablement. This directory is portable as a separate package; it is deliberately **outside bundled-extensions**. Install/select/enable it only through an explicit user-managed extension workflow. Nothing in this implementation installs it.

## Commands and lifecycle

- `/teacher`: choose a teaching action from a basic selection dialog.
- `/teacher-ta [topic]`: answer the current code doubt without a course when no topic is given. An explicit topic creates a TA course without imposing a curriculum.
- `/teacher-learn [topic]`: create a course and start staged learning; an omitted topic opens a basic input dialog.
- `/teacher-resume [courseId]`: choose a saved course by topic, or pass its ID explicitly, and reload saved profile/path/evidence in learn mode. Never replay native mutations.
- `/teacher-review [courseId]`: choose a saved course for native scheduled review.
- `/teacher-status`: show readable saved practice counts, planned stages and next exercise above the composer; without UI, report textual capabilities/preferences/course IDs.
- `/teacher-off`: clear teaching mode and its UI, preserving saved data and ordinary coding rules.

All original `/teacher <action>` forms remain supported. In piwin's slash and extension menus, every shortcut is independently discoverable; newer Hosts/Desktop show the literal bilingual purpose descriptions, so Chinese purpose searches such as `/助教` and `/复习` work. Course pickers show topic names, with ordinal suffixes to distinguish duplicate names; no UUID entry is needed with dialog UI. Empty lists explain how to create a course. Cancelling a picker preserves the current mode/course, and a session change cancels pending activation.

Topic/ID arguments work without UI. Topicless TA needs no dialog or course. Commands select the role; send an ordinary message afterward to begin teaching. Role changes wait for idle. Load, session start/switch, shutdown and runtime replacement default to off. Active prompts are additive and never change the active toolset. `/teacher-status` shows saved evidence, never a mastery percentage. No custom TUI/webview is required. New shortcuts require extension 0.1.1; descriptions require a compatible new Host/Desktop. Use the normal installer/version selection workflow rather than editing an installed immutable revision.

Learning uses short explanation → actual user attempt → feedback → concrete evidence → next practice. No medical/learner condition is assumed, no unsupported mastery flag exists, and no default lesson card is made.

## Own data and local tool

Only `${PIWIN_ROOT}/study-space` (fallback `~/.piwin/study-space`) is accessed. `flashcards` is never accessed by the extension. Each UUID course uses one versioned JSON document: stable `courseId`, deterministic `study-space:<courseId>` deck, profile, staged path, evidence and card intentions/attempts. Renaming a topic never changes its ID/deck. `preferences.json` contains the versioned persistent `cards: ask|never` preference. Uninstall/off does not delete data.

`study_space` rejects **every** action while off; it cannot activate/switch roles or take a path/deck/root parameter. Actions:

- `status`, `list`, `get` (current course; status includes preference storage revision).
- `rename` (`topic`), `profile` (`profile`, `path`: learning stages).
- `evidence` (`prompt`, actual `userAnswer`, `assessment`, `nextPractice`, `gap`: concrete string or null).
- `intention` (`evidenceId`, `cards`: exact basic front/back or cloze text).
- `preference` (`cards`: `never` or `ask`). Re-enabling `ask` requires user confirmation.

Every write takes `expectedRevision`; a missing preference document uses **-1**, a new course starts at **0**. The action schema and runtime parser reject extra/unknown fields. Evidence gets its own schemaVersion/revision/UUID. An intention requires recorded evidence of a gap; no-gap diagnostic results cannot yield cards. `never` blocks intentions and creation, including after resume.

The exclusive cross-process `.write-lock` directory protects revision CAS; competing writes fail rather than losing updates. Writes use an exclusive same-directory temporary file, file fsync, atomic rename, directory fsync, abort checks before commit, and finally cleanup. Malformed JSON, unknown versions, symlink descendants, injected IDs/paths and unexpected values fail; they are not silently reset. A legitimately chosen PIWIN_ROOT symlink is canonicalized as a trusted root. This is not a sandbox against a malicious local process swapping directories between OS operations (Node stdlib has no portable openat transaction).

**Manual crash recovery:** if a process died with `.write-lock` or `.tmp-<UUID>` present, first stop/verify **all writers** are absent and back up the data. Only then manually remove the abandoned lock/temp. There are no stale-lock timers or automatic takeovers. Refetch documents after any revision conflict. Do not modify course/deck identity to repair a topic name.

## Native routing, consent and uncertainty

The model calls native Host tools in its **current Run**; this extension neither calls them nor grants Host permissions. Direct tools and Toolbox `action:call` targets `flashcard_create`, `flashcard_batch_create`, `flashcard_study_write` are gated only while teaching is active. Unrelated tools and all existing tools while off are untouched.

Toolbox-only visibility is **discoverable**, not unavailable. Prompts/status instruct `piwin_toolbox search(query="flashcard")`, then describe/call the exact targets. If discovery does not expose a suitable tool, report that honestly and teach text-only. Never guess native schemas/identity/CAS/idempotency fields. Native scheduled tools use read catalog/get/operation and write start(scheduled scope all|deck)/claim/checkpoint/rate/undo/pause/resume/end; no goto/next/sequence. Stale snapshot → refetch; uncertain mutation → query its **original** operation key. Never automatically claim another client's control.

Creation requires an unattempted durable intention, exact content/deck match, a recorded demonstrated gap, enabled preference, and a dialog showing **actual content and user evidence**. For this first version, proposed native card inputs are restricted to model/content/deck; additional attribution fields are rejected, not silently dropped. Before allowing Host execution, the hook atomically saves a pending attempt. Host admission still follows. Native **claim and rate** are separately user-confirmed in the hook even if Host permissions are bypassed; the dialog shows the full actual native fields (round/rating/CAS) and current recorded assessment/attempt. Without UI these confirmations fail closed; plain textual consent is not treated as a native mutation grant.

The result hook reads full result JSON from content, not summary details. Single `{card,duplicate,display}` and batch `{created: [...],skipped: [...],display}` link only actual returned IDs whose deck/content matches. `details.created` is a count, never an ID list. Partial/unknown outcomes remain explicit; no guessed IDs or fabricated completion. Result persistence conflicts leave the durable attempt uncertain.

If a result is lost or runtime is replaced, the attempt remains pending. Resume requires listing the native course deck before reconciliation and never replays the batch. Listing can add **observed candidate IDs** to an uncertain attempt but previews do not prove the full answer; state stays partial/unknown, even if all fronts appear. Known successes are retained. There is deliberately no model-supplied "mark complete", manual ID injection or uncertain-card retry escape hatch. Resolving ambiguous preview-only identity requires native inspection/user follow-up; the package does not falsely settle it or retry the original content.

## Development / verification

With the declared compatible dev tools available independently:

```sh
pnpm test
pnpm typecheck
```

No parent tsconfig, main-repo runtime imports, vendor code, node_modules or lockfile is part of this directory. Tests use a mock Pi API and disposable own-data roots, including real parallel child-process lock/CAS writers. The host-runtime tests separately exercise real Pi SDK and spawned RPC sessions with this same extension, a local scripted OpenAI wire, admitted Toolbox calls, actual native cards/FSRS rating/undo, and replacement/resume. They verify the transport and persisted state, not real-model teaching quality or Desktop visual behavior. Package unit tests are **not** native UI confirmation/visual verification or complete step4 acceptance. Installing/running personal extensions is outside this step.
