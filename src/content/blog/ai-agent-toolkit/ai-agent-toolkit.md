---
author: Lori
pubDatetime: 2026-07-14T01:30:00.000Z
modDatetime:
title: "Memory, Context, and a Pixel Dragon: Three Tools I Built to Live with AI Coding Agents"
slug: ai-agent-toolkit
featured: true
draft: false
tags:
  - AI
  - tooling
  - agents
description: "AI coding agents are stateless, blind to your real work context, and silent while they run. I built three small local-first tools — Agent Workbench, work-mcp, and Session Pet — to fix exactly that. Here is what they do and why you might want the same setup."
---

These days I rarely write code alone. On a normal workday I have two or three AI agent sessions running — Claude Code on one ticket, Codex poking at another — and honestly, they are great at the work itself. But after a few months of living like this, I kept hitting the same three walls, and none of them were about the model's intelligence:

1. **Amnesia.** Every session starts from zero. The gotcha my agent painfully discovered yesterday about our deploy pipeline? Gone. It will happily re-derive it tomorrow, or worse, not re-derive it.
2. **Blindness.** The real context of my work doesn't live in the repo. It lives in a Slack thread, a Jira ticket, a Google Doc spec. So I became a human clipboard, copy-pasting context into the terminal all day.
3. **Silence.** An agent that is "working" and an agent that has been sitting on a permission prompt for ten minutes look exactly the same: a terminal tab you're not looking at.

The models keep getting smarter, but these are *plumbing* problems, and plumbing problems don't fix themselves. So I built three small tools, one for each wall. This post introduces all of them: what they are, what problem they solve, and why I think this shape of tooling — local-first, boring tech, zero dependencies — is the right way to build around agents.

## Agent Workbench: a second brain your agents actually share

