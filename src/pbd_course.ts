import { Vec3 } from './math4'

export class Particle {

  static make = (mass: number, position: Vec3, velocity: Vec3) => {
    return new Particle(mass, position, velocity)
  }

  constructor(
    readonly mass: number,
    readonly position: Vec3,
    readonly velocity: Vec3) {}
}
