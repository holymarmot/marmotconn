// Re-export lucide-react icons with consistent naming for the app
export {
  Folder as FolderIcon,
  Cloud as CloudIcon,
  GitBranch as BranchIcon,
  GitCommit as CommitIcon,
  Plus as PlusIcon,
  X as XIcon,
  Search as SearchIcon,
  RefreshCw as RefreshIcon,
  ArrowUp as ArrowUpIcon,
  ArrowDown as ArrowDownIcon,
  Key as KeyIcon,
  Copy as CopyIcon,
  Trash2 as TrashIcon,
  ChevronDown as ChevronDownIcon,
  ChevronRight as ChevronRightIcon,
  Lock as LockIcon,
  Check as CheckIcon,
  Terminal as TerminalIcon,
  Undo2 as UndoIcon,
  RotateCcw as RevertIcon,
  FolderOpen as FolderOpenIcon,
  FileMinus as FileMinusIcon,
  EyeOff as EyeOffIcon,
  MoreHorizontal as MoreIcon,
  AlertCircle as AlertIcon,
  Info as InfoIcon,
  LogOut as LogOutIcon,
  GitPullRequest as PullRequestIcon,
  Merge as MergeIcon,
  Tag as TagIcon,
  Settings as SettingsIcon,
  RefreshCcw as SyncIcon,
} from 'lucide-react'

import React from 'react'

// Marmot logo icon (custom, kept as SVG)
interface IconProps {
  size?: number
  className?: string
  style?: React.CSSProperties
}

export function MarmotIcon({ size = 24, className = '', style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      style={style}
    >
      <path d="M12 2 C8 2 5 4 4 7 L3 10 L3 14 L5 16 L5 20 L8 20 L8 17 L10 17 L10 20 L14 20 L14 17 L16 17 L16 20 L19 20 L19 16 L21 14 L21 10 L20 7 C19 4 16 2 12 2Z" />
      <path d="M7 3 L5 1 L7 5Z M17 3 L19 1 L17 5Z" />
      <circle cx="9" cy="9" r="1.2" fill="var(--color-background)" />
      <circle cx="15" cy="9" r="1.2" fill="var(--color-background)" />
    </svg>
  )
}

// Spinner (custom animated icon)
export function SpinnerIcon({ size = 16, className = '', style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      className={`animate-spin ${className}`}
      style={style}
    >
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2"/>
      <path d="M14 8a6 6 0 00-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}
