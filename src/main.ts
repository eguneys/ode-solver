import { ticks } from './shared'
import { Canvas, loop } from './debug'
import { Rectangle, Vec2 } from './vec2'
import { Vec3 } from './math4'
import { make_drag } from './drag'
import { Ref, onScrollHandlers } from './ref'
import { Grid } from './grid'
import { GridBuilder } from './builder'

let fen2 = `
# ########
  #nno.o.#
  #logglo#
  #logglo#
  ###...##
  ########
`

let fen = `
o
`


const color_by_char: any = {
  '#': 'hsl(0, 20%, 80%)',
  'o': 'hsl(10, 60%, 60%)',
  'n': 'hsl(40, 60%, 60%)',
  'l': 'hsl(80, 60%, 60%)',
  'g': 'hsl(90, 60%, 60%)'
}

const app = (element: HTMLElement) => {
  let g = Canvas.make(1080, 1920, element)

  let grid = GridBuilder.from_fen(fen2.trim())

  let r = 100
  loop((dt: number) => {

    g.clear()
    g.fr('hsl(0, 8%, 15%)', 0, 0, 1080, 1920)


    grid.bodies.forEach(([info, body_on_world]) => {
      body_on_world.forEach(vs =>
      g.fr(color_by_char[info.char], vs.x * r, vs.y * r, r - 10, r - 10))
    })
  })

}
app(document.getElementById('app')!)
