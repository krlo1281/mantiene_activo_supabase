import { useEffect, useRef } from 'react'

export default function RadiationBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const frameRef = useRef<number>(0)

    // Arrays para los dos atractores
    const attractorsRef = useRef([
        { x: 0, y: 0, vx: 1.5, vy: 1, pulse: 0, targetX: 0, targetY: 0 },
        { x: 0, y: 0, vx: -1.2, vy: -1.5, pulse: Math.PI, targetX: 0, targetY: 0 }
    ])

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        let width = canvas.width = canvas.offsetWidth
        let height = canvas.height = canvas.offsetHeight

        // Inicializar atractores MUCHO más distantes
        attractorsRef.current[0].x = width * 0.15
        attractorsRef.current[0].y = height * 0.25
        attractorsRef.current[1].x = width * 0.85
        attractorsRef.current[1].y = height * 0.75

        interface Particle {
            x: number
            y: number
            vx: number
            vy: number
            radius: number
            alpha: number
            life: number
            maxLife: number
            hue: number // Verde esmeralda (140-160)
        }

        const particles: Particle[] = []
        const particleCount = 200 // Un poco menos de partículas si son más grandes

        const createParticle = (initial = false): Particle => {
            const life = Math.random() * 400 + 150
            const hue = 140 + Math.random() * 20
            return {
                x: Math.random() * width, // Asegurar distribución total
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.8, // Un pelín más rápidas para notar la estela
                vy: (Math.random() - 0.5) * 0.8,
                radius: Math.random() * 3 + 1.2, // Partículas más grandes (antes 2 y 0.5)
                alpha: 0,
                life: initial ? Math.random() * life : life,
                maxLife: life,
                hue,
            }
        }

        for (let i = 0; i < particleCount; i++) {
            particles.push(createParticle(true))
        }

        const handleResize = () => {
            if (!canvas) return
            width = canvas.width = canvas.offsetWidth
            height = canvas.height = canvas.offsetHeight
        }
        window.addEventListener('resize', handleResize)

        const drawGrid = () => {
            const gridSize = 80
            ctx.lineWidth = 1
            ctx.strokeStyle = 'rgba(16, 185, 129, 0.15)' // Verde más notorio pero limpio

            // Grilla perfectamente recta
            ctx.beginPath()
            for (let x = 0; x <= width + gridSize; x += gridSize) {
                ctx.moveTo(x, 0)
                ctx.lineTo(x, height)
            }
            for (let y = 0; y <= height + gridSize; y += gridSize) {
                ctx.moveTo(0, y)
                ctx.lineTo(width, y)
            }
            ctx.stroke()
        }

        const drawAttractors = () => {
            const timeScale = 0.05

            attractorsRef.current.forEach((attractor) => {
                attractor.pulse += timeScale

                // Halo exterior pulsante
                const pulseScale = 1 + Math.sin(attractor.pulse) * 0.3
                const outerR = 70 * pulseScale

                const glowGrad = ctx.createRadialGradient(attractor.x, attractor.y, 0, attractor.x, attractor.y, outerR)
                glowGrad.addColorStop(0, 'rgba(16, 185, 129, 0.25)')
                glowGrad.addColorStop(0.3, 'rgba(16, 185, 129, 0.1)')
                glowGrad.addColorStop(1, 'rgba(16, 185, 129, 0)')
                ctx.fillStyle = glowGrad

                ctx.beginPath()
                ctx.arc(attractor.x, attractor.y, outerR, 0, Math.PI * 2)
                ctx.fill()

                // Core luminoso
                const coreGrad = ctx.createRadialGradient(attractor.x, attractor.y, 0, attractor.x, attractor.y, 12)
                coreGrad.addColorStop(0, 'rgba(255, 255, 255, 1)')
                coreGrad.addColorStop(0.5, 'rgba(16, 185, 129, 0.9)')
                coreGrad.addColorStop(1, 'rgba(16, 185, 129, 0)')
                ctx.fillStyle = coreGrad

                ctx.beginPath()
                ctx.arc(attractor.x, attractor.y, 12, 0, Math.PI * 2)
                ctx.fill()

                // Movimiento aleatorio suave
                if (Math.random() < 0.02) {
                    attractor.vx += (Math.random() - 0.5) * 0.8
                    attractor.vy += (Math.random() - 0.5) * 0.8
                }

                // --- FÍSICA DE REPULSIÓN ENTRE ATRACTORES ---
                const otherAttractor = attractorsRef.current.find(a => a !== attractor)
                if (otherAttractor) {
                    const dx = attractor.x - otherAttractor.x
                    const dy = attractor.y - otherAttractor.y
                    const distSQ = dx * dx + dy * dy
                    const minDistance = 400 // Distancia que intentarán mantener

                    if (distSQ < minDistance * minDistance) {
                        const dist = Math.sqrt(distSQ) || 1
                        const repulsionForce = ((minDistance - dist) / minDistance) * 0.15
                        attractor.vx += (dx / dist) * repulsionForce
                        attractor.vy += (dy / dist) * repulsionForce
                    }
                }

                // Límite de velocidad
                const maxSpeed = 1.3
                if (Math.abs(attractor.vx) > maxSpeed) attractor.vx *= 0.95
                if (Math.abs(attractor.vy) > maxSpeed) attractor.vy *= 0.95

                attractor.x += attractor.vx
                attractor.y += attractor.vy

                // Rebote suave en márgenes (manteniendo atractores en pantalla)
                const margin = 100
                if (attractor.x < margin) attractor.vx += 0.2
                if (attractor.x > width - margin) attractor.vx -= 0.2
                if (attractor.y < margin) attractor.vy += 0.2
                if (attractor.y > height - margin) attractor.vy -= 0.2
            })
        }

        const animate = () => {
            // Fondo blanco puro CON ESTELA (alpha 0.4 para motion blur)
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
            ctx.fillRect(0, 0, width, height)

            drawGrid()

            // Partículas
            particles.forEach((p, index) => {
                p.life--
                if (p.life <= 0) {
                    const newP = createParticle()
                    Object.assign(p, newP)
                    p.alpha = 0
                }

                const progress = p.life / p.maxLife
                p.alpha = Math.sin(progress * Math.PI) * 0.85

                p.x += p.vx
                p.y += p.vy

                // Interacción con los atractores
                attractorsRef.current.forEach(attractor => {
                    const dx = attractor.x - p.x
                    const dy = attractor.y - p.y
                    const distAttr = Math.sqrt(dx * dx + dy * dy)

                    if (distAttr < 300) {
                        const force = (300 - distAttr) / 300
                        p.vx += (dx / distAttr) * force * 0.05
                        p.vy += (dy / distAttr) * force * 0.05
                    }
                })

                p.vx *= 0.99
                p.vy *= 0.99

                if (p.x < 0 || p.x > width) p.vx *= -1
                if (p.y < 0 || p.y > height) p.vy *= -1

                // Dibujar partícula estilo "nodo luminoso"
                ctx.shadowBlur = p.radius * 3
                ctx.shadowColor = `hsla(${p.hue}, 90%, 40%, ${p.alpha * 0.8})`

                ctx.beginPath()
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
                ctx.fillStyle = `hsla(${p.hue}, 80%, 45%, ${p.alpha})`
                ctx.fill()
                ctx.shadowBlur = 0

                // Conexiones
                const connectionDist = 100
                let connections = 0
                for (let j = index + 1; j < particles.length; j++) {
                    if (connections > 6) break // Límite de conexiones para evitar saturación geométrica
                    const p2 = particles[j]

                    if (Math.abs(p.x - p2.x) > connectionDist || Math.abs(p.y - p2.y) > connectionDist) continue

                    const ddx = p.x - p2.x
                    const ddy = p.y - p2.y
                    const distance = Math.sqrt(ddx * ddx + ddy * ddy)

                    if (distance < connectionDist) {
                        const lineAlpha = (1 - distance / connectionDist) * Math.min(p.alpha, p2.alpha) * 0.6
                        ctx.beginPath()
                        ctx.moveTo(p.x, p.y)
                        ctx.lineTo(p2.x, p2.y)
                        ctx.strokeStyle = `hsla(${(p.hue + p2.hue) / 2}, 80%, 40%, ${lineAlpha})`
                        ctx.lineWidth = 0.5
                        ctx.stroke()
                        connections++
                    }
                }
            })

            drawAttractors()

            frameRef.current = requestAnimationFrame(animate)
        }

        frameRef.current = requestAnimationFrame(animate)

        return () => {
            window.removeEventListener('resize', handleResize)
            cancelAnimationFrame(frameRef.current)
        }
    }, [])

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0" style={{ background: '#ffffff' }}>
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
        </div>
    )
}
