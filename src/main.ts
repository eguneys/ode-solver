import { ticks } from './shared'
import { Canvas, loop } from './debug'
import { Rectangle, Vec2 } from './vec2'
import { Vec3 } from './math4'
import { make_drag } from './drag'
import { Ref, onScrollHandlers } from './ref'
import { Grid } from './grid'
import { GridBuilder, Body } from './builder'
import { Tween } from './anim'

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


  let ref = Ref.make(element)
  onScrollHandlers(() => {
    ref.$clear_bounds()
  })

  let _drag_body: Body | undefined
  let _drag_begin: Vec2 = Vec2.zero

  let _drag_x: number = 0,
    _drag_y: number = 0


  let _t_drag_x: number = 0,
    _t_drag_y: number = 0


  let _tween_x: Tween | undefined,
    _tween_y: Tween | undefined


  make_drag({
    on_drag(e, e0) {
      if (e.m) {
        let _o = ref.get_normal_at_abs_pos(e.e).mul(v_world)
        let o = ref.get_normal_at_abs_pos(e.m).mul(v_world)


        if (_drag_body) {
          let v = o.sub(_o).scale(1/100)

          if (Math.abs(v.x) > Math.abs(v.y)) {
            _drag_x = v.x
            _drag_y = 0
          } else {
            _drag_y = v.y
            _drag_x = 0
          }


        } else {
          if (!e0?.m) {
            let v = _o.scale(1/100).floor
            _drag_begin = v
            _drag_body = grid.grid.on(v)
          }
        }


      }
    },
    on_up() {
      _drag_body = undefined
      _drag_x = 0
      _drag_y = 0
      _t_drag_x = 0
      _t_drag_y = 0
    }
  }, element)



  loop((dt: number) => {


    if (_drag_body) {

      if (Math.abs(_drag_x) > 0.2) {
        _t_drag_x += dt
      } else if (Math.abs(_drag_y) > 0.2) {
        _t_drag_y += dt
      }
    }

    if (_t_drag_x > ticks.half) {
      if (!_tween_x) {
        _tween_x = Tween.make([_drag_x, 1], ticks.sixth)
      }
    }

    if (_tween_x) {
      _tween_x.update(dt)
      if (_tween_x.completed) {
        _tween_x = undefined
      }
    }

    g.clear()
    g.fr('hsl(0, 8%, 15%)', 0, 0, 1080, 1920)


    grid.bodies.forEach(([info, body_on_world]) => {
      if (info.body === _drag_body) { return }
      let d_off = info.body === _drag_body ? 4 : 0
      body_on_world.forEach(vs =>
      g.fr(color_by_char[info.char], vs.x * r - d_off / 2, vs.y * r - d_off / 2, d_off + r - 10 , d_off + r - 10))
    })


    if (_drag_body) {
      let [info, body_on_world] = grid.bodies.find(_ => _[0].body === _drag_body)!

      let _y = 0
      let _x = _tween_x?.value || _drag_x
      let d_off = 4
      body_on_world.forEach(vs =>
        g.fr(color_by_char[info.char], 
          _x * 100 + vs.x * r - d_off / 2, 
          _y * 100 + vs.y * r - d_off / 2, d_off + r - 10 , d_off + r - 10))
    }

  })

}
app(document.getElementById('app')!)
