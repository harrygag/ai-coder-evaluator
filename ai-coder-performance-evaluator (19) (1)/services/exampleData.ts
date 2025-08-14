

import { TeamDiscussion, AiRole } from '../types';

export const exampleTeamDiscussion: TeamDiscussion = {
  conversation: [
    {
      role: AiRole.Manager,
      content: `Alright team, let's sync up. We've received a user request to add a "Frenzy Mode" power-up. It should temporarily double the score. Here's my initial plan:

**1. Core Logic Coder:** You'll implement the underlying mechanics. Define what "Frenzy Mode" is, its duration, and how it affects the scoring system. You must emit events when the mode starts and ends.

**2. UI/UX Coder:** You need to create a clear visual indicator that Frenzy Mode is active. This can't just be a static icon; it needs to feel dynamic. You'll subscribe to the events from the Core Logic team.

**3. Audio & Social Coder:** I want a distinct audio cue for when Frenzy Mode activates, and the background music should intensify during the mode. This must be driven by the same events.

**4. Quality & Integration Coder:** You'll need to verify that all systems work in concert.

Everyone, remember the rules: Systemic Ripple, No Isolated Polish. Let's see your proposals.`
    },
    {
      role: AiRole.CoreLogic,
      content: `Got it. Here's my plan for the core logic:

- **System Integration:** This will affect the **Scoring System** and the **Player State System**.
- **Implementation:** I'll add a new boolean state, \`player.state.isFrenzyActive\`, and a timer for its duration (e.g., 10 seconds). When active, I'll modify the score calculation function: \`newScore = baseScore * (player.state.isFrenzyActive ? 2 : 1)\`.
- **Event-Driven Architecture:** I will emit two new events:
  - \`frenzyModeStarted(duration: 10)\` when the power-up is collected.
  - \`frenzyModeEnded()\` when the timer expires.
- **Quantifiable Outcomes:** We can track the total number of points earned specifically during Frenzy Mode to measure its impact on player engagement.`
    },
    {
      role: AiRole.UIUX,
      content: `I'll build on that. To avoid isolated polish, the UI will be directly tied to the Frenzy Mode state.

- **System Integration:** This touches the main **Game HUD** and the **FX/Animation System**.
- **Implementation:** I will subscribe to the \`frenzyModeStarted\` and \`frenzyModeEnded\` events.
  - On \`frenzyModeStarted\`: I will add a pulsating border around the screen with a countdown timer derived from the event's \`duration\` payload. The score multiplier text ("x2") will appear next to the score with a "pop" animation.
  - On \`frenzyModeEnded\`: The border and multiplier will animate out.
- **Event-Driven Architecture:** My work is entirely dependent on the events from Core Logic.`
    },
    {
      role: AiRole.AudioSocial,
      content: `Excellent. Audio will react to the same events.

- **System Integration:** This impacts the **Sound Effect System** and the **Dynamic Music System**.
- **Implementation:**
  - On \`frenzyModeStarted\`: I'll trigger a "power-up" sound effect. I will also signal the dynamic music system to transition to a higher-intensity track layer for the duration of the mode.
  - On \`frenzyModeEnded\`: I'll trigger a "power-down" sound and signal the music system to return to the normal track.
- **Event-Driven Architecture:** Fully subscribed to Core Logic's events. This ensures audio is perfectly synced with gameplay.`
    },
    {
      role: AiRole.QA,
      content: `This is a solid, well-integrated plan. I see clear adherence to the Systemic Ripple and Event-Driven rules.

Here is my test plan:
1.  **Trigger Power-Up:** Verify that collecting the power-up correctly emits the \`frenzyModeStarted\` event.
2.  **Verify System Reactions:**
    - **Core Logic:** Confirm that points are doubled during the active period.
    - **UI/UX:** Confirm the screen border and "x2" multiplier appear immediately.
    - **Audio:** Confirm the activation sound and music change occur.
3.  **Verify Duration:** Ensure the mode lasts exactly for the duration specified in the event payload.
4.  **Verify Deactivation:** When the timer ends, confirm the \`frenzyModeEnded\` event is emitted and all systems (scoring, UI, audio) revert to their normal state simultaneously.
5.  **Edge Case:** Test collecting another Frenzy power-up while one is already active. The expected behavior (e.g., reset the timer) needs to be defined by Core Logic.`
    }
  ],
  finalPlan: `The team's plan for "Frenzy Mode" is approved.

1.  **Core Logic:** Implement the frenzy state, score multiplier logic, and timer. Emit \`frenzyModeStarted(duration)\` and \`frenzyModeEnded\` events. Also, define the behavior for collecting the power-up while it's already active, as noted by QA.
2.  **UI/UX:** Subscribe to Core Logic events to activate and deactivate a pulsating screen border, countdown timer, and score multiplier display.
3.  **Audio:** Subscribe to the same events to trigger power-up/power-down sound effects and transition the dynamic music track.
4.  **QA:** Execute the proposed test plan, paying special attention to the overlapping power-up edge case.
### MANAGER AI FINDINGS & CORRECTIONS
The plan is solid and adheres to all rules for the immediate feature request. However, the proposed event architecture (\`frenzyModeStarted\`, \`frenzyModeEnded\`) is a classic example of creating long-term technical debt for a short-term gain. It lacks foresight for exponential growth. While not a rule violation for this single feature, it's a significant architectural weakness that I will address in the refactoring mandate.`,
  refactoringMandate: `Based on the proposal for a "Frenzy Mode", a significant architectural debt is foreseen. Creating specific events and UI/Audio handlers for each power-up is not scalable and violates the spirit of the "Exponential Growth" rule in the long term.

**MANDATE:** The Core Logic Coder must refactor to a generic "Player State" system. A single, unified event, \`playerStateChanged(state: string, isActive: boolean, duration: number)\`, must be implemented. UI and Audio coders must update their systems to be data-driven, reacting to this generic event's payload instead of hard-coding listeners for each power-up. This will ensure future power-ups can be added with minimal changes to consuming systems.`,
  rewrittenPrompt: `Mission: Generalize the game's core architecture by creating a fully data-driven "Game Object Modification System". This system should allow designers to define buffs, de-buffs, and temporary state changes (like Frenzy Mode) in a separate configuration file (e.g., JSON) without requiring any new Core Logic code. The system will be responsible for parsing these configurations, managing timers, altering game parameters (like 'scoreMultiplier' or 'playerSpeed'), and emitting generic \`gameObjectModified(objectId, modification, isActive)\` events. This will decouple game design from core engineering, enabling true exponential growth of content.`,
  selfEvaluation: {
    text: `**Meta-Architectural Evaluation:**

**1. Process Adherence & Quality:**
Excellent. The team demonstrated a textbook execution of the core rules. Delegation was clear, and each specialist correctly identified their dependencies and integrations. QA's identification of the edge case was crucial.

**2. Solution Quality:**
The proposed solution is robust for the immediate request but is a **linear** solution. Creating separate events for each power-up is not scalable and will lead to code duplication.

**3. Manager AI Performance:**
The Manager AI performed exceptionally. It correctly approved the compliant-but-flawed initial plan, but its "Findings" section astutely identified the long-term technical debt. The "Proactive Refactoring Mandate" was the correct response, forcing the team to address the underlying architectural weakness rather than just shipping the feature. This demonstrates a high level of strategic oversight.

**4. Prompt Quality:**
The \`rewrittenPrompt\` is a masterclass in raising ambition. It takes the concept from the refactoring mandate (a generic state system) and elevates it to a fully data-driven modification system, effectively removing engineers from the process of adding new power-ups. This is a true "Nuclear Prompt" that aims for a 10x improvement in development velocity.

**5. Overall Performance Summary:**
The team performed well, but the Manager AI was the star. Its ability to look beyond the immediate request, identify systemic weakness, and issue a concrete refactoring plan is exactly the kind of proactive quality control this system is designed to foster.`,
    scores: {
        solutionQuality: 3,
        managerPerformance: 5,
        promptQuality: 5,
    }
  }
};
