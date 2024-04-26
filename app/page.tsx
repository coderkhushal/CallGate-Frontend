"use client"
import { gsap } from "gsap";
import {useGSAP} from "@gsap/react"
import Link from 'next/link'
import React from 'react'

const HomePage = () => {
  useGSAP(()=>{
    gsap.to("#main", {
      // write a animation that appears the main div with rotation
      rotation: 1060,
      duration: 1.5,
      ease: "elastic",
     });
  })
  return (
    <>
    <div id='main' className="m-auto justify-center items-center flex w-1/2 h-1/2 bg-blue-400">
      
      <Link href="/main">
      <button className="px-6 py-3 rounded-lg bg-blue-500 text-white font-semibold shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">Go to Main page</button>

      </Link>
    </div>
    </>
  )
}

export default HomePage