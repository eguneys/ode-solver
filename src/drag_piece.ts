import { Vec2 } from './vec2'
import { Ref, onScrollHandlers } from './ref'
import { make_drag } from './drag'
import { GridBuilder, Body } from './builder'
let v_screen = Vec2.make(1080, 1920)
let v_world = v_screen.scale(1)

export class DragPiece {


  constructor(grid: GridBuilder, element: HTMLElement) {

    let ref = Ref.make(element)
    onScrollHandlers(() => {
      ref.$clear_bounds()
    })


    make_drag({
      on_drag(e, e0) {
        if (e.m) {
          let _o = ref.get_normal_at_abs_pos(e.e).mul(v_world)
          let o = ref.get_normal_at_abs_pos(e.m).mul(v_world)

          if (!e0?.m) {
            let v = _o.scale(1/100).floor
            grid.grid.on(v)
          }


        }
      },
      on_up() {
      }
    }, element)
  }


  _update(dt: number) {
  }


}
