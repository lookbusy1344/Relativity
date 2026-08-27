# Jujutsu (jj) — Reference for Agents and Humans

**Validated:** 2026-08-23 · **jj version:** v0.44.0 · docs: `jj-vcs.dev/latest`

A guide to driving `jj` non-interactively. Written for agents; useful to anyone scripting or
learning jj. Assumes git familiarity.

## Repository layouts — this guide targets colocation (the default)

The supported CLI creates Git-backed repositories in two layouts. The layout decides how well
other Git-aware tools see the repository.

1. **Colocated Git repo (default)** — `.jj` and a real `.git` live side by side over one working
   tree. jj imports/exports git state on every command, so `git`, `gh`, IDEs, and CI all see a
   normal git repo. As of v0.44 this is what `jj git init` and `jj git clone` produce with no
   flags.
2. **Non-colocated Git repo** — only `.jj` at the root; the git store is hidden inside
   `.jj/repo/store/git`. Same Git backend (push/fetch work identically), but external git tools
   can't see it without being pointed at it. Opt in with `--no-colocate`, or set
   `git.colocate = false` in config.

jj also has internal/experimental non-Git commit backends, but v0.44 has no general-purpose
`jj init` command for creating a native repository. `jj git init` is the supported initializer;
native storage is not a third practical setup choice for normal CLI workflows.

**This guide targets #1, colocation** — jj's default and the most interoperable model for GitHub.
Two costs: jj imports/exports on each command (a slowdown mainly in repos with very many refs),
and mutating Git commands can create confusing intermediate states that jj cannot fully model.
Prefer jj for mutations, and never run mutating `git` and `jj` commands concurrently against the
shared store.

### When to opt out — non-colocation (`--no-colocate`)

Both models share the Git backend, so `jj git push`/`fetch` are identical; the only difference is
whether external git tools see the repo. Choose non-colocation when you want git **structurally
fenced off**: with no top-level `.git`, no stray `git commit` from an editor, hook, or an agent's
habit can move a branch behind jj's back. jj becomes the single writer — the wrong tool is
*unreachable*, not merely discouraged. Also worth it for repos with huge ref counts (skips the
import/export overhead) or environments where a visible `.git` confuses tooling. The jj docs
call these advantages "minor" — for GitHub work leaning on `gh`, colocation's zero-friction
interop usually wins.

Under non-colocation the git store still exists; point git at it (`jj git root` prints its path):

```bash
# gh and ref/metadata-only git commands need just GIT_DIR:
GIT_DIR=$(jj git root) gh pr list
GIT_DIR=$(jj git root) git log --oneline

# git commands that read/write working-tree files also need the work tree:
GIT_DIR=$(jj git root) GIT_WORK_TREE=$(jj workspace root) git status

# Set both for a whole shell session:
export GIT_DIR=$(jj git root)
export GIT_WORK_TREE=$(jj workspace root)
gh pr create --fill
```

Caveats: this is a deliberate escape hatch, so don't leave those vars exported in a session that
also runs jj mutating commands — that reintroduces the two-writer race you chose non-colocation
to avoid. For read-only inspection (`gh`, `git log`, `git show`) it's safe and handy.

Convert an existing jj repository without reinitializing it:

```bash
jj git colocation status
jj git colocation enable      # expose the Git store as a top-level .git
jj git colocation disable     # move the Git store behind .jj
```

## Mental model

jj differs from git in ways that change how you script it:

- **The working copy is a commit.** There is no staging area and no `git add`. At the start of
  almost every jj command, changed files are snapshotted into the current change (`@`). Until
  that next snapshot, freshly edited bytes still exist only in the filesystem.
- **Change IDs are stable across rewrites; commit IDs identify exact versions.** A logical change
  keeps its letter-based *change ID* while amend/rebase/describe creates a new hex *commit ID*.
  See the dedicated section below for divergence and scripting caveats.
- **Editing history is normal and safe.** Rewriting a commit automatically rebases its
  descendants. There is no `--force`; there is `jj undo`.
- **Conflicts are first-class.** A merge/rebase never stops. Conflicts are recorded *in the
  commits* and you resolve them whenever you like. Commands don't abort halfway.
- **The operation log records everything.** Every jj command that changes the repo is an
  operation. `jj op log`, `jj undo`/`redo`, `jj op revert`, and `jj op restore` provide
  repository-wide recovery.

`@` is the revset symbol for the current working-copy commit. Use it anywhere a command accepts a
revision to target the current change, for example `jj describe -r @`, `jj squash -r @`, or
`jj log -r @`. It is not a change ID itself and moves when `jj new`, `jj commit`, or `jj edit`
changes the working-copy revision. Capture the full change ID when a durable identifier is needed.

`@-` = parent of `@`. `foo-` = parent of `foo`, and `foo+` = child of `foo`.

## Rules for agents and scripts

