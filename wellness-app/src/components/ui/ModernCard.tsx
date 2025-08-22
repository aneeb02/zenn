'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ModernCardProps {
  children: ReactNode;
  className?: string;
  variant?: 'glass' | 'solid' | 'gradient';
  gradient?: 'purple' | 'pink' | 'blue' | 'sunset';
  hover?: boolean;
}

export function ModernCard({ 
  children, 
  className, 
  variant = 'glass',
  gradient = 'purple',
  hover = true 
}: ModernCardProps) {
  const baseClasses = 'rounded-3xl p-6 transition-all duration-300';
  
  const variantClasses = {
    glass: `
      bg-white/70 backdrop-blur-xl
      border border-white/20
      shadow-[0_8px_32px_rgba(0,0,0,0.08)]
      ${hover ? 'hover:shadow-[0_8px_40px_rgba(0,0,0,0.12)] hover:-translate-y-1' : ''}
    `,
    solid: `
      bg-white
      shadow-[0_4px_24px_rgba(0,0,0,0.06)]
      ${hover ? 'hover:shadow-[0_8px_32px_rgba(0,0,0,0.1)] hover:-translate-y-1' : ''}
    `,
    gradient: ''
  };

  const gradientClasses = {
    purple: 'bg-gradient-to-br from-purple-500 to-pink-500',
    pink: 'bg-gradient-to-br from-pink-400 to-rose-500',
    blue: 'bg-gradient-to-br from-blue-500 to-cyan-500',
    sunset: 'bg-gradient-to-br from-orange-400 to-pink-500'
  };

  const classes = cn(
    baseClasses,
    variant === 'gradient' ? gradientClasses[gradient] : variantClasses[variant],
    className
  );

  return (
    <div className={classes}>
      {children}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: number;
  color?: 'purple' | 'pink' | 'blue' | 'green';
}

export function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend,
  color = 'purple' 
}: StatCardProps) {
  const colorClasses = {
    purple: 'from-purple-500 to-pink-500',
    pink: 'from-pink-400 to-rose-500',
    blue: 'from-blue-500 to-cyan-500',
    green: 'from-green-500 to-emerald-500'
  };

  return (
    <ModernCard className="relative overflow-hidden">
      {/* Background Gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses[color]} opacity-5`} />
      
      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm text-gray-600 font-medium">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
          </div>
          {icon && (
            <div className={`p-3 rounded-2xl bg-gradient-to-br ${colorClasses[color]}`}>
              <div className="text-white">{icon}</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          {subtitle && (
            <p className="text-xs text-gray-500">{subtitle}</p>
          )}
          {trend !== undefined && (
            <div className={`flex items-center text-xs font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              <span>{trend >= 0 ? '↑' : '↓'}</span>
              <span className="ml-1">{Math.abs(trend)}%</span>
            </div>
          )}
        </div>
      </div>
    </ModernCard>
  );
}

interface ActivityCardProps {
  title: string;
  activities: Array<{
    id: string;
    user: string;
    avatar?: string;
    action: string;
    time: string;
    isOnline?: boolean;
  }>;
}

export function ActivityCard({ title, activities }: ActivityCardProps) {
  return (
    <ModernCard className="h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <button className="text-sm text-purple-600 hover:text-purple-700 font-medium">
          View All
        </button>
      </div>

      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-center gap-3">
            {/* Avatar */}
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold text-sm">
                {activity.avatar || activity.user[0].toUpperCase()}
              </div>
              {activity.isOnline && (
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {activity.user}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {activity.action}
              </p>
            </div>

            {/* Time */}
            <span className="text-xs text-gray-400">
              {activity.time}
            </span>
          </div>
        ))}
      </div>
    </ModernCard>
  );
}
