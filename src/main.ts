import { ticks } from './shared'
import { Canvas, loop } from './debug'
import { Rectangle, Vec2 } from './vec2'
import { Vec3 } from './math4'
import { Grid, Body } from './grid'
import { GridBuilder } from './builder'
import { DragStateType, DragPiece } from './drag_piece'
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

  let _drag_body: Body | undefined
  let _drag_o: Vec2 | undefined
  let _drag_shake: Shake2 | undefined
  let _drag_move: Vec2 | undefined
  let _drag_move_grid: Grid | undefined

  let _drag = new DragPiece(element, {
    on_pass() {
      if (_drag_move_grid) {
        _drag_move = Vec2.zero
        grid = grid.with_grid(_drag_move_grid)
      }
    },
    on_test_move_(dir: Vec2) {
      _drag_move_grid = grid.grid.move_(dir, _drag_body!)
      return !!_drag_move_grid
    },
    on_test_drag(v: Vec2) {
      _drag_body = grid.grid.on(v)
      return (!!_drag_body)
    },
    on_begin(type: DragStateType, o: Vec2) {
      _drag_o = o
    },
    on_move(x: number, y: number) {
      _drag_move = Vec2.make(x, y)
    },
    on_shake(s: Shake2) {
      _drag_shake = s
    }, 
    on_end() {
      _drag_body = undefined
      _drag_o = undefined
      _drag_shake = undefined
      _drag_move = undefined
    }
  })

  loop((dt: number) => {

    _drag._update(dt)

    g.clear()
    g.fr('hsl(0, 8%, 15%)', 0, 0, 1080, 1920)


    grid.bodies.forEach(([info, body_on_world]) => {
      if (info.body === _drag_body) { return }
      let d_off = 0
      body_on_world.forEach(vs =>
      g.fr(color_by_char[info.char], vs.x * r - d_off / 2, vs.y * r - d_off / 2, d_off + r - 10 , d_off + r - 10))
    })


    if (_drag_body) {
      let [info, body_on_world] = grid.bodies.find(_ => _[0].body === _drag_body)!

      let _x = 0
      let _y = 0

      let __x = _drag_shake?.x || 0,
        __y = _drag_shake?.y || 0

      __x += _drag_move?.x || 0
      __y += _drag_move?.y || 0

      let d_off = 4
      body_on_world.forEach(vs =>
        g.fr(color_by_char[info.char], 
          __x + _x * 100 + vs.x * r - d_off / 2, 
          __y + _y * 100 + vs.y * r - d_off / 2, d_off + r - 10 , d_off + r - 10))
    }
  })

}
app(document.getElementById('app')!)
