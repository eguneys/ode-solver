import { Canvas, loop } from './debug'
import { Vec2, Rectangle } from './vec2'
import { Vec3, Quat } from './math4'
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

let fen = `
########
#ooaooa#
#acggac#
#caggca#
#......#
########
`

export type Fen = string

const row_col = (row: number, col: number) => {
  return row + col * 100
}

const row_col_split = (rc: number) => {
  return [rc % 100, Math.floor(rc / 100)]
}

export type ParticleInfo = {
  p: Particle,
  char: string,
  row: number,
  col: number
}

class Body {

  static from_fen = (fen: Fen) => {

    let gs: Array<Array<Particle>> = []
    let cs: Array<Constraint> = []
    let infos: Array<ParticleInfo> = []

    let nb_rows,
    nb_cols
    let ms = new Map()
    fen.split('\n').forEach((lines: string, row: number) => {
      nb_rows = row + 1
      lines.split('').forEach((char: string, col: number) => {
        nb_cols = col + 1
        ms.set(row_col(row, col), char)
      })
    })

    for (let [rc, char] of ms) {
      let [row, col] = row_col_split(rc)
      let p = Particle.make(8, Vec3.make(100 + col * 120, 100 + row * 120, 0), Vec3.zero)

      let i = {
        p,
        char,
        row,
        col
      }
      infos.push(i)
    }


    
    return new Body(gs, infos.map(_ => _.p), cs, infos)
  }


  static make = () => {
    let a = Particle.make(20, Vec3.make(250, 300, 0), Vec3.zero)
    let b = Particle.make(20, Vec3.make(450, 300, 0), Vec3.zero)
    let c = Particle.make(20, Vec3.make(650, 300, 0), Vec3.zero)
    let d = Particle.make(20, Vec3.make(850, 300, 0), Vec3.zero)

    let m = Particle.make(20, Vec3.make(500, 500, 0), Vec3.zero)

    let g = [[a, b], [c], [d]]
    let p = [a, b, c, d]

    let cs: Array<Constraint> = [
      new DistanceConstraintPlus(a, b, Vec3.right.scale(200), 1, 1),
      new DistanceConstraintPlus(b, a, Vec3.left.scale(200), 1, 1),
      new DistanceCollideConstraint(a, c, 100, 1, 1)
    ]

    return new Body(g, p, cs, [])
  }

  d_c(v: Vec3, p1: Particle) {
    let p2 = Particle.make(100000, v, Vec3.zero)
    let c = new DistanceConstraint(p1, p2, 0, 0.5, 1)
    if (this._drag_c) {
      this.constraints.splice(this.constraints.indexOf(this._drag_c), 1, c)
    } else {
      this.constraints.push(c)
    }
    this._drag_c = c
  }

  _drag_c?: Constraint
  xpbd: XPBD

  constructor(readonly groups: Array<Array<Particle>>,
              readonly particles: Array<Particle>,
              readonly constraints: Array<Constraint>,
              readonly infos: Array<ParticleInfo>) {
              
                this.xpbd = new XPBD(6, particles, constraints)
              }


  update(dt: number) {
    this.xpbd.update(dt)
  }

}


let r = 100
const app = (element: HTMLElement) => {
  let g = Canvas.make(1080, 1920, element)


  let b = Body.from_fen(fen.trim())

  let b2 = Body.make()

  let ref = Ref.make(element)

  let _drag_particle: [Vec3, Particle] | undefined = undefined

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
            _drag_particle = [Vec3.make(o.x, o.y, 0), i.p]
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

  loop((dt: number) => {


    if (_drag_particle) {

      b.d_c(..._drag_particle)

    }

    b.update(dt)

    g.clear()
    g.fr('hsl(0, 20%, 50%)', 0, 0, 1080, 1920)

    b.infos.forEach(i => {
      let { p, char } = i
      let { x, y } = p.position

      let color = 'hsl(0, 50%, 50%)'
      if (char === '.') {
        return
      }
      if (char === '#') {
        color = 'hsl(0, 30%, 30%)'
      }

      g.fr(color, x - r/2, y - r/2, r, r)
    })
  })
}

app(document.getElementById('app')!)
