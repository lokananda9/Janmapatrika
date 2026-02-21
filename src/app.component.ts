
import { Component, inject, signal, computed, ViewChild, ElementRef, AfterViewInit, effect } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { BirthFormComponent } from './components/birth-form.component';
import { SouthIndianChartComponent } from './components/south-indian-chart.component';
import { PlanetTableComponent } from './components/planet-table.component';
import { DashaTableComponent } from './components/dasha-table.component';
import { CosmicBackgroundComponent } from './components/cosmic-background.component';
import { AstrologyService, ChartData, PlanetData } from './services/astrology.service';
import { StorageService } from './services/storage.service';
import { gsap } from 'gsap';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, 
    BirthFormComponent, 
    SouthIndianChartComponent, 
    PlanetTableComponent, 
    DashaTableComponent,
    CosmicBackgroundComponent,
    DatePipe
  ],
  template: `
    <div class="min-h-screen w-full relative overflow-hidden flex flex-col items-center py-2 px-1 md:px-2 font-serif transition-colors duration-700"
         [class.dark]="isDarkMode()"
         [class.bg-[#f5f2ea]]="!isDarkMode()"
         [class.text-[#44403c]]="!isDarkMode()"
         [class.bg-[#1c1917]]="isDarkMode()"
         [class.text-[#e7e5e4]]="isDarkMode()">
      
      <!-- Theme Toggle -->
      <div class="absolute top-4 right-4 z-50">
        <button (click)="toggleTheme()" 
                class="p-3 rounded-full transition-all duration-300 shadow-lg border hover:scale-110"
                [class.bg-white]="!isDarkMode()"
                [class.border-stone-200]="!isDarkMode()"
                [class.text-amber-500]="!isDarkMode()"
                [class.bg-[#292524]]="isDarkMode()"
                [class.border-stone-700]="isDarkMode()"
                [class.text-stone-400]="isDarkMode()">
          @if(!isDarkMode()) {
            <!-- Sun Icon -->
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/></svg>
          } @else {
            <!-- Moon Icon -->
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          }
        </button>
      </div>

      <!-- Interactive Cosmic Background -->
      <app-cosmic-background class="absolute inset-0 z-0 transition-opacity duration-1000" 
                             [class.opacity-60]="!isDarkMode()" 
                             [class.opacity-30]="isDarkMode()">
      </app-cosmic-background>

      <main class="relative z-10 w-full flex flex-col gap-4 max-w-full mt-12">
        
        <!-- Input Form -->
        @if (!hasData()) {
          <div #formRef class="w-full flex justify-center py-4 opacity-0 translate-y-10">
            <app-birth-form 
              (submitForm)="generateChart($event)"
              [isProcessing]="isLoading()"
              [isDark]="isDarkMode()"
              class="w-full max-w-lg"
            ></app-birth-form>
          </div>
        } @else {
          <div class="w-full flex flex-col items-center gap-6 animate-in fade-in duration-700">
            
            <!-- Result Header -->
            <div class="text-center space-y-1">
              <h2 class="text-2xl font-bold tracking-wide transition-colors"
                  [class.text-stone-800]="!isDarkMode()"
                  [class.text-stone-200]="isDarkMode()">Birth Chart</h2>
              <div class="text-sm font-medium tracking-wide transition-colors"
                   [class.text-stone-600]="!isDarkMode()"
                   [class.text-stone-400]="isDarkMode()">
                {{ chartData()?.meta?.place }} • {{ chartData()?.meta?.date | date:'yyyy-MM-dd' }} • {{ chartData()?.meta?.time }}
              </div>
              <div class="text-xs tracking-wider opacity-80 transition-colors"
                   [class.text-stone-500]="!isDarkMode()"
                   [class.text-stone-500]="isDarkMode()">
                Ayanamsa (Lahiri): {{ formatAyanamsa(chartData()?.ayanamsa) }} • Lagna: {{ chartData()?.ascendantSign }}
              </div>
            </div>

            <!-- Tabs -->
            <div class="flex items-center gap-4 p-1 rounded-full border shadow-sm backdrop-blur-sm transition-colors duration-500"
                 [class.bg-white/50]="!isDarkMode()"
                 [class.border-stone-200]="!isDarkMode()"
                 [class.bg-stone-900/50]="isDarkMode()"
                 [class.border-stone-800]="isDarkMode()">
                 
              <button 
                (click)="activeTab.set('charts')"
                class="px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all"
                [class.bg-stone-800]="!isDarkMode() && activeTab() === 'charts'"
                [class.text-white]="!isDarkMode() && activeTab() === 'charts'"
                [class.text-stone-600]="!isDarkMode() && activeTab() !== 'charts'"
                [class.bg-stone-200]="isDarkMode() && activeTab() === 'charts'"
                [class.text-stone-900]="isDarkMode() && activeTab() === 'charts'"
                [class.text-stone-400]="isDarkMode() && activeTab() !== 'charts'"
                [class.hover:bg-stone-200]="!isDarkMode() && activeTab() !== 'charts'"
                [class.hover:bg-stone-800]="isDarkMode() && activeTab() !== 'charts'">
                Charts
              </button>
              
              <button 
                (click)="activeTab.set('planets')"
                class="px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all"
                [class.bg-stone-800]="!isDarkMode() && activeTab() === 'planets'"
                [class.text-white]="!isDarkMode() && activeTab() === 'planets'"
                [class.text-stone-600]="!isDarkMode() && activeTab() !== 'planets'"
                [class.bg-stone-200]="isDarkMode() && activeTab() === 'planets'"
                [class.text-stone-900]="isDarkMode() && activeTab() === 'planets'"
                [class.text-stone-400]="isDarkMode() && activeTab() !== 'planets'"
                [class.hover:bg-stone-200]="!isDarkMode() && activeTab() !== 'planets'"
                [class.hover:bg-stone-800]="isDarkMode() && activeTab() !== 'planets'">
                Planets
              </button>
            </div>

            <!-- Tab Content -->
            <div class="w-full max-w-[98%] mt-12">
              
              <!-- CHARTS TAB -->
              @if (activeTab() === 'charts') {
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
                  
                  <!-- Left: Bhava Chart -->
                  <div class="w-full aspect-square order-2 lg:order-1">
                    <app-south-indian-chart 
                      [planets]="bhavaPlanets()" 
                      [isDark]="isDarkMode()"
                      title="Bhava Chart">
                    </app-south-indian-chart>
                  </div>

                  <!-- Middle: Birth Chart (D1) -->
                  <div class="w-full aspect-square order-1 lg:order-2 lg:-mt-6 lg:scale-105 transition-transform z-10">
                    <app-south-indian-chart 
                      [planets]="chartData()!.planets" 
                      [isDark]="isDarkMode()"
                      title="Rasi Chart (D1)">
                    </app-south-indian-chart>
                  </div>

                  <!-- Right: Navamsa Chart (D9) -->
                  <div class="w-full aspect-square order-3">
                    <app-south-indian-chart 
                      [planets]="navamsaPlanets()" 
                      [isDark]="isDarkMode()"
                      title="Navamsa Chart (D9)">
                    </app-south-indian-chart>
                  </div>

                </div>
              }

              <!-- PLANETS TAB (Combined Nakshatra & Dasha) -->
              @if (activeTab() === 'planets') {
                <div class="grid grid-cols-1 xl:grid-cols-2 gap-8 w-full animate-in zoom-in-95 duration-300">
                  
                  <!-- Left: Planetary Data -->
                  <div class="w-full">
                    <app-planet-table [chartData]="chartData()!" [isDark]="isDarkMode()"></app-planet-table>
                  </div>

                  <!-- Right: Dasha Table -->
                  <div class="w-full">
                    <app-dasha-table
                       [moonLongitude]="getMoonLon()"
                       [birthDate]="chartData()!.meta.date"
                       [birthTime]="chartData()!.meta.time"
                       [isDark]="isDarkMode()">
                    </app-dasha-table>
                  </div>

                </div>
              }

              <!-- Actions -->
              <div class="flex flex-wrap gap-4 justify-center mt-12 pb-8">
                 
                 <!-- Save Button -->
                 <button (click)="saveChart()" 
                   class="text-xs font-bold uppercase tracking-widest px-8 py-3 rounded-sm border transition-all hover:scale-105 shadow-md relative overflow-hidden group"
                   [class.border-stone-800]="!isDarkMode()"
                   [class.text-stone-800]="!isDarkMode()"
                   [class.bg-[#fdfbf7]]="!isDarkMode()"
                   [class.border-stone-500]="isDarkMode()"
                   [class.text-stone-300]="isDarkMode()"
                   [class.bg-[#292524]]="isDarkMode()">
                   <span class="relative z-10 flex items-center gap-2">
                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                     Save Chart
                   </span>
                 </button>

                 <!-- New Button -->
                 <button (click)="reset()" 
                   class="text-xs font-bold uppercase tracking-widest px-8 py-3 rounded-sm border transition-all hover:scale-105 shadow-md relative overflow-hidden group"
                   [class.border-stone-400]="!isDarkMode()"
                   [class.text-stone-700]="!isDarkMode()"
                   [class.bg-[#e7e5e4]]="!isDarkMode()"
                   [class.border-stone-600]="isDarkMode()"
                   [class.text-stone-400]="isDarkMode()"
                   [class.bg-stone-800]="isDarkMode()">
                   <span class="relative z-10">New Horoscope</span>
                 </button>
              </div>

            </div>
          </div>
        }
      </main>
    </div>
  `,
  styles: [`
    .font-samarkan { font-family: 'Samarkan', sans-serif; }
  `]
})
export class AppComponent implements AfterViewInit {
  private astroService = inject(AstrologyService);
  private storageService = inject(StorageService);
  
