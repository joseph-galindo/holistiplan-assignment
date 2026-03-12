## Time
**Estimated Time Spent:**

## AI
[x] - Did you use AI tooling during the completion of your work?

**Details**

What tooling did you use?: Gemini

Please provide a brief description of how you used it:

I used AI tooling mainly for reference/research. For example, the bug with the user creation dates, I typically have an idea of what I need to reference, but I will often use Google search/Gemini summarization at a starting point for troubleshooting very specific problems.

I have used Claude Code in the past for code generation/iteration of work outside of this assessment, however, I did not use it here. My reasoning was: I personally find a tool like Claude Code much more useful when starting a project and getting past the initial "writer's block". I've used it in scenarios where I have a good idea or pre-written spec of the work I want to implement, and I want to get some starting code that conforms/respects the existing code style/structure of the larger codebase it is fitting into. I prefer to do this with codebases I have some pre-existing familiarity with, because that familiarity helps me better "steer" Claude in the direction towards "good" decisions and away from "bad" ones.

For a project like this, where I am brand new to both the tech stack and the product itself, I prefer to directly read and soak in as much of the codebase as possible, and write quite a bit in that codebase manually, before using a fuller solution like Claude. Generally, I've had good experiences with Claude Code, but it can be confidently wrong at times, or give a solution that is very subtly different to what the engineer had in mind. For that reason, I use it sparingly as needed, and I prefer to have manual hands-on experience with the codebase before letting Claude take a crack at it, so that I am better equipped to steer/iterate it towards good solutions.

## Application Notes

**Observed Bugs**
- My Account page
  - `user.created_at` timestamp returns utc timestamp without timezone suffix. This results in the frontend treating it as a local time. The bug is that a user created at 9pm UTC/5pm EST, will show as created at simply "9pm" (no timezone info in UI) if a user in the EST timezone views the user profile page.
- Dashboard page
  - Total servers count (50) doesn't match discrete statuses. Online (16) + Offline (13) + Maintenance (10) = 39. So 11 servers are registered but not showing up in online/offline/maintenance. I confirmed the total count is right by cross checking with the list on the Servers page.
  - The 11 "missing" servers actually have Status `error`, shown in the pie chart `Server Status Distribution`. So the count widget discrepancy is not necessarily a bug, but leaning more to confusing UI.
- Servers page
  - Edit modal - The UI renders changes to fields like `IP Address` upon closing the modal (either by clicking outside the modal, or the X, or the cancel button). This change **does not** go to the backend DB, it's strictly changing the data binded in the UI. If the user refreshes the page after getting into this state, the IP address "goes back to normal" since it's doing a fresh db fetch and UI re-render. Bug here is that the form field state directly binds to the table UI state - form data should ideally be an isolated clone of that state, and this clone gets generated/torn down each time the modal is opened/closed.
  - Add Server modal - adding a server with no Location given implies that it will be assigned the default location of `US-East`. However, if a user creates a server record in this fashion, no Location is assigned at all. Specifically, the server that comes back from `/api/servers` gives `location: ""` in the JSON object for that server.
  - Server records given from `/api/servers` have a similar UTC timestamp bug as the earlier user timestamp - `server.created_at` and `server.updated_at` both give ISO 8601 time strings, but with no timezone suffix.

**Other Insights**
- Dashboard page
  - Server Status Distribution pie chart:
    - Offline/Error coloring are somewhat close color shades. Could have potential problems for color blind users? I would typically discuss with a designer for a second opinion.
    - Online/Offline/Maintenance/Error buttons are clickable to hide that pie slice. Neat but not immediately apparent, UX could use changes with cursor change and/or tooltip explaining something like "Click to hide slice".
    - Hiding all the slices simply unrenders the pie chart. I think this could use further UI to handle edge cases like:
      - No data retrieved (let user know there is no data to show them)
      - Data exists, but all slices hidden (let user know there is data that can be shown, but they need to unhide at least one pie slice)
  - Average Resource Usage bar chart:
    - The entities included in the average calculations isn't clear. It is likely taking a flat average of recorded metrics across all 50 servers, but this should be made clearer to the user.
    - Average calculations from all 50 servers may not be what the user is needs (data may be too broad). This chart can likely benefit from offering some sort of filtering. For example, the user may want to see average resource usage across all Online servers only, or all servers working on the same task (eg I could imagine a scenario where 8 of the 50 servers are dedicated to product X, and the user wants to visualize resource usage of servers within product X).
    - The other big thing missing for this chart is the effective time range. For example, it is not immediately clear if this chart is visualizing average resource usage of the servers across all time, or the past 7 days, or the past 1 hour, etc. If we have data to that granularity, we should likely offer time filtering UI. In all cases (regardless of data granularity available), this widget should label the effective time range in some way for the user to understand.
  - Recent Servers table
    - The heurstic used to determine if a server is "recent" isn't clear. UX could maybe benefit from a `?` tooltip next to Recent Servers, that gives fuller explanation on hover/active state, that details what being a "recent" server means.
    - Offline/error pill coloring is the same - would ideally distinguish the two
    - CPU rendering not consistent with the same table row in the Servers page (0.64% vs 64%)
- Servers page
  - No search or filter options available (this is definitely one of the explicit tasks though)
  - No pagination options (could have perf problems and UX problems with extremely large datasets more than just 50 servers)
  - Location column lists the physical location of the server, **and** the OS the server is running (OS in this column seems strange)
  - Offline/error pill coloring is the same - would ideally distinguish the two
  - CPU rendering not consistent with the same table row in the Recent Servers table (0.64% vs 64%)
  - Actions column - Edit and Delete buttons could maybe use UX changes. The verbage/language makes it clearer they are buttons, but maybe add cursor pointer styles.

## Task Notes
