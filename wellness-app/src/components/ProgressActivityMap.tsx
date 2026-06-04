'use client';

export interface ActivityMapDay {
  date: string;
  affirmationsViewed: number;
  sessionMinutes: number;
  focusSessionsCount: number;
  journalEntriesCount: number;
  intensity: 0 | 1 | 2 | 3 | 4;
  completedFocusAndJournal: boolean;
}

interface ProgressActivityMapProps {
  days: ActivityMapDay[];
}

const INTENSITY_COLORS: Record<ActivityMapDay['intensity'], string> = {
  0: 'rgba(255, 255, 255, 0.05)',
  1: 'rgba(122, 154, 126, 0.28)',
  2: 'rgba(122, 154, 126, 0.48)',
  3: 'rgba(122, 154, 126, 0.72)',
  4: 'rgba(168, 213, 186, 0.95)',
};

function chunkWeeks(days: ActivityMapDay[]) {
  const weeks: ActivityMapDay[][] = [];
  for (let index = 0; index < days.length; index += 7) {
    weeks.push(days.slice(index, index + 7));
  }
  return weeks;
}

function formatTooltip(day: ActivityMapDay) {
  const date = new Date(`${day.date}T00:00:00`);
  const label = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  const sessionLabel = day.focusSessionsCount === 1 ? 'session' : 'sessions';
  const journalLabel = day.journalEntriesCount === 1 ? 'journal entry' : 'journal entries';
  const affirmationLabel = day.affirmationsViewed === 1 ? 'affirmation' : 'affirmations';

  return `${label}: ${day.focusSessionsCount} ${sessionLabel}, ${day.sessionMinutes} focus min, ${day.journalEntriesCount} ${journalLabel}, ${day.affirmationsViewed} ${affirmationLabel}`;
}

export function ProgressActivityMap({ days }: ProgressActivityMapProps) {
  const weeks = chunkWeeks(days);

  return (
    <div>
      <div style={{
        display: 'flex',
        gap: '6px',
        overflowX: 'auto',
        paddingBottom: 'var(--space-sm)',
      }}>
        {weeks.map((week, weekIndex) => (
          <div
            key={`week-${weekIndex}`}
            style={{
              display: 'grid',
              gridTemplateRows: 'repeat(7, 1fr)',
              gap: '6px',
              flex: '0 0 auto',
            }}
          >
            {week.map((day) => (
              <div
                key={day.date}
                title={formatTooltip(day)}
                aria-label={formatTooltip(day)}
                style={{
                  width: 'clamp(12px, 2vw, 17px)',
                  aspectRatio: '1 / 1',
                  borderRadius: '4px',
                  background: INTENSITY_COLORS[day.intensity],
                  border: day.completedFocusAndJournal
                    ? '1px solid var(--amber-glow)'
                    : '1px solid rgba(255, 255, 255, 0.07)',
                  boxShadow: day.completedFocusAndJournal
                    ? '0 0 12px rgba(194, 155, 108, 0.22)'
                    : 'none',
                }}
              />
            ))}
          </div>
        ))}
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 'var(--space-md)',
        alignItems: 'center',
        flexWrap: 'wrap',
        marginTop: 'var(--space-sm)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          color: 'var(--text-muted)',
          fontSize: '0.75rem',
        }}>
          <span>empty</span>
          {[0, 1, 2, 3, 4].map((level) => (
            <span
              key={level}
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '3px',
                background: INTENSITY_COLORS[level as ActivityMapDay['intensity']],
                border: '1px solid rgba(255, 255, 255, 0.07)',
                display: 'inline-block',
              }}
            />
          ))}
          <span>deep</span>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          color: 'var(--text-muted)',
          fontSize: '0.75rem',
        }}>
          <span style={{
            width: '12px',
            height: '12px',
            borderRadius: '3px',
            background: 'rgba(122, 154, 126, 0.48)',
            border: '1px solid var(--amber-glow)',
            boxShadow: '0 0 10px rgba(194, 155, 108, 0.22)',
            display: 'inline-block',
          }} />
          <span>focus + journal</span>
        </div>
      </div>
    </div>
  );
}
