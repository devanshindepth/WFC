"use client"
import React, { useRef } from 'react'
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/all';
import { useGSAP } from "@gsap/react"

gsap.registerPlugin(ScrollTrigger);

const StickyFeaturesSection: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const container = useRef<HTMLDivElement>(null);

    useGSAP(
        () => {
            if (!container.current) return;
            const featureElements = Array.from(container.current.children) as HTMLElement[];
            featureElements.forEach((feature, index) => {
                if (index < featureElements.length - 1) {
                    ScrollTrigger.create({
                        trigger: feature,
                        start: "top top",
                        endTrigger: featureElements[featureElements.length - 1],
                        end: "top top",
                        pin: true,
                        pinSpacing: false,
                    });
                }
                if (index < featureElements.length - 1) {
                    ScrollTrigger.create({
                        trigger: featureElements[index + 1],
                        start: "top bottom",
                        end: "top top",
                        onUpdate: (self) => {
                            const progress = self.progress;
                            const scale = 1 - progress * 0.2;
                            const afterOpacity = progress;

                            gsap.set(feature, {
                                scale: scale,
                                "--after-opacity": afterOpacity,
                            })
                        }
                    })
                }
            });
        }, { scope: container })

    return (
        <div className='sticky-section' ref={container}>
            {children}
        </div>
    )
}

export default StickyFeaturesSection