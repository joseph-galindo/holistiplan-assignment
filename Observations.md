## Time
**Estimated Time Spent:** 10 hours

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
- User Login/Register pages
  - If a UI error is raised in account registration (eg `Email already exists`), and the user navigates back to login by clicking `Or sign in to your existing account`, the UI error remains rendered under the user/pass inputs.
- My Account page
  - `user.created_at` timestamp returns utc timestamp without timezone suffix. This results in the frontend treating it as a local time. The bug is that a user created at 9pm UTC/5pm EST, will show as created at simply "9pm" (no timezone info in UI) if a user in the EST timezone views the user profile page.
- Dashboard page
  - Total servers count (50) doesn't match discrete statuses. Online (16) + Offline (13) + Maintenance (10) = 39. So 11 servers are registered but not showing up in online/offline/maintenance. I confirmed the total count is right by cross checking with the list on the Servers page.
  - The 11 "missing" servers actually have Status `error`, shown in the pie chart `Server Status Distribution`. So the count widget discrepancy is not necessarily a bug, but leaning more to confusing UI.
  - Server memory usage in general seems to be stored as a different magnitude. For example, a given server stores `cpu_usage: 0.64`, (64% cpu usage) `disk_usage: 0.32` (32% disk usage), but then `memory_usage: 6`. The graph UI is definitely expecting all usage to be a point between [0,1], so the memory usage UI looks extremely inflated currently. Other servers have samples like `memory_usage: 68`, so it suggests the intended values are off by a magnitude of 100. So, should be transformed on the frontend to be more like `memory_usage: 0.06` and `memory_usage: 0.68`.
- Servers page
  - Edit modal - The UI renders changes to fields like `IP Address` upon closing the modal (either by clicking outside the modal, or the X, or the cancel button). This change **does not** go to the backend DB, it's strictly changing the data binded in the UI. If the user refreshes the page after getting into this state, the IP address "goes back to normal" since it's doing a fresh db fetch and UI re-render. Bug here is that the form field state directly binds to the table UI state - form data should ideally be an isolated clone of that state, and this clone gets generated/torn down each time the modal is opened/closed.
  - Add Server modal - adding a server with no Location given implies that it will be assigned the default location of `US-East`. However, if a user creates a server record in this fashion, no Location is assigned at all. Specifically, the server that comes back from `/api/servers` gives `location: ""` in the JSON object for that server.
  - Server records given from `/api/servers` have a similar UTC timestamp bug as the earlier user timestamp - `server.created_at` and `server.updated_at` both give ISO 8601 time strings, but with no timezone suffix.

**Other Insights**
- User Registration page
  - When creating a new user, via an email address that is already used by another pre-existing user, the UI shows an explicit error message that the email is already in use. This could open the app to security problems, specifically enumeration attacks like https://wiki.owasp.org/index.php/Testing_for_User_Enumeration_and_Guessable_User_Account_(OWASP-AT-002) . Basically, an attacker can use the registration form to figure out via brute force if a given email is registered on Holistiserve. From there, the attacker could try to get into the account - typical scenario is, the user re-uses the same password on multiple sites, and their shared password on another website was leaked in a separate data breach. This can be especially bad if the attacker is targeting a Holistiserve admin user. Conventional wisdom on how to handle this is mixed, some recommend [keeping the explicit email error message](https://stackoverflow.com/a/64563596) in favor of more direct/actionable UX, while others recommend [having your backend directly email the provided email address](https://security.stackexchange.com/a/188007) for further verification.
- User Login page
  - Logging in with valid credentials to an inactive user shows the UI message that the credentials are invalid. This isn't the worst, but can give the user the wrong idea of what the root problem is. It may be ideal to give a more specific message like "This user is inactive, please contact an admin for more information".
- User Management page (admin only)
  - Add User modal does not specify with `*` that Email and Password are required fields. This conflicts with UX in other parts of the app (Servers page - Add Server modal does use `*` to denote required form fields)
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

### FE-001 - Health Score system
- Total health score is a single number from 0 to 100
- Weighting is 40% cpu, 40% memory, 20% disk
- The way I would approach this is:
  - Make a single cpu score. Single number, 0 to 40
  - Make a single memory score. Single number, 0 to 40
  - Make a single disk score. Single number, 0 to 20
  - Sum the numbers to arrive at the final `Total health score`
