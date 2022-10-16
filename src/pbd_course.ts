import { Vec3 } from './math4'
import { tri_orig } from './coll'
import { Triangle, Vec2, Line } from './vec2'
import { log_r } from './debug'

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

export type PLine = {
  p: Particle,
  a: Vec3,
  b: Vec3
}

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

export class FloorConstraint extends Constraint {
  get C() {
    return this._y - this.p1.position.y - this.l0
  }

  Gradient(_: Particle, i: number) {
    let y = this._y - _.position.y
    let res = y > this.l0 ? 0 : -1
    return Vec3.make(0, res, 0)
  }


  constructor(readonly p1: Particle,
              readonly _y: number,
              readonly l0: number,
             readonly k: number,
             readonly alpha: number) {
               super([p1], k, alpha)
              }

}

export class DistanceConstraintPlus extends Constraint {

  get C() {
    return this.p1.position.add(this.v).sub(this.p2.position).length
  }


  Gradient(_p: Particle, i: number) {
    if (_p === this.p2) {
      return this.p2.position.sub(this.p1.position.add(this.v)).normalize
    } else {
      return Vec3.zero
    }
  }



  constructor(readonly p1: Particle,
              readonly p2: Particle,
              readonly v: Vec3,
              readonly k: number,
              readonly alpha: number,
    readonly no_log?: boolean) {
                super([p1, p2], k, alpha)
              }
}

export class DistanceConstraint extends Constraint {

  get C() {
    return this.p2.position.sub(this.p1.position).length - this.l0
  }


  Gradient(_p: Particle, i: number) {
    let _p2 = _p === this.p1 ? this.p2 : this.p1
    return _p.position.sub(_p2.position).normalize
  }

  constructor(readonly p1: Particle, readonly p2: Particle, 
              readonly l0: number, 
              readonly k: number,
              readonly alpha: number) {
    super([p1, p2], k, alpha)
  }
}


export class DistanceCollideConstraint extends Constraint {

  get C() {
    return Math.min(0, this.p2.position.sub(this.p1.position).length - this.l0)
  }


  Gradient(_p: Particle, i: number) {
    let _p2 = _p === this.p1 ? this.p2 : this.p1
    return _p.position.sub(_p2.position).normalize
  }

  constructor(readonly p1: Particle, 
              readonly p2: Particle, 
              readonly l0: number, 
              readonly k: number,
              readonly alpha: number) {
    super([p1, p2], k, alpha)
  }
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
