
import { Injectable, inject } from '@angular/core';
import * as Astronomy from 'astronomy-engine';
import { CityService } from './city.service';

export interface PlanetData {
  name: string;
  sign: string;
  signId: number; // 1-12
  nakshatra: string;
  nakshatraLord: string;
  rasiLord: string;
  dignity: string;
  degree: string; // Formatted degree within sign 0-30
  position: string; // Total longitude 0-360
  isRetrograde: boolean;
  longitude: number; // Exact float
  house: number; // 1-12
  navamsaSign: string; // New field for D9
}

export interface ChartData {
  planets: PlanetData[];
  ascendantSign: string;
  ayanamsa: number;
  meta: {
    date: string;
    time: string;
    place: string;
    moonNakshatra: string;
  };
}

export interface DashaItem {
  planet: string;
  startDate: Date;
  endDate: Date;
  durationYear: number;
  durationMonth: number;
  durationDay: number;
  level: number; // 1=Maha, 2=Antar, 3=Pratyantar
  parentPlanets?: string[]; // For breadcrumb e.g. ['Shani', 'Budha']
}

export const BHAVA_NAMES = [
  'Tanu', 'Dhana', 'Sahaja', 'Sukha', 'Putra', 'Ari', 
  'Yuvati', 'Randhra', 'Dharma', 'Karma', 'Labha', 'Vyaya'
];

@Injectable({
  providedIn: 'root'
})
export class AstrologyService {
  private cityService = inject(CityService);
  
  // Telugu/Sanskrit Rasi Names
  public readonly SIGNS = [
    'Mesha',      // Aries
    'Vrishabha',  // Taurus
    'Mithuna',    // Gemini
    'Karkataka',  // Cancer
    'Simha',      // Leo
    'Kanya',      // Virgo 
    'Tula',       // Libra
    'Vrischika',  // Scorpio
    'Dhanu',      // Sagittarius
    'Makara',     // Capricorn
    'Kumbha',     // Aquarius
    'Meena'       // Pisces
  ];

  private readonly NAKSHATRAS = [
    'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra', 'Punarvasu', 'Pushya', 'Ashlesha',
    'Magha', 'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
    'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'
  ];

  // Planet Lords in Vedic
  private readonly NAKSHATRA_LORDS = [
    'Ketu', 'Shukra', 'Surya', 'Chandra', 'Kuja', 'Rahu', 'Guru', 'Shani', 'Budha'
  ];

  private readonly DASHA_YEARS: Record<string, number> = {
    'Ketu': 7, 'Shukra': 20, 'Surya': 6, 'Chandra': 10, 'Kuja': 7, 
    'Rahu': 18, 'Guru': 16, 'Shani': 19, 'Budha': 17
  };

  public readonly RASI_LORDS: Record<string, string> = {
    'Mesha': 'Kuja', 
    'Vrishabha': 'Shukra', 
    'Mithuna': 'Budha', 
    'Karkataka': 'Chandra',
    'Simha': 'Surya', 
    'Kanya': 'Budha', 
    'Tula': 'Shukra', 
    'Vrischika': 'Kuja',
    'Dhanu': 'Guru', 
    'Makara': 'Shani', 
    'Kumbha': 'Shani', 
    'Meena': 'Guru'
  };

  private readonly PLANET_NAME_MAP: Record<string, string> = {
    'Sun': 'Surya',
    'Moon': 'Chandra',
    'Mars': 'Kuja',
    'Mercury': 'Budha',
    'Jupiter': 'Guru',
    'Venus': 'Shukra',
    'Saturn': 'Shani',
    'Rahu': 'Rahu',
    'Ketu': 'Ketu',
    'Ascendant': 'Lagna'
  };

  async calculateChart(details: { date: string; time: string; place: string }): Promise<ChartData> {
    // Strictly use local city service. No external API calls.
    const coords = this.getCoordinatesLocal(details.place);
    
    const dateTimeStr = `${details.date}T${details.time}`;
    const dateObj = new Date(dateTimeStr);
    
    if (isNaN(dateObj.getTime())) {
      throw new Error('Invalid Date or Time provided.');
    }
    
    // Ayanamsa calculation needed for meta data
    const time = Astronomy.MakeTime(dateObj);
    const year = dateObj.getFullYear() + (dateObj.getMonth() / 12);
    const ayanamsa = 23.85 + 0.0139 * (year - 2000); // Simple Lahiri approx

    const planets = this.calculatePositions(dateObj, coords.lat, coords.lon, ayanamsa);
    
    // Find Moon's Nakshatra for chart center
    const moon = planets.find(p => p.name === 'Chandra');
    const moonNakshatra = moon ? moon.nakshatra : '-';

    return {
      planets: planets,
      ascendantSign: planets.find(p => p.name === 'Lagna')?.sign || 'Mesha',
      ayanamsa,
      meta: {
        date: details.date,
        time: details.time,
        place: details.place,
        moonNakshatra
      }
    };
  }