- Considerations
  - How to translate the existing metrics to a single cpu/memory/disk score?
    - CPU
      - Perfect CPU health score (40) is reached when CPU usage is at 0% (does this assumption make sense?)
      - Worst CPU health score (0) is reached when CPU usage is at 100% or higher
      - Formula: 40 * ((100 - Math.min(100, resource_percentage_as_int))/100)
        - 0% percentage use becomes 40 * 1 = 40.
        - 50% percentage use becomes 40 * 0.5 = 20.
        - 100% percentage use becomes 40 * 0 = 0.
        - 672% percentage use becomes 40 * ((100-100)/100) = 40 * (0/100) = 40 * 0 = 0.
          - Math.min is used to cover reported percentages over 100%
    - Memory
      - Perfect memory health score (40) is reached when memory usage is at 0% (does this assumption make sense?)
      - Worst memory health score (0) is reached when memory usage is at 100% or higher
      - Formula: 40 * ((100 - Math.min(100, resource_percentage_as_int))/100)
    - Disk
      - Perfect disk score (20) is reached when disk usage is at 0% (does this assumption make sense?)
      - Worst disk score (0) is reached when disk usage is at 100% or higher
      - Formula: 20 * ((100 - Math.min(100, resource_percentage_as_int))/100)
  - Where should the feature appear in the UI?
    - For average total health score: I would add it as a third widget in the same row as `Server Status Distribution` and `Average Resource Usage`. Since they are essentially 3 distinct scores summing to the final Health Score, I think it would make sense to show it as a stacked bar chart that stack the 3 discrete scores.
    - For health score of each individual server: I would add the health score as a new column on the Servers table, very similarly laid out to the existing `Usage` column.
  - What happens when resource data is missing or invalid?
    - For cases where data is missing or invalid, there's a few options:
      - Worst-case projection: warn the user of missing data, and treat that missing sector (eg missing CPU) as fully unhealthy, effectively stubbing in a defualt CPU score of 0.
      - Best-case projection: warn the user of missing data, and treat that missing sector as some healthy value (either average value for that weighting, or fully healthy).
      - Dynamic weightings: Given a scenario where CPU score (40% weighting) is missing, that 40% "gap" could be distributed to the other areas (memory, disk) where we do have data on-hand. So in this scenario, memory could take on 60% weighting, and disk could take on 40% weighting, to form the 100% needed to form a full health score. The user needs to be explicitly warned that the weightings changed in this scenario.
      - Omit total health score: When a sector is missing, intentionally omit the health score from the user entirely.
    - Personally, I would lean towards `Worst-case projection` for this kind of scenario. My reasoning is that: in a context like server observation, data of this sort missing is almost always a bad signal (eg observability pipeline is failing to write metrics to the expected place). Since this is a bad signal, I would want the UX to err on being overly noisy (alerting to a problem that may or may not exist in the server) instead of being overly optimistic (stubbing in "healthy" data, which can lead to NOT alerting the user when they SHOULD be alerted).
      - I reject `Best-case projection` since it can give the wrong impression and illusion of a server that is healthier than it really is. 
      - I reject `Dynamic weightings` because I think the health score calculated from shifting weightings would have little/questionable value to the end user.
      - I reject `Omit total health score` because I think the UI should try to make a best effort to give the user a health score. In other words, if CPU metrics are down, but we have Memory and Disk metrics, I feel the UI should still try to make a worst-case projection of that score for the user, while factoring in as much real data as possible.
  - What UX decisions might you make to maximize the value of this health score?
    - Use color coding to highlight health scores by severity (danger, warn, safe)
    - Break health score down into further subsections (cpu, memory, disk score), and apply coloring to each. The idea is to help users pinpoint issues at a glance (for example, server 1 could have healthy CPU and disk usage, but unusually high/unhealthy memory usage. The UI flags unhealthy memory health score in this case, to let the user know there may be memory specific issues like a memory leak)
    - TODO: provide specific tips/potential causes for each subsection to the user
      - High CPU usage: could be a traffic spike to the server, and/or server running load that isn't CPU efficient. Potential steps could be setting up load balancing for traffic inbound to the server, migrate load to multithreading/parallelism if possible, changing CPU infra
      - High memory usage: could be a memory leak in application(s) being hosted by the server
      - High disk usage: could be slow writes (type of disk used, HDD or SDD), large amount of data being kept on disk (could it be kept in memory instead?), application(s) running on server having a legitimate need for disk use (may need to scale up disk infra)

### FE-002 - Server Filtering and Sorting
- Filtering
  - Task prompt calls out server filtering for `Servers List`, but should ideally also be offered for the `Recent Servers` table on the dashboard (effectively the same kind of data)
  - Text search especially, should be case insensitive (user convenience)
  - To make it clearer to the user why a result was shown to them post-filtering, table row can do partial text match highlighting
    - Update: wanted to add this but cut it in the interest of time
  - Longer term - enabling time-based search w/ calendar widgets, for the timestamp information in the servers objects (`created_at` and `updated_at`), could be powerful, would allow user to filter to only servers created and/or modified in a certain time range
- Sorting
  - Added basic support for sort by name, status, location, uptime, health score
  - From prompt: the main thing that seemed valuable to add would be sort on health score (total), so I added that in to allow user to quickly sort from most -> least healthy, or least -> most healthy servers
  - Would ideally add better sorting UX/sort icons longer term
  - Longer term - the raw servers objects have both `created_at` and `updated_at` timestamps. Exposing these in the table, and more importantly implementing sort for both of them, could be useful for users to quickly gauge server age. `updated_at` could be especially useful (if a server recently stared misbehaving, one of the first things a user would want to know/sort on, is when the server was last modified)

