import { Vec3, Mat4, Quat } from './math4'

const pairs = <A>(ls: Array<A>, fn: (_: A, __: A) => void) => {
  for (let i = 0; i < ls.length; i++) {
    for (let j = i + 1; j < ls.length; j++) {
      fn(ls[i], ls[j])
    }
  }
}

export type BroadCollisionPair = [Entity, Entity]

export class Collider {

  update(position: Vec3, rotation: Quat) {
  }

  get_contacts(c2: Collider) {
    return new Contact(Vec3.zero, Vec3.zero, Vec3.zero)
  }
}

export class Contact {

  constructor(readonly collision_point1: Vec3,
              readonly collision_point2: Vec3,
              readonly normal: Vec3) {}


  collision_constraint(e1: Entity, e2: Entity) {


    let r1_wc = this.collision_point1.sub(e1.position)
    let r2_wc = this.collision_point2.sub(e2.position)

    let q1_inv = e1.rotation.inverse
    let r1_lc = q1_inv.mVec3(r1_wc)

    let q2_inv = e2.rotation.inverse
    let r2_lc = q2_inv.mVec3(r2_wc)

    return new Constraint(e1, e2, r1_lc, r2_lc, this.normal)
  }
}

export type ConstraintPreProcessedData = {
  e1: Entity
  e2: Entity
  r1_wc: Vec3
  r2_wc: Vec3
  e1_inverse_inertia_tensor: Mat4
  e2_inverse_inertia_tensor: Mat4
}

export class Constraint {

  get preprocessed_data() {
    return {
      e1: this.e1,
      e2: this.e2,
      r1_wc: this.e1.rotation.mVec3(this.r1_lc),
      r2_wc: this.e2.rotation.mVec3(this.r2_lc),
      e1_inverse_inertia_tensor: this.e1.dynamic_inverse_inertia_tensor,
      e2_inverse_inertia_tensor: this.e2.dynamic_inverse_inertia_tensor
    }
  }

  solve(h: number) {
  }

  lambda_n: number
  constructor(readonly e1: Entity, 
              readonly e2: Entity,
              readonly r1_lc: Vec3,
              readonly r2_lc: Vec3,
              readonly normal: Vec3) {
    this.lambda_n = 0
  }
}

export class Force {

  static make = (force: Vec3, position: Vec3) => new Force(force, position)

  constructor(readonly force: Vec3, readonly position: Vec3) {}
}

export class Entity {

  active: boolean
  fixed: boolean

  previous_position: Vec3
  previous_rotation: Quat

  previous_angular_velocity: Vec3
  previous_linear_velocity: Vec3

  mass: number
  position: Vec3
  rotation: Quat
  angular_velocity: Vec3
  linear_velocity: Vec3

  inertia_tensor: Mat4
  inverse_inertia_tensor: Mat4

  colliders: Array<Collider>

  bounding_sphere_radius: number

  dynamic_friction_coefficient: number
  restitution_coefficient: number

  forces: Array<Force>

  get inverse_mass() {
    return 1/this.mass
  }


  get dynamic_inverse_inertia_tensor() {
    let m_rot = this.rotation.mat4
    let m_transposed_rotation = m_rot.transpose
    let m_aux = m_rot.mul(this.inverse_inertia_tensor)
    return m_aux.mul(m_transposed_rotation)
  }


  get external_force() {
    let center_of_mass = Vec3.zero
    return this.forces.reduce((acc, _) => acc.add_in(_.force), Vec3.zero)
  }

  get external_torque() {
    let center_of_mass = Vec3.zero
    return this.forces.reduce((acc, _) => {
      let distance = _.position.sub(center_of_mass)
      return acc.add_in(distance.cross(_.force))
    }, Vec3.zero)
  }


  static make_fixed = (position: Vec3, r: number) => {

    return new Entity(
      position,
      Quat.identity,
      10,
      Vec3.zero,
      0.3,
      0.3,
      r,
      [],
      true,
      true)
  }

  static make_box = (position: Vec3, mass: number, r: number) => {

    return new Entity(
      position,
      Quat.identity,
      mass,
      Vec3.zero,
      0.3,
      0.3,
      r,
      [new Collider()],
      true,
      false)
  }

  constructor(position: Vec3,
              rotation: Quat,
              mass: number,
              linear_velocity: Vec3,
              dynamic_friction_coefficient: number,
              restitution_coefficient: number,
              bounding_sphere_radius: number,
              colliders: Array<Collider>,
              active: boolean,
              fixed: boolean,
             ) {

    this.forces = []

    this.restitution_coefficient = restitution_coefficient
    this.dynamic_friction_coefficient = dynamic_friction_coefficient

    this.bounding_sphere_radius = bounding_sphere_radius
    this.colliders = colliders

    this.active = active
    this.fixed = fixed

    this.previous_position = position
    this.position = position

    this.previous_rotation = rotation
    this.rotation = rotation

    this.mass = mass

    this.angular_velocity = Vec3.zero
    this.linear_velocity = linear_velocity
    this.previous_angular_velocity = this.angular_velocity
    this.previous_linear_velocity = this.linear_velocity

    this.inertia_tensor = Mat4.identity
    this.inverse_inertia_tensor = Mat4.identity
  }


}

export class XPBD {