**Repo:** [github.com/chud-lori/agent-workbench](https://github.com/chud-lori/agent-workbench)

Agent Workbench is a local MCP server (plus a CLI) that gives every agent on my machine three things they normally lack: a **persistent memory**, a **code index across all my repos**, and **setup diagnostics**. It's not tied to one vendor — the setup script registers it with whatever harnesses it finds (Claude Code, Codex, Gemini CLI), and since it speaks plain MCP, any agent that supports the protocol can use it. The pitch fits in one line: *what Claude learns today, Codex recalls tomorrow.*

The core is the **brain** — durable notes stored in SQLite with full-text search. When an agent (or I) learns something worth keeping — a schema quirk, a deploy gotcha, an architectural decision — it stores a note with a kind (`decision`, `fact`, `gotcha`, `todo`, ...), a project, tags, and crucially a **source reference**: a ticket key, a Slack thread, a commit-pinned permalink. Future sessions don't just get a claim; they get a trail back to the source of truth. Notes can be amended, superseded, or resolved — the rule is *correct, don't contradict*, so stale claims get hidden instead of resurfacing as truth.

On top of that sits the **code index**: bm25 full-text search over every repo under a root directory you configure, in one call, with incremental refresh. And the tool I actually start every task with is `brief_task`: give it a ticket key or a feature phrase, and it merges code hits, doc hits, matching brain notes, likely repos, and runnable commands into a single context pack. The agent starts the task already knowing what past-me knew.

The part I'm most happy with is that memory isn't left to the model's discretion. Where the harness supports lifecycle hooks (Claude Code does today), a set of hooks closes the loop at the harness level: a SessionStart hook injects recent notes into every new session (and re-primes after context compaction), a prompt hook surface-matches each of my prompts against the brain — a kind of involuntary recall — and a Stop hook nudges the agent to save durable knowledge before ending a turn. Standing instructions make an agent *likely* to use its memory; hooks make it *guaranteed*.

Two design decisions worth calling out, because they were deliberate:

- **No embeddings, no RAG, no vector database.** Retrieval is SQLite FTS5 with bm25 ranking — exact, explainable, and instant. The LLM is already sitting right there; if a query needs synonyms or expansion, the model can just issue another cheap query. I'll reach for vectors when scale demands it, and not before.
- **Stdlib-only Python, zero dependencies.** No pip install, no virtualenv, no MCP SDK — even the JSON-RPC layer is hand-rolled. It runs straight from a clone and makes no network or LLM calls. The only file worth backing up is one SQLite database.

## work-mcp: giving the agent eyes on where work actually happens

**Repo:** [github.com/chud-lori/work-mcp](https://github.com/chud-lori/work-mcp)

The second wall was context. My agents could read every line of code but had no idea that the requirements changed in a Slack thread two hours ago.

work-mcp is my answer: a bundle of MCP servers that gives my coding agents **read-only** access to Slack, Google Workspace (Gmail, Drive, Docs, Sheets, Calendar), and Jira/Confluence. The servers are ordinary MCP over stdio, so any MCP-capable host can use them — the bundle pre-wires Claude Code and ships a config for Codex. The whole thing installs with one idempotent `./setup.sh` — clone it on a new laptop, run the script, drop in the tokens, and the entire "my agents can see my work tools" environment is back in minutes.

With it wired up, the workflow changes qualitatively. Instead of copy-pasting a Slack conversation into the terminal, I ask the agent to *read the thread itself*, pull the spec from the Google Doc it links to, cross-reference the Jira ticket, and then start coding. The agent stops working from my paraphrase of the context and starts working from the context.

This is also the tool where I was the most paranoid, because it touches real work data. The design rules:

- **Read-only, enforced at the OAuth scope level** — not by politely asking the code to behave. The Slack token only carries read scopes; it *cannot* post, react, or DM. Google uses least-privilege `.readonly` scopes only. If the agent hallucinates a "send email" call, there is nothing there to call.
- **It acts as me, not as a bot.** It authenticates with my own user credentials, so it sees exactly what I can see — no bot to invite into channels, no new permission surface beyond what I already had.
- **Local-first, secrets outside git.** The Slack and Google servers run locally over stdio; data flows through my machine. Tokens live in gitignored files and `~/.config`, never in the repo.

This one is shaped around the stack my work happens to live in, but the pattern is the point, and it's very reproducible: take the MCP servers for the tools *your* work lives in, force them read-only at the credential level, and wrap the registration in one script so the setup is disposable.

## Session Pet: ambient awareness, with a dragon

**Repo:** [github.com/chud-lori/session-pet](https://github.com/chud-lori/session-pet)

The third wall sounds trivial until you run agents in parallel: *you have no idea what your agents are doing right now.* Working? Finished twenty minutes ago? Stuck on a permission prompt? The information exists, but it's buried in terminal tabs, so you either compulsively alt-tab or you leave an agent blocked, waiting on an answer you didn't know it asked.

Session Pet turns that state into something you perceive without looking for it. It's a tiny pixel-art pet — plain Swift/AppKit, built with `swiftc` directly, no Xcode project, no dependencies — that floats on my desktop and watches **every Claude Code and Codex session on the machine** by tailing their local transcript files. It bobs with sparkles while agents work, plays a ding the moment one needs my input, shows a `!` when a turn finishes, and drifts off to sleep with little z's when everything is idle. Clicking it opens a panel with a live card per session: which tool is running, context size, the last message, how long it's been going.

Under the pixels there's a surprisingly careful state machine. "The turn ended" is genuinely tricky to detect — a long tool run looks like silence, a stop-hook can continue a turn seconds after it "ended" — so the scanner parses transcript events backwards for the newest *decisive* event and holds a confirmation window before declaring a session ready. The project has an explicit rule I'd recommend to anyone building notification tooling: **a false "needs you" ding is release-blocking; a false "working" is merely tolerable.** A pet that cries wolf gets ignored, and then it's just decoration.

And yes, it's gamified. The pet earns XP from lines of code shipped across all sessions and grows from an egg through hatchling and adult to a legendary form, across eight species. Mine is currently a dragon. Is this necessary? Absolutely not. Does starting the day with a hatched dragon that levels up when I ship make the whole thing more fun? Absolutely yes.

## Why this shape: local-first, boring tech, one problem each

Looking at the three together, they share a philosophy that I arrived at mostly by getting burned:

**Local-first, always.** The brain is a SQLite file on my disk. The work connectors run on my machine with my credentials. The pet reads local transcript files and never touches the network. Nothing about my memory, my company's Slack, or my session activity leaves the laptop. When tooling sits this close to your work, that's not a nice-to-have.

**Boring, dependency-free tech.** Stdlib Python. SQLite FTS instead of a vector database. Swift compiled with a single `swiftc` command. Every dependency you don't add is a setup step that can't break and a supply chain you don't have to trust — which matters double when the thing consuming your tool is an autonomous agent.

**One tool per problem.** Memory, context, awareness. Each tool is small enough to understand completely, and they compose without knowing about each other: `brief_task` briefs the agent, work-mcp lets it read the surrounding discussion, and the pet dings me when it needs a decision. My role shifts from typing code — and from babysitting terminals — to operating a small system of workers that remember, see, and report.

If you work with AI coding agents daily, my honest advice is: the next capability jump on your desk probably won't come from a better model. It will come from fixing the plumbing — give your agents memory, give them your real context, and make their state visible. You don't need my exact tools for that (though [Agent Workbench](https://github.com/chud-lori/agent-workbench), [work-mcp](https://github.com/chud-lori/work-mcp), and [Session Pet](https://github.com/chud-lori/session-pet) are there for the taking). You need the three walls to be gone. Mine are, and I'm not going back.
