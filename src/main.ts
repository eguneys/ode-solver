import { Canvas, loop } from './debug'
import { make_drag } from './drag'
import { Ref, onScrollHandlers } from './ref'
import { closest_point_on_segment } from './coll'



import { v3, v2 } from './pbd_x'
import { XPBD, 
  Constraint, Particle,
  Border, BorderBorderConstraint,
  DistanceConstraintPlus } from './pbd_x'
import { Vec3 } from './math4'
import { Vec2 } from './vec2'


class Borders {

  static make = (borders: Array<Border>) => new Borders(borders)

  get constraints() {
    return this._distance_c
  }

  _anchor: Particle
  _distance_c: Array<Constraint>

  _drag_particle?: Border

  constructor(readonly borders: Array<Border>) {

    this._anchor = Particle.make(120, Vec3.zero, Vec3.zero)
    let _b1 = this._anchor
    this._distance_c = this.borders.map(b2 =>
        new DistanceConstraintPlus(_b1, b2, b2.position.sub(_b1.position), 1, 0))
  }


  find_and_save_drag(_o: Vec2) {
    let _ = this.borders.find(_ => {
      let p = closest_point_on_segment(v3(_o), v3(_.l.a), v3(_.l.b))
      return p.distance(v3(_o)) < 6
    })
    this._drag_particle = _
    if (_) {
      //_drag_offset = this._anchor.position.sub()
    }
    return _
  }


  drag_constraint(_drag_particle: Vec3) {

    let _drag_offset = Vec3.zero
    let d_c = new DistanceConstraintPlus(
      Particle.make(120, _drag_particle, Vec3.zero),
      this._anchor!,
      _drag_offset, 1, 0)


  }
}


class More {

  static make = () => {

  let bs: Array<Borders> = [
    Borders.make([
      Border._make(
        10,
        Vec3.make(200, 200, 0),
        Vec3.zero,
        100,
        Vec2.unit.normalize!
      ),
      Border._make(
        10,
        Vec3.make(500, 200, 0),
        Vec3.zero,
        100,
        Vec2.left
      )
    ])
  ]

  return new More(bs)

  }

  get constraints() {
    return [
      ...this._borders.flatMap(_ => _.constraints),
    ]
  }

  get borders() {
    return this._borders.flatMap(_ => _.borders)
  }

  find_and_save_drag(v: Vec2) {
    return this._borders.find(_ => _.find_and_save_drag(v))
  }

  drag_constraint(_drag_particle: Vec3) {

  }

  update(dt: number) {

    let b = new XPBD(3, this.borders, this.constraints)

    b.update(dt)
  }

  constructor(readonly _borders: Array<Borders>) {
  }

}


let v_screen = Vec2.make(1080, 1920)

const app = (element: HTMLElement) => {

  let bs = More.make()

  let ref = Ref.make(element)

  let _drag_particle: Vec3 | undefined

  make_drag({
    on_drag(e) {
      if (e.m) {
        let _o = ref.get_normal_at_abs_pos(e.e).mul(v_screen)
        let o = ref.get_normal_at_abs_pos(e.m).mul(v_screen)
        if (_drag_particle) {
          _drag_particle = Vec3.make(o.x, o.y, 0)
        } else {
          let i = bs.find_and_save_drag(_o)
          if (i) {
            _drag_particle = Vec3.make(o.x, o.y, 0)
          } 
        }
      }
    },
    on_up() {
      _drag_particle = undefined
    }
  }, element)

  onScrollHandlers(() => {
    ref.$clear_bounds()
  })




  let g = Canvas.make(1080, 1920, element)

  loop((dt: number) => {

    if (_drag_particle) {

    }

    bs.update(dt)

    g.clear()
    g.fr('hsl(0, 20%, 30%)', 0, 0, 1080, 1920)


    bs.borders.forEach(b => {
      g.line('hsl(0, 50%, 50%)', 6, b.l.x1, b.l.y1, b.l.x2, b.l.y2)
    })


  })

}




app(document.getElementById('app')!)
