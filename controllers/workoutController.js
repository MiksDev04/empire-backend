import Workout from '../models/Workout.js';

// Get user's template or create default one
export const getTemplate = async (req, res) => {
  try {
    let template = await Workout.findOne({
      userId: req.user.id,
      isTemplate: true,
    });

    // Create default template if none exists
    if (!template) {
      const defaultDays = {
        Sunday: { name: 'Rest Day', exercises: [] },
        Monday: {
          name: 'Push Day',
          exercises: [
            { name: 'Push-ups', reps: '15', sets: '3', repsUnit: 'reps' },
            { name: 'Bench Press', reps: '12', sets: '4', repsUnit: 'reps' },
          ],
        },
        Tuesday: {
          name: 'Leg Day',
          exercises: [
            { name: 'Squats', reps: '12', sets: '4', repsUnit: 'reps' },
            { name: 'Lunges', reps: '10', sets: '3', repsUnit: 'reps' },
          ],
        },
        Wednesday: { name: 'Rest Day', exercises: [] },
        Thursday: {
          name: 'Pull Day',
          exercises: [
            { name: 'Pull-ups', reps: '10', sets: '3', repsUnit: 'reps' },
            { name: 'Rows', reps: '12', sets: '4', repsUnit: 'reps' },
          ],
        },
        Friday: {
          name: 'Cardio',
          exercises: [
            { name: 'Running', reps: '30', sets: '1', repsUnit: 'minutes' },
          ],
        },
        Saturday: {
          name: 'Full Body',
          exercises: [
            { name: 'Deadlifts', reps: '10', sets: '3', repsUnit: 'reps' },
            { name: 'Planks', reps: '60', sets: '3', repsUnit: 'seconds' },
          ],
        },
      };

      template = await Workout.create({
        userId: req.user.id,
        weekId: 'template',
        startDate: new Date(),
        days: defaultDays,
        isTemplate: true,
      });
    }

    res.json({ success: true, data: template });
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update template
export const updateTemplate = async (req, res) => {
  try {
    const { days } = req.body;

    let template = await Workout.findOne({
      userId: req.user.id,
      isTemplate: true,
    });

    if (!template) {
      template = await Workout.create({
        userId: req.user.id,
        weekId: 'template',
        startDate: new Date(),
        days,
        isTemplate: true,
      });
    } else {
      template.days = days;
      await template.save();
    }

    res.json({ success: true, data: template });
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get current week or create from template
export const getCurrentWeek = async (req, res) => {
  try {
    const { weekId } = req.query;

    let currentWeek = await Workout.findOne({
      userId: req.user.id,
      weekId,
      isTemplate: false,
    });

    if (!currentWeek) {
      // Get template and create new week
      let template = await Workout.findOne({
        userId: req.user.id,
        isTemplate: true,
      });

      // Create default template if none exists
      if (!template) {
        const defaultDays = {
          Sunday: { name: 'Rest Day', exercises: [] },
          Monday: { name: 'Push Day', exercises: [] },
          Tuesday: { name: 'Leg Day', exercises: [] },
          Wednesday: { name: 'Rest Day', exercises: [] },
          Thursday: { name: 'Pull Day', exercises: [] },
          Friday: { name: 'Cardio', exercises: [] },
          Saturday: { name: 'Full Body', exercises: [] },
        };

        template = await Workout.create({
          userId: req.user.id,
          weekId: 'template',
          startDate: new Date(),
          days: defaultDays,
          isTemplate: true,
        });
      }

      // Create new week from template
      const newWeekDays = {};
      const daysOfWeek = [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
      ];
      
      daysOfWeek.forEach((day) => {
        const templateDay = template.days[day] || { name: 'Rest Day', exercises: [] };
        newWeekDays[day] = {
          name: templateDay.name,
          exercises: templateDay.exercises.map((ex) => ({
            name: ex.name,
            sets: ex.sets,
            reps: ex.reps,
            repsUnit: ex.repsUnit,
            completed: false,
            completedAt: null,
          })),
        };
      });

      currentWeek = await Workout.create({
        userId: req.user.id,
        weekId,
        startDate: new Date(weekId),
        days: newWeekDays,
        isTemplate: false,
      });
    }

    res.json({ success: true, data: currentWeek });
  } catch (error) {
    console.error('Error fetching current week:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update current week
export const updateCurrentWeek = async (req, res) => {
  try {
    const { weekId, days } = req.body;

    let currentWeek = await Workout.findOne({
      userId: req.user.id,
      weekId,
      isTemplate: false,
    });

    if (!currentWeek) {
      return res
        .status(404)
        .json({ success: false, message: 'Week not found' });
    }

    currentWeek.days = days;
    await currentWeek.save();

    res.json({ success: true, data: currentWeek });
  } catch (error) {
    console.error('Error updating current week:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Toggle exercise completion
export const toggleExercise = async (req, res) => {
  try {
    const { weekId, day, exerciseId } = req.params;

    const workout = await Workout.findOne({
      userId: req.user.id,
      weekId,
      isTemplate: false,
    });

    if (!workout) {
      return res
        .status(404)
        .json({ success: false, message: 'Workout week not found' });
    }

    const dayData = workout.days[day];
    if (!dayData) {
      return res.status(404).json({ success: false, message: 'Day not found' });
    }

    const exercise = dayData.exercises.id(exerciseId);
    if (!exercise) {
      return res
        .status(404)
        .json({ success: false, message: 'Exercise not found' });
    }

    exercise.completed = !exercise.completed;
    if (exercise.completed) {
      exercise.completedAt = new Date();
    } else {
      exercise.completedAt = null;
    }

    await workout.save();

    res.json({ success: true, data: workout });
  } catch (error) {
    console.error('Error toggling exercise:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Archive week (move to history)
export const archiveWeek = async (req, res) => {
  try {
    const { weekId } = req.params;

    const workout = await Workout.findOne({
      userId: req.user.id,
      weekId,
      isTemplate: false,
    });

    if (!workout) {
      return res
        .status(404)
        .json({ success: false, message: 'Workout week not found' });
    }

    const startDate = new Date(workout.startDate);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);

    workout.endDate = endDate;
    workout.archivedAt = new Date();
    await workout.save();

    res.json({ success: true, data: workout });
  } catch (error) {
    console.error('Error archiving week:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get workout history
export const getHistory = async (req, res) => {
  try {
    const history = await Workout.find({
      userId: req.user.id,
      isTemplate: false,
      archivedAt: { $exists: true },
    }).sort({ archivedAt: -1 });

    res.json({ success: true, data: history });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Delete a workout week
export const deleteWeek = async (req, res) => {
  try {
    const { weekId } = req.params;

    const workout = await Workout.findOneAndDelete({
      userId: req.user.id,
      weekId,
      isTemplate: false,
    });

    if (!workout) {
      return res
        .status(404)
        .json({ success: false, message: 'Workout week not found' });
    }

    res.json({ success: true, message: 'Workout week deleted' });
  } catch (error) {
    console.error('Error deleting week:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Sync current week with template
export const syncWithTemplate = async (req, res) => {
  try {
    const { weekId } = req.params;

    // Get current week
    const currentWeek = await Workout.findOne({
      userId: req.user.id,
      weekId,
      isTemplate: false,
    });

    if (!currentWeek) {
      return res
        .status(404)
        .json({ success: false, message: 'Current week not found' });
    }

    // Get template
    const template = await Workout.findOne({
      userId: req.user.id,
      isTemplate: true,
    });

    if (!template) {
      return res
        .status(404)
        .json({ success: false, message: 'Template not found' });
    }

    // Preserve completed exercises
    const daysOfWeek = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];

    daysOfWeek.forEach((day) => {
      const templateDay = template.days[day];
      const currentDay = currentWeek.days[day];
      
      if (templateDay) {
        // Create a map of completed exercises by name
        const completedMap = {};
        if (currentDay && currentDay.exercises) {
          currentDay.exercises.forEach((ex) => {
            if (ex.completed) {
              completedMap[ex.name.toLowerCase()] = {
                completed: ex.completed,
                completedAt: ex.completedAt,
              };
            }
          });
        }

        // Apply template but preserve completion status
        currentWeek.days[day] = {
          name: templateDay.name,
          exercises: templateDay.exercises.map((ex) => {
            const existingCompletion = completedMap[ex.name.toLowerCase()];
            return {
              name: ex.name,
              sets: ex.sets,
              reps: ex.reps,
              repsUnit: ex.repsUnit,
              completed: existingCompletion?.completed || false,
              completedAt: existingCompletion?.completedAt || null,
            };
          }),
        };
      }
    });

    await currentWeek.save();

    res.json({ success: true, data: currentWeek });
  } catch (error) {
    console.error('Error syncing with template:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