  calculateMahadashas(moonLon: number, birthDate: Date): DashaItem[] {
    // 1. Calculate Nakshatra Position
    const nakshatraSpan = 13.3333333333;
    const moonNakshatraPos = moonLon / nakshatraSpan;
    const nakshatraIndex = Math.floor(moonNakshatraPos);
    const fractionTraversed = moonNakshatraPos - nakshatraIndex;
    const fractionRemaining = 1.0 - fractionTraversed;

    // 2. Identify Lord
    // Cycle: Ketu, Shukra, Surya, Chandra, Kuja, Rahu, Guru, Shani, Budha
    const lordIndex = nakshatraIndex % 9;
    const firstLord = this.NAKSHATRA_LORDS[lordIndex];
    
    // 3. Balance of Dasha
    const totalYears = this.DASHA_YEARS[firstLord];
    const balanceYears = totalYears * fractionRemaining;

    const dashas: DashaItem[] = [];
    let currentDate = new Date(birthDate);

    // First Dasha (Balance)
    const firstEndDate = this.addTime(birthDate, balanceYears);
    const firstDuration = this.getDurationYMD(birthDate, firstEndDate);
    
    dashas.push({
      planet: firstLord, // Use Vedic Name
      startDate: new Date(birthDate),
      endDate: new Date(firstEndDate),
      durationYear: firstDuration.y,
      durationMonth: firstDuration.m,
      durationDay: firstDuration.d,
      level: 1
    });

    currentDate = new Date(firstEndDate);

    // Subsequent Dashas
    for (let i = 1; i < 9; i++) {
      const idx = (lordIndex + i) % 9;
      const planet = this.NAKSHATRA_LORDS[idx];
      const years = this.DASHA_YEARS[planet];
      
      const endDate = this.addTime(currentDate, years);
      
      dashas.push({
        planet: planet,
        startDate: new Date(currentDate),
        endDate: new Date(endDate),
        durationYear: years,
        durationMonth: 0,
        durationDay: 0,
        level: 1
      });
      
      currentDate = new Date(endDate);
    }

    return dashas;
  }

  // Calculate Antar Dasha for a given Planet (parent)
  calculateAntarDashas(parentPlanetName: string, startDate: Date): DashaItem[] {
    // Parent name is already Vedic
    const totalYears = this.DASHA_YEARS[parentPlanetName];
    
    // Find starting index based on parent planet
    const startIndex = this.NAKSHATRA_LORDS.indexOf(parentPlanetName);
    
    const subDashas: DashaItem[] = [];
    let current = new Date(startDate);

    for (let i = 0; i < 9; i++) {
      const idx = (startIndex + i) % 9;
      const subPlanet = this.NAKSHATRA_LORDS[idx];
      const subYears = this.DASHA_YEARS[subPlanet];
      
      // Formula: (ParentYears * SubYears) / 120
      const durationYears = (totalYears * subYears) / 120;
      
      const end = this.addTime(current, durationYears);
      const dur = this.getDurationYMD(current, end);

      subDashas.push({
        planet: `${parentPlanetName} - ${subPlanet}`,
        startDate: new Date(current),
        endDate: new Date(end),
        durationYear: dur.y,
        durationMonth: dur.m,
        durationDay: dur.d,
        level: 2,
        parentPlanets: [parentPlanetName]
      });
      current = new Date(end);
    }
    return subDashas;
  }

  // Calculate Pratyantar Dasha
  calculatePratyantarDashas(grandParentName: string, parentName: string, startDate: Date): DashaItem[] {
    const gpYears = this.DASHA_YEARS[grandParentName];
    const pYears = this.DASHA_YEARS[parentName];
    
    // Antar Dasha Duration in Years
    const antarDurationYears = (gpYears * pYears) / 120;

    const startIndex = this.NAKSHATRA_LORDS.indexOf(parentName); // Starts from Antar Lord
    
    const subDashas: DashaItem[] = [];
    let current = new Date(startDate);

    for (let i = 0; i < 9; i++) {
      const idx = (startIndex + i) % 9;
      const subPlanet = this.NAKSHATRA_LORDS[idx];
      const subYears = this.DASHA_YEARS[subPlanet];
      
      // Pratyantar Duration = (AntarDuration * SubYears) / 120
      const durationYears = (antarDurationYears * subYears) / 120;
      
      const end = this.addTime(current, durationYears);
      const dur = this.getDurationYMD(current, end);

      subDashas.push({
        planet: `${grandParentName} - ${parentName} - ${subPlanet}`,
        startDate: new Date(current),
        endDate: new Date(end),
        durationYear: dur.y,
        durationMonth: dur.m,
        durationDay: dur.d,
        level: 3,
        parentPlanets: [grandParentName, parentName]
      });
      current = new Date(end);
    }
    return subDashas;
  }

