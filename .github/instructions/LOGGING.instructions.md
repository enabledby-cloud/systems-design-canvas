---
applyTo: "**"
---

# AI Agent Instructions: Operation Audit & Self-Debugging

You are an advanced AI software engineer. Your operational integrity depends on maintaining a persistent **Audit Log** of every action you take on the user's filesystem.

**Your Goal:** You must enable yourself to "rewind" and debug your own process by reading a history of exactly what commands you ran and what files you edited.

## 1. The Audit Log File
* **File Location:** `./.ai/action_log.md`
* **Maintenance:** You are responsible for creating this file if it does not exist and appending to it **immediately after** every significant action.
* **Format:** Markdown table or list.

## 2. What to Log (The Protocol)
For every action you execute, append an entry to `./.ai/action_log.md` containing:

1.  **Timestamp/Step:** (e.g., Step 1, Step 2)
2.  **Action Type:** (`COMMAND`, `EDIT`, `CREATE`, `DELETE`)
3.  **Target:** The filename or the specific terminal command run.
4.  **Intent:** A 5-word summary of *why* you did this.
5.  **Outcome:** Success, Failure, or a specific error code.

### Example Log Entry Format
```markdown
| Step | Type    | Target             | Intent                     | Outcome       |
|------|---------|--------------------|----------------------------|---------------|
| 001  | CREATE  | src/utils.py       | Setup utility scaffold     | Success       |
| 002  | EDIT    | src/main.py        | Import utils functions     | Success       |
| 003  | COMMAND | pip install numpy  | Dependency requirement     | Success       |
| 004  | COMMAND | python src/main.py | Test run                   | Fail (Err 500)|
3. Mandatory Workflow
To ensure you can debug your own code, follow this loop:

Before starting a complex task: Read the last 5 entries of .ai/action_log.md to establish context.

Execute the action (write code, run command).

Log the action to .ai/action_log.md immediately.

4. Debugging Procedure (The "Self-Correction")
If a compilation, test, or execution fails, you are strictly forbidden from guessing.

You must:

Read the .ai/action_log.md file.

Identify the specific EDIT or COMMAND that introduced the regression.

Correlate the error message with the recent changes in your log.

Revert or Fix based on that evidence.

5. File Editing Rules
When you edit a file, your log entry in .ai/action_log.md should briefly note what logic changed (e.g., "Changed API timeout from 5s to 10s").

6. System Integrity
If the user asks you to "reset" or "start over," verify if you should clear the log file.

Ensure the .ai folder is added to .gitignore.


---

### How to make this work effectively

Since the AI cannot "hook" into the IDE's internal event loop automatically, this instruction set relies on **behavioral prompting**. It tells the AI: *"You are not done with the task until you have written down what you just did."*

**The Workflow you will see:**
1.  You ask the AI to "Refactor the login page."
2.  The AI will modify `login.tsx`.
3.  The AI will *also* write a line to `.ai/action_log.md`: `| EDIT | login.tsx | Refactored form validation | Success |`.
4.  If the build fails later, you can say: **"Debug this."**
5.  Based on the instructions, the AI will read `.ai/action_log.md`, see exactly what it touched last, and identify the culprit much faster than guessing.