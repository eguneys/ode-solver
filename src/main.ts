import { ticks } from './shared'
import { Canvas, loop } from './debug'
import { Rectangle, Vec2 } from './vec2'
import { Vec3 } from './math4'
import { make_drag } from './drag'
import { Ref, onScrollHandlers } from './ref'

let v_screen = Vec2.make(1080, 1920)
let v_world = v_screen.scale(1)

const app = (element: HTMLElement) => {
  let g = Canvas.make(1080, 1920, element)

  loop((dt: number) => {

    g.clear()
    g.fr('hsl(0, 8%, 15%)', 0, 0, 1080, 1920)

  })
}



app(document.getElementById('app')!)