  // Helper to add decimal years to a date
  private addTime(date: Date, years: number): Date {
    const result = new Date(date);
    const msPerYear = 365.2425 * 24 * 60 * 60 * 1000;
    const addedMs = years * msPerYear;
    result.setTime(result.getTime() + addedMs);
    return result;
  }

  // Helper to diff two dates in Y M D
  private getDurationYMD(start: Date, end: Date): { y: number, m: number, d: number } {
    let y = end.getFullYear() - start.getFullYear();
    let m = end.getMonth() - start.getMonth();
    let d = end.getDate() - start.getDate();

    if (d < 0) {
      m--;
      // Approximate days in previous month
      const prevMonthDate = new Date(end.getFullYear(), end.getMonth(), 0);
      d += prevMonthDate.getDate();
    }
    if (m < 0) {
      y--;
      m += 12;
    }
    return { y, m, d };
  }

  private getCoordinatesLocal(place: string): { lat: number, lon: number } {
    const cities = this.cityService.searchCities(place.split(',')[0]);
    if (cities.length > 0) {
      // Use the first match from local DB
      return { lat: cities[0].lat, lon: cities[0].lng };
    }
    // Fallback if not found (Default to New Delhi to avoid crash while keeping it offline)
    console.warn(`City '${place}' not found in local DB. Defaulting to New Delhi.`);
    return { lat: 28.6139, lon: 77.2090 };
  }

  private calculatePositions(date: Date, lat: number, lon: number, ayanamsa: number): PlanetData[] {
    const time = Astronomy.MakeTime(date);
    
    const bodyMap: { [key: string]: Astronomy.Body } = {
      'Sun': Astronomy.Body.Sun,
      'Moon': Astronomy.Body.Moon,
      'Mars': Astronomy.Body.Mars,
      'Mercury': Astronomy.Body.Mercury,
      'Jupiter': Astronomy.Body.Jupiter,
      'Venus': Astronomy.Body.Venus,
      'Saturn': Astronomy.Body.Saturn
    };

    const results: PlanetData[] = [];
    
    // Calculate Ascendant First for Bhava reference
    const gmst = Astronomy.SiderealTime(time);
    const lmstHours = gmst + (lon / 15.0);
    const lmstDeg = (lmstHours * 15) % 360;
    const eps = 23.44 * (Math.PI / 180); 
    const ramc = lmstDeg * (Math.PI / 180);
    const latRad = lat * (Math.PI / 180);
    
    const num = Math.cos(ramc);
    const den = -Math.sin(ramc) * Math.cos(eps) - Math.tan(latRad) * Math.sin(eps);
    
    let ascRad = Math.atan2(num, den);
    let ascDeg = ascRad * (180 / Math.PI);
    ascDeg = this.normalize(ascDeg);
    const siderealAsc = this.normalize(ascDeg - ayanamsa);

    // Calculate Planets
    for (const [englishName, bodyId] of Object.entries(bodyMap)) {
      const vector = Astronomy.GeoVector(bodyId, time, true);
      const tropical = Astronomy.Ecliptic(vector);
      const siderealLon = this.normalize(tropical.elon - ayanamsa);

      let isRetrograde = false;
      if (englishName !== 'Sun' && englishName !== 'Moon') {
        const timePrev = Astronomy.MakeTime(new Date(date.getTime() - 3600000));
        const vectorPrev = Astronomy.GeoVector(bodyId, timePrev, true);
        const tropicalPrev = Astronomy.Ecliptic(vectorPrev);
        let diff = tropical.elon - tropicalPrev.elon;
        if (diff < -180) diff += 360;
        if (diff > 180) diff -= 360;
        if (diff < 0) isRetrograde = true;
      }

      results.push(this.formatPlanet(englishName, siderealLon, isRetrograde, siderealAsc));
    }

    // Nodes (Rahu/Ketu)
    const jd = time.ut + 2451545.0;
    const T = (jd - 2451545.0) / 36525;
    const meanNodeLon = this.normalize(125.04452 - 1934.136261 * T + 0.0020708 * T * T + (T * T * T) / 450000);
    const siderealRahu = this.normalize(meanNodeLon - ayanamsa);
    const siderealKetu = this.normalize(siderealRahu + 180);
    
    results.push(this.formatPlanet('Rahu', siderealRahu, true, siderealAsc));
    results.push(this.formatPlanet('Ketu', siderealKetu, true, siderealAsc));

    results.push(this.formatPlanet('Ascendant', siderealAsc, false, siderealAsc));

    return results;
  }

