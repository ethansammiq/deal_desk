# Deal Classification System Proposal

## Current Problem
The existing system had overlapping and confusing labels mixing manual priority with automated timing analysis.

## Proposed 3-Tier System

### 1. **Stage Status** (Primary Workflow States)
- **Definition**: The 11 main workflow statuses that track deal progression
- **Control**: System/user-controlled as deals move through the funnel
- **Values**: `draft`, `scoping`, `submitted`, `under_review`, `revision_requested`, `negotiating`, `approved`, `contract_drafting`, `client_review`, `signed`, `lost`
- **Usage**: Core workflow tracking, permissions, UI state management

### 2. **Priority** (Seller-Defined Business Importance)
- **Definition**: Manual business priority set by seller during deal submission
- **Control**: Seller-controlled in deal submission form only
- **Values**: `Critical`, `High`, `Medium`, `Low`
- **Usage**: Business prioritization, resource allocation, escalation
- **Guidelines**:
  - **Critical**: Major strategic account, competitive threat, or time-sensitive opportunity
  - **High**: Significant revenue impact, key client relationship, or growth opportunity  
  - **Medium**: Standard business opportunity with normal importance
  - **Low**: Opportunistic or exploratory deals with minimal immediate impact

### 3. **Flow Intelligence** (Timing-Based Process Health)
- **Definition**: Automated timing analysis that reflects deal velocity through the pipeline
- **Control**: System-generated based on time in current status
- **Values**: `On Track`, `At Risk`, `Delayed`, `Stalled`
- **Usage**: Strategic insights, process optimization, intervention triggers

#### Flow Intelligence Definitions:
- **On Track**: Deal progressing within expected timeframes for current status
- **At Risk**: Approaching timing threshold but not yet delayed (80% of threshold)
- **Delayed**: Exceeded normal timing threshold for current status
- **Stalled**: Significantly delayed (2x normal threshold) requiring immediate attention

#### Timing Thresholds:
```
Status              Normal    At Risk    Delayed    Stalled
scoping            5 days    4 days     6+ days    10+ days
submitted          3 days    2 days     4+ days    7+ days  
under_review       3 days    2 days     4+ days    7+ days
revision_requested 3 days    2 days     4+ days    7+ days
approved           3 days    2 days     4+ days    7+ days
negotiating        7 days    5 days     8+ days    14+ days
contract_drafting  5 days    4 days     6+ days    10+ days
```

## Implementation Strategy

### Frontend Changes:
1. **Deal Submission Form**: Add Priority field in Deal Timeline section with tooltip guidance
2. **Analytics Filters**: Separate filter sections for Priority vs Flow Intelligence
3. **Strategic Insights**: Use Flow Intelligence for automation triggers
4. **Deal Display**: Show both Priority badge and Flow Intelligence status

### Backend Changes:
1. **Schema**: Priority field already exists, just needs Critical option added ✓
2. **Validation**: Make Priority required for deal submission form only
3. **Classification**: Update system to use Flow Intelligence for timing analysis

### Benefits:
- **Clear Separation**: Business priority vs process health
- **Seller Control**: Priority reflects business judgment, not automated rules
- **Process Intelligence**: Flow status provides actionable timing insights
- **Reduced Confusion**: Each classification serves distinct purpose
- **Better Insights**: Strategic intelligence focuses on process bottlenecks

## Migration Plan:
1. Update schema to require Priority in submission form
2. Implement Flow Intelligence classification system
3. Update UI to show both Priority and Flow Intelligence
4. Migrate Strategic Insights to use Flow Intelligence
5. Update filters to separate business priority from timing analysis