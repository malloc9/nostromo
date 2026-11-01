# MU/TH/UR 6000 -- Genuine Computer Interaction

## Detailed product and technical development plan

**Project:** Nostromo fan simulator\
**Feature:** Make the computer genuinely interactive\
**Status:** Planning specification\
**Primary goal:** Transform the existing themed terminal into a
coherent, stateful simulation of the Nostromo's onboard computer.

------------------------------------------------------------------------

## 1. Product vision

Build MU/TH/UR 6000 as a simulated computer operating environment, not
merely a themed dashboard with a collection of static command responses.

The user should feel as though they are an authorized crew member
interacting with the Nostromo's onboard computer. MU/TH/UR should have
its own command language, data, operational logic, permissions, event
history and current ship state.

The user interacts through:

1.  A command-line terminal.
2.  Structured system reports.
3.  Interactive ship-monitoring panels.
4.  Contextual command suggestions.
5.  System notifications and events.

All interaction methods must use the same underlying data and business
logic.

### 1.1 Design principles

  -----------------------------------------------------------------------
  Principle                           Requirement
  ----------------------------------- -----------------------------------
  Consistency                         The same information must produce
                                      the same answer everywhere.

  Statefulness                        Commands can read or change the
                                      simulated ship state.

  Context awareness                   Responses depend on current state
                                      and user permissions.

  Discoverability                     Users can discover commands without
                                      memorizing syntax.

  Immersion                           Responses sound like an industrial
                                      spacecraft computer.

  Authenticity                        Avoid modern chatbot-like
                                      conversations and generic AI
                                      responses.

  Determinism                         The same initial state and command
                                      sequence produce the same results.

  Extensibility                       New commands and subsystems are
                                      straightforward to add.
  -----------------------------------------------------------------------

MU/TH/UR is not a chatbot. It is a computer with a defined command
language. Arbitrary questions should not receive LLM-style answers.

------------------------------------------------------------------------

## 2. User interface design

Retain the existing application's visual identity, including its
MU/TH/UR model and firmware labeling, Nostromo identity, privilege
indicator, terminal and ship-monitoring sections. Improve the layout
around the terminal rather than replacing the established aesthetic.

### 2.1 Main screen layout

The desktop interface should have four main regions:

**A. System header**

Always-visible information:

-   Computer model and firmware version.
-   Ship name and registration.
-   Overall system status.
-   Session identifier.
-   Current privilege level.
-   Active alert count.
-   Ship computer time.

**B. Command terminal**

The terminal is the primary interaction area and should receive the most
screen space. It contains:

-   Boot and system messages.
-   Previous commands.
-   Computer responses.
-   Command input and cursor.
-   Autocomplete suggestions.
-   Command execution status.

**C. Ship status panels**

Show compact summaries for:

-   Life Support.
-   Navigation.
-   Engineering.
-   Crew Monitoring.

These are summaries, not full reports. Clicking a panel opens its
detailed view or executes the corresponding command through the same
command engine.

**D. System event indicator**

A restrained area showing:

-   Active warnings.
-   Unread messages.
-   Recent system events.
-   Current system activity.

It should feel like part of an industrial computer interface, not a
modern notification center.

### 2.2 Terminal visual behavior

Preserve the existing visual language and use:

-   Monospaced typography.
-   Restrained green phosphor-style text.
-   Subtle CRT scanlines and glow, if already consistent with the
    application.
-   A visible blinking cursor.
-   Clear distinction between entered commands and system output.
-   Different visual treatments for normal output, warnings, errors and
    authorization messages.
-   Optional, brief text-reveal effects.

Avoid excessive flicker, glow, animation or cyberpunk styling. The
original Alien aesthetic is restrained, utilitarian and industrial.

### 2.3 Responsive behavior

**Desktop** - Terminal dominates the main content area. - Monitoring
panels appear below or beside it. - Header remains visible.

**Tablet** - Two-column monitoring panels. - Terminal remains
full-width.

**Mobile** - Terminal appears first. - Panels are arranged vertically. -
Command input remains accessible. - History and long reports can be
collapsed. - Suggestions are touch-selectable.

------------------------------------------------------------------------

## 3. Command terminal behavior

### 3.1 Command execution lifecycle

Every command follows the same lifecycle:

1.  Receive raw user input.
2.  Normalize the input.
3.  Parse command name, subcommand, arguments and options.
4.  Check whether the command exists.
5.  Validate syntax and arguments.
6.  Check required privileges.
7.  Execute the command handler.
8.  Read or update the ship state.
9.  Generate a structured response.
10. Append the command and response to terminal history.
11. Refresh affected UI panels through shared state.
12. Record relevant system events.

The execution engine must be independent of the terminal UI component.
This allows commands to be invoked through clickable monitoring panels
and other interfaces.

### 3.2 Input handling

  Input        Expected behavior
  ------------ --------------------------------------
  Enter        Execute command
  Arrow Up     Previous command in history
  Arrow Down   Next command in history
  Tab          Complete command or argument
  Escape       Close autocomplete
  Ctrl+L       Clear terminal display
  Ctrl+C       Cancel a supported running operation
  Backspace    Normal editing
  Home / End   Move cursor

