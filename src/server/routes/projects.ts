import { and, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { dataPoints, db, projectSettings, projects } from '../db'
import { createLogger } from '../lib/logger'
// import { verifyClerkSession } from '../lib/auth' // TODO: implement

const logger = createLogger('projects')

export const projectsRouter = new Hono()

// List user's projects
projectsRouter.get('/', async (c) => {
  // TODO: Get userId from Clerk session
  const userId = 'temp-user-id'

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
  const projectId = c.req.param('id')
  // TODO: Verify ownership or public access

  const [project] = await db.select().from(projects).where(eq(projects.id, projectId))

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
  // TODO: Get userId from Clerk session
  const userId = 'temp-user-id'
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
  const projectId = c.req.param('id')
  const body = await c.req.json()

  logger.info({ projectId }, 'Updating project')

  // Update project metadata
  if (body.name) {
    await db
      .update(projects)
      .set({ name: body.name, updatedAt: new Date() })
      .where(eq(projects.id, projectId))
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
  const projectId = c.req.param('id')
  // TODO: Verify ownership

  logger.info({ projectId }, 'Deleting project')

  await db.delete(projects).where(eq(projects.id, projectId))

  return c.json({ success: true })
})

// Add data points
projectsRouter.post('/:id/points', async (c) => {
  const projectId = c.req.param('id')
  const body = await c.req.json<{
    points: Array<{
      frameNumber: number
      timeSeconds: number
      pixelX: number
      pixelY: number
    }>
  }>()

  logger.info({ projectId, count: body.points.length }, 'Adding data points')

  const insertedPoints = await db
    .insert(dataPoints)
    .values(
      body.points.map((p) => ({
        projectId,
        frameNumber: p.frameNumber,
        timeSeconds: p.timeSeconds.toString(),
        pixelX: p.pixelX.toString(),
        pixelY: p.pixelY.toString(),
      })),
    )
    .returning()

  // Update project timestamp
  await db.update(projects).set({ updatedAt: new Date() }).where(eq(projects.id, projectId))

  return c.json(insertedPoints, 201)
})

// Delete data points
projectsRouter.delete('/:id/points', async (c) => {
  const projectId = c.req.param('id')
  const body = await c.req.json<{ pointIds: string[] }>()

  logger.info({ projectId, count: body.pointIds.length }, 'Deleting data points')

  for (const pointId of body.pointIds) {
    await db
      .delete(dataPoints)
      .where(and(eq(dataPoints.id, pointId), eq(dataPoints.projectId, projectId)))
  }

  return c.json({ success: true })
})