  hasData = signal(false);
  isLoading = signal(false);
  isDarkMode = signal(false);
  chartData = signal<ChartData | null>(null);
  activeTab = signal<'charts' | 'planets'>('charts');

  @ViewChild('formRef') formRef!: ElementRef;

  constructor() {}

  ngAfterViewInit() {
    this.animateIntro();
  }

  toggleTheme() {
    this.isDarkMode.update(d => !d);
  }

  animateIntro() {
    const timeline = gsap.timeline();
    timeline
      .to(this.formRef.nativeElement, { opacity: 1, y: 0, duration: 1, ease: 'back.out(1.7)' });
  }

  async generateChart(details: { date: string; time: string; place: string; approximate?: boolean }) {
    this.isLoading.set(true);
    gsap.to(this.formRef.nativeElement, { scale: 0.95, opacity: 0.5, duration: 0.5 });
    
    try {
      const data = await this.astroService.calculateChart(details);
      // Artificial delay
      await new Promise(r => setTimeout(r, 800));
      
      this.chartData.set(data);
      this.hasData.set(true);
      this.activeTab.set('charts'); // Default to charts
    } catch (e) {
      console.error(e);
      alert('The celestial calculation encountered a void. Please try again.');
      gsap.to(this.formRef.nativeElement, { scale: 1, opacity: 1, duration: 0.3 });
    } finally {
      this.isLoading.set(false);
    }
  }