Additional requirements:

-   Case-insensitive command matching.
-   Ignore unnecessary leading and trailing spaces.
-   Multiple spaces must not break parsing.
-   Support quoted arguments where needed.
-   Prevent accidental duplicate execution from double Enter.
-   Maintain command history during the session.
-   Do not steal keyboard focus when the user interacts with another
    panel.
-   Preserve normal browser shortcuts where possible.

### 3.3 Autocomplete

Autocomplete must be generated from command definitions rather than
maintained separately.

Example:

``` text
NOSTROMO> CREW

AVAILABLE COMMANDS

CREW
CREW ALL
CREW RIPLEY
CREW DALLAS
CREW LAMBERT
CREW PARKER
CREW BRETT
CREW ASH
```

Typing `CREW R` should narrow the suggestions to `CREW RIPLEY`, with a
short description such as:

``` text
CREW RIPLEY
Retrieve personnel record for Ellen Ripley.
```

Requirements:

-   Suggestions update as the user types.
-   Suggestions can be selected with keyboard or pointer/touch.
-   Tab completes the best unambiguous match.
-   Autocomplete never executes a command automatically.
-   Suggestions respect permissions where appropriate.
-   Argument suggestions can use known crew names, subsystem names and
    valid options.

### 3.4 Command history

Maintain chronological command history, for example:

``` text
[22:10:01] NOSTROMO> STATUS
[22:10:04] NOSTROMO> CREW
[22:10:12] NOSTROMO> NAVIGATION
[22:10:18] NOSTROMO> ENGINEERING
```

Requirements:

-   Arrow-key navigation.
-   Re-execution of a previous command.
-   Configurable history limit.
-   A consistent policy for consecutive duplicate commands.
-   History survives navigation within the same session.
-   History persistence can be configured independently of simulation
    state.

### 3.5 Structured output types

Command handlers must not return arbitrary HTML. They should return
structured output blocks rendered by the terminal.

  Output type     Purpose
  --------------- ------------------------------
  TEXT            Ordinary system message
  TABLE           Crew lists, cargo manifests
  REPORT          Structured diagnostic report
  STATUS          Subsystem status
  WARNING         Warning message
  ERROR           Command or system error
  AUTHORIZATION   Access request or denial
  PROGRESS        Long-running operation
  CONFIRMATION    Confirmation of an operation

Example:

``` text
NOSTROMO> ENGINEERING

ENGINEERING SYSTEMS REPORT
-------------------------

MAIN REACTOR ............. NOMINAL
PRIMARY ENGINE .......... NOMINAL
SECONDARY ENGINE ........ NOMINAL
POWER DISTRIBUTION ...... NOMINAL
COOLING SYSTEM .......... NOMINAL

TOTAL POWER OUTPUT: 98.4%

ENGINEERING REPORT COMPLETE.
```

Formatting must be deterministic and consistent.

------------------------------------------------------------------------

## 4. Command language and command catalogue

### 4.1 General syntax

Use a consistent syntax:

``` text
COMMAND [SUBCOMMAND] [ARGUMENTS] [OPTIONS]
```

Examples:

``` text
STATUS
STATUS ALL
STATUS ENGINEERING

CREW
CREW ALL
CREW RIPLEY
CREW STATUS RIPLEY

NAVIGATION
NAVIGATION POSITION
NAVIGATION DESTINATION

ENGINEERING
ENGINEERING POWER
ENGINEERING REACTOR
```

Support a small number of intuitive aliases where useful, such as `NAV`
for `NAVIGATION`. Avoid an excessive alias list.

### 4.2 System commands

  Command       Description                       Access
  ------------- --------------------------------- --------
  `HELP`        General command help              All
  `HELP CREW`   Help for crew commands            All
  `STATUS`      Overall ship status               All
  `REPORT`      Comprehensive ship report         All
  `SHIP`        Ship specifications               All
  `VERSION`     Computer firmware information     All
  `WHOAMI`      Current session and permissions   All
  `HISTORY`     Command history                   All
  `CLEAR`       Clear terminal display            All
  `TIME`        Ship computer date and time       All
  `LOG`         Recent system events              All

`HELP` is the primary command-discovery mechanism.

Example:

``` text
NOSTROMO> HELP

MU/TH/UR 6000 COMMAND REFERENCE
--------------------------------

SYSTEM
  HELP
  STATUS
  REPORT
  SHIP
  VERSION
  WHOAMI
  HISTORY
  TIME
  LOG

OPERATIONS
  MISSION
  NAVIGATION
  CREW
  CARGO

ENGINEERING
  ENGINEERING
  POWER
  LIFE SUPPORT

SECURITY
  ACCESS
  SPECIAL ORDER 937

ENTER HELP [COMMAND] FOR DETAILS.
```

### 4.3 Ship information commands

  Command                 Description
  ----------------------- ----------------------------
  `SHIP`                  General ship information
  `SHIP SPECIFICATIONS`   Technical specifications
  `SHIP REGISTRATION`     Registration and ownership
  `SHIP SYSTEMS`          Installed systems
  `SHIP CONFIGURATION`    Current configuration
  `SHIP MANIFEST`         Ship manifest

