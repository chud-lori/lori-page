---
author: Lori
pubDatetime: 2026-07-14T01:30:00.000Z
modDatetime: 2026-10-13T00:00:00.000Z
title: "Memory, Context, and a Pixel Dragon: Three Tools I Built to Live with AI Coding Agents"
slug: ai-agent-toolkit
featured: true
draft: false
tags:
  - AI
  - tooling
  - agents
description: "AI coding agents forget everything between sessions, can't see the Slack thread or ticket the work came from, and give no sign when they're stuck. I built Agent Workbench, work-mcp, and session-pet to deal with those three problems."
---

Most days I have two or three agent sessions open at once: Claude Code on one ticket, Codex on another. They're good at the coding itself. After a few months of working this way, the problems I kept hitting had nothing to do with how smart the model is:

1. **It forgets.** Every session starts from zero. If an agent spent twenty minutes figuring out a quirk in our deploy pipeline yesterday, today's session doesn't know about it. It either works it out again or gets it wrong.
2. **It can't see where the work comes from.** Requirements live in a Slack thread, a Jira ticket, a Google Doc. The repo has none of that, so I spent my day copying context into the terminal.
3. **It doesn't tell me when it's stuck.** A session that's busy and a session that has been waiting on a permission prompt for ten minutes look the same from another tab.

I built one small tool for each problem. Here's what they do and how they're built.

## Agent Workbench: memory shared by every agent

