import type { SampleProject } from '@/features/projects/sampleProject'
import type { VideoMetadata } from '@/stores/video'

export type SettingValue = number | string

/** A variable the experiment was filmed at several values of, e.g. incline angle 10° / 20° / 30°. */
export interface LabSetting {
  key: string
  label: string
  unit?: string
  values: SettingValue[]
}

/** One filmed video for one combination of setting values. */
export interface LabTake {
  /** Globally unique — it's the `/run/$takeId` URL segment. */
  id: string
  settingValues: Record<string, SettingValue>
  video: VideoMetadata
  /** Known calibration. Lets a student skip scale + origin and go straight to tracking. */
  coordinateSystem?: SampleProject['coordinateSystem']
}

/** A scene: one experiment, its variables, and every take we have of it. */
export interface Lab {
  slug: string
  title: string
  summary: string
  topic: LabTopic
  /** AP Physics 1 unit (2024 framework). */
  unit: number
  settings: LabSetting[]
  takes: LabTake[]
  /** Where the footage came from, shown on the bench. */
  credit?: string
}

export type LabTopic =
  | 'Kinematics'
  | 'Forces'
  | 'Energy'
  | 'Momentum'
  | 'Rotation'
  | 'Oscillations'
  | 'Fluids'

export type Selection = Record<string, string>
