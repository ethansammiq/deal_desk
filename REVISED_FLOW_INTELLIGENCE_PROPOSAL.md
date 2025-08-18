# Revised Flow Intelligence Proposal
*Based on user feedback from Phase 1 implementation*

## Core Issues Addressed
1. **Delayed/Stalled Overlap**: Too similar in actions and implications
2. **Accelerated Action Gap**: Actions not feasible within the app context

## Revised Classification System

### Option A: Simplified 3-Status System
**Statuses:** `on_track`, `needs_attention`, `accelerated`

- **on_track**: Deal progressing within expected timeframes
- **needs_attention**: Combines delayed + stalled into single actionable category
- **accelerated**: Deal moving faster than typical (positive indicator)

**Benefits:**
- Clearer action differentiation
- Reduces decision paralysis between delayed/stalled
- Single "needs attention" bucket for follow-up actions

### Option B: Enhanced 4-Status with Better Actions
**Statuses:** `on_track`, `delayed`, `stalled`, `accelerated`

**Refined Actions:**
- **delayed**: "Send status update request" (in-app action)
- **stalled**: "Schedule intervention call" (calendar integration)  
- **accelerated**: "Review for early approval" (workflow action)

## Recommended Approach: **Option A (Simplified)**

### Timing Thresholds (Simplified)
```
submitted: 0-2 days (on_track), 3+ days (needs_attention)
under_review: 0-5 days (on_track), 6+ days (needs_attention)
revision_requested: 0-3 days (on_track), 4+ days (needs_attention)
approved: 0-7 days (on_track), 8+ days (needs_attention)
```

### Actionable Intelligence
- **needs_attention**: Clear single action category
- **accelerated**: Focus on recognition rather than intervention
- **on_track**: No action required, positive reinforcement

## Implementation Strategy

### Phase 1 (Current): Basic Classification
- ✅ Core algorithm with simplified statuses
- ✅ Unified timing thresholds

### Phase 2: Enhanced UI & Actions  
- Badge redesign for simplified system
- In-app action buttons for "needs_attention" deals
- Accelerated deals highlight for positive recognition

### Phase 3: Smart Actions
- Contextual action suggestions based on status
- Integration with workflow automation
- Performance tracking improvements

## User Feedback Integration
- **Combine delayed/stalled**: ✅ Addressed in "needs_attention" 
- **Better accelerated actions**: ✅ Focus on recognition over intervention
- **Clearer differentiation**: ✅ Three distinct behavioral categories

## Next Steps
1. Implement Option A (3-status system)
2. Update timing thresholds to simplified model
3. Redesign badges and actions for new system