# Server Dashboard Application

A full-stack server management application built with Flask (backend) and Vue 3 (frontend).

## Tech Stack

### Frontend
- **Vue 3** - Progressive JavaScript framework
- **Vite** - Fast build tool and dev server
- **Vue Router** - Official routing library
- **Pinia** - State management
- **Tailwind CSS** - Utility-first CSS framework (via PostCSS)

### Backend
- **Flask** - Python web framework
- **Flask-SQLAlchemy** - ORM for database operations
- **Flask-Session** - Server-side session management
- **Flask-CORS** - Cross-Origin Resource Sharing support

## Quick Start (Automated Setup)

### One-Command Setup

**macOS/Linux:**
```bash
# For first-time setup (installs everything and starts servers)
./dev-setup.sh

# For daily development (when already set up)
./start-dev.sh
```

**Windows:**
```powershell
# PowerShell (Recommended - better error handling and output)
.\dev-setup.ps1    # For first-time setup
.\start-dev.ps1     # For daily development
```

> **Windows Users:** PowerShell scripts (`.ps1`) are recommended over batch files (`.bat`) as they provide better error handling, colored output, and more robust process management. If you encounter execution policy issues, run: `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force`

## Manual Installation & Setup

### Prerequisites
- Python 3.9+
- Node.js 20.19.0+ or 22.12.0 <= {version} < 25.0.0 (v21, and v25+ are not supported)
- npm or yarn

### Backend Setup

#### Step 1: Navigate to the backend directory
```bash
cd ./backend
```

#### Step 2: Create a Python Virtual Environment
A virtual environment isolates your Python dependencies from your system Python installation.

**On macOS/Linux:**
```bash
# Create a virtual environment named 'venv'
python3 -m venv venv

# Activate the virtual environment
source venv/bin/activate
```

**On Windows:**
```bash
# Create a virtual environment named 'venv'
python -m venv venv

# Activate the virtual environment
venv\Scripts\activate
```

**Note:** After activation, you should see `(venv)` at the beginning of your terminal prompt, indicating the virtual environment is active.

#### Step 3: Install Python Dependencies
With the virtual environment activated, install the required packages:
```bash
pip install -r requirements.txt
```

#### Step 4: Start the Flask Development Server
```bash
python app.py
```

The backend will be available at `http://localhost:5000`

#### Deactivating the Virtual Environment
When you're done working on the project, you can deactivate the virtual environment:
```bash
deactivate
```

#### Future Development Sessions
For future development sessions, remember to activate the virtual environment before starting the server:
```bash
cd ./backend
source venv/bin/activate  # On macOS/Linux
# OR
venv\Scripts\activate     # On Windows
python app.py
```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd ./frontend
   ```

2. Install Node.js dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
   
   The frontend will be available at `http://localhost:5173`

## Troubleshooting

### Common Issues

#### Virtual Environment Not Activating
- **Issue**: The `(venv)` prefix doesn't appear in your terminal
- **Solution**: Make sure you're in the `backend/` directory and running the correct activation command for your OS
- **Alternative**: Try using the full path: `source ./venv/bin/activate` (macOS/Linux)

