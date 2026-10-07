# Portfolio

A single-page developer portfolio built with **plain HTML, CSS, and JavaScript**
(no build step, no framework) and deployed with **GitHub Pages**.

Projects are generated from the GitHub API into `data/projects.json`, so the
project grid stays in sync with the repositories.

## Structure

```
portfolio/
├── index.html              # page markup (all sections + placeholders)
├── css/style.css           # dark theme by default, light theme toggle
├── js/main.js              # theme, nav, scroll reveal, project rendering
├── data/projects.json      # generated list of repositories
├── assets/avatar.svg       # placeholder avatar — replace with your own
├── scripts/update-projects.py
├── .nojekyll               # tell GitHub Pages to serve files as-is
└── README.md
```

## Editing your info (placeholders)

Anything marked with `data-placeholder="true"` in `index.html` is a placeholder:

- Name, title, and hero description (`#home`)
- About paragraphs and facts (`#about`)
- Skills (`#skills`)
- Contact email and social links (`#contact`)
- Footer name

The **Projects** section (`#projects`) is rendered automatically from
`data/projects.json` — do not edit it by hand.

Replace `assets/avatar.svg` with your own image (keep the filename, or update the
`<img src>` in `index.html`).

## Refreshing the project list

Requires the [GitHub CLI](https://cli.github.com/) to be installed and authenticated.

```bash
python3 scripts/update-projects.py            # uses your own account
python3 scripts/update-projects.py SomeUser   # or another account
```

It writes `data/projects.json`. Forked repositories are skipped. Descriptions come from the repo description, then
the README's first meaningful line, then `"No description yet."`.

> Private repositories are included and flagged with a **Private** badge. Their
> links only work while signed in as the owner.

## Local preview

Because the page fetches `data/projects.json`, open it through a local server:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

Opening `index.html` directly from disk (`file://`) will block the JSON fetch.

## Deploying (GitHub Pages)

1. Push this repository to GitHub.
2. **Settings → Pages → Source: Deploy from a branch**.
3. Branch: `main`, folder: `/ (root)` → **Save**.
4. The site goes live at `https://<username>.github.io/<repo>/`.