- Disable the pager with `--no-pager` or `[ui] paginate = "never"`.
- Avoid editors: pass `-m "msg"` to `describe`/`commit`, and use paths or explicit revisions
  instead of interactive `split`/`squash -i`. Two non-interactive forms still open an editor:
  `jj split <paths>` prompts for the first change's message (pass `-m`), and `jj squash` prompts
  to merge descriptions when source and destination both have one (pass `-m`, or `-u` to keep
  the destination's).
- Name logical work by full change ID; commit hashes change after rewrites.
- Give history-changing commands an explicit revset and scope. In particular, prefer
  `jj rebase -r/-s/-b ... -o ...` over the implicit branch containing `@`.
- Use `--no-graph -T <template>` for parseable output and predicates such as `conflicts()` or
  `empty()` instead of parsing rendered status text.
- Use `--ignore-working-copy` for read-only inspection only when a possibly stale snapshot is
  acceptable.
- Immutable commits are protected. Do not routinely bypass the guard with `--ignore-immutable`.
- When an operation goes wrong, inspect `jj op log` and prefer `jj undo` over manual graph repair.
- `-R <path>` targets another repository; `--at-op <op>` inspects a past operation without
  changing current state.

## Change IDs versus commit IDs

The precise terminology is:

- A **change** is jj's logical unit of work across rewrites. Its **change ID** is normally shown
  as lowercase letters, such as `qpvuntsm`.
- A **commit** is one exact, immutable version of a change: tree contents, parents, description,
  author metadata, and so on. Its **commit ID** is a hexadecimal object hash, such as `d5e03cfa`.

When jj rewrites a change, it creates a new commit and hides the superseded one. The change ID
stays the same; the commit ID changes. Editing files, changing the description, rebasing, conflict
resolution, signing, and automatic descendant rebasing can all create new commit IDs. Descendant
changes retain their own change IDs even though their commit IDs change when their parents do.

```text
logical change:  qpvuntsm  (stable through the rewrite)
before rewrite:  qpvuntsm  d5e03cfa
after rewrite:   qpvuntsm  91ab72e4
```

Use a **change ID** when you mean "the current visible version of this logical change". This is
normally the right identifier for `jj edit`, `jj squash`, `jj rebase`, bookmarks, and automation
that must survive rewrites. Use the full change ID in durable scripts; a displayed short prefix can
later become ambiguous as the repository grows.

Use a **commit ID** when you need one exact version: recovering a hidden snapshot from `jj evolog`,
comparing before/after versions, interoperating with Git/GitHub, or disambiguating divergence.
Git identifies the underlying commits, not jj's rewrite lineage, which is why rewriting a pushed
change requires the remote bookmark to move to a new commit hash.

```bash
# Print both full identifiers without parsing human-oriented log output
jj log --no-graph -r @ \
  -T '"change_id=" ++ change_id ++ "\ncommit_id=" ++ commit_id ++ "\n"'

# Follow every stored version of one logical change
jj evolog -r <change-id>
```

A change ID is stable, not an infallible singleton. A **divergent change** has multiple visible
commit IDs for the same change ID and is displayed with `(divergent)`. An ordinary rewrite does
not cause this: it creates a successor and hides its predecessor. Divergence appears when two
processes rewrite the same change, or when something makes a hidden predecessor visible again —
for example, a bookmark, working copy, visible descendant, or fetched descendant. Moving and
pushing a bookmark afterward may correctly select the new tip, but it does not abandon an old
line that is already visible; that line remains as an anonymous head.

jj disambiguates the sides with a **change offset** suffix in both display and revsets: `abc/0`,
`abc/1`, etc. A bare divergent change ID is an error, and jj hints toward the offsets or
`change_id(abc)` (which selects every side at once):

```
Error: Change ID `zsnrrpux` is divergent
Hint: Use change offset to select single revision: zsnrrpux/0, zsnrrpux/1
Hint: Use `change_id(zsnrrpux)` to select all revisions
```

The offset is assigned by commit-ID sort order among the siblings and is recomputed per operation,
so `/0` and `/1` **renumber** as sides are rewritten or abandoned. They are convenient for an
interactive one-shot (`jj abandon 'abc/1'`), but for a scripted or multi-step cleanup resolve each
offset to its hexadecimal commit ID first and drive the rest of the work off that.

Diagnose the whole graph before changing it:

```bash
jj log -r 'divergent()'                         # both versions of every divergent change
jj log -r 'heads(divergent())' --no-graph       # tip of each divergent line
jj log -r 'heads(all())'                        # includes unbookmarked visible heads
jj bookmark list --all-remotes                  # identify which line refs retain

# For two divergent tips, find their last shared commit. Equivalent to
# heads(::<tip-a-commit-id> & ::<tip-b-commit-id>).
jj log --no-graph \
  -r 'fork_point(<tip-a-commit-id> | <tip-b-commit-id>)'

# Given the fork's commit ID, find the first commit on each side.
jj log --no-graph \
  -r 'roots(<fork-commit-id>..(<tip-a-commit-id> | <tip-b-commit-id>))'

# This should be empty before abandoning the range.
jj log -r \
  '<old-root-id>::<old-tip-id> & (bookmarks() | remote_bookmarks())'
jj log -r 'children(<old-tip-id>)'               # inspect anything based on the old tip
```

Endpoints here can be change offsets (`abc/1::def/1`) or hexadecimal commit IDs; the bare change ID
is ambiguous and rejected. Commit IDs are the safer choice for a multi-step cleanup because offsets
renumber between operations.

**Offsets are numbered per change, independently.** Each divergent change sorts its own siblings by
commit ID, so the `/0` of the root and the `/0` of the tip are not guaranteed to lie on the same
line — `abc/0` may be an ancestor of `def/1`, not `def/0`. A mismatched `root/N::tip/M` silently
yields an empty or wrong DAG range rather than an error, and abandoning it hits the wrong commits.
Always resolve the range and eyeball it before destroying anything:

```bash
jj log -r '<old-root>/N::<old-tip>/M'   # confirm these endpoints span one connected line
```

If the old line is an unwanted unpublished stack with no refs or descendants, abandon its complete
inclusive range, then verify that no divergence remains:

```bash
jj abandon '<old-root-commit-id>::<old-tip-commit-id>'
jj log -r 'divergent()'
jj status
```

Abandoning only the old tip is insufficient for a divergent stack: its parent becomes the next
anonymous head and the remaining changes stay divergent. If the old line has a bookmark,
descendants, or published work that must survive, first move or rebase those deliberately rather
than applying this cleanup mechanically. Abandoning a change and creating a replacement also
produces a new change ID; stability applies to the rewrite lineage of the original change, not to
equivalent content recreated later.

Change IDs survive cloning, not just within jj. jj writes each change ID into a header on the
underlying Git commit, so it travels with the commit through a plain `git clone`, not only
`jj git clone`, and through repeated clones. Only rewriting the commit loses it — `git rebase`, a
squash-merge on GitHub, anything that produces a new commit hash — since the header is not part of
Git's own data model.

## Anonymous branches — jj's native local model

Anonymous branching is the normal, recommended jj model for local work. A branch is a fork in the
commit graph; it does not need a name to remain visible or safe. Bookmarks are useful when a
stable human-facing name adds value and are required for conventional Git remote workflows,
but they are not required merely to retain local commits or switch between lines of work.

```bash
jj new trunk() -m "feat: first idea"     # first child of trunk
# ...edit...
jj new trunk() -m "feat: second idea"    # sibling: an anonymous branch from the same parent

jj log -r 'visible_heads()'               # every visible graph head
jj log -r 'heads(all())'                  # equivalent unless hidden commits are introduced
jj log -r 'reachable(@, mutable())'        # mutable stack connected to @
```

An **anonymous head** is a visible commit with no visible descendants and no bookmark required to
keep it alive. Find it by its description/change ID in `jj log`, then use `jj edit <change-id>` or
`jj new <change-id>`. Unlike an unreferenced Git commit, it is part of jj's visible repository
state. It becomes hidden only through an explicit history-changing action such as `jj abandon` or
being superseded by a rewrite.

Create bookmarks at the boundary where names matter: publishing to Git, opening PRs, sharing a
stable handle, or marking a long-lived landmark. Do not create and advance a bookmark after every
local commit merely to imitate Git's current-branch model.

## Setup

```bash
jj git init                 # new repo in cwd — COLOCATED by default (v0.44): .jj + real .git
jj git init --no-colocate   # jj-only: git store hidden in .jj, no top-level .git
jj git clone <url> [dir]    # clone a git remote — also colocated by default
jj git clone --no-colocate <url>

jj config set --user user.name "Name"
jj config set --user user.email "me@example.com"
```

`--colocate` is a no-op in v0.44 (the help says "This is the default"). Flip it globally with
`git.colocate = false`.

### Git reftable incompatibility (v0.44)

jj v0.44 does not import refs from an existing Git repository whose ref storage is `reftable`.
Confirmed failure signature: `jj git init --colocate` reports success, but imports no bookmarks;
`@` is based on `root()` and `jj st` reports every checked-out file as added. The Git commits and
refs remain in `.git`, but jj cannot see the reftable refs.

Use Git's `files` ref backend for a repository that jj will adopt:

```bash
git rev-parse --show-ref-format             # authoritative: prints files or reftable
git clone --ref-format=files <url> [dir]    # prevent reftable on a new clone
git refs migrate --ref-format=files         # migrate an existing clone before jj init
jj git init --colocate
```

`git rev-parse --show-ref-format` reports the repository's effective ref backend regardless of
where Git configuration is defined. If jj was already initialized against reftable, move that
newly-created `.jj` aside, migrate or re-clone, then initialize jj again; do not mistake the
root-based all-files-added change for imported history.

**Identity gotcha:** setting `user.name`/`user.email` only affects *future* commits — it won't
rewrite the author of the working-copy commit that already exists. Set identity before your first
real change, or fix an existing commit's author with `jj metaedit --update-author -r <rev>`.

**Operation identity is separate from commit identity.** `jj op log` and `jj evolog` record who
ran each *operation* (including automatic working-copy snapshots), using `operation.username`/
`operation.hostname` — which default to your OS account name and machine hostname, not `[user]`.
Anonymizing `user.name`/`user.email` does not stop your real OS username/hostname from showing up
in `jj evolog`. Override separately:

```bash
jj config set --user operation.username "Name"
jj config set --user operation.hostname "some-host"
```

Same caveat as commit identity: only affects operations created after the change — existing
op-log/evolog entries keep the old values.

### Repairing commit metadata

`jj metaedit` changes metadata without touching file content. Like any rewrite, it creates new
commit IDs and rebases descendants.

```bash
jj metaedit -r <rev> --author 'Name <me@example.com>'
jj metaedit -r <rev> --update-author              # use configured identity
jj metaedit -r <rev> --update-author-timestamp
jj metaedit -r <rev> --update-change-id           # deliberately break rewrite lineage
```

Generating a new change ID is rarely appropriate; use it only when two commits should no longer
represent versions of the same logical change.

## Inspecting

```bash
jj st                       # snapshot pending edits, then show working-copy status
jj log                      # mutable revisions plus limited immutable context; ~ means elided
jj log -r ::                # complete visible history, including immutable ancestors
jj log -r 'all()'           # all visible heads and their ancestors (equivalent full-history set)
jj log -r '::@'             # ancestors of @
jj log -r 'main..@'         # commits on @ not on main
jj show <rev>               # description + diff of one revision
jj diff [-r <rev>]          # diff of a revision (default @); --git, --stat, -s summary
jj diff --from A --to B
jj interdiff --from A --to B # compare the patch introduced by A with the patch introduced by B
jj evolog [-r <rev>]        # how THIS change evolved over rewrites (jj-specific; was `jj obslog`)
jj evolog -p -r <rev>       # show the patch between each successive version of the change
jj op log                   # operation history (the global undo timeline)
```

Bare `jj log` defaults to mutable revisions plus some context (the `revsets.log` config key), so
imported Git history is often represented by an `(elided revisions)`/`~` node. Use `jj log -r ::` for the full visible history,
`-r <revset>` to narrow it, `--no-graph` for scripts, and `-T <template>` to control output.

### Three different logs — don't confuse them

jj has three log commands answering three different questions:

- **`jj log`** — the **commit graph**: which changes exist and how they relate. The everyday view.
- **`jj op log`** — the **operation history**: every state the *whole repository* has been in. Each
  entry is a complete snapshot (all commits, bookmarks, where `@` pointed) plus the `args:` of the
  command that produced it. This is the global undo timeline that `jj undo`/`jj op restore` walk.
- **`jj evolog -r <change>`** — the **evolution of one change**: every commit ID that one change ID
  has pointed at as you described, edited, squashed, or rebased it. Entries read `<change>/1`,
  `<change>/2`, … (steps back), most are `(hidden)`, and each names the operation that produced it —
  the bridge back to `jj op log`.

`jj obslog` is the former name of `jj evolog`, still aliased in v0.44.

## Making changes

There are two idioms. Pick one and be consistent.

**Describe-then-new (like commit):**
```bash
# edit files...
jj describe -m "feat: thing"   # set message on current change @
jj new                          # start a fresh empty change on top
```

**Commit (closes @ and opens a new one in one step):**
```bash
# edit files...
jj commit -m "feat: thing"      # = describe @ + new
jj commit -i -m "feat: thing"   # select changes to commit; leave the rest in the new @
```

In a colocated repository, leaving completed work in `@` can make Git-facing tools show its patch
as staged or unstaged. Finish with `jj new`, or use `jj commit`, when you want those tools to look
clean. See [Colocated repos — interop rules](#colocated-repos--interop-rules).

Other essentials:
```bash
jj new                          # new empty change on top of @
jj new <rev>                    # new change on top of <rev>
jj new A B                      # merge: new change with parents A and B
jj new <rev> --no-edit          # create a child without moving the working copy
jj new --insert-before <rev>    # insert before rev and rebase rev onto the new change (-B)
jj new --insert-after <rev>     # insert after rev and rebase its children onto the new change (-A)
jj describe -m "msg" [-r <rev>] # set/replace description of any revision
jj edit <rev>                   # make <rev> the working copy (resume editing an old change)
jj abandon <rev>                # drop a change, rebase its descendants onto its parent
```

There is no separate "amend": editing files while `@` points at a change *is* amending it.
To amend an older commit, either `jj edit <rev>` and change files, or edit in `@` and
`jj squash` down (see below).

### Squash workflow — described change plus scratch child

This is a common jj-native alternative to editing the feature change directly. Describe an empty
feature change, create an undescribed child as scratch space, and progressively move accepted work
from the child into the feature:

```bash
jj new trunk() -m "feat(api): add rate limiting"  # described feature change
jj new                                             # undescribed scratch child (@)
# ...edit and test in @...
jj squash src/rate_limiter.rs                      # move selected paths into @-
jj squash -i                                       # interactively choose hunks (human use)
jj squash                                          # move everything remaining into @-
```

The scratch child provides index-like separation without a staging area. After a full squash, jj
abandons the emptied source and gives the workspace a fresh empty change. For unattended agents,
prefer filesets or an explicit destination over `-i`:

```bash
jj squash --into <feature-change-id> <paths>...
```

Use the **edit workflow** (`jj edit`, `next --edit`, `prev --edit`) when direct in-place editing is
clearer. Both workflows produce the same graph; choose per task rather than treating either as a
repository-wide mode.

### Navigating and editing a stack

`next` and `prev` move relative to the current working-copy position. By default they create a
new empty working-copy change at the destination, preserving the change you were editing. Pass
`--edit` to edit the existing destination change directly.

```bash
jj next                         # new empty @ on the next descendant
jj next 2                       # move two revisions forward
jj next --edit                  # edit the next child directly
jj prev                         # new empty @ based on the previous ancestor
jj prev 2 --edit                # edit the ancestor two revisions back
jj next --conflict --edit       # jump to and edit the next conflicted descendant
jj prev --conflict --edit       # jump to and edit the previous conflicted ancestor
```

If there are several possible children, name the intended revision with `jj edit <rev>` rather
than relying on navigation. `ui.movement.edit` changes the default; explicit `--edit` and
`--no-edit` override it.

This is the same editable-stack model as Sapling's `sl prev`/`sl next`
(`https://sapling-scm.com/docs/overview/navigation/`).

## Reorganizing history

```bash
jj squash                       # move @ changes into its parent (@-), like fixup
jj squash -r <rev>              # squash <rev> into its parent
jj squash --into <rev>          # squash @ into an arbitrary ancestor
jj squash -i                    # interactive: pick hunks to move
jj squash <path>...             # only these paths

jj split                        # split @ into two changes (interactive hunk selection)
jj split <path>... -m "msg"     # listed paths go to first change; without -m the editor opens
jj split --parallel <path>...   # split into sibling changes instead of parent + child

jj rebase -s <src> -o <dest>    # move src and its descendants onto dest
jj rebase -b <branch> -o <dest> # move whole branch
jj rebase -r <rev> -o <dest>    # move a single revision
jj rebase -r <rev> -o A -o B    # onto multiple parents (creates a merge)
jj rebase -r <rev> -A A -B B    # insert rev after A and before B

jj absorb                       # auto-distribute @ changes into the ancestor commits
                                # that last touched those lines (great for review fixups)
jj absorb -t <revset>           # restrict destinations to <revset> (default mutable());
                                # hunks it can't attribute to that set stay in @
jj absorb <path>...             # only absorb changes to these paths
jj absorb -i                    # interactively pick hunks to absorb (human use)

jj duplicate <rev> -o <dest>    # copy a change elsewhere
jj restore [--from <rev>] <path>...  # restore file contents from another revision
jj restore -i                   # interactively choose hunks to restore from @-
jj diffedit -r <rev>            # edit a commit's diff in place without checking it out
jj parallelize <revset>          # turn sequential revisions into siblings
jj simplify-parents -r <revset> # remove redundant parent edges
jj arrange <revset>             # interactively reorder/squash/split a graph (human use)
```

`jj squash -i` opens the configured diff editor. Selected hunks move from `@` into `@-` by
default, while unselected hunks remain in `@`; add `--into <rev>` to target another revision.

When source and destination **both** have descriptions, even non-interactive `jj squash` opens
the editor to combine them. `-m "msg"` sets the result; `-u`/`--use-destination-message` keeps
the destination's. An undescribed source (the scratch-child workflow above) never prompts.

`jj absorb` is the standout: after fixing review comments in `@`, it pushes each hunk into the
right ancestor commit automatically. It only moves hunks it can attribute to a single ancestor;
`-t <revset>` narrows the candidate ancestors, and anything unattributable (or outside that set)
is left in `@` for a manual `jj squash --into`.

`--onto`/`-o` is the current spelling for a new parent. The older `--destination`/`-d` spelling
remains an accepted alias in v0.44. `--insert-after`/`-A` and `--insert-before`/`-B` express graph
placement and are available on `new`, `rebase`, `duplicate`, and `split` (and experimentally on
`squash`).

### Abandon versus revert

Use `abandon` to remove unpublished changes from visible history; descendants are rebased onto the
abandoned change's parents. Use `revert` for shared or immutable history: it creates a new change
that applies the inverse patch, preserving the original commit.

```bash
jj abandon <revset>                    # hide local/unpublished changes
jj revert -r <bad-rev> -o @            # new inverse change on top of @
jj revert -r <bad-rev> -A <after-rev>  # insert inverse after a chosen revision
```

`jj abandon` **deletes** bookmarks pointing at the abandoned commits — and a deleted tracked
bookmark propagates as a remote branch deletion on the next push. `--retain-bookmarks` moves
them to the parent instead.

**Discarding a whole anonymous branch.** Given a shared base `common` and an unnamed branch
`n1..n10` forked off it (`n1` the first change, `n10` the tip), abandon the inclusive range and
anchor both ends:

```bash
jj abandon 'n1::n10'         # descendants of n1 that are ancestors of n10 — the branch, nothing else
jj abandon 'common+::n10'    # equivalent when you only know the base, not the first change
```

Anchor the root, not just the tip. `jj abandon ::n10` is *all ancestors of n10*: with nothing on
the left it walks back through `common` to the root and tries to abandon everything reachable.
`n1::n10` and `common+::n10` are bounded on both sides. This is the same range discipline as the
divergent-stack cleanup above, applied to an ordinary anonymous head.

Recovery goes through the operation log, not a Git reflog. `jj abandon` records an operation that
hides the changes; the commits stay reachable until garbage collection, so `jj undo` (last
operation) or `jj op restore <op-id>` (any earlier state) brings the branch back. See
[Undo / operation log](#undo--operation-log).

`jj restore --changes-in <rev>` applies a revision's inverse directly into an existing destination
(the working copy by default). `jj revert` is preferable when the inverse should be a separately
reviewable, publishable change.

`jj restore` selects a destination with `--into` (alias `--to`) and a source with `--from`;
`-c/--changes-in <rev>` is shorthand for `--into <rev> --from <rev>-`. Bare `jj restore` restores
`@` from its parents — like `jj abandon` but leaving an empty change with its metadata intact.

### `--restore-descendants` — rewrite content without reapplying descendant diffs

Rewriting an ancestor normally reapplies each descendant's own diff onto the new parent, which can
conflict. `jj restore --restore-descendants` instead **preserves descendants' file content**
verbatim, so the rewrite doesn't propagate as a diff:

```bash
# Remove a line from an ancestor without disturbing what descendants contain
jj restore --restore-descendants --into <ancestor> --from <ancestor>- <path>...
```

Example: dropping a line `b` from a `mid` commit with a plain restore makes a `top` descendant
that added `c` on top of `b` conflict; the same restore with `--restore-descendants` leaves `top`'s
content untouched (`a\nb\nc`) and conflict-free — the `b` line becomes owned by `top` instead of
`mid`. Reach for it when an ancestor edit would otherwise cause spurious downstream conflicts.

### Work against several branches at once

An integration change can merge the heads of several independent PRs so that code and tests see
their combined result without making the PRs depend on each other:

```bash
jj new pr-a pr-b pr-c -m "integration: test PRs together"
jj new                         # keep the integration change empty; edit in a child
# ...make fixes against the combined tree...
jj absorb                     # distribute eligible hunks to the nearest mutable ancestors
jj op show -p                 # inspect what the completed absorb operation changed
```

The many-parent integration change is local coordination scaffolding; do not move an individual
PR bookmark onto it. `jj absorb` only moves hunks it can attribute to mutable ancestors. Inspect
what remains in `@` and use targeted `jj squash --into <change>` or `jj split` when attribution is
ambiguous. When upstream moves, rebase all independent roots together:

```bash
jj git fetch
jj rebase -s 'roots(trunk()..integration)' -o trunk()
```

Here `integration` is a bookmark or change ID naming the integration tip. Old tutorials may show
`all:roots(...)`; the `all:` prefix is invalid in v0.44.

## Bookmarks (jj's named branches)

jj has no "current branch". Bookmarks are named pointers that do **not** move automatically as
you commit — you advance them explicitly.

```bash
jj bookmark list
jj bookmark create <name> [-r <rev>]   # create at rev (default @)
jj bookmark set <name> -r <rev>        # create or move a bookmark
jj bookmark move <name> --to <rev>     # move only; cannot create
jj bookmark advance --to <rev>         # advance the closest eligible bookmark(s) to rev
jj bookmark delete <name>              # mark deletion to propagate on the next push
jj bookmark forget <name>              # remove locally without deleting it on a remote
jj bookmark rename <old> <new>
jj bookmark track <name>@<remote>      # track a remote bookmark
jj bookmark untrack <name>@<remote>    # stop merging its remote movement into the local bookmark
```

Both `set` and `move` refuse a backward or sideways move without `-B`/`--allow-backwards`; only
forward moves (to a descendant) pass by default. Resolving a *conflicted* bookmark is the
exception: `jj bookmark set name -r <rev>` accepts any side without `-B`.

Typical flow: work on a stack, then `jj bookmark set mybranch -r @-` before pushing.

**Adopt an existing remote branch:** fetching makes untracked remote bookmarks visible without
creating local bookmarks. Track the chosen remote bookmark to create its local counterpart and
participate in future synchronization, then start a child or edit its tip:

```bash
jj git fetch
jj bookmark list --all-remotes
jj bookmark track feature@origin
jj new feature                    # new work on top
# or: jj edit feature             # amend the existing tip
```

Tracking is synchronization policy, not ancestry. A tracked remote bookmark participates in
default fetch/push reconciliation with its same-named local bookmark. An untracked remote bookmark
is still visible as `<name>@<remote>` but does not control a local bookmark. Use `delete` when the
remote ref should disappear; use `forget` when only local bookkeeping should disappear.

## Tags

jj v0.44 can create and move lightweight Git-compatible tags. Tags make their ancestors immutable
by default; moving an existing tag itself requires `--allow-move`.

```bash
jj tag list
jj tag set v1.2.3 -r <rev>             # create a lightweight tag
jj tag set v1.2.3 -r <rev> --allow-move
jj tag delete v1.2.3                    # mark deletion for a later push
jj tag track v1.2.3@origin
jj tag untrack v1.2.3@origin
jj git push -t v1.2.3                   # push one tag
```

jj can read annotated Git tags but `jj tag set` creates lightweight tags; create release metadata
through the hosting service when an annotated tag or signed release object is required.

## Git remotes

```bash
jj git fetch [--remote origin]
jj git push                     # push tracked bookmarks/tags targeting remote_bookmarks(remote=<remote>)..@
jj git push -b <bookmark>       # push a specific bookmark (new ones push automatically)
jj git push -t <tag>            # push a specific tag
jj git push --all               # push all bookmarks and tags, including new ones
jj git push --tracked           # push all tracked bookmarks and tags
jj git push --deleted           # push all pending bookmark/tag deletions
jj git push -c <rev>            # create auto-named bookmark (push-<changeid>) from change + push
jj git push --named name=<rev>  # create a specifically-named bookmark + push
jj git push --dry-run -b <bookmark> # display the remote update without performing it
jj git remote add origin <url>
jj git remote list
jj git remote set-url origin <url>
jj git remote rename <old> <new>
jj git remote remove <name>      # also forget that remote's bookmarks
jj git import / jj git export   # sync .jj <-> .git manually (rarely needed; auto in colocated)
```

Git remotes receive named refs: bookmarks and tags. An anonymous change therefore needs a bookmark,
but `jj git push -c <rev>` or `--named <name>=<rev>` can create one as part of the push.
Sideways/backward updates use force-with-lease-style safety automatically: jj updates the remote
only if its current ref still matches the last fetched state. Fetch and resolve divergence instead
of bypassing that protection when the remote moved independently.

The push remote is selected by `--remote`, `git.push`, or jj's remote-name fallback; it is not
inferred separately from each tracked bookmark. One push cannot target multiple remotes.

## GitHub / PR workflow

Clone/init are colocated by default, so `gh`, CI, and editors work out of the box. In a
non-colocated repo, point git tools at the store: `GIT_DIR=$(jj git root) gh pr list`.

### Worked example — a GitHub PR, end to end

```bash
# 1. Start from up-to-date main
jj git fetch
jj new main@origin                       # empty working copy on top of remote main

# 2. Build the change(s)
# ...edit files...
jj commit -m "feat(api): add rate limiter"
# ...edit more...
jj commit -m "test(api): cover rate limiter"
# @ is now an empty change sitting on top of the two commits

# 3. Push and open the PR
jj bookmark create rate-limiter -r @-    # name the tip (the last real commit)
jj git push --dry-run -b rate-limiter    # inspect commits and ref movement
jj git push -b rate-limiter              # new bookmark pushes automatically
gh pr create --head rate-limiter --fill

# 4. Address review — amend the RIGHT commit, not a new fixup
# ...edit files to fix a comment...
jj absorb                                # push each hunk into the ancestor that owns those lines
# (or target explicitly: jj squash --into <change-id>)
jj git push -b rate-limiter              # force-update is automatic; no --force

# 5. Keep up with main while the PR is open
jj git fetch
jj rebase -b rate-limiter -o main@origin # explicitly rebase this branch; conflicts, if any,
                                         # land in the commits and don't block
jj git push -b rate-limiter

# 6. Merge on GitHub, then clean up
# Choose --squash, --merge, or --rebase according to repository policy.
gh pr merge rate-limiter --squash
jj git fetch
jj bookmark delete rate-limiter
jj git push --deleted                    # delete the remote branch if GitHub did not
jj new main@origin                       # fresh work starts from the fetched main
```

Notes: push the bookmark at `@-` because `@` is your empty working commit. `jj absorb` in step 4
keeps history clean automatically — prefer it over tacking on "address review" commits. GitHub
requires a named ref, so anonymous jj changes need a bookmark (or `jj git push -c <rev>`) before
opening a PR. There is no `pull`: fetch, then rebase the local branch onto the fetched remote.

### Stacked pull requests

A jj stack is a sequence of changes; a stacked-PR stack adds one bookmark at each review boundary.
The local changes remain ordinary jj changes—the bookmarks exist because GitHub needs named heads.

```bash
jj new main@origin -m "feat(api): add request context"     # change A
# ...edit...
jj new -m "feat(api): add request logging"                 # change B, based on A
# ...edit...
jj new                                                     # empty @ above the stack

jj bookmark create pr-request-context -r @--               # tip of PR 1
jj bookmark create pr-request-logging -r @-                # tip of PR 2
jj git push -b pr-request-context -b pr-request-logging

gh pr create --head pr-request-context --base main --fill
gh pr create --head pr-request-logging --base pr-request-context --fill
```

For longer stacks, name every PR tip explicitly rather than relying on repeated `-` operators.
Editing an earlier change automatically rebases its descendants, and bookmarks attached to those
rewritten changes follow their successors. Push every affected bookmark after `jj edit`, `squash`,
`absorb`, or `rebase`:

```bash
jj absorb
jj git push -b pr-request-context -b pr-request-logging
```

Once a lower PR lands, fetch and rebase the remaining stack onto updated trunk, then retarget the
next PR's base on the hosting service if necessary. After a **squash-merge**, the landed commits
rebase onto trunk as empty duplicates and linger in the stack; `jj rebase --skip-emptied` abandons
commits that become empty during the rebase (commits already empty before it are kept). Do not combine independent PRs with the local
many-parent integration workflow above; stacked PRs deliberately have ancestry between them.

## Gerrit workflow

Gerrit's `Change-Id:` trailer and jj's change ID are related concepts but different identifiers.
Gerrit groups pushed commit versions into patch sets using the trailer; `jj gerrit upload` adds a
missing trailer derived from the jj change ID.

```bash
jj gerrit upload -r 'trunk()..@' --remote-branch main --dry-run
jj gerrit upload -r 'trunk()..@' --remote-branch main

# Common review metadata
jj gerrit upload -r <revset> --remote-branch main \
  --reviewer reviewer@example.com --topic api-cleanup --wip
```

Always dry-run a broad revset first: upload may rewrite commits to add missing trailers as well as
push them. Subsequent rewrites of the same jj changes produce new Gerrit patch sets because the
stable trailer continues to identify the Gerrit review.

## Conflicts

Conflicts never block a command. After a rebase/merge that conflicts:

```bash
jj st                           # shows which files are conflicted
jj log                          # conflicted commits are marked
jj resolve --list               # list conflicted paths in @ without launching a tool
jj resolve --list -r <rev>      # list conflicts in another revision
jj resolve                      # launch merge tool for conflicts in @
jj resolve <path>               # resolve one file
jj resolve --tool <tool> <path> # choose the merge tool for this invocation
```

Or edit the conflict markers in the file directly and save — jj detects resolution on the next
snapshot. Because conflicts live in commits, you can resolve them in a later commit and the fix
propagates. A common pattern: `jj new <conflicted>`, fix the markers, then `jj squash` the
resolution back into the original commit. You can also `jj undo` the operation that caused them.

### Reading jj conflict markers

The default `ui.conflict-marker-style = "diff"` represents a conflict as a snapshot plus one or
more diffs to apply:

```text
<<<<<<< conflict 1 of 1
%%%%%%% diff from: nnvwlypy 552936ce "base"
\\\\\\\        to: koxtvtoo 74889680 "side1"
-b
+B1
+++++++ yukklzsq 16907fe0 "side2"
B2
>>>>>>> conflict 1 of 1 ends
```

Each marker line names the revision it refers to as `change_id commit_id "description"`.

- `<<<<<<<` / `>>>>>>>` delimit the conflict.
- `%%%%%%%` begins a diff to apply; its header spans two lines — `diff from:` names the base and
  `\\\\\\\ to:` names the other side — followed by the `-`/`+` hunk. Many-sided conflicts can have
  several diff sections.
- `+++++++` begins a materialized snapshot: one side's full content, verbatim.

jj picks one side as the snapshot and renders the rest as diffs, so a diff section can appear before
the snapshot section, as above.

Resolve manually by replacing the entire marked region with the intended final content and
removing every marker, then run `jj st` or `jj resolve --list` to snapshot and verify. Alternative
styles are `"snapshot"` (base plus each side) and `"git"` (Git diff3, limited to two-sided
conflicts):

```toml
[ui]
conflict-marker-style = "diff" # or "snapshot", "git"
```

Resolving an earlier conflicted change triggers the normal descendant rebase. Descendants that
only inherited that conflict may become clean automatically; genuine additional conflicts remain
recorded. Inspect the full affected stack with `jj log -r '<resolved-change>::'` and
`jj log -r 'conflicts()'` rather than assuming propagation resolved everything.

## Undo / operation log

```bash
jj undo                         # undo the last non-undo operation; repeat to walk backward
jj redo                         # redo the most recently undone operation
jj op log                       # list operations with IDs
jj op revert <op-id>            # invert one selected operation while retaining later work
jj op restore <op-id>           # create a new operation restoring the repo to an earlier state
jj op show <op-id>              # what an operation changed (metadata + commit diff)
jj op diff --from <a> --to <b>  # difference between any two operations
```

This is the safety net. Almost anything is reversible. Prefer `jj undo` over trying to manually
reconstruct state.

`jj undo` has no operation-ID argument in v0.44. Repeated `undo`/`redo` behaves like an editor's
undo stack. Use `jj op revert <op-id>` to apply the inverse of a particular earlier operation
while retaining later work. `jj op restore <op-id>` creates a new operation whose repository
state matches the selected point; it does **not** delete the intervening operation history.

**Worked recovery — a bad rebase.** Say `jj rebase -b feature -o main` produced a mess. If it was
the most recent action, run `jj undo`. To reverse an older rebase while retaining later
operations:

```bash
jj op log --no-graph -T 'id.short() ++ " " ++ description ++ "\n"'  # scriptable one-line list
# ... locate the "rebase" op, e.g. 3c4563216e59 ...
jj op show 3c4563216e59         # confirm it's the one — shows which commits it changed
jj op revert 3c4563216e59       # apply its inverse; later work remains
```

To restore repository state wholesale, create a restoring operation:

```bash
jj op restore <op-before-the-mess>   # later effects are absent from the restored state
```

The later operations remain in `jj op log`. Only if you intentionally want their history and
otherwise-unreachable predecessors to become garbage-collectable should you abandon them too:

```bash
jj op restore <op-before-the-mess>
jj op abandon '<op-before-the-mess>..@-'  # discard later history before the restore operation
```

Inspect `jj op log` before doing this. Operation ranges are separate from commit revsets, and
abandoning them removes recovery paths once the unreachable objects are garbage-collected.

`jj op log` itself is a safe read; nothing you do while inspecting changes state.

### Speculative operations for automation

`--no-integrate-operation` runs a command and prints the resulting operation ID without making it
part of the current operation-log head or updating the working copy. Inspect that state with
`--at-op`, then integrate it or leave it unintegrated:

```bash
op=$(jj --no-integrate-operation rebase -b feature -o main@origin)
jj --at-op "$op" log -r 'main@origin..feature'
jj op integrate "$op"
```

This isolates jj repository state, not external side effects. For example,
`jj git push --no-integrate-operation` still pushes; do not use it as a push preview. Use
`jj git push --dry-run` for that.

## Auto working-copy snapshots — view and recover

At the start of nearly every command, jj snapshots pending filesystem edits by rewriting `@` with
the same change ID and a new commit ID. The previous version becomes hidden but remains available
until garbage collection. `jj op log` shows the repository-wide timeline; `jj evolog -r <change>`
shows the versions of one logical change.

Recover an earlier version by taking its commit ID from `jj evolog`:

```bash
jj show <commit-id>                          # inspect a hidden snapshot (works even when hidden)
jj restore --from <commit-id> <path>...      # pull specific files back into @, leave the rest
jj new <commit-id>                           # revive the whole snapshot as a fresh change on top
jj edit <commit-id>                          # resume editing that exact version
jj op diff --from <prev-op> --to <snapshot-op> # inspect one snapshot operation
```

Snapshot explicitly, or suppress snapshotting for a read-only command:

```bash
jj st                           # snapshot, then display status
jj util snapshot                # snapshot without another action
jj --ignore-working-copy st     # suppress snapshot/update; repository state may be stale
```

For wholesale loss, prefer `jj undo` or `jj op restore <op-id>` over reviving individual commits.
Snapshots are recovery aids, not backups: `jj util gc` can reclaim hidden commits and operations
after the expiration grace period.

## Maintenance — jj util gc

Nothing runs automatically — no periodic sweep, no object-count trigger. The operation log and
jj's own object store grow forever unless pruned by hand.

```bash
jj op abandon ..<old-op-id>     # mark old operations (and what they alone reference) obsolete
jj util gc                      # backend-dependent GC — in colocated repos this also invokes
                                 # `git gc` under the hood (confirmed via changelog 0.31.0)
jj util gc --expire now         # ignore the default 2-week grace period, GC immediately
                                 # (also passed through to git gc)
```

`jj util gc` only reclaims objects/operations that are already obsolete **and** older than the
`--expire` threshold (default 2 weeks). To shrink the op log, abandon the old operations
first with `jj op abandon`, then run `gc`. Occasional/manual — not something to cron unless the
repo is large or churns through many rewrites.

`jj util gc --expire now` on its own does nothing to the op log: `gc` only deletes objects that
are both obsolete and unreferenced by any surviving operation. A repo's hidden commits stay
referenced by the operations that produced them, so there is nothing to collect until
`jj op abandon` removes those operations first.

There is no built-in date-based filter for operations. `jj op log` takes no `-r`/revset flag at
all — its options are display-only (`-T`, `-n`, `--reversed`, `--no-graph`, `--op-diff`, `-p`),
none of them a revset filter — and `jj op abandon`'s range argument only
understands operation-graph symbols — op-ID hex prefixes, `@`, `@-`, `..` ranges — not commit-revset
date predicates. `before("1 day ago")` is **not** valid here; it belongs to the commit-revset
language, and passing it to `op abandon` fails with `Error: Operation ID "before(...)" is not a
valid hexadecimal prefix`. `jj util gc --expire` itself only accepts the literal string `"now"` in
0.44 — arbitrary timestamps aren't supported yet.

### Wiping the operation log — the reflog-expire equivalent

jj has no single command matching `git reflog expire --expire=now --all && git gc --prune=now`,
but this two-command sequence is the closest match:

```bash
jj op abandon '..@-'      # abandon every operation up to (not including) the current one
jj util gc --expire now   # reclaim the now-unreferenced objects immediately
```

What this preserves and what it removes:

- **Preserved:** the entire visible commit/changeset graph — every commit reachable from a
  bookmark or the working copy, with its description, content, and change ID. Bookmarks keep
  their current positions. `jj st` and the working copy are unaffected.
- **Removed:** the operation log itself, so `jj undo`/`jj op restore` have nothing to walk back to
  past this point; and any commit that only survived as a superseded predecessor — pre-rebase
  versions, earlier snapshot states of `@`, abandoned changes — anything hidden that was reachable
  only through an operation-log entry that no longer exists. Concretely, this means you lose the
  ability to recover a bookmark's *prior* position (e.g. before a rebase or a force-move); its
  *current* position and everything behind it are untouched.

This is a destructive, irreversible operation on repo history — there is no `--dry-run`. Inspect
`jj op log` first if in doubt, since `op abandon` does not prompt for confirmation.

### Integrity checks — no `jj fsck`

jj has no dedicated command that verifies the whole repo the way `git fsck` does. In a colocated
repo, `git fsck` covers the object store, since jj stores commit content there. For the jj-specific
state (operation log, view/op store, commit index), combine these:

```bash
jj op log --limit 3     # walks operation history; fails fast if the op store is corrupt or an
                         # operation references a missing view/predecessor
jj debug reindex        # rebuilds the commit index from the op/store; errors on inconsistency,
                         # doubles as a repair
jj debug index          # prints index stats (commit/change counts, levels) to eyeball for oddities
jj debug object <id>    # inspect one operation/view object if a specific entry looks wrong
jj debug working-copy   # checks the working-copy state file (tree id, watchman clock) against
jj debug local-working-copy  # what jj expects
```

None of these do a full cryptographic content check on their own; a clean `jj debug reindex` plus
a clean `jj op log` walk is the practical "jj is happy" signal.

### Other `jj util` subcommands

Beyond `gc` and `snapshot`, the `util` group holds a few script-friendly utilities:

```bash
jj util backend name      # prints the commit backend: "git" (or a native backend name).
                          # A clean check before a script assumes Git interop.
jj util config-schema     # emits the JSON schema (draft-04) for jj's TOML config —
                          # feed it to a validator or editor for config linting/completion.
jj util exec -- <cmd> ... # run an external command via jj (portable shim, e.g. for aliases
                          # that must call a binary without a shell).
jj util completion <shell>   # shell-completion script
jj util install-man-pages <dir>
jj util markdown-help     # full CLI help as Markdown
```

`jj util backend name` returns `git` in the colocated/`jj git init` repos this guide targets.

## Revsets (the query language)

Used with `-r`. Key building blocks:

| Expr | Meaning |
|------|---------|
| `@` | working-copy commit |
| `x-` / `x+` | parents / children of x |
| `::x` | ancestors of x (inclusive) |
| `x::` | descendants of x (inclusive) |
| `x..y` | ancestors of y that are not ancestors of x |
| `x \| y`, `x & y`, `~x` | union, intersection, difference |
| `all()`, `none()`, `root()` | literal sets |
| `heads(x)`, `roots(x)` | tips / roots of a set |
| `visible_heads()` | all visible heads, including anonymous ones |
| `bookmarks()`, `tags()`, `remote_bookmarks()` | by ref |
| `tracked_remote_bookmarks()`, `untracked_remote_bookmarks()` | by tracking state |
| `description(pat)`, `author(pat)`, `files(pat)` | by content/metadata |
| `mine()`, `empty()`, `merges()`, `conflicts()` | predicates |
| `immutable()`, `mutable()` | rewrite-protected / rewritable commits |
| `reachable(src, domain)` | commits connected to `src` without leaving `domain` |
| `fork_point(x)`, `merge_point(x)` | graph fork / merge points for a set |
| `trunk()` | main/master/trunk bookmark; resolved at repo init, `root()` if none exists |
| `latest(x, n)` | n most recent |

Examples: `main..@`, `@ | @-`, `description(glob:'wip*')`, `mine() & empty()`.

**String-pattern gotcha:** `description(x)`, `author(x)`, and similar string predicates default to
**exact** match, and a commit's description keeps its trailing newline. So `description("mid")`
resolves to *nothing* for a commit described "mid" — you need `description(substring:"mid")`,
`description(glob:'mid*')`, or the literal `description("mid\n")`. `exact:` matches the whole value
including that newline. Prefer the `substring:`/`glob:` prefixes in scripts; a bare quoted string is
a silent empty set, which quietly no-ops any command driven by the revset (e.g. `jj absorb -t`).

### Composing revsets

Revsets are a set algebra over commits. Every expression denotes a set; operators take sets and
return sets, so they nest freely: `heads(mutable() & mine())`, `roots(trunk()..@ & ~empty())`.
Two families do the work — **graph walks** that follow ancestry, and **set combinators** that
treat the results as plain sets.

**Graph-walk operators have prefix, postfix, and infix forms.** `::` and `..` are unary on the
side you omit an operand:

| Form | Meaning | Endpoints |
|------|---------|-----------|
| `::x` | ancestors of x | includes x |
| `x::` | descendants of x | includes x |
| `x::y` | descendants of x **and** ancestors of y — the DAG range | includes both |
| `..x` | `root()..x` — ancestors of x except the root | includes x |
| `x..` | `x..visible_heads()` — everything not an ancestor of x | excludes x |
| `x..y` | ancestors of y that are not ancestors of x | includes y, excludes x |
| `x-` / `x+` | parents / children (repeatable: `x--`, `@++`) | — |

**`::` and `..` answer different questions.** `x::y` is *connectivity*: the commits on some path
from x down to y, bounded on both ends. `x..y` is *set difference*, `::y ~ ::x`: everything
feeding y minus everything feeding x. On a linear chain they coincide. They part at merges:

```bash
# common → n1 → … → n10, but n5 merges in an external commit x (x not descended from common)
jj log -r 'common..n10'      # includes x — x is an ancestor of n10, not of common
jj log -r 'common+::n10'     # excludes x — x is not a descendant of a child of common
```

Rule of thumb: reach for `x::y` when you mean "the connected sub-DAG between these two points"
(discarding a branch, rebasing a span). Reach for `x..y` when you mean "what does y add over x"
(review ranges, `jj log -r 'trunk()..@'`). The half-open `x..y` mirrors Git's `x..y` and drops the
lower bound so `trunk()..@` excludes already-landed commits.

Because `::` includes both endpoints, abandoning a branch off a base must exclude the base:
`n1::tip` or `common+::tip`, never `common::tip` (that would abandon `common` itself).

**Set combinators** compose the results without walking the graph:

| Op | Meaning |
|----|---------|
| `x \| y` | union |
| `x & y` | intersection |
| `x ~ y` | difference (in x, not y); unary `~x` is `all() ~ x` |

Precedence, tightest first: `f(x)` → postfix `-`/`+` → pattern `p:x` → range `::`/`..` → unary
`~x` → `&` and infix `x ~ y` (**same level**, left-associative) → `\|`. So `::x & mine() | empty()`
parses as `((::x) & mine()) | empty()`, and `x ~ y & z` parses as `(x ~ y) & z` — infix `~` does
*not* bind tighter than `&`. Parenthesise when mixing `&` and `~`.

One non-obvious trap: `..` does not distribute over `\|` on its left. `(a | b)..` means "not an
ancestor of a **and** not an ancestor of b" (`= a.. & b..`), not `a.. | b..`.

**Functions take and return sets**, so filters are just intersections expressed as arguments or
`&`. These are equivalent shapes:

```bash
jj log -r 'trunk()..@ & mine() & ~empty()'      # explicit intersections
jj log -r 'latest(heads(trunk()..@ & mine()), 1)'  # nest: newest of my tips over trunk
```

Worked combinations:

| Revset | Yields |
|--------|--------|
| `trunk()..@` | your unlanded work — the review range |
| `@ & empty()` | is the working copy empty? (empty set = no) |
| `heads(all())` | every visible tip, named or anonymous |
| `::@ & bookmarks()` | the nearest bookmarks behind you (all ancestors that carry a ref) |
| `roots(x::y)` | the first commit(s) of a span — the base to rebase onto |
| `fork_point(a \| b)` | last commit a and b share |
| `x:: & ~x::y` | descendants of x that are *not* on the way to y (side branches off the span) |
| `mutable() & mine() & description(glob:'wip*')` | your rewritable WIP |
| `trunk()..@ ~ ::pushed_bookmark` | local commits not yet behind the pushed ref |
| `mine() & merges()` | your merge commits |

`reachable(src, domain)` is the general connectivity primitive: every commit connected to `src`
(ignoring edge direction) without leaving `domain`. `reachable(@, mutable())` is the whole mutable
stack around the working copy — both ancestors and descendants — where `::@`/`@::` each give only
one direction.

## Config

Precedence (later wins): built-in → user → repo → workspace → CLI (`--config`).
User file: `~/.config/jj/config.toml` (macOS/Linux) or `$HOME/.jjconfig.toml`.

```bash
jj config list                          # effective config
jj config get ui.editor
jj config set --user ui.editor nvim
jj config set --repo user.email "x@y"   # repo-local override
jj config edit --user
jj config path --user
```

Common keys:
```toml
[user]
name = "Name"
email = "me@example.com"

[ui]
default-command = "log"     # what bare `jj` runs
editor = "nvim"
diff-formatter = "difftastic" # non-interactive jj diff/jj show renderer
diff-editor = ":builtin"    # interactive hunk editor; or "meld", "vscode"
merge-editor = "meld"
pager = "less -FRX"
paginate = "never"          # useful for agents/scripts

[git]
fetch = "origin"
push = "origin"

[aliases]
l = ["log", "-r", "trunk()..@"]

[revset-aliases]
"immutable_heads()" = "builtin_immutable_heads()"
```

## Fsmonitor (watchman)

Watchman can replace jj's full tracked-file stat walk with an OS-backed changed-path query, which
matters in large repositories. It requires the `watchman` binary on `PATH`.

```toml
[fsmonitor]
backend = "watchman"

[fsmonitor.watchman]
register-snapshot-trigger = true   # optional background `jj util snapshot`
```

The backend accelerates snapshots taken by normal jj commands. The optional trigger additionally
snapshots in the background as files change. Check both with `jj debug watchman status`. Watchman
coalesces bursts and serializes trigger runs, but every resulting snapshot is still a hidden
working-copy commit retained until garbage collection.

## Interactive tools — the builtin TUI (scm-record)

Agents should avoid these; they block on a terminal or GUI. Listed here so humans driving the
same repo know the controls, and so scripts know which flags open an editor.

Commands that launch `ui.diff-editor` (a hunk/line picker):

```bash
jj split                        # partition @ into two sequential changes
jj squash -i                    # pick hunks to move from @ into @- (or --into <rev>)
jj diffedit                     # edit @'s content directly
jj diffedit --from <a> --to <b> # edit the diff between two revisions
jj commit -i                    # pick what to commit; rest stays in the new @
jj absorb -i                    # pick hunks eligible for absorption
jj restore -i                   # pick hunks to restore from @- into @
jj arrange <revset>             # reorder/squash/split a graph
```

`jj resolve <path>` launches `ui.merge-editor` (three-way) instead.

When `ui.diff-editor` is unset or `:builtin`, jj uses the bundled **scm-record** TUI. Its top
menu bar — `[File] [Edit] [Select] [View] [Help]` — is **mouse-only**; keyboard access to the
menu is an open, unimplemented feature (scm-record #44). Every menu action has a direct key, so
the menu is never required. Press **`?`** in the TUI for the full, version-current help dialog.

| Group | Key | Action |
|-------|-----|--------|
| Move | `j`/`k` or `↓`/`↑` | Next / previous item |
| Move | `h`/`l` or `←`/`→` | Collapse / expand (file → hunk → line) |
| Move | `Ctrl+u` / `Ctrl+d` | Page up / down |
| Select | `Space` | Toggle current item |
| Select | `Enter` | Toggle and advance |
| Select | `a` / `A` | Invert all / invert uniformly |
| View | `f` / `F` | Fold-unfold current / all |
| Edit | `e` | Edit commit message |
| File | `c` | Confirm — apply selection and exit |
| File | `q` or `Esc` | Cancel and exit (no-op) |
| Help | `?` | Show keybinding help |

Exiting with `q`/`Esc`, or confirming without selecting, applies nothing. On macOS the
`Page Up`/`Page Down` bindings need `Fn`+arrows; the letter keys above avoid that.

## Diff and merge tools (VS Code, meld, vimdiff)

Three distinct settings — don't confuse them:

- `ui.diff-formatter` — renders `jj diff`/`jj show` output (e.g. difftastic). Non-interactive.
- `ui.diff-editor` — interactive hunk picker for `jj split`, `jj squash -i`, `jj diffedit`.
  Default `:builtin` (a TUI). GUI editors work here too.
- `ui.merge-editor` — three-way resolver launched by `jj resolve`.

Override the renderer for one invocation with `--tool`:

```bash
jj show -r @-                       # uses ui.diff-formatter (delta, difftastic, …)
jj diff -r @- --tool :git           # builtin formats: :git, :color-words, :stat, :summary
jj diff -r @- --tool delta          # any named formatter, config or not
jj diff -r @- --tool vscode         # GUI side-by-side; built-in def, no config needed
```

Built-in definitions such as `vscode`, `vscodium`, `meld`, `kdiff3`, and `vimdiff` need no tool
table. Configuration only selects defaults or customizes flags:

```toml
[ui]
diff-formatter = "difftastic"   # or ["difft", "--color=always"]
diff-editor    = "vscode"       # VS Code side-by-side diff, jj waits for the window
merge-editor   = "vscode"       # VS Code 3-way merge editor
```

Custom merge-tool definitions use `$left`, `$right`, `$base`, and the required `$output` result.
GUI tools must block until editing finishes; jj's built-in definitions supply the appropriate
wait flags. For unattended agents, use non-interactive formatters or edit conflict markers
directly rather than launching a GUI.

### Custom tools without a built-in definition — Zed, p4merge

Tools with no built-in entry need a `[merge-tools.<name>]` table before `--tool <name>` or
`ui.diff-editor`/`ui.merge-editor = "<name>"` will work.

**Zed** — its `zed --diff <old> <new>` only compares two individual files, not directories, so
it can act as a diff viewer but not an interactive dir-diff editor (same limitation as VS Code's
built-in entry, which sets `diff-invocation-mode = "file-by-file"` for the same reason):

```toml
[merge-tools.zed]
program = "zed"
diff-args = ["--wait", "--diff", "$left", "$right"]
diff-invocation-mode = "file-by-file"
edit-args = [] # zed has no dir-diff support
```

```bash
jj diff -r @- --tool zed
```

**p4merge** — a real 3-way merge tool. Argument order (`base, mine, theirs, output`) matches
p4merge's standard invocation, the same order used by Git's built-in `mergetool.p4merge`
integration.

**Gotcha:** unlike meld/kdiff3, p4merge only accepts individual *files*, not directory trees.
jj's default diff mode hands the tool two whole directories (`$left`/`$right` = entire changed
tree), and p4merge rejects those with `'...' is (or points to) an invalid file` — same class of
limitation as VS Code and Zed above, just a harder error instead of a silent one. Fix:
`diff-invocation-mode = "file-by-file"` (invokes p4merge once per changed file with real file
paths) and `edit-args = []` (p4merge can't act as an interactive dir-diff editor for `jj split`):

```toml
[merge-tools.p4merge]
program = "/Applications/p4merge.app/Contents/MacOS/p4merge"
merge-args = ["$base", "$left", "$right", "$output"]
diff-args = ["$left", "$right"]
diff-invocation-mode = "file-by-file"
edit-args = [] # p4merge has no dir-diff support
```

```bash
jj resolve --tool p4merge     # 3-way conflict resolution
jj diff -r @- --tool p4merge  # 2-way diff view
```

Defining `[merge-tools.p4merge]` does not change `ui.merge-editor`; it only makes `p4merge`
available to `--tool`. Set `ui.merge-editor = "p4merge"` to make it the default for `jj resolve`.

## Colocated repos — interop rules

This is the default model when working with GitHub. `.jj` and `.git` share one working copy.
jj **imports git state and exports its own on every jj command**, so most interop is automatic.
Rules that matter for agents:

- **git branch == jj bookmark.** They're kept in sync. Move a bookmark in jj → the git branch
  moves on the next command, and vice versa.
- **git HEAD tracks a parent of `@`** and is normally detached. The Git branch ref still maps to
  the jj bookmark; detached `HEAD` is separate from that ref. The distinction becomes visible in
  these two common states:

  ```text
  C @                         C @, feature
  |   (empty)                 |   (contains the feature patch)
  B feature, Git HEAD         B Git HEAD
  |                           |
  A                           A
  ```

  On the left, `jj new` has created an empty `@` above bookmarked commit `B`. Git `HEAD` points to
  `B`, so it happens to coincide with the branch tip and Git-facing tools normally report a clean
  working tree. On the right, `jj edit feature` has made bookmarked commit `C` the working copy.
  Git `HEAD` therefore points to parent `B`, while the shared files represent `C`; Git-facing tools
  show `C`'s already-recorded patch as staged or unstaged changes. That output does **not** mean the
  patch is uncommitted in jj. Run `jj new` after finishing an amended tip to return to the left-hand
  arrangement without moving the bookmark or changing pushed history.
- **Completed changes made by raw `git`** can be imported by the next jj command. Mutating Git
  often requires first attaching Git's detached `HEAD` to a branch, and may produce bookmark
  conflicts or divergent changes. If interleaved state looks stale, inspect it before forcing
  `jj git import`.
- **Don't run `git` and `jj` concurrently** against the same repo — imports/exports race.
  Sequence them.
- **`gh` works directly** in a colocated repo (it reads `.git`). In a *non*-colocated repo:
  `GIT_DIR=$(jj git root) gh pr list`.
- **Prefer jj for commit, merge, and rebase.** jj ignores Git's staging area and cannot model
  unresolved Git index conflicts or unfinished `git rebase`/`git merge` state. A successfully
  completed Git mutation can usually be imported, but do not hand jj an in-progress Git operation.

## Machine-readable output

`jj log`/`jj show` are for humans by default. For parsing, use `--no-graph -T <template>`.
Templates access commit fields; common ones:

```bash
jj log --no-graph -r @ -T 'change_id.short()'           # current change ID
jj log --no-graph -r @- -T 'commit_id'                  # commit hash of the parent
jj log --no-graph -r @ -T 'if(empty, "empty", "dirty")' # is working copy empty?
jj log --no-graph -r 'bookmarks()' -T 'bookmarks ++ "\n"'
jj log --no-graph -r @ -T 'description'                 # raw message
```

Useful fields/methods: `change_id`, `commit_id`, `description`, `author`, `empty`, `conflict`,
`bookmarks`, `parents`, `.short()`, `.shortest(n)`, `description.first_line()`, `author.email()`. Query state with predicate revsets instead of
parsing text: `jj log -r 'conflicts()'`, `jj log -r '@ & empty()'`, or
`jj log -r 'mine() & description(exact:"")'`.

## Push safety and immutability

- **`jj git push` refuses** to push commits with **no description**, commits containing
  **conflicts**, or commits marked **private** (`git.private-commits`). It catches half-finished
  work before it reaches the remote. Override per-push with `--allow-empty-description`,
  `--allow-conflicts`, or `--allow-private` — but prefer fixing the commit. (Empty commits *are*
  pushable, as long as they have a description.)
  Configure the private set with a revset:

  ```toml
  [git]
  private-commits = "description('wip:*') | description('private:*')"
  ```

  Descendants of private commits cannot be pushed either, because pushing them would also require
  pushing the private ancestor. Commits already present on the remote and immutable commits are
  excluded from the private set.
- **Divergent bookmarks:** after `jj git fetch`, a bookmark that moved both locally and on the
  remote shows as conflicted (`name??`). Resolve with `jj bookmark set name -r <rev>`.

### Immutability

There is no per-commit lock. Immutability is a **revset**: every commit in `::immutable_heads()`
(the named heads *and their whole ancestry*) is refused for rewrite. `jj edit`, `describe`,
`rebase`, `squash`, `abandon`, and any other history edit on such a commit fails with
`Commit … is immutable`. Since rewrites are what produce force-pushes, freezing the published set
prevents them. Building on top is always allowed — `jj new <immutable>` works; only rewriting the
commit itself is blocked.

You control it by redefining the alias. The v0.44 default:

```toml
[revset-aliases]
"immutable_heads()" = "builtin_immutable_heads()"   # = trunk() | tags() | untracked_remote_bookmarks()
```

In plain terms: by default everything from `root()` up to and including `main@origin` (plus tags
and untracked remote bookmarks) is frozen; your local commits past it stay mutable. Merely pushing
a *tracked* PR bookmark does not freeze it. Recipes — widen the set to taste:

```toml
[revset-aliases]
# freeze anything pushed to any remote (the common "don't rewrite published work" policy)
"immutable_heads()" = "builtin_immutable_heads() | remote_bookmarks()"

# freeze main on origin and every release tag
"immutable_heads()" = "main@origin | tags()"

# builtin set plus a hand-placed landmark bookmark
"immutable_heads()" = "builtin_immutable_heads() | frozen"
```

Set it per-repo or globally without editing the file:

```bash
jj config set --repo 'revset-aliases."immutable_heads()"' 'builtin_immutable_heads() | remote_bookmarks()'
```

Caveats:
- **Advisory, not cryptographic.** Anyone can widen, narrow, or clear the alias, and
  `--ignore-immutable` overrides it for one intentional rewrite. It stops accidents, not a
  determined rewrite. Not a security boundary.
- `root()` is immutable regardless of config; it can never be rewritten.
- An empty or malformed alias makes *nothing* immutable — the guard silently disappears. Verify
  with `jj log -r 'immutable_heads()'` after changing it.

## File tracking

No staging, but tracking still exists. New files are auto-tracked on snapshot unless matched by
`.gitignore`.

```bash
jj file untrack <path>          # stop tracking (must be gitignored first)
jj file track <path>            # manually track a non-ignored path excluded by snapshot.auto-track
jj file track --include-ignored <path>  # force-track an ignored or oversized path
jj file list [fileset]          # list files in a revision (default @)
jj file show <path>...          # print file contents at a revision (dirs recurse)
jj file search --pattern <pat>  # grep across tracked files, prefixed by path
jj file annotate <path>         # blame: source change per line
jj file chmod (normal|executable) <path>...  # set/clear exec bit — works cross-platform,
                                 # even on Windows and on conflicted files
```

Config `[snapshot] auto-track = "none()"` disables auto-tracking if you want explicit control
(pattern is a fileset, e.g. `"glob:**/*.rs"` to only auto-track Rust files).

**Large files:** jj refuses to *auto*-track a new file above `snapshot.max-new-file-size`
(default 1MiB) and warns instead of tracking it. Only new files are checked — files already
tracked bypass the limit even if they grow. This is a soft, per-file limit, not a hard
ceiling — four ways to clear it:

- **One-off, no config change:** `jj file track --include-ignored <path>` force-tracks that file
  regardless of size (or gitignore status). Best for an occasional large file without loosening
  the default for everything else.
- **Per-command override:** `jj --config snapshot.max-new-file-size=50MiB st` raises the ceiling
  for a single invocation.
- **Standing config change:** set `[snapshot] max-new-file-size = "50MiB"` in `jj config` to raise
  the default everywhere.
- **Disable entirely:** `max-new-file-size = 0` removes the check altogether.

Use Git LFS-free repos — LFS is not supported (see limits below).

**Line endings:** `working-copy.eol-conversion` defaults to `"none"`, preserving file bytes. The
official documentation presents the available modes rather than recommending one globally. For a
Linux/LF workflow whose editors and formatters already produce LF, leaving `"none"` is reasonable.

`"input"` converts CRLF to LF when snapshotting but checks out LF; it applies to **every file jj
classifies as text**, not only paths selected by `.gitattributes`. Existing LF content is unchanged,
but normalizing a CRLF file can produce a whole-file diff. `"input-output"` stores LF and checks out
CRLF. jj ignores `.gitattributes` EOL rules, so they cannot scope or override this conversion; use
`"input"` only when repository-wide LF normalization is intended.

Related setting `working-copy.exec-bit-change` (`"respect"` / `"ignore"` / `"auto"` — Unix only).
`snapshot.auto-update-stale = true` skips the manual `jj workspace update-stale` step by applying
it automatically — handy when driving multiple workspaces.

**Manual snapshot:** `jj util snapshot` forces a working-copy snapshot with no other action —
occasionally useful in scripts before reading state.

## History of a single file

Pass a path as a fileset to `jj log` for visible commits that modified it:

```bash
jj log <path>                     # commits that touched the file
jj log -r 'files("<path>")'       # same, as a revset (composable with other revsets)
jj log -p <path>                  # add the per-commit diff for that file
jj file annotate <path>           # blame: which change last touched each line
```

Auto-snapshots are hidden and do not appear in normal file history. To recover in-progress versions,
use `jj evolog -r <change>` to find hidden commit IDs, then inspect them with `jj show <commit-id>`
or restore the path with `jj restore --from <commit-id> <path>`.

## Running formatters — jj fix

`jj fix` runs configured tools over the files of a revset and rewrites those commits in place.
Good for agents that must format code before pushing, without a manual edit round.

```bash
jj fix                        # fix @ (and descendants that need it)
jj fix -s <rev>               # fix <rev> and its descendants
jj fix -s 'main..@'           # fix a whole stack (no -r; only -s/--source selects revisions)
```

`jj fix` only **modifies** content — it is not a static-validation gate. Each tool must read the
file on **stdin** and write the fixed file to **stdout**; jj replaces the file with that stdout.
A check-only linter that just reports problems (nonzero exit, diagnostics on stderr) does nothing
useful here — its stdout is empty and jj would blank the file. Use a tool's autofix/stdout mode,
or none. Exit status is ignored for the content; a nonzero exit only suppresses the rewrite.

Configure tools by file pattern:

```toml
[fix.tools.rustfmt]
command = ["rustfmt", "--emit", "stdout"]     # formatter: reads stdin, writes formatted stdout
patterns = ["glob:'**/*.rs'"]

[fix.tools.prettier]
command = ["prettier", "--stdin-filepath", "$path"]
patterns = ["glob:'**/*.{ts,tsx,js,json,css,md}'"]

[fix.tools.ruff]
command = ["ruff", "check", "--fix", "--quiet", "-", "--stdin-filename", "$path"]
patterns = ["glob:'**/*.py'"]                 # linter in autofix mode: emits fixed source on stdout
```

`$path` expands to the repo-relative file path — some tools need it to pick language/config. The
`ruff` line shows the pattern for a linter: run its `--fix` mode with stdin/stdout (`-`), not its
default report mode. `clippy` and similar report-only checkers have no stdout-emitting fix mode,
so run those separately (e.g. via `jj run`), not through `jj fix`.

`jj fix` rewrites commits, so it respects immutability and rebases descendants like any other
edit. Run it before `jj git push` to ship already-formatted history.

## Run commands across revisions

`jj run` checks out selected revisions in isolated working copies and executes a command for each.
By default, successful filesystem changes amend those revisions and descendants are rebased. For
tests and other read-only checks, always pass `--ignore-changes` so command side effects are thrown
away and immutable revisions are allowed.

```bash
# Test every change in a stack without rewriting it
jj run -r 'trunk()..@' --ignore-changes -j 4 -- cargo test

# Intentionally format every mutable change in a stack
jj run -r 'trunk()..@' -j 4 -- cargo fmt
```

Each process receives `JJ_CHANGE_ID`, `JJ_COMMIT_ID`, and `JJ_WORKSPACE_ROOT`. Successful rewrites
are applied atomically after the run; by default a failed command prevents its changes from being
saved. `--ignore-errors` continues and makes the overall command succeed, so do not use it when a
failure must fail CI.

## Bisecting

`jj bisect run` searches a revision range using command exit status: `0` is good, `125` skips the
revision, `127` aborts, and other non-zero values are bad. The range heads are assumed bad; their
ancestors outside the range are assumed good.

```bash
jj bisect run --range 'v1.2.0..main' -- cargo test
jj bisect run --range '<known-good>..<known-bad>' -- ./repro.sh
```

Each candidate becomes the working-copy revision while the command runs, and its commit ID is also
available as `JJ_BISECT_TARGET`. The bad/good monotonicity assumption must hold; flaky tests or a
bug that disappears and reappears invalidate binary-search results.

## Workspaces (multiple working copies)

jj's answer to git worktrees: several working directories backed by one repo (`.jj` store).
Each workspace has its **own independent `@`** working-copy commit, so agents can work on
different revisions in parallel without stashing or switching.

```bash
jj workspace add ../feature-b            # new working copy in ../feature-b, its own @
jj workspace add --name build ../wc2 -r <rev>  # named, starting at a revision
jj workspace list                        # all workspaces + their @
jj workspace root                        # path of current workspace root
jj workspace rename <new>
jj workspace forget [<name>]             # unregister a workspace (leaves the dir on disk)
jj workspace update-stale                # resync a workspace whose @ was rewritten elsewhere
```

Notes:
- All workspaces share history, bookmarks, and the operation log. Rewriting a commit in one can
  leave another's `@` **stale** → `jj workspace update-stale` there.
- Cleanup is two steps: `jj workspace forget <name>`, then delete the directory.
- Unlike git worktrees there's no per-tree branch checkout to manage — each just points its `@`
  at a revision. jj's operation log integrates concurrent jj operations. Avoid
  editing the same working-copy commit from multiple workspaces: one workspace will become stale.
  Colocated repositories still share a Git backend, so do not concurrently mix mutating Git and
  jj commands.

## Sparse working copies

Sparse patterns control which paths from the working-copy commit are materialized on disk. They do
not alter commit contents, tracking, or history and are useful for very large monorepos.

```bash
jj sparse list
jj sparse edit                         # edit this workspace's patterns in an editor
jj sparse set --clear --add README.md --add src
jj sparse set --add tests
jj sparse set --remove vendor
jj sparse reset                         # materialize every path again
jj workspace add --sparse-patterns empty ../minimal-wc
```

Sparse configuration belongs to a workspace, so separate workspaces can materialize different
subsets of the same commits. A missing path may merely be sparse rather than absent from `@`;
inspect the commit with `jj file list`/`jj file show` instead of inferring from the filesystem.

## Git compatibility limits

Not everything git does works through jj. Know these before relying on them:

- **Submodules** — not materialized in the working copy (but not destroyed either). Don't expect
  `jj` to update or check out submodule contents.
- **Git LFS** — unsupported. LFS pointer files are treated as ordinary files.
- **git hooks** — not run by jj. Pre-commit/pre-push hooks won't fire; run linters via `jj fix`
  or CI instead.
- **`.gitattributes`** — ignored (no filters, no eol/clean/smudge). Line-ending normalization
  won't happen.
- **Annotated tags** — can read/check out tags and create lightweight ones, but not create
  annotated tags.
- **Shallow / partial clones** — shallow clone works but deepening/unshallowing does not;
  partial clone unsupported.
- **git config** — only remote config and `core.excludesFile` are honored; other git settings
  are ignored.
- **Colocated hygiene** — keep `.jj/` gitignored; prefer read-only git commands and do mutations
  through jj; a bookmark whose jj and git positions disagree shows as `name@git`.

## Signing commits

Supported via config or `jj sign`.

```toml
[signing]
behavior = "own"        # sign commits you author; also "keep" (default), "force", "drop"
backend = "ssh"         # or "gpg", "gpgsm"
key = "~/.ssh/id_ed25519.pub"
```

```bash
jj sign -r <revset>     # sign existing commits
jj unsign -r <revset>   # remove signatures by rewriting the commits
```

## Recovering odd states

- **Stale working copy** (`jj st` warns): another workspace or an interrupted command rewrote
  `@`. Fix with `jj workspace update-stale`.
- **Divergent change** (a change ID resolves to two visible commits, shown `(divergent)`): a change
  was rewritten in two places. Inspect it with `jj log -r 'divergent()'` and select a side with its
  change offset (`abc/0`, `abc/1`) or its commit ID; the bare change ID is rejected as ambiguous.
  For a stale rewritten stack, follow the range checks and cleanup in
  *Change IDs versus commit IDs*; abandoning only its tip leaves the rest divergent.
- **Hidden commits**: obsolete pre-rewrite versions, including every auto working-copy snapshot.
  They're not gone — find them with `jj evolog` and revive by commit ID (`jj new <commit-id>` /
  `jj edit`), or pull back single files with `jj restore --from <commit-id>`. See
  *Auto working-copy snapshots — view and recover*.
- **Conflicted bookmark** after fetch (`name??`): `jj bookmark set name -r <rev>`.

## Git-user crib sheet

See [`jj-short-guide.md`](jj-short-guide.md) for the compact Git-to-jj workflow and daily command
set. Keeping that mapping in one document avoids two copies drifting apart.

## Getting help

- `jj <cmd> --help` — flags for a command.
- `jj help <cmd>` — fuller docs.
- `jj help -k revsets` / `-k templates` / `-k config` — the concept docs (keyword help).
