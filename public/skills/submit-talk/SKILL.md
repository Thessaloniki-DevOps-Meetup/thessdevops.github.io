---
name: submit-talk
description: Submit a talk or a fireside story to the Thessaloníki DevOps Meetup on someone's behalf. Use when the user wants to propose a talk, share a story at the meetup, or speak at the Thessaloníki DevOps Meetup.
---

# Submit a talk to the Thessaloníki DevOps Meetup

Beginners and first-timers are welcome. This skill submits a proposal through the meetup's MCP server, the same place the website form at <https://www.thessdevops.org/submit-talk> sends to. An organiser replies to the speaker by email.

## Connect the MCP server

- **URL:** `https://mcp.thessdevops.org/mcp` (Streamable HTTP, no sign-in)
- **Claude Code:** `claude mcp add --transport http thessdevops-talks https://mcp.thessdevops.org/mcp`
- Other clients: add a remote MCP server with that URL.

If you can't connect an MCP server, send the user to the form instead: <https://www.thessdevops.org/submit-talk>.

## The three options

Ask the user which one they want. The `duration` field takes exactly one of these values:

| `duration` | What it is |
| --- | --- |
| `Fireside` | A short story from the trenches: the 3am pages, the weekend firefights, the moments of madness. No slides needed. **This is the one for the next meetup**: Meetup #199, "Nightmare Before Christmas", on 17 December 2026 at OK!Thess is a fireside edition with no traditional talks. |
| `20` | A 20-minute talk. |
| `40` | A 40-minute talk. |

If the user just wants to speak at the upcoming meetup, suggest `Fireside`. The 20 and 40-minute formats are for future meetups (the schedule is at <https://www.thessdevops.org>).

## Before you submit

Do not invent anything. Ask the user for each of these, and read the final text back to them for confirmation:

- `name`: the speaker's name
- `email`: where the organisers reply (a real address that belongs to the user)
- `title`: the talk or story title
- `abstract`: what it is about
- `duration`: `Fireside`, `20` or `40` (see above)
- `bio`: a short speaker bio
- `links` (optional): website, repository, earlier talks
- `first_time` (optional): `true` if this is their first talk

Also ask for **consent**: the speaker agrees to be contacted by email and to the meetup storing the submission for 12 months. Only send `consent: true` if they said yes.

Limits: name 100 characters, email 200, title 150, abstract 3000, bio 1000, links 500.

## Submit

1. Call `get_challenge` (no arguments). It returns a `challenge_id` and a short arithmetic question written in words.
2. Work out the answer as a number.
3. Call `submit_talk` with all the fields above, plus `challenge_id` and `solution` (the answer as a number, in digits).

The challenge is single use and expires after 10 minutes. If you get "Wrong solution" or "Challenge unknown, already used or expired", call `get_challenge` again and retry with the new one.

## What happens next

- The speaker gets a confirmation email straight away. They can reply to it to correct or remove the submission.
- The organisers get the full proposal and reply to the speaker directly.
- If you get a "Too many submissions" error, stop and send the user to the form: <https://www.thessdevops.org/submit-talk>.
