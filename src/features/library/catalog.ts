// The built-in lab library. Each lab is a scene; each take is one filmed
// combination of that scene's settings. Labs with no takes yet are listed as
// "filming soon" so teachers can see what's coming. Footage must be real
// recordings — generated video doesn't obey measurable physics.
import { SAMPLE_PROJECT } from '@/features/projects/sampleProject'
import type { Lab } from './types'

export const LIBRARY: Lab[] = [
  {
    slug: 'howitzer-cart',
    title: 'Howitzer Cart',
    summary:
      'A cart rolls at constant speed and fires a ball straight up. Does the ball land back in the cart?',
    topic: 'Kinematics',
    unit: 1,
    settings: [],
    takes: [
      {
        id: 'howitzer-level',
        settingValues: {},
        video: SAMPLE_PROJECT.metadata,
        coordinateSystem: SAMPLE_PROJECT.coordinateSystem,
      },
    ],
    // TODO(launch): no open license found — replace with our own footage or get permission.
    credit: 'LivePhoto Physics, RIT',
  },
  {
    slug: 'nerf-projectile',
    title: 'Nerf Projectile',
    summary: 'A dart launched at different angles. Find the launch speed and predict the range.',
    topic: 'Kinematics',
    unit: 1,
    settings: [{ key: 'angle', label: 'Launch angle', unit: '°', values: [15, 30, 45, 60] }],
    takes: [],
  },
  {
    slug: 'balcony-drop',
    title: 'Balcony Drop',
    summary: 'Three objects dropped from the same height. Who reaches g, and who feels the air?',
    topic: 'Kinematics',
    unit: 1,
    settings: [
      {
        key: 'object',
        label: 'Object',
        values: ['Basketball', 'Ping-pong ball', 'Pumpkin'],
      },
    ],
    takes: [],
  },
  {
    slug: 'ramp-cart',
    title: 'Cart on a Ramp',
    summary: 'A toy car rolls down a ramp. Relate the acceleration to the incline and the load.',
    topic: 'Forces',
    unit: 2,
    settings: [
      { key: 'height', label: 'Ramp height', unit: 'cm', values: [10, 20, 30] },
      { key: 'mass', label: 'Added mass', unit: 'g', values: [0, 50, 100] },
    ],
    takes: [],
  },
  {
    slug: 'paratroopers',
    title: 'Falling Cupcake Liners',
    summary: 'Stack more liners and watch terminal velocity change.',
    topic: 'Forces',
    unit: 2,
    settings: [{ key: 'liners', label: 'Liners stacked', values: [1, 2, 4, 8] }],
    takes: [],
  },
  {
    slug: 'truck-collisions',
    title: 'Toy-Truck Collisions',
    summary: 'Two trucks collide, sticking or bouncing. Is momentum conserved?',
    topic: 'Momentum',
    unit: 4,
    settings: [
      { key: 'bumper', label: 'Bumper', values: ['Velcro', 'Magnets'] },
      { key: 'mass', label: 'Added mass', unit: 'g', values: [0, 100, 200] },
    ],
    takes: [],
  },
  {
    slug: 'can-race',
    title: 'Can Race',
    summary: 'Full soup, empty can, hoop, and disk race down a ramp. Which shape wins?',
    topic: 'Rotation',
    unit: 5,
    settings: [
      { key: 'object', label: 'Object', values: ['Full can', 'Empty can', 'Hoop', 'Disk'] },
    ],
    takes: [],
  },
  {
    slug: 'swing',
    title: 'Playground Swing',
    summary: 'Does the period depend on the rider? Measure it.',
    topic: 'Oscillations',
    unit: 7,
    settings: [{ key: 'amplitude', label: 'Release angle', unit: '°', values: [10, 20, 30] }],
    takes: [],
  },
  {
    slug: 'syrup-sink',
    title: 'Sinking Through Syrup',
    summary: 'A marble sinks through oil and corn syrup. Find each terminal speed.',
    topic: 'Fluids',
    unit: 8,
    settings: [{ key: 'fluid', label: 'Fluid', values: ['Vegetable oil', 'Corn syrup'] }],
    takes: [],
  },
]

export function findLab(slug: string): Lab | undefined {
  return LIBRARY.find((lab) => lab.slug === slug)
}

export function findTake(takeId: string) {
  for (const lab of LIBRARY) {
    const take = lab.takes.find((t) => t.id === takeId)
    if (take) return { lab, take }
  }
  return undefined
}