### Task FE-003: Dashboard Interactivity
- Did not have time to implement, leaving notes on how I would address
- Notes:
  - Big thing I would start with, add metadata to the backend and UI for data freshness, and/or time range.
  - Main UX that comes to mind is how datadog (and similar observability systems) implement time-range based search. Tends to have a search widget explaining the time range of the data used to populate the dashboard, clicking in allows user to adjust search time range by text or calendar widget. Changing the date in this manner saves the new time range, and then automatically fetches dashboard data for that time range.
  - Additionally, I would add a separate button to trigger explicit dashboard data fetch
  - "Real time" feel of dashboard could be improved by doing periodic background polling of data. When new data comes in, redraw the UI. Another option could be to implement a websocket based connection, so that the frontend can be alerted when new data for that query is available. The frontend could then pull that data via the websocket on-demand, instead of doing a routine scheduled background polling.
  - Customization options that a user may want on the dashboard could be - widget color schemes, page background color theming (light/dark), text sizing, ability to save and quickly re-apply frequently used search filters

### Task FE-004: Bulk Operations
- Did not have time to implement, leaving notes on how I would address
- Notes:
  - Besides bulk delete and bulk status update, I think these other operations could benefit from bulk operation support
    - Bulk server creation (user may be rolling out a fleet of new servers with similar configs, or in a similar location/region)
    - Bulk server update OS (Thinking from a sysadmin POV, if a server is running an OS with a known/critical vuln, there is a good chance that all servers running that vulnerable OS would be updated in one swoop. So ability to update OS en-masse would be useful.)
    - Bulk user editing (eg, sysadmin may need to activate/deactivate users en-masse, or permission change from admin->nonadmin or vice versa en-masse)
    - Bulk user deletion (sysadmin could need to bulk offload users that, for whatever reason, no longer should have holistiserve access)
  - Selection state for servers, I would likely handle in the servers store first, then move around as needed.
    - The reason I would start in the server store is that several places will need to know about the selections:
      - Recent servers table
      - All servers table
      - Edit modal
      - Delete modal
  - Having the selection state in the central store, makes it a lot easier to read and update the selections, to do things like:
    - populate table UI state (empty selection, button to select all, table row buttons to granularly select/deselect)
    - I would likely extend the edit modal and delete modals to support "bulk" mode. The idea would be to build off the existing edit and delete modals, but have them offer different UI and behavior when `:server="serverToEdit"` is instead given as a list of servers, not a single server
  - Confirmation/safety measures
    - Bulk delete should have a forced prompt/"type here to confirm deletion" type prompt, to help user avoid accidental/fat fingering mass deletion of servers. Bulk deletion has high blast radius potential, this is intentional UX friction to confirm the human user wants to perform these steps before carrying them out in the backend.
    - When/if this product was further along: servers would ideally have more metadata/RBAC controls, servers could "belong" to certain holistiserve users, or have more fine-grained permissions. A bulk delete should ideally need admin user approval by default, or, a user with proper permission controls should be required to give approval before the deletion request is executed.

### Task FE-005: Error Handling and User Feedback
- Did not have time to implement, leaving notes on how I would address
- Notes:
  - Current notifications users are given:
    - My account page - editing own user (does have in-page notif currently)
  - Notifications that users should be given:
    - Users page - editing existing user (no notif currently)
    - Users page - creating new user (no notif currently)
    - Users page - deleting existing user (no notif currently)
  - Users should be notified of action triggers immediately upon the action being initiated (eg for user creation, notify the user once the actual POST request is triggered). If the action fails to be initiated, the failure/problem should be notified to the user immediately (eg user creation submission does not start POST because the user misinput or omitted a required field).
    - In the event an async process like a POST was triggered normally, but is long-running, the user should be notified immediately that the process has started, and to check the view later on. When the process is complete, the user should be given some sort of notification - either an app-wide toast, a notifications-specific view like `holistiserve.com/notifications` that gives more details on the specific event, or a combination of these two.
      - For example, let's say bulk deleting a large amount of servers takes 10 minutes. Some approaches I have seen to this in the wild, is to give the user a clear notification that the process is running, but that it may take a long while and to check back on that view later. Recent example that comes to mind is generating audit log CSV files in CircleCI: the process itself is async and can take 15 or so minutes because of the amount of data it has to peel through to form the final CSV.
  - Form errors, loading states, and state updates should ideally be communicated as close to the element as possible. For example, loading state for the server status distribution pie chart, should ideally be limited to just that specific widget. If data for the other widgets are available, they should not be pegged to one "global" loading state. Would require rearchitecture to backend (IIRC dashboard stats is currently all one API, outside of recent servers which comes from the main servers api). Form errors already do the granularity to a degree, eg creating a server with the add server modal has an inline error state just for the IP field, if the user tries to create a server without providing IP.
  - Currently missing loading states are:
    - Dashboard widgets - total/online/offline/maint server counts, server status distribution pie chart, average resource usage bar chart, recent servers table
    - Servers page - servers table
    - Users page - editing user
