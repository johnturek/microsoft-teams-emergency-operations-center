# Teams feature relevance evaluation

Last reviewed: 2026-05-24

## Scope

This evaluation focuses on how the current TEOC codebase aligns to modern Teams platform capabilities and what to prioritize next to keep the solution relevant.

## Current implementation snapshot

- **Teams app surface**: Tab-based app (`staticTabs` + `configurableTabs`) with no bot or message extension in primary app manifests.
- **Manifest baseline**:
  - `EOC-TeamsFx/templates/appPackage/manifest.template.json` is on Teams manifest `1.15`.
  - `EOC-TeamsFx/templates/appPackage/manifest.remote.template.json`, `EOC-TeamsFx/templates/appPackage/manifest.local.template.json`, and `Deployment/appPackage/manifest.json` are still on Teams manifest `1.11`.
- **SDK usage**:
  - `@microsoft/teams-js` is used in tab code and already on v2 API style (`microsoftTeams.app.*`, `microsoftTeams.pages.*`).
  - `@microsoft/teamsfx` is present for identity/bootstrap.
- **User experience strengths**: Incident-centric workflows, adaptive card notifications, and accessibility improvements from recent releases.

## Relevance gaps against latest Teams capabilities

1. **Manifest drift across environments**
   - Mixed schema versions (`1.11` and `1.15`) increase maintenance cost and can slow adoption of newer Teams capabilities.
2. **Feature surface is mostly tab-only**
   - No built-in bot/message-extension/AI entry point in the core Teams app package, limiting discoverability and conversational workflows.
3. **No explicit meeting/stage optimization**
   - Current manifests do not declare meeting-focused experiences that are now common in operations scenarios.
4. **No formal Teams feature review cadence**
   - The repo has release notes, but no recurring checklist for reviewing Teams platform updates and deprecations.

## Recommended modernization plan

### Phase 1 (0-30 days): stabilize the platform baseline

- Standardize all app manifests on one current schema version (at least `1.15`, preferably latest supported by the toolchain).
- Add manifest validation to CI so schema drift is caught early.
- Publish a support matrix in the wiki (Teams schema version, Teams JS version, TeamsFx version, Node version).

### Phase 2 (30-60 days): improve Teams-native workflows

- Evaluate adding one high-impact entry point:
  - **Message extension** for incident lookup/updates from compose/search.
  - **Bot command surface** for quick incident actions and broadcast workflows.
- Add deep links for common incident actions and verify behavior across desktop/web/mobile Teams clients.

### Phase 3 (60-90 days): align to AI and meetings usage patterns

- Pilot a **Copilot/agent-ready** pattern for incident Q&A (using existing incident data and access controls).
- Evaluate meeting-side enhancements where relevant (meeting tab/task module patterns for active incident response sessions).
- Define telemetry KPIs for feature adoption (time-to-incident, action completion, active responders per incident).

## Operational governance to keep TEOC current

- Run a **quarterly Teams platform review** and update this page with:
  - New Teams platform features adopted
  - Deprecated features and migration status
  - SDK/schema updates completed
- Track modernization work as backlog items labeled `teams-platform` and tie each item to a measurable user outcome.

## Suggested immediate backlog items

1. Unify all Teams manifests to one schema version and validate packaging still succeeds.
2. Add CI manifest/schema validation.
3. Prototype one additional Teams surface (message extension _or_ bot command) for incident lookup.
4. Add a quarterly review checklist entry to release governance.
