
import { Component, output, input, inject, signal, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { CityService, City } from '../services/city.service';
import { StorageService, SavedProfile } from '../services/storage.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-birth-form',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  providers: [DatePipe],
  template: `
    <!-- Perspective Container -->
    <div class="w-full max-w-md mx-auto perspective-1000 h-[550px]">
      
      <!-- Flippable Card Wrapper -->
      <div class="relative w-full h-full transition-transform duration-700 transform-style-3d"
           [class.rotate-y-180]="isFlipped()">

        <!-- FRONT SIDE (Input Form) -->
        <div class="absolute inset-0 backface-hidden w-full h-full p-8 rounded-2xl backdrop-blur-xl border shadow-2xl overflow-hidden flex flex-col transition-colors duration-500"
             [class.bg-[#fdfbf7]/90]="!isDark()"
             [class.border-white/60]="!isDark()"
             [class.shadow-stone-200/50]="!isDark()"
             [class.bg-[#292524]/90]="isDark()"
             [class.border-stone-600]="isDark()"
             [class.shadow-black/50]="isDark()"
             (dblclick)="toggleFlip()"
             title="Double click (or tap link) to see saved charts">

          <!-- Header -->
          <div class="text-center mb-8 relative z-10 shrink-0">
            <h2 class="font-serif text-2xl tracking-[0.2em] uppercase mb-2 font-normal transition-colors"
                [class.text-stone-800]="!isDark()"
                [class.text-stone-200]="isDark()">
              Enter Birth Details
            </h2>
            <div class="h-px w-12 mx-auto opacity-50 mb-2 transition-colors"
                 [class.bg-stone-400]="!isDark()"
                 [class.bg-stone-600]="isDark()"></div>
            
            <button type="button" 
                    class="text-[9px] uppercase tracking-widest transition-colors underline underline-offset-4"
                    [class.text-stone-400]="!isDark()"
                    [class.hover:text-stone-600]="!isDark()"
                    [class.decoration-stone-300]="!isDark()"
                    [class.text-stone-500]="isDark()"
                    [class.hover:text-stone-300]="isDark()"
                    [class.decoration-stone-600]="isDark()"
                    (click)="toggleFlip()">
              (Double Tap for Saved Profiles)
            </button>
          </div>

          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-6 relative z-10 flex-grow flex flex-col justify-center">
            
            <!-- Date Input -->
            <div class="group relative">
              <label class="block text-[10px] uppercase tracking-widest font-bold mb-2 ml-1 opacity-50 transition-opacity group-focus-within:opacity-100"
                     [class.text-stone-500]="!isDark()"
                     [class.text-stone-400]="isDark()">
                Date of Birth
              </label>
              <div class="relative flex items-center border-b transition-all duration-500"
                   [class.border-stone-300]="!isDark()"
                   [class.group-focus-within:border-stone-800]="!isDark()"
                   [class.border-stone-600]="isDark()"
                   [class.group-focus-within:border-stone-400]="isDark()">
                <input type="date"
                       formControlName="date"
                       [max]="maxDate"
                       required
                       class="w-full bg-transparent py-2 text-lg font-serif outline-none transition-colors appearance-none cursor-pointer"
                       [class.text-stone-800]="!isDark()"
                       [class.placeholder-stone-300]="!isDark()"
                       [class.text-stone-200]="isDark()"
                       [class.placeholder-stone-600]="isDark()">
              </div>
            </div>

            <!-- Time Input -->
            <div class="group relative">
              <label class="block text-[10px] uppercase tracking-widest font-bold mb-2 ml-1 opacity-50 transition-opacity group-focus-within:opacity-100"
                     [class.text-stone-500]="!isDark()"
                     [class.text-stone-400]="isDark()">
                Time of Birth
              </label>
              <div class="relative flex items-center border-b transition-all duration-500"
                   [class.border-stone-300]="!isDark()"
                   [class.group-focus-within:border-stone-800]="!isDark()"
                   [class.border-stone-600]="isDark()"
                   [class.group-focus-within:border-stone-400]="isDark()">
                <input type="time"
                       formControlName="time"
                       required
                       class="w-full bg-transparent py-2 text-lg font-serif outline-none transition-colors appearance-none cursor-pointer"
                       [class.text-stone-800]="!isDark()"
                       [class.text-stone-200]="isDark()">
              </div>
            </div>

            <!-- Place Input -->
            <div class="group relative">
              <label class="block text-[10px] uppercase tracking-widest font-bold mb-2 ml-1 opacity-50 transition-opacity group-focus-within:opacity-100"
                     [class.text-stone-500]="!isDark()"
                     [class.text-stone-400]="isDark()">
                Place of Birth
              </label>
              <div class="relative flex items-center border-b transition-all duration-500"
                   [class.border-stone-300]="!isDark()"
                   [class.group-focus-within:border-stone-800]="!isDark()"
                   [class.border-stone-600]="isDark()"
                   [class.group-focus-within:border-stone-400]="isDark()">
                <input type="text" 
                       formControlName="place"
                       (input)="onPlaceInput($event)"
                       (focus)="onPlaceFocus()"
                       (blur)="onPlaceBlur()"
                       placeholder="City, State"
                       autocomplete="off"
                       class="w-full bg-transparent py-2 text-lg font-serif outline-none transition-colors"
                       [class.text-stone-800]="!isDark()"
                       [class.placeholder-stone-300]="!isDark()"
                       [class.text-stone-200]="isDark()"
                       [class.placeholder-stone-600]="isDark()">
                <span class="p-2 pointer-events-none opacity-50 transition-colors"
                      [class.text-stone-400]="!isDark()"
                      [class.group-focus-within:text-stone-800]="!isDark()"
                      [class.text-stone-500]="isDark()"
                      [class.group-focus-within:text-stone-300]="isDark()">
                   <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                </span>

                <!-- Suggestions Dropdown -->
                @if (showSuggestions() && suggestions.length > 0) {
                  <ul class="absolute top-full left-0 w-full mt-2 max-h-48 overflow-y-auto shadow-xl rounded-b-lg border z-50 animate-in fade-in zoom-in-95 duration-200 scrollbar-hide"
                      [class.bg-[#fdfbf7]]="!isDark()"
                      [class.border-stone-200]="!isDark()"
                      [class.bg-stone-800]="isDark()"
                      [class.border-stone-700]="isDark()">
                    @for (city of suggestions; track city.name + city.state) {
                      <li (mousedown)="selectCity(city)"
                          class="px-4 py-3 cursor-pointer transition-colors border-b last:border-0 flex flex-col items-start text-left group"
                          [class.border-stone-100]="!isDark()"
                          [class.hover:bg-stone-100]="!isDark()"
                          [class.border-stone-700]="isDark()"
                          [class.hover:bg-stone-700]="isDark()">
                        <span class="font-serif text-sm"
                              [class.text-stone-900]="!isDark()"
                              [class.text-stone-200]="isDark()">{{ city.name }}</span>
                        <span class="text-[10px] uppercase tracking-wide opacity-50"
                              [class.text-stone-600]="!isDark()"
                              [class.text-stone-400]="isDark()">{{ city.state }}</span>
                      </li>
                    }
                  </ul>
                }
              </div>
            </div>

            <!-- Submit Button -->
            <button type="submit" 
              [disabled]="form.invalid || isProcessing()"
              class="w-full py-4 mt-4 text-xs font-bold tracking-[0.25em] uppercase border transition-all duration-500 relative overflow-hidden group hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed rounded-sm"
              [class.border-stone-800]="!isDark()"
              [class.text-stone-800]="!isDark()"
              [class.hover:bg-stone-800]="!isDark()"
              [class.hover:text-white]="!isDark()"
              [class.border-stone-500]="isDark()"
              [class.text-stone-300]="isDark()"
              [class.hover:bg-stone-700]="isDark()"
              [class.hover:text-white]="isDark()">
              <span class="relative z-10">
                @if(isProcessing()) {
                  <span class="animate-pulse">Divining...</span>
                } @else {
                  <span>Janmapatrikā</span>
                }
              </span>
            </button>

          </form>
        </div>

        <!-- BACK SIDE (Saved Profiles) - Always Dark as per Reference -->
        <div class="absolute inset-0 backface-hidden rotate-y-180 w-full h-full p-8 rounded-2xl backdrop-blur-xl border shadow-2xl overflow-hidden bg-[#292524] border-stone-700 flex flex-col text-[#f5f5f0]"
             (dblclick)="toggleFlip()">
          
          <div class="flex items-center justify-between mb-6 border-b border-stone-600 pb-4">
            <h3 class="font-serif text-xl tracking-widest uppercase text-[#d6d3d1]">Saved Charts</h3>
            <button (click)="toggleFlip()" class="p-2 hover:bg-stone-700 rounded-full transition-colors" title="Back to Form">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-stone-400"><path d="m15 18-6-6 6-6"/></svg>
            </button>
          </div>

          <div class="flex-grow overflow-y-auto scrollbar-dark space-y-3">
            @if (storageService.profiles().length === 0) {
              <div class="h-full flex flex-col items-center justify-center opacity-40 text-center space-y-2">
                <span class="text-4xl">📜</span>
                <p class="text-xs uppercase tracking-widest">No saved horoscopes</p>
              </div>
            } @else {
              @for (profile of storageService.profiles(); track profile.id) {
                <div class="group relative p-4 rounded bg-stone-800 border border-stone-700 hover:border-stone-500 transition-all cursor-pointer"
                     (click)="loadProfile(profile)">
                  
                  <div class="flex justify-between items-start">
                    <div>
                      <div class="font-serif text-lg text-[#e7e5e4]">{{ profile.name }}</div>
                      <div class="text-[10px] uppercase tracking-wider text-stone-400 mt-1">
                        {{ profile.date | date:'dd MMM yyyy' }} • {{ profile.time }}
                      </div>
                      <div class="text-[10px] text-stone-500 truncate max-w-[200px]">{{ profile.place }}</div>
                    </div>
                    
                    <button (click)="deleteProfile($event, profile.id)" 
                            class="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:bg-stone-700 rounded transition-all"
                            title="Delete">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </button>
                  </div>
                </div>
              }
            }
          </div>
          
          <div class="mt-4 pt-2 text-center">
             <button type="button" class="text-[9px] uppercase tracking-widest text-stone-500 cursor-pointer hover:text-stone-300" (click)="toggleFlip()">
              (Double Tap to return)
            </button>
          </div>

        </div>

      </div>
    </div>
  `,
  styles: [`
    .perspective-1000 { perspective: 1000px; }
    .transform-style-3d { transform-style: preserve-3d; }
    .backface-hidden { 
      backface-visibility: hidden; 
      -webkit-backface-visibility: hidden;
    }
    .rotate-y-180 { transform: rotateY(180deg); }
    
    .scrollbar-hide::-webkit-scrollbar { width: 4px; }
    .scrollbar-hide::-webkit-scrollbar-track { background: transparent; }
    .scrollbar-hide::-webkit-scrollbar-thumb { background: currentColor; opacity: 0.2; border-radius: 2px; }

    .scrollbar-dark::-webkit-scrollbar { width: 4px; }
    .scrollbar-dark::-webkit-scrollbar-track { background: #292524; }
    .scrollbar-dark::-webkit-scrollbar-thumb { background: #57534e; border-radius: 2px; }

    /* Picker Styling */
    input[type="time"]::-webkit-calendar-picker-indicator,
    input[type="date"]::-webkit-calendar-picker-indicator {
      cursor: pointer;
      opacity: 0.6;
      filter: invert(0.3);
    }
    /* In dark mode, invert picker icon more to make it white/light */
    :host-context(.dark) input[type="time"]::-webkit-calendar-picker-indicator,
    :host-context(.dark) input[type="date"]::-webkit-calendar-picker-indicator {
        filter: invert(0.8);
    }

    input[type="time"]::-webkit-calendar-picker-indicator:hover,
    input[type="date"]::-webkit-calendar-picker-indicator:hover {
      opacity: 1;
    }
  `]
})
export class BirthFormComponent implements OnInit {
  submitForm = output<{date: string, time: string, place: string, approximate: boolean}>();
  isProcessing = input(false);
  isDark = input(false);
  