These commands are informational and do not change state.

### 4.4 Mission commands

  Command                Description
  ---------------------- ----------------------------
  `MISSION`              Current mission overview
  `MISSION STATUS`       Mission progress
  `MISSION OBJECTIVES`   Current objectives
  `MISSION HISTORY`      Previous mission events
  `MISSION ORDERS`       Current operational orders

Mission data should be stored separately from technical ship state.

### 4.5 Crew commands

  Command                    Description
  -------------------------- ------------------------
  `CREW`                     Crew summary
  `CREW ALL`                 Full crew manifest
  `CREW [NAME]`              Individual crew record
  `CREW STATUS`              Crew status overview
  `CREW STATUS [NAME]`       Individual crew status
  `CREW BIOMETRICS [NAME]`   Biometric information
  `CREW LOCATION [NAME]`     Last known location
  `CREW RECORD [NAME]`       Personnel record

Initial crew records:

-   Ellen Ripley.
-   Arthur Dallas.
-   Joan Lambert.
-   Dennis Parker.
-   Samuel Brett.
-   Ash.
-   Jones.

A crew record can contain:

-   Name.
-   Position.
-   Department.
-   Personnel ID.
-   Current status.
-   Current location.
-   Cryosleep status.
-   Medical status.
-   Security clearance.

Access restrictions should apply to sensitive fields.

### 4.6 Navigation commands

  Command                    Description
  -------------------------- --------------------------
  `NAVIGATION`               Navigation overview
  `NAVIGATION POSITION`      Current coordinates
  `NAVIGATION DESTINATION`   Destination
  `NAVIGATION COURSE`        Current trajectory
  `NAVIGATION STATUS`        Navigation system health
  `NAVIGATION HISTORY`       Navigation events

### 4.7 Engineering commands

  Command                      Description
  ---------------------------- ---------------------------
  `ENGINEERING`                Engineering overview
  `ENGINEERING POWER`          Power system report
  `ENGINEERING REACTOR`        Reactor status
  `ENGINEERING ENGINES`        Engine status
  `ENGINEERING COOLING`        Cooling systems
  `ENGINEERING DAMAGE`         Engineering damage report
  `POWER`                      Overall power status
  `LIFE SUPPORT`               Life support overview
  `LIFE SUPPORT OXYGEN`        Oxygen system
  `LIFE SUPPORT ATMOSPHERE`    Atmospheric composition
  `LIFE SUPPORT TEMPERATURE`   Temperature regulation

### 4.8 Cargo commands

  Command            Description
  ------------------ ----------------------------
  `CARGO`            Cargo overview
  `CARGO MANIFEST`   Cargo inventory
  `CARGO STATUS`     Cargo condition
  `CARGO LOCATION`   Cargo location information

### 4.9 Security commands

  Command               Description
  --------------------- -------------------------------
  `ACCESS`              Current access level
  `ACCESS LEVELS`       Available privilege levels
  `ACCESS REQUEST`      Request elevated privileges
  `SECURITY`            Security status
  `SPECIAL ORDER 937`   Retrieve classified directive

Special Order 937 should use the same command infrastructure, but its
complete storyline should be implemented as a later feature.

------------------------------------------------------------------------

## 5. Command behavior specifications

Each command needs a precise behavioral definition, not just a name and
a sample response.

### 5.1 STATUS

**Purpose:** Provide a quick overview of the entire ship.

Input:

``` text
STATUS
```

Example output:

``` text
MU/TH/UR 6000
SHIP STATUS REPORT
------------------

VESSEL: USCSS NOSTROMO
REGISTRATION: 1809246(09)

OVERALL STATUS: OPERATIONAL

PRIMARY SYSTEMS

LIFE SUPPORT ........... NOMINAL
NAVIGATION ............. NOMINAL
ENGINEERING ............ NOMINAL
POWER DISTRIBUTION ..... NOMINAL
CREW MONITORING ........ NOMINAL
COMMUNICATIONS ......... NOMINAL

CREW: 6 ACTIVE / 1 SYNTHETIC
ACTIVE ALERTS: 0

REPORT COMPLETE.
```

Behavior:

-   Read current ship state.
-   Aggregate status of primary subsystems.
-   Determine overall ship status.
-   Count active alerts.
-   Return the report.

The output must always match the underlying state. If the reactor is in
a warning state, the overall report must reflect it.

### 5.2 REPORT

**Purpose:** Generate a more comprehensive report than `STATUS`.

Input:

``` text
REPORT
```

Include:

1.  Vessel identification.
2.  Mission status.
3.  Navigation information.
4.  Engineering status.
5.  Power distribution.
6.  Life support.
7.  Crew monitoring.
8.  Cargo status.
9.  Active alerts.
10. Recent system events.

Optional filtering:

``` text
REPORT ENGINEERING
REPORT CREW
REPORT ALL
```

Reuse existing subsystem report handlers rather than duplicating their
business logic.

### 5.3 CREW

Input:

``` text
CREW
```

Example output:

