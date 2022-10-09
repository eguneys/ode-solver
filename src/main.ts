import './style.css'

//import { XPBD, Body, Pose } from './pbd'
import { Vec3, Quat } from './math4'
import { Vec2, Circle } from './vec2'
import { XPBD, Particle, Constraint, DistanceConstraint } from './pbd_course'

const app = (element: HTMLElement) => {

  let g = Canvas.make(1920, 1080, element)

  let particles: Array<Particle> = [
    Particle.make(100, Vec3.make(500, 0, 0), Vec3.unit),
    Particle.make(100, Vec3.make(100, 0, 0), Vec3.unit),
    Particle.make(100, Vec3.make(200, 10, 10), Vec3.unit),
  ]
  let constraints: Array<Constraint> = [
    new DistanceConstraint(particles[0], 
                           particles[2],
                           200,
                           1,
                           1)
  ]

  let xpbd = new XPBD(15, particles, constraints)

  loop((dt: number) => {

    particles.forEach(_ => {
      _.force = Vec3.unit
    })
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
