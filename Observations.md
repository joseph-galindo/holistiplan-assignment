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
- User Login/Register pages
  - If a UI error is raised in account registration (eg `Email already exists`), and the user navigates back to login by clicking `Or sign in to your existing account`, the UI error remains rendered under the user/pass inputs.
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
    - Need to come back to this, I don't fully understand the question