``` text
CREW MANIFEST
-------------

01 ELLEN RIPLEY     WARRANT OFFICER
02 ARTHUR DALLAS    CAPTAIN
03 JOAN LAMBERT     NAVIGATION OFFICER
04 DENNIS PARKER    CHIEF ENGINEER
05 SAMUEL BRETT     ENGINEER
06 ASH              SCIENCE OFFICER
07 JONES            SHIP'S CAT

CREW RECORDS: 7
```

Individual query:

``` text
CREW RIPLEY
```

Example output:

``` text
PERSONNEL RECORD
----------------

NAME: ELLEN RIPLEY
POSITION: WARRANT OFFICER
DEPARTMENT: OPERATIONS
PERSONNEL ID: WU-1809246-001

STATUS: CRYOSLEEP
LOCATION: HYPERSLEEP CHAMBER 01

MEDICAL STATUS: NOMINAL
SECURITY CLEARANCE: COMMANDER

RECORD COMPLETE.
```

Behavior:

-   Match crew members by name or identifier.
-   Support partial names if unambiguous.
-   Return an error if no match exists.
-   Return a selection list if multiple records match.
-   Enforce access restrictions on sensitive fields.

### 5.4 ENGINEERING

Input:

``` text
ENGINEERING
```

Example output:

``` text
ENGINEERING SYSTEMS
-------------------

MAIN REACTOR ............. NOMINAL
PRIMARY ENGINE .......... NOMINAL
SECONDARY ENGINE ........ NOMINAL
COOLING SYSTEM .......... NOMINAL
POWER DISTRIBUTION ...... NOMINAL

POWER OUTPUT: 98.4%
FUEL RESERVES: 87.2%

ACTIVE FAULTS: 0

ENGINEERING REPORT COMPLETE.
```

Clicking the Engineering panel should open this same report. The command
and UI must never have separate implementations of the same information.

### 5.5 LIFE SUPPORT

Input:

``` text
LIFE SUPPORT
```

Example output:

``` text
LIFE SUPPORT MONITORING
-----------------------

OXYGEN LEVEL ............ 20.9%
CO2 CONCENTRATION ....... 0.04%
ATMOSPHERIC PRESSURE .... 101.3 KPA
CABIN TEMPERATURE ....... 21.4 C
HUMIDITY ................ 43.0%

AIR CIRCULATION: NOMINAL
ATMOSPHERIC CONTROL: NOMINAL

LIFE SUPPORT OPERATIONAL.
```

These values are illustrative simulation defaults, not canonical film
specifications. The feature can later support interactive operations
such as detecting an oxygen leak.

------------------------------------------------------------------------

## 6. Underlying ship simulation

This is the critical architectural decision. The ship needs one central
state model. Otherwise, command responses and dashboard panels will
eventually contradict each other.

### 6.1 Ship state structure

``` text
Ship
 ├── Identity
 ├── Mission
 ├── Navigation
 ├── Engineering
 │    ├── Reactor
 │    ├── Engines
 │    ├── Cooling
 │    └── PowerDistribution
 ├── LifeSupport
 ├── Crew
 ├── Cargo
 ├── Communications
 ├── Security
 ├── Alerts
 └── EventLog
```

Each subsystem exposes:

-   Current state.
-   Operational status.
-   Relevant measurements.
-   Last update timestamp.
-   Active faults.
-   Supported operations.

### 6.2 Example state

The following is illustrative data, not a claim about canonical Nostromo
specifications:

``` json
{
  "ship": {
    "name": "USCSS Nostromo",
    "registration": "1809246(09)",
    "status": "OPERATIONAL"
  },
  "engineering": {
    "status": "NOMINAL",
    "reactor": {
      "status": "NOMINAL",
      "outputPercentage": 98.4
    },
    "engines": {
      "status": "NOMINAL",
      "primary": "ONLINE",
      "secondary": "ONLINE"
    },
    "powerDistribution": {
      "status": "NOMINAL"
    }
  },
  "lifeSupport": {
    "status": "NOMINAL",
    "oxygenPercentage": 20.9,
    "co2Percentage": 0.04,
    "pressureKpa": 101.3
  }
}
```

### 6.3 State ownership

Each subsystem owns its own data and operations:

-   Navigation owns position and trajectory.
-   Engineering owns reactor and engine data.
-   Life Support owns atmospheric measurements.
-   Crew owns personnel and biometric data.
-   Security owns privileges and authorization.

Other subsystems can read relevant information, but should not directly
modify another subsystem's state. Cross-subsystem operations should go
through explicit operations or events.

Example:

``` text
ENGINEERING
    |
    | Reactor fault detected
    v
EVENT SYSTEM
    |
    +----> ALERT SYSTEM
    |
    +----> POWER DISTRIBUTION
    |
    +----> STATUS OVERVIEW
```

### 6.4 State changes

The first version should have a mostly stable ship state but support
controlled changes.

Examples:

-   A system fault changes subsystem status.
-   A power adjustment changes available power.
-   A crew member changes location.
-   An incoming transmission creates an event.
-   A maintenance operation resolves a fault.

Every change must be validated. For example, reducing life-support power
below a defined safety threshold should be rejected or require an
explicit authorization sequence.

------------------------------------------------------------------------

## 7. Permissions and authorization

Turn the existing session privilege indicator into a real authorization
model.

