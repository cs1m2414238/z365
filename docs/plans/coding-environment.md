# Coding environment design

Start from the existing challenge catalog and the verified Z365 session. The current challenge response omits solution templates, and PostgreSQL already has submissions and user progress tables. The runner directory is a scaffold.

1. Connect a paginated problem explorer and slug route to the existing catalog. Limit public queries to published problems and move challenge authoring behind an administrator permission.
2. Add versioned test cases and separate public examples from hidden grading cases. Author the first problem and its expected results as a migration. Add an editor and language choice only when the corresponding execution contract is available.
3. Persist an execution request and its job together. Use opaque job IDs scoped to the submitting account, bounded source/input/output and idempotent retries. An isolated worker claims jobs, grades deterministically and persists the verdict. Only accepted submissions update solve progress.
4. Verify one language in a dedicated non-root Linux runner with a read-only base filesystem, a disposable work directory, no network, bounded CPU/memory/output, a deadline and cleanup. Keep credentials and the host container socket outside execution environments.
5. Exercise accepted, wrong answer, compile error, runtime error, time and memory limit, and escape-attempt fixtures before enabling Run or Submit. Expand the language set after the first runner passes.

The profile integration tests used native PostgreSQL. Docker was unavailable in the verification environment, so the runner still needs a suitable isolated test host before enabling submitted-code execution.
