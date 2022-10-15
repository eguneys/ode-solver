export class Canvas {

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


export const loop = (_fn: (dt: number) => void) => {

  let _cancel: number

  let _last_now = 0

  function step(_now: number) {

    let dt = _now - (_last_now || _now)
    _last_now = _now

    dt = Math.max(Math.min(dt, 16), 4)

    _fn(dt)

    _cancel = requestAnimationFrame(step)
  }

  _cancel = requestAnimationFrame(step)

  return () => {
    cancelAnimationFrame(_cancel)
  }
}
