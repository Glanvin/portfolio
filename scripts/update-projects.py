#!/usr/bin/env python3
"""
Refresh data/projects.json from GitHub.

Requirements: the GitHub CLI (`gh`) must be installed and authenticated.

Usage:
    python3 scripts/update-projects.py [OWNER]

If OWNER is omitted, the authenticated user's login is used.
Descriptions fall back to the GitHub repo description, then to the first
meaningful line of the repo's README, then to "No description yet.".
"""
import base64
import json
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "data", "projects.json")


def gh(args):
    p = subprocess.run(["gh", *args], capture_output=True, text=True)
    return p.stdout if p.returncode == 0 else None


def owner_login():
    out = gh(["api", "user", "--jq", ".login"])
    return out.strip() if out else None


def read_readme(owner, name):
    out = gh(["api", f"repos/{owner}/{name}/readme", "--jq", ".content"])
    if not out:
        return ""
    try:
        return base64.b64decode(out.strip()).decode("utf-8", "replace")
    except Exception:
        return ""


def clean_md_line(line):
    line = re.sub(r"<!--.*?-->", "", line)
    line = re.sub(r"\[!\[[^\]]*\]\([^)]*\)\]\([^)]*\)", "", line)
    line = re.sub(r"!\[[^\]]*\]\([^)]*\)", "", line)
    line = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", line)
    line = re.sub(r"<[^>]+>", "", line)
    line = re.sub(r"`{1,3}", "", line)
    line = re.sub(r"[*_#>~]", "", line)
    line = re.sub(r"https?://\S+", "", line)
    line = re.sub(r"\s+", " ", line)
    return line.strip(" -|:\t")


SKIP = {"readme", "table of contents", "contents", "installation", "features", "about", "license"}


def derive_description(md):
    if not md:
        return ""
    in_code = False
    for raw in md.splitlines():
        s = raw.strip()
        if s.startswith("```"):
            in_code = not in_code
            continue
        if in_code or not s:
            continue
        if s.startswith("<") and "img" in s.lower():
            continue
        c = clean_md_line(s)
        if not c or len(c) < 12 or c.lower() in SKIP:
            continue
        return c
    return ""


def main():
    owner = sys.argv[1] if len(sys.argv) > 1 else owner_login()
    if not owner:
        sys.exit("Could not determine GitHub owner. Is `gh` authenticated?")

    raw = gh(["repo", "list", owner, "--limit", "200", "--json",
              "name,description,url,homepageUrl,isPrivate,isFork,primaryLanguage,"
              "stargazerCount,updatedAt"])
    if raw is None:
        sys.exit("Failed to list repos. Check `gh auth status`.")
    repos = sorted(json.loads(raw), key=lambda r: r["name"].lower())

    projects = []
    for r in repos:
        if r.get("isFork"):
            continue  # only show original repositories, not forks
        desc = (r.get("description") or "").strip()
        if not desc:
            desc = derive_description(read_readme(owner, r["name"]))
        if not desc:
            desc = "No description yet."
        lang = (r.get("primaryLanguage") or {}).get("name") if r.get("primaryLanguage") else None
        projects.append({
            "name": r["name"],
            "description": desc,
            "url": r["url"],
            "homepage": r.get("homepageUrl") or "",
            "language": lang,
            "stars": r.get("stargazerCount", 0),
            "private": bool(r.get("isPrivate")),
            "fork": bool(r.get("isFork")),
            "updatedAt": r.get("updatedAt", ""),
        })

    with open(OUT, "w") as f:
        json.dump(projects, f, indent=2, ensure_ascii=False)
        f.write("\n")
    print(f"Wrote {len(projects)} projects to {os.path.relpath(OUT, ROOT)}")


if __name__ == "__main__":
    main()
