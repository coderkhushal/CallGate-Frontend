"use client"
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import React from 'react'

const NotFoundPage = () => {
  const router = useRouter()
  return (
    <div>Room Not Found

      <Button onClick={()=>{router.push("/main")}}>
        Go back to main
      </Button>
    </div>
  )
}

export default NotFoundPage