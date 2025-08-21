interface AffirmationParams {
  goals: string[];
  healthConditions: string[];
  tone: string;
  userName: string;
}

interface AffirmationTemplate {
  text: string;
  category: string;
  healthCondition?: string;
  tone: string;
}

const AFFIRMATION_TEMPLATES: AffirmationTemplate[] = [
  // General encouraging affirmations
  {
    text: "You are capable of amazing things, {name}!",
    category: "general",
    tone: "encouraging"
  },
  {
    text: "Your potential is limitless and your spirit is strong.",
    category: "general",
    tone: "encouraging"
  },
  {
    text: "You have the power to create positive change in your life.",
    category: "general",
    tone: "encouraging"
  },

  // Self-compassion focused
  {
    text: "Be gentle with yourself today, {name}. You're doing your best.",
    category: "self-compassion",
    tone: "gentle"
  },
  {
    text: "You deserve the same kindness you show others.",
    category: "self-compassion",
    tone: "gentle"
  },
  {
    text: "Your feelings are valid, and you deserve compassion.",
    category: "self-compassion",
    tone: "gentle"
  },

  // Anxiety-specific
  {
    text: "You've survived anxious moments before, and you'll get through this one too, {name}.",
    category: "anxiety",
    healthCondition: "anxiety",
    tone: "gentle"
  },
  {
    text: "Your anxiety doesn't control you - you have tools and strength.",
    category: "anxiety",
    healthCondition: "anxiety",
    tone: "encouraging"
  },
  {
    text: "Taking deep breaths is always available to you as a reset button.",
    category: "anxiety",
    healthCondition: "anxiety",
    tone: "gentle"
  },

  // PCOS-specific
  {
    text: "Your body is doing its best, and you're learning to work with it lovingly.",
    category: "pcos",
    healthCondition: "pcos",
    tone: "gentle"
  },
  {
    text: "PCOS doesn't define you - your strength and resilience do, {name}.",
    category: "pcos",
    healthCondition: "pcos",
    tone: "encouraging"
  },
  {
    text: "You're taking control of your health one informed choice at a time.",
    category: "pcos",
    healthCondition: "pcos",
    tone: "motivational"
  },

  // ADHD-specific
  {
    text: "Your brain works differently, and that's your superpower, {name}.",
    category: "adhd",
    healthCondition: "adhd",
    tone: "encouraging"
  },
  {
    text: "Progress over perfection, always. Small steps count.",
    category: "adhd",
    healthCondition: "adhd",
    tone: "gentle"
  },
  {
    text: "You celebrate completing tasks, no matter how small they seem.",
    category: "adhd",
    healthCondition: "adhd",
    tone: "encouraging"
  },

  // Depression-specific
  {
    text: "Getting through today is an accomplishment worth celebrating, {name}.",
    category: "depression",
    healthCondition: "depression",
    tone: "gentle"
  },
  {
    text: "Your feelings are temporary, even when they feel overwhelming.",
    category: "depression",
    healthCondition: "depression",
    tone: "gentle"
  },
  {
    text: "You matter, and the world is better with you in it.",
    category: "depression",
    healthCondition: "depression",
    tone: "encouraging"
  },

  // OCD-specific
  {
    text: "Your thoughts don't define you - your actions and values do, {name}.",
    category: "ocd",
    healthCondition: "ocd",
    tone: "encouraging"
  },
  {
    text: "You're learning to observe your thoughts without judgment.",
    category: "ocd",
    healthCondition: "ocd",
    tone: "gentle"
  },
  {
    text: "Recovery is a journey, and you're making progress every day.",
    category: "ocd",
    healthCondition: "ocd",
    tone: "encouraging"
  },

  // PMS-specific
  {
    text: "Your body is going through natural changes, and you're handling it with grace.",
    category: "pms",
    healthCondition: "pms",
    tone: "gentle"
  },
  {
    text: "It's okay to honor what your body needs during this time, {name}.",
    category: "pms",
    healthCondition: "pms",
    tone: "gentle"
  },
  {
    text: "You know your body best and deserve to care for yourself accordingly.",
    category: "pms",
    healthCondition: "pms",
    tone: "encouraging"
  },

  // Motivational/productivity
  {
    text: "Champions like you, {name}, are made in the daily grind!",
    category: "productivity",
    tone: "motivational"
  },
  {
    text: "Every expert was once a beginner who refused to give up.",
    category: "productivity",
    tone: "motivational"
  },
  {
    text: "Your consistent effort is turning your vision into reality.",
    category: "productivity",
    tone: "motivational"
  },

  // Focus/concentration
  {
    text: "Your ability to focus is a skill that grows stronger with practice.",
    category: "focus",
    tone: "encouraging"
  },
  {
    text: "One task at a time, one breath at a time, {name}.",
    category: "focus",
    tone: "gentle"
  },
  {
    text: "You have the power to direct your attention where it serves you best.",
    category: "focus",
    tone: "motivational"
  },
];

export async function generateDailyAffirmations(params: AffirmationParams): Promise<string[]> {
  const { goals, healthConditions, tone, userName } = params;

  let relevantAffirmations = AFFIRMATION_TEMPLATES.filter(template => {
    // Match tone
    if (template.tone !== tone) return false;

    // Include general affirmations
    if (template.category === 'general') return true;

    // Include health condition specific affirmations
    if (template.healthCondition && healthConditions.includes(template.healthCondition)) {
      return true;
    }

    // Include goal-specific affirmations
    const goalCategories = goals.map(goal => {
      if (goal.includes('focus') || goal.includes('productivity')) return 'focus';
      if (goal.includes('self-compassion')) return 'self-compassion';
      if (goal.includes('stress')) return 'anxiety'; // Stress management overlaps with anxiety support
      return goal;
    });

    if (goalCategories.includes(template.category)) return true;

    return false;
  });

  // If we don't have enough relevant affirmations, include some general ones
  if (relevantAffirmations.length < 8) {
    const generalAffirmations = AFFIRMATION_TEMPLATES.filter(
      template => template.category === 'general' && template.tone === tone
    );
    relevantAffirmations = [...relevantAffirmations, ...generalAffirmations];
  }

  // Shuffle and select 12 affirmations for the day
  const shuffled = relevantAffirmations.sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, 12);

  // Replace placeholders with user's name
  return selected.map(affirmation => 
    affirmation.text.replace(/{name}/g, userName)
  );
}
