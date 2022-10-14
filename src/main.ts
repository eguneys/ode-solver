import './style.css'

import { ticks } from './shared'
import { Input } from './input'
import { Vec3, Quat } from './math4'
import { Vec2, Circle } from './vec2'
import { XPBD, Particle, Constraint, 
  DistanceConstraint,
  FloorConstraint } from './pbd_course'

const app = (element: HTMLElement) => {


  let i = new Input().init()

  let g = Canvas.make(1920, 1080, element)

  let player = Particle.make(30, Vec3.make(500, 0, 0), Vec3.zero)

  let particles: Array<Particle> = [
    Particle.make(20, Vec3.make(500, 0, 0), Vec3.unit),
    Particle.make(10, Vec3.make(100, 0, 0), Vec3.unit),
    Particle.make(10, Vec3.make(200, 10, 10), Vec3.unit),
    Particle.make(10, Vec3.make(200, 10, 10), Vec3.unit),
    player,
  ]
  let constraints: Array<Constraint> = [
    new DistanceConstraint(player,
                           particles[2], 
                           50,
                           1,
                           0.5),
    new DistanceConstraint(particles[2],
                           particles[3], 
                           50,
                           1,
                           1),
    new FloorConstraint(particles[3],
                        1000,
                        100,
                        0.3, 1),

    new FloorConstraint(particles[2],
                        1000,
                        100,
                        0.2, 1),
    new FloorConstraint(player,
                        1000,
                        100,
                        0.4, 1)
  ]

  let xpbd = new XPBD(6, particles, constraints)

  let li = 0
  let ri = 0
  let ci = 0
  loop((dt: number) => {
    i.update(dt)

    let right = i.been_ons.find(_ => _.includes('ArrowRight'))
    let left = i.been_ons.find(_ => _.includes('ArrowLeft'))
    let s = i.been_ons.find(_ => _.includes('s'))

    particles.forEach(_ => {
      _.force = Vec3.make(0, 10, 0)
    })

    if (s) {
      ci = Math.min(100, Math.sin(s[1] / ticks.half * Math.PI * 2) * 60)
    }

    if (right) {
      ri = Math.min(30, 10 + ci + (right[1] / ticks.half) * 10)
    }
    if (left) {
      li = Math.min(30, 10 + ci + (left[1] / ticks.half) * 10)
    }

    if (li > 0) {
      li--;
      player.force.add_in(Vec3.left.scale(li))
    }
    if (ri > 0) {
      ri--;
      player.force.add_in(Vec3.right.scale(ri))
    }

    if (ci > 0) {
      ci--;
      player.force.add_in(Vec3.up.scale(ci))
    }

    xpbd.update(dt)


    g.clear()
    g.fr('hsl(0, 20%, 50%)', 0, 0, 1920, 1080)
    g.fr('hsl(0, 70%, 40%)', 0, 1000, 1920, 20)

    particles.forEach(p => {
      let { x, y } = p.position
      g.fr('hsl(0, 80%, 50%)', x, y, 30, 30)
    })

  })
}




class Canvas {

  static make = (width: number, height: number, element: HTMLElement) => {
    let canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    element.appendChild(canvas)
    return new Canvas(width, height, canvas)
  }

  ctx: CanvasRenderingContext2D

  constructor(
    readonly width: number,
    readonly height: number,
    readonly canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!
  }


  clear() {
    this.ctx.clearRect(0, 0, this.width, this.height)
  }


  fr(color: string, x: number, y: number, w: number, h: number) {
    this.ctx.fillStyle = color
    this.ctx.fillRect(x, y, w, h)
  }
}

const loop = (on_update: (_: number) => void) => {
  let _last_now: number = 0
  function step(_now: number) {

    let _dt = _now - _last_now
    _dt = Math.max(4, Math.min(16, _dt))

    on_update(_dt)

    _last_now = _now

    requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

app(document.getElementById('app')!)
