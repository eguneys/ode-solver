import { ticks } from './shared'
import { Canvas, loop } from './debug'
import { Vec2 } from './vec2'
import { Vec3 } from './math4'
import { make_drag } from './drag'
import { Ref, onScrollHandlers } from './ref'

import p2 from 'p2'


let gravity = -10

let v_screen = Vec2.make(1080, 1920)
let v_world = v_screen.scale(1/100)

const app = (element: HTMLElement) => {
  let g = Canvas.make(1080, 1920, element)

  let world = new p2.World({
    gravity: [0, 0]
  })

  let body = new p2.Body({
    mass: 1, 
    position: [10, 10],
    fixedRotation: true
  })

  let box = new p2.Box({ width: 100, height: 100 })
  body.addShape(box)


  let b_mouse = new p2.Body()

  world.addBody(body)



  let ref = Ref.make(element)

  let _drag_particle: Vec3 | undefined

  let c_mouse: p2.RevoluteConstraint | undefined

  make_drag({
    on_drag(e) {
      if (e.m) {
        let _o = ref.get_normal_at_abs_pos(e.e).mul(v_world)
        let o = ref.get_normal_at_abs_pos(e.m).mul(v_world)

        if (_drag_particle) {
          _drag_particle = Vec3.make(o.x, o.y, 0)
        } else {

          if (world.hitTest(_o.vs, [body], 1).length === 1) {

            let localPoint = p2.vec2.create()
            body.toLocalFrame(localPoint, _o.vs)
            c_mouse = new p2.RevoluteConstraint(b_mouse, body, {
              localPivotA: _o.vs,
              localPivotB: localPoint,
              maxForce: 1000 * body.mass
            })
            world.addBody(b_mouse)
            world.addConstraint(c_mouse!)


            _drag_particle = Vec3.make(_o.x, _o.y, 0)
          }
        }
      }
    },
    on_up() {
      world.removeConstraint(c_mouse!)
      world.removeBody(b_mouse)
      _drag_particle = undefined
    }
  }, element)

  onScrollHandlers(() => {
    ref.$clear_bounds()
  })


  loop((dt: number) => {

    if (_drag_particle && c_mouse) {
      let [x, y] = _drag_particle.vs
      p2.vec2.copy((c_mouse as any).pivotA, [x, y])
    }

    world.step(1/60, dt/1000, 3)

    g.clear()
    g.fr('hsl(0, 8%, 15%)', 0, 0, 1080, 1920)


    let [x, y] = body.interpolatedPosition
    let w = box.width
    let h = box.height
    let v = Vec2.make(x, y).div(v_world).mul(v_screen)

    g.fr('hsl(0, 60%, 40%)', v.x - w/2, v.y - h/2, w, h)
  })
}



app(document.getElementById('app')!)
