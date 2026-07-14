'use client'
import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import instructionBackground from '../../../public/images/dashboard/InstructionBackground.svg'
import whale1 from '../../../public/images/dashboard/whaleLightBulb.svg'
import whale2 from '../../../public/images/dashboard/whaleCup.svg'
import fancyText from '../../../public/images/dashboard/fancytext1.svg'
import StepCard from './StepCard'

export default function InstructionPage() {
  const [showBg, setShowBg] = useState(true)

  useEffect(() => {
    // Function to check screen size
    const checkScreen = () => {
      setShowBg(window.innerWidth < 1024) 
    }
    checkScreen()
    window.addEventListener('resize', checkScreen)
    return () => window.removeEventListener('resize', checkScreen)
  }, [])

  return (
  <section>
    {/*mobile view*/}
    {showBg ? (
    <div className="w-full bg-valentine-light flex flex-col items-center pb-30 sm:pb-40 md:pb-45"> {/*FIXXX*/}
      <div id="infoMobile" className="relative w-[90%] max-w-6xl aspect-[2/3] rounded-[50px] mx-auto">
        <Image
          src={fancyText}
          alt="How to participate?"
          className="h-15 sm:h-19 md:h-24 lg:h-30 w-auto mx-auto mt-2 md:mt-5 mb-4 md:mb-6"
          priority
        />
        <div
          className="relative w-full h-full rounded-[20px]"
          style={{
            ...(showBg
              ? {
                  backgroundImage: `url(${instructionBackground.src})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                }
              : {}),
            width: '100%',
            height: '100%',
          }}
        >
          <div className="relative z-30 w-full h-full flex items-center justify-center">
            <div className="grid grid-cols-2 gap-6 w-[90%] -mt-6 -mb-6">
              <StepCard
                step="Step 1:"
                description={
                  <>
                    <span className="font-bold italic">Answer</span> a mix of short and multiple-choice questions about your interests, hobbies, and preferences. This helps us learn more about you so we can find someone who shares similar vibes.
                  </>
                }
                opacity={0.8}
                icon={whale2}
              />
              <StepCard
                step="Step 2:"
                description={
                  <>
                    <span className="font-bold italic">Based on your responses,</span> we’ll pair you with someone who shares similar interests, vibes or goals. Think of it as a personality-powered match!
                  </>
                }
                opacity={0.4}
              />
              <StepCard
                step="Step 3:"
                description={
                  <>
                    <span className="font-bold italic">You and your match</span> will join in on a fun shared activity—like a game, conversation starter, or creative challenge—to help you break the ice and enjoy your time together.
                  </>
                }
                opacity={0.4}
              />
              <StepCard
                step="Step 4:"
                description={
                  <>
                    <span className="font-bold italic">By the end</span> of your activity, you’ll have had a chance to chat, laugh, and bond. Hopefully, you’ll leave the event with a great experience—and maybe even a new friend!
                  </>
                }
                opacity={0.8}
                icon={whale1}
              />

            </div>
          </div>
        </div>
      </div>
    </div>
    ) : ( 
    <div id="info" className="w-full bg-valentine-light flex flex-col items-center"> {/*desktop view*/}
      <Image
        src={fancyText}
        alt="How to participate?"
        className="h-15 sm:h-19 md:h-24 lg:h-30 w-auto mx-auto mt-2 md:mt-5 mb-4 md:mb-6"
        priority
      />
      <div className="relative z-30 w-full h-full flex items-center justify-center py-10">
        <div className="grid grid-cols-2 gap-6 w-[90%] -mt-6 -mb-6">
          <StepCard
            step="Step 1:"
            description={
              <>
                <span className="font-bold italic">Answer</span> a mix of short and multiple-choice questions about your interests, hobbies, and preferences. This helps us learn more about you so we can find someone who shares similar vibes.
              </>
            }
            opacity={0.8}
            icon={whale2}
          />
          <StepCard
            step="Step 2:"
            description={
              <>
                <span className="font-bold italic">Based on your responses,</span> we’ll pair you with someone who shares similar interests, vibes or goals. Think of it as a personality-powered match!
              </>
            }
            opacity={0.4}
          />
          <StepCard
            step="Step 3:"
            description={
              <>
                <span className="font-bold italic">You and your match</span> will join in on a fun shared activity—like a game, conversation starter, or creative challenge—to help you break the ice and enjoy your time together.
              </>
            }
            opacity={0.4}
          />
          <StepCard
            step="Step 4:"
            description={
              <>
                <span className="font-bold italic">By the end</span> of your activity, you’ll have had a chance to chat, laugh, and bond. Hopefully, you’ll leave the event with a great experience—and maybe even a new friend!
              </>
            }
            opacity={0.8}
            icon={whale1}
          />

        </div>
      </div>
    </div>
    )}
  </section>
  )
}