  public storageService = inject(StorageService);
  private cityService = inject(CityService);
  private searchSubject = new Subject<string>();

  form: FormGroup;
  suggestions: City[] = [];
  showSuggestions = signal(false);
  isFlipped = signal(false);
  
  maxDate: string = '';

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      date: ['', Validators.required],
      time: ['', Validators.required],
      place: ['', Validators.required]
    });

    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(val => {
      this.suggestions = this.cityService.searchCities(val);
    });
  }

  ngOnInit() {
    const now = new Date();
    this.maxDate = now.toISOString().split('T')[0];
    
    // Set default values
    this.form.patchValue({ 
      date: this.maxDate,
      time: '12:00' 
    });
  }

  toggleFlip() {
    this.isFlipped.update(v => !v);
  }

  loadProfile(profile: SavedProfile) {
    this.form.patchValue({
      date: profile.date,
      time: profile.time,
      place: profile.place
    });
    this.isFlipped.set(false); // Flip back to front
    // Small delay to allow flip animation to start before submitting
    setTimeout(() => {
      this.onSubmit();
    }, 600); 
  }

  deleteProfile(event: Event, id: string) {
    event.stopPropagation(); // Prevent loading the profile
    if(confirm('Remove this horoscope from memory?')) {
      this.storageService.deleteProfile(id);
    }
  }

  onPlaceInput(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.showSuggestions.set(true);
    if (val.length > 1) {
      this.searchSubject.next(val);
    } else {
      this.suggestions = [];
    }
  }

  onPlaceFocus() {
    if (this.form.get('place')?.value.length > 1) {
      this.showSuggestions.set(true);
    }
  }

  onPlaceBlur() {
    setTimeout(() => {
      this.showSuggestions.set(false);
    }, 200);
  }

  selectCity(city: City) {
    this.form.patchValue({
      place: `${city.name}, ${city.state}`
    });
    this.suggestions = [];
    this.showSuggestions.set(false);
  } 

  onSubmit() {
    if (this.form.valid) {
      const { date, time, place } = this.form.value;
      this.submitForm.emit({
        date,
        time,
        place,
        approximate: false
      });
    }
  }
}