### 7.1 Proposed privilege levels

  Level       Description
  ----------- ----------------------------------
  CREW        Basic ship information
  OFFICER     Operational reports
  COMMANDER   Full ship operational control
  CORPORATE   Corporate directives
  SYSTEM      Internal computer administration

These are proposed fictional application permissions, not necessarily a
canonical representation of the film's access system.

### 7.2 Permission matrix

  Operation                 Crew   Officer    Commander   Corporate
  ----------------------- ------ --------- ------------ -----------
  General status             Yes       Yes          Yes         Yes
  Crew manifest              Yes       Yes          Yes         Yes
  Detailed crew records       No       Yes          Yes         Yes
  Engineering reports        Yes       Yes          Yes         Yes
  Engineering control         No        No          Yes         Yes
  Mission orders              No       Yes          Yes         Yes
  Corporate directives        No        No           No         Yes
  Special Order 937           No        No   Restricted         Yes

Corporate access should be handled separately from normal operational
authority.

### 7.3 Authorization response

Example:

``` text
NOSTROMO> SPECIAL ORDER 937

ACCESS RESTRICTED.

REQUIRED PRIVILEGE: CORPORATE
CURRENT PRIVILEGE: COMMANDER

AUTHORIZATION REQUIRED.

REQUEST ELEVATED ACCESS? Y/N
```

Restricted information must not be returned before authorization.

------------------------------------------------------------------------

## 8. Read-only commands versus operational commands

Distinguish three command categories.

### 8.1 Informational commands

These retrieve information without changing anything.

Examples:

``` text
STATUS
CREW
NAVIGATION
ENGINEERING
LIFE SUPPORT
CARGO
MISSION
```

They execute immediately.

### 8.2 Operational commands

These change the simulated ship state.

Examples:

``` text
ENGINEERING POWER STATUS
ENGINEERING POWER ALLOCATION
NAVIGATION SET COURSE
COMMUNICATIONS SEND
```

Operational commands require valid arguments and appropriate privileges.

Example:

``` text
NOSTROMO> NAVIGATION SET COURSE LV-426
```

Possible response:

``` text
NAVIGATION SYSTEM

NEW COURSE REQUESTED.
DESTINATION: LV-426

CURRENT COURSE: SOL SYSTEM
REQUESTED COURSE: LV-426

CONFIRM COURSE CHANGE? Y/N
```

The user must confirm before state changes.

### 8.3 Administrative and restricted commands

These involve security, corporate directives and critical ship
operations.

Examples:

``` text
ACCESS REQUEST CORPORATE
SPECIAL ORDER 937
SECURITY OVERRIDE
SELF DESTRUCT
```

They require additional authorization and confirmation.

**Rule:** No command should silently modify ship state. Every
modification must produce an explicit response describing what happened.

------------------------------------------------------------------------

## 9. Context-aware interaction

The terminal should provide useful suggestions without becoming a
chatbot.

### 9.1 Contextual suggestions

After `ENGINEERING`, display:

``` text
RELATED COMMANDS:

ENGINEERING REACTOR
ENGINEERING ENGINES
ENGINEERING COOLING
ENGINEERING POWER

ENTER HELP ENGINEERING FOR MORE.
```

After `CREW RIPLEY`, display:

``` text
RELATED COMMANDS:

CREW STATUS RIPLEY
CREW BIOMETRICS RIPLEY
CREW LOCATION RIPLEY
CREW RECORD RIPLEY
```

Generate suggestions from command-definition metadata.

### 9.2 Intelligent error messages

Avoid generic errors.

Unknown command:

``` text
COMMAND NOT RECOGNIZED.

UNKNOWN COMMAND: NAV

DID YOU MEAN:
  NAVIGATION
  NAVIGATION POSITION
  NAVIGATION STATUS

ENTER HELP FOR AVAILABLE COMMANDS.
```

Missing argument:

``` text
NOSTROMO> CREW STATUS

ERROR: MISSING ARGUMENT.

USAGE:
CREW STATUS [PERSONNEL_NAME]
```

Ambiguous argument:

``` text
ERROR: MULTIPLE RECORDS FOUND.

MATCHING PERSONNEL:
  ELLEN RIPLEY
  RIPLEY - MEDICAL RECORD ARCHIVE

SPECIFY FULL RECORD NAME.
```

The computer should sound professional and impersonal, not overly
friendly.

### 9.3 Command execution feedback

Simple reports can return immediately. More complex operations can
simulate processing:

``` text
PROCESSING REQUEST...

ACCESSING NAVIGATION DATABASE
RETRIEVING FLIGHT DATA
CALCULATING TRAJECTORY

REQUEST COMPLETE.
```

Keep delays short and deterministic.

Suggested UI simulation timings:

  Command category          Simulated duration
  ----------------------- --------------------
  Simple query                     100--250 ms
  Report generation                300--600 ms
  Database lookup                  200--500 ms
  Authorization                    300--800 ms
  Operational procedure          500--1,500 ms

These are presentation timings, not actual processing requirements.

------------------------------------------------------------------------

## 10. System events and automatic updates

A real ship computer should not only react to user commands. It should
also report relevant events independently.

