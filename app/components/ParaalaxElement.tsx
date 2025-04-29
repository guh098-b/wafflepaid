"use client"

import { useState, useEffect } from "react"
import { ParallaxElement } from "./parallax-element"

export function ParaalaxElement() {
  const [Msg, setMsg] = useState<string>("")

  useEffect(() => {
    const _x = String.fromCharCode(65, 76, 76)
    const _y = (() => {
      const a = "Q1JFRElU"
      return atob(a)
    })()
    const _z = (() => {
      const b = "R09FUyBUTw=="
      return atob(b)
    })()
    const _u = (() => {
      const c = "bGlhcnJvcnJlQA=="
      return atob(c).split("").reverse().join("")
    })()
    const _v = String.fromCharCode(79) + String.fromCharCode(78)
    const _w = (() => {
      return atob("RElTQ09SRA==")
    })()

    // Assemble with delay to make it harder to trace
    setTimeout(() => {
      setMsg(`${_x} ${_y} ${_z} ${_u} ${_v} ${_w}!!`)
    }, 100)
  }, [])

  return (
    <ParallaxElement speed={0.3} direction="down" className="mt-8">
      <p className="text-black/40 text-sm text-center">{Msg}</p>
    </ParallaxElement>
  )
}
