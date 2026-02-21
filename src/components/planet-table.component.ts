
import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartData } from '../services/astrology.service';

@Component({
  selector: 'app-planet-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="w-full border shadow-xl rounded-sm overflow-hidden font-sans transition-colors duration-500"
         [class.bg-[#e7e5e4]]="!isDark()"
         [class.border-[#d6d3d1]]="!isDark()"
         [class.bg-stone-900]="isDark()"
         [class.border-stone-700]="isDark()">
      
      <!-- Table Header -->
      <div class="px-4 py-3 border-b flex justify-between items-center transition-colors duration-500"
           [class.bg-[#d6d3d1]]="!isDark()"
           [class.border-[#d6d3d1]]="!isDark()"
           [class.bg-stone-800]="isDark()"
           [class.border-stone-700]="isDark()">
        <div class="flex items-center gap-3">
          <div class="w-2 h-2 rotate-45" [class.bg-stone-600]="!isDark()" [class.bg-stone-400]="isDark()"></div>
          <h3 class="text-xs font-bold uppercase tracking-[0.2em]"
              [class.text-stone-700]="!isDark()"
              [class.text-stone-300]="isDark()">Planetary Data</h3>
        </div>
      </div>
      
      <div class="overflow-x-auto">
        <table class="w-full text-left" 
               [class.text-stone-900]="!isDark()" 
               [class.text-stone-200]="isDark()">
          <thead class="text-[10px] font-bold border-b uppercase tracking-widest transition-colors duration-500"
                 [class.bg-[#e7e5e4]]="!isDark()"
                 [class.text-stone-600]="!isDark()"
                 [class.border-[#d6d3d1]]="!isDark()"
                 [class.bg-stone-900]="isDark()"
                 [class.text-stone-500]="isDark()"
                 [class.border-stone-800]="isDark()">
            <tr>
              <th class="px-4 py-3">Planet</th>
              <th class="px-4 py-3">Deg</th>
              <th class="px-4 py-3">Rasi</th>
              <th class="px-4 py-3">Lord</th>
              <th class="px-4 py-3">Nakshatra</th>
              <th class="px-4 py-3">N. Lord</th>
            </tr>
          </thead>
          <tbody class="divide-y transition-colors duration-500"
                 [class.divide-[#d6d3d1]]="!isDark()"
                 [class.divide-stone-800]="isDark()">
            @for (planet of sortedPlanets(); track planet.name) {
              <tr class="transition-colors group"
                  [class.hover:bg-[#d6d3d1]/30]="!isDark()"
                  [class.hover:bg-stone-800/30]="isDark()">
                <!-- Planets Column -->
                <td class="px-4 py-3 flex items-center gap-2">
                  <span class="tracking-wide text-sm font-bold"
                        [class.text-black]="!isDark()"
                        [class.text-stone-200]="isDark()">
                    {{ planet.name }}
                  </span>
                  @if (planet.isRetrograde) {
                    <span class="text-[8px] font-black px-1 py-0.5 border ml-auto"
                          [class.border-red-300]="!isDark()"
                          [class.text-red-700]="!isDark()"
                          [class.border-red-900]="isDark()"
                          [class.text-red-400]="isDark()">R</span>
                  }
                </td>
                
                <!-- Degrees (in Sign) -->
                <td class="px-4 py-3 font-mono text-xs font-medium opacity-80">{{ planet.degree }}</td>
                
                <!-- Rasi -->
                <td class="px-4 py-3 flex items-center gap-2">
                  <span class="tracking-wide text-sm font-bold">{{ planet.sign }}</span>
                </td>
                
                <!-- Rasi Lord -->
                <td class="px-4 py-3 text-sm tracking-wide font-medium opacity-80">{{ planet.rasiLord }}</td>
                
                <!-- Nakshatra -->
                <td class="px-4 py-3 text-sm tracking-wide font-bold"
                    [class.text-amber-800]="!isDark()"
                    [class.text-amber-600]="isDark()">
                  {{ planet.nakshatra }}
                </td>
                
                <!-- Nakshatra Lord -->
                <td class="px-4 py-3 text-sm tracking-wide font-medium opacity-80">{{ planet.nakshatraLord }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`:host { display: block; }`]
})
export class PlanetTableComponent {
  chartData = input.required<ChartData>();
  isDark = input<boolean>(false);

  sortedPlanets = computed(() => {
    const list = [...this.chartData().planets];
    return list.sort((a, b) => {
      const order = ['Lagna', 'Surya', 'Chandra', 'Kuja', 'Budha', 'Guru', 'Shukra', 'Shani', 'Rahu', 'Ketu'];
      const idxA = order.indexOf(a.name);
      const idxB = order.indexOf(b.name);
      return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
    });
  });
}
