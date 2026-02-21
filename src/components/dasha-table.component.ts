
import { Component, input, signal, computed, effect, ViewChildren, ElementRef, QueryList } from '@angular/core';
import { DatePipe, CommonModule } from '@angular/common';
import { AstrologyService, DashaItem } from '../services/astrology.service';
import { gsap } from 'gsap';

@Component({
  selector: 'app-dasha-table',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <div class="w-full font-sans">
      
      <!-- Breadcrumb Navigation -->
      <div class="flex items-center justify-center gap-4 mb-6 text-sm font-bold tracking-wide select-none transition-colors"
           [class.text-stone-800]="!isDark()"
           [class.text-stone-300]="isDark()">
        
        <div class="flex items-center gap-2 transition-opacity duration-300"
             [class.opacity-100]="level() >= 1"
             [class.opacity-40]="level() < 1">
          <div class="w-6 h-6 rounded-full flex items-center justify-center text-xs text-white shadow-md bg-amber-600">1</div>
          <span>Mahadasha</span>
        </div>

        <span class="text-xl opacity-40">→</span>

        <div class="flex items-center gap-2 transition-opacity duration-300"
             [class.opacity-100]="level() >= 2"
             [class.opacity-40]="level() < 2">
          <div class="w-6 h-6 rounded-full border flex items-center justify-center text-xs shadow-sm"
               [class.bg-transparent]="level() < 2"
               [class.text-stone-400]="level() < 2 && !isDark()"
               [class.text-stone-600]="level() < 2 && isDark()"
               [class.border-stone-300]="!isDark()"
               [class.border-stone-600]="isDark()"
               [class.bg-amber-600]="level() >= 2"
               [class.text-white]="level() >= 2"
               [class.border-transparent]="level() >= 2">2</div>
          <span>Antar Dasha</span>
        </div>

        <span class="text-xl opacity-40">→</span>

        <div class="flex items-center gap-2 transition-opacity duration-300"
             [class.opacity-100]="level() >= 3"
             [class.opacity-40]="level() < 3">
          <div class="w-6 h-6 rounded-full border flex items-center justify-center text-xs shadow-sm"
               [class.bg-transparent]="level() < 3"
               [class.text-stone-400]="level() < 3 && !isDark()"
               [class.text-stone-600]="level() < 3 && isDark()"
               [class.border-stone-300]="!isDark()"
               [class.border-stone-600]="isDark()"
               [class.bg-amber-600]="level() >= 3"
               [class.text-white]="level() >= 3"
               [class.border-transparent]="level() >= 3">3</div>
          <span>Pratyantar Dasha</span>
        </div>

      </div>

      <!-- Table Container -->
      <div class="overflow-hidden rounded-lg shadow-lg border transition-all duration-500"
           [class.bg-[#f5f5f0]]="!isDark()"
           [class.border-[#d6d3d1]]="!isDark()"
           [class.bg-stone-900]="isDark()"
           [class.border-stone-700]="isDark()">
        
        <!-- Table Header -->
        <div class="grid grid-cols-4 text-center py-4 font-bold text-sm uppercase tracking-wider border-b transition-colors duration-500"
             [class.bg-[#dad7cd]]="!isDark()"
             [class.text-stone-700]="!isDark()"
             [class.border-[#c2c0b8]]="!isDark()"
             [class.bg-stone-800]="isDark()"
             [class.text-stone-300]="isDark()"
             [class.border-stone-700]="isDark()">
          <div class="pl-4 text-left">
            @if(level() === 1) { Mahadasha }
            @else if(level() === 2) { Antar Dasha }
            @else { Pratyantar Dasha }
          </div>
          <div>Start Date</div>
          <div>End Date</div>
          <div>Duration</div>
        </div>

        <!-- Table Body -->
        <div class="divide-y transition-colors duration-500"
             [class.divide-stone-300]="!isDark()"
             [class.divide-stone-800]="isDark()">
          
          @for (row of currentRows(); track row.planet) {
            <div #tableRow class="grid grid-cols-4 items-center py-3 px-4 text-sm transition-colors cursor-pointer group opacity-0"
                 [class.hover:bg-white]="!isDark()"
                 [class.text-stone-800]="!isDark()"
                 [class.hover:bg-stone-800]="isDark()"
                 [class.text-stone-300]="isDark()"
                 (click)="drillDown(row)">
              
              <!-- Planet Name with Icon -->
              <div class="flex items-center gap-2 font-bold">
                <span class="text-xs transition-transform group-hover:translate-x-1 text-amber-600">➜</span>
                {{ row.planet }}
              </div>

              <div class="text-center font-mono opacity-80">{{ row.startDate | date:'dd-MM-yyyy' }}</div>
              <div class="text-center font-mono opacity-80">{{ row.endDate | date:'dd-MM-yyyy' }}</div>
              <div class="text-center font-mono font-medium">
                @if(row.durationYear > 0) { {{ row.durationYear }} Y }
                @if(row.durationMonth > 0) { {{ row.durationMonth }} M }
                @if(row.durationDay > 0) { {{ row.durationDay }} D }
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Level Up Button -->
      @if (level() > 1) {
        <div class="flex justify-center mt-6 fade-in">
          <button (click)="levelUp()"
                  class="flex items-center gap-2 px-6 py-2 rounded-md shadow-md font-bold text-sm transition-transform active:scale-95 border"
                  [class.bg-amber-200]="!isDark()"
                  [class.text-stone-800]="!isDark()"
                  [class.border-amber-300]="!isDark()"
                  [class.bg-stone-800]="isDark()"
                  [class.text-stone-300]="isDark()"
                  [class.border-stone-600]="isDark()">
            <span>←</span> Level Up
          </button>
        </div>
      }

    </div>
  `,
  styles: [`
    .fade-in { animation: fadeIn 0.3s ease-out forwards; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class DashaTableComponent {
  moonLongitude = input.required<number>();
  birthDate = input.required<string>(); // ISO string
  birthTime = input.required<string>();
  isDark = input<boolean>(false);

  level = signal<number>(1);
  history = signal<DashaItem[]>([]); 
  currentRows = signal<DashaItem[]>([]);

  @ViewChildren('tableRow') tableRows!: QueryList<ElementRef>;

  constructor(private astroService: AstrologyService) {
    effect(() => {
      const lon = this.moonLongitude();
      const date = this.birthDate();
      const time = this.birthTime();
      
      if (lon && date && time) {
        const dt = new Date(`${date}T${time}`);
        this.level.set(1);
        this.history.set([]);
        this.currentRows.set(this.astroService.calculateMahadashas(lon, dt));
        this.animateRows();
      }
    });
  }

  animateRows() {
    setTimeout(() => {
        if (this.tableRows) {
            gsap.fromTo(
                this.tableRows.map(r => r.nativeElement),
                { opacity: 0, x: -10 },
                { opacity: 1, x: 0, duration: 0.3, stagger: 0.03, ease: 'power1.out' }
            );
        }
    }, 50);
  }

  drillDown(item: DashaItem) {
    if (this.level() >= 3) return;

    const nextLevel = this.level() + 1;
    this.history.update(h => [...h, item]);
    
    let nextRows: DashaItem[] = [];

    if (nextLevel === 2) {
      nextRows = this.astroService.calculateAntarDashas(item.planet, item.startDate);
    } else if (nextLevel === 3) {
      const parts = item.planet.split(' - ');
      const grandParent = parts[0];
      const parent = parts[1];
      nextRows = this.astroService.calculatePratyantarDashas(grandParent, parent, item.startDate);
    }

    this.currentRows.set(nextRows);
    this.level.set(nextLevel);
    this.animateRows();
  }

  levelUp() {
    if (this.level() <= 1) return;

    const currentHistory = this.history();
    const prevItem = currentHistory[currentHistory.length - 2]; 
    const newHistory = currentHistory.slice(0, -1);
    
    this.history.set(newHistory);
    this.level.update(l => l - 1);

    if (this.level() === 1) {
      const dt = new Date(`${this.birthDate()}T${this.birthTime()}`);
      this.currentRows.set(this.astroService.calculateMahadashas(this.moonLongitude(), dt));
    } else if (this.level() === 2) {
      const mahadashaItem = prevItem; 
      if (mahadashaItem) {
         this.currentRows.set(this.astroService.calculateAntarDashas(mahadashaItem.planet, mahadashaItem.startDate));
      }
    }
    this.animateRows();
  }
}
