import { Vec3 } from './math4'
import { tri_orig } from './coll'
import { Triangle, Vec2, Line } from './vec2'
import { log_r } from './debug'


const v2 = (v3: Vec3) => {
  return Vec2.make(v3.x, v3.y)
}


function closest_point_on_segment(p: Vec3, a: Vec3, b: Vec3) {
  let ab = b.sub(a)
  let t = ab.dot(ab)
  if (t === 0) {
    return a.clone
  }
  t = Math.max(0, Math.min(1, (p.dot(ab) - a.dot(ab)) / t))
  return a.add(ab).scale(t)
}



export class Particle {

  static make = (mass: number, position: Vec3, velocity: Vec3) => {
    return new Particle(mass, position, velocity)
  }

  get a() {
    return this.force.scale(this.w)
  }

  get w() {
    return 1/this.mass
  }

  force: Vec3
  position0: Vec3

  constructor(
    readonly mass: number,
    readonly position: Vec3,
    readonly velocity: Vec3) {
      this.force = Vec3.zero
      this.position0 = position
    }
}



export abstract class Constraint {
  abstract C: number
  abstract Gradient(p: Particle, i: number): Vec3

  dt!: number

  get lambda() {

    let ll = this.ps
      .map((_i: Particle, i: number) => _i.w * this.Gradient(_i, i).length_squared)
      .reduce((a: number, b: number) => a + b) 

    if (ll === 0) {
      return 0
    }

    return - this.C / (ll + this.alpha / (this.dt * this.dt))
  }

  delta_x(i: number) {
    let p = this.ps[i]
    return this.Gradient(p, i).scale(this.lambda * p.w)
  }

  s_delta_x(i: number) {
    return this.delta_x(i).scale(this.k)
  }

  solve(dt: number) {
    this.dt = dt

    this.ps.forEach((_: Particle, i: number) => {
      _.position.add_in(this.s_delta_x(i))
    })
  }

  constructor(readonly ps: Array<Particle>, readonly k: number, readonly alpha: number) {}
}


export class XPBD {

  constructor(
    readonly n: number,
    readonly particles: Array<Particle>,
    readonly constraints: Array<Constraint>) {}

  update(dt: number) {
    let { n, particles, constraints } = this
    let dts = dt / n

    for (let i = 0; i < n; i++) {
      particles.forEach(_i => {
        _i.velocity.add_in(_i.a.scale(dts))
        _i.position0 = _i.position
        _i.position.add_in(_i.velocity.scale(dts))
      })
      constraints.forEach(C => {
        C.solve(dts)
      })
      particles.forEach(_i => {
        _i.velocity.copy_in(_i.position.sub(_i.position0).scale(1/dts))
      })
    }
  }
}


export class Border extends Particle {

  static _make = (
    mass: number,
    position: Vec3,
    velocity: Vec3,
    r: number,
    v_dir: Vec2) => {
      let _ = new Border(mass, position, velocity)
      return _._init(r, v_dir)
    }

  r!: number
  v_dir!: Vec2

  _init(r: number, v_dir: Vec2) {
    this.r = r
    this.v_dir = v_dir

    return this
  }

}