  private normalize(deg: number): number {
    let d = deg % 360;
    if (d < 0) d += 360;
    return d;
  }

  private toDMS(deg: number): string {
    const d = Math.floor(deg);
    const m = Math.floor((deg - d) * 60);
    return `${d}° ${m.toString().padStart(2, '0')}'`;
  }

  private formatPlanet(englishName: string, lon: number, isRetrograde: boolean, ascLon: number): PlanetData {
    const name = this.PLANET_NAME_MAP[englishName] || englishName;
    const signIndex = Math.floor(lon / 30);
    const sign = this.SIGNS[signIndex];
    
    const degInSign = lon % 30;
    const degreeStr = this.toDMS(degInSign);
    const positionStr = this.toDMS(lon);

    const nakshatraIndex = Math.floor(lon / 13.3333333);
    const nakshatra = this.NAKSHATRAS[nakshatraIndex] || 'Unknown';
    
    const lordIndex = nakshatraIndex % 9;
    const nakshatraLord = this.NAKSHATRA_LORDS[lordIndex];
    const rasiLord = this.RASI_LORDS[sign] || '-';

    const dignity = this.calculateDignity(name, sign);

    // Bhava/House Calculation (Equal House from Lagna Degree)
    let adjLon = lon - (ascLon - 15);
    if (adjLon < 0) adjLon += 360;
    adjLon = adjLon % 360;
    const house = Math.floor(adjLon / 30) + 1;

    // Navamsa Calculation
    const navamsaSignIndex = this.calculateNavamsaIndex(lon);
    const navamsaSign = this.SIGNS[navamsaSignIndex];

    return {
      name,
      sign,
      signId: signIndex + 1,
      degree: degreeStr,
      position: positionStr,
      nakshatra,
      nakshatraLord,
      rasiLord,
      dignity,
      isRetrograde,
      longitude: lon,
      house,
      navamsaSign
    };
  }

  private calculateNavamsaIndex(lon: number): number {
    // 3 deg 20 min = 200 minutes per pada
    // Total minutes
    const minutes = lon * 60;
    const pada = Math.floor(minutes / 200);
    // The zodiac cycles every 12 Navamsas relative to the start? 
    // Actually the standard calculation is simple: (Absolute Lon minutes / 200) % 12
    // This maps 0-3.20 Ari -> Ari, 3.20-6.40 Ari -> Tau, etc.
    return pada % 12;
  }

  private calculateDignity(planet: string, sign: string): string {
    const rules: Record<string, { ex: string, deb: string, own: string[] }> = {
      'Surya': { ex: 'Mesha', deb: 'Tula', own: ['Simha'] },
      'Chandra': { ex: 'Vrishabha', deb: 'Vrischika', own: ['Karkataka'] },
      'Kuja': { ex: 'Makara', deb: 'Karkataka', own: ['Mesha', 'Vrischika'] },
      'Budha': { ex: 'Kanya', deb: 'Meena', own: ['Mithuna', 'Kanya'] },
      'Guru': { ex: 'Karkataka', deb: 'Makara', own: ['Dhanu', 'Meena'] },
      'Shukra': { ex: 'Meena', deb: 'Kanya', own: ['Vrishabha', 'Tula'] },
      'Shani': { ex: 'Tula', deb: 'Mesha', own: ['Makara', 'Kumbha'] },
      'Rahu': { ex: 'Vrishabha', deb: 'Vrischika', own: ['Kumbha'] }, 
      'Ketu': { ex: 'Vrischika', deb: 'Vrishabha', own: ['Vrischika'] },
      'Lagna': { ex: '', deb: '', own: [] }
    };

    const rule = rules[planet];
    if (!rule) return '-';

    if (sign === rule.ex) return 'Exalted';
    if (sign === rule.deb) return 'Debilitated';
    if (rule.own.includes(sign)) return 'Own Sign';

    return 'Neutral';
  }
}
