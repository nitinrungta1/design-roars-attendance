export type City = {
  city: string;
  state: string;
  slug: string;
};

export const CITIES: City[] = [
  { city: "Delhi", state: "Delhi", slug: "delhi" },
  { city: "New Delhi", state: "Delhi", slug: "new-delhi" },
  { city: "Noida", state: "Uttar Pradesh", slug: "noida" },
  { city: "Greater Noida", state: "Uttar Pradesh", slug: "greater-noida" },
  { city: "Ghaziabad", state: "Uttar Pradesh", slug: "ghaziabad" },
  { city: "Gurgaon", state: "Haryana", slug: "gurgaon" },
  { city: "Faridabad", state: "Haryana", slug: "faridabad" },
  { city: "Mumbai", state: "Maharashtra", slug: "mumbai" },
  { city: "Navi Mumbai", state: "Maharashtra", slug: "navi-mumbai" },
  { city: "Thane", state: "Maharashtra", slug: "thane" },
  { city: "Pune", state: "Maharashtra", slug: "pune" },
  { city: "Nagpur", state: "Maharashtra", slug: "nagpur" },
  { city: "Nashik", state: "Maharashtra", slug: "nashik" },
  { city: "Aurangabad", state: "Maharashtra", slug: "aurangabad" },
  { city: "Ahmedabad", state: "Gujarat", slug: "ahmedabad" },
  { city: "Surat", state: "Gujarat", slug: "surat" },
  { city: "Vadodara", state: "Gujarat", slug: "vadodara" },
  { city: "Rajkot", state: "Gujarat", slug: "rajkot" },
  { city: "Gandhinagar", state: "Gujarat", slug: "gandhinagar" },
  { city: "Bengaluru", state: "Karnataka", slug: "bengaluru" },
  { city: "Bangalore", state: "Karnataka", slug: "bangalore" },
  { city: "Mysuru", state: "Karnataka", slug: "mysuru" },
  { city: "Hubli", state: "Karnataka", slug: "hubli" },
  { city: "Mangaluru", state: "Karnataka", slug: "mangaluru" },
  { city: "Chennai", state: "Tamil Nadu", slug: "chennai" },
  { city: "Coimbatore", state: "Tamil Nadu", slug: "coimbatore" },
  { city: "Madurai", state: "Tamil Nadu", slug: "madurai" },
  { city: "Salem", state: "Tamil Nadu", slug: "salem" },
  { city: "Tiruchirappalli", state: "Tamil Nadu", slug: "tiruchirappalli" },
  { city: "Hyderabad", state: "Telangana", slug: "hyderabad" },
  { city: "Warangal", state: "Telangana", slug: "warangal" },
  { city: "Karimnagar", state: "Telangana", slug: "karimnagar" },
  { city: "Kolkata", state: "West Bengal", slug: "kolkata" },
  { city: "Howrah", state: "West Bengal", slug: "howrah" },
  { city: "Durgapur", state: "West Bengal", slug: "durgapur" },
  { city: "Siliguri", state: "West Bengal", slug: "siliguri" },
  { city: "Jaipur", state: "Rajasthan", slug: "jaipur" },
  { city: "Jodhpur", state: "Rajasthan", slug: "jodhpur" },
  { city: "Udaipur", state: "Rajasthan", slug: "udaipur" },
  { city: "Kota", state: "Rajasthan", slug: "kota" },
  { city: "Lucknow", state: "Uttar Pradesh", slug: "lucknow" },
  { city: "Kanpur", state: "Uttar Pradesh", slug: "kanpur" },
  { city: "Varanasi", state: "Uttar Pradesh", slug: "varanasi" },
  { city: "Agra", state: "Uttar Pradesh", slug: "agra" },
  { city: "Prayagraj", state: "Uttar Pradesh", slug: "prayagraj" },
  { city: "Patna", state: "Bihar", slug: "patna" },
  { city: "Gaya", state: "Bihar", slug: "gaya" },
  { city: "Muzaffarpur", state: "Bihar", slug: "muzaffarpur" },
  { city: "Ranchi", state: "Jharkhand", slug: "ranchi" },
  { city: "Jamshedpur", state: "Jharkhand", slug: "jamshedpur" },
  { city: "Bhopal", state: "Madhya Pradesh", slug: "bhopal" },
  { city: "Indore", state: "Madhya Pradesh", slug: "indore" },
  { city: "Gwalior", state: "Madhya Pradesh", slug: "gwalior" },
  { city: "Jabalpur", state: "Madhya Pradesh", slug: "jabalpur" },
  { city: "Raipur", state: "Chhattisgarh", slug: "raipur" },
  { city: "Bilaspur", state: "Chhattisgarh", slug: "bilaspur" },
  { city: "Chandigarh", state: "Chandigarh", slug: "chandigarh" },
  { city: "Mohali", state: "Punjab", slug: "mohali" },
  { city: "Ludhiana", state: "Punjab", slug: "ludhiana" },
  { city: "Amritsar", state: "Punjab", slug: "amritsar" },
  { city: "Jalandhar", state: "Punjab", slug: "jalandhar" },
  { city: "Dehradun", state: "Uttarakhand", slug: "dehradun" },
  { city: "Haridwar", state: "Uttarakhand", slug: "haridwar" },
  { city: "Shimla", state: "Himachal Pradesh", slug: "shimla" },
  { city: "Dharamshala", state: "Himachal Pradesh", slug: "dharamshala" },
  { city: "Jammu", state: "Jammu and Kashmir", slug: "jammu" },
  { city: "Srinagar", state: "Jammu and Kashmir", slug: "srinagar" },
  { city: "Bhubaneswar", state: "Odisha", slug: "bhubaneswar" },
  { city: "Cuttack", state: "Odisha", slug: "cuttack" },
  { city: "Puri", state: "Odisha", slug: "puri" },
  { city: "Visakhapatnam", state: "Andhra Pradesh", slug: "visakhapatnam" },
  { city: "Vijayawada", state: "Andhra Pradesh", slug: "vijayawada" },
  { city: "Guntur", state: "Andhra Pradesh", slug: "guntur" },
  { city: "Kochi", state: "Kerala", slug: "kochi" },
  { city: "Ernakulam", state: "Kerala", slug: "ernakulam" },
  { city: "Thiruvananthapuram", state: "Kerala", slug: "thiruvananthapuram" },
  { city: "Kozhikode", state: "Kerala", slug: "kozhikode" },
  { city: "Goa", state: "Goa", slug: "goa" },
  { city: "Panaji", state: "Goa", slug: "panaji" },
  { city: "Mapusa", state: "Goa", slug: "mapusa" },
  { city: "Guwahati", state: "Assam", slug: "guwahati" },
  { city: "Shillong", state: "Meghalaya", slug: "shillong" },
  { city: "Imphal", state: "Manipur", slug: "imphal" },
  { city: "Aizawl", state: "Mizoram", slug: "aizawl" },
  { city: "Agartala", state: "Tripura", slug: "agartala" },
  { city: "Itanagar", state: "Arunachal Pradesh", slug: "itanagar" },
  { city: "Gangtok", state: "Sikkim", slug: "gangtok" },
  { city: "Port Blair", state: "Andaman and Nicobar Islands", slug: "port-blair" },
];

export const CITY_BY_SLUG: Record<string, City> = Object.fromEntries(
  CITIES.map((c) => [c.slug, c])
);

export function getCity(slug: string): City | undefined {
  return CITY_BY_SLUG[slug];
}

/** Up to N other cities — same state first, then nearest in list as proxy. */
export function getNearbyCities(slug: string, limit = 6): City[] {
  const target = CITY_BY_SLUG[slug];
  if (!target) return [];
  const sameState = CITIES.filter((c) => c.state === target.state && c.slug !== slug);
  if (sameState.length >= limit) return sameState.slice(0, limit);

  const idx = CITIES.findIndex((c) => c.slug === slug);
  const pool: City[] = [...sameState];
  const seen = new Set([slug, ...sameState.map((c) => c.slug)]);
  let radius = 1;
  while (pool.length < limit && radius < CITIES.length) {
    const left = CITIES[idx - radius];
    const right = CITIES[idx + radius];
    if (left && !seen.has(left.slug)) {
      pool.push(left);
      seen.add(left.slug);
    }
    if (pool.length < limit && right && !seen.has(right.slug)) {
      pool.push(right);
      seen.add(right.slug);
    }
    radius++;
  }
  return pool.slice(0, limit);
}
