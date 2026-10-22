// AI Curriculum & Study Blueprint Generator for CONSIStracker
// Generates paced day-by-day study plans with tasks, time allocations, and practice questions.

export function generateStudyPlan({
  subject,
  scopeType = 'all', // 'all' | 'topic'
  specificTopic = '',
  targetDays = 7,
  hoursPerDay = 2,
  userNotes = ''
}) {
  const daysCount = Math.max(1, Math.min(60, parseInt(targetDays, 10) || 7));
  const dailyHours = Math.max(0.5, Math.min(12, parseFloat(hoursPerDay) || 2));
  const dailyMinutes = Math.round(dailyHours * 60);

  const cleanSubject = (subject || 'General Study').trim();
  const cleanTopic = (specificTopic || (scopeType === 'all' ? 'Full Syllabus' : cleanSubject)).trim();

  // Parse notes if provided by user (split bullet points, lines, or key terms)
  const notesLines = userNotes
    ? userNotes
        .split('\n')
        .map((l) => l.trim().replace(/^[-*•\d.)\s]+/, ''))
        .filter((l) => l.length > 3)
    : [];

  const days = [];

  for (let dayNum = 1; dayNum <= daysCount; dayNum++) {
    const isFirstDay = dayNum === 1;
    const isLastDay = dayNum === daysCount;
    const progressRatio = dayNum / daysCount;

    let dayTheme = '';
    let phase = 'core';

    if (isFirstDay) {
      phase = 'foundation';
      dayTheme = `Core Foundations & Architecture of ${cleanTopic}`;
    } else if (isLastDay) {
      phase = 'mastery';
      dayTheme = `Full Syllabus Synthesis, Mock Testing & Edge Cases`;
    } else if (progressRatio <= 0.35) {
      phase = 'deepen';
      dayTheme = notesLines[dayNum - 1]
        ? `In-Depth: ${notesLines[dayNum - 1]}`
        : `Deep-Dive: Key Principles & Core Mechanisms (Part ${dayNum})`;
    } else if (progressRatio <= 0.75) {
      phase = 'application';
      dayTheme = notesLines[dayNum - 1]
        ? `Practical Application: ${notesLines[dayNum - 1]}`
        : `Advanced Problem Solving & Practical Scenarios (Day ${dayNum})`;
    } else {
      phase = 'review';
      dayTheme = `Speed Run, High-Yield Formulas & Error Analysis`;
    }

    // Allocate daily minutes across 3-4 structured chunks
    const chunk1Min = Math.round(dailyMinutes * 0.35);
    const chunk2Min = Math.round(dailyMinutes * 0.4);
    const chunk3Min = dailyMinutes - chunk1Min - chunk2Min;

    const tasks = [
      {
        id: `d${dayNum}_t1`,
        title: isFirstDay
          ? `Concept Primer: Fundamental definitions, axioms & mental models of ${cleanTopic}`
          : isLastDay
          ? `Comprehensive flash review of all formulas, core theorems & summary sheets`
          : `Theory & Conceptual Breakdown: Master ${dayTheme}`,
        durationMin: chunk1Min,
        completed: false
      },
      {
        id: `d${dayNum}_t2`,
        title: isFirstDay
          ? `Hands-on Walkthrough: Work through 2 foundational textbook/source examples step-by-step`
          : isLastDay
          ? `Timed Simulation: Solve a full-length timed problem set under strict exam conditions`
          : `Active Application: Solve real-world problem sets & implement key patterns`,
        durationMin: chunk2Min,
        completed: false
      },
      {
        id: `d${dayNum}_t3`,
        title: `Active Recall & Diagnostic: Complete today's 3 AI practice challenge questions below`,
        durationMin: chunk3Min,
        completed: false
      }
    ];

    // Generate 3 contextual practice questions with detailed answers
    const questions = [
      {
        id: `d${dayNum}_q1`,
        type: 'conceptual',
        prompt: `Explain the fundamental intuition behind ${dayTheme}. Why is this principle crucial, and what common pitfall do beginners make?`,
        hint: `Think from first principles: what constraint does this solve that simpler approaches fail to address?`,
        solution: `Key intuition: It allows breaking down complex problem state into predictable invariants, reducing error rates and cognitive overload. The most common pitfall is memorizing the surface formula without understanding the underlying precondition.`
      },
      {
        id: `d${dayNum}_q2`,
        type: 'application',
        prompt: `How would you apply ${cleanTopic} if the primary resource or variable constraint was reduced by 50%?`,
        hint: `Consider trade-offs: time vs. space, precision vs. speed, or abstraction vs. direct execution.`,
        solution: `Under constrained conditions, you optimize for asymptotic efficiency by pruning redundant subproblems, caching intermediate states, or employing greedy heuristics where optimal substructure permits.`
      },
      {
        id: `d${dayNum}_q3`,
        type: 'synthesis',
        prompt: `Compare ${cleanTopic} with its closest alternative or opposite methodology. In what scenario is the alternative actually superior?`,
        hint: `No single method is universally best; identify boundary conditions where overhead outweighs the benefit.`,
        solution: `When problem size is trivial or inputs are already nearly sorted/structured, simpler linear/iterative approaches often beat complex frameworks due to lower constant-factor overhead and zero setup penalty.`
      }
    ];

    days.push({
      dayNumber: dayNum,
      theme: dayTheme,
      phase,
      allottedHours: dailyHours,
      allottedMinutes: dailyMinutes,
      completed: false,
      tasks,
      questions
    });
  }

  return {
    id: 'plan_' + Date.now(),
    subject: cleanSubject,
    topic: cleanTopic,
    scopeType,
    targetDays: daysCount,
    totalDays: daysCount,
    hoursPerDay: dailyHours,
    totalTargetHours: (daysCount * dailyHours).toFixed(1),
    createdAt: new Date().toISOString(),
    currentDayNumber: 1,
    hasUserNotes: Boolean(userNotes && userNotes.trim().length > 0),
    days
  };
}
