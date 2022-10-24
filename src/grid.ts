import { Vec2 } from './vec2'

export type Pos = string

export class Grid {


  get bodies() {
    return [...this._o_by_body].map(([body, o]) => {
      return [body, body.map(b => b.add(o))]
    })
  }

  _map: Map<Pos, Array<Vec2>>
  _o_by_body: Map<Array<Vec2>, Vec2>
  constructor(readonly w: number,
              readonly h: number) {
    this._map = new Map()
    this._o_by_body = new Map()
  }


  body(o: Vec2, vss: Array<Vec2>) {
    let news = vss.map(_ => _.add(o)).map(v => [v.key, vss] as [Pos, Array<Vec2>])

    this._map = new Map([...this._map, ...news])

    this._o_by_body.set(vss, o)

    return news.map(_ => Vec2.from_key(_[0]))
  }

}
