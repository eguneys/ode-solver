import { Canvas, loop } from './debug'
import { make_drag } from './drag'
import { Ref, onScrollHandlers } from './ref'
import { closest_point_on_segment } from './coll'



import { v3, v2 } from './pbd_x'
import { XPBD, 
  Constraint, Particle,
  Border, BorderBorderConstraint,
  DistanceConstraintPlus } from './pbd_x'
import { Vec3 } from './math4'
import { Vec2 } from './vec2'



let v_screen = Vec2.make(1080, 1920)

const app = (element: HTMLElement) => {


  let bs: Array<Border> = [
    Border._make(
      10,
      Vec3.make(200, 200, 0),
      Vec3.zero,
      100,
      Vec2.unit.normalize!
    ),
    Border._make(
      10,
      Vec3.make(200, 200, 0),
      Vec3.zero,
      100,
      Vec2.left
    )
  ]

  let cs: Array<Constraint> = [
    new BorderBorderConstraint(
      bs[0],
      bs[1],
      0,
      1,
      0)
  ]



  let ref = Ref.make(element)

  let _drag_particle: Vec3 | undefined
  let _drag_i: Border | undefined

  make_drag({
    on_drag(e) {
      if (e.m) {
        let _o = ref.get_normal_at_abs_pos(e.e).mul(v_screen)
        let o = ref.get_normal_at_abs_pos(e.m).mul(v_screen)
        if (_drag_particle) {
          _drag_particle = Vec3.make(o.x, o.y, 0)
        } else {
          let i = bs.find(_ => {
            let p = closest_point_on_segment(v3(_o), v3(_.l.a), v3(_.l.b))
            return p.distance(v3(_o)) < 6
          })

          if (i) {
            _drag_i = i
            _drag_particle = Vec3.make(o.x, o.y, 0)
          } 
        }
      }
    },
    on_up() {
      _drag_particle = undefined
    }
  }, element)

  onScrollHandlers(() => {
    ref.$clear_bounds()
  })




  let g = Canvas.make(1080, 1920, element)

  loop((dt: number) => {

    let _cs = cs

    if (_drag_particle) {


      let d_c = new DistanceConstraintPlus(
        Particle.make(120, _drag_particle, Vec3.zero),
        _drag_i!,
        Vec3.zero, 0.5, 1)

      _cs = [...cs, d_c]
    }

    let b = new XPBD(3, bs, _cs)

    b.update(dt)

    g.clear()
    g.fr('hsl(0, 20%, 30%)', 0, 0, 1080, 1920)


    bs.forEach(b => {
      g.line('hsl(0, 50%, 50%)', 6, b.l.x1, b.l.y1, b.l.x2, b.l.y2)
    })


  })

}




app(document.getElementById('app')!)
