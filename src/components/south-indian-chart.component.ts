
import { Component, input, computed } from '@angular/core';
import { PlanetData } from '../services/astrology.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-south-indian-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="w-full mx-auto aspect-square select-none font-serif">
      <div class="w-full h-full relative transition-colors duration-500 shadow-xl"
           [class.bg-[#f5f2ea]]="!isDark()"
           [class.border-[#a8a29e]]="!isDark()"
           [class.border-2]="!isDark()"
           [class.bg-[#292524]]="isDark()"
           [class.border-stone-600]="isDark()"
           [class.border]="isDark()">
           
        <!-- Inner Frame -->
        <div class="absolute inset-1 border pointer-events-none z-20 transition-colors duration-500"
             [class.border-[#d6d3d1]]="!isDark()"
             [class.border-stone-700]="isDark()"></div>
        
        <!-- Title Label -->
        <div class="absolute -top-8 left-0 right-0 text-center text-xs font-bold tracking-[0.3em] uppercase transition-colors duration-500"
             [class.text-stone-500]="!isDark()"
             [class.text-stone-400]="isDark()">
          {{ title() }}
        </div>

        <!-- Grid -->
        <div class="grid grid-cols-4 grid-rows-4 h-full w-full">
          
          <!-- Helper Template for Cells -->
          <ng-template #cell let-sign="sign" let-num="num" let-borderClass="borderClass">
             <div class="chart-cell" 
                  [class.border-theme-light]="!isDark()"
                  [class.border-theme-dark]="isDark()"
                  [ngClass]="borderClass">
                <span class="sign-number" [class.text-stone-500]="!isDark()" [class.text-stone-600]="isDark()">{{ num }}</span>
                <div class="planet-container">
                  @for(p of getPlanets(sign); track p.name) { 
                    <span class="planet-pill" 
                          [class.text-[#292524]]="!isDark()"
                          [class.text-[#e7e5e4]]="isDark()"
                          [class.retro]="p.isRetrograde">{{ formatPlanet(p) }}</span> 
                  }
                </div>
             </div>
          </ng-template>

          <!-- Row 1 -->
          <ng-container *ngTemplateOutlet="cell; context: { sign: 'Meena', num: 12, borderClass: 'border-b border-r' }"></ng-container>
          <ng-container *ngTemplateOutlet="cell; context: { sign: 'Mesha', num: 1, borderClass: 'border-b border-r' }"></ng-container>
          <ng-container *ngTemplateOutlet="cell; context: { sign: 'Vrishabha', num: 2, borderClass: 'border-b border-r' }"></ng-container>
          <ng-container *ngTemplateOutlet="cell; context: { sign: 'Mithuna', num: 3, borderClass: 'border-b' }"></ng-container>

          <!-- Row 2 -->
          <ng-container *ngTemplateOutlet="cell; context: { sign: 'Kumbha', num: 11, borderClass: 'border-b border-r' }"></ng-container>
          
          <!-- Center Info -->
          <div class="col-span-2 row-span-2 flex flex-col items-center justify-center text-center p-4 relative z-10 border-b"
               [class.border-theme-light]="!isDark()"
               [class.border-theme-dark]="isDark()"
               [class.text-[#57534e]]="!isDark()"
               [class.text-stone-400]="isDark()">
             <div class="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center">
                <svg viewBox="0 0 100 100" class="w-full h-full" fill="currentColor"><rect x="20" y="20" width="60" height="60" transform="rotate(45 50 50)" /></svg>
             </div>
             <span class="text-4xl font-serif opacity-20" 
                   [class.text-stone-400]="!isDark()"
                   [class.text-stone-600]="isDark()">ॐ</span>
          </div>

          <ng-container *ngTemplateOutlet="cell; context: { sign: 'Karkataka', num: 4, borderClass: 'border-b border-l' }"></ng-container>

          <!-- Row 3 -->
          <ng-container *ngTemplateOutlet="cell; context: { sign: 'Makara', num: 10, borderClass: 'border-b border-r' }"></ng-container>
          <!-- Center merged col logic handled by row span above, this is right side -->
          <ng-container *ngTemplateOutlet="cell; context: { sign: 'Simha', num: 5, borderClass: 'border-b border-l' }"></ng-container>

          <!-- Row 4 -->
          <ng-container *ngTemplateOutlet="cell; context: { sign: 'Dhanu', num: 9, borderClass: 'border-r' }"></ng-container>
          <ng-container *ngTemplateOutlet="cell; context: { sign: 'Vrischika', num: 8, borderClass: 'border-r' }"></ng-container>
          <ng-container *ngTemplateOutlet="cell; context: { sign: 'Tula', num: 7, borderClass: 'border-r' }"></ng-container>
          <ng-container *ngTemplateOutlet="cell; context: { sign: 'Kanya', num: 6, borderClass: '' }"></ng-container>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .chart-cell {
      padding: 2px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      position: relative;
      min-height: 70px;
    }
    .border-theme-light { border-color: #a8a29e; }
    .border-theme-dark { border-color: #57534e; }
    
    .sign-number {
      position: absolute;
      top: 1px;
      right: 2px;
      font-size: 0.55rem;
      font-weight: 700;
      opacity: 0.4;
    }
    .planet-container {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      align-items: center;
      gap: 2px;
      width: 100%;
      height: 100%;
      overflow: hidden;
      padding-top: 12px;
    }
    .planet-pill {
      font-size: 0.75rem; 
      font-weight: 700;
      line-height: 1.2;
      font-family: 'Lato', sans-serif;
      padding: 1px 2px;
      text-align: center;
      white-space: nowrap;
    }
    .planet-pill.retro {
      color: #991b1b; /* Red-700 */
      text-decoration: underline;
      text-decoration-color: #fca5a5;
    }
    /* Dark mode override for retro color to be visible but distinct */
    :host-context(.dark) .planet-pill.retro {
      color: #f87171; /* Red-400 */
      text-decoration-color: #7f1d1d;
    }
  `]
})
export class SouthIndianChartComponent {
  planets = input.required<PlanetData[]>();
  title = input<string>('Chart');
  isDark = input<boolean>(false);

  getPlanets(sign: string): PlanetData[] {
    return this.planets().filter(p => p.sign === sign);
  }

  formatPlanet(planet: PlanetData): string {
    let name = planet.name;
    if (planet.isRetrograde && name !== 'Rahu' && name !== 'Ketu') {
        return `${name} R`;
    }
    return name;
  }
}
