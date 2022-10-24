import { ticks } from './shared'
import { Canvas, loop } from './debug'
import { Rectangle, Vec2 } from './vec2'
import { Vec3 } from './math4'
import { Grid } from './grid'
import { GridBuilder, Body } from './builder'
import { Tween } from './anim'
import { Shake2 } from './shake'

let fen2 = `
# ########
  #nno.o.#
  #logglo#
  #logglo#
  ###.####
`

let fen = `
##
`


const color_by_char: any = {
  '#': 'hsl(0, 20%, 80%)',
  'o': 'hsl(10, 60%, 60%)',
  'n': 'hsl(40, 60%, 60%)',
  'l': 'hsl(80, 60%, 60%)',
  'g': 'hsl(90, 60%, 60%)'
}

let v_screen = Vec2.make(1080, 1920)
let v_world = v_screen.scale(1)
let r = 100

const app = (element: HTMLElement) => {
  let g = Canvas.make(1080, 1920, element)

  let grid = GridBuilder.from_fen(fen2.trim())


  loop((dt: number) => {


    g.clear()
    g.fr('hsl(0, 8%, 15%)', 0, 0, 1080, 1920)


    grid.bodies.forEach(([info, body_on_world]) => {
      //if (info.body === _drag_body) { return }
      let d_off = 0
      body_on_world.forEach(vs =>
      g.fr(color_by_char[info.char], vs.x * r - d_off / 2, vs.y * r - d_off / 2, d_off + r - 10 , d_off + r - 10))
    })


    /*
    if (_drag_body) {
      let [info, body_on_world] = grid.bodies.find(_ => _[0].body === _drag_body)!

      let _y = 0
      let _x = _tween_x?.value || _drag_x

      let __x = _shake?.x || 0,
        __y = _shake?.y || 0

      let d_off = 4
      body_on_world.forEach(vs =>
        g.fr(color_by_char[info.char], 
          __x + _x * 100 + vs.x * r - d_off / 2, 
          __y + _y * 100 + vs.y * r - d_off / 2, d_off + r - 10 , d_off + r - 10))
    }
   */
  })

}
app(document.getElementById('app')!)
