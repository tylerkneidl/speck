// Bundled, read-anywhere sample project — a real tracked projectile (a howitzer
// cart launch, LivePhoto Physics Series). Powers the public `/try` route so a
// visitor can explore the whole flow with no upload and no sign-in. Generated
// from the "howitzer" project; regenerate by re-exporting that project's data.
import type { Point } from '@/stores/coordinates'
import type { DataPoint } from '@/stores/tracking'
import type { VideoMetadata } from '@/stores/video'

export interface SampleProject {
  name: string
  metadata: VideoMetadata
  coordinateSystem: {
    scalePoint1: Point
    scalePoint2: Point
    scaleDistance: number
    scaleUnit: 'm' | 'cm' | 'mm' | 'ft' | 'in'
    origin: Point
    originSet: boolean
    rotation: number
    yAxisUp: boolean
  }
  dataPoints: DataPoint[]
}

export const SAMPLE_PROJECT: SampleProject = {
  name: 'Howitzer Cart (sample)',
  metadata: {
    storageUrl: '/sample/howitzer.mp4',
    fileName: 'Howitzer_level_track.mp4',
    duration: 0.8008,
    frameRate: 30,
    width: 640,
    height: 480,
    totalFrames: 24,
  },
  coordinateSystem: {
    scalePoint1: {
      x: 103.6533,
      y: 382.423,
    },
    scalePoint2: {
      x: 533.3898,
      y: 382.423,
    },
    scaleDistance: 1,
    scaleUnit: 'm',
    origin: {
      x: 160.8201,
      y: 382.423,
    },
    originSet: true,
    rotation: 0,
    yAxisUp: true,
  },
  dataPoints: [
    {
      id: '6fc06108-4f05-482d-ace2-a0c47f3cd9db',
      frameNumber: 1,
      time: 0.0333,
      pixelX: 179.55,
      pixelY: 343,
    },
    {
      id: '36be510f-b2f8-43d5-9229-2d2d37fe8d63',
      frameNumber: 2,
      time: 0.0667,
      pixelX: 198.27,
      pixelY: 296.67,
    },
    {
      id: 'c1236ada-486e-4436-83ff-bf19a729f1c8',
      frameNumber: 3,
      time: 0.1,
      pixelX: 216.02,
      pixelY: 254.29,
    },
    {
      id: '93d71b5b-2b36-4124-ba7b-e2deeccdd6f7',
      frameNumber: 4,
      time: 0.1333,
      pixelX: 233.76,
      pixelY: 217.82,
    },
    {
      id: 'd3f268b6-1499-4e51-938e-0ce1e8bb6818',
      frameNumber: 5,
      time: 0.1667,
      pixelX: 251.5,
      pixelY: 184.31,
    },
    {
      id: '80fbeb42-a186-4ffa-a97f-069bb45ece1d',
      frameNumber: 6,
      time: 0.2,
      pixelX: 269.24,
      pixelY: 155.73,
    },
    {
      id: '4f016bb8-580c-4def-a9d0-907106b30231',
      frameNumber: 7,
      time: 0.2333,
      pixelX: 287.97,
      pixelY: 133.06,
    },
    {
      id: 'dc264ed3-ee11-42be-b616-28a5e9422a91',
      frameNumber: 8,
      time: 0.2667,
      pixelX: 305.71,
      pixelY: 114.33,
    },
    {
      id: 'c90aefef-7247-4db0-9d01-b5b90a7ac434',
      frameNumber: 9,
      time: 0.3,
      pixelX: 322.46,
      pixelY: 100.53,
    },
    {
      id: '49c16508-a473-4272-956f-8fa278067883',
      frameNumber: 10,
      time: 0.3333,
      pixelX: 340.21,
      pixelY: 90.68,
    },
    {
      id: 'c4477ca7-7097-4d57-a06d-b04f1413b174',
      frameNumber: 11,
      time: 0.3667,
      pixelX: 359.92,
      pixelY: 86.74,
    },
    {
      id: '008098a4-6b33-4a48-acbd-4b1b4d8f42bb',
      frameNumber: 12,
      time: 0.4,
      pixelX: 375.69,
      pixelY: 86.74,
    },
    {
      id: '0765e3e8-e43c-4dbb-a16f-1217af20a797',
      frameNumber: 13,
      time: 0.4333,
      pixelX: 394.42,
      pixelY: 90.68,
    },
    {
      id: '53ea8b32-89c1-4917-8394-1b674f3b9858',
      frameNumber: 14,
      time: 0.4667,
      pixelX: 412.16,
      pixelY: 100.53,
    },
    {
      id: '6d67cdd0-3677-4c33-81b1-be82b15f1c03',
      frameNumber: 15,
      time: 0.5,
      pixelX: 428.91,
      pixelY: 114.33,
    },
    {
      id: 'f66fd399-7fb5-44f8-8187-906138c6bb46',
      frameNumber: 16,
      time: 0.5333,
      pixelX: 446.65,
      pixelY: 134.05,
    },
    {
      id: '48db34b0-7b56-4c43-8dd1-d1596172638c',
      frameNumber: 17,
      time: 0.5667,
      pixelX: 465.38,
      pixelY: 157.7,
    },
    {
      id: '9171b8c7-9cb3-4788-bbdc-d1c91bdfaedd',
      frameNumber: 18,
      time: 0.6,
      pixelX: 483.12,
      pixelY: 186.28,
    },
    {
      id: 'adc7fe6c-4e72-496d-9081-a2d3cffbb020',
      frameNumber: 19,
      time: 0.6333,
      pixelX: 500.86,
      pixelY: 218.81,
    },
    {
      id: 'c345fb42-8d8f-40a2-ab67-7eecf8b965f5',
      frameNumber: 20,
      time: 0.6667,
      pixelX: 517.62,
      pixelY: 256.26,
    },
    {
      id: '3082ee2a-a87c-473d-855b-386e22ef7246',
      frameNumber: 21,
      time: 0.7,
      pixelX: 536.35,
      pixelY: 298.64,
    },
    {
      id: '5ed8c997-ab87-4d05-8f0d-c6602c7624a7',
      frameNumber: 22,
      time: 0.7333,
      pixelX: 554.09,
      pixelY: 345.95,
    },
  ],
}
