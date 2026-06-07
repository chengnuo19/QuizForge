# Codex Project Instructions

These rules adapt the intent of the Andrej Karpathy coding guidance into a
Codex-friendly project policy. Follow them when working in this repository.

## Working Style

- First understand the existing code, tests, and conventions before editing.
- Ask a concise clarification only when the requirement is genuinely ambiguous
  or a wrong assumption would create meaningful risk.
- Prefer the simplest change that fully solves the user's request.
- Keep edits scoped to the requested behavior. Avoid unrelated refactors,
  formatting churn, or broad rewrites.
- Preserve the user's existing work. Do not revert or overwrite unrelated
  changes in the working tree.

## Implementation

- Make code easy to read before making it clever.
- Use existing project patterns, helper APIs, and abstractions where they fit.
- Add new abstractions only when they remove real duplication or complexity.
- Treat edge cases explicitly when they affect correctness or user-visible
  behavior.
- Leave short comments only for non-obvious decisions or complex logic.

## Verification

- Prefer a failing test or concrete reproduction before changing behavior when
  fixing bugs.
- Run the smallest useful verification first, then broaden if the change affects
  shared or user-facing behavior.
- Do not claim work is complete until the relevant command has run successfully,
  or clearly state why verification could not be run.
- Report the exact verification performed in the final response.

## Communication

- Be direct about tradeoffs, assumptions, and remaining risk.
- Summarize changes by behavior and files touched, not by vague effort.
- If blocked, explain the blocker and the next concrete option.
