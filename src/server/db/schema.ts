import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'

export const projects = pgTable(
  'projects',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').notNull(),
    name: text('name').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    isPublic: boolean('is_public').default(false).notNull(),
    shareToken: text('share_token').unique(),
  },
  (table) => ({
    userIdIdx: index('projects_user_id_idx').on(table.userId),
  }),
)

export const projectSettings = pgTable('project_settings', {
  projectId: uuid('project_id')
    .primaryKey()
    .references(() => projects.id, { onDelete: 'cascade' }),
  videoMetadata: jsonb('video_metadata').$type<VideoMetadata | null>(),
  coordinateSystem: jsonb('coordinate_system').$type<CoordinateSystem | null>(),
  uiSettings: jsonb('ui_settings').$type<UISettings | null>(),
})

export const dataPoints = pgTable(
  'data_points',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    frameNumber: integer('frame_number').notNull(),
    timeSeconds: numeric('time_seconds', { precision: 10, scale: 6 }).notNull(),
    pixelX: numeric('pixel_x', { precision: 10, scale: 2 }).notNull(),
    pixelY: numeric('pixel_y', { precision: 10, scale: 2 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    projectIdIdx: index('data_points_project_id_idx').on(table.projectId),
    frameNumberIdx: index('data_points_frame_number_idx').on(table.projectId, table.frameNumber),
  }),
)

// Type definitions for JSONB columns
export interface VideoMetadata {
  storageUrl: string
  fileName: string
  duration: number
  frameRate: number
  width: number
  height: number
  thumbnailUrl?: string
}

export interface CoordinateSystem {
  scalePoint1: { x: number; y: number }
  scalePoint2: { x: number; y: number }
  scaleDistance: number
  scaleUnit: 'm' | 'cm' | 'mm' | 'ft' | 'in'
  origin: { x: number; y: number }
  rotation: number
  yAxisUp: boolean
}

export interface UISettings {
  trailLength: number
  pointSize: number
  pointColor: string
  showPath: boolean
  autoAdvance: boolean
}

// Type exports for use in application
export type Project = typeof projects.$inferSelect
export type NewProject = typeof projects.$inferInsert
export type ProjectSettings = typeof projectSettings.$inferSelect
export type DataPoint = typeof dataPoints.$inferSelect
export type NewDataPoint = typeof dataPoints.$inferInsert