### 10.1 Event types

  Event           Example
  --------------- -----------------------------
  SYSTEM          Subsystem initialization
  STATUS          System state changed
  WARNING         Temperature above threshold
  ERROR           Subsystem failure
  CREW            Crew status changed
  NAVIGATION      Course adjustment
  SECURITY        Unauthorized access attempt
  COMMUNICATION   Incoming message

### 10.2 Example event sequence

Suppose a cooling-system fault occurs:

``` text
[22:15:01] ENGINEERING WARNING

COOLING SYSTEM TEMPERATURE ABOVE NORMAL.

CURRENT TEMPERATURE: 87.2 C
WARNING THRESHOLD: 85.0 C
```

The following changes occur from one state transition:

1.  Engineering status becomes `WARNING`.
2.  An active alert is created.
3.  The main system header shows one active alert.
4.  The Engineering monitoring panel changes.
5.  The event is added to the system log.
6.  `STATUS` includes the warning.

Do not implement these as six separate UI updates with independent
sources of truth.

### 10.3 Event log

Command:

``` text
LOG
```

Example:

``` text
SYSTEM EVENT LOG
----------------

22:15:01 ENGINEERING WARNING
22:10:15 NAVIGATION STATUS CHECK
22:08:44 CREW DATABASE ACCESSED
22:05:10 SYSTEM DIAGNOSTICS COMPLETE

4 EVENTS DISPLAYED.

ENTER LOG ALL FOR COMPLETE HISTORY.
```

Additional commands:

``` text
LOG ALL
LOG ENGINEERING
LOG SECURITY
LOG LAST 10
```

The event log should be append-only within the simulation session.

### 10.4 Automatic updates

Initially use a small number of predefined events. Avoid random failures
until the state model works. Random events can be introduced later as
part of scenario simulation, with clear rules and reproducible behavior.

------------------------------------------------------------------------

## 11. Technical architecture

Separate the command interpreter, ship simulation and presentation
layer.

### 11.1 Logical architecture

``` mermaid
flowchart TB
    UI["User Interface"]
    TERM["Terminal Component"]
    PANELS["Ship Monitoring Panels"]
    INPUT["Command Input"]

    ENGINE["Command Engine"]
    PARSER["Command Parser"]
    REGISTRY["Command Registry"]
    AUTH["Authorization Service"]

    DOMAIN["Ship Simulation / Domain"]
    SUBSYS["Subsystem Services"]
    EVENTS["Event Manager"]
    ALERTS["Alert Manager"]
    LOG["Event Log"]

    DATA["Ship State Store"]
    PERSIST["Session Persistence"]

    UI --> TERM
    UI --> PANELS
    TERM --> INPUT
    INPUT --> ENGINE
    PANELS --> ENGINE

    ENGINE --> PARSER
    PARSER --> REGISTRY
    REGISTRY --> AUTH
    AUTH --> DOMAIN
    DOMAIN --> SUBSYS
    SUBSYS <--> DATA
    SUBSYS --> EVENTS
    EVENTS --> ALERTS
    EVENTS --> LOG
    DATA <--> PERSIST
    DATA --> UI
    EVENTS --> UI
```

### 11.2 Command engine responsibilities

The command engine is responsible for:

-   Receiving raw input.
-   Normalizing it.
-   Parsing command names and arguments.
-   Finding the correct command definition.
-   Validating arguments.
-   Checking permissions.
-   Executing the handler.
-   Formatting the response.
-   Recording command history.

It must not contain ship-specific business logic.

### 11.3 Command registry

Do not implement all commands in one large `switch` statement. Register
commands independently.

Conceptual interface:

``` typescript
interface CommandDefinition {
  id: string;
  name: string;
  description: string;
  usage: string;

  aliases?: string[];
  category: string;

  requiredPrivilege: PrivilegeLevel;

  arguments?: CommandArgumentDefinition[];

  execute: (
    context: CommandContext,
    args: ParsedArguments
  ) => Promise<CommandResult>;
}
```

Conceptual registration:

``` typescript
const crewCommand: CommandDefinition = {
  id: "crew",
  name: "CREW",
  description: "Retrieve crew information",
  usage: "CREW [PERSONNEL_NAME]",
  category: "CREW",
  requiredPrivilege: "CREW",

  execute: async (context, args) => {
    // Retrieve crew information from ship state.
    // Return a structured command result.
  }
};
```

This is a conceptual API, not a commitment to a particular framework.

### 11.4 Structured command results

Handlers should return structured results, not arbitrary HTML.

``` typescript
interface CommandResult {
  success: boolean;
  output: OutputBlock[];
  stateChanged: boolean;
  events?: ShipEvent[];
  suggestions?: string[];
}
```

Possible output blocks:

``` typescript
type OutputBlock =
  | { type: "text"; content: string }
  | { type: "table"; columns: string[]; rows: unknown[][] }
  | { type: "status"; items: StatusItem[] }
  | { type: "warning"; content: string }
  | { type: "error"; content: string }
  | { type: "progress"; content: string };
```

### 11.5 Subsystem services

Recommended logical services:

