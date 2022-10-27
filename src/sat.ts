const sat = (pA: Projectable, pB: Projectable) => {
  axes.find(axis => {
    let p1 = pA.project(axis),
      p2 = pB.project(axis)

    return !p1.overlap(p2)
  })
}