  simulate(dt: number) {
    let h = dt / this.num_substeps

    let broad_collision_pairs: Array<BroadCollisionPair> = []

    pairs(this.entities, (e1, e2) => {
      let e_distance = e1.position.distance(e2.position)

      let max_distance_for_collision = e1.bounding_sphere_radius + e2.bounding_sphere_radius + 1
      if (e_distance < max_distance_for_collision) {
        broad_collision_pairs.push([e1, e2])
      }

    })

    let external_constraints: Array<Constraint> = []


    for (let i = 0; i < this.num_substeps; i++) {
      this.entities.forEach(e => {

        e.previous_position = e.position
        e.previous_rotation = e.rotation

        if (e.fixed) { return }
        if (!e.active) { return }


        let { external_force, external_torque } = e

        e.linear_velocity.add_in(external_force.scale(h * e.inverse_mass))
        e.position.add_in(e.linear_velocity.scale(h))

        let { inverse_inertia_tensor, inertia_tensor } = e

        e.angular_velocity.add_in(
          inverse_inertia_tensor.mVec3(
            external_torque.sub(e.angular_velocity.cross(
              inertia_tensor.mVec3(e.angular_velocity)))
          ))

        let aux = Quat.make([e.angular_velocity.x, e.angular_velocity.y, e.angular_velocity.z, 0.0])
        let q = aux.mul(e.rotation)

        e.rotation.x += h * 0.5 * q.x
        e.rotation.y += h * 0.5 * q.y
        e.rotation.z += h * 0.5 * q.z
        e.rotation.w += h * 0.5 * q.w

        e.rotation = e.rotation.normalize

      })


      let constraints = external_constraints

      broad_collision_pairs.forEach(b_cp => {

        let [e1, e2] = b_cp

        // active fixed check
        

        e1.colliders.forEach(cs => cs.update(e1.position, e1.rotation))
        e2.colliders.forEach(cs => cs.update(e2.position, e2.rotation))


        let contacts = e1.colliders.flatMap(cs => 
                          e2.colliders.map(cs2 => 
                                cs.get_contacts(cs2)))

        
        if (contacts) {
          contacts.forEach(c => {
            constraints.push(c.collision_constraint(e1, e2))
          })
        }
      })


      for (let j = 0; j < this.num_pos_iters; j++) {
        constraints.forEach(c => c.solve(h))
      }


      this.entities.forEach(e => {

        if (e.fixed) { return }
        if (!e.active) { return }

        e.previous_linear_velocity = e.linear_velocity
        e.previous_angular_velocity = e.angular_velocity


        e.linear_velocity = e.position.sub(e.previous_position).scale(1/h)

        let delta_q = e.rotation.mul(e.previous_rotation.inverse)

        if (delta_q.w >= 0) {
          e.angular_velocity = Vec3.make(delta_q.x, delta_q.y, delta_q.z).scale(2/h)
        } else {
          e.angular_velocity = Vec3.make(delta_q.x, delta_q.y, delta_q.z).scale(-2/h)
        }
      })

      constraints.forEach(cs => {

        let { e1, e2 } = cs

        let n = cs.normal
        let lambda_n = cs.lambda_n


        let pcpd = cs.preprocessed_data


        let v1 = e1.linear_velocity,
          w1 = e1.angular_velocity,
          v2 = e2.linear_velocity,
          w2 = e2.angular_velocity


        let v = v1.add(w1.cross(pcpd.r1_wc)).sub(
          v2.add(w2.cross(pcpd.r2_wc)))

        let vn = n.dot(v)

        let vt = v.sub(n.scale(vn))

        let delta_v = Vec3.zero


        let dynamic_friction_coefficient = (e1.dynamic_friction_coefficient + e2.dynamic_friction_coefficient) / 2

        let fn = lambda_n / h

        let fact = Math.min(dynamic_friction_coefficient * Math.abs(fn), vt.length)

        delta_v.add_in(vt.normalize.scale(-fact))



        let old_v1 = e1.previous_linear_velocity
        let old_w1 = e1.previous_angular_velocity
        let old_v2 = e2.previous_linear_velocity
        let old_w2 = e2.previous_angular_velocity
        let v_til = old_v1.add(old_w1.cross(pcpd.r1_wc))
                  .sub(old_v2.add(old_w2.cross(pcpd.r2_wc)))

        let vn_til = n.dot(v_til)

        let e = e1.restitution_coefficient * e2.restitution_coefficient

        fact = -vn + Math.min(-e * vn_til, 0)

        delta_v.add_in(n.scale(fact))


        let _w1 = e1.inverse_mass + pcpd.r1_wc.cross(n).dot(
          pcpd.e1_inverse_inertia_tensor.mVec3(pcpd.r1_wc.cross(n)))

        let _w2 = e2.inverse_mass + pcpd.r2_wc.cross(n).dot(
          pcpd.e2_inverse_inertia_tensor.mVec3(pcpd.r2_wc.cross(n)))

        let p = delta_v.scale(1/(_w1+_w2))


        if (!e1.fixed) {
          e1.linear_velocity.add_in(p.scale(e1.inverse_mass))
          e1.angular_velocity.add_in(pcpd.e1_inverse_inertia_tensor.mVec3(pcpd.r1_wc.cross(p)))
        }

        if (!e2.fixed) {
          e2.linear_velocity.add_in(p.scale(e2.inverse_mass))
          e2.angular_velocity.add_in(pcpd.e2_inverse_inertia_tensor.mVec3(pcpd.r2_wc.cross(p)))
        }

      })


    }


    
  }



  constructor(readonly num_substeps: number, 
              readonly entities: Array<Entity>, 
              readonly num_pos_iters = 1) {}
}