  async saveChart() {
    const data = this.chartData();
    if (!data) return;

    const name = window.prompt("Enter name for this horoscope:");
    if (name && name.trim()) {
      await this.storageService.saveProfile({
        name: name.trim(),
        date: data.meta.date,
        time: data.meta.time,
        place: data.meta.place
      });
      alert('Horoscope saved successfully.');
    }
  }

  reset() {
    this.hasData.set(false);
    this.chartData.set(null);
    this.isLoading.set(false);
    setTimeout(() => this.animateIntro(), 100);
  }

  // Derived Data Helpers

  navamsaPlanets = computed(() => {
    const data = this.chartData();
    if (!data) return [];
    return data.planets.map(p => ({
      ...p,
      sign: p.navamsaSign 
    }));
  });

  bhavaPlanets = computed(() => {
    const data = this.chartData();
    if (!data) return [];

    const ascPlanet = data.planets.find(p => p.name === 'Lagna');
    if (!ascPlanet) return [];

    const ascSignIndex = this.astroService.SIGNS.indexOf(ascPlanet.sign);
    
    return data.planets.map(planet => {
        const houseNum = planet.house; 
        const targetSignIndex = (ascSignIndex + (houseNum - 1)) % 12;
        const targetSign = this.astroService.SIGNS[targetSignIndex];

        return {
            ...planet,
            sign: targetSign
        };
    });
  });

  getMoonLon(): number {
    const p = this.chartData()?.planets.find(x => x.name === 'Chandra');
    return p ? p.longitude : 0;
  }

  formatAyanamsa(val: number | undefined): string {
    if (!val) return '';
    return val.toFixed(3) + '°';
  }
}
