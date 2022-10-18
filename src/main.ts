import { ticks } from './shared'
import { Canvas, loop } from './debug'
import { Vec2 } from './vec2'


let v_screen = Vec2.make(1080, 1920)
const app = (element: HTMLElement) => {
  let g = Canvas.make(1080, 1920, element)

  loop((dt: number) => {
    g.clear()
    g.fr('hsl(0, 8%, 15%)', 0, 0, 1080, 1920)

  })
}



app(document.getElementById('app')!)
