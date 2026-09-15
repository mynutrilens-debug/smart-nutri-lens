## Goal

Make every AI workout plan respect the user’s training location, exact available equipment, fitness level, body profile, injuries, activity level, and fitness goal.

## Changes

1. **Capture exact equipment**
   - Keep Home, Gym, and Hybrid as the training-location choices.
   - For Home and Hybrid, let users select the equipment they actually have (for example bodyweight only, dumbbells, resistance bands, kettlebell, bench, pull-up bar, skipping rope, or treadmill/bike).
   - Prevent incompatible combinations such as Home with full-gym equipment.

2. **Strengthen workout personalization**
   - Send the exact equipment list and all relevant profile data to the workout planner.
   - Treat training location, equipment, injuries, medical limits, fitness level, and goal as hard constraints.
   - Tailor exercise choice, weekly volume, intensity, recovery, sets, reps, and cardio to the user’s profile and goal.

3. **Prevent unsuitable exercises**
   - For Home plans, prohibit machines, cables, barbells, and other unselected equipment.
   - For bodyweight-only plans, generate only bodyweight movements.
   - For Hybrid plans, clearly identify Home and Gym days and apply each location’s equipment rules.
   - Validate the generated plan before saving so an incompatible plan is never shown.

4. **Cache correctly**
   - Include the exact equipment selection in the saved-plan signature so changing equipment automatically triggers a new personalized weekly plan.

5. **Verify**
   - Check Home + selected equipment, Home + bodyweight only, Gym, and Hybrid inputs.
   - Confirm saved plans reload and regenerate when a key preference changes.
