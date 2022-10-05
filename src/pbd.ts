import { Vec3, Quat } from './math4'

export const maxRotationPerSubstep = 0.5

export class Pose {

  static get unit() { return new Pose(Vec3.zero, Quat.identity) }

  get clone() {
    return new Pose(this.p.clone,
      this.q.clone)
  }


  m_rotate(v: Vec3) {
    return this.q.mVec3(v)
  }

  m_inv_rotate(v: Vec3) {
    return this.q.conjugate.mVec3(v)
  }

  transform_pose(pose: Pose) {
    this.q = this.q.mul(pose.q)
    this.p = pose.q.mVec3(this.p)
  }

  static make = (p: Vec3, q: Quat) => new Pose(p, q)

  p: Vec3
  q: Quat

  constructor(
    p: Vec3,
    q: Quat) {
    this.p = p
    this.q = q
  }
}

export class Body {

  get_inverse_mass(normal: Vec3, pos?: Vec3) {

    let n = Vec3.zero
    if (!pos) {
      n = normal
    } else {
      n = pos.sub(this.pose.p)
      n = n.cross(normal)
    }

    n = this.pose.m_inv_rotate(n)

    let w =
      n.x * n.x * this.inv_inertia.x +
      n.y * n.y * this.inv_inertia.y +
      n.z * n.z * this.inv_inertia.z
    if (!pos) {
      w += this.inv_mass
    }
    return w
  }

  integrate(dt: number) {
    this.prev_pose = this.pose.clone
    this.pose.p.add_in(this.vel.scale(dt))
    this.apply_rotation(this.omega, dt)
  }

  apply_correction(corr: Vec3, pos?: Vec3, velocity_level = false) {

    let dq = Vec3.zero
    if (!pos) {
      dq = corr
    } else {
      if (velocity_level) {
        this.vel.add(corr.scale(this.inv_mass))
      } else {
        this.pose.p.add(corr.scale(this.inv_mass))
      }

      dq = pos.sub(this.pose.p)
      dq = dq.cross(corr)
    }

    dq = this.pose.m_inv_rotate(dq)

    dq.set_in(this.inv_inertia.x * dq.x,
      this.inv_inertia.y * dq.y,
      this.inv_inertia.z * dq.z)
    dq = this.pose.m_rotate(dq)

    if (velocity_level) {
      this.omega.add_in(dq)
    } else {
      this.apply_rotation(dq)
    }
  }

  apply_rotation(v_rot: Vec3, scale = 1.0) {
    let maxPhi = 0.5
    let phi = v_rot.length
    if (phi * scale > maxRotationPerSubstep) {
      scale = maxRotationPerSubstep / phi
    }

    let dq = Quat.make([v_rot.x * scale, v_rot.y * scale, v_rot.z * scale, 0])
    dq.mul(this.pose.q)
    this.pose.q.set_in(this.pose.q.x + 0.5 * dq.x,
      this.pose.q.y + 0.5 * dq.y,
      this.pose.q.z + 0.5 * dq.z,
      this.pose.q.w + 0.5 * dq.w)
    this.pose.q = this.pose.q.normalize


  }

  update(dt: number) {
    this.vel = this.pose.p.sub(this.prev_pose.p).scale(1 / dt)
    let dq = this.pose.q.mul(this.prev_pose.q.conjugate)
    this.omega.set_in(dq.x * 2 / dt, dq.y * 2 / dt, dq.z * 2 / dt)
    if (dq.w < 0) {
      this.omega.set_in(-this.omega.x, -this.omega.y, -this.omega.z)
    }
  }

  get_velocity_at(pos: Vec3) {
    let vel = pos.sub(this.pose.p)
    vel = vel.cross(this.omega)
    return this.vel.sub(vel)
  }

  prev_pose: Pose
  orig_pose: Pose
  vel: Vec3
  omega: Vec3
  inv_inertia: Vec3
  inv_mass: number

  static make = (pose: Pose) => new Body(pose)

