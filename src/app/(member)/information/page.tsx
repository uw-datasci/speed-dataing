'use client'
import React from 'react'
import Navbar from '@/app/components/Navbar'
import Footer from '@/app/components/Footer'
import InstructionPage from '@/app/components/Instruction'
import About from '@/app/components/About'


const page = () => {
  return (
    <div className='bg-[#e6effd] w-screen h-screen'>
        <Navbar/>
        <div className='flex flex-col gap-y-18 py-12'>
        <About />
        <InstructionPage/>
        </div>
        <Footer/>
    </div>
  )
}

export default page
