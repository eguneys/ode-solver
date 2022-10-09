import './style.css'

//import { XPBD, Body, Pose } from './pbd'
import { Vec3, Quat } from './math4'
import { Vec2, Circle } from './vec2'

const app = (element: HTMLElement) => {

  let g = Canvas.make(1920, 1080, element)

  let r = Circle.make(200, 200, 30)

  loop((dt: number) => {

    update(r, dt)

    g.clear()
    g.fr('hsl(0, 20%, 50%)', 0, 0, 1920, 1080)
    g.fr('hsl(0, 70%, 40%)', 0, 1000, 1920, 20)

    g.fr('hsl(0, 80%, 50%)', r.x, r.y, r.r, r.r)

  })
}

function update(r: Circle, dt: number) {

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
