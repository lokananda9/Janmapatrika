import { Directive, ElementRef, HostListener, Input, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appTilt3d]',
  standalone: true
})
export class Tilt3dDirective {
  @Input() tiltAmount = 10; // Max rotation in degrees

  constructor(private el: ElementRef, private renderer: Renderer2) {
    this.renderer.setStyle(this.el.nativeElement, 'transition', 'transform 0.1s ease-out');
    this.renderer.setStyle(this.el.nativeElement, 'transform-style', 'preserve-3d');
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    const rect = this.el.nativeElement.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    // Mouse position relative to element
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    
    // Calculate rotation (-1 to 1 range -> -tiltAmount to tiltAmount)
    const rotateY = ((mouseX / width) * 2 - 1) * this.tiltAmount;
    const rotateX = ((mouseY / height) * 2 - 1) * -this.tiltAmount;

    this.renderer.setStyle(
      this.el.nativeElement,
      'transform',
      `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`
    );
  }

  @HostListener('mouseleave')
  onMouseLeave() {
    this.renderer.setStyle(
      this.el.nativeElement,
      'transform',
      `perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)`
    );
    // Add a slightly slower transition for the reset so it feels smooth
    this.renderer.setStyle(this.el.nativeElement, 'transition', 'transform 0.5s ease-out');
  }
  
  @HostListener('mouseenter')
  onMouseEnter() {
    // Faster transition for reaction
    this.renderer.setStyle(this.el.nativeElement, 'transition', 'transform 0.1s ease-out');
  }
}