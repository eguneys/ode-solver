import { Vec3 } from './math4'
import { line_line } from './coll'
import { Triangle, Vec2, Line } from './vec2'
import { log_r } from './debug'

export const v3 = (v2: Vec2) => {
  return Vec3.make(v2.x, v2.y, 0)
}

export const v2 = (v3: Vec3) => {
  return Vec2.make(v3.x, v3.y)
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
        _i.position0 = _i.position

        _i.velocity.add_in(_i.a.scale(dts))
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

  get l() {

    let { v_dir, r } = this

    let a = v2(this.position).add(v_dir.scale(r/2)),
      b = v2(this.position).add(v_dir.scale(-r/2))

    return new Line(a, b)
  }

  r!: number
  v_dir!: Vec2

  _init(r: number, v_dir: Vec2) {
    this.r = r
    this.v_dir = v_dir

    return this
  }

}

export class BorderBorderConstraint extends Constraint {


  get C() {
    return 6
  }


  Gradient(b1: Border, i: number) {
    let b2 = b1 === this.b1 ? this.b2 : this.b1

    let _ = line_line(b1.l, b2.l)
    
    if (_) {
      return v3(b1.l.normal!.normalize!)
    }

    return Vec3.zero
  }


  constructor(readonly b1: Border,
    readonly b2: Border,
    readonly l0: number,
    readonly k: number,
    readonly alpha: number) {
    super([b1, b2], k, alpha)
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
