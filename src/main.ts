import { Canvas, loop } from './debug'
import { Vec3 } from './math4'
import { Vec2, Rectangle } from './vec2'
import { Particle } from './pbd_course'
import { DistanceConstraintPlus, Constraint } from './pbd_course'

const rect_orig = (rect: Rectangle, o: Vec2) => {
    return rect.x1 <= o.x && o.x <= rect.x2 && rect.y1 <= o.y && o.y <= rect.y2
}



const v3 = (v2: Vec2) => Vec3.make(v2.x, v2.y, 0)

let ns = 3
let v_ns = Vec2.make(ns, ns)

export type ParticleInfo = {
  p: Particle,
  v_sub: Vec2
}

class Body {

  get particles() {
    return this._particles.map(_ => _.p)
  }

  get _r_sub() {
    return this.r / ns
  }

  _drag_c: Array<Constraint>
  _particles: Array<ParticleInfo>

  constructor(readonly o: Vec2, readonly r: number) {

    this._drag_c = []

    this._particles = [...Array(ns).keys()]
    .flatMap(col => [...Array(ns).keys()].map(row => {
      let mass = 100
      let v_sub = Vec2.make(col, row)
      let p_pos = o.add(
        v_sub.sub(v_ns.half).mul(v_ns.mul_inverse.scale(r)))

      let p = Particle.make(mass, v3(p_pos), Vec3.zero)

      return {
        p,
        v_sub
      }
    }))
  }

  find_drag(o: Vec2) {
    return this._particles
    .find(_ => {
      let { x, y } = _.p.position
      rect_orig(Rectangle.make(x, y, this._r_sub, this._r_sub), o)
    })
  }

  drag_constraint(v: Vec3, p1: ParticleInfo) {
    let o = Particle.make(120, v, Vec3.zero)
    this._drag_c = this._particles.map(p2 =>
        new DistanceConstraintPlus(p2.p, o, p1.p.position.sub(p2.p.position), 0.5, 1))
  }
}



const app = (element: HTMLElement) => {

  let g = Canvas.make(1080, 1920, element)

  let b = new Body(Vec2.make(100, 100), 200)





  loop((dt: number) => {

    g.clear()
    g.fr('hsl(0, 20%, 30%)', 0, 0, 1080, 1920)


    b.particles.forEach(p => {
      let { x, y } = p.position

      let color = 'hsl(0, 50%, 50%)'

      g.fr(color, x, y, 10, 10)
    })


  })

}



app(document.getElementById('app')!)
