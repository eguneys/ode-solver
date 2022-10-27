import { Vec2, Rectangle } from './vec2'

export type Projection = [number, number]
export type Axis = Vec2

export interface IProjectable {
  axes: Array<Axis>,
  project: (_: Axis) => Projection 
}

export type Manifold = [Vec2, number]


export class Polygon {
  static make = (vertices: Array<Vec2>) => new Polygon(vertices)

  static from_rect = (rect: Rectangle) => new Polygon(rect.vertices)

  get edges() {
    let res = []

    for (let i = 0; i < this.vertices.length; i++) {
      let p1 = this.vertices[i],
        p2 = this.vertices[(i + 1) % this.vertices.length]

      let edge = p1.sub(p2)

      res.push(edge)
    }
    return res
  }


  get axes() {
    return this.edges.map(_ => _.perpendicular.normalize!)
  }

  project(axis: Axis): Projection { 
    return this.vertices.reduce((acc, v) => {
      console.log(axis, v, axis.dot(v))
      let _ = axis.dot(v)
      return [Math.min(_, acc[0]), Math.max(_, acc[1])]
    }, [Infinity, -Infinity])
  }

  constructor(readonly vertices: Array<Vec2>) {}
}


const projection_overlap = (a: Projection, b: Projection) => {
  if (a[0] < b[0]) {
    if (a[1] < b[0]) {
      // a  a  b  b
      return Infinity
    } else {
      // a b a b
      return a[1] - b[0]
    }
  } else {
    if (b[1] < a[0]) {
      // b  b  a  a
      return Infinity
    } else {
      // b a b a
      return b[1] - a[0]
    }
  }
}

export const sat = (pA: IProjectable, pB: IProjectable) => {

  let axes = [...pA.axes, ...pB.axes]

  return axes.reduce<null | Manifold>((acc, axis) => {
    let p1 = pA.project(axis),
      p2 = pB.project(axis)

    let o = projection_overlap(p1, p2)

    if (acc === null) {
      return [axis, o]
    }

    let [_axis, _o] = acc

    if (o < _o) {
      return [axis, o]
    }
    return acc
  }, null)
}


