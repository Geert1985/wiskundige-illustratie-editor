# Repository migration - 2026-10-11

New repository: https://github.com/Geert1985/wiskundige-illustratie-editor
Source: Geert1985/from-zero-2-infinity, chatgpt/math-illustration-m5b commit 73333a0.
Source main baseline: 09b42f22b6981028670e2ad3dc72ae47fc4d039e.

Git subtree split retained 244 editor-related commits; split head d9b0b2047a630a434bb552fda7b236db1b4f43bf. Commit hashes change because unrelated files were removed from each historical tree; authors and commit messages remain. All 200 tracked editor files move to the new repository root. Runtime modules are self-contained and unchanged. Historical docs retain original context. Editor drafts require JSON export/import when the hosting origin changes.

Added root entry point, local static server and npm scripts. Test screenshot paths now resolve inside test-results instead of an external workspace. Existing local untracked FEATURE-GAP-ANALYSIS.md copied locally, not published. Original checkout retained. Source main removes the old editor only after the standalone copy has been verified and published; earlier branches/commits remain recoverable.

Validation: 363/363 Node tests passed; full Edge suite passed with zero page errors from the new root. All 200 tracked source files present, runtime content identical after line-ending normalization. Local root entry, editor HTML/CSS/JS served successfully. Playwright 1.62.1 pinned with package-lock.json. Source main cleanup completed at 94a6d4a after standalone publication c4bf129. Git tree comparison confirms all non-editor source-main files have identical modes and blob hashes; only the editor folder was removed and ILLUSTRATION-EDITOR-MOVED.md added.

New default branch: main. Future development branch: chatgpt/editor-development. Remote heads verified after migration. No GitHub Pages deployment or repository visibility change was performed. The previous local checkout remains available for recovery/export; future editor work belongs in the standalone checkout.
