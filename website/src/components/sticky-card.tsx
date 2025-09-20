"use client"
import React, { useRef } from 'react'
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/all';
import { useGSAP } from "@gsap/react"

gsap.registerPlugin(ScrollTrigger);


const StickySection = () => {
    const container = useRef(null);
    const stickycarddata = [
        {
            title: "Title 1",
            content: "Content for Title 1"
        },
        {
            title: "Title 2",
            content: "Content for Title 2"
        },
        {
            title: "Title 3",
            content: "Content for Title 3"
        }
    ];

    useGSAP(
        () => {
            const stickyCards = document.querySelectorAll(".sticky-card")
            stickyCards.forEach((card, index) => {
                if (index < stickyCards.length - 1) {
                    ScrollTrigger.create({
                        trigger: card,
                        start: "top top",
                        endTrigger: stickyCards[stickyCards.length - 1],
                        end: "top top",
                        pin: true,
                        pinSpacing: false,
                    });
                }
                if (index < stickyCards.length - 1) {
                    ScrollTrigger.create({
                        trigger: stickyCards[index + 1],
                        start: "top bottom",
                        end: "top top",
                        onUpdate: (self) => {
                            const progress = self.progress;
                            const scale = 1 - progress * 0.2;
                            const afterOpacity = progress;

                            gsap.set(card, {
                                scale: scale,
                                "--after-opacity": afterOpacity,
                            })
                        }
                    })
                }
            });
        }, { scope: container })

    return (
        <div className='sticky-cards' ref={container}>
            {stickycarddata.map((cardData,) => (
                <div key={cardData.title} className='sticky-card'>
                    <h3 className='sticky-card'>{cardData.title}</h3>
                    <div className='sticky-card-content'>
                        <div className="sticky-card-content-wrapper">
                            <h1 className="sticky-card-header">{cardData.title}</h1>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}

export default StickySection