**Repo:** [github.com/chud-lori/agent-workbench](https://github.com/chud-lori/agent-workbench)

Agent Workbench is a local MCP server with a CLI. `setup.sh` registers it with whichever of Claude Code, Codex, and Gemini CLI it finds on the machine. It's plain MCP over stdio, so other MCP clients can use it too. Something Claude Code stores today, Codex can recall tomorrow.

The main piece is the brain: notes in a SQLite database with full-text search. When an agent (or I) learns something worth keeping, like a schema quirk, a deploy gotcha, or a decision, it stores a note with a kind (`decision`, `fact`, `gotcha`, `todo`, and a few others), a project, tags, and a source: the ticket key, the Slack thread, or a link pinned to a commit. A future session gets the claim and a way to check it. When a note turns out to be wrong, the agent amends it or stores a new one that supersedes it, and the old one stops showing up in recall. Contradicting notes don't pile up.

Next to the brain is a code index: bm25 search across every repo under the roots you configure, refreshed incrementally. The tool I start most tasks with is `brief_task`. I give it a ticket key or a feature name and it returns matching code, docs, brain notes, the repos that are probably involved, and the commands to run them, all in one result.

On Claude Code, hooks handle the routine parts so I don't depend on the model remembering to:

- A SessionStart hook loads recent notes into every new session, and again after the context gets compacted.
- A prompt hook searches the brain with each message I send and injects the top matches.
- A Stop hook blocks the end of a turn once and asks the agent to save anything worth keeping.
- A PreToolUse hook makes me approve any Bash command that matches patterns I list. It does nothing until I add patterns.

The hooks are best-effort by design and always exit cleanly, because a hook that can break session start is worse than one that sometimes does nothing. Recall still went from "when the model thinks of it" to "every session". Since I first wrote this post, the repo has also picked up six skills (`/standup`, `/why`, `/postmortem`, and others), three subagent types that check the brain before they search, and git hooks that keep AI attribution lines out of my commits.

Two choices were on purpose:

- **No embeddings and no vector database.** Search is SQLite FTS5 with bm25 ranking, so the same query returns the same rows and I can see why something matched. If a query needs synonyms, the model is right there and can run another search. I'll add vectors if keyword search stops being enough. It hasn't yet.
- **Standard-library Python only.** No pip install, no virtualenv, no MCP SDK. I wrote the JSON-RPC layer myself. It runs from a fresh clone with Python 3.10 or newer, makes no network or LLM calls, and keeps its state in one SQLite file.

## work-mcp: letting the agent read Slack, Docs, and Jira

**Repo:** [github.com/chud-lori/work-mcp](https://github.com/chud-lori/work-mcp)

My agents could read every line of code but had no idea the requirements changed in a Slack thread two hours ago.

work-mcp is a bundle of MCP servers for Slack, Google Workspace (Gmail, Drive, Docs, Sheets, Calendar), and Jira/Confluence. One idempotent `./setup.sh` installs the dependencies and registers the servers with Claude Code, and the README covers wiring the same servers into Codex. On a new laptop I clone it, run the script, add my tokens, and I'm set up again in a few minutes.

With it set up, I stopped paraphrasing. I ask the agent to read the Slack thread, open the spec it links to, check the Jira ticket, and then start. It works from the source instead of my summary of it.

This is the one I was most careful with, because it touches real work data:

- **The Slack and Google servers are read-only at the credential level.** The Slack token only has read scopes, so it can't post, react, or send a DM. Google uses only `.readonly` scopes. If the agent tries to send an email, there is no tool for it and no permission behind it.
- **Jira and Confluence are different.** They go through Atlassian's hosted MCP server, which has write tools (create issue, edit issue, add comment). work-mcp only registers it. For that one I rely on the harness asking me before each call.
- **It acts as me, not as a bot.** It uses my own credentials, so it sees exactly what I can see, and there's no bot account to invite into channels.
- **Tokens stay out of git.** They live in gitignored files and `~/.config`.

I built it around the tools my job uses. If yours are different, the same approach still works: find MCP servers for the tools your work lives in, limit their tokens to read scopes wherever the API allows it, and put the setup in one script.

## session-pet: knowing what the agents are doing without checking

**Repo:** [github.com/chud-lori/session-pet](https://github.com/chud-lori/session-pet)

This problem seems small until you run agents in parallel. Is a session still working, did it finish twenty minutes ago, or is it waiting on me? The answer is there in a terminal tab, so either I keep switching tabs to check, or an agent sits blocked on a question I never saw.

session-pet is a small pixel-art pet that floats on the desktop and watches every Claude Code and Codex session on the machine by reading their local transcript files. It's native on both platforms: Swift/AppKit on macOS and Rust/GTK on Linux, with no Electron. It bounces while agents work and chimes when a turn finishes. When a session needs me, it plays a double ping that repeats until I respond. If a session goes quiet mid-turn for five minutes, it marks it stalled. Clicking the pet opens a card for each session, and clicking a card takes me to the terminal running it.

Detecting that a turn has ended is harder than it sounds. A long tool call looks like silence, and a stop hook can restart a turn a few seconds after it seemed to end. The scanner reads each transcript backwards to find the newest event that settles the state, then waits out a short confirmation window before it marks a session ready. The project has one rule I'd recommend for any notification tool: a false "needs you" or "ready" ding blocks a release, and a false "working" is acceptable as long as it doesn't last. Once a pet dings for nothing a few times, you stop listening to it.

It also has XP. Each finished turn earns 5 XP, and the pet goes from egg to hatchling to adult to legendary across 11 species. The project's mascot is a dragon. Mine is currently Mario. None of this is necessary, but I like watching it level up.

## What the three have in common

**They run locally.** The brain is a SQLite file on my disk. The Slack and Google servers run on my laptop with my credentials. The pet reads local files and never touches the network. To be clear, this doesn't keep the data private: anything an agent reads, whether a brain note or a Slack thread, goes to the model provider like the rest of its context. What it does mean is there's no third-party service in between holding a copy of my notes or my company's messages.

**They have few or no dependencies.** Agent Workbench uses only Python's standard library, and session-pet needs nothing beyond each platform's own UI toolkit. work-mcp has the most, since its Slack and Google servers need their own packages. I chose this on purpose. Every dependency I skip is one less setup step that can break and one less package I have to trust, and that matters more when the thing calling my tool is an agent that runs commands without me watching each one.

**Each one does one job.** Memory, context, and status are separate tools, and none of them knows about the others. In a normal task, `brief_task` gives the agent background, work-mcp lets it read the discussion behind the ticket, and the pet tells me when it needs a decision.

If you work with coding agents every day, you don't need these exact tools. You do need some answer to the same three problems: the agent should remember what it learned, read the context the work came from, and make it obvious when it's waiting on you. All three repos are public if you want to start from mine: [Agent Workbench](https://github.com/chud-lori/agent-workbench), [work-mcp](https://github.com/chud-lori/work-mcp), and [session-pet](https://github.com/chud-lori/session-pet).
