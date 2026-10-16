# LESSONS

Concise log of errors hit in this project and their working fixes. Never repeat the anti-pattern.

| # | Anti-pattern | Fix |
|---|--------------|-----|
| 1 | Using `&&` in Windows PowerShell (causes ParserError in PS 5.1) | Use `;` to chain commands or run statements individually |

- replace_file_content: line ranges can be off by one after earlier edits in the same file; re-view the file or anchor TargetContent on unique multi-line text, and always pass Instruction/Description/AllowMultiple/toolAction/toolSummary.
