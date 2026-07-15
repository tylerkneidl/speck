import { and, eq, inArray, sql } from 'drizzle-orm'
import { Hono } from 'hono'
import { dataPoints, db, projectSettings, projects } from '../db'
import { getUserId } from '../lib/auth'
import { createLogger } from '../lib/logger'

const logger = createLogger('projects')

export const projectsRouter = new Hono()

// List user's projects
projectsRouter.get('/', async (c) => {
  const userId = getUserId(c)

  logger.info({ userId }, 'Listing projects')

  const userProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.userId, userId))
    .orderBy(projects.updatedAt)

  return c.json(userProjects)
})

// Get single project with settings and data points
projectsRouter.get('/:id', async (c) => {
  const userId = getUserId(c)
  const projectId = c.req.param('id')

  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))

  if (!project) {
    return c.json({ error: 'Project not found' }, 404)
  }

  const [settings] = await db
    .select()
    .from(projectSettings)
    .where(eq(projectSettings.projectId, projectId))

  const points = await db
    .select()
    .from(dataPoints)
    .where(eq(dataPoints.projectId, projectId))
    .orderBy(dataPoints.frameNumber)

  return c.json({
    ...project,
    settings,
    dataPoints: points,
  })
})

// Create new project
projectsRouter.post('/', async (c) => {
  const userId = getUserId(c)
  const body = await c.req.json<{ name: string }>()

  logger.info({ userId, name: body.name }, 'Creating project')

  const [project] = await db
    .insert(projects)
    .values({
      userId,
      name: body.name,
    })
    .returning()

  if (!project) {
    return c.json({ error: 'Failed to create project' }, 500)
  }

  // Create empty settings record
  await db.insert(projectSettings).values({
    projectId: project.id,
  })

  return c.json(project, 201)
})

// Update project settings
projectsRouter.put('/:id', async (c) => {
  const userId = getUserId(c)
  const projectId = c.req.param('id')
  const body = await c.req.json()

  logger.info({ projectId, userId }, 'Updating project')

  // Verify ownership before any write
  const [owned] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))

  if (!owned) {
    return c.json({ error: 'Project not found' }, 404)
  }

  // Update project metadata
  if (body.name) {
    await db
      .update(projects)
      .set({ name: body.name, updatedAt: new Date() })
      .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
  }

  // Update settings
  if (body.videoMetadata || body.coordinateSystem || body.uiSettings) {
    await db
      .update(projectSettings)
      .set({
        videoMetadata: body.videoMetadata,
        coordinateSystem: body.coordinateSystem,
        uiSettings: body.uiSettings,
      })
      .where(eq(projectSettings.projectId, projectId))
  }

  return c.json({ success: true })
})

// Delete project
projectsRouter.delete('/:id', async (c) => {
  const userId = getUserId(c)
  const projectId = c.req.param('id')

  logger.info({ projectId, userId }, 'Deleting project')

  const deleted = await db
    .delete(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .returning({ id: projects.id })

  if (deleted.length === 0) {
    return c.json({ error: 'Project not found' }, 404)
  }

  return c.json({ success: true })
})

// Add data points
projectsRouter.post('/:id/points', async (c) => {
  const userId = getUserId(c)
  const projectId = c.req.param('id')
  const body = await c.req.json<{
    points: Array<{
      id?: string
      frameNumber: number
      timeSeconds: number
      pixelX: number
      pixelY: number
    }>
  }>()

  // Verify ownership before writing points
  const [owned] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))

  if (!owned) {
    return c.json({ error: 'Project not found' }, 404)
  }

  logger.info({ projectId, count: body.points.length }, 'Upserting data points')

  // Upsert: new points insert, and points sent again with the same client id
  // (e.g. after dragging one to a new position) update in place. Keyed on the
  // client-generated id, so add / move / delete all round-trip through this id.
  const insertedPoints = await db
    .insert(dataPoints)
    .values(
      body.points.map((p) => ({
        ...(p.id ? { id: p.id } : {}),
        projectId,
        frameNumber: p.frameNumber,
        timeSeconds: p.timeSeconds.toString(),
        pixelX: p.pixelX.toString(),
        pixelY: p.pixelY.toString(),
      })),
    )
    .onConflictDoUpdate({
      target: dataPoints.id,
      set: {
        frameNumber: sql`excluded.frame_number`,
        timeSeconds: sql`excluded.time_seconds`,
        pixelX: sql`excluded.pixel_x`,
        pixelY: sql`excluded.pixel_y`,
      },
    })
    .returning()

  // Update project timestamp
  await db
    .update(projects)
    .set({ updatedAt: new Date() })
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))

  return c.json(insertedPoints, 201)
})

// Delete data points
projectsRouter.delete('/:id/points', async (c) => {
  const userId = getUserId(c)
  const projectId = c.req.param('id')
  const body = await c.req.json<{ pointIds: string[] }>()

  // Verify ownership before deleting points
  const [owned] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))

  if (!owned) {
    return c.json({ error: 'Project not found' }, 404)
  }

  logger.info({ projectId, count: body.pointIds.length }, 'Deleting data points')

  if (body.pointIds.length > 0) {
    await db
      .delete(dataPoints)
      .where(and(inArray(dataPoints.id, body.pointIds), eq(dataPoints.projectId, projectId)))
  }

  return c.json({ success: true })
})
