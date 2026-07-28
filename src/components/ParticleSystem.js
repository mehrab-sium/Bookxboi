'use client';

import React, { useRef, useEffect } from 'react';

export default function ParticleSystem() {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let width = window.innerWidth;
    let height = window.innerHeight;
    
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };
    window.addEventListener('resize', resize, { passive: true });

    // Mouse Tracking Logic
    let mouse = { x: -1000, y: -1000, radius: 100 };
    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave, { passive: true });

    const particles = Array.from({ length: 45 }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      baseX: Math.random() * width,
      baseY: Math.random() * height,
      size: Math.random() * 1 + 0.5,
      speedY: -(Math.random() * 0.3 + 0.1),
      phase: Math.random() * Math.PI * 2,
    }));

    let animationFrame;
    const render = () => {
      ctx.clearRect(0, 0, width, height);
      
      particles.forEach(p => {
        // Natural drift
        p.y += p.speedY;
        p.x += Math.sin(p.phase) * 0.3;
        p.phase += 0.01;

        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }

        // Mouse Repulsion Physics
        let dx = mouse.x - p.x;
        let dy = mouse.y - p.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < mouse.radius) {
          let forceDirectionX = dx / distance;
          let forceDirectionY = dy / distance;
          let maxDistance = mouse.radius;
          let force = (maxDistance - distance) / maxDistance;
          let directionX = (forceDirectionX * force * 5);
          let directionY = (forceDirectionY * force * 5);
          
          p.x -= directionX;
          p.y -= directionY;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        
        // Sharp shining gold particles
        ctx.shadowBlur = 8;
        ctx.shadowColor = 'rgba(212, 175, 55, 0.8)';
        ctx.fillStyle = 'rgba(212, 175, 55, 0.9)';
        
        ctx.fill();
      });
      animationFrame = requestAnimationFrame(render);
    };
    render();
    
    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 pointer-events-none mix-blend-screen opacity-70 z-50"
      style={{ top: 0, left: 0, width: '100vw', height: '100vh' }}
    />
  );
}
