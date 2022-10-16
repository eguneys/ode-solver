import { Canvas, loop } from './debug'
import { Vec3 } from './math4'
import { Vec2, Rectangle } from './vec2'
import { XPBD, Particle, Constraint, 
  DistanceCollideConstraint,
  DistanceConstraintPlus,
  DistanceConstraint,
  FloorConstraint } from './pbd_course'
import { make_drag } from './drag'
import { Ref, onScrollHandlers } from './ref'


let v_screen = Vec2.make(1080, 1920)

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

  get constraints() {
    return [
      ...this._drag_c,
      ...this._distance_c
    ]
  }

  get particles() {
    return this._particles.map(_ => _.p)
  }

  get _r_sub() {
    return this.r / ns
  }

  _distance_c: Array<Constraint>
  _drag_c: Array<Constraint>
  _particles: Array<ParticleInfo>

  _drag_particle: ParticleInfo | undefined

  constructor(readonly o: Vec2, readonly r: number) {

    this._drag_c = []

    this._particles = [...Array(ns).keys()]
    .flatMap(col => [...Array(ns).keys()].map(row => {
      let mass = 100
      let v_sub = Vec2.make(col, row)
      let r_orig = v_sub.sub(v_ns.half).mul(Vec2.make(this._r_sub, this._r_sub))
      let rect = Rectangle.make(r_orig.x, r_orig.y, this._r_sub, this._r_sub)
      let p_pos = o.add(rect.center)

      let p = Particle.make(mass, v3(p_pos), Vec3.zero)

      return {
        p,
        v_sub
      }
    }))


    this._distance_c = this._particles.flatMap(p1 =>
      this._particles.flatMap(p2 => {
        if (p1 === p2) { return [] }
        return new DistanceConstraintPlus(p1.p, p2.p, p2.p.position.sub(p1.p.position), 1, 0)
      })
    )
  }

  find_and_save_drag(o: Vec2) {
    let _ = this._particles
    .find(_ => {
      let { x, y } = _.p.position
      return rect_orig(Rectangle.make(x - this._r_sub / 2, y - this._r_sub/2, this._r_sub, this._r_sub), o)
    })
    this._drag_particle = _
    return _
  }

  drag_constraint(v: Vec3) {
    if (!this._drag_particle) {
      this._drag_c = []
      return
    }
    let p1 = this._drag_particle
    let o = Particle.make(120, v, Vec3.zero)
    this._drag_c = this._particles.map(p2 =>
        new DistanceConstraintPlus(o, p2.p, p2.p.position.sub(p1.p.position), 0.5, 1))
  }


  collide_constraints(b: Body) {
    let r12 = this._r_sub / 2 + b._r_sub / 2
    return this._particles
    .flatMap(p1 =>
             b._particles
             .map(p2 => 
                  new DistanceCollideConstraint(p1.p,
                                               p2.p,
                                               r12, 1, 0)))

  }
}


class Bodies {

  static from_fen = (fen: string) => {

    let b = new Body(Vec2.make(100, 100), 200)
    let b2 = new Body(Vec2.make(300, 300), 200)
    return new Bodies([
      b, b2
    ])
  }

  get particles() {
    return this.bodies.flatMap(_ => _.particles)
  }

  get constraints() {
    return [
      ...this.bodies.flatMap(_ => _.constraints),
      ...this._collide_constraints
    ]
  }
  
  get _collide_constraints() {
    let res: Array<Constraint> = []
    for (let i = 0; i < this.bodies.length; i++) {
      for (let j = i + 1; j < this.bodies.length; j++) {

        let b1 = this.bodies[i],
          b2 = this.bodies[j]


        res.push(...b1.collide_constraints(b2))
      }
    }

    return res
  }

  get xpbd() {
    return new XPBD(2, this.particles, this.constraints)
  }

  find_and_save_drag(o: Vec2) {
    this.bodies.forEach(_ => _._drag_particle = undefined)
    return this.bodies.find(_ => _.find_and_save_drag(o))
  }

  drag_constraint(v: Vec3) {
    this.bodies.forEach(_ => _.drag_constraint(v))
  }

  update(dt: number) {
    this.xpbd.update(dt)
  }

  constructor(readonly bodies: Array<Body>) {
  }
}



const app = (element: HTMLElement) => {

  let g = Canvas.make(1080, 1920, element)

  let b = Bodies.from_fen('')

  let _drag_particle: Vec3 | undefined = undefined
  let ref = Ref.make(element)

  make_drag({
    on_drag(e) {
      if (e.m) {
        let _o = ref.get_normal_at_abs_pos(e.e).mul(v_screen)
        let o = ref.get_normal_at_abs_pos(e.m).mul(v_screen)
        if (_drag_particle) {
          _drag_particle = Vec3.make(o.x, o.y, 0)
        } else {
          let i = b.find_and_save_drag(_o)
          if (i) {
            _drag_particle = Vec3.make(o.x, o.y, 0)
          } 
        }
      }
    },
    on_up() {
      _drag_particle = undefined
      //b.d_c_clear()
    }
  }, element)

  onScrollHandlers(() => {
    ref.$clear_bounds()
  })

 





  loop((dt: number) => {

    if (_drag_particle) {
      b.drag_constraint(_drag_particle)
    }

    b.update(dt)

    g.clear()
    g.fr('hsl(0, 20%, 30%)', 0, 0, 1080, 1920)


    b.particles.forEach(p => {
      let { x, y } = p.position

      let color = 'hsl(0, 50%, 50%)'

      g.fr(color, x, y, 10, 10)
    })


  })
}


const test = (element: HTMLElement) => {

  let g = Canvas.make(1080, 1920, element)

  let p = Particle.make(20, Vec3.make(200, 200, 0), Vec3.zero)
  let p2 = Particle.make(20, Vec3.make(500, 0, 0), Vec3.zero)

  let ps = [p, p2]
  let cs = [
    new DistanceConstraintPlus(p, p2, Vec3.unit.scale(100), 0.5, 1)
  ]


  let xpbd = new XPBD(4, ps, cs)


  loop((dt: number) => {

    p.force = Vec3.unit

    xpbd.update(dt)

    g.clear()
    g.fr('hsl(60, 20%, 30%)', 0, 0, 1080, 1920)

    ps.forEach(p => {
      let { x, y } = p.position

      let color = 'hsl(0, 50%, 50%)'

      g.fr(color, x, y, 10, 10)
    })
  })

}



app(document.getElementById('app')!)
//test(document.getElementById('app')!)