``` text
ShipService
MissionService
NavigationService
EngineeringService
PowerService
LifeSupportService
CrewService
CargoService
CommunicationsService
SecurityService
AlertService
EventLogService
```

For the MVP, these can be TypeScript modules or classes. There is no
need to introduce backend services or distributed architecture.

### 11.6 State management

The ship state must have a single authoritative store. All components
read from that store. State updates automatically trigger the relevant
UI updates.

``` text
Command
   |
   v
Command Handler
   |
   v
Domain Operation
   |
   v
State Update
   |
   +----> Terminal Response
   |
   +----> Monitoring Panels
   |
   +----> Alert Indicators
   |
   +----> Event Log
```

------------------------------------------------------------------------

## 12. Persistence and session management

Distinguish three kinds of state:

  State                       Persistence
  --------------------------- ------------------------------------
  Static ship configuration   Application data
  Current simulation state    Browser storage
  Terminal history            Session storage or browser storage

### 12.1 Initial state

Every new simulation starts with a predefined initial ship state, for
example:

``` text
SIMULATION: STANDARD
SHIP STATUS: OPERATIONAL
ACTIVE ALERTS: 0
MISSION STATUS: IN PROGRESS
```

### 12.2 Browser persistence

Remember:

-   Current simulation state.
-   Command history.
-   UI preferences.
-   Current terminal session.
-   Event history.

Use versioned serialization so future data-model changes do not break
saved sessions.

### 12.3 Reset functionality

Provide a reset operation in UI settings:

``` text
RESET SIMULATION
```

It must:

1.  Ask for confirmation.
2.  Restore the initial ship state.
3.  Clear the simulation event log.
4.  Reset command history if requested.
5.  Start a new session.

Resetting must not be possible accidentally through an ordinary command.

------------------------------------------------------------------------

## 13. Desktop and mobile interaction

### Desktop

The keyboard is the primary interaction mechanism.

-   Focus the input when the user clicks the terminal.
-   Preserve normal browser shortcuts.
-   Avoid stealing focus when another panel is used.
-   Support command history and autocomplete.
-   Allow scrolling through old output.
-   Keep the newest output visible after execution.

### Mobile

-   Tapping the command area focuses the input.
-   Autocomplete is selectable by touch.
-   The terminal must not jump unexpectedly when the mobile keyboard
    opens.
-   Suggestions are scrollable.
-   Provide a visible HELP shortcut.
-   Do not rely on keyboard-only controls.

### Terminal scrolling

Preserve the scroll position if the user is reading older output. If the
user is already at the bottom, new output should automatically scroll
into view.

------------------------------------------------------------------------

## 14. Error handling and edge cases

  -----------------------------------------------------------------------
  Situation                           Expected response
  ----------------------------------- -----------------------------------
  Unknown command                     Command not recognized

  Missing argument                    Display usage

  Invalid argument                    Explain valid values

  Unknown crew member                 Personnel record not found

  Ambiguous crew member               Display matching records

  Insufficient privileges             Access denied

  Invalid state transition            Operation rejected

  Operation already running           Operation in progress

  Cancelled operation                 Operation aborted

  Empty input                         Do nothing

  Very long input                     Reject or limit input

  Duplicate command                   Execute according to normal command
                                      rules

  Invalid confirmation                Return to original prompt

  Corrupt persisted state             Restore initial state with an error
                                      message
  -----------------------------------------------------------------------

No internal JavaScript exception should ever appear in the terminal.

------------------------------------------------------------------------

## 15. Implementation roadmap

Implement in small, independently testable milestones.

### Milestone 1 -- Command engine

-   Command parser.
-   Command registry.
-   Command execution lifecycle.
-   Structured command responses.
-   Error handling.
-   Command metadata.

### Milestone 2 -- Terminal UX

-   Input handling.
-   Command history.
-   Autocomplete.
-   Output formatting.
-   Scrolling.
-   Contextual suggestions.
-   Mobile support.

### Milestone 3 -- Ship state model

-   Initial ship configuration.
-   Central state store.
-   Subsystem models.
-   Crew records.
-   Navigation data.
-   Engineering data.
-   Life-support data.

### Milestone 4 -- Informational commands

Implement:

-   HELP.
-   STATUS.
-   REPORT.
-   SHIP.
-   CREW.
-   MISSION.
-   NAVIGATION.
-   ENGINEERING.
-   LIFE SUPPORT.
-   CARGO.
-   LOG.

### Milestone 5 -- Dashboard integration

-   Connect existing panels to shared state.
-   Synchronize command output and monitoring panels.
-   Add clickable subsystem panels.
-   Add active alert indicators.
-   Add system activity indicators.

### Milestone 6 -- Operational commands

-   State-changing operations.
-   Argument validation.
-   Confirmations.
-   Permission enforcement.
-   Operation cancellation.

### Milestone 7 -- Event system

-   Event generation.
-   Event history.
-   Alert management.
-   Automatic status updates.
-   Controlled simulated events.

### Milestone 8 -- Persistence and polish

-   Session persistence.
-   Simulation reset.
-   Data versioning.
-   Comprehensive tests.
-   Visual refinements.

------------------------------------------------------------------------

## 16. Testing strategy and acceptance criteria

