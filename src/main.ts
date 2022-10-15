import { Canvas, loop } from './debug'
import { Vec2, Rectangle } from './vec2'
import { Vec3, Quat } from './math4'
import { XPBD, Particle, Constraint, 
  DLineLineConstraint,
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

let fen2 = `
########
#......#
#rrgg..#
#rrgg..#
#......#
########
`

let fen = `
ab
`

export type Fen = string

export type ParticleInfo = {
  p: Particle,
  char: string,
  pos: Vec2,
}

const plines_for_particle = (p: Particle, r: number) => {

  return [Vec3.left, Vec3.right, Vec3.up, Vec3.down].map(d => {
    let p2 = p.position.add(d.scale(r))
    
    let a = p2.add(d.perpendicular.scale(r)),
      b  = p2.add(d.perpendicular.scale(-r))

    return {
      p,
      a,
      b
    }
  })
}

class Body {

  static from_fen = (fen: Fen) => {

    let gs: Array<Array<ParticleInfo>> = []
    let cs: Array<Constraint> = []
    let infos: Array<ParticleInfo> = []

    let nb_rows,
    nb_cols
    let ms = new Map()
    fen.split('\n').forEach((lines: string, row: number) => {
      nb_rows = row + 1
      lines.split('').forEach((char: string, col: number) => {
        nb_cols = col + 1
        ms.set(Vec2.make(col, row).key, char)
      })
    })

    for (let [key, char] of ms) {
      let v = Vec2.from_key(key)
      let mass = 100
      if (char === '#') {
        mass = Infinity
      }
      let p = Particle.make(mass, Vec3.make(100 + v.x * 120, 100 + v.y * 120, 0), Vec3.zero)

      let i = {
        p,
        char,
        pos: v
      }
      infos.push(i)
    }

    let i_solids = infos.filter(_ => _.char !== '.')

    i_solids.forEach(_ => {

      let _plines = plines_for_particle(_.p, 120)

      i_solids.forEach(_2 => {
        if (_ === _2) { return }

        let _plines2 = plines_for_particle(_2.p, 120)

        //new DistanceCollideConstraint(_.p, _2.p, 120, 1, 0)

        let _cs = _plines.flatMap(_pline =>
          _plines2.map(_pline2 =>
            new DLineLineConstraint(_pline,
                                       _pline2,
                                       1,
                                       1)))

         cs.push(..._cs)
      })
    })

    function add_neighbours_to_group(_: ParticleInfo, group: Array<ParticleInfo>) {
      if (gs.find(g => g.find(_a => _a === _))) {
        return
      }

      if (group.length === 0) {
        gs.push(group)
      }

      group.push(_)

      _.pos.neighbours.forEach(vn => {
        let n = i_solids.find(_ => _.pos.key === vn.key)
        if (n) {
          if (n.char === _.char) {
            add_neighbours_to_group(n, group)
          }
        }
      })
    }
    i_solids.forEach(_ => {
      add_neighbours_to_group(_, [])
    })

    gs.forEach(g => {
      g.forEach(i => {
        g.forEach(i2 => {
          if (i.char === '#') { return }
          if (i === i2) { return }
          
          let v = i2.pos.sub(i.pos).scale(120)

          let c = new DistanceConstraintPlus(i.p,
                                 i2.p,
                                 Vec3.make(v.x, v.y, 0),
                                 1,
                                 0)
          cs.push(c)
        })
      })
    })

    return new Body(gs, infos.map(_ => _.p), cs, infos)
  }

  d_c(v: Vec3, p1: ParticleInfo) {
    let o = Particle.make(Infinity, v, Vec3.zero)
    let o_p1 = Vec3.zero
    let g = this.group_of(p1)
    if (g) {

      let _drag_c = g.map(p2 => 
        new DistanceConstraintPlus(p2.p, o, p1.p.position.sub(p2.p.position).add(o_p1), 0.1, 0))
        this._drag_c = _drag_c
    }

  }

  d_c_clear() {
    this._drag_c = undefined
  }

  group_of(p: ParticleInfo) {
    return this.groups.find(_ => _.find(_ => _ === p))
  }

  get constraints() {
    if (this._drag_c) {
      return [...this._constraints, ...this._drag_c]
    }
    return this._constraints
  }

  _drag_c?: Array<Constraint>
  get xpbd() {
    return new XPBD(2, this.particles, this.constraints)
  }

  constructor(readonly groups: Array<Array<ParticleInfo>>,
              readonly particles: Array<Particle>,
              readonly _constraints: Array<Constraint>,
              readonly infos: Array<ParticleInfo>) {
              
              }


  update(dt: number) {
    this.xpbd.update(dt)
  }

}


let r = 100
const app = (element: HTMLElement) => {
  let g = Canvas.make(1080, 1920, element)


  let b = Body.from_fen(fen.trim())

  let ref = Ref.make(element)

  let _drag_particle: [Vec3, ParticleInfo] | undefined = undefined

  make_drag({
    on_drag(e) {
      if (e.m) {
        let _o = ref.get_normal_at_abs_pos(e.e).mul(v_screen)
        let o = ref.get_normal_at_abs_pos(e.m).mul(v_screen)
        if (_drag_particle) {
          _drag_particle[0] = Vec3.make(o.x, o.y, 0)
        } else {
          let i = b.infos.find(_ => {
            let { x, y } = _.p.position
            return rect_orig(Rectangle.make(x - r/2, y - r/2, r, r), _o)
          })

          if (i) {
            _drag_particle = [Vec3.make(o.x, o.y, 0), i]
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
      b.d_c(..._drag_particle)
    }

    b.update(dt)

    g.clear()
    g.fr('hsl(0, 20%, 50%)', 0, 0, 1080, 1920)

    b.infos.forEach(i => {
      let group = b.group_of(i)
      let { p, char } = i
      let { x, y } = p.position

      let color = 'hsl(0, 50%, 50%)'
      if (char === '.') {
        return
      }
      if (char === '#') {
        color = 'hsl(0, 30%, 30%)'
      }

      if (group?.length === 2) {
        color = 'hsl(30, 50%, 50%)'
      }

      if (group?.length === 4) {
        color = 'hsl(50, 50%, 50%)'
      }

      g.fr(color, x - r/2, y - r/2, r, r)
    })
  })
}

app(document.getElementById('app')!)
