'use client';

import { useState } from 'react';

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

function formatDateLabel(day: ActivityMapDay) {
  const date = new Date(`${day.date}T00:00:00`);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    weekday: 'short',
  });
}

function formatActivityLabel(day: ActivityMapDay) {
  const sessionLabel = day.focusSessionsCount === 1 ? 'session' : 'sessions';
  const journalLabel = day.journalEntriesCount === 1 ? 'journal entry' : 'journal entries';

  return `${day.focusSessionsCount} ${sessionLabel} • ${day.sessionMinutes} focus min • ${day.journalEntriesCount} ${journalLabel}`;
}

export function ProgressActivityMap({ days }: ProgressActivityMapProps) {
  const weeks = chunkWeeks(days);
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);

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
            {week.map((day) => {
              const isHovered = hoveredDay === day.date;

              return (
                <div
                  key={day.date}
                  onMouseEnter={() => setHoveredDay(day.date)}
                  onMouseLeave={() => setHoveredDay(null)}
                  onFocus={() => setHoveredDay(day.date)}
                  onBlur={() => setHoveredDay(null)}
                  tabIndex={0}
                  aria-label={`${formatDateLabel(day)}: ${formatActivityLabel(day)}`}
                  style={{
                    position: 'relative',
                    width: 'clamp(12px, 2vw, 17px)',
                    aspectRatio: '1 / 1',
                    outline: 'none',
                  }}
                >
                  {isHovered && (
                    <div
                      role="tooltip"
                      style={{
                        position: 'absolute',
                        left: '50%',
                        bottom: 'calc(100% + 10px)',
                        transform: 'translateX(-50%)',
                        zIndex: 20,
                        width: 'max-content',
                        maxWidth: '220px',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        background: 'rgba(10, 10, 11, 0.96)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.45)',
                        color: 'var(--text-primary)',
                        fontSize: '0.75rem',
                        lineHeight: 1.4,
                        pointerEvents: 'none',
                        textAlign: 'center',
                        whiteSpace: 'normal',
                      }}
                    >
                      <strong style={{
                        display: 'block',
                        color: 'var(--off-white)',
                        fontWeight: 500,
                        marginBottom: '2px',
                      }}>
                        {formatDateLabel(day)}
                      </strong>
                      <span style={{ color: 'var(--text-secondary)' }}>
                        {formatActivityLabel(day)}
                      </span>
                      <span style={{
                        position: 'absolute',
                        left: '50%',
                        top: '100%',
                        transform: 'translateX(-50%)',
                        width: 0,
                        height: 0,
                        borderLeft: '6px solid transparent',
                        borderRight: '6px solid transparent',
                        borderTop: '6px solid rgba(10, 10, 11, 0.96)',
                      }} />
                    </div>
                  )}

                  <div
                    style={{
                      width: '100%',
                      height: '100%',
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
                </div>
              );
            })}
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
