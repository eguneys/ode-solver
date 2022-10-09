import { Vec3 } from './math4'

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
    return - this.C / (
      this.ps
      .map((_i: Particle, i: number) => _i.w * this.Gradient(_i, i).length_squared)
      .reduce((a: number, b: number) => a + b) + this.alpha / (this.dt * this.dt))
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
