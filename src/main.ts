import { Canvas, loop } from './debug'
import { Vec2, Rectangle } from './vec2'
import { Vec3, Quat } from './math4'
import { XPBD, Particle, Constraint, 
  DistanceConstraint,
  FloorConstraint } from './pbd_course'
import { make_drag } from './drag'
import { Ref, onScrollHandlers } from './ref'

let v_screen = Vec2.make(1080, 1920)

const rect_orig = (rect: Rectangle, o: Vec2) => {
    return rect.x1 <= o.x && o.x <= rect.x2 && rect.y1 <= o.y && o.y <= rect.y2
}

class Body {

  static make = () => {
    let a = Particle.make(20, Vec3.make(250, 300, 0), Vec3.zero)
    let b = Particle.make(20, Vec3.make(450, 300, 0), Vec3.zero)
    let c = Particle.make(20, Vec3.make(650, 300, 0), Vec3.zero)
    let d = Particle.make(20, Vec3.make(850, 300, 0), Vec3.zero)

    let g = [[a], [b], [c], [d]]
    let p = [a, b, c, d]

    return new Body(g, p)

  }

  constructor(readonly groups: Array<Array<Particle>>,
              readonly particles: Array<Particle>) {}

}


let r = 100
const app = (element: HTMLElement) => {
  let g = Canvas.make(1080, 1920, element)

  let b = Body.make()

  let ref = Ref.make(element)
  make_drag({
    on_drag(e) {
      if (e.m) {
        let o = ref.get_normal_at_abs_pos(e.m).mul(v_screen)
        let p = b.particles.find(_ => {
          let { x, y } = _.position
          return rect_orig(Rectangle.make(x - r/2, y - r/2, r, r), o)
        })
      }
    }
  }, element)

  onScrollHandlers(() => {
    ref.$clear_bounds()
  })

  loop((dt: number) => {

    g.clear()
    g.fr('hsl(0, 20%, 50%)', 0, 0, 1080, 1920)

    b.particles.forEach(p => {
      let { x, y } = p.position
      g.fr('hsl(0, 80%, 50%)', x - r/2, y - r/2, r, r)
    })
  })
}

app(document.getElementById('app')!)