The feature is not complete merely because commands produce text. It
must pass functional and consistency tests.

### 16.1 Command engine tests

Verify that:

-   Valid commands are recognized.
-   Commands are case-insensitive.
-   Arguments are parsed correctly.
-   Aliases work.
-   Invalid syntax returns useful errors.
-   Unknown commands do not modify state.
-   Permissions are checked before execution.
-   Command history works correctly.

### 16.2 State consistency tests

Example integration test:

1.  Execute `ENGINEERING`.
2.  Verify the reactor is nominal.
3.  Introduce a simulated reactor fault through a test operation.
4.  Execute `ENGINEERING` again.
5.  Verify the report shows the fault.
6.  Execute `STATUS`.
7.  Verify overall status reflects the fault.
8.  Verify the Engineering panel displays the same fault.
9.  Verify an event was recorded.

There must be no contradictory information between different parts of
the application.

### 16.3 Definition of done

-   [ ] All informational commands are registered and functional.
-   [ ] Commands use a shared command execution engine.
-   [ ] The parser supports commands, subcommands and arguments.
-   [ ] Autocomplete is generated from command definitions.
-   [ ] Command history supports keyboard navigation.
-   [ ] Reports support structured output.
-   [ ] Crew records can be queried individually.
-   [ ] Ship state has a single authoritative source.
-   [ ] Existing monitoring panels use that source.
-   [ ] Command responses and dashboard values are consistent.
-   [ ] Permission checks are centralized.
-   [ ] Operational commands support confirmation.
-   [ ] State changes generate appropriate events.
-   [ ] The event log is accessible through commands.
-   [ ] Simulation state survives page reloads.
-   [ ] The terminal works on desktop and mobile.
-   [ ] Automated tests cover the command engine and critical state
    transitions.

------------------------------------------------------------------------

## 17. Explicitly out of scope for the first implementation

  -----------------------------------------------------------------------
  Feature                             Reason
  ----------------------------------- -----------------------------------
  Special Order 937 storyline         Separate narrative/gameplay feature

  Voice interaction                   Not necessary for the command
                                      engine

  AI-generated responses              Could undermine deterministic
                                      behavior

  Random ship failures                Introduce after the state model
                                      works

  Multiple simultaneous users         Not needed for a single-user
                                      simulator

  Complex filesystem simulation       Adds complexity without immediate
                                      value

  Full self-destruct sequence         Separate gameplay feature

  Advanced animated diagnostics       Visual enhancement, not
                                      foundational
  -----------------------------------------------------------------------

The architecture should accommodate these features later, but they
should not delay the initial implementation.

------------------------------------------------------------------------

## 18. Recommended initial command set

Start with approximately 20 command roots rather than implementing the
entire catalogue immediately.

  Command               Function
  --------------------- ----------------------
  `HELP`                Command reference
  `STATUS`              Ship status
  `REPORT`              Complete report
  `SHIP`                Ship information
  `VERSION`             Firmware information
  `WHOAMI`              Session information
  `TIME`                Computer time
  `HISTORY`             Command history
  `LOG`                 System event log
  `CREW`                Crew manifest
  `CREW [NAME]`         Crew record
  `MISSION`             Mission status
  `NAVIGATION`          Navigation report
  `ENGINEERING`         Engineering report
  `POWER`               Power report
  `LIFE SUPPORT`        Life-support report
  `CARGO`               Cargo information
  `ACCESS`              Access level
  `SPECIAL ORDER 937`   Classified directive
  `CLEAR`               Clear terminal

Some commands have subcommands, so the actual functionality will be
richer than the number of entries suggests.

------------------------------------------------------------------------

## 19. Recommended implementation decisions

  Area                 Recommendation
  -------------------- ------------------------------------------
  Application model    Client-side ship simulation
  Command processing   Deterministic command registry
  Parsing              Custom lightweight command parser
  State management     Single authoritative ship state
  Command output       Structured output blocks
  UI integration       Terminal and panels share the same state
  Permissions          Centralized authorization service
  Events               Central event manager
  Persistence          Versioned browser storage
  Testing              Unit tests and integration tests
  AI integration       None in the command execution path

Important architectural distinction:

**The command registry describes what commands exist; subsystem services
describe what the ship can actually do.**

This prevents command parsing, permissions, ship logic and UI rendering
from becoming entangled.

------------------------------------------------------------------------

## 20. Recommended next steps

Before implementation:

1.  Finalize the command language: command names, syntax, arguments,
    aliases and permissions.
2.  Define the complete initial ship state and subsystem data
    structures.
3.  Specify command-engine interfaces and response types.
4.  Design terminal interaction in detail.
5.  Inspect the existing application structure and adapt the plan to its
    actual framework and components.

Start with the command language and ship-state model before writing
implementation code. These decisions will determine how easily
operational commands, system failures and the Special Order 937
storyline can be introduced later.

------------------------------------------------------------------------

## Reference

-   Existing Nostromo simulator: https://malloc9.github.io/nostromo/
-   The plan is a proposed product and technical specification. Sample
    measurements, command responses, privilege levels and data
    structures are illustrative and should be validated against the
    intended fictional scenario during implementation.