#### "python3: command not found" Error
- **Issue**: Python 3 is not installed or not in your PATH
- **Solution**: 
  - On macOS: Install Python via [python.org](https://python.org) or use `brew install python3`
  - On Windows: Install Python from [python.org](https://python.org) and ensure "Add to PATH" is checked
  - Try using `python` instead of `python3`

#### "pip: command not found" Error
- **Issue**: pip is not installed or not accessible
- **Solution**: 
  - Try `pip3` instead of `pip`
  - On some systems, use `python -m pip` or `python3 -m pip`

#### Permission Denied Errors
- **Issue**: Permission errors when installing packages
- **Solution**: Make sure your virtual environment is activated before installing packages. Never use `sudo` with pip in a virtual environment.

#### Port Already in Use
- **Issue**: "Address already in use" error when starting the server
- **Solution**: 
  - Check if another instance is running: `lsof -i :5000` (macOS/Linux) or `netstat -ano | findstr :5000` (Windows)
  - Kill the existing process or use a different port

#### Dependencies Not Installing
- **Issue**: Errors during `pip install -r requirements.txt`
- **Solution**:
  - Ensure your virtual environment is activated
  - Update pip: `pip install --upgrade pip`
  - Try installing packages individually to identify the problematic one

#### Windows script execution
- if you get an error running the .ps1 scripts you may need to run `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned -Force` to allow your current user to run scripts

## Usage

### Demo Accounts
The application comes with pre-configured demo accounts:
- **Admin**: username `admin`, password `admin123`
- **Demo User**: username `demo`, password `demo123`


## Challenge

The challenge here is laid out as a series of tasks. The intent is to spend no more than 5 or 6 hours and accomplish as much as you can. It is not required (or expected) that you will accomplish all of the asks below, but work through them and accomplish what you can. Our goal is to see how you approach tasks, how you think about the broader context of your work, and what type of solutions you present. A few really well thought out solutions is often better than many rushed through. 

If you are not able to complete all tasks and would like to explain how you would approach any incomplete tasks, feel free to add a section to the `Observations.md` file that includes your explanations.

Please clone this repo to your local system (do _not_ fork or PR against this repo) and then create a new repo for it to point at (preferably public). The optimal setup would be as follows:
- `git clone https://github.com/ocrfin/fe_homework.git` 
- Setup a repo and point the clone you create at that
   - login with your standard github user and create new public repo with any name you like e.g `my_project_repo`
   - after cloning as described above cd into the `fe_homework` directory
   - view your git remotes `git remote -v` 
   - change the remote to the newly created repo `git remote set-url origin https://github.com/<username>/my_project_repo.git`
   - verify the change took with another `git remote -v`
- Push the base application up as a baseline branch
   - `git push -f origin main` // this is a force push to set the new repo to the state of the hw repo
- create a branch for the work you do and when complete open a PR to that main branch

Once complete, send us a link to the PR so we can see what you changed vs the default code.

## Context

Assume you are an engineer working for a startup in the infrastructure management space. Below you will find a list of your currently assigned tasks. There is no stated priority on these, please read through them and tackle them in whatever order you feel most comfortable.

### What We're Looking For

At Holistiplan we believe engineering is about more than just implementing features —- it's about understanding systems, taking ownership of quality, and thinking holistically about the impact of your work. Before you approach these tasks, we encourage you to familiarize yourself with the application as you would in a real work environment. We do not expect you to implement solutions for what you find (however, you are welcome to do so if there are overlaps with the tasks you choose to do from the list below), but would love to hear about what you observed. To that end, please document your observations and insights in the `Observations.md` file as you go.

You'll notice that some tasks are intentionally open-ended or lack complete specifications. This is deliberate. We want to see how you handle ambiguity, what assumptions you make, and how you take ownership of delivering comprehensive value rather than just checking a box. Consider the user impact, edge cases, and the maintainability of your solutions.

As you implement features, consider where else in the application similar functionality might benefit users. We are looking for engineers that think holistically about systems -- not just completing individual tasks, but understanding how features interconnect.

### AI and Development Tools

We embrace AI as a powerful engineering tool and force multiplier. You are welcome and encouraged to approach this work in any way you prefer, with or without AI assistance. However, you must own the outcome of your work regardless of approach. Please include a brief note in the `Observations.md` file describing:

1. Whether you used AI tools during this challenge or not
2. How you used them (e.g., full code generation, research and reference, debugging assistance, architectural planning, etc.)

Be prepared to discuss and explain your code, architectural decisions, and implementation approach with our team. We're interested in understanding your thought process and how you leverage tools effectively, not just the final code output.

### Time Spent

The goal is that you spend 5 - 6 hours on these tasks. Please add an estimate of your final time spent to `Observations.md`.

## Backlog

### General Observations

As you work through the backlog items and familiarize yourself with the application, pay attention to how things work, consider the user experience, and think about what could be improved. Please document any observations you have about the system in the `Observations.md` file. This could include anything that catches your attention while exploring the codebase or using the application. If you address any issues you discover while working on other tasks, note what you found and what you fixed.

> **Note:** High-quality observations about the codebase are just as valuable as completed tasks. We want to understand how you think about systems, not just what you can implement in a limited timeframe.

### Task FE-001: Server Health Monitoring
Implement a health score system on the dashboard that calculates server health based on resource usage (CPU, memory, disk). 
This should be a single number between 0 and 100, with closer to 100 indicating better health. 
The score should be calculated based on server metrics and weighted as follows:

CPU Usage: 40%
Memory Usage: 40%
Disk Usage: 20%

**Considerations:**
- Where should this feature appear in the UI?
- What happens when resource data is missing or invalid?
- What UX decisions might you make to maximize the value of this health score?

### Task FE-002: Filtering and Sorting
Add filtering and sorting capabilities to the `Servers list` view to help users manage large numbers of servers effectively.
Filter state does not need to persist between visits.

Initial support should include 

filtering by:
- free text search of server name
- IP address (simple matching for mvp)
- status
- location

Sorting by:
- Name
- Status
- Location
- Uptime

**Considerations:**
- How should filter state be managed? 
- Is there any other data that would be valuable to filter on?


### Task FE-003: Dashboard Interactivity
Users have reported that the dashboard view is not super helpful as it doesnt always show the data they need or that is up to date.
Please add interactivity to the dashboard view that will help our users be able to see data that is more timely and pertitent to them.

**Considerations:**
- What types of interaction would a user benefit from?
- How could you improve the "real time" feel of the dashboard?
- How might a user want to customize their dashboard?


### Task FE-004: Bulk Operations
The `Server List` view can get fairly cumbersome to work with due to its one dimensional approach to managing entries.
Please add support for bulk operations to allow users to efficiently manage multiple servers simultaneously.

Initial support should include:
- delete
- updating the status

**Considerations:**
- Are there any other operations that should support bulk actions?
- How will you manage selection state?
- What confirmation/safety measures are needed?


### Task FE-005: Error Handling and User Feedback
Users have reported that they don't always understand how the system is working and what is processing vs complete etc.
Please work to improve the user experience by adding error handling/validation, loading states, and user notifications throughout the application.

**Considerations:**
- What type of actions should the user be notified about?
- When should users be notified of these actions?
- How should information (form errors, loading states, and state updates) be communicated?
- What loading states are missing?



