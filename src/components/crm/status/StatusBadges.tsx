import {
  MANAGEMENT_STATUS,
  COMMERCIAL_STAGE,
  MANAGEMENT_STYLE,
  STAGE_STYLE,
  ManagementStatus,
  CommercialStage,
} from '@/lib/constants';

interface StatusBadgesProps {
  management?: ManagementStatus | string | null;
  stage?: CommercialStage | string | null;
  size?: 'sm' | 'md';
  showUnqualified?: boolean;
  className?: string;
}

export function StatusBadges({
  management,
  stage,
  size = 'md',
  showUnqualified = false,
  className = '',
}: StatusBadgesProps) {
  const mgmtKey = (management as ManagementStatus) || 'pending';
  const mgmtConfig = MANAGEMENT_STYLE[mgmtKey] || MANAGEMENT_STYLE.pending;
  const mgmtLabel = MANAGEMENT_STATUS[mgmtKey] || management || 'Pendiente';

  const stageKey = (stage as CommercialStage) || 'unqualified';
  const stageConfig = STAGE_STYLE[stageKey] || STAGE_STYLE.unqualified;
  const stageLabel = COMMERCIAL_STAGE[stageKey] || stage || 'Sin calificar';

  const isSmall = size === 'sm';
  const padClass = isSmall ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';
  const dotClass = isSmall ? 'w-1.5 h-1.5' : 'w-2 h-2';

  const shouldRenderStage = stage && (showUnqualified || stageKey !== 'unqualified');

  return (
    <div className={`inline-flex flex-wrap items-center gap-1.5 ${className}`}>
      {/* Management Badge */}
      <span
        className={`inline-flex items-center gap-1.5 rounded-lg font-semibold tracking-wide border shadow-2xs ${padClass} ${mgmtConfig.badge}`}
      >
        <span className={`rounded-full shrink-0 ${dotClass} ${mgmtConfig.dot}`} />
        <span>{mgmtLabel}</span>
      </span>

      {/* Stage Badge (hidden if unqualified unless explicitly enabled) */}
      {shouldRenderStage && (
        <span
          className={`inline-flex items-center gap-1.5 rounded-lg font-semibold tracking-wide border shadow-2xs ${padClass} ${stageConfig.badge}`}
        >
          <span className={`rounded-full shrink-0 ${dotClass} ${stageConfig.dot}`} />
          <span>{stageLabel}</span>
        </span>
      )}
    </div>
  );
}
