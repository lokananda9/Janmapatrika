
import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-cosmic-background',
  standalone: true,
  template: `
    <canvas #canvas class="fixed inset-0 w-full h-full pointer-events-none z-0 opacity-60"></canvas>
  `,
  styles: [`:host { display: block; }`]
})
export class CosmicBackgroundComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  
  private ctx!: CanvasRenderingContext2D;
  private animationFrameId: number = 0;
  private particles: Star[] = [];
  private width = 0;
  private height = 0;

  ngAfterViewInit() {
    this.ctx = this.canvasRef.nativeElement.getContext('2d')!;
    this.resize();
    window.addEventListener('resize', this.resize.bind(this));
    this.initParticles();
    this.animate();
  }

  ngOnDestroy() {
    window.removeEventListener('resize', this.resize.bind(this));
    cancelAnimationFrame(this.animationFrameId);
  }

  private resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvasRef.nativeElement.width = this.width;
    this.canvasRef.nativeElement.height = this.height;
  }

  private initParticles() {
    this.particles = [];
    const count = 50; 
    for (let i = 0; i < count; i++) {
      this.particles.push(new Star(this.width, this.height));
    }
  }

  private animate() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    
    this.particles.forEach(p => {
      p.update();
      p.draw(this.ctx);
    });

    this.animationFrameId = requestAnimationFrame(this.animate.bind(this));
  }
}

class Star {
  x: number;
  y: number;
  z: number;
  size: number;
  width: number;
  height: number;
  speed: number;

  constructor(w: number, h: number) {
    this.width = w;
    this.height = h;
    this.x = (Math.random() - 0.5) * w * 2;
    this.y = (Math.random() - 0.5) * h * 2;
    this.z = Math.random() * w;
    this.size = 1.5;
    this.speed = 0.2;
  }

  update() {
    this.z -= this.speed; // Move towards screen
    if (this.z <= 0) {
      this.reset();
    }
  }

  reset() {
    this.z = this.width;
    this.x = (Math.random() - 0.5) * this.width * 2;
    this.y = (Math.random() - 0.5) * this.height * 2;
  }

  draw(ctx: CanvasRenderingContext2D) {
    const x = (this.x / this.z) * this.width + this.width / 2;
    const y = (this.y / this.z) * this.height + this.height / 2;
    
    // Scale size by depth
    const r = (this.size * (this.width / this.z)); 

    // Don't draw if out of bounds
    if (x < 0 || x > this.width || y < 0 || y > this.height) return;

    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(87, 83, 78, ${1 - (this.z / this.width)})`; // stone-600
    ctx.fill();
  }
}