  constructor(readonly pose: Pose) {
    this.prev_pose = pose.clone
    this.orig_pose = pose.clone
    this.vel = Vec3.zero
    this.omega = Vec3.zero
    this.inv_mass = 1
    this.inv_inertia = Vec3.zero
  }
}


function _apply_body_pair_correction(body1: Body, body2: Body, corr: Vec3, compliance: number, dt: number, pos1?: Vec3, pos2?: Vec3, velocity_level = false) {

  let C = corr.length

  if (C == 0) {
    return
  }

  let { normalize } = corr

  let w1 = body1 ? body1.get_inverse_mass(normalize, pos1) : 0
  let w2 = body2 ? body2.get_inverse_mass(normalize, pos2) : 0

  let w = w1 + w2
  if (w == 0) {
    return 
  }


  let lambda = - C / (w + compliance / dt / dt)
  normalize.scale_in(-lambda)
  if (body1) {
    body1.apply_correction(normalize, pos1, velocity_level)
  }
  if (body2) {
    normalize.scale_in(-1)
    body1.apply_correction(normalize, pos2, velocity_level)
  }

}

export type JointSettings = {
  compliance: number
  rot_damping: number,
  pos_damping: number
}

export const hard_compliance = {
  compliance: 0,
  rot_damping: 0,
  pos_damping: 0
}

abstract class BaseJoint {

  global_pose1!: Pose
  global_pose2!: Pose

  get rot_damping() {
    return this.settings.rot_damping
  }

  get pos_damping() {
    return this.settings.pos_damping
  }

  get compliance() {
    return this.settings.compliance
  }

  constructor(
    readonly body1: Body, 
    readonly body2: Body,
    readonly local_pose1: Pose,
    readonly local_pose2: Pose,
    readonly settings: JointSettings
  ) {}

  _update_global_poses() {
    this.global_pose1 = this.local_pose1.clone
    this.global_pose1.transform_pose(this.body1.pose)
    this.global_pose2 = this.local_pose2.clone
    this.global_pose2.transform_pose(this.body2.pose)
  }

  solve_pos(dt: number) {
    this._update_global_poses()
    this._solve_pos(dt)
    this._update_global_poses()
    let v_corr = this.global_pose2.p.sub(this.global_pose1.p)
    _apply_body_pair_correction(
      this.body1, 
      this.body2, 
      v_corr, this.compliance, dt,
      this.global_pose1.p,
      this.global_pose2.p)
  }

  solve_vel(dt: number) {
    if (this.rot_damping > 0) {

      let omega = Vec3.zero
      if (this.body1) {
        omega.sub_in(this.body1.omega)
      }
      if (this.body2) {
        omega.add_in(this.body2.omega)
      }
      omega.scale_in(Math.min(1, this.rot_damping * dt))
      _apply_body_pair_correction(this.body1, this.body2, omega, 0, dt,
        undefined, undefined, true)
    }
    if (this.pos_damping > 0) {

      this._update_global_poses()
      let vel = Vec3.zero
      if (this.body1) {
        vel.sub_in(this.body1.get_velocity_at(this.global_pose1.p))
      }
      if (this.body2) {
        vel.add_in(this.body2.get_velocity_at(this.global_pose2.p))
      }
      vel.scale_in(Math.min(1, this.pos_damping * dt))
      _apply_body_pair_correction(this.body1, this.body2, vel, 0, dt,
        this.global_pose1.p, this.global_pose2.p, true)
    }
  }

  abstract _solve_pos(dt: number): void;
}



export class XPBD {


  constructor(
    readonly nb_substeps: number,
    readonly bodies: Array<Body>,
    readonly joints: Array<BaseJoint>) {}



  simulate(_dt: number) {
    let { bodies, joints } = this
    let { nb_substeps } = this

    let dt = _dt / nb_substeps


    for (let i = 0; i < nb_substeps; i++) {
      bodies.forEach(_ => _.integrate(dt))
      joints.forEach(_ => _.solve_pos(dt))
      bodies.forEach(_ => _.update(dt))
      joints.forEach(_ => _.solve_vel(dt))
    }
  }
}
