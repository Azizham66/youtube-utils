# Contributing to YouTube Embedded Utilities

Thank you for your interest in contributing to this project. This guide will help you get started.

## Getting Started

1. Fork and clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Make your changes in the `src/` directory.
4. Build and test:
   ```bash
   npm run build
   ```
5. Load the `dist/` folder in Chrome via `chrome://extensions` > Developer Mode > Load Unpacked.

## Project Architecture

Before making changes, please read `DOCUMENTATION.md` for a full technical breakdown of the codebase, including the two-world communication model and all source file references.

## Development Workflow

1. Create a new branch for your feature or fix.
2. Make your changes.
3. Test manually by loading the extension on a page with YouTube embeds.
4. Commit with a clear, descriptive message (see below).
5. Open a pull request.

## Commit Message Guidelines

Use the following prefixes:

| Prefix     | Usage                                    |
|------------|------------------------------------------|
| `feat:`    | New feature                              |
| `fix:`     | Bug fix                                  |
| `docs:`    | Documentation changes only               |
| `style:`   | CSS or formatting changes (no logic)     |
| `refactor:`| Code restructuring without behavior change|
| `chore:`   | Build config, dependencies, tooling      |

Example: `feat: add picture-in-picture toggle button`

## Code Style

- Use TypeScript for all source files.
- Prefix all CSS classes with `ytu-` to avoid collisions with host pages.
- Use inline SVG strings for icons (stored in the `icons` object in `overlay.ts`).
- All UI elements are created programmatically in `overlay.ts` — there are no HTML template files.
- Scope DOM queries to the wrapper element (`wrapper.querySelector`) instead of using `document.getElementById` to support multiple embeds per page.

## Adding a New Feature

1. If it requires communicating with the YouTube player, add the method to `playerController.ts`.
2. If it requires access to the internal player object (inside the iframe), update `embed_inject.ts`.
3. Build the UI element in `overlay.ts` and style it in `styles.css`.
4. If the setting should persist, add it to `storage.ts`.

## Reporting Issues

When reporting bugs, please include:
- The website URL where the embed is hosted (if possible).
- Your Chrome version.
- Steps to reproduce the issue.
- Console errors (right-click the extension overlay > Inspect > Console).

## License

By contributing, you agree that your contributions will be licensed under the same GNU General Public License v3.0 that covers this project.
