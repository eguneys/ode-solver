import { Triangle, Vec2, Line } from './vec2'

/* https://stackoverflow.com/questions/2049582/how-to-determine-if-a-point-is-in-a-2d-triangle */

function v_sign(p1: Vec2, p2: Vec2, p3: Vec2) {
  return (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y)
}

export const tri_orig = (t0: Triangle, o: Vec2) => {
  let d1 = v_sign(o, t0.a, t0.b),
    d2 = v_sign(o, t0.b, t0.c),
    d3 = v_sign(o, t0.c, t0.a)

  let has_neg = (d1 < 0) || (d2 < 0) || (d3 < 0),
    has_pos = (d1 > 0) || (d2 > 0) || (d3 > 0)

  return !(has_neg && has_pos) 
}


/* http://thirdpartyninjas.com/blog/2008/10/07/line-segment-intersection/ */
export const line_line = (l0: Line, l1: Line) => {

  let x1 = l0.x1,
    x2 = l0.x2,
    x3 = l1.x1,
    x4 = l1.x2

  let y1 = l0.y1,
    y2 = l0.y2,
    y3 = l1.y1,
    y4 = l1.y2

  let _d = ((y4-y3) * (x2-x1) - (x4-x3) * (y2-y1)) 

  if (_d === 0) {
    return undefined
  }

  let ua = ((x4-x3) * (y1-y3) - (y4-y3) * (x1-x3)) / _d 


  let ub = ((x2-x1) * (y1-y3) - (y2-y1) * (x1-x3)) / _d 


  if (0 <= ua && ua <= 1 && 0 <= ub && ub <= 1) {

    let x = x1 + ua * (x2 - x1),
      y = y1 + ua * (y2 - y1)

    return Vec2.make(x, y)
  } 

  return undefined
}


